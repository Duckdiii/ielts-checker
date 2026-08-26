import { Request, Response } from 'express';
import { generateWithRetryAndFallback, Type } from '../services/gemini.service';
import { safeParseAiJson } from '../utils/aiParser';

/**
 * Endpoint to evaluate IELTS Speaking mock responses across the 4 official Cambridge criteria
 */
export async function handleEvaluateSpeakingAnswer(req: Request, res: Response) {
  try {
    const {
      question,
      part = 1,
      topic = 'General Academic',
      transcript,
      durationSeconds = 30,
      targetWords = [],
    } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Thiếu nội dung câu trả lời (transcript)' });
    }

    const prompt = `You are a Senior Cambridge IELTS Speaking Examiner and master IELTS coach.
Evaluate the candidate's spoken response for the following IELTS Speaking task.

Task Details:
- Part: Part ${part} ${part === 2 ? '(Part 2 Cue Card Long Turn - 2 Minutes Speech)' : part === 3 ? '(Part 3 In-depth Discussion)' : '(Part 1 Interview)'}
- Topic: "${topic}"
- Question: "${question}"
- Speaking Duration: ${durationSeconds} seconds
- Target Vocabulary to check: ${JSON.stringify(targetWords)}
- Candidate's Spoken Transcript:
"${transcript}"

Assessment Guidelines:
1. Fluency, Speech Rate (WPM) & Silence Detection:
   - Calculate Speech Rate in Words Per Minute (WPM = words count / (${durationSeconds} / 60)).
   - Evaluate speech pacing:
     * 130 - 160 WPM: "Tốc độ vàng lý tưởng (130-160 WPM)" - Cambridge Band 8.0-9.0 benchmark.
     * 100 - 125 WPM: "Hơi chậm (100-125 WPM)" - Band 6.0-6.5, slight hesitation.
     * < 100 WPM: "Quá chậm (<100 WPM)" - candidate hesitates, pauses, or translates from Vietnamese.
     * 160 - 180 WPM: "Hơi nhanh (160-180 WPM)" - risk of skipping thought groups.
     * > 180 WPM: "Quá nhanh & vội vàng (>180 WPM)" - danger of swallowing ending sounds.
   - Detect Dead Silence Pauses (> 3 seconds unnatural breaks or pauses before answering). If pauses occurred, specify 'approximateDuration', 'aroundPhrase', and a sophisticated 'recommendedFiller' in 'deadSilencePauses'.
   - Provide 3-4 topic-specific 'academicFillerRecommendations' (e.g., "That is quite a multifaceted issue to dissect...", "To put it in perspective...", "If memory serves me right...") to replace "uh", "um" or silence.
   - Count hesitation filler words ('uh', 'um', 'er', 'like', 'you know') in 'fillerWordsFound' and 'hesitationsCount'.
2. Lexical Resource (LR) & Mandatory Vocabulary Challenge Assessment:
   - For each target word in ${JSON.stringify(targetWords)}:
     * Evaluate if candidate incorporated it: 'used': boolean.
     * Check if used with correct grammatical inflection/part of speech: 'correctGrammar': boolean.
     * Check if used in natural collocation and appropriate academic/spoken register: 'correctCollocationAndRegister': boolean.
     * Quote the candidate's exact sentence if used: 'contextSentence': string.
     * Provide clear Vietnamese feedback on naturalness: 'feedbackVi'.
     * Provide a Band 8.5+ native upgrade collocation/example: 'suggestedUpgradeVi'.
     * Collect into 'mandatoryVocabEvaluations'.
   - Check if candidate incorporated any target words: ${JSON.stringify(targetWords)} (fill in targetWordsUsed & targetWordsMissed).
   - Commend all correctly used academic words, power collocations, and idiomatic expressions in 'praisedHighlights'.
   - Point out repetition and missed lexical opportunities.
3. Grammatical Range & Accuracy (GRA):
   - Analyze complex grammatical structures (relative clauses, conditionals, passive voice, inversions, modal verbs).
   - List grammatical errors with exact original substring, correct replacement, and Vietnamese explanation.
4. Pronunciation & Intonation (P):
   - Provide guidance on intonation, rhythm, chunking, and tricky words with IPA and Vietnamese tips.
5. Overall Band Score: 0.0 to 9.0 in standard 0.5 increments (e.g. 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5).
6. Upgraded Model Answer (Band 8.5+):
   - Provide a natural, polished 2-minute Cambridge Band 8.5+ model script expanding on the candidate's story/ideas, highlighting key collocations and Vietnamese translation.
7. Actionable Tips: Provide 3 concrete improvement steps in Vietnamese.

Respond in JSON format according to the schema.`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            part: { type: Type.NUMBER },
            topic: { type: Type.STRING },
            transcript: { type: Type.STRING },
            durationSeconds: { type: Type.NUMBER },
            targetWordsUsed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            targetWordsMissed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            overallBand: { type: Type.NUMBER },
            criteriaScores: {
              type: Type.OBJECT,
              properties: {
                fluencyCoherence: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedbackVi: { type: Type.STRING },
                    speedPacing: {
                      type: Type.STRING,
                      enum: ['Too slow', 'Natural', 'Rushed'],
                    },
                    wordsPerMinute: { type: Type.NUMBER },
                    speechRateVerdictVi: { type: Type.STRING },
                    hesitationsCommentVi: { type: Type.STRING },
                    hesitationsCount: { type: Type.NUMBER },
                    deadSilencePausesCount: { type: Type.NUMBER },
                    deadSilencePauses: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          approximateDuration: { type: Type.STRING },
                          aroundPhrase: { type: Type.STRING },
                          recommendedFiller: { type: Type.STRING },
                          fillerMeaningVi: { type: Type.STRING },
                        },
                        required: [
                          'approximateDuration',
                          'aroundPhrase',
                          'recommendedFiller',
                          'fillerMeaningVi',
                        ],
                      },
                    },
                    fillerWordsFound: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    academicFillerRecommendations: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          phrase: { type: Type.STRING },
                          situationVi: { type: Type.STRING },
                          sampleContext: { type: Type.STRING },
                        },
                        required: ['phrase', 'situationVi', 'sampleContext'],
                      },
                    },
                  },
                  required: [
                    'score',
                    'feedbackVi',
                    'speedPacing',
                    'wordsPerMinute',
                    'speechRateVerdictVi',
                  ],
                },
                lexicalResource: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedbackVi: { type: Type.STRING },
                    academicWordsUsed: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    collocationsUsed: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    missedOpportunitiesVi: { type: Type.STRING },
                    praisedHighlights: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          term: { type: Type.STRING },
                          explanationVi: { type: Type.STRING },
                        },
                        required: ['term', 'explanationVi'],
                      },
                    },
                  },
                  required: ['score', 'feedbackVi', 'academicWordsUsed', 'collocationsUsed'],
                },
                grammaticalRange: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedbackVi: { type: Type.STRING },
                    complexStructuresUsed: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    grammarErrors: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          original: { type: Type.STRING },
                          corrected: { type: Type.STRING },
                          explanationVi: { type: Type.STRING },
                        },
                        required: ['original', 'corrected', 'explanationVi'],
                      },
                    },
                  },
                  required: ['score', 'feedbackVi', 'complexStructuresUsed', 'grammarErrors'],
                },
                pronunciation: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedbackVi: { type: Type.STRING },
                    intonationFeedbackVi: { type: Type.STRING },
                    trickyWords: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          word: { type: Type.STRING },
                          ipa: { type: Type.STRING },
                          tipVi: { type: Type.STRING },
                        },
                        required: ['word', 'ipa', 'tipVi'],
                      },
                    },
                  },
                  required: ['score', 'feedbackVi', 'intonationFeedbackVi', 'trickyWords'],
                },
              },
              required: [
                'fluencyCoherence',
                'lexicalResource',
                'grammaticalRange',
                'pronunciation',
              ],
            },
            overallFeedbackVi: { type: Type.STRING },
            band8ModelAnswer: {
              type: Type.OBJECT,
              properties: {
                answer: { type: Type.STRING },
                vietnameseTranslation: { type: Type.STRING },
                keyCollocations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                explanationVi: { type: Type.STRING },
              },
              required: [
                'answer',
                'vietnameseTranslation',
                'keyCollocations',
                'explanationVi',
              ],
            },
            mandatoryVocabEvaluations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  used: { type: Type.BOOLEAN },
                  correctGrammar: { type: Type.BOOLEAN },
                  correctCollocationAndRegister: { type: Type.BOOLEAN },
                  contextSentence: { type: Type.STRING },
                  feedbackVi: { type: Type.STRING },
                  suggestedUpgradeVi: { type: Type.STRING },
                },
                required: [
                  'term',
                  'used',
                  'correctGrammar',
                  'correctCollocationAndRegister',
                  'feedbackVi',
                ],
              },
            },
            actionableImprovementTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'question',
            'part',
            'topic',
            'transcript',
            'durationSeconds',
            'targetWordsUsed',
            'targetWordsMissed',
            'overallBand',
            'criteriaScores',
            'overallFeedbackVi',
            'band8ModelAnswer',
            'actionableImprovementTips',
          ],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateSpeakingAnswer:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm điểm IELTS Speaking bằng AI' });
  }
}

