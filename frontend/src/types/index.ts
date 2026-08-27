export type MasteryLevel = 'new' | 'learning' | 'reviewing' | 'mastered';

export type StudyMode =
  | 'flashcard'
  | 'quiz'
  | 'spelling'
  | 'word-family'
  | 'cloze'
  | 'timed-drill'
  | 'ai-booster'
  | 'speaking'
  | 'speaking-part2'
  | 'shadowing'
  | 'quick-drill'
  | 'speaking-portfolio'
  | 'weakness-radar'
  | 'vocab-gap'
  | 'full-mock-test'
  | 'area-expander'
  | 'emergency-stalling'
  | 'speech-ladder'
  | 'speech-upgrade'
  | 'idea-mindmap'
  | 'daily-chat'
  | 'list'
  | 'progress';

export interface VocabItem {
  id: string;
  term: string;                 // e.g. "untouched nature", "granted", "reinvigorate"
  ipa?: string;                 // e.g. "/ʌnˈtʌtʃt ˈneɪtʃər/", "/ˈɡræntɪd/"
  meaning: string;              // e.g. "thiên nhiên hoang sơ", "coi là hiển nhiên"
  wordFamily?: string;          // e.g. "touch (v), untouched (adj)"
  synonyms?: string;            // e.g. "pristine nature", "assumed, unquestioned"
  antonyms?: string;            // e.g. "polluted nature", "disputed"
  example?: string;             // e.g. "They celebrated the air and light of untouched nature."
  notes?: string;               // e.g. "🔗 đối chiếu với từ đã học ở bài trước" or collocation notes
  sourceSetId: string;          // Id of the set it belongs to
  cefrLevel?: 'B1' | 'B2' | 'C1' | 'C2';
  targetIeltsBand?: '6.0' | '6.5' | '7.0' | '7.5' | '8.0+';
  topic?: string;               // e.g. "Động vật & Thế giới tự nhiên", "Giáo dục & Học thuật", "Môi trường & Biến đổi khí hậu"
  
  // SRS & FSRS (Free Spaced Repetition Scheduler) state
  mastery: MasteryLevel;
  srsStage: number;             // 0 (new), 1, 2, 3, 4, 5 (mastered)
  nextReviewDate: number;       // timestamp in ms
  lastReviewedDate?: number;    // timestamp in ms
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  isBookmarked?: boolean;
  isUnlearned?: boolean; // Marked specifically by user as "Chưa thuộc / Cần học lại"
  fsrsState?: {
    stability: number;          // S in days
    difficulty: number;         // D (1 to 10)
    reps: number;
    lapses: number;
    lastReviewedDate: number;
    elapsedDays: number;
    scheduledDays: number;
  };
}

export interface WordSet {
  id: string;
  title: string;
  description?: string;
  sourceType: 'default' | 'pdf' | 'custom';
  fileName?: string;
  createdAt: number;
  totalWords: number;
  tags?: string[];
  mainTopic?: string;           // e.g. "Động vật & Sinh thái", "Giáo dục & Khoa học"
  topics?: string[];            // List of detected topics in this set
}

export interface StudyRecord {
  id: string;
  date: string;                  // YYYY-MM-DD or formatted string
  wordsStudied: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number;
  mode: 'flashcard' | 'quiz' | 'spelling' | 'word-family' | 'cloze' | 'timed-drill' | 'ai-practice' | 'speaking' | 'speaking-part2' | 'shadowing' | 'quick-speaking-drill';
}

export interface UserProgress {
  streakDays: number;
  lastStudyDate: string;        // YYYY-MM-DD
  totalReviews: number;
  overallAccuracy: number;
  estimatedBand: number;        // e.g. 6.5, 7.0, 7.5, 8.0
  studyHistory: StudyRecord[];
}

export type StudyGoal =
  | 'study_abroad'      // Du học đại học / thạc sĩ
  | 'immigration'       // Định cư nước ngoài
  | 'work_career'       // Phát triển sự nghiệp & Làm việc quốc tế
  | 'graduation'        // Chuẩn đầu ra tốt nghiệp Đại học
  | 'general_fluency'   // Tự tin giao tiếp chuẩn học thuật
  | 'custom';           // Mục tiêu tùy biến khác

