import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Award,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
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

interface SentenceClozeModeProps {
  words: VocabItem[];
  allWords?: VocabItem[];
  activeSet: WordSet;
  onBack: () => void;
  onRateWord: (word: VocabItem, rating: SrsRating) => void;
  onCompleteSession?: (correct: number, total: number) => void;
}

interface ClozeItem {
  id: string;
  sentenceWithBlank: string;
  correctWord: string;
  options: string[];
  meaningVi: string;
  targetWord: VocabItem;
  patternItem: PatternWordItem;
}

const FALLBACK_ACADEMIC_DISTRACTORS = [
  'mitigate',
  'exacerbate',
  'ubiquitous',
  'prevalent',
  'substantiate',
  'counteract',
  'diminish',
  'paramount',
  'comprehensive',
  'plausible',
  'imperative',
  'detrimental',
];

export const SentenceClozeMode: React.FC<SentenceClozeModeProps> = ({
  words,
  allWords = words,
  activeSet,
  onBack,
  onRateWord,
  onCompleteSession,
}) => {
  const [patternMode, setPatternMode] = useState<PatternMode>('smart-interleaved');
  const [patternResult, setPatternResult] = useState<PatternQueueResult | null>(null);
  const [clozeItems, setClozeItems] = useState<ClozeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const generateClozeList = (pMode: PatternMode) => {
    if (!words || words.length === 0) {
      setClozeItems([]);
      setPatternResult(null);
      return;
    }

    const pResult = buildSmartStudyQueue(words, {
      mode: pMode,
      limit: Math.min(15, words.length),
    });
    setPatternResult(pResult);

    const distractorPool = allWords && allWords.length > words.length ? allWords : words;

    const items: ClozeItem[] = pResult.queue.map((pItem, idx) => {
      const w = pItem.word;
      let sentence =
        w.example && w.example.trim().length > 8
          ? w.example.trim()
          : `Academic research emphasizes that understanding the concept of ${w.term} is crucial for sustainable development.`;

      const rootTerm = w.term.trim();
      const escaped = rootTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const inflectionRegex = new RegExp(`\\b${escaped}\\w*\\b`, 'gi');

      let sentenceWithBlank = sentence.replace(inflectionRegex, '__________');

      if (!sentenceWithBlank.includes('__________')) {
        sentenceWithBlank = sentence.replace(rootTerm, '__________');
        if (!sentenceWithBlank.includes('__________')) {
          sentenceWithBlank = `In modern contexts, __________ is widely acknowledged as a significant factor.`;
        }
      }

      const candidateDistractors = distractorPool
        .filter((dw) => dw.term.toLowerCase() !== w.term.toLowerCase())
        .map((dw) => dw.term);

      const fallbackDistractors = FALLBACK_ACADEMIC_DISTRACTORS.filter(
        (f) => f.toLowerCase() !== w.term.toLowerCase()
      );

      const merged = Array.from(new Set([...candidateDistractors, ...fallbackDistractors])).sort(
        () => 0.5 - Math.random()
      );
      const distractors = merged.slice(0, 3);

      const options = Array.from(new Set([w.term, ...distractors]))
        .slice(0, 4)
        .sort(() => 0.5 - Math.random());

      return {
        id: `cloze-${idx}-${Date.now()}-${Math.random()}`,
        sentenceWithBlank,
        correctWord: w.term,
        options,
        meaningVi: w.meaning,
        targetWord: w,
        patternItem: pItem,
      };
    });

    setClozeItems(items);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setCompleted(false);
  };

  useEffect(() => {
    generateClozeList(patternMode);
  }, [activeSet.id, patternMode, words.length]);

  const currentItem = clozeItems[currentIndex];

  // Keyboard navigation: 1-4 for options, Enter/Space for next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed) return;

      if (!isAnswered && currentItem) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const optIdx = parseInt(e.key, 10) - 1;
          if (currentItem.options[optIdx]) {
            handleSelectOption(currentItem.options[optIdx]);
          }
        }
      } else if (isAnswered) {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, currentItem, completed, currentIndex, clozeItems.length]);

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentItem) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect =
      option.trim().toLowerCase() === currentItem.correctWord.trim().toLowerCase();

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      onRateWord(currentItem.targetWord, 'good');
    } else {
      onRateWord(currentItem.targetWord, 'again');
    }
  };

  const handleNext = () => {
    if (currentIndex < clozeItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setCompleted(true);
      if (onCompleteSession) {
        onCompleteSession(correctCount, clozeItems.length);
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    generateClozeList(patternMode);
  };

  if (!words.length || !clozeItems.length || !currentItem) {
    return (
      <div className="bg-[#16191D] rounded-3xl p-12 text-center border border-[#2D3135] space-y-4 max-w-lg mx-auto shadow-2xl">
        <h3 className="text-lg font-bold text-white">Chưa có từ vựng trong bộ này</h3>
        <p className="text-xs text-[#8B949E]">Hãy tải lên PDF hoặc thêm từ vựng để bắt đầu điền từ ngữ cảnh.</p>
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
    const accuracy = Math.round((correctCount / (clozeItems.length || 1)) * 100);
    return (
      <div className="max-w-xl mx-auto bg-[#16191D] rounded-3xl p-8 border border-[#2D3135] shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">Hoàn Thành Điền Từ Ngữ Cảnh!</h2>
          <p className="text-sm text-[#8B949E] mt-1.5 leading-relaxed">
            Bạn đã điền chính xác {correctCount} / {clozeItems.length} câu ngữ cảnh học thuật trích xuất từ bài đọc.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#21262D] border border-[#30363D]">
          <div>
            <div className="text-2xl font-extrabold text-indigo-400">{correctCount}</div>
            <div className="text-xs text-[#8B949E] font-medium mt-0.5">Số câu điền đúng</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400">{accuracy}%</div>
            <div className="text-xs text-[#8B949E] font-medium mt-0.5">Độ chính xác ngữ cảnh</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Làm lại phiên này
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

  const progressPercent = Math.round(((currentIndex + 1) / clozeItems.length) * 100);

  return (
    <div className="max-w-[1680px] mx-auto space-y-5 animate-fadeIn px-2 sm:px-4">
      {/* Pattern Selector Header */}
      <StudyPatternSelector
        currentMode={patternMode}
        onChangeMode={(m) => setPatternMode(m)}
        stats={patternResult?.stats}
        currentTier={currentItem.patternItem.tier}
        appearanceReason={currentItem.patternItem.appearanceReason}
      />

      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16191F] p-4 rounded-2xl border border-[#2D333B] shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30">
            Câu {currentIndex + 1} / {clozeItems.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#121418] rounded-full overflow-hidden border border-[#262A30] p-0.5">
        <div
          className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3-Column Panoramic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (3 Cols): Question List & Tier Tracker */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Danh Sách Câu Điền Từ
              </span>
              <span className="text-xs font-mono font-bold text-white bg-[#21262E] px-2.5 py-0.5 rounded-lg">
                {clozeItems.length} câu
              </span>
            </div>

            {/* Current Item Tier Info */}
            <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E97A4]">Nhóm mục tiêu:</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${currentItem.patternItem.tierBadge.bg} ${currentItem.patternItem.tierBadge.border} ${currentItem.patternItem.tierBadge.text}`}
                >
                  <span>{currentItem.patternItem.tierBadge.icon}</span>
                  <span>{currentItem.patternItem.tierLabel}</span>
                </span>
              </div>
              <p className="text-[11px] text-[#9BA1A6] italic leading-relaxed">
                {currentItem.patternItem.appearanceReason}
              </p>
            </div>

            {/* Question Quick Jump List */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {clozeItems.map((item, idx) => {
                const isCurrent = idx === currentIndex;
                const isPast = idx < currentIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                      isCurrent
                        ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold'
                        : isPast
                        ? 'bg-[#1C2027]/50 text-[#8E97A4] border border-transparent'
                        : 'bg-[#1C2027] text-[#9BA1A6] border border-[#262A30]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] w-4 text-[#8E97A4]">{idx + 1}.</span>
                      <span className="truncate">
                        {isPast ? item.correctWord : isCurrent ? '▶ Đang làm' : 'IELTS Cambridge Cloze'}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-75 shrink-0 ml-2">
                      {isPast ? '✓ Hoàn tất' : isCurrent ? 'Hiện tại' : `Câu ${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-[#16191F] border border-[#2D333B] text-center shadow-xl">
            <div>
              <div className="text-xl font-black text-emerald-400">{correctCount}</div>
              <div className="text-[11px] text-[#8E97A4] font-medium mt-0.5">Đúng ngữ cảnh</div>
            </div>
            <div>
              <div className="text-xl font-black text-rose-400">
                {currentIndex > 0 ? `${Math.round((correctCount / currentIndex) * 100)}%` : '100%'}
              </div>
              <div className="text-[11px] text-[#8E97A4] font-medium mt-0.5">Tỷ lệ chính xác</div>
            </div>
          </div>
        </div>

        {/* Center Column (6 Cols): Main Cloze Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-6 sm:p-9 border border-[#2D333B] shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500" />

            {/* Header Badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full border flex items-center gap-1.5 ${currentItem.patternItem.tierBadge.bg} ${currentItem.patternItem.tierBadge.border} ${currentItem.patternItem.tierBadge.text}`}
                >
                  <span>{currentItem.patternItem.tierBadge.icon}</span>
                  <span>{currentItem.patternItem.tierLabel}</span>
                </span>

                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/25">
                  IELTS Academic Reading Cloze
                </span>
              </div>

              {isAnswered && (
                <button
                  onClick={() => speakWord(currentItem.correctWord)}
                  className="p-2.5 rounded-xl bg-[#21262E] text-rose-300 hover:text-white hover:bg-rose-600 transition-colors border border-[#30363D] cursor-pointer"
                  title="Phát âm từ đúng"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Cloze Sentence Display with rich typography */}
            <div className="space-y-4">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#1C2027] border border-[#2D333B] shadow-inner relative">
                <p className="text-xl sm:text-2xl font-serif italic text-white leading-relaxed">
                  "{currentItem.sentenceWithBlank}"
                </p>
              </div>

              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] text-sm text-slate-300">
                <BookOpen className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Nghĩa tiếng Việt gợi ý: <strong className="text-rose-300 font-bold text-base">{currentItem.meaningVi}</strong></span>
              </div>
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentItem.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect =
                  opt.trim().toLowerCase() === currentItem.correctWord.trim().toLowerCase();

                let buttonStyle =
                  'bg-[#1C2027] border-[#2D333B] text-[#E0E2E4] hover:border-rose-500/60 hover:bg-[#21262E] active:scale-[0.99]';

                if (isAnswered) {
                  if (isCorrect) {
                    buttonStyle =
                      'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-950/30 ring-2 ring-emerald-500/50';
                  } else if (isSelected && !isCorrect) {
                    buttonStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/50';
                  } else {
                    buttonStyle = 'bg-[#1C2027]/40 border-[#2D333B]/40 text-[#8E97A4] opacity-50 cursor-not-allowed';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4.5 rounded-2xl border text-left text-sm sm:text-base transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${buttonStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-[#121418] border border-[#2D333B] text-xs font-bold text-[#8E97A4] flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-semibold leading-snug">{opt}</span>
                    </div>

                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback & Next Button */}
            {isAnswered && (
              <div className="pt-5 border-t border-[#2D333B] space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {selectedOption?.trim().toLowerCase() === currentItem.correctWord.trim().toLowerCase() ? (
                      <div className="text-sm text-emerald-400 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Chính xác! Từ vựng khớp ngữ cảnh hoàn hảo.
                      </div>
                    ) : (
                      <div className="text-sm text-rose-400 font-bold flex items-center gap-2">
                        <XCircle className="w-5 h-5" /> Chưa đúng! Từ phù hợp là: "
                        <span className="text-white underline decoration-rose-400">{currentItem.correctWord}</span>"
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    className="flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white transition-all shadow-lg shadow-rose-600/30 cursor-pointer self-end sm:self-auto"
                  >
                    <span>{currentIndex < clozeItems.length - 1 ? 'Câu tiếp theo [Nhấn Enter]' : 'Xem tổng kết'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (3 Cols): Context Notes & Collocations */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
              <Sparkles className="w-4 h-4 text-rose-400" /> Ngữ Pháp & Collocations
            </h4>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-[#8E97A4] block">Từ khóa đáp án:</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">
                  {currentItem.correctWord}
                </span>
              </div>

              {currentItem.targetWord.ipa && (
                <div>
                  <span className="text-[11px] text-[#8E97A4] block">Phiên âm chuẩn:</span>
                  <span className="text-xs font-mono font-bold text-rose-300 mt-0.5 block">
                    {currentItem.targetWord.ipa}
                  </span>
                </div>
              )}

              {currentItem.targetWord.collocations && currentItem.targetWord.collocations.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#2D333B]">
                  <span className="text-[11px] font-bold text-indigo-300 block">Collocations liên quan:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentItem.targetWord.collocations.slice(0, 4).map((col, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/25"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
