import { Plus, Trash2, Edit3, Check, X, Bell, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Account, AttachedDoc } from "../types";
import { accountTypeIcon, accountTypeLabel, fmt, fmtSign, calcBalance, calcTotalCredit, calcTotalDebit } from "../types";
import { TransactionsTable } from "./TransactionsTable";
import { ExchangeTransactionsTable } from "./ExchangeTransactionsTable";

export function AccountDetail({
  activeAccount,
  activeAccountReminders,
  normalTransactions,
  exchangeTransactions,
  txRunningBalances,
  editingName,
  nameInput,
  setNameInput,
  setEditingName,
  editAccountName,
  setDeleteAccountId,
  setDeleteConfirmPassword,
  setDeleteError,
  setShowDeleteDialog,
  editingOpening,
  openingInput,
  setOpeningInput,
  setEditingOpening,
  saveOpeningBalance,
  onOpenAddEntry,
  onViewDoc,
  onDeleteTransaction,
  onEditTransaction,
  onCompleteReminder,
  onNavigateToReminders,
}: {
  activeAccount: Account;
  activeAccountReminders: any[];
  normalTransactions: any[];
  exchangeTransactions: any[];
  txRunningBalances: Record<string, number>;
  editingName: string | null;
  nameInput: string;
  setNameInput: (v: string) => void;
  setEditingName: (v: string | null) => void;
  editAccountName: (id: string, name: string) => Promise<any>;
  setDeleteAccountId: (v: string | null) => void;
  setDeleteConfirmPassword: (v: string) => void;
  setDeleteError: (v: string) => void;
  setShowDeleteDialog: (v: boolean) => void;
  editingOpening: string | null;
  openingInput: string;
  setOpeningInput: (v: string) => void;
  setEditingOpening: (v: string | null) => void;
  saveOpeningBalance: (id: string) => void;
  onOpenAddEntry: () => void;
  onViewDoc: (doc: AttachedDoc) => void;
  onDeleteTransaction: (txId: string) => void;
  onEditTransaction?: (tx: any) => void;
  onCompleteReminder?: (accountId: string, txId: string) => void;
  onNavigateToReminders: () => void;
}) {
  const Icon = accountTypeIcon(activeAccount.type);

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activeAccount.bgColor }}>
            <Icon size={18} style={{ color: activeAccount.color }} />
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
                    if (e.key === "Enter") {
                      if (await editAccountName(activeAccount.id, nameInput)) setEditingName(null);
                    } else if (e.key === "Escape") setEditingName(null);
                  }}
                />
                <button onClick={async () => { if (await editAccountName(activeAccount.id, nameInput)) setEditingName(null); }} className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors" title="Save">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingName(null)} className="p-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" title="Cancel">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-0.5">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingName(activeAccount.id); setNameInput(activeAccount.name); }}>
                  <h2 className="text-xl font-bold text-foreground">{activeAccount.name}</h2>
                  <Edit3 size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <button onClick={() => { setDeleteAccountId(activeAccount.id); setDeleteConfirmPassword(""); setDeleteError(""); setShowDeleteDialog(true); }} className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors" title="Delete Account">
                  <Trash2 size={16} />
                </button>
                {activeAccount.type === "overdraft" && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 leading-none">Overdraft</span>}
                {activeAccount.type === "bank" && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 leading-none">Bank</span>}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{accountTypeLabel(activeAccount.type)}</p>
          </div>
        </div>
        <button onClick={onOpenAddEntry} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: activeAccount.color }}>
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {/* Reminders section / Alert Boxes */}
      {activeAccountReminders.length > 0 && (
        <div className="space-y-3">
          {activeAccountReminders.map((rem: any) => {
            const todayStr = new Date().toISOString().split("T")[0];
            const isOverdue = rem.dueDate < todayStr;
            const diffTime = new Date(rem.dueDate).getTime() - new Date(todayStr).getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const statusText = isOverdue ? `Overdue by ${Math.abs(diffDays)} days` : "Due Today";

            return (
              <div key={rem.id} className="bg-white border border-red-200 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 shadow-3xs">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0 mt-0.5"><Bell size={18} /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">{rem.description}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>{statusText}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Scheduled due date: <span className="font-mono font-semibold text-slate-700">{rem.dueDate.split("-").reverse().join("/")}</span></p>
                    <button onClick={onNavigateToReminders} className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mt-2.5 transition-colors">Review Reminders <span className="text-sm">→</span></button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => { if (onCompleteReminder) onCompleteReminder(activeAccount.id, rem.id); else onDeleteTransaction(rem.id); }} className="w-8 h-8 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors shadow-2xs" title="Mark as Done"><Check size={15} /></button>
                  <button onClick={() => onDeleteTransaction(rem.id)} className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors" title="Dismiss Alert"><X size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-xs text-muted-foreground mb-1">Opening Balance</div>
          {editingOpening === activeAccount.id ? (
            <div className="flex items-center gap-1.5">
              <input type="number" value={openingInput} onChange={e => setOpeningInput(e.target.value)} className="w-full text-sm font-mono border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/30" autoFocus onKeyDown={e => { if (e.key === "Enter") saveOpeningBalance(activeAccount.id); if (e.key === "Escape") setEditingOpening(null); }} />
              <button onClick={() => saveOpeningBalance(activeAccount.id)} className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Save"><Check size={14} /></button>
              <button onClick={() => setEditingOpening(null)} className="p-1 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors" title="Cancel"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingOpening(activeAccount.id); setOpeningInput(String(activeAccount.openingBalance)); }}>
              <div className={`text-base font-mono font-bold ${activeAccount.openingBalance < 0 ? "text-red-500" : "text-foreground"}`}>{fmtSign(activeAccount.openingBalance)}</div>
              <Edit3 size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <div className="text-xs text-emerald-700 mb-1">Total Credit</div>
          <div className="text-base font-mono font-bold text-emerald-700">+₹{fmt(calcTotalCredit(activeAccount))}</div>
          <div className="text-xs text-emerald-600 mt-1">{activeAccount.transactions.filter((t: any) => t.type === "credit").length} transactions</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <div className="text-xs text-red-700 mb-1">Total Debit</div>
          <div className="text-base font-mono font-bold text-red-600">-₹{fmt(calcTotalDebit(activeAccount))}</div>
          <div className="text-xs text-red-600 mt-1">{activeAccount.transactions.filter((t: any) => t.type === "debit").length} transactions</div>
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: activeAccount.bgColor, borderColor: `${activeAccount.color}30` }}>
          <div className="text-xs mb-1" style={{ color: activeAccount.color }}>Closing Balance</div>
          <div className={`text-base font-mono font-bold ${calcBalance(activeAccount) < 0 ? "text-red-600" : ""}`} style={{ color: calcBalance(activeAccount) < 0 ? undefined : activeAccount.color }}>{fmtSign(calcBalance(activeAccount))}</div>
          <div className="text-xs mt-1" style={{ color: activeAccount.color, opacity: 0.7 }}>{calcBalance(activeAccount) >= activeAccount.openingBalance ? "↑ Increase" : "↓ Decrease"}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionsTable activeAccount={activeAccount} normalTransactions={normalTransactions} txRunningBalances={txRunningBalances} onViewDoc={onViewDoc} onDeleteTransaction={onDeleteTransaction} onEditTransaction={onEditTransaction} />

      {/* Exchange Transactions Table */}
      <ExchangeTransactionsTable exchangeTransactions={exchangeTransactions} onDeleteTransaction={onDeleteTransaction} />
    </div>
  );
}
