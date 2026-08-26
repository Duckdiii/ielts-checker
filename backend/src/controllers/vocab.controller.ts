import { Request, Response } from 'express';
import { generateWithRetryAndFallback, serverAiCache } from '../services/gemini.service';
import {
  getExpandVocabPrompt,
  EXPAND_VOCAB_SCHEMA,
  getEvaluateSentencePrompt,
  EVALUATE_SENTENCE_SCHEMA,
  getGeneratePassagePrompt,
  GENERATE_PASSAGE_SCHEMA,
  getStudyRecommendationsPrompt,
  STUDY_RECOMMENDATIONS_SCHEMA,
} from '../prompts/vocab.prompts';
import { safeParseAiJson } from '../utils/aiParser';

/**
 * Endpoint to expand vocabulary with high-band synonyms, nuance differences, and collocations
 */
export async function handleExpandVocab(req: Request, res: Response) {
  try {
    const { term, meaning, example, forceRefresh = false } = req.body;
    if (!term) {
      return res.status(400).json({ error: 'Thiếu từ vựng cần mở rộng' });
    }

    const cacheKey = `expand_${term.toLowerCase().trim()}`;
    if (!forceRefresh && serverAiCache.has(cacheKey)) {
      return res.json({
        success: true,
        data: serverAiCache.get(cacheKey),
        isCached: true,
        source: 'server_cache',
      });
    }

    const prompt = getExpandVocabPrompt(term, meaning, example);

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: EXPAND_VOCAB_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    serverAiCache.set(cacheKey, parsedData);
    return res.json({ success: true, data: parsedData, isCached: false });
  } catch (error: any) {
    console.error('Error in handleExpandVocab:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi mở rộng từ vựng AI' });
  }
}

/**
 * Endpoint to evaluate student sentences using target vocabulary and upgrade to Band 8.5+
 */
export async function handleEvaluateSentence(req: Request, res: Response) {
  try {
    const { sentence, targetWords = [], mode = 'writing', promptTopic = '' } = req.body;
    if (!sentence) {
      return res.status(400).json({ error: 'Thiếu câu cần chấm điểm' });
    }

    const prompt = getEvaluateSentencePrompt(sentence, targetWords, mode, promptTopic);

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: EVALUATE_SENTENCE_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateSentence:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm điểm câu văn' });
  }
}

/**
 * Endpoint to generate IELTS Reading mini passage containing selected target words
 */
export async function handleGeneratePassage(req: Request, res: Response) {
  try {
    const { wordList = [], topic = 'Urban Development & Society' } = req.body;
    if (!wordList.length) {
      return res.status(400).json({ error: 'Danh sách từ vựng trống' });
    }

    const prompt = getGeneratePassagePrompt(wordList, topic);

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: GENERATE_PASSAGE_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGeneratePassage:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo bài đọc IELTS' });
  }
}

/**
 * Endpoint for personalized IELTS study recommendations
 */
export async function handleStudyRecommendations(req: Request, res: Response) {
  try {
    const { totalWords, masteredCount, learningCount, weakWords = [], estimatedBand = 6.5 } = req.body;

    const prompt = getStudyRecommendationsPrompt({
      totalWords,
      masteredCount,
      learningCount,
      weakWords,
      estimatedBand,
    });

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: STUDY_RECOMMENDATIONS_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleStudyRecommendations:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo lời khuyên học tập' });
  }
}
