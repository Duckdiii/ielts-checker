import { Type } from '../services/gemini.service';

export function getEvaluateSpeakingAnswerPrompt(payload: {
  question: string;
  part?: number;
  topic?: string;
  transcript: string;
  durationSeconds?: number;
  targetWords?: string[];
}): string {
  const {
    question,
    part = 1,
    topic = 'General Academic',
    transcript,
    durationSeconds = 30,
    targetWords = [],
  } = payload;

  return `You are a Senior Cambridge IELTS Speaking Examiner and master IELTS coach.
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
   - Evaluate speech pacing (130-160 WPM ideal, <100 too slow, >180 too fast).
   - Detect Dead Silence Pauses (> 3 seconds unnatural breaks or pauses before answering).
   - Count hesitation filler words ('uh', 'um', 'er', 'like', 'you know') in 'fillerWordsFound' and 'hesitationsCount'.
2. Lexical Resource (LR) & Mandatory Vocabulary Challenge Assessment:
   - For each target word in ${JSON.stringify(targetWords)}, evaluate 'used', 'correctGrammar', 'correctCollocationAndRegister', 'contextSentence', 'feedbackVi', 'suggestedUpgradeVi' in 'mandatoryVocabEvaluations'.
3. Grammatical Range & Accuracy (GRA): List grammatical errors with exact original substring, correct replacement, and explanationVi.
4. Pronunciation & Intonation (P): Guidance on intonation, rhythm, tricky words with IPA.
5. Overall Band Score: 0.0 to 9.0 in standard 0.5 increments.
6. Upgraded Model Answer (Band 8.5+): Natural, polished 2-minute Cambridge Band 8.5+ model script with collocations and translation.
7. Actionable Tips: 3 concrete improvement steps in Vietnamese.

Respond in JSON format according to the schema.`;
}

export const EVALUATE_SPEAKING_ANSWER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    part: { type: Type.NUMBER },
    topic: { type: Type.STRING },
    transcript: { type: Type.STRING },
    durationSeconds: { type: Type.NUMBER },
    targetWordsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
    targetWordsMissed: { type: Type.ARRAY, items: { type: Type.STRING } },
    overallBand: { type: Type.NUMBER },
    criteriaScores: {
      type: Type.OBJECT,
      properties: {
        fluencyCoherence: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedbackVi: { type: Type.STRING },
            speedPacing: { type: Type.STRING, enum: ['Too slow', 'Natural', 'Rushed'] },
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
                required: ['approximateDuration', 'aroundPhrase', 'recommendedFiller', 'fillerMeaningVi'],
              },
            },
            fillerWordsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
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
          required: ['score', 'feedbackVi', 'speedPacing', 'wordsPerMinute', 'speechRateVerdictVi'],
        },
        lexicalResource: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedbackVi: { type: Type.STRING },
            academicWordsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            collocationsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
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
            complexStructuresUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
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
      required: ['fluencyCoherence', 'lexicalResource', 'grammaticalRange', 'pronunciation'],
    },
    overallFeedbackVi: { type: Type.STRING },
    band8ModelAnswer: {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING },
        vietnameseTranslation: { type: Type.STRING },
        keyCollocations: { type: Type.ARRAY, items: { type: Type.STRING } },
        explanationVi: { type: Type.STRING },
      },
      required: ['answer', 'vietnameseTranslation', 'keyCollocations', 'explanationVi'],
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
        required: ['term', 'used', 'correctGrammar', 'correctCollocationAndRegister', 'feedbackVi'],
      },
    },
    actionableImprovementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
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
};

export function getGenerateSpeakingQuestionPrompt(part: number, topic: string, vocabTerms: string[]): string {
  return `You are a Cambridge IELTS Speaking Examiner test designer.
Generate an authentic, high-quality IELTS Speaking question for Part ${part}.

Parameters:
- Part: Part ${part} ${part === 2 ? '(Cue Card with bullet points: You should say: ...)' : part === 3 ? '(In-depth two-way discussion)' : '(Short interview question)'}
- Topic: "${topic}"
- Available Vocabulary pool to weave in: ${JSON.stringify(vocabTerms.slice(0, 8))}

Requirements:
1. Question must follow real Cambridge IELTS test format.
2. For Part 2, provide 'subPrompts'.
3. Select 3 to 4 'suggestedVocab' words from the pool.
4. Provide 3 quick brainstorming ideas in 'suggestedIdeas'.
5. For Part 2 Cue Cards, provide 4-6 'powerCollocations', 2-3 'idioms', and 3 'storyFrameworkTips'.

Respond in JSON format according to schema.`;
}

export const GENERATE_SPEAKING_QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    part: { type: Type.NUMBER },
    topic: { type: Type.STRING },
    questionText: { type: Type.STRING },
    subPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedVocab: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
    powerCollocations: { type: Type.ARRAY, items: { type: Type.STRING } },
    idioms: { type: Type.ARRAY, items: { type: Type.STRING } },
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
};
