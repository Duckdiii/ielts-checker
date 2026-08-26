import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  BookOpen,
  Volume2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Brain,
  Star,
  Search,
  Plus,
  Award,
  Zap,
  Tag,
  Play,
  Database,
  FileSpreadsheet,
  Globe,
  Sprout,
  AlertTriangle,
  ShieldCheck,
  Target,
  ArrowUpRight,
  BrainCircuit,
  CreditCard,
  Keyboard,
  FileEdit,
  GraduationCap,
  Sparkle,
  Compass,
  Check,
  BarChart3,
  Timer,
  Upload,
  Mic,
  Headphones,
  ShieldAlert,
  LifeBuoy,
  Flame,
  ArrowRight,
  FileText,
  Puzzle,
  Coffee,
  Flag,
} from 'lucide-react';

import { VocabItem, WordSet, UserProgress, StudyMode, UserProfile } from '../../types';
import { speakWord } from '../../utils/speech';
import { getTopicInfo } from '../../utils/topicHelpers';
import { buildSmartStudyQueue } from '../../utils/studyPattern';
import { BandMilestoneProgress } from './BandMilestoneProgress';
import { StudyHubSection } from '../index';
import { PersonalizedStudyHub } from '../index';

interface DashboardProps {
  activeSet: WordSet;
  words: VocabItem[];
  progress: UserProgress;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onStartMode: (mode: any) => void;
  onSelectSet?: (setId: string) => void;
  onOpenUpload: () => void;
  onOpenBatchImport?: () => void;
  onOpenExcelImport?: () => void;
  onOpenAddWord: () => void;
  onSelectWord: (word: VocabItem) => void;
  onToggleBookmark: (wordId: string) => void;
  onToggleUnlearned?: (wordId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
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
}) => {
  const [activeCategoryHub, setActiveCategoryHub] = useState<'speaking' | 'vocab' | 'analytics' | 'all'>('speaking');
  const [modeSearchQuery, setModeSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'unlearned' | 'due' | 'bookmarked' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isAllWordsVirtual = activeSet.id === 'all-words-library' || activeSet.id === 'all-words';
  const setWords = isAllWordsVirtual ? words : words.filter((w) => w.sourceSetId === activeSet.id);
  const now = Date.now();

  const masteredWords = setWords.filter((w) => w.mastery === 'mastered');
  const reviewingWords = setWords.filter((w) => w.mastery === 'reviewing');
  const learningWords = setWords.filter((w) => w.mastery === 'learning');
  const newWords = setWords.filter((w) => w.mastery === 'new');
  const unlearnedWords = setWords.filter((w) => w.isUnlearned);

  const dueForReview = setWords.filter((w) => w.nextReviewDate <= now || w.mastery === 'new');
  const bookmarkedWords = setWords.filter((w) => w.isBookmarked);

  // Global counts
  const globalMastered = words.filter((w) => w.mastery === 'mastered').length;
  const globalDue = words.filter((w) => w.nextReviewDate <= now || w.mastery === 'new').length;

  const masteryPercentage =
    setWords.length > 0 ? Math.round((masteredWords.length / setWords.length) * 100) : 0;

  // Smart Pattern Queue Diagnostics
  const smartQueueResult = buildSmartStudyQueue(setWords, {
    mode: 'smart-interleaved',
    preserveAll: true,
  });

  // Topics present in this active set
  const setTopics: string[] = Array.from(
    new Set(
      setWords
        .map((w) => (w.topic?.trim() || activeSet.mainTopic || 'Học thuật tổng hợp') as string)
        .filter((t): t is string => Boolean(t))
    )
  );

  // Filtered preview words
  const previewWords = setWords.filter((w) => {
    const matchesSearch =
      w.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (quickFilter === 'unlearned') return w.isUnlearned;
    if (quickFilter === 'due') return w.nextReviewDate <= now || w.mastery === 'new';
    if (quickFilter === 'bookmarked') return w.isBookmarked;
    if (quickFilter === 'mastered') return w.mastery === 'mastered';
    return true;
  });

  // Determine User Proficiency Status Level
  const currentBand = progress.estimatedBand || 6.5;
  const getBandTierInfo = (band: number) => {
    if (band >= 8.0) {
      return {
        levelName: 'C2 - Master IELTS Scholar',
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        barColor: 'from-amber-500 to-yellow-400',
        nextTarget: 'Đạt đỉnh cao 9.0 Band',
        advice: 'Tập trung duy trì phản xạ tự nhiên và khai thác các thành ngữ, cụm collocations hiếm gặp.',
      };
    }
    if (band >= 7.0) {
      return {
        levelName: 'C1 - Advanced (Nâng Cao)',
        badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        barColor: 'from-purple-500 to-indigo-400',
        nextTarget: 'Chinh phục mốc Band 8.0+',
        advice: 'Nâng cấp vốn từ C1 sang C2, luyện phản xạ Part 3 và nhại ngữ điệu chuẩn trong Shadowing Lab.',
      };
    }
    if (band >= 6.0) {
      return {
        levelName: 'B2+ - Upper Intermediate (Khá Giỏi)',
        badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        barColor: 'from-indigo-500 to-cyan-400',
        nextTarget: 'Bứt phá lên Band 7.0 - 7.5',
        advice: 'Mở rộng cấu trúc trả lời A.R.E.A và thay thế các từ cơ bản bằng các cụm Academic Collocations.',
      };
    }
    return {
      levelName: 'B1 - Intermediate (Đang Xây Nền)',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      barColor: 'from-emerald-500 to-teal-400',
      nextTarget: 'Đạt mốc vững chắc Band 6.5',
      advice: 'Ôn tập Flashcard SRS mỗi ngày và luyện các bài nói Part 1 15s để tăng độ tự tin phát âm.',
    };
  };

  const tierInfo = getBandTierInfo(currentBand);

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fadeIn max-w-[1720px] mx-auto px-2 sm:px-4">
      {/* ========================================================================= */}
      {/* 0. PERSONALIZED AI STUDY HUB & DAILY MISSIONS                             */}
      {/* ========================================================================= */}
      {userProfile && (
        <PersonalizedStudyHub
          profile={userProfile}
          progress={progress}
          words={words}
          sets={[activeSet]}
          onStartMode={onStartMode}
          onOpenProfile={onOpenProfile || (() => {})}
          onSelectTopic={(topic) => {
            setSearchQuery(topic);
            onStartMode('list');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. HERO COCKPIT: TRÌNH ĐỘ HIỆN TẠI CỦA USER & TỔNG QUAN HỆ THỐNG        */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16191F] via-[#1A1E26] to-[#111317] border border-[#2D333B] shadow-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-indigo-600/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: System Identity & User Level Cockpit */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#2D333B]">
            {/* Left: User Level & Target */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Hồ Sơ Năng Lực IELTS Cá Nhân Hóa
                </span>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${tierInfo.badgeColor}`}>
                  <Award className="w-3.5 h-3.5" />
                  {tierInfo.levelName}
                </span>
              </div>

              <div className="flex items-baseline gap-3.5 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  IELTS Band {currentBand.toFixed(1)}
                </h1>
                <span className="text-sm font-semibold text-slate-300">
                  Mục tiêu kế tiếp: <strong className="text-amber-400">{tierInfo.nextTarget}</strong>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                💡 <strong className="text-slate-200">Chiến lược AI gợi ý:</strong> {tierInfo.advice}
              </p>
            </div>

            {/* Right: Key Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#121418]/90 p-3.5 rounded-2xl border border-[#2D333B] shadow-inner shrink-0">
              <div
                onClick={() => onStartMode('list')}
                title="Xem toàn bộ kho từ vựng"
                className="text-center p-2.5 rounded-xl hover:bg-[#21262E] transition-colors cursor-pointer group"
              >
                <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-indigo-300 transition-colors">
                  {words.length}
                </div>
                <div className="text-[11px] text-[#8E97A4] font-bold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-400" /> Tổng từ kho
                </div>
              </div>

              <div
                onClick={() => onStartMode('flashcard')}
                title="Ôn tập các từ đến hạn Spaced Repetition"
                className="text-center p-2.5 rounded-xl hover:bg-[#21262E] transition-colors cursor-pointer group"
              >
                <div className="text-2xl sm:text-3xl font-black text-amber-400 group-hover:scale-105 transition-transform">
                  {globalDue}
                </div>
                <div className="text-[11px] text-[#8E97A4] font-bold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Cần ôn SRS
                </div>
              </div>

              <div
                onClick={() => onStartMode('speaking')}
                title="Vào Speaking Studio"
                className="text-center p-2.5 rounded-xl hover:bg-[#21262E] transition-colors cursor-pointer group"
              >
                <div className="text-2xl sm:text-3xl font-black text-purple-400 group-hover:scale-105 transition-transform">
                  10+
                </div>
                <div className="text-[11px] text-[#8E97A4] font-bold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                  <Mic className="w-3 h-3 text-purple-400" /> Bài Speaking
                </div>
              </div>

              <div
                onClick={() => onStartMode('progress')}
                title="Xem chuỗi streak & báo cáo"
                className="text-center p-2.5 rounded-xl hover:bg-[#21262E] transition-colors cursor-pointer group"
              >
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 group-hover:scale-105 transition-transform flex items-center justify-center gap-0.5">
                  <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
                  {progress.streakDays}d
                </div>
                <div className="text-[11px] text-[#8E97A4] font-bold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" /> Streak ngày
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: SRS Spaced Repetition Mastery Flow */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs text-[#9BA1A6]">
              <span className="font-bold text-[#E0E2E4] flex items-center gap-2 text-xs sm:text-sm">
                <div className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Zap className="w-3 h-3" />
                </div>
                Trạng thái ghi nhớ dài hạn (Spaced Repetition System - SRS)
              </span>
              <span className="font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25 text-xs">
                {masteryPercentage}% Thành thạo bộ này
              </span>
            </div>

            <div className="w-full h-3.5 bg-[#0F1113] rounded-full overflow-hidden flex border border-[#2D333B] p-0.5">
              <div
                style={{ width: `${(masteredWords.length / (setWords.length || 1)) * 100}%` }}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-xs"
                title={`Đã thuộc: ${masteredWords.length}`}
              />
              <div
                style={{ width: `${(reviewingWords.length / (setWords.length || 1)) * 100}%` }}
                className="bg-cyan-500 transition-all duration-500"
                title={`Đang nhớ tốt: ${reviewingWords.length}`}
              />
              <div
                style={{ width: `${(learningWords.length / (setWords.length || 1)) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Mới học: ${learningWords.length}`}
              />
              <div
                style={{ width: `${(newWords.length / (setWords.length || 1)) * 100}%` }}
                className="bg-[#2D333B] transition-all duration-500"
                title={`Chưa học: ${newWords.length}`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-[#8E97A4] pt-1 gap-2">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Đã thuộc: {masteredWords.length}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  Ôn tập: {reviewingWords.length}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Đang học: {learningWords.length}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#444C56]" />
                  Chưa học: {newWords.length}
                </span>
              </div>

              <button
                onClick={() => onStartMode('progress')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                Xem báo cáo phân tích chi tiết <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 2 PILLARS OF THE SYSTEM: VOCABULARY & SPEAKING SUITES           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🎯 2 Chức Năng Cốt Lõi Của Hệ Thống</span>
            </h2>
            <p className="text-sm text-slate-300 mt-0.5">
              Chọn ngay chế độ học tập chuyên sâu theo lộ trình của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PILLAR 1: VOCABULARY MASTERY SUITE */}
          <div className="bg-gradient-to-br from-[#161922] via-[#1A1F2B] to-[#12151D] rounded-3xl border border-indigo-500/30 p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                      1. Ôn Luyện Từ Vựng (SRS Hub)
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      6 Chế độ
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Học từ vựng học thuật theo thuật toán lặp lại ngắt quãng SRS, trích xuất từ PDF & Excel
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Modes inside Vocab */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={() => onStartMode('flashcard')}
                className="p-3 rounded-2xl bg-[#212632] hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-[#303746] text-left transition-all cursor-pointer space-y-1.5"
              >
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <div className="text-xs font-bold text-white">Flashcard 3D</div>
                <div className="text-[10px] text-[#8E97A4]">Lật thẻ & Đánh giá</div>
              </button>

              <button
                onClick={() => onStartMode('quiz')}
                className="p-3 rounded-2xl bg-[#212632] hover:bg-blue-600/20 hover:border-blue-500/40 border border-[#303746] text-left transition-all cursor-pointer space-y-1.5"
              >
                <BrainCircuit className="w-4 h-4 text-blue-400" />
                <div className="text-xs font-bold text-white">Trắc Nghiệm</div>
                <div className="text-[10px] text-[#8E97A4]">4 dạng đề thi</div>
              </button>

              <button
                onClick={() => onStartMode('spelling')}
                className="p-3 rounded-2xl bg-[#212632] hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-[#303746] text-left transition-all cursor-pointer space-y-1.5"
              >
                <Keyboard className="w-4 h-4 text-emerald-400" />
                <div className="text-xs font-bold text-white">Gõ Chính Tả</div>
                <div className="text-[10px] text-[#8E97A4]">Dictation nghe viết</div>
              </button>

              <button
                onClick={() => onStartMode('word-family')}
                className="p-3 rounded-2xl bg-[#212632] hover:bg-amber-600/20 hover:border-amber-500/40 border border-[#303746] text-left transition-all cursor-pointer space-y-1.5"
              >
                <Puzzle className="w-4 h-4 text-amber-400" />
                <div className="text-xs font-bold text-white">Ghép Họ Từ</div>
                <div className="text-[10px] text-[#8E97A4]">Collocations & Synonym</div>
              </button>

              <button
                onClick={() => onStartMode('timed-drill')}
                className="p-3 rounded-2xl bg-[#212632] hover:bg-orange-600/20 hover:border-orange-500/40 border border-[#303746] text-left transition-all cursor-pointer space-y-1.5"
              >
                <Timer className="w-4 h-4 text-orange-400" />
                <div className="text-xs font-bold text-white">Focus 7s Drill</div>
                <div className="text-[10px] text-[#8E97A4]">Áp lực thời gian</div>
              </button>

              <button
                onClick={() => onStartMode('cloze')}
                className="p-3 rounded-2xl bg-[#212632] hover:bg-rose-600/20 hover:border-rose-500/40 border border-[#303746] text-left transition-all cursor-pointer space-y-1.5"
              >
                <FileEdit className="w-4 h-4 text-rose-400" />
                <div className="text-xs font-bold text-white">Điền Ngữ Cảnh</div>
                <div className="text-[10px] text-[#8E97A4]">Reading cloze test</div>
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-[#2D333B] flex-wrap gap-2">
              <span className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Có {dueForReview.length} từ đến hạn cần ôn ngay
              </span>
              <button
                onClick={() => onStartMode('flashcard')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Học Flashcard Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PILLAR 2: IELTS SPEAKING SIMULATION SUITE */}
          <div className="bg-gradient-to-br from-[#1C1622] via-[#201A2B] to-[#14121A] rounded-3xl border border-purple-500/30 p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors">
                      2. Luyện Thi IELTS Speaking AI
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Cambridge 1-1
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Phòng thi ảo với Giám khảo AI bản xứ, chấm điểm 4 tiêu chí & sửa phát âm chi tiết
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Modes inside Speaking */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={() => onStartMode('daily-chat')}
                className="p-3 rounded-2xl bg-[#282132] hover:bg-amber-600/25 hover:border-amber-500/50 border border-amber-500/30 text-left transition-all cursor-pointer space-y-1.5 ring-1 ring-amber-500/20"
              >
                <div className="flex items-center justify-between">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">Mới</span>
                </div>
                <div className="text-xs font-bold text-white">AI Coffee Chat</div>
                <div className="text-[10px] text-[#8E97A4]">Tán gẫu tự do 1-1</div>
              </button>

              <button
                onClick={() => onStartMode('speaking')}
                className="p-3 rounded-2xl bg-[#282132] hover:bg-purple-600/20 hover:border-purple-500/40 border border-[#3A2F48] text-left transition-all cursor-pointer space-y-1.5"
              >
                <Mic className="w-4 h-4 text-purple-400" />
                <div className="text-xs font-bold text-white">Giám Khảo 1-1</div>
                <div className="text-[10px] text-[#8E97A4]">Part 1-2-3 Chấm điểm</div>
              </button>

              <button
                onClick={() => onStartMode('full-mock-test')}
                className="p-3 rounded-2xl bg-[#282132] hover:bg-cyan-600/20 hover:border-cyan-500/40 border border-[#3A2F48] text-left transition-all cursor-pointer space-y-1.5"
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                <div className="text-xs font-bold text-white">Mock Test 15p</div>
                <div className="text-[10px] text-[#8E97A4]">Mô phỏng thi thật</div>
              </button>

              <button
                onClick={() => onStartMode('speaking-part2')}
                className="p-3 rounded-2xl bg-[#282132] hover:bg-amber-600/20 hover:border-amber-500/40 border border-[#3A2F48] text-left transition-all cursor-pointer space-y-1.5"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <div className="text-xs font-bold text-white">Cue Card Part 2</div>
                <div className="text-[10px] text-[#8E97A4]">1p chuẩn bị + 2p nói</div>
              </button>

              <button
                onClick={() => onStartMode('shadowing')}
                className="p-3 rounded-2xl bg-[#282132] hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-[#3A2F48] text-left transition-all cursor-pointer space-y-1.5"
              >
                <Headphones className="w-4 h-4 text-emerald-400" />
                <div className="text-xs font-bold text-white">Shadowing Lab</div>
                <div className="text-[10px] text-[#8E97A4]">Nhại ngữ điệu chuẩn</div>
              </button>

              <button
                onClick={() => onStartMode('quick-speaking-drill')}
                className="p-3 rounded-2xl bg-[#282132] hover:bg-yellow-600/20 hover:border-yellow-500/40 border border-[#3A2F48] text-left transition-all cursor-pointer space-y-1.5"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <div className="text-xs font-bold text-white">Phản Xạ 15s</div>
                <div className="text-[10px] text-[#8E97A4]">5s nghĩ + 15s bắn ý</div>
              </button>

              <button
                onClick={() => onStartMode('emergency-stalling')}
                className="p-3 rounded-2xl bg-[#282132] hover:bg-rose-600/20 hover:border-rose-500/40 border border-[#3A2F48] text-left transition-all cursor-pointer space-y-1.5"
              >
                <LifeBuoy className="w-4 h-4 text-rose-400" />
                <div className="text-xs font-bold text-white">Phao Cứu Sinh</div>
                <div className="text-[10px] text-[#8E97A4]">Bí ý / Chống đứng hình</div>
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-[#2D333B] flex-wrap gap-2">
              <span className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Có đồ thị theo dõi Confidence Tracker
              </span>
              <button
                onClick={() => onStartMode('speaking')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Vào Thi Thử 1-1</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. IELTS BAND MILESTONES ROADMAP PROGRESS                               */}
      {/* ========================================================================= */}
      <BandMilestoneProgress
        currentBand={currentBand}
        words={words}
      />

      {/* ========================================================================= */}
      {/* 4. MAIN STUDY HUB SECTION (ALL TRAINING ROOMS)                          */}
      {/* ========================================================================= */}
      <StudyHubSection
        activeCategoryHub={activeCategoryHub}
        setActiveCategoryHub={setActiveCategoryHub}
        modeSearchQuery={modeSearchQuery}
        setModeSearchQuery={setModeSearchQuery}
        dueForReviewCount={dueForReview.length}
        estimatedBand={currentBand}
        setWordsCount={setWords.length}
        onStartMode={onStartMode}
      />

      {/* ========================================================================= */}
      {/* 5. TOPIC BREAKDOWN & QUICK WORD EXPLORER                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Word Explorer */}
        <div className="lg:col-span-8 bg-[#16191F] rounded-3xl border border-[#2D333B] shadow-xl p-6 sm:p-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                Danh Sách Từ Vựng Trong Bộ ({setWords.length} từ)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Bấm nghe phát âm chuẩn bản ngữ, tra cứu phiên âm IPA và nghĩa chi tiết
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8E97A4] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm từ vựng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl bg-[#21262E] border border-[#30363D] text-xs sm:text-sm text-white placeholder-[#484F58] focus:outline-hidden focus:border-indigo-500 w-44"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#21262E] p-1 rounded-xl border border-[#30363D] flex-wrap">
                <button
                  onClick={() => setQuickFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    quickFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-[#8E97A4] hover:text-[#E0E2E4]'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setQuickFilter('unlearned')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    quickFilter === 'unlearned'
                      ? 'bg-rose-600 text-white'
                      : unlearnedWords.length > 0
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-[#8E97A4] hover:text-rose-400'
                  }`}
                >
                  <Flag className={`w-3 h-3 ${unlearnedWords.length > 0 ? 'fill-rose-400' : ''}`} />
                  <span>Chưa thuộc ({unlearnedWords.length})</span>
                </button>
                <button
                  onClick={() => setQuickFilter('due')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    quickFilter === 'due' ? 'bg-amber-600 text-white' : 'text-[#8E97A4] hover:text-amber-400'
                  }`}
                >
                  Cần ôn ({dueForReview.length})
                </button>
                <button
                  onClick={() => setQuickFilter('bookmarked')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    quickFilter === 'bookmarked' ? 'bg-amber-500/20 text-amber-300' : 'text-[#8E97A4] hover:text-amber-400'
                  }`}
                >
                  ⭐ ({bookmarkedWords.length})
                </button>
              </div>

              <button
                onClick={onOpenAddWord}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm từ
              </button>
            </div>
          </div>

          {/* Word Cards Grid */}
          {previewWords.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#8E97A4] bg-[#21262E]/50 rounded-2xl border border-[#30363D]">
              Không tìm thấy từ vựng nào phù hợp bộ lọc.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {previewWords.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectWord(item)}
                  className="group p-4 rounded-2xl border border-[#2D333B] bg-[#21262E]/70 hover:bg-[#21262E] hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white group-hover:text-indigo-300 transition-colors text-base">
                          {item.term}
                        </span>
                        {item.ipa && (
                          <span className="text-xs text-indigo-300 font-mono font-medium">{item.ipa}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => speakWord(item.term)}
                          className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-600 transition-colors cursor-pointer"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (onToggleUnlearned) onToggleUnlearned(item.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isUnlearned
                              ? 'text-rose-400 fill-rose-400 bg-rose-500/20 border border-rose-500/30'
                              : 'text-[#484F58] hover:text-rose-400'
                          }`}
                          title={item.isUnlearned ? 'Đã đánh dấu CHƯA THUỘC' : 'Đánh dấu chưa thuộc'}
                        >
                          <Flag className={`w-3.5 h-3.5 ${item.isUnlearned ? 'fill-rose-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => onToggleBookmark(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isBookmarked
                              ? 'text-amber-400 fill-amber-400 bg-amber-500/15'
                              : 'text-[#484F58] hover:text-amber-400'
                          }`}
                          title="Đánh dấu sao"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-100 mt-2 line-clamp-2 leading-relaxed">
                      {item.meaning}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#2D333B] text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.mastery === 'mastered'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : item.mastery === 'reviewing'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : item.mastery === 'learning'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-[#2D333B] text-[#8E97A4]'
                      }`}
                    >
                      {item.mastery === 'mastered'
                        ? 'Đã thuộc'
                        : item.mastery === 'reviewing'
                        ? 'Ôn tập'
                        : item.mastery === 'learning'
                        ? 'Đang học'
                        : 'Mới'}
                    </span>

                    <span className="text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5 text-xs">
                      Chi tiết & AI
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {previewWords.length > 6 && (
            <div className="pt-2 text-center">
              <button
                onClick={() => onStartMode('list')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                Xem toàn bộ {previewWords.length} từ trong kho <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right 4 Cols: System Scope & Quick Actions */}
        <div className="lg:col-span-4 space-y-5">
          {/* Global Library Scope */}
          <div className="bg-[#16191F] rounded-3xl border border-[#2D333B] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Kho Lưu Trữ Hệ Thống</h3>
                  <p className="text-[11px] text-[#8E97A4]">Đồng bộ Cloud & Offline</p>
                </div>
              </div>

              <span className="text-xs font-black font-mono px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {words.length} TỪ
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121418]/80 border border-[#262A30] space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-[#D0D7DE]">
                <span>Phạm vi đang chọn:</span>
                <span className={isAllWordsVirtual ? 'text-emerald-400' : 'text-indigo-400'}>
                  {isAllWordsVirtual ? '🌐 Toàn Bộ Kho' : '📁 Từng bộ'}
                </span>
              </div>
              <p className="text-[11px] text-[#8E97A4] leading-relaxed">
                {isAllWordsVirtual
                  ? `Đang học tất cả ${words.length} từ trong toàn bộ kho lưu trữ.`
                  : `Đang chọn bộ "${activeSet.title}" (${setWords.length} từ).`}
              </p>
            </div>

            {onSelectSet && (
              <button
                onClick={() => onSelectSet(isAllWordsVirtual ? 'set-triumph-city' : 'all-words-library')}
                className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-[#21262E] hover:bg-[#282E37] text-[#D0D7DE] border border-[#30363D]"
              >
                <Globe className="w-4 h-4" />
                <span>{isAllWordsVirtual ? 'Chuyển về học theo từng bộ' : 'Học Toàn Bộ Kho 1500+ Từ'}</span>
              </button>
            )}

            {/* Quick Bulk Import Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#262A30]">
              {onOpenExcelImport && (
                <button
                  onClick={onOpenExcelImport}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Nạp Excel</span>
                </button>
              )}
              <button
                onClick={onOpenUpload}
                className="flex-1 py-2 px-3 rounded-xl bg-[#21262E] hover:bg-[#282E37] text-[#D0D7DE] border border-[#30363D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Nạp PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