export type DailyTimeBudget = 15 | 30 | 45 | 60 | 90;

export type PreferredStudyTime = 'morning' | 'afternoon' | 'evening' | 'night';

export type PrioritySkill =
  | 'vocabulary_srs'
  | 'speaking_part1_2_3'
  | 'pronunciation_shadowing'
  | 'reflex_drills'
  | 'band_booster';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  avatarSeed?: string;

  // Learning Targets & Plan
  currentBand: number;           // e.g. 5.5, 6.0
  targetBand: number;            // e.g. 7.0, 7.5, 8.0
  targetExamDate?: string;       // YYYY-MM-DD
  studyGoal: StudyGoal;
  goalDescription?: string;
  dailyBudgetMinutes: DailyTimeBudget;
  preferredStudyTime: PreferredStudyTime;

  // Interests & Priority Focus
  interestedTopics: string[];    // e.g. ["Môi trường & Biến đổi khí hậu", "Công nghệ & AI"]
  prioritySkills: PrioritySkill[];

  // Gamification
  unlockedBadges: string[];
  experiencePoints: number;
  level: number;

  // AI Personalized Insights
  aiPersonalizedAdvice?: string;
  aiSuggestedFocus?: string[];
  lastPersonalizedUpdate?: number;

  createdAt: number;
  updatedAt: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'vocab' | 'speaking' | 'accuracy' | 'level' | 'mastery';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AIWordExpansion {
  term: string;
  ipa?: string;
  meaningVi: string;
  ieltsBand: string;
  academicRegister?: string;
  wordFamily?: Array<{
    word: string;
    type: string;
    meaning: string;
  }>;
  synonymsWithNuance: Array<{
    word: string;
    ipa?: string;
    meaningVi: string;
    band: string;
    nuance: string;             // Difference in usage/register
    collocation: string;
    example?: string;
  }>;
  antonyms?: Array<{
    word: string;
    meaningVi: string;
  }>;
  highBandCollocations: Array<{
    collocation: string;
    meaningVi: string;
    example: string;
  }>;
  commonMistakes: string;
  ieltsSpeakingWritingTip: string;
}

export interface AIEvaluationResult {
  originalSentence: string;
  targetWordsUsed: string[];
  grammarScore: number;         // Out of 9.0
  lexicalScore: number;         // Out of 9.0
  overallBand: number;          // Out of 9.0
  feedbackVi: string;
  errorsIdentified: Array<{
    error: string;
    correction: string;
    explanationVi: string;
  }>;
  band8Upgrade: {
    sentence: string;
    explanationVi: string;
    keyCollocations: string[];
  };
}

export interface AIReadingPassage {
  title: string;
  topic: string;
  passage: string;
  targetWordsIncluded: string[];
  questions: Array<{
    id: string;
    type: 'multiple-choice' | 'true-false-not-given' | 'sentence-completion';
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanationVi: string;
  }>;
}

export interface AIStudyAdvisorResult {
  progressEvaluation: string;
  weakWordsStrategy: string;
  priorityWordsToReview: string[];
  recommendedCollocations: string[];
  actionableTips: string[];
  recommendedNextTopics: string[];
  motivationalQuoteVi?: string;
}

export interface AIPronunciationFeedback {
  term: string;
  transcription?: string;
  score: number; // 0 - 100
  accuracyGrade: 'Xuất sắc' | 'Tốt' | 'Cần cải thiện' | 'Chưa chuẩn';
  stressCorrect: boolean;
  feedbackVi: string;
  specificErrors: string[];
  ieltsSpeakingTips: string;
  phoneticTips?: string;
}

export interface SpeakingQuestion {
  id: string;
  part: 1 | 2 | 3;
  topic: string;
  questionText: string;
  subPrompts?: string[]; // For Part 2 Cue Cards (You should say: ...)
  suggestedVocab: string[];
  suggestedIdeas?: string[];
  powerCollocations?: string[]; // High-scoring collocations specifically for this cue card
  idioms?: string[]; // Topic-specific idioms
  storyFrameworkTips?: Array<{ phase: string; timeRange: string; guide: string }>;
}

