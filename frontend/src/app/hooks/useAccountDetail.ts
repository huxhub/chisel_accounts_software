import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { Account } from "../types";
import { CHART_COLORS } from "../types";

export function useAccountDetail(
  accounts: Account[],
  activeTab: string,
  handleAddAccount: (data: any) => Promise<any>,
  handleDeleteAccount: (id: string, password: string) => Promise<any>,
  handleSaveBal: (id: string, value: number) => Promise<any>,
  editAccountNameFn: (id: string, name: string) => Promise<any>,
  setActiveTab: (tab: string) => void,
) {
  const activeAccount = accounts.find(a => a.id === activeTab);

  // ── Add company form ──
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: "", type: "company", openingBalance: "", color: "#1e3a5f" });

  // ── Delete dialog ──
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // ── Inline edit states ──
  const [editingOpening, setEditingOpening] = useState<string | null>(null);
  const [openingInput, setOpeningInput] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  // ── Derived data ──
  const reminders = useMemo(() => {
    const list: any[] = [];
    const seenRefs = new Set<string>();
    accounts.forEach(a => {
      const idx = accounts.findIndex(acc => acc.id === a.id);
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      (a.transactions || [])
        .filter((tx: any) => tx.dueDate && !tx.isCompleted)
        .forEach((tx: any) => {
          if (tx.reference && (tx.reference.startsWith("EX-") || tx.exchangeType)) {
            if (seenRefs.has(tx.reference)) return;
            seenRefs.add(tx.reference);
          }
          list.push({ ...tx, accountId: a.id, accountName: a.name, accountColor: color, accountBg: a.bgColor });
        });
    });
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [accounts]);

  const activeRemindersCount = useMemo(() => reminders.length, [reminders]);

  const activeAccountReminders = useMemo(() => {
    if (!activeAccount) return [];
    const todayStr = new Date().toISOString().split("T")[0];
    return activeAccount.transactions
      .filter((tx: any) => tx.dueDate && !tx.isCompleted && tx.dueDate <= todayStr)
      .map((tx: any) => ({
        ...tx,
        accountId: activeAccount.id,
        accountName: activeAccount.name,
        accountColor: activeAccount.color,
        accountBg: activeAccount.bgColor,
      }))
      .sort((a: any, b: any) => a.dueDate.localeCompare(b.dueDate));
  }, [activeAccount]);

  const normalTransactions = useMemo(() => {
    if (!activeAccount) return [];
    return activeAccount.transactions.filter((tx: any) => !tx.exchangeType);
  }, [activeAccount]);

  const exchangeTransactions = useMemo(() => {
    if (!activeAccount) return [];
    return activeAccount.transactions.filter((tx: any) => !!tx.exchangeType);
  }, [activeAccount]);

  const txRunningBalances = useMemo(() => {
    if (!activeAccount) return {};
    let bal = activeAccount.openingBalance;
    const map: Record<string, number> = {};
    activeAccount.transactions.forEach((tx: any) => {
      bal = tx.type === "credit" ? bal + tx.amount : bal - tx.amount;
      map[tx.id] = bal;
    });
    return map;
  }, [activeAccount]);

  // ── Actions ──
  const addCompany = async () => {
    if (!companyForm.name.trim()) { toast.warning("Please enter a name."); return; }
    const bgColor = companyForm.type === "overdraft" ? "#ffe4e6" : companyForm.type === "bank" ? "#ccfbf1" : "#e8edf5";
    const color = companyForm.type === "overdraft" ? "#9f1239" : companyForm.type === "bank" ? "#0f766e" : "#1e3a5f";
    const newId = await handleAddAccount({
      ...companyForm,
      openingBalance: parseFloat(companyForm.openingBalance) || 0,
      bgColor,
      color,
    });
    if (newId) {
      setCompanyForm({ name: "", type: "company", openingBalance: "", color: "#1e3a5f" });
      setShowAddCompany(false);
      setActiveTab(newId);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteAccountId) return;
    if (!deleteConfirmPassword.trim()) { setDeleteError("Password is required"); return; }
    const res = await handleDeleteAccount(deleteAccountId, deleteConfirmPassword);
    if (res?.success) {
      setShowDeleteDialog(false);
      setDeleteConfirmPassword("");
      setDeleteAccountId(null);
      setDeleteError("");
      setActiveTab("dashboard");
    } else {
      setDeleteError(res?.message || "Failed to delete account");
    }
  };

  const saveOpeningBalance = async (accountId: string) => {
    const val = parseFloat(openingInput);
    if (isNaN(val)) { toast.warning("Enter a valid opening balance."); return; }
    const success = await handleSaveBal(accountId, val);
    if (success) setEditingOpening(null);
  };

  return {
    activeAccount,
    // Add company
    showAddCompany, setShowAddCompany,
    companyForm, setCompanyForm,
    addCompany,
    // Delete dialog
    showDeleteDialog, setShowDeleteDialog,
    deleteAccountId, setDeleteAccountId,
    deleteConfirmPassword, setDeleteConfirmPassword,
    deleteError, setDeleteError,
    handleDeleteCompany,
    // Inline edit
    editingOpening, setEditingOpening,
    openingInput, setOpeningInput,
    editingName, setEditingName,
    nameInput, setNameInput,
    editAccountName: editAccountNameFn,
    saveOpeningBalance,
    // Derived data
    reminders,
    activeRemindersCount,
    activeAccountReminders,
    normalTransactions,
    exchangeTransactions,
    txRunningBalances,
  };
}
