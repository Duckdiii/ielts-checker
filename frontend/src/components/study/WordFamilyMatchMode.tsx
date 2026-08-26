import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Award,
  Sparkles,
  Timer,
  CheckCircle2,
  HelpCircle,
  Zap,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabItem, WordSet } from '../../types';
import {
  buildSmartStudyQueue,
  PatternMode,
  PatternQueueResult,
} from '../../utils/studyPattern';
import { StudyPatternSelector } from './StudyPatternSelector';

interface WordFamilyMatchModeProps {
  words: VocabItem[];
  activeSet: WordSet;
  onBack: () => void;
  onCompleteSession?: (correct: number, total: number) => void;
}

interface MatchCard {
  id: string;
  text: string;
  type: 'word' | 'meaning' | 'synonym' | 'family';
  matchKey: string; // Pairs share the exact same matchKey
  isMatched: boolean;
}

export const WordFamilyMatchMode: React.FC<WordFamilyMatchModeProps> = ({
  words,
  activeSet,
  onBack,
  onCompleteSession,
}) => {
  const [patternMode, setPatternMode] = useState<PatternMode>('smart-interleaved');
  const [patternResult, setPatternResult] = useState<PatternQueueResult | null>(null);
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null);
  const [mismatchIds, setMismatchIds] = useState<string[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(6);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Game using smart pedagogical queue
  const startNewGame = useCallback(() => {
    if (!words || words.length === 0) {
      setCards([]);
      setPatternResult(null);
      return;
    }

    const numPairs = Math.min(6, Math.max(2, words.length));
    const pResult = buildSmartStudyQueue(words, {
      mode: patternMode,
      limit: numPairs,
    });
    setPatternResult(pResult);

    const selectedWords = pResult.queue.map((item) => item.word);
    setTotalPairs(selectedWords.length);

    const generatedCards: MatchCard[] = [];

    selectedWords.forEach((w, idx) => {
      const matchKey = `match-${idx}-${w.term}`;

      // Left Card: Target term
      generatedCards.push({
        id: `card-term-${idx}`,
        text: w.term,
        type: 'word',
        matchKey,
        isMatched: false,
      });

      // Right Card: Prefer Synonyms, Word Family, or Meaning
      let rightText = w.meaning;
      let cardType: MatchCard['type'] = 'meaning';

      if (w.synonyms && w.synonyms.trim().length > 1) {
        const firstSyn = w.synonyms.split(',')[0].trim();
        rightText = `Đồng nghĩa: ${firstSyn}`;
        cardType = 'synonym';
      } else if (w.wordFamily && w.wordFamily.trim().length > 1) {
        const firstFamily = w.wordFamily.split(';')[0].trim();
        rightText = `Họ từ: ${firstFamily}`;
        cardType = 'family';
      } else {
        rightText = `Định nghĩa: ${w.meaning}`;
        cardType = 'meaning';
      }

      generatedCards.push({
        id: `card-right-${idx}`,
        text: rightText,
        type: cardType,
        matchKey,
        isMatched: false,
      });
    });

    // Shuffle cards on the board
    setCards(generatedCards.sort(() => 0.5 - Math.random()));
    setSelectedCard(null);
    setMismatchIds([]);
    setMatchedPairsCount(0);
    setMistakesCount(0);
    setGameWon(false);
    setSeconds(0);
    setTimerActive(true);
    setIsProcessing(false);
  }, [words, patternMode]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && !gameWon) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameWon]);

  const handleCardClick = (card: MatchCard) => {
    if (card.isMatched || isProcessing || mismatchIds.length > 0) return;

    // Clicked already selected card -> unselect
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      return;
    }

    // First card selected
    if (!selectedCard) {
      setSelectedCard(card);
      return;
    }

    // Second card selected -> Check match
    if (selectedCard.matchKey === card.matchKey) {
      // MATCHED SUCCESS!
      const newCards = cards.map((c) =>
        c.matchKey === card.matchKey ? { ...c, isMatched: true } : c
      );
      setCards(newCards);
      setSelectedCard(null);
      const newMatchedCount = matchedPairsCount + 1;
      setMatchedPairsCount(newMatchedCount);

      if (newMatchedCount === totalPairs) {
        setGameWon(true);
        setTimerActive(false);
        if (onCompleteSession) {
          onCompleteSession(totalPairs, totalPairs);
        }
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } else {
      // MISMATCH FAILURE -> show shake/error state for 600ms
      setIsProcessing(true);
      setMistakesCount((prev) => prev + 1);
      setMismatchIds([selectedCard.id, card.id]);

      setTimeout(() => {
        setMismatchIds([]);
        setSelectedCard(null);
        setIsProcessing(false);
      }, 600);
    }
  };

  // Helper Hint: Reveals one unmatched pair temporarily
  const handleRevealHint = () => {
    if (isProcessing) return;
    const unmatched = cards.filter((c) => !c.isMatched);
    if (unmatched.length === 0) return;

    const first = unmatched[0];
    const match = unmatched.find((c) => c.matchKey === first.matchKey && c.id !== first.id);
    if (match) {
      setSelectedCard(first);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!words.length || cards.length === 0) {
    return (
      <div className="bg-[#16191D] rounded-3xl p-12 text-center border border-[#2D3135] space-y-4 max-w-lg mx-auto shadow-2xl">
        <h3 className="text-lg font-bold text-white">Chưa có từ vựng trong bộ này</h3>
        <p className="text-xs text-[#8B949E]">Hãy tải lên PDF hoặc thêm từ vựng để bắt đầu trò chơi ghép thẻ.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1680px] mx-auto space-y-5 animate-fadeIn px-2 sm:px-4">
      {/* Pattern Selector Header */}
      <StudyPatternSelector
        currentMode={patternMode}
        onChangeMode={(m) => setPatternMode(m)}
        stats={patternResult?.stats}
      />

      {/* Top Header & Game Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16191F] p-4 rounded-2xl border border-[#2D333B] shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1C2027] border border-[#2D333B] text-xs font-mono font-bold text-indigo-400 shadow-inner">
            <Timer className="w-4 h-4 text-amber-400" />
            <span>{formatTime(seconds)}</span>
          </div>

          <div className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Ghép đúng: {matchedPairsCount} / {totalPairs} cặp
          </div>

          <button
            onClick={handleRevealHint}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            title="Gợi ý 1 cặp"
          >
            <Lightbulb className="w-4 h-4" /> Gợi ý
          </button>
        </div>
      </div>

      {/* Game Complete Modal Banner */}
      {gameWon && (
        <div className="bg-[#16191F] rounded-3xl p-8 sm:p-12 border border-emerald-500/40 shadow-2xl text-center space-y-6 animate-fadeIn max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Xuất Sắc! Ghép Hoàn Tất {totalPairs} Cặp Thẻ!</h2>
            <p className="text-sm text-[#9BA1A6] mt-2">
              Thời gian hoàn thành: <strong className="text-emerald-400">{formatTime(seconds)}</strong> • Số lần thử nhầm: <span className="text-rose-400">{mistakesCount}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={startNewGame}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-[#21262E] hover:bg-[#2D333B] text-[#E0E2E4] border border-[#30363D] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Chơi ván mới
            </button>
            <button
              onClick={onBack}
              className="px-7 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Panoramic Workspace */}
      {!gameWon && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (3 Cols): Instructions & Scoreboard */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                <Zap className="w-4 h-4" /> Luật Chơi Ghép Thẻ
              </h4>
              <p className="text-xs text-[#9BA1A6] leading-relaxed">
                Nhấp chọn 1 thẻ thuật ngữ tiếng Anh, sau đó tìm thẻ ghép tương ứng (Nghĩa tiếng Việt, Từ đồng nghĩa hoặc Họ từ học thuật).
              </p>

              <div className="space-y-2 pt-2 border-t border-[#2D333B]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E97A4]">Cặp đã ghép:</span>
                  <span className="font-bold text-emerald-400">{matchedPairsCount} / {totalPairs}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E97A4]">Số lần ghép sai:</span>
                  <span className="font-bold text-rose-400">{mistakesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E97A4]">Thời gian chạy:</span>
                  <span className="font-mono font-bold text-amber-400">{formatTime(seconds)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column (9 Cols): Interactive Cards Grid */}
          <div className="lg:col-span-9 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {cards.map((card) => {
                const isSelected = selectedCard?.id === card.id;
                const isMismatched = mismatchIds.includes(card.id);

                let cardStyle =
                  'bg-[#16191F] border-[#2D333B] text-[#E0E2E4] hover:border-amber-500/60 hover:bg-[#1C2027] cursor-pointer shadow-lg hover:shadow-xl';

                if (card.isMatched) {
                  cardStyle =
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 opacity-40 pointer-events-none scale-95';
                } else if (isSelected) {
                  cardStyle =
                    'bg-gradient-to-tr from-amber-600 to-orange-500 text-white border-amber-300 ring-2 ring-amber-400 scale-105 shadow-xl shadow-amber-900/40';
                } else if (isMismatched) {
                  cardStyle =
                    'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500 animate-pulse';
                }

                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className={`min-h-[130px] p-4.5 rounded-2xl border flex flex-col justify-between transition-all duration-200 select-none ${cardStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          card.type === 'word'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : card.type === 'synonym'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : card.type === 'family'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {card.type === 'word'
                          ? 'Thuật ngữ'
                          : card.type === 'synonym'
                          ? 'Đồng nghĩa'
                          : card.type === 'family'
                          ? 'Họ từ'
                          : 'Định nghĩa'}
                      </span>

                      {card.isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>

                    <div className="my-auto py-2 text-center">
                      <span
                        className={`font-bold leading-tight block ${
                          card.type === 'word' ? 'text-base sm:text-lg text-white' : 'text-xs sm:text-sm text-[#E0E2E4]'
                        }`}
                      >
                        {card.text}
                      </span>
                    </div>

                    <div className="text-[10px] text-right text-[#8E97A4] font-medium">
                      {card.type === 'word' ? 'English Term' : 'Meaning / Match'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
