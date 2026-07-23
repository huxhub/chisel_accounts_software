import { ArrowLeftRight, Trash2 } from "lucide-react";
import { fmt } from "../types";

export function ExchangeTransactionsTable({
  exchangeTransactions,
  onDeleteTransaction,
}: {
  exchangeTransactions: any[];
  onDeleteTransaction: (txId: string) => void;
}) {
  if (exchangeTransactions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <ArrowLeftRight size={14} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Inter-Company Transfers</h3>
            <p className="text-[10px] text-muted-foreground">Inter-company loans and credits</p>
          </div>
        </div>
        <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
          {exchangeTransactions.length} transfers
        </span>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col divide-y divide-border/60">
        {exchangeTransactions.map((tx: any) => (
          <div key={tx.id} className="p-5 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{tx.description}</div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">{tx.date.split("-").reverse().join("/")}</span>
                  {tx.reference && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">Ref: {tx.reference}</span>}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{tx.exchangeType}</span>
                  {tx.dueDate && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                      Due: {tx.dueDate.split("-").reverse().join("/")}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {tx.type === "credit" ? (
                  <div className="font-mono font-bold text-emerald-600">+{fmt(tx.amount)}</div>
                ) : (
                  <div className="font-mono font-bold text-red-500">-{fmt(tx.amount)}</div>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border/40">
              <button onClick={() => onDeleteTransaction(tx.id)} className="p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded-md transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3 text-center font-semibold w-16">Sl. No.</th>
              <th className="px-4 py-3 text-left font-semibold w-24">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-left font-semibold w-24">Ref. No.</th>
              <th className="px-4 py-3 text-center font-semibold w-24">Type</th>
              <th className="px-4 py-3 text-left font-semibold w-32">Due Date</th>
              <th className="px-4 py-3 text-right font-semibold w-32">Credit (₹)</th>
              <th className="px-4 py-3 text-right font-semibold w-32">Debit (₹)</th>
              <th className="px-4 py-3 text-center w-10"></th>
            </tr>
          </thead>
          <tbody>
            {exchangeTransactions.map((tx: any, idx: number) => (
              <tr key={tx.id} className="border-b border-border/60 hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{idx + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.date.split("-").reverse().join("/")}</td>
                <td className="px-4 py-3 text-foreground font-medium">{tx.description}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.reference || "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize inline-block ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{tx.exchangeType}</span>
                </td>
                <td className="px-4 py-3 text-left">
                  {tx.dueDate ? (
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">
                      {tx.dueDate.split("-").reverse().join("/")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono">{tx.type === "credit" ? <span className="text-emerald-600 font-semibold">{fmt(tx.amount)}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                <td className="px-4 py-3 text-right font-mono">{tx.type === "debit" ? <span className="text-red-500 font-semibold">{fmt(tx.amount)}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => onDeleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
