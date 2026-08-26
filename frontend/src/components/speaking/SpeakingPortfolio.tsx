import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  Star,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Award,
  Calendar,
  Clock,
  Volume2,
  BarChart3,
  FileText,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ArrowLeft,
  Split,
  BookOpen,
  Headphones,
  Zap,
  Edit3,
  Save,
  X,
  Share2,
  Gauge,
  Activity,
  ShieldCheck,
  Target,
} from 'lucide-react';
import {
  SpeakingPortfolioItem,
  SpeakingEvaluationResult,
  QuickSpeakingDrillEvaluationResult,
  ShadowingEvaluationResult,
  WordSet,
  VocabItem,
  UserProgress,
} from '../../types';
import {
  loadSpeakingPortfolio,
  deleteSpeakingPortfolioItem,
  toggleSpeakingPortfolioFavorite,
  updateSpeakingPortfolioNotes,
} from '../../utils/speakingStorage';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration } from '../../utils/confetti';
import { MandatoryVocabReport } from './MandatoryVocabChallenge';
import { SilenceAndFillerAdvisor } from './WpmSpeechRateMeter';

interface SpeakingPortfolioProps {
  words: VocabItem[];
  activeSet: WordSet;
  progress: UserProgress;
  onBack: () => void;
  onStartSpeakingMode: (mode: 'speaking' | 'speaking-part2' | 'quick-speaking-drill' | 'shadowing') => void;
  userId?: string;
}

