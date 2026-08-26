import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Award,
  Flame,
  ArrowRight,
  Sparkles,
  HelpCircle,
  BookOpen,
  Maximize2,
  Minimize2,
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
import { sounds } from '../../utils/soundEffects';
import { fireCelebration, fireStreakBonus } from '../../utils/confetti';

interface QuizModeProps {
  words: VocabItem[];
  allWords?: VocabItem[];
  activeSet: WordSet;
  onBack: () => void;
  onRateWord: (word: VocabItem, rating: SrsRating) => void;
  onCompleteQuiz: (correct: number, total: number) => void;
}

interface QuizItem {
  id: string;
  type: 'vi-to-en' | 'en-to-vi' | 'synonym' | 'context';
  question: string;
  subPrompt?: string;
  options: string[];
  correctAnswer: string;
  targetWord: VocabItem;
  patternItem: PatternWordItem;
}

// Fallback academic vocabulary to guarantee 4 plausible distractors even with small sets
const FALLBACK_ACADEMIC_TERMS = [
  { term: 'mitigate', meaning: 'giảm nhẹ, làm dịu bớt tác động tiêu cực' },
  { term: 'exacerbate', meaning: 'làm trầm trọng thêm, làm xấu đi' },
  { term: 'ubiquitous', meaning: 'phổ biến khắp nơi, đâu đâu cũng thấy' },
  { term: 'prevalent', meaning: 'thịnh hành, lan rộng, phổ biến' },
  { term: 'substantiate', meaning: 'chứng minh, cung cấp bằng chứng xác thực' },
  { term: 'counteract', meaning: 'chống lại, vô hiệu hóa, triệt tiêu' },
  { term: 'diminish', meaning: 'làm suy giảm, thu nhỏ dần' },
  { term: 'paramount', meaning: 'tối quan trọng, có ý nghĩa tối cao' },
  { term: 'comprehensive', meaning: 'toàn diện, bao quát mọi khía cạnh' },
  { term: 'plausible', meaning: 'hợp lý, có cơ sở đáng tin cậy' },
  { term: 'imperative', meaning: 'cấp bách, bắt buộc phải thực hiện' },
  { term: 'detrimental', meaning: 'có hại, gây bất lợi nghiêm trọng' },
];

