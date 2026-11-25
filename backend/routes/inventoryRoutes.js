import express from 'express';
import InventoryItem from '../models/InventoryItem.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { randomUUID } from 'crypto';

const inventoryReference = id => `INVENTORY-${id}`;

const formatIndiaDate = value => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date(value));

const ensureLinkedCompany = async linkedAccountId => {
  if (!linkedAccountId) return;
  const account = await Account.findByPk(Number(linkedAccountId));
  if (!account || account.type !== 'company') throw new Error('Select a valid company account.');
};

const syncAccountMovement = async inventoryTransaction => {
  const reference = inventoryReference(inventoryTransaction.id);
  const existing = await Transaction.findOne({ where: { reference } });
  const paidAmount = Number(inventoryTransaction.paidAmount || 0);
  const accountId = inventoryTransaction.linkedAccountId ? Number(inventoryTransaction.linkedAccountId) : null;

  if (!accountId || paidAmount <= 0) {
    if (existing) await existing.destroy();
    return;
  }

  const account = await Account.findByPk(accountId);
  if (!account || account.type !== 'company') {
    if (existing) await existing.destroy();
    return;
  }
  const isSale = inventoryTransaction.transactionType === 'sale';
  const values = {
    accountId: account.id,
    companyName: account.name,
    date: formatIndiaDate(inventoryTransaction.createdAt || Date.now()),
    description: isSale ? `Sale received: ${inventoryTransaction.name}` : `Inventory purchase: ${inventoryTransaction.name}`,
    type: isSale ? 'credit' : 'debit',
    amount: paidAmount,
    reference,
    vendorOrCustomerName: inventoryTransaction.partyName || null,
    relatedItemName: inventoryTransaction.name,
  };
  if (existing) await existing.update(values);
  else await Transaction.create(values);
};

