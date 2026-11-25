import { Fragment, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { API_BASE_URL } from "../../services/config";
import type { Account } from "../types";
import { Pagination } from "./ui/pagination";

export type InventoryTransaction = {
  id: number;
  partyName?: string;
  transactionType?: "purchase" | "sale";
  saleBatchId?: string | null;
  name: string;
  quantity: string | number;
  unit: "kg" | "box";
  amount: string | number;
  paidAmount?: string | number;
  linkedAccountId?: number | null;
  unitPrice?: string | number | null;
  paymentStatus: "paid" | "not_paid" | "partial";
  createdAt: string;
};
export type Item = {
  id: number;
  name: string;
  quantity: string | number;
  unit: string;
  transactions?: InventoryTransaction[];
};

export async function inventoryRequest(path = "", options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_BASE_URL}/api/inventory${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Unable to load inventory.");
  return data;
}

const fieldClass =
  "mt-1.5 w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

export function AddInventoryDialog({
  open,
  setOpen,
  onItemsChanged,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onItemsChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await inventoryRequest("", {
        method: "POST",
        body: JSON.stringify({ name, quantity: 0, unit: "pcs" }),
      });
      setName("");
      setOpen(false);
      onItemsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add company.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add inventory company</DialogTitle>
          <DialogDescription>
            Create a company for tracking its inventory transactions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Company name
            <input
              autoFocus
              required
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Company 1"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 px-4 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              disabled={saving || !name.trim()}
              className="min-h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add company"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type SalesRow = {
  name: string;
  unit: "kg" | "box";
  quantity: string;
  unitPrice: string;
};
const emptySalesRow = (): SalesRow => ({
  name: "",
  unit: "kg",
  quantity: "",
  unitPrice: "",
});

function SalesEntryDialog({
  open,
  setOpen,
  item,
  accounts,
  editingSale,
  onSaved,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  item: Item;
  accounts: Account[];
  editingSale: InventoryTransaction | null;
  onSaved: (entries: InventoryTransaction[]) => void;
}) {
  const [partyName, setPartyName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "not_paid" | "partial">(
    "not_paid",
  );
  const [receivedAmount, setReceivedAmount] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [rows, setRows] = useState<SalesRow[]>([emptySalesRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const reset = () => {
    setPartyName("");
    setPaymentStatus("not_paid");
    setLinkedAccountId("");
    setReceivedAmount("");
    setRows([emptySalesRow()]);
    setError("");
  };
  useEffect(() => {
    if (!open || !editingSale) return;
    setPartyName(editingSale.partyName || "");
    setLinkedAccountId(editingSale.linkedAccountId ? String(editingSale.linkedAccountId) : "");
    setPaymentStatus(editingSale.paymentStatus);
    setReceivedAmount(String(editingSale.paidAmount ?? (editingSale.paymentStatus === "paid" ? editingSale.amount : 0)));
    setRows([{
      name: editingSale.name,
      unit: editingSale.unit || "kg",
      quantity: String(editingSale.quantity),
      unitPrice: String(editingSale.unitPrice ?? (Number(editingSale.quantity) ? Number(editingSale.amount) / Number(editingSale.quantity) : 0)),
    }]);
  }, [open, editingSale]);
  const updateRow = (index: number, patch: Partial<SalesRow>) =>
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  const total = rows.reduce(
    (sum, row) =>
      sum + (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0),
    0,
  );
  const valid =
    partyName.trim() &&
    rows.every(
      (row) =>
        row.name.trim() &&
        Number(row.quantity) > 0 &&
        Number(row.unitPrice) >= 0 &&
        row.unitPrice !== "",
    );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const isEditing = Boolean(editingSale);
      const saleAmount = Number(rows[0].quantity) * Number(rows[0].unitPrice);
      const entries = await inventoryRequest(isEditing ? `/${item.id}/transactions/${editingSale!.id}` : `/${item.id}/transactions/batch`, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify({
          ...(isEditing ? {
            partyName,
            transactionType: "sale",
            name: rows[0].name,
            quantity: rows[0].quantity,
            unit: rows[0].unit,
            unitPrice: Number(rows[0].unitPrice),
            amount: saleAmount,
            paidAmount: paymentStatus === "paid" ? saleAmount : paymentStatus === "partial" ? Number(receivedAmount || 0) : 0,
            linkedAccountId: linkedAccountId || null,
            paymentStatus,
          } : {
            partyName,
            paymentStatus,
            linkedAccountId: linkedAccountId || null,
            items: rows.map((row) => ({
              ...row,
              amount: (Number(row.quantity) * Number(row.unitPrice)).toFixed(2),
            })),
          }),
        }),
      });
      onSaved(isEditing ? [entries] : entries);
      reset();
      setOpen(false);
      toast.success(
        isEditing ? "Sale updated" : `${entries.length} sales item${entries.length === 1 ? "" : "s"} added`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add sales entry.",
      );
      toast.error("Failed to add sales entry");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!saving) {
          setOpen(value);
          if (!value) reset();
        }
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-5 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>{editingSale ? "Edit sales entry" : "Add sales entry"}</DialogTitle>
          <DialogDescription>
            {editingSale ? "Update this sale and its credited company amount." : "Add one customer and all items sold to them."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              autoFocus
              required
              maxLength={255}
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className={fieldClass}
              placeholder="Customer name"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Credit received to company
            <select value={linkedAccountId} onChange={(e) => setLinkedAccountId(e.target.value)} className={fieldClass}>
              <option value="">Do not update a company balance</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">Paid sales are credited to this company.</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Items sold</h4>
              {!editingSale && <button
                type="button"
                onClick={() =>
                  setRows((current) => [...current, emptySalesRow()])
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-200 px-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
              >
                <Plus size={15} /> Add item
              </button>}
            </div>
            {rows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-12"
              >
                <label className="text-sm font-semibold text-slate-700 sm:col-span-4">
                  Item name
                  <input
                    required
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    className={fieldClass}
                    placeholder={`Item ${index + 1}`}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Unit
                  <select
                    value={row.unit}
                    onChange={(e) =>
                      updateRow(index, {
                        unit: e.target.value as "kg" | "box",
                        quantity: "",
                      })
                    }
                    className={fieldClass}
                  >
                    <option value="kg">Kg</option>
                    <option value="box">Box</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Quantity
                  <input
                    required
                    type="number"
                    min={row.unit === "box" ? "1" : "0.01"}
                    step={row.unit === "box" ? "1" : "0.01"}
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(index, { quantity: e.target.value })
                    }
                    className={fieldClass}
                    placeholder="0"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Per {row.unit}
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.unitPrice}
                    onChange={(e) =>
                      updateRow(index, { unitPrice: e.target.value })
                    }
                    className={fieldClass}
                    placeholder="0.00"
                  />
                </label>
                <div className="flex items-end gap-2 sm:col-span-2">
                  <div className="min-h-11 flex-1 rounded-lg bg-slate-100 px-3 py-3 text-sm font-bold text-slate-800">
                    ₹
                    {(
                      (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)
                    ).toFixed(2)}
                  </div>
                  {!editingSale && rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setRows((current) =>
                          current.filter((_, rowIndex) => rowIndex !== index),
                        )
                      }
                      className="min-h-11 rounded-lg px-2 text-red-600 hover:bg-red-50"
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Payment status
              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as "paid" | "not_paid" | "partial")
                }
                className={fieldClass}
              >
                <option value="not_paid">Not paid</option>
                {editingSale && <option value="partial">Partially received</option>}
                <option value="paid">Paid</option>
              </select>
            </label>
            <div className="rounded-lg bg-blue-50 p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Sales total
              </span>
              <div className="mt-1 text-xl font-bold text-blue-900">
                ₹
                {total.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
          {editingSale && paymentStatus === "partial" && (
            <label className="block text-sm font-semibold text-slate-700">
              Received amount
              <input type="number" min="0" max={total} step="0.01" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} className={fieldClass} />
            </label>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 px-4 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              disabled={saving || !valid}
              className="min-h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : editingSale ? "Save sale changes" : "Add sales entry"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryDetail({
  item,
  accounts,
  section = "purchase",
  onTransactionsChanged,
  onDeleteCompany,
}: {
  item: Item;
  accounts: Account[];
  section?: "purchase" | "sale";
  onTransactionsChanged: () => void;
  onDeleteCompany: () => Promise<void>;
}) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<"purchase">("purchase");
  const [salesOpen, setSalesOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<InventoryTransaction | null>(null);
  const [partyName, setPartyName] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"kg" | "box">("kg");
  const [boxValue, setBoxValue] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "paid" | "not_paid" | "partial"
  >("not_paid");
  const [search, setSearch] = useState("");
  const [itemFilter, setItemFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedSaleBatches, setExpandedSaleBatches] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  useEffect(() => {
    setActiveView("purchase");
    setLoading(true);
    setError("");
    inventoryRequest(`/${item.id}/transactions`)
      .then(setTransactions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [item.id]);
  useEffect(() => {
    setSearch("");
    setItemFilter("all");
    setPaymentFilter("all");
    setFromDate("");
    setToDate("");
  }, [activeView]);
  useEffect(() => {
    if (section === "sale" && sessionStorage.getItem("open-sales-entry") === String(item.id)) {
      sessionStorage.removeItem("open-sales-entry");
      setSalesOpen(true);
    }
  }, [item.id, section]);
  const resetForm = () => {
    setPartyName("");
    setName("");
    setQuantity("");
    setUnit("kg");
    setBoxValue("");
    setAmount("");
    setPaidAmount("");
    setLinkedAccountId("");
    setPaymentStatus("not_paid");
    setEditingId(null);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const transactionType = editingId
        ? transactions.find((entry) => entry.id === editingId)
            ?.transactionType || "purchase"
        : "purchase";
      const tx = await inventoryRequest(
        `/${item.id}/transactions${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            partyName,
            transactionType,
            name,
            quantity,
            unit,
            amount,
            paidAmount: paidAmount || 0,
            linkedAccountId: linkedAccountId || null,
            unitPrice: unit === "box" ? boxValue : null,
            paymentStatus,
          }),
        },
      );
      setTransactions((current) =>
        editingId
          ? current.map((entry) => (entry.id === editingId ? tx : entry))
          : [tx, ...current],
      );
      resetForm();
      setOpen(false);
      onTransactionsChanged();
      toast.success(editingId ? "Transaction updated" : "Transaction added");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save transaction.",
      );
      toast.error("Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };
  const editTransaction = (tx: InventoryTransaction) => {
    if ((tx.transactionType || "purchase") === "sale") {
      setEditingSale(tx);
      setError("");
      setSalesOpen(true);
      return;
    }
    const nextUnit = tx.unit || "kg";
    const nextQuantity = String(tx.quantity);
    setEditingId(tx.id);
    setPartyName(tx.partyName || "");
    setName(tx.name);
    setQuantity(nextQuantity);
    setUnit(nextUnit);
    setAmount(String(tx.amount ?? 0));
    setPaidAmount(
      String(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0)),
    );
    setLinkedAccountId(tx.linkedAccountId ? String(tx.linkedAccountId) : "");
    setBoxValue(
      nextUnit === "box" && Number(nextQuantity) > 0
        ? String(Number(tx.amount ?? 0) / Number(nextQuantity))
        : "",
    );
    setPaymentStatus(tx.paymentStatus);
    setActiveView((tx.transactionType || "purchase") === "sale" ? "sale" : "purchase");
    setError("");
    setOpen(true);
  };
  const deleteTransaction = async (tx: InventoryTransaction) => {
    if (!window.confirm(`Delete ${tx.name}?`)) return;
    try {
      await inventoryRequest(`/${item.id}/transactions/${tx.id}`, {
        method: "DELETE",
      });
      setTransactions((current) =>
        current.filter((entry) => entry.id !== tx.id),
      );
      onTransactionsChanged();
      toast.success(`Deleted ${tx.name}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete transaction.",
      );
      toast.error("Failed to delete transaction");
    }
  };
  const togglePayment = async (tx: InventoryTransaction) => {
    const nextStatus = tx.paymentStatus === "paid" ? "not_paid" : "paid";
    const nextPaid = nextStatus === "paid" ? Number(tx.amount) : 0;
    try {
      const updated = await inventoryRequest(
        `/${item.id}/transactions/${tx.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            partyName: tx.partyName || "Unassigned",
            name: tx.name,
            quantity: String(tx.quantity),
            unit: tx.unit || "kg",
            amount: tx.amount ?? 0,
            paidAmount: nextPaid,
            linkedAccountId: tx.linkedAccountId || null,
            transactionType: tx.transactionType || "purchase",
            paymentStatus: nextStatus,
          }),
        },
      );
      setTransactions((current) =>
        current.map((entry) => (entry.id === tx.id ? updated : entry)),
      );
      onTransactionsChanged();
      toast.success(
        nextStatus === "paid"
          ? `Marked "${tx.name}" as Paid`
          : `Marked "${tx.name}" as Not Paid`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update payment status.",
      );
      toast.error("Failed to update payment status");
    }
  };
  const displayedTransactions = transactions.filter(
    (tx) => (tx.transactionType || "purchase") === activeView,
  );
  const editingTransaction = editingId
    ? transactions.find((entry) => entry.id === editingId)
    : undefined;
  const isSaleEdit = (editingTransaction?.transactionType || "purchase") === "sale";
  const totalAmount = displayedTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0,
  );
  const paidAmountTotal = displayedTransactions.reduce(
    (sum, tx) =>
      sum +
      Number(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0)),
    0,
  );
  const pendingAmount = displayedTransactions.reduce(
    (sum, tx) =>
      sum +
      Math.max(
        0,
        Number(tx.amount || 0) -
          Number(
            tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0),
          ),
      ),
    0,
  );
  const paidCount = displayedTransactions.filter(
    (tx) => tx.paymentStatus === "paid",
  ).length;
  const unpaidCount = displayedTransactions.filter(
    (tx) =>
      Number(tx.amount || 0) >
      Number(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0)),
  ).length;
  const filtered = displayedTransactions.filter(
    (tx) =>
      `${tx.partyName || ""} ${tx.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (itemFilter === "all" || tx.name === itemFilter) &&
      (paymentFilter === "all" || tx.paymentStatus === paymentFilter) &&
      (!fromDate || String(tx.createdAt).slice(0, 10) >= fromDate) &&
      (!toDate || String(tx.createdAt).slice(0, 10) <= toDate),
  );
  const saleGroups = activeView === "sale"
    ? Array.from(filtered.reduce((groups, tx) => {
      const key = tx.saleBatchId || `single-${tx.id}`;
      const group = groups.get(key) || [];
      group.push(tx);
      groups.set(key, group);
      return groups;
    }, new Map<string, InventoryTransaction[]>()).entries())
    : [];

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, search, itemFilter, paymentFilter, fromDate, toDate, filtered.length, saleGroups.length]);

  const totalItems = activeView === "sale" ? saleGroups.length : filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedSaleGroups = activeView === "sale"
    ? saleGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  const paginatedFiltered = activeView === "purchase"
    ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];
  const itemSuggestions = Array.from(
    new Set(displayedTransactions.map((tx) => tx.name.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const matchingItemSuggestions = itemSuggestions
    .filter((itemName) =>
      itemName.toLowerCase().includes(name.trim().toLowerCase()),
    )
    .slice(0, 8);
  return (
    <div className="w-full min-h-full space-y-5 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-800">
            <Package size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
            <p className="text-sm text-muted-foreground">Inventory Account</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={deletingCompany}
            onClick={async () => {
              if (
                !window.confirm(`Delete ${item.name} and all its transactions?`)
              )
                return;
              setDeletingCompany(true);
              try {
                await onDeleteCompany();
              } catch {
                setDeletingCompany(false);
              }
            }}
            className="flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} /> {deletingCompany ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => {
              resetForm();
              setError("");
              setOpen(true);
            }}
            className="flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary transition-all hover:opacity-90 active:scale-95"
          >
            <Plus size={16} /> Add Purchase
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-xs text-muted-foreground mb-1">
            Total Entries
          </div>
          <div className="text-base font-mono font-bold text-foreground">
            {displayedTransactions.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {activeView} transactions
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <div className="text-xs text-blue-700 mb-1">Total Amount</div>
          <div className="text-base font-mono font-bold text-blue-700">
            ₹
            {totalAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Across {activeView} entries
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <div className="text-xs text-emerald-700 mb-1">Paid Amount</div>
          <div className="text-base font-mono font-bold text-emerald-700">
            ₹
            {paidAmountTotal.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            {paidCount} paid transaction{paidCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="text-xs text-amber-800 mb-1">Pending Amount</div>
          <div className="text-base font-mono font-bold text-amber-800">
            ₹
            {pendingAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-amber-700 mt-1">
            {unpaidCount} unpaid transaction{unpaidCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
          <div className="text-xs text-purple-700 mb-1">Settlement Status</div>
          <div className="text-base font-mono font-bold text-purple-700">
            {totalAmount > 0
              ? pendingAmount === 0
                ? "100% Paid"
                : `${((paidAmountTotal / totalAmount) * 100).toFixed(0)}% Settled`
              : "No Entries"}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {pendingAmount > 0
              ? `₹${pendingAmount.toLocaleString("en-IN")} remaining`
              : "All dues cleared"}
          </div>
        </div>
      </div>
      {error && !open && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <h3 className="min-w-0 flex-1 truncate text-base font-bold text-slate-900 sm:text-lg">
            Purchases — {item.name}
          </h3>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-label={filtersOpen ? "Hide filters" : "Show filters"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            <ChevronDown
              size={17}
              className={`transition-transform ${filtersOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>
        </div>
        {filtersOpen && (
          <div className="grid grid-cols-1 items-end gap-3 border-b border-slate-200 px-4 pb-4 sm:px-6 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Search</span>
              <span className="relative block">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                placeholder="Search name..."
              />
              </span>
            </label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">Item</span><select value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} className="h-11 w-full rounded border border-slate-300 bg-white px-3 text-sm"><option value="all">All Items</option>{itemSuggestions.map((itemName) => <option key={itemName} value={itemName}>{itemName}</option>)}</select></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">Payment status</span><select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-11 w-full rounded border border-slate-300 bg-white px-3 text-sm"><option value="all">All Payment Status</option><option value="paid">Paid</option><option value="not_paid">Not paid</option><option value="partial">Partially paid</option></select></label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-500">From date</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 w-full rounded border border-slate-300 bg-white px-3 text-sm" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-500">To date</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11 w-full rounded border border-slate-300 bg-white px-3 text-sm" />
            </label>
          </div>
        )}
        {loading ? (
          <p className="p-8 text-sm text-slate-500">Loading transactions...</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <WalletCards className="mx-auto text-slate-300" size={32} />
            <h3 className="mt-4 font-bold text-slate-800">
              {transactions.length
                ? "No matching transactions"
                : "No transactions yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {transactions.length
                ? "Change the search or filters."
                : `Add the first transaction for ${item.name}.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Sl No</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Item name</th>
                  <th className="px-3 py-3">Kg / Box</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3 text-right">Paid</th>
                  <th className="px-3 py-3 text-right">Pending</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeView === "sale" ? paginatedSaleGroups.map(([batchId, group], localIndex) => {
                  const index = (currentPage - 1) * pageSize + localIndex;
                  const first = group[0];
                  const expanded = expandedSaleBatches.has(batchId);
                  const amount = group.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
                  const paid = group.reduce((sum, tx) => sum + Number(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0)), 0);
                  const pending = Math.max(0, amount - paid);
                  return (
                    <Fragment key={batchId}>
                      <tr key={batchId} onClick={() => setExpandedSaleBatches(current => {
                        const next = new Set(current);
                        if (next.has(batchId)) next.delete(batchId); else next.add(batchId);
                        return next;
                      })} className="cursor-pointer bg-white hover:bg-slate-50">
                        <td className="px-3 py-5 font-mono text-slate-500">{index + 1}</td>
                        <td className="whitespace-nowrap px-3 py-5 text-slate-500">{new Date(first.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-5 font-semibold text-slate-800"><span className="inline-flex items-center gap-2"><ChevronRight size={16} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />{first.partyName || "Unassigned"}</span></td>
                        <td className="px-3 py-5 font-medium text-slate-600">{group.length} item{group.length === 1 ? "" : "s"}</td>
                        <td className="px-3 py-5 text-slate-500">Click to view</td>
                        <td className="px-3 py-5 text-right font-mono font-bold text-slate-700">₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-3 py-5 text-right font-mono text-emerald-700">₹{paid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-3 py-5 text-right font-mono font-semibold text-amber-700">₹{pending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-3 py-5 text-right text-xs font-semibold text-blue-700">{expanded ? "Hide items" : "View items"}</td>
                      </tr>
                      {expanded && group.map((tx) => {
                        const itemPaid = Number(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0));
                        const itemPending = Math.max(0, Number(tx.amount || 0) - itemPaid);
                        return <tr key={tx.id} className="bg-blue-50/40">
                          <td className="px-3 py-4"></td><td className="px-3 py-4 text-xs text-slate-500">Item</td><td className="px-3 py-4"></td>
                          <td className="px-3 py-4 font-semibold text-slate-700">{tx.name}</td>
                          <td className="px-3 py-4 font-mono text-slate-700">{tx.quantity} <span className="text-xs uppercase text-slate-500">{tx.unit}</span></td>
                          <td className="px-3 py-4 text-right font-mono">₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-4 text-right font-mono text-emerald-700">₹{itemPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-4 text-right font-mono text-amber-700">₹{itemPending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-4"><div className="flex justify-end gap-1"><button onClick={() => editTransaction(tx)} className="rounded p-2 text-slate-400 hover:bg-blue-100 hover:text-blue-600" title="Edit sale"><Edit3 size={15} /></button><button onClick={() => deleteTransaction(tx)} className="rounded p-2 text-slate-400 hover:bg-red-100 hover:text-red-600" title="Delete sale item"><Trash2 size={15} /></button></div></td>
                        </tr>;
                      })}
                    </Fragment>
                  );
                }) : paginatedFiltered.map((tx, localIndex) => {
                  const index = (currentPage - 1) * pageSize + localIndex;
                  const paid = Number(
                    tx.paidAmount ??
                      (tx.paymentStatus === "paid" ? tx.amount : 0),
                  );
                  const pending = Math.max(0, Number(tx.amount || 0) - paid);
                  return (
                    <tr key={tx.id} className="group hover:bg-slate-50">
                      <td className="px-3 py-6 font-mono text-slate-500">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap px-3 py-6 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className="truncate px-3 py-6 font-semibold text-slate-800"
                        title={tx.partyName || "Unassigned"}
                      >
                        {tx.partyName || "Unassigned"}
                      </td>
                      <td
                        className="truncate px-3 py-6 font-semibold text-slate-700"
                        title={tx.name}
                      >
                        {tx.name}
                      </td>
                      <td className="px-3 py-6 font-mono font-bold text-slate-700">
                        {String(tx.quantity)}{" "}
                        <span className="font-sans text-xs font-semibold uppercase text-slate-500">
                          {tx.unit || "kg"}
                        </span>
                      </td>
                      <td className="px-3 py-6 text-right font-mono font-bold text-slate-700">
                        ₹
                        {Number(tx.amount ?? 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-6 text-right font-mono text-emerald-700">
                        ₹
                        {paid.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-6 text-right font-mono font-semibold text-amber-700">
                        ₹
                        {pending.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-6">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => editTransaction(tx)}
                            className="rounded p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit transaction"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx)}
                            className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      </section>
      <SalesEntryDialog
        open={salesOpen}
        setOpen={(value) => {
          setSalesOpen(value);
          if (!value) setEditingSale(null);
        }}
        item={item}
        accounts={accounts}
        editingSale={editingSale}
        onSaved={(entries) => {
          setTransactions((current) => editingSale
            ? current.map((entry) => entry.id === entries[0].id ? entries[0] : entry)
            : [...entries, ...current]);
          setEditingSale(null);
          onTransactionsChanged();
        }}
      />
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) {
            setOpen(value);
            if (!value) resetForm();
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-5 sm:max-w-xl sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingId ? `Edit ${isSaleEdit ? "sale" : "purchase"}` : "Add purchase"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? `Update this inventory ${isSaleEdit ? "sale" : "purchase"} for ${item.name}.`
                : `Add an inventory purchase for ${item.name}.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              {isSaleEdit ? "Customer name" : "Supplier name"}
              <input
                required
                maxLength={255}
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className={fieldClass}
                placeholder={isSaleEdit ? "Customer name" : "Supplier name"}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                {isSaleEdit
                  ? "The customer associated with this sale."
                  : "Use the same name for multiple purchased items."}
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Item name
              <div className="relative">
                <input
                  autoFocus
                  required
                  maxLength={255}
                  value={name}
                  onFocus={() => setShowItemSuggestions(true)}
                  onChange={(e) => {
                    setName(e.target.value);
                    setShowItemSuggestions(true);
                  }}
                  onBlur={() => setShowItemSuggestions(false)}
                  className={fieldClass}
                  placeholder="Type or select an existing item"
                />
                {showItemSuggestions &&
                  name.trim() &&
                  matchingItemSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      {matchingItemSuggestions.map((itemName) => (
                        <button
                          key={itemName}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setName(itemName);
                            setShowItemSuggestions(false);
                          }}
                          className="flex w-full items-center px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                        >
                          {itemName}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Matching items are listed below while you type.
              </span>
            </label>
            <div
              className={`grid grid-cols-1 gap-4 ${unit === "box" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
            >
              <label className="block text-sm font-semibold text-slate-700">
                Unit
                <select
                  value={unit}
                  onChange={(e) => {
                    const nextUnit = e.target.value as "kg" | "box";
                    setUnit(nextUnit);
                    setQuantity("");
                    setBoxValue("");
                    setAmount("");
                  }}
                  className={fieldClass}
                >
                  <option value="kg">Kg</option>
                  <option value="box">Box</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {unit === "box" ? "Number of boxes" : "Weight (kg)"}
                <input
                  required
                  type="number"
                  min={unit === "box" ? "1" : "0.01"}
                  step={unit === "box" ? "1" : "0.01"}
                  value={quantity}
                  onChange={(e) => {
                    const nextQuantity = e.target.value;
                    setQuantity(nextQuantity);
                    if (unit === "box")
                      setAmount(
                        nextQuantity && boxValue
                          ? (Number(nextQuantity) * Number(boxValue)).toFixed(2)
                          : "",
                      );
                  }}
                  className={fieldClass}
                  placeholder={unit === "box" ? "20" : "336"}
                />
              </label>
              {unit === "box" && (
                <label className="block text-sm font-semibold text-slate-700">
                  Value per box
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={boxValue}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setBoxValue(nextValue);
                      setAmount(
                        quantity && nextValue
                          ? (Number(quantity) * Number(nextValue)).toFixed(2)
                          : "",
                      );
                    }}
                    className={fieldClass}
                    placeholder="1.00"
                  />
                </label>
              )}
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Total amount
              <input
                required
                readOnly={unit === "box"}
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${fieldClass} ${unit === "box" ? "bg-slate-100 font-bold text-slate-800" : ""}`}
                placeholder="0.00"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                {unit === "box"
                  ? "Calculated automatically from boxes × value per box."
                  : "Enter the total amount for this weight."}
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {isSaleEdit ? "Credit received to company" : "Debit paid from company"}
              <select value={linkedAccountId} onChange={(e) => setLinkedAccountId(e.target.value)} className={fieldClass}>
                <option value="">Do not update a company balance</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
              <span className="mt-1 block text-xs font-normal text-slate-500">
                {isSaleEdit
                  ? "Only the received amount is credited. Editing received or pending updates the company automatically."
                  : "Only the paid amount is debited. Editing paid or pending updates the company automatically."}
              </span>
            </label>
            {(activeView === "purchase" || isSaleEdit) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  {isSaleEdit ? "Received amount" : "Paid amount"}
                  <input
                    type="number"
                    min="0"
                    max={amount || undefined}
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => {
                      const nextPaid = e.target.value;
                      setPaidAmount(nextPaid);
                      setPaymentStatus(
                        Number(nextPaid) >= Number(amount) && Number(amount) > 0
                          ? "paid"
                          : Number(nextPaid) > 0
                            ? "partial"
                            : "not_paid",
                      );
                    }}
                    className={fieldClass}
                    placeholder="0.00"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {isSaleEdit
                      ? "Amount already received for this sale."
                      : "Amount already paid toward this purchase."}
                  </span>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Pending amount
                  <input
                    type="number"
                    min="0"
                    max={amount || undefined}
                    step="0.01"
                    value={Math.max(
                      0,
                      Number(amount || 0) - Number(paidAmount || 0),
                    ).toFixed(2)}
                    onChange={(e) => {
                      const nextPending = e.target.value;
                      if (nextPending === "") {
                        setPaidAmount("");
                        setPaymentStatus("not_paid");
                        return;
                      }
                      const nextPaid = Math.max(
                        0,
                        Number(amount || 0) - Number(nextPending),
                      );
                      setPaidAmount(nextPaid.toFixed(2));
                      setPaymentStatus(
                        nextPaid >= Number(amount) && Number(amount) > 0
                          ? "paid"
                          : nextPaid > 0
                            ? "partial"
                            : "not_paid",
                      );
                    }}
                    className={fieldClass}
                    placeholder="0.00"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Changes here update the paid amount too.
                  </span>
                </label>
              </div>
            )}
            <div className="text-sm font-semibold text-slate-700">
              Payment status:{" "}
              <span className="font-normal">
                {paymentStatus === "partial"
                  ? "Partially paid"
                  : paymentStatus === "paid"
                    ? "Paid"
                    : "Not paid"}
              </span>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 px-4 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={
                  saving ||
                  !partyName.trim() ||
                  !name.trim() ||
                  !quantity ||
                  amount === "" ||
                  (unit === "box" && !boxValue)
                }
                className="min-h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add transaction"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SalesOverview({
  inventoryItems,
  onOpenCompany,
  onAddSale,
}: {
  inventoryItems: Item[];
  onOpenCompany: (id: number) => void;
  onAddSale: (id: number) => void;
}) {
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const sales = inventoryItems.flatMap((company) =>
    (company.transactions || [])
      .filter((tx) => tx.transactionType === "sale")
      .map((tx) => ({ ...tx, companyId: company.id, companyName: company.name })),
  ).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const total = sales.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const received = sales.reduce((sum, tx) => sum + Number(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0)), 0);
  const pending = Math.max(0, total - received);
  const paginatedSales = sales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <div className="min-h-full space-y-6 bg-slate-50 p-4 sm:p-6">
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">All inventory companies</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Sales</h1><p className="mt-1 text-sm text-slate-500">One shared view of every inventory sale and collection.</p></div>
      <div className="flex items-center gap-3"><div className="text-sm font-semibold text-slate-500">{sales.length} sale item{sales.length === 1 ? "" : "s"}</div><button type="button" onClick={() => setCompanyPickerOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:opacity-90"><Plus size={16} /> Add sale</button></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Total sales</p><p className="mt-2 font-mono text-xl font-bold text-blue-950">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
      <div className="border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Received</p><p className="mt-2 font-mono text-xl font-bold text-emerald-800">₹{received.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
      <div className="border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Pending</p><p className="mt-2 font-mono text-xl font-bold text-amber-800">₹{pending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
    </div>
    <section className="overflow-hidden border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-900">All sales entries</h2></div>
      {sales.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No sales entries yet.</div> : <div className="overflow-x-auto"><table className="min-w-[850px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Inventory company</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Item</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Received</th><th className="px-5 py-3 text-right">Pending</th></tr></thead><tbody className="divide-y divide-slate-100">{paginatedSales.map(tx => { const paid = Number(tx.paidAmount ?? (tx.paymentStatus === "paid" ? tx.amount : 0)); const due = Math.max(0, Number(tx.amount) - paid); return <tr key={tx.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-5 py-4 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><button onClick={() => onOpenCompany(tx.companyId)} className="font-semibold text-blue-700 hover:underline">{tx.companyName}</button></td><td className="px-5 py-4 font-medium text-slate-800">{tx.partyName || "Unassigned"}</td><td className="px-5 py-4 text-slate-700">{tx.name}</td><td className="px-5 py-4 text-right font-mono">₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="px-5 py-4 text-right font-mono text-emerald-700">₹{paid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="px-5 py-4 text-right font-mono text-amber-700">₹{due.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>; })}</tbody></table></div>}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(sales.length / pageSize)}
        onPageChange={setCurrentPage}
        totalItems={sales.length}
        pageSize={pageSize}
      />
    </section>
    <Dialog open={companyPickerOpen} onOpenChange={setCompanyPickerOpen}>
      <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Choose inventory company</DialogTitle><DialogDescription>Select the inventory company for this new sale.</DialogDescription></DialogHeader><div className="space-y-2">{inventoryItems.length === 0 ? <p className="py-5 text-center text-sm text-slate-500">Create an inventory company first.</p> : inventoryItems.map(company => <button key={company.id} type="button" onClick={() => { setCompanyPickerOpen(false); onAddSale(company.id); }} className="flex min-h-12 w-full items-center justify-between border border-slate-200 px-4 text-left text-sm font-semibold text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"><span>{company.name}</span><ChevronRight size={16} className="text-slate-400" /></button>)}</div></DialogContent>
    </Dialog>
  </div>;
}
