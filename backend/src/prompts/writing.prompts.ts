import { Type } from '../services/gemini.service';

/**
 * 1. Essay Evaluation Prompt & Schema (4 Cambridge Criteria)
 */
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
   - Sentence Diversity: Count simple, compound, and complex sentences.
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
    sentenceDiversity: {
      type: Type.OBJECT,
      properties: {
        simpleSentencePercent: { type: Type.NUMBER },
        compoundSentencePercent: { type: Type.NUMBER },
        complexSentencePercent: { type: Type.NUMBER },
        commentaryVi: { type: Type.STRING },
      },
      required: ['simpleSentencePercent', 'compoundSentencePercent', 'complexSentencePercent', 'commentaryVi'],
    },
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

/**
 * 2. Generate Writing Prompt
 */
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

/**
 * 3. AI Essay Architect: 4-Paragraph Outline Generator
 */
export function getEssayOutlinePrompt(payload: {
  taskType: string;
  topic: string;
  promptQuestion: string;
  userStance?: string;
  targetWords?: string[];
}): string {
  const { taskType, topic, promptQuestion, userStance = 'balanced / clear opinion', targetWords = [] } = payload;

  return `You are a Senior IELTS Writing Master Coach.
Create a structured 4-paragraph outline with thesis statement and key academic arguments for the candidate's IELTS Writing topic.

Parameters:
- Task: ${taskType}
- Topic: "${topic}"
- Question: "${promptQuestion}"
- Candidate Stance: "${userStance}"
- Active Vocabulary to integrate: ${JSON.stringify(targetWords.slice(0, 10))}

Provide:
1. Thesis Statement (clear, Band 8.5 academic phrasing).
2. Introduction Outline (Background Hook + Paraphrased Question + Thesis Statement).
3. Body Paragraph 1 (Topic Sentence, Explanation, Specific Real-World Example, Closing Link).
4. Body Paragraph 2 (Topic Sentence, Explanation, Specific Real-World Example, Closing Link).
5. Conclusion Outline (Restatement of Thesis + Future Outlook / Summary).
6. 6 High-Band Collocations with Vietnamese meanings.

Respond in JSON adhering to schema.`;
}

export const ESSAY_OUTLINE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    thesisStatement: { type: Type.STRING },
    thesisStatementVi: { type: Type.STRING },
    introduction: {
      type: Type.OBJECT,
      properties: {
        hookVi: { type: Type.STRING },
        paraphraseEn: { type: Type.STRING },
        thesisEn: { type: Type.STRING },
      },
      required: ['hookVi', 'paraphraseEn', 'thesisEn'],
    },
    body1: {
      type: Type.OBJECT,
      properties: {
        topicSentenceEn: { type: Type.STRING },
        topicSentenceVi: { type: Type.STRING },
        explanationVi: { type: Type.STRING },
        exampleEn: { type: Type.STRING },
        exampleVi: { type: Type.STRING },
        recommendedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['topicSentenceEn', 'topicSentenceVi', 'explanationVi', 'exampleEn', 'recommendedKeywords'],
    },
    body2: {
      type: Type.OBJECT,
      properties: {
        topicSentenceEn: { type: Type.STRING },
        topicSentenceVi: { type: Type.STRING },
        explanationVi: { type: Type.STRING },
        exampleEn: { type: Type.STRING },
        exampleVi: { type: Type.STRING },
        recommendedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['topicSentenceEn', 'topicSentenceVi', 'explanationVi', 'exampleEn', 'recommendedKeywords'],
    },
    conclusion: {
      type: Type.OBJECT,
      properties: {
        summaryEn: { type: Type.STRING },
        summaryVi: { type: Type.STRING },
        finalThoughtVi: { type: Type.STRING },
      },
      required: ['summaryEn', 'summaryVi', 'finalThoughtVi'],
    },
    suggestedCollocations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          meaningVi: { type: Type.STRING },
          applicableSection: { type: Type.STRING },
        },
        required: ['phrase', 'meaningVi', 'applicableSection'],
      },
    },
  },
  required: ['thesisStatement', 'thesisStatementVi', 'introduction', 'body1', 'body2', 'conclusion', 'suggestedCollocations'],
};

/**
 * 4. Inline Sentence Upgrader (Surgery)
 */
