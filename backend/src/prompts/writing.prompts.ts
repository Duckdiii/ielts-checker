import { Type } from '../services/gemini.service';

export function getEvaluateWritingPrompt(payload: {
  taskType: 'task1_academic' | 'task1_general' | 'task2_essay';
  promptTopic?: string;
  promptQuestion?: string;
  essayText: string;
  targetWords?: string[];
  targetBand?: number;
}): string {
  const {
    taskType,
    promptTopic = 'General Academic Topic',
    promptQuestion = 'Discuss both views and give your opinion',
    essayText,
    targetWords = [],
    targetBand = 8.0,
  } = payload;

  const isTask1 = taskType === 'task1_academic' || taskType === 'task1_general';

  return `You are a Senior Cambridge IELTS Writing Examiner & Master Academic Writing Coach.
Evaluate the candidate's IELTS Writing submission rigorously and provide actionable Band 8.5+ lexical upgrades.

Task Details:
- Task Type: ${isTask1 ? 'IELTS Writing Task 1 (Report / Letter - 150 words minimum)' : 'IELTS Writing Task 2 (Academic Essay - 250 words minimum)'}
- Topic: "${promptTopic}"
- Prompt Question: "${promptQuestion}"
- Target Lexical Words to Weave In: ${JSON.stringify(targetWords)}
- Target Band Goal: ${targetBand}

Candidate's Submission:
"""
${essayText}
"""

Assessment Instructions:
1. Word Count & Task Fulfilment: Calculate exact word count. Flag if underlength (<150 for Task 1, <250 for Task 2).
2. Cambridge 4-Criteria Band Scoring (0.0 - 9.0 in 0.5 increments):
   - ${isTask1 ? 'Task Achievement (TA)' : 'Task Response (TR)'}: Evaluate argument depth, thesis clarity, paragraph balance.
   - Coherence & Cohesion (CC): Evaluate paragraph progression, cohesive devices, referencing.
   - Lexical Resource (LR): Assess academic vocabulary, collocations, precision, and redundancy.
   - Grammatical Range & Accuracy (GRA): Assess sentence complexity, clause structures, punctuation.
   - Overall Band Score.
3. 🔴 Lexical Heatmap & Repetitive / Basic Word Replacements:
   - Identify weak, repetitive, or informal words in candidate's text (e.g. "important", "make people", "good", "bad", "show", "many").
   - Provide high-band academic collocation replacements (C1/C2 level) with clear explanationVi.
4. 🛠️ Paragraph-by-Paragraph Diagnostic:
   - Break down each paragraph of the candidate's essay with specific strengths and areas to upgrade.
5. ✨ Full Band 8.5+ Master Rewrite:
   - Rewrite the entire essay into a polished, high-scoring Band 8.5+ Cambridge model answer preserving the candidate's original stance and arguments.
   - Highlight key academic collocations used in 'keyCollocationsUsed'.
6. 🎯 Actionable Improvement Checklist:
   - 3 concrete, high-leverage steps the candidate can take in their next essay to reach Band 8.0+.

Respond in JSON format adhering strictly to schema.`;
}

