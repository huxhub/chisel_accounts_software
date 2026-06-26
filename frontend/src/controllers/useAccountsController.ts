import { useState, useEffect } from 'react';
import { accountService } from '../services/api';

export const useAccountsController = (isAuthenticated: boolean) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
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

  const addTransaction = async (accountId: string, transaction: any) => {
    try {
      const newTx = await accountService.addTransaction(accountId, transaction);
      setAccounts(prev => prev.map(a =>
        a.id === accountId ? { ...a, transactions: [...a.transactions, newTx] } : a
      ));
    } catch (error) {
      console.error("Failed to add transaction", error);
    }
  };

  const deleteTransaction = async (accountId: string, txId: string) => {
    try {
      await accountService.deleteTransaction(accountId, txId);
      setAccounts(prev => prev.map(a =>
        a.id === accountId ? { ...a, transactions: a.transactions.filter((t: any) => t.id !== txId) } : a
      ));
    } catch (error) {
      console.error("Failed to delete transaction", error);
    }
  };

  const saveOpeningBalance = async (accountId: string, value: number) => {
    try {
      if (isNaN(value)) return;
      await accountService.updateOpeningBalance(accountId, value);
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, openingBalance: value } : a));
    } catch (error) {
      console.error("Failed to update opening balance", error);
    }
  };

  const addAccount = async (accountData: any) => {
    try {
      const newAccount = await accountService.createAccount(accountData);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount.id;
    } catch (error) {
      console.error("Failed to add account", error);
    }
  };

  const editAccountName = async (accountId: string, newName: string) => {
    try {
      if (!newName.trim()) return;
      await accountService.updateAccountName(accountId, newName);
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, name: newName } : a));
    } catch (error) {
      console.error("Failed to update account name", error);
    }
  };

  return {
    accounts,
    loading,
    addAccount,
    editAccountName,
    addTransaction,
    deleteTransaction,
    saveOpeningBalance
  };
};
