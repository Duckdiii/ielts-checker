import React, { useState } from 'react';
import {
  LayoutDashboard,
  Zap,
  BookOpen,
  LineChart,
  Volume2,
  VolumeX,
  Plus,
  Play,
  Brain,
  Timer,
  Layers,
  Sparkles,
  X,
  Mic,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenAddWord: () => void;
  bandScore: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddWord,
  bandScore,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const handleToggleMute = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
    if (!next) {
      sounds.playClick();
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'practice-hub',
      label: 'Luyện tập',
      icon: Zap,
      isSpecial: true,
    },
    {
      id: 'list',
      label: 'Kho từ',
      icon: BookOpen,
    },
    {
      id: 'progress',
      label: `Band ${bandScore.toFixed(1)}`,
      icon: LineChart,
    },
  ];

  return (
    <>
      {/* Quick Practice Mode Drawer on Mobile */}
      {isQuickMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#16191F] border-t border-[#30363D] rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Chọn Chế Độ Luyện Thi IELTS</h3>
                  <p className="text-xs text-slate-300">Luyện Nói Speaking AI & Nạp Từ Vựng Siêu Tốc</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickMenuOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#21262E] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Speaking Simulator */}
              <button
                onClick={() => {
                  onSelectTab('speaking');
                  setIsQuickMenuOpen(false);
                  sounds.playClick();
                }}
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 to-[#1C2027] border border-purple-500/50 hover:border-purple-400 flex flex-col items-start gap-2.5 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Giám Khảo Speaking</div>
                  <div className="text-xs text-purple-300 font-medium">Thi thử Part 1-2-3</div>
                </div>
              </button>

              {/* Full Mock 15p */}
              <button
                onClick={() => {
                  onSelectTab('full-mock-test');
                  setIsQuickMenuOpen(false);
                  sounds.playClick();
                }}
                className="p-4 rounded-2xl bg-[#1C2027] border border-orange-500/40 hover:border-orange-400 flex flex-col items-start gap-2.5 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Thi Thử 15 Phút</div>
                  <div className="text-xs text-slate-300 font-medium">Phiếu điểm TRF AI</div>
                </div>
              </button>

              {/* Flashcard 3D */}
              <button
                onClick={() => {
                  onSelectTab('flashcard');
                  setIsQuickMenuOpen(false);
                  sounds.playClick();
                }}
                className="p-4 rounded-2xl bg-[#1C2027] border border-indigo-500/40 hover:border-indigo-400 flex flex-col items-start gap-2.5 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Flashcard 3D SRS</div>
                  <div className="text-xs text-slate-300 font-medium">Lặp lại ngắt quãng</div>
                </div>
              </button>

              {/* Quiz Mode */}
              <button
                onClick={() => {
                  onSelectTab('quiz');
                  setIsQuickMenuOpen(false);
                  sounds.playClick();
                }}
                className="p-4 rounded-2xl bg-[#1C2027] border border-blue-500/40 hover:border-blue-400 flex flex-col items-start gap-2.5 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Trắc Nghiệm 4 Dạng</div>
                  <div className="text-xs text-slate-300 font-medium">Đo độ nhạy phản xạ</div>
                </div>
              </button>

              {/* AI Band Booster */}
              <button
                onClick={() => {
                  onSelectTab('ai-booster');
                  setIsQuickMenuOpen(false);
                  sounds.playClick();
                }}
                className="p-4 rounded-2xl bg-[#1C2027] border border-purple-500/40 hover:border-purple-400 flex flex-col items-start gap-2.5 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">AI Band Booster</div>
                  <div className="text-xs text-slate-300 font-medium">Nâng cấp từ C1/C2</div>
                </div>
              </button>

              {/* Timed Drill 7s */}
              <button
                onClick={() => {
                  onSelectTab('timed-drill');
                  setIsQuickMenuOpen(false);
                  sounds.playClick();
                }}
                className="p-4 rounded-2xl bg-[#1C2027] border border-amber-500/40 hover:border-amber-400 flex flex-col items-start gap-2.5 text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Bấm Giờ 7s Focus</div>
                  <div className="text-xs text-slate-300 font-medium">Phản xạ áp lực cao</div>
                </div>
              </button>
            </div>

            <div className="pt-3 border-t border-[#2D333B] flex items-center justify-between">
              <button
                onClick={() => {
                  onOpenAddWord();
                  setIsQuickMenuOpen(false);
                }}
                className="flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 py-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm từ thủ công
              </button>

              <button
                onClick={handleToggleMute}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 hover:text-white py-1 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'Đang tắt âm' : 'Âm thanh FX'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Sticky Mobile Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121418]/95 backdrop-blur-xl border-t border-[#2D333B] px-4 py-2 shadow-2xl flex items-center justify-around"
      >
        {navItems.map((item) => {
          const isActive =
            item.id === 'practice-hub'
              ? ['flashcard', 'quiz', 'spelling', 'word-family', 'cloze', 'timed-drill', 'ai-booster', 'speaking', 'full-mock-test'].includes(
                  activeTab
                )
              : activeTab === item.id;

          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playClick();
                  setIsQuickMenuOpen(true);
                }}
                className="relative -top-4 flex flex-col items-center group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-indigo-900/60 ring-4 ring-[#121418] group-active:scale-95 transition-transform">
                  <Zap className="w-6 h-6 fill-white" />
                </div>
                <span className="text-xs font-black text-indigo-400 mt-1">
                  Luyện tập
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                sounds.playClick();
                onSelectTab(item.id);
              }}
              className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-indigo-400 font-bold bg-indigo-500/10'
                  : 'text-[#8E97A4] hover:text-[#C9D1D9]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-xs mt-1 font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
