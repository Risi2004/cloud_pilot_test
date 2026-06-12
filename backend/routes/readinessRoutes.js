import express from 'express';
import { getReadiness } from '../controllers/readinessController.js';

const router = express.Router();

router.post('/', getReadiness);

export default router;
