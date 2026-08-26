import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  LayoutGrid,
  BookOpen,
  Mic,
  Sparkles,
  Flame,
  Award,
  Upload,
  Plus,
  FileSpreadsheet,
  Menu,
  X,
  Database,
  Layers,
  ChevronDown,
  FileText,
  Volume2,
  VolumeX,
  LogIn,
  SlidersHorizontal,
} from 'lucide-react';
import { WordSet, UserProgress, VocabItem, UserProfile } from '../../types';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { AccentSwitcher } from '../index';
import { sounds } from '../../utils/soundEffects';

interface NavbarProps {
  sets: WordSet[];
  activeSetId: string;
  onSelectSet: (setId: string) => void;
  onOpenUpload: () => void;
  onOpenBatchImport?: () => void;
  onOpenExcelImport?: () => void;
  onOpenAddWord: () => void;
  onOpenAiBooster: () => void;
  onOpenProgress: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  progress: UserProgress;
  totalWordsCount?: number;
  getWords?: () => VocabItem[];
  getSets?: () => WordSet[];
  getProgress?: () => UserProgress;
  onDataSynced?: (data: { words: VocabItem[]; sets: WordSet[]; progress: UserProgress }) => void;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sets,
  activeSetId,
  onSelectSet,
  onOpenUpload,
  onOpenBatchImport,
  onOpenExcelImport,
  onOpenAddWord,
  onOpenAiBooster,
  onOpenProgress,
  currentView,
  onNavigate,
  progress,
  totalWordsCount = 0,
  getWords = () => [],
  getSets = () => sets,
  getProgress = () => progress,
  onDataSynced,
  userProfile,
  onOpenProfile,
  onOpenAuth,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsActionDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsActionDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#121418]/95 backdrop-blur-xl border-b border-[#262A30] shadow-xl shadow-black/25">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2 sm:gap-3">
          
