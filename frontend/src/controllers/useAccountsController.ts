import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { accountService } from '../services/api';
import { getErrorMessage } from '../services/errors';

export const useAccountsController = (isAuthenticated: boolean) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load accounts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccounts();
    } else {
      setAccounts([]);
    }
  }, [isAuthenticated]);

  const addTransaction = async (accountId: string, transaction: any, options?: { silent?: boolean }) => {
    try {
      const newTx = await accountService.addTransaction(accountId, transaction);
      setAccounts(prev => prev.map(a =>
        String(a.id) === String(accountId) ? { ...a, transactions: [...a.transactions, newTx] } : a
      ));
      if (!options?.silent) toast.success('Transaction added');
      return newTx;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add transaction.'));
      return null;
    }
  };

  const deleteTransaction = async (accountId: string, txId: string, options?: { silent?: boolean }) => {
    try {
      await accountService.deleteTransaction(accountId, txId);
      setAccounts(prev => prev.map(a =>
        String(a.id) === String(accountId) ? { ...a, transactions: a.transactions.filter((t: any) => String(t.id) !== String(txId)) } : a
      ));
      if (!options?.silent) toast.success('Transaction removed');
      return true;
    } catch (error) {
      if (!options?.silent) toast.error(getErrorMessage(error, 'Failed to delete transaction.'));
      return false;
    }
  };

  const editTransaction = async (accountId: string, txId: string, transaction: any, options?: { silent?: boolean }) => {
    try {
      const updatedTx = await accountService.updateTransaction(accountId, txId, transaction);
      setAccounts(prev => prev.map(a =>
        String(a.id) === String(accountId) ? {
          ...a,
          transactions: a.transactions.map((t: any) => String(t.id) === String(txId) ? updatedTx : t)
        } : a
      ));
      if (!options?.silent) toast.success('Transaction updated');
      return updatedTx;
    } catch (error) {
      if (!options?.silent) toast.error(getErrorMessage(error, 'Failed to update transaction.'));
      return null;
    }
  };

  const saveOpeningBalance = async (accountId: string, value: number) => {
    if (isNaN(value)) {
      toast.warning('Enter a valid opening balance.');
      return false;
    }
    try {
      await accountService.updateOpeningBalance(accountId, value);
      setAccounts(prev => prev.map(a => String(a.id) === String(accountId) ? { ...a, openingBalance: value } : a));
      toast.success('Opening balance updated');
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update opening balance.'));
      return false;
    }
  };

  const addAccount = async (accountData: any) => {
    try {
      const newAccount = await accountService.createAccount(accountData);
      setAccounts(prev => [...prev, newAccount]);
      toast.success(`${newAccount.name} added`);
      return newAccount.id;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add account.'));
      return null;
    }
  };

  const editAccountName = async (accountId: string, newName: string) => {
    if (!newName.trim()) {
      toast.warning('Account name cannot be empty.');
      return false;
    }
    try {
      await accountService.updateAccountName(accountId, newName);
      setAccounts(prev => prev.map(a => String(a.id) === String(accountId) ? { ...a, name: newName } : a));
      toast.success('Account renamed');
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update account name.'));
      return false;
    }
  };

  const deleteAccount = async (accountId: string, password: string) => {
    try {
      await accountService.deleteAccount(accountId, password);
      setAccounts(prev => prev.filter(a => String(a.id) !== String(accountId)));
      toast.success('Account deleted');
      return { success: true };
    } catch (error) {
      // No toast here — the delete-confirmation dialog surfaces this message inline.
      return { success: false, message: getErrorMessage(error, 'Failed to delete account.') };
    }
  };

  return {
    accounts,
    loading,
    addAccount,
    editAccountName,
    deleteAccount,
    addTransaction,
    deleteTransaction,
    editTransaction,
    saveOpeningBalance
  };
};