export function getSentenceUpgradePrompt(payload: {
  selectedText: string;
  contextSentence?: string;
  targetMode?: 'lexical_band8' | 'complex_grammar' | 'concise_academic' | 'all';
}): string {
  const { selectedText, contextSentence = '', targetMode = 'all' } = payload;

  return `You are an elite Cambridge IELTS Writing Editor.
Transform the candidate's highlighted phrase/sentence into 3 sophisticated Band 8.5+ variations.

Input:
- Selected Phrase / Sentence: "${selectedText}"
- Context in Essay: "${contextSentence}"
- Requested Focus: ${targetMode}

Generate:
1. 'lexicalVariation': Uses C1/C2 advanced vocabulary and high-yield collocations.
2. 'grammarVariation': Employs advanced sentence architecture (Inversion, Participle clause, Cleft sentence, or Conditional).
3. 'conciseVariation': Academic conciseness, removing fluff and improving punchiness.
4. Explanations in Vietnamese detailing why each version scores higher in IELTS criteria.

Respond in JSON adhering to schema.`;
}

export const SENTENCE_UPGRADE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    originalText: { type: Type.STRING },
    lexicalVariation: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        cefrLevel: { type: Type.STRING },
        explanationVi: { type: Type.STRING },
        keyCollocations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['text', 'cefrLevel', 'explanationVi', 'keyCollocations'],
    },
    grammarVariation: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        structureType: { type: Type.STRING },
        explanationVi: { type: Type.STRING },
      },
      required: ['text', 'structureType', 'explanationVi'],
    },
    conciseVariation: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        explanationVi: { type: Type.STRING },
      },
      required: ['text', 'explanationVi'],
    },
  },
  required: ['originalText', 'lexicalVariation', 'grammarVariation', 'conciseVariation'],
};

/**
 * 5. Micro-Writing Drill Evaluator (Intro, PEEL Body, Task 1 Overview)
 */
export function getMicroWritingEvalPrompt(payload: {
  drillType: 'intro_2min' | 'body_peel_5min' | 'task1_overview_3min';
  promptQuestion: string;
  submissionText: string;
}): string {
  const { drillType, promptQuestion, submissionText } = payload;

  return `You are an IELTS Writing Examiner conducting a rapid Micro-Writing drill evaluation.

Drill Type: ${drillType}
Prompt Question: "${promptQuestion}"
Candidate's Submission:
"""
${submissionText}
"""

Evaluate strictly on the specific drill target:
- 'intro_2min': Paraphrase accuracy + Thesis statement strength.
- 'body_peel_5min': PEEL logic (Point -> Explanation -> Example -> Link).
- 'task1_overview_3min': Clear general trend without detailing specific numbers.

Provide:
1. Micro Band Score (0-9.0).
2. Strengths & weaknesses in Vietnamese.
3. Upgraded Band 8.5+ version of their paragraph.

Respond in JSON adhering to schema.`;
}

export const MICRO_WRITING_EVAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    drillType: { type: Type.STRING },
    score: { type: Type.NUMBER },
    wordCount: { type: Type.NUMBER },
    feedbackVi: { type: Type.STRING },
    criteriaChecks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterion: { type: Type.STRING },
          passed: { type: Type.BOOLEAN },
          commentVi: { type: Type.STRING },
        },
        required: ['criterion', 'passed', 'commentVi'],
      },
    },
    upgradedVersion: { type: Type.STRING },
  },
  required: ['drillType', 'score', 'wordCount', 'feedbackVi', 'criteriaChecks', 'upgradedVersion'],
};

/**
 * 6. Cohesion & Linking Radar
 */
export function getCohesionRadarPrompt(payload: {
  essayText: string;
}): string {
  const { essayText } = payload;

  return `You are a Cambridge IELTS Coherence & Cohesion Specialist.
Analyze the cohesion, transitional devices, and logical flow of this essay.

Essay:
"""
${essayText}
"""

Assess:
1. Repeated / Overused transition words (e.g. "Moreover", "Furthermore", "On the other hand" overused).
2. Mechanical vs Natural linking ratio.
3. Cohesion Band Score (0-9.0).
4. Suggested natural native discourse markers.

Respond in JSON adhering to schema.`;
}

export const COHESION_RADAR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    cohesionBandScore: { type: Type.NUMBER },
    overusedTransitions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          count: { type: Type.NUMBER },
          naturalAlternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['word', 'count', 'naturalAlternatives'],
      },
    },
    mechanicalLinkingWarning: { type: Type.STRING },
    flowAnalysisVi: { type: Type.STRING },
    recommendedDiscourseMarkers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          purpose: { type: Type.STRING },
          exampleUsage: { type: Type.STRING },
        },
        required: ['phrase', 'purpose', 'exampleUsage'],
      },
    },
  },
  required: ['cohesionBandScore', 'overusedTransitions', 'mechanicalLinkingWarning', 'flowAnalysisVi', 'recommendedDiscourseMarkers'],
};
