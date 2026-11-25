import { useState } from "react";
import { X, Receipt, ArrowRightLeft, CreditCard, ShoppingBag, PlusCircle } from "lucide-react";
import type { Account, Program, Ledger, VoucherType } from "../../types";
import { formatLocalDate } from "../../types";

export function VoucherModal({
  show,
  onClose,
  accounts,
  programs = [],
  ledgers = [],
  onAddVoucher,
  onAddLedger,
}: {
  show: boolean;
  onClose: () => void;
  accounts: Account[];
  programs?: Program[];
  ledgers?: Ledger[];
  onAddVoucher: (data: {
    type: VoucherType;
    ledgerId: number;
    accountId?: string | number | null;
    date: string;
    itemName?: string;
    amount: number;
    note?: string;
    programId?: number | null;
    paidNow?: number;
  }) => Promise<any>;
  onAddLedger?: (data: { name: string; type: "vendor" | "customer" }) => Promise<any>;
}) {
  const [type, setType] = useState<VoucherType>("purchase");
  const [ledgerId, setLedgerId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [date, setDate] = useState<string>(formatLocalDate());
  const [itemName, setItemName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [programId, setProgramId] = useState<string>("");

  const [payImmediate, setPayImmediate] = useState<boolean>(false);
  const [paidNow, setPaidNow] = useState<string>("");

  const [showQuickAddLedger, setShowQuickAddLedger] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState("");
  const [newLedgerType, setNewLedgerType] = useState<"vendor" | "customer">("vendor");

  if (!show) return null;

  // Filter ledgers by chosen type
  const targetType = type === "purchase" || type === "payment" ? "vendor" : "customer";
  const filteredLedgers = ledgers.filter(l => l.type === targetType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerId) return;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    if ((type === "payment" || type === "receipt") && !accountId) return;

    const numericPaidNow = (payImmediate && (type === "purchase" || type === "sale")) ? parseFloat(paidNow) || 0 : undefined;
    if (numericPaidNow && numericPaidNow > 0 && !accountId) return;

    const res = await onAddVoucher({
      type,
      ledgerId: Number(ledgerId),
      accountId: accountId ? accountId : null,
      date,
      itemName: (type === "purchase" || type === "sale") ? itemName : undefined,
      amount: numericAmount,
      note: note.trim() || undefined,
      programId: programId ? Number(programId) : null,
      paidNow: numericPaidNow,
    });

    if (res) {
      setItemName("");
      setAmount("");
      setNote("");
      setPayImmediate(false);
      setPaidNow("");
      onClose();
    }
  };

  const handleQuickAddLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLedgerName.trim() || !onAddLedger) return;
    const l = await onAddLedger({ name: newLedgerName.trim(), type: newLedgerType });
    if (l) {
      setLedgerId(String(l.id));
      setShowQuickAddLedger(false);
      setNewLedgerName("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base">New Voucher Entry</h3>
              <p className="text-xs text-white/70">Record Purchase, Sale, Payment or Receipt</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* 4-Way Type Toggle */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Voucher Type
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType("purchase");
                  setLedgerId("");
                  setPayImmediate(false);
                  setPaidNow("");
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  type === "purchase" ? "bg-amber-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ShoppingBag size={13} /> Purchase
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("sale");
                  setLedgerId("");
                  setPayImmediate(false);
                  setPaidNow("");
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  type === "sale" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowRightLeft size={13} /> Sale
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("payment");
                  setLedgerId("");
                  setPayImmediate(false);
                  setPaidNow("");
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  type === "payment" ? "bg-rose-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CreditCard size={13} /> Payment
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("receipt");
                  setLedgerId("");
                  setPayImmediate(false);
                  setPaidNow("");
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  type === "receipt" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Receipt size={13} /> Receipt
              </button>
            </div>
          </div>

          {/* Ledger Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Select {targetType === "vendor" ? "Vendor" : "Customer"} Ledger
              </label>
              {onAddLedger && (
                <button
                  type="button"
                  onClick={() => {
                    setNewLedgerType(targetType);
                    setShowQuickAddLedger(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <PlusCircle size={13} /> Add New {targetType === "vendor" ? "Vendor" : "Customer"}
                </button>
              )}
            </div>

            {showQuickAddLedger ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  placeholder={`New ${targetType} Name...`}
                  value={newLedgerName}
                  onChange={e => setNewLedgerName(e.target.value)}
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleQuickAddLedgerSubmit}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickAddLedger(false)}
                  className="px-2 py-2 text-gray-500 hover:text-gray-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                required
                value={ledgerId}
                onChange={e => setLedgerId(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background"
              >
                <option value="">-- Select {targetType === "vendor" ? "Vendor" : "Customer"} --</option>
                {filteredLedgers.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type.toUpperCase()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Account Picker for Standalone Payment & Receipt */}
          {(type === "payment" || type === "receipt") && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
              <label className="text-xs font-bold text-rose-900 block">
                {type === "payment" ? "Pay From Account (Bank / Cash)" : "Receive Into Account (Bank / Cash)"}
              </label>
              <select
                required
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full border border-rose-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
              >
                <option value="">-- Select Account --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type.toUpperCase()})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-rose-700 italic">
                * Note: Creating a {type} voucher will automatically update the selected bank/cash account balance and add a transaction entry.
              </p>
            </div>
          )}

          {/* Date & Amount Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  if (payImmediate && !paidNow) setPaidNow(e.target.value);
                }}
                className="w-full border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background"
              />
            </div>
          </div>

          {/* Item Name (for Purchase & Sale) */}
          {(type === "purchase" || type === "sale") && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Item / Goods Description
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Raw Material / Finished Goods..."
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background"
              />
            </div>
          )}

          {/* Pay / Receive Part or Full Amount Now Checkbox for Purchase & Sale */}
          {type === "purchase" && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900 select-none">
                <input
                  type="checkbox"
                  checked={payImmediate}
                  onChange={e => {
                    setPayImmediate(e.target.checked);
                    if (e.target.checked && !paidNow) setPaidNow(amount);
                  }}
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                Pay part/full amount now
              </label>

              {payImmediate && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-amber-900 block mb-1">PAID NOW (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required={payImmediate}
                      min="0.01"
                      placeholder="0.00"
                      value={paidNow}
                      onChange={e => setPaidNow(e.target.value)}
                      className="w-full border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-amber-900 block mb-1">PAY FROM (Bank/Cash)</label>
                    <select
                      required={payImmediate}
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">-- Select Account --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "sale" && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-900 select-none">
                <input
                  type="checkbox"
                  checked={payImmediate}
                  onChange={e => {
                    setPayImmediate(e.target.checked);
                    if (e.target.checked && !paidNow) setPaidNow(amount);
                  }}
                  className="rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                Receive part/full amount now
              </label>

              {payImmediate && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-indigo-900 block mb-1">RECEIVED NOW (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required={payImmediate}
                      min="0.01"
                      placeholder="0.00"
                      value={paidNow}
                      onChange={e => setPaidNow(e.target.value)}
                      className="w-full border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-indigo-900 block mb-1">RECEIVE INTO (Bank/Cash)</label>
                    <select
                      required={payImmediate}
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="">-- Select Account --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Program Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Program Tag (Optional)
            </label>
            <select
              value={programId}
              onChange={e => setProgramId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background"
            >
              <option value="">-- No Program Tag --</option>
              {programs.map(prog => (
                <option key={prog.id} value={prog.id}>
                  {prog.name}
                </option>
              ))}
            </select>
          </div>

          {/* Note / Memo */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Note / Reference Info
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #1024, Cash memo..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Save {type.toUpperCase()} Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
