import { ArrowLeftRight, X } from "lucide-react";
import type { Account } from "../../types";
import { fmtSign, calcBalance } from "../../types";

export function ExchangeModal({
  showExchange, setShowExchange, exchangeForm, setExchangeForm, accounts, handleExchangeSubmit,
}: {
  showExchange: boolean; setShowExchange: (v: boolean) => void; exchangeForm: any;
  setExchangeForm: React.Dispatch<React.SetStateAction<any>>; accounts: Account[]; handleExchangeSubmit: () => void;
}) {
  if (!showExchange) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border bg-primary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center"><ArrowLeftRight size={18} className="text-white" /></div>
            <div>
              <h3 className="font-bold text-base text-white">Inter-Account Transfer</h3>
              <p className="text-xs text-white/60">Record a company payment made through bank accounts</p>
            </div>
          </div>
          <button onClick={() => setShowExchange(false)} className="text-white/60 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Transfer Between</label>
            <div className="grid grid-cols-1">
              <div className="py-2.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 border-2 border-indigo-500 bg-indigo-50 text-indigo-700">
                <ArrowLeftRight size={15} /> Company → Bank
              </div>
            </div>
          </div>

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
              {accounts.filter(acc => acc.type === "company").length === 0 && <option value="">No company accounts available</option>}
              {accounts.filter(acc => acc.type === "company").map(acc => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">To Company</label>
            <select
              value={exchangeForm.toCompanyId}
              onChange={e => setExchangeForm({ ...exchangeForm, toCompanyId: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
            >
              {accounts.filter(acc => acc.type === "company" && String(acc.id) !== exchangeForm.fromCompanyId).length === 0 && <option value="">No other company accounts</option>}
              {accounts.filter(acc => acc.type === "company" && String(acc.id) !== exchangeForm.fromCompanyId).map(acc => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
            </select>
          </div>

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
              {accounts.filter(acc => acc.type === "bank").length === 0 && <option value="">No bank accounts available</option>}
              {accounts.filter(acc => acc.type === "bank").map(acc => (<option key={acc.id} value={acc.id}>{acc.name} ({fmtSign(calcBalance(acc))})</option>))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">To Bank Account</label>
            <select
              value={exchangeForm.destId}
              onChange={e => setExchangeForm({ ...exchangeForm, destId: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
            >
              {accounts.filter(acc => acc.type === "bank" && String(acc.id) !== exchangeForm.sourceId).length === 0 && <option value="">No other bank accounts</option>}
              {accounts.filter(acc => acc.type === "bank" && String(acc.id) !== exchangeForm.sourceId).map(acc => (<option key={acc.id} value={acc.id}>{acc.name} ({fmtSign(calcBalance(acc))})</option>))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
              <input type="number" value={exchangeForm.amount} onChange={e => setExchangeForm({ ...exchangeForm, amount: e.target.value })} placeholder="0.00" min="0" step="0.01" className="w-full border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Exchange Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setExchangeForm({ ...exchangeForm, exchangeType: "loan" })} className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-2 transition-all ${exchangeForm.exchangeType === "loan" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-border text-muted-foreground hover:border-amber-200"}`}>Loan</button>
              <button type="button" onClick={() => setExchangeForm({ ...exchangeForm, exchangeType: "credit" })} className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-2 transition-all ${exchangeForm.exchangeType === "credit" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-border text-muted-foreground hover:border-blue-200"}`}>Credit</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Transfer Date</label>
              <input type="date" value={exchangeForm.date} onChange={e => setExchangeForm({ ...exchangeForm, date: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Due Date <span className="font-normal text-muted-foreground/60">(optional)</span></label>
              <input type="date" value={exchangeForm.dueDate} onChange={e => setExchangeForm({ ...exchangeForm, dueDate: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description <span className="font-normal text-muted-foreground/60">(optional)</span></label>
            <input type="text" value={exchangeForm.description} onChange={e => setExchangeForm({ ...exchangeForm, description: e.target.value })} placeholder="e.g. Temporary transfer for project support" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background" />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button type="button" onClick={() => setShowExchange(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="button" disabled={!exchangeForm.sourceId || !exchangeForm.destId || !exchangeForm.amount || (!exchangeForm.fromCompanyId || !exchangeForm.toCompanyId)} onClick={handleExchangeSubmit} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Transfer Funds</button>
        </div>
      </div>
    </div>
  );
}
