import { VocabItem } from '../types';

export type PatternTierType = 'new' | 'struggling' | 'due' | 'anchor';

export type PatternMode =
  | 'smart-interleaved'   // Standard Cognitive Spaced & Interleaved Mix (Recommended)
  | 'new-focus'           // 70% New words, 30% Spaced Review
  | 'review-focus'        // 80% Due & Old Words, 20% New Words
  | 'struggling-focus';   // 100% Problematic / Low Accuracy / Starred words

export interface PatternWordItem {
  word: VocabItem;
  tier: PatternTierType;
  tierLabel: string;
  tierBadge: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
  appearanceReason: string;
}

export interface PatternQueueOptions {
  mode?: PatternMode;
  limit?: number;
  preserveAll?: boolean; // If true, includes all words in active set ordered by pattern
}

export interface PatternQueueResult {
  queue: PatternWordItem[];
  stats: {
    total: number;
    newCount: number;
    strugglingCount: number;
    dueCount: number;
    anchorCount: number;
  };
  activeMode: PatternMode;
}

/**
 * Classify a word into pedagogical memory tier
 */
export function classifyWordTier(word: VocabItem, now: number = Date.now()): PatternTierType {
  const reviews = word.reviewCount || 0;
  const incorrect = word.incorrectCount || 0;
  const isDue = (word.nextReviewDate || 0) <= now;

  // 1. Unseen / New
  if (reviews === 0 || word.mastery === 'new') {
    return 'new';
  }

  // 2. Struggling / Unfamiliar / High error rate / Bookmarked
  const errorRate = reviews > 0 ? incorrect / reviews : 0;
  if (incorrect >= 1 && (errorRate >= 0.3 || word.srsStage <= 1)) {
    return 'struggling';
  }
  if (word.isBookmarked && (word.srsStage <= 2 || isDue)) {
    return 'struggling';
  }

  // 3. Due for spaced repetition review
  if (isDue) {
    return 'due';
  }

  // 4. Anchor / Mastered / Strong retention
  return 'anchor';
}

/**
 * Get visual badge and description for a tier
 */
export function getTierMetadata(tier: PatternTierType, word?: VocabItem) {
  switch (tier) {
    case 'new':
      return {
        label: 'Từ mới cần nạp',
        reason: 'Khám phá từ vựng mới toanh chưa học',
        badge: {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          icon: '🌱',
        },
      };
    case 'struggling':
      return {
        label: 'Từ lạ / Hay sai',
        reason: word?.isBookmarked
          ? 'Từ có gắn dấu sao ⭐ cần củng cố'
          : `Bạn từng trả lời sai ${word?.incorrectCount || 1} lần - Cần khắc phục`,
        badge: {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          icon: '⚡',
        },
      };
    case 'due':
      return {
        label: 'Đến hạn ôn lại',
        reason: 'Ôn tập đúng thời điểm vàng theo đường cong quên lãng SRS',
        badge: {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          icon: '⏰',
        },
      };
    case 'anchor':
      return {
        label: 'Củng cố từ cũ',
        reason: 'Ôn ngắt quãng củng cố trí nhớ dài hạn (Long-term retention)',
        badge: {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          icon: '💎',
        },
      };
  }
}

/**
 * Build a structured, non-random, pedagogical study queue
 * Weaves new words, challenging words, and old reviews according to cognitive learning science.
 */
