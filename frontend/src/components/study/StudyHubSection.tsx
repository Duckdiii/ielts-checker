import React from 'react';
import {
  Mic,
  BookOpen,
  BarChart3,
  Search,
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  CreditCard,
  BrainCircuit,
  Keyboard,
  Puzzle,
  FileEdit,
  Timer,
  Target,
  ShieldAlert,
  Award,
  Headphones,
  LifeBuoy,
  ArrowRight,
  Sparkle,
} from 'lucide-react';
import { StudyMode } from '../../types';

interface StudyHubSectionProps {
  activeCategoryHub: 'speaking' | 'vocab' | 'analytics' | 'all';
  setActiveCategoryHub: (hub: 'speaking' | 'vocab' | 'analytics' | 'all') => void;
  modeSearchQuery: string;
  setModeSearchQuery: (q: string) => void;
  dueForReviewCount: number;
  estimatedBand: number;
  setWordsCount: number;
  onStartMode: (mode: StudyMode) => void;
}

export const StudyHubSection: React.FC<StudyHubSectionProps> = ({
  activeCategoryHub,
  setActiveCategoryHub,
  modeSearchQuery,
  setModeSearchQuery,
  dueForReviewCount,
  estimatedBand,
  setWordsCount,
  onStartMode,
}) => {
  const matchesSearch = (keywords: string[]) => {
    if (!modeSearchQuery.trim()) return true;
    const q = modeSearchQuery.toLowerCase();
    return keywords.some((k) => k.toLowerCase().includes(q));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Filter Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#16191F] p-5 sm:p-6 rounded-3xl border border-[#2D333B] shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <span>Trung Tâm Luyện Thi & Nâng Band IELTS</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Phân nhóm tối ưu theo 3 cụm trọng tâm: Luyện Nói AI, Học Từ Vựng và Phân Tích Báo Cáo
          </p>
        </div>

        {/* Search Mode Input */}
        <div className="relative min-w-[260px] sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={modeSearchQuery}
            onChange={(e) => setModeSearchQuery(e.target.value)}
            placeholder="Tìm nhanh bài tập..."
            className="w-full bg-[#1F242C] text-sm text-white placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-[#30363D] focus:border-indigo-500 focus:outline-hidden transition-colors"
          />
          {modeSearchQuery && (
            <button
              onClick={() => setModeSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* 2. Hub Switcher (3 Main Tabs + View All) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tab 1: Speaking Simulator */}
        <button
          onClick={() => setActiveCategoryHub('speaking')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 relative overflow-hidden ${
            activeCategoryHub === 'speaking'
              ? 'bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-purple-950/60 border-purple-500/80 shadow-lg shadow-purple-950/50 ring-2 ring-purple-500/40'
              : 'bg-[#16191F]/90 border-[#2D333B] hover:border-purple-500/40 hover:bg-[#1A1E26]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black ${
              activeCategoryHub === 'speaking'
                ? 'bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 text-white shadow-md'
                : 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
            }`}
          >
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">🗣️ Luyện Speaking AI</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                10 bài tập
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Mô phỏng thi 15p, Thang 30s-60s-90s, Gương soi Band 8, Mindmap 5D
            </p>
          </div>
        </button>

        {/* Tab 2: Vocabulary Hub */}
        <button
          onClick={() => setActiveCategoryHub('vocab')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 relative overflow-hidden ${
            activeCategoryHub === 'vocab'
              ? 'bg-gradient-to-r from-indigo-950/70 via-blue-950/70 to-indigo-950/60 border-indigo-500/80 shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/40'
              : 'bg-[#16191F]/90 border-[#2D333B] hover:border-indigo-500/40 hover:bg-[#1A1E26]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black ${
              activeCategoryHub === 'vocab'
                ? 'bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-md'
                : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">📚 Nạp & Ôn Từ Vựng</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                7 phương pháp
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Flashcard 3D SRS, Trắc nghiệm, Ghép họ từ, Điền từ Cloze, Dictation
            </p>
          </div>
        </button>

        {/* Tab 3: Analytics Hub */}
        <button
          onClick={() => setActiveCategoryHub('analytics')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 relative overflow-hidden ${
            activeCategoryHub === 'analytics'
              ? 'bg-gradient-to-r from-emerald-950/70 via-teal-950/70 to-emerald-950/60 border-emerald-500/80 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/40'
              : 'bg-[#16191F]/90 border-[#2D333B] hover:border-emerald-500/40 hover:bg-[#1A1E26]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black ${
              activeCategoryHub === 'analytics'
                ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">📊 Báo Cáo & Radar</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                4 công cụ
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Sổ tay bẫy lỗi, Ma trận lỗ hổng từ, Báo cáo Official TRF, Portfolio
            </p>
          </div>
        </button>
      </div>

      {/* 3. SPEAKING SIMULATOR & COACHING HUB */}
      {(activeCategoryHub === 'speaking' || activeCategoryHub === 'all') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-purple-300 flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-400" />
              <span>Hệ Thống Luyện Nói IELTS Toàn Diện (Speaking Hub)</span>
            </h3>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              Phỏng vấn AI trực tiếp • Chấm điểm 4 tiêu chí • Nâng cấp bài nói
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Card: Giám Khảo Ảo Speaking AI */}
            {matchesSearch(['giám khảo ảo', 'speaking ai', 'part 1', 'part 2', 'part 3', 'phỏng vấn']) && (
              <div
                onClick={() => onStartMode('speaking')}
                className="group bg-gradient-to-br from-[#1C1528] to-[#121418] rounded-3xl p-6 sm:p-7 border border-purple-500/50 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-950/50 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-purple-600/30 font-black">
                      <Mic className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 uppercase tracking-wider">
                      AI Examiner 🎙️
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-purple-300 transition-colors text-lg sm:text-xl">
                      Giám Khảo Ảo Speaking AI
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Đối thoại trực tiếp với giám khảo bản ngữ qua giọng nói. Chấm điểm 4 tiêu chí Fluency, Lexical, Grammar, Pronunciation và chỉ ra lỗi sai chi tiết.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-purple-300">
                  <span>Luyện tập Part 1, 2, 3</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Vào phòng thi <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: ⏱️ Thi Thử Trọn Vẹn 15 Phút */}
            {matchesSearch(['thi thử', '15 phút', 'full mock', 'cambridge', 'mock test']) && (
              <div
                onClick={() => onStartMode('full-mock-test')}
                className="group bg-gradient-to-br from-[#291A10] to-[#160D08] rounded-3xl p-6 sm:p-7 border border-orange-500/50 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-950/50 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-orange-500/30 font-black">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/40 uppercase tracking-wider">
                      15-Min Real Flow ⏱️
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-orange-300 transition-colors text-lg sm:text-xl">
                      Thi Thử Trọn Vẹn 15 Phút
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Mô phỏng áp lực thi thật IDP / BC liền mạch Part 1 + 2 + 3, đo lường độ bền bỉ Stamina và xuất phiếu điểm Official TRF chuẩn quốc tế.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-orange-300">
                  <span>100% Format Chuẩn Quốc Tế</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Bắt đầu thi 15p <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: 🎯 Luyện Nói Tăng Tiến 3 Cấp Độ (30s ➔ 60s ➔ 90s) */}
            {matchesSearch(['tăng tiến', '3 cấp độ', '30s', '60s', '90s', 'speech ladder', 'thang leo']) && (
              <div
                onClick={() => onStartMode('speech-ladder')}
                className="group bg-gradient-to-br from-[#2D2111] to-[#1A140A] rounded-3xl p-6 sm:p-7 border border-amber-500/50 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-950/50 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-orange-500 text-black flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-amber-500/30 font-black">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider animate-pulse">
                      30s ➔ 60s ➔ 90s 🎯
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-amber-300 transition-colors text-lg sm:text-xl">
                      Luyện Nói Tăng Tiến 3 Nấc
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Tuyệt chiêu chống ngợp cho người ít nói / sợ Part 2: Khởi động 30s ➔ Phát triển 60s ➔ Bùng nổ 90-120s. AI hướng dẫn đắp thêm từ vựng xịn từng nấc!
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-amber-300">
                  <span>Leo thang 3 nấc chống ngợp</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Bắt đầu nấc 1 <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: 🪞 AI Speech Upgrade & Shadowing (Band 8.0 Mirror) */}
            {matchesSearch(['gương soi', 'band 8.0', 'shadowing', 'nâng cấp', 'speech upgrade', 'mirror']) && (
              <div
                onClick={() => onStartMode('speech-upgrade')}
                className="group bg-gradient-to-br from-[#24152F] to-[#140D1B] rounded-3xl p-6 sm:p-7 border border-purple-500/50 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-950/50 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-purple-600/30 font-black">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 uppercase tracking-wider">
                      Band 8.0 Mirror 🪞
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-purple-300 transition-colors text-lg sm:text-xl">
                      Nâng Cấp Lên Band 8.0 & Shadowing
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Giữ nguyên 100% ý tưởng gốc của bạn, tự động viết lại thành bản Band 8.0 chuẩn bản xứ, phát âm thanh native và mở phòng Shadowing nói đuổi từng câu.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-purple-300">
                  <span>Đối chiếu từng câu + Shadowing</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Nâng cấp bài nói <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: 💡 Máy Động Não Ý Tưởng Thần Tốc (Mindmap 5D) */}
            {matchesSearch(['động não', 'ý tưởng', 'mindmap', '5 lăng kính', '5d', 'bí ý']) && (
              <div
                onClick={() => onStartMode('idea-mindmap')}
                className="group bg-gradient-to-br from-[#292211] to-[#151207] rounded-3xl p-6 sm:p-7 border border-yellow-500/50 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-950/50 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 via-amber-500 to-orange-500 text-black flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-yellow-500/30 font-black">
                      <Zap className="w-6 h-6 fill-black" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 uppercase tracking-wider">
                      Mindmap 5 Lăng Kính 💡
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-yellow-300 transition-colors text-lg sm:text-xl">
                      Máy Động Não Ý Tưởng 5D
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Giải cứu khi gặp chủ đề lạ (vũ trụ, bảo hiểm, bảo tàng...): Bấm 1 nút, AI gợi ý ngay 5 lăng kính vạn năng kèm từ vựng C1/C2 và bài mẫu hoàn chỉnh!
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-yellow-300">
                  <span>5 Góc nhìn giải quyết mọi đề</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Khai phóng ý tưởng <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: 🛡️ Phao Cứu Sinh (Bí Ý / Đứng Hình) */}
            {matchesSearch(['phao cứu sinh', 'bí ý', 'đứng hình', 'stalling', 'câu giờ']) && (
              <div
                onClick={() => onStartMode('emergency-stalling')}
                className="group bg-gradient-to-br from-[#291319] to-[#160A0E] rounded-3xl p-6 sm:p-7 border border-rose-500/50 hover:border-rose-400 hover:shadow-2xl hover:shadow-rose-950/50 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-rose-500/30 font-black">
                      <LifeBuoy className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 uppercase tracking-wider">
                      Phao Cứu Sinh 🛡️
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-rose-300 transition-colors text-lg sm:text-xl">
                      Phao Cứu Sinh Khi Bí Ý
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Kho cụm từ "câu giờ học thuật" cho 6 tình huống khẩn cấp (cần 3s nghĩ ý, quên từ, đổi góc nhìn) + Minigame nói không ngắt quãng 30s!
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-rose-300">
                  <span>6 Tình huống + Minigame 30s</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Mở phao cứu sinh <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: 🏗️ Mở Rộng Câu Trả Lời (AREA Expander) */}
            {matchesSearch(['mở rộng câu', 'area', 'peel', 'công thức', 'expander']) && (
              <div
                onClick={() => onStartMode('area-expander')}
                className="group bg-gradient-to-br from-[#231F11] to-[#141208] rounded-3xl p-6 sm:p-7 border border-yellow-500/40 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-950/40 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-600 text-black flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-yellow-500/30 font-black">
                      <Sparkles className="w-6 h-6 fill-black" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 uppercase tracking-wider">
                      A.R.E.A Formula 🏗️
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-yellow-300 transition-colors text-lg sm:text-xl">
                      Mở Rộng Câu Trả Lời (A.R.E.A)
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Kéo dài câu trả lời từ 5s ngắn củn lên 45s chuẩn Band 8.0 bằng công thức: Answer ➔ Reason ➔ Example ➔ Alternative/Impact.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-yellow-300">
                  <span>Kéo dài câu từ 5s lên 45s</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Mở bộ kéo dài câu <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: 📋 Luyện Nói Part 2 Chuyên Sâu */}
            {matchesSearch(['part 2', 'cue card', 'luyện nói', '1 phút']) && (
              <div
                onClick={() => onStartMode('speaking-part2')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-pink-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600/20 to-rose-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-all shadow-md">
                      <FileEdit className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/25 uppercase tracking-wider">
                      Cue Card Part 2
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-pink-300 transition-colors text-lg sm:text-xl">
                      Luyện Nói Part 2 Chuyên Sâu
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Đồng hồ đếm ngược 1 phút chuẩn bị dàn ý + 2 phút nói liên tục. Tích hợp từ vựng mục tiêu và chấm điểm độ trôi chảy Fluency.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-pink-400">
                  <span>1 phút chuẩn bị + 2 phút nói</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Luyện Part 2 <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: 🎧 Shadowing Lab */}
            {matchesSearch(['shadowing', 'nhại giọng', 'phát âm', 'ngữ điệu']) && (
              <div
                onClick={() => onStartMode('shadowing')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-emerald-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md">
                      <Headphones className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase tracking-wider">
                      Shadowing Lab
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-emerald-300 transition-colors text-lg sm:text-xl">
                      Phòng Thí Nghiệm Shadowing
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Luyện nhại giọng theo phát âm người bản xứ (UK/US/AU), chuẩn hóa ngữ điệu, nuốt âm, nối âm và bật chuẩn âm đuôi ending sounds.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-emerald-400">
                  <span>Luyện ngữ điệu & trọng âm</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Vào Shadowing <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: ⚡ Phản Xạ Nói 15s */}
            {matchesSearch(['phản xạ', '15s', 'quick drill', 'part 1', 'nói nhanh']) && (
              <div
                onClick={() => onStartMode('quick-speaking-drill')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-amber-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600/20 to-orange-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-md">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase tracking-wider">
                      15s Quick Fire
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-amber-300 transition-colors text-lg sm:text-xl">
                      Phản Xạ Nói Nhanh 15s
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Mô phỏng Part 1 với 5 giây chuẩn bị và 15 giây nói phản xạ tức thì, ép não bộ tư duy hoàn toàn bằng tiếng Anh không ngắt quãng.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-amber-400">
                  <span>5s Chuẩn bị + 15s Nói</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Bắn phản xạ <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. VOCABULARY MASTERY HUB */}
      {(activeCategoryHub === 'vocab' || activeCategoryHub === 'all') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-indigo-300 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Phương Pháp Nạp & Ghi Nhớ Từ Vựng Chuyên Sâu (Vocabulary Hub)</span>
            </h3>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              Thuật toán SRS đan xen • Nạp từ mới & Củng cố trí nhớ vĩnh viễn
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Card: Flashcard 3D & SRS */}
            {matchesSearch(['flashcard', '3d', 'srs', 'lật thẻ', 'ôn tập']) && (
              <div
                onClick={() => onStartMode('flashcard')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-indigo-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-md">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 uppercase tracking-wider">
                      SRS 3D + Audio
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-indigo-300 transition-colors text-lg sm:text-xl">
                      Flashcard 3D & SRS
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Lật thẻ phản xạ 3 chiều, phát âm bản ngữ, tra cứu họ từ, đồng nghĩa và ghi nhớ chu kỳ xen kẽ thông minh chuẩn Spaced Repetition.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-indigo-400">
                  <span>{dueForReviewCount} từ cần củng cố</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Luyện ngay <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: Trắc Nghiệm Phản Xạ */}
            {matchesSearch(['trắc nghiệm', 'quiz', '4 lựa chọn', 'phản xạ']) && (
              <div
                onClick={() => onStartMode('quiz')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-blue-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-cyan-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 uppercase tracking-wider">
                      4 Dạng Đề
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-blue-300 transition-colors text-lg sm:text-xl">
                      Trắc Nghiệm Phản Xạ
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Kiểm tra nghĩa Anh-Việt, tìm từ đồng nghĩa IELTS và chọn từ đúng trong ngữ cảnh trích dẫn bài đọc chuẩn Cambridge.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-blue-400">
                  <span>Đan xen từ mới & từ khó</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Làm bài <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: Luyện Chính Tả & Phát Âm */}
            {matchesSearch(['chính tả', 'spelling', 'dictation', 'nghe', 'phát âm']) && (
              <div
                onClick={() => onStartMode('spelling')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-emerald-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md">
                      <Keyboard className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase tracking-wider">
                      Audio Dictation
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-emerald-300 transition-colors text-lg sm:text-xl">
                      Luyện Chính Tả & Nghe
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Nghe phát âm người bản ngữ và gõ lại chính xác từng ký tự, chống sai chính tả trong bài thi IELTS Listening & Writing.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-emerald-400">
                  <span>Chấm điểm theo thời gian thực</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Gõ phím <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: Ghép Họ Từ Vựng */}
            {matchesSearch(['ghép từ', 'họ từ', 'word family', 'noun', 'verb', 'adj']) && (
              <div
                onClick={() => onStartMode('word-family')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-amber-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600/20 to-yellow-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-md">
                      <Puzzle className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase tracking-wider">
                      Word Family
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-amber-300 transition-colors text-lg sm:text-xl">
                      Ghép Họ Từ Vựng
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Mở rộng vốn từ gấp 4 lần bằng cách phân biệt và ghép đúng Danh từ (Noun), Động từ (Verb), Tính từ (Adj), Trạng từ (Adv).
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-amber-400">
                  <span>Nhân 4 vốn từ học thuật</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Ghép thẻ <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: Điền Từ Vào Đoạn Văn */}
            {matchesSearch(['điền từ', 'cloze', 'câu', 'ngữ cảnh']) && (
              <div
                onClick={() => onStartMode('cloze')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-cyan-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-md">
                      <FileEdit className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 uppercase tracking-wider">
                      Sentence Cloze
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-cyan-300 transition-colors text-lg sm:text-xl">
                      Điền Từ Vào Đoạn Văn
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Hoàn thành câu học thuật trích từ bài báo khoa học và bài thi IELTS thực tế, nắm chắc ngữ pháp và giới từ đi kèm (collocations).
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-cyan-400">
                  <span>Ứng dụng ngữ cảnh thực tế</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Điền câu <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: Luyện Tốc Độ 60 Giây */}
            {matchesSearch(['tốc độ', '60 giây', 'timed drill', 'speed']) && (
              <div
                onClick={() => onStartMode('timed-drill')}
                className="group bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] hover:border-red-500/60 hover:bg-[#1C2027] transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600/20 to-orange-600/20 text-red-400 border border-red-500/30 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-md">
                      <Timer className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/25 uppercase tracking-wider">
                      Speed Drill 60s
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-red-300 transition-colors text-lg sm:text-xl">
                      Luyện Tốc Độ 60 Giây
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Thử thách nhận diện nghĩa của càng nhiều từ càng tốt trong 60 giây, rèn phản xạ nhận diện từ vựng tức thì khi đọc bài Reading.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-red-400">
                  <span>Đua điểm & Chuỗi đúng Combo</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Chạy đua <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: AI Band Booster */}
            {matchesSearch(['ai band booster', 'nâng cấp', 'c1', 'c2', 'từ vựng']) && (
              <div
                onClick={() => onStartMode('ai-booster')}
                className="group bg-gradient-to-br from-[#1C152B] to-[#121418] rounded-3xl p-6 sm:p-7 border border-purple-500/40 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-950/40 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-purple-600/30">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase tracking-wider">
                      AI Band Booster ✨
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-purple-300 transition-colors text-lg sm:text-xl">
                      AI Nâng Cấp Từ Vựng (C1/C2)
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Nhập bất kỳ từ vựng hoặc câu văn đơn giản, AI sẽ nâng cấp sang 3 cấp độ từ vựng C1/C2 học thuật kèm ví dụ IELTS Band 8.5+.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-purple-300">
                  <span>Biến từ vựng thường thành C1/C2</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Mở trợ lý AI <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. ANALYTICS & RADAR HUB */}
      {(activeCategoryHub === 'analytics' || activeCategoryHub === 'all') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-emerald-300 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Phân Tích Dữ Liệu & Báo Cáo Năng Lực (Analytics & Radar)</span>
            </h3>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              Phát hiện bẫy lỗi cố hữu • Lỗ hổng từ vựng • Báo cáo Official TRF
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Card: Sổ Tay Bẫy Lỗi & Radar */}
            {matchesSearch(['sổ tay bẫy lỗi', 'radar', 'yếu điểm', 'weakness', 'lỗi sai']) && (
              <div
                onClick={() => onStartMode('weakness-radar')}
                className="group bg-gradient-to-br from-[#281313] to-[#140A0A] rounded-3xl p-6 sm:p-7 border border-red-500/50 hover:border-red-400 hover:shadow-2xl hover:shadow-red-950/50 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-red-600/30 font-black">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/40 uppercase tracking-wider">
                      Weakness Radar 🛑
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-red-300 transition-colors text-lg sm:text-xl">
                      Sổ Tay Bẫy Lỗi & Radar
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Tổng hợp Top 5 bẫy lỗi cá nhân hóa của riêng bạn (quên chia thì quá khứ, phát âm thiếu s/es, ngập ngừng...) kèm bài tập tiêu diệt tận gốc!
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-red-300">
                  <span>Radar 5 tiêu chí bẫy lỗi</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Mở sổ tay bẫy lỗi <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: Ma Trận Lỗ Hổng Từ Vựng */}
            {matchesSearch(['lỗ hổng', 'ma trận', 'vocab gap', 'matrix', 'chủ đề']) && (
              <div
                onClick={() => onStartMode('progress')}
                className="group bg-gradient-to-br from-[#1C1F2E] to-[#121418] rounded-3xl p-6 sm:p-7 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-950/40 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-cyan-600/30">
                      <Target className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                      Gap Matrix 🔍
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-cyan-300 transition-colors text-lg sm:text-xl">
                      Ma Trận Lỗ Hổng Từ Vựng
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Phát hiện chính xác những từ vựng bạn còn thiếu trong từng chủ đề thi IELTS (Môi trường, Kinh tế, Công nghệ...) và đề xuất bổ sung tức thì.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-cyan-300">
                  <span>Quét lỗ hổng theo từng Topic</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Mở ma trận <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: Báo Cáo Tiến Độ & TRF */}
            {matchesSearch(['báo cáo', 'tiến độ', 'trf', 'ước tính band', 'certificate']) && (
              <div
                onClick={() => onStartMode('progress')}
                className="group bg-gradient-to-br from-[#12241C] to-[#0A1410] rounded-3xl p-6 sm:p-7 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-950/40 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-emerald-600/30">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                      Official TRF 📈
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-emerald-300 transition-colors text-lg sm:text-xl">
                      Báo Cáo Tiến Độ & Ước Tính Band
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Theo dõi chuỗi ngày Streak, thời gian học tập, tỷ lệ thành thạo SRS và xem chứng chỉ ước tính Band IELTS Test Report Form chuẩn Cambridge.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-emerald-300">
                  <span>IELTS Band {estimatedBand.toFixed(1)}</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Xem báo cáo <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}

            {/* Card: Kho Bài Nói & Đồ Thị Portfolio */}
            {matchesSearch(['portfolio', 'kho bài nói', 'ghi âm', 'transcript', 'đồ thị']) && (
              <div
                onClick={() => onStartMode('speaking-portfolio')}
                className="group bg-gradient-to-br from-[#15232D] to-[#0A141A] rounded-3xl p-6 sm:p-7 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-950/40 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-cyan-600/30">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                      Speaking Portfolio 🎙️
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-white group-hover:text-cyan-300 transition-colors text-lg sm:text-xl">
                      Kho Bài Nói & Đồ Thị Tiến Bộ
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Lưu trữ toàn bộ bản ghi âm, transcript, lời nhận xét của giám khảo AI qua từng ngày và biểu đồ radar phát triển 4 tiêu chí Speaking.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-[#2D333B] flex items-center justify-between text-sm font-bold text-cyan-300">
                  <span>Nghe lại bài nói & biểu đồ</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Mở portfolio <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
