import { useState, useMemo } from "react";
import { Bell, Trash2, Check, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Account } from "../types";

export function RemindersPage({
  accounts,
  onNavigate,
  onAddTransaction,
  onDeleteTransaction,
  onCompleteReminder,
}: {
  accounts: Account[];
  onNavigate: (id: string) => void;
  onAddTransaction: (accountId: string, transaction: any) => void;
  onDeleteTransaction: (accountId: string, txId: string) => void;
  onCompleteReminder?: (accountId: string, txId: string) => void;
}) {
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [reminderNote, setReminderNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderAmount, setReminderAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    const companies = accounts.filter(acc => acc.type === "company");
    return companies[0]?.id || "";
  });

  const saveReminder = () => {
    if (!selectedAccountId) { toast.warning("Please select a company/account first!"); return; }
    if (!reminderNote || !reminderDate) { toast.warning("Please fill in both note and date."); return; }
    const parsedAmount = parseFloat(reminderAmount) || 0;
    const tx = { date: new Date().toISOString().split("T")[0], description: reminderNote, type: "debit" as const, amount: parsedAmount, dueDate: reminderDate };
    onAddTransaction(selectedAccountId, tx);
    setReminderNote(""); setReminderDate(""); setReminderAmount(""); setShowReminderModal(false);
  };

  const allReminders = useMemo(() => {
    const list: any[] = [];
    const seenRefs = new Set<string>();
    accounts.forEach(a => {
      (a.transactions || []).filter((tx: any) => tx.dueDate).forEach((tx: any) => {
        if (tx.reference && (tx.reference.startsWith("EX-") || tx.exchangeType)) {
          if (seenRefs.has(tx.reference)) return;
          seenRefs.add(tx.reference);
        }
        list.push({ ...tx, accountId: a.id, accountName: a.name, accountColor: a.color, accountBg: a.bgColor });
      });
    });
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [accounts]);

  const activeReminders = useMemo(() => allReminders.filter(r => !r.isCompleted), [allReminders]);
  const completedReminders = useMemo(() => allReminders.filter(r => Boolean(r.isCompleted)), [allReminders]);
  const currentList = tab === "active" ? activeReminders : completedReminders;
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reminders</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your active alerts and completed tasks.</p>
        </div>
        <button onClick={() => { if (accounts.length === 0) { toast.warning("Please add an account first!"); return; } setShowReminderModal(true); }} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all">
          <Bell size={16} /> Set Reminder
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button onClick={() => setTab("active")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === "active" ? "bg-red-50 text-red-600" : "text-muted-foreground hover:bg-gray-100"}`}>
          Active Reminders ({activeReminders.length})
        </button>
        <button onClick={() => setTab("completed")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === "completed" ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground hover:bg-gray-100"}`}>
          Completed Reminders ({completedReminders.length})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-sm text-foreground">{tab === "active" ? "Active Reminders List" : "Completed Reminders Log"}</h3>
          <span className="text-xs bg-gray-100 text-muted-foreground font-mono font-bold px-2 py-0.5 rounded-full">{currentList.length} total</span>
        </div>

        {currentList.length === 0 ? (
          <div className="py-16 text-center">
            {tab === "active" ? <Bell size={32} className="mx-auto text-muted-foreground/30 mb-3" /> : <CheckCircle2 size={32} className="mx-auto text-emerald-500/40 mb-3" />}
            <p className="text-sm font-medium text-muted-foreground">{tab === "active" ? "No active reminders set" : "No completed reminders yet"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Company</th>
                  <th className="px-4 py-3 text-left font-semibold">Date Created</th>
                  <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((rem: any) => {
                  const isOverdue = rem.dueDate < todayStr;
                  const isDueToday = rem.dueDate === todayStr;
                  const statusLabel = tab === "completed" ? "Completed" : isOverdue ? "Overdue" : isDueToday ? "Due Today" : "Upcoming";
                  const statusClass = tab === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isOverdue ? "bg-red-50 text-red-700 border-red-100" : isDueToday ? "bg-amber-50 text-amber-800 border-amber-100" : "bg-blue-50 text-blue-700 border-blue-100";

                  return (
                    <tr key={rem.id} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: rem.accountBg, color: rem.accountColor }}>{rem.accountName}</span></td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">{rem.date.split("-").reverse().join("/")}</td>
                      <td className="px-4 py-3.5 text-xs font-mono font-bold text-foreground">{rem.dueDate.split("-").reverse().join("/")}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-800">{rem.description}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusClass} font-semibold`}>{statusLabel}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tab === "active" && onCompleteReminder && (
                            <button onClick={() => onCompleteReminder(rem.accountId, rem.id)} className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors" title="Mark as Done"><Check size={14} /></button>
                          )}
                          <button onClick={() => onDeleteTransaction(rem.accountId, rem.id)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete Reminder"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border bg-red-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center"><Bell size={18} className="text-white" /></div>
                <div><h3 className="font-bold text-base text-white">Create New Reminder</h3><p className="text-xs text-red-100">Schedule an alert or reminder</p></div>
              </div>
              <button onClick={() => setShowReminderModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Select Account</label>
                <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background">
                  {accounts.filter(acc => acc.type === "company").map(acc => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Reminder Note</label>
                <input type="text" value={reminderNote} onChange={e => setReminderNote(e.target.value)} placeholder="e.g. Pay rent, GST due date..." className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background font-medium" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Amount (₹) <span className="font-normal text-muted-foreground/60">(optional)</span></label>
                <input type="number" value={reminderAmount} onChange={e => setReminderAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Due Date</label>
                <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button type="button" onClick={() => setShowReminderModal(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="button" onClick={saveReminder} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Save Reminder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
