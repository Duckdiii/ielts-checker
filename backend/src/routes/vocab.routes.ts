import { Router } from 'express';
import {
  handleExpandVocab,
  handleEvaluateSentence,
  handleGeneratePassage,
  handleStudyRecommendations,
} from '../controllers/vocab.controller';

const router = Router();

router.post('/expand-vocab', handleExpandVocab);
router.post('/evaluate-sentence', handleEvaluateSentence);
router.post('/generate-passage', handleGeneratePassage);
router.post('/study-recommendations', handleStudyRecommendations);

export default router;
