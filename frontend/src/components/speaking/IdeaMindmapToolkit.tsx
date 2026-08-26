import React, { useState } from 'react';
import {
  Lightbulb,
  DollarSign,
  HeartPulse,
  Leaf,
  Laptop,
  Users,
  Sparkles,
  Volume2,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Search,
  BookOpen,
  Zap,
  Target,
  LifeBuoy,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Mindmap5DimensionsResult,
  MindmapDimensionDetail,
  MindmapDimensionKey,
  VocabItem,
  WordSet,
} from '../../types';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { AccentSwitcher } from './AccentSwitcher';
import { generate5DMindmapIdeas } from '../../services/geminiService';
import confetti from 'canvas-confetti';

interface IdeaMindmapToolkitProps {
  words?: VocabItem[];
  activeSet?: WordSet;
  onBack: () => void;
  onOpenEmergencyStalling?: () => void;
  onOpenLadder?: () => void;
  onOpenSpeechUpgrade?: () => void;
  onStartPracticeInMock?: (questionText?: string) => void;
  initialTopic?: string;
  initialQuestion?: string;
}

// Preset Infamous "Brain-Freeze" IELTS Topics
const INFAMOUS_BRAIN_FREEZE_TOPICS = [
  {
    topic: 'Space Exploration & Astronomical Research',
    question: 'Should governments spend huge budgets on exploring outer space or solving earthly problems?',
    vietnameseCategory: 'Không gian vũ trụ & Thiên văn học',
  },
  {
    topic: 'Museums, Art Galleries & Ancient Artifacts',
    question: 'Why are historical museums important, and how can they attract younger generations?',
    vietnameseCategory: 'Lịch sử & Bảo tàng mỹ thuật',
  },
  {
    topic: 'Insurance Policies & Retirement Pensions',
    question: 'Do you believe it is essential for young people to invest in comprehensive health and life insurance early on?',
    vietnameseCategory: 'Bảo hiểm & Quỹ hưu trí',
  },
  {
    topic: 'Nuclear Power & Clean Renewable Energy',
    question: 'Is nuclear energy a necessary solution to global climate change despite safety concerns?',
    vietnameseCategory: 'Năng lượng hạt nhân & Môi trường',
  },
  {
    topic: 'Traditional Handicrafts & Cultural Heritage',
    question: 'Why are traditional handicraft villages fading away, and should the government preserve them?',
    vietnameseCategory: 'Làng nghề thủ công truyền thống',
  },
  {
    topic: 'Fast Fashion & Consumerism',
    question: 'How does fast fashion affect consumer behavior and the global environment?',
    vietnameseCategory: 'Thời trang nhanh & Tiêu dùng',
  },
];

