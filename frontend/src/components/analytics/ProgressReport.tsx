import React from 'react';
import {
  ArrowLeft,
  Flame,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { UserProgress, VocabItem, WordSet } from '../../types';
import { speakWord } from '../../utils/speech';
import { VocabularyGapMatrix } from './VocabularyGapMatrix';

interface ProgressReportProps {
  progress: UserProgress;
  words: VocabItem[];
  sets: WordSet[];
  activeSetId?: string;
  onSelectSet?: (setId: string) => void;
  onStartMode?: (mode: string) => void;
  onBack: () => void;
  onPracticeWeakWords: () => void;
  onSelectWord: (word: VocabItem) => void;
}

export const ProgressReport: React.FC<ProgressReportProps> = ({
  progress,
  words,
  sets,
  activeSetId,
  onSelectSet,
  onStartMode,
  onBack,
  onPracticeWeakWords,
  onSelectWord,
}) => {
  const mastered = words.filter((w) => w.mastery === 'mastered');
  const reviewing = words.filter((w) => w.mastery === 'reviewing');
  const learning = words.filter((w) => w.mastery === 'learning');
  const newWords = words.filter((w) => w.mastery === 'new');

  const weakWords = words
    .filter((w) => (w.incorrectCount || 0) > 0)
    .sort((a, b) => (b.incorrectCount || 0) - (a.incorrectCount || 0));

  const totalReviews = words.reduce((acc, w) => acc + (w.reviewCount || 0), 0);
  const totalCorrect = words.reduce((acc, w) => acc + (w.correctCount || 0), 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 85;

  return (
    <div className="max-w-[1600px] w-full mx-auto space-y-6 animate-fadeIn px-2 sm:px-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16191F] p-4 rounded-2xl border border-[#2D333B] shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8B949E] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
        </button>
        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/30 uppercase tracking-wider">
          Phân Tích Tiến Độ & SRS Analytics
        </span>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#16191D] p-5 rounded-2xl border border-[#2D3135] shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
              IELTS Lexical Band
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {progress.estimatedBand.toFixed(1)}
          </div>
          <div className="text-[11px] text-[#8B949E]">Dựa trên số từ & độ khó</div>
        </div>

        <div className="bg-[#16191D] p-5 rounded-2xl border border-[#2D3135] shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
              Chuỗi Ngày Học
            </span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {progress.streakDays} ngày
          </div>
          <div className="text-[11px] text-[#8B949E]">Giữ lửa đều đặn</div>
        </div>

        <div className="bg-[#16191D] p-5 rounded-2xl border border-[#2D3135] shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
              Đã Thuộc Hoàn Toàn
            </span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-400">
            {mastered.length} từ
          </div>
          <div className="text-[11px] text-[#8B949E]">
            {words.length > 0 ? Math.round((mastered.length / words.length) * 100) : 0}% tổng kho từ
          </div>
        </div>

        <div className="bg-[#16191D] p-5 rounded-2xl border border-[#2D3135] shadow-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
              Lượt Ôn Phản Xạ
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-400">
            {totalReviews || progress.totalReviews}
          </div>
          <div className="text-[11px] text-[#8B949E]">Độ chính xác: ~{accuracy}%</div>
        </div>
      </div>

      {/* Retention Curve & Stage Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Phân Bố Giai Đoạn Ghi Nhớ (FSRS Stages)
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-semibold">Stage 4-5 - Trí nhớ dài hạn (Mastered)</span>
                <span className="text-white font-bold">{mastered.length} từ</span>
              </div>
              <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(mastered.length / (words.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-400 font-semibold">Stage 2-3 - Ổn định trí nhớ (Reviewing)</span>
                <span className="text-white font-bold">{reviewing.length} từ</span>
              </div>
              <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${(reviewing.length / (words.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-semibold">Stage 1 - Mới học / Hay quên (Learning)</span>
                <span className="text-white font-bold">{learning.length} từ</span>
              </div>
              <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(learning.length / (words.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8B949E] font-semibold">Stage 0 - Chưa kích hoạt</span>
                <span className="text-white font-bold">{newWords.length} từ</span>
              </div>
              <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#30363D] rounded-full"
                  style={{ width: `${(newWords.length / (words.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sets Summary */}
        <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Các Bộ Dữ Liệu Từ Vựng Đã Nạp ({sets.length})
            </h3>
            <span className="text-[11px] text-[#8B949E]">Nhấn để chuyển bộ</span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {sets.map((s) => {
              const count = words.filter((w) => w.sourceSetId === s.id).length;
              const isActive = s.id === activeSetId;
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSet && onSelectSet(s.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                      : 'bg-[#21262D] border-[#30363D] hover:border-indigo-500/30 text-[#E0E2E4]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold block">{s.title}</span>
                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-600 text-white font-bold">
                          ĐANG CHỌN
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8B949E]">
                      {s.sourceType === 'pdf' ? `📄 PDF: ${s.fileName || 'file'}` : '✨ Tích hợp sẵn'}
                    </span>
                  </div>
                  <span className="font-semibold text-indigo-400 bg-[#16191D] px-2 py-0.5 rounded border border-[#30363D]">
                    {count} từ
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vocabulary Gap Matrix (Radar & Topic Weaknesses) */}
      <VocabularyGapMatrix
        words={words}
        onPracticeTopic={(topic) => {
          if (onStartMode) onStartMode('quiz');
        }}
      />

      {/* Quick Launch Practice Modes Bar */}
      {onStartMode && (
        <div className="bg-[#16191D] p-5 rounded-2xl border border-[#2D3135] shadow-lg space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            Bắt đầu buổi ôn luyện ngay:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              onClick={() => onStartMode('flashcard')}
              className="p-3 rounded-xl bg-[#21262D] hover:bg-indigo-600/20 text-[#E0E2E4] hover:text-indigo-300 border border-[#30363D] hover:border-indigo-500/40 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <span>📇</span>
              <span>Flashcard SRS</span>
            </button>
            <button
              onClick={() => onStartMode('quiz')}
              className="p-3 rounded-xl bg-[#21262D] hover:bg-blue-600/20 text-[#E0E2E4] hover:text-blue-300 border border-[#30363D] hover:border-blue-500/40 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <span>⚡</span>
              <span>Trắc Nghiệm</span>
            </button>
            <button
              onClick={() => onStartMode('spelling')}
              className="p-3 rounded-xl bg-[#21262D] hover:bg-emerald-600/20 text-[#E0E2E4] hover:text-emerald-300 border border-[#30363D] hover:border-emerald-500/40 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <span>✍️</span>
              <span>Luyện Gõ</span>
            </button>
            <button
              onClick={() => onStartMode('word-family')}
              className="p-3 rounded-xl bg-[#21262D] hover:bg-amber-600/20 text-[#E0E2E4] hover:text-amber-300 border border-[#30363D] hover:border-amber-500/40 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <span>🧩</span>
              <span>Ghép Họ Từ</span>
            </button>
            <button
              onClick={() => onStartMode('cloze')}
              className="p-3 rounded-xl bg-[#21262D] hover:bg-rose-600/20 text-[#E0E2E4] hover:text-rose-300 border border-[#30363D] hover:border-rose-500/40 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
            >
              <span>📝</span>
              <span>Điền Ngữ Cảnh</span>
            </button>
          </div>
        </div>
      )}

      {/* Weak Words Alert Table */}
      {weakWords.length > 0 && (
        <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                Các Từ Hay Bị Sai Cần Ôn Tập Lại ({weakWords.length} từ)
              </h3>
              <p className="text-xs text-[#8B949E]">
                Hệ thống ưu tiên đẩy những từ này vào chu kỳ Flashcard và Quiz để củng cố
              </p>
            </div>
            <button
              onClick={onPracticeWeakWords}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
            >
              Luyện ngay các từ này
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {weakWords.slice(0, 6).map((w) => (
              <div
                key={w.id}
                onClick={() => onSelectWord(w)}
                className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] hover:border-rose-500/50 transition-all cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    {w.term}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(w.term);
                      }}
                      className="text-[#8B949E] hover:text-indigo-400"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-[#8B949E] truncate max-w-[160px]">
                    {w.meaning}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Sai {w.incorrectCount} lần
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
