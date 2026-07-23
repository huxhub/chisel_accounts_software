import { useMemo } from "react";
import { TrendingUp, TrendingDown, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, Activity } from "lucide-react";
import type { Account } from "../types";
import { calcBalance, calcTotalCredit, calcTotalDebit, fmtSign, accountTypeIcon, CHART_COLORS } from "../types";
import { DashboardTransfersLog } from "./DashboardTransfersLog";

export function Dashboard({ accounts, onNavigate }: { accounts: Account[]; onNavigate: (id: string) => void }) {
  const totalOpening = accounts.reduce((s, a) => s + a.openingBalance, 0);
  const totalCredit = accounts.reduce((s, a) => s + calcTotalCredit(a), 0);
  const totalDebit = accounts.reduce((s, a) => s + calcTotalDebit(a), 0);
  const totalClosing = accounts.reduce((s, a) => s + calcBalance(a), 0);

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
        if (tx.type === "debit") { entry.fromCompany = a.name; entry.fromColor = color; }
        else if (tx.type === "credit") { entry.toCompany = a.name; entry.toColor = color; }
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
      return b.id.localeCompare(a.id);
    });
  }, [accounts]);

  const recentTxs = accounts
    .flatMap(a => {
      const idx = accounts.findIndex(acc => acc.id === a.id);
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      return a.transactions.map(tx => ({ ...tx, accountId: a.id, accountName: a.name, accountColor: color, accountBg: a.bgColor }));
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

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

      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Company Balances</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {accounts.map(acc => {
            const closing = calcBalance(acc);
            const isNegative = closing < 0;
            const idx = accounts.findIndex(a => a.id === acc.id);
            const color = CHART_COLORS[idx % CHART_COLORS.length];
            return (
              <button key={acc.id} onClick={() => onNavigate(acc.id)} className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 text-left hover:shadow-md transition-all group relative overflow-hidden">
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
          {accounts.map(acc => {
            const closing = calcBalance(acc);
            const credit = calcTotalCredit(acc);
            const debit = calcTotalDebit(acc);
            const change = closing - acc.openingBalance;
            return (
              <button key={acc.id} onClick={() => onNavigate(acc.id)} className="w-full bg-white rounded-xl border border-border p-4 text-left hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.bgColor }}>
                      {(() => { const Icon = accountTypeIcon(acc.type); return <Icon size={14} style={{ color: acc.color }} />; })()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{acc.name}</div>
                      {acc.type === "overdraft" && <span className="text-[10px] text-red-500 font-medium">Overdraft</span>}
                      {acc.type === "bank" && <span className="text-[10px] text-teal-600 font-medium">Bank</span>}
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
            <h3 className="font-semibold text-sm text-foreground">Recent Transactions</h3>
            <span className="text-xs text-muted-foreground">All accounts</span>
          </div>
          <div className="divide-y divide-border/60">
            {recentTxs.map((tx: any) => (
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
                    {tx.exchangeType && <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{tx.exchangeType}</span>}
                    {tx.dueDate && <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">Due: {tx.dueDate.split("-").reverse().join("/")}</span>}
                  </div>
                </div>
                <div className={`text-sm font-mono font-semibold flex-shrink-0 ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>{tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
