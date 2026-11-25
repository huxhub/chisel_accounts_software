import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Plus, Trash2, Calendar, FileText, Download, Search, X, Filter } from "lucide-react";
import { ledgerService } from "../../services/ledgerService";
import type { LedgerStatement } from "../types";
import { fmt } from "../types";
import { toast } from "sonner";
import { Pagination } from "./ui/pagination";

export function LedgerStatementView({
  ledgerId,
  onBack,
  onOpenNewVoucher,
}: {
  ledgerId: number;
  onBack: () => void;
  onOpenNewVoucher: () => void;
}) {
  const [statement, setStatement] = useState<LedgerStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ledgerService.getStatement(ledgerId);
      setStatement(data);
    } catch (error) {
      toast.error("Failed to load ledger statement");
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handleDeleteVoucher = async (voucherId: number) => {
    if (!confirm("Are you sure you want to delete this voucher entry?")) return;
    try {
      await ledgerService.deleteVoucher(voucherId);
      toast.success("Voucher deleted");
      fetchStatement();
    } catch (error) {
      toast.error("Failed to delete voucher");
    }
  };

  const { ledger, summary, rows = [] } = statement || {};

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchItem = row.itemName?.toLowerCase().includes(q);
        const matchNote = row.note?.toLowerCase().includes(q);
        const matchRef = row.reference?.toLowerCase().includes(q);
        const matchAcc = row.accountName?.toLowerCase().includes(q);
        const matchAmt = String(row.amount).includes(q);
        const matchDate = row.date?.includes(q);
        if (!matchItem && !matchNote && !matchRef && !matchAcc && !matchAmt && !matchDate) return false;
      }
      return true;
    });
  }, [rows, searchQuery, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [ledgerId, searchQuery, typeFilter, filteredRows.length]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!statement || !ledger || !summary) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Ledger statement not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-primary text-white text-xs rounded-lg">
          Back to Ledgers
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{ledger.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                ledger.type === "vendor" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
              }`}>
                {ledger.type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ledger Statement & Account History
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewVoucher}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:opacity-90 transition-all"
          >
            <Plus size={16} /> Add Voucher Entry
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Opening Balance</div>
          <div className="text-xl font-bold text-foreground mt-2 font-mono">
            ₹{fmt(summary.openingBalance)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total Debit (Dr)</div>
          <div className="text-xl font-bold text-emerald-600 mt-2 font-mono">
            ₹{fmt(summary.totalDebit)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Total Credit (Cr)</div>
          <div className="text-xl font-bold text-rose-600 mt-2 font-mono">
            ₹{fmt(summary.totalCredit)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <div className="text-xs font-semibold text-primary uppercase tracking-wide">Closing Balance</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-bold text-primary font-mono">
              ₹{fmt(Math.abs(summary.closingBalance))}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
              summary.closingBalance < 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : ledger.type === "vendor"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}>
              {summary.closingBalance < 0 ? (ledger.type === "vendor" ? "Dr" : "Cr") : (ledger.type === "vendor" ? "Cr" : "Dr")}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Search & Filter Header */}
        <div className="px-6 py-4 border-b border-border bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Statement Entries ({filteredRows.length})
            </h2>
            {(searchQuery || typeFilter !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 ml-2 transition-colors"
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search item name, note, ref..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 w-48 sm:w-60"
              />
            </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
            >
              <option value="all">All Voucher Types</option>
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
              <option value="payment">Payment</option>
              <option value="receipt">Receipt</option>
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-3">
            <Calendar size={32} className="mx-auto text-muted-foreground/40" />
            <p>No voucher transactions recorded for this ledger yet.</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-3">
            <Search size={28} className="mx-auto text-muted-foreground/40" />
            <p>No statement entries match your search/filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-4 text-center">Date</th>
                  <th className="py-3.5 px-4">Description / Item</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-center">Ref No / Account</th>
                  <th className="py-3.5 px-4 text-right text-emerald-700">Debit (Dr ₹)</th>
                  <th className="py-3.5 px-4 text-right text-rose-700">Credit (Cr ₹)</th>
                  <th className="py-3.5 px-4 text-right font-bold text-primary">Balance (₹)</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors font-medium">
                    <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                      {row.date.split("-").reverse().join("/")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{row.itemName || row.type.toUpperCase()}</div>
                      {row.note && <div className="text-[11px] text-muted-foreground">{row.note}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        row.type === "purchase" ? "bg-amber-100 text-amber-800" :
                        row.type === "sale" ? "bg-indigo-100 text-indigo-800" :
                        row.type === "payment" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[11px]">
                      {row.reference ? <span className="font-bold text-indigo-600">{row.reference}</span> : row.accountName || "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                      {row.debit > 0 ? `₹${fmt(row.debit)}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold">
                      {row.credit > 0 ? `₹${fmt(row.credit)}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>₹{fmt(Math.abs(row.runningBalance))}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          row.runningBalance < 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : ledger.type === "vendor"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}>
                          {row.runningBalance < 0 ? (ledger.type === "vendor" ? "Dr" : "Cr") : (ledger.type === "vendor" ? "Cr" : "Dr")}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteVoucher(row.id)}
                        className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Voucher"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredRows.length / pageSize)}
          onPageChange={setCurrentPage}
          totalItems={filteredRows.length}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
