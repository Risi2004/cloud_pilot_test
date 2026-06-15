import express from 'express';
import { getDeploymentPlan, triggerAutoDeployment, getDeploymentStatus, autoFixAndRedeploy } from '../controllers/deploymentController.js';

const router = express.Router();

router.post('/', getDeploymentPlan);
router.post('/deploy', triggerAutoDeployment);
router.post('/status', getDeploymentStatus);
router.post('/auto-fix', autoFixAndRedeploy);

export default router;
