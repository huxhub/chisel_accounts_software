import express from 'express';
import { getVendors, createVendor, deleteVendor, addEntry, deleteEntry } from '../controllers/vendorController.js';

const router = express.Router();

router.route('/').get(getVendors).post(createVendor);
router.route('/:id').delete(deleteVendor);
router.route('/:id/entries').post(addEntry);
router.route('/:vendorId/entries/:entryId').delete(deleteEntry);

export default router;
