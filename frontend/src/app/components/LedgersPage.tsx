import { useState } from "react";
import { Users, ShoppingBag, ArrowRightLeft, Plus, Search, Trash2, ChevronRight, BookOpen, CreditCard, Receipt, X } from "lucide-react";
import type { Ledger, Account, Program } from "../types";
import { fmt } from "../types";
import { LedgerStatementView } from "./LedgerStatementView";

export function LedgersPage({
  ledgers = [],
  accounts = [],
  programs = [],
  onAddLedger,
  onDeleteLedger,
  onAddVoucher,
  onOpenVoucherModal,
}: {
  ledgers?: Ledger[];
  accounts?: Account[];
  programs?: Program[];
  onAddLedger: (data: { name: string; type: "vendor" | "customer"; openingBalance?: number }) => Promise<any>;
  onDeleteLedger: (id: number) => Promise<boolean>;
  onAddVoucher: (data: any) => Promise<any>;
  onOpenVoucherModal: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"vendor" | "customer">("vendor");
  const [search, setSearch] = useState("");
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOpeningBal, setNewOpeningBal] = useState("");

  if (selectedLedgerId !== null) {
    return (
      <LedgerStatementView
        ledgerId={selectedLedgerId}
        onBack={() => setSelectedLedgerId(null)}
        onOpenNewVoucher={onOpenVoucherModal}
      />
    );
  }

  const currentLedgers = ledgers.filter(l => l.type === activeTab);
  const filteredLedgers = currentLedgers.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  // Tab stats
  const totalCount = currentLedgers.length;
  const grandPurchases = currentLedgers.reduce((s, l) => s + (l.totalPurchased || 0), 0);
  const grandPaid = currentLedgers.reduce((s, l) => s + (l.totalPaid || 0), 0);
  const grandSales = currentLedgers.reduce((s, l) => s + (l.totalSold || 0), 0);
  const grandReceived = currentLedgers.reduce((s, l) => s + (l.totalReceived || 0), 0);
  const grandBalanceDue = currentLedgers.reduce((s, l) => s + (l.balanceDue || 0), 0);

  const handleCreateLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await onAddLedger({
      name: newName.trim(),
      type: activeTab,
      openingBalance: parseFloat(newOpeningBal) || 0,
    });
    if (res) {
      setNewName("");
      setNewOpeningBal("");
      setShowAddModal(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 shadow-sm border border-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ledger Accounts</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vendor & Customer Double-Entry Ledgers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenVoucherModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all"
          >
            <Plus size={16} /> New Voucher Entry
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:opacity-90 transition-all"
          >
            <Plus size={16} /> Add {activeTab === "vendor" ? "Vendor" : "Customer"}
          </button>
        </div>
      </div>

      {/* Tabs & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-200/70 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("vendor")}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "vendor" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag size={14} /> Vendors ({ledgers.filter(l => l.type === "vendor").length})
          </button>

          <button
            onClick={() => setActiveTab("customer")}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "customer" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={14} /> Customers ({ledgers.filter(l => l.type === "customer").length})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${activeTab === "vendor" ? "vendors" : "customers"}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 [&>div]:min-w-0 [&>div]:rounded-xl [&>div]:p-3.5 sm:[&>div]:rounded-2xl sm:[&>div]:p-5 [&>div_.font-mono]:whitespace-nowrap [&>div_.font-mono]:text-base sm:[&>div_.font-mono]:text-2xl">
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Total {activeTab === "vendor" ? "Vendors" : "Customers"}
          </div>
          <div className="text-2xl font-bold text-foreground mt-1.5 font-mono">{totalCount}</div>
        </div>

        {activeTab === "vendor" ? (
          <>
            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Total Purchases</div>
              <div className="text-2xl font-bold text-amber-700 mt-1.5 font-mono">₹{fmt(grandPurchases)}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total Paid</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1.5 font-mono">₹{fmt(grandPaid)}</div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
              <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Total Sales</div>
              <div className="text-2xl font-bold text-indigo-700 mt-1.5 font-mono">₹{fmt(grandSales)}</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total Received</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1.5 font-mono">₹{fmt(grandReceived)}</div>
            </div>
          </>
        )}

        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Total Net Balance Due</div>
          <div className="text-2xl font-bold text-rose-700 mt-1.5 font-mono">₹{fmt(grandBalanceDue)}</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {filteredLedgers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-3">
            <BookOpen size={36} className="mx-auto text-muted-foreground/30" />
            <p>No {activeTab === "vendor" ? "vendors" : "customers"} found. Click above to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-6">{activeTab === "vendor" ? "Vendor Name" : "Customer Name"}</th>
                  {activeTab === "vendor" ? (
                    <>
                      <th className="py-3.5 px-6 text-right text-amber-800">Total Purchased (₹)</th>
                      <th className="py-3.5 px-6 text-right text-emerald-800">Total Paid (₹)</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3.5 px-6 text-right text-indigo-800">Total Sold (₹)</th>
                      <th className="py-3.5 px-6 text-right text-emerald-800">Total Received (₹)</th>
                    </>
                  )}
                  <th className="py-3.5 px-6 text-right font-bold text-rose-800">Balance Due (₹)</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLedgers.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedLedgerId(l.id)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors font-medium group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          l.type === "vendor" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
                        }`}>
                          {l.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {l.name}
                          </div>
                          {l.openingBalance > 0 && (
                            <div className="text-[11px] text-muted-foreground">
                              Opening: ₹{fmt(l.openingBalance)} ({l.openingType})
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {activeTab === "vendor" ? (
                      <>
                        <td className="py-4 px-6 text-right font-mono text-amber-700 font-bold">
                          ₹{fmt(l.totalPurchased || 0)}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-emerald-600 font-bold">
                          ₹{fmt(l.totalPaid || 0)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6 text-right font-mono text-indigo-700 font-bold">
                          ₹{fmt(l.totalSold || 0)}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-emerald-600 font-bold">
                          ₹{fmt(l.totalReceived || 0)}
                        </td>
                      </>
                    )}

                    <td className="py-4 px-6 text-right font-mono font-bold text-sm">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={l.balanceDue < 0 ? "text-emerald-600" : l.type === "vendor" ? "text-rose-700" : "text-indigo-700"}>
                          ₹{fmt(Math.abs(l.balanceDue))}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          l.balanceDue < 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : l.type === "vendor"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}>
                          {l.balanceDue < 0 ? (l.type === "vendor" ? "Dr" : "Cr") : (l.type === "vendor" ? "Cr" : "Dr")}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedLedgerId(l.id)}
                          className="px-3 py-1.5 bg-gray-100 text-foreground hover:bg-primary hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          Statement <ChevronRight size={13} />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete ${l.name}? This will remove all associated vouchers.`)) {
                              await onDeleteLedger(l.id);
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Ledger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Ledger Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary text-white">
              <h3 className="font-bold text-base">Add New {activeTab === "vendor" ? "Vendor" : "Customer"}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLedgerSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  {activeTab === "vendor" ? "Vendor" : "Customer"} Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp / John Doe..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  Opening Balance (₹, Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newOpeningBal}
                  onChange={e => setNewOpeningBal(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90"
                >
                  Create {activeTab === "vendor" ? "Vendor" : "Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
