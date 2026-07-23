import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Account, Transaction } from "../types";

export function generateMonthlyPDF(accounts: Account[], month: number, year: number, day?: number) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

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

  const isBeforePeriod = (d: Date) => {
    if (d.getFullYear() !== year) return d.getFullYear() < year;
    const dMonth = d.getMonth() + 1;
    if (dMonth !== month) return dMonth < month;
    return day ? d.getDate() < day : false;
  };
  const isOnOrBeforePeriodEnd = (d: Date) => {
    if (d.getFullYear() !== year) return d.getFullYear() < year;
    const dMonth = d.getMonth() + 1;
    if (dMonth !== month) return dMonth < month;
    return day ? d.getDate() <= day : true;
  };

  // ── Page 1: Overall Summary Cover Page ──
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("ACCOUNTS MANAGER", margin, 11);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Multi-Company Accounting System", margin, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${reportTitle} — ${periodLabel}`, pageW - margin, 11, { align: "right" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, pageW - margin, 18, { align: "right" });

  doc.setTextColor(30, 58, 95);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Account Summary", margin, 35);

  const summaryRows: any[] = [];
  let totalOpen = 0, totalCredit = 0, totalDebit = 0, totalClose = 0;

  accounts.forEach(acc => {
    const txsBeforeMonth = acc.transactions.filter(tx => isBeforePeriod(new Date(tx.date)));
    const creditBefore = txsBeforeMonth.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debitBefore = txsBeforeMonth.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const monthlyOpeningBalance = acc.openingBalance + creditBefore - debitBefore;

    const txs = filterTx(acc.transactions);
    const credit = txs.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debit = txs.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const closing = monthlyOpeningBalance + credit - debit;

    const accDate = acc.createdAt ? new Date(acc.createdAt) : new Date();
    const isExisted = isOnOrBeforePeriodEnd(accDate);

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
      "", "TOTAL",
      `Rs.${totalOpen.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs.${totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs.${totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs.${totalClose.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);
  }

  autoTable(doc, {
    startY: 39,
    head: [["S.No.", "Account", "Opening Balance", "Total Credit", "Total Debit", "Closing Balance"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { fontStyle: "bold" },
      2: { halign: "right" },
      3: { halign: "right", textColor: [5, 150, 105] },
      4: { halign: "right", textColor: [185, 28, 28] },
      5: { halign: "right", fontStyle: "bold" },
    },
    willDrawCell: (data) => {
      if (data.row.index === summaryRows.length - 1) doc.setFillColor(230, 237, 245);
    },
    margin: { left: margin, right: margin },
  });

  // ── Inter-Company Transfers Table on Cover Page ──
  buildTransfersSection(doc, accounts, month, year, day, margin);

  // ── Pages 2+: Individual Account Pages (Matching Attached Screenshot) ──
  accounts.forEach(acc => {
    const txsBeforeMonth = acc.transactions.filter(tx => isBeforePeriod(new Date(tx.date)));
    const creditBefore = txsBeforeMonth.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debitBefore = txsBeforeMonth.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const monthlyOpeningBalance = acc.openingBalance + creditBefore - debitBefore;

    const txs = filterTx(acc.transactions).sort((a, b) => a.date.localeCompare(b.date));
    if (txs.length === 0 && monthlyOpeningBalance === 0) return;

    doc.addPage();
    const currentPageNum = (doc.internal as any).getCurrentPageInfo().pageNumber;

    // Header banner
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageW, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(acc.name, margin, 11);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    const typeTitle = acc.type === "bank" ? "Bank Account" : acc.type === "overdraft" ? "Overdraft Account" : "Company Account";
    doc.text(`${typeTitle} — ${periodLabel}`, margin, 18);
    doc.text(`Page ${currentPageNum}`, pageW - margin, 15, { align: "right" });

    // Summary Cards Grid (4 boxes at top)
    const creditTotal = txs.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debitTotal = txs.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const closingTotal = monthlyOpeningBalance + creditTotal - debitTotal;

    const cardY = 28;
    const cardW = (pageW - margin * 2 - 9) / 4;
    const cardH = 16;
    const cards = [
      { label: "Opening Balance", val: `Rs.${monthlyOpeningBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: [30, 58, 95] },
      { label: "Total Credit", val: `Rs.${creditTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: [5, 150, 105] },
      { label: "Total Debit", val: `Rs.${debitTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: [185, 28, 28] },
      { label: "Closing Balance", val: `Rs.${closingTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: [30, 58, 95] },
    ];

    cards.forEach((c, idx) => {
      const cx = margin + idx * (cardW + 3);
      doc.setFillColor(238, 242, 246);
      doc.rect(cx, cardY, cardW, cardH, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 110, 125);
      doc.text(c.label, cx + 4, cardY + 5.5);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.val, cx + 4, cardY + 12);
    });

    // Transactions Table
    let runningBal = monthlyOpeningBalance;
    const txRows = txs.map(tx => {
      runningBal = tx.type === "credit" ? runningBal + tx.amount : runningBal - tx.amount;
      return [
        tx.date.split("-").reverse().join("/"),
        tx.description,
        tx.type === "credit" ? `Rs.${tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "",
        tx.type === "debit" ? `Rs.${tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "",
        `Rs.${runningBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      ];
    });

    autoTable(doc, {
      startY: cardY + cardH + 5,
      head: [["Date", "Description", "Credit (Rs.)", "Debit (Rs.)", "Balance (Rs.)"]],
      body: txRows,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold", fontSize: 9, halign: "center", valign: "middle", lineWidth: 0.2, lineColor: [200, 210, 220] },
      bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30], font: "helvetica", valign: "middle", lineWidth: 0.15, lineColor: [210, 215, 225], cellPadding: 3 },
      columnStyles: {
        0: { halign: "center", cellWidth: 24 },
        1: { halign: "left", fontStyle: "normal" },
        2: { halign: "center", textColor: [5, 150, 105], cellWidth: 30 },
        3: { halign: "center", textColor: [185, 28, 28], cellWidth: 30 },
        4: { halign: "center", fontStyle: "bold", textColor: [30, 58, 95], cellWidth: 34 },
      },
      margin: { left: margin, right: margin },
    });
  });

  // Footer on every page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 247, 250);
    doc.rect(0, doc.internal.pageSize.getHeight() - 8, pageW, 8, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 130, 145);
    doc.text("Accounts Manager — Confidential", margin, doc.internal.pageSize.getHeight() - 2.5);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, doc.internal.pageSize.getHeight() - 2.5, { align: "right" });
  }

  doc.save(`${reportTitle.replace(" ", "_")}_${fileNamePeriod}.pdf`);
}

