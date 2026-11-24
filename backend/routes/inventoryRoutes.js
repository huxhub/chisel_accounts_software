import express from 'express';
import InventoryItem from '../models/InventoryItem.js';
import InventoryTransaction from '../models/InventoryTransaction.js';

const router = express.Router();
router.get('/', async (_req, res) => {
  try {
    const items = await InventoryItem.findAll({ order: [['name', 'ASC'], ['id', 'ASC']] });
    const result = await Promise.all(items.map(async item => ({
      ...item.toJSON(),
      transactions: await InventoryTransaction.findAll({
        where: { inventoryItemId: item.id },
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
      }),
    })));
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
  const { name, quantity, unit, amount, paymentStatus } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 255 ||
      typeof quantity !== 'string' || !quantity.trim() || quantity.trim().length > 255 ||
      !['kg', 'box'].includes(unit) ||
      !Number.isFinite(Number(amount)) || Number(amount) < 0 || Number(amount) >= 1000000000000 ||
      !/^\d+(\.\d{1,2})?$/.test(String(amount)) ||
      !['paid', 'not_paid'].includes(paymentStatus)) {
    return res.status(400).json({ message: 'Enter a name, valid quantity, amount, and payment status.' });
  }
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory company not found' });
    const transaction = await InventoryTransaction.create({
      inventoryItemId: item.id, name: name.trim(), quantity: quantity.trim(), unit, amount: Number(amount), paymentStatus,
    });
    res.status(201).json(transaction);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id/transactions/:transactionId', async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findOne({ where: { id: req.params.transactionId, inventoryItemId: req.params.id } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    const { name = transaction.name, quantity = transaction.quantity, unit = transaction.unit, amount = transaction.amount, paymentStatus = transaction.paymentStatus } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof quantity !== 'string' || !quantity.trim() || quantity.trim().length > 255 ||
        !['kg', 'box'].includes(unit) || !Number.isFinite(Number(amount)) || Number(amount) < 0 || !['paid', 'not_paid'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Enter valid transaction details.' });
    }
    await transaction.update({ name: name.trim(), quantity: quantity.trim(), unit, amount: Number(amount), paymentStatus });
    res.json(transaction);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/:id/transactions/:transactionId', async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findOne({ where: { id: req.params.transactionId, inventoryItemId: req.params.id } });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    await transaction.destroy();
    res.json({ message: 'Transaction deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});
export default router;
