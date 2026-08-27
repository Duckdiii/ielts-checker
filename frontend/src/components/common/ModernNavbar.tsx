import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Command,
  Search,
  BookOpen,
  Mic,
  BarChart3,
  Layers,
  Flame,
  ChevronDown,
  Upload,
  PlusCircle,
  FileSpreadsheet,
  Zap,
  Check,
  User,
  ShieldCheck,
} from 'lucide-react';
import { AppViewTab } from '../../hooks/useHashNavigation';
import { WordSet, UserProgress, UserProfile, VocabItem } from '../../types';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface ModernNavbarProps {
  currentView: AppViewTab;
  onNavigate: (view: AppViewTab) => void;
  sets: WordSet[];
  activeSetId: string;
  onSelectSet: (setId: string) => void;
  onOpenUpload: () => void;
  onOpenBatchImport: () => void;
  onOpenExcelImport: () => void;
  onOpenAddWord: () => void;
  onOpenCommandPalette: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  progress: UserProgress;
  totalWordsCount: number;
  userProfile: UserProfile;
  getWords: () => VocabItem[];
  getSets: () => WordSet[];
  getProgress: () => UserProgress;
  onDataSynced: (data: { words: VocabItem[]; sets: WordSet[]; progress: UserProgress }) => void;
}

export function ModernNavbar({
  currentView,
  onNavigate,
  sets,
  activeSetId,
  onSelectSet,
  onOpenUpload,
  onOpenBatchImport,
  onOpenExcelImport,
  onOpenAddWord,
  onOpenCommandPalette,
  onOpenProfile,
  onOpenAuth,
  progress,
  totalWordsCount,
  userProfile,
  getWords,
  getSets,
  getProgress,
  onDataSynced,
}: ModernNavbarProps) {
  const [isSetDropdownOpen, setIsSetDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSetDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllLibrary = activeSetId === 'all-words-library' || activeSetId === 'all-words';
  const activeSet = isAllLibrary
    ? { title: 'Toàn bộ kho từ', totalWords: totalWordsCount }
    : sets.find((s) => s.id === activeSetId) || sets[0] || { title: 'Bộ từ vựng', totalWords: totalWordsCount };

  // Active space indicators
  const isStudioActive = currentView === 'dashboard';
  const isVocabLabActive = [
    'vocab-hub',
    'flashcard',
    'quiz',
    'spelling',
    'word-family',
    'cloze',
    'timed-drill',
    'ai-booster',
    'writing',
    'list',
  ].includes(currentView);
  const isSpeakingActive = [
    'speaking-hub',
    'speaking',
    'speaking-part2',
    'shadowing',
    'quick-speaking-drill',
    'speaking-portfolio',
    'full-mock-test',
    'area-expander',
    'emergency-stalling',
    'speech-ladder',
    'speech-upgrade',
    'idea-mindmap',
    'daily-chat',
  ].includes(currentView);
  const isAnalyticsActive = ['progress', 'weakness-radar'].includes(currentView);

  const streakDays = progress.currentStreakDays || 1;
  const isGuest = !userProfile.email || userProfile.email === 'guest@ieltsmaster.ai';

  return (
    <header className="sticky top-0 z-40 w-full px-3 sm:px-6 lg:px-10 pt-3.5 pb-2">
      <div className="max-w-[1720px] mx-auto neo-glass-panel rounded-2xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4 border border-white/[0.12] shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
        {/* Left: Brand Logo & 4 Navigation Pillars */}
        <div className="flex items-center gap-5 lg:gap-7">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 group cursor-pointer text-left focus:outline-none shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/50 transition-all duration-300">
              <div className="w-full h-full bg-[#070913] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black tracking-tight flex items-center gap-1.5 font-sans">
                <span className="text-white">IELTS</span>
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent font-extrabold">
                  VocabMaster
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-widest">
                  2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Cambridge Academic Suite</p>
            </div>
          </button>

          {/* 4 Navigation Pillars */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/[0.04] p-1.5 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isStudioActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            <button
              onClick={() => onNavigate('vocab-hub')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isVocabLabActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Vocab Lab</span>
            </button>

            <button
              onClick={() => onNavigate('speaking-hub')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSpeakingActive
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/40 border border-rose-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Speaking Hub</span>
            </button>

            <button
              onClick={() => onNavigate('progress')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isAnalyticsActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </nav>
        </div>

        {/* Center/Right: Universal Command Palette (⌘K) & Active Set */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Universal Search Command Bar (Ctrl+K) */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer shadow-inner group"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="hidden xl:inline text-slate-400 font-medium">Tìm từ vựng, mở chế độ thi...</span>
            <span className="xl:hidden text-slate-400 font-medium">Tìm nhanh</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-mono text-indigo-300 font-bold">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>

          {/* Active Set Selector Dropdown */}
          <div className="relative hidden lg:block" ref={dropdownRef}>
            <button
              onClick={() => setIsSetDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-slate-200 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[140px] truncate">{activeSet.title}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSetDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSetDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 neo-glass-panel rounded-2xl border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/5">
                  Bộ Từ Vựng Đang Chọn
                </div>
                <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      onSelectSet('all-words-library');
                      setIsSetDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isAllLibrary ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate">Toàn Bộ Kho Từ</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5">{totalWordsCount} từ</span>
                  </button>

                  {sets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => {
                        onSelectSet(set.id);
                        setIsSetDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        activeSetId === set.id ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{set.title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5">{set.totalWords} từ</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setIsSetDropdownOpen(false);
                      onOpenUpload();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-200 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-indigo-400" />
                    <span>Nạp PDF AI</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsSetDropdownOpen(false);
                      onOpenExcelImport();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-200 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                    <span>Nhập Excel</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Streak Flame Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-extrabold shadow-sm" title={`Chuỗi học tập ${streakDays} ngày`}>
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>{streakDays}d</span>
          </div>

          {/* Sync Status */}
          <SyncStatusIndicator
            userId={userProfile.uid}
            isGuest={isGuest}
            getWords={getWords}
            getSets={getSets}
            getProgress={getProgress}
            onDataSynced={onDataSynced}
          />

          {/* User Profile Avatar / Sign In */}
          {isGuest ? (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
          ) : (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-slate-200 max-w-[90px] truncate">
                {userProfile.displayName}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
