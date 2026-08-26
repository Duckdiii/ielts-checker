import { Request, Response } from 'express';
import { generateWithRetryAndFallback } from '../services/gemini.service';
import {
  getEvaluatePronunciationPrompt,
  EVALUATE_PRONUNCIATION_SCHEMA,
  getEvaluateShadowingPrompt,
  EVALUATE_SHADOWING_SCHEMA,
  getUpgradeSpeechPrompt,
  UPGRADE_SPEECH_SCHEMA,
} from '../prompts/pronunciation.prompts';
import { safeParseAiJson } from '../utils/aiParser';

/**
 * Endpoint to evaluate user's pronunciation using audio recording and Gemini AI
 */
export async function handleEvaluatePronunciation(req: Request, res: Response) {
  try {
    const { term, ipa, meaning, audioBase64, mimeType } = req.body;

    if (!term) {
      return res.status(400).json({ error: 'Thiếu từ vựng cần kiểm tra (term)' });
    }

    if (!audioBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu âm thanh giọng đọc (audioBase64)' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9-+.]+;base64,/, '');
    const detectedMimeType = mimeType || 'audio/webm';

    const prompt = getEvaluatePronunciationPrompt(term, ipa, meaning);

    const parts: any[] = [
      {
        inlineData: {
          mimeType: detectedMimeType,
          data: cleanBase64,
        },
      },
      {
        text: prompt,
      },
    ];

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: EVALUATE_PRONUNCIATION_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluatePronunciation:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm điểm phát âm bằng AI' });
  }
}

/**
 * Endpoint for Shadowing Lab: Evaluate student's shadowing imitation of native sentences.
 */
export async function handleEvaluateShadowing(req: Request, res: Response) {
  try {
    const {
      originalSentence,
      userTranscript = '',
      audioBase64,
      mimeType = 'audio/webm',
      targetAccent = 'US',
      highlightedWord = '',
    } = req.body;

    if (!originalSentence || originalSentence.trim().length === 0) {
      return res.status(400).json({ error: 'Thiếu câu mẫu cần shadowing' });
    }

    const prompt = getEvaluateShadowingPrompt(originalSentence, userTranscript, targetAccent, highlightedWord);

    const contents: any = audioBase64
      ? {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64.replace(/^data:[^;]+;base64,/, ''),
              },
            },
            { text: prompt },
          ],
        }
      : prompt;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: EVALUATE_SHADOWING_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateShadowing:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi phân tích Shadowing bằng AI' });
  }
}

/**
 * 🪞 AI Speech Upgrade & Shadowing (Band 8.0 Transformation)
 */
export async function handleUpgradeSpeechToBand8(req: Request, res: Response) {
  try {
    const {
      question = '',
      userTranscript = '',
      targetBand = 8.0,
      accentStyle = 'US',
    } = req.body;

    if (!userTranscript || !userTranscript.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp bài nói của bạn để nâng cấp' });
    }

    const prompt = getUpgradeSpeechPrompt(question, userTranscript, targetBand, accentStyle);

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: UPGRADE_SPEECH_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleUpgradeSpeechToBand8:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi nâng cấp bài nói lên Band 8.0' });
  }
}
