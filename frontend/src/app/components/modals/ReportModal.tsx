import { useState } from "react";
import { FileDown, X, Download } from "lucide-react";
import type { Account } from "../../types";
import { generateMonthlyPDF } from "../../utils/generateMonthlyPDF";

export function ReportModal({
  accounts,
  showReport,
  setShowReport,
}: {
  accounts: Account[];
  showReport: boolean;
  setShowReport: (v: boolean) => void;
}) {
  const [reportType, setReportType] = useState<"month" | "day">("month");
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportDay, setReportDay] = useState(new Date().toISOString().split("T")[0]);

  if (!showReport) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <FileDown size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{reportType === "day" ? "Day Report" : "Monthly Report"}</h3>
              <p className="text-xs text-white/60">Download as PDF</p>
            </div>
          </div>
          <button onClick={() => setShowReport(false)} className="text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setReportType("month")}
                className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                  reportType === "month" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setReportType("day")}
                className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                  reportType === "day" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Day-wise
              </button>
            </div>
          </div>

          {reportType === "month" ? (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Month</label>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <button
                      key={m}
                      onClick={() => setReportMonth(m)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                        reportMonth === m ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {new Date(2000, m - 1, 1).toLocaleString("en-IN", { month: "short" })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Year</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setReportYear(y => y - 1)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all text-lg font-bold">‹</button>
                  <div className="flex-1 text-center font-mono font-bold text-xl text-foreground">{reportYear}</div>
                  <button onClick={() => setReportYear(y => y + 1)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all text-lg font-bold">›</button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Select Date</label>
              <input
                type="date"
                value={reportDay}
                onChange={e => setReportDay(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-input-background font-mono"
              />
            </div>
          )}

          <div className="bg-secondary rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Report will include</div>
            <div className="flex items-center gap-2 text-xs text-foreground"><div className="w-1.5 h-1.5 rounded-full bg-accent" />Account summary table (all {accounts.length} accounts)</div>
            <div className="flex items-center gap-2 text-xs text-foreground"><div className="w-1.5 h-1.5 rounded-full bg-accent" />Transaction detail per account</div>
            <div className="flex items-center gap-2 text-xs text-foreground"><div className="w-1.5 h-1.5 rounded-full bg-accent" />Opening & closing balances</div>
            <div className="flex items-center gap-2 text-xs text-foreground"><div className="w-1.5 h-1.5 rounded-full bg-accent" />Credit / Debit totals</div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={() => setShowReport(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            disabled={reportType === "day" && !reportDay}
            onClick={() => {
              if (reportType === "day") {
                const [y, m, d] = reportDay.split("-").map(Number);
                generateMonthlyPDF(accounts, m, y, d);
              } else {
                generateMonthlyPDF(accounts, reportMonth, reportYear);
              }
              setShowReport(false);
            }}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Download size={15} />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
