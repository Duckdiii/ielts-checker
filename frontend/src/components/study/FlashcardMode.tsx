import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Volume2,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  Award,
  Layers,
  HelpCircle,
  Brain,
  Info,
  Maximize2,
  Minimize2,
  Keyboard,
  BookOpen,
  Zap,
  Check,
  Columns,
  Flame,
  ListOrdered,
  Tag,
  Mic,
  MicOff,
  AlertCircle,
  Flag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabItem, WordSet } from '../../types';
import { speakWord } from '../../utils/speech';
import { SrsRating } from '../../utils/srs';
import {
  buildSmartStudyQueue,
  PatternMode,
  PatternWordItem,
  PatternQueueResult,
} from '../../utils/studyPattern';
import { StudyPatternSelector } from './StudyPatternSelector';
import { AccentSwitcher } from '../index';
import { QuickWordTooltip } from '../index';
import { FlashcardCountdownTimer } from './FlashcardCountdownTimer';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration } from '../../utils/confetti';

interface FlashcardModeProps {
  words: VocabItem[];
  activeSet: WordSet;
  onBack: () => void;
  onRateWord: (word: VocabItem, rating: SrsRating) => void;
  onToggleBookmark: (wordId: string) => void;
  onToggleUnlearned?: (wordId: string) => void;
  onOpenAiBoosterForWord: (word: VocabItem) => void;
  onCompleteSession?: (correct: number, total: number) => void;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  words,
  activeSet,
  onBack,
  onRateWord,
  onToggleBookmark,
  onToggleUnlearned,
  onOpenAiBoosterForWord,
  onCompleteSession,
}) => {
  const [patternMode, setPatternMode] = useState<PatternMode>('smart-interleaved');
  const [patternResult, setPatternResult] = useState<PatternQueueResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [isZenMode, setIsZenMode] = useState(false);
  const [showSidebars, setShowSidebars] = useState(true);
  const [isPronouncing, setIsPronouncing] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string | null>(null);
  const [pronunciationScore, setPronunciationScore] = useState<{
    status: 'perfect' | 'good' | 'retry';
    score: number;
    feedbackVi: string;
  } | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Reset pronunciation check when switching cards
  useEffect(() => {
    setSpokenTranscript(null);
    setPronunciationScore(null);
    if (isPronouncing && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsPronouncing(false);
    }
  }, [currentIndex]);

  const startPronunciationCheck = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentWord) return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech. Hãy sử dụng Google Chrome hoặc Edge để thử tính năng này!');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setSpokenTranscript(null);
      setPronunciationScore(null);
      setIsPronouncing(true);
      sounds.playClick();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        setSpokenTranscript(transcript);

        const targetClean = currentWord.term.trim().toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
        const spokenClean = transcript.replace(/[^a-zA-Z0-9\s]/g, '');

        if (spokenClean === targetClean) {
          setPronunciationScore({
            status: 'perfect',
            score: 100,
            feedbackVi: '🎯 Hoàn hảo! Bạn phát âm hoàn toàn chính xác.',
          });
          sounds.playSuccess();
          fireCelebration();
        } else if (spokenClean.includes(targetClean) || targetClean.includes(spokenClean)) {
          setPronunciationScore({
            status: 'good',
            score: 85,
            feedbackVi: '👍 Rất tốt! Bạn phát âm gần như chuẩn xác.',
          });
          sounds.playSuccess();
        } else {
          setPronunciationScore({
            status: 'retry',
            score: 50,
            feedbackVi: `💡 Chưa khớp lắm. Hệ thống nghe được: "${transcript}". Bấm loa nghe lại và thử lại nhé!`,
          });
          sounds.playWrong();
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Recognition error:', err);
        setIsPronouncing(false);
      };

      recognition.onend = () => {
        setIsPronouncing(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error starting speech check:', err);
      setIsPronouncing(false);
    }
  };


  const toggleFlip = () => {
    setIsFlipped((prev) => {
      const next = !prev;
      sounds.playFlip();
      return next;
    });
  };

  // Initialize or re-build queue when words or patternMode changes
  useEffect(() => {
    if (words && words.length > 0) {
      const res = buildSmartStudyQueue(words, {
        mode: patternMode,
        preserveAll: true,
      });
      setPatternResult(res);
      setCurrentIndex(0);
      setIsFlipped(false);
      setCompleted(false);
      setReviewedCount(0);
      setCorrectCount(0);
      setCardStartTime(Date.now());
    }
  }, [activeSet.id, patternMode, words.length]);

  const queue = patternResult?.queue || [];
  const currentItem: PatternWordItem | undefined = queue[currentIndex];
  const currentWord = currentItem?.word;

  useEffect(() => {
    setCardStartTime(Date.now());
    if (currentWord && autoSpeak && !isFlipped) {
      speakWord(currentWord.term);
    }
  }, [currentIndex, isFlipped, autoSpeak, currentWord]);

  // Full Keyboard navigation (Space: Flip/Audio, 1-4: FSRS Rates, S: Star Bookmark, Arrows: Nav)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlip();
      } else if (e.key === '1') {
        handleRating('again');
      } else if (e.key === '2') {
        handleRating('hard');
      } else if (e.key === '3') {
        handleRating('good');
      } else if (e.key === '4') {
        handleRating('easy');
      } else if (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'p') {
        startPronunciationCheck();
      } else if (e.key.toLowerCase() === 's') {
        if (currentWord) {
          sounds.playClick();
          onToggleBookmark(currentWord.id);
        }
      } else if (e.key.toLowerCase() === 'z') {
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, completed, queue.length, currentWord]);

  const handleRating = (rating: SrsRating) => {
    if (!currentWord) return;
    onRateWord(currentWord, rating);
    const newReviewed = reviewedCount + 1;
    const isGood = rating === 'good' || rating === 'easy';
    const newCorrect = correctCount + (isGood ? 1 : 0);
    setReviewedCount(newReviewed);
    setCorrectCount(newCorrect);

    if (rating === 'again') {
      sounds.playWrong();
    } else {
      sounds.playSuccess();
    }

    if (currentIndex < queue.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
      if (onCompleteSession) {
        onCompleteSession(newCorrect, queue.length);
      }
      sounds.playComplete();
      fireCelebration();
    }
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    if (words && words.length > 0) {
      const res = buildSmartStudyQueue(words, {
        mode: patternMode,
        preserveAll: true,
      });
      setPatternResult(res);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
    setReviewedCount(0);
    setCorrectCount(0);
  };

  if (!words.length || !queue.length || !currentWord) {
    return (
      <div className="bg-[#16191D] rounded-3xl p-12 text-center border border-[#2D3135] space-y-4 max-w-lg mx-auto shadow-2xl">
        <h3 className="text-lg font-bold text-white">Chưa có từ vựng trong bộ này</h3>
        <p className="text-xs text-[#8B949E]">Hãy tải lên PDF hoặc thêm từ vựng để bắt đầu học flashcard.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-xl mx-auto bg-[#16191D] rounded-3xl p-8 border border-[#2D3135] shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">Hoàn Thành Phiên Học Flashcard!</h2>
          <p className="text-sm text-[#8B949E] mt-1.5 leading-relaxed">
            Bạn đã hoàn thành phiên học theo mô hình xen kẽ khoa học ({patternResult?.stats.newCount} từ mới, {patternResult?.stats.strugglingCount} từ lạ/khó, {patternResult?.stats.dueCount} từ đến hạn, {patternResult?.stats.anchorCount} từ cũ).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#21262D] border border-[#30363D]">
          <div>
            <div className="text-2xl font-extrabold text-indigo-400">{reviewedCount}</div>
            <div className="text-xs text-[#8B949E] font-medium mt-0.5">Số thẻ đã ôn</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {Math.round((correctCount / (queue.length || 1)) * 100)}%
            </div>
            <div className="text-xs text-[#8B949E] font-medium mt-0.5">Tỷ lệ nhớ tốt</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Ôn lại phiên này
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / queue.length) * 100);
  const accuracyPercent = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 100;

  return (
    <div className={`w-full mx-auto space-y-4 animate-fadeIn transition-all duration-300 ${
      showSidebars && !isZenMode ? 'max-w-[1600px]' : 'max-w-3xl'
    }`}>
      {/* Pattern Selector Header */}
      <StudyPatternSelector
        currentMode={patternMode}
        onChangeMode={(m) => setPatternMode(m)}
        stats={patternResult?.stats}
        currentTier={currentItem.tier}
        appearanceReason={currentItem.appearanceReason}
      />

      {/* Top Controls Bar */}
      <div className="bg-[#16191D] p-3 sm:p-4 rounded-2xl border border-[#2D3135] flex items-center justify-between shadow-lg flex-wrap gap-2.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl hover:bg-[#21262D]"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều khiển
        </button>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <AccentSwitcher currentWord={currentWord?.term} compact={true} />

          {/* Customizable Countdown Timer */}
          <FlashcardCountdownTimer
            currentIndex={currentIndex}
            isFlipped={isFlipped}
            onTimeoutFlip={() => {
              if (!isFlipped) {
                toggleFlip();
              }
            }}
            onSessionTimeout={() => {
              sounds.playComplete();
              fireCelebration();
            }}
          />

          {/* Toggle 3-Panel Sidebars */}
          {!isZenMode && (
            <button
              onClick={() => {
                sounds.playClick();
                setShowSidebars((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showSidebars
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                  : 'bg-[#21262D] text-slate-400 border-[#30363D] hover:text-white'
              }`}
              title="Bật / Tắt 2 cột thông tin bên cạnh"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showSidebars ? 'Thu gọn 2 bên' : 'Mở rộng 2 bên'}</span>
            </button>
          )}

          {/* Zen Focus Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsZenMode((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isZenMode
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-[#21262D] text-slate-300 border-[#30363D] hover:text-white hover:border-indigo-500/50'
            }`}
            title="Chế độ toàn màn hình không xao nhãng (Phím Z)"
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isZenMode ? 'Thoát Zen' : 'Zen Focus'}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/30 border border-white/10 hidden sm:inline">
              Z
            </span>
          </button>

          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 cursor-pointer hover:text-white px-2 py-1 rounded-lg hover:bg-[#21262D]">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="rounded bg-[#21262D] border-[#30363D] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="hidden sm:inline">Tự phát âm</span>
          </label>

          <span className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm font-mono">
            <span>{currentIndex + 1} / {queue.length}</span>
            <span className="text-xs text-indigo-400">({progressPercent}%)</span>
          </span>
        </div>
      </div>

      {/* 3-COLUMN PANORAMIC GRID LAYOUT */}
      <div className={`grid gap-5 items-start ${
        showSidebars && !isZenMode
          ? 'grid-cols-1 lg:grid-cols-12'
          : 'grid-cols-1 max-w-3xl mx-auto'
      }`}>
        {/* ========================================================================= */}
        {/* 📋 LEFT SIDEBAR: HÀNG ĐỢI PHIÊN HỌC & TIẾN TRÌNH & PHÍM TẮT */}
        {/* ========================================================================= */}
        {showSidebars && !isZenMode && (
          <aside className="lg:col-span-3 space-y-4 animate-fadeIn">
            {/* Live Session Stats Box */}
            <div className="bg-[#16191D] p-4 rounded-2xl border border-[#2D3135] shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-[#2D3135] pb-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Tiến trình phiên học</span>
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {accuracyPercent}% chuẩn xác
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-[#21262D] rounded-xl border border-[#30363D]">
                  <span className="text-[10px] text-slate-400 block">Đã ôn</span>
                  <span className="text-base font-black text-indigo-300">{reviewedCount}</span>
                </div>
                <div className="p-2.5 bg-[#21262D] rounded-xl border border-[#30363D]">
                  <span className="text-[10px] text-slate-400 block">Nhớ tốt</span>
                  <span className="text-base font-black text-emerald-400">{correctCount}</span>
                </div>
                <div className="p-2.5 bg-[#21262D] rounded-xl border border-[#30363D]">
                  <span className="text-[10px] text-slate-400 block">Còn lại</span>
                  <span className="text-base font-black text-amber-300">{Math.max(0, queue.length - currentIndex - 1)}</span>
                </div>
              </div>
            </div>

            {/* Session Queue Word List Navigator */}
            <div className="bg-[#16191D] p-4 rounded-2xl border border-[#2D3135] shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-indigo-400" />
                  <span>Hàng đợi thẻ ({queue.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Chạm để nhảy từ</span>
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {queue.map((item, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isPast = idx < currentIndex;
                  return (
                    <button
                      key={item.word.id + idx}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setCurrentIndex(idx);
                        setIsFlipped(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500'
                          : isPast
                          ? 'bg-[#21262D]/60 border-[#30363D]/60 text-slate-400 hover:text-slate-200 hover:bg-[#21262D]'
                          : 'bg-[#1C2025] border-[#2D3135] text-slate-300 hover:text-white hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-mono font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : isPast
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-[#21262D] text-slate-400'
                        }`}>
                          {isPast ? <Check className="w-3 h-3" /> : idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-200' : 'text-slate-200'}`}>
                            {item.word.term}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.word.meaning}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 font-bold ${item.tierBadge.bg} ${item.tierBadge.border} ${item.tierBadge.text}`}>
                        {item.tierBadge.icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keyboard Cheatsheet */}
            <div className="bg-[#16191D] p-4 rounded-2xl border border-[#2D3135] shadow-lg space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Keyboard className="w-4 h-4 text-indigo-400" />
                <span>Phím tắt học nhanh</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#21262D] border border-[#30363D]">
                  <span className="text-slate-400">Lật thẻ:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#16191D] font-mono font-bold text-indigo-300 border border-[#30363D]">Space</kbd>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#21262D] border border-[#30363D]">
                  <span className="text-slate-400">Đánh giá:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#16191D] font-mono font-bold text-indigo-300 border border-[#30363D]">1-4</kbd>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#21262D] border border-[#30363D]">
                  <span className="text-slate-400">Gắn sao:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#16191D] font-mono font-bold text-amber-300 border border-[#30363D]">S</kbd>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#21262D] border border-[#30363D]">
                  <span className="text-slate-400">Zen Focus:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#16191D] font-mono font-bold text-cyan-300 border border-[#30363D]">Z</kbd>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ========================================================================= */}
        {/* 🎴 CENTER COLUMN: MAIN FLASHCARD WORKSPACE */}
        {/* ========================================================================= */}
        <main className={`space-y-4 ${
          showSidebars && !isZenMode ? 'lg:col-span-6' : 'w-full'
        }`}>
          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-[#21262D] rounded-full overflow-hidden border border-[#2D3135] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={toggleFlip}
            className={`relative w-full rounded-3xl cursor-pointer select-none transition-all duration-300 shadow-2xl ${
              isZenMode ? 'min-h-[500px] sm:min-h-[560px]' : 'min-h-[440px] sm:min-h-[480px]'
            }`}
            style={{ perspective: '1000px' }}
          >
            <div
              className={`w-full h-full rounded-3xl p-6 sm:p-10 transition-all duration-500 border bg-[#16191D] flex flex-col justify-between relative overflow-hidden ${
                isFlipped
                  ? 'border-indigo-500/60 shadow-indigo-950/30 bg-gradient-to-b from-[#1C2128] to-[#14161A]'
                  : 'border-[#30363D] hover:border-indigo-500/60'
              }`}
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />

              {/* Card Top Details */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full border flex items-center gap-1.5 ${currentItem.tierBadge.bg} ${currentItem.tierBadge.border} ${currentItem.tierBadge.text}`}
                  >
                    <span>{currentItem.tierBadge.icon}</span>
                    <span>{currentItem.tierLabel}</span>
                  </span>

                  {currentWord.targetIeltsBand && (
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      Band {currentWord.targetIeltsBand}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={startPronunciationCheck}
                    className={`p-2.5 rounded-xl transition-all border cursor-pointer ${
                      isPronouncing
                        ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400 border-rose-500'
                        : pronunciationScore?.status === 'perfect'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#21262D] text-amber-300 hover:text-white hover:bg-amber-600 border-[#30363D]'
                    }`}
                    title={isPronouncing ? 'Đang lắng nghe phát âm của bạn...' : 'Luyện phát âm từ này (Bấm Mic)'}
                  >
                    <Mic className={`w-5 h-5 ${isPronouncing ? 'animate-bounce' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      speakWord(currentWord.term);
                    }}
                    className="p-2.5 rounded-xl bg-[#21262D] text-indigo-300 hover:text-white hover:bg-indigo-600 transition-colors border border-[#30363D] cursor-pointer"
                    title="Nghe phát âm chuẩn"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      if (onToggleUnlearned) onToggleUnlearned(currentWord.id);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      currentWord.isUnlearned
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/20 ring-1 ring-rose-500/40'
                        : 'bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-rose-400 hover:bg-rose-500/10'
                    }`}
                    title={currentWord.isUnlearned ? 'Đã đánh dấu CHƯA THUỘC (Nhấn để hủy)' : 'Đánh dấu từ này là CHƯA THUỘC'}
                  >
                    <Flag className={`w-5 h-5 ${currentWord.isUnlearned ? 'fill-rose-400 text-rose-400' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onToggleBookmark(currentWord.id);
                    }}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      currentWord.isBookmarked
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white'
                    }`}
                    title="Lưu từ quan trọng (Phím S)"
                  >
                    <Star className={`w-5 h-5 ${currentWord.isBookmarked ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Card Center Content */}
              <div className="py-6 sm:py-8 text-center space-y-4">
                {/* Live Pronunciation Test Feedback Banner */}
                {(isPronouncing || pronunciationScore) && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`p-3.5 rounded-2xl border text-xs sm:text-sm animate-fadeIn max-w-md mx-auto shadow-md ${
                      isPronouncing
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                        : pronunciationScore?.status === 'perfect'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                        : pronunciationScore?.status === 'good'
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-200'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    {isPronouncing ? (
                      <div className="flex items-center justify-center gap-2 font-bold animate-pulse">
                        <Mic className="w-4 h-4 text-rose-400 animate-bounce" />
                        <span>🎙️ Đang nghe... Hãy đọc to từ: "{currentWord.term}"</span>
                      </div>
                    ) : pronunciationScore ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5 font-bold">
                          {pronunciationScore.status === 'perfect' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          )}
                          <span>{pronunciationScore.feedbackVi}</span>
                        </div>
                        {spokenTranscript && (
                          <div className="text-[11px] text-slate-300">
                            Bạn đã đọc: <span className="font-mono font-bold text-white">"{spokenTranscript}"</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {!isFlipped ? (
                  // FRONT FACE
                  <div className="space-y-4 animate-fadeIn">
                    <div className="text-xs sm:text-sm uppercase font-bold tracking-widest text-indigo-400">
                      Academic Term
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-md">
                      {currentWord.term}
                    </h1>
                    {currentWord.ipa && (
                      <div>
                        <span className="text-lg sm:text-2xl text-indigo-300 font-mono font-medium tracking-wide bg-[#21262D]/90 px-4 py-1.5 rounded-2xl border border-indigo-500/30 inline-block shadow-sm">
                          {currentWord.ipa}
                        </span>
                      </div>
                    )}
                    <div className="pt-6 text-xs sm:text-sm text-slate-300 flex items-center justify-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D] font-mono font-bold text-indigo-300">
                        Space
                      </span>
                      <span>Chạm vào thẻ hoặc bấm phím Space để xem định nghĩa & ví dụ</span>
                    </div>
                  </div>
                ) : (
                  // BACK FACE
                  <div className="space-y-5 text-left animate-fadeIn">
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#21262D]/90 border border-indigo-500/30">
                      <span className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                        Định nghĩa tiếng Việt:
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                        {currentWord.meaning}
                      </h3>
                    </div>

                    {currentWord.example && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#21262D]/70 border border-[#30363D]">
                        <span className="text-xs sm:text-sm font-bold text-indigo-300 block mb-1.5">
                          Ngữ cảnh học thuật (IELTS Context):
                        </span>
                        <p className="text-base sm:text-lg text-slate-100 italic font-serif leading-relaxed">
                          "{currentWord.example}"
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {currentWord.synonyms && (
                        <div className="p-3.5 rounded-xl bg-[#21262D] border border-emerald-500/30">
                          <span className="text-emerald-400 block text-xs font-bold uppercase mb-0.5">
                            Từ đồng nghĩa (Paraphrase):
                          </span>
                          <span className="text-emerald-200 font-semibold text-sm sm:text-base">{currentWord.synonyms}</span>
                        </div>
                      )}
                      {currentWord.wordFamily && (
                        <div className="p-3.5 rounded-xl bg-[#21262D] border border-amber-500/30">
                          <span className="text-amber-400 block text-xs font-bold uppercase mb-0.5">
                            Họ từ (Word Family):
                          </span>
                          <span className="text-amber-200 font-semibold text-sm sm:text-base">{currentWord.wordFamily}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Bottom / AI Button */}
              <div className="flex items-center justify-between pt-3 border-t border-[#2D3135]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAiBoosterForWord(currentWord);
                  }}
                  className="flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/30 px-3.5 py-2 rounded-xl border border-indigo-500/30 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Phân tích sâu với AI</span>
                </button>

                <span className="text-xs sm:text-sm text-slate-300">
                  Giai đoạn SRS: <strong className="text-white font-bold">Lớp {currentWord.srsStage || 0}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* SRS Rating Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleRating('again')}
                className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border-2 border-rose-500/40 text-rose-200 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <span className="text-sm sm:text-base font-extrabold">1. Quên hoàn toàn</span>
                <span className="text-xs text-rose-300 font-mono">&lt; 10 phút</span>
              </button>

              <button
                type="button"
                onClick={() => handleRating('hard')}
                className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500/40 text-amber-200 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <span className="text-sm sm:text-base font-extrabold">2. Khá khó nhớ</span>
                <span className="text-xs text-amber-300 font-mono">1 ngày</span>
              </button>

              <button
                type="button"
                onClick={() => handleRating('good')}
                className="p-3.5 sm:p-4 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 border-2 border-indigo-500/40 text-indigo-200 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <span className="text-sm sm:text-base font-extrabold">3. Nhớ tốt</span>
                <span className="text-xs text-indigo-300 font-mono">3 ngày</span>
              </button>

              <button
                type="button"
                onClick={() => handleRating('easy')}
                className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-500/40 text-emerald-200 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <span className="text-sm sm:text-base font-extrabold">4. Rất dễ</span>
                <span className="text-xs text-emerald-300 font-mono">7 ngày</span>
              </button>
            </div>

            {/* Previous & Next quick buttons */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Từ trước (Phím ←)
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === queue.length - 1}
                className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Từ sau (Phím →) <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* ========================================================================= */}
        {/* 💡 RIGHT SIDEBAR: GÓC PHÂN TÍCH IELTS & HỌ TỪ & CỤM TỪ ĂN ĐIỂM */}
        {/* ========================================================================= */}
        {showSidebars && !isZenMode && (
          <aside className="lg:col-span-3 space-y-4 animate-fadeIn">
            {/* Academic Spotlight Header Card */}
            <div className="bg-[#16191D] p-5 rounded-2xl border border-indigo-500/30 shadow-lg space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#2D3135] pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Góc Phân Tích IELTS
                  </h3>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {currentWord.targetIeltsBand ? `Band ${currentWord.targetIeltsBand}` : 'Band 7.0+'}
                </span>
              </div>

              {/* Topic & CEFR Level */}
              <div className="flex flex-wrap gap-2">
                {currentWord.topic && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#21262D] text-slate-200 border border-[#30363D] flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{currentWord.topic}</span>
                  </span>
                )}
                {currentWord.cefrLevel && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    CEFR {currentWord.cefrLevel}
                  </span>
                )}
              </div>

              {/* Collocations & IELTS Writing Hook */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                  Collocations & Cụm từ hay gặp:
                </span>
                <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-slate-200 leading-relaxed font-medium">
                  {currentWord.notes || `Sử dụng "${currentWord.term}" trong bài thi IELTS Writing Task 2 và Speaking Part 3 để nâng tiêu chí Lexical Resource.`}
                </div>
              </div>

              {/* Word Family Breakdown */}
              {currentWord.wordFamily && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Word Family (Họ từ loại):
                  </span>
                  <div className="p-3 rounded-xl bg-[#21262D] border border-amber-500/30 text-xs font-bold text-amber-200">
                    {currentWord.wordFamily}
                  </div>
                </div>
              )}

              {/* Quick AI Action Card */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onOpenAiBoosterForWord(currentWord)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Mở Trợ Lý AI Chuyên Sâu</span>
                </button>
              </div>
            </div>

            {/* SRS History Info Card */}
            <div className="bg-[#16191D] p-4 rounded-2xl border border-[#2D3135] shadow-lg space-y-2.5 text-xs text-slate-300">
              <span className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                Lịch sử ghi nhớ của từ này
              </span>
              <div className="space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lớp SRS hiện tại:</span>
                  <span className="text-white font-bold">Lớp {currentWord.srsStage || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số lần trả lời đúng:</span>
                  <span className="text-emerald-400 font-bold">{currentWord.correctCount || 0} lần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số lần quên:</span>
                  <span className="text-rose-400 font-bold">{currentWord.incorrectCount || 0} lần</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
