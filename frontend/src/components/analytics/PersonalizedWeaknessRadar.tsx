import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Filter,
  Volume2,
  Mic,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Award,
  Clock,
  TrendingDown,
  TrendingUp,
  Target,
  FileSpreadsheet,
  Plus,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LearnerWeaknessItem, WeaknessCategory, WordSet, VocabItem, UserProgress } from '../../types';
import {
  getLearnerWeaknesses,
  updateWeaknessStatus,
  addCustomWeakness,
} from '../../utils/weaknessRadar';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';

interface PersonalizedWeaknessRadarProps {
  words: VocabItem[];
  activeSet: WordSet;
  progress?: UserProgress;
  onBack: () => void;
  onStartSpeakingMode?: (mode: 'speaking' | 'speaking-part2' | 'shadowing' | 'quick-speaking-drill' | 'full-mock-test') => void;
}

export const PersonalizedWeaknessRadar: React.FC<PersonalizedWeaknessRadarProps> = ({
  words,
  activeSet,
  progress,
  onBack,
  onStartSpeakingMode,
}) => {
  const [weaknesses, setWeaknesses] = useState<LearnerWeaknessItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activeDrillItem, setActiveDrillItem] = useState<LearnerWeaknessItem | null>(null);
  const [revealedDrillIds, setRevealedDrillIds] = useState<Record<string, boolean>>({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // New weakness modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<WeaknessCategory>('grammar_tenses');
  const [newExplanation, setNewExplanation] = useState('');
  const [newDrillRule, setNewDrillRule] = useState('');
  const [newExampleContext, setNewExampleContext] = useState('');
  const [newExampleError, setNewExampleError] = useState('');
  const [newExampleCorrection, setNewExampleCorrection] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const list = await getLearnerWeaknesses();
    setWeaknesses(list);
    if (list.length > 0 && !activeDrillItem) {
      setActiveDrillItem(list[0]);
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'improving' | 'mastered') => {
    sounds.playComplete();
    await updateWeaknessStatus(id, status);
    await loadData();
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    sounds.playComplete();
    await addCustomWeakness({
      title: newTitle.trim(),
      category: newCategory,
      categoryLabelVi:
        newCategory.includes('grammar')
          ? 'Ngữ pháp & Cấu trúc'
          : newCategory.includes('pronunciation')
          ? 'Phát âm & Âm đuôi'
          : newCategory.includes('fluency')
          ? 'Độ trôi chảy & Từ đệm'
          : 'Từ vựng & Collocation',
      frequencyCount: 1,
      severity: 'moderate',
      warningHeadline: `Chú ý: Tránh lỗi ${newTitle.trim()} khi thi nói!`,
      detailedExplanationVi: newExplanation.trim() || 'Lỗi do thói quen dịch nhẩm hoặc chưa phản xạ chuẩn.',
      cambridgeExaminerDeductionVi: 'Có thể làm giảm tính tự nhiên và độ chính xác của câu trả lời.',
      examplesFromUser: newExampleError
        ? [
            {
              context: newExampleContext || 'Tình huống giao tiếp IELTS',
              errorPart: newExampleError,
              correction: newExampleCorrection,
              date: new Date().toLocaleDateString('vi-VN'),
            },
          ]
        : [],
      prescribedDrill: {
        instructionVi: 'Luyện tập câu mẫu sửa lỗi mỗi ngày trước buổi nói.',
        targetRule: newDrillRule || 'Quy tắc sửa lỗi tức thì.',
        practicePrompts: [
          {
            prompt: newExampleError ? `Sửa lỗi câu: "${newExampleError}"` : 'Luyện phản xạ câu chuẩn:',
            modelCorrectionVi: newExampleCorrection || 'Mẫu câu chuẩn học thuật.',
            targetFocus: 'Khắc phục thói quen',
          },
        ],
      },
      status: 'active',
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewExplanation('');
    setNewDrillRule('');
    setNewExampleContext('');
    setNewExampleError('');
    setNewExampleCorrection('');
    await loadData();
  };

  // Filtered list
  const filteredWeaknesses = weaknesses.filter((item) => {
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'grammar' && !item.category.includes('grammar')) return false;
      if (selectedCategory === 'pronunciation' && !item.category.includes('pronunciation')) return false;
      if (selectedCategory === 'fluency' && !item.category.includes('fluency')) return false;
      if (selectedCategory === 'lexical' && !item.category.includes('lexical')) return false;
    }
    if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) return false;
    return true;
  });

  const criticalCount = weaknesses.filter((w) => w.severity === 'critical' && w.status !== 'mastered').length;
  const activeCount = weaknesses.filter((w) => w.status === 'active').length;
  const improvingCount = weaknesses.filter((w) => w.status === 'improving').length;
  const masteredCount = weaknesses.filter((w) => w.status === 'mastered').length;

  return (
    <div className="relative w-full min-h-[calc(100vh-100px)] py-3 px-3 sm:px-6 lg:px-8">
      {/* Subtle Background Gradient Accents to fill empty side space on wide screens */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-28 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-red-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-24 -left-36 w-72 h-72 bg-amber-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-36 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-purple-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-28 -right-36 w-80 h-80 bg-blue-500/6 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1520px] w-full mx-auto space-y-6 pb-20 animate-fadeIn">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#151D2A] p-4 sm:p-6 rounded-3xl border border-[#2D333B] shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                AI Personal Error Radar
              </span>
              <span className="text-xs text-[#8E97A4]">Cập nhật liên tục từ bài nói</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span>🛑 Sổ Tay “Bẫy Lỗi Cá Nhân”</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              sounds.playClick();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-white border border-[#3D4450] text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Thêm Bẫy Lỗi Mới</span>
          </button>

          {onStartSpeakingMode && (
            <button
              onClick={() => {
                sounds.playComplete();
                onStartSpeakingMode('full-mock-test');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black transition-all cursor-pointer shadow-lg shadow-red-950/50"
            >
              <Clock className="w-4 h-4" />
              <span>Thử Thách Thi Thật 15 Phút ⏱️</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#151D2A] rounded-2xl p-4 border border-red-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Bẫy Nguy Hiểm</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 flex items-baseline gap-1">
            <span>{criticalCount}</span>
            <span className="text-xs text-[#8E97A4] font-normal">lỗi nghiêm trọng</span>
          </div>
          <p className="text-[11px] text-red-300/80 mt-1 leading-snug">Dễ bị trừ điểm nặng ở Band 7.0+</p>
        </div>

        <div className="bg-[#151D2A] rounded-2xl p-4 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Đang Tái Diễn</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 flex items-baseline gap-1">
            <span>{activeCount}</span>
            <span className="text-xs text-[#8E97A4] font-normal">bẫy lỗi</span>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-1 leading-snug">Cần cảnh báo trước mỗi buổi nói</p>
        </div>

        <div className="bg-[#151D2A] rounded-2xl p-4 border border-blue-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Đang Tiến Bộ</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 flex items-baseline gap-1">
            <span>{improvingCount}</span>
            <span className="text-xs text-[#8E97A4] font-normal">đang sửa</span>
          </div>
          <p className="text-[11px] text-blue-300/80 mt-1 leading-snug">Tần suất giảm dần sau các bài tập</p>
        </div>

        <div className="bg-[#151D2A] rounded-2xl p-4 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Đã Khắc Phục</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 flex items-baseline gap-1">
            <span>{masteredCount}</span>
            <span className="text-xs text-[#8E97A4] font-normal">đã làm chủ</span>
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1 leading-snug">Phản xạ tự nhiên không còn mắc lỗi</p>
        </div>
      </div>

      {/* Top 5 AI Warning Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-purple-950/30 to-amber-950/40 rounded-3xl p-6 border border-red-500/40 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              TOP 5 BẪY LỖI CỐ HỮU ĐƯỢC AI PHÂN TÍCH
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              Chiến Lược Phá Vỡ Vùng An Toàn & Tránh Mất Điểm Tức Thì
            </h3>
            <p className="text-xs text-[#8E97A4] leading-relaxed">
              Hệ thống giám khảo AI theo dõi các bài nói của bạn và tự động nhận diện các mẫu lỗi lặp lại. Trước mỗi buổi thi thử, AI sẽ tự động bật cảnh báo nhắc nhở để bạn không rơi vào "bẫy quán tính".
            </p>
          </div>
        </div>

        {/* Quick Carousel / Pills of Top Traps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {weaknesses.slice(0, 3).map((w, idx) => (
            <div
              key={w.id}
              onClick={() => {
                sounds.playClick();
                setActiveDrillItem(w);
                setExpandedCardId(w.id);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeDrillItem?.id === w.id
                  ? 'bg-[#1C2333] border-amber-500/80 shadow-lg ring-1 ring-amber-500/40'
                  : 'bg-[#151D2A] border-[#2D333B] hover:border-amber-500/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                    Bẫy #{idx + 1} ({w.frequencyCount} lần)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      w.status === 'mastered'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : w.status === 'improving'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {w.status === 'mastered'
                      ? 'Đã làm chủ ⭐'
                      : w.status === 'improving'
                      ? 'Đang tiến bộ 📈'
                      : 'Báo động đỏ 🚨'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm line-clamp-1">{w.title}</h4>
                <p className="text-xs text-amber-200/80 line-clamp-2 leading-relaxed">
                  {w.warningHeadline}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#2D333B] flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Luyện sửa lỗi ➔</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Left Filtered List & Right Interactive Drill Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable List of Weaknesses (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#151D2A] p-3 rounded-2xl border border-[#2D333B]">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'bg-[#21262D] text-[#8E97A4] hover:text-white'
                }`}
              >
                Tất cả ({weaknesses.length})
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory('grammar');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedCategory === 'grammar'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'bg-[#21262D] text-[#8E97A4] hover:text-white'
                }`}
              >
                Ngữ pháp & Thì
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory('pronunciation');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedCategory === 'pronunciation'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'bg-[#21262D] text-[#8E97A4] hover:text-white'
                }`}
              >
                Âm đuôi & Phát âm
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory('fluency');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedCategory === 'fluency'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'bg-[#21262D] text-[#8E97A4] hover:text-white'
                }`}
              >
                Từ đệm & Trôi chảy
              </button>
            </div>

            <div className="flex items-center gap-1">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-[#21262D] text-xs text-[#8E97A4] border border-[#3D4450] rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="critical">🚨 Nguy hiểm (Critical)</option>
                <option value="moderate">⚠️ Trung bình (Moderate)</option>
                <option value="minor">ℹ️ Nhẹ (Minor)</option>
              </select>
            </div>
          </div>

          {/* Weakness Cards List */}
          <div className="space-y-3">
            {filteredWeaknesses.map((item) => {
              const isExpanded = expandedCardId === item.id;
              return (
                <div
                  key={item.id}
                  className={`bg-[#151D2A] rounded-2xl border transition-all duration-300 overflow-hidden ${
                    activeDrillItem?.id === item.id
                      ? 'border-amber-500/60 shadow-xl ring-1 ring-amber-500/30'
                      : 'border-[#2D333B] hover:border-[#3D4450]'
                  }`}
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              item.severity === 'critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : item.severity === 'moderate'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {item.severity === 'critical'
                              ? '🚨 Bẫy Nguy Hiểm'
                              : item.severity === 'moderate'
                              ? '⚠️ Bẫy Thói Quen'
                              : 'ℹ️ Cần Lưu Ý'}
                          </span>
                          <span className="text-xs text-[#8E97A4] font-medium">
                            {item.categoryLabelVi}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#21262D] text-amber-300">
                            Phát hiện {item.frequencyCount} lần
                          </span>
                        </div>

                        <h4 className="font-black text-white text-base sm:text-lg hover:text-amber-300 transition-colors cursor-pointer"
                          onClick={() => {
                            sounds.playClick();
                            setActiveDrillItem(item);
                          }}
                        >
                          {item.title}
                        </h4>

                        <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                          {item.warningHeadline}
                        </p>
                      </div>

                      {/* Status Dropdown */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value as any)
                          }
                          className="bg-[#21262D] text-xs font-bold text-white border border-[#3D4450] rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                        >
                          <option value="active">🚨 Báo động đỏ</option>
                          <option value="improving">⏳ Đang sửa lỗi</option>
                          <option value="mastered">⭐ Đã khắc phục</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-[#8E97A4] leading-relaxed">
                      {item.detailedExplanationVi}
                    </p>

                    {/* Cambridge Examiner Deduction Note */}
                    <div className="bg-red-950/30 rounded-xl p-3 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-red-300">Hệ quả chấm điểm Cambridge: </span>
                        <span>{item.cambridgeExaminerDeductionVi}</span>
                      </div>
                    </div>

                    {/* Expandable Excerpts from Real Transcripts */}
                    {item.examplesFromUser && item.examplesFromUser.length > 0 && (
                      <div>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setExpandedCardId(isExpanded ? null : item.id);
                          }}
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                        >
                          <span>
                            {isExpanded ? 'Ẩn ví dụ thực tế' : `Xem ${item.examplesFromUser.length} ví dụ lỗi thực tế trong bài nói`}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 pt-2 border-t border-[#2D333B] animate-fadeIn">
                            {item.examplesFromUser.map((ex, idx) => (
                              <div
                                key={idx}
                                className="bg-[#0D1117] rounded-xl p-3 border border-[#2D333B] space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between text-[11px] text-[#8E97A4]">
                                  <span className="font-semibold text-amber-400">{ex.context}</span>
                                  <span>{ex.date} {ex.partName ? `• ${ex.partName}` : ''}</span>
                                </div>
                                <div className="text-red-300 bg-red-950/40 px-2.5 py-1 rounded border border-red-500/30 line-through">
                                  ❌ Lỗi đã nói: "{ex.errorPart}"
                                </div>
                                <div className="text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/30 font-semibold">
                                  ✅ Bản sửa chuẩn: "{ex.correction}"
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setActiveDrillItem(item);
                        }}
                        className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeDrillItem?.id === item.id
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-[#21262D] hover:bg-[#30363D] text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Mở Phòng Luyện Sửa Lỗi 🎯</span>
                      </button>

                      {onStartSpeakingMode && (
                        <button
                          onClick={() => {
                            sounds.playComplete();
                            onStartSpeakingMode('speaking');
                          }}
                          className="text-xs text-[#8E97A4] hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <span>Thi thử để kiểm tra</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Instant Fix Drill Lab (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#151D2A] rounded-3xl p-5 sm:p-6 border border-amber-500/50 shadow-2xl sticky top-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#2D333B] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center font-black">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Phòng Luyện Sửa Lỗi Tức Thì</h3>
                  <p className="text-xs text-[#8E97A4]">Drill phản xạ 2 giây</p>
                </div>
              </div>

              {activeDrillItem && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {activeDrillItem.categoryLabelVi}
                </span>
              )}
            </div>

            {activeDrillItem ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                    Đang Luyện Bẫy Lỗi:
                  </span>
                  <h4 className="text-lg font-black text-white">{activeDrillItem.title}</h4>
                  <p className="text-xs text-[#8E97A4] leading-relaxed">
                    {activeDrillItem.prescribedDrill.instructionVi}
                  </p>
                </div>

                {/* Target Rule Box */}
                <div className="bg-black/50 rounded-2xl p-4 border border-amber-500/40 space-y-1.5">
                  <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Quy Tắc Vàng Cần Khắc Cốt Ghi Tâm:
                  </span>
                  <p className="text-sm font-mono font-bold text-amber-100 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30">
                    {activeDrillItem.prescribedDrill.targetRule}
                  </p>
                </div>

                {/* Practice Prompts */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    Bài Tập Phản Xạ Nhanh:
                  </span>

                  {activeDrillItem.prescribedDrill.practicePrompts.map((p, idx) => {
                    const promptKey = `${activeDrillItem.id}-${idx}`;
                    const isRevealed = revealedDrillIds[promptKey];
                    return (
                      <div
                        key={idx}
                        className="bg-[#101520] rounded-2xl p-4 border border-[#2D333B] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-white leading-relaxed">
                            👉 {p.prompt}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 shrink-0">
                            {p.targetFocus}
                          </span>
                        </div>

                        {isRevealed ? (
                          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-500/40 text-xs space-y-1.5 animate-fadeIn">
                            <span className="font-bold text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Câu mẫu chuẩn Band 8.0+:
                            </span>
                            <p className="text-emerald-100 font-medium leading-relaxed">
                              "{p.modelCorrectionVi}"
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => {
                                  sounds.playClick();
                                  speakWord(p.modelCorrectionVi);
                                }}
                                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Nghe phát âm chuẩn</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              sounds.playComplete();
                              setRevealedDrillIds((prev) => ({ ...prev, [promptKey]: true }));
                            }}
                            className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer text-center"
                          >
                            👁️ Bấm để hiện câu mẫu chuẩn Band 8.0+
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Direct Action Launch */}
                <div className="pt-2 border-t border-[#2D333B] space-y-2">
                  {onStartSpeakingMode && (
                    <button
                      onClick={() => {
                        sounds.playComplete();
                        onStartSpeakingMode('speaking');
                      }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Vào Luyện Nói Áp Dụng Ngay 🎙️</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-[#8E97A4] text-xs">
                Chọn một bẫy lỗi ở danh sách bên trái để mở phòng luyện.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Error Note */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151D2A] rounded-3xl border border-[#3D4450] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#2D333B] pb-3">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Thêm Bẫy Lỗi Cá Nhân Mới</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[#8E97A4] font-bold">Tên bẫy lỗi:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Hay dùng thì Hiện tại đơn thay vì Quá khứ hoàn thành"
                  className="w-full bg-[#21262D] text-white px-3.5 py-2.5 rounded-xl border border-[#3D4450] outline-none focus:border-amber-400 font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#8E97A4] font-bold">Phân loại lỗi:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#21262D] text-white px-3.5 py-2.5 rounded-xl border border-[#3D4450] outline-none font-semibold cursor-pointer"
                >
                  <option value="grammar_tenses">Ngữ pháp & Thì (Tenses)</option>
                  <option value="grammar_agreement">Chia động từ & Sự hòa hợp S-V</option>
                  <option value="pronunciation_endings">Âm đuôi (/s/, /z/, /ed/)</option>
                  <option value="fluency_fillers">Lạm dụng từ đệm (like, you know)</option>
                  <option value="lexical_collocation">Sai Collocation & Giới từ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#8E97A4] font-bold">Quy tắc sửa nhanh 2s:</label>
                <input
                  type="text"
                  value={newDrillRule}
                  onChange={(e) => setNewDrillRule(e.target.value)}
                  placeholder="Ví dụ: S + had + V3/ed (had already left before I arrived)"
                  className="w-full bg-[#21262D] text-white px-3.5 py-2.5 rounded-xl border border-[#3D4450] outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-red-400 font-bold">Lỗi bạn hay nói (Sai):</label>
                  <input
                    type="text"
                    value={newExampleError}
                    onChange={(e) => setNewExampleError(e.target.value)}
                    placeholder="e.g. When I arrive, he already go..."
                    className="w-full bg-[#21262D] text-white px-3 py-2 rounded-xl border border-red-500/40 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-emerald-400 font-bold">Bản sửa chuẩn (Đúng):</label>
                  <input
                    type="text"
                    value={newExampleCorrection}
                    onChange={(e) => setNewExampleCorrection(e.target.value)}
                    placeholder="e.g. When I arrived, he had already gone..."
                    className="w-full bg-[#21262D] text-white px-3 py-2 rounded-xl border border-emerald-500/40 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#21262D] text-[#8E97A4] hover:text-white font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black cursor-pointer shadow-md"
                >
                  Lưu Bẫy Lỗi Vào Sổ Tay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
