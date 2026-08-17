import { TrendingUp, TrendingDown, Upload, Image, FileText, X } from "lucide-react";
import type { Account, Program } from "../../types";
import { fmt, calcBalance } from "../../types";

export function AddTransactionModal({
  showForm, setShowForm, activeAccount, accounts, form, setForm,
  fileInputRef, handleFileSelect, addTransaction, editingTxId, programs = [],
}: {
  showForm: boolean; setShowForm: (v: boolean) => void;
  activeAccount: Account | undefined; accounts: Account[]; form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>; fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; addTransaction: () => void;
  editingTxId?: string | null; programs?: Program[];
}) {
  if (!showForm || !activeAccount) return null;
  const isCompanyODOrCash = activeAccount.type === "company" || activeAccount.type === "overdraft" || activeAccount.type === "cash";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ backgroundColor: activeAccount.bgColor }}>
          <div>
            <h3 className="font-bold text-base" style={{ color: activeAccount.color }}>{editingTxId ? "Edit Entry" : "New Entry"}</h3>
            <p className="text-xs mt-0.5" style={{ color: activeAccount.color, opacity: 0.7 }}>{activeAccount.name}</p>
          </div>
          <button onClick={() => { setShowForm(false); setForm((f: any) => ({ ...f, document: null })); }} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setForm((f: any) => ({ ...f, type: "credit" }))} className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-2 transition-all ${form.type === "credit" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-border text-muted-foreground hover:border-emerald-200"}`}>
                <TrendingUp size={15} /> Credit
              </button>
              <button onClick={() => setForm((f: any) => ({ ...f, type: "debit" }))} className={`py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border-2 transition-all ${form.type === "debit" ? "bg-red-50 border-red-500 text-red-600" : "border-border text-muted-foreground hover:border-red-200"}`}>
                <TrendingDown size={15} /> Debit
              </button>
            </div>
          </div>

          {activeAccount.type === "cash" ? (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                {form.type === "credit"
                  ? "Bank Source (Cash Withdrawn from Bank)"
                  : "Bank Destination (Cash Deposited to Bank)"}
              </label>
              <select
                value={form.paymentMode === "bank" ? form.selectedBankId : ""}
                onChange={e => {
                  const val = e.target.value;
                  if (val) {
                    setForm((f: any) => ({ ...f, paymentMode: "bank", selectedBankId: val }));
                  } else {
                    setForm((f: any) => ({ ...f, paymentMode: "cash", selectedBankId: "" }));
                  }
                }}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background font-medium"
              >
                <option value="">-- Direct Cash / Hand-in-Hand (No Bank) --</option>
                {accounts.filter(a => a.type === "bank").map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({fmt(calcBalance(acc))})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                {form.paymentMode === "bank" && form.selectedBankId
                  ? form.type === "credit"
                    ? "Money will be withdrawn (debited) from the selected bank into cash."
                    : "Money will be deposited (credited) into the selected bank from cash."
                  : "Recorded directly as physical cash transaction."}
              </p>
            </div>
          ) : (
            (activeAccount.type === "company" || activeAccount.type === "overdraft") && (
              <>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Paid Via</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setForm((f: any) => ({ ...f, paymentMode: "cash" }))} className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${form.paymentMode === "cash" ? "bg-accent/10 border-accent text-accent" : "border-border text-muted-foreground hover:border-gray-300"}`}>Cash</button>
                    <button type="button" onClick={() => setForm((f: any) => ({ ...f, paymentMode: "bank" }))} className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${form.paymentMode === "bank" ? "bg-accent/10 border-accent text-accent" : "border-border text-muted-foreground hover:border-gray-300"}`}>Bank Account</button>
                  </div>
                </div>
                {form.paymentMode === "bank" && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Select Bank Account</label>
                    <select value={form.selectedBankId} onChange={e => setForm((f: any) => ({ ...f, selectedBankId: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background">
                      {accounts.filter(a => a.type === "bank").map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({fmt(calcBalance(acc))})</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Description</label>
            <input type="text" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Transaction description..." className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between mb-1.5">
              <span>Program / Category</span>
              <span className="font-normal text-muted-foreground/60 lowercase">(optional)</span>
            </label>
            <select
              value={form.programId || ""}
              onChange={e => setForm((f: any) => ({ ...f, programId: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background"
            >
              <option value="">-- No Program --</option>
              {programs.map(prog => (
                <option key={prog.id} value={prog.id}>{prog.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
              <input type="number" value={form.amount} onChange={e => setForm((f: any) => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0" step="0.01" className="w-full border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Attach Document <span className="font-normal text-muted-foreground/60">(optional)</span></label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} className="hidden" />
            {form.document ? (
              <div className="flex items-center gap-3 border border-border rounded-lg px-3 py-2.5 bg-input-background">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  {form.document.mimeType.startsWith("image/") ? <Image size={15} className="text-blue-500" /> : <FileText size={15} className="text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{form.document.name}</div>
                  <div className="text-[10px] text-muted-foreground">{(form.document.size / 1024).toFixed(1)} KB</div>
                </div>
                <button onClick={() => setForm((f: any) => ({ ...f, document: null }))} className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"><X size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-lg px-3 py-4 flex flex-col items-center gap-1.5 text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                <Upload size={18} /><span className="text-xs font-medium">Click to upload</span><span className="text-[10px]">PDF, Image, Word, Excel supported</span>
              </button>
            )}
          </div>

          {form.amount && (
            <div className={`rounded-lg px-4 py-3 text-sm flex items-center justify-between ${form.type === "credit" ? "bg-emerald-50" : "bg-red-50"}`}>
              <span className={form.type === "credit" ? "text-emerald-700" : "text-red-600"}>{form.type === "credit" ? "Adding Credit" : "Adding Debit"}</span>
              <span className={`font-mono font-bold ${form.type === "credit" ? "text-emerald-700" : "text-red-600"}`}>{form.type === "credit" ? "+" : "-"}₹{parseFloat(form.amount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={() => { setShowForm(false); setForm((f: any) => ({ ...f, document: null })); }} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={addTransaction} disabled={!form.description || !form.amount} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: activeAccount.color }}>Save Entry</button>
        </div>
      </div>
    </div>
  );
}
