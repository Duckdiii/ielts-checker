import {
  AIWordExpansion,
  AIEvaluationResult,
  AIReadingPassage,
  AIStudyAdvisorResult,
  AIPronunciationFeedback,
  SpeakingQuestion,
  SpeakingEvaluationResult,
  ShadowingEvaluationResult,
  QuickDrillQuestion,
  QuickSpeakingDrillEvaluationResult,
  AreaExpansionResult,
  AreaEvaluationResult,
  SpeechLadderEvaluationResult,
  AISpeechUpgradeResult,
  Mindmap5DimensionsResult,
  SpeechLadderPrompt,
  ChatPersona,
  CoffeeChatSessionRecap,
} from '../types';
import {
  getCachedAiResponse,
  saveCachedAiResponse,
  generateCacheKey,
} from '../utils/aiCache';

export interface ParsedPdfResult {
  title: string;
  description?: string;
  mainTopic?: string;
  topics?: string[];
  totalWordsCount: number;
  words: Array<{
    term: string;
    ipa?: string;
    meaning: string;
    wordFamily?: string;
    synonyms?: string;
    antonyms?: string;
    example?: string;
    notes?: string;
    cefrLevel?: 'B1' | 'B2' | 'C1' | 'C2';
    targetIeltsBand?: '6.0' | '6.5' | '7.0' | '7.5' | '8.0+';
    topic?: string;
  }>;
}

export interface StreamProgressUpdate {
  progress: number;
  stage: 'reading' | 'ai_analyzing' | 'parsing' | 'finalizing' | 'done' | 'error';
  message: string;
}

/**
 * Stream-based PDF Parser with real-time SSE updates & graceful HTTP fallback
 */
