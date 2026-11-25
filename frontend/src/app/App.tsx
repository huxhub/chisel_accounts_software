import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccountsController } from "../controllers/useAccountsController";

import Login from "./Login";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { RemindersPage } from "./components/RemindersPage";
import { HistoryPage } from "./components/HistoryPage";
import { AccountDetail } from "./components/AccountDetail";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { AccountDetailsSkeleton } from "./components/AccountDetailsSkeleton";
import { ReportModal } from "./components/modals/ReportModal";
import { DocumentViewerModal } from "./components/modals/DocumentViewerModal";
import { AddAccountModal } from "./components/modals/AddAccountModal";
import { AddTransactionModal } from "./components/modals/AddTransactionModal";
import { ExchangeModal } from "./components/modals/ExchangeModal";
import { ProgramModal } from "./components/modals/ProgramModal";
import { DeleteAccountModal, DeleteTxModal, CompleteReminderModal } from "./components/modals/DeleteConfirmModals";
import { SettingsModal } from "./components/modals/SettingsModal";
import { AddInventoryDialog, InventoryDetail, inventoryRequest, type Item } from "./components/InventoryPage";
import { LedgersPage } from "./components/LedgersPage";
import { VoucherModal } from "./components/modals/VoucherModal";

import { useAuth } from "./hooks/useAuth";
import { useSettings } from "./hooks/useSettings";
import { useTransactionForm } from "./hooks/useTransactionForm";
import { useExchangeForm } from "./hooks/useExchangeForm";
import { useAccountDetail } from "./hooks/useAccountDetail";
import type { AttachedDoc } from "./types";