export interface MandatoryWordChallengeItem {
  term: string;
  ipa?: string;
  meaningVi: string;
  ieltsBand?: string;
  collocation?: string;
  samplePhraseVi?: string;
}

export interface MandatoryWordEvaluation {
  term: string;
  used: boolean;
  correctGrammar: boolean;
  correctCollocationAndRegister: boolean;
  contextSentence?: string;
  feedbackVi: string;
  suggestedUpgradeVi?: string;
}

export interface AcademicStallingFiller {
  phrase: string;
  situationVi: string; // e.g. "Khi cần 2-3s câu giờ để tổ chức luận điểm"
  sampleContext: string;
}

export interface DeadSilencePause {
  approximateDuration: string; // e.g. "3.5 giây"
  aroundPhrase: string; // e.g. "sau khi nhắc đến 'traffic congestion'"
  recommendedFiller: string; // e.g. "That is quite an intriguing question to ponder..."
  fillerMeaningVi: string;
}

export interface SpeakingEvaluationResult {
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  transcript: string;
  durationSeconds: number;
  targetWordsUsed: string[];
  targetWordsMissed: string[];
  overallBand: number; // e.g. 6.5, 7.0, 7.5, 8.0, 8.5
  criteriaScores: {
    fluencyCoherence: {
      score: number; // 0 - 9.0
      feedbackVi: string;
      speedPacing: 'Too slow' | 'Natural' | 'Rushed';
      wordsPerMinute: number; // e.g. 145
      speechRateVerdictVi: string; // e.g. 'Tốc độ vàng lý tưởng (130-160 WPM)', 'Quá chậm (<100 WPM)', 'Quá nhanh (>180 WPM)'
      hesitationsCommentVi?: string;
      hesitationsCount?: number;
      deadSilencePausesCount?: number;
      deadSilencePauses?: DeadSilencePause[];
      fillerWordsFound?: string[]; // e.g. ["uh (3x)", "um (2x)", "like (4x)"]
      academicFillerRecommendations?: AcademicStallingFiller[];
    };
    lexicalResource: {
      score: number; // 0 - 9.0
      feedbackVi: string;
      academicWordsUsed: string[];
      collocationsUsed: string[];
      missedOpportunitiesVi?: string;
      praisedHighlights?: Array<{ term: string; explanationVi: string }>;
    };
    grammaticalRange: {
      score: number; // 0 - 9.0
      feedbackVi: string;
      complexStructuresUsed: string[];
      grammarErrors: Array<{
        original: string;
        corrected: string;
        explanationVi: string;
      }>;
    };
    pronunciation: {
      score: number; // 0 - 9.0
      feedbackVi: string;
      intonationFeedbackVi: string;
      trickyWords: Array<{
        word: string;
        ipa: string;
        tipVi: string;
      }>;
    };
  };
  overallFeedbackVi: string;
  band8ModelAnswer: {
    answer: string;
    vietnameseTranslation: string;
    keyCollocations: string[];
    explanationVi: string;
  };
  mandatoryVocabEvaluations?: MandatoryWordEvaluation[];
  actionableImprovementTips: string[];
}

export interface SpeakingPortfolioItem {
  id: string;
  timestamp: number; // epoch ms
  dateFormatted: string; // e.g. "19/08/2026 21:15"
  mode: 'mock-examiner' | 'part2-trainer' | 'quick-drill' | 'shadowing';
  part: 1 | 2 | 3 | 'drill' | 'shadowing';
  topic: string;
  question: string;
  transcript: string;
  audioBlob?: Blob;
  audioBase64?: string;
  audioUrl?: string;
  durationSeconds: number;
  overallBand: number; // e.g. 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5
  criteriaScores: {
    fluency: number;
    lexical: number;
    grammar: number;
    pronunciation: number;
    wordsPerMinute?: number;
    hesitationsCount?: number;
    deadSilencePausesCount?: number;
  };
  targetWordsUsed: string[];
  targetWordsMissed: string[];
  mandatoryVocabEvaluations?: MandatoryWordEvaluation[];
  evalResult?: SpeakingEvaluationResult | QuickSpeakingDrillEvaluationResult | ShadowingEvaluationResult;
  isFavorite?: boolean;
  notes?: string;
  tags?: string[];
}