/**
 * Endpoint to generate authentic IELTS Speaking questions tailored to user's vocabulary set
 */
export async function handleGenerateSpeakingQuestion(req: Request, res: Response) {
  try {
    const { part = 1, topic = 'Technology & Society', vocabTerms = [] } = req.body;

    const prompt = `You are a Cambridge IELTS Speaking Examiner test designer.
Generate an authentic, high-quality IELTS Speaking question for Part ${part}.

Parameters:
- Part: Part ${part} ${part === 2 ? '(Cue Card with bullet points: You should say: ...)' : part === 3 ? '(In-depth two-way discussion)' : '(Short interview question)'}
- Topic: "${topic}"
- Available Vocabulary pool to weave in: ${JSON.stringify(vocabTerms.slice(0, 8))}

Requirements:
1. Question must follow real Cambridge IELTS test format.
2. For Part 2, provide 'subPrompts' (e.g. "What it was", "Where you saw it", "Why it impressed you").
3. Select 3 to 4 'suggestedVocab' words from the pool (or closely related C1/C2 terms) that the candidate should try to incorporate.
4. Provide 3 quick brainstorming ideas/bullet points in 'suggestedIdeas'.
5. For Part 2 Cue Cards, provide 4-6 'powerCollocations', 2-3 topic-specific 'idioms', and 3 'storyFrameworkTips' (Phase: "1. Mở bài & Thiết lập bối cảnh" (0-30s), "2. Kể diễn biến chi tiết & Kỷ niệm" (30-80s), "3. Cảm xúc & Ý nghĩa sâu sắc" (80-120s)).

Respond in JSON format according to schema.`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            part: { type: Type.NUMBER },
            topic: { type: Type.STRING },
            questionText: { type: Type.STRING },
            subPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedVocab: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedIdeas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            powerCollocations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            idioms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            storyFrameworkTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  timeRange: { type: Type.STRING },
                  guide: { type: Type.STRING },
                },
                required: ['phase', 'timeRange', 'guide'],
              },
            },
          },
          required: ['id', 'part', 'topic', 'questionText', 'suggestedVocab', 'suggestedIdeas'],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGenerateSpeakingQuestion:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo câu hỏi IELTS Speaking' });
  }
}

/**
 * Fast-reflex 15-second drill evaluation: Measures directness, hesitation, filler words, and fluency
 */
export async function handleEvaluateQuickSpeakingDrill(req: Request, res: Response) {
  try {
    const {
      question,
      transcript = '',
      audioBase64,
      mimeType = 'audio/webm',
      targetVocab = [],
      durationSeconds = 15,
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Thiếu câu hỏi phản xạ Part 1' });
    }

    const prompt = `You are a Senior Cambridge IELTS Speaking Examiner assessing a candidate's 15-to-20 second Rapid-Fire Part 1 Response.
Goal: Train candidate to eliminate mental translation from Vietnamese, speak directly without hesitation, maintain ideal speech rate (130-160 WPM), and use crisp natural English.

Part 1 Question: "${question}"
Candidate's Spoken Transcript: "${transcript || '(Audio response)'}"
Duration: ${durationSeconds} seconds
Target Focus Words: ${targetVocab.length > 0 ? targetVocab.join(', ') : 'General Academic / Collocations'}

Diagnostic Criteria:
1. Speech Rate (WPM) & Pacing:
   - Calculate Words Per Minute (WPM = words count / (${durationSeconds} / 60)).
   - Provide speechRateVerdictVi:
     * 130 - 160 WPM: "Tốc độ vàng lý tưởng (130-160 WPM)"
     * 100 - 125 WPM: "Hơi chậm (100-125 WPM)"
     * < 100 WPM: "Quá chậm (<100 WPM) - Dấu hiệu dịch nhẩm từ tiếng Việt"
     * > 180 WPM: "Quá nhanh (>180 WPM) - Nguy cơ nuốt âm đuôi"
2. Directness & Mental Translation: Did candidate hit the main point in the first 2-3 seconds, or did they beat around the bush?
3. Hesitations & Dead Pauses:
   - Count unnatural dead silence pauses (> 3s) in deadSilencePausesCount.
   - List filler words (uh, um, like, er, you know, etc.) in fillerWordsFound.
   - Provide 2-3 recommendedStallingFillers (academic fillers like "To be completely candid...", "From my perspective...") to replace silence.
4. Lexical Upgrades & Mandatory Vocabulary Check:
   - For each target word in ${JSON.stringify(targetVocab)}:
     * 'used': boolean, 'correctGrammar': boolean, 'correctCollocationAndRegister': boolean.
     * 'contextSentence': string, 'feedbackVi': string, 'suggestedUpgradeVi': string.
     * Output into 'mandatoryVocabEvaluations'.
   - Highlight 1-2 phrases that sound unnatural or translated and provide punchy native alternatives.
5. Grammar Polish: Brief Vietnamese grammatical feedback.
6. Quick Band 8.5+ Model Response: A concise 2-sentence response showing how a native speaker answers immediately with high lexical density.

Format strictly as JSON adhering to the schema.`;

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
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            transcript: { type: Type.STRING },
            durationSeconds: { type: Type.NUMBER },
            wordsPerMinute: { type: Type.NUMBER },
            speechRateVerdictVi: { type: Type.STRING },
            deadSilencePausesCount: { type: Type.NUMBER },
            fluencyScore: { type: Type.NUMBER },
            estimatedBand: { type: Type.NUMBER },
            directnessRating: { type: Type.STRING },
            responseTimeGrade: { type: Type.STRING },
            fillerWordsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendedStallingFillers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING },
                  situationVi: { type: Type.STRING },
                  sampleContext: { type: Type.STRING },
                },
                required: ['phrase', 'situationVi', 'sampleContext'],
              },
            },
            grammaticalFeedbackVi: { type: Type.STRING },
            lexicalUpgrades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  userPhrase: { type: Type.STRING },
                  nativeAlternative: { type: Type.STRING },
                  explanationVi: { type: Type.STRING },
                },
                required: ['userPhrase', 'nativeAlternative', 'explanationVi'],
              },
            },
            quickModelResponse: {
              type: Type.OBJECT,
              properties: {
                answer: { type: Type.STRING },
                vietnameseTranslation: { type: Type.STRING },
                whyItScoresHigh: { type: Type.STRING },
              },
              required: ['answer', 'vietnameseTranslation', 'whyItScoresHigh'],
            },
            mandatoryVocabEvaluations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  used: { type: Type.BOOLEAN },
                  correctGrammar: { type: Type.BOOLEAN },
                  correctCollocationAndRegister: { type: Type.BOOLEAN },
                  contextSentence: { type: Type.STRING },
                  feedbackVi: { type: Type.STRING },
                  suggestedUpgradeVi: { type: Type.STRING },
                },
                required: [
                  'term',
                  'used',
                  'correctGrammar',
                  'correctCollocationAndRegister',
                  'feedbackVi',
                ],
              },
            },
            coachAdviceVi: { type: Type.STRING },
          },
          required: [
            'question',
            'transcript',
            'wordsPerMinute',
            'speechRateVerdictVi',
            'fluencyScore',
            'estimatedBand',
            'directnessRating',
            'responseTimeGrade',
            'fillerWordsFound',
            'grammaticalFeedbackVi',
            'lexicalUpgrades',
            'quickModelResponse',
            'coachAdviceVi',
          ],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateQuickSpeakingDrill:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm điểm phản xạ Speaking' });
  }
}

