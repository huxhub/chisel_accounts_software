import express from 'express';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import SalesTransaction from '../models/SalesTransaction.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();
const salesReference = id => `SALES-${id}`;
const formatIndiaDate = value => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value));
const ensureCompany = async linkedAccountId => {
  if (linkedAccountId === null || linkedAccountId === undefined || linkedAccountId === '') return null;
  const account = await Account.findByPk(Number(linkedAccountId));
  if (!account || account.type !== 'company') throw new Error('Select a valid company account.');
  return account;
};
const syncAccountMovement = async sale => {
  const reference = salesReference(sale.id);
  const existing = await Transaction.findOne({ where: { reference } });
  const paidAmount = Number(sale.paidAmount || 0);
  if (!sale.linkedAccountId || paidAmount <= 0) {
    if (existing) await existing.destroy();
    return;
  }
  const account = await ensureCompany(sale.linkedAccountId);
  const values = {
    accountId: account.id,
    companyName: account.name,
    date: formatIndiaDate(sale.createdAt || Date.now()),
    description: `Sale received: ${sale.name}`,
    type: 'credit',
    amount: paidAmount,
    reference,
    vendorOrCustomerName: sale.partyName || null,
    relatedItemName: sale.name,
  };
  if (existing) await existing.update(values);
  else await Transaction.create(values);
};
router.get('/', async (_req, res) => {
  try { res.json(await SalesTransaction.findAll({ order: [['createdAt', 'DESC'], ['id', 'DESC']] })); }
  catch (error) { res.status(500).json({ message: error.message }); }
});
router.post('/batch', async (req, res) => {
  const { partyName, paymentStatus = 'not_paid', paidAmount = 0, linkedAccountId = null, items } = req.body;
  const valid = typeof partyName === 'string' && partyName.trim() && ['paid', 'not_paid', 'partial'].includes(paymentStatus) && Array.isArray(items) && items.length > 0 && items.length <= 50 && items.every(item => typeof item?.name === 'string' && item.name.trim() && Number(item.quantity) > 0 && ['kg', 'box'].includes(item.unit) && Number.isFinite(Number(item.unitPrice)) && Number(item.unitPrice) >= 0);
  if (!valid || (linkedAccountId !== null && linkedAccountId !== '' && !Number.isInteger(Number(linkedAccountId)))) return res.status(400).json({ message: 'Enter a customer and valid sales items.' });
  try {
    await ensureCompany(linkedAccountId);
    const saleBatchId = randomUUID();
    const rows = [];
    const totalBatchAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    let remainingPaid = paymentStatus === 'paid' ? totalBatchAmount : Math.max(0, Number(paidAmount) || 0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const amount = Number(item.quantity) * Number(item.unitPrice);
      let itemPaid = 0;
      if (paymentStatus === 'paid') {
        itemPaid = amount;
      } else if (remainingPaid > 0) {
        itemPaid = Math.min(amount, remainingPaid);
        remainingPaid -= itemPaid;
      }
      const itemStatus = itemPaid >= amount && amount > 0 ? 'paid' : itemPaid > 0 ? 'partial' : 'not_paid';
      const row = await SalesTransaction.create({
        partyName: partyName.trim(),
        saleBatchId,
        name: item.name.trim(),
        quantity: String(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        amount,
        paidAmount: itemPaid,
        linkedAccountId: linkedAccountId ? Number(linkedAccountId) : null,
        paymentStatus: itemStatus,
      });
      await syncAccountMovement(row);
      rows.push(row);
    }
    res.status(201).json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/batch/:batchId', async (req, res) => {
  const { batchId } = req.params;
  const { partyName, paymentStatus = 'not_paid', paidAmount = 0, linkedAccountId = null, items } = req.body;
  const valid = typeof partyName === 'string' && partyName.trim() && ['paid', 'not_paid', 'partial'].includes(paymentStatus) && Array.isArray(items) && items.length > 0 && items.length <= 50 && items.every(item => typeof item?.name === 'string' && item.name.trim() && Number(item.quantity) > 0 && ['kg', 'box'].includes(item.unit) && Number.isFinite(Number(item.unitPrice)) && Number(item.unitPrice) >= 0);
  if (!valid || (linkedAccountId !== null && linkedAccountId !== '' && !Number.isInteger(Number(linkedAccountId)))) return res.status(400).json({ message: 'Enter a customer and valid sales items.' });

  try {
    await ensureCompany(linkedAccountId);
    const isNumeric = /^\d+$/.test(batchId);
    const existingSales = await SalesTransaction.findAll({
      where: isNumeric
        ? { [Op.or]: [{ saleBatchId: batchId }, { id: Number(batchId) }] }
        : { saleBatchId: batchId },
    });

    if (!existingSales.length) return res.status(404).json({ message: 'Sale batch not found.' });

    for (const old of existingSales) {
      await Transaction.destroy({ where: { reference: salesReference(old.id) } });
    }

    const preservedBatchId = existingSales[0].saleBatchId || batchId;
    const preservedCreatedAt = existingSales[0].createdAt;

    for (const old of existingSales) {
      await old.destroy();
    }

    const rows = [];
    const totalBatchAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    let remainingPaid = paymentStatus === 'paid' ? totalBatchAmount : Math.max(0, Number(paidAmount) || 0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const amount = Number(item.quantity) * Number(item.unitPrice);
      let itemPaid = 0;
      if (paymentStatus === 'paid') {
        itemPaid = amount;
      } else if (remainingPaid > 0) {
        itemPaid = Math.min(amount, remainingPaid);
        remainingPaid -= itemPaid;
      }
      const itemStatus = itemPaid >= amount && amount > 0 ? 'paid' : itemPaid > 0 ? 'partial' : 'not_paid';
      const row = await SalesTransaction.create({
        partyName: partyName.trim(),
        saleBatchId: preservedBatchId,
        name: item.name.trim(),
        quantity: String(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        amount,
        paidAmount: itemPaid,
        linkedAccountId: linkedAccountId ? Number(linkedAccountId) : null,
        paymentStatus: itemStatus,
        createdAt: preservedCreatedAt,
      });
      await syncAccountMovement(row);
      rows.push(row);
    }
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/batch/:batchId', async (req, res) => {
  const { batchId } = req.params;
  try {
    const isNumeric = /^\d+$/.test(batchId);
    const existingSales = await SalesTransaction.findAll({
      where: isNumeric
        ? { [Op.or]: [{ saleBatchId: batchId }, { id: Number(batchId) }] }
        : { saleBatchId: batchId },
    });

    if (!existingSales.length) return res.status(404).json({ message: 'Sale batch not found.' });

    for (const s of existingSales) {
      await Transaction.destroy({ where: { reference: salesReference(s.id) } });
      await s.destroy();
    }
    res.json({ message: 'Sale batch deleted.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const sale = await SalesTransaction.findByPk(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found.' });
    const { partyName, name, quantity, unit, unitPrice, paidAmount = 0, linkedAccountId = sale.linkedAccountId } = req.body;
    if (!partyName?.trim() || !name?.trim() || !['kg', 'box'].includes(unit) || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || !Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0 || !Number.isFinite(Number(paidAmount)) || Number(paidAmount) < 0 || (linkedAccountId !== null && linkedAccountId !== '' && !Number.isInteger(Number(linkedAccountId)))) return res.status(400).json({ message: 'Enter valid sale details.' });
    await ensureCompany(linkedAccountId);
    const amount = Number(quantity) * Number(unitPrice);
    if (Number(paidAmount) > amount) return res.status(400).json({ message: 'Paid amount cannot exceed sale amount.' });
    await sale.update({ partyName: partyName.trim(), name: name.trim(), quantity: String(quantity), unit, unitPrice: Number(unitPrice), amount, paidAmount: Number(paidAmount), linkedAccountId: linkedAccountId ? Number(linkedAccountId) : null, paymentStatus: Number(paidAmount) >= amount ? 'paid' : Number(paidAmount) > 0 ? 'partial' : 'not_paid' });
    await syncAccountMovement(sale);
    res.json(sale);
  } catch (error) { res.status(500).json({ message: error.message }); }
});
router.delete('/:id', async (req, res) => {
  try { const sale = await SalesTransaction.findByPk(req.params.id); if (!sale) return res.status(404).json({ message: 'Sale not found.' }); await Transaction.destroy({ where: { reference: salesReference(sale.id) } }); await sale.destroy(); res.json({ message: 'Sale deleted.' }); }
  catch (error) { res.status(500).json({ message: error.message }); }
});
export default router;
