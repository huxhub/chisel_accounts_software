import { useState } from "react";
import { FileDown, X, Download, Filter } from "lucide-react";
import type { Account, Program } from "../../types";
import { generateMonthlyPDF } from "../../utils/generateMonthlyPDF";

export function ReportModal({
  accounts,
  programs = [],
  showReport,
  setShowReport,
}: {
  accounts: Account[];
  programs?: Program[];
  showReport: boolean;
  setShowReport: (v: boolean) => void;
}) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(firstDayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");

  if (!showReport) return null;

  const selectedProgram = selectedProgramId ? programs.find(p => String(p.id) === selectedProgramId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <FileDown size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Download Report</h3>
              <p className="text-xs text-white/60">Download as PDF</p>
            </div>
          </div>
          <button onClick={() => setShowReport(false)} className="text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Filter size={12} className="text-indigo-600" /> Filter by Program
            </label>
            <select
              value={selectedProgramId}
              onChange={e => setSelectedProgramId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input-background"
            >
              <option value="">-- All Programs (Full Report) --</option>
              {programs.map(prog => (
                <option key={prog.id} value={prog.id}>
                  {prog.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-secondary rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Report will include</div>
            {selectedProgram ? (
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                Program filter: {selectedProgram.name}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                All programs included
              </div>
            )}
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
            disabled={!fromDate || !toDate || fromDate > toDate}
            onClick={() => {
              const progFilterObj = selectedProgram ? { id: selectedProgram.id, name: selectedProgram.name } : null;
              const parts = fromDate.split("-").map(Number);
              generateMonthlyPDF(accounts, parts[1] || now.getMonth() + 1, parts[0] || now.getFullYear(), undefined, progFilterObj, fromDate, toDate);
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