/**
 * Generate rapid-fire Part 1 questions for fast response drills
 */
export async function handleGenerateQuickDrillQuestions(req: Request, res: Response) {
  try {
    const { topic = 'Daily Life & Society', vocabTerms = [], count = 5 } = req.body;

    const prompt = `Generate ${count} unexpected, punchy IELTS Speaking Part 1 questions related to "${topic}" or incorporating the following vocabulary context: ${vocabTerms.slice(0, 10).join(', ')}.
Each question must be a classic unexpected rapid-fire Part 1 prompt (e.g. preferences, habits, opinions, childhood vs now, future expectations).

For each question provide:
- "id": unique string id
- "question": the exact question in English
- "topic": category topic name
- "starterIdeaVi": a quick 1-sentence prompt in Vietnamese to help candidate form an instant idea
- "suggestedVocab": 2-3 high-level words/collocations
- "sampleBand8Response": concise 2-sentence Band 8.5 answer
- "sampleBand8Translation": Vietnamese translation of the sample answer

Return strict JSON array conforming to the schema.`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              topic: { type: Type.STRING },
              starterIdeaVi: { type: Type.STRING },
              suggestedVocab: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              sampleBand8Response: { type: Type.STRING },
              sampleBand8Translation: { type: Type.STRING },
            },
            required: [
              'id',
              'question',
              'topic',
              'starterIdeaVi',
              'suggestedVocab',
              'sampleBand8Response',
              'sampleBand8Translation',
            ],
          },
        },
      },
    });

    const parsedData = safeParseAiJson(response.text, []);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGenerateQuickDrillQuestions:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo câu hỏi phản xạ' });
  }
}

/**
 * Endpoint to evaluate a Full 15-Minute IELTS Speaking Mock Test (Part 1 + Part 2 + Part 3)
 */
export async function handleEvaluateFullMockTest(req: Request, res: Response) {
  try {
    const {
      candidateName = 'IELTS Candidate',
      targetBand = 7.0,
      totalDurationSeconds = 720,
      turns = [],
    } = req.body;

    if (!turns || turns.length === 0) {
      return res.status(400).json({ error: 'Thiếu dữ liệu các lượt nói trong bài thi (turns)' });
    }

    const turnsSummary = turns
      .map(
        (t: any, idx: number) => `
[TURN ${idx + 1}] Part ${t.part} (${t.partTitleVi || 'Phần thi'})
- Topic: "${t.topic || 'General'}"
- Question: "${t.questionText}"
- Candidate Duration: ${t.durationSeconds || 30}s
- Candidate Transcript:
"${t.transcript || ''}"
`
      )
      .join('\n');

    const prompt = `You are a Principal Cambridge IELTS Speaking Examiner at an Official IDP / British Council Test Center.
Evaluate this Candidate's COMPLETE 15-Minute IELTS Speaking Exam spanning Part 1, Part 2 (Individual Long Turn), and Part 3 (In-depth Discussion).

Candidate Information:
- Candidate Name: ${candidateName}
- Target Band: ${targetBand}
- Total Exam Speaking Duration: ${totalDurationSeconds}s (~${Math.round(totalDurationSeconds / 60)} minutes)

Full Exam Transcript by Parts:
${turnsSummary}

Evaluation Requirements:
1. Overall IELTS Speaking Band (0 - 9.0 in 0.5 increments, e.g. 6.5, 7.0, 7.5, 8.0) following standard IELTS rounding rules (average of 4 criteria rounded to nearest half band).
2. Four Official Criteria Scores (0 - 9.0 each):
   - Fluency & Coherence (FC)
   - Lexical Resource (LR)
   - Grammatical Range & Accuracy (GRA)
   - Pronunciation (PR)
3. Part-by-Part Band Breakdown:
   - Part 1 Band (0 - 9.0)
   - Part 2 Band (0 - 9.0)
   - Part 3 Band (0 - 9.0)
4. Stamina & Energy Analysis: Assess how well the candidate maintained cognitive energy and speech rate from Part 1 through Part 3 (e.g. did they maintain confidence or fade under pressure?).
5. Top 3 Strengths (Tiếng Việt) & Top 3 Weaknesses / Recurring Traps to avoid (Tiếng Việt).
6. Comprehensive Examiner Feedback in Vietnamese (examinerSummaryFeedbackVi) and Formal IELTS Official Remarks in English (examinerOfficialRemarksEn).
7. CEFR Level: 'B1' | 'B2' | 'C1' | 'C2'.

Return strict JSON conforming to the schema.`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallBand: { type: Type.NUMBER },
            criteriaScores: {
              type: Type.OBJECT,
              properties: {
                fluencyCoherence: { type: Type.NUMBER },
                lexicalResource: { type: Type.NUMBER },
                grammaticalRange: { type: Type.NUMBER },
                pronunciation: { type: Type.NUMBER },
                wordsPerMinuteAverage: { type: Type.NUMBER },
                totalHesitations: { type: Type.NUMBER },
                totalDeadSilences: { type: Type.NUMBER },
              },
              required: [
                'fluencyCoherence',
                'lexicalResource',
                'grammaticalRange',
                'pronunciation',
                'wordsPerMinuteAverage',
                'totalHesitations',
                'totalDeadSilences',
              ],
            },
            partScores: {
              type: Type.OBJECT,
              properties: {
                part1Band: { type: Type.NUMBER },
                part2Band: { type: Type.NUMBER },
                part3Band: { type: Type.NUMBER },
              },
              required: ['part1Band', 'part2Band', 'part3Band'],
            },
            examinerSummaryFeedbackVi: { type: Type.STRING },
            examinerOfficialRemarksEn: { type: Type.STRING },
            staminaAndPacingVerdictVi: { type: Type.STRING },
            topStrengthsVi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            topWeaknessesVi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            cefrLevel: {
              type: Type.STRING,
              enum: ['B1', 'B2', 'C1', 'C2'],
            },
          },
          required: [
            'overallBand',
            'criteriaScores',
            'partScores',
            'examinerSummaryFeedbackVi',
            'examinerOfficialRemarksEn',
            'staminaAndPacingVerdictVi',
            'topStrengthsVi',
            'topWeaknessesVi',
            'cefrLevel',
          ],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateFullMockTest:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm điểm bài thi 15 phút Full Mock' });
  }
}

/**
 * Endpoint to generate A.R.E.A / P.E.E.L 4-Step Answer Expansion for any Speaking Question
 */
