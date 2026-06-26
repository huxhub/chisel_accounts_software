import express from 'express';
import { 
  getAccounts, 
  createAccount,
  updateAccount,
  updateOpeningBalance, 
  addTransaction, 
  deleteTransaction,
  seedAccounts,
  clearAccounts
} from '../controllers/accountController.js';

const router = express.Router();

router.route('/').get(getAccounts).post(createAccount);
router.route('/:id').put(updateAccount);
router.route('/seed').post(seedAccounts);
router.route('/clear').delete(clearAccounts);
router.route('/:id/balance').put(updateOpeningBalance);
router.route('/:id/transactions').post(addTransaction);
router.route('/:id/transactions/:txId').delete(deleteTransaction);

export default router;
