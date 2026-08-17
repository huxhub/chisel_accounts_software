import assert from 'node:assert';

/**
 * TC-22 Regression Test: Sequential Per-Row Running Balance & Summary Card Reconciliation
 */

export function computeRunningBalances(account) {
  const visibleTransactions = (account.transactions || []).filter(t => !t.isReminder);
  
  // 1. Sort strictly chronologically
  const sortedTransactions = [...visibleTransactions].sort((a, b) => {
    const dateCmp = (a.date || '').localeCompare(b.date || '');
    if (dateCmp !== 0) return dateCmp;
    const createdCmp = (a.createdAt || '').localeCompare(b.createdAt || '');
    if (createdCmp !== 0) return createdCmp;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  // 2. Sequential calculation
  let runningTotal = account.openingBalance || 0;
  let totalDebit = 0;
  let totalCredit = 0;

  const rowsWithBalance = sortedTransactions.map(tx => {
    if (tx.type === 'credit') {
      runningTotal += tx.amount;
      totalCredit += tx.amount;
    } else {
      runningTotal -= tx.amount;
      totalDebit += tx.amount;
    }
    return {
      ...tx,
      balance: runningTotal,
    };
  });

  const closingBalanceCard = (account.openingBalance || 0) + totalCredit - totalDebit;

  return {
    rowsWithBalance,
    totalDebit,
    totalCredit,
    closingBalanceCard,
  };
}

// Runnable test matching STEP 5:
// Account: HDFC Bank, Opening ₹2,00,000
// Row 1: Payment (debit 25,000)
// Row 2: Receipt (credit 40,000)
// Row 3: Receipt (credit 35,000)
const hdfcAccount = {
  id: 'hdfc-1',
  name: 'HDFC Bank',
  openingBalance: 200000,
  transactions: [
    { id: 'tx-1', date: '2026-08-01', description: 'Payment to vendor 1', type: 'debit', amount: 25000 },
    { id: 'tx-2', date: '2026-08-02', description: 'Receipt from customer A', type: 'credit', amount: 40000 },
    { id: 'tx-3', date: '2026-08-03', description: 'Receipt from customer B', type: 'credit', amount: 35000 },
  ],
};

const result = computeRunningBalances(hdfcAccount);
const { rowsWithBalance, closingBalanceCard } = result;

console.log('--- TC-22 Running Balance Verification ---');
rowsWithBalance.forEach((row, i) => {
  console.log(`Row ${i + 1} (${row.description}): Amount = ${row.type === 'credit' ? '+' : '-'}${row.amount}, Computed Balance = ${row.balance}`);
});

// Assertions for STEP 5 & STEP 6:
assert.strictEqual(rowsWithBalance[0].balance, 175000, 'TC-22 Failure: Row 1 balance must be 175,000');
assert.strictEqual(rowsWithBalance[1].balance, 215000, 'TC-22 Failure: Row 2 balance must be 215,000');
assert.strictEqual(rowsWithBalance[2].balance, 250000, 'TC-22 Failure: Row 3 balance must be 250,000');

// Assert sequential continuity: for each row i > 0, balance == prevBalance +/- amount
let prevBalance = hdfcAccount.openingBalance;
rowsWithBalance.forEach((row, i) => {
  const expectedRowBalance = prevBalance + (row.type === 'credit' ? row.amount : -row.amount);
  assert.strictEqual(row.balance, expectedRowBalance, `TC-22 Failure: Row ${i + 1} balance is non-sequential`);
  prevBalance = row.balance;
});

// Assert LAST row balance equals Closing Balance summary card
const lastRowBalance = rowsWithBalance[rowsWithBalance.length - 1].balance;
assert.strictEqual(
  lastRowBalance,
  closingBalanceCard,
  `TC-22 Failure: Last row balance (${lastRowBalance}) != Closing Balance card (${closingBalanceCard})`
);

console.log(`\n✓ Closing Balance Card (${closingBalanceCard}) === Last Row Balance (${lastRowBalance})`);
console.log('SUCCESS: All TC-22 Running Balance tests passed cleanly!');
