import { useState, useMemo, useRef, useEffect } from "react";
import { useAccountsController } from "../controllers/useAccountsController";
import {
  Plus, Trash2, TrendingUp, TrendingDown, BarChart3, Building2,
  CreditCard, ChevronRight, X, Edit3, LayoutDashboard, ArrowUpRight,
  ArrowDownRight, Wallet, Activity, FileText, Image,
  Download, Upload, FileDown, Check, LogOut, Menu, ArrowLeftRight, Bell, Landmark, Settings
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

import { toast } from "sonner";
import { authService } from "../services/authService";
import Login from "./Login";
import { Skeleton } from "./components/ui/skeleton";
import { Toaster } from "./components/ui/sonner";

type TransactionType = "credit" | "debit";

interface AttachedDoc {
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  reference?: string;
  accountId?: string;
  document?: AttachedDoc;
  dueDate?: string;
  exchangeType?: "loan" | "credit";
}

interface Account {
  id: string;
  name: string;
  type: "company" | "overdraft" | "bank";
  openingBalance: number;
  transactions: Transaction[];
  color: string;
  bgColor: string;
  createdAt?: string;
}

const initialAccounts: Account[] = [
  {
    id: "company1",
    name: "Company 1",
    type: "company",
    color: "#1e3a5f",
    bgColor: "#e8edf5",
    openingBalance: 125000,
    transactions: [
      { id: "t1", date: "2024-06-15", description: "Sales Receipt", type: "credit", amount: 45000, reference: "INV-001" },
      { id: "t2", date: "2024-06-15", description: "Supplier Payment", type: "debit", amount: 18500, reference: "PO-012" },
      { id: "t3", date: "2024-06-15", description: "Rent Collection", type: "credit", amount: 12000, reference: "RC-005" },
    ],
  },
  {
    id: "company2",
    name: "Company 2",
    type: "company",
    color: "#065f46",
    bgColor: "#d1fae5",
    openingBalance: 89500,
    transactions: [
      { id: "t4", date: "2024-06-15", description: "Service Income", type: "credit", amount: 32000, reference: "SRV-008" },
      { id: "t5", date: "2024-06-15", description: "Utility Bills", type: "debit", amount: 8200, reference: "UTIL-06" },
    ],
  },
  {
    id: "company3",
    name: "Company 3",
    type: "company",
    color: "#7c2d12",
    bgColor: "#fef3c7",
    openingBalance: 210000,
    transactions: [
      { id: "t6", date: "2024-06-15", description: "Product Sales", type: "credit", amount: 67000, reference: "PS-114" },
      { id: "t7", date: "2024-06-15", description: "Raw Materials", type: "debit", amount: 41000, reference: "RM-033" },
      { id: "t8", date: "2024-06-15", description: "Staff Salaries", type: "debit", amount: 28000, reference: "SAL-06" },
    ],
  },
  {
    id: "company4",
    name: "Company 4",
    type: "company",
    color: "#4c1d95",
    bgColor: "#ede9fe",
    openingBalance: 55000,
    transactions: [
      { id: "t9", date: "2024-06-15", description: "Consulting Fee", type: "credit", amount: 25000, reference: "CF-019" },
      { id: "t10", date: "2024-06-15", description: "Office Supplies", type: "debit", amount: 3500, reference: "OS-007" },
    ],
  },
  {
    id: "overdraft",
    name: "Overdraft Account",
    type: "overdraft",
    color: "#9f1239",
    bgColor: "#ffe4e6",
    openingBalance: -45000,
    transactions: [
      { id: "t11", date: "2024-06-15", description: "Bank Withdrawal", type: "debit", amount: 15000, reference: "BW-002" },
      { id: "t12", date: "2024-06-15", description: "Repayment", type: "credit", amount: 20000, reference: "REP-01" },
    ],
  },
];

function calcBalance(account: Account): number {
  return account.transactions.reduce(
    (bal, tx) => (tx.type === "credit" ? bal + tx.amount : bal - tx.amount),
    account.openingBalance
  );
}
function calcTotalCredit(account: Account): number {
  return account.transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
}
function calcTotalDebit(account: Account): number {
  return account.transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
}
function fmt(n: number): string {
  const abs = Math.abs(n);
  const f = abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${f})` : f;
}
// Account ids come back from the API as numbers, but every <select> element's
// onChange hands back a string (e.target.value) — comparing them with === would
// silently fail the moment a user changes a dropdown away from its default.
function findAccountById(list: Account[], id: string): Account | undefined {
  return list.find(a => String(a.id) === String(id));
}
function accountTypeIcon(type: Account["type"]) {
  if (type === "overdraft") return CreditCard;
  if (type === "bank") return Landmark;
  return Building2;
}
function accountTypeLabel(type: Account["type"]): string {
  if (type === "overdraft") return "Overdraft Account";
  if (type === "bank") return "Bank Account";
  return "Company Account";
}
function fmtSign(n: number): string {
  return n < 0
    ? `-₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    : `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

const today = new Date().toISOString().split("T")[0];

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generateMonthlyPDF(accounts: Account[], month: number, year: number, day?: number) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Day-wise report: narrow every filter/date-cutoff below to a single day
  // instead of the whole month. Everything else (summary table, transfers,
  // consolidated log, footer) is shared between the two report types.
  const periodLabel = day ? `${day} ${monthName} ${year}` : `${monthName} ${year}`;
  const reportTitle = day ? "Day Report" : "Monthly Report";
  const fileNamePeriod = day ? `${day}_${monthName}_${year}` : `${monthName}_${year}`;

  const filterTx = (txs: Transaction[]) =>
    txs.filter(tx => {
      const parts = tx.date.split("-");
      if (parts.length < 2) return false;
      const txYear = parseInt(parts[0], 10);
      const txMonth = parseInt(parts[1], 10);
      const txDay = parts.length > 2 ? parseInt(parts[2], 10) : undefined;
      if (txMonth !== month || txYear !== year) return false;
      return day ? txDay === day : true;
    });

  // ── Header banner ──
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ACCOUNTS MANAGER", margin, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Multi-Company Accounting System", margin, 19);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${reportTitle} — ${periodLabel}`, pageW - margin, 12, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, pageW - margin, 19, { align: "right" });

  // ── Summary table ──
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Account Summary", margin, 38);

  const summaryRows: any[] = [];
  let totalOpen = 0;
  let totalCredit = 0;
  let totalDebit = 0;
  let totalClose = 0;

  // True if date `d` falls strictly before the report period (the whole
  // month, or — for a day report — before that specific day).
  const isBeforePeriod = (d: Date) => {
    if (d.getFullYear() !== year) return d.getFullYear() < year;
    const dMonth = d.getMonth() + 1;
    if (dMonth !== month) return dMonth < month;
    return day ? d.getDate() < day : false;
  };
  // True if date `d` falls on/before the last day of the report period.
  const isOnOrBeforePeriodEnd = (d: Date) => {
    if (d.getFullYear() !== year) return d.getFullYear() < year;
    const dMonth = d.getMonth() + 1;
    if (dMonth !== month) return dMonth < month;
    return day ? d.getDate() <= day : true;
  };

  accounts.forEach(acc => {
    // Transactions before this period to calculate an accurate opening balance
    const txsBeforeMonth = acc.transactions.filter(tx => isBeforePeriod(new Date(tx.date)));
    const creditBefore = txsBeforeMonth.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debitBefore = txsBeforeMonth.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const monthlyOpeningBalance = acc.openingBalance + creditBefore - debitBefore;

    // Transactions during this period
    const txs = filterTx(acc.transactions);
    const credit = txs.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debit = txs.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const closing = monthlyOpeningBalance + credit - debit;

    // Check if the account existed in or before the selected period
    const accDate = acc.createdAt ? new Date(acc.createdAt) : new Date();
    const isExisted = isOnOrBeforePeriodEnd(accDate);

    // Only show accounts that either:
    // 1. Existed in/before this month AND have a non-zero opening/closing balance
    // 2. Have actual transactions this month
    if ((isExisted && (monthlyOpeningBalance !== 0 || credit > 0 || debit > 0)) || txs.length > 0) {
      totalOpen += monthlyOpeningBalance;
      totalCredit += credit;
      totalDebit += debit;
      totalClose += closing;

      summaryRows.push([
        (summaryRows.length + 1).toString(),
        acc.name,
        `Rs.${monthlyOpeningBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Rs.${credit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Rs.${debit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Rs.${closing.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      ]);
    }
  });

  if (summaryRows.length === 0) {
    summaryRows.push(["-", "No Activity", "-", "-", "-", "-"]);
  } else {
    summaryRows.push([
      "",
      "TOTAL",
      `Rs.${totalOpen.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs.${totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs.${totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs.${totalClose.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);
  }

  autoTable(doc, {
    startY: 42,
    head: [["S.No.", "Account", "Opening Balance", "Total Credit", "Total Debit", "Closing Balance"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { fontStyle: "bold" },
      2: { halign: "right" },
      3: { halign: "right", textColor: [5, 95, 70] },
      4: { halign: "right", textColor: [159, 18, 57] },
      5: { halign: "right", fontStyle: "bold" },
    },
    willDrawCell: (data) => {
      if (data.row.index === summaryRows.length - 1) {
        doc.setFillColor(230, 237, 245);
      }
    },
    margin: { left: margin, right: margin },
  });

  // ── Inter-Company Transfers Section (on Page 1) ──
  const map = new Map<string, {
    date: string;
    amount: number;
    reference: string;
    dueDate?: string;
    exchangeType: string;
    fromCompany: string;
    toCompany: string;
  }>();

  accounts.forEach(a => {
    a.transactions.forEach((tx: any) => {
      const parts = tx.date.split("-");
      if (parts.length < 2) return;
      const txYear = parseInt(parts[0], 10);
      const txMonth = parseInt(parts[1], 10);
      const txDay = parts.length > 2 ? parseInt(parts[2], 10) : undefined;
      const isThisMonth = txMonth === month && txYear === year && (day ? txDay === day : true);

      const isTransfer = tx.reference && (
        tx.exchangeType || 
        tx.reference.startsWith("EX-") ||
        tx.description.toLowerCase().includes("transfer") ||
        tx.description.toLowerCase().includes("exchange")
      );
      if (!isTransfer || !isThisMonth) return;
      
      let entry = map.get(tx.reference);
      if (!entry) {
        entry = {
          date: tx.date,
          amount: tx.amount,
          reference: tx.reference,
          dueDate: tx.dueDate,
          exchangeType: tx.exchangeType || "loan",
          fromCompany: "",
          toCompany: "",
        };
        map.set(tx.reference, entry);
      }
      
      if (tx.type === "debit") {
        entry.fromCompany = a.name;
      } else if (tx.type === "credit") {
        entry.toCompany = a.name;
      }
    });
  });

  const interCompanyTransfers = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

  if (interCompanyTransfers.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 110;
    const titleY = finalY + 12;
    
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Inter-Company Transfers", margin, titleY);

    const transferRows = interCompanyTransfers.map((tx, idx) => [
      (idx + 1).toString(),
      tx.date.split("-").reverse().join("/"),
      `${tx.fromCompany || "-"} -> ${tx.toCompany || "-"}`,
      tx.reference,
      (tx.exchangeType || "loan").toUpperCase(),
      tx.dueDate ? tx.dueDate.split("-").reverse().join("/") : "-",
      `Rs.${tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: titleY + 4,
      head: [["S.No.", "Date", "Transfer Flow", "Ref. No.", "Type", "Due Date", "Amount (Rs.)"]],
      body: transferRows,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "center", cellWidth: 20 },
        2: { fontStyle: "bold" },
        3: { halign: "center", cellWidth: 24 },
        4: { halign: "center", cellWidth: 18 },
        5: { halign: "center", cellWidth: 22 },
        6: { halign: "right", fontStyle: "bold", cellWidth: 30 }
      },
      margin: { left: margin, right: margin }
    });
  }

  // ── Consolidated Transactions Log Section ──
  const allTransactions: {
    date: string;
    companyName: string;
    description: string;
    reference: string;
    type: "credit" | "debit";
    amount: number;
  }[] = [];

  accounts.forEach(a => {
    const txs = filterTx(a.transactions || []);
    txs.forEach((tx: any) => {
      let desc = tx.description;
      if (tx.exchangeType) {
        desc += ` [${tx.exchangeType.toUpperCase()}]`;
      }
      if (tx.dueDate) {
        desc += ` (Due: ${tx.dueDate.split("-").reverse().join("/")})`;
      }
      allTransactions.push({
        date: tx.date,
        companyName: a.name,
        description: desc,
        reference: tx.reference || "-",
        type: tx.type,
        amount: tx.amount
      });
    });
  });

  // Sort chronologically
  allTransactions.sort((a, b) => a.date.localeCompare(b.date));

  if (allTransactions.length > 0) {
    doc.addPage();

    // Section Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageW, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ACCOUNTS TRANSACTIONS", margin, 9);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`All transactions across all companies — ${periodLabel}`, margin, 16);
    doc.text(`Page ${(doc.internal as any).getCurrentPageInfo().pageNumber}`, pageW - margin, 16, { align: "right" });

    const allTxRows = allTransactions.map((tx, idx) => [
      (idx + 1).toString(),
      tx.date.split("-").reverse().join("/"),
      tx.companyName,
      tx.description,
      tx.reference,
      tx.type === "credit" ? `Rs.${tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-",
      tx.type === "debit" ? `Rs.${tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-"
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["S.No.", "Date", "Company", "Description", "Ref. No.", "Credit", "Debit"]],
      body: allTxRows,
      theme: "striped",
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "center", cellWidth: 20 },
        2: { fontStyle: "bold", cellWidth: 25 },
        3: { cellWidth: "auto" },
        4: { halign: "center", cellWidth: 24 },
        5: { halign: "right", textColor: [5, 95, 70], cellWidth: 25 },
        6: { halign: "right", textColor: [159, 18, 57], cellWidth: 25 }
      },
      margin: { left: margin, right: margin }
    });
  }



  // ── Footer on every page ──
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(240, 242, 245);
    doc.rect(0, doc.internal.pageSize.getHeight() - 10, pageW, 10, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 140);
    doc.text("Accounts Manager — Confidential", margin, doc.internal.pageSize.getHeight() - 3.5);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, doc.internal.pageSize.getHeight() - 3.5, { align: "right" });
  }

  doc.save(`${reportTitle.replace(" ", "_")}_${fileNamePeriod}.pdf`);
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#1e3a5f", // Classic Navy
  "#0f766e", // Muted Teal
  "#4338ca", // Corporate Indigo
  "#15803d", // Soft Forest Green
  "#b45309", // Warm Amber Bronze
  "#6d28d9", // Deep Lavender
  "#be123c", // Crimson Rose
  "#475569", // Steel Slate
  "#881337", // Plum Wine
  "#010a0eff", // Slate Blue
];

function Dashboard({
  accounts,
  onNavigate,
  onAddTransaction,
}: {
  accounts: Account[];
  onNavigate: (id: string) => void;
  onAddTransaction: (accountId: string, transaction: any) => void;
}) {
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderNote, setReminderNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  const saveReminder = () => {
    if (accounts.length === 0) {
      toast.warning("Please add a company first before setting a reminder!");
      return;
    }
    if (!reminderNote || !reminderDate) {
      toast.warning("Please fill in both the note and the date.");
      return;
    }
    const tx = {
      date: new Date().toISOString().split('T')[0],
      description: reminderNote,
      type: "debit" as const,
      amount: 0,
      dueDate: reminderDate,
    };
    onAddTransaction(accounts[0].id, tx);
    setReminderNote("");
    setReminderDate("");
    setShowReminderModal(false);
  };

  const totalOpening = accounts.reduce((s, a) => s + a.openingBalance, 0);
  const totalCredit = accounts.reduce((s, a) => s + calcTotalCredit(a), 0);
  const totalDebit = accounts.reduce((s, a) => s + calcTotalDebit(a), 0);
  const totalClosing = accounts.reduce((s, a) => s + calcBalance(a), 0);

  const interCompanyTransfers = useMemo(() => {
    const map = new Map<string, {
      id: string;
      date: string;
      amount: number;
      reference: string;
      dueDate?: string;
      exchangeType: string;
      description: string;
      fromCompany: string;
      fromColor: string;
      toCompany: string;
      toColor: string;
      createdAt?: string;
    }>();

    accounts.forEach(a => {
      const idx = accounts.findIndex(acc => acc.id === a.id);
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      a.transactions.forEach((tx: any) => {
        if (!tx.exchangeType || !tx.reference) return;
        
        let entry = map.get(tx.reference);
        if (!entry) {
          entry = {
            id: tx.id,
            date: tx.date,
            amount: tx.amount,
            reference: tx.reference,
            dueDate: tx.dueDate,
            exchangeType: tx.exchangeType,
            description: tx.description,
            fromCompany: "",
            fromColor: "",
            toCompany: "",
            toColor: "",
            createdAt: tx.createdAt,
          };
          map.set(tx.reference, entry);
        }
        
        if (tx.type === "debit") {
          entry.fromCompany = a.name;
          entry.fromColor = color;
        } else if (tx.type === "credit") {
          entry.toCompany = a.name;
          entry.toColor = color;
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      
      if (a.createdAt && b.createdAt) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return b.id.localeCompare(a.id);
    });
  }, [accounts]);

  const recentTxs = accounts
    .flatMap(a => {
      const idx = accounts.findIndex(acc => acc.id === a.id);
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      return a.transactions.map(tx => ({
        ...tx,
        accountId: a.id,
        accountName: a.name,
        accountColor: color,
        accountBg: a.bgColor
      }));
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const reminders = useMemo(() => {
    return accounts
      .flatMap(a => {
        const idx = accounts.findIndex(acc => acc.id === a.id);
        const color = CHART_COLORS[idx % CHART_COLORS.length];
        return a.transactions
          .filter((tx: any) => tx.dueDate)
          .map((tx: any) => ({
            ...tx,
            accountId: a.id,
            accountName: a.name,
            accountColor: color,
            accountBg: a.bgColor
          }));
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [accounts]);

  const dueOrOverdueReminders = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return reminders.filter((r: any) => r.dueDate <= todayStr);
  }, [reminders]);

  const overdueCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return dueOrOverdueReminders.filter((r: any) => r.dueDate < todayStr).length;
  }, [dueOrOverdueReminders]);

  const dueTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return dueOrOverdueReminders.filter((r: any) => r.dueDate === todayStr).length;
  }, [dueOrOverdueReminders]);

  const kpis = [
    {
      label: "Opening Balance",
      value: fmtSign(totalOpening),
      icon: Wallet,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      border: "border-blue-100",
      valueColor: "text-blue-700",
    },
    {
      label: "Total Credits",
      value: `+${fmtSign(totalCredit)}`,
      icon: TrendingUp,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      border: "border-emerald-100",
      valueColor: "text-emerald-700",
    },
    {
      label: "Total Debits",
      value: `-${fmtSign(totalDebit)}`,
      icon: TrendingDown,
      bg: "bg-red-50",
      iconColor: "text-red-500",
      border: "border-red-100",
      valueColor: "text-red-600",
    },
    {
      label: "Net Closing Balance",
      value: fmtSign(totalClosing),
      icon: Activity,
      bg: totalClosing >= 0 ? "bg-indigo-50" : "bg-red-50",
      iconColor: totalClosing >= 0 ? "text-indigo-600" : "text-red-500",
      border: totalClosing >= 0 ? "border-indigo-100" : "border-red-100",
      valueColor: totalClosing >= 0 ? "text-indigo-700" : "text-red-600",
    },
  ];

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Page title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of all accounts — {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => {
            if (accounts.length === 0) {
              toast.warning("Please add a company first before setting a reminder!");
              return;
            }
            setShowReminderModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Bell size={16} />
          Set Reminder
        </button>
      </div>

      {/* Top Alert Banner for Due Today & Overdue Reminders */}
      {dueOrOverdueReminders.length > 0 && (
        <div className="bg-white border border-border border-l-4 border-l-red-600 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Active Reminders</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                The following tasks have hit their scheduled date:
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {dueOrOverdueReminders.map((rem: any) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isOverdue = rem.dueDate < todayStr;
              
              // Calculate difference in days
              const diffTime = new Date(rem.dueDate).getTime() - new Date(todayStr).getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              let statusText = "";
              let statusColorClass = "";
              let borderClass = "";
              if (isOverdue) {
                statusText = `Overdue by ${Math.abs(diffDays)}d`;
                statusColorClass = "bg-rose-50 text-rose-700 border-rose-100";
                borderClass = "border-l-rose-500";
              } else {
                statusText = "Due Today";
                statusColorClass = "bg-amber-50 text-amber-800 border-amber-100";
                borderClass = "border-l-amber-500";
              }
              
              return (
                <div 
                  key={rem.id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50/40 hover:bg-gray-50/80 rounded-xl border border-gray-150 border-l-4 ${borderClass} transition-colors shadow-3xs`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColorClass} font-semibold flex-shrink-0`}>
                      {statusText}
                    </span>
                    <div className="text-xs font-semibold text-gray-800 truncate" title={rem.description}>
                      {rem.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-muted-foreground self-end sm:self-auto font-mono">
                    <span className="flex items-center gap-1">
                      <FileText size={10} />
                      {rem.dueDate.split("-").reverse().join("/")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end border-t border-border pt-3">
            <button
              onClick={() => onNavigate("reminders")}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
            >
              View All Reminders &rarr;
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-xl sm:rounded-2xl border ${kpi.border} p-3 sm:p-5 flex flex-col gap-2 sm:gap-3`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon size={16} className={`sm:hidden ${kpi.iconColor}`} />
              <kpi.icon size={18} className={`hidden sm:block ${kpi.iconColor}`} />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{kpi.label}</div>
              <div className={`text-sm sm:text-lg font-mono font-bold leading-tight truncate ${kpi.valueColor}`}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>



      {/* Company Balances */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Company Balances</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {accounts.map(acc => {
            const closing = calcBalance(acc);
            const isNegative = closing < 0;
            const idx = accounts.findIndex(a => a.id === acc.id);
            const color = CHART_COLORS[idx % CHART_COLORS.length];
            const bgColor = `${color}15`;
            return (
              <button
                key={acc.id}
                onClick={() => onNavigate(acc.id)}
                className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 text-left hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                    {(() => { const Icon = accountTypeIcon(acc.type); return <Icon size={14} style={{ color: color }} />; })()}
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 font-medium truncate" title={acc.name}>
                    {acc.name}
                  </div>
                  <div className={`text-xs sm:text-base font-mono font-bold leading-tight truncate ${isNegative ? "text-red-600" : "text-foreground"}`} style={{ color: isNegative ? undefined : color }}>
                    {fmtSign(closing)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>


      {/* Inter-Company Transfers Log */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ArrowLeftRight size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Inter-Company Transfers Log</h3>
              <p className="text-[10px] text-muted-foreground">Overview of all active inter-company fund flows</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full">
            {interCompanyTransfers.length} transfers
          </span>
        </div>

        {interCompanyTransfers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <ArrowLeftRight size={32} className="mx-auto mb-3 opacity-30" />
            <p>No inter-company transfers recorded yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden flex flex-col divide-y divide-border/60">
              {interCompanyTransfers.map(tx => (
                <div key={tx.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap text-sm font-semibold">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: tx.fromColor }} />
                          {tx.fromCompany || "Unknown"}
                        </span>
                        <span className="text-muted-foreground text-xs font-normal">➔</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: tx.toColor }} />
                          {tx.toCompany || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">{tx.date.split("-").reverse().join("/")}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">Ref: {tx.reference}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${
                          tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {tx.exchangeType}
                        </span>
                        {tx.dueDate && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                            Due: {tx.dueDate.split("-").reverse().join("/")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 font-mono font-bold text-slate-800 text-sm">
                      {fmt(tx.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-6 py-3 text-center font-semibold w-16">Sl. No.</th>
                    <th className="px-6 py-3 text-left font-semibold w-28">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Transfer Flow</th>
                    <th className="px-6 py-3 text-left font-semibold w-28">Ref. No.</th>
                    <th className="px-6 py-3 text-center font-semibold w-24">Type</th>
                    <th className="px-6 py-3 text-left font-semibold w-32">Due Date</th>
                    <th className="px-6 py-3 text-right font-semibold w-36">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {interCompanyTransfers.map((tx, idx) => (
                    <tr key={tx.id} className="border-b border-border/60 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-center font-mono text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{tx.date.split("-").reverse().join("/")}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: tx.fromColor }} />
                            {tx.fromCompany || "Unknown"}
                          </span>
                          <span className="text-muted-foreground text-xs font-semibold px-1">➔</span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: tx.toColor }} />
                            {tx.toCompany || "Unknown"}
                          </span>
                        </div>
                        {tx.description && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                            {tx.description.replace(/^Inter-Company Transfer (to|from) [^—]+ — /, "").replace(/^Inter-Company Transfer (to|from) [^—]+$/, "")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{tx.reference}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold capitalize inline-block ${
                          tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {tx.exchangeType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {tx.dueDate ? (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">
                            {tx.dueDate.split("-").reverse().join("/")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-800">
                        {fmt(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Account Cards + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Account Cards */}
        <div className="col-span-1 lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Account Summary</h3>
          {accounts.map(acc => {
            const closing = calcBalance(acc);
            const credit = calcTotalCredit(acc);
            const debit = calcTotalDebit(acc);
            const change = closing - acc.openingBalance;
            return (
              <button
                key={acc.id}
                onClick={() => onNavigate(acc.id)}
                className="w-full bg-white rounded-xl border border-border p-4 text-left hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.bgColor }}>
                      {(() => { const Icon = accountTypeIcon(acc.type); return <Icon size={14} style={{ color: acc.color }} />; })()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{acc.name}</div>
                      {acc.type === "overdraft" && (
                        <span className="text-[10px] text-red-500 font-medium">Overdraft</span>
                      )}
                      {acc.type === "bank" && (
                        <span className="text-[10px] text-teal-600 font-medium">Bank</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-accent">View</span>
                    <ChevronRight size={12} className="text-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Credit</div>
                    <div className="text-xs font-mono font-semibold text-emerald-600">+₹{(credit / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Debit</div>
                    <div className="text-xs font-mono font-semibold text-red-500">-₹{(debit / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Balance</div>
                    <div className={`text-xs font-mono font-bold ${closing < 0 ? "text-red-600" : "text-foreground"}`} style={{ color: closing < 0 ? undefined : acc.color }}>
                      {closing < 0 ? "-" : ""}₹{(Math.abs(closing) / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                  {credit + debit > 0 && (
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(credit / (credit + debit)) * 100}%`, backgroundColor: acc.color }}
                    />
                  )}
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-[10px] text-muted-foreground">Credit ratio</span>
                  <span className={`text-[10px] font-mono ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {change >= 0 ? "▲" : "▼"} {fmtSign(Math.abs(change))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Recent Transactions */}
        <div className="col-span-1 lg:col-span-3 bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Recent Transactions</h3>
            <span className="text-xs text-muted-foreground">All accounts</span>
          </div>
          <div className="divide-y divide-border/60">
            {recentTxs.map((tx: any) => (
              <div key={tx.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "credit" ? "bg-emerald-50" : "bg-red-50"}`}>
                  {tx.type === "credit"
                    ? <ArrowUpRight size={14} className="text-emerald-600" />
                    : <ArrowDownRight size={14} className="text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{tx.description}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-white" style={{ backgroundColor: tx.accountColor }}>{tx.accountName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{tx.date.split("-").reverse().join("/")}</span>
                    {tx.reference && <span className="text-[10px] text-muted-foreground font-mono">Ref: {tx.reference}</span>}
                    {tx.exchangeType && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${
                        tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {tx.exchangeType}
                      </span>
                    )}
                    {tx.dueDate && (
                      <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                        Due: {tx.dueDate.split("-").reverse().join("/")}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`text-sm font-mono font-semibold flex-shrink-0 ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                  {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Set Salary Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-red-50/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <Bell size={16} />
                </div>
                <h3 className="font-bold text-base text-foreground">Set Reminder</h3>
              </div>
              <button 
                onClick={() => setShowReminderModal(false)} 
                className="text-muted-foreground hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Reminder Note
                </label>
                <textarea
                  value={reminderNote}
                  onChange={e => setReminderNote(e.target.value)}
                  placeholder="Enter reminder note..."
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-gray-50 text-foreground resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Reminder Date
                </label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  required
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-gray-50 font-mono text-foreground"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setShowReminderModal(false)} 
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveReminder}
                disabled={!reminderNote || !reminderDate}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 w-full animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 flex flex-col gap-3">
            <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Company Balances skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 flex flex-col gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transfers Log skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountDetailsSkeleton() {
  return (
    <div className="p-6 space-y-5 w-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Balance Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* Transactions Table skeleton */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex justify-between items-center">
          <Skeleton className="h-4.5 w-36" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2.5 w-1/4" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RemindersPage({
  accounts,
  onNavigate,
  onAddTransaction,
  onDeleteTransaction,
}: {
  accounts: Account[];
  onNavigate: (id: string) => void;
  onAddTransaction: (accountId: string, transaction: any) => void;
  onDeleteTransaction: (accountId: string, txId: string) => void;
}) {
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderNote, setReminderNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");

  const saveReminder = () => {
    if (!selectedAccountId) {
      toast.warning("Please select a company/account first!");
      return;
    }
    if (!reminderNote || !reminderDate) {
      toast.warning("Please fill in both the note and the date.");
      return;
    }
    const tx = {
      date: new Date().toISOString().split('T')[0],
      description: reminderNote,
      type: "debit" as const,
      amount: 0,
      dueDate: reminderDate,
    };
    onAddTransaction(selectedAccountId, tx);
    setReminderNote("");
    setReminderDate("");
    setShowReminderModal(false);
  };

  const reminders = useMemo(() => {
    const list: any[] = [];
    accounts.forEach(a => {
      a.transactions
        .filter((tx: any) => tx.dueDate)
        .forEach((tx: any) => {
          list.push({
            ...tx,
            accountId: a.id,
            accountName: a.name,
            accountColor: a.color,
            accountBg: a.bgColor,
          });
        });
    });
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [accounts]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reminders</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your post-dated transactions and scheduled tasks.
          </p>
        </div>
        <button
          onClick={() => {
            if (accounts.length === 0) {
              toast.warning("Please add an account first before setting a reminder!");
              return;
            }
            setShowReminderModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Bell size={16} />
          Set Reminder
        </button>
      </div>

      {/* Reminders List Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-sm text-foreground">All Reminders List</h3>
          <span className="text-xs bg-gray-100 text-muted-foreground font-mono font-bold px-2 py-0.5 rounded-full">
            {reminders.length} total
          </span>
        </div>

        {reminders.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No reminders set yet</p>
            <p className="text-xs text-muted-foreground/75 mt-1">Use the "Set Reminder" button to schedule a reminder.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Account / Ledger</th>
                  <th className="px-4 py-3 text-left font-semibold">Date Created</th>
                  <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((rem: any) => {
                  const isOverdue = rem.dueDate < todayStr;
                  const isDueToday = rem.dueDate === todayStr;
                  
                  let statusLabel = "";
                  let statusClass = "";
                  if (isOverdue) {
                    statusLabel = "Overdue";
                    statusClass = "bg-red-50 text-red-700 border-red-100";
                  } else if (isDueToday) {
                    statusLabel = "Due Today";
                    statusClass = "bg-amber-50 text-amber-800 border-amber-100";
                  } else {
                    statusLabel = "Upcoming";
                    statusClass = "bg-blue-50 text-blue-700 border-blue-100";
                  }

                  return (
                    <tr key={rem.id} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: rem.accountBg, color: rem.accountColor }}
                        >
                          {rem.accountName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">
                        {rem.date.split("-").reverse().join("/")}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono font-bold text-foreground">
                        {rem.dueDate.split("-").reverse().join("/")}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800">
                        {rem.description}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        {rem.amount > 0 ? `₹${parseFloat(rem.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusClass} font-semibold`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this reminder?")) {
                              onDeleteTransaction(rem.accountId, rem.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete Reminder"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Set Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border bg-red-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <Bell size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Create New Reminder</h3>
                  <p className="text-xs text-red-100">Schedule an alert or reminder</p>
                </div>
              </div>
              <button onClick={() => setShowReminderModal(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Select Account</label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Reminder Note</label>
                <input
                  type="text"
                  value={reminderNote}
                  onChange={e => setReminderNote(e.target.value)}
                  placeholder="e.g. Pay rent, GST due date..."
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveReminder}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then(user => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
  }, []);
  const { 
    accounts, 
    loading, 
    addTransaction: handleAddTx, 
    deleteTransaction: handleDelTx, 
    saveOpeningBalance: handleSaveBal, 
    addAccount: handleAddAccount, 
    editAccountName,
    deleteAccount: handleDeleteAccount,
  } = useAccountsController(isAuthenticated);

  const reminders = useMemo(() => {
    return accounts
      .flatMap(a => {
        const idx = accounts.findIndex(acc => acc.id === a.id);
        const color = CHART_COLORS[idx % CHART_COLORS.length];
        return a.transactions
          .filter((tx: any) => tx.dueDate)
          .map((tx: any) => ({
            ...tx,
            accountId: a.id,
            accountName: a.name,
            accountColor: color,
            accountBg: a.bgColor
          }));
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [accounts]);

  const activeRemindersCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return reminders.filter((r: any) => {
      const diffTime = new Date(r.dueDate).getTime() - new Date(todayStr).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3; // due in <= 3 days (or overdue)
    }).length;
  }, [reminders]);

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("brandswamy_settings");
    const defaults = {
      companyName: "BRAND SWAMY",
      companySubtitle: "Accounts Manager",
      logoUrl: "",
      themeColor: "#c21818",
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });
  const [tempSettings, setTempSettings] = useState({ ...settings });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", settings.themeColor);
    root.style.setProperty("--accent", settings.themeColor);
  }, [settings.themeColor]);

  const [showForm, setShowForm] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: "", type: "company", openingBalance: "", color: "#1e3a5f" });
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<"month" | "day">("month");
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportDay, setReportDay] = useState(new Date().toISOString().split("T")[0]);
  const [editingOpening, setEditingOpening] = useState<string | null>(null);
  const [openingInput, setOpeningInput] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [viewDoc, setViewDoc] = useState<AttachedDoc | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: today,
    description: "",
    type: "credit" as TransactionType,
    amount: "",
    reference: "",
    document: null as AttachedDoc | null,
    dueDate: "",
    paymentMode: "cash" as "cash" | "bank",
    selectedBankId: "",
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeForm, setExchangeForm] = useState({
    category: "company" as "company" | "bank" | "companyToBank",
    // For "company"/"bank": the two accounts being transferred between.
    // For "companyToBank": the two BANK accounts the money actually moves through —
    // fromCompanyId/toCompanyId below are only used to label the transaction.
    sourceId: "",
    destId: "",
    fromCompanyId: "",
    toCompanyId: "",
    amount: "",
    date: today,
    dueDate: "",
    exchangeType: "loan" as "loan" | "credit",
    description: ""
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({
        ...f,
        document: {
          name: file.name,
          dataUrl: reader.result as string,
          mimeType: file.type,
          size: file.size,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const activeAccount = accounts.find(a => a.id === activeTab);

  const normalTransactions = useMemo(() => {
    if (!activeAccount) return [];
    return activeAccount.transactions.filter((tx: any) => !tx.exchangeType);
  }, [activeAccount]);

  const exchangeTransactions = useMemo(() => {
    if (!activeAccount) return [];
    return activeAccount.transactions.filter((tx: any) => !!tx.exchangeType);
  }, [activeAccount]);

  const txRunningBalances = useMemo(() => {
    if (!activeAccount) return {};
    let bal = activeAccount.openingBalance;
    const map: Record<string, number> = {};
    activeAccount.transactions.forEach((tx: any) => {
      bal = tx.type === "credit" ? bal + tx.amount : bal - tx.amount;
      map[tx.id] = bal;
    });
    return map;
  }, [activeAccount]);

  const addCompany = async () => {
    if (!companyForm.name.trim()) {
      toast.warning("Please enter a name.");
      return;
    }
    const bgColor = companyForm.type === "overdraft" ? "#ffe4e6" : companyForm.type === "bank" ? "#ccfbf1" : "#e8edf5";
    const color = companyForm.type === "overdraft" ? "#9f1239" : companyForm.type === "bank" ? "#0f766e" : "#1e3a5f";
    const newId = await handleAddAccount({
      ...companyForm,
      openingBalance: parseFloat(companyForm.openingBalance) || 0,
      bgColor,
      color
    });
    // Only reset/close on success — a failure keeps the form open (with the
    // toast already shown by the controller) so the user can retry.
    if (newId) {
      setCompanyForm({ name: "", type: "company", openingBalance: "", color: "#1e3a5f" });
      setShowAddCompany(false);
      setActiveTab(newId);
    }
  };

  const handleDeleteCompany = async () => {
    const accountId = deleteAccountId;
    if (!accountId) return;
    if (!deleteConfirmPassword.trim()) {
      setDeleteError("Password is required");
      return;
    }

    const res = await handleDeleteAccount(accountId, deleteConfirmPassword);
    if (res?.success) {
      setShowDeleteDialog(false);
      setDeleteConfirmPassword("");
      setDeleteAccountId(null);
      setDeleteError("");
      setActiveTab("dashboard");
    } else {
      setDeleteError(res?.message || "Failed to delete account");
    }
  };

  const addTransaction = async () => {
    if (!form.description || !form.amount) {
      toast.warning("Please fill in a description and amount.");
      return;
    }

    const isCompanyOrOD = activeAccount.type === "company" || activeAccount.type === "overdraft";
    const selectedBank = isCompanyOrOD && form.paymentMode === "bank"
      ? findAccountById(accounts, form.selectedBankId)
      : null;

    const companyDescription = isCompanyOrOD
      ? `${form.description} (${form.paymentMode === "bank" && selectedBank ? selectedBank.name : "Cash"})`
      : form.description;

    const tx = {
      date: form.date,
      description: companyDescription,
      type: form.type,
      amount: parseFloat(form.amount),
      reference: form.reference || undefined,
      document: form.document || undefined,
      dueDate: form.dueDate || undefined,
    };
    const result = await handleAddTx(activeTab, tx);
    // Only reset/close on success — a failure keeps the form open (with the
    // entered data intact) so the user can retry.
    if (result) {
      if (isCompanyOrOD && form.paymentMode === "bank" && selectedBank) {
        const bankTx = {
          date: form.date,
          description: `${activeAccount.name}: ${form.description}`,
          type: form.type,
          amount: parseFloat(form.amount),
          reference: form.reference || undefined,
          document: form.document || undefined,
          dueDate: form.dueDate || undefined,
        };
        await handleAddTx(String(selectedBank.id), bankTx, { silent: true });
      }

      setForm({
        date: today,
        description: "",
        type: "credit",
        amount: "",
        reference: "",
        document: null,
        dueDate: "",
        paymentMode: "cash",
        selectedBankId: "",
      });
      setShowForm(false);
    }
  };

  const deleteTransaction = (txId: string) => {
    handleDelTx(activeTab, txId);
  };

  const handleExchangeSubmit = async () => {
    const isCompanyToBank = exchangeForm.category === "companyToBank";

    if (!exchangeForm.sourceId || !exchangeForm.destId || !exchangeForm.amount) {
      toast.warning(isCompanyToBank ? "Please select both bank accounts and an amount." : "Please select both accounts and an amount.");
      return;
    }
    if (isCompanyToBank && (!exchangeForm.fromCompanyId || !exchangeForm.toCompanyId)) {
      toast.warning("Please select both companies.");
      return;
    }

    const sourceAcc = findAccountById(accounts, exchangeForm.sourceId);
    const destAcc = findAccountById(accounts, exchangeForm.destId);
    if (!sourceAcc || !destAcc) {
      toast.error("Selected account could not be found.");
      return;
    }

    const fromCompanyAcc = isCompanyToBank ? findAccountById(accounts, exchangeForm.fromCompanyId) : undefined;
    const toCompanyAcc = isCompanyToBank ? findAccountById(accounts, exchangeForm.toCompanyId) : undefined;
    if (isCompanyToBank && (!fromCompanyAcc || !toCompanyAcc)) {
      toast.error("Selected company could not be found.");
      return;
    }

    const amt = parseFloat(exchangeForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.warning("Enter a valid transfer amount.");
      return;
    }

    const ref = `EX-${Date.now().toString().slice(-6)}`;
    const userDescription = exchangeForm.description.trim() ? ` — ${exchangeForm.description.trim()}` : "";
    const baseTx = {
      date: exchangeForm.date,
      amount: amt,
      dueDate: exchangeForm.dueDate || undefined,
      exchangeType: exchangeForm.exchangeType,
    };

    // Each entry is one leg of the transfer: which account it posts to, and
    // its own debit/credit description. companyToBank posts four linked legs
    // (both companies AND both banks) so every affected account's ledger —
    // and opening/closing balance — reflects the same real-world payment.
    // The Dashboard's transfer log and the PDF report group transactions by
    // `reference`, assuming exactly one debit + one credit per reference — so
    // the company pair and bank pair each need their own reference, or one
    // pair would silently overwrite the other in those views.
    const entries = isCompanyToBank
      ? [
          { accountId: exchangeForm.fromCompanyId, tx: { ...baseTx, reference: `${ref}-C`, type: "debit" as const, description: `Payment to ${toCompanyAcc!.name} (${sourceAcc.name} → ${destAcc.name})${userDescription}` } },
          { accountId: exchangeForm.toCompanyId, tx: { ...baseTx, reference: `${ref}-C`, type: "credit" as const, description: `Payment from ${fromCompanyAcc!.name} (${sourceAcc.name} → ${destAcc.name})${userDescription}` } },
          { accountId: exchangeForm.sourceId, tx: { ...baseTx, reference: `${ref}-B`, type: "debit" as const, description: `Payment to ${toCompanyAcc!.name} (${sourceAcc.name} → ${destAcc.name})${userDescription}` } },
          { accountId: exchangeForm.destId, tx: { ...baseTx, reference: `${ref}-B`, type: "credit" as const, description: `Payment from ${fromCompanyAcc!.name} (${sourceAcc.name} → ${destAcc.name})${userDescription}` } },
        ]
      : (() => {
          const label = exchangeForm.category === "bank" ? "Inter-Bank Transfer" : "Inter-Company Transfer";
          return [
            { accountId: exchangeForm.sourceId, tx: { ...baseTx, reference: ref, type: "debit" as const, description: `${label} to ${destAcc.name}${userDescription}` } },
            { accountId: exchangeForm.destId, tx: { ...baseTx, reference: ref, type: "credit" as const, description: `${label} from ${sourceAcc.name}${userDescription}` } },
          ];
        })();

    // Post each leg in order; if any leg fails, roll back everything already
    // posted (in reverse) rather than leaving a partially-completed transfer.
    const posted: { accountId: string; txId: string }[] = [];
    for (const entry of entries) {
      const result = await handleAddTx(entry.accountId, entry.tx, { silent: true });
      if (!result) {
        let allRolledBack = true;
        for (const p of [...posted].reverse()) {
          const rolledBack = await handleDelTx(p.accountId, p.txId, { silent: true });
          if (!rolledBack) allRolledBack = false;
        }
        toast.error(
          allRolledBack
            ? "Transfer failed — the entries already posted were rolled back."
            : "Transfer failed, and not all entries could be rolled back automatically. Please check the ledger."
        );
        return;
      }
      posted.push({ accountId: entry.accountId, txId: result.id });
    }

    toast.success(
      isCompanyToBank
        ? `Payment of ₹${amt.toLocaleString("en-IN")} from ${fromCompanyAcc!.name} to ${toCompanyAcc!.name} completed`
        : `Transfer of ₹${amt.toLocaleString("en-IN")} completed`
    );
    setShowExchange(false);
  };

  const saveOpeningBalance = async (accountId: string) => {
    const val = parseFloat(openingInput);
    if (isNaN(val)) {
      toast.warning("Enter a valid opening balance.");
      return;
    }
    const success = await handleSaveBal(accountId, val);
    // Only exit edit mode on success — a failure leaves the input open (with
    // the entered value) so the user can retry.
    if (success) setEditingOpening(null);
  };

  const totalDailyCredit = accounts.reduce((s, a) => s + calcTotalCredit(a), 0);
  const totalDailyDebit = accounts.reduce((s, a) => s + calcTotalDebit(a), 0);
  const totalNetBalance = accounts.reduce((s, a) => s + calcBalance(a), 0);
  const totalOpeningBalance = accounts.reduce((s, a) => s + a.openingBalance, 0);

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  if (!authChecked) {
    return (
      <>
        <Toaster richColors position="top-right" closeButton />
        <div className="w-screen h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster richColors position="top-right" closeButton />
        <Login onLogin={() => setIsAuthenticated(true)} />
      </>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster richColors position="top-right" closeButton />
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap items-center justify-between shadow-lg flex-shrink-0 gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-white/15 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={20} />
          </button>
          
          {settings.logoUrl ? (
            <img src={settings.logoUrl} className="w-8 h-8 sm:w-9 sm:h-9 object-contain bg-white/10 p-1 rounded-lg" alt="Logo" />
          ) : (
            <svg
              viewBox="0 0 100 100"
              className="w-8 h-8 sm:w-9 sm:h-9 text-white fill-none stroke-current"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Outer Gopuram arch */}
              <path d="M22 80 C22 68, 30 66, 30 54 C30 42, 38 40, 38 28 C38 18, 45 14, 50 14 C55 14, 62 18, 62 28 C62 40, 70 42, 70 54 C70 66, 78 68, 78 80" />
              {/* Middle Gopuram arch */}
              <path d="M34 80 C34 71, 40 69, 40 59 C40 49, 45 47, 45 37 C45 32, 48 29, 50 29 C52 29, 55 32, 55 37 C55 49, 60 49, 60 59 C60 69, 66 71, 66 80" strokeWidth="3.2" />
              {/* Inner Gopuram arch */}
              <path d="M46 80 C46 74, 50 71, 50 63 C50 71, 54 74, 54 80" strokeWidth="2.2" />
              {/* Center dot */}
              <circle cx="50" cy="50" r="3.5" className="fill-current stroke-none" />
            </svg>
          )}
          
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-wider text-white leading-none font-sans">
              {settings.companyName}
            </span>
            <span className="text-[9px] sm:text-[10px] text-white/70 mt-0.5 tracking-wider font-semibold">
              {settings.companySubtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <button
            onClick={() => {
              const companyAccs = accounts.filter(a => a.type === "company");
              setExchangeForm({
                category: "company",
                sourceId: companyAccs[0]?.id || "",
                destId: companyAccs[1]?.id || "",
                fromCompanyId: "",
                toCompanyId: "",
                amount: "",
                date: today,
                dueDate: "",
                exchangeType: "loan",
                description: ""
              });
              setShowExchange(true);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
          >
            <ArrowLeftRight size={16} />
            <span className="hidden sm:inline">Inter-Company Transfer</span>
            <span className="sm:hidden">Transfer</span>
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
          >
            <FileDown size={16} />
            <span className="hidden sm:inline">Monthly Report</span>
            <span className="sm:hidden">Report</span>
          </button>
          


          <div className="text-right text-sm">
            <div className="text-white/60 text-xs">Today</div>
            <div className="font-mono font-semibold">
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </header>



      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop for mobile sidebar */}
        {mobileMenuOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out absolute md:relative z-30 h-full w-64 md:w-56 bg-white border-r border-border flex flex-col flex-shrink-0`}>
          {/* Dashboard link */}
          <div className="px-4 py-3 border-b border-border flex flex-col gap-2">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-secondary text-accent border-l-2 border-l-accent pl-2.5"
                  : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab("reminders");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "reminders"
                  ? "bg-secondary text-accent border-l-2 border-l-accent pl-2.5"
                  : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              <Bell size={15} />
              Reminders
              {activeRemindersCount > 0 && (
                <span className="ml-auto w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {activeRemindersCount}
                </span>
              )}
            </button>
          </div>

          <div className="px-4 py-2 border-y border-border flex items-center justify-between bg-gray-100">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest py-1">Companies</p>
            <button 
              onClick={() => {
                setCompanyForm({ name: "", type: "company", openingBalance: "", color: "#1e3a5f" });
                setShowAddCompany(true);
              }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-muted-foreground transition-colors"
              title="Add Company"
            >
              <Plus size={14} />
            </button>
          </div>

          <nav className="py-2 flex-shrink-0">
            {loading ? (
              <div className="px-4 py-2 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-md" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-2.5 w-2/3" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              accounts.filter(a => a.type === "company").map(acc => {
                const closing = calcBalance(acc);
                const isActive = activeTab === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setActiveTab(acc.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-all group ${
                      isActive ? "bg-secondary border-r-2 border-r-accent" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: acc.bgColor }}>
                        <Building2 size={13} style={{ color: acc.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isActive ? "text-accent" : "text-foreground"}`}>{acc.name}</div>
                        <div className={`text-xs font-mono mt-0.5 ${closing < 0 ? "text-red-500" : "text-emerald-600"}`}>{fmtSign(closing)}</div>
                      </div>
                    </div>
                    <ChevronRight size={12} className={`flex-shrink-0 text-muted-foreground transition-transform ${isActive ? "rotate-90 text-accent" : ""}`} />
                  </button>
                );
              })
            )}
          </nav>

          <div className="px-4 py-2 border-y border-border flex items-center justify-between bg-gray-100">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest py-1">Banks</p>
            <button
              onClick={() => {
                setCompanyForm({ name: "", type: "bank", openingBalance: "", color: "#0f766e" });
                setShowAddCompany(true);
              }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-muted-foreground transition-colors"
              title="Add Bank"
            >
              <Plus size={14} />
            </button>
          </div>

          <nav className="py-2 flex-shrink-0">
            {loading ? (
              <div className="px-4 py-2 space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-md" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-2.5 w-2/3" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              accounts.filter(a => a.type === "bank").map(acc => {
                const closing = calcBalance(acc);
                const isActive = activeTab === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setActiveTab(acc.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-all group ${
                      isActive ? "bg-secondary border-r-2 border-r-accent" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: acc.bgColor }}>
                        <Landmark size={13} style={{ color: acc.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isActive ? "text-accent" : "text-foreground"}`}>{acc.name}</div>
                        <div className={`text-xs font-mono mt-0.5 ${closing < 0 ? "text-red-500" : "text-emerald-600"}`}>{fmtSign(closing)}</div>
                      </div>
                    </div>
                    <ChevronRight size={12} className={`flex-shrink-0 text-muted-foreground transition-transform ${isActive ? "rotate-90 text-accent" : ""}`} />
                  </button>
                );
              })
            )}
          </nav>

          <div className="px-4 py-2 border-y border-border flex items-center justify-between bg-gray-100">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest py-1">Overdrafts</p>
            <button 
              onClick={() => {
                setCompanyForm({ name: "", type: "overdraft", openingBalance: "", color: "#9f1239" });
                setShowAddCompany(true);
              }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-muted-foreground transition-colors"
              title="Add Overdraft"
            >
              <Plus size={14} />
            </button>
          </div>

          <nav className="flex-1 py-2 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-2 space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-md" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-2.5 w-2/3" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              accounts.filter(a => a.type === "overdraft").map(acc => {
                const closing = calcBalance(acc);
                const isActive = activeTab === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setActiveTab(acc.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-all group ${
                      isActive ? "bg-secondary border-r-2 border-r-accent" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: acc.bgColor }}>
                        <CreditCard size={13} style={{ color: acc.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isActive ? "text-accent" : "text-foreground"}`}>{acc.name}</div>
                        <div className={`text-xs font-mono mt-0.5 ${closing < 0 ? "text-red-500" : "text-emerald-600"}`}>{fmtSign(closing)}</div>
                      </div>
                    </div>
                    <ChevronRight size={12} className={`flex-shrink-0 text-muted-foreground transition-transform ${isActive ? "rotate-90 text-accent" : ""}`} />
                  </button>
                );
              })
            )}
          </nav>



          <div className="p-4 mt-auto border-t border-border bg-gray-50/50 space-y-2">
            <button
              onClick={() => {
                setTempSettings({ ...settings });
                setShowSettings(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors"
            >
              <Settings size={15} />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            activeTab === "dashboard" ? (
              <DashboardSkeleton />
            ) : (
              <AccountDetailsSkeleton />
            )
          ) : activeTab === "dashboard" ? (
            <Dashboard accounts={accounts} onNavigate={setActiveTab} onAddTransaction={handleAddTx} />
          ) : activeTab === "reminders" ? (
            <RemindersPage
              accounts={accounts}
              onNavigate={setActiveTab}
              onAddTransaction={handleAddTx}
              onDeleteTransaction={handleDelTx}
            />
          ) : activeAccount ? (
            <div className="p-6 space-y-5 w-full">
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activeAccount.bgColor }}>
                    {(() => { const Icon = accountTypeIcon(activeAccount.type); return <Icon size={18} style={{ color: activeAccount.color }} />; })()}
                  </div>
                  <div className="flex flex-col justify-center">
                    {editingName === activeAccount.id ? (
                      <div className="flex items-center gap-2 mb-0.5">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          className="border border-border rounded px-2 py-0.5 text-xl font-bold text-foreground focus:outline-none focus:border-accent w-48"
                          autoFocus
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              if (await editAccountName(activeAccount.id, nameInput)) setEditingName(null);
                            } else if (e.key === 'Escape') {
                              setEditingName(null);
                            }
                          }}
                        />
                        <button
                          onClick={async () => {
                            if (await editAccountName(activeAccount.id, nameInput)) setEditingName(null);
                          }}
                          className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingName(null)}
                          className="p-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-0.5">
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                          setEditingName(activeAccount.id);
                          setNameInput(activeAccount.name);
                        }}>
                          <h2 className="text-xl font-bold text-foreground">{activeAccount.name}</h2>
                          <Edit3 size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <button
                          onClick={() => {
                            setDeleteAccountId(activeAccount.id);
                            setDeleteConfirmPassword("");
                            setDeleteError("");
                            setShowDeleteDialog(true);
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                        {activeAccount.type === "overdraft" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 leading-none">Overdraft</span>
                        )}
                        {activeAccount.type === "bank" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 leading-none">Bank</span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {accountTypeLabel(activeAccount.type)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const banks = accounts.filter(a => a.type === "bank" || a.type === "overdraft");
                    setForm(f => ({
                      ...f,
                      paymentMode: "cash",
                      selectedBankId: banks.length > 0 ? String(banks[0].id) : "",
                    }));
                    setShowForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: activeAccount.color }}
                >
                  <Plus size={16} />
                  Add Entry
                </button>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="text-xs text-muted-foreground mb-1">Opening Balance</div>
                  {editingOpening === activeAccount.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={openingInput}
                        onChange={e => setOpeningInput(e.target.value)}
                        className="w-full text-sm font-mono border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/30"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter") saveOpeningBalance(activeAccount.id);
                          if (e.key === "Escape") setEditingOpening(null);
                        }}
                      />
                      <button 
                        onClick={() => saveOpeningBalance(activeAccount.id)} 
                        className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => setEditingOpening(null)} 
                        className="p-1 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-2 group cursor-pointer"
                      onClick={() => { setEditingOpening(activeAccount.id); setOpeningInput(String(activeAccount.openingBalance)); }}
                    >
                      <div className={`text-base font-mono font-bold ${activeAccount.openingBalance < 0 ? "text-red-500" : "text-foreground"}`}>
                        {fmtSign(activeAccount.openingBalance)}
                      </div>
                      <Edit3 size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                  <div className="text-xs text-emerald-700 mb-1">Total Credit</div>
                  <div className="text-base font-mono font-bold text-emerald-700">+₹{fmt(calcTotalCredit(activeAccount))}</div>
                  <div className="text-xs text-emerald-600 mt-1">{activeAccount.transactions.filter((t : any) => t.type === "credit").length} transactions</div>
                </div>

                <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                  <div className="text-xs text-red-700 mb-1">Total Debit</div>
                  <div className="text-base font-mono font-bold text-red-600">-₹{fmt(calcTotalDebit(activeAccount))}</div>
                  <div className="text-xs text-red-600 mt-1">{activeAccount.transactions.filter((t : any) => t.type === "debit").length} transactions</div>
                </div>

                <div className="rounded-xl border p-4" style={{ backgroundColor: activeAccount.bgColor, borderColor: `${activeAccount.color}30` }}>
                  <div className="text-xs mb-1" style={{ color: activeAccount.color }}>Closing Balance</div>
                  <div
                    className={`text-base font-mono font-bold ${calcBalance(activeAccount) < 0 ? "text-red-600" : ""}`}
                    style={{ color: calcBalance(activeAccount) < 0 ? undefined : activeAccount.color }}
                  >
                    {fmtSign(calcBalance(activeAccount))}
                  </div>
                  <div className="text-xs mt-1" style={{ color: activeAccount.color, opacity: 0.7 }}>
                    {calcBalance(activeAccount) >= activeAccount.openingBalance ? "↑ Increase" : "↓ Decrease"}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground">Transactions — {activeAccount.name}</h3>
                  <span className="text-xs text-muted-foreground">{normalTransactions.length} entries</span>
                </div>

                {normalTransactions.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">
                    <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No entries yet</p>
                    <p className="text-xs mt-1">Click "Add Entry" above to get started</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile View */}
                    <div className="md:hidden flex flex-col divide-y divide-border/60">
                      <div className="px-5 py-3 bg-blue-50/30 flex justify-between items-center">
                        <span className="text-sm font-semibold text-muted-foreground">Opening Balance</span>
                        <span className="font-mono font-bold text-sm text-foreground">{fmt(activeAccount.openingBalance)}</span>
                      </div>
                      
                      {normalTransactions.map((tx: any) => (
                        <div key={tx.id} className="p-5 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground">{tx.description}</div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs text-muted-foreground font-mono">{tx.date.split("-").reverse().join("/")}</span>
                                {tx.reference && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">Ref: {tx.reference}</span>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {tx.type === "credit" ? (
                                <div className="font-mono font-bold text-emerald-600">+{fmt(tx.amount)}</div>
                              ) : (
                                <div className="font-mono font-bold text-red-500">-{fmt(tx.amount)}</div>
                              )}
                              <div className={`text-[11px] font-mono mt-1 ${txRunningBalances[tx.id] < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                Bal: {fmt(txRunningBalances[tx.id])}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/40">
                            {tx.document?.name ? (
                                <button
                                  onClick={() => setViewDoc(tx.document!)}
                                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                >
                                  {tx.document.mimeType?.startsWith("image/") ? <Image size={14} /> : <FileText size={14} />}
                                  <span className="text-xs font-medium max-w-[150px] truncate">{tx.document.name}</span>
                                </button>
                            ) : <div/>}
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              className="p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded-md transition-colors ml-auto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="px-5 py-4 flex justify-between items-center" style={{ backgroundColor: activeAccount.bgColor }}>
                        <span className="text-sm font-bold" style={{ color: activeAccount.color }}>Closing Balance</span>
                        <div className="text-right">
                           <div className="text-xs font-mono font-bold text-emerald-600 mb-0.5">Credit: +{fmt(calcTotalCredit(activeAccount))}</div>
                           <div className="text-base font-mono font-bold" style={{ color: calcBalance(activeAccount) < 0 ? "#dc2626" : activeAccount.color }}>
                             {fmt(calcBalance(activeAccount))}
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-muted-foreground uppercase tracking-wide">
                          <th className="px-4 py-3 text-center font-semibold w-16">Sl. No.</th>
                          <th className="px-4 py-3 text-left font-semibold w-24">Date</th>
                          <th className="px-4 py-3 text-left font-semibold">Description</th>
                          <th className="px-4 py-3 text-left font-semibold w-24">Ref. No.</th>
                          <th className="px-4 py-3 text-center font-semibold w-20">Doc</th>
                          <th className="px-4 py-3 text-right font-semibold w-32">Credit (₹)</th>
                          <th className="px-4 py-3 text-right font-semibold w-32">Debit (₹)</th>
                          <th className="px-4 py-3 text-right font-semibold w-36">Balance (₹)</th>
                          <th className="px-4 py-3 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-blue-50/50 border-b border-border">
                          <td className="px-4 py-2 text-center font-mono text-xs text-muted-foreground">—</td>
                          <td colSpan={6} className="px-4 py-2 text-xs text-muted-foreground font-semibold">Opening Balance</td>
                          <td className="px-4 py-2 text-right font-mono text-xs font-bold text-foreground">{fmt(activeAccount.openingBalance)}</td>
                          <td></td>
                        </tr>

                        {normalTransactions.map((tx: any, idx: number) => (
                          <tr key={tx.id} className="border-b border-border/60 hover:bg-gray-50 transition-colors group">
                            <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{idx + 1}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.date.split("-").reverse().join("/")}</td>
                            <td className="px-4 py-3 text-foreground">
                              <div className="font-medium">{tx.description}</div>
                              {(tx.exchangeType || tx.dueDate) && (
                                <div className="flex items-center gap-2 mt-1">
                                  {tx.exchangeType && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${
                                      tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                    }`}>
                                      {tx.exchangeType}
                                    </span>
                                  )}
                                  {tx.dueDate && (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                                      Due: {tx.dueDate.split("-").reverse().join("/")}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.reference || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              {tx.document?.name ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setViewDoc(tx.document!)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                    title={tx.document.name}
                                  >
                                    {tx.document.mimeType?.startsWith("image/")
                                      ? <Image size={12} />
                                      : <FileText size={12} />}
                                    <span className="text-[10px] font-medium max-w-[60px] truncate">{tx.document.name?.split(".")[0]}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {tx.type === "credit"
                                ? <span className="text-emerald-600 font-semibold">{fmt(tx.amount)}</span>
                                : <span className="text-muted-foreground/40">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {tx.type === "debit"
                                ? <span className="text-red-500 font-semibold">{fmt(tx.amount)}</span>
                                : <span className="text-muted-foreground/40">—</span>}
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-semibold text-xs ${txRunningBalances[tx.id] < 0 ? "text-red-500" : "text-foreground"}`}>
                              {fmt(txRunningBalances[tx.id])}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => deleteTransaction(tx.id)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        <tr style={{ backgroundColor: activeAccount.bgColor }}>
                          <td colSpan={6} className="px-4 py-3 text-xs font-bold" style={{ color: activeAccount.color }}>Closing Balance</td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600">+{fmt(calcTotalCredit(activeAccount))}</td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-bold" style={{ color: calcBalance(activeAccount) < 0 ? "#dc2626" : activeAccount.color }}>
                            {fmt(calcBalance(activeAccount))}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </div>

              {/* Inter-Company Transfers (Loans & Credits) */}
              {exchangeTransactions.length > 0 && (
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                        <ArrowLeftRight size={14} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">Inter-Company Transfers</h3>
                        <p className="text-[10px] text-muted-foreground">Inter-company loans and credits</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                      {exchangeTransactions.length} transfers
                    </span>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden flex flex-col divide-y divide-border/60">
                    {exchangeTransactions.map((tx: any) => (
                      <div key={tx.id} className="p-5 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{tx.description}</div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-xs text-muted-foreground font-mono">{tx.date.split("-").reverse().join("/")}</span>
                              {tx.reference && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">Ref: {tx.reference}</span>}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${
                                tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {tx.exchangeType}
                              </span>
                              {tx.dueDate && (
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                                  Due: {tx.dueDate.split("-").reverse().join("/")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {tx.type === "credit" ? (
                              <div className="font-mono font-bold text-emerald-600">+{fmt(tx.amount)}</div>
                            ) : (
                              <div className="font-mono font-bold text-red-500">-{fmt(tx.amount)}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-border/40">
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-muted-foreground uppercase tracking-wide">
                          <th className="px-4 py-3 text-center font-semibold w-16">Sl. No.</th>
                          <th className="px-4 py-3 text-left font-semibold w-24">Date</th>
                          <th className="px-4 py-3 text-left font-semibold">Description</th>
                          <th className="px-4 py-3 text-left font-semibold w-24">Ref. No.</th>
                          <th className="px-4 py-3 text-center font-semibold w-24">Type</th>
                          <th className="px-4 py-3 text-left font-semibold w-32">Due Date</th>
                          <th className="px-4 py-3 text-right font-semibold w-32">Credit (₹)</th>
                          <th className="px-4 py-3 text-right font-semibold w-32">Debit (₹)</th>
                          <th className="px-4 py-3 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {exchangeTransactions.map((tx: any, idx: number) => (
                          <tr key={tx.id} className="border-b border-border/60 hover:bg-gray-50 transition-colors group">
                            <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{idx + 1}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.date.split("-").reverse().join("/")}</td>
                            <td className="px-4 py-3 text-foreground font-medium">{tx.description}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.reference || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize inline-block ${
                                tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {tx.exchangeType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-left">
                              {tx.dueDate ? (
                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">
                                  {tx.dueDate.split("-").reverse().join("/")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {tx.type === "credit"
                                ? <span className="text-emerald-600 font-semibold">{fmt(tx.amount)}</span>
                                : <span className="text-muted-foreground/40">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {tx.type === "debit"
                                ? <span className="text-red-500 font-semibold">{fmt(tx.amount)}</span>
                                : <span className="text-muted-foreground/40">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => deleteTransaction(tx.id)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>

      {/* Monthly Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <FileDown size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{reportType === "day" ? "Day Report" : "Monthly Report"}</h3>
                  <p className="text-xs text-white/60">Download as PDF</p>
                </div>
              </div>
              <button onClick={() => setShowReport(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Report Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReportType("month")}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                      reportType === "month"
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setReportType("day")}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                      reportType === "day"
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    Day-wise
                  </button>
                </div>
              </div>

              {reportType === "month" ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Month</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <button
                          key={m}
                          onClick={() => setReportMonth(m)}
                          className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                            reportMonth === m
                              ? "bg-primary text-white border-primary"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          {new Date(2000, m - 1, 1).toLocaleString("en-IN", { month: "short" })}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Year</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setReportYear(y => y - 1)}
                        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all text-lg font-bold"
                      >‹</button>
                      <div className="flex-1 text-center font-mono font-bold text-xl text-foreground">{reportYear}</div>
                      <button
                        onClick={() => setReportYear(y => y + 1)}
                        className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all text-lg font-bold"
                      >›</button>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Date</label>
                  <input
                    type="date"
                    value={reportDay}
                    onChange={e => setReportDay(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background font-mono"
                  />
                </div>
              )}

              {/* Preview summary */}
              <div className="bg-secondary rounded-xl p-4 space-y-1.5">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Report will include</div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Account summary table (all {accounts.length} accounts)
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Transaction detail per account
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Opening & closing balances
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Credit / Debit totals
                </div>
              </div>

              <div className="text-center py-1">
                {reportType === "month" ? (
                  <>
                    <div className="text-sm font-semibold text-foreground">
                      {new Date(reportYear, reportMonth - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {accounts.reduce((s, a) => s + a.transactions.filter((tx: any) => {
                        const d = new Date(tx.date);
                        return d.getMonth() + 1 === reportMonth && d.getFullYear() === reportYear;
                      }).length, 0)} transactions across all accounts
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-foreground">
                      {reportDay ? new Date(reportDay).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Select a date"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {accounts.reduce((s, a) => s + a.transactions.filter((tx: any) => tx.date === reportDay).length, 0)} transactions across all accounts
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowReport(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={reportType === "day" && !reportDay}
                onClick={() => {
                  if (reportType === "day") {
                    const [y, m, d] = reportDay.split("-").map(Number);
                    generateMonthlyPDF(accounts, m, y, d);
                  } else {
                    generateMonthlyPDF(accounts, reportMonth, reportYear);
                  }
                  setShowReport(false);
                }}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Download size={15} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  {viewDoc.mimeType.startsWith("image/")
                    ? <Image size={16} className="text-blue-600" />
                    : <FileText size={16} className="text-blue-600" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{viewDoc.name}</div>
                  <div className="text-xs text-muted-foreground">{(viewDoc.size / 1024).toFixed(1)} KB · {viewDoc.mimeType}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewDoc.dataUrl}
                  download={viewDoc.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download size={13} />
                  Download
                </a>
                <button onClick={() => setViewDoc(null)} className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-48">
              {viewDoc.mimeType.startsWith("image/") ? (
                <img
                  src={viewDoc.dataUrl}
                  alt={viewDoc.name}
                  className="max-w-full max-h-[60vh] rounded-lg shadow-md object-contain"
                />
              ) : viewDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={viewDoc.dataUrl}
                  title={viewDoc.name}
                  className="w-full rounded-lg"
                  style={{ height: "60vh" }}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto mb-4 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground font-medium">{viewDoc.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Preview not available for this file type</p>
                  <a
                    href={viewDoc.dataUrl}
                    download={viewDoc.name}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Download size={14} />
                    Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-lg text-foreground">
                {companyForm.type === "overdraft" ? "Add New Overdraft" : companyForm.type === "bank" ? "Add New Bank" : "Add New Company"}
              </h3>
              <button onClick={() => setShowAddCompany(false)} className="text-muted-foreground hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  placeholder="Enter name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Account Type</label>
                  <select
                    value={companyForm.type}
                    onChange={e => setCompanyForm({ ...companyForm, type: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="company">Company</option>
                    <option value="bank">Bank</option>
                    <option value="overdraft">Overdraft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Opening Balance</label>
                  <input
                    type="number"
                    value={companyForm.openingBalance}
                    onChange={e => setCompanyForm({ ...companyForm, openingBalance: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowAddCompany(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button onClick={addCompany} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                {companyForm.type === "overdraft" ? "Add Overdraft" : companyForm.type === "bank" ? "Add Bank" : "Add Company"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ backgroundColor: activeAccount.bgColor }}>
              <div>
                <h3 className="font-bold text-base" style={{ color: activeAccount.color }}>New Entry</h3>
                <p className="text-xs mt-0.5" style={{ color: activeAccount.color, opacity: 0.7 }}>{activeAccount.name}</p>
              </div>
              <button onClick={() => { setShowForm(false); setForm(f => ({ ...f, document: null })); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setForm(f => ({ ...f, type: "credit" }))}
                    className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-2 transition-all ${
                      form.type === "credit" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-border text-muted-foreground hover:border-emerald-200"
                    }`}
                  >
                    <TrendingUp size={15} /> Credit
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, type: "debit" }))}
                    className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-2 transition-all ${
                      form.type === "debit" ? "bg-red-50 border-red-500 text-red-600" : "border-border text-muted-foreground hover:border-red-200"
                    }`}
                  >
                    <TrendingDown size={15} /> Debit
                  </button>
                </div>
              </div>

              {(activeAccount.type === "company" || activeAccount.type === "overdraft") && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Paid Via</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, paymentMode: "cash" }))}
                      className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                        form.paymentMode === "cash" ? "bg-accent/10 border-accent text-accent" : "border-border text-muted-foreground hover:border-gray-300"
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, paymentMode: "bank" }))}
                      className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                        form.paymentMode === "bank" ? "bg-accent/10 border-accent text-accent" : "border-border text-muted-foreground hover:border-gray-300"
                      }`}
                    >
                      Bank Account
                    </button>
                  </div>
                </div>
              )}

              {(activeAccount.type === "company" || activeAccount.type === "overdraft") && form.paymentMode === "bank" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Select Bank Account</label>
                  <select
                    value={form.selectedBankId}
                    onChange={e => setForm(f => ({ ...f, selectedBankId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                  >
                    {accounts
                      .filter(a => a.type === "bank" || a.type === "overdraft")
                      .map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({fmt(calcBalance(acc))})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Transaction description..."
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Reference No. <span className="font-normal text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="INV-001, PO-012..."
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Due Date <span className="font-normal text-muted-foreground/60">(optional for reminders)</span>
                </label>
                <input
                  type="date"
                  value={form.dueDate || ""}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                />
              </div>

              {/* Document Upload */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Attach Document <span className="font-normal text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {form.document ? (
                  <div className="flex items-center gap-3 border border-border rounded-lg px-3 py-2.5 bg-input-background">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {form.document.mimeType.startsWith("image/")
                        ? <Image size={15} className="text-blue-500" />
                        : <FileText size={15} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{form.document.name}</div>
                      <div className="text-[10px] text-muted-foreground">{(form.document.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button
                      onClick={() => setForm(f => ({ ...f, document: null }))}
                      className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-lg px-3 py-4 flex flex-col items-center gap-1.5 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    <Upload size={18} />
                    <span className="text-xs font-medium">Click to upload</span>
                    <span className="text-[10px]">PDF, Image, Word, Excel supported</span>
                  </button>
                )}
              </div>

              {form.amount && (
                <div className={`rounded-lg px-4 py-3 text-sm flex items-center justify-between ${form.type === "credit" ? "bg-emerald-50" : "bg-red-50"}`}>
                  <span className={form.type === "credit" ? "text-emerald-700" : "text-red-600"}>
                    {form.type === "credit" ? "Adding Credit" : "Adding Debit"}
                  </span>
                  <span className={`font-mono font-bold ${form.type === "credit" ? "text-emerald-700" : "text-red-600"}`}>
                    {form.type === "credit" ? "+" : "-"}₹{parseFloat(form.amount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowForm(false); setForm(f => ({ ...f, document: null })); }} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={addTransaction}
                disabled={!form.description || !form.amount}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: activeAccount.color }}
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {showExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border bg-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <ArrowLeftRight size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Inter-Account Transfer</h3>
                  <p className="text-xs text-white/60">
                    {exchangeForm.category === "bank"
                      ? "Transfer balance between bank accounts"
                      : exchangeForm.category === "companyToBank"
                      ? "Record a company payment made through bank accounts"
                      : "Transfer balance between company accounts"}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowExchange(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Transfer Category */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Transfer Between</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const companyAccs = accounts.filter(a => a.type === "company");
                      setExchangeForm({ ...exchangeForm, category: "company", sourceId: companyAccs[0]?.id || "", destId: companyAccs[1]?.id || "", fromCompanyId: "", toCompanyId: "" });
                    }}
                    className={`py-2.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                      exchangeForm.category === "company" ? "bg-secondary border-accent text-accent" : "border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    <Building2 size={15} />
                    Company ↔ Company
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const bankAccs = accounts.filter(a => a.type === "bank");
                      setExchangeForm({ ...exchangeForm, category: "bank", sourceId: bankAccs[0]?.id || "", destId: bankAccs[1]?.id || "", fromCompanyId: "", toCompanyId: "" });
                    }}
                    className={`py-2.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                      exchangeForm.category === "bank" ? "bg-teal-50 border-teal-500 text-teal-700" : "border-border text-muted-foreground hover:border-teal-200"
                    }`}
                  >
                    <Landmark size={15} />
                    Bank ↔ Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const companyAccs = accounts.filter(a => a.type === "company");
                      const bankAccs = accounts.filter(a => a.type === "bank");
                      setExchangeForm({
                        ...exchangeForm,
                        category: "companyToBank",
                        fromCompanyId: companyAccs[0]?.id || "",
                        toCompanyId: companyAccs[1]?.id || "",
                        sourceId: bankAccs[0]?.id || "",
                        destId: bankAccs[1]?.id || "",
                      });
                    }}
                    className={`py-2.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                      exchangeForm.category === "companyToBank" ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "border-border text-muted-foreground hover:border-indigo-200"
                    }`}
                  >
                    <ArrowLeftRight size={15} />
                    Company → Bank
                  </button>
                </div>
              </div>

              {exchangeForm.category === "companyToBank" ? (
                <>
                  {/* From / To Company (context only — no ledger entries posted here) */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">From Company</label>
                    <select
                      value={exchangeForm.fromCompanyId}
                      onChange={e => {
                        const companyAccs = accounts.filter(a => a.type === "company");
                        const nextToId = companyAccs.find(a => String(a.id) !== e.target.value)?.id ?? "";
                        setExchangeForm({ ...exchangeForm, fromCompanyId: e.target.value, toCompanyId: String(nextToId) === e.target.value ? "" : String(nextToId) });
                      }}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                    >
                      {accounts.filter(acc => acc.type === "company").length === 0 && (
                        <option value="">No company accounts available</option>
                      )}
                      {accounts.filter(acc => acc.type === "company").map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">To Company</label>
                    <select
                      value={exchangeForm.toCompanyId}
                      onChange={e => setExchangeForm({ ...exchangeForm, toCompanyId: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                    >
                      {accounts.filter(acc => acc.type === "company" && String(acc.id) !== exchangeForm.fromCompanyId).length === 0 && (
                        <option value="">No other company accounts</option>
                      )}
                      {accounts
                        .filter(acc => acc.type === "company" && String(acc.id) !== exchangeForm.fromCompanyId)
                        .map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* From / To Bank Account — these are the two accounts that actually get debit/credit entries */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">From Bank Account</label>
                    <select
                      value={exchangeForm.sourceId}
                      onChange={e => {
                        const bankAccs = accounts.filter(a => a.type === "bank");
                        const nextDestId = bankAccs.find(a => String(a.id) !== e.target.value)?.id ?? "";
                        setExchangeForm({ ...exchangeForm, sourceId: e.target.value, destId: String(nextDestId) === e.target.value ? "" : String(nextDestId) });
                      }}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                    >
                      {accounts.filter(acc => acc.type === "bank").length === 0 && (
                        <option value="">No bank accounts available</option>
                      )}
                      {accounts.filter(acc => acc.type === "bank").map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({fmtSign(calcBalance(acc))})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">To Bank Account</label>
                    <select
                      value={exchangeForm.destId}
                      onChange={e => setExchangeForm({ ...exchangeForm, destId: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                    >
                      {accounts.filter(acc => acc.type === "bank" && String(acc.id) !== exchangeForm.sourceId).length === 0 && (
                        <option value="">No other bank accounts</option>
                      )}
                      {accounts
                        .filter(acc => acc.type === "bank" && String(acc.id) !== exchangeForm.sourceId)
                        .map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({fmtSign(calcBalance(acc))})</option>
                        ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Source Account */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">From Account</label>
                    <select
                      value={exchangeForm.sourceId}
                      onChange={e => {
                        const categoryAccs = accounts.filter(a => a.type === exchangeForm.category);
                        const nextDestId = categoryAccs.find(a => String(a.id) !== e.target.value)?.id ?? "";
                        setExchangeForm({ ...exchangeForm, sourceId: e.target.value, destId: String(nextDestId) === e.target.value ? "" : String(nextDestId) });
                      }}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                    >
                      {accounts.filter(acc => acc.type === exchangeForm.category).length === 0 && (
                        <option value="">No {exchangeForm.category} accounts available</option>
                      )}
                      {accounts.filter(acc => acc.type === exchangeForm.category).map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({fmtSign(calcBalance(acc))})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Destination Account */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">To Account</label>
                    <select
                      value={exchangeForm.destId}
                      onChange={e => setExchangeForm({ ...exchangeForm, destId: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                    >
                      {accounts
                        .filter(acc => acc.type === exchangeForm.category && String(acc.id) !== exchangeForm.sourceId).length === 0 && (
                        <option value="">No other {exchangeForm.category} accounts</option>
                      )}
                      {accounts
                        .filter(acc => acc.type === exchangeForm.category && String(acc.id) !== exchangeForm.sourceId)
                        .map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({fmtSign(calcBalance(acc))})
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                  <input
                    type="number"
                    value={exchangeForm.amount}
                    onChange={e => setExchangeForm({ ...exchangeForm, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                  />
                </div>
              </div>

              {/* Exchange Type */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Exchange Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExchangeForm({ ...exchangeForm, exchangeType: "loan" })}
                    className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-2 transition-all ${
                      exchangeForm.exchangeType === "loan" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-border text-muted-foreground hover:border-amber-200"
                    }`}
                  >
                    Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => setExchangeForm({ ...exchangeForm, exchangeType: "credit" })}
                    className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-2 transition-all ${
                      exchangeForm.exchangeType === "credit" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-border text-muted-foreground hover:border-blue-200"
                    }`}
                  >
                    Credit
                  </button>
                </div>
              </div>

              {/* Due Date & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Transfer Date</label>
                  <input
                    type="date"
                    value={exchangeForm.date}
                    onChange={e => setExchangeForm({ ...exchangeForm, date: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Due Date <span className="font-normal text-muted-foreground/60">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={exchangeForm.dueDate}
                    onChange={e => setExchangeForm({ ...exchangeForm, dueDate: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Description <span className="font-normal text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={exchangeForm.description}
                  onChange={e => setExchangeForm({ ...exchangeForm, description: e.target.value })}
                  placeholder="e.g. Temporary transfer for project support"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowExchange(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !exchangeForm.sourceId ||
                  !exchangeForm.destId ||
                  !exchangeForm.amount ||
                  (exchangeForm.category === "companyToBank" && (!exchangeForm.fromCompanyId || !exchangeForm.toCompanyId))
                }
                onClick={handleExchangeSubmit}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Transfer Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-red-50">
              <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2">
                <Trash2 size={20} />
                Delete Account
              </h3>
              <button 
                onClick={() => setShowDeleteDialog(false)} 
                className="text-muted-foreground hover:bg-red-100/50 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong className="text-foreground">{activeAccount?.name}</strong>? This action is permanent and will delete all associated transactions.
              </p>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Enter Password to Confirm</label>
                <input
                  type="password"
                  value={deleteConfirmPassword}
                  onChange={e => setDeleteConfirmPassword(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background"
                  placeholder="Enter your password"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleDeleteCompany();
                    }
                  }}
                />
              </div>

              {deleteError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteDialog(false)} 
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteCompany} 
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border bg-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <Settings size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Application Settings</h3>
                  <p className="text-xs text-white/60">Customize branding & theme</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={tempSettings.companyName}
                  onChange={e => setTempSettings({ ...tempSettings, companyName: e.target.value })}
                  placeholder="BRAND SWAMY"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Subtitle / Description</label>
                <input
                  type="text"
                  value={tempSettings.companySubtitle}
                  onChange={e => setTempSettings({ ...tempSettings, companySubtitle: e.target.value })}
                  placeholder="Accounts Manager"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Company Logo</label>
                <div className="flex items-center gap-4">
                  {tempSettings.logoUrl ? (
                    <img src={tempSettings.logoUrl} className="w-16 h-16 object-contain border border-border rounded-lg p-1 bg-gray-50" alt="Logo preview" />
                  ) : (
                    <div className="w-16 h-16 border border-border rounded-lg flex items-center justify-center bg-gray-50 text-muted-foreground text-xs text-center font-medium p-2">
                      Gopuram Icon (Default)
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = e => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setTempSettings(s => ({ ...s, logoUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
                    >
                      Upload Image
                    </button>
                    {tempSettings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setTempSettings({ ...tempSettings, logoUrl: "" })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Primary Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tempSettings.themeColor}
                    onChange={e => setTempSettings({ ...tempSettings, themeColor: e.target.value })}
                    className="w-10 h-10 border border-border rounded-lg cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-sm text-foreground font-semibold uppercase">{tempSettings.themeColor}</span>
                </div>
                
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide mb-1.5">Preset Palettes</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Brand Red", color: "#c21818" },
                      { name: "Navy Blue", color: "#1e3a8a" },
                      { name: "Emerald Green", color: "#047857" },
                      { name: "Royal Blue", color: "#2563eb" },
                      { name: "Charcoal Black", color: "#1f2937" },
                      { name: "Dark Plum", color: "#581c87" },
                    ].map(preset => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setTempSettings({ ...tempSettings, themeColor: preset.color })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          tempSettings.themeColor.toLowerCase() === preset.color.toLowerCase() ? "border-foreground scale-105" : "border-transparent"
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettings(tempSettings);
                  localStorage.setItem("brandswamy_settings", JSON.stringify(tempSettings));
                  setShowSettings(false);
                  toast.success("Branding settings saved successfully!");
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: tempSettings.themeColor }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
