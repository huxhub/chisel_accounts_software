import { useEffect, useState } from "react";
import { LayoutDashboard, Bell, ChevronDown, ChevronRight, Settings, LogOut, History, Plus, BookOpen, Package } from "lucide-react";
import type { Item } from "./InventoryPage";
import type { Account } from "../types";
import type { AppSettings } from "../hooks/useSettings";
import { calcBalance, fmtSign, accountTypeIcon } from "../types";

export function Sidebar({
  inventoryItems, onAddInventory, onSelectInventory, settings, accounts, activeTab, setActiveTab, activeRemindersCount,
  mobileMenuOpen, setMobileMenuOpen, onOpenAddCompany, onOpenSettings, onLogout,
}: {
  inventoryItems: Item[]; onAddInventory: () => void; onSelectInventory: (id: number) => void;
  settings: AppSettings; accounts: Account[]; activeTab: string; setActiveTab: (tab: string) => void;
  activeRemindersCount: number; mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void;
  onOpenAddCompany: (type: "company" | "bank" | "cash" | "overdraft") => void;
  onOpenSettings: () => void; onLogout: () => void;
}) {
  const [inventoryExpanded, setInventoryExpanded] = useState(() => localStorage.getItem("sidebar-inventory-expanded") !== "false");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      return { company: true, bank: true, cash: true, overdraft: true, ...JSON.parse(localStorage.getItem("sidebar-account-groups") || "{}") };
    } catch { return { company: true, bank: true, cash: true, overdraft: true }; }
  });
  useEffect(() => { localStorage.setItem("sidebar-inventory-expanded", String(inventoryExpanded)); }, [inventoryExpanded]);
  useEffect(() => { localStorage.setItem("sidebar-account-groups", JSON.stringify(expandedGroups)); }, [expandedGroups]);
  const companies = accounts.filter(a => a.type === "company");
  const banks = accounts.filter(a => a.type === "bank");
  const cashes = accounts.filter(a => a.type === "cash");
  const overdrafts = accounts.filter(a => a.type === "overdraft");

  const navTo = (id: string) => { setActiveTab(id); setMobileMenuOpen(false); };

  const renderGroup = (title: string, items: Account[], type: "company" | "bank" | "cash" | "overdraft") => {
    return (
      <div>
        <div className="bg-[#f1f5f9] px-4 py-2.5 flex items-center justify-between border-y border-slate-200/80">
          <button onClick={() => setExpandedGroups(groups => ({ ...groups, [type]: !groups[type] }))} aria-expanded={expandedGroups[type]} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900">
            {title} <ChevronDown size={14} className={`transition-transform ${expandedGroups[type] ? "rotate-0" : "-rotate-90"}`} />
          </button>
          <button
            onClick={() => onOpenAddCompany(type)}
            className="text-slate-500 hover:text-slate-800 transition-colors p-0.5"
            title={`Add ${title}`}
          >
            <Plus size={16} />
          </button>
        </div>
        {expandedGroups[type] && <div className="divide-y divide-slate-100">
          {items.map(acc => {
            const closing = calcBalance(acc);
            const isActive = activeTab === acc.id;
            const Icon = accountTypeIcon(acc.type);
            return (
              <button
                key={acc.id}
                onClick={() => navTo(acc.id)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                  isActive ? "bg-slate-50" : "hover:bg-slate-50/80"
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
        </div>}
      </div>
    );
  };

  return (
    <aside
      className={`fixed md:relative z-30 inset-y-0 left-0 h-[100dvh] md:h-full w-80 md:w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
        {settings.logoUrl && <img src={settings.logoUrl} alt={`${settings.companyName} logo`} className="w-10 h-10 object-contain" />}
        <div className="min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{settings.companyName}</p><p className="text-xs text-slate-500 truncate">{settings.companySubtitle}</p></div>
      </div>
      {/* Scrollable Navigation Items */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 space-y-4">
        {/* Top Links */}
        <div className="px-4 space-y-1.5">
          <button
            onClick={() => navTo("dashboard")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-[#edf2f7] text-blue-600"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard size={18} className={`shrink-0 ${activeTab === "dashboard" ? "text-blue-600" : "text-slate-500"}`} />
            <span className="truncate whitespace-nowrap">Dashboard</span>
          </button>

          <button
            onClick={() => navTo("reminders")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "reminders"
                ? "bg-[#edf2f7] text-blue-600"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Bell size={18} className={`shrink-0 ${activeTab === "reminders" ? "text-blue-600" : "text-slate-500"}`} />
              <span className={`truncate whitespace-nowrap ${activeTab === "reminders" ? "text-blue-600" : "text-slate-700"}`}>Reminders</span>
            </div>
            {activeRemindersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#f87171] text-white text-xs font-bold flex items-center justify-center shadow-2xs shrink-0 ml-1">
                {activeRemindersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navTo("history")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-[#edf2f7] text-blue-600"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <History size={18} className={`shrink-0 ${activeTab === "history" ? "text-blue-600" : "text-slate-500"}`} />
            <span className="truncate whitespace-nowrap">Transaction Summary</span>
          </button>

          <button
            onClick={() => navTo("ledgers")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "ledgers"
                ? "bg-[#edf2f7] text-blue-600"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <BookOpen size={18} className={`shrink-0 ${activeTab === "ledgers" ? "text-blue-600" : "text-slate-500"}`} />
            <span className="truncate whitespace-nowrap">Ledgers</span>
          </button>
        </div>

        {/* Account Groups */}
        <div>
          <div className="bg-[#f1f5f9] px-4 py-2.5 flex items-center justify-between border-y border-slate-200/80">
            <button onClick={() => setInventoryExpanded(expanded => !expanded)} aria-expanded={inventoryExpanded} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900">
              Inventory <ChevronDown size={14} className={`transition-transform ${inventoryExpanded ? "rotate-0" : "-rotate-90"}`} />
            </button>
            <button onClick={onAddInventory} aria-label="Add inventory company" title="Add inventory company" className="text-slate-500 hover:text-slate-800 transition-colors p-0.5"><Plus size={16} /></button>
          </div>
          {inventoryExpanded && <div className="divide-y divide-slate-100">
            {inventoryItems.map(item => {
              const txs = item.transactions || [];
              const pending = txs.filter(tx => tx.paymentStatus === "not_paid").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
              const total = txs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
              return (
                <button key={item.id} onClick={() => onSelectInventory(item.id)} className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-all ${activeTab === `inventory-${item.id}` ? "bg-slate-50" : "hover:bg-slate-50/80"}`}>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-700">
                      <Package size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wide text-slate-800 truncate">{item.name}</span>
                      <span className={`block text-xs font-mono font-bold mt-0.5 ${pending > 0 ? "text-amber-700" : total > 0 ? "text-[#059669]" : "text-slate-500"}`}>
                        {pending > 0 ? `₹${pending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Due` : total > 0 ? "₹0.00 (Paid)" : "₹0.00"}
                      </span>
                    </span>
                  </span>
                  <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>}
        </div>
        {renderGroup("COMPANIES", companies, "company")}
        {renderGroup("BANKS", banks, "bank")}
        {renderGroup("CASH", cashes, "cash")}
        {renderGroup("OVERDRAFTS", overdrafts, "overdraft")}
      </div>

      {/* Fixed Footer */}
      <div className="p-4 border-t border-slate-100 space-y-1 bg-white shrink-0">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Settings size={18} className="text-slate-500 shrink-0" />
          <span>Settings</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} className="text-red-600 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

