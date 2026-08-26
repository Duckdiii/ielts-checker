import { Request, Response } from 'express';
import { generateWithRetryAndFallback } from '../services/gemini.service';
import {
  getEvaluateWritingPrompt,
  EVALUATE_WRITING_SCHEMA,
  getGenerateWritingPrompt,
  GENERATE_WRITING_PROMPT_SCHEMA,
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
