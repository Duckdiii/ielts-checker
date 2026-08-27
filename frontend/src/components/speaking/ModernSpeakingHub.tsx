import React from 'react';
import {
  Mic,
  Trophy,
  Zap,
  Clock,
  Layers,
  ArrowLeft,
  Flame,
  Sparkles,
  Coffee,
  Brain,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { VocabItem, WordSet, UserProgress } from '../../types';
import { AppViewTab } from '../../hooks/useHashNavigation';

interface ModernSpeakingHubProps {
  words: VocabItem[];
  activeSet: WordSet;
  progress: UserProgress;
  onBack: () => void;
  onNavigateMode: (mode: AppViewTab) => void;
}

export function ModernSpeakingHub({
  words,
  activeSet,
  progress,
  onBack,
  onNavigateMode,
}: ModernSpeakingHubProps) {
  const speakingModes = [
    {
      id: 'full-mock-test',
      title: '1. Full 15-Minute Mock Test Simulation',
      desc: 'Mô phỏng 100% áp lực phòng thi thật gồm đủ Part 1, Part 2 & Part 3 kèm bảng điểm chuẩn Cambridge',
      icon: Trophy,
      color: 'from-amber-500/25 to-orange-500/25 text-amber-400 border-amber-500/40',
      badge: 'Mô Phỏng Chuẩn',
      tab: 'full-mock-test',
      accent: 'text-amber-400',
    },
    {
      id: 'speaking',
      title: '2. IELTS Speaking AI Mock Examiner',
      desc: 'Luyện tập từng phần linh hoạt với Giám khảo AI bản xứ và nhận phân tích chấm điểm 4 tiêu chí',
      icon: Mic,
      color: 'from-rose-500/25 to-red-500/25 text-rose-400 border-rose-500/40',
      badge: 'Luyện Từng Part',
      tab: 'speaking',
      accent: 'text-rose-400',
    },
    {
      id: 'speaking-part2',
      title: '3. Part 2 Cue Card Trainer (1p Chuẩn Bị + 2p Nói)',
      desc: 'Rèn luyện kỹ năng ghi chú nhanh trong 1 phút và duy trì độ trôi chảy liên tục 2 phút',
      icon: Layers,
      color: 'from-indigo-500/25 to-blue-500/25 text-indigo-400 border-indigo-500/40',
      badge: 'Chuyên Sâu Part 2',
      tab: 'speaking-part2',
      accent: 'text-indigo-400',
    },
    {
      id: 'shadowing',
      title: '4. Shadowing Lab (Nhại Giọng & Ngữ Điệu Chuẩn)',
      desc: 'Phân tích âm cuối /t/, /s/, trọng âm câu và ngữ điệu tự nhiên theo chuẩn US / UK / AU',
      icon: Zap,
      color: 'from-cyan-500/25 to-teal-500/25 text-cyan-400 border-cyan-500/40',
      badge: 'Pronunciation',
      tab: 'shadowing',
      accent: 'text-cyan-400',
    },
    {
      id: 'quick-speaking-drill',
      title: '5. Phản Xạ Cấp Tốc 15 Giây (Quick Drill)',
      desc: 'Đập tan thói quen dịch nhẩm từ tiếng Việt, phản xạ tức thì với các câu hỏi Part 1 bất ngờ',
      icon: Clock,
      color: 'from-emerald-500/25 to-green-500/25 text-emerald-400 border-emerald-500/40',
      badge: 'Tốc Độ Phản Xạ',
      tab: 'quick-speaking-drill',
      accent: 'text-emerald-400',
    },
    {
      id: 'area-expander',
      title: '6. Khung Mở Rộng Câu Trả Lời AREA / PEEL',
      desc: 'Công thức 4 bước kéo dài câu trả lời mượt mà: Answer ➔ Reason ➔ Example ➔ Alternative',
      icon: TrendingUp,
      color: 'from-purple-500/25 to-indigo-500/25 text-purple-400 border-purple-500/40',
      badge: 'Kéo Dài Câu Trả Lời',
      tab: 'area-expander',
      accent: 'text-purple-400',
    },
    {
      id: 'speech-upgrade',
      title: '7. AI Speech Upgrade to Band 8.0 & Shadowing',
      desc: 'Gương thần AI: Giữ nguyên ý tưởng của bạn nhưng nâng cấp từ ngữ và ngữ pháp lên chuẩn Band 8.0+',
      icon: Sparkles,
      color: 'from-pink-500/25 to-rose-500/25 text-pink-400 border-pink-500/40',
      badge: 'Nâng Cấp Band 8+',
      tab: 'speech-upgrade',
      accent: 'text-pink-400',
    },
    {
      id: 'idea-mindmap',
      title: '8. Máy Động Não Ý Tưởng 5D (Mindmap Vạn Năng)',
      desc: 'Không bao giờ bí ý tưởng với 5 lăng kính vạn năng (Kinh tế, Sức khỏe, Xã hội, Môi trường, Công nghệ)',
      icon: Brain,
      color: 'from-yellow-500/25 to-amber-500/25 text-yellow-400 border-yellow-500/40',
      badge: 'Khai Phóng Ý Tưởng',
      tab: 'idea-mindmap',
      accent: 'text-yellow-400',
    },
    {
      id: 'daily-chat',
      title: '9. AI Daily Coffee Chat Lounge',
      desc: 'Trò chuyện tiếng Anh tự do hàng ngày cùng bạn học AI bản xứ với sửa lỗi nói tự nhiên',
      icon: Coffee,
      color: 'from-amber-600/25 to-orange-600/25 text-amber-300 border-amber-500/40',
      badge: 'Giao Tiếp Tự Do',
      tab: 'daily-chat',
      accent: 'text-amber-300',
    },
    {
      id: 'emergency-stalling',
      title: '10. Bộ Phao Cứu Sinh Khi Bí Ý (Emergency Stalling)',
      desc: 'Mẫu câu kéo dài thời gian suy nghĩ hợp lệ của người bản xứ khi gặp câu hỏi khó nhằn',
      icon: ShieldAlert,
      color: 'from-red-500/25 to-orange-500/25 text-red-400 border-red-500/40',
      badge: 'Phao Cứu Sinh',
      tab: 'emergency-stalling',
      accent: 'text-red-400',
    },
  ];

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
              <Mic className="w-6 h-6 text-rose-400" />
              <span>IELTS Speaking Hub & AI Voice Coach (10 Chế Độ Luyện Nói)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bộ công cụ toàn diện chuẩn bị cho kỳ thi IELTS Speaking cùng Giám khảo AI Cambridge
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateMode('speaking-portfolio')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Hồ Sơ Bản Thu Âm (Portfolio)</span>
        </button>
      </div>

      {/* Speaking Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {speakingModes.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <div
              key={mode.id}
              onClick={() => onNavigateMode(mode.tab as AppViewTab)}
              className="neo-glass-card p-5 sm:p-6 cursor-pointer group hover:border-rose-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.color} border flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    {mode.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                  {mode.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{mode.desc}</p>
              </div>
              <div className={`mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold ${mode.accent} group-hover:translate-x-1 transition-transform`}>
                <span>Bật micro luyện nói</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
