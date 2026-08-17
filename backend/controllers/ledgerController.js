import Ledger from '../models/Ledger.js';
import Voucher from '../models/Voucher.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Program from '../models/Program.js';

// GET /api/ledgers
export const getLedgers = async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};

    const ledgers = await Ledger.findAll({
      where,
      include: [
        {
          model: Voucher,
          include: [
            { model: Account, attributes: ['id', 'name'] },
            { model: Program, attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['name', 'ASC']],
    });

    const result = ledgers.map((l) => {
      const plain = l.toJSON();
      const vouchers = plain.Vouchers || [];

      let totalPurchased = 0;
      let totalPaid = 0;
      let totalSold = 0;
      let totalReceived = 0;

      vouchers.forEach((v) => {
        if (v.type === 'purchase') totalPurchased += v.amount;
        if (v.type === 'payment') totalPaid += v.amount;
        if (v.type === 'sale') totalSold += v.amount;
        if (v.type === 'receipt') totalReceived += v.amount;
      });

      const openingBal = l.openingBalance || 0;
      const balanceDue =
        l.type === 'vendor'
          ? openingBal + totalPurchased - totalPaid
          : openingBal + totalSold - totalReceived;

      return {
        ...plain,
        totalPurchased,
        totalPaid,
        totalSold,
        totalReceived,
        balanceDue,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ledgers
export const createLedger = async (req, res) => {
  try {
    const { name, type, openingBalance, openingType } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Ledger name is required' });
    }

    const existing = await Ledger.findOne({
      where: { name: name.trim(), type: type || 'vendor' },
    });
    if (existing) {
      return res.status(400).json({ message: `A ${type || 'vendor'} with this name already exists` });
    }

    const ledger = await Ledger.create({
      name: name.trim(),
      type: type || 'vendor',
      openingBalance: parseFloat(openingBalance) || 0,
      openingType: openingType || (type === 'customer' ? 'debit' : 'credit'),
    });

    res.status(201).json({
      ...ledger.toJSON(),
      Vouchers: [],
      totalPurchased: 0,
      totalPaid: 0,
      totalSold: 0,
      totalReceived: 0,
      balanceDue: ledger.openingBalance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/ledgers/:id
export const deleteLedger = async (req, res) => {
  try {
    const ledger = await Ledger.findByPk(req.params.id, {
      include: [{ model: Voucher }],
    });
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });

    // Remove linked Account Transactions for any payment/receipt vouchers
    const references = (ledger.Vouchers || [])
      .map((v) => v.reference)
      .filter((ref) => ref && (ref.startsWith('PAY-') || ref.startsWith('REC-')));

    if (references.length > 0) {
      await Transaction.destroy({ where: { reference: references } });
    }

    await ledger.destroy(); // CASCADE deletes vouchers
    res.json({ message: 'Ledger deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/ledgers/:id/statement
export const getLedgerStatement = async (req, res) => {
  try {
    const ledger = await Ledger.findByPk(req.params.id, {
      include: [
        {
          model: Voucher,
          include: [
            { model: Account, attributes: ['id', 'name'] },
            { model: Program, attributes: ['id', 'name'] },
          ],
        },
      ],
    });

    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });

    const vouchers = (ledger.Vouchers || []).sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = ledger.openingBalance || 0;
    let totalDr = 0;
    let totalCr = 0;

    const rows = vouchers.map((v) => {
      let debit = 0;
      let credit = 0;

      if (ledger.type === 'vendor') {
        // Purchase increases what we owe (Credit), Payment decreases what we owe (Debit)
        if (v.type === 'purchase') {
          credit = v.amount;
          runningBalance += v.amount;
        } else if (v.type === 'payment') {
          debit = v.amount;
          runningBalance -= v.amount;
        } else if (v.type === 'sale') {
          debit = v.amount;
          runningBalance -= v.amount;
        } else if (v.type === 'receipt') {
          credit = v.amount;
          runningBalance += v.amount;
        }
      } else {
        // Customer: Sale increases what they owe us (Debit), Receipt decreases what they owe us (Credit)
        if (v.type === 'sale') {
          debit = v.amount;
          runningBalance += v.amount;
        } else if (v.type === 'receipt') {
          credit = v.amount;
          runningBalance -= v.amount;
        } else if (v.type === 'purchase') {
          credit = v.amount;
          runningBalance -= v.amount;
        } else if (v.type === 'payment') {
          debit = v.amount;
          runningBalance += v.amount;
        }
      }

      totalDr += debit;
      totalCr += credit;

      return {
        id: v.id,
        date: v.date,
        type: v.type,
        itemName: v.itemName,
        note: v.note,
        amount: v.amount,
        reference: v.reference,
        accountName: v.Account?.name || null,
        programName: v.Program?.name || null,
        debit,
        credit,
        runningBalance,
      };
    });

    res.json({
      ledger: {
        id: ledger.id,
        name: ledger.name,
        type: ledger.type,
        openingBalance: ledger.openingBalance,
        openingType: ledger.openingType,
      },
      summary: {
        openingBalance: ledger.openingBalance,
        totalDebit: totalDr,
        totalCredit: totalCr,
        closingBalance: runningBalance,
      },
      rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
