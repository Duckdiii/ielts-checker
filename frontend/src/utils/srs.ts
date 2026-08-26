import { MasteryLevel, VocabItem, UserProgress, StudyRecord } from '../types';

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

/**
 * FSRS Core Parameters (Free Spaced Repetition Scheduler)
 * S: Stability (thời gian tính bằng ngày mà xác suất truy xuất R >= 90%)
 * D: Difficulty (độ khó của thẻ từ 1 đến 10)
 * R: Retrievability (xác suất hồi tưởng hiện tại: R = (1 + factor * t / S)^(-w))
 */
export interface FSRSCardState {
  stability: number;       // S in days (e.g. 0.5, 2.4, 15.2)
  difficulty: number;      // D (1.0 = extremely easy, 10.0 = extremely difficult)
  reps: number;            // Total successful reviews
  lapses: number;          // Total memory lapses (failed reviews)
  lastReviewedDate: number;// Timestamp ms
  elapsedDays: number;     // Days since last review
  scheduledDays: number;   // Days scheduled for next review
}

export interface FSRSEvaluationInput {
  item: VocabItem;
  rating: SrsRating;
  responseTimeMs?: number; // Milliseconds taken by user to answer/flip
}

export interface FSRSReviewResult {
  mastery: MasteryLevel;
  srsStage: number;
  nextReviewDate: number;
  lastReviewedDate: number;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  fsrsState: FSRSCardState;
  retrievabilityPercent: number; // 0 - 100%
  recommendedReviewText: string;
}

// Default FSRS initial stability for [again, hard, good, easy]
const INIT_STABILITY = [0.4, 1.2, 3.2, 8.5];
const FACTOR = 19 / 81; // Decay factor for power-law forgetting curve

/**
 * Extract or compute default FSRS state from existing VocabItem
 */
export function getFsrsCardState(item: VocabItem): FSRSCardState {
  if (item.fsrsState) {
    const elapsedDays = item.lastReviewedDate
      ? Math.max(0, (Date.now() - item.lastReviewedDate) / (1000 * 60 * 60 * 24))
      : 0;
    return {
      ...item.fsrsState,
      elapsedDays,
    };
  }

  // Derive initial FSRS state from existing srsStage & mastery if not present
  const stage = item.srsStage || 0;
  const initStabilityByStage = [0.5, 1.5, 4.0, 10.0, 25.0, 60.0];
  const stab = initStabilityByStage[Math.min(stage, initStabilityByStage.length - 1)] || 1.0;
  
  let baseDiff = 5.0;
  if (item.targetIeltsBand === '8.0+') baseDiff = 7.5;
  else if (item.targetIeltsBand === '7.5') baseDiff = 6.5;
  else if (item.targetIeltsBand === '7.0') baseDiff = 5.5;
  else if (item.targetIeltsBand === '6.0') baseDiff = 4.0;

  const lapses = item.incorrectCount || 0;
  const reps = item.correctCount || 0;

  const elapsedDays = item.lastReviewedDate
    ? Math.max(0, (Date.now() - item.lastReviewedDate) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    stability: stab,
    difficulty: Math.min(10, Math.max(1, baseDiff + lapses * 0.5 - reps * 0.2)),
    reps,
    lapses,
    lastReviewedDate: item.lastReviewedDate || Date.now(),
    elapsedDays,
    scheduledDays: Math.round(stab),
  };
}

/**
 * Compute current memory retrievability probability R(t) = (1 + FACTOR * t / S)^(-0.5)
 */
export function calculateRetrievability(stability: number, elapsedDays: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1.0;
  const r = Math.pow(1 + (FACTOR * elapsedDays) / stability, -0.5);
  return Math.min(1.0, Math.max(0.01, r));
}

/**
 * FSRS Algorithm Scheduler
 * Factors in:
 * 1. Rating (Again=1, Hard=2, Good=3, Easy=4)
 * 2. Difficulty (D)
 * 3. Memory Stability (S)
 * 4. Response Time (Hesitation penalty: if > 6000ms, downgrade effective recall)
 */
