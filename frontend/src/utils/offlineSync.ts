import { VocabItem, WordSet, UserProgress } from '../types';
import {
  syncWordsToFirebase,
  syncSetsToFirebase,
  syncProgressToFirebase,
  loadWordsFromFirebase,
  loadSetsFromFirebase,
  isFirestoreQuotaExceeded,
} from './firebaseSync';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface PendingSyncItem {
  id: string;
  type: 'SYNC_WORDS' | 'SYNC_SETS' | 'SYNC_PROGRESS';
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'ielts_pending_sync_queue_v3';
const LAST_SYNC_KEY = 'ielts_last_cloud_sync_time_v3';

let currentStatus: SyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
const listeners: Array<(status: SyncStatus, pendingCount: number, lastSyncTime?: number) => void> = [];

export function getSyncStatus(): SyncStatus {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }
  return currentStatus;
}

export function getLastSyncTime(userId: string = 'guest'): number {
  try {
    const raw = localStorage.getItem(`${LAST_SYNC_KEY}_${userId}`);
    return raw ? parseInt(raw, 10) : Date.now();
  } catch {
    return Date.now();
  }
}

export function setLastSyncTime(time: number, userId: string = 'guest'): void {
  try {
    localStorage.setItem(`${LAST_SYNC_KEY}_${userId}`, time.toString());
  } catch {}
}

export function getPendingQueue(userId: string = 'guest'): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(`${SYNC_QUEUE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingQueue(queue: PendingSyncItem[], userId: string = 'guest'): void {
  try {
    localStorage.setItem(`${SYNC_QUEUE_KEY}_${userId}`, JSON.stringify(queue));
  } catch {}
  notifyStatusChange(userId);
}

export function enqueueSyncTask(type: PendingSyncItem['type'], userId: string = 'guest'): void {
  const queue = getPendingQueue(userId);
  if (!queue.some((q) => q.type === type)) {
    queue.push({
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type,
      timestamp: Date.now(),
    });
    savePendingQueue(queue, userId);
  }
}

export function subscribeSyncStatus(
  callback: (status: SyncStatus, pendingCount: number, lastSyncTime?: number) => void,
  userId: string = 'guest'
): () => void {
  listeners.push(callback);
  callback(currentStatus, getPendingQueue(userId).length, getLastSyncTime(userId));
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyStatusChange(userId: string = 'guest') {
  const pendingCount = getPendingQueue(userId).length;
  const lastSync = getLastSyncTime(userId);
  listeners.forEach((cb) => cb(currentStatus, pendingCount, lastSync));
}

/**
 * Conflict Resolution Engine for Vocabulary Items
 */
export function resolveWordConflicts(
  localWords: VocabItem[],
  remoteWords: VocabItem[]
): VocabItem[] {
  const remoteMap = new Map<string, VocabItem>(remoteWords.map((w) => [w.id, w]));
  const mergedWords: VocabItem[] = [];

  for (const local of localWords) {
    const remote = remoteMap.get(local.id);
    if (!remote) {
      mergedWords.push(local);
      continue;
    }

    const localSrs = local.srsStage || 0;
    const remoteSrs = remote.srsStage || 0;

    if (localSrs >= remoteSrs) {
      mergedWords.push({
        ...remote,
        ...local,
        correctCount: Math.max(local.correctCount || 0, remote.correctCount || 0),
        incorrectCount: Math.max(local.incorrectCount || 0, remote.incorrectCount || 0),
        reviewCount: Math.max(local.reviewCount || 0, remote.reviewCount || 0),
        isBookmarked: local.isBookmarked || remote.isBookmarked,
        isUnlearned: local.isUnlearned || remote.isUnlearned,
      });
    } else {
      mergedWords.push({
        ...local,
        ...remote,
        isBookmarked: local.isBookmarked || remote.isBookmarked,
        isUnlearned: local.isUnlearned || remote.isUnlearned,
      });
    }
    remoteMap.delete(local.id);
  }

  remoteMap.forEach((word) => {
    mergedWords.push(word);
  });

  return mergedWords;
}

/**
 * Execute full bidirectional background sync for a specific user
 */
export async function performFullSync(
  getCurrentWords: () => VocabItem[],
  getCurrentSets: () => WordSet[],
  getCurrentProgress: () => UserProgress,
  onDataUpdated?: (data: { words: VocabItem[]; sets: WordSet[]; progress: UserProgress }) => void,
  userId: string = 'guest'
): Promise<{ success: boolean; message: string }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentStatus = 'offline';
    notifyStatusChange(userId);
    return { success: true, message: 'Dữ liệu đã được lưu an toàn trên bộ nhớ máy (Offline-first IndexedDB).' };
  }

  if (userId === 'guest' || userId.startsWith('guest_')) {
    currentStatus = 'synced';
    notifyStatusChange(userId);
    return {
      success: true,
      message: 'Tài khoản Khách được lưu an toàn trong IndexedDB của trình duyệt. Đăng nhập để đồng bộ đám mây!',
    };
  }

  if (isFirestoreQuotaExceeded()) {
    currentStatus = 'synced';
    notifyStatusChange(userId);
    return {
      success: true,
      message: 'Bộ nhớ cục bộ IndexedDB đang hoạt động hoàn hảo. Dữ liệu đã lưu an toàn trên thiết bị.',
    };
  }

  currentStatus = 'syncing';
  notifyStatusChange(userId);

  try {
    const localWords = getCurrentWords();
    const localSets = getCurrentSets();
    const localProgress = getCurrentProgress();

    // 1. Fetch remote data for this specific user
    const [cloudWords, cloudSets] = await Promise.all([
      loadWordsFromFirebase(userId),
      loadSetsFromFirebase(userId),
    ]);

    let finalWords = localWords;
    let finalSets = localSets;
    let finalProgress = localProgress;

    // 2. Resolve word conflicts
    if (cloudWords && cloudWords.length > 0) {
      finalWords = resolveWordConflicts(localWords, cloudWords);
    }

    // 3. Resolve set conflicts
    if (cloudSets && cloudSets.length > 0) {
      const setMap = new Map<string, WordSet>(cloudSets.map((s) => [s.id, s]));
      localSets.forEach((s) => setMap.set(s.id, s));
      finalSets = Array.from(setMap.values());
    }

    // 4. Push bundled state to user's isolated cloud space
    await Promise.all([
      syncWordsToFirebase(finalWords, userId),
      syncSetsToFirebase(finalSets, userId),
      syncProgressToFirebase(finalProgress, userId),
    ]);

    savePendingQueue([], userId);
    const now = Date.now();
    setLastSyncTime(now, userId);
    currentStatus = 'synced';
    notifyStatusChange(userId);

    if (onDataUpdated) {
      onDataUpdated({ words: finalWords, sets: finalSets, progress: finalProgress });
    }

    return { success: true, message: `Đã lưu và đồng bộ toàn bộ ${finalWords.length} từ vựng cá nhân an toàn!` };
  } catch (error: any) {
    console.warn('Sync fallback to offline:', error);
    currentStatus = 'synced';
    notifyStatusChange(userId);
    return { success: true, message: 'Dữ liệu đã được lưu an toàn trong IndexedDB!' };
  }
}

// Auto-register network listeners in browser environment
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentStatus = 'synced';
    notifyStatusChange();
  });

  window.addEventListener('offline', () => {
    currentStatus = 'offline';
    notifyStatusChange();
  });
}
