import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Volume2,
  Star,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Filter,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Tag,
  Database,
  Download,
  Upload,
  Globe,
  Layers,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  BrainCircuit,
  Keyboard,
  Zap,
  Flag,
  AlertCircle,
  RotateCcw,
  Sparkle,
  Grid,
  Check,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { VocabItem, WordSet } from '../../types';
import { speakWord } from '../../utils/speech';
import { formatRelativeReviewTime } from '../../utils/srs';
import { getTopicInfo, IELTS_TOPICS } from '../../utils/topicHelpers';
import { globalSearchEngine } from '../../utils/searchIndex';
import { sounds } from '../../utils/soundEffects';

interface VocabListProps {
  words: VocabItem[];
  activeSet: WordSet;
  onBack: () => void;
  onSelectWord: (word: VocabItem) => void;
  onToggleBookmark: (wordId: string) => void;
  onToggleUnlearned?: (wordId: string) => void;
  onDeleteWord: (wordId: string) => void;
  onOpenAddWord: () => void;
  onOpenAiBoosterForWord: (word: VocabItem) => void;
  onOpenBatchImport?: () => void;
  onOpenExcelImport?: () => void;
  onStartMode?: (mode: 'flashcard' | 'quiz' | 'spelling' | 'word-family' | 'cloze') => void;
  onSelectSet?: (setId: string) => void;
}