export async function handleGenerateAreaExpansion(req: Request, res: Response) {
  try {
    const {
      question = 'Do you enjoy cooking at home?',
      topic = 'Daily Life & Lifestyle',
      formula = 'AREA',
      shortAnswerRaw = '',
      targetBand = 8.0,
    } = req.body;

    const isArea = formula === 'AREA';

    const prompt = `
Bạn là Giám khảo IELTS Master & Chuyên gia Huấn Luyện Speaking hàng đầu.
Nhiệm vụ của bạn là giải quyết dứt điểm vấn đề "CỘC LỐC / ÍT NÓI / BÍ Ý TƯỞNG" của thí sinh bằng công thức mở rộng 4 bước ${formula} (${isArea ? 'Answer - Reason - Example - Alternative/Future' : 'Point - Explanation - Example - Link back'}).

THÔNG TIN ĐẦU VÀO:
- Câu hỏi IELTS: "${question}"
- Chủ đề: "${topic}"
- Câu trả lời ngắn/cộc lốc ban đầu của thí sinh (nếu có): "${shortAnswerRaw || 'N/A'}"
- Mục tiêu điểm số: Band ${targetBand}

YÊU CẦU ĐẦU RA:
1. Xây dựng 4 bước chi tiết:
   - Bước 1 (Answer / Point): Trả lời trực diện, ấn tượng, sử dụng Paraphrasing mượt mà.
   - Bước 2 (Reason / Explanation): Phân tích nguyên nhân sâu xa hoặc yếu tố tâm lý/xã hội/tiện ích.
   - Bước 3 (Example / Story): Kể một ví dụ đời thực cụ thể (với mốc thời gian "just last weekend", "a few months back" để tự nhiên ghi điểm Fluency).
   - Bước 4 (Alternative / Future / Link): Lật ngược vấn đề ("Had I not...", "On the flip side, if I don't...") hoặc dự đoán tương lai / chốt lại trọng tâm.
2. Cung cấp 3-4 mẫu câu mồi (Sentence Starters) chuẩn Band 8.0 cho MỖI bước.
3. Ráp lại thành bài nói hoàn chỉnh (Full Expanded Answer) dài khoảng 40-55 từ (nếu Part 1) hoặc 70-90 từ (nếu Part 3) với độ trôi chảy tuyệt hảo.
4. Trích xuất các C1/C2 Collocations và Từ nối (Cohesive Devices).
`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            topic: { type: Type.STRING },
            formula: { type: Type.STRING, enum: ['AREA', 'PEEL'] },
            shortAnswerRaw: { type: Type.STRING },
            steps: {
              type: Type.OBJECT,
              properties: {
                answer: {
                  type: Type.OBJECT,
                  properties: {
                    stepLabel: { type: Type.STRING },
                    sentenceStarters: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    modelSentenceEn: { type: Type.STRING },
                    modelSentenceVi: { type: Type.STRING },
                    focusTipVi: { type: Type.STRING },
                  },
                  required: [
                    'stepLabel',
                    'sentenceStarters',
                    'modelSentenceEn',
                    'modelSentenceVi',
                    'focusTipVi',
                  ],
                },
                reason: {
                  type: Type.OBJECT,
                  properties: {
                    stepLabel: { type: Type.STRING },
                    sentenceStarters: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    modelSentenceEn: { type: Type.STRING },
                    modelSentenceVi: { type: Type.STRING },
                    focusTipVi: { type: Type.STRING },
                  },
                  required: [
                    'stepLabel',
                    'sentenceStarters',
                    'modelSentenceEn',
                    'modelSentenceVi',
                    'focusTipVi',
                  ],
                },
                example: {
                  type: Type.OBJECT,
                  properties: {
                    stepLabel: { type: Type.STRING },
                    sentenceStarters: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    modelSentenceEn: { type: Type.STRING },
                    modelSentenceVi: { type: Type.STRING },
                    focusTipVi: { type: Type.STRING },
                  },
                  required: [
                    'stepLabel',
                    'sentenceStarters',
                    'modelSentenceEn',
                    'modelSentenceVi',
                    'focusTipVi',
                  ],
                },
                alternativeOrFuture: {
                  type: Type.OBJECT,
                  properties: {
                    stepLabel: { type: Type.STRING },
                    sentenceStarters: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    modelSentenceEn: { type: Type.STRING },
                    modelSentenceVi: { type: Type.STRING },
                    focusTipVi: { type: Type.STRING },
                  },
                  required: [
                    'stepLabel',
                    'sentenceStarters',
                    'modelSentenceEn',
                    'modelSentenceVi',
                    'focusTipVi',
                  ],
                },
              },
              required: ['answer', 'reason', 'example', 'alternativeOrFuture'],
            },
            fullExpandedAnswerEn: { type: Type.STRING },
            fullExpandedAnswerVi: { type: Type.STRING },
            targetVocabHighlight: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  meaningVi: { type: Type.STRING },
                  bandScore: { type: Type.STRING },
                },
                required: ['word', 'meaningVi', 'bandScore'],
              },
            },
            cohesiveDevicesUsed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            estimatedSpeakingSeconds: { type: Type.NUMBER },
          },
          required: [
            'question',
            'topic',
            'formula',
            'steps',
            'fullExpandedAnswerEn',
            'fullExpandedAnswerVi',
            'targetVocabHighlight',
            'cohesiveDevicesUsed',
            'estimatedSpeakingSeconds',
          ],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGenerateAreaExpansion:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo khung mở rộng AREA' });
  }
}

/**
 * Endpoint to evaluate candidate's spoken response against the AREA / PEEL 4-step framework
 */
export async function handleEvaluateAreaAnswer(req: Request, res: Response) {
  try {
    const {
      question = '',
      formula = 'AREA',
      userTranscript = '',
      targetBand = 7.5,
    } = req.body;

    const prompt = `
Bạn là Giám khảo IELTS Chuyên nghiệp. Hãy đánh giá bài nói của thí sinh theo công thức mở rộng 4 bước ${formula}.
- Câu hỏi: "${question}"
- Bài nói của thí sinh: "${userTranscript}"
- Mục tiêu Band: ${targetBand}

Hãy kiểm tra chi tiết xem bài nói đã đạt đủ 4 bước (Trực diện - Lý do - Ví dụ cụ thể - Lật ngược/Tương lai/Link) chưa, tính điểm bao quát /4, đưa ra lời khuyên thực tế để thí sinh ít nói kéo dài câu tự nhiên nhất và viết lại một bản nâng cấp chuẩn Band 8.0.
`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallBandScore: { type: Type.NUMBER },
            coverageCheck: {
              type: Type.OBJECT,
              properties: {
                hasDirectAnswer: { type: Type.BOOLEAN },
                hasClearReason: { type: Type.BOOLEAN },
                hasVividExample: { type: Type.BOOLEAN },
                hasAlternativeOrFuture: { type: Type.BOOLEAN },
                scoreOutOf4: { type: Type.NUMBER },
              },
              required: [
                'hasDirectAnswer',
                'hasClearReason',
                'hasVividExample',
                'hasAlternativeOrFuture',
                'scoreOutOf4',
              ],
            },
            fluencyGainSeconds: { type: Type.NUMBER },
            verdictVi: { type: Type.STRING },
            strengthsVi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            improvementsVi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            upgradedAnswerBand8: { type: Type.STRING },
          },
          required: [
            'overallBandScore',
            'coverageCheck',
            'fluencyGainSeconds',
            'verdictVi',
            'strengthsVi',
            'improvementsVi',
            'upgradedAnswerBand8',
          ],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateAreaAnswer:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm điểm bài nói theo AREA' });
  }
}

