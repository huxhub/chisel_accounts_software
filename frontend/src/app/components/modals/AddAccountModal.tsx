import { X } from "lucide-react";

export function AddAccountModal({
  showAddCompany,
  setShowAddCompany,
  companyForm,
  setCompanyForm,
  addCompany,
}: {
  showAddCompany: boolean;
  setShowAddCompany: (v: boolean) => void;
  companyForm: { name: string; type: string; openingBalance: string; color: string };
  setCompanyForm: (v: any) => void;
  addCompany: () => void;
}) {
  if (!showAddCompany) return null;

  const label = companyForm.type === "overdraft" ? "Overdraft" : companyForm.type === "bank" ? "Bank" : "Company";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-lg text-foreground">Add New {label}</h3>
          <button onClick={() => setShowAddCompany(false)} className="text-muted-foreground hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Company Name</label>
            <input
              type="text"
              value={companyForm.name}
              onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              placeholder="Enter name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Account Type</label>
              <select
                value={companyForm.type}
                onChange={e => setCompanyForm({ ...companyForm, type: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                <option value="company">Company</option>
                <option value="bank">Bank</option>
                <option value="overdraft">Overdraft</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Opening Balance</label>
              <input
                type="number"
                value={companyForm.openingBalance}
                onChange={e => setCompanyForm({ ...companyForm, openingBalance: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-end gap-3">
          <button onClick={() => setShowAddCompany(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button onClick={addCompany} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
            Add {label}
          </button>
        </div>
      </div>
    </div>
  );
}