export const QuizMode: React.FC<QuizModeProps> = ({
  words,
  allWords = words,
  activeSet,
  onBack,
  onRateWord,
  onCompleteQuiz,
}) => {
  const [patternMode, setPatternMode] = useState<PatternMode>('smart-interleaved');
  const [patternResult, setPatternResult] = useState<PatternQueueResult | null>(null);
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isZenMode, setIsZenMode] = useState(false);

  // Generate dynamic quiz questions based on the smart pattern queue
  const buildQuestions = (pMode: PatternMode) => {
    if (!words || words.length === 0) {
      setQuestions([]);
      setPatternResult(null);
      return;
    }

    const pResult = buildSmartStudyQueue(words, {
      mode: pMode,
      limit: Math.min(15, words.length),
    });
    setPatternResult(pResult);

    const distractorPool = allWords && allWords.length > words.length ? allWords : words;

    const generated: QuizItem[] = pResult.queue.map((pItem, idx) => {
      const target = pItem.word;

      // Determine applicable question types
      const types: Array<'vi-to-en' | 'en-to-vi' | 'synonym' | 'context'> = [
        'vi-to-en',
        'en-to-vi',
      ];
      if (target.synonyms && target.synonyms.trim().length > 1) {
        types.push('synonym');
      }
      if (target.example && target.example.trim().length > 10) {
        types.push('context');
      }

      const chosenType = types[Math.floor(Math.random() * types.length)];

      let question = '';
      let subPrompt: string | undefined = undefined;
      let correctAnswer = '';
      let distractors: string[] = [];

      if (chosenType === 'vi-to-en') {
        question = `Chọn từ tiếng Anh phù hợp với định nghĩa: "${target.meaning}"`;
        correctAnswer = target.term;

        const candidateTerms = distractorPool
          .filter((w) => w.term.toLowerCase() !== target.term.toLowerCase())
          .map((w) => w.term);

        const fallbackTerms = FALLBACK_ACADEMIC_TERMS.filter(
          (f) => f.term.toLowerCase() !== target.term.toLowerCase()
        ).map((f) => f.term);

        const merged = Array.from(new Set([...candidateTerms, ...fallbackTerms])).sort(
          () => 0.5 - Math.random()
        );
        distractors = merged.slice(0, 3);
      } else if (chosenType === 'en-to-vi') {
        question = `Nghĩa tiếng Việt của từ học thuật "${target.term}" là gì?`;
        subPrompt = target.ipa ? `Phát âm chuẩn: ${target.ipa}` : undefined;
        correctAnswer = target.meaning;

        const candidateMeanings = distractorPool
          .filter((w) => w.term.toLowerCase() !== target.term.toLowerCase())
          .map((w) => w.meaning);

        const fallbackMeanings = FALLBACK_ACADEMIC_TERMS.filter(
          (f) => f.term.toLowerCase() !== target.term.toLowerCase()
        ).map((f) => f.meaning);

        const merged = Array.from(new Set([...candidateMeanings, ...fallbackMeanings])).sort(
          () => 0.5 - Math.random()
        );
        distractors = merged.slice(0, 3);
      } else if (chosenType === 'synonym') {
        question = `Từ nào sau đây là TỪ ĐỒNG NGHĨA (Synonym) của "${target.term}"?`;
        const synList = target.synonyms!.split(',').map((s) => s.trim()).filter(Boolean);
        correctAnswer = synList[0] || target.term;
        subPrompt = `Ngữ cảnh: "${target.meaning}"`;

        const candidateTerms = distractorPool
          .filter((w) => {
            const isSelf = w.term.toLowerCase() === target.term.toLowerCase();
            const isInSyns = synList.some((s) => s.toLowerCase() === w.term.toLowerCase());
            return !isSelf && !isInSyns;
          })
          .map((w) => w.term);

        const fallbackTerms = FALLBACK_ACADEMIC_TERMS.filter(
          (f) =>
            f.term.toLowerCase() !== target.term.toLowerCase() &&
            !synList.some((s) => s.toLowerCase() === f.term.toLowerCase())
        ).map((f) => f.term);

        const merged = Array.from(new Set([...candidateTerms, ...fallbackTerms])).sort(
          () => 0.5 - Math.random()
        );
        distractors = merged.slice(0, 3);
      } else {
        question = `Chọn từ thích hợp nhất để điền vào chỗ trống:`;
        const escaped = target.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(`\\b${escaped}\\w*\\b`, 'gi');
        let clozeSentence = target.example!.replace(reg, '__________');
        if (!clozeSentence.includes('__________')) {
          clozeSentence = target.example!.replace(target.term, '__________');
        }
        subPrompt = `"${clozeSentence}" (Gợi ý: ${target.meaning})`;
        correctAnswer = target.term;

        const candidateTerms = distractorPool
          .filter((w) => w.term.toLowerCase() !== target.term.toLowerCase())
          .map((w) => w.term);

        const fallbackTerms = FALLBACK_ACADEMIC_TERMS.filter(
          (f) => f.term.toLowerCase() !== target.term.toLowerCase()
        ).map((f) => f.term);

        const merged = Array.from(new Set([...candidateTerms, ...fallbackTerms])).sort(
          () => 0.5 - Math.random()
        );
        distractors = merged.slice(0, 3);
      }

      // Merge and shuffle options (always exactly 4 distinct options)
      const options = Array.from(new Set([correctAnswer, ...distractors]))
        .slice(0, 4)
        .sort(() => 0.5 - Math.random());

      return {
        id: `q-${idx}-${Date.now()}-${Math.random()}`,
        type: chosenType,
        question,
        subPrompt,
        options,
        correctAnswer,
        targetWord: target,
        patternItem: pItem,
      };
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectAnswersCount(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setQuizCompleted(false);
  };

  // Run when activeSet or patternMode changes
  useEffect(() => {
    buildQuestions(patternMode);
  }, [activeSet.id, patternMode, words.length]);

  const currentQ = questions[currentIndex];

  // Auto-speak when question loads
  useEffect(() => {
    setQuestionStartTime(Date.now());
    if (currentQ?.targetWord) {
      if (currentQ.type === 'en-to-vi' || currentQ.type === 'synonym') {
        speakWord(currentQ.targetWord.term);
      }
    }
  }, [currentIndex, currentQ]);

  // Keyboard navigation: 1-4 for options, Enter/Space for next, Z for Zen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizCompleted) return;

      if (e.key.toLowerCase() === 'z') {
        setIsZenMode((prev) => !prev);
      } else if (!isAnswered && currentQ) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const optIdx = parseInt(e.key, 10) - 1;
          if (currentQ.options[optIdx]) {
            handleSelectOption(currentQ.options[optIdx]);
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
  }, [isAnswered, currentQ, quizCompleted, currentIndex, questions.length]);

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentQ) return;

    const elapsedMs = Math.max(300, Date.now() - questionStartTime);
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setCorrectAnswersCount((prev) => prev + 1);

      if (newStreak >= 3 && newStreak % 3 === 0) {
        sounds.playStreak();
        fireStreakBonus();
      } else {
        sounds.playSuccess();
      }

      // FSRS calculation: fast = easy, regular = good, slow = hard
      let rating: SrsRating = 'good';
      if (elapsedMs < 2500) rating = 'easy';
      else if (elapsedMs > 6000) rating = 'hard';

      onRateWord(currentQ.targetWord, rating);
    } else {
      sounds.playWrong();
      setCurrentStreak(0);
      onRateWord(currentQ.targetWord, 'again');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizCompleted(true);
      onCompleteQuiz(correctAnswersCount, questions.length);
      sounds.playComplete();
      fireCelebration();
    }
  };

  const handleRestart = () => {
    buildQuestions(patternMode);
  };

  if (!words.length || !questions.length || !currentQ) {
    return (
      <div className="bg-[#16191D] rounded-3xl p-12 text-center border border-[#2D3135] space-y-4 max-w-lg mx-auto shadow-2xl">
        <h3 className="text-lg font-bold text-white">Chưa có từ vựng trong bộ này</h3>
        <p className="text-xs text-[#8B949E]">Hãy tải lên PDF hoặc thêm từ vựng để bắt đầu bài trắc nghiệm.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  // Completed Screen
  if (quizCompleted) {
    const accuracy = Math.round((correctAnswersCount / (questions.length || 1)) * 100);
    return (
      <div className="max-w-xl mx-auto bg-[#16191D] rounded-3xl p-8 border border-[#2D3135] shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">Hoàn Thành Bài Trắc Nghiệm!</h2>
          <p className="text-sm text-[#8B949E] mt-1.5 leading-relaxed">
            Bạn vừa hoàn thành xuất sắc chuỗi câu hỏi trắc nghiệm theo mô hình đan xen trí nhớ.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#21262D] border border-[#30363D]">
          <div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {correctAnswersCount} / {questions.length}
            </div>
            <div className="text-[11px] text-[#8B949E] font-medium mt-0.5">Số câu đúng</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-indigo-400">{accuracy}%</div>
            <div className="text-[11px] text-[#8B949E] font-medium mt-0.5">Độ chính xác</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-amber-400" />
              <span>{maxStreak}</span>
            </div>
            <div className="text-[11px] text-[#8B949E] font-medium mt-0.5">Chuỗi cao nhất</div>
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

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fadeIn">
      {/* Pattern Selector and Diagnostics Header */}
      <StudyPatternSelector
        currentMode={patternMode}
        onChangeMode={(m) => setPatternMode(m)}
        stats={patternResult?.stats}
        currentTier={currentQ.patternItem.tier}
        appearanceReason={currentQ.patternItem.appearanceReason}
      />

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#8B949E] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
        </button>

        <div className="flex items-center gap-2">
          <AccentSwitcher currentWord={currentQ.targetWord.term} compact={true} />

          <button
            onClick={() => {
              sounds.playClick();
              setIsZenMode((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isZenMode
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white hover:border-indigo-500/50'
            }`}
            title="Chế độ tập trung Zen Mode (Phím Z)"
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isZenMode ? 'Thoát Zen' : 'Zen Focus'}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/30 border border-white/10 hidden sm:inline">
              Z
            </span>
          </button>

          {currentStreak >= 2 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{currentStreak} Combo!</span>
            </div>
          )}

          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden border border-[#2D3135] p-0.5">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-[#16191D] rounded-3xl p-6 sm:p-8 border border-[#2D3135] shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

        {/* Question Header & Category */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full border flex items-center gap-1.5 ${currentQ.patternItem.tierBadge.bg} ${currentQ.patternItem.tierBadge.border} ${currentQ.patternItem.tierBadge.text}`}
              >
                <span>{currentQ.patternItem.tierBadge.icon}</span>
                <span>{currentQ.patternItem.tierLabel}</span>
              </span>

              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {currentQ.type === 'vi-to-en' && '🇻🇳 ➔ 🇬🇧 Định nghĩa sang Từ vựng'}
                {currentQ.type === 'en-to-vi' && '🇬🇧 ➔ 🇻🇳 Từ vựng sang Định nghĩa'}
                {currentQ.type === 'synonym' && '✨ Paraphrase & Từ Đồng Nghĩa IELTS'}
                {currentQ.type === 'context' && '📝 Điền từ vào Ngữ cảnh trích dẫn'}
              </span>
            </div>

            {currentQ.targetWord.term && (
              <button
                onClick={() => speakWord(currentQ.targetWord.term)}
                className="p-2.5 rounded-xl bg-[#21262D] text-indigo-300 hover:text-white hover:bg-indigo-600 transition-colors border border-[#30363D] cursor-pointer"
                title="Phát âm từ vựng"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug pt-1">
            {currentQ.question}
          </h2>

          {currentQ.subPrompt && (
            <div className="text-base text-slate-200 font-medium bg-[#21262D] p-4 rounded-2xl border border-[#30363D] leading-relaxed">
              {currentQ.subPrompt}
            </div>
          )}
        </div>

        {/* Options Grid (4 clear buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

            let buttonStyle =
              'bg-[#21262D] border-2 border-[#30363D] text-slate-100 hover:border-indigo-500/80 hover:bg-[#282D35] active:scale-[0.99]';

            if (isAnswered) {
              if (isCorrect) {
                buttonStyle =
                  'bg-emerald-500/25 border-2 border-emerald-400 text-emerald-100 font-bold shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                buttonStyle = 'bg-rose-500/25 border-2 border-rose-400 text-rose-100 ring-2 ring-rose-500';
              } else {
                buttonStyle = 'bg-[#21262D]/40 border-2 border-[#30363D]/40 text-slate-500 opacity-50 cursor-not-allowed';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 sm:p-5 rounded-2xl border text-left text-base sm:text-lg transition-all duration-200 flex items-center justify-between gap-3.5 cursor-pointer shadow-md ${buttonStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#16191D] border border-[#30363D] text-xs sm:text-sm font-black text-indigo-300 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold leading-snug">{opt}</span>
                </div>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback bar & Next button */}
        {isAnswered && (
          <div className="pt-4 border-t border-[#2D3135] space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {selectedOption?.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() ? (
                  <div className="text-sm sm:text-base text-emerald-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Chính xác! Trí nhớ được nâng cấp SRS.
                  </div>
                ) : (
                  <div className="text-sm sm:text-base text-rose-300 font-bold flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-400" /> Chưa đúng! Đáp án đúng: "
                    <span className="text-white underline">{currentQ.correctAnswer}</span>"
                  </div>
                )}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 cursor-pointer self-end sm:self-auto"
              >
                <span>{currentIndex < questions.length - 1 ? 'Câu tiếp theo [Enter]' : 'Xem tổng kết'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Context Expansion Box */}
            <div className="p-4 rounded-xl bg-[#21262D] border border-indigo-500/30 text-sm space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-extrabold text-white text-base sm:text-lg">{currentQ.targetWord.term}</span>
                {currentQ.targetWord.ipa && (
                  <span className="text-indigo-300 font-mono font-medium">{currentQ.targetWord.ipa}</span>
                )}
                <span className="text-slate-500">•</span>
                <span className="text-indigo-200 font-semibold text-sm sm:text-base">{currentQ.targetWord.meaning}</span>
              </div>
              {currentQ.targetWord.wordFamily && (
                <div className="text-[#9BA1A6] text-[11px]">
                  🌿 Họ từ: <span className="text-white">{currentQ.targetWord.wordFamily}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