/**
 * Progressive Speech Ladder Step Evaluator & Scaffolding Generator (30s ➔ 60s ➔ 90s/120s)
 */
export async function handleEvaluateSpeechLadder(req: Request, res: Response) {
  try {
    const {
      question = '',
      level = 1,
      targetDurationSeconds = 30,
      userTranscript = '',
      spokenDurationSeconds = 30,
      previousLevelTranscript = '',
      targetVocab = [],
    } = req.body;

    const levelDescriptions = {
      1: 'Cấp độ 1 (Khởi động 30s - Micro-Turn): 1 ý chính trực diện + 1 câu giải thích ngắn gọn, loại bỏ im lặng.',
      2: 'Cấp độ 2 (Phát triển 60s - Story Builder): Đắp thêm yếu tố mốc thời gian cụ thể, diễn biến câu chuyện và cảm xúc cá nhân sâu sắc.',
      3: 'Cấp độ 3 (Bùng nổ 90s - 120s - Master Long Turn): Kết hợp phân tích sâu đa chiều, so sánh quá khứ vs hiện tại, dự đoán tương lai hoặc góc nhìn đối lập.',
    };

    const prompt = `
Bạn là Giám khảo IELTS Chuyên nghiệp kiêm Huấn Luyện Viên Nói Chuyên Sâu (Progressive Speaking Coach).
Nhiệm vụ của bạn là đánh giá nấc thang luyện nói tăng tiến cấp độ ${level} của thí sinh (đặc biệt là người ít nói/introvert):
- Câu hỏi: "${question}"
- Cấp độ hiện tại: ${levelDescriptions[level as 1 | 2 | 3] || 'Level ' + level}
- Thời gian mục tiêu: ${targetDurationSeconds} giây (Thời gian thực tế thí sinh nói: ${spokenDurationSeconds} giây)
- Bài nói của thí sinh ở cấp độ này: "${userTranscript}"
${previousLevelTranscript ? `- Bài nói ở nấc trước đó (để so sánh độ phát triển): "${previousLevelTranscript}"` : ''}
${targetVocab && targetVocab.length > 0 ? `- Từ vựng mục tiêu gợi ý: ${targetVocab.map((v: any) => v.word || v).join(', ')}` : ''}

Hãy phân tích và đưa ra:
1. 'bandEstimate': Điểm ước tính (VD 6.0, 6.5, 7.0, 7.5, 8.0).
2. 'passedLevel': true nếu thí sinh đạt tối thiểu thời gian (ít nhất 70% thời gian mục tiêu) và có nội dung tương ứng cấp độ.
3. 'scoreBreakdown': Điểm 4 tiêu chí Fluency, Lexical, Grammar, ContentExpansion (/9.0).
4. 'praisePointsVi': 2 điểm cộng lớn mà thí sinh đã làm tốt ở nấc này (tiếng Việt truyền cảm hứng).
5. 'growthSuggestionsVi': 2 điểm cần cải thiện cụ thể (tiếng Việt).
6. 'vocabularyUpgrades': Danh sách 2-4 từ vựng đơn giản trong bài nói của thí sinh và cách thay thế bằng từ/cụm từ học thuật C1/C2 kèm giải thích tiếng Việt.
7. 'suggestedExpansionToNextLevel': Hướng dẫn chi tiết cách "đắp thêm" ý để bước lên nấc tiếp theo (Level ${Math.min(3, Number(level) + 1)}).
8. 'scaffoldedNextLevelDraftEn': Một bài nói mẫu hoàn chỉnh nâng cấp bằng tiếng Anh kết hợp ý của thí sinh đắp thêm từ vựng xịn và ý tưởng sâu sắc cho nấc tiếp theo!
`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.NUMBER },
            spokenDurationSeconds: { type: Type.NUMBER },
            wordCount: { type: Type.NUMBER },
            wordsPerMinute: { type: Type.NUMBER },
            bandEstimate: { type: Type.NUMBER },
            passedLevel: { type: Type.BOOLEAN },
            scoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                fluencyAndCoherence: { type: Type.NUMBER },
                lexicalResource: { type: Type.NUMBER },
                grammaticalRange: { type: Type.NUMBER },
                contentExpansion: { type: Type.NUMBER },
              },
              required: [
                'fluencyAndCoherence',
                'lexicalResource',
                'grammaticalRange',
                'contentExpansion',
              ],
            },
            praisePointsVi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            growthSuggestionsVi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedExpansionToNextLevel: { type: Type.STRING },
            vocabularyUpgrades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalWordOrPhrase: { type: Type.STRING },
                  upgradedAlternative: { type: Type.STRING },
                  whyBetterVi: { type: Type.STRING },
                },
                required: ['originalWordOrPhrase', 'upgradedAlternative', 'whyBetterVi'],
              },
            },
            scaffoldedNextLevelDraftEn: { type: Type.STRING },
          },
          required: [
            'level',
            'spokenDurationSeconds',
            'wordCount',
            'wordsPerMinute',
            'bandEstimate',
            'passedLevel',
            'scoreBreakdown',
            'praisePointsVi',
            'growthSuggestionsVi',
            'suggestedExpansionToNextLevel',
            'vocabularyUpgrades',
            'scaffoldedNextLevelDraftEn',
          ],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleEvaluateSpeechLadder:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi chấm điểm nấc thang luyện nói' });
  }
}

/**
 * 💡 5-Dimensional Mindmap Idea Generator Toolkit
 */
