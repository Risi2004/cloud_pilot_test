import express from 'express';
import { getRecommendation } from '../controllers/recommendationController.js';

const router = express.Router();

router.post('/', getRecommendation);

export default router;
