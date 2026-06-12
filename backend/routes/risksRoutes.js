import express from 'express';
import { getRisks } from '../controllers/risksController.js';

const router = express.Router();

router.post('/', getRisks);

export default router;
