import { VocabItem, WordSet, UserProgress, StudyRecord } from '../types';
import { DEFAULT_SETS, DEFAULT_VOCABULARY } from '../data/defaultSets';
import { estimateIeltsBand } from './srs';
import {
  saveWordsToIndexedDB,
  loadWordsFromIndexedDB,
  saveSetsToIndexedDB,
  loadSetsFromIndexedDB,
} from './indexedDb';
import {
  loadWordsFromFirebase,
  loadSetsFromFirebase,
  loadProgressFromFirebase,
  isFirestoreQuotaExceeded,
  fetchFromIeltsWordsCollection,
  syncWordsToFirebase,
  syncSetsToFirebase,
} from './firebaseSync';
import { resolveWordConflicts } from './offlineSync';

const STORAGE_PREFIX = 'ielts_v3_';

function getUserStorageKey(type: string, userId: string = 'guest'): string {
  return `${STORAGE_PREFIX}${type}_${userId}`;
}

// In-memory cache per user
const memoryCacheSets = new Map<string, WordSet[]>();
const memoryCacheWords = new Map<string, VocabItem[]>();

/**
 * Filter out any synthetic/combinatorial filler words with fake generic template definitions
 * and guarantee 100% genuine authentic IELTS vocabulary.
 */
export function sanitizeVocabItems(words: VocabItem[]): VocabItem[] {
  if (!Array.isArray(words) || words.length === 0) return createFreshVocabularySet();

  const isSynthetic = (w: VocabItem) => {
    if (!w || !w.meaning) return true;
    if (w.meaning.includes('(thuật ngữ học thuật chuyên sâu)')) return true;
    if (/^sự\s+[a-z\s-]+\s+mang tính\s+[a-z\s-]+$/i.test(w.meaning.trim())) return true;
    if (w.id && w.id.startsWith('voc-corpus-')) return true;
    return false;
  };

  const genuineUserWords = words.filter((w) => !isSynthetic(w));

  // Build clean dictionary preserving user's authentic review progress and custom words
  const finalMap = new Map<string, VocabItem>();

  // Add default genuine vocabulary first
  DEFAULT_VOCABULARY.forEach((w) => {
    finalMap.set(w.id, w);
  });

  // Overlay user's modified states on genuine words or custom user-added words
  genuineUserWords.forEach((userWord) => {
    finalMap.set(userWord.id, userWord);
  });

  return Array.from(finalMap.values());
}

export function sanitizeWordSets(sets: WordSet[], words: VocabItem[]): WordSet[] {
  const setsMap = new Map<string, WordSet>();

  // Ensure default authentic sets exist
  DEFAULT_SETS.forEach((s) => {
    setsMap.set(s.id, s);
  });

  // Preserve user custom sets
  if (Array.isArray(sets)) {
    sets.forEach((s) => {
      if (s && s.id) {
        setsMap.set(s.id, {
          ...s,
          totalWords: words.filter((w) => w.sourceSetId === s.id).length,
        });
      }
    });
  }

  // Recalculate accurate total word counts
  return Array.from(setsMap.values())
    .map((s) => ({
      ...s,
      totalWords: words.filter((w) => w.sourceSetId === s.id).length,
    }))
    .filter((s) => s.totalWords > 0 || s.sourceType !== 'default');
}

/**
 * Generate a clean default vocabulary list with fresh learning state
 */
export function createFreshVocabularySet(): VocabItem[] {
  return DEFAULT_VOCABULARY.map((word) => ({
    ...word,
    mastery: 'new' as const,
    isBookmarked: false,
    isUnlearned: false,
    reviewsCount: 0,
    repetitionInterval: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
    lastReviewedDate: undefined,
  }));
}

export function loadStoredSets(userId: string = 'guest'): WordSet[] {
  if (memoryCacheSets.has(userId)) {
    const cached = memoryCacheSets.get(userId)!;
    if (cached.length > 0) return cached;
  }

  try {
    const key = getUserStorageKey('sets', userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Check legacy key if guest
      if (userId === 'guest') {
        const legacy = localStorage.getItem('ielts_vocab_sets_v2');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryCacheSets.set(userId, parsed);
            return parsed;
          }
        }
      }
      memoryCacheSets.set(userId, DEFAULT_SETS);
      return DEFAULT_SETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryCacheSets.set(userId, parsed);
      return parsed;
    }
    return DEFAULT_SETS;
  } catch (err) {
    console.error('Failed to load sets from localStorage', err);
    return DEFAULT_SETS;
  }
}