export interface SavedSpeakingAttempt {
  id: string;
  date: string;
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  transcript: string;
  overallBand: number;
  result: SpeakingEvaluationResult;
}

export interface ShadowingEndingSoundItem {
  word: string;
  sound: string; // e.g. "/s/", "/t/", "/ed/", "/k/"
  status: 'accurate' | 'missed' | 'weak';
  tipVi: string;
}

export interface ShadowingStressItem {
  word: string;
  isStressed: boolean;
  status: 'correct' | 'understressed' | 'overstressed';
  explanationVi: string;
}

export interface ShadowingConnectedSpeechItem {
  phrase: string;
  ruleType: string; // e.g. "Consonant to Vowel Linking", "Linking /r/", "Flap T", "Elision"
  howToSay: string;
  userExecutedCorrectly: boolean;
  guideVi: string;
}

export interface ShadowingWordFeedback {
  word: string;
  accuracyScore: number; // 0 - 100
  status: 'perfect' | 'minor_issue' | 'needs_work';
  commentVi?: string;
}

export interface ShadowingEvaluationResult {
  originalSentence: string;
  userTranscript: string;
  targetAccent: 'US' | 'UK' | 'AU';
  similarityScore: number; // 0 - 100
  overallGrade: string; // e.g. "Bản Xứ 9.0", "Rất Tốt 8.0+", "Khá 6.5-7.0", "Cần Luyện Thêm"
  intonationRating: string; // e.g. "Tự nhiên & Uyển chuyển", "Tương đối tốt", "Còn đều đều (Monotone)"
  intonationFeedbackVi: string;
  thoughtGroupsGuide: string[]; // e.g. ["The exponential growth // of urban areas // poses an unprecedented challenge..."]
  endingSoundsAnalysis: ShadowingEndingSoundItem[];
  sentenceStressAnalysis: ShadowingStressItem[];
  connectedSpeechAnalysis: ShadowingConnectedSpeechItem[];
  wordByWordFeedback: ShadowingWordFeedback[];
  vietnameseSummary: string;
  practiceDrill: string[];
}

export interface QuickDrillQuestion {
  id: string;
  question: string;
  topic: string;
  starterIdeaVi: string;
  suggestedVocab: string[];
  sampleBand8Response: string;
  sampleBand8Translation: string;
}

export interface QuickSpeakingDrillEvaluationResult {
  question: string;
  transcript: string;
  durationSeconds?: number;
  wordsPerMinute?: number;
  speechRateVerdictVi?: string; // e.g. 'Tốc độ vàng 145 WPM', 'Hơi chậm 95 WPM', 'Quá nhanh 190 WPM'
  deadSilencePausesCount?: number;
  fluencyScore: number; // 0 - 100
  estimatedBand: number; // e.g. 7.5
  directnessRating: string; // e.g. 'Phản xạ trực tiếp & sắc bén', 'Tương đối trực tiếp', 'Vòng vo hoặc dịch nhẩm'
  responseTimeGrade: string; // e.g. 'Phản xạ tức thì', 'Mượt mà', 'Còn ngập ngừng'
  fillerWordsFound: string[];
  recommendedStallingFillers?: AcademicStallingFiller[];
  grammaticalFeedbackVi: string;
  lexicalUpgrades: Array<{
    userPhrase: string;
    nativeAlternative: string;
    explanationVi: string;
  }>;
  quickModelResponse: {
    answer: string;
    vietnameseTranslation: string;
    whyItScoresHigh: string;
  };
  mandatoryVocabEvaluations?: MandatoryWordEvaluation[];
  coachAdviceVi: string;
}