export async function handleGenerate5DMindmapIdeas(req: Request, res: Response) {
  try {
    const { topic = '', question = '', customContext = '' } = req.body;

    const prompt = `
Bạn là Cố Vấn Ý Tưởng IELTS Speaking Thượng Hạng (IELTS Idea Architect & Master Brainstormer).
Thí sinh đang gặp bế tắc ý tưởng ("Không biết nói gì kể cả bằng tiếng Việt") cho chủ đề sau:
- Chủ đề: "${topic}"
- Câu hỏi cụ thể: "${question}"
${customContext ? `- Ngữ cảnh bổ sung: "${customContext}"` : ''}

Nhiệm vụ của bạn: Sử dụng BỘ KHUNG MINDMAP 5 LĂNG KÍNH VẠN NĂNG (5 Universal Dimensions Framework) để "khai phóng ý tưởng" toàn diện cho mọi đề thi IELTS khó nhằn:
1. 'economic' (Tài chính / Tiền bạc / Chi phí / Lợi ích kinh tế)
2. 'health_wellbeing' (Sức khỏe thể chất, tâm lý, giảm stress, tinh thần)
3. 'environmental' (Môi trường, thiên nhiên, sinh thái, bảo tồn tài nguyên)
4. 'tech_convenience' (Công nghệ, sự tiện lợi, tự động hóa, tiết kiệm thời gian)
5. 'interpersonal' (Mối quan hệ xã hội, gia đình, gắn kết cộng đồng, văn hóa)

Với MỖI lăng kính, hãy cung cấp:
- 'key': (economic | health_wellbeing | environmental | tech_convenience | interpersonal)
- 'nameVi': Tên lăng kính tiếng Việt
- 'nameEn': Tên lăng kính tiếng Anh
- 'icon': Tên icon đại diện (VD: DollarSign, HeartPulse, Leaf, Laptop, Users)
- 'color': Mã màu gợi ý (VD: amber, rose, emerald, blue, purple)
- 'taglineVi': Một câu tóm tắt định hướng lăng kính bằng tiếng Việt
- 'ideas': 2 luận điểm cốt lõi (DimensionIdeaPoint):
  * 'coreArgumentVi': Luận điểm ngắn gọn tiếng Việt
  * 'coreArgumentEn': Luận điểm tiếng Anh
  * 'bulletDetailsEn': 2 chi tiết giải thích / dẫn chứng tiếng Anh
  * 'powerCollocations': 2 collocations C1/C2 ăn điểm
  * 'sampleBand8Sentence': 1 câu ví dụ Band 8.5 hoàn chỉnh sử dụng góc nhìn này.

Ngoài ra cung cấp:
- 'summaryOverviewVi': Tổng quan ngắn 2 câu tiếng Việt hướng dẫn thí sinh cách phối hợp 2-3 lăng kính để tạo câu trả lời 2 phút Part 2 hoặc 40s Part 3 mượt mà.
- 'synthesizedBand8Answer': Một câu trả lời mẫu Band 8.5 hoàn hảo kết hợp nhuần nhuyễn 2-3 lăng kính trên.
- 'proTipsForExaminerVi': 3 mẹo tâm lý thực chiến khi bị bí ý tưởng trong phòng thi thật.
`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            question: { type: Type.STRING },
            summaryOverviewVi: { type: Type.STRING },
            dimensions: {
              type: Type.OBJECT,
              properties: {
                economic: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    nameVi: { type: Type.STRING },
                    nameEn: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    color: { type: Type.STRING },
                    taglineVi: { type: Type.STRING },
                    ideas: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          coreArgumentVi: { type: Type.STRING },
                          coreArgumentEn: { type: Type.STRING },
                          bulletDetailsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
                          powerCollocations: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                phrase: { type: Type.STRING },
                                meaningVi: { type: Type.STRING },
                                cefrLevel: { type: Type.STRING },
                              },
                              required: ['phrase', 'meaningVi', 'cefrLevel'],
                            },
                          },
                          sampleBand8Sentence: { type: Type.STRING },
                        },
                        required: ['id', 'coreArgumentVi', 'coreArgumentEn', 'bulletDetailsEn', 'powerCollocations', 'sampleBand8Sentence'],
                      },
                    },
                  },
                  required: ['key', 'nameVi', 'nameEn', 'icon', 'color', 'taglineVi', 'ideas'],
                },
                health_wellbeing: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    nameVi: { type: Type.STRING },
                    nameEn: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    color: { type: Type.STRING },
                    taglineVi: { type: Type.STRING },
                    ideas: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          coreArgumentVi: { type: Type.STRING },
                          coreArgumentEn: { type: Type.STRING },
                          bulletDetailsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
                          powerCollocations: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                phrase: { type: Type.STRING },
                                meaningVi: { type: Type.STRING },
                                cefrLevel: { type: Type.STRING },
                              },
                              required: ['phrase', 'meaningVi', 'cefrLevel'],
                            },
                          },
                          sampleBand8Sentence: { type: Type.STRING },
                        },
                        required: ['id', 'coreArgumentVi', 'coreArgumentEn', 'bulletDetailsEn', 'powerCollocations', 'sampleBand8Sentence'],
                      },
                    },
                  },
                  required: ['key', 'nameVi', 'nameEn', 'icon', 'color', 'taglineVi', 'ideas'],
                },
                environmental: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    nameVi: { type: Type.STRING },
                    nameEn: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    color: { type: Type.STRING },
                    taglineVi: { type: Type.STRING },
                    ideas: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          coreArgumentVi: { type: Type.STRING },
                          coreArgumentEn: { type: Type.STRING },
                          bulletDetailsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
                          powerCollocations: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                phrase: { type: Type.STRING },
                                meaningVi: { type: Type.STRING },
                                cefrLevel: { type: Type.STRING },
                              },
                              required: ['phrase', 'meaningVi', 'cefrLevel'],
                            },
                          },
                          sampleBand8Sentence: { type: Type.STRING },
                        },
                        required: ['id', 'coreArgumentVi', 'coreArgumentEn', 'bulletDetailsEn', 'powerCollocations', 'sampleBand8Sentence'],
                      },
                    },
                  },
                  required: ['key', 'nameVi', 'nameEn', 'icon', 'color', 'taglineVi', 'ideas'],
                },
                tech_convenience: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    nameVi: { type: Type.STRING },
                    nameEn: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    color: { type: Type.STRING },
                    taglineVi: { type: Type.STRING },
                    ideas: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          coreArgumentVi: { type: Type.STRING },
                          coreArgumentEn: { type: Type.STRING },
                          bulletDetailsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
                          powerCollocations: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                phrase: { type: Type.STRING },
                                meaningVi: { type: Type.STRING },
                                cefrLevel: { type: Type.STRING },
                              },
                              required: ['phrase', 'meaningVi', 'cefrLevel'],
                            },
                          },
                          sampleBand8Sentence: { type: Type.STRING },
                        },
                        required: ['id', 'coreArgumentVi', 'coreArgumentEn', 'bulletDetailsEn', 'powerCollocations', 'sampleBand8Sentence'],
                      },
                    },
                  },
                  required: ['key', 'nameVi', 'nameEn', 'icon', 'color', 'taglineVi', 'ideas'],
                },
                interpersonal: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    nameVi: { type: Type.STRING },
                    nameEn: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    color: { type: Type.STRING },
                    taglineVi: { type: Type.STRING },
                    ideas: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          coreArgumentVi: { type: Type.STRING },
                          coreArgumentEn: { type: Type.STRING },
                          bulletDetailsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
                          powerCollocations: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                phrase: { type: Type.STRING },
                                meaningVi: { type: Type.STRING },
                                cefrLevel: { type: Type.STRING },
                              },
                              required: ['phrase', 'meaningVi', 'cefrLevel'],
                            },
                          },
                          sampleBand8Sentence: { type: Type.STRING },
                        },
                        required: ['id', 'coreArgumentVi', 'coreArgumentEn', 'bulletDetailsEn', 'powerCollocations', 'sampleBand8Sentence'],
                      },
                    },
                  },
                  required: ['key', 'nameVi', 'nameEn', 'icon', 'color', 'taglineVi', 'ideas'],
                },
              },
              required: ['economic', 'health_wellbeing', 'environmental', 'tech_convenience', 'interpersonal'],
            },
            synthesizedBand8Answer: { type: Type.STRING },
            proTipsForExaminerVi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'topic',
            'question',
            'summaryOverviewVi',
            'dimensions',
            'synthesizedBand8Answer',
            'proTipsForExaminerVi',
          ],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGenerate5DMindmapIdeas:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi khởi tạo Mindmap 5 Lăng Kính Ý Tưởng' });
  }
}

/**
 * Endpoint to dynamically generate a Complete 15-Minute IELTS Full Mock Exam Pack (Part 1, 2, 3)
 */
export async function handleGenerateFullMockPack(req: Request, res: Response) {
  try {
    const { topic = 'Urban Living, Modern Technology & Sustainable Futures', vocabTerms = [] } = req.body;

    const prompt = `You are a Senior Cambridge IELTS Speaking Test Designer.
Generate a cohesive, authentic, complete 15-Minute IELTS Speaking Exam Pack consisting of Part 1 (3 questions), Part 2 (Cue Card with 4 sub-prompts), and Part 3 (3 in-depth discussion questions).

Parameters:
- Central Theme/Topic: "${topic}"
- Target Vocabulary Pool to integrate: ${JSON.stringify(vocabTerms.slice(0, 10))}

Requirements:
1. 'theme': A concise, professional IELTS exam theme title (e.g. "Urban Living, Modern Technology & Sustainable Futures").
2. 'part1': 3 authentic interview questions related to daily life/routine/habits under this theme, with suggestedVocab for each.
3. 'part2': 1 authentic IELTS Part 2 Cue Card task with topic, questionText ("Describe a..."), 4 bullet subPrompts ("You should say: ..."), and 4 suggestedVocab.
4. 'part3': 3 in-depth, abstract discussion questions analyzing societal trends, ethical dilemmas, or future projections connected to the theme, with suggestedVocab.

Respond strictly in JSON format adhering to the schema.`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            part1: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  suggestedVocab: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['id', 'question', 'topic', 'suggestedVocab'],
              },
            },
            part2: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                topic: { type: Type.STRING },
                questionText: { type: Type.STRING },
                subPrompts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                suggestedVocab: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['id', 'topic', 'questionText', 'subPrompts', 'suggestedVocab'],
            },
            part3: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  suggestedVocab: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['id', 'question', 'topic', 'suggestedVocab'],
              },
            },
          },
          required: ['theme', 'part1', 'part2', 'part3'],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGenerateFullMockPack:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo đề thi 15 phút Full Mock bằng AI' });
  }
}

