import { Router } from 'express';
import {
  handleEvaluateSpeakingAnswer,
  handleGenerateSpeakingQuestion,
  handleEvaluateQuickSpeakingDrill,
  handleGenerateQuickDrillQuestions,
  handleEvaluateFullMockTest,
  handleGenerateAreaExpansion,
  handleEvaluateAreaAnswer,
  handleEvaluateSpeechLadder,
  handleGenerate5DMindmapIdeas,
  handleGenerateFullMockPack,
  handleGenerateSpeechLadderPrompt,
  handleCoffeeChatReply,
  handleCoffeeChatRecap,
} from '../controllers/speaking.controller';

const router = Router();

router.post('/speaking/evaluate', handleEvaluateSpeakingAnswer);
router.post('/speaking/generate-question', handleGenerateSpeakingQuestion);
router.post('/speaking/quick-drill-evaluate', handleEvaluateQuickSpeakingDrill);
router.post('/speaking/quick-drill-generate', handleGenerateQuickDrillQuestions);
router.post('/speaking/full-mock-evaluate', handleEvaluateFullMockTest);
router.post('/speaking/area-expand', handleGenerateAreaExpansion);
router.post('/speaking/area-evaluate', handleEvaluateAreaAnswer);
router.post('/speaking/ladder-evaluate', handleEvaluateSpeechLadder);
router.post('/speaking/mindmap-5d', handleGenerate5DMindmapIdeas);
router.post('/speaking/full-mock-generate-pack', handleGenerateFullMockPack);
router.post('/speaking/ladder-generate-prompt', handleGenerateSpeechLadderPrompt);
router.post('/speaking/coffee-chat/reply', handleCoffeeChatReply);
router.post('/speaking/coffee-chat/recap', handleCoffeeChatRecap);

export default router;
