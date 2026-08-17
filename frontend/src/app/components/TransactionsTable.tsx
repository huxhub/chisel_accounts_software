import { useState, useEffect, useMemo } from "react";
import { Image, FileText, Trash2, Edit3, BarChart3, Tag, Search, Filter, X } from "lucide-react";
import type { Account, AttachedDoc, Program } from "../types";
import { fmt, calcBalance, calcTotalCredit } from "../types";
import { Pagination } from "./ui/pagination";

export function TransactionsTable({
  activeAccount,
  normalTransactions,
  txRunningBalances,
  onViewDoc,
  onDeleteTransaction,
  onEditTransaction,
  programs = [],
}: {
  activeAccount: Account;
  normalTransactions: any[];
  txRunningBalances: Record<string, number>;
  onViewDoc: (doc: AttachedDoc) => void;
  onDeleteTransaction: (txId: string) => void;
  onEditTransaction?: (tx: any) => void;
  programs?: Program[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [programFilter, setProgramFilter] = useState("");

  const pageSize = 10;

  const hasFilters = Boolean(searchQuery || typeFilter !== "all" || programFilter);

  const filteredTransactions = useMemo(() => {
    return normalTransactions.filter((tx: any) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (programFilter && String(tx.programId) !== String(programFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description?.toLowerCase().includes(q);
        const matchRef = tx.reference?.toLowerCase().includes(q);
        const matchProg = tx.programName?.toLowerCase().includes(q);
        const matchAmt = String(tx.amount).includes(q);
        const matchDate = tx.date?.includes(q);
        if (!matchDesc && !matchRef && !matchProg && !matchAmt && !matchDate) return false;
      }
      return true;
    });
  }, [normalTransactions, searchQuery, typeFilter, programFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeAccount.id, filteredTransactions.length, searchQuery, typeFilter, programFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const reversedTxs = [...filteredTransactions].reverse();
  const paginatedTxs = reversedTxs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden space-y-0">
      {/* Header & Filter Bar */}
      <div className="px-5 py-3 border-b border-border space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-500" />
            <h3 className="font-semibold text-sm text-foreground">Transactions — {activeAccount.name}</h3>
          </div>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                onClick={() => { setSearchQuery(""); setTypeFilter("all"); setProgramFilter(""); }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <X size={13} /> Clear Filters
              </button>
            )}
            <span className="text-xs text-muted-foreground font-mono font-medium">
              {filteredTransactions.length} {hasFilters ? "matching" : "entries"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search description, ref, date, amount..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          >
            <option value="all">All Transaction Types</option>
            <option value="credit">Credit Only (+)</option>
            <option value="debit">Debit Only (-)</option>
          </select>
          {programs.length > 0 ? (
            <select
              value={programFilter}
              onChange={e => setProgramFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
            >
              <option value="">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <div />
          )}
        </div>
      </div>

      {normalTransactions.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
          <p>No entries yet</p>
          <p className="text-xs mt-1">Click "Add Entry" above to get started</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          <Search size={28} className="mx-auto mb-2 opacity-30" />
          <p>No transactions match your search/filter criteria.</p>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden flex flex-col divide-y divide-border/60">
            {currentPage === 1 && (
              <div className="px-5 py-3 bg-blue-50/30 flex justify-between items-center">
                <span className="text-sm font-semibold text-muted-foreground">Opening Balance</span>
                <span className="font-mono font-bold text-sm text-foreground">{fmt(activeAccount.openingBalance)}</span>
              </div>
            )}

            {paginatedTxs.map((tx: any) => (
              <div key={tx.id} className="p-5 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{tx.description}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">{tx.date.split("-").reverse().join("/")}</span>
                      {tx.programName && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1">
                          <Tag size={10} /> {tx.programName}
                        </span>
                      )}
                      {tx.reference && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">Ref: {tx.reference}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {tx.type === "credit" ? (
                      <div className="font-mono font-bold text-emerald-600">+{fmt(tx.amount)}</div>
                    ) : (
                      <div className="font-mono font-bold text-red-500">-{fmt(tx.amount)}</div>
                    )}
                    <div className={`text-[11px] font-mono mt-1 ${txRunningBalances[tx.id] < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      Bal: {fmt(txRunningBalances[tx.id])}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/40">
                  {tx.document?.name ? (
                    <button onClick={() => onViewDoc(tx.document!)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                      {tx.document.mimeType?.startsWith("image/") ? <Image size={14} /> : <FileText size={14} />}
                      <span className="text-xs font-medium max-w-[150px] truncate">{tx.document.name}</span>
                    </button>
                  ) : <div />}
                  <div className="flex items-center gap-1 ml-auto">
                    {onEditTransaction && (
                      <button onClick={() => onEditTransaction(tx)} className="p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-md transition-colors" title="Edit Entry">
                        <Edit3 size={15} />
                      </button>
                    )}
                    <button onClick={() => onDeleteTransaction(tx.id)} className="p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded-md transition-colors" title="Delete Entry">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="px-5 py-4 flex justify-between items-center" style={{ backgroundColor: activeAccount.bgColor }}>
              <span className="text-sm font-bold" style={{ color: activeAccount.color }}>Closing Balance</span>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-600 mb-0.5">Credit: +{fmt(calcTotalCredit(activeAccount))}</div>
                <div className="text-base font-mono font-bold" style={{ color: calcBalance(activeAccount) < 0 ? "#dc2626" : activeAccount.color }}>
                  {fmt(calcBalance(activeAccount))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-center font-semibold w-16">Sl. No.</th>
                  <th className="px-4 py-3 text-left font-semibold w-24">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold w-32">Program</th>
                  <th className="px-4 py-3 text-left font-semibold w-24">Ref. No.</th>
                  <th className="px-4 py-3 text-center font-semibold w-20">Doc</th>
                  <th className="px-4 py-3 text-right font-semibold w-32">Credit (₹)</th>
                  <th className="px-4 py-3 text-right font-semibold w-32">Debit (₹)</th>
                  <th className="px-4 py-3 text-right font-semibold w-36">Balance (₹)</th>
                  <th className="px-4 py-3 text-center w-16"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-50/50 border-b border-border">
                  <td className="px-4 py-2 text-center font-mono text-xs text-muted-foreground">—</td>
                  <td colSpan={7} className="px-4 py-2 text-xs text-muted-foreground font-semibold">Opening Balance</td>
                  <td className="px-4 py-2 text-right font-mono text-xs font-bold text-foreground">{fmt(activeAccount.openingBalance)}</td>
                  <td></td>
                </tr>

                {paginatedTxs.map((tx: any, idx: number) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={tx.id} className="border-b border-border/60 hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{globalIdx}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.date.split("-").reverse().join("/")}</td>
                      <td className="px-4 py-3 text-foreground">
                        <div className="font-medium">{tx.description}</div>
                        {(tx.relatedItemName || tx.exchangeType || tx.dueDate) && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {tx.relatedItemName && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                {tx.relatedItemName}
                              </span>
                            )}
                            {tx.exchangeType && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{tx.exchangeType}</span>
                            )}
                            {tx.dueDate && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">Due: {tx.dueDate.split("-").reverse().join("/")}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tx.programName ? (
                          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded inline-flex items-center gap-1">
                            <Tag size={12} /> {tx.programName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.reference || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {tx.document?.name ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => onViewDoc(tx.document!)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors" title={tx.document.name}>
                              {tx.document.mimeType?.startsWith("image/") ? <Image size={12} /> : <FileText size={12} />}
                              <span className="text-[10px] font-medium max-w-[60px] truncate">{tx.document.name?.split(".")[0]}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{tx.type === "credit" && tx.amount > 0 ? <span className="text-emerald-600 font-semibold">{fmt(tx.amount)}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                      <td className="px-4 py-3 text-right font-mono">{tx.type === "debit" && tx.amount > 0 ? <span className="text-red-500 font-semibold">{fmt(tx.amount)}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold text-xs ${txRunningBalances[tx.id] < 0 ? "text-red-500" : "text-foreground"}`}>{fmt(txRunningBalances[tx.id])}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onEditTransaction && (
                            <button onClick={() => onEditTransaction(tx)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all" title="Edit Entry">
                              <Edit3 size={13} />
                            </button>
                          )}
                          <button onClick={() => onDeleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all" title="Delete Entry">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                <tr style={{ backgroundColor: activeAccount.bgColor }}>
                  <td colSpan={7} className="px-4 py-3 text-xs font-bold" style={{ color: activeAccount.color }}>Closing Balance</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600">+{fmt(calcTotalCredit(activeAccount))}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold" style={{ color: calcBalance(activeAccount) < 0 ? "#dc2626" : activeAccount.color }}>
                    {fmt(calcBalance(activeAccount))}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={normalTransactions.length}
            pageSize={pageSize}
          />
        </>
      )}
    </div>
  );
}
