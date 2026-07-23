import { ArrowLeftRight } from "lucide-react";
import { fmt } from "../types";

export function DashboardTransfersLog({ interCompanyTransfers }: { interCompanyTransfers: any[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><ArrowLeftRight size={16} /></div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Inter-Company Transfers Log</h3>
            <p className="text-[10px] text-muted-foreground">Overview of all active inter-company fund flows</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full">{interCompanyTransfers.length} transfers</span>
      </div>

      {interCompanyTransfers.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          <ArrowLeftRight size={32} className="mx-auto mb-3 opacity-30" />
          <p>No inter-company transfers recorded yet.</p>
        </div>
      ) : (
        <>
          <div className="md:hidden flex flex-col divide-y divide-border/60">
            {interCompanyTransfers.map(tx => (
              <div key={tx.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-sm font-semibold">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: tx.fromColor }} />{tx.fromCompany || "Unknown"}</span>
                      <span className="text-muted-foreground text-xs font-normal">➔</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: tx.toColor }} />{tx.toCompany || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">{tx.date.split("-").reverse().join("/")}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">Ref: {tx.reference}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{tx.exchangeType}</span>
                      {tx.dueDate && (<span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">Due: {tx.dueDate.split("-").reverse().join("/")}</span>)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 font-mono font-bold text-slate-800 text-sm">{fmt(tx.amount)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-6 py-3 text-center font-semibold w-16">Sl. No.</th>
                  <th className="px-6 py-3 text-left font-semibold w-28">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Transfer Flow</th>
                  <th className="px-6 py-3 text-left font-semibold w-28">Ref. No.</th>
                  <th className="px-6 py-3 text-center font-semibold w-24">Type</th>
                  <th className="px-6 py-3 text-left font-semibold w-32">Due Date</th>
                  <th className="px-6 py-3 text-right font-semibold w-36">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {interCompanyTransfers.map((tx, idx) => (
                  <tr key={tx.id} className="border-b border-border/60 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-center font-mono text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{tx.date.split("-").reverse().join("/")}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: tx.fromColor }} />{tx.fromCompany || "Unknown"}</span>
                        <span className="text-muted-foreground text-xs font-semibold px-1">➔</span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: tx.toColor }} />{tx.toCompany || "Unknown"}</span>
                      </div>
                      {tx.description && (<div className="text-xs text-muted-foreground mt-1 max-w-md truncate">{tx.description.replace(/^Inter-Company Transfer (to|from) [^—]+ — /, "").replace(/^Inter-Company Transfer (to|from) [^—]+$/, "")}</div>)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{tx.reference}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold capitalize inline-block ${tx.exchangeType === "loan" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{tx.exchangeType}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      {tx.dueDate ? (<span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">{tx.dueDate.split("-").reverse().join("/")}</span>) : (<span className="text-muted-foreground/30 text-xs">—</span>)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-800">{fmt(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
