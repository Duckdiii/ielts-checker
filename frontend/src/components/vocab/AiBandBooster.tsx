import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Volume2,
  FileText,
  Lightbulb,
  Award,
  ArrowLeft,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';
import {
  VocabItem,
  WordSet,
  AIWordExpansion,
  AIEvaluationResult,
  AIReadingPassage,
  AIStudyAdvisorResult,
  UserProgress,
} from '../../types';
import {
  expandVocabWord,
  evaluateSentencePractice,
  generateIeltsReadingPassage,
  getAiStudyRecommendations,
} from '../../services/geminiService';
import { speakWord } from '../../utils/speech';

interface AiBandBoosterProps {
  words: VocabItem[];
  allWords?: VocabItem[];
  activeSet: WordSet;
  progress?: UserProgress;
  initialWord?: VocabItem | null;
  onBack: () => void;
  onAddWordToSet: (
    word: Omit<
      VocabItem,
      | 'id'
      | 'sourceSetId'
      | 'mastery'
      | 'srsStage'
      | 'nextReviewDate'
      | 'reviewCount'
      | 'correctCount'
      | 'incorrectCount'
    >
  ) => void;
}

export const AiBandBooster: React.FC<AiBandBoosterProps> = ({
  words,
  allWords = words,
  activeSet,
  progress,
  initialWord,
  onBack,
  onAddWordToSet,
}) => {
  const [activeTab, setActiveTab] = useState<'network' | 'evaluator' | 'passage' | 'advisor'>('network');

  // Tab 1: Vocab Network
  const [selectedWordTerm, setSelectedWordTerm] = useState(initialWord?.term || (words[0]?.term || ''));
  const [customWordInput, setCustomWordInput] = useState('');
  const [loadingExpansion, setLoadingExpansion] = useState(false);
  const [expansionError, setExpansionError] = useState<string | null>(null);
  const [expansionData, setExpansionData] = useState<AIWordExpansion | null>(null);
  const [addedSynonyms, setAddedSynonyms] = useState<Record<string, boolean>>({});

  // Tab 2: Sentence Evaluator
  const [sentenceInput, setSentenceInput] = useState('');
  const [evalMode, setEvalMode] = useState<'writing' | 'speaking'>('writing');
  const [selectedTargetWords, setSelectedTargetWords] = useState<string[]>(
    words.slice(0, 3).map((w) => w.term)
  );
  const [loadingEval, setLoadingEval] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<AIEvaluationResult | null>(null);

  // Tab 3: Reading Passage Generator
  const [passageWords, setPassageWords] = useState<string[]>(words.slice(0, 5).map((w) => w.term));
  const [passageTopic, setPassageTopic] = useState('Urbanization & Sustainable Living');
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [passageError, setPassageError] = useState<string | null>(null);
  const [generatedPassage, setGeneratedPassage] = useState<AIReadingPassage | null>(null);
  const [passageAnswers, setPassageAnswers] = useState<Record<string, string>>({});
  const [passageChecked, setPassageChecked] = useState(false);

  // Tab 4: Study Advisor
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [advisorData, setAdvisorData] = useState<AIStudyAdvisorResult | null>(null);

  // Handle Tab 1 Expansion Search
  const handleExpandWord = async (termToExpand?: string) => {
    const term = termToExpand || customWordInput.trim() || selectedWordTerm;
    if (!term) return;

    setLoadingExpansion(true);
    setExpansionError(null);
    try {
      const currentObj = words.find((w) => w.term.toLowerCase() === term.toLowerCase());
      const res = await expandVocabWord(term, currentObj?.meaning, currentObj?.example);
      setExpansionData(res);
      setSelectedWordTerm(term);
      setCustomWordInput('');
    } catch (e: any) {
      console.error(e);
      setExpansionError(e.message || 'Không thể mở rộng từ vựng qua AI. Vui lòng thử lại sau.');
    } finally {
      setLoadingExpansion(false);
    }
  };

  // Handle Tab 2 Sentence Evaluation
  const handleEvaluate = async () => {
    if (!sentenceInput.trim()) return;

    setLoadingEval(true);
    setEvalError(null);
    try {
      const res = await evaluateSentencePractice(
        sentenceInput,
        selectedTargetWords,
        evalMode,
        evalMode === 'writing' ? 'IELTS Academic Writing Task 2' : 'IELTS Speaking Part 3'
      );
      setEvalResult(res);
    } catch (e: any) {
      console.error(e);
      setEvalError(e.message || 'Không thể chấm điểm câu văn qua AI. Vui lòng thử lại sau.');
    } finally {
      setLoadingEval(false);
    }
  };

  // Handle Tab 3 Generate Reading Passage
  const handleGeneratePassage = async () => {
    if (!passageWords.length) return;

    setLoadingPassage(true);
    setPassageError(null);
    setPassageChecked(false);
    setPassageAnswers({});
    try {
      const res = await generateIeltsReadingPassage(passageWords, passageTopic);
      setGeneratedPassage(res);
    } catch (e: any) {
      console.error(e);
      setPassageError(e.message || 'Không thể tạo bài đọc hiểu qua AI. Vui lòng thử lại sau.');
    } finally {
      setLoadingPassage(false);
    }
  };

  // Handle Tab 4 Study Advisor
  const handleLoadAdvisor = async () => {
    setLoadingAdvisor(true);
    setAdvisorError(null);
    try {
      const weak = allWords.filter((w) => (w.incorrectCount || 0) > 0 || w.mastery === 'new').map((w) => w.term);
      const res = await getAiStudyRecommendations({
        totalWords: allWords.length,
        masteredCount: allWords.filter((w) => w.mastery === 'mastered').length,
        learningCount: allWords.filter((w) => w.mastery === 'learning' || w.mastery === 'reviewing').length,
        weakWords: weak.slice(0, 6),
        estimatedBand: progress?.estimatedBand || 7.0,
      });
      setAdvisorData(res);
    } catch (e: any) {
      console.error(e);
      setAdvisorError(e.message || 'Không thể phân tích lộ trình học tập qua AI. Vui lòng thử lại sau.');
    } finally {
      setLoadingAdvisor(false);
    }
  };

  // Add synonym as new word to set
  const handleAddSynonym = (syn: { word: string; band: string; nuance: string; meaningVi: string }) => {
    onAddWordToSet({
      term: syn.word,
      meaning: syn.meaningVi || `(Đồng nghĩa với ${selectedWordTerm})`,
      targetIeltsBand: (syn.band as any) || '7.5',
      notes: `Sắc thái nghĩa: ${syn.nuance}`,
    });
    setAddedSynonyms((prev) => ({ ...prev, [syn.word]: true }));
  };

  return (
    <div className="max-w-[1680px] w-full mx-auto space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16191F] p-4 sm:p-5 rounded-3xl border border-[#2D333B] shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-[#21262D] hover:bg-[#2D3135] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
              AI Band 8.5+ Booster Center
            </h1>
            <p className="text-xs text-[#8B949E]">
              Trợ lý học thuật Gemini: Khám phá họ từ, nâng cấp câu và tạo ngữ cảnh đề thi chuẩn IELTS
            </p>
          </div>
        </div>

        {/* Feature Tabs Switcher */}
        <div className="flex items-center bg-[#11141A] p-1.5 rounded-2xl border border-[#2D3135] overflow-x-auto shadow-inner">
          <button
            onClick={() => setActiveTab('network')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'network'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Mạng Lưới Từ Vựng
          </button>
          <button
            onClick={() => setActiveTab('evaluator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'evaluator'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Chấm & Nâng Cấp Câu
          </button>
          <button
            onClick={() => setActiveTab('passage')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'passage'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Bài Đọc IELTS Mini
          </button>
          <button
            onClick={() => {
              setActiveTab('advisor');
              if (!advisorData) handleLoadAdvisor();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'advisor'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Lộ Trình AI
          </button>
        </div>
      </div>

      {/* TAB 1: VOCABULARY EXPANSION NETWORK */}
      {activeTab === 'network' && (
        <div className="space-y-6">
          {/* Search / Select Word Bar */}
          <div className="bg-[#16191D] p-5 rounded-2xl border border-[#2D3135] shadow-lg flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8B949E] absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExpandWord()}
                  placeholder="Nhập từ vựng bất kỳ cần phân tích hoặc chọn từ dưới..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs sm:text-sm placeholder-[#484F58] focus:outline-hidden focus:border-purple-500"
                />
              </div>
              <button
                onClick={() => handleExpandWord()}
                disabled={loadingExpansion}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
              >
                {loadingExpansion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Phân tích AI
              </button>
            </div>

            {/* Quick Word chips from current set */}
            {words.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 max-w-full md:max-w-xs">
                {words.slice(0, 5).map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleExpandWord(w.term)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
                      selectedWordTerm.toLowerCase() === w.term.toLowerCase()
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                        : 'bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white'
                    }`}
                  >
                    {w.term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {expansionError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{expansionError}</span>
            </div>
          )}

          {/* Expansion Result Display */}
          {loadingExpansion && (
            <div className="bg-[#16191D] rounded-2xl p-12 border border-[#2D3135] text-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">
                AI đang giải mã sắc thái từ vựng, họ từ, từ đồng nghĩa & collocations Band 8.5+...
              </p>
              <p className="text-xs text-[#8B949E]">Vui lòng đợi giây lát</p>
            </div>
          )}

          {expansionData && !loadingExpansion && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fadeIn">
              {/* Left Column: Word Overview */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Band {expansionData.ieltsBand || '8.0+'} Target
                    </span>
                    <button
                      onClick={() => speakWord(expansionData.term)}
                      className="p-1.5 rounded-lg bg-[#21262D] text-purple-300 hover:text-white hover:bg-purple-600 transition-colors border border-[#30363D] cursor-pointer"
                      title="Phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {expansionData.term}
                    </h2>
                    {expansionData.ipa && (
                      <p className="text-xs text-[#8B949E] font-mono mt-0.5">{expansionData.ipa}</p>
                    )}
                    <p className="text-sm font-semibold text-purple-300 mt-2">
                      {expansionData.meaningVi}
                    </p>
                  </div>

                  {expansionData.academicRegister && (
                    <div className="text-xs text-[#8B949E]">
                      Ngữ cảnh sử dụng: <strong className="text-white">{expansionData.academicRegister}</strong>
                    </div>
                  )}

                  {/* Common Mistakes */}
                  {expansionData.commonMistakes && (
                    <div className="p-3.5 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-[#C9D1D9] leading-relaxed space-y-1">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Lỗi người học hay mắc:
                      </span>
                      <p className="text-[#8B949E]">{expansionData.commonMistakes}</p>
                    </div>
                  )}

                  {/* IELTS Tips */}
                  {expansionData.ieltsSpeakingWritingTip && (
                    <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 leading-relaxed space-y-1">
                      <span className="font-bold text-purple-300 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5" /> Bí quyết ứng dụng thi IELTS:
                      </span>
                      <p>{expansionData.ieltsSpeakingWritingTip}</p>
                    </div>
                  )}
                </div>

                {/* Word Family Box */}
                {expansionData.wordFamily && expansionData.wordFamily.length > 0 && (
                  <div className="bg-[#16191D] p-5 rounded-2xl border border-[#2D3135] shadow-lg space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                      Họ Từ Loại (Word Family)
                    </h3>
                    <div className="space-y-2">
                      {expansionData.wordFamily.map((wf, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{wf.word}</span>
                            <span className="text-[10px] text-[#8B949E] ml-1.5">({wf.type})</span>
                          </div>
                          <span className="text-[#9BA1A6] text-[11px]">{wf.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Synonyms & Collocations */}
              <div className="lg:col-span-2 space-y-5">
                {/* Advanced Synonyms with Nuance Breakdown */}
                <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Từ Đồng Nghĩa Mở Rộng & Phân Biệt Sắc Thái (IELTS Band 7.5 - 9.0)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {expansionData.synonymsWithNuance?.map((syn, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#21262D] border border-[#30363D] hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-base">{syn.word}</span>
                              {syn.ipa && <span className="text-[10px] text-[#8B949E] font-mono">{syn.ipa}</span>}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Band {syn.band}
                            </span>
                          </div>
                          <p className="text-xs text-purple-300 font-medium">
                            {syn.meaningVi}
                          </p>
                          <p className="text-xs text-[#9BA1A6] leading-relaxed">
                            <strong className="text-white">Sắc thái:</strong> {syn.nuance}
                          </p>
                          {syn.collocation && (
                            <p className="text-xs text-[#C9D1D9] bg-[#16191D] p-2 rounded-lg border border-[#2D3135]">
                              <strong className="text-indigo-400">Collocation:</strong> {syn.collocation}
                            </p>
                          )}
                          {syn.example && (
                            <p className="text-xs text-purple-200/80 italic pt-1">
                              "{syn.example}"
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleAddSynonym(syn)}
                          disabled={addedSynonyms[syn.word]}
                          className="self-end text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {addedSynonyms[syn.word] ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã thêm vào bộ
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Thêm vào bài ôn
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Academic Collocations */}
                <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Cụm Từ Đi Kèm Học Thuật (High-Scoring Collocations)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {expansionData.highBandCollocations?.map((col, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#21262D] border border-[#30363D] space-y-1.5"
                      >
                        <div className="font-bold text-white text-xs sm:text-sm text-indigo-300">
                          {col.collocation}
                        </div>
                        <div className="text-xs text-[#8B949E]">{col.meaningVi}</div>
                        <div className="text-xs text-[#C9D1D9] italic pt-1 border-t border-[#30363D]">
                          "{col.example}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!expansionData && !loadingExpansion && (
            <div className="bg-[#16191D] rounded-2xl p-10 border border-[#2D3135] text-center space-y-4">
              <Sparkles className="w-10 h-10 text-purple-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-white">Khám Phá Mạng Lưới Từ Vựng IELTS</h3>
              <p className="text-xs sm:text-sm text-[#8B949E] max-w-md mx-auto">
                Nhập từ vựng hoặc chọn từ có sẵn để AI mở rộng họ từ, từ đồng nghĩa nâng band và collocations học thuật.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SENTENCE EVALUATOR & BAND 8.5 REWRITER */}
      {activeTab === 'evaluator' && (
        <div className="space-y-6">
          <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Chấm Điểm & Nâng Cấp Câu (Writing & Speaking)
                </h3>
                <p className="text-xs text-[#8B949E]">
                  Gõ câu bạn tự đặt chứa từ vựng đang học để AI phân tích và nâng cấp lên Band 8.5+
                </p>
              </div>

              <div className="flex items-center bg-[#21262D] p-1 rounded-xl border border-[#30363D]">
                <button
                  onClick={() => setEvalMode('writing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    evalMode === 'writing'
                      ? 'bg-purple-600 text-white'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  Writing Task 2
                </button>
                <button
                  onClick={() => setEvalMode('speaking')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    evalMode === 'speaking'
                      ? 'bg-purple-600 text-white'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  Speaking Part 3
                </button>
              </div>
            </div>

            {/* Target Words Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                Từ vựng mục tiêu cần áp dụng:
              </label>
              <div className="flex flex-wrap gap-2">
                {words.slice(0, 8).map((w) => {
                  const isSelected = selectedTargetWords.includes(w.term);
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTargetWords((prev) => prev.filter((t) => t !== w.term));
                        } else {
                          setSelectedTargetWords((prev) => [...prev, w.term]);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                          : 'bg-[#21262D] text-[#8B949E] border-[#30363D] hover:text-white'
                      }`}
                    >
                      {w.term} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input textarea */}
            <div className="space-y-2">
              <textarea
                rows={4}
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                placeholder="Ví dụ: Although traffic congestion is severe, governments should invest in public transportation to facilitate commute..."
                className="w-full p-4 rounded-2xl bg-[#21262D] border border-[#30363D] text-white text-sm placeholder-[#484F58] focus:outline-hidden focus:border-purple-500 leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleEvaluate}
                  disabled={loadingEval || !sentenceInput.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                >
                  {loadingEval ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  AI Chấm & Nâng Band
                </button>
              </div>
            </div>
          </div>

          {/* Error message */}
          {evalError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{evalError}</span>
            </div>
          )}

          {/* Eval Result */}
          {evalResult && (
            <div className="bg-[#16191D] p-6 sm:p-8 rounded-3xl border border-[#2D3135] shadow-2xl space-y-6 animate-fadeIn">
              {/* Score & Band Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#21262D] border border-[#30363D]">
                <div>
                  <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
                    Điểm Ước Tính Hiện Tại
                  </span>
                  <div className="text-3xl font-extrabold text-amber-400 mt-1">
                    Band {evalResult.overallBand.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-[#8B949E] mt-1">
                    Grammar: <strong>{evalResult.grammarScore.toFixed(1)}</strong> • Lexical: <strong>{evalResult.lexicalScore.toFixed(1)}</strong>
                  </div>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-[#30363D] pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
                    Tiềm Năng Sau Khi Nâng Cấp
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                    Band 8.5+
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-1">
                    Chuẩn học thuật Oxford/Cambridge
                  </div>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-[#30363D] pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
                    Từ vựng mục tiêu đã áp dụng
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {evalResult.targetWordsUsed?.map((w, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold"
                      >
                        ✓ {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Band 8.5+ Upgraded Version */}
              <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Phiên Bản Nâng Cấp Chuẩn Academic (Band 8.5+)
                  </span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  "{evalResult.band8Upgrade?.sentence}"
                </p>
                <div className="text-xs text-purple-200/90 pt-2 border-t border-purple-800/40 space-y-2">
                  <p>
                    <strong>💡 Phân tích nâng cấp:</strong> {evalResult.band8Upgrade?.explanationVi}
                  </p>
                  {evalResult.band8Upgrade?.keyCollocations && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-purple-300 font-bold">Collocations đắt giá:</span>
                      {evalResult.band8Upgrade.keyCollocations.map((col, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback & Identified Errors */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#21262D] border border-[#30363D] space-y-1">
                  <span className="font-bold text-amber-400 block text-xs">
                    💡 Nhận xét chi tiết của giám khảo:
                  </span>
                  <p className="text-xs text-[#C9D1D9] leading-relaxed">{evalResult.feedbackVi}</p>
                </div>

                {evalResult.errorsIdentified && evalResult.errorsIdentified.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#21262D] border border-[#30363D] space-y-2.5">
                    <span className="font-bold text-rose-400 block text-xs">
                      ⚠️ Các lỗi sai cần khắc phục:
                    </span>
                    <div className="space-y-2">
                      {evalResult.errorsIdentified.map((err, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-[#16191D] border border-[#30363D] text-xs space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-rose-400 line-through font-semibold">{err.error}</span>
                            <span className="text-[#8B949E]">➔</span>
                            <span className="text-emerald-400 font-bold">{err.correction}</span>
                          </div>
                          <p className="text-[#8B949E] text-[11px]">{err.explanationVi}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI READING PASSAGE GENERATOR */}
      {activeTab === 'passage' && (
        <div className="space-y-6">
          <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Tạo Bài Đọc IELTS Mini Chứa Từ Vựng Đang Học
                </h3>
                <p className="text-xs text-[#8B949E]">
                  Đọc từ vựng trong ngữ cảnh học thuật thực tế để ghi nhớ sâu sắc theo chuẩn đề thi Reading
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                  Chủ đề bài đọc (IELTS Academic Topic):
                </label>
                <select
                  value={passageTopic}
                  onChange={(e) => setPassageTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs font-medium focus:outline-hidden focus:border-purple-500"
                >
                  <option value="Urbanization & Sustainable Living">Đô thị hóa & Lối sống bền vững</option>
                  <option value="Artificial Intelligence & Workforce">Trí tuệ nhân tạo & Thị trường lao động</option>
                  <option value="Climate Change & Renewable Energy">Biến đổi khí hậu & Năng lượng tái tạo</option>
                  <option value="Psychology of Language Acquisition">Tâm lý học tiếp thu ngôn ngữ</option>
                  <option value="Ancient Architecture & Archaeology">Kiến trúc cổ đại & Khảo cổ học</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                  Từ vựng được chèn vào bài ({passageWords.length} từ):
                </label>
                <div className="text-xs text-purple-300 font-medium p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] truncate">
                  {passageWords.join(', ')}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGeneratePassage}
                disabled={loadingPassage}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
              >
                {loadingPassage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Tạo bài đọc ngay
              </button>
            </div>
          </div>

          {/* Error message */}
          {passageError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passageError}</span>
            </div>
          )}

          {generatedPassage && (
            <div className="bg-[#16191D] p-6 sm:p-8 rounded-3xl border border-[#2D3135] shadow-2xl space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold uppercase">
                  IELTS Reading Passage • Lexical Target
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {generatedPassage.title}
                </h2>
              </div>

              {/* Passage text */}
              <div className="p-6 rounded-2xl bg-[#21262D] border border-[#30363D] text-sm text-[#C9D1D9] leading-relaxed font-serif whitespace-pre-line space-y-3">
                {generatedPassage.passage}
              </div>

              {/* Comprehension Questions */}
              <div className="space-y-4 pt-4 border-t border-[#2D3135]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Câu Hỏi Đọc Hiểu & Ngữ Nghĩa (3 Câu hỏi trắc nghiệm)
                </h3>

                <div className="space-y-4">
                  {generatedPassage.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#21262D] border border-[#30363D] space-y-2.5"
                    >
                      <div className="text-xs sm:text-sm font-bold text-white">
                        {idx + 1}. {q.questionText}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt, oIdx) => {
                          const isSelected = passageAnswers[q.id] === opt;
                          const isCorrect = opt === q.correctAnswer;

                          let btnStyle = 'bg-[#16191D] border-[#30363D] text-[#E0E2E4]';
                          if (isSelected) {
                            btnStyle = 'bg-purple-500/20 border-purple-500 text-white font-bold';
                          }
                          if (passageChecked) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() =>
                                !passageChecked &&
                                setPassageAnswers((prev) => ({ ...prev, [q.id]: opt }))
                              }
                              className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {passageChecked && (
                        <div className="text-xs text-[#8B949E] pt-1">
                          💡 Giải thích: {q.explanationVi}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!passageChecked ? (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setPassageChecked(true)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      Kiểm tra đáp án
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center font-bold">
                    Hoàn thành bài đọc hiểu ngữ cảnh từ vựng!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI STUDY ADVISOR */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Lộ Trình Tối Ưu Hóa Band Điểm Lexical</h3>
              <p className="text-xs text-[#8B949E]">AI phân tích lịch sử làm bài, từ hay sai và gợi ý chiến lược học</p>
            </div>
            <button
              onClick={handleLoadAdvisor}
              disabled={loadingAdvisor}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
            >
              {loadingAdvisor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Phân tích lại tiến độ
            </button>
          </div>

          {/* Error message */}
          {advisorError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{advisorError}</span>
            </div>
          )}

          {loadingAdvisor ? (
            <div className="bg-[#16191D] rounded-2xl p-12 border border-[#2D3135] text-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">AI đang phân tích tiến độ học và điểm yếu của bạn...</p>
            </div>
          ) : advisorData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              {/* Progress Evaluation */}
              <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Đánh Giá Năng Lực & Khả Năng Nâng Band
                </h3>
                <p className="text-xs text-[#C9D1D9] leading-relaxed">
                  {advisorData.progressEvaluation}
                </p>
              </div>

              {/* Weak Words Strategy */}
              <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Chiến Lược Xử Lý Từ Vựng Yếu
                </h3>
                <p className="text-xs text-[#C9D1D9] leading-relaxed">
                  {advisorData.weakWordsStrategy}
                </p>
              </div>

              {/* Priority Words To Review */}
              {advisorData.priorityWordsToReview && advisorData.priorityWordsToReview.length > 0 && (
                <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-rose-400" />
                    Từ Vựng Cần Ưu Tiên Ôn Tập Hôm Nay
                  </h3>
                  <div className="space-y-2">
                    {advisorData.priorityWordsToReview.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] text-xs font-semibold text-rose-300 flex items-center justify-between"
                      >
                        <span>{w}</span>
                        <span className="text-[10px] text-[#8B949E]">Cần củng cố</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Collocations */}
              {advisorData.recommendedCollocations && advisorData.recommendedCollocations.length > 0 && (
                <div className="bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Collocations Đề Xuất Bổ Sung
                  </h3>
                  <div className="space-y-2">
                    {advisorData.recommendedCollocations.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] text-xs font-semibold text-emerald-300"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Tips */}
              {advisorData.actionableTips && (
                <div className="md:col-span-2 bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-400" />
                    3 Lời Khuyên Thực Chiến Cho Phòng Thi IELTS
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {advisorData.actionableTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-[#C9D1D9] leading-relaxed space-y-1"
                      >
                        <span className="font-bold text-purple-300">#0{idx + 1}</span>
                        <p>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Recommended Topics */}
              {advisorData.recommendedNextTopics && (
                <div className="md:col-span-2 bg-[#16191D] p-6 rounded-2xl border border-[#2D3135] shadow-lg space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Chủ Đề Từ Vựng IELTS Nên Học Tiếp Theo
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {advisorData.recommendedNextTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-blue-300 font-semibold"
                      >
                        📚 {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
