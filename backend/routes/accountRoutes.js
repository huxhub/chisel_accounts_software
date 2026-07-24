import express from 'express';
import {
  getAccounts,
  createAccount,
  updateAccount,
  updateOpeningBalance,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  seedAccounts,
  clearAccounts,
  deleteAccount
} from '../controllers/accountController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getAccounts).post(createAccount);
router.route('/seed').post(seedAccounts);
router.route('/clear').delete(requireAdmin, clearAccounts);
router.route('/:id').put(updateAccount).delete(deleteAccount);
router.route('/:id/balance').put(updateOpeningBalance);
router.route('/:id/transactions').post(addTransaction);
router.route('/:id/transactions/:txId').put(updateTransaction).delete(deleteTransaction);

export default router;
