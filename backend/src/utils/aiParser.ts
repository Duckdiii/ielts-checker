/**
 * Robust utility to safely parse and sanitize JSON strings returned by LLMs (Gemini)
 */
export function safeParseAiJson<T = any>(rawText: string | undefined | null, fallback?: T): T {
  if (!rawText || typeof rawText !== 'string') {
    if (fallback !== undefined) return fallback;
    throw new Error('AI response is empty or invalid string');
  }

  let text = rawText.trim();

  // 1. Remove markdown code fences like ```json ... ``` or ``` ... ```
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. If there are still code fences anywhere in the string
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  // 3. Extract the outermost JSON object {...} or array [...] if surrounded by conversational preamble
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');

  let startIndex = -1;
  let isArray = false;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    isArray = false;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    isArray = true;
  }

  if (startIndex !== -1) {
    const endChar = isArray ? ']' : '}';
    const lastIndex = text.lastIndexOf(endChar);
    if (lastIndex > startIndex) {
      text = text.substring(startIndex, lastIndex + 1);
    }
  }

  // 4. Try standard JSON.parse first
  try {
    return JSON.parse(text) as T;
  } catch (firstErr: any) {
    // 5. Try cleaning common JSON glitches (e.g. trailing commas before } or ])
    try {
      const sanitized = text
        .replace(/,\s*([}\]])/g, '$1') // remove trailing comma
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // remove control chars
      return JSON.parse(sanitized) as T;
    } catch (secondErr: any) {
      console.error('[safeParseAiJson] Failed to parse AI response JSON:', {
        rawSample: rawText.substring(0, 200),
        cleanedSample: text.substring(0, 200),
        error: secondErr.message,
      });

      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Lỗi phân tích cú pháp dữ liệu JSON từ AI: ${secondErr.message}`);
    }
  }
}