// ==========================================
// 🛑 5. SỔ TAY "BẪY LỖI CÁ NHÂN" (WEAKNESS RADAR)
// ==========================================
export type WeaknessCategory =
  | 'grammar_tenses'
  | 'grammar_agreement'
  | 'pronunciation_endings'
  | 'pronunciation_stress'
  | 'fluency_fillers'
  | 'fluency_silence'
  | 'lexical_collocation'
  | 'lexical_repetition';

export interface LearnerWeaknessItem {
  id: string;
  title: string;
  category: WeaknessCategory;
  categoryLabelVi: string;
  frequencyCount: number;
  severity: 'critical' | 'moderate' | 'minor';
  warningHeadline: string;
  detailedExplanationVi: string;
  cambridgeExaminerDeductionVi: string;
  examplesFromUser: Array<{
    id?: string;
    context: string;
    errorPart: string;
    correction: string;
    date: string;
    partName?: string;
  }>;
  prescribedDrill: {
    instructionVi: string;
    targetRule: string;
    practicePrompts: Array<{
      prompt: string;
      modelCorrectionVi: string;
      targetFocus: string;
    }>;
  };
  status: 'active' | 'improving' | 'mastered';
  lastOccurredTimestamp: number;
}

// ==========================================
// ⏱️ 6. THI THỬ TRỌN VẸN 15 PHÚT (FULL MOCK TEST)
// ==========================================
export interface FullMockTestTurn {
  id: string;
  part: 1 | 2 | 3;
  partTitleVi: string;
  topic: string;
  questionText: string;
  subPrompts?: string[];
  transcript: string;
  durationSeconds: number;
  audioBlob?: Blob;
  audioUrl?: string;
  evalResult?: SpeakingEvaluationResult;
}

export interface FullMockTestSession {
  id: string;
  timestamp: number;
  candidateName: string;
  candidateNumber: string;
  testDateFormatted: string;
  targetBand: number;
  accent: 'US' | 'UK' | 'AU';
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
  totalSpeakingDurationSeconds: number;
  turns: FullMockTestTurn[];
  examinerSummaryFeedbackVi: string;
  examinerOfficialRemarksEn: string;
  staminaAndPacingVerdictVi: string;
  topStrengthsVi: string[];
  topWeaknessesVi: string[];
  cefrLevel: 'B1' | 'B2' | 'C1' | 'C2';
  targetWordsEmployedCount: number;
}

// ==========================================
// 🏗️ 7. MÁY GỢI Ý KÉO DÀI CÂU TRẢ LỜI (AREA / PEEL ANSWER EXPANDER)
// ==========================================
export type AnswerExpansionFormula = 'AREA' | 'PEEL';

export interface AreaStepItem {
  key: 'A' | 'R' | 'E' | 'A2' | 'P' | 'E1' | 'E2' | 'L';
  stepNameEn: string;
  stepNameVi: string;
  descriptionVi: string;
  band8SentenceStarters: string[];
  generatedContent?: string;
  generatedContentVi?: string;
  userSpeechSnippet?: string;
  isComplete?: boolean;
}

export interface AreaExpansionResult {
  question: string;
  topic: string;
  formula: AnswerExpansionFormula;
  shortAnswerRaw?: string;
  steps: {
    answer: {
      stepLabel: string;
      sentenceStarters: string[];
      modelSentenceEn: string;
      modelSentenceVi: string;
      focusTipVi: string;
    };
    reason: {
      stepLabel: string;
      sentenceStarters: string[];
      modelSentenceEn: string;
      modelSentenceVi: string;
      focusTipVi: string;
    };
    example: {
      stepLabel: string;
      sentenceStarters: string[];
      modelSentenceEn: string;
      modelSentenceVi: string;
      focusTipVi: string;
    };
    alternativeOrFuture: {
      stepLabel: string;
      sentenceStarters: string[];
      modelSentenceEn: string;
      modelSentenceVi: string;
      focusTipVi: string;
    };
  };
  fullExpandedAnswerEn: string;
  fullExpandedAnswerVi: string;
  targetVocabHighlight: Array<{
    word: string;
    meaningVi: string;
    bandScore: string;
  }>;
  cohesiveDevicesUsed: string[];
  estimatedSpeakingSeconds: number;
}

