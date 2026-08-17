import { useMemo, useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Scale, Activity, Filter, X, Calendar,
  ChevronDown, ChevronUp, Building2, Landmark, CreditCard, Wallet, FileText, Image, Tag,
} from "lucide-react";
import { useHistory } from "../hooks/useHistory";
import type { AccountSummary } from "../hooks/useHistory";
import { fmt, fmtSign } from "../types";
import type { Account, AttachedDoc, Program } from "../types";
import { HistorySkeleton } from "./HistorySkeleton";
import { Pagination } from "./ui/pagination";

const PRESETS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "this_quarter", label: "This Quarter" },
  { key: "this_year", label: "This Year" },
] as const;

function AccountIcon({ type }: { type: string }) {
  if (type === "overdraft") return <CreditCard size={14} />;
  if (type === "bank") return <Landmark size={14} />;
  if (type === "cash") return <Wallet size={14} />;
  return <Building2 size={14} />;
}

export function HistoryPage({ accounts, programs = [], onViewDoc }: { accounts: Account[]; programs?: Program[]; onViewDoc?: (doc: AttachedDoc) => void }) {
  const { filters, updateFilter, clearFilters, transactions, summary, loading } = useHistory();
  const [showPL, setShowPL] = useState(true);
  const [showBS, setShowBS] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length, filters]);

  const totalPages = Math.ceil(transactions.length / pageSize);
  const paginatedTxs = transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActiveFilters = filters.accountId || filters.type || filters.programId || filters.startDate || filters.endDate || filters.month || (filters.preset !== "all");

  // Balance sheet splits
  const { assets, liabilities } = useMemo(() => {
    const a: AccountSummary[] = [];
    const l: AccountSummary[] = [];
    (summary.byAccount || []).forEach(acc => {
      if (acc.type === "overdraft" || acc.balance < 0) l.push(acc);
      else a.push(acc);
    });
    return { assets: a, liabilities: l };
  }, [summary.byAccount]);

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = Math.abs(liabilities.reduce((s, a) => s + a.balance, 0));
  const netWorth = totalAssets - totalLiabilities;

  // P&L splits
  const incomeAccounts = useMemo(() =>
    (summary.byAccount || []).filter(a => a.credits > 0).sort((a, b) => b.credits - a.credits),
    [summary.byAccount]
  );
  const expenseAccounts = useMemo(() =>
    (summary.byAccount || []).filter(a => a.debits > 0).sort((a, b) => b.debits - a.debits),
    [summary.byAccount]
  );

  if (loading) return <HistorySkeleton />;

  return (
    <div className="p-6 space-y-7 sm:space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transaction Summary</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete transaction summary across all accounts
          </p>
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors font-medium">
              <X size={12} /> Clear all
            </button>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => updateFilter("preset", p.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filters.preset === p.key
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Filters */}
        <div className="flex flex-wrap gap-3.5 sm:gap-4 items-center pt-1">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground shrink-0" />
            <input
              type="date"
              value={filters.startDate}
              onChange={e => updateFilter("startDate", e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none transition-all"
              placeholder="Start date"
            />
            <span className="text-xs text-muted-foreground font-medium px-0.5">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => updateFilter("endDate", e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none transition-all"
              placeholder="End date"
            />
          </div>

          <input
            type="month"
            value={filters.month}
            onChange={e => updateFilter("month", e.target.value)}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none transition-all"
            placeholder="Month"
          />

          <select
            value={filters.accountId}
            onChange={e => updateFilter("accountId", e.target.value)}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none transition-all min-w-[140px]"
          >
            <option value="">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={e => updateFilter("type", e.target.value)}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none transition-all min-w-[120px]"
          >
            <option value="">All Types</option>
            <option value="credit">Credits Only</option>
            <option value="debit">Debits Only</option>
          </select>

          <select
            value={filters.programId}
            onChange={e => updateFilter("programId", e.target.value)}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none transition-all min-w-[140px]"
          >
            <option value="">All Programs</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {[
          { label: "Profit", value: `+${fmtSign(summary.totalCredits > summary.totalDebits ? summary.totalCredits - summary.totalDebits : 0)}`, icon: TrendingUp, bg: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-emerald-100", valueColor: "text-emerald-700" },
          { label: "Loss", value: `-${fmtSign(summary.totalDebits > summary.totalCredits ? summary.totalDebits - summary.totalCredits : 0)}`, icon: TrendingDown, bg: "bg-red-50", iconColor: "text-red-500", border: "border-red-100", valueColor: "text-red-600" },
          { label: "Total Credits", value: `+${fmtSign(summary.totalCredits)}`, icon: TrendingUp, bg: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-emerald-100", valueColor: "text-emerald-700" },
          { label: "Total Debits", value: `-${fmtSign(summary.totalDebits)}`, icon: TrendingDown, bg: "bg-red-50", iconColor: "text-red-500", border: "border-red-100", valueColor: "text-red-600" },
          { label: "Closing Balance", value: fmtSign(summary.totalClosingBalance), icon: Scale, bg: summary.totalClosingBalance >= 0 ? "bg-indigo-50" : "bg-red-50", iconColor: summary.totalClosingBalance >= 0 ? "text-indigo-600" : "text-red-500", border: summary.totalClosingBalance >= 0 ? "border-indigo-100" : "border-red-100", valueColor: summary.totalClosingBalance >= 0 ? "text-indigo-700" : "text-red-600" },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-xl sm:rounded-2xl border ${kpi.border} p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition-all`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon size={18} className={kpi.iconColor} />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 font-medium">{kpi.label}</div>
              <div className={`text-sm sm:text-lg font-mono font-bold leading-tight truncate ${kpi.valueColor}`}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* P&L + Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profit & Loss */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setShowPL(!showPL)}
            className="w-full px-5 py-4 border-b border-border flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" />
              <h3 className="font-semibold text-sm text-foreground">Profit & Loss Statement</h3>
            </div>
            {showPL ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>

          {showPL && (
            <div className="divide-y divide-border/60">
              {/* Income */}
              <div className="px-5 py-3">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                  Income (Credits)
                </div>
                {incomeAccounts.map(acc => (
                  <div key={acc.accountId} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${acc.color}15` }}>
                        <AccountIcon type={acc.type} />
                      </div>
                      <span className="text-xs text-foreground">{acc.name}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-emerald-600">+{fmt(acc.credits)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 mt-2 border-t border-border/40">
                  <span className="text-xs font-bold text-foreground">Total Income</span>
                  <span className="text-sm font-mono font-bold text-emerald-600">+{fmt(summary.totalCredits)}</span>
                </div>
              </div>

              {/* Expenses */}
              <div className="px-5 py-3">
                <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">
                  Expenses (Debits)
                </div>
                {expenseAccounts.map(acc => (
                  <div key={acc.accountId} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${acc.color}15` }}>
                        <AccountIcon type={acc.type} />
                      </div>
                      <span className="text-xs text-foreground">{acc.name}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-red-500">-{fmt(acc.debits)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 mt-2 border-t border-border/40">
                  <span className="text-xs font-bold text-foreground">Total Expenses</span>
                  <span className="text-sm font-mono font-bold text-red-500">-{fmt(summary.totalDebits)}</span>
                </div>
              </div>

              {/* Net */}
              <div className={`px-5 py-4 ${summary.netBalance >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">
                    Net {summary.netBalance >= 0 ? "Profit" : "Loss"}
                  </span>
                  <span className={`text-lg font-mono font-bold ${summary.netBalance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {fmtSign(summary.netBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Balance Sheet */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setShowBS(!showBS)}
            className="w-full px-5 py-4 border-b border-border flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-indigo-600" />
              <h3 className="font-semibold text-sm text-foreground">Balance Sheet</h3>
            </div>
            {showBS ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>

          {showBS && (
            <div className="divide-y divide-border/60">
              {/* Assets */}
              <div className="px-5 py-3">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                  Assets
                </div>
                {assets.map(acc => (
                  <div key={acc.accountId} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${acc.color}15` }}>
                        <AccountIcon type={acc.type} />
                      </div>
                      <span className="text-xs text-foreground">{acc.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">{acc.type}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-emerald-600">{fmt(acc.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 mt-2 border-t border-border/40">
                  <span className="text-xs font-bold text-foreground">Total Assets</span>
                  <span className="text-sm font-mono font-bold text-emerald-600">{fmt(totalAssets)}</span>
                </div>
              </div>

              {/* Liabilities */}
              <div className="px-5 py-3">
                <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">
                  Liabilities
                </div>
                {liabilities.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2">No liabilities</div>
                ) : (
                  liabilities.map(acc => (
                    <div key={acc.accountId} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${acc.color}15` }}>
                          <AccountIcon type={acc.type} />
                        </div>
                        <span className="text-xs text-foreground">{acc.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">{acc.type}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-red-500">{fmt(Math.abs(acc.balance))}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between pt-2 mt-2 border-t border-border/40">
                  <span className="text-xs font-bold text-foreground">Total Liabilities</span>
                  <span className="text-sm font-mono font-bold text-red-500">{fmt(totalLiabilities)}</span>
                </div>
              </div>

              {/* Net Worth */}
              <div className={`px-5 py-4 ${netWorth >= 0 ? "bg-indigo-50" : "bg-red-50"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Net Worth</span>
                  <span className={`text-lg font-mono font-bold ${netWorth >= 0 ? "text-indigo-700" : "text-red-600"}`}>
                    {fmtSign(netWorth)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Transaction History</h3>
          <span className="text-xs text-muted-foreground">{transactions.length} entries</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            <Activity size={32} className="mx-auto mb-3 opacity-30" />
            <p>No transactions found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden flex flex-col divide-y divide-border/60">
              {paginatedTxs.map((tx) => (
                <div key={tx.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{tx.description}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-white"
                          style={{ backgroundColor: tx.accountColor }}
                        >
                          {tx.accountName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {tx.date.split("-").reverse().join("/")}
                        </span>
                        {tx.reference && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">
                            Ref: {tx.reference}
                          </span>
                        )}
                        {tx.programName && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1">
                            <Tag size={10} /> {tx.programName}
                          </span>
                        )}
                        {tx.exchangeType && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                            {tx.exchangeType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-mono font-bold ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  {tx.document?.name && onViewDoc && (
                    <button
                      onClick={() => onViewDoc(tx.document!)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors self-start"
                    >
                      {tx.document.mimeType?.startsWith("image/") ? <Image size={14} /> : <FileText size={14} />}
                      <span className="text-xs font-medium max-w-[150px] truncate">{tx.document.name}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-3 text-center font-semibold w-14">Sl.</th>
                    <th className="px-4 py-3 text-left font-semibold w-24">Date</th>
                    <th className="px-4 py-3 text-left font-semibold w-36">Account</th>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                    <th className="px-4 py-3 text-left font-semibold w-32">Program</th>
                    <th className="px-4 py-3 text-left font-semibold w-24">Ref.</th>
                    <th className="px-4 py-3 text-center font-semibold w-16">Doc</th>
                    <th className="px-4 py-3 text-right font-semibold w-32">Credit (₹)</th>
                    <th className="px-4 py-3 text-right font-semibold w-32">Debit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTxs.map((tx, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={tx.id} className="border-b border-border/60 hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{globalIdx}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {tx.date.split("-").reverse().join("/")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-[10px] px-2 py-1 rounded font-semibold text-white inline-block"
                            style={{ backgroundColor: tx.accountColor }}
                          >
                            {tx.accountName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          <div className="font-medium">{tx.description}</div>
                          {(tx.exchangeType || tx.dueDate) && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {tx.exchangeType && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                                  {tx.exchangeType}
                                </span>
                              )}
                              {tx.dueDate && (
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                                  Due: {tx.dueDate.split("-").reverse().join("/")}
                                </span>
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
                          {tx.document?.name && onViewDoc ? (
                            <button
                              onClick={() => onViewDoc(tx.document!)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors mx-auto"
                              title={tx.document.name}
                            >
                              {tx.document.mimeType?.startsWith("image/") ? <Image size={12} /> : <FileText size={12} />}
                              <span className="text-[10px] font-medium max-w-[50px] truncate">{tx.document.name?.split(".")[0]}</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {tx.type === "credit" ? (
                            <span className="text-emerald-600 font-semibold">{fmt(tx.amount)}</span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {tx.type === "debit" ? (
                            <span className="text-red-500 font-semibold">{fmt(tx.amount)}</span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Totals row */}
                  <tr className="bg-slate-50 border-t-2 border-border">
                    <td colSpan={7} className="px-4 py-3 text-xs font-bold text-foreground">TOTALS</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-600">
                      +{fmt(summary.totalCredits)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-bold text-red-500">
                      -{fmt(summary.totalDebits)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={transactions.length}
              pageSize={pageSize}
            />
          </>
        )}
      </div>
    </div>
  );
}
