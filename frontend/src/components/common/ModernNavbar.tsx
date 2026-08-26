import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Mic,
  BarChart3,
  Search,
  Sparkles,
  ChevronDown,
  UploadCloud,
  FileSpreadsheet,
  Plus,
  User,
  Flame,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { WordSet, UserProgress, UserProfile, VocabItem } from '../../types';
import { AppViewTab } from '../../hooks/useHashNavigation';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface ModernNavbarProps {
  currentView: AppViewTab;
  onNavigate: (view: AppViewTab) => void;
  sets: WordSet[];
  activeSetId: string;
  onSelectSet: (id: string) => void;
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
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);

  const isAllLibrary = activeSetId === 'all-words-library' || activeSetId === 'all-words';
  const activeSet = isAllLibrary
    ? { title: 'Toàn bộ kho từ', totalWords: totalWordsCount }
    : sets.find((s) => s.id === activeSetId) || sets[0] || { title: 'Bộ từ vựng', totalWords: totalWordsCount };

  // Check which of the 4 core pillars is currently active
  const isStudioActive = currentView === 'dashboard';
  const isVocabLabActive = [
    'flashcard',
    'quiz',
    'spelling',
    'word-family',
    'cloze',
    'timed-drill',
    'ai-booster',
    'list',
  ].includes(currentView);
  const isSpeakingActive = [
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel bg-[#090A0F]/80 backdrop-blur-xl">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & 4 Navigation Pillars */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#090A0F] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black tracking-tight flex items-center gap-1.5">
                <span className="text-white">IELTS</span>
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  VocabMaster
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  AI 2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Cambridge Academic Suite</p>
            </div>
          </button>

          {/* 4 Core Space Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isStudioActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            <button
              onClick={() => onNavigate('flashcard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isVocabLabActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Vocab Lab</span>
            </button>

            <button
              onClick={() => onNavigate('speaking')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSpeakingActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Speaking Hub</span>
            </button>

            <button
              onClick={() => onNavigate('progress')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isAnalyticsActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </nav>
        </div>

        {/* Center: Command Palette Trigger Button (Ctrl+K) */}
        <div className="flex-1 max-w-md hidden lg:block mx-4">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <span>Tìm từ vựng, chủ đề IELTS, chức năng...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Active Set Switcher, Add Word / PDF Dropdown, User Profile & Band Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenCommandPalette}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white lg:hidden cursor-pointer"
            title="Tìm kiếm vạn năng (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Active Word Set Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSetDropdownOpen(!isSetDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-slate-200 transition-all cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="text-left hidden sm:block max-w-[130px] truncate">
                <div className="text-xs font-semibold text-white truncate">{activeSet.title}</div>
                <div className="text-[10px] text-slate-400">{activeSet.totalWords} từ</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isSetDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSetDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#121420] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    Chọn Bộ Từ Vựng
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    <button
                      onClick={() => {
                        onSelectSet('all-words-library');
                        setIsSetDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                        isAllLibrary
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">Toàn Bộ Kho Từ ({totalWordsCount})</span>
                      {isAllLibrary && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                    {sets.map((set) => (
                      <button
                        key={set.id}
                        onClick={() => {
                          onSelectSet(set.id);
                          setIsSetDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                          activeSetId === set.id
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate">{set.title}</div>
                          <div className="text-[10px] text-slate-400">{set.totalWords} từ</div>
                        </div>
                        {activeSetId === set.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Import / Create Button */}
          <div className="relative">
            <button
              onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nạp từ</span>
            </button>

            {isCreateDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCreateDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#121420] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setIsCreateDropdownOpen(false);
                      onOpenUpload();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-400" />
                    <span>Nạp PDF bằng AI</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCreateDropdownOpen(false);
                      onOpenExcelImport();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Nhập file Excel / CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCreateDropdownOpen(false);
                      onOpenAddWord();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Thêm từ thủ công</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sync Status Indicator */}
          <div className="hidden sm:block">
            <SyncStatusIndicator
              getWords={getWords}
              getSets={getSets}
              getProgress={getProgress}
              onDataSynced={onDataSynced}
            />
          </div>

          {/* User Profile & IELTS Band Score Pill */}
          <button
            onClick={userProfile.uid === 'guest' ? onOpenAuth : onOpenProfile}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-left">
              <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate max-w-[90px]">
                {userProfile.displayName || 'IELTS Scholar'}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Band {progress.estimatedBand || '6.5'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