export const SpeakingPortfolio: React.FC<SpeakingPortfolioProps> = ({
  words,
  activeSet,
  progress,
  onBack,
  onStartSpeakingMode,
  userId = 'guest',
}) => {
  const [items, setItems] = useState<SpeakingPortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Chart view mode: Confidence Score Tracker vs 4 Cambridge Criteria
  const [chartViewMode, setChartViewMode] = useState<'confidence' | 'criteria'>('confidence');
  const [confidenceMetricFilter, setConfidenceMetricFilter] = useState<'all' | 'composite' | 'pronunciation' | 'fluency'>('all');

  // Filters and search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [selectedPartFilter, setSelectedPartFilter] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [timeframeFilter, setTimeframeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [activeCriterionTab, setActiveCriterionTab] = useState<'all' | 'fluency' | 'lexical' | 'grammar' | 'pronunciation' | 'overall'>('all');

  // Audio Playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [audioProgress, setAudioProgress] = useState<{ [id: string]: { current: number; duration: number } }>({});
  const audioElementsRef = useRef<{ [id: string]: HTMLAudioElement }>({});

  // Inspection Modal & Comparison Modal
  const [inspectingItem, setInspectingItem] = useState<SpeakingPortfolioItem | null>(null);
  const [comparisonA, setComparisonA] = useState<SpeakingPortfolioItem | null>(null);
  const [comparisonB, setComparisonB] = useState<SpeakingPortfolioItem | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Notes editing inline state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');

  // Hovered point on chart
  const [hoveredPoint, setHoveredPoint] = useState<SpeakingPortfolioItem | null>(null);

  // Load items on mount / userId change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    loadSpeakingPortfolio(userId).then((loaded) => {
      if (isMounted) {
        setItems(loaded);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
      // Cleanup any playing audio
      Object.values(audioElementsRef.current).forEach((aud: HTMLAudioElement) => {
        if (aud) {
          aud.pause();
          aud.src = '';
        }
      });
    };
  }, [userId]);

  // Filter items by search, mode, favorites, and time
  const filteredItems = useMemo(() => {
    const now = Date.now();
    return items.filter((item) => {
      // Timeframe
      if (timeframeFilter === '7d' && now - item.timestamp > 7 * 86400000) return false;
      if (timeframeFilter === '30d' && now - item.timestamp > 30 * 86400000) return false;
      if (timeframeFilter === '90d' && now - item.timestamp > 90 * 86400000) return false;

      // Mode
      if (selectedModeFilter !== 'all' && item.mode !== selectedModeFilter) return false;

      // Part
      if (selectedPartFilter !== 'all') {
        if (selectedPartFilter === 'part1' && item.part !== 1 && item.part !== 'drill') return false;
        if (selectedPartFilter === 'part2' && item.part !== 2) return false;
        if (selectedPartFilter === 'part3' && item.part !== 3) return false;
      }

      // Favorites
      if (onlyFavorites && !item.isFavorite) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inQuestion = item.question?.toLowerCase().includes(q);
        const inTopic = item.topic?.toLowerCase().includes(q);
        const inTranscript = item.transcript?.toLowerCase().includes(q);
        const inNotes = item.notes?.toLowerCase().includes(q);
        const inVocab = item.targetWordsUsed?.some((w) => w.toLowerCase().includes(q));
        if (!inQuestion && !inTopic && !inTranscript && !inNotes && !inVocab) return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedModeFilter, selectedPartFilter, onlyFavorites, timeframeFilter]);

  // Chronological list for trend chart (oldest to newest)
  const chronologicalItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredItems]);

  // Helper to compute Confidence Score metrics for each item
  const calculateItemConfidence = (item: SpeakingPortfolioItem) => {
    const pron = item.criteriaScores?.pronunciation || item.overallBand || 6.0;
    const flu = item.criteriaScores?.fluency || item.overallBand || 6.0;
    
    const pronPct = Math.round((pron / 9.0) * 100);
    const fluPct = Math.round((flu / 9.0) * 100);
    
    // Composite Confidence Score (50% Pronunciation Clarity + 50% Fluency & Flow)
    let composite = Math.round((pronPct * 0.5 + fluPct * 0.5));
    
    // Slight bonus if WPM is in the golden zone (125-165 WPM)
    const wpm = item.criteriaScores?.wordsPerMinute;
    if (wpm && wpm >= 125 && wpm <= 165) {
      composite = Math.min(99, composite + 2);
    }
    
    // Clamp to realistic range
    composite = Math.max(30, Math.min(99, composite));

    let tierLabel = 'Cần luyện thêm';
    let tierColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    if (composite >= 85) {
      tierLabel = 'Tự Tin Cao Độ (Band 7.5+)';
      tierColor = 'text-emerald-300 border-emerald-500/30 bg-emerald-500/15';
    } else if (composite >= 72) {
      tierLabel = 'Tự Tin Vững Vàng (Band 6.5 - 7.0)';
      tierColor = 'text-indigo-300 border-indigo-500/30 bg-indigo-500/15';
    } else if (composite >= 58) {
      tierLabel = 'Đang Tăng Tiến (Band 5.5 - 6.0)';
      tierColor = 'text-amber-300 border-amber-500/30 bg-amber-500/15';
    }

    return {
      composite,
      pronPct,
      fluPct,
      pronBand: pron,
      fluBand: flu,
      wpm: wpm || null,
      tierLabel,
      tierColor,
    };
  };

  // Aggregate Metrics & Confidence Metrics
  const metrics = useMemo(() => {
    if (items.length === 0) {
      return {
        avgBand: 0,
        peakBand: 0,
        totalSeconds: 0,
        totalCount: 0,
        avgFluency: 0,
        avgLexical: 0,
        avgGrammar: 0,
        avgPron: 0,
        bandGrowth: 0,
        targetWordsTotalUsed: 0,
        // Confidence analytics
        currentConfidence: 65,
        startingConfidence: 60,
        confidenceGrowth: 0,
        avgPronConfidence: 65,
        avgFluencyConfidence: 65,
        peakConfidence: 65,
        highConfidenceCount: 0,
      };
    }

    const totalCount = items.length;
    const totalBand = items.reduce((acc, i) => acc + i.overallBand, 0);
    const peakBand = Math.max(...items.map((i) => i.overallBand));
    const totalSeconds = items.reduce((acc, i) => acc + (i.durationSeconds || 0), 0);

    const avgFluency = items.reduce((acc, i) => acc + i.criteriaScores.fluency, 0) / totalCount;
    const avgLexical = items.reduce((acc, i) => acc + i.criteriaScores.lexical, 0) / totalCount;
    const avgGrammar = items.reduce((acc, i) => acc + i.criteriaScores.grammar, 0) / totalCount;
    const avgPron = items.reduce((acc, i) => acc + i.criteriaScores.pronunciation, 0) / totalCount;

    const targetWordsTotalUsed = items.reduce((acc, i) => acc + (i.targetWordsUsed?.length || 0), 0);

    // Calculate growth: Earliest recorded vs latest recorded
    const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
    const earliest = sorted[0]?.overallBand || 5.5;
    const latest = sorted[sorted.length - 1]?.overallBand || earliest;
    const bandGrowth = Math.round((latest - earliest) * 10) / 10;

    // Confidence Metrics
    const confScores = sorted.map((item) => calculateItemConfidence(item));
    const startingConfidence = confScores[0]?.composite || 60;
    const currentConfidence = confScores[confScores.length - 1]?.composite || startingConfidence;
    const confidenceGrowth = currentConfidence - startingConfidence;
    const peakConfidence = Math.max(...confScores.map((c) => c.composite));
    const highConfidenceCount = confScores.filter((c) => c.composite >= 75).length;
    const avgPronConfidence = Math.round((avgPron / 9.0) * 100);
    const avgFluencyConfidence = Math.round((avgFluency / 9.0) * 100);

    return {
      avgBand: Math.round((totalBand / totalCount) * 10) / 10,
      peakBand,
      totalSeconds,
      totalCount,
      avgFluency: Math.round(avgFluency * 10) / 10,
      avgLexical: Math.round(avgLexical * 10) / 10,
      avgGrammar: Math.round(avgGrammar * 10) / 10,
      avgPron: Math.round(avgPron * 10) / 10,
      bandGrowth,
      targetWordsTotalUsed,
      currentConfidence,
      startingConfidence,
      confidenceGrowth,
      avgPronConfidence,
      avgFluencyConfidence,
      peakConfidence,
      highConfidenceCount,
    };
  }, [items]);

  // Audio Playback Controller
  const handleTogglePlay = (item: SpeakingPortfolioItem) => {
    sounds.playClick();

    if (playingId === item.id) {
      // Pause
      const currentAud = audioElementsRef.current[item.id];
      if (currentAud) {
        currentAud.pause();
      }
      setPlayingId(null);
      return;
    }

    // Stop currently playing
    if (playingId && audioElementsRef.current[playingId]) {
      audioElementsRef.current[playingId].pause();
    }

    // Setup or get audio
    let audio = audioElementsRef.current[item.id];
    const src = item.audioUrl || (item.audioBlob ? URL.createObjectURL(item.audioBlob) : null);

    if (!src) {
      // Fallback: Use speech synthesis to read transcript if no recorded media blob exists
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(item.transcript);
        utter.rate = playbackSpeed;
        utter.lang = 'en-US';
        utter.onend = () => setPlayingId(null);
        window.speechSynthesis.speak(utter);
        setPlayingId(item.id);
      }
      return;
    }

    if (!audio) {
      audio = new Audio(src);
      audioElementsRef.current[item.id] = audio;

      audio.ontimeupdate = () => {
        setAudioProgress((prev) => ({
          ...prev,
          [item.id]: {
            current: audio.currentTime,
            duration: audio.duration || item.durationSeconds || 30,
          },
        }));
      };

      audio.onended = () => {
        setPlayingId(null);
      };
    }

    audio.playbackRate = playbackSpeed;
    audio.play().catch(() => {
      // Fallback
    });
    setPlayingId(item.id);
  };

  const handleSeek = (itemId: string, timeSec: number) => {
    const audio = audioElementsRef.current[itemId];
    if (audio) {
      audio.currentTime = timeSec;
      setAudioProgress((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          current: timeSec,
        },
      }));
    }
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playingId && audioElementsRef.current[playingId]) {
      audioElementsRef.current[playingId].playbackRate = speed;
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const updated = await toggleSpeakingPortfolioFavorite(id, userId);
    setItems([...updated]);
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi âm này khỏi kho lưu trữ?')) return;
    sounds.playClick();
    const updated = await deleteSpeakingPortfolioItem(id, userId);
    setItems([...updated]);
    if (inspectingItem?.id === id) setInspectingItem(null);
  };

  const handleSaveNotes = async (id: string) => {
    sounds.playClick();
    const updated = await updateSpeakingPortfolioNotes(id, notesDraft, userId);
    setItems([...updated]);
    setEditingNotesId(null);
  };

  // Open side-by-side comparison
  const handleOpenComparison = (itemB: SpeakingPortfolioItem) => {
    // Default Attempt A is the earliest recording, Attempt B is the current selected one
    const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
    const firstItem = sorted[0];
    setComparisonA(firstItem && firstItem.id !== itemB.id ? firstItem : items[items.length - 1]);
    setComparisonB(itemB);
    setIsCompareModalOpen(true);
  };

  // SVG Chart Dimensions
  const chartWidth = 900;
  const chartHeight = 260;
  const padding = { top: 30, right: 30, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Criteria Band Chart scale
  const minBandY = 4.5;
  const maxBandY = 9.0;

  const getY = (band: number) => {
    const clamped = Math.max(minBandY, Math.min(maxBandY, band));
    return padding.top + innerHeight - ((clamped - minBandY) / (maxBandY - minBandY)) * innerHeight;
  };

  // Confidence Score Chart scale (0 - 100%)
  const minConfY = 30;
  const maxConfY = 100;

  const getConfY = (score: number) => {
    const clamped = Math.max(minConfY, Math.min(maxConfY, score));
    return padding.top + innerHeight - ((clamped - minConfY) / (maxConfY - minConfY)) * innerHeight;
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (total - 1)) * innerWidth;
  };

  const generateLinePath = (getter: (item: SpeakingPortfolioItem) => number) => {
    if (chronologicalItems.length === 0) return '';
    return chronologicalItems
      .map((item, idx) => {
        const x = getX(idx, chronologicalItems.length);
        const y = getY(getter(item));
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const generateConfidenceLinePath = (getter: (item: SpeakingPortfolioItem) => number) => {
    if (chronologicalItems.length === 0) return '';
    return chronologicalItems
      .map((item, idx) => {
        const x = getX(idx, chronologicalItems.length);
        const y = getConfY(getter(item));
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const generateConfidenceAreaPath = (getter: (item: SpeakingPortfolioItem) => number) => {
    if (chronologicalItems.length === 0) return '';
    const bottomY = padding.top + innerHeight;
    const points = chronologicalItems.map((item, idx) => {
      const x = getX(idx, chronologicalItems.length);
      const y = getConfY(getter(item));
      return { x, y };
    });

    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const lineCommands = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return `${lineCommands} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const formatDurationMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}p ${s < 10 ? '0' : ''}${s}s`;
  };

  const getBandBadgeColor = (band: number) => {
    if (band >= 8.0) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10';
    if (band >= 7.0) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-indigo-500/10';
    if (band >= 6.0) return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/10';
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-100px)] py-3 px-3 sm:px-6 lg:px-8">
      {/* Subtle Background Gradient Accents to fill empty side space on wide screens */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-28 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-24 -left-36 w-72 h-72 bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-36 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-28 -right-36 w-80 h-80 bg-amber-500/6 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1520px] w-full mx-auto space-y-7 animate-fadeIn pb-16">
        {/* Top Banner & Header */}
        <div className="bg-gradient-to-br from-[#161922] via-[#12141A] to-[#161A24] rounded-3xl border border-[#2D3342] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-1.5 rounded-xl bg-[#212631] text-xs font-bold text-slate-300 hover:text-white hover:bg-[#2A303D] transition-colors flex items-center gap-1.5 border border-[#353D4D] cursor-pointer"
                title="Quay lại IELTS Speaking AI Studio"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Speaking Studio
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <BarChart3 className="w-3.5 h-3.5" />
                IELTS Speaking Portfolio & Voice Vault
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Headphones className="w-3 h-3" />
                {items.length} Bản Ghi Âm Đã Lưu
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Kho Lưu Trữ Bài Nói & Đồ Thị Tiến Bộ
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Nghe lại giọng nói của chính bạn từ những ngày đầu, theo dõi biểu đồ tăng trưởng 4 tiêu chí Cambridge từ{' '}
              <span className="font-extrabold text-amber-300">Band 5.5</span> ➔{' '}
              <span className="font-extrabold text-indigo-300">Band 6.5</span> ➔{' '}
              <span className="font-extrabold text-emerald-400">Band 7.5+</span>, và đo lường <strong className="text-cyan-300">Confidence Score (Chỉ Số Tự Tin & Phát Âm)</strong> qua từng lượt thi thử.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {items.length >= 2 && (
              <button
                type="button"
                onClick={() => handleOpenComparison(items[0])}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-200 hover:text-white border border-purple-500/40 hover:border-purple-400 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-purple-500/20 cursor-pointer"
              >
                <Split className="w-4 h-4 text-purple-400" />
                So Sánh 2 Bài Nói (A/B)
              </button>
            )}

            <button
              type="button"
              onClick={() => onStartSpeakingMode('speaking')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              Luyện Giám Khảo AI Ngay
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Speaking Band & Growth */}
        <div className="bg-[#161922] rounded-3xl p-5 border border-[#2D3342] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Band Speaking Ước Tính
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {metrics.avgBand > 0 ? metrics.avgBand.toFixed(1) : '5.5'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 9.0</span>
            {metrics.bandGrowth > 0 && (
              <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                <TrendingUp className="w-3 h-3" /> +{metrics.bandGrowth} Band
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Điểm kỷ lục cao nhất: <strong className="text-emerald-300">Band {metrics.peakBand.toFixed(1)}</strong>
          </p>
        </div>

        {/* Metric 2: Total Recorded Audio Time */}
        <div className="bg-[#161922] rounded-3xl p-5 border border-[#2D3342] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Chỉ Số Tự Tin (Confidence)
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-cyan-300">
              {metrics.currentConfidence}%
            </span>
            {metrics.confidenceGrowth !== 0 && (
              <span className={`ml-auto inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-lg border ${
                metrics.confidenceGrowth > 0 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              }`}>
                {metrics.confidenceGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metrics.confidenceGrowth > 0 ? `+${metrics.confidenceGrowth}%` : `${metrics.confidenceGrowth}%`}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Đỉnh cao tự tin: <strong className="text-cyan-300">{metrics.peakConfidence}%</strong> ({metrics.highConfidenceCount} lần ≥ 75%)
          </p>
        </div>

        {/* Metric 3: Target Vocabulary Weaved */}
        <div className="bg-[#161922] rounded-3xl p-5 border border-[#2D3342] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Từ Vựng C1/C2 Đã Áp Dụng
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {metrics.targetWordsTotalUsed}
            </span>
            <span className="text-xs font-bold text-slate-400">lần ghim từ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Lexical Resource trung bình: <strong className="text-amber-300">{metrics.avgLexical.toFixed(1)}</strong>
          </p>
        </div>

        {/* Metric 4: 4-Criteria Radar Breakdown */}
        <div className="bg-[#161922] rounded-3xl p-5 border border-[#2D3342] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              4 Tiêu Chí Cambridge
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="flex items-center justify-between bg-[#202530] px-2.5 py-1 rounded-lg">
              <span className="text-amber-300 font-bold">Fluency</span>
              <span className="font-extrabold text-white">{metrics.avgFluency.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between bg-[#202530] px-2.5 py-1 rounded-lg">
              <span className="text-purple-300 font-bold">Lexical</span>
              <span className="font-extrabold text-white">{metrics.avgLexical.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between bg-[#202530] px-2.5 py-1 rounded-lg">
              <span className="text-blue-300 font-bold">Grammar</span>
              <span className="font-extrabold text-white">{metrics.avgGrammar.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between bg-[#202530] px-2.5 py-1 rounded-lg">
              <span className="text-emerald-300 font-bold">Pronun</span>
              <span className="font-extrabold text-white">{metrics.avgPron.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart Container with Confidence Score & Cambridge 4 Criteria Views */}
      <div className="bg-[#161922] rounded-3xl border border-[#2D3342] p-6 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Chart Header & Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {chartViewMode === 'confidence' ? (
                <Gauge className="w-5 h-5 text-cyan-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              )}
              <h2 className="text-lg font-black text-white tracking-tight">
                {chartViewMode === 'confidence'
                  ? 'Biểu Đồ Chỉ Số Tự Tin & Phát Âm / Độ Trôi Chảy (Confidence Score Tracker)'
                  : 'Đồ Thị Tiến Bộ 4 Tiêu Chí Theo Thời Gian (Band 5.5 ➔ 6.5 ➔ 7.5+)'}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {chartViewMode === 'confidence'
                ? 'Đo lường sự bứt phá độ tự tin tổng hợp qua tỷ lệ phát âm chuẩn xác (Pronunciation) & độ trôi chảy (Fluency)'
                : 'Biểu diễn trực quan quỹ đạo nâng band của từng tiêu chí chấm điểm qua các lần thi thử'}
            </p>
          </div>

          {/* Primary View Switcher & Timeframe Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-[#101217] p-1 rounded-2xl border border-[#2C3343] flex items-center text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setChartViewMode('confidence')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  chartViewMode === 'confidence'
                    ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5 text-cyan-200" />
                Chỉ Số Tự Tin (%)
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('criteria')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  chartViewMode === 'criteria'
                    ? 'bg-indigo-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-200" />
                4 Tiêu Chí Band
              </button>
            </div>

            {/* Timeframe selector */}
            <div className="bg-[#202530] p-1 rounded-2xl border border-[#313847] flex items-center text-xs font-bold">
              {(['7d', '30d', '90d', 'all'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframeFilter(tf)}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    timeframeFilter === tf
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf === '7d' ? '7 Ngày' : tf === '30d' ? '30 Ngày' : tf === '90d' ? '3 Tháng' : 'Tất Cả'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-Filters / Pills depending on view mode */}
        {chartViewMode === 'confidence' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#232733]">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setConfidenceMetricFilter('all')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  confidenceMetricFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-cyan-500/10'
                    : 'bg-[#202530] text-slate-400 border-transparent hover:border-[#384152]'
                }`}
              >
                Tất Cả Chỉ Số
              </button>
              <button
                type="button"
                onClick={() => setConfidenceMetricFilter('composite')}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  confidenceMetricFilter === 'composite'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-[#202530] text-cyan-300 border-transparent hover:border-cyan-500/40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm" />
                Confidence Score Index (%)
              </button>
              <button
                type="button"
                onClick={() => setConfidenceMetricFilter('pronunciation')}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  confidenceMetricFilter === 'pronunciation'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-[#202530] text-emerald-300 border-transparent hover:border-emerald-500/40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Pronunciation Clarity (%)
              </button>
              <button
                type="button"
                onClick={() => setConfidenceMetricFilter('fluency')}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  confidenceMetricFilter === 'fluency'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                    : 'bg-[#202530] text-amber-300 border-transparent hover:border-amber-500/40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Fluency & Flow Rate (%)
              </button>
            </div>

            {/* Quick Confidence Milestone Indicators */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> ≥ 85% Bản Lĩnh Cao
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400" /> 70-84% Tự Tin Ổn Định
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> &lt; 70% Khởi Động
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1 border-t border-[#232733]">
            <button
              type="button"
              onClick={() => setActiveCriterionTab('all')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeCriterionTab === 'all'
                  ? 'bg-indigo-500/20 text-white border-indigo-500'
                  : 'bg-[#202530] text-slate-400 border-transparent hover:border-[#384152]'
              }`}
            >
              Tất cả 4 tiêu chí
            </button>
            <button
              type="button"
              onClick={() => setActiveCriterionTab('overall')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCriterionTab === 'overall'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-[#202530] text-indigo-300 border-transparent hover:border-indigo-500/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              Overall Band
            </button>
            <button
              type="button"
              onClick={() => setActiveCriterionTab('fluency')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCriterionTab === 'fluency'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-[#202530] text-amber-300 border-transparent hover:border-amber-500/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Fluency & Coherence
            </button>
            <button
              type="button"
              onClick={() => setActiveCriterionTab('lexical')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCriterionTab === 'lexical'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-[#202530] text-purple-300 border-transparent hover:border-purple-500/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              Lexical Resource
            </button>
            <button
              type="button"
              onClick={() => setActiveCriterionTab('grammar')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCriterionTab === 'grammar'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-[#202530] text-blue-300 border-transparent hover:border-blue-500/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              Grammatical Range
            </button>
            <button
              type="button"
              onClick={() => setActiveCriterionTab('pronunciation')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCriterionTab === 'pronunciation'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-[#202530] text-emerald-300 border-transparent hover:border-emerald-500/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Pronunciation
            </button>
          </div>
        )}

        {/* SVG Interactive Multi-Line Chart (Either Confidence Score View or 4 Criteria View) */}
        <div className="relative bg-[#101217] rounded-2xl p-4 border border-[#262B37] overflow-x-auto">
          {chronologicalItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Info className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold">Chưa có đủ dữ liệu bài nói trong khoảng thời gian này.</p>
              <p className="text-xs text-slate-500">Hãy hoàn thành một lượt thi thử để ghi nhận điểm số!</p>
            </div>
          ) : chartViewMode === 'confidence' ? (
            /* --- CONFIDENCE SCORE TRACKER CHART --- */
            <div className="min-w-[700px]">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none">
                <defs>
                  {/* Gradients for Confidence Area */}
                  <linearGradient id="confidenceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
                    <stop offset="70%" stopColor="#10B981" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="confidenceLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>

                {/* Horizontal Milestone Threshold Lines (55%, 70%, 85%) */}
                {[
                  { score: 85, label: '85% - Tự Tin Cao Độ (Band 7.5+)', color: '#10B981' },
                  { score: 70, label: '70% - Tự Tin Vững Vàng (Band 6.5)', color: '#6366F1' },
                  { score: 55, label: '55% - Nền Tảng (Band 5.5)', color: '#F59E0B' },
                  { score: 40, label: '40% - Khởi Động', color: '#475569' },
                ].map((th) => {
                  const y = getConfY(th.score);
                  return (
                    <g key={th.score}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#262D3D"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        fill={th.color}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        {th.score}%
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient under Composite Confidence Line */}
                {(confidenceMetricFilter === 'all' || confidenceMetricFilter === 'composite') && (
                  <path
                    d={generateConfidenceAreaPath((i) => calculateItemConfidence(i).composite)}
                    fill="url(#confidenceAreaGrad)"
                  />
                )}

                {/* Pronunciation Line (Emerald) */}
                {(confidenceMetricFilter === 'all' || confidenceMetricFilter === 'pronunciation') && (
                  <path
                    d={generateConfidenceLinePath((i) => calculateItemConfidence(i).pronPct)}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={confidenceMetricFilter === 'pronunciation' ? '3.5' : '2'}
                    strokeDasharray={confidenceMetricFilter === 'all' ? '5 3' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Fluency Line (Amber) */}
                {(confidenceMetricFilter === 'all' || confidenceMetricFilter === 'fluency') && (
                  <path
                    d={generateConfidenceLinePath((i) => calculateItemConfidence(i).fluPct)}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={confidenceMetricFilter === 'fluency' ? '3.5' : '2'}
                    strokeDasharray={confidenceMetricFilter === 'all' ? '5 3' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Composite Confidence Score Line (Cyan/Teal Gradient) */}
                {(confidenceMetricFilter === 'all' || confidenceMetricFilter === 'composite') && (
                  <path
                    d={generateConfidenceLinePath((i) => calculateItemConfidence(i).composite)}
                    fill="none"
                    stroke="url(#confidenceLineGrad)"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points */}
                {chronologicalItems.map((item, idx) => {
                  const conf = calculateItemConfidence(item);
                  const x = getX(idx, chronologicalItems.length);
                  const y = getConfY(conf.composite);
                  const isHovered = hoveredPoint?.id === item.id;

                  return (
                    <g
                      key={item.id}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredPoint(item)}
                      onClick={() => setInspectingItem(item)}
                    >
                      {/* Vertical guideline */}
                      {isHovered && (
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={chartHeight - padding.bottom}
                          stroke="#06B6D4"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Outer pulse circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 8 : 5}
                        fill="#083344"
                        stroke={conf.composite >= 80 ? '#10B981' : '#06B6D4'}
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />

                      {/* Score Label on top */}
                      <text
                        x={x}
                        y={y - 10}
                        fill="#E0F2FE"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow-md"
                      >
                        {conf.composite}%
                      </text>

                      {/* X-axis Date tick */}
                      <text
                        x={x}
                        y={chartHeight - padding.bottom + 18}
                        fill="#64748B"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {item.dateFormatted.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Hover Popover Tooltip for Confidence */}
              {hoveredPoint && (
                <div className="mt-3 p-4 rounded-2xl bg-[#141822] border border-cyan-500/40 shadow-2xl text-xs space-y-2.5 max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-black text-[11px] border ${calculateItemConfidence(hoveredPoint).tierColor}`}>
                        <ShieldCheck className="w-3 h-3 inline mr-1" />
                        {calculateItemConfidence(hoveredPoint).tierLabel}
                      </span>
                      <span className="font-extrabold text-white">{hoveredPoint.topic}</span>
                      <span className="text-slate-400 text-[11px]">({hoveredPoint.dateFormatted})</span>
                    </div>
                    <p className="text-slate-300 font-medium line-clamp-1 italic">"{hoveredPoint.question}"</p>
                    
                    {/* Pronunciation vs Fluency breakdown */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1">
                      <span className="text-emerald-300 font-bold">
                        🎙️ Phát âm: <strong>{calculateItemConfidence(hoveredPoint).pronPct}%</strong> (Band {calculateItemConfidence(hoveredPoint).pronBand.toFixed(1)})
                      </span>
                      <span className="text-amber-300 font-bold">
                        🌊 Trôi chảy: <strong>{calculateItemConfidence(hoveredPoint).fluPct}%</strong> (Band {calculateItemConfidence(hoveredPoint).fluBand.toFixed(1)})
                      </span>
                      {calculateItemConfidence(hoveredPoint).wpm && (
                        <span className="text-cyan-300 font-bold">
                          ⚡ Tốc độ: <strong>{calculateItemConfidence(hoveredPoint).wpm} WPM</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-300">
                        {calculateItemConfidence(hoveredPoint).composite}%
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        Overall Band {hoveredPoint.overallBand.toFixed(1)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectingItem(hoveredPoint)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      Chi Tiết →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* --- CAMBRIDGE 4 CRITERIA OVER TIME CHART --- */
            <div className="min-w-[700px]">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none">
                <defs>
                  {/* Gradients */}
                  <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Band Threshold Lines (5.5, 6.5, 7.5, 8.5) */}
                {[5.5, 6.5, 7.5, 8.5].map((b) => {
                  const y = getY(b);
                  return (
                    <g key={b}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#262D3D"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        fill={b >= 7.5 ? '#10B981' : b >= 6.5 ? '#6366F1' : '#F59E0B'}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        Band {b.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Overall Band Line (Indigo) */}
                {(activeCriterionTab === 'all' || activeCriterionTab === 'overall') && (
                  <path
                    d={generateLinePath((i) => i.overallBand)}
                    fill="none"
                    stroke="#818CF8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Fluency Line (Amber) */}
                {(activeCriterionTab === 'all' || activeCriterionTab === 'fluency') && (
                  <path
                    d={generateLinePath((i) => i.criteriaScores.fluency)}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={activeCriterionTab === 'fluency' ? '3.5' : '1.8'}
                    strokeDasharray={activeCriterionTab === 'all' ? '5 3' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Lexical Resource Line (Purple) */}
                {(activeCriterionTab === 'all' || activeCriterionTab === 'lexical') && (
                  <path
                    d={generateLinePath((i) => i.criteriaScores.lexical)}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth={activeCriterionTab === 'lexical' ? '3.5' : '1.8'}
                    strokeDasharray={activeCriterionTab === 'all' ? '5 3' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Grammatical Range Line (Blue) */}
                {(activeCriterionTab === 'all' || activeCriterionTab === 'grammar') && (
                  <path
                    d={generateLinePath((i) => i.criteriaScores.grammar)}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth={activeCriterionTab === 'grammar' ? '3.5' : '1.8'}
                    strokeDasharray={activeCriterionTab === 'all' ? '5 3' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Pronunciation Line (Emerald) */}
                {(activeCriterionTab === 'all' || activeCriterionTab === 'pronunciation') && (
                  <path
                    d={generateLinePath((i) => i.criteriaScores.pronunciation)}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={activeCriterionTab === 'pronunciation' ? '3.5' : '1.8'}
                    strokeDasharray={activeCriterionTab === 'all' ? '5 3' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points */}
                {chronologicalItems.map((item, idx) => {
                  const x = getX(idx, chronologicalItems.length);
                  const y = getY(item.overallBand);
                  const isHovered = hoveredPoint?.id === item.id;

                  return (
                    <g
                      key={item.id}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredPoint(item)}
                      onClick={() => setInspectingItem(item)}
                    >
                      {/* Vertical guideline */}
                      {isHovered && (
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={chartHeight - padding.bottom}
                          stroke="#4F46E5"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Outer pulse circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 8 : 5}
                        fill="#1E1B4B"
                        stroke="#818CF8"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />

                      {/* Score Label on top */}
                      <text
                        x={x}
                        y={y - 10}
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow-md"
                      >
                        {item.overallBand.toFixed(1)}
                      </text>

                      {/* X-axis Date tick */}
                      <text
                        x={x}
                        y={chartHeight - padding.bottom + 18}
                        fill="#64748B"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {item.dateFormatted.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Hover Popover Tooltip */}
              {hoveredPoint && (
                <div className="mt-3 p-4 rounded-2xl bg-[#1B1E26] border border-indigo-500/40 shadow-2xl text-xs space-y-2 max-w-xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-black">
                        {hoveredPoint.mode === 'part2-trainer' ? 'Part 2 Cue Card' : hoveredPoint.mode === 'quick-drill' ? 'Rapid Drill' : `Part ${hoveredPoint.part}`}
                      </span>
                      <span className="font-extrabold text-white">{hoveredPoint.topic}</span>
                      <span className="text-slate-400">({hoveredPoint.dateFormatted})</span>
                    </div>
                    <p className="text-slate-300 font-medium line-clamp-1">"{hoveredPoint.question}"</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-black text-indigo-400">
                        Band {hoveredPoint.overallBand.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {hoveredPoint.criteriaScores.wordsPerMinute ? `${hoveredPoint.criteriaScores.wordsPerMinute} WPM` : `${hoveredPoint.durationSeconds}s`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectingItem(hoveredPoint)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Xem Chi Tiết →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Speaking Vault & Voice Recordings List */}
      <div className="space-y-4">
        {/* Filter and Search Bar */}
        <div className="bg-[#161922] rounded-3xl p-4 sm:p-5 border border-[#2D3342] shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo chủ đề, câu hỏi, từ vựng hoặc transcript..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0F1116] border border-[#2D3342] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mode & Part Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Select */}
            <select
              value={selectedModeFilter}
              onChange={(e) => setSelectedModeFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-[#0F1116] border border-[#2D3342] text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất Cả Chế Độ</option>
              <option value="mock-examiner">Giám Khảo Mock (Part 1-2-3)</option>
              <option value="part2-trainer">Part 2 Cue Card (1p+2p)</option>
              <option value="quick-drill">Phản Xạ 15s Rapid Fire</option>
              <option value="shadowing">Shadowing Lab</option>
            </select>

            {/* Part Select */}
            <select
              value={selectedPartFilter}
              onChange={(e) => setSelectedPartFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-[#0F1116] border border-[#2D3342] text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất Cả Part</option>
              <option value="part1">Part 1 (Ngắn gọn)</option>
              <option value="part2">Part 2 (2 Phút)</option>
              <option value="part3">Part 3 (Thảo luận sâu)</option>
            </select>

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                onlyFavorites
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-[#0F1116] text-slate-400 border-[#2D3342] hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              Đã Đánh Dấu ⭐
            </button>

            {/* Playback Speed Controller */}
            <div className="flex items-center gap-1 bg-[#0F1116] px-2 py-1 rounded-2xl border border-[#2D3342] text-xs font-bold">
              <span className="text-[10px] text-slate-400 pl-1">Tốc độ:</span>
              {[0.8, 1.0, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleChangeSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded-lg transition-colors ${
                    playbackSpeed === spd
                      ? 'bg-indigo-600 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recordings List */}
        {filteredItems.length === 0 ? (
          <div className="bg-[#161922] rounded-3xl p-12 border border-[#2D3342] text-center space-y-3">
            <Mic className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Không tìm thấy bài nói nào phù hợp</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Hãy thử tìm kiếm với từ khóa khác, hoặc bắt đầu một buổi luyện nói mới để lưu giọng của bạn!
            </p>
            <button
              type="button"
              onClick={() => onStartSpeakingMode('speaking')}
              className="mt-2 px-5 py-2 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
            >
              Luyện Giám Khảo AI Ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isPlaying = playingId === item.id;
              const progressData = audioProgress[item.id] || { current: 0, duration: item.durationSeconds || 30 };
              const percent = progressData.duration > 0 ? (progressData.current / progressData.duration) * 100 : 0;

              return (
                <div
                  key={item.id}
                  className={`bg-[#161922] rounded-3xl border transition-all p-5 sm:p-6 shadow-xl relative overflow-hidden group ${
                    isPlaying
                      ? 'border-indigo-500/70 ring-1 ring-indigo-500/50 shadow-indigo-500/10'
                      : 'border-[#2D3342] hover:border-[#3E4659]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info & Topic */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Band Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${getBandBadgeColor(
                            item.overallBand
                          )}`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          Band {item.overallBand.toFixed(1)}
                        </span>

                        {/* Mode Badge */}
                        <span className="px-2.5 py-0.5 rounded-xl bg-[#222734] text-[11px] font-bold text-slate-300 border border-[#343B4D]">
                          {item.mode === 'part2-trainer'
                            ? 'Part 2 Cue Card'
                            : item.mode === 'quick-drill'
                            ? 'Rapid Drill 15s'
                            : item.mode === 'shadowing'
                            ? 'Shadowing Lab'
                            : `Mock Part ${item.part}`}
                        </span>

                        {/* Topic */}
                        <span className="text-xs font-extrabold text-indigo-300">
                          {item.topic}
                        </span>

                        {/* Date */}
                        <span className="text-xs text-slate-500 ml-auto lg:ml-0 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.dateFormatted}
                        </span>
                      </div>

                      {/* Question prompt */}
                      <h4 className="text-sm sm:text-base font-black text-white group-hover:text-indigo-200 transition-colors">
                        "{item.question}"
                      </h4>

                      {/* Transcript snippet */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 bg-[#0F1116] p-3 rounded-2xl border border-[#232734] italic font-serif">
                        "{item.transcript}"
                      </p>

                      {/* Target Vocabulary Used Pills */}
                      {item.targetWordsUsed && item.targetWordsUsed.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Từ mục tiêu đã dùng:
                          </span>
                          {item.targetWordsUsed.map((w, wIdx) => (
                            <span
                              key={wIdx}
                              className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              {w}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Audio Player, 4 Criteria mini scores & actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 lg:w-80">
                      {/* 4 Cambridge Criteria Mini Pill */}
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold w-full justify-between sm:justify-end">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30" title="Fluency & Coherence">
                          FC {item.criteriaScores.fluency.toFixed(1)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30" title="Lexical Resource">
                          LR {item.criteriaScores.lexical.toFixed(1)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30" title="Grammatical Range">
                          GRA {item.criteriaScores.grammar.toFixed(1)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" title="Pronunciation">
                          PR {item.criteriaScores.pronunciation.toFixed(1)}
                        </span>
                      </div>

                      {/* Audio Player Bar */}
                      <div className="w-full bg-[#101217] rounded-2xl p-2.5 border border-[#262B37] flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(item)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md ${
                            isPlaying
                              ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          }`}
                          title={isPlaying ? 'Tạm dừng' : 'Nghe lại bản thu âm'}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                        </button>

                        {/* Seek Progress Bar */}
                        <div className="flex-1 space-y-1">
                          <div
                            className="h-2 bg-[#202532] rounded-full overflow-hidden cursor-pointer relative"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const newTime = (clickX / rect.width) * (progressData.duration || item.durationSeconds || 30);
                              handleSeek(item.id, newTime);
                            }}
                          >
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>{formatDurationMinSec(progressData.current)}</span>
                            <span>{formatDurationMinSec(progressData.duration || item.durationSeconds || 30)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full justify-end">
                        {/* Favorite button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(item.id, e)}
                          className={`p-2 rounded-xl border transition-colors ${
                            item.isFavorite
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-[#202530] text-slate-400 border-transparent hover:text-white'
                          }`}
                          title={item.isFavorite ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao'}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                        </button>

                        {/* Compare button */}
                        <button
                          type="button"
                          onClick={() => handleOpenComparison(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#202530] hover:bg-[#2B3240] text-purple-300 font-bold text-xs border border-purple-500/20 hover:border-purple-500/40 flex items-center gap-1 transition-colors"
                          title="So sánh với một bài nói khác"
                        >
                          <Split className="w-3 h-3" />
                          So Sánh
                        </button>

                        {/* Inspect detail modal */}
                        <button
                          type="button"
                          onClick={() => setInspectingItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/20"
                        >
                          Báo Cáo AI →
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-2 rounded-xl bg-[#202530] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-colors"
                          title="Xóa bản ghi âm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Personal Study Notes Section */}
                  <div className="mt-3 pt-3 border-t border-[#232733] flex items-center justify-between text-xs">
                    {editingNotesId === item.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          placeholder="Ghi chú kinh nghiệm cải thiện cho lần sau..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-[#0F1116] border border-indigo-500/50 text-white text-xs focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#202530] text-slate-400 hover:text-white"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-between">
                        <p className="text-slate-400 text-xs italic">
                          {item.notes ? (
                            <span>
                              📝 <strong className="text-slate-300">Ghi chú:</strong> {item.notes}
                            </span>
                          ) : (
                            <span className="text-slate-500">Chưa có ghi chú riêng cho lượt nói này.</span>
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotesId(item.id);
                            setNotesDraft(item.notes || '');
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center gap-1 ml-2"
                        >
                          <Edit3 className="w-3 h-3" /> {item.notes ? 'Sửa' : 'Thêm ghi chú'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Modal (A/B Audio & Criteria Matrix) */}
      {isCompareModalOpen && comparisonA && comparisonB && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[#14161D] rounded-3xl border border-[#2D3344] max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#242938] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Split className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">So Sánh Đối Chiếu 2 Bài Nói (A/B Comparison)</h3>
                  <p className="text-xs text-slate-400">
                    Đối chiếu bản thu âm và 4 tiêu chí Cambridge giữa hai thời điểm
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#202532] text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selectors for comparison targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target A */}
              <div className="bg-[#181B24] rounded-2xl p-4 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Bài Nói A (Khởi điểm)</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                    Band {comparisonA.overallBand.toFixed(1)}
                  </span>
                </div>
                <select
                  value={comparisonA.id}
                  onChange={(e) => {
                    const found = items.find((i) => i.id === e.target.value);
                    if (found) setComparisonA(found);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1116] border border-[#2D3342] text-xs font-bold text-white focus:outline-none"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.dateFormatted} - {i.topic} (Band {i.overallBand})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-300 italic line-clamp-2">"{comparisonA.question}"</p>
                {/* Audio player A */}
                <button
                  type="button"
                  onClick={() => handleTogglePlay(comparisonA)}
                  className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold flex items-center justify-center gap-2 border border-indigo-500/40"
                >
                  <Play className="w-3.5 h-3.5 fill-indigo-300" /> Nghe Bản Thu A
                </button>
              </div>

              {/* Target B */}
              <div className="bg-[#181B24] rounded-2xl p-4 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Bài Nói B (Hiện tại / Tái đấu)</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                    Band {comparisonB.overallBand.toFixed(1)}
                  </span>
                </div>
                <select
                  value={comparisonB.id}
                  onChange={(e) => {
                    const found = items.find((i) => i.id === e.target.value);
                    if (found) setComparisonB(found);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F1116] border border-[#2D3342] text-xs font-bold text-white focus:outline-none"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.dateFormatted} - {i.topic} (Band {i.overallBand})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-300 italic line-clamp-2">"{comparisonB.question}"</p>
                {/* Audio player B */}
                <button
                  type="button"
                  onClick={() => handleTogglePlay(comparisonB)}
                  className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-500/40"
                >
                  <Play className="w-3.5 h-3.5 fill-emerald-300" /> Nghe Bản Thu B
                </button>
              </div>
            </div>

            {/* Criteria Delta Comparison Table */}
            <div className="bg-[#101217] rounded-2xl border border-[#242938] overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#181B24] text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Tiêu Chí Đánh Giá</th>
                    <th className="p-3 text-indigo-400">Bài Nói A</th>
                    <th className="p-3 text-emerald-400">Bài Nói B</th>
                    <th className="p-3 text-right">Tăng Trưởng (Delta)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202533] text-slate-300 font-medium">
                  <tr>
                    <td className="p-3 font-bold text-white">Overall Speaking Band</td>
                    <td className="p-3 font-black text-indigo-300">{comparisonA.overallBand.toFixed(1)}</td>
                    <td className="p-3 font-black text-emerald-300">{comparisonB.overallBand.toFixed(1)}</td>
                    <td className="p-3 text-right font-black text-emerald-400">
                      {comparisonB.overallBand >= comparisonA.overallBand ? '+' : ''}
                      {(comparisonB.overallBand - comparisonA.overallBand).toFixed(1)} Band
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Fluency & Coherence (FC)</td>
                    <td className="p-3">{comparisonA.criteriaScores.fluency.toFixed(1)}</td>
                    <td className="p-3">{comparisonB.criteriaScores.fluency.toFixed(1)}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {comparisonB.criteriaScores.fluency >= comparisonA.criteriaScores.fluency ? '+' : ''}
                      {(comparisonB.criteriaScores.fluency - comparisonA.criteriaScores.fluency).toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Lexical Resource (LR)</td>
                    <td className="p-3">{comparisonA.criteriaScores.lexical.toFixed(1)}</td>
                    <td className="p-3">{comparisonB.criteriaScores.lexical.toFixed(1)}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {comparisonB.criteriaScores.lexical >= comparisonA.criteriaScores.lexical ? '+' : ''}
                      {(comparisonB.criteriaScores.lexical - comparisonA.criteriaScores.lexical).toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Grammatical Range (GRA)</td>
                    <td className="p-3">{comparisonA.criteriaScores.grammar.toFixed(1)}</td>
                    <td className="p-3">{comparisonB.criteriaScores.grammar.toFixed(1)}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {comparisonB.criteriaScores.grammar >= comparisonA.criteriaScores.grammar ? '+' : ''}
                      {(comparisonB.criteriaScores.grammar - comparisonA.criteriaScores.grammar).toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Pronunciation (PR)</td>
                    <td className="p-3">{comparisonA.criteriaScores.pronunciation.toFixed(1)}</td>
                    <td className="p-3">{comparisonB.criteriaScores.pronunciation.toFixed(1)}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {comparisonB.criteriaScores.pronunciation >= comparisonA.criteriaScores.pronunciation ? '+' : ''}
                      {(comparisonB.criteriaScores.pronunciation - comparisonA.criteriaScores.pronunciation).toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Transcripts Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-indigo-400">Transcript Lần A:</span>
                <div className="bg-[#0F1116] p-3.5 rounded-2xl border border-[#242938] text-xs text-slate-300 font-serif leading-relaxed h-36 overflow-y-auto">
                  "{comparisonA.transcript}"
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-400">Transcript Lần B:</span>
                <div className="bg-[#0F1116] p-3.5 rounded-2xl border border-[#242938] text-xs text-slate-300 font-serif leading-relaxed h-36 overflow-y-auto">
                  "{comparisonB.transcript}"
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs sm:text-sm hover:bg-indigo-500 transition-colors"
              >
                Đóng Bảng So Sánh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full AI Cambridge Diagnostic Inspection Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[#14161D] rounded-3xl border border-[#2D3344] max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#242938] pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`px-3.5 py-1.5 rounded-2xl font-black text-sm border ${getBandBadgeColor(
                    inspectingItem.overallBand
                  )}`}
                >
                  Band {inspectingItem.overallBand.toFixed(1)}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Báo Cáo Chẩn Đoán Chi Tiết (Cambridge Assessment)
                  </h3>
                  <p className="text-xs text-slate-400">
                    {inspectingItem.topic} • {inspectingItem.dateFormatted}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="w-8 h-8 rounded-xl bg-[#202532] text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Question & Audio player */}
            <div className="bg-[#181B24] rounded-2xl p-4 border border-[#2A303F] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Câu hỏi đề bài
                </span>
                <span className="text-xs font-bold text-indigo-300">
                  {inspectingItem.mode === 'part2-trainer' ? 'Part 2 Cue Card' : `Part ${inspectingItem.part}`}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">"{inspectingItem.question}"</h4>

              {/* Audio controller */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTogglePlay(inspectingItem)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  {playingId === inspectingItem.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  {playingId === inspectingItem.id ? 'Tạm Dừng' : 'Phát Lại Bản Ghi Âm'}
                </button>
                <span className="text-xs text-slate-400 font-bold">
                  Thời lượng: {inspectingItem.durationSeconds || 30} giây
                </span>
              </div>
            </div>

            {/* Candidate's Transcript */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Bản Ghi Nội Dung Đã Nói (Transcript):
              </span>
              <div className="bg-[#0F1116] p-4 rounded-2xl border border-[#252A38] text-xs sm:text-sm text-slate-200 font-serif leading-relaxed">
                "{inspectingItem.transcript}"
              </div>
            </div>

            {/* Mandatory Vocab Report */}
            {inspectingItem.evalResult && 'mandatoryVocabEvaluations' in inspectingItem.evalResult && (
              <MandatoryVocabReport
                evaluations={(inspectingItem.evalResult as SpeakingEvaluationResult).mandatoryVocabEvaluations}
                targetWordsUsed={inspectingItem.targetWordsUsed}
                targetWordsMissed={inspectingItem.targetWordsMissed}
              />
            )}

            {/* 4 Cambridge Criteria Detailed Breakdown */}
            {inspectingItem.evalResult && 'criteriaScores' in inspectingItem.evalResult && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Chẩn Đoán 4 Tiêu Chí Cambridge
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Fluency */}
                  <div className="bg-[#181B24] p-4 rounded-2xl border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-amber-300">Fluency & Coherence</span>
                      <span className="font-black text-xs text-white bg-amber-500/20 px-2 py-0.5 rounded-md">
                        {(inspectingItem.evalResult as SpeakingEvaluationResult).criteriaScores.fluencyCoherence.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {(inspectingItem.evalResult as SpeakingEvaluationResult).criteriaScores.fluencyCoherence.feedbackVi}
                    </p>
                  </div>

                  {/* Lexical */}
                  <div className="bg-[#181B24] p-4 rounded-2xl border border-purple-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-purple-300">Lexical Resource</span>
                      <span className="font-black text-xs text-white bg-purple-500/20 px-2 py-0.5 rounded-md">
                        {(inspectingItem.evalResult as SpeakingEvaluationResult).criteriaScores.lexicalResource.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {(inspectingItem.evalResult as SpeakingEvaluationResult).criteriaScores.lexicalResource.feedbackVi}
                    </p>
                  </div>

                  {/* Grammar */}
                  <div className="bg-[#181B24] p-4 rounded-2xl border border-blue-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-blue-300">Grammatical Range</span>
                      <span className="font-black text-xs text-white bg-blue-500/20 px-2 py-0.5 rounded-md">
                        {(inspectingItem.evalResult as SpeakingEvaluationResult).criteriaScores.grammaticalRange.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {(inspectingItem.evalResult as SpeakingEvaluationResult).criteriaScores.grammaticalRange.feedbackVi}
                    </p>
                  </div>

                  {/* Pronunciation */}
                  <div className="bg-[#181B24] p-4 rounded-2xl border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-emerald-300">Pronunciation</span>
                      <span className="font-black text-xs text-white bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        {(inspectingItem.evalResult as SpeakingEvaluationResult).criteriaScores.pronunciation.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {(inspectingItem.evalResult as SpeakingEvaluationResult).criteriaScores.pronunciation.feedbackVi}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Band 8.5+ Model Response */}
            {inspectingItem.evalResult && 'band8ModelAnswer' in inspectingItem.evalResult && (
              <div className="bg-gradient-to-br from-indigo-950/40 via-[#181B26] to-purple-950/30 rounded-2xl p-5 border border-indigo-500/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-black text-xs uppercase tracking-wider text-amber-300">
                    Câu Trả Lời Mẫu Chuẩn Band 8.5+ (Model Answer)
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed italic">
                  "{(inspectingItem.evalResult as SpeakingEvaluationResult).band8ModelAnswer.answer}"
                </p>
                <p className="text-xs text-slate-400 pt-1 border-t border-[#262D3D]">
                  <strong className="text-indigo-300">Dịch nghĩa:</strong>{' '}
                  {(inspectingItem.evalResult as SpeakingEvaluationResult).band8ModelAnswer.vietnameseTranslation}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs sm:text-sm hover:bg-indigo-500 transition-colors"
              >
                Đóng Báo Cáo
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