export function saveStoredSets(sets: WordSet[], userId: string = 'guest'): void {
  memoryCacheSets.set(userId, sets);
  try {
    const key = getUserStorageKey('sets', userId);
    localStorage.setItem(key, JSON.stringify(sets));
  } catch (err) {
    console.warn('LocalStorage quota limit reached for sets, persisting to IndexedDB', err);
  }
  // Persist in IndexedDB asynchronously for this specific user
  saveSetsToIndexedDB(sets, userId);
}

export function loadStoredWords(userId: string = 'guest'): VocabItem[] {
  if (memoryCacheWords.has(userId)) {
    const cached = memoryCacheWords.get(userId)!;
    if (cached.length > 0) return cached;
  }

  try {
    const key = getUserStorageKey('words', userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (userId === 'guest') {
        const legacy = localStorage.getItem('ielts_vocab_words_v2');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryCacheWords.set(userId, parsed);
            return parsed;
          }
        }
      }
      const freshWords = createFreshVocabularySet();
      memoryCacheWords.set(userId, freshWords);
      return freshWords;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized = sanitizeVocabItems(parsed);
      memoryCacheWords.set(userId, sanitized);
      return sanitized;
    }
    const freshWords = createFreshVocabularySet();
    return freshWords;
  } catch (err) {
    console.error('Failed to load words from localStorage', err);
    return createFreshVocabularySet();
  }
}

export function saveStoredWords(words: VocabItem[], userId: string = 'guest'): void {
  memoryCacheWords.set(userId, words);
  try {
    const key = getUserStorageKey('words', userId);
    // Keep first 500 in localstorage for quick boot if full
    localStorage.setItem(key, JSON.stringify(words.length > 500 ? words.slice(0, 500) : words));
  } catch (err) {
    console.warn('LocalStorage quota reached for words, saving to IndexedDB', err);
  }
  // Always persist all words into user's IndexedDB partition
  saveWordsToIndexedDB(words, userId);
}

/**
 * Initialize high-capacity storage from IndexedDB and Cloud Firestore for a specific user
 */
export async function initializeDatabaseForUser(userId: string = 'guest'): Promise<{
  sets: WordSet[];
  words: VocabItem[];
  progress?: UserProgress | null;
}> {
  // 1. Load from local user-scoped IndexedDB first
  const [dbSets, dbWords] = await Promise.all([
    loadSetsFromIndexedDB(userId),
    loadWordsFromIndexedDB(userId),
  ]);

  let finalSets = loadStoredSets(userId);
  let finalWords = loadStoredWords(userId);

  if (dbWords && dbWords.length > 0) {
    finalWords = dbWords;
  }
  if (dbSets && dbSets.length > 0) {
    finalSets = dbSets;
  }

  // 1b. Check if there are uploaded words in Guest mode that should be migrated into this user's account
  if (userId && userId !== 'guest' && !userId.startsWith('guest_')) {
    try {
      const guestWords = loadStoredWords('guest');
      const guestSets = loadStoredSets('guest');
      const guestCustomSets = guestSets.filter(
        (s) => s.sourceType !== 'default' || s.id.startsWith('set-')
      );
      if (guestCustomSets.length > 0 || guestWords.length > DEFAULT_VOCABULARY.length) {
        const wordMap = new Map<string, VocabItem>();
        finalWords.forEach((w) => wordMap.set(w.id, w));
        guestWords.forEach((w) => wordMap.set(w.id, w));
        finalWords = Array.from(wordMap.values());

        const setMap = new Map<string, WordSet>();
        finalSets.forEach((s) => setMap.set(s.id, s));
        guestSets.forEach((s) => setMap.set(s.id, s));
        finalSets = Array.from(setMap.values());
      }
    } catch (e) {
      console.warn('Guest migration check skipped', e);
    }
  }

  // 2. If user is authenticated and not quota exceeded, check their private cloud storage
  let cloudProgress: UserProgress | null = null;
  if (userId && userId !== 'guest' && !userId.startsWith('guest_') && !isFirestoreQuotaExceeded()) {
    try {
      const [cloudWords, cloudSets, cloudProg] = await Promise.all([
        loadWordsFromFirebase(userId),
        loadSetsFromFirebase(userId),
        loadProgressFromFirebase(userId),
      ]);

      // CRITICAL: MERGE cloud words and local words (never blindly overwrite and wipe local uploads)
      if (cloudWords && cloudWords.length > 0) {
        finalWords = resolveWordConflicts(finalWords, cloudWords);
      }
      if (cloudSets && cloudSets.length > 0) {
        const setMap = new Map<string, WordSet>();
        cloudSets.forEach((s) => setMap.set(s.id, s));
        finalSets.forEach((s) => setMap.set(s.id, s));
        finalSets = Array.from(setMap.values());
      }
      if (cloudProg) {
        cloudProgress = cloudProg;
      }
    } catch {
      // Ignore background cloud load error
    }
  }

  // 3. Purge any synthetic placeholder data and ensure 100% genuine authentic words
  finalWords = sanitizeVocabItems(finalWords);
  finalSets = sanitizeWordSets(finalSets, finalWords);

  memoryCacheWords.set(userId, finalWords);
  memoryCacheSets.set(userId, finalSets);

  // Keep in sync locally in IndexedDB & LocalStorage
  saveStoredSets(finalSets, userId);
  saveStoredWords(finalWords, userId);

  // Auto-sync to Firebase if authenticated so cloud is immediately up-to-date
  if (userId && userId !== 'guest' && !userId.startsWith('guest_') && !isFirestoreQuotaExceeded()) {
    syncWordsToFirebase(finalWords, userId).catch(() => {});
    syncSetsToFirebase(finalSets, userId).catch(() => {});
  }

  return { sets: finalSets, words: finalWords, progress: cloudProgress };
}

