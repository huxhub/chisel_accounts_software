import express from 'express';
import {
  createVoucher,
  deleteVoucher,
  getProfitReport,
} from '../controllers/voucherController.js';

const router = express.Router();

router.route('/').post(createVoucher);
router.route('/profit').get(getProfitReport);
router.route('/:id').delete(deleteVoucher);

export default router;
