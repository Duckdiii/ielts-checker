import React from 'react';
import {
  Sparkles,
  Target,
  Flame,
  Calendar,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  BookOpen,
  Mic,
  ChevronRight,
  Edit3,
  User,
} from 'lucide-react';
import { UserProfile, UserProgress, VocabItem, WordSet } from '../../types';
import {
  generatePersonalizedPlan,
  DailyPersonalizedMission,
} from '../../utils/personalizationEngine';
import { sounds } from '../../utils/soundEffects';

interface PersonalizedStudyHubProps {
  profile: UserProfile;
  progress: UserProgress;
  words: VocabItem[];
  sets: WordSet[];
  onStartMode: (mode: any) => void;
  onOpenProfile: () => void;
  onSelectTopic?: (topic: string) => void;
}

export const PersonalizedStudyHub: React.FC<PersonalizedStudyHubProps> = ({
  profile,
  progress,
  words,
  sets,
  onStartMode,
  onOpenProfile,
  onSelectTopic,
}) => {
  const plan = generatePersonalizedPlan(profile, progress, words);

  const completedMissionsCount = plan.dailyMissions.filter((m) => m.isCompleted).length;
  const totalMissionsCount = plan.dailyMissions.length;
  const allMissionsCompleted = completedMissionsCount === totalMissionsCount;

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#181B22] to-[#121418] border border-[#2B3038] p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-5">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -ml-10 -mb-10" />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: AI COACH GREETING & PERSONALIZED TARGET SUMMARY            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white">
                Chào {profile.displayName} 👋
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Mục tiêu Band {profile.targetBand?.toFixed(1) || '7.5'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Lộ trình học cá nhân hóa: {profile.dailyBudgetMinutes || 30} phút/ngày
              {plan.daysUntilExam !== null && (
                <span className="text-purple-300 font-bold ml-1.5">
                  • Còn {plan.daysUntilExam} ngày đến kỳ thi
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action button to open Profile */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="px-3.5 py-2 rounded-xl bg-[#21262E] hover:bg-[#2A313C] border border-[#363D47] text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span>Hồ Sơ & Mục Tiêu</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. AI COACHING ADVICE PILL                                                */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1D2128]/80 border border-[#30363F] flex items-start gap-3 text-xs leading-relaxed text-slate-300 relative z-10">
        <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
          <Zap className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-white block mb-0.5">Lời khuyên AI hôm nay:</span>
          <span>{plan.coachingMessage}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DAILY PERSONALIZED MISSIONS CHECKLIST                                  */}
      {/* ========================================================================= */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Nhiệm Vụ Học Tập Hôm Nay ({completedMissionsCount}/{totalMissionsCount})
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {allMissionsCompleted ? '🎉 Đã hoàn thành tất cả!' : `${completedMissionsCount}/${totalMissionsCount} Hoàn tất`}
            </span>
          </div>
        </div>

        {/* Missions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {plan.dailyMissions.map((mission: DailyPersonalizedMission) => {
            return (
              <div
                key={mission.id}
                onClick={() => {
                  sounds.playClick();
                  onStartMode(mission.mode);
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                  mission.isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-[#181B22] hover:bg-[#1E222A] border-[#2E333D] hover:border-indigo-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{mission.icon}</span>
                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {mission.title}
                      </span>
                    </div>

                    {mission.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        +{mission.xpReward} XP
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {mission.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#262A32] flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400">
                    {mission.priorityTag || 'Nhiệm vụ'}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    <span>{mission.isCompleted ? 'Luyện thêm' : 'Bắt đầu ngay'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RECOMMENDED TOPICS PILLS (Goal-Based)                                  */}
      {/* ========================================================================= */}
      <div className="pt-2 border-t border-[#262A32] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase text-slate-400">
            Chuyên đề gợi ý cho bạn:
          </span>
          {plan.recommendedTopics.map((topic, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                sounds.playClick();
                if (onSelectTopic) onSelectTopic(topic);
              }}
              className="px-2.5 py-1 rounded-xl bg-[#21262E] hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-[#30363D] hover:border-indigo-500/40 transition-colors text-[11px] font-semibold cursor-pointer"
            >
              #{topic}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          AI Engine: gemini-3.7-flash
        </span>
      </div>
    </div>
  );
};
