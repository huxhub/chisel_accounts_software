import { Building2, CreditCard, Landmark, Wallet } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TransactionType = "credit" | "debit";

export interface AttachedDoc {
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
}

export interface Program {
  id: number;
  name: string;
  color: string;
  createdAt?: string;
}

export interface VendorEntry {
  id: number;
  vendorId: number;
  type: "purchase" | "sale";
  itemName: string;
  amount: number;
  party: string; // "from whom" for purchase, "to whom" for sale
  date: string;
  note?: string | null;
  createdAt?: string;
}

export interface Vendor {
  id: number;
  name: string;
  VendorEntries: VendorEntry[];
  createdAt?: string;
}

export type VoucherType = "purchase" | "sale" | "payment" | "receipt";

export interface Voucher {
  id: number;
  type: VoucherType;
  date: string;
  ledgerId: number;
  accountId?: number | null;
  itemName?: string | null;
  amount: number;
  reference?: string | null;
  note?: string | null;
  programId?: number | null;
  document?: AttachedDoc | null;
  Account?: { id: number; name: string };
  Program?: { id: number; name: string };
  Ledger?: { id: number; name: string; type: "vendor" | "customer" };
}

export interface Ledger {
  id: number;
  name: string;
  type: "vendor" | "customer";
  openingBalance: number;
  openingType: "debit" | "credit";
  totalPurchased?: number;
  totalPaid?: number;
  totalSold?: number;
  totalReceived?: number;
  balanceDue: number;
  Vouchers?: Voucher[];
  createdAt?: string;
}

export interface LedgerStatementRow {
  id: number;
  date: string;
  type: VoucherType;
  itemName?: string | null;
  note?: string | null;
  amount: number;
  reference?: string | null;
  accountName?: string | null;
  programName?: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface LedgerStatement {
  ledger: {
    id: number;
    name: string;
    type: "vendor" | "customer";
    openingBalance: number;
    openingType: "debit" | "credit";
  };
  summary: {
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
  };
  rows: LedgerStatementRow[];
}

export interface Transaction {
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
  isCompleted?: boolean;
  isReminder?: boolean;
  programId?: number | null;
  programName?: string | null;
  vendorOrCustomerName?: string | null;
  relatedItemName?: string | null;
}

export interface Account {
  id: string;
  name: string;
  type: "company" | "overdraft" | "bank" | "cash";
  openingBalance: number;
  transactions: Transaction[];
  color: string;
  bgColor: string;
  createdAt?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const CHART_COLORS = [
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

// ─── Utility Functions ─────────────────────────────────────────────────────────

export function calcBalance(account: Account): number {
  return account.transactions
    .filter(tx => !tx.isReminder)
    .reduce(
      (bal, tx) => (tx.type === "credit" ? bal + tx.amount : bal - tx.amount),
      account.openingBalance
    );
}

export function calcTotalCredit(account: Account): number {
  return account.transactions
    .filter(t => t.type === "credit" && !t.isReminder)
    .reduce((s, t) => s + t.amount, 0);
}

export function calcTotalDebit(account: Account): number {
  return account.transactions
    .filter(t => t.type === "debit" && !t.isReminder)
    .reduce((s, t) => s + t.amount, 0);
}

export function fmt(n: number): string {
  const abs = Math.abs(n);
  const f = abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${f})` : f;
}

export function fmtSign(n: number): string {
  return n < 0
    ? `-₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    : `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function findAccountById(list: Account[], id: string): Account | undefined {
  return list.find(a => String(a.id) === String(id));
}

export function accountTypeIcon(type: Account["type"]) {
  if (type === "overdraft") return CreditCard;
  if (type === "bank") return Landmark;
  if (type === "cash") return Wallet;
  return Building2;
}

export function accountTypeLabel(type: Account["type"]): string {
  if (type === "overdraft") return "Overdraft Account";
  if (type === "bank") return "Bank Account";
  if (type === "cash") return "Cash Account";
  return "Company Account";
}

export function formatLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const today = formatLocalDate();
