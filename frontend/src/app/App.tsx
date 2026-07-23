import { useState } from "react";
import { useAccountsController } from "../controllers/useAccountsController";

import Login from "./Login";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { RemindersPage } from "./components/RemindersPage";
import { AccountDetail } from "./components/AccountDetail";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { AccountDetailsSkeleton } from "./components/AccountDetailsSkeleton";
import { ReportModal } from "./components/modals/ReportModal";
import { DocumentViewerModal } from "./components/modals/DocumentViewerModal";
import { AddAccountModal } from "./components/modals/AddAccountModal";
import { AddTransactionModal } from "./components/modals/AddTransactionModal";
import { ExchangeModal } from "./components/modals/ExchangeModal";
import { DeleteAccountModal, DeleteTxModal, CompleteReminderModal } from "./components/modals/DeleteConfirmModals";
import { SettingsModal } from "./components/modals/SettingsModal";

import { useAuth } from "./hooks/useAuth";
import { useSettings } from "./hooks/useSettings";
import { useTransactionForm } from "./hooks/useTransactionForm";
import { useExchangeForm } from "./hooks/useExchangeForm";
import { useAccountDetail } from "./hooks/useAccountDetail";
import type { AttachedDoc } from "./types";

export default function App() {
  const { isAuthenticated, setIsAuthenticated, authChecked, handleLogout } = useAuth();
  const { accounts, loading, addTransaction: handleAddTx, deleteTransaction: handleDelTx, editTransaction: handleEditTx, saveOpeningBalance: handleSaveBal, addAccount: handleAddAccount, editAccountName, deleteAccount: handleDeleteAccount } = useAccountsController(isAuthenticated);
  const { settings, setSettings, tempSettings, setTempSettings, showSettings, setShowSettings } = useSettings();

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [viewDoc, setViewDoc] = useState<AttachedDoc | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [reminderToComplete, setReminderToComplete] = useState<{ accountId: string; txId: string; description?: string } | null>(null);

  const txForm = useTransactionForm(accounts, activeTab, handleAddTx, handleDelTx, handleEditTx);
  const exForm = useExchangeForm(accounts, handleAddTx, handleDelTx);
  const accDetail = useAccountDetail(accounts, activeTab, handleAddAccount, handleDeleteAccount, handleSaveBal, editAccountName, setActiveTab);

  const handleCompleteReminder = async (accountId: string, txId: string) => {
    await handleEditTx(accountId, txId, { isCompleted: true });
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
        <Login onLogin={() => setIsAuthenticated(true)} />
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
      />

      <div className="flex flex-1 overflow-hidden relative">
        {mobileMenuOpen && (
          <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        <Sidebar
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
            <Dashboard accounts={accounts} onNavigate={setActiveTab} />
          ) : activeTab === "reminders" ? (
            <RemindersPage accounts={accounts} onNavigate={setActiveTab} onAddTransaction={handleAddTx} onDeleteTransaction={txForm.deleteTransaction} onCompleteReminder={promptCompleteReminder} />
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
                const banks = accounts.filter(a => a.type === "bank" || a.type === "overdraft");
                txForm.setForm((f: any) => ({ ...f, paymentMode: "cash", selectedBankId: banks.length > 0 ? String(banks[0].id) : "" }));
                txForm.setShowForm(true);
              }}
              onViewDoc={doc => setViewDoc(doc)}
              onDeleteTransaction={txForm.deleteTransaction}
              onEditTransaction={txForm.openEditTransaction}
              onCompleteReminder={promptCompleteReminder}
              onNavigateToReminders={() => setActiveTab("reminders")}
            />
          ) : null}
        </main>
      </div>

      <ReportModal accounts={accounts} showReport={showReport} setShowReport={setShowReport} />
      <DocumentViewerModal viewDoc={viewDoc} setViewDoc={setViewDoc} />
      <AddAccountModal showAddCompany={accDetail.showAddCompany} setShowAddCompany={accDetail.setShowAddCompany} companyForm={accDetail.companyForm} setCompanyForm={accDetail.setCompanyForm} addCompany={accDetail.addCompany} />
      <AddTransactionModal showForm={txForm.showForm} setShowForm={txForm.setShowForm} activeAccount={accDetail.activeAccount} accounts={accounts} form={txForm.form} setForm={txForm.setForm} fileInputRef={txForm.fileInputRef} handleFileSelect={txForm.handleFileSelect} addTransaction={txForm.addTransaction} editingTxId={txForm.editingTxId} />
      <ExchangeModal showExchange={exForm.showExchange} setShowExchange={exForm.setShowExchange} exchangeForm={exForm.exchangeForm} setExchangeForm={exForm.setExchangeForm} accounts={accounts} handleExchangeSubmit={exForm.handleExchangeSubmit} />
      <DeleteAccountModal showDeleteDialog={accDetail.showDeleteDialog} setShowDeleteDialog={accDetail.setShowDeleteDialog} activeAccount={accDetail.activeAccount} deleteConfirmPassword={accDetail.deleteConfirmPassword} setDeleteConfirmPassword={accDetail.setDeleteConfirmPassword} deleteError={accDetail.deleteError} handleDeleteCompany={accDetail.handleDeleteCompany} />
      <DeleteTxModal showDeleteTxDialog={txForm.showDeleteTxDialog} setShowDeleteTxDialog={txForm.setShowDeleteTxDialog} txToDelete={txForm.txToDelete} setTxToDelete={txForm.setTxToDelete} handleDelTx={handleDelTx} />
      <CompleteReminderModal showCompleteModal={showCompleteModal} setShowCompleteModal={setShowCompleteModal} reminderToComplete={reminderToComplete} onConfirmComplete={handleCompleteReminder} />
      <SettingsModal showSettings={showSettings} setShowSettings={setShowSettings} settings={settings} setSettings={setSettings} tempSettings={tempSettings} setTempSettings={setTempSettings} />
    </div>
  );
}
