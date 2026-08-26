import { VocabItem, WordSet, UserProgress, SpeakingPortfolioItem } from '../types';
import { DEFAULT_SETS, DEFAULT_VOCABULARY } from '../data/defaultSets';

const DB_NAME = 'IeltsMasterVocabDB';
const DB_VERSION = 3;
const STORE_SETS = 'word_sets';
const STORE_WORDS = 'vocab_words';
const STORE_PROGRESS = 'user_progress';
const STORE_SPEAKING = 'speaking_portfolio';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Sets Store
      if (!db.objectStoreNames.contains(STORE_SETS)) {
        const setStore = db.createObjectStore(STORE_SETS, { keyPath: 'dbId' });
        setStore.createIndex('userId', 'userId', { unique: false });
      } else {
        const setStore = (event.target as IDBOpenDBRequest).transaction?.objectStore(STORE_SETS);
        if (setStore && !setStore.indexNames.contains('userId')) {
          setStore.createIndex('userId', 'userId', { unique: false });
        }
      }

      // Words Store
      if (!db.objectStoreNames.contains(STORE_WORDS)) {
        const wordStore = db.createObjectStore(STORE_WORDS, { keyPath: 'dbId' });
        wordStore.createIndex('userId', 'userId', { unique: false });
        wordStore.createIndex('sourceSetId', 'sourceSetId', { unique: false });
        wordStore.createIndex('topic', 'topic', { unique: false });
        wordStore.createIndex('mastery', 'mastery', { unique: false });
      } else {
        const wordStore = (event.target as IDBOpenDBRequest).transaction?.objectStore(STORE_WORDS);
        if (wordStore && !wordStore.indexNames.contains('userId')) {
          wordStore.createIndex('userId', 'userId', { unique: false });
        }
      }

      // Progress Store
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        const progressStore = db.createObjectStore(STORE_PROGRESS, { keyPath: 'userId' });
      }

      // Speaking Store
      if (!db.objectStoreNames.contains(STORE_SPEAKING)) {
        const speakingStore = db.createObjectStore(STORE_SPEAKING, { keyPath: 'dbId' });
        speakingStore.createIndex('userId', 'userId', { unique: false });
        speakingStore.createIndex('timestamp', 'timestamp', { unique: false });
      } else {
        const speakingStore = (event.target as IDBOpenDBRequest).transaction?.objectStore(STORE_SPEAKING);
        if (speakingStore && !speakingStore.indexNames.contains('userId')) {
          speakingStore.createIndex('userId', 'userId', { unique: false });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save all words to IndexedDB for a specific user
 */
export async function saveWordsToIndexedDB(words: VocabItem[], userId: string = 'guest'): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_WORDS, 'readwrite');
    const store = tx.objectStore(STORE_WORDS);

    // Delete existing words for this user
    if (store.indexNames.contains('userId')) {
      const userIndex = store.index('userId');
      const keyRange = IDBKeyRange.only(userId);
      const cursorReq = userIndex.openKeyCursor(keyRange);
      
      await new Promise<void>((resolve, reject) => {
        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          } else {
            resolve();
          }
        };
        cursorReq.onerror = () => resolve(); // continue even if cursor fails
      });
    }

    for (const word of words) {
      store.put({
        ...word,
        userId,
        dbId: `${userId}__${word.id}`,
      });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save words error:', err);
  }
}

/**
 * Load all words from IndexedDB for a specific user
 */
export async function loadWordsFromIndexedDB(userId: string = 'guest'): Promise<VocabItem[] | null> {
  try {
    const db = await openDatabase();
    return new Promise<VocabItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_WORDS, 'readonly');
      const store = tx.objectStore(STORE_WORDS);

      if (store.indexNames.contains('userId')) {
        const index = store.index('userId');
        const req = index.getAll(userId);
        req.onsuccess = () => {
          const results = (req.result as Array<VocabItem & { dbId?: string; userId?: string }>) || [];
          // Strip dbId and userId wrapper before returning
          const cleaned = results.map(({ dbId, userId: _, ...item }) => item as VocabItem);
          resolve(cleaned);
        };
        req.onerror = () => reject(req.error);
      } else {
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result as VocabItem[];
          resolve(results || []);
        };
        req.onerror = () => reject(req.error);
      }
    });
  } catch (err) {
    console.warn('IndexedDB load words error:', err);
    return null;
  }
}

