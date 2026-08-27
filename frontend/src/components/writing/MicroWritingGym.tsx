import React, { useState, useEffect } from 'react';
import {
  Clock,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { MicroWritingDrillResult } from '../../types';
import { evaluateMicroWriting } from '../../services/apiService';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration } from '../../utils/confetti';

interface MicroWritingGymProps {
  onBack: () => void;
}

export function MicroWritingGym({ onBack }: MicroWritingGymProps) {
  const [selectedDrill, setSelectedDrill] = useState<'intro_2min' | 'body_peel_5min' | 'task1_overview_3min'>('intro_2min');
  const [promptText, setPromptText] = useState(
    'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?'
  );
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<MicroWritingDrillResult | null>(null);

  // Set drill parameters
  useEffect(() => {
    if (selectedDrill === 'intro_2min') {
      setTimeLeft(120);
      setPromptText('Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?');
    } else if (selectedDrill === 'body_peel_5min') {
      setTimeLeft(300);
      setPromptText('Why does living in big cities cause significant psychological stress for young professionals? Write 1 PEEL body paragraph (Point, Explanation, Example, Link).');
    } else {
      setTimeLeft(180);
      setPromptText('The chart below shows the consumption of 3 types of meat (beef, chicken, fish) in a European country from 1980 to 2020. Write a concise Overview paragraph (no specific data figures).');
    }
    setInputText('');
    setEvalResult(null);
    setIsTimerRunning(false);
  }, [selectedDrill]);

  // Countdown timer
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      sounds.playComplete();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    sounds.playClick();
  };

  const handleEvaluate = async () => {
    if (!inputText.trim()) return;
    setIsEvaluating(true);
    try {
      sounds.playClick();
      const result = await evaluateMicroWriting({
        drillType: selectedDrill,
        promptQuestion: promptText,
        submissionText: inputText,
      });
      setEvalResult(result);
      if (result.score >= 7.0) {
        sounds.playComplete();
        fireCelebration();
      } else {
        sounds.playStreak();
      }
    } catch (err: any) {
      console.error('Error evaluating micro writing:', err);
      sounds.playWrong();
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Drill Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-rose-400" />
            <span>Micro-Writing Gym (Phòng Luyện Viết Từng Đoạn Cấp Tốc)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rèn luyện kỹ năng viết súc tích theo từng mục tiêu dưới áp lực thời gian thực
          </p>
        </div>

        {/* 3 Drill Type Buttons */}
        <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-2xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setSelectedDrill('intro_2min')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDrill === 'intro_2min'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ⏱️ Mở Bài (2 Phút)
          </button>

          <button
            onClick={() => setSelectedDrill('body_peel_5min')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDrill === 'body_peel_5min'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🧱 Thân Bài PEEL (5 Phút)
          </button>

          <button
            onClick={() => setSelectedDrill('task1_overview_3min')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDrill === 'task1_overview_3min'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            📊 Task 1 Overview (3 Phút)
          </button>
        </div>
      </div>

      {/* Main Drill Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Editor & Timer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Prompt card with Timer */}
          <div className="neo-glass-card p-5 border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                Thử Thách Luyện Viết
              </span>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-black border ${
                  timeLeft <= 30 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' : 'bg-white/5 text-amber-300 border-white/10'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                {!isTimerRunning && (
                  <button
                    onClick={handleStartTimer}
                    className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Bắt đầu tính giờ
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
              "{promptText}"
            </p>
          </div>

          {/* Text Area */}
          <div className="neo-glass-card p-4 border-white/10 space-y-3">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (!isTimerRunning && e.target.value.length === 1) {
                  setIsTimerRunning(true);
                }
              }}
              placeholder="Nhập đoạn văn của bạn tại đây..."
              rows={8}
              className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none leading-relaxed font-mono"
            />

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-xs text-slate-400 font-mono">
                Số từ: <strong className="text-white">{inputText.trim() ? inputText.trim().split(/\s+/).length : 0} từ</strong>
              </span>

              <button
                type="button"
                onClick={handleEvaluate}
                disabled={isEvaluating || !inputText.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/30 disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                {isEvaluating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                <span>{isEvaluating ? 'AI đang chấm đoạn văn...' : 'Chấm Điểm Cấp Tốc'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Instant Diagnostic & Criteria (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {evalResult ? (
            <div className="neo-glass-card p-5 sm:p-6 border-indigo-500/30 space-y-4 animate-in fade-in duration-300">
              {/* Score & Verdict */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Micro Band Score</span>
                  <div className="text-2xl font-black text-indigo-300">Band {evalResult.score.toFixed(1)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400">Độ dài đoạn</span>
                  <div className="text-xs font-bold text-slate-200">{evalResult.wordCount} từ</div>
                </div>
              </div>

              {/* Feedback Vi */}
              <p className="text-xs text-slate-200 font-medium leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/5">
                {evalResult.feedbackVi}
              </p>

              {/* Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Tiêu chí chuẩn Cambridge:
                </span>
                {evalResult.criteriaChecks.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                      item.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    {item.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                    <div>
                      <strong className="block">{item.criterion}</strong>
                      <span className="text-[11px] opacity-80">{item.commentVi}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upgraded Band 8.5 Version */}
              {evalResult.upgradedVersion && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-transparent border border-indigo-500/30 space-y-1.5">
                  <span className="text-[11px] font-black uppercase text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Đoạn văn mẫu Band 8.5+ viết lại:
                  </span>
                  <p className="text-xs text-white italic font-serif leading-relaxed">
                    "{evalResult.upgradedVersion}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="neo-glass-card p-6 border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Chế độ Luyện Viết Cấp Tốc</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Viết một đoạn văn hoàn chỉnh theo mục tiêu trong 2–5 phút để nhận ngay bảng chấm điểm và phân tích cải thiện tức thì từ AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
