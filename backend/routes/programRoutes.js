import express from 'express';
import { getPrograms, createProgram, deleteProgram } from '../controllers/programController.js';

const router = express.Router();

router.route('/').get(getPrograms).post(createProgram);
router.route('/:id').delete(deleteProgram);

export default router;