export const IdeaMindmapToolkit: React.FC<IdeaMindmapToolkitProps> = ({
  words = [],
  activeSet,
  onBack,
  onOpenEmergencyStalling,
  onOpenLadder,
  onOpenSpeechUpgrade,
  onStartPracticeInMock,
  initialTopic = '',
  initialQuestion = '',
}) => {
  const [topicInput, setTopicInput] = useState<string>(
    initialTopic || INFAMOUS_BRAIN_FREEZE_TOPICS[0].topic
  );
  const [questionInput, setQuestionInput] = useState<string>(
    initialQuestion || INFAMOUS_BRAIN_FREEZE_TOPICS[0].question
  );
  const [customContext, setCustomContext] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mindmapResult, setMindmapResult] = useState<Mindmap5DimensionsResult | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<MindmapDimensionKey>('economic');
  const [expandedDimensionKeys, setExpandedDimensionKeys] = useState<Record<string, boolean>>({
    economic: true,
    health_wellbeing: true,
    environmental: false,
    tech_convenience: false,
    interpersonal: false,
  });
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);

  // Quick Preset Selection
  const handleSelectPreset = (preset: (typeof INFAMOUS_BRAIN_FREEZE_TOPICS)[0]) => {
    sounds.playClick();
    setTopicInput(preset.topic);
    setQuestionInput(preset.question);
    setMindmapResult(null);
  };

  // Generate 5D Mindmap
  const handleGenerateMindmap = async () => {
    if (!topicInput.trim() || !questionInput.trim()) {
      sounds.playWrong();
      return;
    }

    sounds.playClick();
    setIsLoading(true);

    try {
      const data = await generate5DMindmapIdeas({
        topic: topicInput,
        question: questionInput,
        customContext,
      });

      setMindmapResult(data);
      sounds.playLevelUp();
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Error generating 5D mindmap:', err);
      sounds.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDimensionExpand = (dimKey: string) => {
    sounds.playClick();
    setExpandedDimensionKeys((prev) => ({
      ...prev,
      [dimKey]: !prev[dimKey],
    }));
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswer(true);
    sounds.playClick();
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  // Dimension Helper Configs
  const DIMENSIONS_CONFIG: Record<
    MindmapDimensionKey,
    { titleVi: string; titleEn: string; icon: any; colorClass: string; bgClass: string; borderClass: string }
  > = {
    economic: {
      titleVi: '1. Tài Chính & Kinh Tế',
      titleEn: 'Economic & Financial Lens',
      icon: DollarSign,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/40',
    },
    health_wellbeing: {
      titleVi: '2. Sức Khỏe & Thể Chất / Tâm Lý',
      titleEn: 'Physical & Mental Well-being',
      icon: HeartPulse,
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-500/40',
    },
    environmental: {
      titleVi: '3. Môi Trường & Thiên Nhiên',
      titleEn: 'Environmental & Ecological Impact',
      icon: Leaf,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/40',
    },
    tech_convenience: {
      titleVi: '4. Công Nghệ & Tiện Lợi',
      titleEn: 'Convenience & Technological Advancement',
      icon: Laptop,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/40',
    },
    interpersonal: {
      titleVi: '5. Quan Hệ Xã Hội & Gia Đình',
      titleEn: 'Interpersonal & Cultural Bonds',
      icon: Users,
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-500/10',
      borderClass: 'border-purple-500/40',
    },
  };

  return (
    <div className="max-w-[1520px] w-full mx-auto space-y-6 pb-28 animate-fadeIn">
      {/* Top Header */}
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
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5" />
                5-Dimensional Mindmap Engine
              </span>
              <span className="text-xs text-[#8E97A4]">Động Não Ý Tưởng 5 Lăng Kính Vạn Năng</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              💡 Máy Động Não Ý Tưởng Thần Tốc (Mindmap Toolkit)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AccentSwitcher compact={true} />
          {onOpenEmergencyStalling && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenEmergencyStalling();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Phao Cứu Sinh Khi Bí Ý 🛡️</span>
            </button>
          )}
        </div>
      </div>

      {/* Feature Intro Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#151D2A] to-yellow-950/30 p-5 rounded-3xl border border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-300">
              Giải Quyết Bế Tắc: "Tiếng Việt Em Cũng Không Biết Nói Gì Về Chủ Đề Này!"
            </h4>
            <p className="text-xs text-[#8E97A4] leading-relaxed">
              Mọi đề thi IELTS (từ Bảo tàng, Vũ trụ đến Bảo hiểm) đều phân tích được qua <strong>5 Lăng Kính Vạn Năng</strong>: 💰 Tài chính, 🧘 Sức khỏe, 🌿 Môi trường, ⚡ Tiện ích công nghệ, và 🤝 Quan hệ xã hội!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            5 Universal Lenses
          </span>
        </div>
      </div>

      {/* Infamous Brain Freeze Topic Selector */}
      <div className="space-y-2">
        <span className="text-xs font-black text-[#8E97A4] uppercase tracking-wider flex items-center gap-1.5 px-1">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Các chủ đề "dễ đứng hình / khó nhằn" tiêu biểu:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {INFAMOUS_BRAIN_FREEZE_TOPICS.map((preset, idx) => {
            const isSelected = topicInput === preset.topic;
            return (
              <button
                key={idx}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#2D2211] border-amber-500 text-white ring-1 ring-amber-500/50 shadow'
                    : 'bg-[#151D2A] border-[#2D333B] text-[#8E97A4] hover:bg-[#1E2635] hover:text-white'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                    {preset.vietnameseCategory}
                  </div>
                  <h4 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {preset.topic}
                  </h4>
                </div>
                <div className="text-[11px] text-gray-400 mt-1 line-clamp-1 italic">
                  "{preset.question}"
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Workbench */}
      <div className="bg-[#151D2A] p-6 rounded-3xl border border-amber-500/40 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400">Chủ đề (Topic):</label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="VD: Museums & Ancient Artifacts..."
              className="w-full bg-[#101520] text-white p-3 rounded-2xl border border-[#2D333B] focus:border-amber-500 text-sm font-semibold outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400">Câu hỏi IELTS Speaking cụ thể:</label>
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="VD: Why should governments fund historical museums?"
              className="w-full bg-[#101520] text-white p-3 rounded-2xl border border-[#2D333B] focus:border-amber-500 text-sm font-semibold outline-none"
            />
          </div>
        </div>

        {/* Trigger Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateMindmap}
            disabled={isLoading || !topicInput.trim() || !questionInput.trim()}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl flex items-center gap-2 ${
              isLoading || !topicInput.trim() || !questionInput.trim()
                ? 'bg-[#21262D] text-gray-500 cursor-not-allowed border border-[#2D333B]'
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-950/60 scale-105'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Đang Động Não 5 Khía Cạnh Đa Năng...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Khai Phóng Mindmap 5 Lăng Kính Ngay ➔</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5-DIMENSIONAL MINDMAP EXPLORER */}
      {/* ========================================================================= */}
      {mindmapResult && (
        <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-6 animate-fadeIn">
          {/* Summary Overview */}
          <div className="bg-gradient-to-r from-amber-950/50 via-[#101520] to-yellow-950/40 p-5 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
              <Zap className="w-4 h-4" />
              Chiến Thuật Phối Hợp Lăng Kính (Mindmap Synergy Strategy):
            </div>
            <p className="text-sm text-gray-200 leading-relaxed font-semibold">
              {mindmapResult.summaryOverviewVi}
            </p>
          </div>

          {/* 5 Dimensional Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                5 Lăng Kính Ý Tưởng (Bấm để xem chi tiết & từ vựng):
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(DIMENSIONS_CONFIG) as MindmapDimensionKey[]).map((dimKey) => {
                const conf = DIMENSIONS_CONFIG[dimKey];
                const dimData: MindmapDimensionDetail = mindmapResult.dimensions[dimKey];
                if (!dimData) return null;
                const isExpanded = !!expandedDimensionKeys[dimKey];
                const IconComponent = conf.icon;

                return (
                  <div
                    key={dimKey}
                    className={`rounded-3xl border transition-all overflow-hidden ${
                      isExpanded ? `${conf.borderClass} ${conf.bgClass}` : 'border-[#2D333B] bg-[#101520]'
                    }`}
                  >
                    {/* Header bar */}
                    <div
                      onClick={() => toggleDimensionExpand(dimKey)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${conf.borderClass} ${conf.bgClass} ${conf.colorClass}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`text-sm font-black ${conf.colorClass}`}>
                            {conf.titleVi}
                          </h4>
                          <p className="text-[11px] text-gray-400 line-clamp-1">{dimData.taglineVi}</p>
                        </div>
                      </div>

                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="p-5 pt-0 space-y-4 border-t border-white/5">
                        {dimData.ideas.map((idea, iIdx) => (
                          <div key={iIdx} className="bg-[#151D2A] p-4 rounded-2xl border border-[#2D333B] space-y-2.5">
                            {/* Core argument */}
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-amber-200">
                                • {idea.coreArgumentVi}
                              </div>
                              <div className="text-xs font-mono text-gray-300 italic">
                                "{idea.coreArgumentEn}"
                              </div>
                            </div>

                            {/* Details bullets */}
                            {idea.bulletDetailsEn && (
                              <ul className="space-y-1 pl-3 text-[11px] text-gray-400 border-l border-gray-700">
                                {idea.bulletDetailsEn.map((b, bIdx) => (
                                  <li key={bIdx}>- {b}</li>
                                ))}
                              </ul>
                            )}

                            {/* Power Collocations */}
                            {idea.powerCollocations && idea.powerCollocations.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {idea.powerCollocations.map((col, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sounds.playClick();
                                      speakWord(col.phrase);
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-[#101520] hover:bg-[#1E2635] text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 className="w-3 h-3 text-emerald-400" />
                                    <span>{col.phrase}</span>
                                    <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-200">
                                      {col.cefrLevel}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Sample Band 8 Sentence */}
                            <div className="bg-[#101520] p-3 rounded-xl border border-[#2D333B] space-y-1">
                              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400">
                                <span>Câu mẫu Band 8.5 áp dụng góc nhìn này:</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sounds.playClick();
                                    speakWord(idea.sampleBand8Sentence);
                                  }}
                                  className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>Nghe</span>
                                </button>
                              </div>
                              <p className="text-xs font-mono text-gray-200 leading-relaxed">
                                "{idea.sampleBand8Sentence}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Synthesized Answer (Tổng hợp đa góc nhìn) */}
          <div className="bg-gradient-to-br from-[#1C1A2E] via-[#151D2A] to-[#121120] p-6 rounded-3xl border border-purple-500/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D333B] pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Bài Mẫu Band 8.5 Tổng Hợp Đa Lăng Kính (Synthesized Master Response):
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Kết hợp nhuần nhuyễn 2-3 lăng kính để tạo câu trả lời mạch lạc, thuyết phục.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    speakWord(mindmapResult.synthesizedBand8Answer);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe Giọng Đọc Mẫu</span>
                </button>
                <button
                  onClick={() => handleCopyText(mindmapResult.synthesizedBand8Answer)}
                  className="p-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title="Sao chép bài mẫu"
                >
                  {copiedAnswer ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-sm font-mono text-gray-100 leading-relaxed bg-[#101520] p-4 rounded-2xl border border-[#2D333B]">
              "{mindmapResult.synthesizedBand8Answer}"
            </p>

            {/* Quick Action to Practice in Ladder or Mock */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-gray-400">
                💡 Dùng ngay các ý tưởng này để thử thách bản thân:
              </div>

              <div className="flex flex-wrap gap-2">
                {onOpenLadder && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onOpenLadder();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Luyện Nói Tăng Tiến (30s-60s-90s) ➔</span>
                  </button>
                )}

                {onOpenSpeechUpgrade && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onOpenSpeechUpgrade();
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nâng Cấp & Shadowing 🪞</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
