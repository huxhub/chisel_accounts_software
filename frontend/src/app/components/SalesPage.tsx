import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Edit3, Plus, Search, Trash2, X, Filter } from "lucide-react";
import { API_BASE_URL } from "../../services/config";
import type { Account } from "../types";
import { Pagination } from "./ui/pagination";

type Sale = {
  id: number;
  saleBatchId?: string;
  partyName: string;
  name: string;
  quantity: string;
  unit: "kg" | "box";
  unitPrice: number;
  amount: number;
  paidAmount: number;
  paymentStatus: string;
  linkedAccountId: number | null;
  createdAt: string;
};
type Row = { name: string; unit: "kg" | "box"; quantity: string; rate: string };
const blank = (): Row => ({ name: "", unit: "kg", quantity: "", rate: "" });
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export function SalesPage({ accounts, onSalesChanged }: { accounts: Account[]; onSalesChanged?: () => void }) {
  const companies = accounts.filter(account => account.type === "company");
  const [sales, setSales] = useState<Sale[]>([]);
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "not_paid" | "partial">("not_paid");
  const [paidAmount, setPaidAmount] = useState("0");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  const token = localStorage.getItem("auth_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const request = async (path = "", init: RequestInit = {}) => {
    const r = await fetch(`${API_BASE_URL}/api/sales${path}`, {
      ...init,
      credentials: "include",
      headers: { ...headers, ...init.headers },
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || "Sales request failed");
    return d;
  };

  const load = () => request().then(setSales).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const date = String(s.createdAt).slice(0, 10);
      return (
        `${s.partyName} ${s.name}`.toLowerCase().includes(search.toLowerCase()) &&
        (statusFilter === "all" || s.paymentStatus === statusFilter) &&
        (!from || date >= from) &&
        (!to || date <= to)
      );
    });
  }, [sales, search, statusFilter, from, to]);

  const groups = useMemo(() => {
    const grouped = new Map<string, Sale[]>();
    filtered.forEach(s => {
      const key = s.saleBatchId || `legacy-${s.id}`;
      grouped.set(key, [...(grouped.get(key) || []), s]);
    });
    return [...grouped.entries()].map(([key, items]) => ({
      key,
      items,
      first: items[0],
      amount: items.reduce((sum, s) => sum + Number(s.amount), 0),
      received: items.reduce((sum, s) => sum + Number(s.paidAmount), 0),
    }));
  }, [filtered]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, from, to, groups.length]);

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return groups.slice(start, start + pageSize);
  }, [groups, currentPage, pageSize]);

  const revenue = filtered.reduce((a, s) => a + Number(s.amount), 0);
  const received = filtered.reduce((a, s) => a + Number(s.paidAmount), 0);
  const pending = Math.max(0, revenue - received);

  const itemSuggestions = useMemo(() => {
    return Array.from(new Set(sales.map(s => s.name?.trim()).filter(Boolean)));
  }, [sales]);

  const customerSuggestions = useMemo(() => {
    return Array.from(new Set(sales.map(s => s.partyName?.trim()).filter(Boolean)));
  }, [sales]);

  const setRow = (i: number, p: Partial<Row>) => setRows(cur => cur.map((r, n) => (n === i ? { ...r, ...p } : r)));

  const handleItemNameChange = (index: number, name: string) => {
    const match = sales.find(s => s.name?.trim().toLowerCase() === name.trim().toLowerCase());
    if (match && !rows[index]?.rate) {
      setRow(index, {
        name,
        unit: match.unit || rows[index]?.unit,
        rate: match.unitPrice ? String(match.unitPrice) : rows[index]?.rate,
      });
    } else {
      setRow(index, { name });
    }
  };

  const toggleGroup = (key: string) =>
    setExpandedGroups(current => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const openNew = () => {
    setEditing(null);
    setEditingBatch(null);
    setCustomer("");
    setRows([blank()]);
    setPaymentStatus("not_paid");
    setPaidAmount("0");
    setLinkedAccountId("");
    setOpen(true);
  };

  const openEdit = (s: Sale) => {
    setEditing(s);
    setEditingBatch(null);
    setCustomer(s.partyName);
    setRows([{ name: s.name, unit: s.unit, quantity: String(s.quantity), rate: String(s.unitPrice) }]);
    setPaymentStatus(s.paymentStatus as "paid" | "not_paid" | "partial");
    setPaidAmount(String(s.paidAmount || 0));
    setLinkedAccountId(s.linkedAccountId ? String(s.linkedAccountId) : "");
    setOpen(true);
  };

  const openEditGroup = (group: any) => {
    setEditing(null);
    setEditingBatch(group);
    setCustomer(group.first.partyName);
    setLinkedAccountId(group.first.linkedAccountId ? String(group.first.linkedAccountId) : "");
    setRows(
      group.items.map((s: Sale) => ({
        name: s.name,
        unit: s.unit,
        quantity: String(s.quantity),
        rate: String(s.unitPrice),
      }))
    );
    setPaymentStatus(
      group.received >= group.amount && group.amount > 0
        ? "paid"
        : group.received > 0
        ? "partial"
        : "not_paid"
    );
    setPaidAmount(String(group.received || 0));
    setOpen(true);
  };

  const removeGroup = async (group: any) => {
    if (!window.confirm(`Delete entire sale for "${group.first.partyName}" with ${group.items.length} item(s)?`)) return;
    try {
      await request(`/batch/${group.key}`, { method: "DELETE" });
      load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to delete sale");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const totalAmount = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.rate) || 0), 0);
      const calculatedPaid =
        paymentStatus === "paid"
          ? totalAmount
          : paymentStatus === "not_paid"
          ? 0
          : Number(paidAmount || 0);

      if (editingBatch) {
        await request(`/batch/${editingBatch.key}`, {
          method: "PUT",
          body: JSON.stringify({
            partyName: customer,
            paymentStatus,
            paidAmount: calculatedPaid,
            linkedAccountId: linkedAccountId || null,
            items: rows.map(r => ({ name: r.name, unit: r.unit, quantity: r.quantity, unitPrice: r.rate })),
          }),
        });
      } else if (editing) {
        const r = rows[0];
        const amount = Number(r.quantity) * Number(r.rate);
        await request(`/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({
            partyName: customer,
            ...r,
            unitPrice: r.rate,
            paidAmount:
              paymentStatus === "paid"
                ? amount
                : paymentStatus === "not_paid"
                ? 0
                : Number(paidAmount || 0),
            linkedAccountId: linkedAccountId || null,
          }),
        });
      } else {
        await request("/batch", {
          method: "POST",
          body: JSON.stringify({
            partyName: customer,
            paymentStatus,
            paidAmount: calculatedPaid,
            linkedAccountId: linkedAccountId || null,
            items: rows.map(r => ({ name: r.name, unit: r.unit, quantity: r.quantity, unitPrice: r.rate })),
          }),
        });
      }
      setOpen(false);
      load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to save sale");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Sale) => {
    if (!window.confirm(`Delete sale item "${s.name}" for ${s.partyName}?`)) return;
    try {
      await request(`/${s.id}`, { method: "DELETE" });
      load();
      onSalesChanged?.();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to delete sale");
    }
  };

  return (
    <div className="min-h-full space-y-4 sm:space-y-5 bg-slate-50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Module</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Sales</h1>
        </div>
        <button
          onClick={openNew}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-bold text-white shadow-2xs hover:bg-primary/90 transition-all"
        >
          <Plus size={16} /> Add sale
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
        <Stat label="Total revenue" value={revenue} />
        <Stat label="Received" value={received} />
        <Stat label="Pending" value={pending} />
        <div className="border border-slate-200 bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs">
          <p className="text-xs font-bold uppercase text-slate-500">Entries</p>
          <p className="mt-1 sm:mt-2 font-mono text-lg sm:text-xl font-bold text-slate-900">{filtered.length}</p>
        </div>
      </div>

      {/* Main Table & Collapsible Filter Section */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {/* Filter Toggle Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            >
              <Filter size={14} className={showFilters ? "text-primary" : "text-slate-500"} />
              <span>{showFilters ? "Hide Filters" : "View Filters"}</span>
            </button>
            {(search || statusFilter !== "all" || from || to) && (
              <span className="text-[11px] font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                Filters active
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium">
            {filtered.length} entries
          </span>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 items-end gap-3 border-b border-slate-200 p-4 bg-slate-50/30">
            <label className="block xl:col-span-1">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Search</span>
              <span className="relative block">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Customer or item"
                  className="h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </span>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-500">Payment status</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partially paid</option>
                <option value="not_paid">Not paid</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-500">From date</span>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-500">To date</span>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setFrom("");
                setTo("");
              }}
              className="h-11 justify-self-start px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <X size={14} /> Clear filters
            </button>
          </div>
        )}

        {/* Sales Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-600">
              <tr>
                <th className="py-3 px-2 sm:px-3 text-left w-12">SL NO</th>
                <th className="py-3 px-2 sm:px-3 text-left whitespace-nowrap">DATE</th>
                <th className="py-3 px-2 sm:px-3 text-left">CUSTOMER</th>
                <th className="py-3 px-2 sm:px-3 text-left whitespace-nowrap">ITEMS</th>
                <th className="py-3 px-2 sm:px-3 text-right whitespace-nowrap">AMOUNT</th>
                <th className="py-3 px-2 sm:px-3 text-right whitespace-nowrap">RECEIVED</th>
                <th className="py-3 px-2 sm:px-3 text-right whitespace-nowrap">PENDING</th>
                <th className="py-3 pl-6 pr-3 sm:pl-8 text-center whitespace-nowrap">STATUS</th>
                <th className="py-3 px-2 sm:px-3 text-right whitespace-nowrap w-28">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGroups.map((group, localIndex) => {
                const index = (currentPage - 1) * pageSize + localIndex;
                const expanded = expandedGroups.has(group.key);
                const pendingAmount = Math.max(0, group.amount - group.received);
                const status =
                  group.received >= group.amount && group.amount > 0
                    ? "Paid"
                    : group.received > 0
                    ? "Partially paid"
                    : "Not paid";
                return (
                  <Fragment key={group.key}>
                    <tr
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      onClick={() => toggleGroup(group.key)}
                      onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleGroup(group.key);
                        }
                      }}
                      className="cursor-pointer border-t border-slate-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors"
                    >
                      <td className="py-3 px-2 sm:px-3 text-slate-500 font-medium">{index + 1}</td>
                      <td className="py-3 px-2 sm:px-3 whitespace-nowrap text-slate-600">{new Date(group.first.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="py-3 px-2 sm:px-3 font-semibold text-slate-900 truncate max-w-[140px]">{group.first.partyName}</td>
                      <td className="py-3 px-2 sm:px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{" "}
                          {group.items.length} {group.items.length === 1 ? "item" : "items"}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-right font-mono font-bold whitespace-nowrap">{money(group.amount)}</td>
                      <td className="py-3 px-2 sm:px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">{money(group.received)}</td>
                      <td className="py-3 px-2 sm:px-3 text-right font-mono font-bold text-amber-700 whitespace-nowrap">{money(pendingAmount)}</td>
                      <td className="py-3 pl-6 pr-3 sm:pl-8 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            status === "Paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : status === "Partially paid"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openEditGroup(group)}
                            title="Edit entire sale"
                            className="rounded p-1 text-slate-600 hover:bg-blue-50 hover:text-primary transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGroup(group)}
                            title="Delete entire sale"
                            className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.key)}
                            className="text-slate-500 text-xs font-medium hover:text-slate-900 transition-colors px-1"
                          >
                            {expanded ? "Hide" : "View"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded &&
                      group.items.map((s, itemIndex) => (
                        <tr key={s.id} className="border-t border-slate-100 bg-slate-50/70">
                          <td className="py-2.5 px-2 sm:px-3 pl-4 sm:pl-6 text-slate-400 text-xs">
                            {index + 1}.{itemIndex + 1}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap text-slate-500 text-xs">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                          <td className="py-2.5 px-2 sm:px-3 text-slate-400 text-xs">—</td>
                          <td className="py-2.5 px-2 sm:px-3 text-xs text-slate-700">
                            {s.name} ({s.quantity} {s.unit})
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-mono font-semibold text-xs whitespace-nowrap">{money(Number(s.amount))}</td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-mono font-semibold text-emerald-700 text-xs whitespace-nowrap">
                            {money(Number(s.paidAmount))}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right font-mono font-semibold text-amber-700 text-xs whitespace-nowrap">
                            {money(Math.max(0, Number(s.amount) - Number(s.paidAmount)))}
                          </td>
                          <td className="py-2.5 pl-6 pr-3 sm:pl-8 text-center text-xs text-slate-500 capitalize whitespace-nowrap">
                            {s.paymentStatus.replace("_", " ")}
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  openEdit(s);
                                }}
                                title="Edit sale item"
                                className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-primary transition-colors"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  remove(s);
                                }}
                                title="Delete sale item"
                                className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {groups.length === 0 && (
            <p className="p-8 sm:p-10 text-center text-sm text-slate-500">No sales match these filters.</p>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(groups.length / pageSize)}
          onPageChange={setCurrentPage}
          totalItems={groups.length}
          pageSize={pageSize}
        />
      </section>

      {/* Modal - Responsive Form */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <form
            onSubmit={save}
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-7 shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingBatch
                  ? `Edit sale (${rows.length} item${rows.length === 1 ? "" : "s"})`
                  : editing
                  ? "Edit sale item"
                  : "Add sales entry"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer & Company Account */}
            <div className="mt-4 space-y-4">
              <label className="block font-semibold text-sm text-slate-700">
                Customer name
                <div className="mt-1">
                  <AutocompleteInput
                    value={customer}
                    onChange={setCustomer}
                    suggestions={customerSuggestions}
                    placeholder="Customer or company name"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  />
                </div>
              </label>

              <div>
                <label className="block font-semibold text-sm text-slate-700">
                  Credit received to company
                  <select
                    value={linkedAccountId}
                    onChange={e => setLinkedAccountId(e.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">
                      {companies.length ? "Do not credit a company account" : "No company accounts available"}
                    </option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Choose where the received amount should be credited.
                  </span>
                </label>
              </div>
            </div>

            {/* Sales Items Section */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sales Items</span>
              </div>

              {/* Desktop Table Headers */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-bold text-slate-500 pb-1">
                <span className="sm:col-span-4">ITEM NAME</span>
                <span className="sm:col-span-2">UNIT</span>
                <span className="sm:col-span-2">QUANTITY</span>
                <span className="sm:col-span-2">RATE PER UNIT</span>
                <span className="sm:col-span-2 text-right pr-2">AMOUNT</span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {rows.map((r, i) => {
                  const amount = (Number(r.quantity) || 0) * (Number(r.rate) || 0);
                  return (
                    <div key={i}>
                      {/* Mobile Item Card */}
                      <div className="sm:hidden bg-slate-50/80 rounded-xl p-3 border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Item #{i + 1}</span>
                          {rows.length > 1 && (!editing || editingBatch) && (
                            <button
                              type="button"
                              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                              className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </div>
                        <AutocompleteInput
                          value={r.name}
                          onChange={val => handleItemNameChange(i, val)}
                          onSelect={val => handleItemNameChange(i, val)}
                          suggestions={itemSuggestions}
                          placeholder="Item name"
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Unit</label>
                            <select
                              value={r.unit}
                              onChange={e => setRow(i, { unit: e.target.value as "kg" | "box" })}
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              <option value="kg">Kg</option>
                              <option value="box">Box</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Quantity</label>
                            <input
                              required
                              type="number"
                              min="0.01"
                              step="any"
                              value={r.quantity}
                              onChange={e => setRow(i, { quantity: e.target.value })}
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rate</label>
                            <input
                              required
                              type="number"
                              min="0"
                              step="0.01"
                              value={r.rate}
                              onChange={e => setRow(i, { rate: e.target.value })}
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Rate"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-xs">
                          <span className="font-semibold text-slate-500">Subtotal:</span>
                          <span className="font-mono font-bold text-slate-900">{money(amount)}</span>
                        </div>
                      </div>

                      {/* Desktop Grid Row */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-4">
                          <AutocompleteInput
                            value={r.name}
                            onChange={val => handleItemNameChange(i, val)}
                            onSelect={val => handleItemNameChange(i, val)}
                            suggestions={itemSuggestions}
                            placeholder="Item name"
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <select
                            value={r.unit}
                            onChange={e => setRow(i, { unit: e.target.value as "kg" | "box" })}
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                          >
                            <option value="kg">Kg</option>
                            <option value="box">Box</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            required
                            type="number"
                            min="0.01"
                            step="any"
                            value={r.quantity}
                            onChange={e => setRow(i, { quantity: e.target.value })}
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="0"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={r.rate}
                            onChange={e => setRow(i, { rate: e.target.value })}
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder={`Rate / ${r.unit}`}
                          />
                        </div>
                        <div className="sm:col-span-2 flex h-11 items-center justify-between rounded-lg bg-slate-100 px-3 font-mono text-sm font-semibold">
                          <span className="truncate">{money(amount)}</span>
                          {rows.length > 1 && (!editing || editingBatch) && (
                            <button
                              type="button"
                              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                              className="text-slate-400 hover:text-red-600 transition-colors ml-1.5 shrink-0"
                              title="Delete row"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(!editing || editingBatch) && (
                <button
                  type="button"
                  onClick={() => setRows(r => [...r, blank()])}
                  className="mt-3 text-sm font-bold text-primary hover:underline flex items-center gap-1"
                >
                  + Add item
                </button>
              )}
            </div>

            {/* Payment Status & Amount Received */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 pt-3 border-t border-slate-100">
              <label className="block font-semibold text-sm text-slate-700">
                Payment status
                <select
                  value={paymentStatus}
                  onChange={e => {
                    const v = e.target.value as "paid" | "not_paid" | "partial";
                    setPaymentStatus(v);
                    if (v === "paid")
                      setPaidAmount(String(rows.reduce((a, r) => a + Number(r.quantity || 0) * Number(r.rate || 0), 0)));
                    if (v === "not_paid") setPaidAmount("0");
                  }}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="not_paid">Not paid</option>
                  <option value="partial">Partially paid</option>
                  <option value="paid">Paid</option>
                </select>
              </label>

              <label className="block font-semibold text-sm text-slate-700">
                Amount received
                <input
                  type="number"
                  min="0"
                  max={rows.reduce((a, r) => a + Number(r.quantity || 0) * Number(r.rate || 0), 0)}
                  step="0.01"
                  value={paidAmount}
                  onChange={e => {
                    setPaidAmount(e.target.value);
                    if (Number(e.target.value) === 0) setPaymentStatus("not_paid");
                    else setPaymentStatus("partial");
                  }}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Pending:{" "}
                  {money(
                    Math.max(
                      0,
                      rows.reduce((a, r) => a + Number(r.quantity || 0) * Number(r.rate || 0), 0) -
                        Number(paidAmount || 0),
                    ),
                  )}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="h-11 rounded-lg bg-primary px-5 font-bold text-white shadow-2xs hover:bg-primary/90 transition-all flex items-center justify-center"
              >
                {saving ? "Saving..." : editing ? "Save changes" : "Save sale"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 sm:mt-2 font-mono text-lg sm:text-xl font-bold text-slate-900">{money(value)}</p>
    </div>
  );
}

function AutocompleteInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = "",
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    if (!value.trim()) return suggestions.slice(0, 8);
    const q = value.toLowerCase();
    return suggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
  }, [value, suggestions]);

  return (
    <div className="relative w-full">
      <input
        required
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className={`w-full ${className}`}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto py-1 divide-y divide-slate-100">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                onChange(item);
                if (onSelect) onSelect(item);
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm text-slate-800 hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between font-medium cursor-pointer"
            >
              <span>{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