export const EVALUATE_WRITING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    wordCount: { type: Type.NUMBER },
    isUnderlength: { type: Type.BOOLEAN },
    overallBand: { type: Type.NUMBER },
    criteriaScores: {
      type: Type.OBJECT,
      properties: {
        taskResponse: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedbackVi: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['score', 'feedbackVi', 'strengths', 'improvements'],
        },
        coherenceCohesion: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedbackVi: { type: Type.STRING },
            cohesiveDevicesUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            transitionGapsVi: { type: Type.STRING },
          },
          required: ['score', 'feedbackVi', 'cohesiveDevicesUsed'],
        },
        lexicalResource: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedbackVi: { type: Type.STRING },
            academicWordsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetWordsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetWordsMissed: { type: Type.ARRAY, items: { type: Type.STRING } },
            lexicalRepetitions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['score', 'feedbackVi', 'academicWordsFound', 'targetWordsUsed'],
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
                  correction: { type: Type.STRING },
                  explanationVi: { type: Type.STRING },
                },
                required: ['original', 'correction', 'explanationVi'],
              },
            },
          },
          required: ['score', 'feedbackVi', 'complexStructuresUsed', 'grammarErrors'],
        },
      },
      required: ['taskResponse', 'coherenceCohesion', 'lexicalResource', 'grammaticalRange'],
    },
    lexicalHeatmapReplacements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalPhrase: { type: Type.STRING },
          academicUpgrade: { type: Type.STRING },
          cefrLevel: { type: Type.STRING },
          explanationVi: { type: Type.STRING },
          sampleContext: { type: Type.STRING },
        },
        required: ['originalPhrase', 'academicUpgrade', 'cefrLevel', 'explanationVi', 'sampleContext'],
      },
    },
    paragraphBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          paragraphNumber: { type: Type.NUMBER },
          originalText: { type: Type.STRING },
          analysisVi: { type: Type.STRING },
          upgradedVersion: { type: Type.STRING },
        },
        required: ['paragraphNumber', 'originalText', 'analysisVi', 'upgradedVersion'],
      },
    },
    band8ModelRewrite: {
      type: Type.OBJECT,
      properties: {
        fullText: { type: Type.STRING },
        vietnameseTranslation: { type: Type.STRING },
        keyCollocationsUsed: {
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
      },
      required: ['fullText', 'vietnameseTranslation', 'keyCollocationsUsed'],
    },
    examinerGeneralVerdictVi: { type: Type.STRING },
    actionableImprovementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'wordCount',
    'isUnderlength',
    'overallBand',
    'criteriaScores',
    'lexicalHeatmapReplacements',
    'paragraphBreakdown',
    'band8ModelRewrite',
    'examinerGeneralVerdictVi',
    'actionableImprovementTips',
  ],
};

export function getGenerateWritingPrompt(payload: {
  taskType: 'task1_academic' | 'task1_general' | 'task2_essay';
  topic?: string;
  vocabTerms?: string[];
}): string {
  const { taskType, topic = 'Technology and Society', vocabTerms = [] } = payload;
  const isTask1 = taskType === 'task1_academic' || taskType === 'task1_general';

  return `You are a Cambridge IELTS Test Item Writer.
Generate an authentic, high-yield IELTS Writing prompt.

Parameters:
- Task: ${isTask1 ? 'Writing Task 1 (Academic Chart/Graph description or General Letter)' : 'Writing Task 2 (Academic Essay)'}
- Topic: "${topic}"
- Available Target Vocabulary: ${JSON.stringify(vocabTerms.slice(0, 8))}

Requirements:
1. 'promptText': Real Cambridge style IELTS Writing prompt.
2. 'essayType': e.g. "Opinion Essay (Agree/Disagree)", "Discussion Essay (Discuss both views)", "Problem-Solution", "Line Graph Report", etc.
3. 'suggestedCollocations': 4-6 high-band collocations from the vocabulary pool.
4. 'fourStepOutline': Outline guidance (Introduction, Body 1, Body 2, Conclusion) with key arguments in Vietnamese.

Respond in JSON format adhering strictly to schema.`;
}

export const GENERATE_WRITING_PROMPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    taskType: { type: Type.STRING },
    topic: { type: Type.STRING },
    promptText: { type: Type.STRING },
    essayType: { type: Type.STRING },
    suggestedCollocations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          meaningVi: { type: Type.STRING },
          sampleUsage: { type: Type.STRING },
        },
        required: ['phrase', 'meaningVi', 'sampleUsage'],
      },
    },
    fourStepOutline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          goalVi: { type: Type.STRING },
          keyPointsVi: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['section', 'goalVi', 'keyPointsVi'],
      },
    },
  },
  required: ['id', 'taskType', 'topic', 'promptText', 'essayType', 'suggestedCollocations', 'fourStepOutline'],
};
