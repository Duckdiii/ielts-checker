import React from 'react';
import { Sparkles, Brain, RotateCcw, Flame, Tag, Info } from 'lucide-react';
import { PatternMode, PatternTierType } from '../../utils/studyPattern';

interface StudyPatternSelectorProps {
  currentMode: PatternMode;
  onChangeMode: (mode: PatternMode) => void;
  stats?: {
    total: number;
    newCount: number;
    strugglingCount: number;
    dueCount: number;
    anchorCount: number;
  };
  currentTier?: PatternTierType;
  appearanceReason?: string;
  compact?: boolean;
}

export const StudyPatternSelector: React.FC<StudyPatternSelectorProps> = ({
  currentMode,
  onChangeMode,
  stats,
  currentTier,
  appearanceReason,
  compact = false,
}) => {
  return (
    <div className="bg-[#16191D] rounded-2xl border border-[#2D3135] p-3.5 sm:p-4 shadow-lg space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Mẫu Hình Xuất Hiện Từ Vựng</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                Cognitive Interleaving
              </span>
            </div>
            <p className="text-[11px] text-[#8B949E]">
              Thuật toán đan xen từ mới, từ khó/lạ và từ cũ chống quên lãng
            </p>
          </div>
        </div>

        {/* Pattern Mode Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => onChangeMode('smart-interleaved')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              currentMode === 'smart-interleaved'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D]'
            }`}
            title="Đan xen khoa học giữa Từ mới, Từ khó và Ôn tập từ cũ"
          >
            <span>🧠 Xen Kẽ Chuẩn</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('struggling-focus')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              currentMode === 'struggling-focus'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D]'
            }`}
            title="Ưu tiên các từ bạn từng làm sai hoặc gắn dấu sao"
          >
            <span>⚡ Từ Khó / Hay Sai</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('new-focus')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              currentMode === 'new-focus'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D]'
            }`}
            title="Ưu tiên nạp từ vựng mới chưa học"
          >
            <span>🌱 Ưu Tiên Từ Mới</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('review-focus')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              currentMode === 'review-focus'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D]'
            }`}
            title="Tập trung ôn lại từ đến hạn SRS và củng cố từ cũ"
          >
            <span>⏰ Ôn Tập SRS</span>
          </button>
        </div>
      </div>

      {/* Stats Breakdown Bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2D3135] text-[11px]">
          <span className="text-[#8B949E] font-medium">Cấu trúc phiên học:</span>
          {stats.newCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              <span>🌱</span> {stats.newCount} từ mới
            </span>
          )}
          {stats.strugglingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
              <span>⚡</span> {stats.strugglingCount} từ lạ/hay sai
            </span>
          )}
          {stats.dueCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
              <span>⏰</span> {stats.dueCount} đến hạn ôn
            </span>
          )}
          {stats.anchorCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">
              <span>💎</span> {stats.anchorCount} củng cố từ cũ
            </span>
          )}
        </div>
      )}

      {/* Current Word's Appearance Reason Banner */}
      {appearanceReason && (
        <div className="p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[#8B949E] text-[11px] truncate">
              Lý do xuất hiện: <strong className="text-white font-normal">{appearanceReason}</strong>
            </span>
          </div>
          {currentTier && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                currentTier === 'new'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : currentTier === 'struggling'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : currentTier === 'due'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              }`}
            >
              {currentTier === 'new'
                ? '🌱 Từ mới'
                : currentTier === 'struggling'
                ? '⚡ Từ lạ/khó'
                : currentTier === 'due'
                ? '⏰ Đến hạn'
                : '💎 Củng cố'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
