import test from 'node:test';
import assert from 'node:assert/strict';
import Ledger from '../models/Ledger.js';
import { createLedger, getLedgers, getLedgerStatement } from '../controllers/ledgerController.js';

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
});

test('ledger creation, list and statement agree for advances and return vouchers', async () => {
  const originals = { findOne: Ledger.findOne, create: Ledger.create, findAll: Ledger.findAll, findByPk: Ledger.findByPk };
  try {
    for (const [type, openingType] of [['vendor', 'debit'], ['customer', 'credit']]) {
      const vouchers = [
        { id: 1, date: '2025-01-01', type: 'purchase', amount: 100 },
        { id: 2, date: '2025-01-02', type: 'sale', amount: 30 },
        { id: 3, date: '2025-01-03', type: 'payment', amount: 20 },
        { id: 4, date: '2025-01-04', type: 'receipt', amount: 10 },
      ];
      const ledger = { type, openingType, openingBalance: 50, Vouchers: vouchers };
      ledger.toJSON = () => ({ ...ledger, Vouchers: vouchers });
      Ledger.findOne = async () => null;
      Ledger.create = async () => ledger;
      Ledger.findAll = async () => [ledger];
      Ledger.findByPk = async () => ledger;

      const created = response();
      await createLedger({ body: { name: 'Test', type, openingType, openingBalance: 50 } }, created);
      assert.equal(created.body.balanceDue, -50);
      const list = response();
      await getLedgers({ query: {} }, list);
      const statement = response();
      await getLedgerStatement({ params: { id: 1 } }, statement);
      const expected = type === 'vendor' ? 10 : -110;
      assert.equal(list.body[0].balanceDue, expected);
      assert.equal(statement.body.summary.openingBalance, -50);
      assert.equal(statement.body.summary.closingBalance, expected);
      assert.equal(statement.body.rows.at(-1).runningBalance, expected);
    }
  } finally {
    Object.assign(Ledger, originals);
  }
});
