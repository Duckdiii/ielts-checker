import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Volume2,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  ArrowRight,
  Eye,
  SpellCheck,
  SkipForward,
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

interface SpellingModeProps {
  words: VocabItem[];
  activeSet: WordSet;
  onBack: () => void;
  onRateWord: (word: VocabItem, rating: SrsRating) => void;
  onCompleteSession?: (correct: number, total: number) => void;
}

export const SpellingMode: React.FC<SpellingModeProps> = ({
  words,
  activeSet,
  onBack,
  onRateWord,
  onCompleteSession,
}) => {
  const [patternMode, setPatternMode] = useState<PatternMode>('smart-interleaved');
  const [patternResult, setPatternResult] = useState<PatternQueueResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize and build smart queue
  const initSession = (pMode: PatternMode) => {
    if (words && words.length > 0) {
      const res = buildSmartStudyQueue(words, {
        mode: pMode,
        limit: Math.min(15, words.length),
      });
      setPatternResult(res);
      setCurrentIndex(0);
      setCorrectCount(0);
      setCompleted(false);
      setInputVal('');
      setIsSubmitted(false);
      setIsCorrect(false);
      setShowHint(false);
    }
  };

  useEffect(() => {
    initSession(patternMode);
  }, [activeSet.id, patternMode, words.length]);

  const queue = patternResult?.queue || [];
  const currentItem: PatternWordItem | undefined = queue[currentIndex];
  const currentWord = currentItem?.word;

  useEffect(() => {
    if (currentWord) {
      speakWord(currentWord.term);
      setInputVal('');
      setIsSubmitted(false);
      setIsCorrect(false);
      setShowHint(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentIndex, currentWord]);

  // Global keydown handler for Enter / Space to advance
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (isSubmitted && !completed) {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isSubmitted, completed, currentIndex, queue.length]);

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isSubmitted || !currentWord) return;

    // Clean user input and target (strip extra spaces, lower case)
    const cleanInput = inputVal.trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanTarget = currentWord.term.trim().toLowerCase().replace(/\s+/g, ' ');
    const correct = cleanInput === cleanTarget;

    setIsSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
      onRateWord(currentWord, 'good');
    } else {
      onRateWord(currentWord, 'again');
    }
  };

  const handleSkip = () => {
    if (isSubmitted || !currentWord) return;
    setIsSubmitted(true);
    setIsCorrect(false);
    onRateWord(currentWord, 'again');
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
      if (onCompleteSession) {
        onCompleteSession(correctCount, queue.length);
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    initSession(patternMode);
  };

  if (!words.length || !queue.length || !currentWord) {
    return (
      <div className="bg-[#16191D] rounded-3xl p-12 text-center border border-[#2D3135] space-y-4 max-w-lg mx-auto shadow-2xl">
        <h3 className="text-lg font-bold text-white">Chưa có từ vựng trong bộ này</h3>
        <p className="text-xs text-[#8B949E]">Hãy tải lên PDF hoặc thêm từ vựng để bắt đầu luyện chính tả.</p>
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
          <h2 className="text-2xl font-bold text-white">Hoàn Thành Luyện Viết Chính Tả!</h2>
          <p className="text-sm text-[#8B949E] mt-1.5 leading-relaxed">
            Bạn đã hoàn thành phiên luyện viết chính tả theo mô hình đan xen trí nhớ.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#21262D] border border-[#30363D]">
          <div>
            <div className="text-2xl font-extrabold text-indigo-400">{queue.length}</div>
            <div className="text-xs text-[#8B949E] font-medium mt-0.5">Tổng số từ đã gõ</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {Math.round((correctCount / (queue.length || 1)) * 100)}%
            </div>
            <div className="text-xs text-[#8B949E] font-medium mt-0.5">Độ chính xác</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Luyện lại phiên này
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

  return (
    <div className="max-w-[1680px] mx-auto space-y-5 animate-fadeIn px-2 sm:px-4">
      {/* Pattern Selector Header */}
      <StudyPatternSelector
        currentMode={patternMode}
        onChangeMode={(m) => setPatternMode(m)}
        stats={patternResult?.stats}
        currentTier={currentItem.tier}
        appearanceReason={currentItem.appearanceReason}
      />

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16191F] p-4 rounded-2xl border border-[#2D333B] shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8E97A4] hidden sm:inline">Tiến độ:</span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {currentIndex + 1} / {queue.length} từ
            </span>
          </div>

          <AccentSwitcher currentWord={currentWord?.term} compact={true} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#121418] rounded-full overflow-hidden border border-[#262A30] p-0.5">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3-Column Panoramic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (3 Cols): Session Queue & Interleaving Breakdown */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <SpellCheck className="w-4 h-4" /> Hàng Đợi Gõ Chính Tả
              </span>
              <span className="text-xs font-mono font-bold text-white bg-[#21262E] px-2.5 py-0.5 rounded-lg">
                {queue.length} từ
              </span>
            </div>

            {/* Current Item Tier Info */}
            <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E97A4]">Nhóm từ hiện tại:</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${currentItem.tierBadge.bg} ${currentItem.tierBadge.border} ${currentItem.tierBadge.text}`}
                >
                  <span>{currentItem.tierBadge.icon}</span>
                  <span>{currentItem.tierLabel}</span>
                </span>
              </div>
              <p className="text-[11px] text-[#9BA1A6] italic leading-relaxed">
                {currentItem.appearanceReason}
              </p>
            </div>

            {/* Upcoming Words Queue List */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {queue.map((item, idx) => {
                const isCurrent = idx === currentIndex;
                const isPast = idx < currentIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                      isCurrent
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold'
                        : isPast
                        ? 'bg-[#1C2027]/50 text-[#8E97A4] border border-transparent'
                        : 'bg-[#1C2027] text-[#9BA1A6] border border-[#262A30]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] w-4 text-[#8E97A4]">{idx + 1}.</span>
                      <span className="truncate">
                        {isPast || isCurrent ? item.word.term : '••••••••'}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-75 shrink-0 ml-2">
                      {isPast ? '✓ Đã gõ' : isCurrent ? '▶ Đang gõ' : item.tierLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-[#16191F] border border-[#2D333B] text-center shadow-xl">
            <div>
              <div className="text-xl font-black text-emerald-400">{correctCount}</div>
              <div className="text-[11px] text-[#8E97A4] font-medium mt-0.5">Gõ đúng</div>
            </div>
            <div>
              <div className="text-xl font-black text-indigo-400">
                {currentIndex > 0 ? `${Math.round((correctCount / currentIndex) * 100)}%` : '100%'}
              </div>
              <div className="text-[11px] text-[#8E97A4] font-medium mt-0.5">Độ chính xác</div>
            </div>
          </div>
        </div>

        {/* Center Column (6 Cols): Main Dictation & Typing Experience */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-6 sm:p-9 border border-[#2D333B] shadow-2xl space-y-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

            {/* Header badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${currentItem.tierBadge.bg} ${currentItem.tierBadge.border} ${currentItem.tierBadge.text}`}
                >
                  <span>{currentItem.tierBadge.icon}</span>
                  <span>{currentItem.tierLabel}</span>
                </span>

                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                  {currentWord.targetIeltsBand ? `Target Band ${currentWord.targetIeltsBand}` : 'IELTS Spelling'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-xs text-[#8E97A4] hover:text-emerald-300 transition-colors cursor-pointer bg-[#21262E] px-3 py-1.5 rounded-xl border border-[#30363D]"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>{showHint ? 'Ẩn ký tự' : 'Gợi ý ký tự đầu'}</span>
              </button>
            </div>

            {/* Audio Player Core with Visual Waves */}
            <div className="text-center py-2 space-y-4">
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => speakWord(currentWord.term)}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                  title="Bấm để nghe lại phát âm chuẩn bản ngữ"
                >
                  <Volume2 className="w-11 h-11 group-hover:scale-110 transition-transform" />
                </button>
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-[#121418] text-[10px] font-bold text-emerald-400 rounded-full border border-emerald-500/30">
                  Audio HD
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Lắng nghe phát âm và gõ chính tả</h3>
                <p className="text-xs text-[#8E97A4]">
                  Gõ chuẩn từng chữ cái để tránh bị trừ điểm Spelling trong IELTS Listening & Writing
                </p>
              </div>

              {/* Meaning Prompt Box */}
              <div className="p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] max-w-xl mx-auto shadow-inner text-center">
                <span className="text-[11px] text-[#8E97A4] uppercase font-bold tracking-wider block mb-1">
                  Định nghĩa tiếng Việt gợi ý:
                </span>
                <span className="text-base font-bold text-white leading-relaxed">
                  {currentWord.meaning}
                </span>
              </div>

              {/* Letter scramble / first letter hint */}
              {showHint && (
                <div className="text-sm text-amber-300 font-mono tracking-widest bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 max-w-md mx-auto animate-fadeIn shadow-sm">
                  Gợi ý: <span className="font-bold text-amber-200">{currentWord.term.charAt(0).toUpperCase()}</span>
                  {currentWord.term
                    .slice(1)
                    .split('')
                    .map((c) => (c === ' ' ? ' ' : ' _ '))
                    .join('')}
                  <span className="text-[11px] text-[#8E97A4] block mt-1">
                    ({currentWord.term.replace(/\s+/g, '').length} ký tự)
                  </span>
                </div>
              )}
            </div>

            {/* Form Input with high contrast */}
            <form onSubmit={handleCheck} className="space-y-4 max-w-xl mx-auto">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  disabled={isSubmitted}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Gõ từ vựng tiếng Anh bạn vừa nghe..."
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className={`w-full text-center text-xl sm:text-2xl font-bold py-4 px-5 rounded-2xl bg-[#1C2027] border transition-all focus:outline-hidden ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-500 text-emerald-300 bg-emerald-500/15 ring-2 ring-emerald-500/30'
                        : 'border-rose-500 text-rose-300 bg-rose-500/15 ring-2 ring-rose-500/30'
                      : 'border-[#30363D] text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-inner'
                  }`}
                />
              </div>

              {!isSubmitted ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-5 py-3.5 rounded-2xl text-xs font-semibold bg-[#21262E] hover:bg-[#282D33] text-[#8E97A4] hover:text-white border border-[#30363D] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <SkipForward className="w-4 h-4" /> Bỏ qua
                  </button>
                  <button
                    type="submit"
                    disabled={!inputVal.trim()}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 disabled:pointer-events-none text-white transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    Kiểm tra [Nhấn Enter]
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div
                    className={`p-5 rounded-2xl border text-center space-y-2 ${
                      isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 text-base font-extrabold">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Chính xác 100%! Tuyệt vời!
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400" /> Chưa chính xác!
                        </>
                      )}
                    </div>

                    <div className="text-lg font-black text-white">
                      Từ đúng: <span className="underline decoration-emerald-400 decoration-2">{currentWord.term}</span>
                    </div>

                    {currentWord.ipa && (
                      <div className="text-xs font-mono text-[#8E97A4]">{currentWord.ipa}</div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{currentIndex < queue.length - 1 ? 'Từ tiếp theo [Nhấn Enter]' : 'Xem kết quả tổng kết'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column (3 Cols): Lexical Details, Collocations & Context Sentence */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Thông Tin Học Thuật IELTS
            </h4>

            {/* Word details */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-[#8E97A4] block">Trình độ chuẩn:</span>
                <span className="text-xs font-bold text-amber-300 uppercase px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20 inline-block mt-0.5">
                  {currentWord.cefrLevel || (currentWord.targetIeltsBand ? `IELTS ${currentWord.targetIeltsBand}` : 'Academic IELTS')}
                </span>
              </div>

              {currentWord.ipa && (
                <div>
                  <span className="text-[11px] text-[#8E97A4] block">Phiên âm IPA:</span>
                  <span className="text-xs font-mono font-bold text-[#E0E2E4] mt-0.5 block">
                    {currentWord.ipa}
                  </span>
                </div>
              )}

              {/* Example in IELTS reading/writing */}
              {currentWord.example && (
                <div className="p-3 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 block">Ví dụ câu Cambridge:</span>
                  <p className="text-xs text-[#E0E2E4] italic leading-relaxed">
                    {isSubmitted ? currentWord.example : currentWord.example.replace(new RegExp(currentWord.term, 'gi'), '_____')}
                  </p>
                </div>
              )}

              {/* Synonyms & Collocations if any */}
              {currentWord.synonyms && (
                <div className="space-y-1.5 pt-2 border-t border-[#2D333B]">
                  <span className="text-[11px] font-bold text-purple-300 block">Từ đồng nghĩa:</span>
                  <p className="text-xs text-purple-300/90 leading-relaxed">
                    {currentWord.synonyms}
                  </p>
                </div>
              )}

              {/* Word Family */}
              {currentWord.wordFamily && (
                <div className="space-y-1.5 pt-2 border-t border-[#2D333B]">
                  <span className="text-[11px] font-bold text-amber-300 block">Họ từ (Word Family):</span>
                  <p className="text-xs text-[#E0E2E4] leading-relaxed">
                    {currentWord.wordFamily}
                  </p>
                </div>
              )}

              {/* Notes */}
              {currentWord.notes && (
                <div className="space-y-1.5 pt-2 border-t border-[#2D333B]">
                  <span className="text-[11px] font-bold text-teal-300 block">Ghi chú & Collocation:</span>
                  <p className="text-xs text-[#9BA1A6] leading-relaxed">
                    {currentWord.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
