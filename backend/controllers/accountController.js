import { Op } from 'sequelize';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Program from '../models/Program.js';

const formatTransaction = (tx) => ({
  id: tx.id,
  companyName: tx.companyName,
  date: tx.date,
  description: tx.description,
  type: tx.type,
  amount: tx.amount,
  reference: tx.reference,
  document: tx.document,
  dueDate: tx.dueDate,
  exchangeType: tx.exchangeType,
  isCompleted: Boolean(tx.isCompleted),
  isReminder: Boolean(tx.isReminder),
  programId: tx.programId || null,
  programName: tx.Program?.name || null,
  vendorOrCustomerName: tx.vendorOrCustomerName || null,
  relatedItemName: tx.relatedItemName || null,
  createdAt: tx.createdAt,
});

// @desc    Get all accounts with their corresponding transactions
// @route   GET /api/accounts
export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      include: [{ model: Transaction, include: [{ model: Program, attributes: ['id', 'name'] }] }],
      order: [
        [Transaction, 'date', 'ASC'],
        [Transaction, 'createdAt', 'ASC'],
        [Transaction, 'id', 'ASC'],
      ],
    });

    const formattedAccounts = accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      openingBalance: acc.openingBalance,
      color: acc.color,
      bgColor: acc.bgColor,
      transactions: acc.Transactions.map(formatTransaction),
      createdAt: acc.createdAt,
    }));
    res.json(formattedAccounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new account
// @route   POST /api/accounts
export const createAccount = async (req, res) => {
  try {
    const { name, type, color, bgColor, openingBalance } = req.body;

    const createdAccount = await Account.create({
      name: name || 'New Company',
      type: type || 'company',
      color: color || '#1e3a5f',
      bgColor: bgColor || '#e8edf5',
      openingBalance: openingBalance || 0,
    });

    res.status(201).json({
      id: createdAccount.id,
      name: createdAccount.name,
      type: createdAccount.type,
      openingBalance: createdAccount.openingBalance,
      color: createdAccount.color,
      bgColor: createdAccount.bgColor,
      transactions: [],
      createdAt: createdAccount.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update account details (e.g. name)
// @route   PUT /api/accounts/:id
export const updateAccount = async (req, res) => {
  try {
    const { name } = req.body;
    const account = await Account.findByPk(req.params.id);

    if (account) {
      if (name) account.name = name;

      const updatedAccount = await account.save();
      res.json(updatedAccount);
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update account opening balance
// @route   PUT /api/accounts/:id/balance
export const updateOpeningBalance = async (req, res) => {
  try {
    const { openingBalance } = req.body;
    const account = await Account.findByPk(req.params.id);

    if (account) {
      account.openingBalance = openingBalance;
      const updatedAccount = await account.save();
      res.json(updatedAccount);
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add transaction
// @route   POST /api/accounts/:id/transactions
export const addTransaction = async (req, res) => {
  try {
    const { date, description, type, amount, reference, document, dueDate, exchangeType, isReminder, programId } = req.body;
    const account = await Account.findByPk(req.params.id);

    if (account) {
      const transaction = await Transaction.create({
        accountId: req.params.id,
        companyName: account.name,
        date,
        description,
        type,
        amount: Number(amount),
        reference,
        document,
        dueDate,
        exchangeType,
        isReminder: Boolean(isReminder),
        programId: programId ? Number(programId) : null,
      });

      const fullTx = await Transaction.findByPk(transaction.id, {
        include: [{ model: Program, attributes: ['id', 'name'] }],
      });

      res.status(201).json(formatTransaction(fullTx));
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/accounts/:id/transactions/:txId
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.txId);

    if (transaction) {
      await transaction.destroy();
      res.json({ message: 'Transaction removed' });
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update transaction
// @route   PUT /api/accounts/:id/transactions/:txId
export const updateTransaction = async (req, res) => {
  try {
    const { date, description, type, amount, reference, document, dueDate, exchangeType, isCompleted, isReminder, programId } = req.body;
    const transaction = await Transaction.findByPk(req.params.txId);

    if (transaction) {
      if (date !== undefined) transaction.date = date;
      if (description !== undefined) transaction.description = description;
      if (type !== undefined) transaction.type = type;
      if (amount !== undefined) transaction.amount = Number(amount);
      if (reference !== undefined) transaction.reference = reference;
      if (document !== undefined) transaction.document = document;
      if (dueDate !== undefined) transaction.dueDate = dueDate;
      if (exchangeType !== undefined) transaction.exchangeType = exchangeType;
      if (isCompleted !== undefined) transaction.isCompleted = isCompleted;
      if (isReminder !== undefined) transaction.isReminder = isReminder;
      if (programId !== undefined) transaction.programId = programId ? Number(programId) : null;

      await transaction.save();

      const fullTx = await Transaction.findByPk(transaction.id, {
        include: [{ model: Program, attributes: ['id', 'name'] }],
      });

      res.json(formatTransaction(fullTx));
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create initial accounts if empty
// @route   POST /api/accounts/seed
export const seedAccounts = async (req, res) => {
  try {
    const count = await Account.count();
    if (count === 0) {
      const initialAccounts = [
        { name: "Company 1", type: "company", color: "#1e3a5f", bgColor: "#e8edf5", openingBalance: 125000 },
        { name: "Company 2", type: "company", color: "#065f46", bgColor: "#d1fae5", openingBalance: 89500 },
        { name: "Company 3", type: "company", color: "#7c2d12", bgColor: "#fef3c7", openingBalance: 210000 },
        { name: "Company 4", type: "company", color: "#4c1d95", bgColor: "#ede9fe", openingBalance: 55000 },
        { name: "Overdraft Account", type: "overdraft", color: "#9f1239", bgColor: "#ffe4e6", openingBalance: -45000 }
      ];
      await Account.bulkCreate(initialAccounts);
      res.json({ message: 'Database seeded successfully' });
    } else {
      res.json({ message: 'Database already has data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear all accounts and transactions from DB
// @route   DELETE /api/accounts/clear
export const clearAccounts = async (req, res) => {
  try {
    await Transaction.destroy({ where: {} });
    await Account.destroy({ where: {} });
    res.json({ message: 'All database records cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a single account and all its transactions
// @route   DELETE /api/accounts/:id
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await Transaction.destroy({ where: { accountId: req.params.id } });
    await account.destroy();

    res.json({ message: 'Account and associated transactions removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all transactions across all accounts with filters + financial summary
// @route   GET /api/accounts/history
export const getHistory = async (req, res) => {
  try {
    const { startDate, endDate, month, accountId, type, programId } = req.query;

    const txWhere = {};

    if (month) {
      txWhere.date = { [Op.like]: `${month}%` };
    } else if (startDate && endDate) {
      txWhere.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      txWhere.date = { [Op.gte]: startDate };
    } else if (endDate) {
      txWhere.date = { [Op.lte]: endDate };
    }

    if (accountId) {
      txWhere.accountId = accountId;
    }

    if (type && (type === 'credit' || type === 'debit')) {
      txWhere.type = type;
    }

    if (programId) {
      txWhere.programId = programId;
    }

    txWhere.isReminder = { [Op.ne]: true };

    const transactions = await Transaction.findAll({
      where: txWhere,
      include: [
        { model: Account, attributes: ['id', 'name', 'type', 'color', 'bgColor', 'openingBalance'] },
        { model: Program, attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });

    const formattedTxs = transactions.map((tx) => ({
      ...formatTransaction(tx),
      accountId: tx.accountId,
      accountName: tx.Account?.name || '',
      accountType: tx.Account?.type || '',
      accountColor: tx.Account?.color || '#1e3a5f',
      accountBgColor: tx.Account?.bgColor || '#e8edf5',
    }));

    const periodStartDate = month ? `${month}-01` : startDate;
    let priorMap = {};
    if (periodStartDate) {
      const priorWhere = {
        date: { [Op.lt]: periodStartDate },
        isReminder: { [Op.ne]: true },
      };
      if (accountId) priorWhere.accountId = accountId;
      if (programId) priorWhere.programId = programId;
      const priorTxs = await Transaction.findAll({
        where: priorWhere,
        attributes: ['accountId', 'type', 'amount'],
      });
      for (const p of priorTxs) {
        if (!priorMap[p.accountId]) priorMap[p.accountId] = 0;
        priorMap[p.accountId] += (p.type === 'credit' ? p.amount : -p.amount);
      }
    }

    const accountMap = {};
    const allAccounts = await Account.findAll(accountId ? { where: { id: accountId } } : undefined);

    for (const acc of allAccounts) {
      const priorNet = priorMap[acc.id] || 0;
      const periodOpeningBalance = (programId ? 0 : acc.openingBalance) + priorNet;
      accountMap[acc.id] = {
        accountId: acc.id,
        name: acc.name,
        type: acc.type,
        color: acc.color,
        bgColor: acc.bgColor,
        openingBalance: periodOpeningBalance,
        credits: 0,
        debits: 0,
        balance: 0,
      };
    }

    let totalCredits = 0;
    let totalDebits = 0;

    for (const tx of transactions) {
      if (tx.isReminder) continue;
      const entry = accountMap[tx.accountId];
      if (!entry) continue;
      if (tx.type === 'credit') {
        entry.credits += tx.amount;
        totalCredits += tx.amount;
      } else {
        entry.debits += tx.amount;
        totalDebits += tx.amount;
      }
    }

    for (const key of Object.keys(accountMap)) {
      const entry = accountMap[key];
      entry.balance = entry.openingBalance + entry.credits - entry.debits;
    }

    const totalOpeningBalance = Object.values(accountMap).reduce((s, a) => s + a.openingBalance, 0);

    res.json({
      transactions: formattedTxs,
      summary: {
        totalCredits,
        totalDebits,
        netBalance: totalCredits - totalDebits,
        totalOpeningBalance,
        totalClosingBalance: totalOpeningBalance + totalCredits - totalDebits,
        byAccount: Object.values(accountMap),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