export interface AreaEvaluationResult {
  overallBandScore: number;
  coverageCheck: {
    hasDirectAnswer: boolean;
    hasClearReason: boolean;
    hasVividExample: boolean;
    hasAlternativeOrFuture: boolean;
    scoreOutOf4: number;
  };
  fluencyGainSeconds: number;
  verdictVi: string;
  strengthsVi: string[];
  improvementsVi: string[];
  upgradedAnswerBand8: string;
}

// ==========================================
// 🛡️ 8. BỘ PHAO CỨU SINH KHI BÍ Ý & MINIGAME NÓI 30S KHÔNG NGẮT QUÃNG
// ==========================================
export type StallingCategoryKey =
  | 'need_time_to_think'
  | 'clarify_or_paraphrase_question'
  | 'no_prior_opinion'
  | 'pivot_or_alternative_view'
  | 'struggling_for_word'
  | 'concluding_smoothly';

export interface StallingPhraseItem {
  id: string;
  phraseEn: string;
  meaningVi: string;
  howToUseVi: string;
  category: StallingCategoryKey;
  bandScore: string;
  audioExampleEn?: string;
}

export interface StallingCategoryGroup {
  key: StallingCategoryKey;
  nameVi: string;
  nameEn: string;
  icon: string;
  descriptionVi: string;
  phrases: StallingPhraseItem[];
}

export interface ContinuousSpeechMinigameQuestion {
  id: string;
  topic: string;
  question: string;
  requiredConnectors: string[];
  challengeDurationSeconds: number;
}

// ==========================================
// 🎯 9. LUYỆN NÓI TĂNG TIẾN 3 CẤP ĐỘ (PROGRESSIVE SPEECH LADDER: 30s ➔ 60s ➔ 90s/120s)
// ==========================================
export type SpeechLadderLevel = 1 | 2 | 3;

export interface SpeechLadderPrompt {
  id: string;
  topic: string;
  part: 1 | 2 | 3;
  questionText: string;
  cueCardPoints?: string[];
  level1Guide: {
    targetDuration: string;
    targetSeconds: number;
    goalVi: string;
    starterTemplate: string;
    sampleBand7Response: string;
    keyPointsVi: string[];
  };
  level2Guide: {
    targetDuration: string;
    targetSeconds: number;
    goalVi: string;
    starterTemplate: string;
    sampleBand7Response: string;
    keyPointsVi: string[];
  };
  level3Guide: {
    targetDuration: string;
    targetSeconds: number;
    goalVi: string;
    starterTemplate: string;
    sampleBand7Response: string;
    keyPointsVi: string[];
  };
  recommendedVocab: {
    word: string;
    phonetic: string;
    meaningVi: string;
    level: string;
    collocation: string;
  }[];
}

export interface SpeechLadderEvaluationResult {
  level: SpeechLadderLevel;
  spokenDurationSeconds: number;
  wordCount: number;
  wordsPerMinute: number;
  bandEstimate: number;
  passedLevel: boolean;
  scoreBreakdown: {
    fluencyAndCoherence: number;
    lexicalResource: number;
    grammaticalRange: number;
    contentExpansion: number;
  };
  praisePointsVi: string[];
  growthSuggestionsVi: string[];
  suggestedExpansionToNextLevel: string;
  vocabularyUpgrades: {
    originalWordOrPhrase: string;
    upgradedAlternative: string;
    whyBetterVi: string;
  }[];
  scaffoldedNextLevelDraftEn: string;
}

// ==========================================
// 🪞 10. AI SPEECH UPGRADE & SHADOWING (Nâng cấp bản nói lên Band 8.0 & Shadowing)
// ==========================================
export interface SpeechUpgradeWordReplacement {
  originalText: string;
  improvedText: string;
  category: 'lexical' | 'grammar' | 'cohesion' | 'collocation';
  explanationVi: string;
}