// Backward compatibility alias
export async function initializeDatabaseFromIndexedDB(): Promise<{
  sets: WordSet[];
  words: VocabItem[];
}> {
  return initializeDatabaseForUser('guest');
}

export function loadStoredProgress(vocabList?: VocabItem[], userId: string = 'guest'): UserProgress {
  const words = vocabList || loadStoredWords(userId);
  const defaultProgress: UserProgress = {
    streakDays: 1,
    lastStudyDate: new Date().toISOString().split('T')[0],
    totalReviews: 0,
    overallAccuracy: 100,
    estimatedBand: estimateIeltsBand(words),
    studyHistory: [],
  };

  try {
    const key = getUserStorageKey('progress', userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (userId === 'guest') {
        const legacy = localStorage.getItem('ielts_user_progress_v2');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          parsed.estimatedBand = estimateIeltsBand(words);
          return parsed;
        }
      }
      localStorage.setItem(key, JSON.stringify(defaultProgress));
      return defaultProgress;
    }
    const parsed = JSON.parse(raw);
    parsed.estimatedBand = estimateIeltsBand(words);
    return parsed;
  } catch (err) {
    return defaultProgress;
  }
}

export function saveStoredProgress(progress: UserProgress, userId: string = 'guest'): void {
  try {
    const key = getUserStorageKey('progress', userId);
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save progress', err);
  }
}

