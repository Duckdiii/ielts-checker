import { Router } from 'express';
import {
  handleEvaluatePronunciation,
  handleEvaluateShadowing,
  handleUpgradeSpeechToBand8,
} from '../controllers/pronunciation.controller';

const router = Router();

router.post('/evaluate-pronunciation', handleEvaluatePronunciation);
router.post('/shadowing/evaluate', handleEvaluateShadowing);
router.post('/speaking/upgrade-band8', handleUpgradeSpeechToBand8);

export default router;
