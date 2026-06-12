import express from 'express';
import { analyzeRepository, analyzeEditorCode, analyzeLocalDirectory, importLocalDirectory } from '../controllers/analyzeController.js';

const router = express.Router();

router.post('/', analyzeRepository);
router.post('/editor', analyzeEditorCode);
router.post('/local', analyzeLocalDirectory);
router.post('/import-local', importLocalDirectory);

export default router;