export interface SpeechUpgradeSentencePair {
  id: string;
  originalSentence: string;
  upgradedBand8Sentence: string;
  breakdownVi: string;
  collocationsUsed: string[];
}

export interface AISpeechUpgradeResult {
  originalTranscript: string;
  upgradedBand8FullText: string;
  originalBandEstimate: number;
  upgradedBandEstimate: number;
  highlightedReplacements: SpeechUpgradeWordReplacement[];
  sentencePairs: SpeechUpgradeSentencePair[];
  nativeStylisticNotesVi: string[];
  keyCollocationsEarned: {
    phrase: string;
    meaningVi: string;
    cefrLevel: string;
  }[];
}

// ==========================================
// 💡 11. MÁY ĐỘNG NÃO Ý TƯỞNG THẦN TỐC (IDEA GENERATOR & 5-DIMENSION MINDMAP TOOLKIT)
// ==========================================
export type MindmapDimensionKey =
  | 'economic'
  | 'health_wellbeing'
  | 'environmental'
  | 'tech_convenience'
  | 'interpersonal';

export interface DimensionIdeaPoint {
  id: string;
  coreArgumentVi: string;
  coreArgumentEn: string;
  bulletDetailsEn: string[];
  powerCollocations: {
    phrase: string;
    phonetic?: string;
    meaningVi: string;
    cefrLevel: string;
  }[];
  sampleBand8Sentence: string;
}

export interface MindmapDimensionDetail {
  key: MindmapDimensionKey;
  nameVi: string;
  nameEn: string;
  icon: string;
  color: string;
  taglineVi: string;
  ideas: DimensionIdeaPoint[];
}

export interface Mindmap5DimensionsResult {
  topic: string;
  question: string;
  summaryOverviewVi: string;
  dimensions: {
    economic: MindmapDimensionDetail;
    health_wellbeing: MindmapDimensionDetail;
    environmental: MindmapDimensionDetail;
    tech_convenience: MindmapDimensionDetail;
    interpersonal: MindmapDimensionDetail;
  };
  synthesizedBand8Answer: string;
  proTipsForExaminerVi: string[];
}

// ==========================================
// ☕ 12. PHÒNG TRÒ CHUYỆN TỰ DO HÀNG NGÀY (AI DAILY COFFEE CHAT & FREE CONVERSATION)
// ==========================================
export type ChatPersonaId = 'alex' | 'emma' | 'sarah' | 'liam' | 'hannah';

export interface ChatPersona {
  id: ChatPersonaId;
  name: string;
  avatar: string;
  roleTitleVi: string;
  roleTitleEn: string;
  accent: 'US' | 'UK' | 'AU';
  personalityVi: string;
  descriptionVi: string;
  starterTopic: string;
  starterGreeting: string;
  starterGreetingVi: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  translationVi?: string;
  suggestedResponses?: string[];
  nativePolishUpgrade?: {
    originalText: string;
    polishedText: string;
    explanationVi: string;
    keyCollocations?: string[];
  };
  detectedVocabWords?: string[];
}

export interface CoffeeChatSessionRecap {
  durationSeconds: number;
  totalTurns: number;
  userWordCount: number;
  approxWpm: number;
  personaName: string;
  topic: string;
  overallCheerVi: string;
  fluencyScoreEstimate: string; // e.g. "Rất trôi chảy & Tự nhiên"
  highlightPhrases: {
    phraseEn: string;
    meaningVi: string;
    context: string;
  }[];
  gentleTipsVi: string[];
  encouragingFeedbackVi: string;
}

// ==========================================
// ✍️ 12. IELTS WRITING AI ASSISTANT & LEXICAL HEATMAP
// ==========================================
export type IeltsWritingTaskType = 'task1_academic' | 'task1_general' | 'task2_essay';

export interface WritingLexicalHeatmapItem {
  originalPhrase: string;
  academicUpgrade: string;
  cefrLevel: string;
  explanationVi: string;
  sampleContext: string;
}

export interface WritingParagraphDiagnostic {
  paragraphNumber: number;
  originalText: string;
  analysisVi: string;
  upgradedVersion: string;
}

