import React, { useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  Mic,
  Trophy,
  Zap,
  TrendingUp,
  Volume2,
  Bookmark,
  ChevronRight,
  Flame,
  ArrowRight,
  HelpCircle,
  SpellCheck,
  FileQuestion,
  Layers,
  Clock,
  PenTool,
  Upload,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { VocabItem, WordSet, UserProgress, UserProfile } from '../../types';
import { playNativeSpeech } from '../../utils/speech';
import { AppViewTab } from '../../hooks/useHashNavigation';

interface ModernDashboardProps {
  activeSet: WordSet;
  words: VocabItem[];
  progress: UserProgress;
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onStartMode: (mode: AppViewTab) => void;
  onSelectSet: (setId: string) => void;
  onOpenUpload: () => void;
  onOpenBatchImport: () => void;
  onOpenExcelImport: () => void;
  onOpenAddWord: () => void;
  onSelectWord: (word: VocabItem) => void;
  onToggleBookmark: (id: string) => void;
  onToggleUnlearned: (id: string) => void;
}

export function ModernDashboard({
  activeSet,
  words,
  progress,
  userProfile,
  onOpenProfile,
  onOpenAuth,
  onStartMode,
  onSelectSet,
  onOpenUpload,
  onOpenBatchImport,
  onOpenExcelImport,
  onOpenAddWord,
  onSelectWord,
  onToggleBookmark,
  onToggleUnlearned,
}: ModernDashboardProps) {
  // Extract active set words
  const isAllLibrary = activeSet.id === 'all-words-library' || activeSet.id === 'all-words';
  const setWords = useMemo(() => {
    if (isAllLibrary) return words;
    return words.filter((w) => w.sourceSetId === activeSet.id);
  }, [isAllLibrary, words, activeSet.id]);

  // FSRS calculations
  const now = Date.now();
  const dueWords = useMemo(() => {
    return setWords.filter((w) => w.nextReviewDate <= now || w.mastery === 'new');
  }, [setWords, now]);

  const masteredCount = useMemo(() => {
    return setWords.filter((w) => w.mastery === 'mastered').length;
  }, [setWords]);

  const learningCount = useMemo(() => {
    return setWords.filter((w) => w.mastery === 'learning' || w.mastery === 'reviewing').length;
  }, [setWords]);

  // Word of the Day (Deterministic rotation based on day of year)
  const wordOfTheDay = useMemo(() => {
    if (words.length === 0) return null;
    const dayOfYear = Math.floor(now / (1000 * 60 * 60 * 24));
    const advancedWords = words.filter((w) => w.targetIeltsBand && parseFloat(w.targetIeltsBand) >= 7.5);
    const pool = advancedWords.length > 0 ? advancedWords : words;
    return pool[dayOfYear % pool.length];
  }, [words, now]);

  // Weak words needing review
  const weakWords = useMemo(() => {
    return [...setWords]
      .filter((w) => w.incorrectCount > 0 || w.isUnlearned)
      .sort((a, b) => b.incorrectCount - a.incorrectCount)
      .slice(0, 4);
  }, [setWords]);

  const masteredPercent = setWords.length > 0 ? Math.round((masteredCount / setWords.length) * 100) : 0;
  const learningPercent = setWords.length > 0 ? Math.round((learningCount / setWords.length) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 🌟 1. HERO BENTO GRID: Personal Focus + FSRS Radar + Word of the Day */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Hero Focus Card (7 Cols) */}
        <div className="lg:col-span-7 neo-glass-card p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between border-indigo-500/20 bg-gradient-to-br from-[#0F142A]/80 via-[#0A0D1B]/90 to-[#05070E]">
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

          {/* Top greeting & streak */}
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cambridge Academic AI Workspace</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black shadow-sm">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Chuỗi {progress.currentStreakDays || 1} ngày</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight heading-gradient-brand leading-tight">
              Xin chào, {userProfile.displayName || 'IELTS Scholar'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed font-medium">
              Bộ từ vựng <strong className="text-indigo-300 font-semibold">{activeSet.title}</strong> đang có{' '}
              <strong className="text-rose-400 font-bold">{dueWords.length} từ vựng</strong> cần ôn tập theo chu kỳ FSRS hôm nay.
            </p>
          </div>

          {/* Middle: 3 Quick Metric Gauges */}
          <div className="relative z-10 grid grid-cols-3 gap-3 my-6 pt-5 border-t border-white/[0.08]">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cần Ôn Hôm Nay</div>
              <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{dueWords.length}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã Thuộc (FSRS)</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{masteredCount}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IELTS Band Dự Đoán</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{progress.estimatedBand || '6.5'}</div>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onStartMode('flashcard')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:scale-[1.02] cursor-pointer flex items-center gap-2 border border-indigo-400/30"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Bắt Đầu Ôn FSRS ({dueWords.length} từ)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onStartMode('speaking')}
              className="px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white text-xs sm:text-sm font-bold border border-white/10 transition-all cursor-pointer flex items-center gap-2"
            >
              <Mic className="w-4 h-4 text-rose-400" />
              <span>IELTS Speaking AI</span>
            </button>
          </div>
        </div>

        {/* Right Word of the Day Card (5 Cols) */}
        <div className="lg:col-span-5 neo-glass-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between border-purple-500/20 bg-gradient-to-br from-[#16112C]/80 via-[#0D0B1C]/90 to-[#06050E]">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

          {wordOfTheDay ? (
            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    Từ Vựng Học Thuật Của Ngày
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Band {wordOfTheDay.targetIeltsBand || '8.0+'}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {wordOfTheDay.term}
                  </h2>
                  <span className="text-xs font-mono text-purple-300 font-semibold">{wordOfTheDay.ipa}</span>
                </div>
                <div className="text-xs text-slate-400 italic mt-0.5">{wordOfTheDay.wordClass || 'academic term'}</div>

                <p className="text-sm font-bold text-slate-100 mt-3 leading-relaxed">
                  {wordOfTheDay.meaning}
                </p>

                {wordOfTheDay.collocations && (
                  <div className="mt-3.5 pt-3 border-t border-white/[0.08]">
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5">Collocations tiêu biểu:</div>
                    <div className="text-xs text-indigo-300 font-semibold italic bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                      "{wordOfTheDay.collocations}"
                    </div>
                  </div>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                <button
                  onClick={() => playNativeSpeech(wordOfTheDay.term)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe phát âm chuẩn</span>
                </button>

                <button
                  onClick={() => onSelectWord(wordOfTheDay)}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Chi tiết từ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">Chưa có dữ liệu từ vựng</div>
          )}
        </div>
      </div>

      {/* 🚀 2. SIX SUPERCHARGED LAUNCH PODS (BENTO GRID) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Không Gian Rèn Luyện Trọng Tâm</span>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Nhấn <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-indigo-300 font-bold">⌘K</kbd> để mở nhanh
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Pod 1: Flashcard 3D FSRS */}
          <div
            onClick={() => onStartMode('flashcard')}
            className="neo-glass-card p-6 cursor-pointer group hover:border-indigo-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-blue-500/25 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  FSRS v4.5
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                Lật Thẻ Flashcard 3D
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Học từ vựng qua thẻ 3D hai mặt với thuật toán lặp lại ngắt quãng tối ưu trí nhớ dài hạn.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Luyện tập ngay</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Pod 2: IELTS Speaking Mock Examiner */}
          <div
            onClick={() => onStartMode('speaking')}
            className="neo-glass-card p-6 cursor-pointer group hover:border-rose-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/25 to-red-500/25 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Part 1, 2, 3
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                Giám Khảo AI IELTS Speaking
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Luyện nói tương tác 1:1 với Giám khảo AI Cambridge kèm chấm điểm 4 tiêu chí chi tiết.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
              <span>Bật micro luyện nói</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Pod 3: Shadowing Lab */}
          <div
            onClick={() => onStartMode('shadowing')}
            className="neo-glass-card p-6 cursor-pointer group hover:border-cyan-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-teal-500/25 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
                  <Volume2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  US / UK / AU
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Shadowing Lab & Ngữ Điệu
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Nhại giọng chuẩn bản xứ, phân tích âm cuối, trọng âm câu và độ tự nhiên của giọng nói.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>Luyện phát âm</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Pod 4: Full 15-Minute Mock Test */}
          <div
            onClick={() => onStartMode('full-mock-test')}
            className="neo-glass-card p-6 cursor-pointer group hover:border-amber-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-500/25 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all">
                  <Trophy className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Mô Phỏng 100%
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Thi Thử Toàn Diện 15 Phút
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Mô phỏng 100% áp lực phòng thi thật gồm đủ Part 1, Part 2 & Part 3 kèm bảng điểm chuẩn.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Vào phòng thi thử</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Pod 5: AI Band Booster */}
          <div
            onClick={() => onStartMode('ai-booster')}
            className="neo-glass-card p-6 cursor-pointer group hover:border-purple-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/25 to-pink-500/25 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Band 8.5+
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                AI Band Booster Center
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Mở rộng sắc thái từ vựng (Nuances), bẫy lỗi thường gặp và nâng cấp câu văn lên chuẩn Band 8.5+.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Nâng cấp câu văn</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Pod 6: IELTS Writing Assistant */}
          <div
            onClick={() => onStartMode('writing')}
            className="neo-glass-card p-6 cursor-pointer group hover:border-indigo-500/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-500/25 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
                  <PenTool className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Heatmap AI
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                IELTS Writing & Lexical Heatmap
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Chấm điểm Task 1 & 2 theo 4 tiêu chí Cambridge, bản đồ nhiệt từ vựng và bài mẫu viết lại Band 8.5+.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Chấm bài viết</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 📊 3. SET OVERVIEW & WEAKNESS ALERT PODS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Set Progress Overview (7 Cols) */}
        <div className="lg:col-span-7 neo-glass-card p-6 border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Tiến Độ Làm Chủ: {activeSet.title}
              </span>
              <span className="text-xs font-bold text-indigo-400">{masteredPercent}% Thành thạo</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3.5 bg-white/[0.04] rounded-full overflow-hidden flex gap-1 p-0.5 border border-white/10">
              <div
                style={{ width: `${masteredPercent}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
                title={`Đã thuộc: ${masteredCount} từ`}
              />
              <div
                style={{ width: `${learningPercent}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 shadow-sm"
                title={`Đang học: ${learningCount} từ`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Đã thành thạo ({masteredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Đang ôn luyện ({learningCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Cần ôn hôm nay ({dueWords.length})</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => onStartMode('vocab-hub')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Xem tất cả 7 chế độ học từ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenAddWord}
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Thêm từ mới</span>
            </button>
          </div>
        </div>

        {/* Weakness Alert Pod (5 Cols) */}
        <div className="lg:col-span-5 neo-glass-card p-6 border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Từ Vựng Cần Củng Cố
              </span>
              <span className="text-[10px] text-slate-400">Dễ nhầm lẫn</span>
            </div>

            {weakWords.length > 0 ? (
              <div className="space-y-2">
                {weakWords.map((word) => (
                  <div
                    key={word.id}
                    onClick={() => onSelectWord(word)}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{word.term}</span>
                        <span className="text-[10px] font-mono text-slate-400">{word.ipa}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{word.meaning}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {word.incorrectCount} lỗi
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Tuyệt vời! Hiện tại bạn chưa có từ nào bị đánh dấu hay sai nhiều lần.
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => onStartMode('progress')}
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Xem sổ tay bẫy lỗi (Radar)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