const router = express.Router();
router.get('/', async (_req, res) => {
  try {
    const items = await InventoryItem.findAll({ order: [['name', 'ASC'], ['id', 'ASC']] });
    const result = await Promise.all(items.map(async item => {
      const transactions = await InventoryTransaction.findAll({
        where: { inventoryItemId: item.id },
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
      });
      await Promise.all(transactions.map(syncAccountMovement));
      return { ...item.toJSON(), transactions };
    }));
    res.json(result);
  }
  catch (error) { res.status(500).json({ message: error.message }); }
});
router.post('/', async (req, res) => {
  const { name, quantity = 0, unit = 'pcs' } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 255 ||
      typeof unit !== 'string' || !unit.trim() || unit.trim().length > 50 ||
      (typeof quantity !== 'number' && typeof quantity !== 'string') || String(quantity).trim() === '' ||
      !Number.isFinite(Number(quantity)) || Number(quantity) < 0 || Number(quantity) >= 100000000000 ||
      !/^\d+(\.\d{1,3})?$/.test(String(quantity))) {
    return res.status(400).json({ message: 'Enter a name, unit and a valid non-negative quantity (up to 3 decimal places).' });
  }
  try {
    const item = await InventoryItem.create({ name: name.trim(), quantity: Number(quantity), unit: unit.trim() });
    res.status(201).json(item);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory company not found' });
    const inventoryTransactions = await InventoryTransaction.findAll({ where: { inventoryItemId: item.id }, attributes: ['id'] });
    await Transaction.destroy({ where: { reference: inventoryTransactions.map(entry => inventoryReference(entry.id)) } });
    await InventoryTransaction.destroy({ where: { inventoryItemId: item.id } });
    await item.destroy();
    res.json({ message: 'Inventory company deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/:id/transactions', async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory company not found' });
    const transactions = await InventoryTransaction.findAll({
      where: { inventoryItemId: item.id },
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
    });
    res.json(transactions);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/:id/transactions', async (req, res) => {
  const { partyName, name, quantity, unit, amount, paidAmount = 0, linkedAccountId = null, unitPrice = null, paymentStatus, transactionType = 'purchase' } = req.body;
  if (typeof partyName !== 'string' || !partyName.trim() || partyName.trim().length > 255 ||
      typeof name !== 'string' || !name.trim() || name.trim().length > 255 ||
      typeof quantity !== 'string' || !quantity.trim() || quantity.trim().length > 255 ||
      !['kg', 'box'].includes(unit) ||
      transactionType !== 'purchase' ||
      !Number.isFinite(Number(amount)) || Number(amount) < 0 || Number(amount) >= 1000000000000 ||
      (unitPrice !== null && (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0)) ||
      !Number.isFinite(Number(paidAmount)) || Number(paidAmount) < 0 || Number(paidAmount) > Number(amount) ||
      !/^\d+(\.\d{1,2})?$/.test(String(amount)) ||
      !['paid', 'not_paid', 'partial'].includes(paymentStatus) ||
      (linkedAccountId !== null && linkedAccountId !== '' && !Number.isInteger(Number(linkedAccountId)))) {
    return res.status(400).json({ message: 'Enter a name, valid quantity, amount, and payment status.' });
  }
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory company not found' });
    await ensureLinkedCompany(linkedAccountId);
    const transaction = await InventoryTransaction.create({
      inventoryItemId: item.id, partyName: partyName.trim(), transactionType, name: name.trim(), quantity: quantity.trim(), unit, amount: Number(amount), paidAmount: Number(paidAmount), linkedAccountId: linkedAccountId ? Number(linkedAccountId) : null, unitPrice: unitPrice === null ? null : Number(unitPrice), paymentStatus: Number(paidAmount) >= Number(amount) && Number(amount) > 0 ? 'paid' : Number(paidAmount) > 0 ? 'partial' : 'not_paid',
    });
    await syncAccountMovement(transaction);
    res.status(201).json(transaction);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/:id/transactions/batch', async (req, res) => {
  const { partyName, paymentStatus = 'not_paid', linkedAccountId = null, items } = req.body;
  if (typeof partyName !== 'string' || !partyName.trim() || partyName.trim().length > 255 ||
      !['paid', 'not_paid'].includes(paymentStatus) || !Array.isArray(items) || items.length < 1 || items.length > 50 ||
      (linkedAccountId !== null && linkedAccountId !== '' && !Number.isInteger(Number(linkedAccountId)))) {
    return res.status(400).json({ message: 'Enter a name and at least one valid sales item.' });
  }
  const validItems = items.every(entry =>
    typeof entry?.name === 'string' && entry.name.trim() && entry.name.trim().length <= 255 &&
    typeof entry?.quantity === 'string' && entry.quantity.trim() && Number.isFinite(Number(entry.quantity)) && Number(entry.quantity) > 0 &&
    ['kg', 'box'].includes(entry.unit) && Number.isFinite(Number(entry.unitPrice)) && Number(entry.unitPrice) >= 0 &&
    Number.isFinite(Number(entry.amount)) && Number(entry.amount) >= 0 && Number(entry.amount) < 1000000000000
  );
  if (!validItems) return res.status(400).json({ message: 'Complete every sales item with a valid quantity and price.' });
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory company not found' });
    await ensureLinkedCompany(linkedAccountId);
    // Create rows individually so every MySQL result has its generated ID before
    // the linked account transaction reference (INVENTORY-<id>) is created.
    const transactions = [];
    const saleBatchId = randomUUID();
    for (const entry of items) {
      const transaction = await InventoryTransaction.create({
        inventoryItemId: item.id,
        partyName: partyName.trim(),
        transactionType: 'sale',
        saleBatchId,
        name: entry.name.trim(),
        quantity: entry.quantity.trim(),
        unit: entry.unit,
        unitPrice: Number(entry.unitPrice),
        amount: Number(entry.amount),
        paidAmount: paymentStatus === 'paid' ? Number(entry.amount) : 0,
        linkedAccountId: linkedAccountId ? Number(linkedAccountId) : null,
        paymentStatus,
      });
      await syncAccountMovement(transaction);
      transactions.push(transaction);
    }
    res.status(201).json(transactions);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id/transactions/:transactionId', async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findOne({ where: { id: req.params.transactionId, inventoryItemId: req.params.id } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    const { partyName = transaction.partyName || 'Unassigned', name = transaction.name, quantity = transaction.quantity, unit = transaction.unit, amount = transaction.amount, paidAmount = transaction.paidAmount, linkedAccountId = transaction.linkedAccountId, unitPrice = transaction.unitPrice, paymentStatus = transaction.paymentStatus, transactionType = transaction.transactionType || 'purchase' } = req.body;
    if (typeof partyName !== 'string' || !partyName.trim() || partyName.trim().length > 255 || typeof name !== 'string' || !name.trim() || typeof quantity !== 'string' || !quantity.trim() || quantity.trim().length > 255 ||
        !['kg', 'box'].includes(unit) || !['purchase', 'sale'].includes(transactionType) || !Number.isFinite(Number(amount)) || Number(amount) < 0 ||
        (unitPrice !== null && unitPrice !== undefined && (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0)) || !Number.isFinite(Number(paidAmount)) || Number(paidAmount) < 0 || Number(paidAmount) > Number(amount) || !['paid', 'not_paid', 'partial'].includes(paymentStatus) ||
        (linkedAccountId !== null && linkedAccountId !== '' && !Number.isInteger(Number(linkedAccountId)))) {
      return res.status(400).json({ message: 'Enter valid transaction details.' });
    }
    const resolvedStatus = Number(paidAmount) >= Number(amount) && Number(amount) > 0 ? 'paid' : Number(paidAmount) > 0 ? 'partial' : 'not_paid';
    await ensureLinkedCompany(linkedAccountId);
    await transaction.update({ partyName: partyName.trim(), transactionType, name: name.trim(), quantity: quantity.trim(), unit, amount: Number(amount), paidAmount: Number(paidAmount), linkedAccountId: linkedAccountId ? Number(linkedAccountId) : null, unitPrice: unitPrice === null || unitPrice === undefined ? null : Number(unitPrice), paymentStatus: resolvedStatus });
    await syncAccountMovement(transaction);
    res.json(transaction);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/:id/transactions/:transactionId', async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findOne({ where: { id: req.params.transactionId, inventoryItemId: req.params.id } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    await Transaction.destroy({ where: { reference: inventoryReference(transaction.id) } });
    await transaction.destroy();
    res.json({ message: 'Transaction deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});
export default router;
