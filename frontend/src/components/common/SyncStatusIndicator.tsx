import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import {
  SyncStatus,
  subscribeSyncStatus,
  performFullSync,
  getSyncStatus,
  getLastSyncTime,
  getPendingQueue,
} from '../../utils/offlineSync';
import { VocabItem, WordSet, UserProgress } from '../../types';

interface SyncStatusIndicatorProps {
  getWords: () => VocabItem[];
  getSets: () => WordSet[];
  getProgress: () => UserProgress;
  onDataSynced?: (data: { words: VocabItem[]; sets: WordSet[]; progress: UserProgress }) => void;
  compact?: boolean;
  iconOnly?: boolean;
  userId?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  getWords,
  getSets,
  getProgress,
  onDataSynced,
  compact = false,
  iconOnly = false,
  userId = 'guest',
}) => {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());
  const [pendingCount, setPendingCount] = useState<number>(getPendingQueue(userId).length);
  const [lastSyncTime, setLastSyncTime] = useState<number>(getLastSyncTime(userId));
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((newStatus, count, time) => {
      setStatus(newStatus);
      setPendingCount(count);
      if (time) setLastSyncTime(time);
    }, userId);
    return unsubscribe;
  }, [userId]);

  const handleManualSync = async () => {
    if (isManualSyncing) return;
    setIsManualSyncing(true);
    setSyncMessage('Đang đồng bộ dữ liệu...');
    try {
      const res = await performFullSync(getWords, getSets, getProgress, onDataSynced, userId);
      setSyncMessage(res.message);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage(err.message || 'Lỗi đồng bộ');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatTimeAgo = (time: number) => {
    const diff = Math.floor((Date.now() - time) / 1000);
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    return new Date(time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (compact || iconOnly) {
    return (
      <button
        onClick={handleManualSync}
        disabled={isManualSyncing || status === 'offline'}
        title={`Đồng bộ đám mây: ${
          status === 'synced'
            ? `Đã đồng bộ (${formatTimeAgo(lastSyncTime)})`
            : status === 'offline'
            ? 'Ngoại tuyến (Đã lưu an toàn trên máy)'
            : 'Đang đồng bộ...'
        }`}
        className={`flex items-center gap-1.5 ${
          iconOnly ? 'p-1.5 rounded-lg' : 'px-2.5 py-1 rounded-xl text-xs'
        } font-semibold border transition-all cursor-pointer ${
          status === 'synced'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
            : status === 'offline'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
            : status === 'syncing' || isManualSyncing
            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}
      >
        {status === 'synced' ? (
          <Cloud className="w-3.5 h-3.5" />
        ) : status === 'offline' ? (
          <CloudOff className="w-3.5 h-3.5" />
        ) : (
          <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing || status === 'syncing' ? 'animate-spin' : ''}`} />
        )}
        {!iconOnly && (
          <span className="hidden xl:inline">
            {status === 'synced'
              ? 'Đã đồng bộ'
              : status === 'offline'
              ? 'Ngoại tuyến'
              : 'Đang sync...'}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-[#16191F] border border-[#2D333B] px-3 py-1.5 rounded-2xl shadow-sm text-xs">
      <div className="flex items-center gap-2">
        {status === 'synced' ? (
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cloud className="w-4 h-4" />
            <span className="hidden md:inline">Đám mây đã đồng bộ ({formatTimeAgo(lastSyncTime)})</span>
          </span>
        ) : status === 'offline' ? (
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <WifiOff className="w-4 h-4" />
            <span>Ngoại tuyến (Lưu an toàn trên máy)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang đồng bộ dữ liệu...</span>
          </span>
        )}
      </div>

      <button
        onClick={handleManualSync}
        disabled={isManualSyncing || status === 'offline'}
        className="ml-auto p-1.5 rounded-lg bg-[#21262E] hover:bg-[#2D333B] text-[#D0D7DE] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        title="Bấm để đồng bộ ngay"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
      </button>

      {syncMessage && (
        <span className="text-[11px] text-indigo-300 font-medium animate-fadeIn">
          {syncMessage}
        </span>
      )}
    </div>
  );
};
