import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { VocabItem, WordSet, UserProgress } from '../types';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

const QUOTA_EXCEEDED_KEY = 'firestore_quota_exhausted_timestamp';
let inMemoryQuotaExceeded = false;

// Check if quota limit was reached
export function isFirestoreQuotaExceeded(): boolean {
  if (inMemoryQuotaExceeded) return true;
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(QUOTA_EXCEEDED_KEY);
    if (!raw) return false;
    const time = parseInt(raw, 10);
    // Suppress for 6 hours after quota error
    if (Date.now() - time > 6 * 60 * 60 * 1000) {
      localStorage.removeItem(QUOTA_EXCEEDED_KEY);
      inMemoryQuotaExceeded = false;
      return false;
    }
    inMemoryQuotaExceeded = true;
    return true;
  } catch {
    return false;
  }
}

export function markFirestoreQuotaExceeded(): void {
  inMemoryQuotaExceeded = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QUOTA_EXCEEDED_KEY, Date.now().toString());
    } catch {}
  }
}

/**
 * Upload & Sync entire vocabulary list for a specific authenticated user
 */
export async function syncWordsToFirebase(words: VocabItem[], userId?: string): Promise<boolean> {
  if (!userId || userId === 'guest' || userId.startsWith('guest_') || isFirestoreQuotaExceeded()) {
    return false;
  }

  try {
    const BUNDLE_SIZE = 300;
    const totalBundles = Math.ceil(words.length / BUNDLE_SIZE);

    const batch = writeBatch(db);

    // Save bundle count index under user space
    const metaRef = doc(db, 'users', userId, 'meta', 'words_index');
    batch.set(metaRef, { totalBundles, totalWords: words.length, updatedAt: Date.now() }, { merge: true });

    for (let i = 0; i < totalBundles; i++) {
      const chunk = words.slice(i * BUNDLE_SIZE, (i + 1) * BUNDLE_SIZE);
      const bundleRef = doc(db, 'users', userId, 'word_bundles', `bundle_${i}`);
      batch.set(bundleRef, { bundleIndex: i, words: chunk, updatedAt: Date.now() }, { merge: true });
    }

    await batch.commit();
    return true;
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota') ||
      error?.message?.includes('resource-exhausted') ||
      error?.message?.includes('backoff')
    ) {
      markFirestoreQuotaExceeded();
    }
    return false;
  }
}

/**
 * Upload & Sync sets to Firestore for a specific user
 */
export async function syncSetsToFirebase(sets: WordSet[], userId?: string): Promise<boolean> {
  if (!userId || userId === 'guest' || userId.startsWith('guest_') || isFirestoreQuotaExceeded()) {
    return false;
  }

  try {
    const ref = doc(db, 'users', userId, 'meta', 'sets_bundle');
    await setDoc(ref, { sets, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota') ||
      error?.message?.includes('resource-exhausted')
    ) {
      markFirestoreQuotaExceeded();
    }
    return false;
  }
}

/**
 * Upload user progress to Firestore for a specific user
 */
export async function syncProgressToFirebase(progress: UserProgress, userId?: string): Promise<boolean> {
  if (!userId || userId === 'guest' || userId.startsWith('guest_') || isFirestoreQuotaExceeded()) {
    return false;
  }

  try {
    const ref = doc(db, 'users', userId, 'meta', 'user_progress');
    await setDoc(ref, { progress, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota') ||
      error?.message?.includes('resource-exhausted')
    ) {
      markFirestoreQuotaExceeded();
    }
    return false;
  }
}

/**
 * Load all words from Firebase Cloud for a specific user
 */
export async function loadWordsFromFirebase(userId?: string): Promise<VocabItem[] | null> {
  if (!userId || userId === 'guest' || userId.startsWith('guest_') || isFirestoreQuotaExceeded()) {
    return null;
  }

  try {
    const bundlesCol = collection(db, 'users', userId, 'word_bundles');
    const bundleSnap = await getDocs(bundlesCol);

    if (!bundleSnap.empty) {
      const allWords: VocabItem[] = [];
      bundleSnap.forEach((d) => {
        const data = d.data();
        if (Array.isArray(data.words)) {
          allWords.push(...data.words);
        }
      });
      if (allWords.length > 0) {
        return allWords;
      }
    }
    return null;
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota') ||
      error?.message?.includes('resource-exhausted')
    ) {
      markFirestoreQuotaExceeded();
    }
    return null;
  }
}

/**
 * Load sets from Firebase Cloud for a specific user
 */
export async function loadSetsFromFirebase(userId?: string): Promise<WordSet[] | null> {
  if (!userId || userId === 'guest' || userId.startsWith('guest_') || isFirestoreQuotaExceeded()) {
    return null;
  }

  try {
    const setsDocRef = doc(db, 'users', userId, 'meta', 'sets_bundle');
    const snap = await getDoc(setsDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.sets) && data.sets.length > 0) {
        return data.sets as WordSet[];
      }
    }
    return null;
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota') ||
      error?.message?.includes('resource-exhausted')
    ) {
      markFirestoreQuotaExceeded();
    }
    return null;
  }
}

/**
 * Load words from the public / shared 'ielts_words' collection or 'ielts_word_bundles' in Firestore
 */
