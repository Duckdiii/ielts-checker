import React, { useMemo } from 'react';
import {
  Flame,
  Trophy,
  Sparkles,
  BookOpen,
  Mic,
  Zap,
  ArrowRight,
  Volume2,
  CheckCircle2,
  Clock,
  Target,
  AlertTriangle,
  Layers,
  ChevronRight,
  TrendingUp,
  Brain,
} from 'lucide-react';
import { VocabItem, WordSet, UserProgress, UserProfile } from '../../types';
import { AppViewTab } from '../../hooks/useHashNavigation';
import { playNativeSpeech } from '../../utils/speech';

interface ModernDashboardProps {
  activeSet: WordSet;
  words: VocabItem[];
  progress: UserProgress;
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onStartMode: (mode: AppViewTab) => void;
  onSelectSet: (id: string) => void;
  onOpenUpload: () => void;
  onOpenBatchImport: () => void;
  onOpenExcelImport: () => void;
  onOpenAddWord: () => void;
  onSelectWord: (word: VocabItem) => void;
  onToggleBookmark: (wordId: string) => void;
  onToggleUnlearned: (wordId: string) => void;
}

export function ModernDashboard({
  activeSet,
  words,
  progress,
  userProfile,
  onOpenProfile,
  onOpenAuth,
  onStartMode,
  onOpenUpload,
  onSelectWord,
}: ModernDashboardProps) {
  // Compute FSRS due words & mastery counts
  const stats = useMemo(() => {
    const now = Date.now();
    const activeWords =
      activeSet.id === 'all-words-library'
        ? words
        : words.filter((w) => w.sourceSetId === activeSet.id);

    const dueWords = activeWords.filter(
      (w) => w.nextReviewDate && w.nextReviewDate <= now && w.mastery !== 'mastered'
    );
    const masteredCount = activeWords.filter((w) => w.mastery === 'mastered').length;
    const learningCount = activeWords.filter((w) => w.mastery === 'learning' || w.mastery === 'reviewing').length;
    const newCount = activeWords.filter((w) => w.mastery === 'new' || !w.mastery).length;
    const weakWords = activeWords.filter((w) => w.isUnlearned || (w.incorrectCount && w.incorrectCount > 1));

    return {
      activeWords,
      dueWordsCount: dueWords.length,
      masteredCount,
      learningCount,
      newCount,
      weakWords: weakWords.slice(0, 3),
      masteryPercent: activeWords.length > 0 ? Math.round((masteredCount / activeWords.length) * 100) : 0,
    };
  }, [words, activeSet]);

  // Word of the Day (random or highest band word)
  const wordOfTheDay: VocabItem | null = useMemo(() => {
    if (words.length === 0) return null;
    const highBandWords = words.filter((w) => w.cefrLevel === 'C1' || w.cefrLevel === 'C2' || w.targetIeltsBand === '8.0+');
    if (highBandWords.length > 0) {
      const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % highBandWords.length;
      return highBandWords[dayIndex] || highBandWords[0];
    }
    return words[0] || null;
  }, [words]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 🌟 Top Hero Bento Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Welcome & Target Band Pod (7 Cols) */}
        <div className="lg:col-span-7 bento-card p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-[#121424] to-[#0A0C16] border border-indigo-500/20">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cambridge Academic IELTS Hub</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Streak {progress.streakDays || 1} Ngày</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Xin chào,{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                {userProfile.displayName || 'IELTS Scholar'}
              </span>
              ! 🎯
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-xl leading-relaxed">
              Mục tiêu của bạn: Nâng cấp Lexical Resource & phản xạ Speaking lên{' '}
              <strong className="text-indigo-300 font-bold">Band 8.0+</strong> với thuật toán lặp ngắt quãng FSRS.
            </p>
          </div>

          {/* Quick Metrics Bar inside Hero */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
              <div className="text-[11px] font-semibold text-slate-400">Band Ước Tính</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                {progress.estimatedBand || '6.5'}
              </div>
            </div>

            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
              <div className="text-[11px] font-semibold text-slate-400">Từ Đã Thuộc</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                {stats.masteredCount} <span className="text-xs text-slate-400 font-normal">/ {stats.activeWords.length}</span>
              </div>
            </div>

            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
              <div className="text-[11px] font-semibold text-slate-400">Cần Ôn Hôm Nay</div>
              <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-0.5">
                {stats.dueWordsCount} <span className="text-xs text-slate-400 font-normal">từ</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🎴 Word of the Day Pod (5 Cols) */}
        <div className="lg:col-span-5 bento-card p-6 sm:p-7 flex flex-col justify-between border border-emerald-500/20 bg-gradient-to-br from-emerald-950/25 via-[#111624] to-[#0A0C16]">
          {wordOfTheDay ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    Từ Vựng C1/C2 Của Ngày
                  </span>
                  {wordOfTheDay.cefrLevel && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Band {wordOfTheDay.targetIeltsBand || '8.0+'} ({wordOfTheDay.cefrLevel})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white tracking-tight">{wordOfTheDay.term}</h2>
                  <button
                    onClick={() => playNativeSpeech(wordOfTheDay.term)}
                    className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer"
                    title="Nghe phát âm chuẩn"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {wordOfTheDay.ipa && (
                  <div className="text-xs text-slate-400 font-mono mt-1">{wordOfTheDay.ipa}</div>
                )}

                <p className="text-sm font-medium text-slate-200 mt-2.5 leading-snug">
                  {wordOfTheDay.meaning}
                </p>

                {wordOfTheDay.example && (
                  <p className="text-xs text-slate-400 italic mt-2 line-clamp-2 border-l-2 border-emerald-500/40 pl-2.5">
                    "{wordOfTheDay.example}"
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">{wordOfTheDay.topic || 'Học thuật'}</span>
                <button
                  onClick={() => onSelectWord(wordOfTheDay)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <span>Chi tiết & Collocations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Brain className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">Chưa có từ vựng trong bộ</p>
              <button
                onClick={onOpenUpload}
                className="mt-3 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Nạp PDF ngay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 Core Learning Modes Bento Grid (6 Pods) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-300">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Không Gian Ôn Luyện Trọng Tâm</span>
          </div>
          <span className="text-xs text-slate-400">Chọn chế độ để bắt đầu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* 1. Flashcard 3D SRS */}
          <div
            onClick={() => onStartMode('flashcard')}
            className="bento-card p-5 sm:p-6 cursor-pointer group hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                <span>Flashcard 3D FSRS</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Thuật toán lặp ngắt quãng FSRS tự động tính toán thời điểm vàng để ôn lại từ trước khi bạn kịp quên.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>{stats.dueWordsCount} từ đến hạn ôn</span>
              <span className="group-hover:translate-x-1 transition-transform">Luyện ngay →</span>
            </div>
          </div>

          {/* 2. Speaking AI Mock Examiner */}
          <div
            onClick={() => onStartMode('speaking')}
            className="bento-card p-5 sm:p-6 cursor-pointer group hover:border-rose-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors flex items-center justify-between">
                <span>IELTS Speaking Examiner</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Thi thử với Giám khảo AI Cambridge, chấm điểm 4 tiêu chí chuẩn xác kèm gợi ý Band 8.5+ tức thì.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-rose-400">
              <span>Part 1, 2, 3</span>
              <span className="group-hover:translate-x-1 transition-transform">Phòng thi →</span>
            </div>
          </div>

          {/* 3. Shadowing & Accent Lab */}
          <div
            onClick={() => onStartMode('shadowing')}
            className="bento-card p-5 sm:p-6 cursor-pointer group hover:border-cyan-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                <span>Shadowing Lab</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Nhại giọng bản xứ câu mẫu, phân tích từng âm đuôi /t/, /s/, trọng âm câu và ngữ điệu tự nhiên.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>Giọng US / UK / AU</span>
              <span className="group-hover:translate-x-1 transition-transform">Nhại giọng →</span>
            </div>
          </div>

          {/* 4. Full 15-Minute Mock Test */}
          <div
            onClick={() => onStartMode('full-mock-test')}
            className="bento-card p-5 sm:p-6 cursor-pointer group hover:border-amber-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-4">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                <span>Full 15-Min Mock Test</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Trải nghiệm thi thử liên tục 15 phút mô phỏng áp lực phòng thi thật với tổng kết bảng điểm chính thức.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Mô phỏng thi thật</span>
              <span className="group-hover:translate-x-1 transition-transform">Làm bài →</span>
            </div>
          </div>

          {/* 5. AI Band Booster Center */}
          <div
            onClick={() => onStartMode('ai-booster')}
            className="bento-card p-5 sm:p-6 cursor-pointer group hover:border-purple-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                <span>AI Band Booster</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Mở rộng mạng lưới Collocations, từ đồng nghĩa phân biệt sắc thái nghĩa (Nuances) và nâng cấp câu.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>Lexical Resource 9.0</span>
              <span className="group-hover:translate-x-1 transition-transform">Khai phóng →</span>
            </div>
          </div>

          {/* 6. Quick Response Drill */}
          <div
            onClick={() => onStartMode('quick-speaking-drill')}
            className="bento-card p-5 sm:p-6 cursor-pointer group hover:border-indigo-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                <span>Phản Xạ Cấp Tốc 15 Giây</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Rèn luyện phản xạ bắn tiếng Anh không kịp suy nghĩ tiếng Việt trong 15 giây cho các câu hỏi Part 1.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span>Đập tan thói quen dịch</span>
              <span className="group-hover:translate-x-1 transition-transform">Luyện ngay →</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Bottom Row: Active Set Progress & Weakness Radar Pod */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Set Progress Overview (7 Cols) */}
        <div className="lg:col-span-7 bento-card p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bộ từ đang kích hoạt</div>
              <h3 className="text-lg font-bold text-white mt-0.5">{activeSet.title}</h3>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {stats.masteryPercent}% Đạt chuẩn
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex gap-1 p-0.5 mb-4">
            <div
              style={{ width: `${(stats.masteredCount / (stats.activeWords.length || 1)) * 100}%` }}
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              title="Đã thành thạo"
            />
            <div
              style={{ width: `${(stats.learningCount / (stats.activeWords.length || 1)) * 100}%` }}
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              title="Đang ôn tập"
            />
            <div
              style={{ width: `${(stats.newCount / (stats.activeWords.length || 1)) * 100}%` }}
              className="h-full bg-slate-600 rounded-full transition-all duration-500"
              title="Chưa học"
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Thành thạo ({stats.masteredCount})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
              <span>Đang học ({stats.learningCount})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
              <span>Mới ({stats.newCount})</span>
            </div>
          </div>
        </div>

        {/* Weakness Alert Pod (5 Cols) */}
        <div className="lg:col-span-5 bento-card p-6 border border-amber-500/20 bg-gradient-to-br from-amber-950/15 via-[#121424] to-[#0A0C16]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Sổ Tay Bẫy Lỗi Cần Chú Ý</span>
            </div>
            <button
              onClick={() => onStartMode('weakness-radar')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Xem tất cả →
            </button>
          </div>

          {stats.weakWords.length > 0 ? (
            <div className="space-y-2 mt-2">
              {stats.weakWords.map((word) => (
                <div
                  key={word.id}
                  onClick={() => onSelectWord(word)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-white truncate">{word.term}</div>
                    <div className="text-[11px] text-slate-400 truncate">{word.meaning}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                    Ôn lại
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1.5" />
              <p className="text-xs font-medium text-slate-300">Tuyệt vời! Không có từ nào bị đánh dấu yếu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
