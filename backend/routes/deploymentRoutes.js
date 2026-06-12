import express from 'express';
import { getDeploymentPlan } from '../controllers/deploymentController.js';

const router = express.Router();

router.post('/', getDeploymentPlan);

export default router;
