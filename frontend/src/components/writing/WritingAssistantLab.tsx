import React, { useState, useMemo, useRef } from 'react';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Flame,
  Award,
  Layers,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileText,
  HelpCircle,
  Brain,
  Zap,
  Clock,
  RotateCcw,
  BarChart2,
  FolderOpen,
} from 'lucide-react';
import {
  VocabItem,
  WordSet,
  UserProgress,
  IeltsWritingTaskType,
  WritingEvaluationResult,
  WritingPrompt,
  WritingPortfolioItem,
} from '../../types';
import { evaluateWritingEssay, generateWritingPrompt, analyzeWritingCohesion } from '../../services/apiService';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration } from '../../utils/confetti';
import { EssayOutlineArchitectModal } from './EssayOutlineArchitectModal';
import { InlineSentenceUpgradePopup } from './InlineSentenceUpgradePopup';
import { MicroWritingGym } from './MicroWritingGym';
import { Task1TrendLab } from './Task1TrendLab';
import { WritingPortfolioModal } from './WritingPortfolioModal';

interface WritingAssistantLabProps {
  words: VocabItem[];
  activeSet: WordSet;
  progress: UserProgress;
  onBack: () => void;
  currentUserId?: string;
}

export function WritingAssistantLab({
  words,
  activeSet,
  progress,
  onBack,
  currentUserId = 'guest',
}: WritingAssistantLabProps) {
  const PORTFOLIO_STORAGE_KEY = `ielts_writing_portfolio_v1_${currentUserId}`;

  // Main view space within writing lab: 'studio' | 'micro-gym' | 'task1-lab'
  const [activeSpace, setActiveSpace] = useState<'studio' | 'micro-gym' | 'task1-lab'>('studio');

  const [taskType, setTaskType] = useState<IeltsWritingTaskType>('task2_essay');
  const [promptTopic, setPromptTopic] = useState('Urbanisation & Society');
  const [promptQuestion, setPromptQuestion] = useState(
    'Some people believe that living in big cities provides more opportunities, while others argue that it has a negative impact on the quality of life. Discuss both views and give your opinion.'
  );
  const [essayText, setEssayText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [evalResult, setEvalResult] = useState<WritingEvaluationResult | null>(null);
  const [copiedModel, setCopiedModel] = useState(false);

  // Modals state
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isSentenceUpgradeOpen, setIsSentenceUpgradeOpen] = useState(false);
  const [selectedHighlightText, setSelectedHighlightText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // Cohesion Radar state
  const [isAnalyzingCohesion, setIsAnalyzingCohesion] = useState(false);
  const [cohesionResult, setCohesionResult] = useState<any | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active target words from set
  const activeVocabTerms = useMemo(() => {
    return words.slice(0, 10).map((w) => w.term);
  }, [words]);

  // Real-time word count
  const wordCount = useMemo(() => {
    if (!essayText.trim()) return 0;
    return essayText.trim().split(/\s+/).length;
  }, [essayText]);

  const minRequiredWords = taskType === 'task2_essay' ? 250 : 150;
  const isUnderlength = wordCount < minRequiredWords && wordCount > 0;

  // Check which target words are already incorporated in text
  const targetWordsStatus = useMemo(() => {
    const textLower = essayText.toLowerCase();
    return activeVocabTerms.map((term) => {
      const isUsed = textLower.includes(term.toLowerCase());
      return { term, isUsed };
    });
  }, [essayText, activeVocabTerms]);

  // Handle text selection for Inline Sentence Upgrade Popup
  const handleTextSelect = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = textareaRef.current.value.substring(start, end).trim();
    if (selected.length > 5) {
      setSelectedHighlightText(selected);
      setSelectionRange({ start, end });
    }
  };

  const handleOpenSurgeryForSelection = () => {
    if (selectedHighlightText.trim()) {
      setIsSentenceUpgradeOpen(true);
    }
  };

  const handleReplaceSelectedText = (newText: string) => {
    if (!selectionRange) return;
    const before = essayText.substring(0, selectionRange.start);
    const after = essayText.substring(selectionRange.end);
    const updated = before + newText + after;
    setEssayText(updated);
    setSelectedHighlightText('');
    setSelectionRange(null);
  };

  // Generate new authentic prompt with AI
  const handleGenerateNewPrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      sounds.playClick();
      const data = await generateWritingPrompt({
        taskType,
        topic: promptTopic || activeSet.mainTopic || 'Academic Society',
        vocabTerms: activeVocabTerms,
      });
      if (data) {
        setPromptQuestion(data.promptText);
        setPromptTopic(data.topic || promptTopic);
        sounds.playComplete();
      }
    } catch (err: any) {
      console.error('Error generating writing prompt:', err);
      sounds.playWrong();
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Save to portfolio helper
  const saveToPortfolio = (result: WritingEvaluationResult) => {
    try {
      const newItem: WritingPortfolioItem = {
        id: 'essay_' + Date.now(),
        createdAt: Date.now(),
        taskType,
        topic: promptTopic,
        promptQuestion,
        essayText,
        wordCount: result.wordCount,
        overallBand: result.overallBand,
        criteriaScores: {
          taskResponse: result.criteriaScores.taskResponse.score,
          coherenceCohesion: result.criteriaScores.coherenceCohesion.score,
          lexicalResource: result.criteriaScores.lexicalResource.score,
          grammaticalRange: result.criteriaScores.grammaticalRange.score,
        },
        modelRewrite: result.band8ModelRewrite?.fullText,
      };

      const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      const existing: WritingPortfolioItem[] = raw ? JSON.parse(raw) : [];
      const updated = [newItem, ...existing.slice(0, 29)]; // keep 30 most recent
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to portfolio:', e);
    }
  };

  // Submit essay for evaluation
  const handleEvaluate = async () => {
    if (!essayText.trim()) return;
    setIsEvaluating(true);
    try {
      sounds.playClick();
      const result = await evaluateWritingEssay({
        taskType,
        promptTopic,
        promptQuestion,
        essayText,
        targetWords: activeVocabTerms,
        targetBand: 8.0,
      });
      setEvalResult(result);
      saveToPortfolio(result);

      if (result.overallBand >= 7.0) {
        sounds.playComplete();
        fireCelebration();
      } else {
        sounds.playStreak();
      }
    } catch (err: any) {
      console.error('Error evaluating essay:', err);
      sounds.playWrong();
    } finally {
      setIsEvaluating(false);
    }
  };

  // Run Cohesion Radar
  const handleAnalyzeCohesion = async () => {
    if (!essayText.trim()) return;
    setIsAnalyzingCohesion(true);
    try {
      sounds.playClick();
      const result = await analyzeWritingCohesion({ essayText });
      setCohesionResult(result);
      sounds.playComplete();
    } catch (err: any) {
      console.error('Error analyzing cohesion:', err);
      sounds.playWrong();
    } finally {
      setIsAnalyzingCohesion(false);
    }
  };

  const handleCopyModelAnswer = () => {
    if (!evalResult?.band8ModelRewrite?.fullText) return;
    navigator.clipboard.writeText(evalResult.band8ModelRewrite.fullText);
    setCopiedModel(true);
    sounds.playSuccess();
    setTimeout(() => setCopiedModel(false), 2000);
  };

  const handleLoadPortfolioEssay = (item: WritingPortfolioItem) => {
    setTaskType(item.taskType);
    setPromptTopic(item.topic);
    setPromptQuestion(item.promptQuestion);
    setEssayText(item.essayText);
    setActiveSpace('studio');
    sounds.playSuccess();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 🧭 Top Navigation Header & Sub-Space Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <PenTool className="w-6 h-6 text-indigo-400" />
              <span>IELTS Writing AI Master Suite</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Phòng luyện viết toàn diện: Dàn ý 4 đoạn, bôi đen nâng cấp câu, luyện viết cấp tốc & bản đồ nhiệt từ vựng
            </p>
          </div>
        </div>

        {/* 3 Main Space Tabs & Portfolio Button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveSpace('studio')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeSpace === 'studio'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Essay Studio</span>
          </button>

          <button
            onClick={() => setActiveSpace('micro-gym')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeSpace === 'micro-gym'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Micro-Gym (2–5p)</span>
          </button>

          <button
            onClick={() => setActiveSpace('task1-lab')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeSpace === 'task1-lab'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Task 1 Trend Lab</span>
          </button>

          <button
            onClick={() => setIsPortfolioModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Hồ Sơ (Portfolio)</span>
          </button>
        </div>
      </div>

      {/* SPACE 2: MICRO WRITING GYM */}
      {activeSpace === 'micro-gym' && (
        <MicroWritingGym onBack={() => setActiveSpace('studio')} />
      )}

      {/* SPACE 3: TASK 1 TREND LAB */}
      {activeSpace === 'task1-lab' && (
        <Task1TrendLab
          onInsertPhrase={(phrase) => {
            setEssayText((prev) => prev + (prev ? ' ' : '') + phrase);
            setActiveSpace('studio');
          }}
        />
      )}

      {/* SPACE 1: FULL ESSAY STUDIO & LEXICAL HEATMAP */}
      {activeSpace === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* ========================================================================= */}
          {/* 📝 LEFT COLUMN: WRITING EDITOR & LIVE TARGET VOCABULARY TRACKER (7 Cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-4">
            {/* Task Type & Prompt Configuration Bar */}
            <div className="neo-glass-card p-4 sm:p-5 border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskType('task2_essay')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      taskType === 'task2_essay'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Task 2 (Academic Essay - 250 từ)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskType('task1_academic')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      taskType === 'task1_academic'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Task 1 (Report - 150 từ)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* AI Essay Architect 1-Click Button */}
                  <button
                    type="button"
                    onClick={() => setIsOutlineModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>Lập Dàn Bài AI</span>
                  </button>

                  {/* AI Generate Prompt Button */}
                  <button
                    type="button"
                    onClick={handleGenerateNewPrompt}
                    disabled={isGeneratingPrompt}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                    <span>Đổi đề bài AI</span>
                  </button>
                </div>
              </div>

              {/* Prompt Topic & Question */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                    Chủ đề: {promptTopic}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Mục tiêu: {taskType === 'task2_essay' ? '≥ 250 từ (40 phút)' : '≥ 150 từ (20 phút)'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                  "{promptQuestion}"
                </p>
              </div>
            </div>

            {/* Target Vocabulary Integration Tracker */}
            <div className="neo-glass-card p-4 border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Từ vựng mục tiêu cần áp dụng vào bài ({targetWordsStatus.filter((w) => w.isUsed).length}/{targetWordsStatus.length}):</span>
                </span>
                <span className="text-[10px] text-slate-400">Từ bộ: {activeSet.title}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {targetWordsStatus.map((item) => (
                  <span
                    key={item.term}
                    className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1 transition-all ${
                      item.isUsed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm font-bold scale-105'
                        : 'bg-white/5 text-slate-400 border-white/5 font-medium'
                    }`}
                  >
                    {item.isUsed && <Check className="w-3 h-3 text-emerald-400" />}
                    <span>{item.term}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Essay Input Textarea with Selection Surgery Bar */}
            <div className="neo-glass-card p-4 sm:p-5 border-white/10 space-y-3 relative">
              {/* Highlight Toolbar Banner */}
              {selectedHighlightText.trim().length > 5 && (
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 truncate text-xs text-purple-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">Đang chọn: <strong>"{selectedHighlightText}"</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenSurgeryForSelection}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>Nâng cấp câu này</span>
                  </button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                onSelect={handleTextSelect}
                placeholder="Bắt đầu viết bài luận IELTS của bạn tại đây... (Mẹo: Bôi đen một câu bất kỳ để bật AI phẫu thuật nâng cấp câu lên Band 8.5+)"
                rows={16}
                className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none leading-relaxed font-mono"
              />

              {/* Bottom word count & action bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-mono font-bold ${isUnderlength ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {wordCount} / {minRequiredWords} từ
                  </span>
                  {isUnderlength && (
                    <span className="text-[11px] text-rose-400 font-medium hidden sm:inline">
                      (Chưa đạt độ dài tối thiểu {minRequiredWords} từ)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyzeCohesion}
                    disabled={isAnalyzingCohesion || !essayText.trim()}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isAnalyzingCohesion ? 'Đang quét...' : 'Quét từ nối (Cohesion)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEvaluate}
                    disabled={isEvaluating || !essayText.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-indigo-600/40 hover:shadow-indigo-600/60 disabled:opacity-40 cursor-pointer flex items-center gap-2 border border-indigo-400/30"
                  >
                    {isEvaluating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>AI đang chấm 4 tiêu chí...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Chấm Điểm & Nâng Cấp Band 8.5+</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Cohesion Radar Box (If evaluated) */}
            {cohesionResult && (
              <div className="neo-glass-card p-4 sm:p-5 border-indigo-500/30 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-black uppercase text-indigo-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Phân Tích Liên Kết & Từ Nối (Cohesion Band {cohesionResult.cohesionBandScore.toFixed(1)})
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{cohesionResult.flowAnalysisVi}</p>
                {cohesionResult.overusedTransitions && cohesionResult.overusedTransitions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-amber-400">Từ nối bị lặp / quá tải:</span>
                    <div className="flex flex-wrap gap-2">
                      {cohesionResult.overusedTransitions.map((t: any, idx: number) => (
                        <span key={idx} className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <strong>"{t.word}"</strong> ({t.count} lần) ➔ Thay bằng: {t.naturalAlternatives.join(', ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 📊 RIGHT COLUMN: 4 CAMBRIDGE CRITERIA SCORECARD & LEXICAL HEATMAP (5 Cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            {evalResult ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* 🏆 Overall Band Score Pod */}
                <div className="neo-glass-card p-5 border-indigo-500/30 bg-gradient-to-br from-[#121733]/90 via-[#0A0D1E]/95 to-[#050711] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        IELTS Writing Band Score
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-white heading-gradient-brand">
                        Band {evalResult.overallBand.toFixed(1)}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-medium bg-white/[0.03] p-3 rounded-xl border border-white/5">
                    {evalResult.examinerGeneralVerdictVi}
                  </p>

                  {/* 4 Cambridge Criteria Score Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400 font-bold">Task Response</span>
                        <span className="font-black text-indigo-300">Band {evalResult.criteriaScores.taskResponse.score}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2">{evalResult.criteriaScores.taskResponse.feedbackVi}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400 font-bold">Coherence & Cohesion</span>
                        <span className="font-black text-emerald-300">Band {evalResult.criteriaScores.coherenceCohesion.score}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2">{evalResult.criteriaScores.coherenceCohesion.feedbackVi}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400 font-bold">Lexical Resource</span>
                        <span className="font-black text-amber-300">Band {evalResult.criteriaScores.lexicalResource.score}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2">{evalResult.criteriaScores.lexicalResource.feedbackVi}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400 font-bold">Grammar & Accuracy</span>
                        <span className="font-black text-purple-300">Band {evalResult.criteriaScores.grammaticalRange.score}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2">{evalResult.criteriaScores.grammaticalRange.feedbackVi}</p>
                    </div>
                  </div>
                </div>

                {/* 🔴 Lexical Heatmap & Upgrade Recommendations */}
                {evalResult.lexicalHeatmapReplacements && evalResult.lexicalHeatmapReplacements.length > 0 && (
                  <div className="neo-glass-card p-5 border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4" />
                        Bản Đồ Nâng Cấp Từ Vựng (Lexical Heatmap)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {evalResult.lexicalHeatmapReplacements.length} cụm từ cần nâng cấp
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {evalResult.lexicalHeatmapReplacements.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-rose-400 line-through">
                              "{item.originalPhrase}"
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              {item.academicUpgrade} ({item.cefrLevel || 'C1/C2'})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 italic">{item.explanationVi}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ✨ Band 8.5+ Model Rewrite */}
                {evalResult.band8ModelRewrite && (
                  <div className="neo-glass-card p-5 border-indigo-500/30 bg-gradient-to-br from-[#13112C]/80 via-[#0B0A1A]/90 to-[#05050E] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Bài Mẫu Band 8.5+ Viết Lại
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyModelAnswer}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {copiedModel ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedModel ? 'Đã sao chép' : 'Sao chép bài mẫu'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 max-h-64 overflow-y-auto pr-1">
                      <p className="text-xs text-slate-200 leading-relaxed font-serif italic whitespace-pre-wrap">
                        {evalResult.band8ModelRewrite.fullText}
                      </p>
                    </div>

                    {evalResult.band8ModelRewrite.keyCollocationsUsed && evalResult.band8ModelRewrite.keyCollocationsUsed.length > 0 && (
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Collocations đắt giá trong bài mẫu:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {evalResult.band8ModelRewrite.keyCollocationsUsed.map((col, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold"
                            >
                              {col.phrase} <span className="text-slate-400 text-[10px]">({col.meaningVi})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Placeholder State */
              <div className="neo-glass-card p-6 border-white/10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Sẵn Sàng Chấm Điểm 4 Tiêu Chí</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                    Nhập bài viết của bạn và bấm <strong>"Chấm Điểm & Nâng Cấp Band 8.5+"</strong> để nhận bảng điểm, bản đồ nhiệt từ vựng và bài mẫu viết lại từ AI.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-white/5">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-indigo-400 block">✓ Task Response</span>
                    <span className="text-[10px] text-slate-500">Độ sâu luận điểm & giải thích</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-emerald-400 block">✓ Coherence</span>
                    <span className="text-[10px] text-slate-500">Mạch lạc & từ nối tự nhiên</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-amber-400 block">✓ Lexical Resource</span>
                    <span className="text-[10px] text-slate-500">Từ vựng học thuật C1/C2</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-purple-400 block">✓ Grammar Range</span>
                    <span className="text-[10px] text-slate-500">Câu đơn, ghép & phức</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🧠 AI ESSAY ARCHITECT OUTLINE MODAL */}
      <EssayOutlineArchitectModal
        isOpen={isOutlineModalOpen}
        onClose={() => setIsOutlineModalOpen(false)}
        taskType={taskType}
        topic={promptTopic}
        promptQuestion={promptQuestion}
        words={words}
        onInsertOutline={(outlineText) => {
          setEssayText((prev) => outlineText + '\n\n' + prev);
        }}
      />

      {/* ⚡ INLINE SENTENCE UPGRADE SURGERY POPUP */}
      <InlineSentenceUpgradePopup
        isOpen={isSentenceUpgradeOpen}
        onClose={() => setIsSentenceUpgradeOpen(false)}
        selectedText={selectedHighlightText}
        contextSentence={essayText}
        onReplaceText={handleReplaceSelectedText}
      />

      {/* 📂 WRITING PORTFOLIO HISTORY MODAL */}
      <WritingPortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        onLoadEssay={handleLoadPortfolioEssay}
        userId={currentUserId}
      />
    </div>
  );
}
