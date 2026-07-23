import { useState } from "react";
import { toast } from "sonner";
import type { Account } from "../types";
import { today, findAccountById } from "../types";

interface ExchangeFormState {
  category: "company" | "bank" | "companyToBank";
  sourceId: string;
  destId: string;
  fromCompanyId: string;
  toCompanyId: string;
  amount: string;
  date: string;
  dueDate: string;
  exchangeType: "loan" | "credit";
  description: string;
}

const INITIAL_EXCHANGE: ExchangeFormState = {
  category: "companyToBank",
  sourceId: "",
  destId: "",
  fromCompanyId: "",
  toCompanyId: "",
  amount: "",
  date: today,
  dueDate: "",
  exchangeType: "loan",
  description: "",
};

export function useExchangeForm(
  accounts: Account[],
  handleAddTx: (accountId: string, tx: any, options?: { silent?: boolean }) => Promise<any>,
  handleDelTx: (accountId: string, txId: string, options?: { silent?: boolean }) => Promise<any>,
) {
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeForm, setExchangeForm] = useState<ExchangeFormState>(INITIAL_EXCHANGE);

  const openExchangeModal = () => {
    const companyAccs = accounts.filter(a => a.type === "company");
    const bankAccs = accounts.filter(a => a.type === "bank");
    setExchangeForm({
      category: "companyToBank",
      fromCompanyId: companyAccs[0]?.id || "",
      toCompanyId: companyAccs[1]?.id || "",
      sourceId: bankAccs[0]?.id || "",
      destId: bankAccs[1]?.id || "",
      amount: "",
      date: today,
      dueDate: "",
      exchangeType: "loan",
      description: "",
    });
    setShowExchange(true);
  };

  const handleExchangeSubmit = async () => {
    const isCompanyToBank = exchangeForm.category === "companyToBank";

    if (!exchangeForm.sourceId || !exchangeForm.destId || !exchangeForm.amount) {
      toast.warning(isCompanyToBank ? "Please select both bank accounts and an amount." : "Please select both accounts and an amount.");
      return;
    }
    if (isCompanyToBank && (!exchangeForm.fromCompanyId || !exchangeForm.toCompanyId)) {
      toast.warning("Please select both companies.");
      return;
    }

    const sourceAcc = findAccountById(accounts, exchangeForm.sourceId);
    const destAcc = findAccountById(accounts, exchangeForm.destId);
    if (!sourceAcc || !destAcc) { toast.error("Selected account could not be found."); return; }

    const fromCompanyAcc = isCompanyToBank ? findAccountById(accounts, exchangeForm.fromCompanyId) : undefined;
    const toCompanyAcc = isCompanyToBank ? findAccountById(accounts, exchangeForm.toCompanyId) : undefined;
    if (isCompanyToBank && (!fromCompanyAcc || !toCompanyAcc)) { toast.error("Selected company could not be found."); return; }

    const amt = parseFloat(exchangeForm.amount);
    if (isNaN(amt) || amt <= 0) { toast.warning("Enter a valid transfer amount."); return; }

    const ref = `EX-${Date.now().toString().slice(-6)}`;
    const userDescription = exchangeForm.description.trim() ? ` — ${exchangeForm.description.trim()}` : "";
    const baseTx = {
      date: exchangeForm.date,
      amount: amt,
      dueDate: exchangeForm.dueDate || undefined,
      exchangeType: exchangeForm.exchangeType,
    };

    const entries = isCompanyToBank
      ? [
          {
            accountId: exchangeForm.fromCompanyId,
            tx: {
              ...baseTx,
              reference: `${ref}-C`,
              type: "debit" as const,
              description: exchangeForm.exchangeType === "loan"
                ? `Loan to ${toCompanyAcc!.name}${userDescription}`
                : `Transfer to ${toCompanyAcc!.name}${userDescription}`
            }
          },
          {
            accountId: exchangeForm.toCompanyId,
            tx: {
              ...baseTx,
              reference: `${ref}-C`,
              type: "credit" as const,
              description: exchangeForm.exchangeType === "loan"
                ? `Loan from ${fromCompanyAcc!.name}${userDescription}`
                : `Transfer from ${fromCompanyAcc!.name}${userDescription}`
            }
          },
          { accountId: exchangeForm.sourceId, tx: { ...baseTx, reference: `${ref}-B`, type: "debit" as const, description: `Transfer to ${toCompanyAcc!.name}${userDescription}` } },
          { accountId: exchangeForm.destId, tx: { ...baseTx, reference: `${ref}-B`, type: "credit" as const, description: `Transfer from ${fromCompanyAcc!.name}${userDescription}` } },
        ]
      : (() => {
          const label = exchangeForm.exchangeType === "loan" ? "Loan" : "Transfer";
          return [
            { accountId: exchangeForm.sourceId, tx: { ...baseTx, reference: ref, type: "debit" as const, description: `${label} to ${destAcc.name}${userDescription}` } },
            { accountId: exchangeForm.destId, tx: { ...baseTx, reference: ref, type: "credit" as const, description: `${label} from ${sourceAcc.name}${userDescription}` } },
          ];
        })();

    const posted: { accountId: string; txId: string }[] = [];
    for (const entry of entries) {
      const result = await handleAddTx(entry.accountId, entry.tx, { silent: true });
      if (!result) {
        let allRolledBack = true;
        for (const p of [...posted].reverse()) {
          const rolledBack = await handleDelTx(p.accountId, p.txId, { silent: true });
          if (!rolledBack) allRolledBack = false;
        }
        toast.error(allRolledBack
          ? "Transfer failed — the entries already posted were rolled back."
          : "Transfer failed, and not all entries could be rolled back automatically. Please check the ledger."
        );
        return;
      }
      posted.push({ accountId: entry.accountId, txId: result.id });
    }

    toast.success(
      isCompanyToBank
        ? `Payment of ₹${amt.toLocaleString("en-IN")} from ${fromCompanyAcc!.name} to ${toCompanyAcc!.name} completed`
        : `Transfer of ₹${amt.toLocaleString("en-IN")} completed`
    );
    setShowExchange(false);
  };

  return {
    showExchange,
    setShowExchange,
    exchangeForm,
    setExchangeForm,
    openExchangeModal,
    handleExchangeSubmit,
  };
}