export async function fetchFromIeltsWordsCollection(): Promise<{ words: VocabItem[]; sets?: WordSet[] }> {
  const words: VocabItem[] = [];
  const setsMap = new Map<string, WordSet>();

  try {
    // 1. Try reading from 'ielts_word_bundles'
    try {
      const bundlesCol = collection(db, 'ielts_word_bundles');
      const bundlesSnap = await getDocs(bundlesCol);
      if (!bundlesSnap.empty) {
        bundlesSnap.forEach((d) => {
          const data = d.data();
          if (Array.isArray(data.words)) {
            data.words.forEach((w: any) => {
              if (w && (w.term || w.word)) {
                words.push(normalizeToVocabItem(w, d.id));
              }
            });
          }
        });
      }
    } catch (e) {
      console.warn('Error reading ielts_word_bundles:', e);
    }

    // 2. Try reading from individual 'ielts_words' collection
    try {
      const wordsCol = collection(db, 'ielts_words');
      const wordsSnap = await getDocs(wordsCol);
      if (!wordsSnap.empty) {
        wordsSnap.forEach((d) => {
          const data = d.data();
          if (data) {
            words.push(normalizeToVocabItem(data, d.id));
          }
        });
      }
    } catch (e) {
      console.warn('Error reading ielts_words collection:', e);
    }

    // 3. Try reading from 'ielts_sets'
    try {
      const setsCol = collection(db, 'ielts_sets');
      const setsSnap = await getDocs(setsCol);
      if (!setsSnap.empty) {
        setsSnap.forEach((d) => {
          const data = d.data();
          if (data && data.title) {
            setsMap.set(d.id, {
              id: d.id,
              title: data.title || 'Bộ từ vựng IELTS',
              description: data.description || 'Bộ từ vựng học thuật IELTS',
              sourceType: data.sourceType || 'custom',
              mainTopic: data.mainTopic || data.topic || 'IELTS Academic',
              topics: Array.isArray(data.topics) ? data.topics : [data.mainTopic || 'IELTS'],
              createdAt: data.createdAt || Date.now(),
              totalWords: data.totalWords || 0,
              tags: Array.isArray(data.tags) ? data.tags : ['ielts', 'academic'],
            });
          }
        });
      }
    } catch (e) {
      console.warn('Error reading ielts_sets collection:', e);
    }

    // Deduplicate words by lowercase term
    const uniqueMap = new Map<string, VocabItem>();
    words.forEach((w) => {
      const key = (w.term || '').trim().toLowerCase();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, w);
      }
    });

    const uniqueWords = Array.from(uniqueMap.values());
    return {
      words: uniqueWords,
      sets: Array.from(setsMap.values()),
    };
  } catch (error: any) {
    console.error('Failed to fetch from ielts_words:', error);
    return { words: [], sets: [] };
  }
}

/**
 * Normalizes any raw object into a complete VocabItem
 */
function normalizeToVocabItem(data: any, fallbackId: string): VocabItem {
  const term = String(data.term || data.word || data.vocab || data.vocabulary || '').trim();
  const meaning = String(data.meaning || data.definition || data.vietnamese || data.meaningVi || data.vi || '').trim();
  const ipa = String(data.ipa || data.pronunciation || data.phonetic || '').trim();
  const example = String(
    data.example ||
    (Array.isArray(data.examples) && data.examples[0] ? data.examples[0] : '') ||
    data.sentence ||
    ''
  ).trim();

  return {
    id: data.id || `voc-imported-${fallbackId}-${Math.random().toString(36).substring(2, 7)}`,
    term: term || 'IELTS Vocabulary',
    ipa: ipa,
    meaning: meaning || 'Đang cập nhật nghĩa',
    wordFamily: data.wordFamily || data.family || undefined,
    synonyms: Array.isArray(data.synonyms) ? data.synonyms.join(', ') : (data.synonyms || undefined),
    antonyms: Array.isArray(data.antonyms) ? data.antonyms.join(', ') : (data.antonyms || undefined),
    example: example || 'Academic context sentence for IELTS mastery.',
    notes: data.notes || undefined,
    sourceSetId: data.sourceSetId || data.setId || 'set-ielts-database-import',
    cefrLevel: data.cefrLevel || data.level || 'C1',
    targetIeltsBand: data.targetIeltsBand || data.band || '7.5',
    topic: data.topic || data.category || 'IELTS Academic',
    mastery: data.mastery || 'new',
    srsStage: typeof data.srsStage === 'number' ? data.srsStage : 0,
    nextReviewDate: data.nextReviewDate || Date.now(),
    reviewCount: data.reviewCount || 0,
    correctCount: data.correctCount || 0,
    incorrectCount: data.incorrectCount || 0,
    isBookmarked: Boolean(data.isBookmarked),
    isUnlearned: Boolean(data.isUnlearned),
  };
}

/**
 * Load user progress from Firebase Cloud for a specific user
 */
export async function loadProgressFromFirebase(userId?: string): Promise<UserProgress | null> {
  if (!userId || userId === 'guest' || userId.startsWith('guest_') || isFirestoreQuotaExceeded()) {
    return null;
  }

  try {
    const progressDocRef = doc(db, 'users', userId, 'meta', 'user_progress');
    const snap = await getDoc(progressDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.progress) {
        return data.progress as UserProgress;
      }
    }
    return null;
  } catch (error: any) {
    return null;
  }
}
