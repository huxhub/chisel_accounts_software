import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

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
  createdAt: tx.createdAt,
});

// @desc    Get all accounts with their corresponding transactions
// @route   GET /api/accounts
export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      include: [{ model: Transaction }],
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
    const { date, description, type, amount, reference, document, dueDate, exchangeType } = req.body;
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
      });

      res.status(201).json(formatTransaction(transaction));
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
    const { date, description, type, amount, reference, document, dueDate, exchangeType, isCompleted } = req.body;
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

      await transaction.save();
      res.json(formatTransaction(transaction));
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
    // Plain DELETE, not TRUNCATE: MySQL refuses to TRUNCATE Accounts while
    // Transactions has a foreign key referencing it, regardless of row count.
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

    // Verify user's password
    const user = await User.findByPk(req.user.id);
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Delete all transactions associated with this account
    await Transaction.destroy({ where: { accountId: req.params.id } });
    // Delete the account
    await account.destroy();

    res.json({ message: 'Account and associated transactions removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
