import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { VocabItem, WordSet, UserProgress, IeltsWritingTaskType, WritingEvaluationResult, WritingPrompt } from '../../types';
import { evaluateWritingEssay, generateWritingPrompt } from '../../services/apiService';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration } from '../../utils/confetti';

interface WritingAssistantLabProps {
  words: VocabItem[];
  activeSet: WordSet;
  progress: UserProgress;
  onBack: () => void;
}

export function WritingAssistantLab({
  words,
  activeSet,
  progress,
  onBack,
}: WritingAssistantLabProps) {
  const [taskType, setTaskType] = useState<IeltsWritingTaskType>('task2_essay');
  const [promptTopic, setPromptTopic] = useState('Urbanisation & Society');
  const [promptQuestion, setPromptQuestion] = useState(
    'Some people believe that living in big cities provides more opportunities, while others argue that it has a negative impact on the quality of life. Discuss both views and give your opinion.'
  );
  const [essayText, setEssayText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [evalResult, setEvalResult] = useState<WritingEvaluationResult | null>(null);
  const [generatedPromptData, setGeneratedPromptData] = useState<WritingPrompt | null>(null);
  const [copiedModel, setCopiedModel] = useState(false);

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

  // Generate new authentic prompt with AI
  const handleGenerateNewPrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const data = await generateWritingPrompt({
        taskType,
        topic: promptTopic || activeSet.mainTopic || 'Academic Society',
        vocabTerms: activeVocabTerms,
      });
      if (data) {
        setGeneratedPromptData(data);
        setPromptQuestion(data.promptText);
        setPromptTopic(data.topic || promptTopic);
      }
    } catch (err: any) {
      console.error('Error generating writing prompt:', err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Submit essay for evaluation
  const handleEvaluate = async () => {
    if (!essayText.trim()) return;
    setIsEvaluating(true);
    try {
      const result = await evaluateWritingEssay({
        taskType,
        promptTopic,
        promptQuestion,
        essayText,
        targetWords: activeVocabTerms,
        targetBand: 8.0,
      });
      setEvalResult(result);
      if (result.overallBand >= 7.0) {
        sounds.playComplete();
        fireCelebration();
      } else {
        sounds.playStreak();
      }
    } catch (err: any) {
      console.error('Error evaluating essay:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyModelAnswer = () => {
    if (!evalResult?.band8ModelRewrite?.fullText) return;
    navigator.clipboard.writeText(evalResult.band8ModelRewrite.fullText);
    setCopiedModel(true);
    setTimeout(() => setCopiedModel(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <PenTool className="w-6 h-6 text-indigo-400" />
              <span>IELTS Writing AI Assistant & Lexical Heatmap</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Chấm bài theo 4 tiêu chí Cambridge, bản đồ nhiệt từ vựng & nâng cấp bài viết lên Band 8.5+
            </p>
          </div>
        </div>

        {/* Task Type Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
          <button
            onClick={() => setTaskType('task2_essay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              taskType === 'task2_essay'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Task 2 Essay (250+ từ)
          </button>
          <button
            onClick={() => setTaskType('task1_academic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              taskType === 'task1_academic'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Task 1 Academic (150+ từ)
          </button>
          <button
            onClick={() => setTaskType('task1_general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              taskType === 'task1_general'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Task 1 Letter (150+ từ)
          </button>
        </div>
      </div>

      {/* Main Workspace Split-Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Prompt & Essay Editor (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Prompt Box */}
          <div className="bento-card p-5 border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-[#111322] to-[#0A0C16]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Đề Bài IELTS Writing
              </span>
              <button
                onClick={handleGenerateNewPrompt}
                disabled={isGeneratingPrompt}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/25 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                <span>{isGeneratingPrompt ? 'Đang tạo...' : 'Tạo đề AI theo kho từ'}</span>
              </button>
            </div>

            <textarea
              value={promptQuestion}
              onChange={(e) => setPromptQuestion(e.target.value)}
              rows={3}
              placeholder="Nhập hoặc dán đề bài thi tại đây..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 font-medium leading-relaxed resize-none"
            />

            {/* Suggested Collocations to Weave in */}
            {generatedPromptData?.suggestedCollocations && generatedPromptData.suggestedCollocations.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-white/5">
                <div className="text-[11px] font-bold text-slate-400 mb-1.5">Collocations gợi ý áp dụng:</div>
                <div className="flex flex-wrap gap-1.5">
                  {generatedPromptData.suggestedCollocations.map((c, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      title={c.meaningVi}
                    >
                      {c.phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Target Vocabulary Integration Pill Bar */}
          <div className="bento-card p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span>Thử thách lồng ghép từ vựng đang học:</span>
              <span className="text-indigo-400">
                {targetWordsStatus.filter((t) => t.isUsed).length} / {targetWordsStatus.length} từ
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {targetWordsStatus.map((item, idx) => (
                <span
                  key={idx}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                    item.isUsed
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {item.isUsed ? '✓ ' : '+ '}
                  {item.term}
                </span>
              ))}
            </div>
          </div>

          {/* Essay Editor Box */}
          <div className="bento-card p-5 border border-white/10 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nội dung bài viết của bạn:</span>
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-black px-2 py-0.5 rounded-md text-xs border ${
                    isUnderlength
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : wordCount >= minRequiredWords
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {wordCount} / {minRequiredWords} từ
                </span>
              </div>
            </div>

            <textarea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              rows={14}
              placeholder={`Dán hoặc gõ bài viết của bạn tại đây (${minRequiredWords} từ tối thiểu)...`}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 font-serif leading-relaxed"
            />

            {isUnderlength && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Bài viết chưa đủ độ dài tối thiểu {minRequiredWords} từ theo quy định chấm thi IELTS.</span>
              </div>
            )}

            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !essayText.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Giám khảo AI đang quét Lexical Heatmap & chấm điểm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Chấm Điểm 4 Tiêu Chí & Phân Tích Bản Đồ Nhiệt</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Evaluation Results & Lexical Heatmap (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {evalResult ? (
            <div className="space-y-4">
              {/* Overall Band Card */}
              <div className="bento-card p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-[#111624] to-[#0A0C16]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Kết Quả Chấm Thi Cambridge IELTS
                    </span>
                    <h2 className="text-xl font-bold text-white mt-0.5">Bảng Điểm Chi Tiết</h2>
                  </div>
                  <div className="text-center bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-emerald-400">Overall Band</div>
                    <div className="text-3xl font-black text-emerald-300">{evalResult.overallBand}</div>
                  </div>
                </div>

                {/* 4 Criteria Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Task Response</div>
                    <div className="text-lg font-black text-white mt-0.5">
                      {evalResult.criteriaScores?.taskResponse?.score || 6.5}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Coherence</div>
                    <div className="text-lg font-black text-white mt-0.5">
                      {evalResult.criteriaScores?.coherenceCohesion?.score || 6.5}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Lexical Resource</div>
                    <div className="text-lg font-black text-indigo-400 mt-0.5">
                      {evalResult.criteriaScores?.lexicalResource?.score || 7.0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Grammar</div>
                    <div className="text-lg font-black text-white mt-0.5">
                      {evalResult.criteriaScores?.grammaticalRange?.score || 6.5}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3.5 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  {evalResult.examinerGeneralVerdictVi}
                </p>
              </div>

              {/* 🔴 Lexical Heatmap & Upgrade Recommendations */}
              <div className="bento-card p-5 border border-purple-500/20 bg-gradient-to-br from-purple-950/20 via-[#121424] to-[#0A0C16]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Bản Đồ Nhiệt Từ Vựng & Nâng Cấp Band 8.5+
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {evalResult.lexicalHeatmapReplacements?.length || 0} điểm nâng cấp
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {evalResult.lexicalHeatmapReplacements?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-400 line-through">
                          "{item.originalPhrase}"
                        </span>
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                          ➔ {item.academicUpgrade}
                          <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {item.cefrLevel || 'C1'}
                          </span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-snug">{item.explanationVi}</div>
                      {item.sampleContext && (
                        <div className="text-[10px] text-slate-400 italic font-mono bg-black/30 p-1.5 rounded">
                          Ví dụ: {item.sampleContext}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ✨ Full Band 8.5+ Model Answer */}
              <div className="bento-card p-5 border border-indigo-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Bài Mẫu Nâng Cấp Chuẩn Band 8.5+ (Model Rewrite)
                  </span>
                  <button
                    onClick={handleCopyModelAnswer}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition-all cursor-pointer"
                  >
                    {copiedModel ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedModel ? 'Đã sao chép' : 'Sao chép bài mẫu'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs sm:text-sm text-slate-200 font-serif leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line">
                  {evalResult.band8ModelRewrite?.fullText}
                </div>

                {evalResult.band8ModelRewrite?.keyCollocationsUsed && (
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5">Collocations đắt giá trong bài mẫu:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {evalResult.band8ModelRewrite.keyCollocationsUsed.map((colloc, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          title={colloc.meaningVi}
                        >
                          {colloc.phrase} ({colloc.cefrLevel})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bento-card p-8 border border-white/10 h-full min-h-[420px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-white">Chưa Có Kết Quả Chấm Bài</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Nhập hoặc dán bài viết của bạn vào khung bên trái và bấm{' '}
                  <strong className="text-indigo-300 font-semibold">"Chấm Điểm & Phân Tích Bản Đồ Nhiệt"</strong> để nhận
                  bảng điểm chi tiết 4 tiêu chí Cambridge cùng bản viết lại chuẩn Band 8.5+.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
