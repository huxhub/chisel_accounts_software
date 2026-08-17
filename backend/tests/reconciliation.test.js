import assert from 'node:assert';

/**
 * TC-20 Regression Test: Account Summary Cards vs Visible Table Rows Reconciliation
 */

export function calcBalance(account) {
  return (account.transactions || [])
    .filter(tx => !tx.isReminder)
    .reduce(
      (bal, tx) => (tx.type === 'credit' ? bal + tx.amount : bal - tx.amount),
      account.openingBalance || 0
    );
}

export function calcTotalCredit(account) {
  return (account.transactions || [])
    .filter(t => t.type === 'credit' && !t.isReminder)
    .reduce((s, t) => s + t.amount, 0);
}

export function calcTotalDebit(account) {
  return (account.transactions || [])
    .filter(t => t.type === 'debit' && !t.isReminder)
    .reduce((s, t) => s + t.amount, 0);
}

export function testAccountReconciliation(account) {
  const visibleTransactions = (account.transactions || []).filter(t => !t.isReminder);

  const sumVisibleDebit = visibleTransactions
    .filter(t => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  const sumVisibleCredit = visibleTransactions
    .filter(t => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  const cardTotalDebit = calcTotalDebit(account);
  const cardTotalCredit = calcTotalCredit(account);
  const cardClosingBalance = calcBalance(account);
  const expectedClosingBalance = (account.openingBalance || 0) + cardTotalCredit - cardTotalDebit;

  assert.strictEqual(
    cardTotalDebit,
    sumVisibleDebit,
    `[TC-20 Failure] Account ${account.name}: Card Total Debit (${cardTotalDebit}) != Visible Table Debit Sum (${sumVisibleDebit})`
  );

  assert.strictEqual(
    cardTotalCredit,
    sumVisibleCredit,
    `[TC-20 Failure] Account ${account.name}: Card Total Credit (${cardTotalCredit}) != Visible Table Credit Sum (${sumVisibleCredit})`
  );

  assert.strictEqual(
    cardClosingBalance,
    expectedClosingBalance,
    `[TC-20 Failure] Account ${account.name}: Closing Balance (${cardClosingBalance}) != Opening (${account.openingBalance}) + Credit (${cardTotalCredit}) - Debit (${cardTotalDebit})`
  );

  console.log(`✓ TC-20 Passed for Account "${account.name}":`);
  console.log(`   Table Debit Sum (${sumVisibleDebit}) === Card Total Debit (${cardTotalDebit})`);
  console.log(`   Table Credit Sum (${sumVisibleCredit}) === Card Total Credit (${cardTotalCredit})`);
  console.log(`   Closing Balance (${cardClosingBalance}) === Opening (${account.openingBalance || 0}) + Credit (${cardTotalCredit}) - Debit (${cardTotalDebit})`);
}

// Runnable test case matching STEP 4 scenario:
// Account "bank 1" with openingBalance: 44444
// Transactions:
// 1. Loan to bank 2 (-1200) -> debit
// 2. Transfer from bank 2 (+50000) -> credit
// 3. Payment to vendor 1 (-25000) -> debit
// 4. Transfer to company 2 (-20000) -> debit
const testBank1 = {
  id: 'bank-1',
  name: 'bank 1',
  openingBalance: 44444,
  transactions: [
    { id: '1', type: 'debit', amount: 1200, description: 'Loan to bank 2' },
    { id: '2', type: 'credit', amount: 50000, description: 'Transfer from bank 2' },
    { id: '3', type: 'debit', amount: 25000, description: 'Payment to vendor 1' },
    { id: '4', type: 'debit', amount: 20000, description: 'Transfer to company 2' },
  ],
};

try {
  testAccountReconciliation(testBank1);
  console.log('\nSUCCESS: All TC-20 Reconciliation tests passed cleanly!');
} catch (err) {
  console.error('\nFAIL: Regression test failed:', err.message);
  process.exit(1);
}