export interface WritingEvaluationResult {
  wordCount: number;
  isUnderlength: boolean;
  overallBand: number;
  criteriaScores: {
    taskResponse: {
      score: number;
      feedbackVi: string;
      strengths: string[];
      improvements: string[];
    };
    coherenceCohesion: {
      score: number;
      feedbackVi: string;
      cohesiveDevicesUsed: string[];
      transitionGapsVi?: string;
    };
    lexicalResource: {
      score: number;
      feedbackVi: string;
      academicWordsFound: string[];
      targetWordsUsed: string[];
      targetWordsMissed: string[];
      lexicalRepetitions: string[];
    };
    grammaticalRange: {
      score: number;
      feedbackVi: string;
      complexStructuresUsed: string[];
      grammarErrors: Array<{
        original: string;
        correction: string;
        explanationVi: string;
      }>;
    };
  };
  lexicalHeatmapReplacements: WritingLexicalHeatmapItem[];
  paragraphBreakdown: WritingParagraphDiagnostic[];
  band8ModelRewrite: {
    fullText: string;
    vietnameseTranslation: string;
    keyCollocationsUsed: Array<{
      phrase: string;
      meaningVi: string;
      cefrLevel: string;
    }>;
  };
  examinerGeneralVerdictVi: string;
  actionableImprovementTips: string[];
}

export interface WritingPrompt {
  id: string;
  taskType: string;
  topic: string;
  promptText: string;
  essayType: string;
  suggestedCollocations: Array<{
    phrase: string;
    meaningVi: string;
    sampleUsage: string;
  }>;
  fourStepOutline: Array<{
    section: string;
    goalVi: string;
    keyPointsVi: string[];
  }>;
}

export interface EssayOutline {
  thesisStatement: string;
  thesisStatementVi: string;
  introduction: {
    hookVi: string;
    paraphraseEn: string;
    thesisEn: string;
  };
  body1: {
    topicSentenceEn: string;
    topicSentenceVi: string;
    explanationVi: string;
    exampleEn: string;
    exampleVi?: string;
    recommendedKeywords: string[];
  };
  body2: {
    topicSentenceEn: string;
    topicSentenceVi: string;
    explanationVi: string;
    exampleEn: string;
    exampleVi?: string;
    recommendedKeywords: string[];
  };
  conclusion: {
    summaryEn: string;
    summaryVi: string;
    finalThoughtVi: string;
  };
  suggestedCollocations: Array<{
    phrase: string;
    meaningVi: string;
    applicableSection: string;
  }>;
}

export interface SentenceUpgradeResult {
  originalText: string;
  lexicalVariation: {
    text: string;
    cefrLevel: string;
    explanationVi: string;
    keyCollocations: string[];
  };
  grammarVariation: {
    text: string;
    structureType: string;
    explanationVi: string;
  };
  conciseVariation: {
    text: string;
    explanationVi: string;
  };
}

export interface MicroWritingDrillResult {
  drillType: 'intro_2min' | 'body_peel_5min' | 'task1_overview_3min';
  score: number;
  wordCount: number;
  feedbackVi: string;
  criteriaChecks: Array<{
    criterion: string;
    passed: boolean;
    commentVi: string;
  }>;
  upgradedVersion: string;
}

export interface CohesionAnalysisResult {
  cohesionBandScore: number;
  overusedTransitions: Array<{
    word: string;
    count: number;
    naturalAlternatives: string[];
  }>;
  mechanicalLinkingWarning: string;
  flowAnalysisVi: string;
  recommendedDiscourseMarkers: Array<{
    phrase: string;
    purpose: string;
    exampleUsage: string;
  }>;
}

export interface WritingPortfolioItem {
  id: string;
  createdAt: number;
  taskType: IeltsWritingTaskType;
  topic: string;
  promptQuestion: string;
  essayText: string;
  wordCount: number;
  overallBand: number;
  criteriaScores: {
    taskResponse: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammaticalRange: number;
  };
  modelRewrite?: string;
}




