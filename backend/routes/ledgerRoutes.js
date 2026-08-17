import express from 'express';
import {
  getLedgers,
  createLedger,
  deleteLedger,
  getLedgerStatement,
} from '../controllers/ledgerController.js';

const router = express.Router();

router.route('/').get(getLedgers).post(createLedger);
router.route('/:id').delete(deleteLedger);
router.route('/:id/statement').get(getLedgerStatement);

export default router;
