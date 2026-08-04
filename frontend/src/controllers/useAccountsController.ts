import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { accountService } from '../services/api';
import { programService } from '../services/programService';
import { getErrorMessage } from '../services/errors';
import type { Program } from '../app/types';

export const useAccountsController = (isAuthenticated: boolean) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
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

  const fetchPrograms = async () => {
    try {
      const data = await programService.getPrograms();
      setPrograms(data);
    } catch (error) {
      // Programs fetch failure shouldn't block the rest of the app
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccounts();
      fetchPrograms();
    } else {
      setAccounts([]);
      setPrograms([]);
    }
  }, [isAuthenticated]);

  const addProgram = async (name: string, color: string = '#6366f1') => {
    try {
      const newProgram = await programService.createProgram(name, color);
      setPrograms(prev => [...prev, newProgram].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Program "${name}" created`);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create program.'));
      return false;
    }
  };

  const deleteProgram = async (id: number) => {
    try {
      await programService.deleteProgram(id);
      setPrograms(prev => prev.filter(p => p.id !== id));
      toast.success('Program deleted');
      fetchAccounts();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete program.'));
      return false;
    }
  };

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
      return { success: false, message: getErrorMessage(error, 'Failed to delete account.') };
    }
  };

  return {
    accounts,
    programs,
    loading,
    addAccount,
    editAccountName,
    deleteAccount,
    addTransaction,
    deleteTransaction,
    editTransaction,
    saveOpeningBalance,
    addProgram,
    deleteProgram,
  };
};
