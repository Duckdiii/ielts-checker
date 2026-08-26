import { SpeakingPortfolioItem } from '../types';
import {
  saveSpeakingItemToIndexedDB,
  loadSpeakingItemsFromIndexedDB,
  deleteSpeakingItemFromIndexedDB,
} from './indexedDb';

const STORAGE_KEY_PORTFOLIO_CACHE = 'ielts_speaking_portfolio_meta_v3';

// Initial realistic benchmark seed data showing trajectory from 5.5 -> 6.5 -> 7.5+
const SEED_SPEAKING_PORTFOLIO: SpeakingPortfolioItem[] = [
  {
    id: 'spk-seed-1',
    timestamp: Date.now() - 28 * 86400000, // 4 weeks ago
    dateFormatted: new Date(Date.now() - 28 * 86400000).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    mode: 'mock-examiner',
    part: 1,
    topic: 'Work & Study',
    question: 'Do you prefer working alone or in a team?',
    transcript: 'Well, I think I like working with group because we can help each other. But sometimes team member not focus, so it makes problem.',
    durationSeconds: 28,
    overallBand: 5.5,
    criteriaScores: {
      fluency: 5.5,
      lexical: 5.0,
      grammar: 5.5,
      pronunciation: 6.0,
      wordsPerMinute: 105,
      hesitationsCount: 6,
      deadSilencePausesCount: 2,
    },
    targetWordsUsed: ['teamwork'],
    targetWordsMissed: ['collaborate', 'friction', 'synergy'],
    notes: 'Lần đầu thi thử: còn ngắc ngứ và lặp từ cơ bản (problem, team member).',
    isFavorite: false,
    evalResult: {
      question: 'Do you prefer working alone or in a team?',
      part: 1,
      topic: 'Work & Study',
      transcript: 'Well, I think I like working with group because we can help each other. But sometimes team member not focus, so it makes problem.',
      durationSeconds: 28,
      targetWordsUsed: ['teamwork'],
      targetWordsMissed: ['collaborate', 'friction', 'synergy'],
      overallBand: 5.5,
      criteriaScores: {
        fluencyCoherence: {
          score: 5.5,
          feedbackVi: 'Tốc độ còn chậm, còn ngắt quãng khi tìm ý.',
          speedPacing: 'Too slow',
          wordsPerMinute: 105,
          speechRateVerdictVi: 'Hơi chậm (105 WPM), cần giảm khoảng lặng chết.',
          hesitationsCount: 6,
          deadSilencePausesCount: 2,
        },
        lexicalResource: {
          score: 5.0,
          feedbackVi: 'Dùng từ vựng cơ bản A2-B1, thiếu collocations học thuật.',
          academicWordsUsed: [],
          collocationsUsed: ['working alone'],
        },
        grammaticalRange: {
          score: 5.5,
          feedbackVi: 'Còn lỗi chia động từ "team member not focus" và thiếu mạo từ "with a group".',
          complexStructuresUsed: [],
          grammarErrors: [
            {
              original: 'working with group',
              corrected: 'working in a group / team',
              explanationVi: 'Cần giới từ in và mạo từ a.',
            },
            {
              original: 'team member not focus',
              corrected: 'team members are not focused',
              explanationVi: 'Lỗi chia số nhiều và thể bị động/tính từ.',
            },
          ],
        },
        pronunciation: {
          score: 6.0,
          feedbackVi: 'Phát âm tương đối rõ ràng, cần chú ý âm đuôi /s/, /z/.',
          intonationFeedbackVi: 'Ngữ điệu đều đều, chưa có trọng âm câu nổi bật.',
          trickyWords: [],
        },
      },
      overallFeedbackVi: 'Bài nói khởi đầu tốt, cần mở rộng vốn từ C1 và luyện nối câu mượt mà hơn.',
      band8ModelAnswer: {
        answer: 'To be completely honest, I lean towards collaborative environments because teamwork fosters synergistic problem-solving, although I do appreciate autonomous deep work when high concentration is imperative.',
        vietnameseTranslation: 'Thành thật mà nói, tôi nghiêng về môi trường cộng tác vì làm việc nhóm thúc đẩy khả năng giải quyết vấn đề cộng hưởng, dù tôi cũng đánh giá cao sự độc lập khi cần tập trung cao độ.',
        keyCollocations: ['collaborative environments', 'synergistic problem-solving', 'autonomous deep work', 'imperative'],
        explanationVi: 'Sử dụng cấu trúc tương phản mượt mà và từ vựng band 8.5.',
      },
      actionableImprovementTips: ['Nâng cấp cụm từ thay vì dùng từ đơn lẻ', 'Tăng tốc độ phản xạ trong 5s đầu'],
    },
  },
];