export function recordStudySession(
  record: Omit<StudyRecord, 'id' | 'date'>,
  vocabList?: VocabItem[],
  userId: string = 'guest'
): UserProgress {
  const current = loadStoredProgress(vocabList, userId);
  const today = new Date().toISOString().split('T')[0];

  let streak = current.streakDays;
  if (current.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (current.lastStudyDate === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  const newSession: StudyRecord = {
    ...record,
    id: `session-${Date.now()}`,
    date: new Date().toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  const updatedHistory = [newSession, ...current.studyHistory].slice(0, 50);

  const totalQuestions = updatedHistory.reduce((acc, h) => acc + h.totalQuestions, 0);
  const totalCorrect = updatedHistory.reduce((acc, h) => acc + h.correctAnswers, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 100;

  const updatedProgress: UserProgress = {
    streakDays: streak,
    lastStudyDate: today,
    totalReviews: current.totalReviews + record.totalQuestions,
    overallAccuracy: accuracy,
    estimatedBand: estimateIeltsBand(vocabList || []),
    studyHistory: updatedHistory,
  };

  saveStoredProgress(updatedProgress, userId);
  return updatedProgress;
}

/**
 * Explicitly reset or populate the full 2,000+ IELTS Academic Corpus for a user
 */
export async function seedFullIelts2000WordsForUser(userId: string = 'guest'): Promise<{
  sets: WordSet[];
  words: VocabItem[];
}> {
  const freshWords = createFreshVocabularySet();
  const freshSets = DEFAULT_SETS;

  memoryCacheWords.set(userId, freshWords);
  memoryCacheSets.set(userId, freshSets);

  saveStoredSets(freshSets, userId);
  saveStoredWords(freshWords, userId);

  return { sets: freshSets, words: freshWords };
}

/**
 * Import all vocabulary directly from the shared 'ielts_words' / 'ielts_word_bundles' Firestore collections
 * and push/merge them cleanly into the user's account.
 */
export async function importIeltsWordsFromFirestoreToUser(userId: string = 'guest'): Promise<{
  importedCount: number;
  totalWords: number;
  words: VocabItem[];
  sets: WordSet[];
}> {
  // 1. Fetch from Firestore collections
  const { words: fetchedWords, sets: fetchedSets } = await fetchFromIeltsWordsCollection();

  // 2. Load current existing user words and sets
  const currentWords = loadStoredWords(userId);
  const currentSets = loadStoredSets(userId);

  const wordMap = new Map<string, VocabItem>();
  // Index existing user words by normalized term
  currentWords.forEach((w) => {
    const key = (w.term || '').trim().toLowerCase();
    if (key) wordMap.set(key, w);
  });

  let newWordsCount = 0;
  // Merge newly fetched words from ielts_words
  fetchedWords.forEach((fw) => {
    const key = (fw.term || '').trim().toLowerCase();
    if (key) {
      if (!wordMap.has(key)) {
        wordMap.set(key, fw);
        newWordsCount++;
      } else {
        // Enhance existing word if meaning or IPA was missing
        const existing = wordMap.get(key)!;
        if ((!existing.meaning || existing.meaning.length < 3) && fw.meaning) {
          existing.meaning = fw.meaning;
        }
        if (!existing.ipa && fw.ipa) {
          existing.ipa = fw.ipa;
        }
        if (!existing.example && fw.example) {
          existing.example = fw.example;
        }
      }
    }
  });

  const mergedWords = Array.from(wordMap.values());

  // 3. Merge Sets
  const setsMap = new Map<string, WordSet>();
  currentSets.forEach((s) => setsMap.set(s.id, s));
  if (Array.isArray(fetchedSets)) {
    fetchedSets.forEach((fs) => {
      if (!setsMap.has(fs.id)) {
        setsMap.set(fs.id, fs);
      }
    });
  }

  // Ensure default sets are present
  DEFAULT_SETS.forEach((ds) => {
    if (!setsMap.has(ds.id)) {
      setsMap.set(ds.id, ds);
    }
  });

  // If there are words without a valid set, add a container set
  const containerSetId = 'set-ielts-database-import';
  const hasImportedSetWords = mergedWords.some((w) => w.sourceSetId === containerSetId);
  if (hasImportedSetWords && !setsMap.has(containerSetId)) {
    setsMap.set(containerSetId, {
      id: containerSetId,
      title: 'Kho từ vựng Cloud ielts_words',
      description: 'Toàn bộ từ vựng được nhập từ cơ sở dữ liệu ielts_words trên Firestore',
      sourceType: 'custom',
      mainTopic: 'IELTS Academic Master',
      topics: ['IELTS Academic', 'Cloud Database'],
      createdAt: Date.now(),
      totalWords: mergedWords.filter((w) => w.sourceSetId === containerSetId).length,
      tags: ['firestore', 'ielts_words', 'cloud'],
    });
  }

  const mergedSets = Array.from(setsMap.values()).map((s) => ({
    ...s,
    totalWords: mergedWords.filter((w) => w.sourceSetId === s.id).length,
  }));

  // 4. Save to Memory, IndexedDB, and LocalStorage
  memoryCacheWords.set(userId, mergedWords);
  memoryCacheSets.set(userId, mergedSets);
  saveStoredWords(mergedWords, userId);
  saveStoredSets(mergedSets, userId);

  // 5. Sync to user's Firestore path if user is authenticated
  if (userId && userId !== 'guest' && !userId.startsWith('guest_')) {
    try {
      await syncWordsToFirebase(mergedWords, userId);
      await syncSetsToFirebase(mergedSets, userId);
    } catch (e) {
      console.warn('Failed to upload merged words to user Firestore path:', e);
    }
  }

  return {
    importedCount: newWordsCount > 0 ? newWordsCount : fetchedWords.length,
    totalWords: mergedWords.length,
    words: mergedWords,
    sets: mergedSets,
  };
}

