import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Bell,
  BellOff,
  Sparkles,
  Zap,
  Clock,
  Check,
  ChevronDown,
  X,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export type TimerMode = 'per-card' | 'session';
export type TimeoutAction = 'auto-flip' | 'alert' | 'pause';

export interface TimerSettings {
  enabled: boolean;
  mode: TimerMode;
  perCardSeconds: number;
  sessionMinutes: number;
  timeoutAction: TimeoutAction;
  playTickSound: boolean;
  playAlertSound: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
  enabled: false,
  mode: 'per-card',
  perCardSeconds: 10,
  sessionMinutes: 5,
  timeoutAction: 'auto-flip',
  playTickSound: false,
  playAlertSound: true,
};

const STORAGE_KEY = 'ielts_flashcard_timer_settings';

interface FlashcardCountdownTimerProps {
  currentIndex: number;
  isFlipped: boolean;
  onTimeoutFlip?: () => void;
  onSessionTimeout?: () => void;
  compact?: boolean;
}

export const FlashcardCountdownTimer: React.FC<FlashcardCountdownTimerProps> = ({
  currentIndex,
  isFlipped,
  onTimeoutFlip,
  onSessionTimeout,
  compact = false,
}) => {
  // Load saved settings from LocalStorage
  const [settings, setSettings] = useState<TimerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return settings.mode === 'per-card'
      ? settings.perCardSeconds
      : settings.sessionMinutes * 60;
  });
  const [totalSeconds, setTotalSeconds] = useState<number>(() => {
    return settings.mode === 'per-card'
      ? settings.perCardSeconds
      : settings.sessionMinutes * 60;
  });

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [customInputVal, setCustomInputVal] = useState<string>(
    settings.mode === 'per-card'
      ? String(settings.perCardSeconds)
      : String(settings.sessionMinutes)
  );

  const prevIndexRef = useRef<number>(currentIndex);
  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // When timer settings or mode change, re-sync duration
  const applyDurationFromSettings = (newSettings: TimerSettings) => {
    const duration =
      newSettings.mode === 'per-card'
        ? newSettings.perCardSeconds
        : newSettings.sessionMinutes * 60;
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    if (newSettings.enabled) {
      setIsRunning(true);
    }
  };

  // Reset timer on card change (if in per-card mode)
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      if (settings.enabled && settings.mode === 'per-card') {
        setSecondsLeft(settings.perCardSeconds);
        setTotalSeconds(settings.perCardSeconds);
        setIsRunning(true);
      }
    }
  }, [currentIndex, settings.enabled, settings.mode, settings.perCardSeconds]);

  // Main countdown interval loop
  useEffect(() => {
    if (!settings.enabled || !isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer Expired
          if (settings.playAlertSound) {
            sounds.playTimeAlert();
          }

          if (settings.mode === 'per-card') {
            if (settings.timeoutAction === 'auto-flip' && !isFlipped && onTimeoutFlip) {
              onTimeoutFlip();
            }
            // In per-card mode, stay at 0 until user flips or moves to next card
            setIsRunning(false);
            return 0;
          } else {
            // Session mode timeout
            setIsRunning(false);
            if (onSessionTimeout) {
              onSessionTimeout();
            }
            return 0;
          }
        }

        // Play tick sound in final 3 seconds
        if (prev <= 4 && settings.playTickSound) {
          sounds.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    settings.enabled,
    isRunning,
    settings.mode,
    settings.timeoutAction,
    settings.playAlertSound,
    settings.playTickSound,
    isFlipped,
    onTimeoutFlip,
    onSessionTimeout,
  ]);

  const toggleRunning = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    if (!settings.enabled) {
      // Enable timer and start
      const updated: TimerSettings = { ...settings, enabled: true };
      setSettings(updated);
      applyDurationFromSettings(updated);
      setIsRunning(true);
    } else {
      if (secondsLeft === 0) {
        // Reset and run
        const duration =
          settings.mode === 'per-card'
            ? settings.perCardSeconds
            : settings.sessionMinutes * 60;
        setSecondsLeft(duration);
        setIsRunning(true);
      } else {
        setIsRunning((prev) => !prev);
      }
    }
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    const duration =
      settings.mode === 'per-card'
        ? settings.perCardSeconds
        : settings.sessionMinutes * 60;
    setSecondsLeft(duration);
    setTotalSeconds(duration);
    if (settings.enabled) {
      setIsRunning(true);
    }
  };

  const handleToggleEnable = () => {
    sounds.playClick();
    const newEnabled = !settings.enabled;
    const updated = { ...settings, enabled: newEnabled };
    setSettings(updated);
    if (newEnabled) {
      applyDurationFromSettings(updated);
    } else {
      setIsRunning(false);
    }
  };

  const selectPerCardPreset = (seconds: number) => {
    sounds.playClick();
    const updated: TimerSettings = {
      ...settings,
      perCardSeconds: seconds,
      mode: 'per-card',
      enabled: true,
    };
    setSettings(updated);
    setCustomInputVal(String(seconds));
    applyDurationFromSettings(updated);
  };

  const selectSessionPreset = (minutes: number) => {
    sounds.playClick();
    const updated: TimerSettings = {
      ...settings,
      sessionMinutes: minutes,
      mode: 'session',
      enabled: true,
    };
    setSettings(updated);
    setCustomInputVal(String(minutes));
    applyDurationFromSettings(updated);
  };

  const handleApplyCustomTime = () => {
    const num = parseInt(customInputVal, 10);
    if (isNaN(num) || num <= 0) return;

    sounds.playClick();
    if (settings.mode === 'per-card') {
      const clamped = Math.min(Math.max(num, 3), 300); // 3s - 300s
      const updated: TimerSettings = {
        ...settings,
        perCardSeconds: clamped,
        enabled: true,
      };
      setSettings(updated);
      setCustomInputVal(String(clamped));
      applyDurationFromSettings(updated);
    } else {
      const clamped = Math.min(Math.max(num, 1), 120); // 1m - 120m
      const updated: TimerSettings = {
        ...settings,
        sessionMinutes: clamped,
        enabled: true,
      };
      setSettings(updated);
      setCustomInputVal(String(clamped));
      applyDurationFromSettings(updated);
    }
  };

  // Format display time
  const formatTime = (secs: number) => {
    if (settings.mode === 'per-card' && totalSeconds < 60) {
      return `${secs}s`;
    }
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins}:${remainderSecs < 10 ? '0' : ''}${remainderSecs}`;
  };

  // Color calculation based on remaining percentage
  const percentage = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const isCritical = secondsLeft <= 3 && secondsLeft > 0;
  const isExpired = secondsLeft === 0 && settings.enabled;

  const colorStyles = isExpired
    ? 'text-rose-400 bg-rose-500/15 border-rose-500/40 animate-pulse'
    : isCritical
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse'
    : percentage < 35
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30';

  const strokeColor = isExpired || isCritical
    ? '#F43F5E'
    : percentage < 35
    ? '#F59E0B'
    : '#818CF8';

  return (
    <div className="relative inline-flex items-center">
      {/* ========================================================================= */}
      {/* ⏱️ MAIN COMPACT TIMER BADGE (Always Visible on Header / Toolbar)          */}
      {/* ========================================================================= */}
      <div
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all shadow-sm ${
          settings.enabled ? colorStyles : 'bg-[#21262D] text-slate-400 border-[#30363D]'
        }`}
      >
        {/* Circular Progress Ring or Clock Icon */}
        <button
          type="button"
          onClick={toggleRunning}
          title={
            !settings.enabled
              ? 'Bật đếm ngược (Bấm để kích hoạt)'
              : isRunning
              ? 'Tạm dừng đếm ngược'
              : 'Tiếp tục đếm ngược'
          }
          className="relative flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
        >
          {settings.enabled ? (
            <div className="relative w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke={strokeColor}
                  strokeDasharray={`${percentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="4"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center">
                {isRunning ? (
                  <Pause className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                )}
              </span>
            </div>
          ) : (
            <Timer className="w-4 h-4 text-slate-400 hover:text-indigo-400 transition-colors" />
          )}
        </button>

        {/* Time Text & Mode Tag */}
        <div
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-1.5 cursor-pointer select-none"
          title="Bấm để tùy chỉnh thời gian đếm ngược"
        >
          <span className="font-mono text-xs sm:text-sm font-black tracking-wider">
            {settings.enabled ? formatTime(secondsLeft) : 'Đồng hồ'}
          </span>

          {settings.enabled && (
            <span className="text-[10px] font-semibold opacity-75 px-1 py-0.2 rounded bg-black/20 hidden sm:inline">
              {settings.mode === 'per-card' ? 'mỗi thẻ' : 'phiên'}
            </span>
          )}
        </div>

        {/* Reset Button (If active) */}
        {settings.enabled && (
          <button
            type="button"
            onClick={handleReset}
            title="Đặt lại đồng hồ"
            className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}

        {/* Settings Toggle Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setShowSettingsModal((prev) => !prev);
          }}
          title="Tùy chỉnh thời gian & chế độ"
          className="text-slate-400 hover:text-indigo-300 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ⚙️ POPUP / MODAL TÙY CHỈNH THỜI GIAN & CHẾ ĐỘ ĐẾM NGƯỢC                     */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowSettingsModal(false)}
          />

          {/* Settings Card */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 bg-[#16191D] rounded-2xl border border-[#30363D] shadow-2xl p-4 sm:p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#2D3135] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Đồng Hồ Đếm Ngược</h4>
                  <p className="text-[11px] text-slate-400">Rèn luyện phản xạ & độ tập trung</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#21262D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Master Switch Enable / Disable */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Kích hoạt đếm ngược</span>
              </div>
              <button
                type="button"
                onClick={handleToggleEnable}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Mode Selector: Per Card vs Full Session */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Loại đồng hồ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    const updated: TimerSettings = { ...settings, mode: 'per-card' };
                    setSettings(updated);
                    setCustomInputVal(String(settings.perCardSeconds));
                    applyDurationFromSettings(updated);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    settings.mode === 'per-card'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-[#21262D] border-[#30363D] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">⏱️ Mỗi Thẻ</span>
                    {settings.mode === 'per-card' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400">Reset thời gian khi sang thẻ mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    const updated: TimerSettings = { ...settings, mode: 'session' };
                    setSettings(updated);
                    setCustomInputVal(String(settings.sessionMinutes));
                    applyDurationFromSettings(updated);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    settings.mode === 'session'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-[#21262D] border-[#30363D] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">⏳ Cả Phiên Học</span>
                    {settings.mode === 'session' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400">Đếm ngược cả buổi (Pomodoro)</span>
                </button>
              </div>
            </div>

            {/* Preset Time Buttons */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {settings.mode === 'per-card' ? 'Thời gian cho mỗi thẻ (Giây)' : 'Thời gian phiên học (Phút)'}
              </label>

              {settings.mode === 'per-card' ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 30].map((secs) => (
                    <button
                      key={secs}
                      type="button"
                      onClick={() => selectPerCardPreset(secs)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        settings.perCardSeconds === secs
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-[#21262D] text-slate-300 border-[#30363D] hover:border-indigo-500/50 hover:text-white'
                      }`}
                    >
                      {secs}s
                      {secs === 5 && <span className="block text-[9px] text-amber-300 font-normal">Blitz</span>}
                      {secs === 10 && <span className="block text-[9px] text-indigo-300 font-normal">Chuẩn</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 5, 15, 25].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => selectSessionPreset(mins)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        settings.sessionMinutes === mins
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-[#21262D] text-slate-300 border-[#30363D] hover:border-indigo-500/50 hover:text-white'
                      }`}
                    >
                      {mins}m
                      {mins === 25 && <span className="block text-[9px] text-rose-300 font-normal">Pomo</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Time Input Form */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={settings.mode === 'per-card' ? 3 : 1}
                    max={settings.mode === 'per-card' ? 300 : 120}
                    value={customInputVal}
                    onChange={(e) => setCustomInputVal(e.target.value)}
                    placeholder={settings.mode === 'per-card' ? 'Nhập số giây...' : 'Nhập số phút...'}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#21262D] border border-[#30363D] text-xs font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                    {settings.mode === 'per-card' ? 'giây' : 'phút'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustomTime}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Action on Timeout (Per-card mode only) */}
            {settings.mode === 'per-card' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Hành động khi hết giờ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSettings({ ...settings, timeoutAction: 'auto-flip' });
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.timeoutAction === 'auto-flip'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-[#21262D] border-[#30363D] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">🔄 Tự động lật thẻ</span>
                    <span className="text-[10px] text-slate-400">Mở mặt sau xem nghĩa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSettings({ ...settings, timeoutAction: 'alert' });
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.timeoutAction === 'alert'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-[#21262D] border-[#30363D] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">🔔 Chỉ báo chuông</span>
                    <span className="text-[10px] text-slate-400">Chờ người học tự bấm</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sound Toggles */}
            <div className="pt-2 border-t border-[#2D3135] flex items-center justify-between gap-3 text-xs text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={settings.playAlertSound}
                  onChange={(e) => {
                    sounds.playClick();
                    setSettings({ ...settings, playAlertSound: e.target.checked });
                  }}
                  className="rounded bg-[#21262D] border-[#30363D] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Chuông hết giờ</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={settings.playTickSound}
                  onChange={(e) => {
                    sounds.playClick();
                    setSettings({ ...settings, playTickSound: e.target.checked });
                  }}
                  className="rounded bg-[#21262D] border-[#30363D] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Tích tắc 3s cuối</span>
              </label>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2D3135]">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-[#21262D] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đặt lại từ đầu
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  setShowSettingsModal(false);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
