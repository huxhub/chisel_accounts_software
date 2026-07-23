import { Building2, CreditCard, Landmark } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TransactionType = "credit" | "debit";

export interface AttachedDoc {
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
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
}

export interface Account {
  id: string;
  name: string;
  type: "company" | "overdraft" | "bank";
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
  return account.transactions.reduce(
    (bal, tx) => (tx.type === "credit" ? bal + tx.amount : bal - tx.amount),
    account.openingBalance
  );
}

export function calcTotalCredit(account: Account): number {
  return account.transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
}

export function calcTotalDebit(account: Account): number {
  return account.transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
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

// Account ids come back from the API as numbers, but every <select> element's
// onChange hands back a string (e.target.value) — comparing them with === would
// silently fail the moment a user changes a dropdown away from its default.
export function findAccountById(list: Account[], id: string): Account | undefined {
  return list.find(a => String(a.id) === String(id));
}

export function accountTypeIcon(type: Account["type"]) {
  if (type === "overdraft") return CreditCard;
  if (type === "bank") return Landmark;
  return Building2;
}

export function accountTypeLabel(type: Account["type"]): string {
  if (type === "overdraft") return "Overdraft Account";
  if (type === "bank") return "Bank Account";
  return "Company Account";
}

export const today = new Date().toISOString().split("T")[0];
