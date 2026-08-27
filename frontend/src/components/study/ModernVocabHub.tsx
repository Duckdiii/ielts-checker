import React from 'react';
import {
  BookOpen,
  Gamepad2,
  ListFilter,
  Sparkles,
  Layers,
  SpellCheck,
  FileQuestion,
  HelpCircle,
  Clock,
  ArrowLeft,
  PenTool,
  ChevronRight,
  Zap,
  Award,
} from 'lucide-react';
import { VocabItem, WordSet, UserProgress } from '../../types';
import { AppViewTab } from '../../hooks/useHashNavigation';

interface ModernVocabHubProps {
  words: VocabItem[];
  activeSet: WordSet;
  allWords: VocabItem[];
  progress: UserProgress;
  onBack: () => void;
  onNavigateMode: (mode: AppViewTab) => void;
}

export function ModernVocabHub({
  words,
  activeSet,
  progress,
  onBack,
  onNavigateMode,
}: ModernVocabHubProps) {
  const allVocabModes = [
    {
      id: 'flashcard',
      title: '1. Lật Thẻ Thông Minh FSRS (3D Flashcards)',
      desc: 'Thuật toán lặp lại ngắt quãng FSRS tối ưu ghi nhớ dài hạn với 4 mức: Again, Hard, Good, Easy',
      icon: BookOpen,
      color: 'from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30',
      badge: 'Cốt Lõi FSRS',
      tab: 'flashcard',
      accent: 'text-indigo-400',
    },
    {
      id: 'quiz',
      title: '2. Trắc Nghiệm 4 Lựa Chọn (Quiz Mode)',
      desc: 'Luyện phản xạ nhận diện nhanh định nghĩa học thuật, ngữ cảnh và các cụm collocations đắt giá',
      icon: HelpCircle,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      badge: 'Phản Xạ Nhanh',
      tab: 'quiz',
      accent: 'text-amber-400',
    },
    {
      id: 'spelling',
      title: '3. Chính Tả & Nghe Viết (Spelling & Dictation)',
      desc: 'Nghe phát âm chuẩn Cambridge (UK/US/AU) và gõ lại đúng 100% chính tả từ vựng học thuật',
      icon: SpellCheck,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      badge: 'Nghe Viết Chuẩn',
      tab: 'spelling',
      accent: 'text-emerald-400',
    },
    {
      id: 'cloze',
      title: '4. Điền Từ Ngữ Cảnh (Sentence Cloze)',
      desc: 'Đọc câu văn mẫu chuẩn IELTS và điền từ vựng chuẩn xác vào ngữ cảnh của câu',
      icon: FileQuestion,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
      badge: 'Ngữ Cảnh IELTS',
      tab: 'cloze',
      accent: 'text-cyan-400',
    },
    {
      id: 'word-family',
      title: '5. Ghép Họ Từ & Đồng Nghĩa (Word Family Match)',
      desc: 'Thử thách nối các biến thể họ từ (Noun/Verb/Adj) và các cặp từ đồng nghĩa/trái nghĩa học thuật',
      icon: Layers,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      badge: 'Họ Từ & Synonym',
      tab: 'word-family',
      accent: 'text-purple-400',
    },
    {
      id: 'timed-drill',
      title: '6. Tốc Độ Tập Trung 60 Giây (Timed Drill)',
      desc: 'Thử thách tốc độ nhận diện và ghi nhớ từ vựng dưới áp lực đồng hồ đếm ngược 60 giây nghẹt thở',
      icon: Clock,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
      badge: 'Áp Lực Thời Gian',
      tab: 'timed-drill',
      accent: 'text-rose-400',
    },
    {
      id: 'ai-booster',
      title: '7. AI Band Booster Center (Mở Rộng Collocations)',
      desc: 'Phòng nghiên cứu AI chuyên sâu: Phân tích bẫy lỗi, sắc thái nghĩa và nâng cấp câu lên Band 8.5+',
      icon: Sparkles,
      color: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-400 border-fuchsia-500/30',
      badge: 'AI Nâng Cấp Band',
      tab: 'ai-booster',
      accent: 'text-fuchsia-400',
    },
    {
      id: 'list',
      title: '8. Kho Tra Cứu Từ Vựng Chi Tiết (Word Library)',
      desc: 'Tra cứu toàn diện 2.000+ từ vựng, lọc theo Band CEFR, chủ đề, từ đánh dấu và quản lý bộ từ',
      icon: ListFilter,
      color: 'from-slate-500/20 to-slate-400/20 text-slate-300 border-slate-500/30',
      badge: 'Tra Cứu Nhanh',
      tab: 'list',
      accent: 'text-slate-300',
    },
    {
      id: 'writing',
      title: '9. IELTS Writing Assistant & Lexical Heatmap',
      desc: 'Chấm điểm Task 1 & 2 theo 4 tiêu chí Cambridge, bản đồ nhiệt từ vựng và bài mẫu viết lại Band 8.5+',
      icon: PenTool,
      color: 'from-violet-500/20 to-indigo-500/20 text-violet-400 border-violet-500/30',
      badge: 'Writing AI',
      tab: 'writing',
      accent: 'text-violet-400',
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
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Vocab Lab (Phòng Thí Nghiệm & 7 Chế Độ Học Từ Vựng)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bộ từ đang học: <strong className="text-indigo-300 font-semibold">{activeSet.title}</strong> ({words.length} từ)
            </p>
          </div>
        </div>

        {/* Quick Launch Direct Hero Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateMode('flashcard')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Bắt đầu ôn FSRS ngay</span>
          </button>
        </div>
      </div>

      {/* 7 Core Vocab Modes Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {allVocabModes.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <div
              key={mode.id}
              onClick={() => onNavigateMode(mode.tab as AppViewTab)}
              className="bento-card p-5 sm:p-6 cursor-pointer group hover:border-indigo-500/50 transition-all flex flex-col justify-between"
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
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {mode.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{mode.desc}</p>
              </div>
              <div className={`mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold ${mode.accent} group-hover:translate-x-1 transition-transform`}>
                <span>Vào luyện tập ngay</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