/**
 * Endpoint to dynamically generate a Progressive Speech Ladder Task (30s -> 60s -> 90s-120s)
 */
export async function handleGenerateSpeechLadderPrompt(req: Request, res: Response) {
  try {
    const { topic = 'Technology & Modern Habits', questionText = '', vocabTerms = [] } = req.body;

    const prompt = `You are a Cambridge IELTS Speaking Coach specializing in the Progressive Speech Ladder technique (30s ➔ 60s ➔ 90-120s stamina builder).
Generate a complete 3-Level Progressive Speech Ladder task for IELTS Speaking.

Parameters:
- Topic: "${topic}"
- Question Context: "${questionText || 'Generate an engaging IELTS Part 2 or Part 3 question on this topic'}"
- Available Vocabulary pool: ${JSON.stringify(vocabTerms.slice(0, 8))}

Requirements:
1. 'id': Unique string id (e.g. 'ladder-ai-' + Date.now()).
2. 'topic': Clean English topic title.
3. 'part': 2 or 3 (number).
4. 'questionText': Clear, authentic IELTS question.
5. 'cueCardPoints': 3 prompt points (if Part 2) or sub-perspectives (if Part 3).
6. 'recommendedVocab': 3 high-band (C1/C2) vocabulary items with word, phonetic, meaningVi, level, and collocation.
7. 'level1Guide' (30s): targetDuration ("30s"), targetSeconds (30), goalVi (clear Vietnamese instruction), starterTemplate, sampleBand7Response (~35-45 words), keyPointsVi (2 points).
8. 'level2Guide' (60s): targetDuration ("60s"), targetSeconds (60), goalVi, starterTemplate, sampleBand7Response (~75-90 words building upon level 1 with a concrete story or detailed example), keyPointsVi (2 points).
9. 'level3Guide' (90-120s): targetDuration ("90s - 120s"), targetSeconds (90), goalVi, starterTemplate, sampleBand7Response (~130-160 words with advanced grammar, contrast, or philosophical reflection), keyPointsVi (3 points).

Respond strictly in JSON format adhering to the schema.`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            topic: { type: Type.STRING },
            part: { type: Type.NUMBER, enum: [2, 3] },
            questionText: { type: Type.STRING },
            cueCardPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendedVocab: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  meaningVi: { type: Type.STRING },
                  level: { type: Type.STRING },
                  collocation: { type: Type.STRING },
                },
                required: ['word', 'phonetic', 'meaningVi', 'level', 'collocation'],
              },
            },
            level1Guide: {
              type: Type.OBJECT,
              properties: {
                targetDuration: { type: Type.STRING },
                targetSeconds: { type: Type.NUMBER },
                goalVi: { type: Type.STRING },
                starterTemplate: { type: Type.STRING },
                sampleBand7Response: { type: Type.STRING },
                keyPointsVi: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['targetDuration', 'targetSeconds', 'goalVi', 'starterTemplate', 'sampleBand7Response', 'keyPointsVi'],
            },
            level2Guide: {
              type: Type.OBJECT,
              properties: {
                targetDuration: { type: Type.STRING },
                targetSeconds: { type: Type.NUMBER },
                goalVi: { type: Type.STRING },
                starterTemplate: { type: Type.STRING },
                sampleBand7Response: { type: Type.STRING },
                keyPointsVi: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['targetDuration', 'targetSeconds', 'goalVi', 'starterTemplate', 'sampleBand7Response', 'keyPointsVi'],
            },
            level3Guide: {
              type: Type.OBJECT,
              properties: {
                targetDuration: { type: Type.STRING },
                targetSeconds: { type: Type.NUMBER },
                goalVi: { type: Type.STRING },
                starterTemplate: { type: Type.STRING },
                sampleBand7Response: { type: Type.STRING },
                keyPointsVi: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['targetDuration', 'targetSeconds', 'goalVi', 'starterTemplate', 'sampleBand7Response', 'keyPointsVi'],
            },
          },
          required: [
            'id',
            'topic',
            'part',
            'questionText',
            'recommendedVocab',
            'level1Guide',
            'level2Guide',
            'level3Guide',
          ],
        },
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleGenerateSpeechLadderPrompt:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo nấc thang luyện nói bằng AI' });
  }
}

/**
 * Endpoint for AI Daily Coffee Chat / Free Conversational Partner
 */