export async function parsePdfFileStream(
  file: File,
  onProgress?: (update: StreamProgressUpdate) => void
): Promise<ParsedPdfResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (onProgress) {
          onProgress({
            progress: 10,
            stage: 'reading',
            message: `Đang tải và giải mã "${file.name}"...`,
          });
        }

        const base64Data = (reader.result as string).split(',')[1];

        // Try SSE Stream first
        try {
          const response = await fetch('/api/parse-pdf-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64: base64Data,
              fileName: file.name,
            }),
          });

          if (response.ok && response.body) {
            const responseReader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
              const { done, value } = await responseReader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.trim()) continue;

                const eventMatch = line.match(/^event:\s*(\w+)/m);
                const dataMatch = line.match(/^data:\s*(.*)/m);

                const eventType = eventMatch ? eventMatch[1] : 'message';
                const rawData = dataMatch ? dataMatch[1] : '';

                if (rawData) {
                  try {
                    const parsed = JSON.parse(rawData);
                    if (eventType === 'progress' && onProgress) {
                      onProgress({
                        progress: parsed.progress || 50,
                        stage: parsed.stage || 'ai_analyzing',
                        message: parsed.message || 'Đang xử lý...',
                      });
                    } else if (eventType === 'completed') {
                      if (onProgress) {
                        onProgress({
                          progress: 100,
                          stage: 'done',
                          message: parsed.message || 'Hoàn tất trích xuất!',
                        });
                      }
                      resolve(parsed.data);
                      return;
                    } else if (eventType === 'error') {
                      throw new Error(parsed.message || 'Lỗi trích xuất PDF');
                    }
                  } catch (e: any) {
                    if (e.message && e.message.includes('Lỗi trích xuất PDF')) {
                      throw e;
                    }
                  }
                }
              }
            }
            return;
          }
        } catch (streamErr: any) {
          console.warn('SSE Stream parse error, falling back to standard POST:', streamErr);
        }

        // Fallback to standard POST /api/parse-pdf
        if (onProgress) {
          onProgress({
            progress: 45,
            stage: 'ai_analyzing',
            message: 'Gemini AI đang phân tích toàn bộ từ vựng và collocations...',
          });
        }

        const fallbackRes = await fetch('/api/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64Data,
            fileName: file.name,
          }),
        });

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.error || `Lỗi máy chủ (${fallbackRes.status})`);
        }

        const json = await fallbackRes.json();
        if (json.data) {
          if (onProgress) {
            onProgress({
              progress: 100,
              stage: 'done',
              message: 'Hoàn tất trích xuất!',
            });
          }
          resolve(json.data);
        } else {
          throw new Error('Dữ liệu trả về không hợp lệ');
        }
      } catch (err: any) {
        if (onProgress) {
          onProgress({
            progress: 100,
            stage: 'error',
            message: err.message || 'Lỗi xử lý file',
          });
        }
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Standard fallback parser
 */
export async function parsePdfFile(file: File): Promise<ParsedPdfResult> {
  return parsePdfFileStream(file);
}

/**
 * Expand vocabulary with 3-tier intelligent caching (Memory + LocalStorage + Firestore)
 */
export async function expandVocabWord(
  term: string,
  meaning?: string,
  example?: string,
  forceRefresh: boolean = false
): Promise<AIWordExpansion & { isCached?: boolean }> {
  const cacheKey = generateCacheKey('expand', term);

  // Check 0ms instant cache
  if (!forceRefresh) {
    const cached = await getCachedAiResponse<AIWordExpansion>(cacheKey);
    if (cached && cached.data) {
      return { ...cached.data, isCached: true };
    }
  }

  const res = await fetch('/api/expand-vocab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term, meaning, example, forceRefresh }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }

  const json = await res.json();
  const data = json.data;

  // Save to client & firestore cache
  if (data) {
    await saveCachedAiResponse(cacheKey, data);
  }

  return { ...data, isCached: json.isCached || false };
}

/**
 * Sentence evaluation with smart caching
 */
export async function evaluateSentencePractice(
  sentence: string,
  targetWords: string[],
  mode: 'writing' | 'speaking' = 'writing',
  promptTopic?: string
): Promise<AIEvaluationResult & { isCached?: boolean }> {
  const cacheKey = generateCacheKey('eval', `${sentence.substring(0, 40)}_${targetWords.join('_')}`);
  const cached = await getCachedAiResponse<AIEvaluationResult>(cacheKey);
  if (cached && cached.data) {
    return { ...cached.data, isCached: true };
  }

  const res = await fetch('/api/evaluate-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence, targetWords, mode, promptTopic }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }

  const json = await res.json();
  const data = json.data;

  if (data) {
    await saveCachedAiResponse(cacheKey, data);
  }

  return data;
}

/**
 * Generate IELTS Reading Passage with caching
 */
export async function generateIeltsReadingPassage(
  wordList: string[],
  topic: string = 'Urban Development & Society'
): Promise<AIReadingPassage & { isCached?: boolean }> {
  const cacheKey = generateCacheKey('passage', `${topic}_${wordList.slice(0, 4).join('_')}`);
  const cached = await getCachedAiResponse<AIReadingPassage>(cacheKey);
  if (cached && cached.data) {
    return { ...cached.data, isCached: true };
  }

  const res = await fetch('/api/generate-passage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wordList, topic }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }

  const json = await res.json();
  const data = json.data;

  if (data) {
    await saveCachedAiResponse(cacheKey, data);
  }

  return data;
}

export async function getAiStudyRecommendations(payload: {
  totalWords: number;
  masteredCount: number;
  learningCount: number;
  weakWords: string[];
  estimatedBand: number;
}): Promise<AIStudyAdvisorResult> {
  const res = await fetch('/api/study-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Send recorded audio to Gemini AI to get in-depth pronunciation evaluation & feedback
 */
export async function evaluatePronunciationWithAI(payload: {
  term: string;
  ipa?: string;
  meaning?: string;
  audioBase64: string;
  mimeType?: string;
}): Promise<AIPronunciationFeedback> {
  const res = await fetch('/api/evaluate-pronunciation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi phản hồi từ máy chủ (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Send candidate's IELTS Speaking response to Gemini AI to evaluate across 4 official criteria
 */
export async function evaluateSpeakingResponse(payload: {
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  transcript: string;
  durationSeconds: number;
  targetWords?: string[];
}): Promise<SpeakingEvaluationResult> {
  const res = await fetch('/api/speaking/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi phản hồi từ máy chủ (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Generate authentic IELTS Speaking question tailored to active vocabulary
 */
export async function generateSpeakingQuestionAi(payload: {
  part: 1 | 2 | 3;
  topic: string;
  vocabTerms?: string[];
}): Promise<SpeakingQuestion> {
  const res = await fetch('/api/speaking/generate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi tạo câu hỏi speaking (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Evaluate Shadowing performance for native imitation, ending sounds, stress and connected speech
 */
export async function evaluateShadowingSentence(payload: {
  originalSentence: string;
  userTranscript?: string;
  audioBase64?: string;
  mimeType?: string;
  targetAccent?: 'US' | 'UK' | 'AU';
  highlightedWord?: string;
}): Promise<ShadowingEvaluationResult> {
  const res = await fetch('/api/shadowing/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi phân tích Shadowing (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Evaluate 15-second rapid-response Part 1 speaking attempt
 */
export async function evaluateQuickSpeakingDrill(payload: {
  question: string;
  transcript?: string;
  audioBase64?: string;
  mimeType?: string;
  targetVocab?: string[];
  durationSeconds?: number;
}): Promise<QuickSpeakingDrillEvaluationResult> {
  const res = await fetch('/api/speaking/quick-drill-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi chấm điểm phản xạ (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Generate rapid-fire Part 1 drill questions
 */
export async function generateQuickDrillQuestions(payload: {
  topic?: string;
  vocabTerms?: string[];
  count?: number;
}): Promise<QuickDrillQuestion[]> {
  const res = await fetch('/api/speaking/quick-drill-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi tạo câu hỏi phản xạ (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Evaluate Full 15-Minute Mock Test spanning Part 1, Part 2 & Part 3
 */
export async function evaluateFullMockTest(payload: {
  candidateName?: string;
  targetBand?: number;
  totalDurationSeconds: number;
  turns: Array<{
    part: 1 | 2 | 3;
    partTitleVi: string;
    topic: string;
    questionText: string;
    transcript: string;
    durationSeconds: number;
  }>;
}): Promise<{
  overallBand: number;
  criteriaScores: {
    fluencyCoherence: number;
    lexicalResource: number;
    grammaticalRange: number;
    pronunciation: number;
    wordsPerMinuteAverage: number;
    totalHesitations: number;
    totalDeadSilences: number;
  };
  partScores: {
    part1Band: number;
    part2Band: number;
    part3Band: number;
  };
  examinerSummaryFeedbackVi: string;
  examinerOfficialRemarksEn: string;
  staminaAndPacingVerdictVi: string;
  topStrengthsVi: string[];
  topWeaknessesVi: string[];
  cefrLevel: 'B1' | 'B2' | 'C1' | 'C2';
}> {
  const res = await fetch('/api/speaking/full-mock-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi chấm điểm Full Mock Test (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Generate 4-Step AREA / PEEL Answer Expansion
 */
export async function generateAreaExpansion(payload: {
  question: string;
  topic?: string;
  formula?: 'AREA' | 'PEEL';
  shortAnswerRaw?: string;
  targetBand?: number;
}): Promise<AreaExpansionResult> {
  const res = await fetch('/api/speaking/area-expand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi tạo khung mở rộng AREA (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Evaluate Candidate Answer against AREA 4-Step Checklist
 */
export async function evaluateAreaAnswer(payload: {
  question: string;
  formula?: 'AREA' | 'PEEL';
  userTranscript: string;
  targetBand?: number;
}): Promise<AreaEvaluationResult> {
  const res = await fetch('/api/speaking/area-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi chấm điểm bài nói theo AREA (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Evaluate Progressive Speech Ladder Level (30s ➔ 60s ➔ 90s/120s)
 */
export async function evaluateSpeechLadderStep(payload: {
  question: string;
  level: number;
  targetDurationSeconds: number;
  userTranscript: string;
  spokenDurationSeconds: number;
  previousLevelTranscript?: string;
  targetVocab?: Array<{ word: string; meaningVi?: string }>;
}): Promise<SpeechLadderEvaluationResult> {
  const res = await fetch('/api/speaking/ladder-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi chấm điểm nấc thang luyện nói (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * 🪞 Upgrade user's original speech to Band 8.0 & Shadowing
 */
export async function upgradeSpeechToBand8(payload: {
  question: string;
  userTranscript: string;
  targetBand?: number;
  accentStyle?: string;
}): Promise<AISpeechUpgradeResult> {
  const res = await fetch('/api/speaking/upgrade-band8', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi nâng cấp bài nói lên Band 8.0 (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * 💡 5-Dimensional Mindmap Idea Generator
 */
export async function generate5DMindmapIdeas(payload: {
  topic: string;
  question: string;
  customContext?: string;
}): Promise<Mindmap5DimensionsResult> {
  const res = await fetch('/api/speaking/mindmap-5d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi khởi tạo Mindmap 5 Lăng Kính Ý Tưởng (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * 🎓 Dynamically generate complete 15-Minute IELTS Full Mock Exam Pack (Part 1, Part 2, Part 3)
 */
export async function generateFullMockExamPackAi(payload: {
  topic?: string;
  vocabTerms?: string[];
}): Promise<{
  theme: string;
  part1: Array<{ id: string; question: string; topic: string; suggestedVocab: string[] }>;
  part2: {
    id: string;
    topic: string;
    questionText: string;
    subPrompts: string[];
    suggestedVocab: string[];
  };
  part3: Array<{ id: string; question: string; topic: string; suggestedVocab: string[] }>;
}> {
  const res = await fetch('/api/speaking/full-mock-generate-pack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi tạo đề thi Full Mock bằng AI (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * 🪜 Dynamically generate 3-Level Progressive Speech Ladder prompt (30s ➔ 60s ➔ 90-120s)
 */
export async function generateSpeechLadderPromptAi(payload: {
  topic?: string;
  questionText?: string;
  vocabTerms?: string[];
}): Promise<SpeechLadderPrompt> {
  const res = await fetch('/api/speaking/ladder-generate-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi tạo nấc thang luyện nói bằng AI (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * ☕ Send user message to AI Coffee Conversation Partner and receive conversational reply + hints + polish upgrade
 */
export async function sendCoffeeChatReply(payload: {
  messages: Array<{ sender: 'user' | 'assistant'; text: string }>;
  persona: ChatPersona;
  topic: string;
  targetWords?: string[];
}): Promise<{
  replyText: string;
  translationVi: string;
  suggestedResponses: string[];
  nativePolishUpgrade?: {
    originalText: string;
    polishedText: string;
    explanationVi: string;
    keyCollocations?: string[];
  };
  detectedVocabWords?: string[];
}> {
  const res = await fetch('/api/speaking/coffee-chat/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi trò chuyện với AI Coffee Buddy (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * ☕ Generate warm, encouraging post-chat recap & fluency statistics
 */
export async function getCoffeeChatRecap(payload: {
  messages: Array<{ sender: 'user' | 'assistant'; text: string }>;
  durationSeconds: number;
  personaName: string;
  topic: string;
  approxWpm?: number;
  userWordCount?: number;
}): Promise<CoffeeChatSessionRecap> {
  const res = await fetch('/api/speaking/coffee-chat/recap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi tạo tổng kết buổi trò chuyện (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * ✍️ Evaluate IELTS Writing Task 1 / Task 2 Essay with Live Lexical Heatmap
 */
export async function evaluateWritingEssay(payload: {
  taskType: 'task1_academic' | 'task1_general' | 'task2_essay';
  promptTopic?: string;
  promptQuestion?: string;
  essayText: string;
  targetWords?: string[];
  targetBand?: number;
}): Promise<any> {
  const res = await fetch('/api/writing/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi chấm điểm bài viết IELTS Writing (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * ✍️ Generate Authentic IELTS Writing Task 1 / Task 2 prompt
 */
export async function generateWritingPrompt(payload: {
  taskType: 'task1_academic' | 'task1_general' | 'task2_essay';
  topic?: string;
  vocabTerms?: string[];
}): Promise<any> {
  const res = await fetch('/api/writing/generate-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi khi tạo đề bài IELTS Writing (${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

