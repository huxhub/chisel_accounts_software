import { sequelize } from '../config/db.js';
import Voucher from '../models/Voucher.js';
import Ledger from '../models/Ledger.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Program from '../models/Program.js';

// POST /api/vouchers
export const createVoucher = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      type,
      ledgerId,
      accountId,
      date,
      itemName,
      amount,
      note,
      programId,
      document,
      paidNow,
    } = req.body;

    if (!type || !ledgerId || !date || !amount) {
      await t.rollback();
      return res.status(400).json({ message: 'type, ledgerId, date, and amount are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const parsedPaidNow = parseFloat(paidNow) || 0;

    const ledger = await Ledger.findByPk(ledgerId, { transaction: t });
    if (!ledger) {
      await t.rollback();
      return res.status(404).json({ message: 'Ledger not found' });
    }

    let reference = null;

    if (type === 'payment' || type === 'receipt') {
      if (!accountId) {
        await t.rollback();
        return res.status(400).json({ message: 'Account is required for Payment / Receipt vouchers' });
      }

      const account = await Account.findByPk(accountId, { transaction: t });
      if (!account) {
        await t.rollback();
        return res.status(404).json({ message: 'Target bank/cash account not found' });
      }

      reference = `${type === 'payment' ? 'PAY' : 'REC'}-${Date.now()}`;
      const itemDesc = itemName?.trim() ? itemName.trim() : 'Balance Settlement';
      const detailDescription = type === 'payment'
        ? `Payment to ${ledger.name} — ${itemDesc}${itemName?.trim() ? ' (Purchase)' : ''}`
        : `Receipt from ${ledger.name} — ${itemDesc}${itemName?.trim() ? ' (Sale)' : ''}`;

      // Create automatic Transaction on the Bank/Cash Account
      await Transaction.create(
        {
          accountId: account.id,
          companyName: ledger.name,
          date,
          description: detailDescription,
          type: type === 'payment' ? 'debit' : 'credit',
          amount: parsedAmount,
          reference,
          programId: programId || null,
          document: document || null,
          vendorOrCustomerName: ledger.name,
          relatedItemName: itemDesc,
        },
        { transaction: t }
      );
    }

    // If purchase/sale has paidNow > 0, validate accountId
    if ((type === 'purchase' || type === 'sale') && parsedPaidNow > 0) {
      if (!accountId) {
        await t.rollback();
        return res.status(400).json({ message: 'Account is required when specifying Paid/Received Now' });
      }
      const account = await Account.findByPk(accountId, { transaction: t });
      if (!account) {
        await t.rollback();
        return res.status(404).json({ message: 'Target bank/cash account not found' });
      }
    }

    // Primary Voucher Creation
    const voucher = await Voucher.create(
      {
        type,
        ledgerId: ledger.id,
        accountId: (type === 'payment' || type === 'receipt') ? accountId : null,
        date,
        itemName: (type === 'purchase' || type === 'sale') ? (itemName?.trim() || null) : null,
        amount: parsedAmount,
        reference,
        note: note?.trim() || null,
        programId: programId || null,
        document: document || null,
      },
      { transaction: t }
    );

    // If purchase/sale with paidNow > 0, create second payment/receipt voucher + bank transaction
    let secondVoucher = null;
    if ((type === 'purchase' || type === 'sale') && parsedPaidNow > 0) {
      const secondType = type === 'purchase' ? 'payment' : 'receipt';
      const secondRef = `${secondType === 'payment' ? 'PAY' : 'REC'}-${Date.now()}`;
      const itemDesc = itemName?.trim() ? itemName.trim() : (type === 'purchase' ? 'Purchase' : 'Sale');
      const detailDescription = secondType === 'payment'
        ? `Payment to ${ledger.name} — ${itemDesc} (Purchase)`
        : `Receipt from ${ledger.name} — ${itemDesc} (Sale)`;

      await Transaction.create(
        {
          accountId,
          companyName: ledger.name,
          date,
          description: detailDescription,
          type: secondType === 'payment' ? 'debit' : 'credit',
          amount: parsedPaidNow,
          reference: secondRef,
          programId: programId || null,
          document: document || null,
          vendorOrCustomerName: ledger.name,
          relatedItemName: itemDesc,
        },
        { transaction: t }
      );

      secondVoucher = await Voucher.create(
        {
          type: secondType,
          ledgerId: ledger.id,
          accountId,
          date,
          itemName: null,
          amount: parsedPaidNow,
          reference: secondRef,
          note: note?.trim() ? `${note.trim()} (Immediate ${secondType})` : `Immediate ${secondType} for ${itemDesc}`,
          programId: programId || null,
          document: document || null,
        },
        { transaction: t }
      );
    }

    await t.commit();

    const result = await Voucher.findByPk(voucher.id, {
      include: [
        { model: Ledger, attributes: ['id', 'name', 'type'] },
        { model: Account, attributes: ['id', 'name'] },
        { model: Program, attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json({
      voucher: result,
      secondVoucherId: secondVoucher ? secondVoucher.id : null,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/vouchers/:id
export const deleteVoucher = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const voucher = await Voucher.findByPk(req.params.id, { transaction: t });
    if (!voucher) {
      await t.rollback();
      return res.status(404).json({ message: 'Voucher not found' });
    }

    // Delete linked Account Transaction if payment or receipt
    if (voucher.reference && (voucher.reference.startsWith('PAY-') || voucher.reference.startsWith('REC-'))) {
      await Transaction.destroy({
        where: { reference: voucher.reference },
        transaction: t,
      });
    }

    await voucher.destroy({ transaction: t });
    await t.commit();

    res.json({ message: 'Voucher deleted successfully' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/profit
export const getProfitReport = async (req, res) => {
  try {
    const { from, to, programId } = req.query;
    const where = {};
    if (programId) where.programId = programId;

    const vouchers = await Voucher.findAll({ where });

    let totalPurchases = 0;
    let totalSales = 0;

    vouchers.forEach((v) => {
      let inRange = true;
      if (from && v.date < from) inRange = false;
      if (to && v.date > to) inRange = false;

      if (inRange) {
        if (v.type === 'purchase') totalPurchases += v.amount;
        if (v.type === 'sale') totalSales += v.amount;
      }
    });

    const grossProfit = totalSales - totalPurchases;

    res.json({
      totalPurchases,
      totalSales,
      grossProfit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
