import { useState, useRef } from "react";
import { toast } from "sonner";
import type { Account, AttachedDoc, TransactionType } from "../types";
import { today, findAccountById } from "../types";

interface TransactionForm {
  date: string;
  description: string;
  type: TransactionType;
  amount: string;
  reference: string;
  document: AttachedDoc | null;
  dueDate: string;
  paymentMode: "cash" | "bank";
  selectedBankId: string;
}

const INITIAL_FORM: TransactionForm = {
  date: today,
  description: "",
  type: "credit",
  amount: "",
  reference: "",
  document: null,
  dueDate: "",
  paymentMode: "cash",
  selectedBankId: "",
};

export function useTransactionForm(
  accounts: Account[],
  activeTab: string,
  handleAddTx: (accountId: string, tx: any, options?: { silent?: boolean }) => Promise<any>,
  handleDelTx: (accountId: string, txId: string, options?: { silent?: boolean }) => Promise<any>,
  handleEditTx?: (accountId: string, txId: string, tx: any, options?: { silent?: boolean }) => Promise<any>,
) {
  const [form, setForm] = useState<TransactionForm>(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [showDeleteTxDialog, setShowDeleteTxDialog] = useState(false);
  const [txToDelete, setTxToDelete] = useState<{ accountId: string; txId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAccount = accounts.find(a => a.id === activeTab);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({
        ...f,
        document: {
          name: file.name,
          dataUrl: reader.result as string,
          mimeType: file.type,
          size: file.size,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const openEditTransaction = (tx: any) => {
    setEditingTxId(tx.id);
    setForm({
      date: tx.date || today,
      description: tx.description || "",
      type: tx.type || "credit",
      amount: String(tx.amount || ""),
      reference: tx.reference || "",
      document: tx.document || null,
      dueDate: tx.dueDate || "",
      paymentMode: "cash",
      selectedBankId: "",
    });
    setShowForm(true);
  };

  const addTransaction = async () => {
    if (!form.description || !form.amount) {
      toast.warning("Please fill in a description and amount.");
      return;
    }
    if (!activeAccount) return;

    const isCompanyOrOD = activeAccount.type === "company" || activeAccount.type === "overdraft";
    const selectedBank = isCompanyOrOD && form.paymentMode === "bank"
      ? findAccountById(accounts, form.selectedBankId)
      : null;

    const companyDescription = isCompanyOrOD && !editingTxId
      ? `${form.description} (${form.paymentMode === "bank" && selectedBank ? selectedBank.name : "Cash"})`
      : form.description;

    const tx = {
      date: form.date,
      description: companyDescription,
      type: form.type,
      amount: parseFloat(form.amount),
      reference: form.reference || undefined,
      document: form.document || undefined,
      dueDate: form.dueDate || undefined,
    };

    let result;
    if (editingTxId && handleEditTx) {
      result = await handleEditTx(activeTab, editingTxId, tx);
    } else {
      result = await handleAddTx(activeTab, tx);
      if (result && isCompanyOrOD && form.paymentMode === "bank" && selectedBank) {
        const bankTx = {
          date: form.date,
          description: `${activeAccount.name}: ${form.description}`,
          type: form.type,
          amount: parseFloat(form.amount),
          reference: form.reference || undefined,
          document: form.document || undefined,
          dueDate: form.dueDate || undefined,
        };
        await handleAddTx(String(selectedBank.id), bankTx, { silent: true });
      }
    }

    if (result) {
      setForm(INITIAL_FORM);
      setEditingTxId(null);
      setShowForm(false);
    }
  };

  const deleteTransaction = (accountIdOrTxId: string, maybeTxId?: string) => {
    const accountId = maybeTxId ? accountIdOrTxId : activeTab;
    const txId = maybeTxId ? maybeTxId : accountIdOrTxId;
    setTxToDelete({ accountId, txId });
    setShowDeleteTxDialog(true);
  };

  return {
    form,
    setForm,
    showForm,
    setShowForm,
    editingTxId,
    setEditingTxId,
    openEditTransaction,
    showDeleteTxDialog,
    setShowDeleteTxDialog,
    txToDelete,
    setTxToDelete,
    fileInputRef,
    handleFileSelect,
    addTransaction,
    deleteTransaction,
  };
}
