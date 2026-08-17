import { useState, useEffect } from "react";
import { X, ShoppingCart, Plus, Trash2 } from "lucide-react";
import type { Vendor, VendorEntry } from "../../types";
import { today } from "../../types";

// ─── Manage Vendors Modal (like ProgramModal) ────────────────────────────────
export function ManageVendorsModal({
  show,
  onClose,
  vendors,
  onAddVendor,
  onDeleteVendor,
}: {
  show: boolean;
  onClose: () => void;
  vendors: Vendor[];
  onAddVendor: (name: string) => Promise<boolean>;
  onDeleteVendor: (id: number) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!show) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const ok = await onAddVendor(name.trim());
    setSubmitting(false);
    if (ok) setName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manage Vendors</h3>
              <p className="text-xs text-white/70">Add and organize vendor / supplier list</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/15">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Plus size={14} /> Add New Vendor
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Vendor / Supplier name..."
                className="flex-1 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              />
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0"
              >
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              <span>Existing Vendors</span>
              <span className="font-mono">{vendors.length} Total</span>
            </div>

            {vendors.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No vendors added yet. Add one above to start tracking purchases & sales.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                {vendors.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={14} className="text-primary/70" />
                      <span className="text-sm font-semibold text-slate-800">{v.name}</span>
                      <span className="text-[10px] text-slate-400">({v.VendorEntries?.length || 0} entries)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteVendor(v.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                      title="Delete Vendor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Entry Modal (purchase or sale for a vendor) ─────────────────────────

type EntryForm = Omit<VendorEntry, "id" | "vendorId" | "createdAt">;

const EMPTY: EntryForm = {
  type: "purchase",
  itemName: "",
  amount: 0,
  party: "",
  date: today,
  note: "",
};

export function VendorEntryModal({
  show,
  onClose,
  onSubmit,
  vendors,
  selectedVendorId,
}: {
  show: boolean;
  onClose: () => void;
  onSubmit: (vendorId: number, entry: EntryForm) => Promise<boolean>;
  vendors: Vendor[];
  selectedVendorId?: number | string;
}) {
  const [form, setForm] = useState<EntryForm>(EMPTY);
  const [targetVendorId, setTargetVendorId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      const numId = Number(selectedVendorId);
      if (selectedVendorId && !isNaN(numId) && numId > 0) {
        setTargetVendorId(numId);
      } else if (vendors.length > 0) {
        setTargetVendorId(vendors[0].id);
      } else {
        setTargetVendorId("");
      }
    }
  }, [show, selectedVendorId, vendors]);

  if (!show) return null;

  const set = (k: keyof EntryForm, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVendorId || !form.itemName.trim() || !form.party.trim() || !form.amount || !form.date) return;
    setSubmitting(true);
    const ok = await onSubmit(Number(targetVendorId), { ...form, amount: Number(form.amount) });
    setSubmitting(false);
    if (ok) {
      setForm(EMPTY);
      onClose();
    }
  };

  const isPurchase = form.type === "purchase";
  const activeVendor = vendors.find(v => v.id === Number(targetVendorId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Add Vendor Entry</h3>
              <p className="text-xs text-white/70">Record purchase or sale</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/15">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target Vendor Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Vendor</label>
            <select
              value={targetVendorId}
              onChange={e => setTargetVendorId(Number(e.target.value))}
              required
              className="mt-1 w-full border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white font-semibold text-slate-800"
            >
              {vendors.length === 0 ? (
                <option value="">No vendors available</option>
              ) : (
                vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Type toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => set("type", "purchase")}
              className={`flex-1 py-2 text-sm font-bold transition-all ${isPurchase ? "bg-red-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
            >
              🛒 Purchase (Buy)
            </button>
            <button
              type="button"
              onClick={() => set("type", "sale")}
              className={`flex-1 py-2 text-sm font-bold transition-all ${!isPurchase ? "bg-green-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
            >
              📦 Sale (Sell)
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} required className="mt-1 w-full border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Item Name</label>
            <input type="text" value={form.itemName} onChange={e => set("itemName", e.target.value)} placeholder="e.g. Cement bags, Steel rods..." required className="mt-1 w-full border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Amount (₹)</label>
            <input type="number" min="0" step="0.01" value={form.amount || ""} onChange={e => set("amount", e.target.value)} placeholder="0.00" required className="mt-1 w-full border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {isPurchase ? "Bought From (Person / Supplier)" : "Sold To (Person / Buyer)"}
            </label>
            <input type="text" value={form.party} onChange={e => set("party", e.target.value)} placeholder={isPurchase ? "Supplier name..." : "Buyer name..."} required className="mt-1 w-full border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Note (optional)</label>
            <input type="text" value={form.note ?? ""} onChange={e => set("note", e.target.value)} placeholder="Any additional detail..." className="mt-1 w-full border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting || !targetVendorId} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-all">
              {submitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