          {/* ========================================================================= */}
          {/* 1. BRAND LOGO & COMPACT BADGE */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                onNavigate('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-hidden"
              title="Về Trang Chủ IELTS Master"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-all">
                <GraduationCap className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#121418] animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors tracking-tight">
                  IELTS Master
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Database className="w-2.5 h-2.5 text-indigo-400" />
                  {totalWordsCount > 0 ? `${totalWordsCount} từ` : '2000+'}
                </span>
              </div>
            </button>

            {/* ========================================================================= */}
            {/* 2. CORE PRIMARY NAVIGATION TABS (Sleek Segmented Control) */}
            {/* ========================================================================= */}
            <nav className="hidden md:flex items-center gap-1 ml-2 pl-3 border-l border-[#262A30]">
              {/* Tab 1: Dashboard */}
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-[#8E97A4] hover:text-white hover:bg-[#1E2228]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Trang Chủ</span>
              </button>

              {/* Tab 2: Kho Từ Vựng */}
              <button
                onClick={() => onNavigate('list')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  ['list', 'flashcard', 'quiz', 'spelling', 'word-family', 'cloze', 'timed-drill'].includes(currentView)
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                    : 'text-[#8E97A4] hover:text-white hover:bg-[#1E2228]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kho Từ Vựng</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#16191F] text-indigo-300 font-bold border border-[#2D333B]">
                  {totalWordsCount}
                </span>
              </button>

              {/* Tab 3: Speaking Studio */}
              <button
                onClick={() => onNavigate('speaking')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  [
                    'speaking',
                    'full-mock-test',
                    'speaking-part2',
                    'shadowing',
                    'quick-speaking-drill',
                    'speech-upgrade',
                    'area-expander',
                    'speech-ladder',
                    'idea-mindmap',
                    'emergency-stalling',
                    'speaking-portfolio',
                    'weakness-radar',
                  ].includes(currentView)
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-purple-300/90 hover:text-purple-200 hover:bg-purple-950/30'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-purple-300" />
                <span>Speaking Studio</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  AI 1-1
                </span>
              </button>

              {/* Tab 4: AI Band Booster */}
              <button
                onClick={onOpenAiBooster}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'ai-booster'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/30 ring-2 ring-purple-400/30'
                    : 'text-[#8E97A4] hover:text-white hover:bg-[#1E2228]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Nâng Band</span>
              </button>
            </nav>
          </div>

          {/* ========================================================================= */}
          {/* 3. CENTER: COMPACT ACTIVE SET PICKER */}
          {/* ========================================================================= */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#181C22] px-2.5 py-1 rounded-xl border border-[#2D333B] max-w-[240px] truncate shadow-inner">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={activeSetId}
              onChange={(e) => onSelectSet(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#E0E2E4] focus:outline-hidden pr-2 truncate cursor-pointer w-full"
              title="Chọn bộ từ vựng mục tiêu"
            >
              <option value="all-words-library" className="bg-[#16191F] text-emerald-400 font-bold">
                🌐 Toàn Bộ Kho ({totalWordsCount} từ)
              </option>
              <option disabled className="bg-[#21262E] text-gray-500">
                ────────── BỘ CHUYÊN ĐỀ ──────────
              </option>
              {sets.map((set) => (
                <option key={set.id} value={set.id} className="bg-[#16191F] text-[#E0E2E4]">
                  📁 {set.title} ({set.totalWords} từ)
                </option>
              ))}
            </select>
          </div>

          {/* ========================================================================= */}
          {/* 4. RIGHT SECTION: STREAMLINED ACTIONS, UTILITIES & USER PROFILE */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Stats: Streak & Band */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* Streak */}
              <button
                onClick={onOpenProgress}
                title={`Chuỗi học tập liên tục: ${progress.streakDays} ngày. Bấm để xem báo cáo!`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{progress.streakDays}d</span>
              </button>

              {/* Estimated IELTS Band */}
              <button
                onClick={onOpenProgress}
                title={`IELTS Lexical & Speaking Band ước tính hiện tại: Band ${progress.estimatedBand.toFixed(1)}`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                <span>Band {progress.estimatedBand.toFixed(1)}</span>
              </button>
            </div>

            {/* UNIFIED ACTION DROPDOWN: "+ Nạp / Thêm" */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20 border border-emerald-400/30 active:scale-95"
                title="Thêm từ mới hoặc Nạp tệp tài liệu Excel, PDF, CSV"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Nạp / Thêm</span>
                <ChevronDown className={`w-3 h-3 text-emerald-100 transition-transform duration-200 ${isActionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Clean Dropdown Popover */}
              {isActionDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#181C24] border border-[#2D333B] shadow-2xl p-1.5 space-y-1 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#8E97A4] tracking-wider border-b border-[#262A30]">
                    Thêm & Nạp Từ Vựng
                  </div>

                  {/* 1. Add Single Word */}
                  <button
                    onClick={() => {
                      setIsActionDropdownOpen(false);
                      onOpenAddWord();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#222731] transition-all text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Thêm từ mới thủ công</div>
                      <div className="text-[10px] text-slate-400">Nhập từ, nghĩa, ví dụ, band điểm</div>
                    </div>
                  </button>

                  {/* 2. Import Excel/CSV */}
                  {onOpenExcelImport && (
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        onOpenExcelImport();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#222731] transition-all text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-emerald-300">Nạp tệp Excel / CSV</div>
                        <div className="text-[10px] text-slate-400">Hỗ trợ .xlsx, .xls, .csv thông minh</div>
                      </div>
                    </button>
                  )}

                  {/* 3. Import PDF Document */}
                  <button
                    onClick={() => {
                      setIsActionDropdownOpen(false);
                      onOpenUpload();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#222731] transition-all text-left cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Nạp từ tài liệu PDF</div>
                      <div className="text-[10px] text-slate-400">Trích xuất từ vựng từ sách/đề thi</div>
                    </div>
                  </button>

                  {/* 4. Batch Text Import */}
                  {onOpenBatchImport && (
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false);
                        onOpenBatchImport();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#222731] transition-all text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Nhập văn bản hàng loạt</div>
                        <div className="text-[10px] text-slate-400">Dán danh sách từ dạng text</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* UNIFIED UTILITIES CAPSULE (Voice Accent + Sound FX + Cloud Sync) */}
            <div className="hidden lg:flex items-center gap-1 bg-[#181C22] p-1 rounded-xl border border-[#2D333B] shadow-inner">
              {/* Voice Accent */}
              <AccentSwitcher compact={true} />

              {/* Sound FX Toggle */}
              <button
                onClick={() => sounds.toggleMute()}
                title={sounds.getMuted() ? 'Bật âm thanh hiệu ứng (Sound FX)' : 'Tắt âm thanh hiệu ứng'}
                className="p-1.5 rounded-lg hover:bg-[#252B33] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
              >
                {sounds.getMuted() ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>

              {/* Cloud Sync Status */}
              <SyncStatusIndicator
                getWords={getWords}
                getSets={getSets}
                getProgress={getProgress}
                onDataSynced={onDataSynced}
                iconOnly={true}
                userId={userProfile?.uid || 'guest'}
              />
            </div>

            {/* USER PROFILE CAPSULE */}
            {userProfile ? (
              <button
                onClick={onOpenProfile}
                title={`Hồ sơ học tập: ${userProfile.displayName} (Mục tiêu Band ${userProfile.targetBand?.toFixed(1) || '7.5'})`}
                className="flex items-center gap-2 pl-1 pr-2 sm:pr-2.5 py-1 rounded-xl bg-[#1E2228] hover:bg-[#262C34] border border-[#2D333B] hover:border-indigo-500/40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs group"
              >
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-6 h-6 rounded-lg object-cover border border-indigo-500/40"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-[11px] font-black shadow-xs">
                    {userProfile.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden xl:block">
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-300 transition-colors leading-tight truncate max-w-[85px]">
                    {userProfile.displayName}
                  </div>
                  <div className="text-[9px] font-extrabold text-indigo-400 leading-none">
                    🎯 Band {userProfile.targetBand?.toFixed(1) || '7.5'}
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-[#1E2228] border border-[#2D333B] text-[#D0D7DE] hover:text-white cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#16191F] border-b border-[#2D333B] px-4 py-4 space-y-3 animate-fadeIn shadow-2xl">
          {/* User Profile Card on Mobile */}
          {userProfile ? (
            <button
              onClick={() => {
                if (onOpenProfile) onOpenProfile();
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-3 rounded-2xl bg-[#21262E] border border-indigo-500/30 flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  {userProfile.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{userProfile.displayName}</div>
                  <div className="text-[10px] text-indigo-300">
                    Mục tiêu Band {userProfile.targetBand?.toFixed(1) || '7.5'} • {userProfile.studyGoal === 'study_abroad' ? 'Du học' : 'IELTS Master'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-400">Hồ Sơ →</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Đăng Nhập / Đăng Ký
            </button>
          )}

          {/* Quick Stats on Mobile */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenProgress();
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center gap-2 text-amber-400 text-xs font-bold"
            >
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>Chuỗi {progress.streakDays} ngày</span>
            </button>
            <button
              onClick={() => {
                onOpenProgress();
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center gap-2 text-indigo-300 text-xs font-bold"
            >
              <Award className="w-4 h-4" />
              <span>Band {progress.estimatedBand.toFixed(1)}</span>
            </button>
          </div>

          {/* Active Set Selector for Mobile */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-[#8E97A4] uppercase tracking-wider">
              Chọn Bộ Từ Vựng
            </div>
            <select
              value={activeSetId}
              onChange={(e) => {
                onSelectSet(e.target.value);
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-[#21262E] text-xs font-semibold text-white px-3 py-2.5 rounded-xl border border-[#2D333B] focus:outline-hidden"
            >
              <option value="all-words-library" className="text-emerald-400 font-bold">
                🌐 Toàn Bộ Kho ({totalWordsCount} từ vựng)
              </option>
              {sets.map((set) => (
                <option key={set.id} value={set.id}>
                  📁 {set.title} ({set.totalWords} từ)
                </option>
              ))}
            </select>
          </div>

          {/* Primary Navigation Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#262A30]">
            <button
              onClick={() => {
                onNavigate('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white flex items-center justify-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" /> Trang Chủ
            </button>
            <button
              onClick={() => {
                onNavigate('list');
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-[#21262E] text-xs font-bold text-white flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" /> Kho Từ ({totalWordsCount})
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onNavigate('speaking');
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" /> Speaking Studio
            </button>
            <button
              onClick={() => {
                onOpenAiBooster();
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-xs font-bold text-purple-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Nâng Band
            </button>
          </div>

          {/* Quick Import Mobile Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#262A30]">
            <button
              onClick={() => {
                onOpenAddWord();
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm từ
            </button>
            {onOpenExcelImport && (
              <button
                onClick={() => {
                  onOpenExcelImport();
                  setIsMobileMenuOpen(false);
                }}
                className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
              </button>
            )}
            <button
              onClick={() => {
                onOpenUpload();
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded-xl bg-[#21262E] text-[#D0D7DE] border border-[#30363D] text-xs font-bold flex items-center justify-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
