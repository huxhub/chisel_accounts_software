import { LayoutDashboard, Bell, Building2, Landmark, CreditCard, Plus, ChevronRight, Settings, LogOut } from "lucide-react";
import type { Account } from "../types";
import { calcBalance, fmtSign, accountTypeIcon } from "../types";

export function Sidebar({
  accounts, activeTab, setActiveTab, activeRemindersCount,
  mobileMenuOpen, setMobileMenuOpen, onOpenAddCompany, onOpenSettings, onLogout,
}: {
  accounts: Account[]; activeTab: string; setActiveTab: (tab: string) => void;
  activeRemindersCount: number; mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void;
  onOpenAddCompany: (type: "company" | "bank" | "overdraft") => void;
  onOpenSettings: () => void; onLogout: () => void;
}) {
  const companies = accounts.filter(a => a.type === "company");
  const banks = accounts.filter(a => a.type === "bank");
  const overdrafts = accounts.filter(a => a.type === "overdraft");

  const navTo = (id: string) => { setActiveTab(id); setMobileMenuOpen(false); };

  const renderGroup = (title: string, items: Account[], type: "company" | "bank" | "overdraft") => {
    return (
      <div>
        <div className="bg-[#f1f5f9] px-4 py-2.5 flex items-center justify-between border-y border-slate-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {title}
          </span>
          <button
            onClick={() => onOpenAddCompany(type)}
            className="text-slate-500 hover:text-slate-800 transition-colors p-0.5"
            title={`Add ${title}`}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {items.map(acc => {
            const closing = calcBalance(acc);
            const isActive = activeTab === acc.id;
            const Icon = accountTypeIcon(acc.type);
            return (
              <button
                key={acc.id}
                onClick={() => navTo(acc.id)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                  isActive ? "bg-slate-50 border-r-4 border-r-blue-600" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs"
                    style={{ backgroundColor: acc.bgColor }}
                  >
                    <Icon size={16} style={{ color: acc.color }} />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-800 truncate">
                      {acc.name}
                    </div>
                    <div className={`text-xs font-mono font-bold mt-0.5 ${closing < 0 ? "text-red-500" : "text-[#059669]"}`}>
                      {fmtSign(closing)}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`fixed md:relative z-30 inset-y-0 left-0 w-80 md:w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="space-y-4 flex-1 py-4">
          {/* Top Links */}
          <div className="px-4 space-y-1.5">
            <button
              onClick={() => navTo("dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#edf2f7] text-blue-600 border-l-4 border-l-blue-600"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard size={18} className={activeTab === "dashboard" ? "text-blue-600" : "text-slate-500"} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navTo("reminders")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "reminders"
                  ? "bg-[#edf2f7] text-blue-600 border-l-4 border-l-blue-600"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell size={18} className={activeTab === "reminders" ? "text-blue-600" : "text-slate-500"} />
                <span className={activeTab === "reminders" ? "text-blue-600" : "text-slate-700"}>Reminders</span>
              </div>
              {activeRemindersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#f87171] text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                  {activeRemindersCount}
                </span>
              )}
            </button>
          </div>

          {/* Account Groups */}
          {renderGroup("COMPANIES", companies, "company")}
          {renderGroup("BANKS", banks, "bank")}
          {renderGroup("OVERDRAFTS", overdrafts, "overdraft")}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 space-y-1 mt-auto">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Settings size={18} className="text-slate-500" />
            <span>Settings</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} className="text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
