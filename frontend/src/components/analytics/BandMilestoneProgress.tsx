import React from 'react';
import { Award, Target, Sparkles, ChevronRight, TrendingUp, CheckCircle, Info } from 'lucide-react';
import { VocabItem } from '../../types';

interface BandMilestoneProgressProps {
  currentBand: number;
  words: VocabItem[];
  onOpenTargetDetails?: () => void;
}

interface Milestone {
  band: number;
  title: string;
  cefr: string;
  desc: string;
  minMastered: number;
  color: string;
  badgeBg: string;
  borderColor: string;
}

const MILESTONES: Milestone[] = [
  {
    band: 5.0,
    title: 'Cơ bản (B1)',
    cefr: 'B1',
    desc: 'Hiểu nghĩa cốt lõi, từ vựng thông dụng hàng ngày',
    minMastered: 30,
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30',
  },
  {
    band: 6.0,
    title: 'Khá (B2)',
    cefr: 'B2',
    desc: 'Từ vựng học thuật Academic Word List (AWL), ít dùng sai nghĩa',
    minMastered: 120,
    color: 'text-teal-400',
    badgeBg: 'bg-teal-500/15',
    borderColor: 'border-teal-500/30',
  },
  {
    band: 6.5,
    title: 'Trung Cấp Cao (B2+)',
    cefr: 'B2+',
    desc: 'Biết paraphrase, sử dụng linh hoạt collocations theo chủ đề',
    minMastered: 280,
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30',
  },
  {
    band: 7.5,
    title: 'Nâng Cao (C1)',
    cefr: 'C1',
    desc: 'Vốn từ chuyên sâu C1, cụm Collocations tự nhiên, ít lặp từ',
    minMastered: 550,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
  },
  {
    band: 8.5,
    title: 'Master Chuyên Nghiệp (C2)',
    cefr: 'C2',
    desc: 'Thành thạo từ vựng hiếm C2, sắc thái ngữ nghĩa tinh tế',
    minMastered: 900,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
  },
];

export const BandMilestoneProgress: React.FC<BandMilestoneProgressProps> = ({
  currentBand,
  words,
}) => {
  const masteredCount = words.filter((w) => (w.srsStage || 0) >= 3).length;
  const c1c2Mastered = words.filter(
    (w) => (w.srsStage || 0) >= 3 && (w.cefrLevel === 'C1' || w.cefrLevel === 'C2')
  ).length;

  // Find current and next milestone
  let currentIdx = 0;
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (currentBand >= MILESTONES[i].band) {
      currentIdx = i;
      break;
    }
  }

  const currentMilestone = MILESTONES[currentIdx];
  const nextMilestone = currentIdx < MILESTONES.length - 1 ? MILESTONES[currentIdx + 1] : null;

  // Calculate percentage toward next milestone
  let progressToNext = 100;
  let wordsNeeded = 0;
  if (nextMilestone) {
    const prevRequired = currentMilestone.minMastered;
    const nextRequired = nextMilestone.minMastered;
    const diff = nextRequired - prevRequired;
    const userProgress = Math.max(0, masteredCount - prevRequired);
    progressToNext = Math.min(100, Math.max(8, Math.round((userProgress / diff) * 100)));
    wordsNeeded = Math.max(0, nextRequired - masteredCount);
  }

  return (
    <div className="bg-[#16191F] border border-[#2D333B] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Lộ Trình Nâng Band IELTS
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                AI Roadmap
              </span>
            </div>
            <p className="text-xs text-[#8E97A4] mt-0.5">
              Định vị năng lực từ vựng học thuật & chuẩn bị cho phòng thi
            </p>
          </div>
        </div>

        {/* Current Band Highlight */}
        <div className="flex items-center gap-2.5 bg-[#1C2027] border border-[#30363D] px-3.5 py-1.5 rounded-2xl">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E97A4]">
              Band Ước Tính
            </div>
            <div className="text-xs font-bold text-emerald-400">
              {currentMilestone.title}
            </div>
          </div>
          <div className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {currentBand.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Visual Roadmap Stepper */}
      <div className="mt-6 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {MILESTONES.map((m, idx) => {
            const isPassed = currentBand >= m.band;
            const isCurrent = currentMilestone.band === m.band;
            const isNext = nextMilestone?.band === m.band;

            return (
              <div
                key={m.band}
                className={`relative rounded-3xl p-4 border transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-b from-indigo-950/50 to-[#1A1E26] border-indigo-500 shadow-xl shadow-indigo-950/60 ring-2 ring-indigo-500/40'
                    : isPassed
                    ? 'bg-[#1C2027]/95 border-emerald-500/50 shadow-md'
                    : isNext
                    ? 'bg-[#181B22] border-purple-500/40 hover:border-purple-500/70 shadow-md'
                    : 'bg-[#121418]/70 border-[#2D333B]/70 opacity-70'
                }`}
              >
                {/* Header row in step */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${m.badgeBg} ${m.color} border ${m.borderColor}`}>
                    Band {m.band.toFixed(1)}
                  </span>
                  {isPassed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : isNext ? (
                    <Target className="w-4 h-4 text-purple-400 animate-pulse" />
                  ) : (
                    <span className="text-xs text-[#8E97A4] font-mono">#{idx + 1}</span>
                  )}
                </div>

                <div className="text-sm font-black text-white truncate">{m.cefr} Level</div>
                <div className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                  {m.desc}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#2D333B] flex items-center justify-between text-xs text-[#8E97A4]">
                  <span>Yêu cầu:</span>
                  <span className="font-bold text-white">{m.minMastered}+ từ</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar & Action Insight */}
      <div className="mt-5 pt-4 border-t border-[#2D333B] relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8E97A4] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                Tiến độ tới mục tiêu tiếp theo:{' '}
                <strong className="text-white">
                  {nextMilestone ? `Band ${nextMilestone.band.toFixed(1)} (${nextMilestone.title})` : 'Hoàn thành Band 8.5+ Master!'}
                </strong>
              </span>
              <span className="font-bold text-indigo-400">{progressToNext}%</span>
            </div>

            {/* Track */}
            <div className="w-full h-2.5 bg-[#121418] rounded-full overflow-hidden border border-[#2D333B] p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 shadow-sm"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            {nextMilestone && wordsNeeded > 0 ? (
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Cần thêm <strong className="text-white font-bold">{wordsNeeded}</strong> từ C1/C2 nữa
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Vốn từ IELTS đỉnh cao!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
