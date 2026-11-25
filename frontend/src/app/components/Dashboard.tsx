import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, Activity, Tag, Bell, Check, Search, Filter, X, Package } from "lucide-react";
import type { Account, Program } from "../types";
import { calcBalance, calcTotalCredit, calcTotalDebit, fmtSign, accountTypeIcon, CHART_COLORS, fmt, formatLocalDate } from "../types";
import { DashboardTransfersLog } from "./DashboardTransfersLog";

export function Dashboard({
  accounts,
  inventoryItems = [],
  programs = [],
  onNavigate,
  onCompleteReminder,
}: {
  accounts: Account[];
  inventoryItems?: Array<{ id: number; name: string; transactions?: Array<{ amount: string | number; paidAmount?: string | number; paymentStatus: "paid" | "not_paid" | "partial" }> }>;
  programs?: Program[];
  onNavigate: (id: string) => void;
  onCompleteReminder?: (accountId: string, txId: string) => void;
}) {
  const businessAccounts = accounts.filter(account => !String(account.id).startsWith("inventory-"));
  const totalOpening = businessAccounts.reduce((s, a) => s + a.openingBalance, 0);
  const totalCredit = businessAccounts.reduce((s, a) => s + calcTotalCredit(a), 0);
  const totalDebit = businessAccounts.reduce((s, a) => s + calcTotalDebit(a), 0);
  const totalClosing = businessAccounts.reduce((s, a) => s + calcBalance(a), 0);

  const interCompanyTransfers = useMemo(() => {
    const map = new Map<string, { id: string; date: string; amount: number; reference: string; dueDate?: string; exchangeType: string; description: string; fromCompany: string; fromColor: string; toCompany: string; toColor: string; createdAt?: string }>();
    accounts.forEach(a => {
      const idx = accounts.findIndex(acc => acc.id === a.id);
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      a.transactions.forEach((tx: any) => {
        if (!tx.exchangeType || !tx.reference) return;
        let entry = map.get(tx.reference);
        if (!entry) {
          entry = { id: tx.id, date: tx.date, amount: tx.amount, reference: tx.reference, dueDate: tx.dueDate, exchangeType: tx.exchangeType, description: tx.description, fromCompany: "", fromColor: "", toCompany: "", toColor: "", createdAt: tx.createdAt };
          map.set(tx.reference, entry);
        }
        if (tx.type === "debit") {
          if (!entry.fromCompany || a.type === "company") {
            entry.fromCompany = a.name;
            entry.fromColor = color;
          }
        } else if (tx.type === "credit") {
          if (!entry.toCompany || a.type === "company") {
            entry.toCompany = a.name;
            entry.toColor = color;
          }
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
      return b.id.localeCompare(a.id);
    });
  }, [accounts]);

  const upcomingReminders = useMemo(() => {
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    const targetDateObj = new Date(todayObj);
    targetDateObj.setDate(targetDateObj.getDate() + 5);
    const targetDateStr = formatLocalDate(targetDateObj);

    const list: any[] = [];
    const seenRefs = new Set<string>();
    accounts.forEach(a => {
      const idx = accounts.findIndex(acc => acc.id === a.id);
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      (a.transactions || []).forEach((tx: any) => {
        if (tx.dueDate && !tx.isCompleted && tx.dueDate <= targetDateStr) {
          if (tx.reference && (tx.reference.startsWith("EX-") || tx.exchangeType)) {
            if (seenRefs.has(tx.reference)) return;
            seenRefs.add(tx.reference);
          }
          list.push({ ...tx, accountId: a.id, accountName: a.name, accountColor: color, accountBg: a.bgColor });
        }
      });
    });
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [accounts]);

  const allDashboardTxs = useMemo(() => {
    return accounts
      .flatMap(a => {
        const idx = accounts.findIndex(acc => acc.id === a.id);
        const color = CHART_COLORS[idx % CHART_COLORS.length];
        return a.transactions
          .filter(tx => !tx.isReminder)
          .map(tx => ({ ...tx, accountId: a.id, accountName: a.name, accountColor: color, accountBg: a.bgColor }));
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [accounts]);

  const filteredRecentTxs = useMemo(() => {
    return allDashboardTxs.slice(0, 8);
  }, [allDashboardTxs]);

  const programSummaries = useMemo(() => {
    if (!programs || programs.length === 0) return [];
    const map = new Map<number, { id: number; name: string; color: string; credit: number; debit: number; net: number; count: number }>();
    programs.forEach(p => {
      map.set(p.id, { id: p.id, name: p.name, color: p.color, credit: 0, debit: 0, net: 0, count: 0 });
    });

    accounts.forEach(acc => {
      (acc.transactions || []).forEach((tx: any) => {
        if (tx.isReminder) return;
        if (tx.programId && map.has(Number(tx.programId))) {
          const item = map.get(Number(tx.programId))!;
          item.count += 1;
          if (tx.type === "credit") {
            item.credit += tx.amount;
          } else {
            item.debit += tx.amount;
          }
          item.net = item.credit - item.debit;
        }
      });
    });

    return Array.from(map.values());
  }, [accounts, programs]);

  const kpis = [
    { label: "Opening Balance", value: fmtSign(totalOpening), icon: Wallet, bg: "bg-blue-50", iconColor: "text-blue-600", border: "border-blue-100", valueColor: "text-blue-700" },
    { label: "Total Credits", value: `+${fmtSign(totalCredit)}`, icon: TrendingUp, bg: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-emerald-100", valueColor: "text-emerald-700" },
    { label: "Total Debits", value: `-${fmtSign(totalDebit)}`, icon: TrendingDown, bg: "bg-red-50", iconColor: "text-red-500", border: "border-red-100", valueColor: "text-red-600" },
    { label: "Net Closing Balance", value: fmtSign(totalClosing), icon: Activity, bg: totalClosing >= 0 ? "bg-indigo-50" : "bg-red-50", iconColor: totalClosing >= 0 ? "text-indigo-600" : "text-red-500", border: totalClosing >= 0 ? "border-indigo-100" : "border-red-100", valueColor: totalClosing >= 0 ? "text-indigo-700" : "text-red-600" },
  ];

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of all accounts — {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-xl sm:rounded-2xl border ${kpi.border} p-3 sm:p-5 flex flex-col gap-2 sm:gap-3`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon size={16} className={`sm:hidden ${kpi.iconColor}`} />
              <kpi.icon size={18} className={`hidden sm:block ${kpi.iconColor}`} />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{kpi.label}</div>
              <div className={`text-sm sm:text-lg font-mono font-bold leading-tight truncate ${kpi.valueColor}`}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming & Overdue Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <Bell size={15} className="text-red-600 animate-pulse" /> Upcoming & Overdue Reminders
            </h3>
            <button onClick={() => onNavigate("reminders")} className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors">
              View All ({upcomingReminders.length}) <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {upcomingReminders.map(rem => {
              const todayStr = formatLocalDate();
              const isOverdue = rem.dueDate < todayStr;
              const isDueToday = rem.dueDate === todayStr;
              const diffTime = new Date(rem.dueDate).getTime() - new Date(todayStr).getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const statusText = isOverdue ? `Overdue by ${Math.abs(diffDays)}d` : isDueToday ? "Due Today" : `Due in ${diffDays}d`;
              const badgeClass = isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" : isDueToday ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200";

              return (
                <div key={rem.id} className="bg-white rounded-xl border border-red-100 p-3.5 flex items-start justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-white truncate max-w-[120px]" style={{ backgroundColor: rem.accountColor }}>
                        {rem.accountName}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badgeClass}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 truncate" title={rem.description}>
                      {rem.description}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      Due: {rem.dueDate.split("-").reverse().join("/")}
                      {rem.amount > 0 && <span className="ml-2 font-semibold text-slate-700">₹{rem.amount.toLocaleString("en-IN")}</span>}
                    </div>
                  </div>
                  {onCompleteReminder && (
                    <button
                      onClick={() => onCompleteReminder(rem.accountId, rem.id)}
                      className="w-7 h-7 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
                      title="Mark as Done"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Program Summary Section */}
      {programSummaries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <Tag size={15} className="text-indigo-600" /> Program Financial Summary
            </h3>
            <span className="text-xs text-muted-foreground font-medium">{programSummaries.length} Programs</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {programSummaries.map(prog => (
              <div key={prog.id} className="bg-white rounded-xl border border-border p-4 space-y-2 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: prog.color }} />
                    <span className="text-sm font-bold text-foreground truncate max-w-[150px]">{prog.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600">
                    {prog.count} txns
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Credited</div>
                    <div className="text-xs font-mono font-semibold text-emerald-600">+₹{fmt(prog.credit)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Debited</div>
                    <div className="text-xs font-mono font-semibold text-red-500">-₹{fmt(prog.debit)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Net Cash</div>
                    <div className={`text-xs font-mono font-bold ${prog.net >= 0 ? "text-indigo-600" : "text-red-600"}`}>
                      {fmtSign(prog.net)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inventoryItems.length > 0 && <div className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-sm text-foreground">Inventory Companies</h3><span className="text-xs text-muted-foreground">{inventoryItems.length} companies</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {inventoryItems.map(item => {
            const transactions = (item.transactions || []).filter(tx => (tx.transactionType || "purchase") === "purchase");
            const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
            const paidAmount = transactions.reduce(
              (sum, tx) => sum + Number(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0)),
              0,
            );
            const pendingBalance = transactions.reduce(
              (sum, tx) => sum + Math.max(0, Number(tx.amount || 0) - Number(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0))),
              0,
            );
            const paidCount = transactions.filter(tx => tx.paymentStatus === "paid").length;
            const unpaidCount = transactions.length - paidCount;
            return <button key={item.id} onClick={() => onNavigate(`inventory-${item.id}`)} className="group rounded-xl border border-blue-100 bg-white p-4 text-left transition-colors hover:border-blue-200">
              <div className="mb-4 flex items-center justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Package size={16} /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{item.name}</p><p className="text-[11px] text-slate-500">Inventory Account</p></div></div><ChevronRight size={15} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" /></div>
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Balance due</p>
                  <p className={`mt-1 font-mono text-base font-bold ${pendingBalance > 0 ? "text-amber-700" : "text-emerald-600"}`}>
                    ₹{pendingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total amount</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-slate-600">
                    ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] text-slate-500">Paid ({paidCount})</p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-emerald-600">₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="pl-4">
                  <p className="text-[10px] text-slate-500">Pending ({unpaidCount})</p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-red-600">₹{pendingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </button>;
          })}
        </div>
      </div>}

      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Company Balances</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {businessAccounts.map(acc => {
            const closing = calcBalance(acc);
            const isNegative = closing < 0;
            const idx = businessAccounts.findIndex(a => a.id === acc.id);
            const color = CHART_COLORS[idx % CHART_COLORS.length];
            return (
              <button key={acc.id} onClick={() => onNavigate(acc.id)} className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 text-left transition-colors group relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    {(() => { const Icon = accountTypeIcon(acc.type); return <Icon size={14} style={{ color: color }} />; })()}
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 font-medium truncate" title={acc.name}>{acc.name}</div>
                  <div className={`text-xs sm:text-base font-mono font-bold leading-tight truncate ${isNegative ? "text-red-600" : "text-foreground"}`} style={{ color: isNegative ? undefined : color }}>{fmtSign(closing)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <DashboardTransfersLog interCompanyTransfers={interCompanyTransfers} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="col-span-1 lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Account Summary</h3>
          {businessAccounts.map(acc => {
            const closing = calcBalance(acc);
            const credit = calcTotalCredit(acc);
            const debit = calcTotalDebit(acc);
            const change = closing - acc.openingBalance;
            return (
              <button key={acc.id} onClick={() => onNavigate(acc.id)} className="w-full bg-white rounded-xl border border-border p-4 text-left transition-colors group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.bgColor }}>
                      {(() => { const Icon = accountTypeIcon(acc.type); return <Icon size={14} style={{ color: acc.color }} />; })()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{acc.name}</div>
                      {acc.type === "overdraft" && <span className="text-[10px] text-red-500 font-medium">Overdraft</span>}
                      {acc.type === "bank" && <span className="text-[10px] text-teal-600 font-medium">Bank</span>}
                      {acc.type === "cash" && <span className="text-[10px] text-amber-700 font-medium">Cash</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-accent">View</span>
                    <ChevronRight size={12} className="text-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-[10px] text-muted-foreground">Credit</div><div className="text-xs font-mono font-semibold text-emerald-600">+₹{(credit / 1000).toFixed(1)}k</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Debit</div><div className="text-xs font-mono font-semibold text-red-500">-₹{(debit / 1000).toFixed(1)}k</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Balance</div><div className={`text-xs font-mono font-bold ${closing < 0 ? "text-red-600" : "text-foreground"}`} style={{ color: closing < 0 ? undefined : acc.color }}>{closing < 0 ? "-" : ""}₹{(Math.abs(closing) / 1000).toFixed(1)}k</div></div>
                </div>
                <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                  {credit + debit > 0 && <div className="h-full rounded-full transition-all" style={{ width: `${(credit / (credit + debit)) * 100}%`, backgroundColor: acc.color }} />}
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-[10px] text-muted-foreground">Credit ratio</span>
                  <span className={`text-[10px] font-mono ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>{change >= 0 ? "▲" : "▼"} {fmtSign(Math.abs(change))}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="col-span-1 lg:col-span-3 bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">
              Recent Transactions
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {filteredRecentTxs.length} recent
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {filteredRecentTxs.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No transactions found matching your filters.
              </div>
            ) : (
              filteredRecentTxs.map((tx: any) => (
                <div key={tx.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "credit" ? "bg-emerald-50" : "bg-red-50"}`}>
                    {tx.type === "credit" ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{tx.description}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-white" style={{ backgroundColor: tx.accountColor }}>{tx.accountName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{tx.date.split("-").reverse().join("/")}</span>
                      {tx.reference && <span className="text-[10px] text-muted-foreground font-mono">Ref: {tx.reference}</span>}
                      {tx.programName && <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5"><Tag size={9} /> {tx.programName}</span>}
                      {tx.exchangeType && <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{tx.exchangeType}</span>}
                      {tx.dueDate && <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">Due: {tx.dueDate.split("-").reverse().join("/")}</span>}
                    </div>
                  </div>
                  <div className={`text-sm font-mono font-semibold flex-shrink-0 ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>{tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