export default function App() {
  const { isAuthenticated, setIsAuthenticated, authChecked, handleLogout } = useAuth();
  const {
    accounts,
    programs,
    ledgers,
    loading,
    addTransaction: handleAddTx,
    deleteTransaction: handleDelTx,
    editTransaction: handleEditTx,
    saveOpeningBalance: handleSaveBal,
    addAccount: handleAddAccount,
    editAccountName,
    deleteAccount: handleDeleteAccount,
    addProgram,
    deleteProgram,
    addLedger,
    deleteLedger,
    addVoucher,
    deleteVoucher,
    fetchAccounts,
  } = useAccountsController(isAuthenticated);
  const { settings, setSettings, tempSettings, setTempSettings, showSettings, setShowSettings } = useSettings();

  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const refreshInventory = async () => {
    setInventoryLoading(true);
    setInventoryError("");
    try {
      const data = await inventoryRequest();
      setInventoryItems(data);
      await fetchAccounts();
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : "Unable to load inventory.");
    } finally {
      setInventoryLoading(false);
    }
  };
  const deleteInventoryCompany = async (id: number) => {
    try {
      await inventoryRequest(`/${id}`, { method: "DELETE" });
      setInventoryItems(items => items.filter(item => item.id !== id));
      setActiveTab("dashboard");
      toast.success("Inventory company deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete inventory company.");
      throw error;
    }
  };
  useEffect(() => {
    if (isAuthenticated) refreshInventory();
    else {
      setInventoryItems([]);
      setInventoryLoading(false);
      setInventoryError("");
    }
  }, [isAuthenticated]);
  const [activeTab, setActiveTab] = useState<string>(() => sessionStorage.getItem("golden-catch-active-page") || "dashboard");
  useEffect(() => {
    sessionStorage.setItem("golden-catch-active-page", activeTab);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showPrograms, setShowPrograms] = useState<boolean>(false);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);
  const [viewDoc, setViewDoc] = useState<AttachedDoc | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [reminderToComplete, setReminderToComplete] = useState<{ accountId: string; txId: string; description?: string } | null>(null);

  const txForm = useTransactionForm(accounts, activeTab, handleAddTx, handleDelTx, handleEditTx);
  const exForm = useExchangeForm(accounts, handleAddTx, handleDelTx);
  const accDetail = useAccountDetail(accounts, activeTab, handleAddAccount, handleDeleteAccount, handleSaveBal, editAccountName, setActiveTab);

  const handleCompleteReminder = async (accountId: string, txId: string) => {
    const targetAcc = accounts.find(a => a.id === accountId);
    const targetTx = targetAcc?.transactions.find((t: any) => t.id === txId);

    await handleEditTx(accountId, txId, { isCompleted: true });

    if (targetTx?.reference) {
      accounts.forEach(acc => {
        (acc.transactions || []).forEach((tx: any) => {
          if (tx.reference === targetTx.reference && (tx.id !== txId || acc.id !== accountId)) {
            handleEditTx(acc.id, tx.id, { isCompleted: true });
          }
        });
      });
    }

    toast.success("Reminder marked as completed!");
  };


  const promptCompleteReminder = (accountId: string, txId: string, description?: string) => {
    setReminderToComplete({ accountId, txId, description });
    setShowCompleteModal(true);
  };

  if (!authChecked) {
    return (
      <>
        <Toaster richColors position="top-right" closeButton />
        <div className="w-screen h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster richColors position="top-right" closeButton />
        <Login settings={settings} onLogin={() => { setInventoryLoading(true); setIsAuthenticated(true); }} />
      </>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Toaster richColors position="top-right" closeButton />

      <Header
        settings={settings}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenExchange={exForm.openExchangeModal}
        onOpenReport={() => setShowReport(true)}
        onOpenPrograms={() => setShowPrograms(true)}
        onOpenVendors={() => setActiveTab("ledgers")}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {mobileMenuOpen && (
          <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        <Sidebar
          inventoryItems={inventoryItems}
          onAddInventory={() => { setInventoryOpen(true); setMobileMenuOpen(false); }}
          onSelectInventory={id => { setActiveTab(`inventory-${id}`); setMobileMenuOpen(false); }}
          settings={settings}
          accounts={accounts}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeRemindersCount={accDetail.activeRemindersCount}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onOpenAddCompany={type => { accDetail.setCompanyForm({ name: "", type, openingBalance: "", color: "#1e3a5f" }); accDetail.setShowAddCompany(true); }}
          onOpenSettings={() => { setTempSettings({ ...settings }); setShowSettings(true); }}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          {loading ? (
            activeTab === "dashboard" ? <DashboardSkeleton /> : <AccountDetailsSkeleton />
          ) : activeTab === "dashboard" ? (
            <Dashboard accounts={accounts} inventoryItems={inventoryItems} programs={programs} onNavigate={setActiveTab} onCompleteReminder={promptCompleteReminder} />
          ) : activeTab === "history" ? (
            <HistoryPage accounts={accounts} programs={programs} onViewDoc={doc => setViewDoc(doc)} />
          ) : activeTab === "reminders" ? (
            <RemindersPage accounts={accounts} onNavigate={setActiveTab} onAddTransaction={handleAddTx} onDeleteTransaction={txForm.deleteTransaction} onCompleteReminder={promptCompleteReminder} />
          ) : typeof activeTab === "string" && activeTab.startsWith("inventory-") ? (
            inventoryLoading ? (
              <AccountDetailsSkeleton />
            ) : inventoryItems.find(item => `inventory-${item.id}` === activeTab) ? (
              <InventoryDetail item={inventoryItems.find(item => `inventory-${item.id}` === activeTab)!} accounts={accounts.filter(account => account.type === "company")} onTransactionsChanged={refreshInventory} onDeleteCompany={() => deleteInventoryCompany(inventoryItems.find(item => `inventory-${item.id}` === activeTab)!.id)} />
            ) : (
              <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
                  <h2 className="text-lg font-bold text-slate-900">Inventory page unavailable</h2>
                  <p className="mt-2 text-sm text-slate-600">{inventoryError || "This inventory company no longer exists."}</p>
                  <div className="mt-5 flex justify-center gap-3">
                    {inventoryError && <button type="button" onClick={refreshInventory} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Try again</button>}
                    <button type="button" onClick={() => setActiveTab("dashboard")} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white">Go to dashboard</button>
                  </div>
                </div>
              </div>
            )
          ) : activeTab === "ledgers" || activeTab === "vendors" ? (
            <LedgersPage
              ledgers={ledgers}
              accounts={accounts}
              programs={programs}
              onAddLedger={addLedger}
              onDeleteLedger={deleteLedger}
              onAddVoucher={addVoucher}
              onOpenVoucherModal={() => setShowVoucherModal(true)}
            />
          ) : accDetail.activeAccount ? (
            <AccountDetail
              activeAccount={accDetail.activeAccount}
              activeAccountReminders={accDetail.activeAccountReminders}
              normalTransactions={accDetail.normalTransactions}
              exchangeTransactions={accDetail.exchangeTransactions}
              txRunningBalances={accDetail.txRunningBalances}
              editingName={accDetail.editingName}
              nameInput={accDetail.nameInput}
              setNameInput={accDetail.setNameInput}
              setEditingName={accDetail.setEditingName}
              editAccountName={accDetail.editAccountName}
              setDeleteAccountId={accDetail.setDeleteAccountId}
              setDeleteConfirmPassword={accDetail.setDeleteConfirmPassword}
              setDeleteError={accDetail.setDeleteError}
              setShowDeleteDialog={accDetail.setShowDeleteDialog}
              editingOpening={accDetail.editingOpening}
              openingInput={accDetail.openingInput}
              setOpeningInput={accDetail.setOpeningInput}
              setEditingOpening={accDetail.setEditingOpening}
              saveOpeningBalance={accDetail.saveOpeningBalance}
              onOpenAddEntry={() => {
                const banks = accounts.filter(a => a.type === "bank");
                txForm.setForm((f: any) => ({ ...f, paymentMode: "cash", selectedBankId: banks.length > 0 ? String(banks[0].id) : "" }));
                txForm.setShowForm(true);
              }}
              onViewDoc={doc => setViewDoc(doc)}
              onDeleteTransaction={txForm.deleteTransaction}
              onEditTransaction={txForm.openEditTransaction}
              onCompleteReminder={promptCompleteReminder}
              onNavigateToReminders={() => setActiveTab("reminders")}
              programs={programs}
            />
          ) : null}
        </main>
      </div>

      <AddInventoryDialog open={inventoryOpen} setOpen={setInventoryOpen} onItemsChanged={refreshInventory} />
      <ReportModal accounts={accounts} programs={programs} showReport={showReport} setShowReport={setShowReport} />
      <DocumentViewerModal viewDoc={viewDoc} setViewDoc={setViewDoc} />
      <AddAccountModal showAddCompany={accDetail.showAddCompany} setShowAddCompany={accDetail.setShowAddCompany} companyForm={accDetail.companyForm} setCompanyForm={accDetail.setCompanyForm} addCompany={accDetail.addCompany} />
      <AddTransactionModal showForm={txForm.showForm} setShowForm={txForm.setShowForm} activeAccount={accDetail.activeAccount} accounts={accounts} programs={programs} form={txForm.form} setForm={txForm.setForm} fileInputRef={txForm.fileInputRef} handleFileSelect={txForm.handleFileSelect} addTransaction={txForm.addTransaction} editingTxId={txForm.editingTxId} />
      <ExchangeModal showExchange={exForm.showExchange} setShowExchange={exForm.setShowExchange} exchangeForm={exForm.exchangeForm} setExchangeForm={exForm.setExchangeForm} accounts={accounts} handleExchangeSubmit={exForm.handleExchangeSubmit} />
      <ProgramModal showPrograms={showPrograms} setShowPrograms={setShowPrograms} programs={programs} onAddProgram={addProgram} onDeleteProgram={deleteProgram} />
      <VoucherModal show={showVoucherModal} onClose={() => setShowVoucherModal(false)} accounts={accounts} programs={programs} ledgers={ledgers} onAddVoucher={addVoucher} onAddLedger={addLedger} />
      <DeleteAccountModal showDeleteDialog={accDetail.showDeleteDialog} setShowDeleteDialog={accDetail.setShowDeleteDialog} activeAccount={accDetail.activeAccount} deleteConfirmPassword={accDetail.deleteConfirmPassword} setDeleteConfirmPassword={accDetail.setDeleteConfirmPassword} deleteError={accDetail.deleteError} handleDeleteCompany={accDetail.handleDeleteCompany} />
      <DeleteTxModal showDeleteTxDialog={txForm.showDeleteTxDialog} setShowDeleteTxDialog={txForm.setShowDeleteTxDialog} txToDelete={txForm.txToDelete} setTxToDelete={txForm.setTxToDelete} handleDelTx={handleDelTx} />
      <CompleteReminderModal showCompleteModal={showCompleteModal} setShowCompleteModal={setShowCompleteModal} reminderToComplete={reminderToComplete} onConfirmComplete={handleCompleteReminder} />
      <SettingsModal showSettings={showSettings} setShowSettings={setShowSettings} settings={settings} setSettings={setSettings} tempSettings={tempSettings} setTempSettings={setTempSettings} />
    </div>
  );
}