const memoryPortfolioMap = new Map<string, SpeakingPortfolioItem[]>();

/**
 * Load all speaking portfolio items for a specific user
 */
export async function loadSpeakingPortfolio(userId: string = 'guest'): Promise<SpeakingPortfolioItem[]> {
  if (memoryPortfolioMap.has(userId)) {
    const cached = memoryPortfolioMap.get(userId)!;
    if (cached.length > 0) return cached;
  }

  try {
    const dbItems = await loadSpeakingItemsFromIndexedDB(userId);
    if (dbItems && dbItems.length > 0) {
      memoryPortfolioMap.set(userId, dbItems);
      syncMetaCache(dbItems, userId);
      return dbItems;
    }

    // Try local storage cache
    const rawCache = localStorage.getItem(`${STORAGE_KEY_PORTFOLIO_CACHE}_${userId}`);
    if (rawCache) {
      const parsed: SpeakingPortfolioItem[] = JSON.parse(rawCache);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryPortfolioMap.set(userId, parsed);
        parsed.forEach((item) => saveSpeakingItemToIndexedDB(item, userId));
        return parsed;
      }
    }

    // Default: Return initial seed trajectory for new accounts
    const initialSeeds = SEED_SPEAKING_PORTFOLIO;
    memoryPortfolioMap.set(userId, initialSeeds);
    syncMetaCache(initialSeeds, userId);
    initialSeeds.forEach((item) => saveSpeakingItemToIndexedDB(item, userId));
    return initialSeeds;
  } catch (err) {
    console.error('Failed to load speaking portfolio:', err);
    return SEED_SPEAKING_PORTFOLIO;
  }
}

/**
 * Save new speaking attempt into Portfolio for a user
 */
export async function saveSpeakingAttemptToPortfolio(
  item: Omit<SpeakingPortfolioItem, 'id' | 'timestamp' | 'dateFormatted'>,
  audioBlob?: Blob,
  userId: string = 'guest'
): Promise<SpeakingPortfolioItem> {
  const newItem: SpeakingPortfolioItem = {
    ...item,
    id: `spk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    dateFormatted: new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    audioBlob: audioBlob,
    audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : item.audioUrl,
  };

  const current = memoryPortfolioMap.get(userId) || [];
  const updated = [newItem, ...current];
  memoryPortfolioMap.set(userId, updated);

  await saveSpeakingItemToIndexedDB(newItem, userId);
  syncMetaCache(updated, userId);

  return newItem;
}

/**
 * Delete item from portfolio for a user
 */
export async function deleteSpeakingPortfolioItem(id: string, userId: string = 'guest'): Promise<SpeakingPortfolioItem[]> {
  const current = memoryPortfolioMap.get(userId) || [];
  const updated = current.filter((item) => item.id !== id);
  memoryPortfolioMap.set(userId, updated);

  await deleteSpeakingItemFromIndexedDB(id, userId);
  syncMetaCache(updated, userId);

  return updated;
}

/**
 * Toggle favorite item for a user
 */
export async function toggleSpeakingPortfolioFavorite(id: string, userId: string = 'guest'): Promise<SpeakingPortfolioItem[]> {
  const current = memoryPortfolioMap.get(userId) || [];
  const updated = current.map((item) =>
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );
  memoryPortfolioMap.set(userId, updated);

  const updatedItem = updated.find((i) => i.id === id);
  if (updatedItem) {
    await saveSpeakingItemToIndexedDB(updatedItem, userId);
  }
  syncMetaCache(updated, userId);

  return updated;
}

/**
 * Update personal study notes for a recording for a user
 */
export async function updateSpeakingPortfolioNotes(
  id: string,
  notes: string,
  userId: string = 'guest'
): Promise<SpeakingPortfolioItem[]> {
  const current = memoryPortfolioMap.get(userId) || [];
  const updated = current.map((item) => (item.id === id ? { ...item, notes } : item));
  memoryPortfolioMap.set(userId, updated);

  const updatedItem = updated.find((i) => i.id === id);
  if (updatedItem) {
    await saveSpeakingItemToIndexedDB(updatedItem, userId);
  }
  syncMetaCache(updated, userId);

  return updated;
}

/**
 * Helper to sync lightweight metadata into localStorage
 */
function syncMetaCache(items: SpeakingPortfolioItem[], userId: string = 'guest') {
  try {
    const lightMeta = items.map((i) => ({
      ...i,
      audioBlob: undefined,
    }));
    localStorage.setItem(`${STORAGE_KEY_PORTFOLIO_CACHE}_${userId}`, JSON.stringify(lightMeta.slice(0, 40)));
  } catch (err) {
    // ignore quota
  }
}
