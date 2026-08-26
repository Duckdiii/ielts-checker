import React, { useState } from 'react';
import {
  Mic,
  Clock,
  Flame,
  Zap,
  Sparkles,
  LifeBuoy,
  Layers,
  Headphones,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Lightbulb,
  Radio,
  Sliders,
  Coffee,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export interface SpeakingModeItem {
  id: string;
  name: string;
  shortName: string;
  icon: React.ElementType;
  color: string;
  category: 'simulation' | 'fluency' | 'precision';
  description: string;
  badge?: string;
}

export const SPEAKING_MODES: SpeakingModeItem[] = [
  // 1. Phòng Thi Thực Chiến & Giao Tiếp (Simulation & Casual)
  {
    id: 'daily-chat',
    name: 'AI Coffee Chat (Tự Do Hàng Ngày)',
    shortName: 'Coffee Chat Tự Do',
    icon: Coffee,
    color: 'from-amber-500 to-orange-500 text-amber-300',
    category: 'simulation',
    description: 'Trò chuyện tự nhiên 1-1 với 5 AI Persona • Không áp lực đề thi • Nâng cao phản xạ',
    badge: 'Daily Lounge',
  },
  {
    id: 'speaking',
    name: 'Giám Khảo Speaking 1-1',
    shortName: 'Giám Khảo 1-1',
    icon: Mic,
    color: 'from-purple-500 to-indigo-500 text-purple-300',
    category: 'simulation',
    description: 'Phòng thi thử tương tác trực tiếp Part 1-2-3 & Chấm 4 tiêu chí Cambridge',
    badge: 'Real Exam',
  },
  {
    id: 'full-mock-test',
    name: 'Full Mock Test 15 Phút',
    shortName: 'Full Mock 15p',
    icon: Clock,
    color: 'from-blue-500 to-cyan-500 text-cyan-300',
    category: 'simulation',
    description: 'Mô phỏng kỳ thi trọn vẹn 15 phút không ngắt quãng với hội đồng Cambridge',
    badge: '15 Mins',
  },
  {
    id: 'speaking-part2',
    name: 'Thử Thách Cue Card Part 2',
    shortName: 'Part 2 Cue Card',
    icon: Flame,
    color: 'from-amber-500 to-orange-500 text-amber-300',
    category: 'simulation',
    description: '1 phút ghi chú dàn ý + 2 phút nói độc thoại liên tục chuẩn áp lực phòng thi',
    badge: '1m + 2m',
  },

  // 2. Luyện Phản Xạ & Ý Tưởng (Fluency & Ideas)
  {
    id: 'quick-speaking-drill',
    name: 'Phản Xạ Nhanh 15 Giây',
    shortName: 'Phản Xạ 15s',
    icon: Zap,
    color: 'from-amber-400 to-yellow-500 text-amber-300',
    category: 'fluency',
    description: '5s chuẩn bị + 15s bắn phản xạ tức thì triệt tiêu thói quen dịch nhẩm',
    badge: 'Speed 15s',
  },
  {
    id: 'area-expander',
    name: 'Khung A.R.E.A Mở Rộng Ý',
    shortName: 'Khung A.R.E.A',
    icon: Sparkles,
    color: 'from-yellow-400 to-amber-500 text-yellow-300',
    category: 'fluency',
    description: 'Công thức 4 bước kéo dài câu trả lời từ 5s lên 45s chuẩn logic Band 8+',
    badge: 'Answer Expander',
  },
  {
    id: 'speech-ladder',
    name: 'Nấc Thang 30s ➔ 60s ➔ 120s',
    shortName: 'Nấc Thang Stamina',
    icon: Layers,
    color: 'from-emerald-400 to-teal-500 text-emerald-300',
    category: 'fluency',
    description: 'Luyện sức bền kéo dài ý tưởng tăng tiến từ 30 giây đến 2 phút',
    badge: 'Stamina',
  },
  {
    id: 'idea-mindmap',
    name: 'Sơ Đồ Ý Tưởng 5D',
    shortName: 'Mindmap 5D',
    icon: Lightbulb,
    color: 'from-orange-400 to-rose-500 text-orange-300',
    category: 'fluency',
    description: 'Máy động não ý tưởng 5 chiều (Kinh tế, Sức khỏe, Môi trường, Công nghệ, Xã hội)',
    badge: '5D Brainstorm',
  },
  {
    id: 'emergency-stalling',
    name: 'Phao Cứu Sinh Bí Ý',
    shortName: 'Phao Cứu Sinh',
    icon: LifeBuoy,
    color: 'from-rose-500 to-pink-500 text-rose-300',
    category: 'fluency',
    description: 'Mẫu câu câu giờ tự nhiên + Minigame 30s xử lý câu hỏi hóc búa',
    badge: 'Anti-Freeze',
  },

  // 3. Phát Âm & Nâng Cấp Band (Precision & Polish)
  {
    id: 'shadowing',
    name: 'Shadowing Lab Ngữ Điệu',
    shortName: 'Shadowing Lab',
    icon: Headphones,
    color: 'from-emerald-500 to-cyan-500 text-emerald-300',
    category: 'precision',
    description: 'Luyện ngữ điệu, nối âm và ngữ điệu tự nhiên qua nhại giọng bản xứ',
    badge: 'Intonation',
  },
  {
    id: 'speech-upgrade',
    name: 'Nâng Cấp Bản Nói Band 8.0',
    shortName: 'Nâng Cấp Band 8+',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500 text-purple-300',
    category: 'precision',
    description: 'Biến câu trả lời Band 5.5-6.0 thành tuyệt phẩm Band 8.0+ kèm Shadowing',
    badge: 'AI Upgrader',
  },
  {
    id: 'speaking-portfolio',
    name: 'Hồ Sơ & Kho Ghi Âm',
    shortName: 'Kho Bản Ghi',
    icon: BarChart3,
    color: 'from-indigo-500 to-blue-500 text-indigo-300',
    category: 'precision',
    description: 'Kho lưu trữ toàn bộ file ghi âm giọng nói & đồ thị tiến bộ 4 tiêu chí',
    badge: 'Vault & Charts',
  },
  {
    id: 'weakness-radar',
    name: 'Sổ Tay Bẫy Lỗi Cá Nhân',
    shortName: 'Sổ Tay Bẫy Lỗi',
    icon: ShieldAlert,
    color: 'from-red-500 to-rose-600 text-red-300',
    category: 'precision',
    description: 'Radar quét các điểm yếu ngữ pháp, phát âm và ngập ngừng lặp lại nhiều lần',
    badge: 'Weakness Radar',
  },
];

interface SpeakingHubHeaderProps {
  currentMode: string;
  onSelectMode: (modeId: string) => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
  badge?: string;
  rightActions?: React.ReactNode;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const SpeakingHubHeader: React.FC<SpeakingHubHeaderProps> = ({
  currentMode,
  onSelectMode,
  onBack,
  title,
  subtitle,
  badge,
  rightActions,
  isFocusMode = false,
  onToggleFocusMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'simulation' | 'fluency' | 'precision'>('all');
  const [isModesExpanded, setIsModesExpanded] = useState(true);

  const activeModeItem = SPEAKING_MODES.find((m) => m.id === currentMode) || SPEAKING_MODES[0];

  const categories = [
    { id: 'all', label: 'Tất cả (12)', icon: Sliders },
    { id: 'simulation', label: '🏛️ Thi Thực Chiến', icon: Mic },
    { id: 'fluency', label: '⚡ Phản Xạ & Ý Tưởng', icon: Zap },
    { id: 'precision', label: '💎 Phát Âm & Nâng Band', icon: Sparkles },
  ];

  const filteredModes =
    selectedCategory === 'all'
      ? SPEAKING_MODES
      : SPEAKING_MODES.filter((m) => m.category === selectedCategory);

  return (
    <header className="space-y-3.5 mb-5 animate-fadeIn">
      {/* Top Banner Card */}
      <div className="bg-[#12161C]/95 border border-[#242A36] rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/50 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-24 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 relative z-10">
          {/* Back Button & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                onBack();
              }}
              className="p-2.5 rounded-2xl bg-[#1A202C] hover:bg-[#242C3D] text-[#8E97A4] hover:text-white border border-[#2D3648] transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 group"
              title="Quay lại Bảng Điều Khiển"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/50">
                    <Mic className="w-4 h-4" />
                  </span>
                  <span>{title || activeModeItem.name}</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-inner">
                  {badge || activeModeItem.badge || 'IELTS Speaking Studio'}
                </span>
              </div>
              <p className="text-xs text-[#8E97A4] mt-0.5 max-w-3xl line-clamp-1">
                {subtitle || activeModeItem.description}
              </p>
            </div>
          </div>

          {/* Right Action Tools & Focus Mode Toggle */}
          <div className="flex items-center flex-wrap gap-2 ml-auto">
            {/* Custom Mode Tools injected from parent */}
            {rightActions}

            {/* Toggle Modes Ribbon Visibility */}
            {!isFocusMode && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsModesExpanded((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isModesExpanded
                    ? 'bg-[#181E2A] text-purple-300 border-purple-500/40 hover:bg-[#202738]'
                    : 'bg-[#161B24] text-[#8E97A4] border-[#252C3B] hover:text-white'
                }`}
                title="Bật/Tắt thanh chuyển 12 chế độ Speaking"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">12 Chế Độ</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isModesExpanded ? 'rotate-180 text-purple-400' : 'text-slate-400'
                  }`}
                />
              </button>
            )}

            {/* Focus Mode Button (if supported) */}
            {onToggleFocusMode && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onToggleFocusMode();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isFocusMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30'
                    : 'bg-[#1A202C] hover:bg-[#242C3D] text-[#8E97A4] hover:text-white border-[#2D3648]'
                }`}
                title="Chế độ tập trung (Focus Mode): Ẩn bớt thanh điều hướng và thông tin phụ khi đang luyện nói"
              >
                {isFocusMode ? <Eye className="w-4 h-4 text-amber-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                <span className="hidden sm:inline">
                  {isFocusMode ? 'Đang Bật Focus Mode' : 'Chế Độ Tập Trung'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills & Mode Switcher Ribbon */}
        {!isFocusMode && isModesExpanded && (
          <div className="mt-4 pt-3.5 border-t border-[#222834] space-y-3 animate-fadeIn">
            {/* Category Filter Pills */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedCategory(cat.id as any);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50 scale-[1.02]'
                        : 'bg-[#181E28] text-[#8E97A4] hover:text-white hover:bg-[#202734] border border-[#283040]'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-[#636E7E] font-medium hidden md:inline whitespace-nowrap">
                {filteredModes.length} chế độ chuyên sâu
              </span>
            </div>

            {/* Mode Buttons Grid - Clean Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
              {filteredModes.map((mode) => {
                const IconComponent = mode.icon;
                const isActive = currentMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      if (!isActive) {
                        sounds.playClick();
                        onSelectMode(mode.id);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isActive
                        ? 'bg-gradient-to-b from-[#221C38] to-[#161922] border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/40'
                        : 'bg-[#151A23] border-[#252C3B] hover:border-purple-500/30 hover:bg-[#1A212E] text-[#8E97A4] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`p-1.5 rounded-xl text-xs ${
                          isActive
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'bg-[#202736] text-[#8E97A4] group-hover:text-purple-300'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </span>
                      {mode.badge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                            isActive
                              ? 'bg-purple-500/25 text-purple-300'
                              : 'bg-[#1C2330] text-[#687384]'
                          }`}
                        >
                          {mode.badge}
                        </span>
                      )}
                    </div>

                    <div className={`text-xs font-bold line-clamp-1 ${isActive ? 'text-white' : 'text-[#A0AAB8]'}`}>
                      {mode.shortName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
