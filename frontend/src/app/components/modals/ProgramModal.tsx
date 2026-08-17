import { useState } from "react";
import { FolderPlus, Trash2, X, Tag } from "lucide-react";
import type { Program } from "../../types";

export function ProgramModal({
  showPrograms,
  setShowPrograms,
  programs,
  onAddProgram,
  onDeleteProgram,
}: {
  showPrograms: boolean;
  setShowPrograms: (v: boolean) => void;
  programs: Program[];
  onAddProgram: (name: string, color: string) => Promise<boolean>;
  onDeleteProgram: (id: number) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!showPrograms) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const success = await onAddProgram(name.trim(), "#1e3a5f");
    setSubmitting(false);
    if (success) {
      setName("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Tag size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manage Project</h3>
              <p className="text-xs text-white/70">Create and organize project categories</p>
            </div>
          </div>
          <button
            onClick={() => setShowPrograms(false)}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/15"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FolderPlus size={14} /> Add New Project
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Program / Project Name..."
                className="flex-1 border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              />

              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0"
              >
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              <span>Existing Programs</span>
              <span className="font-mono">{programs.length} Total</span>
            </div>

            {programs.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No programs created yet. Add one above to start tagging transactions.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                {programs.map((prog) => (
                  <div key={prog.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-primary/70" />
                      <span className="text-sm font-semibold text-slate-800">{prog.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteProgram(prog.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                      title="Delete Program"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