export async function handleCoffeeChatReply(req: Request, res: Response) {
  try {
    const { messages, persona, topic, targetWords = [] } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Thiếu lịch sử tin nhắn hội thoại (messages)' });
    }

    const personaName = persona?.name || 'Alex';
    const personaRole = persona?.roleTitleEn || 'Friendly Coffee Buddy';
    const personaPersonality = persona?.personalityVi || 'Thân thiện, vui vẻ, cởi mở, chân thành';
    const currentTopic = topic || 'Daily Life & Free Talk';

    // Format chat history for prompt
    const chatHistoryFormatted = messages
      .slice(-8)
      .map((m: any) => `${m.sender === 'user' ? 'User' : personaName}: ${m.text}`)
      .join('\n');

    const lastUserMessage = [...messages].reverse().find((m: any) => m.sender === 'user')?.text || '';

    const prompt = `
You are ${personaName}, a real, warm, natural English-speaking friend (${personaRole}) chatting 1-on-1 with the user over a cup of coffee.
Topic: "${currentTopic}"
Persona Details: ${personaPersonality}.
Accent / Vibe: ${persona?.accent || 'US'}.

Recent Chat History:
${chatHistoryFormatted}

User's Latest Statement:
"${lastUserMessage}"

Target Vocabulary to notice if used:
${targetWords.slice(0, 15).join(', ')}

CORE CONVERSATIONAL RULES:
1. TALK LIKE A REAL HUMAN FRIEND, NOT A ROBOT OR PRE-SCRIPTED INTERVIEWER.
2. Directly answer or react to what the user ACTUALLY said:
   - If the user says a short answer like "no", "yes", "not really", "nothing much", react naturally with humor or curiosity (e.g. "Haha fair enough! What are you usually up to on weekends then?" or "Oh really? What made you feel that way?").
   - If the user asks a question about YOU (e.g. "can you tell me all yourself", "what do you do?", "what's your hobby?"), warmly answer in first-person as ${personaName} (e.g. "Sure! Well, I'm ${personaName}—I love exploring cozy neighborhood cafes, listening to indie pop, and trying new foods! What about you, what's your favorite thing to do?").
   - If the user makes a statement, genuinely comment on their specific details first before continuing the conversation.
3. Keep the response snappy, conversational, and natural for spoken audio (1-3 sentences max).
4. Provide a friendly facial emotion: 'happy' | 'encouraging' | 'surprised' | 'thinking' | 'idle'.
5. Provide a natural Vietnamese translation for the user's convenience.
6. Provide 3 spontaneous, diverse response options (suggestedResponses) that fit the exact context.
7. Provide a gentle "Native Polish Upgrade" showing how a native speaker would say the user's thought more idiomatically (without being judgmental), with a short Vietnamese note.

Output strictly valid JSON conforming to the schema.
`;

    try {
      const response = await generateWithRetryAndFallback({
        primaryModel: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: { type: Type.STRING },
              emotion: { type: Type.STRING, description: 'happy, encouraging, surprised, thinking, or idle' },
              translationVi: { type: Type.STRING },
              suggestedResponses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              nativePolishUpgrade: {
                type: Type.OBJECT,
                properties: {
                  originalText: { type: Type.STRING },
                  polishedText: { type: Type.STRING },
                  explanationVi: { type: Type.STRING },
                  keyCollocations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['originalText', 'polishedText', 'explanationVi'],
              },
              detectedVocabWords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['replyText', 'translationVi', 'suggestedResponses'],
          },
        },
      });

      const parsedData = safeParseAiJson(response.text);
      return res.json({ success: true, data: parsedData });
    } catch (llmError: any) {
      console.warn('Gemini LLM call failed in handleCoffeeChatReply, building adaptive contextual reply:', llmError);
      
      const lower = lastUserMessage.toLowerCase().trim();
      let dynamicReply = `I hear you! That's really interesting. What else have you been thinking about regarding that?`;
      let dynamicTrans = `Mình hiểu ý bạn rồi! Điều đó thật thú vị. Bạn có suy nghĩ hay cảm nhận gì thêm về điều đó không?`;
      let emotion = 'happy';

      if (lower === 'no' || lower === 'nope' || lower.startsWith('no,')) {
        dynamicReply = "Haha, fair enough! What do you usually prefer doing instead then?";
        dynamicTrans = "Haha, hợp lý luôn! Vậy bình thường bạn thích làm gì hơn nè?";
        emotion = 'surprised';
      } else if (lower.includes('yourself') || lower.includes('who are you') || lower.includes('about you') || lower.includes('tell me all')) {
        dynamicReply = `Haha sure! Well, I'm ${personaName}—I love grabbing good coffee, chilling with music, and having relaxed chats like this! What about you, what's your absolute favorite way to unwind?`;
        dynamicTrans = `Haha tất nhiên rồi! Mình là ${personaName}—mình rất thích đi cà phê, nghe nhạc thư giãn và trò chuyện vui vẻ thế này! Còn bạn thì sao, cách xả hơi yêu thích nhất của bạn là gì?`;
        emotion = 'happy';
      } else if (lower.includes('tea') || lower.includes('black tea') || lower.includes('flavor') || lower.includes('milk')) {
        dynamicReply = `Oh, pure black tea is a classic choice! It has such a rich, authentic taste without any added milk. Do you have a favorite time of day to enjoy a warm cup?`;
        dynamicTrans = `Ôi, trà đen nguyên chất là lựa chọn tuyệt vời luôn! Hương vị rất đậm đà và nguyên bản. Bạn hay thích thưởng thức một tách trà ấm vào lúc nào trong ngày?`;
        emotion = 'happy';
      } else if (lower.includes('hear me') || lower.includes('hello') || lower.includes('can you hear')) {
        dynamicReply = `Yes, I hear you loud and clear! I was just reflecting on what you mentioned earlier. How's the rest of your day going?`;
        dynamicTrans = `Có chứ, mình nghe bạn rất rõ ràng luôn nè! Mình vừa đang suy nghĩ về điều bạn nói trước đó. Phần còn lại của ngày hôm nay của bạn thế nào rồi?`;
        emotion = 'encouraging';
      } else if (lower.includes('tired') || lower.includes('busy') || lower.includes('work') || lower.includes('stress')) {
        dynamicReply = "Oh man, I totally feel you! Life can be pretty overwhelming sometimes. Hope you get some good downtime soon!";
        dynamicTrans = "Ôi mình đồng cảm ghê! Cuộc sống đôi khi thật bận rộn. Mong bạn sớm có thời gian nghỉ ngơi thư giãn nhé!";
        emotion = 'encouraging';
      } else if (lower.includes('coffee') || lower.includes('cafe')) {
        dynamicReply = "Ah, coffee is the best! Are you an iced coffee fan or do you prefer hot drinks like lattes?";
        dynamicTrans = "A, cà phê là chân ái luôn! Bạn là fan cà phê đá hay thích các món ấm như latte hơn?";
        emotion = 'happy';
      }

      return res.json({
        success: true,
        data: {
          replyText: dynamicReply,
          emotion,
          translationVi: dynamicTrans,
          suggestedResponses: [
            "I usually love having a cup in the morning to wake up.",
            "Mostly just relaxing at home and taking it easy.",
            "I really enjoy learning new things in my free time.",
          ],
          nativePolishUpgrade: {
            originalText: lastUserMessage,
            polishedText: lastUserMessage.length > 5 ? `To be honest, ${lastUserMessage}` : lastUserMessage,
            explanationVi: 'Thêm từ mở đầu tự nhiên giúp câu nói nghe mềm mại và thân mật hơn.',
          },
          detectedVocabWords: [],
        },
      });
    }
  } catch (error: any) {
    console.error('Fatal error in handleCoffeeChatReply:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi xử lý cuộc trò chuyện' });
  }
}

/**
 * Endpoint for AI Daily Coffee Chat Session Recap
 */
export async function handleCoffeeChatRecap(req: Request, res: Response) {
  try {
    const { messages, durationSeconds, personaName, topic, approxWpm = 0, userWordCount = 0 } = req.body;

    const chatHistoryFormatted = (messages || [])
      .map((m: any) => `${m.sender === 'user' ? 'User' : personaName || 'AI'}: ${m.text}`)
      .join('\n');

    const prompt = `
Analyze this casual daily English conversation between the user and their AI partner ${personaName || 'Friend'}.
Topic: ${topic || 'Daily Chat'}
Duration: ${durationSeconds || 60} seconds
User word count: ~${userWordCount} words
Approx Speed: ${approxWpm} WPM

Chat History:
${chatHistoryFormatted}

INSTRUCTIONS:
Provide a friendly, encouraging, non-judgmental recap to motivate the user to keep speaking English daily.
Do NOT give harsh academic IELTS band scores; instead focus on fluency, conversational rhythm, natural expressions, and confidence.

Output strictly valid JSON conforming to the schema.
`;

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            durationSeconds: { type: Type.NUMBER },
            totalTurns: { type: Type.NUMBER },
            userWordCount: { type: Type.NUMBER },
            approxWpm: { type: Type.NUMBER },
            personaName: { type: Type.STRING },
            topic: { type: Type.STRING },
            overallCheerVi: { type: Type.STRING },
            fluencyScoreEstimate: { type: Type.STRING },
            highlightPhrases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phraseEn: { type: Type.STRING },
                  meaningVi: { type: Type.STRING },
                  context: { type: Type.STRING },
                },
                required: ['phraseEn', 'meaningVi', 'context'],
              },
            },
            gentleTipsVi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            encouragingFeedbackVi: { type: Type.STRING },
          },
          required: [
            'overallCheerVi',
            'fluencyScoreEstimate',
            'highlightPhrases',
            'gentleTipsVi',
            'encouragingFeedbackVi',
          ],
        },
      },
    });

    const parsed = safeParseAiJson(response.text, {});
    return res.json({
      success: true,
      data: {
        ...parsed,
        durationSeconds: durationSeconds || 0,
        totalTurns: messages ? Math.floor(messages.length / 2) : 0,
        userWordCount: userWordCount || 0,
        approxWpm: approxWpm || 0,
        personaName: personaName || 'Alex',
        topic: topic || 'Daily Chat',
      },
    });
  } catch (error: any) {
    console.error('Error in handleCoffeeChatRecap:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi tổng kết phiên trò chuyện tự do' });
  }
}