export function buildSmartStudyQueue(
  words: VocabItem[],
  options: PatternQueueOptions = {}
): PatternQueueResult {
  const { mode = 'smart-interleaved', limit, preserveAll = false } = options;

  if (!words || words.length === 0) {
    return {
      queue: [],
      stats: { total: 0, newCount: 0, strugglingCount: 0, dueCount: 0, anchorCount: 0 },
      activeMode: mode,
    };
  }

  const now = Date.now();

  // 1. Group words by tier
  const newBucket: VocabItem[] = [];
  const strugglingBucket: VocabItem[] = [];
  const dueBucket: VocabItem[] = [];
  const anchorBucket: VocabItem[] = [];

  words.forEach((w) => {
    const tier = classifyWordTier(w, now);
    if (tier === 'new') newBucket.push(w);
    else if (tier === 'struggling') strugglingBucket.push(w);
    else if (tier === 'due') dueBucket.push(w);
    else anchorBucket.push(w);
  });

  // Sort inside each bucket strategically
  // Struggling: Sort highest error rate & lowest stage first
  strugglingBucket.sort((a, b) => {
    const errA = (a.incorrectCount || 0) / (a.reviewCount || 1);
    const errB = (b.incorrectCount || 0) / (b.reviewCount || 1);
    if (errB !== errA) return errB - errA;
    return (a.srsStage || 0) - (b.srsStage || 0);
  });

  // Due: Sort oldest nextReviewDate first (most overdue)
  dueBucket.sort((a, b) => (a.nextReviewDate || 0) - (b.nextReviewDate || 0));

  // Anchor: Sort by oldest lastReviewedDate first
  anchorBucket.sort((a, b) => (a.lastReviewedDate || 0) - (b.lastReviewedDate || 0));

  // Target size
  const targetCount = preserveAll ? words.length : limit || Math.min(15, words.length);

  const queuedItems: PatternWordItem[] = [];
  const visitedIds = new Set<string>();

  const pushFromBucket = (bucket: VocabItem[], tier: PatternTierType) => {
    const candidate = bucket.find((item) => !visitedIds.has(item.id));
    if (candidate) {
      visitedIds.add(candidate.id);
      const meta = getTierMetadata(tier, candidate);
      queuedItems.push({
        word: candidate,
        tier,
        tierLabel: meta.label,
        tierBadge: meta.badge,
        appearanceReason: meta.reason,
      });
      return true;
    }
    return false;
  };

  // 2. Build sequence based on selected pattern formula
  if (mode === 'struggling-focus') {
    // Priority: Struggling -> Due -> New -> Anchor
    while (queuedItems.length < targetCount && visitedIds.size < words.length) {
      if (pushFromBucket(strugglingBucket, 'struggling')) continue;
      if (pushFromBucket(dueBucket, 'due')) continue;
      if (pushFromBucket(newBucket, 'new')) continue;
      if (pushFromBucket(anchorBucket, 'anchor')) continue;
      break;
    }
  } else if (mode === 'review-focus') {
    // Formula: [Due] -> [Due] -> [Struggling] -> [Anchor] -> [New]
    const reviewPattern: PatternTierType[] = ['due', 'due', 'struggling', 'anchor', 'new'];
    let pIdx = 0;
    while (queuedItems.length < targetCount && visitedIds.size < words.length) {
      const desiredTier = reviewPattern[pIdx % reviewPattern.length];
      pIdx++;

      let added = false;
      if (desiredTier === 'due') added = pushFromBucket(dueBucket, 'due');
      else if (desiredTier === 'struggling') added = pushFromBucket(strugglingBucket, 'struggling');
      else if (desiredTier === 'anchor') added = pushFromBucket(anchorBucket, 'anchor');
      else if (desiredTier === 'new') added = pushFromBucket(newBucket, 'new');

      // Fallback if desired tier empty
      if (!added) {
        if (pushFromBucket(dueBucket, 'due')) continue;
        if (pushFromBucket(strugglingBucket, 'struggling')) continue;
        if (pushFromBucket(anchorBucket, 'anchor')) continue;
        if (pushFromBucket(newBucket, 'new')) continue;
        break;
      }
    }
  } else if (mode === 'new-focus') {
    // Formula: [New] -> [New] -> [Struggling/Due] -> [New] -> [Anchor]
    const newPattern: PatternTierType[] = ['new', 'new', 'struggling', 'new', 'due', 'anchor'];
    let pIdx = 0;
    while (queuedItems.length < targetCount && visitedIds.size < words.length) {
      const desiredTier = newPattern[pIdx % newPattern.length];
      pIdx++;

      let added = false;
      if (desiredTier === 'new') added = pushFromBucket(newBucket, 'new');
      else if (desiredTier === 'struggling') added = pushFromBucket(strugglingBucket, 'struggling');
      else if (desiredTier === 'due') added = pushFromBucket(dueBucket, 'due');
      else if (desiredTier === 'anchor') added = pushFromBucket(anchorBucket, 'anchor');

      if (!added) {
        if (pushFromBucket(newBucket, 'new')) continue;
        if (pushFromBucket(strugglingBucket, 'struggling')) continue;
        if (pushFromBucket(dueBucket, 'due')) continue;
        if (pushFromBucket(anchorBucket, 'anchor')) continue;
        break;
      }
    }
  } else {
    // 'smart-interleaved' (MÔ HÌNH XEN KẼ CHUẨN SƯ PHẠM NÃO BỘ)
    // Cadence: [🌱 New] -> [⚡ Struggling] -> [🌱 New] -> [⏰ Due] -> [💎 Anchor]
    const goldenCadence: PatternTierType[] = [
      'new',
      'struggling',
      'new',
      'due',
      'struggling',
      'anchor',
      'due',
    ];

    let cycleIndex = 0;
    while (queuedItems.length < targetCount && visitedIds.size < words.length) {
      const targetTier = goldenCadence[cycleIndex % goldenCadence.length];
      cycleIndex++;

      let added = false;
      if (targetTier === 'new') added = pushFromBucket(newBucket, 'new');
      else if (targetTier === 'struggling') added = pushFromBucket(strugglingBucket, 'struggling');
      else if (targetTier === 'due') added = pushFromBucket(dueBucket, 'due');
      else if (targetTier === 'anchor') added = pushFromBucket(anchorBucket, 'anchor');

      // Fallback hierarchy if desired tier bucket exhausted
      if (!added) {
        if (pushFromBucket(strugglingBucket, 'struggling')) continue;
        if (pushFromBucket(dueBucket, 'due')) continue;
        if (pushFromBucket(newBucket, 'new')) continue;
        if (pushFromBucket(anchorBucket, 'anchor')) continue;
        break;
      }
    }
  }

  // If preserveAll is requested and some remaining words were not matched by cadence, append them
  if (preserveAll && visitedIds.size < words.length) {
    words.forEach((w) => {
      if (!visitedIds.has(w.id)) {
        visitedIds.add(w.id);
        const tier = classifyWordTier(w, now);
        const meta = getTierMetadata(tier, w);
        queuedItems.push({
          word: w,
          tier,
          tierLabel: meta.label,
          tierBadge: meta.badge,
          appearanceReason: meta.reason,
        });
      }
    });
  }

  // Calculate actual tier counts in generated queue
  const newCount = queuedItems.filter((i) => i.tier === 'new').length;
  const strugglingCount = queuedItems.filter((i) => i.tier === 'struggling').length;
  const dueCount = queuedItems.filter((i) => i.tier === 'due').length;
  const anchorCount = queuedItems.filter((i) => i.tier === 'anchor').length;

  return {
    queue: queuedItems,
    stats: {
      total: queuedItems.length,
      newCount,
      strugglingCount,
      dueCount,
      anchorCount,
    },
    activeMode: mode,
  };
}
