import { Trash2, X, CheckCircle2 } from "lucide-react";
import type { Account } from "../../types";

export function DeleteAccountModal({
  showDeleteDialog,
  setShowDeleteDialog,
  activeAccount,
  deleteConfirmPassword,
  setDeleteConfirmPassword,
  deleteError,
  handleDeleteCompany,
}: {
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  activeAccount: Account | undefined;
  deleteConfirmPassword: string;
  setDeleteConfirmPassword: (v: string) => void;
  deleteError: string;
  handleDeleteCompany: () => void;
}) {
  if (!showDeleteDialog) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-red-50">
          <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2">
            <Trash2 size={20} /> Delete Account
          </h3>
          <button onClick={() => setShowDeleteDialog(false)} className="text-muted-foreground hover:bg-red-100/50 p-1.5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">{activeAccount?.name}</strong>? This action is permanent and will delete all associated transactions.
          </p>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Enter Password to Confirm</label>
            <input
              type="password"
              value={deleteConfirmPassword}
              onChange={e => setDeleteConfirmPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-input-background"
              placeholder="Enter your password"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleDeleteCompany(); }}
            />
          </div>

          {deleteError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">
              {deleteError}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-end gap-3">
          <button onClick={() => setShowDeleteDialog(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button onClick={handleDeleteCompany} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteTxModal({
  showDeleteTxDialog,
  setShowDeleteTxDialog,
  txToDelete,
  setTxToDelete,
  handleDelTx,
}: {
  showDeleteTxDialog: boolean;
  setShowDeleteTxDialog: (v: boolean) => void;
  txToDelete: { accountId: string; txId: string } | null;
  setTxToDelete: (v: any) => void;
  handleDelTx: (accountId: string, txId: string) => void;
}) {
  if (!showDeleteTxDialog || !txToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh] border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-red-50/20">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <Trash2 size={16} />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Confirm Deletion</h3>
            <p className="text-xs text-muted-foreground">This action cannot be undone</p>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this item? This will permanently remove it from the account ledgers and balance logs.
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={() => { setShowDeleteTxDialog(false); setTxToDelete(null); }}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (txToDelete) handleDelTx(txToDelete.accountId, txToDelete.txId);
              setShowDeleteTxDialog(false);
              setTxToDelete(null);
            }}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-750 transition-colors shadow-sm"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompleteReminderModal({
  showCompleteModal,
  setShowCompleteModal,
  reminderToComplete,
  onConfirmComplete,
}: {
  showCompleteModal: boolean;
  setShowCompleteModal: (v: boolean) => void;
  reminderToComplete: { accountId: string; txId: string; description?: string } | null;
  onConfirmComplete: (accountId: string, txId: string) => void;
}) {
  if (!showCompleteModal || !reminderToComplete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh] border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-emerald-50/50">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Complete Payment?</h3>
            <p className="text-xs text-muted-foreground">Inter-company loan transfer check</p>
          </div>
        </div>

        <div className="p-6 space-y-2">
          <p className="text-sm text-gray-700">
            Has the inter-company loan transfer payment for <strong className="text-foreground font-semibold">"{reminderToComplete.description || 'this reminder'}"</strong> been completed and settled?
          </p>
          <p className="text-xs text-muted-foreground">
            Marking this as complete will move it to the Completed Reminders list.
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={() => setShowCompleteModal(false)}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmComplete(reminderToComplete.accountId, reminderToComplete.txId);
              setShowCompleteModal(false);
            }}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Yes, Completed
          </button>
        </div>
      </div>
    </div>
  );
}