/**
 * Save all sets to IndexedDB for a specific user
 */
export async function saveSetsToIndexedDB(sets: WordSet[], userId: string = 'guest'): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_SETS, 'readwrite');
    const store = tx.objectStore(STORE_SETS);

    if (store.indexNames.contains('userId')) {
      const userIndex = store.index('userId');
      const keyRange = IDBKeyRange.only(userId);
      const cursorReq = userIndex.openKeyCursor(keyRange);
      
      await new Promise<void>((resolve, reject) => {
        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          } else {
            resolve();
          }
        };
        cursorReq.onerror = () => resolve();
      });
    }

    for (const set of sets) {
      store.put({
        ...set,
        userId,
        dbId: `${userId}__${set.id}`,
      });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save sets error:', err);
  }
}

/**
 * Load all sets from IndexedDB for a specific user
 */
export async function loadSetsFromIndexedDB(userId: string = 'guest'): Promise<WordSet[] | null> {
  try {
    const db = await openDatabase();
    return new Promise<WordSet[]>((resolve, reject) => {
      const tx = db.transaction(STORE_SETS, 'readonly');
      const store = tx.objectStore(STORE_SETS);

      if (store.indexNames.contains('userId')) {
        const index = store.index('userId');
        const req = index.getAll(userId);
        req.onsuccess = () => {
          const results = (req.result as Array<WordSet & { dbId?: string; userId?: string }>) || [];
          const cleaned = results.map(({ dbId, userId: _, ...item }) => item as WordSet);
          resolve(cleaned);
        };
        req.onerror = () => reject(req.error);
      } else {
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result as WordSet[];
          resolve(results || []);
        };
        req.onerror = () => reject(req.error);
      }
    });
  } catch (err) {
    console.warn('IndexedDB load sets error:', err);
    return null;
  }
}

/**
 * Save a speaking portfolio recording item to IndexedDB for a user
 */
export async function saveSpeakingItemToIndexedDB(
  item: SpeakingPortfolioItem,
  userId: string = 'guest'
): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_SPEAKING, 'readwrite');
    const store = tx.objectStore(STORE_SPEAKING);

    store.put({
      ...item,
      userId,
      dbId: `${userId}__${item.id}`,
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save speaking item error:', err);
  }
}

/**
 * Load all speaking portfolio items from IndexedDB for a user
 */
export async function loadSpeakingItemsFromIndexedDB(userId: string = 'guest'): Promise<SpeakingPortfolioItem[]> {
  try {
    const db = await openDatabase();
    return new Promise<SpeakingPortfolioItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_SPEAKING, 'readonly');
      const store = tx.objectStore(STORE_SPEAKING);

      if (store.indexNames.contains('userId')) {
        const index = store.index('userId');
        const req = index.getAll(userId);
        req.onsuccess = () => {
          const results = (req.result as Array<SpeakingPortfolioItem & { dbId?: string; userId?: string }>) || [];
          const cleaned = results.map(({ dbId, userId: _, ...item }) => item as SpeakingPortfolioItem);
          cleaned.sort((a, b) => b.timestamp - a.timestamp);
          resolve(cleaned);
        };
        req.onerror = () => reject(req.error);
      } else {
        const req = store.getAll();
        req.onsuccess = () => {
          const results = (req.result as SpeakingPortfolioItem[]) || [];
          results.sort((a, b) => b.timestamp - a.timestamp);
          resolve(results);
        };
        req.onerror = () => reject(req.error);
      }
    });
  } catch (err) {
    console.warn('IndexedDB load speaking items error:', err);
    return [];
  }
}

/**
 * Delete a speaking portfolio item from IndexedDB for a user
 */
export async function deleteSpeakingItemFromIndexedDB(id: string, userId: string = 'guest'): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_SPEAKING, 'readwrite');
    const store = tx.objectStore(STORE_SPEAKING);
    store.delete(`${userId}__${id}`);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete speaking item error:', err);
  }
}
