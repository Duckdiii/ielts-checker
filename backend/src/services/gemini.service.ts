import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config/env';
import { SimpleLruCache } from '../utils/lruCache';

/**
 * Helper to get fresh GoogleGenAI instance with live GEMINI_API_KEY
 */
export function getAiClient(): GoogleGenAI {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export { Type };

/**
 * Robust AI content generator with Automatic Fast-Failover & Multi-Model Fallback
 * Seamlessly fails over across: 'gemini-3.7-flash' -> 'gemini-2.5-flash' -> 'gemini-3.1-flash-lite' -> 'gemini-flash-latest'
 */
export async function generateWithRetryAndFallback(options: {
  contents: any;
  config?: any;
  primaryModel?: string;
  maxRetries?: number;
}) {
  const primaryModel = options.primaryModel || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
  const standardPool = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  // Keep primary model first, followed by all remaining stable models in order
  const modelsToTry = [primaryModel, ...standardPool.filter((m) => m !== primaryModel)];

  let lastError: any = null;
  const ai = getAiClient();

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const model = modelsToTry[mIdx];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || '';
        const status = error?.status || error?.code;
        const isTransient =
          status === 503 ||
          status === 429 ||
          errorMessage.includes('503') ||
          errorMessage.includes('high demand') ||
          errorMessage.includes('UNAVAILABLE') ||
          errorMessage.includes('Resource has been exhausted') ||
          errorMessage.includes('429');

        console.warn(
          `[Gemini Call Attempt ${attempt + 1}] Model: ${model} failed with: ${errorMessage}. isTransient: ${isTransient}`
        );

        if (isTransient && attempt === 0) {
          // Quick wait before 1 fast retry on the same model
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        // Immediately fail over to next model in pool
        break;
      }
    }
  }

  throw lastError;
}

// In-memory server cache with LRU eviction and 24-hour TTL (max 1000 items)
export const serverAiCache = new SimpleLruCache<string, any>({
  maxSize: 1000,
  ttlMs: 24 * 60 * 60 * 1000,
});