export function calculateFSRSUpdate(
  item: VocabItem,
  rating: SrsRating,
  responseTimeMs?: number
): FSRSReviewResult {
  const now = Date.now();
  const state = getFsrsCardState(item);
  const currentRetrievability = calculateRetrievability(state.stability, state.elapsedDays);

  let grade = 3; // Good
  if (rating === 'again') grade = 1;
  else if (rating === 'hard') grade = 2;
  else if (rating === 'good') grade = 3;
  else if (rating === 'easy') grade = 4;

  // Response Time Penalty:
  // If user took > 6.5s to answer Good/Easy, they hesitated -> Treat as Harder recall
  let effectiveGrade = grade;
  let responsePenaltyApplied = false;
  if (responseTimeMs && responseTimeMs > 6500 && grade >= 3) {
    effectiveGrade = grade - 0.75; // Penalize stability growth
    responsePenaltyApplied = true;
  } else if (responseTimeMs && responseTimeMs < 2000 && grade >= 3) {
    effectiveGrade = grade + 0.3; // Swift recall bonus
  }

  // 1. Calculate New Difficulty (D)
  // D_new = D - w6 * (grade - 3) + mean_reversion
  const meanReversion = 0.1 * (5.0 - state.difficulty);
  const diffDelta = -(effectiveGrade - 3) * 0.75 + meanReversion;
  const newDifficulty = Math.min(10, Math.max(1, state.difficulty + diffDelta));

  // 2. Calculate New Stability (S)
  let newStability = state.stability;
  let isCorrect = true;
  let newReps = state.reps;
  let newLapses = state.lapses;

  if (grade === 1) {
    // Memory Lapse (Forget)
    isCorrect = false;
    newLapses += 1;
    newStability = Math.max(0.25, state.stability * 0.25 * Math.pow(newDifficulty, -0.3));
  } else {
    // Successful Recall
    newReps += 1;
    // Hard recall factor vs Easy recall factor
    const hardMultiplier = grade === 2 ? 1.2 : grade === 3 ? 2.5 : 4.2;
    // Retrievability boost: Recall when R is low gives higher stability boost (Desirable difficulty)
    const retrievabilityBonus = Math.max(1.0, 2.0 - currentRetrievability);
    
    // Stability increase
    const growth = hardMultiplier * Math.pow(newDifficulty, -0.4) * retrievabilityBonus;
    newStability = Math.max(0.5, state.stability * (1 + growth * 0.4));

    if (responsePenaltyApplied) {
      newStability = Math.max(0.5, newStability * 0.75); // Slow reflex penalty
    }
  }

  // Calculate next interval based on desired retention rate (90%)
  // t = S / FACTOR * ((0.9)^(-2) - 1) ~ S * 1.0 (approx scheduled days = S)
  let scheduledDays = Math.max(0.1, newStability);
  if (grade === 1) {
    scheduledDays = 0.01; // ~ 15 minutes
  } else if (scheduledDays < 1 && grade >= 2) {
    scheduledDays = 1.0; // minimum 1 day for non-lapses
  }

  const nextReviewDelayMs = Math.round(scheduledDays * 24 * 60 * 60 * 1000);
  const nextReviewDate = now + nextReviewDelayMs;

  // Derive Mastery Level from Stability & Reps
  let mastery: MasteryLevel = 'learning';
  let srsStage = 1;

  if (newStability >= 30 && newReps >= 4 && newLapses <= 1) {
    mastery = 'mastered';
    srsStage = 5;
  } else if (newStability >= 14 && newReps >= 3) {
    mastery = 'mastered';
    srsStage = 4;
  } else if (newStability >= 5) {
    mastery = 'reviewing';
    srsStage = 3;
  } else if (newStability >= 2) {
    mastery = 'reviewing';
    srsStage = 2;
  } else if (grade === 1) {
    mastery = 'learning';
    srsStage = 1;
  }

  const updatedState: FSRSCardState = {
    stability: Number(newStability.toFixed(2)),
    difficulty: Number(newDifficulty.toFixed(2)),
    reps: newReps,
    lapses: newLapses,
    lastReviewedDate: now,
    elapsedDays: 0,
    scheduledDays: Number(scheduledDays.toFixed(1)),
  };

  const newRetrievabilityPercent = Math.round(calculateRetrievability(newStability, 0) * 100);

  let recommendedReviewText = 'Hôm nay';
  if (scheduledDays >= 1) {
    recommendedReviewText = `Sau ${Math.round(scheduledDays)} ngày`;
  } else {
    recommendedReviewText = `Sau 15 phút`;
  }

  return {
    mastery,
    srsStage,
    nextReviewDate,
    lastReviewedDate: now,
    reviewCount: (item.reviewCount || 0) + 1,
    correctCount: (item.correctCount || 0) + (isCorrect ? 1 : 0),
    incorrectCount: (item.incorrectCount || 0) + (isCorrect ? 0 : 1),
    fsrsState: updatedState,
    retrievabilityPercent: newRetrievabilityPercent,
    recommendedReviewText,
  };
}

/**
 * Wrapper to update VocabItem directly with FSRS
 */
export function calculateNextFSRSReview(
  item: VocabItem,
  rating: SrsRating,
  responseTimeMs?: number
): VocabItem {
  const update = calculateFSRSUpdate(item, rating, responseTimeMs);
  return {
    ...item,
    mastery: update.mastery,
    srsStage: update.srsStage,
    nextReviewDate: update.nextReviewDate,
    lastReviewedDate: update.lastReviewedDate,
    reviewCount: update.reviewCount,
    correctCount: update.correctCount,
    incorrectCount: update.incorrectCount,
    fsrsState: update.fsrsState,
  };
}

/**
 * Calculates estimated IELTS Lexical Resource band score
 */
export function estimateIeltsBand(vocabList: VocabItem[]): number {
  if (!vocabList || vocabList.length === 0) return 5.5;

  const total = vocabList.length;
  const mastered = vocabList.filter((w) => w.mastery === 'mastered').length;
  const reviewing = vocabList.filter((w) => w.mastery === 'reviewing').length;
  const learning = vocabList.filter((w) => w.mastery === 'learning').length;

  const masteredRatio = (mastered * 1.0 + reviewing * 0.6 + learning * 0.3) / total;

  let totalReviews = 0;
  let totalCorrect = 0;
  vocabList.forEach((w) => {
    totalReviews += w.reviewCount || 0;
    totalCorrect += w.correctCount || 0;
  });
  const accuracy = totalReviews > 0 ? totalCorrect / totalReviews : 0.75;

  let baseBand = 5.5 + masteredRatio * 2.5 + accuracy * 0.8;
  if (baseBand > 8.5) baseBand = 8.5;
  if (baseBand < 5.0) baseBand = 5.0;

  return Math.round(baseBand * 2) / 2;
}

/**
 * Format relative time remaining
 */
export function formatRelativeReviewTime(nextReviewTimestamp: number): string {
  const diff = nextReviewTimestamp - Date.now();
  if (diff <= 0) return 'Cần ôn ngay';
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 24) return `Trong ${hours} giờ`;
  const days = Math.round(hours / 24);
  return `Trong ${days} ngày`;
}
