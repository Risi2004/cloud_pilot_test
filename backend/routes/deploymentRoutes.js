import express from 'express';
import { getDeploymentPlan, triggerAutoDeployment } from '../controllers/deploymentController.js';

const router = express.Router();

router.post('/', getDeploymentPlan);
router.post('/deploy', triggerAutoDeployment);

export default router;
