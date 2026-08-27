import { Request, Response } from 'express';
import { generateWithRetryAndFallback } from '../services/gemini.service';
import {
  getEvaluateWritingPrompt,
  EVALUATE_WRITING_SCHEMA,
  getGenerateWritingPrompt,
  GENERATE_WRITING_PROMPT_SCHEMA,
  getEssayOutlinePrompt,
  ESSAY_OUTLINE_SCHEMA,
  getSentenceUpgradePrompt,
  SENTENCE_UPGRADE_SCHEMA,
  getMicroWritingEvalPrompt,
  MICRO_WRITING_EVAL_SCHEMA,
  getCohesionRadarPrompt,
  COHESION_RADAR_SCHEMA,
} from '../prompts/writing.prompts';
import { safeParseAiJson } from '../utils/aiParser';

/**
 * Endpoint to evaluate candidate's IELTS Writing essay across the 4 Cambridge criteria
 * and produce a live lexical heatmap with Band 8.5+ upgrades
 */
export async function handleEvaluateWritingEssay(req: Request, res: Response) {
  try {
    const {
      taskType = 'task2_essay',
      promptTopic = 'General Academic',
      promptQuestion = 'Discuss both views and give your opinion',
      essayText,
      targetWords = [],
      targetBand = 8.0,
    } = req.body;

    if (!essayText || essayText.trim().length === 0) {
      return res.status(400).json({ error: 'Thiếu nội dung bài viết IELTS Writing' });
    }

    const prompt = getEvaluateWritingPrompt({
      taskType,
      promptTopic,
      promptQuestion,
      essayText,
      targetWords,
      targetBand,
    });

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: EVALUATE_WRITING_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateWritingEssay:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm điểm bài viết IELTS Writing' });
  }
}

/**
 * Endpoint to generate authentic IELTS Writing Task 1 / Task 2 prompts
 * woven with the student's active vocabulary list
 */
export async function handleGenerateWritingPrompt(req: Request, res: Response) {
  try {
    const {
      taskType = 'task2_essay',
      topic = 'Technology and Society',
      vocabTerms = [],
    } = req.body;

    const prompt = getGenerateWritingPrompt({
      taskType,
      topic,
      vocabTerms,
    });

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: GENERATE_WRITING_PROMPT_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGenerateWritingPrompt:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo đề bài IELTS Writing' });
  }
}

/**
 * Endpoint 3: AI Essay Architect - 4-Paragraph Outline Generator
 */
export async function handleGenerateEssayOutline(req: Request, res: Response) {
  try {
    const {
      taskType = 'task2_essay',
      topic = 'Academic Discussion',
      promptQuestion,
      userStance = 'balanced / clear opinion',
      targetWords = [],
    } = req.body;

    if (!promptQuestion || promptQuestion.trim().length === 0) {
      return res.status(400).json({ error: 'Thiếu câu hỏi đề bài' });
    }

    const prompt = getEssayOutlinePrompt({
      taskType,
      topic,
      promptQuestion,
      userStance,
      targetWords,
    });

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: ESSAY_OUTLINE_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGenerateEssayOutline:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo dàn bài AI' });
  }
}

/**
 * Endpoint 4: Inline Sentence Upgrader (Surgery)
 */
export async function handleUpgradeSentence(req: Request, res: Response) {
  try {
    const {
      selectedText,
      contextSentence = '',
      targetMode = 'all',
    } = req.body;

    if (!selectedText || selectedText.trim().length === 0) {
      return res.status(400).json({ error: 'Thiếu đoạn văn cần nâng cấp' });
    }

    const prompt = getSentenceUpgradePrompt({
      selectedText,
      contextSentence,
      targetMode,
    });

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: SENTENCE_UPGRADE_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleUpgradeSentence:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi phẫu thuật nâng cấp câu' });
  }
}

/**
 * Endpoint 5: Micro-Writing Drill Evaluator
 */
export async function handleEvaluateMicroWriting(req: Request, res: Response) {
  try {
    const {
      drillType = 'intro_2min',
      promptQuestion,
      submissionText,
    } = req.body;

    if (!submissionText || submissionText.trim().length === 0) {
      return res.status(400).json({ error: 'Thiếu nội dung bài luyện viết cấp tốc' });
    }

    const prompt = getMicroWritingEvalPrompt({
      drillType,
      promptQuestion: promptQuestion || 'General IELTS prompt',
      submissionText,
    });

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: MICRO_WRITING_EVAL_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateMicroWriting:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm bài viết cấp tốc' });
  }
}

/**
 * Endpoint 6: Cohesion & Linking Radar
 */
export async function handleCohesionRadar(req: Request, res: Response) {
  try {
    const { essayText } = req.body;

    if (!essayText || essayText.trim().length === 0) {
      return res.status(400).json({ error: 'Thiếu nội dung bài viết để phân tích liên kết' });
    }

    const prompt = getCohesionRadarPrompt({ essayText });

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: COHESION_RADAR_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleCohesionRadar:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi phân tích liên kết mạch lạc' });
  }
}
