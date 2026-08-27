import { Router } from 'express';
import {
  handleEvaluateWritingEssay,
  handleGenerateWritingPrompt,
  handleGenerateEssayOutline,
  handleUpgradeSentence,
  handleEvaluateMicroWriting,
  handleCohesionRadar,
} from '../controllers/writing.controller';

const router = Router();

router.post('/evaluate', handleEvaluateWritingEssay);
router.post('/generate-prompt', handleGenerateWritingPrompt);
router.post('/outline', handleGenerateEssayOutline);
router.post('/upgrade-sentence', handleUpgradeSentence);
router.post('/micro-eval', handleEvaluateMicroWriting);
router.post('/cohesion-radar', handleCohesionRadar);

export default router;
