import { Router } from 'express';
import {
  handleEvaluateWritingEssay,
  handleGenerateWritingPrompt,
} from '../controllers/writing.controller';

const router = Router();

router.post('/evaluate', handleEvaluateWritingEssay);
router.post('/generate-prompt', handleGenerateWritingPrompt);

export default router;