function buildTransfersSection(doc: jsPDF, accounts: Account[], month: number, year: number, day: number | undefined, margin: number) {
  const map = new Map<string, { date: string; amount: number; reference: string; dueDate?: string; exchangeType: string; fromCompany: string; toCompany: string }>();

  accounts.forEach(a => {
    a.transactions.forEach((tx: any) => {
      const parts = tx.date.split("-");
      if (parts.length < 2) return;
      const txYear = parseInt(parts[0], 10);
      const txMonth = parseInt(parts[1], 10);
      const txDay = parts.length > 2 ? parseInt(parts[2], 10) : undefined;
      const isThisMonth = txMonth === month && txYear === year && (day ? txDay === day : true);
      if (!tx.reference || !isThisMonth || (!tx.exchangeType && !tx.reference.startsWith("EX-"))) return;
      let entry = map.get(tx.reference);
      if (!entry) {
        entry = { date: tx.date, amount: tx.amount, reference: tx.reference, dueDate: tx.dueDate, exchangeType: tx.exchangeType || "loan", fromCompany: "", toCompany: "" };
        map.set(tx.reference, entry);
      }
      if (tx.type === "debit") entry.fromCompany = a.name;
      else if (tx.type === "credit") entry.toCompany = a.name;
    });
  });

  const interCompanyTransfers = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  if (interCompanyTransfers.length === 0) return;

  const finalY = (doc as any).lastAutoTable.finalY || 110;
  const titleY = finalY + 10;
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
      0: { halign: "center", cellWidth: 12 }, 1: { halign: "center", cellWidth: 20 },
      2: { fontStyle: "bold" }, 3: { halign: "center", cellWidth: 24 },
      4: { halign: "center", cellWidth: 18 }, 5: { halign: "center", cellWidth: 22 },
      6: { halign: "right", fontStyle: "bold", cellWidth: 30 }
    },
    margin: { left: margin, right: margin }
  });
}
