import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Timer,
  Zap,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  AlertTriangle,
  BrainCircuit,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabItem, WordSet } from '../../types';
import { speakWord } from '../../utils/speech';
import { SrsRating } from '../../utils/srs';
import { AccentSwitcher } from '../index';

interface TimedDrillModeProps {
  words: VocabItem[];
  allWords?: VocabItem[];
  activeSet: WordSet;
  onBack: () => void;
  onRateWord: (word: VocabItem, rating: SrsRating, responseTimeMs?: number) => void;
  onCompleteDrill?: (correct: number, total: number, avgTimeMs: number) => void;
}

interface DrillQuestion {
  id: string;
  targetWord: VocabItem;
  prompt: string;
  subPrompt?: string;
  options: string[];
  correctAnswer: string;
}

const SECONDS_PER_QUESTION = 7; // Fast-paced 7-second reflex challenge

export const TimedDrillMode: React.FC<TimedDrillModeProps> = ({
  words,
  allWords = words,
  activeSet,
  onBack,
  onRateWord,
  onCompleteDrill,
}) => {
  const [drillQuestions, setDrillQuestions] = useState<DrillQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Drill questions (10 - 20 rapid questions)
  const initDrill = () => {
    if (!words || words.length === 0) return;

    // Pick words prioritized by struggling or due
    const pool = [...words].sort((a, b) => {
      const aDue = a.nextReviewDate <= Date.now() ? 1 : 0;
      const bDue = b.nextReviewDate <= Date.now() ? 1 : 0;
      return bDue - aDue || (b.incorrectCount || 0) - (a.incorrectCount || 0);
    });

    const chosenWords = pool.slice(0, Math.min(15, pool.length));
    const distractorPool = allWords.length > 5 ? allWords : words;

    const generated: DrillQuestion[] = chosenWords.map((target, idx) => {
      const isViToEn = idx % 2 === 0;
      const prompt = isViToEn
        ? target.meaning
        : target.term;
      const correctAnswer = isViToEn ? target.term : target.meaning;

      const distractors = distractorPool
        .filter((w) => w.id !== target.id)
        .map((w) => (isViToEn ? w.term : w.meaning))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = Array.from(new Set([correctAnswer, ...distractors]))
        .slice(0, 4)
        .sort(() => 0.5 - Math.random());

      return {
        id: `drill-${idx}-${Date.now()}`,
        targetWord: target,
        prompt: isViToEn ? `Từ tiếng Anh của: "${prompt}"` : `Nghĩa tiếng Việt của: "${prompt}"`,
        subPrompt: isViToEn ? undefined : target.ipa,
        options,
        correctAnswer,
      };
    });

    setDrillQuestions(generated);
    setCurrentIndex(0);
    setTimeLeft(SECONDS_PER_QUESTION);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsTimeout(false);
    setCorrectCount(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setResponseTimes([]);
    setIsFinished(false);
    setQuestionStartTime(Date.now());
  };

  useEffect(() => {
    initDrill();
  }, [activeSet.id, words.length]);

  const currentQ = drillQuestions[currentIndex];

  // Timer Tick (100ms smooth decrement)
  useEffect(() => {
    if (isAnswered || isFinished || !currentQ) return;

    setQuestionStartTime(Date.now());
    setTimeLeft(SECONDS_PER_QUESTION);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [currentIndex, isAnswered, isFinished, drillQuestions.length]);

  // Pronounce word on load if EN prompt
  useEffect(() => {
    if (currentQ?.targetWord && !isAnswered && !isFinished) {
      speakWord(currentQ.targetWord.term);
    }
  }, [currentIndex, currentQ, isFinished]);

  // Keyboard Shortcuts (1, 2, 3, 4 for options, Space/Enter for next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;

      if (!isAnswered && currentQ) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const optIdx = parseInt(e.key, 10) - 1;
          if (currentQ.options[optIdx]) {
            handleAnswer(currentQ.options[optIdx]);
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
  }, [isAnswered, currentQ, isFinished, currentIndex, drillQuestions.length]);

  const handleTimeOut = () => {
    if (isAnswered || !currentQ) return;
    setIsAnswered(true);
    setIsTimeout(true);
    setCurrentStreak(0);
    onRateWord(currentQ.targetWord, 'again', SECONDS_PER_QUESTION * 1000);
    setResponseTimes((prev) => [...prev, SECONDS_PER_QUESTION * 1000]);
  };

  const handleAnswer = (option: string) => {
    if (isAnswered || !currentQ) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedMs = Math.max(200, Date.now() - questionStartTime);
    setResponseTimes((prev) => [...prev, elapsedMs]);
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setCorrectCount((prev) => prev + 1);

      // Evaluate FSRS rating based on response speed
      let rating: SrsRating = 'good';
      if (elapsedMs < 2000) rating = 'easy';
      else if (elapsedMs > 5000) rating = 'hard';

      onRateWord(currentQ.targetWord, rating, elapsedMs);
    } else {
      setCurrentStreak(0);
      onRateWord(currentQ.targetWord, 'again', elapsedMs);
    }
  };

  const handleNext = () => {
    if (currentIndex < drillQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsTimeout(false);
    } else {
      setIsFinished(true);
      const totalTime = responseTimes.reduce((a, b) => a + b, 0);
      const avgTime = responseTimes.length > 0 ? Math.round(totalTime / responseTimes.length) : 0;
      if (onCompleteDrill) {
        onCompleteDrill(correctCount, drillQuestions.length, avgTime);
      }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  if (!words.length || !drillQuestions.length || !currentQ) {
    return (
      <div className="bg-[#16191D] rounded-3xl p-12 text-center border border-[#2D3135] space-y-4 max-w-lg mx-auto shadow-2xl">
        <h3 className="text-lg font-bold text-white">Chưa có từ vựng để bắt đầu Timed Drill</h3>
        <p className="text-xs text-[#8B949E]">Hãy nạp từ vựng hoặc chọn bộ từ khác để bắt đầu.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  // Summary screen
  if (isFinished) {
    const accuracy = Math.round((correctCount / drillQuestions.length) * 100);
    const avgResponseSec = (
      responseTimes.reduce((a, b) => a + b, 0) / (responseTimes.length || 1) / 1000
    ).toFixed(1);

    return (
      <div className="max-w-xl mx-auto bg-[#16191D] rounded-3xl p-8 border border-[#2D3135] shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <Zap className="w-10 h-10 fill-amber-400" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Hoàn Thành Thử Thách Phản Xạ!</h2>
          <p className="text-xs text-[#8B949E] mt-1">
            Chế độ Timed Drill giúp tối ưu hóa tốc độ truy xuất từ vựng trong phòng thi IELTS.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#21262D] border border-[#30363D]">
          <div>
            <div className="text-2xl font-black text-emerald-400">{accuracy}%</div>
            <div className="text-[10px] text-[#8B949E] uppercase font-bold">Chính xác</div>
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-400">{avgResponseSec}s</div>
            <div className="text-[10px] text-[#8B949E] uppercase font-bold">Tốc độ TB</div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400">{maxStreak} Combo</div>
            <div className="text-[10px] text-[#8B949E] uppercase font-bold">Chuỗi đúng</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={initDrill}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Luyện lại phản xạ
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

  const timePercent = (timeLeft / SECONDS_PER_QUESTION) * 100;
  const isUrgent = timeLeft <= 2.5;

  return (
    <div className="max-w-[1440px] w-full mx-auto space-y-5 animate-fadeIn px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16191F] p-4 rounded-2xl border border-[#2D333B] shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8B949E] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Thoát Focus Drill
        </button>

        <div className="flex items-center gap-3">
          <AccentSwitcher currentWord={currentQ.targetWord.term} compact={true} />

          {currentStreak >= 2 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{currentStreak} Combo!</span>
            </div>
          )}

          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            {currentIndex + 1} / {drillQuestions.length} câu
          </span>
        </div>
      </div>

      {/* Countdown Timer Bar */}
      <div className="space-y-1 bg-[#16191F] p-3 rounded-2xl border border-[#2D333B]">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[#8B949E] flex items-center gap-1 font-semibold">
            <Timer className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
            Áp lực thời gian phản xạ (7 giây / câu)
          </span>
          <span
            className={`font-mono font-bold text-sm ${
              isUrgent ? 'text-rose-400 animate-pulse' : 'text-amber-400'
            }`}
          >
            {timeLeft.toFixed(1)}s
          </span>
        </div>
        <div className="w-full h-3 bg-[#121418] rounded-full overflow-hidden border border-[#262A30] p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              isUrgent
                ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                : 'bg-gradient-to-r from-amber-400 to-indigo-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </div>

      {/* Widescreen 2-Column Reflex Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Drill Card (lg: 8 cols) */}
        <div className="lg:col-span-8 bg-[#16191D] rounded-3xl p-6 sm:p-8 border border-[#2D3135] shadow-2xl space-y-6 relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 w-1.5 h-full ${
              isUrgent ? 'bg-rose-500' : 'bg-amber-400'
            }`}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                ⚡ Rapid Spaced Timed Drill
              </span>
              <button
                onClick={() => speakWord(currentQ.targetWord.term)}
                className="p-1.5 rounded-lg bg-[#21262D] text-indigo-400 hover:text-white border border-[#30363D] cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {currentQ.prompt}
            </h2>
            {currentQ.subPrompt && (
              <p className="text-xs text-indigo-400 font-mono">{currentQ.subPrompt}</p>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrect =
                opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

              let btnStyle =
                'bg-[#21262D] border-[#30363D] text-[#E0E2E4] hover:border-amber-500/60 hover:bg-[#282D33] active:scale-[0.98]';

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle =
                    'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500';
                } else {
                  btnStyle = 'bg-[#21262D]/40 border-[#30363D]/40 text-[#8B949E] opacity-50 cursor-not-allowed';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(opt)}
                  className={`p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#16191D] border border-[#30363D] text-[11px] font-bold text-[#8B949E] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold">{opt}</span>
                  </div>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Timeout / Feedback Indicator */}
          {isAnswered && (
            <div className="pt-4 border-t border-[#2D3135] flex items-center justify-between gap-3 animate-fadeIn flex-wrap">
              <div>
                {isTimeout ? (
                  <div className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Hết giờ phản xạ! Đáp án đúng: "
                    <span className="text-white underline">{currentQ.correctAnswer}</span>"
                  </div>
                ) : selectedOption?.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() ? (
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Phản xạ thần tốc! FSRS Stability tăng mạnh.
                  </div>
                ) : (
                  <div className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Sai đáp án! Đáp án đúng: "
                    <span className="text-white underline">{currentQ.correctAnswer}</span>"
                  </div>
                )}
              </div>

              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                {currentIndex < drillQuestions.length - 1 ? 'Tiếp theo [Enter]' : 'Xem điểm số'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Stats & Reflex Scoreboard (lg: 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Bảng Phản Xạ Trực Tiếp
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B]">
                <div className="text-xs text-[#8E97A4]">Chính xác</div>
                <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                  {correctCount} / {currentIndex + (isAnswered ? 1 : 0)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B]">
                <div className="text-xs text-[#8E97A4]">Chuỗi Streak</div>
                <div className="text-xl font-extrabold text-amber-400 mt-0.5 flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  {currentStreak}
                </div>
              </div>
            </div>

            {/* FSRS Reflex Algorithm Note */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed space-y-1">
              <span className="font-bold text-indigo-300 flex items-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5" /> FSRS Speed Calibration
              </span>
              <p className="text-[11px] text-[#8E97A4]">
                Trả lời dưới 2.0s được xếp hạng <strong>Easy</strong>, từ 2-5s là <strong>Good</strong>, trên 5s là <strong>Hard</strong>.
              </p>
            </div>

            {/* Quick Keyboard shortcuts */}
            <div className="p-3 rounded-2xl bg-[#121418] border border-[#262A30] text-[11px] text-[#8E97A4] space-y-1.5">
              <div className="font-semibold text-slate-300">Phím tắt thao tác nhanh:</div>
              <div className="flex items-center justify-between">
                <span>Chọn đáp án:</span>
                <span className="font-mono text-white bg-[#21262D] px-1.5 py-0.5 rounded border border-[#30363D]">
                  Phím 1, 2, 3, 4
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Câu tiếp theo:</span>
                <span className="font-mono text-white bg-[#21262D] px-1.5 py-0.5 rounded border border-[#30363D]">
                  Enter / Space
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
