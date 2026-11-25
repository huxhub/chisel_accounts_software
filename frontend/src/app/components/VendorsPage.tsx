import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, ShoppingCart, Package, Search, TrendingDown, TrendingUp, ChevronDown, Minus, Layers } from "lucide-react";
import type { Vendor, VendorEntry } from "../types";
import { fmt } from "../types";
import { VendorEntryModal } from "./modals/VendorModal";
import { Pagination } from "./ui/pagination";

export function VendorsPage({
  vendors,
  onAddEntry,
  onDeleteEntry,
}: {
  vendors: Vendor[];
  onAddEntry: (vendorId: number, entry: Omit<VendorEntry, "id" | "vendorId" | "createdAt">) => Promise<boolean>;
  onDeleteEntry: (vendorId: number, entryId: number) => Promise<boolean>;
}) {
  // "all" or "" means "All Vendors", or specific vendor ID
  const [selectedVendorId, setSelectedVendorId] = useState<number | "all" | "">("all");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [purchasePage, setPurchasePage] = useState(1);
  const [salePage, setSalePage] = useState(1);
  const pageSize = 10;

  const isAllVendors = selectedVendorId === "all" || selectedVendorId === "";
  const selected = isAllVendors ? null : (vendors.find(v => v.id === selectedVendorId) ?? null);

  // All entries across all vendors (with vendor name attached)
  const allEntriesWithVendor = useMemo(() => {
    return vendors.flatMap(v =>
      (v.VendorEntries || []).map(e => ({
        ...e,
        vendorName: v.name,
        vendorId: v.id,
      }))
    );
  }, [vendors]);

  const grandPurchased = useMemo(() => allEntriesWithVendor.filter(e => e.type === "purchase").reduce((s, e) => s + e.amount, 0), [allEntriesWithVendor]);
  const grandSold = useMemo(() => allEntriesWithVendor.filter(e => e.type === "sale").reduce((s, e) => s + e.amount, 0), [allEntriesWithVendor]);
  const grandNet = grandPurchased - grandSold;

  // Entries for the view (either all or specific vendor)
  const activeEntries = useMemo(() => {
    if (isAllVendors) return allEntriesWithVendor;
    return (selected?.VendorEntries || []).map(e => ({
      ...e,
      vendorName: selected?.name || "",
      vendorId: selected?.id || e.vendorId,
    }));
  }, [isAllVendors, selected, allEntriesWithVendor]);

  const purchases = useMemo(
    () => activeEntries.filter(e => e.type === "purchase").sort((a, b) => b.date.localeCompare(a.date)),
    [activeEntries]
  );
  const sales = useMemo(
    () => activeEntries.filter(e => e.type === "sale").sort((a, b) => b.date.localeCompare(a.date)),
    [activeEntries]
  );

  const viewPurchased = useMemo(() => purchases.reduce((s, e) => s + e.amount, 0), [purchases]);
  const viewSold = useMemo(() => sales.reduce((s, e) => s + e.amount, 0), [sales]);
  const viewNet = viewPurchased - viewSold;

  useEffect(() => {
    setPurchasePage(1);
    setSalePage(1);
  }, [selectedVendorId, allEntriesWithVendor.length]);

  // Filter vendors by search in dropdown
  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderEntryRow = (entry: VendorEntry & { vendorName?: string }, type: "purchase" | "sale") => (
    <tr key={`${entry.vendorId}-${entry.id}`} className="hover:bg-slate-50/80 transition-colors group">
      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">
        {entry.date.split("-").reverse().join("/")}
      </td>
      <td className="px-4 py-3.5">
        <div className="text-sm font-semibold text-slate-800">{entry.itemName}</div>
        {entry.note && <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">{entry.note}</div>}
      </td>
      {isAllVendors && (
        <td className="px-4 py-3.5">
          <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100">
            {entry.vendorName}
          </span>
        </td>
      )}
      <td className="px-4 py-3.5 text-xs text-slate-600">{entry.party}</td>
      <td className={`px-4 py-3.5 text-right text-sm font-bold font-mono ${type === "purchase" ? "text-red-600" : "text-green-600"}`}>
        ₹{fmt(entry.amount)}
      </td>
      <td className="px-3 py-3.5 w-8">
        <button
          onClick={() => onDeleteEntry(entry.vendorId, entry.id)}
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-red-50"
          title="Delete entry"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );

  const renderTable = (
    type: "purchase" | "sale",
    entries: (VendorEntry & { vendorName?: string })[],
    total: number
  ) => {
    const isPurchase = type === "purchase";
    const label = isPurchase ? "Purchases" : "Sales";
    const sublabel = isPurchase ? "Items bought" : "Items sold";
    const emptyText = isPurchase ? "No purchases recorded yet" : "No sales recorded yet";
    const colorBg = isPurchase ? "bg-red-50" : "bg-green-50";
    const colorText = isPurchase ? "text-red-700" : "text-green-700";
    const colorBorder = isPurchase ? "border-red-200" : "border-green-200";
    const IconComp = isPurchase ? TrendingDown : TrendingUp;
    const totalColor = isPurchase ? "text-red-600" : "text-green-600";
    const curPage = isPurchase ? purchasePage : salePage;
    const setCurPage = isPurchase ? setPurchasePage : setSalePage;
    const paginatedEntries = entries.slice((curPage - 1) * pageSize, curPage * pageSize);

    return (
      <div className="flex flex-col h-full">
        {/* Table header with total */}
        <div className={`px-5 py-3.5 ${colorBg} border-b ${colorBorder} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isPurchase ? "bg-red-100" : "bg-green-100"}`}>
              <IconComp size={14} className={colorText} />
            </div>
            <div>
              <div className={`text-sm font-bold ${colorText}`}>{label}</div>
              <div className="text-[10px] text-slate-500">{sublabel}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-base font-bold font-mono ${totalColor}`}>₹{fmt(total)}</div>
            <div className="text-[10px] text-slate-400">{entries.length} entries</div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <Package size={32} className="mx-auto mb-2 text-slate-200" />
              <p className="text-xs text-slate-400 font-medium">{emptyText}</p>
              <p className="text-[10px] text-slate-300 mt-1">Click "Add Entry" to get started</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item</th>
                  {isAllVendors && (
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor</th>
                  )}
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isPurchase ? "From" : "To"}</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedEntries.map(e => renderEntryRow(e, type))}
              </tbody>
              <tfoot>
                <tr className={`${colorBg} border-t ${colorBorder}`}>
                  <td colSpan={isAllVendors ? 4 : 3} className={`px-4 py-2.5 text-xs font-bold ${colorText}`}>
                    Total {label}
                  </td>
                  <td className={`px-4 py-2.5 text-right text-sm font-bold font-mono ${totalColor}`}>₹{fmt(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {entries.length > pageSize && (
          <Pagination
            currentPage={curPage}
            totalPages={Math.ceil(entries.length / pageSize)}
            onPageChange={setCurPage}
            totalItems={entries.length}
            pageSize={pageSize}
          />
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Vendor Tally</h1>
              <p className="text-xs text-slate-500 mt-0.5">Filter by vendor or view all transactions at once</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Vendor Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-white text-sm font-semibold transition-all min-w-[240px] justify-between ${searchOpen ? "border-blue-400 ring-2 ring-blue-100 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                    {isAllVendors ? <Layers size={12} className="text-blue-600" /> : <Package size={12} className="text-blue-600" />}
                  </div>
                  <span className="truncate text-slate-700">{isAllVendors ? "All Vendors" : selected?.name}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${searchOpen ? "rotate-180" : ""}`} />
              </button>

              {searchOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden min-w-[280px]">
                    {/* Search input */}
                    <div className="p-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search vendors..."
                          autoFocus
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    {/* Vendor list */}
                    <div className="max-h-60 overflow-y-auto py-1">
                      {/* Option: All Vendors */}
                      <button
                        onClick={() => { setSelectedVendorId("all"); setSearchOpen(false); setSearchQuery(""); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between gap-2 border-b border-slate-100 ${isAllVendors ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 font-semibold"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isAllVendors ? "bg-blue-100" : "bg-slate-100"}`}>
                            <Layers size={11} className={isAllVendors ? "text-blue-600" : "text-slate-500"} />
                          </div>
                          <span>All Vendors Overview</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">({vendors.length} vendors)</span>
                      </button>

                      {filteredVendors.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          <Package size={20} className="mx-auto mb-1.5 text-slate-300" />
                          No vendors found
                        </div>
                      ) : (
                        filteredVendors.map(v => {
                          const vPurch = (v.VendorEntries || []).filter(e => e.type === "purchase").reduce((s, e) => s + e.amount, 0);
                          const vSold = (v.VendorEntries || []).filter(e => e.type === "sale").reduce((s, e) => s + e.amount, 0);
                          const isActive = v.id === selectedVendorId;
                          return (
                            <button
                              key={v.id}
                              onClick={() => { setSelectedVendorId(v.id); setSearchOpen(false); setSearchQuery(""); }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between gap-2 ${isActive ? "bg-blue-50 border-l-3 border-l-blue-500" : ""
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isActive ? "bg-blue-100" : "bg-slate-100"}`}>
                                  <Package size={11} className={isActive ? "text-blue-600" : "text-slate-500"} />
                                </div>
                                <span className={`truncate ${isActive ? "font-bold text-blue-700" : "text-slate-700"}`}>{v.name}</span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0 text-[10px] font-mono">
                                <span className="text-red-500">↓₹{fmt(vPurch)}</span>
                                <span className="text-green-600">↑₹{fmt(vSold)}</span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Add Entry button */}
            <button
              onClick={() => setShowEntryModal(true)}
              disabled={vendors.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} /> Add Entry
            </button>
          </div>
        </div>

        {/* Quick summary bar */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {isAllVendors ? "All Vendors Summary" : `${selected?.name} Summary`}:
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-500">Purchased</span>
            <span className="text-sm font-bold font-mono text-red-600">₹{fmt(viewPurchased)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-500">Sold</span>
            <span className="text-sm font-bold font-mono text-green-600">₹{fmt(viewSold)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${viewNet >= 0 ? "bg-orange-500" : "bg-blue-500"}`}></div>
            <span className="text-xs text-slate-500">{viewNet >= 0 ? "Payable" : "Receivable"}</span>
            <span className={`text-sm font-bold font-mono ${viewNet >= 0 ? "text-orange-600" : "text-blue-600"}`}>
              ₹{fmt(Math.abs(viewNet))}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400">
            <Package size={11} />
            <span>{activeEntries.length} total entries</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {vendors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={28} className="text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No vendors yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the <strong>"Vendors"</strong> button in the header to add your first vendor, then come back here to track purchases & sales.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 50-50 Split: Purchases | Sales */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
              {renderTable("purchase", purchases, viewPurchased)}
            </div>
            <div className="flex-1 bg-white flex flex-col overflow-hidden">
              {renderTable("sale", sales, viewSold)}
            </div>
          </div>

          {/* Bottom: Grand Summary */}
          <div className="bg-white border-t-2 border-slate-200 px-6 py-4 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Minus size={14} className="text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Summary — All Vendors</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-xl border border-red-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <TrendingDown size={18} className="text-red-600" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-red-500 tracking-wide">Total Purchased</div>
                  <div className="text-lg font-bold font-mono text-red-700 mt-0.5">₹{fmt(grandPurchased)}</div>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl border border-green-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} className="text-green-600" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-green-600 tracking-wide">Total Sold</div>
                  <div className="text-lg font-bold font-mono text-green-700 mt-0.5">₹{fmt(grandSold)}</div>
                </div>
              </div>
              <div className={`rounded-xl border p-4 flex items-center gap-4 ${grandNet >= 0 ? "bg-orange-50 border-orange-100" : "bg-blue-50 border-blue-100"}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${grandNet >= 0 ? "bg-orange-100" : "bg-blue-100"}`}>
                  <Minus size={18} className={grandNet >= 0 ? "text-orange-600" : "text-blue-600"} />
                </div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${grandNet >= 0 ? "text-orange-600" : "text-blue-600"}`}>
                    {grandNet >= 0 ? "Net Payable" : "Net Receivable"}
                  </div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${grandNet >= 0 ? "text-orange-700" : "text-blue-700"}`}>
                    ₹{fmt(Math.abs(grandNet))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <VendorEntryModal
        show={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        vendors={vendors}
        selectedVendorId={isAllVendors ? (vendors[0]?.id || "") : (selectedVendorId as number)}
        onSubmit={(vendorId, entry) => onAddEntry(vendorId, entry)}
      />
    </div>
  );
}