export const VocabList: React.FC<VocabListProps> = ({
  words,
  activeSet,
  onBack,
  onSelectWord,
  onToggleBookmark,
  onToggleUnlearned,
  onDeleteWord,
  onOpenAddWord,
  onOpenAiBoosterForWord,
  onOpenBatchImport,
  onOpenExcelImport,
  onStartMode,
  onSelectSet,
}) => {
  const isVirtualAllSet =
    activeSet.id === 'all-words-library' ||
    activeSet.id === 'all-words' ||
    activeSet.title.toLowerCase().includes('toàn bộ');

  const currentSetCount = useMemo(
    () => words.filter((w) => w.sourceSetId === activeSet.id).length,
    [words, activeSet.id]
  );

  const [scope, setScope] = useState<'current-set' | 'all-words'>(
    isVirtualAllSet || currentSetCount === 0 ? 'all-words' : 'all-words'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMastery, setFilterMastery] = useState<string>('all');
  const [filterBand, setFilterBand] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState<number>(48);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchDurationMs, setSearchDurationMs] = useState<number>(1);

  // Sync scope if activeSet changed externally
  useEffect(() => {
    if (isVirtualAllSet || currentSetCount === 0) {
      setScope('all-words');
    }
  }, [activeSet.id, isVirtualAllSet, currentSetCount]);

  const baseWords = useMemo(() => {
    if (scope === 'all-words' || isVirtualAllSet) {
      return words;
    }
    const filtered = words.filter((w) => w.sourceSetId === activeSet.id);
    return filtered.length > 0 ? filtered : words;
  }, [scope, words, activeSet.id, isVirtualAllSet]);

  // Build high-speed search index when dataset changes
  useEffect(() => {
    globalSearchEngine.buildIndex(baseWords);
  }, [baseWords]);

  const now = Date.now();

  // Compute status counts for quick-filter tabs
  const unlearnedCount = useMemo(() => baseWords.filter((w) => w.isUnlearned).length, [baseWords]);
  const bookmarkedCount = useMemo(() => baseWords.filter((w) => w.isBookmarked).length, [baseWords]);
  const dueCount = useMemo(
    () => baseWords.filter((w) => w.nextReviewDate <= now || w.mastery === 'new').length,
    [baseWords, now]
  );
  const masteredCount = useMemo(() => baseWords.filter((w) => w.mastery === 'mastered').length, [baseWords]);
  const reviewingCount = useMemo(() => baseWords.filter((w) => w.mastery === 'reviewing').length, [baseWords]);
  const learningCount = useMemo(() => baseWords.filter((w) => w.mastery === 'learning').length, [baseWords]);
  const newCount = useMemo(() => baseWords.filter((w) => w.mastery === 'new').length, [baseWords]);

  // Execute ultra-fast indexed search & filtering
  const filteredWords = useMemo(() => {
    const startTime = performance.now();
    const isUnlearned = filterMastery === 'unlearned';
    const isBookmarked = filterMastery === 'bookmarked';
    const isDue = filterMastery === 'due';
    const effectiveMastery = isUnlearned || isBookmarked || isDue ? undefined : filterMastery;

    const results = globalSearchEngine.search({
      query: searchQuery,
      topic: filterTopic,
      mastery: effectiveMastery,
      targetBand: filterBand,
      onlyBookmarked: isBookmarked,
      onlyUnlearned: isUnlearned,
      onlyDue: isDue,
    });
    const endTime = performance.now();
    setSearchDurationMs(Math.max(1, Math.round(endTime - startTime)));
    return results;
  }, [baseWords, searchQuery, filterTopic, filterMastery, filterBand]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTopic, filterMastery, filterBand, scope, itemsPerPage]);

  // Find distinct topics available in base words
  const availableTopics: string[] = useMemo(() => {
    return Array.from(
      new Set(
        baseWords
          .map((w) => (w.topic?.trim() || 'Học thuật tổng hợp') as string)
          .filter((t): t is string => Boolean(t))
      )
    );
  }, [baseWords]);

  // Topic Statistics & Mastery Analysis
  const topicStats = useMemo(() => {
    return availableTopics.map((topicName) => {
      const topicWords = baseWords.filter(
        (w) => (w.topic?.trim() || 'Học thuật tổng hợp') === topicName
      );
      const mastered = topicWords.filter((w) => w.mastery === 'mastered').length;
      const unlearned = topicWords.filter((w) => w.isUnlearned).length;
      const due = topicWords.filter((w) => w.nextReviewDate <= now || w.mastery === 'new').length;
      const percent = topicWords.length > 0 ? Math.round((mastered / topicWords.length) * 100) : 0;
      const info = getTopicInfo(topicName);
      return {
        name: topicName,
        total: topicWords.length,
        mastered,
        unlearned,
        due,
        percent,
        info,
      };
    }).sort((a, b) => b.total - a.total);
  }, [availableTopics, baseWords, now]);

  const [showAllTopicsModal, setShowAllTopicsModal] = useState<boolean>(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState<string>('');

  // Pagination for large dataset (1500+ words)
  const totalPages = Math.ceil(filteredWords.length / itemsPerPage) || 1;
  const paginatedWords = filteredWords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const headers = ['Term', 'IPA', 'Meaning', 'Word Family', 'Synonyms', 'Example', 'Topic', 'Band', 'Mastery', 'Is Unlearned'];
    const rows = filteredWords.map((w) => [
      `"${w.term.replace(/"/g, '""')}"`,
      `"${(w.ipa || '').replace(/"/g, '""')}"`,
      `"${w.meaning.replace(/"/g, '""')}"`,
      `"${(w.wordFamily || '').replace(/"/g, '""')}"`,
      `"${(w.synonyms || '').replace(/"/g, '""')}"`,
      `"${(w.example || '').replace(/"/g, '""')}"`,
      `"${(w.topic || '').replace(/"/g, '""')}"`,
      `"${w.targetIeltsBand || '7.5'}"`,
      `"${w.mastery}"`,
      `"${w.isUnlearned ? 'Yes' : 'No'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IELTS_Vocab_${scope === 'current-set' ? activeSet.title : 'All_Repository'}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HEADER BAR                                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-[#21262D] hover:bg-[#2D3135] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors cursor-pointer shadow-sm"
            title="Quay lại Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 flex-wrap">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <span>Kho Từ Vựng IELTS Học Thuật</span>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                {words.length} từ trong hệ thống
              </span>
            </h1>
            <p className="text-xs text-[#8B949E] flex items-center gap-2 mt-1 flex-wrap">
              <span>Đang hiển thị {filteredWords.length} / {baseWords.length} từ vựng</span>
              {unlearnedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <Flag className="w-3 h-3 fill-rose-400" /> {unlearnedCount} từ chưa thuộc
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenExcelImport || onOpenBatchImport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all shadow-md cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" /> Nạp Excel / CSV
          </button>

          <button
            onClick={handleExportCSV}
            title="Xuất file CSV sao lưu"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Xuất CSV
          </button>

          <button
            onClick={onOpenAddWord}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm từ
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SCOPE SELECTOR & QUICK STUDY DRILL LAUNCHER                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#16191D] p-3.5 rounded-2xl border border-[#2D3135]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setScope('all-words');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scope === 'all-words'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Toàn bộ kho từ vựng ({words.length} từ)</span>
          </button>

          {activeSet && activeSet.id !== 'all-words-library' && (
            <button
              onClick={() => {
                setScope('current-set');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scope === 'current-set'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bộ đang chọn: {activeSet.title} ({words.filter((w) => w.sourceSetId === activeSet.id).length} từ)</span>
            </button>
          )}
        </div>

        {onStartMode && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <span className="text-[11px] font-bold text-[#8E97A4] mr-1">Luyện tập nhanh:</span>
            <button
              onClick={() => {
                if (onSelectSet && scope === 'all-words') onSelectSet('all-words-library');
                onStartMode('flashcard');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Flashcard</span>
            </button>
            <button
              onClick={() => {
                if (onSelectSet && scope === 'all-words') onSelectSet('all-words-library');
                onStartMode('quiz');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Trắc nghiệm</span>
            </button>
            <button
              onClick={() => {
                if (onSelectSet && scope === 'all-words') onSelectSet('all-words-library');
                onStartMode('spelling');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Chính tả</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. QUICK STATUS FILTER TABS (All / Chưa Thuộc / Gắn Sao / SRS Due / Mastered) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {/* Tất cả */}
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMastery('all');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterMastery === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-[#16191D] text-slate-400 hover:text-white border border-[#2D3135]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tất Cả ({baseWords.length})</span>
        </button>

        {/* 🚩 Chưa thuộc (Icon Button Filter) */}
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMastery(filterMastery === 'unlearned' ? 'all' : 'unlearned');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterMastery === 'unlearned'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/40'
              : unlearnedCount > 0
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
              : 'bg-[#16191D] text-slate-400 hover:text-rose-300 border border-[#2D3135]'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${unlearnedCount > 0 || filterMastery === 'unlearned' ? 'fill-rose-400' : ''}`} />
          <span>Chưa Thuộc</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
            filterMastery === 'unlearned' ? 'bg-black/30 text-white' : 'bg-rose-500/20 text-rose-300'
          }`}>
            {unlearnedCount}
          </span>
        </button>

        {/* ⭐ Đã gắn sao */}
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMastery(filterMastery === 'bookmarked' ? 'all' : 'bookmarked');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterMastery === 'bookmarked'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
              : 'bg-[#16191D] text-slate-400 hover:text-amber-300 border border-[#2D3135]'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${bookmarkedCount > 0 || filterMastery === 'bookmarked' ? 'fill-amber-400' : ''}`} />
          <span>Gắn Sao ({bookmarkedCount})</span>
        </button>

        {/* ⏰ Cần ôn tập ngay (SRS Due) */}
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMastery(filterMastery === 'due' ? 'all' : 'due');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterMastery === 'due'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-[#16191D] text-slate-400 hover:text-purple-300 border border-[#2D3135]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Cần Ôn SRS ({dueCount})</span>
        </button>

        {/* 🟢 Thuần thục (Mastered) */}
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMastery(filterMastery === 'mastered' ? 'all' : 'mastered');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterMastery === 'mastered'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-[#16191D] text-slate-400 hover:text-emerald-300 border border-[#2D3135]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã Thuộc ({masteredCount})</span>
        </button>

        {/* 🟡 Đang ôn (Reviewing) */}
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMastery(filterMastery === 'reviewing' ? 'all' : 'reviewing');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterMastery === 'reviewing'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-[#16191D] text-slate-400 hover:text-indigo-300 border border-[#2D3135]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đang Ôn ({reviewingCount})</span>
        </button>

        {/* 🔵 Đang học (Learning) */}
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMastery(filterMastery === 'learning' ? 'all' : 'learning');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterMastery === 'learning'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#16191D] text-slate-400 hover:text-blue-300 border border-[#2D3135]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Đang Học ({learningCount})</span>
        </button>

        {/* 🆕 Từ mới (New) */}
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMastery(filterMastery === 'new' ? 'all' : 'new');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterMastery === 'new'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-[#16191D] text-slate-400 hover:text-white border border-[#2D3135]'
          }`}
        >
          <Sparkle className="w-3.5 h-3.5" />
          <span>Từ Mới ({newCount})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEARCH AND ADVANCED FILTERS BAR                                       */}
      {/* ========================================================================= */}
      <div className="bg-[#16191D] p-4 sm:p-5 rounded-3xl border border-[#2D3135] shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-indigo-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm từ tiếng Anh, nghĩa tiếng Việt, từ đồng nghĩa hoặc chủ đề..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#21262D] border border-[#30363D] text-white text-sm placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Topic Filter Dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 bg-[#21262D] border border-[#30363D] rounded-2xl px-3.5 py-2.5">
              <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
              <select
                value={filterTopic}
                onChange={(e) => {
                  setFilterTopic(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="bg-[#21262D]">Tất cả chủ đề ({availableTopics.length})</option>
                {availableTopics.map((topicName, idx) => {
                  const info = getTopicInfo(topicName);
                  return (
                    <option key={idx} value={topicName} className="bg-[#21262D]">
                      {info.icon} {topicName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Band Filter */}
            <select
              value={filterBand}
              onChange={(e) => {
                setFilterBand(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#21262D] border border-[#30363D] text-white text-xs font-bold rounded-2xl px-3.5 py-3 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Tất cả Band IELTS</option>
              <option value="8.5">Band 8.5+</option>
              <option value="8.0">Band 8.0</option>
              <option value="7.5">Band 7.5</option>
              <option value="7.0">Band 7.0</option>
              <option value="6.5">Band 6.5</option>
              <option value="6.0">Band 6.0</option>
            </select>
          </div>
        </div>

        {/* Quick Topic Chips Filter & Topic Picker Hub Button */}
        {availableTopics.length > 1 && (
          <div className="space-y-2 pt-2 border-t border-[#2D3135]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Chủ đề từ vựng:</span>
                {filterTopic !== 'all' && (
                  <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                    Đang chọn: {filterTopic} ({filteredWords.length} từ)
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowAllTopicsModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Xem tất cả {availableTopics.length} chủ đề & Luyện tập</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setFilterTopic('all');
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterTopic === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                    : 'bg-[#21262D] text-slate-300 hover:text-white border border-[#30363D]'
                }`}
              >
                Tất cả ({baseWords.length})
              </button>
              {availableTopics.slice(0, 10).map((tName, i) => {
                const info = getTopicInfo(tName);
                const count = baseWords.filter(
                  (w) => (w.topic?.trim() || 'Học thuật tổng hợp') === tName
                ).length;
                const isSelected = filterTopic === tName;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      sounds.playClick();
                      setFilterTopic(filterTopic === tName ? 'all' : tName);
                      setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? `${info.badgeBg} ${info.badgeBorder} ${info.badgeText} ring-2 ring-indigo-500 shadow-md`
                        : 'bg-[#21262D] border-[#30363D] text-slate-300 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span>{tName}</span>
                    <span className="text-[11px] opacity-80 font-mono">({count})</span>
                  </button>
                );
              })}
              {availableTopics.length > 10 && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setShowAllTopicsModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1C2025] hover:bg-[#262C34] text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer"
                >
                  <span>+{availableTopics.length - 10} chủ đề khác</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Topic Practice Bar (When a specific topic is active) */}
      {filterTopic !== 'all' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#1C1F26] to-purple-950/30 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xl shrink-0">
              {getTopicInfo(filterTopic).icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  Chủ đề: {filterTopic}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  {filteredWords.length} từ vựng
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Bạn đang lọc các từ vựng thuộc chủ đề này. Chọn chế độ luyện tập bên phải để học ngay!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onStartMode && (
              <>
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (onSelectSet && scope === 'all-words') onSelectSet('all-words-library');
                    onStartMode('flashcard');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Học Flashcard</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (onSelectSet && scope === 'all-words') onSelectSet('all-words-library');
                    onStartMode('quiz');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Làm Trắc Nghiệm</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (onSelectSet && scope === 'all-words') onSelectSet('all-words-library');
                    onStartMode('spelling');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Gõ Chính Tả</span>
                </button>
              </>
            )}
            <button
              onClick={() => {
                sounds.playClick();
                setFilterTopic('all');
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-slate-300 hover:text-white border border-[#30363D] text-xs font-bold transition-all cursor-pointer"
              title="Bỏ lọc chủ đề này"
            >
              ✕ Bỏ lọc
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. UNLEARNED NOTICE BANNER (When viewing 'unlearned' filter)               */}
      {/* ========================================================================= */}
      {filterMastery === 'unlearned' && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <Flag className="w-4 h-4 fill-rose-400" />
            </div>
            <div>
              <span className="font-bold text-white block">
                Danh sách {filteredWords.length} từ vựng được đánh dấu "CHƯA THUỘC"
              </span>
              <span className="text-slate-300">
                Nhấn vào icon lá cờ <Flag className="w-3 h-3 inline fill-rose-400 text-rose-400 mx-0.5" /> trên mỗi thẻ để bỏ đánh dấu khi bạn đã ghi nhớ từ này.
              </span>
            </div>
          </div>

          {onStartMode && filteredWords.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onStartMode('flashcard')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Luyện Flashcard Từ Này</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VOCABULARY CARDS GRID                                                 */}
      {/* ========================================================================= */}
      {filteredWords.length === 0 ? (
        <div className="bg-[#16191D] rounded-3xl p-12 text-center border border-[#2D3135] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {filterMastery === 'unlearned' ? <Flag className="w-7 h-7 text-rose-400" /> : <BookOpen className="w-7 h-7 text-indigo-400" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {filterMastery === 'unlearned'
                ? 'Tuyệt vời! Bạn chưa có từ nào bị đánh dấu chưa thuộc.'
                : 'Không tìm thấy từ vựng nào phù hợp bộ lọc.'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {filterMastery === 'unlearned'
                ? 'Nhấn vào icon lá cờ (Flag) trên bất kỳ từ nào để đánh dấu cần học lại.'
                : 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterMastery('all');
              setFilterBand('all');
              setFilterTopic('all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Hiển thị toàn bộ từ vựng
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {paginatedWords.map((item, idx) => {
              const topicInfo = getTopicInfo(item.topic);
              const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectWord(item)}
                  className={`group bg-[#16191D] p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 shadow-xl relative overflow-hidden ${
                    item.isUnlearned
                      ? 'border-rose-500/50 hover:border-rose-500 bg-gradient-to-b from-[#1E1719] to-[#16191D]'
                      : 'border-[#2D3135] hover:border-indigo-500/80 hover:bg-[#1E2228]'
                  }`}
                >
                  {/* Top: Index, Term, IPA, Band & Bookmark / Unlearned Buttons */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-indigo-400">#{globalIndex}</span>
                          {item.isUnlearned && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase flex items-center gap-1 shadow-xs animate-fadeIn">
                              <Flag className="w-3 h-3 fill-rose-400 text-rose-400" /> Chưa thuộc
                            </span>
                          )}
                          {item.isBookmarked && !item.isUnlearned && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              ⭐ Gắn sao
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-300 transition-colors truncate mt-1">
                          {item.term}
                        </h3>

                        {item.ipa && (
                          <div className="text-sm text-indigo-300 font-mono font-medium mt-0.5">{item.ipa}</div>
                        )}
                      </div>

                      {/* Icon Actions Bar */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* 🔊 Audio */}
                        <button
                          onClick={() => speakWord(item.term)}
                          className="p-2 rounded-xl text-indigo-300 hover:text-white hover:bg-indigo-600 transition-colors cursor-pointer"
                          title="Phát âm chuẩn IPA"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* 🚩 ĐÁNH DẤU CHƯA THUỘC (UNLEARNED ICON TOGGLE) */}
                        <button
                          onClick={() => {
                            sounds.playClick();
                            if (onToggleUnlearned) {
                              onToggleUnlearned(item.id);
                            }
                          }}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            item.isUnlearned
                              ? 'text-rose-400 bg-rose-500/20 border border-rose-500/50 shadow-md shadow-rose-500/20 ring-1 ring-rose-500/40'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent'
                          }`}
                          title={
                            item.isUnlearned
                              ? 'Đã đánh dấu CHƯA THUỘC (Nhấn để bỏ đánh dấu)'
                              : 'Đánh dấu từ này là CHƯA THUỘC'
                          }
                        >
                          <Flag className={`w-4 h-4 ${item.isUnlearned ? 'fill-rose-400 text-rose-400' : ''}`} />
                        </button>

                        {/* ⭐ Bookmark Star */}
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onToggleBookmark(item.id);
                          }}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            item.isBookmarked
                              ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                              : 'text-slate-400 hover:text-amber-400 hover:bg-[#21262D]'
                          }`}
                          title="Gắn sao từ quan trọng"
                        >
                          <Star className={`w-4 h-4 ${item.isBookmarked ? 'fill-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Meaning */}
                    <p className="text-base font-bold text-slate-100 line-clamp-2 mt-3 leading-relaxed">
                      {item.meaning}
                    </p>

                    {/* Example & Family */}
                    {item.example && (
                      <p className="text-sm text-slate-300 italic font-serif mt-2 line-clamp-2 leading-relaxed bg-[#21262D]/60 p-2.5 rounded-xl border border-[#30363D]/60">
                        "{item.example}"
                      </p>
                    )}

                    {/* Word Family & Synonyms */}
                    {(item.wordFamily || item.synonyms) && (
                      <div className="mt-3 space-y-1 text-xs">
                        {item.wordFamily && (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-amber-400 font-bold shrink-0">Family:</span>
                            <span className="truncate text-amber-200 font-medium">{item.wordFamily}</span>
                          </div>
                        )}
                        {item.synonyms && (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-emerald-400 font-bold shrink-0">Synonyms:</span>
                            <span className="truncate text-emerald-200 font-medium">{item.synonyms}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Meta Badges */}
                  <div className="pt-3 border-t border-[#2D3135] flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border font-bold truncate text-[11px] ${topicInfo.badgeBg} ${topicInfo.badgeBorder} ${topicInfo.badgeText}`}
                      >
                        {topicInfo.icon} {item.topic || 'Học thuật'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold text-[11px]">
                        Band {item.targetIeltsBand || '7.5'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenAiBoosterForWord(item)}
                        className="p-2 rounded-xl text-purple-400 hover:bg-purple-500/20 cursor-pointer"
                        title="Mở rộng từ vựng bằng AI"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteWord(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        title="Xóa từ khỏi danh sách"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 7. PAGINATION CONTROLS                                                    */}
          {/* ========================================================================= */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#16191D] rounded-2xl border border-[#2D3135] text-xs gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[#8B949E]">
                  Trang <strong>{currentPage}</strong> / {totalPages} (Tổng {filteredWords.length} từ)
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono">
                  <Zap className="w-3 h-3 text-amber-400" /> {searchDurationMs}ms (Search Index)
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1 text-[#8B949E] text-xs">
                  <span>Hiển thị:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-[#21262D] border border-[#30363D] text-white text-xs rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
                  >
                    <option value={24}>24 từ</option>
                    <option value={48}>48 từ</option>
                    <option value={96}>96 từ</option>
                    <option value={192}>192 từ</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-xl bg-[#21262D] hover:bg-[#2D3135] text-white disabled:opacity-40 disabled:pointer-events-none border border-[#30363D] cursor-pointer"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      pageNum = Math.min(Math.max(1, currentPage - 2) + i, totalPages);
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-xl bg-[#21262D] hover:bg-[#2D3135] text-white disabled:opacity-40 disabled:pointer-events-none border border-[#30363D] cursor-pointer"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TOPIC BROWSER & STUDY SELECTOR MODAL (Chọn chủ đề từ vựng muốn học)   */}
      {/* ========================================================================= */}
      {showAllTopicsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#16191D] border border-[#2D3135] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2D3135] flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-[#16191D] to-[#16191D]">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Chọn Chủ Đề Từ Vựng Muốn Học
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal">
                      {topicStats.length} Chủ đề
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Khám phá kho từ vựng theo từng chủ đề IELTS chuyên sâu hoặc bắt đầu luyện tập ngay.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllTopicsModal(false)}
                className="p-2 rounded-xl bg-[#21262D] hover:bg-[#2D3135] text-slate-400 hover:text-white border border-[#30363D] transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Search & Quick Actions */}
            <div className="p-4 border-b border-[#2D3135] bg-[#1A1D23] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={topicSearchQuery}
                  onChange={(e) => setTopicSearchQuery(e.target.value)}
                  placeholder="Tìm chủ đề..."
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setFilterTopic('all');
                    setShowAllTopicsModal(false);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterTopic === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#21262D] text-slate-300 hover:text-white border border-[#30363D]'
                  }`}
                >
                  Tất cả ({baseWords.length} từ)
                </button>
              </div>
            </div>

            {/* Modal Topics Grid */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {topicStats
                  .filter((t) =>
                    t.name.toLowerCase().includes(topicSearchQuery.toLowerCase()) ||
                    t.info.category.toLowerCase().includes(topicSearchQuery.toLowerCase())
                  )
                  .map((topicItem) => {
                    const isSelected = filterTopic === topicItem.name;
                    return (
                      <div
                        key={topicItem.name}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40'
                            : 'bg-[#21262D]/60 hover:bg-[#21262D] border-[#30363D] hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{topicItem.info.icon}</span>
                              <div>
                                <h4 className="font-bold text-white text-sm leading-tight">
                                  {topicItem.name}
                                </h4>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                  {topicItem.info.category}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 shrink-0">
                              {topicItem.total} từ
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Đã thuộc: {topicItem.mastered}/{topicItem.total}</span>
                              <span className="font-bold text-emerald-400">{topicItem.percent}%</span>
                            </div>
                            <div className="w-full bg-[#16191D] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${topicItem.percent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions for this Topic */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#2D3135]/60">
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setFilterTopic(topicItem.name);
                              setShowAllTopicsModal(false);
                              setCurrentPage(1);
                            }}
                            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-[#16191D] hover:bg-[#2B313A] text-slate-200 border border-[#3A414D]'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{isSelected ? 'Đang chọn' : 'Lọc từ vựng'}</span>
                          </button>

                          {onStartMode && (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setFilterTopic(topicItem.name);
                                setShowAllTopicsModal(false);
                                if (onSelectSet && scope === 'all-words') onSelectSet('all-words-library');
                                onStartMode('flashcard');
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Học ngay với Flashcard"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Học Flashcard</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#2D3135] bg-[#16191D] flex items-center justify-between text-xs text-slate-400">
              <span>Mẹo: Bạn có thể chọn bất kỳ chủ đề nào để lọc hoặc ấn "Học Flashcard" để vào ôn tập nhanh.</span>
              <button
                onClick={() => setShowAllTopicsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
