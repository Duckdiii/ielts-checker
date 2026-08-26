import React, { useState } from 'react';
import {
  BookOpen,
  Gamepad2,
  ListFilter,
  Sparkles,
  Layers,
  SpellCheck,
  FileQuestion,
  HelpCircle,
  Flame,
  Clock,
  ArrowLeft,
  PenTool,
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
  const minigames = [
    {
      id: 'quiz',
      title: 'Trắc Nghiệm 4 Lựa Chọn (Quiz)',
      desc: 'Kiểm tra độ phản xạ nhận diện nghĩa từ vựng và collocations',
      icon: HelpCircle,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      tab: 'quiz',
    },
    {
      id: 'spelling',
      title: 'Chính Tả & Nghe Viết (Spelling)',
      desc: 'Nghe phát âm chuẩn bản xứ và gõ đúng chính tả các từ học thuật',
      icon: SpellCheck,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      tab: 'spelling',
    },
    {
      id: 'cloze',
      title: 'Điền Từ Ngữ Cảnh (Sentence Cloze)',
      desc: 'Điền từ vựng chuẩn ngữ cảnh vào câu văn học thuật IELTS',
      icon: FileQuestion,
      color: 'from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30',
      tab: 'cloze',
    },
    {
      id: 'word-family',
      title: 'Ghép Họ Từ & Đồng Nghĩa (Word Family)',
      desc: 'Nối các biến thể họ từ (Noun/Verb/Adj) và cặp từ đồng nghĩa',
      icon: Layers,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      tab: 'word-family',
    },
    {
      id: 'timed-drill',
      title: 'Tốc Độ Tập Trung (Timed Drill)',
      desc: 'Thử thách tốc độ nhận diện từ trong vòng 60 giây nghẹt thở',
      icon: Clock,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
      tab: 'timed-drill',
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
              <span>Vocab Lab (Phòng Thí Nghiệm Từ Vựng)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bộ từ đang học: <strong className="text-indigo-300 font-semibold">{activeSet.title}</strong> ({words.length} từ)
            </p>
          </div>
        </div>

        {/* Quick Launch Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => onNavigateMode('flashcard')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Lật Thẻ Flashcard</span>
          </button>

          <button
            onClick={() => onNavigateMode('list')}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Kho Từ Chi Tiết</span>
          </button>

          <button
            onClick={() => onNavigateMode('ai-booster')}
            className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Booster</span>
          </button>

          <button
            onClick={() => onNavigateMode('writing')}
            className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Writing Lab</span>
          </button>
        </div>
      </div>

      {/* Minigames Grid */}
      <div>
        <div className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          <span>Bộ Minigame Luyện Trí Nhớ & Khắc Sâu Ngữ Cảnh</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {minigames.map((game) => {
            const IconComponent = game.icon;
            return (
              <div
                key={game.id}
                onClick={() => onNavigateMode(game.tab as AppViewTab)}
                className="bento-card p-5 sm:p-6 cursor-pointer group hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${game.color} border flex items-center justify-center group-hover:scale-110 transition-transform mb-4`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{game.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Vào chơi ngay</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
