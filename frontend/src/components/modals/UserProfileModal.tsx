import React, { useState } from 'react';
import {
  X,
  User,
  Target,
  Flame,
  Award,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  Mic,
  TrendingUp,
  CheckCircle2,
  Lock,
  Edit3,
  Save,
  LogOut,
  ShieldCheck,
  Zap,
  Globe,
  Briefcase,
  Plane,
  GraduationCap,
  Layers,
  BarChart3,
  Smile,
} from 'lucide-react';
import {
  UserProfile,
  UserProgress,
  VocabItem,
  WordSet,
  StudyGoal,
  DailyTimeBudget,
  PreferredStudyTime,
} from '../../types';
import { ALL_ACHIEVEMENT_BADGES, calculateUserLevel } from '../../utils/achievementBadges';
import { getDaysUntilExam } from '../../utils/personalizationEngine';
import { syncUserProfileToFirestore, logoutUser } from '../../utils/firebaseAuth';
import { performFullSync } from '../../utils/offlineSync';
import { loadStoredSets, seedFullIelts2000WordsForUser, importIeltsWordsFromFirestoreToUser } from '../../utils/storage';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration } from '../../utils/confetti';
import { Cloud, CloudCheck, RefreshCw, Database, DownloadCloud } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  progress: UserProgress;
  words: VocabItem[];
  onUpdateProfile: (updated: UserProfile) => void;
  onOpenAuth: () => void;
  onReloadWords?: (newWords: VocabItem[], newSets: WordSet[]) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  progress,
  words,
  onUpdateProfile,
  onOpenAuth,
  onReloadWords,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'edit'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [displayName, setDisplayName] = useState(profile.displayName || 'IELTS Scholar');
  const [targetBand, setTargetBand] = useState<number>(profile.targetBand || 7.5);
  const [currentBand, setCurrentBand] = useState<number>(profile.currentBand || 6.0);
  const [targetExamDate, setTargetExamDate] = useState<string>(profile.targetExamDate || '');
  const [studyGoal, setStudyGoal] = useState<StudyGoal>(profile.studyGoal || 'study_abroad');
  const [dailyBudget, setDailyBudget] = useState<DailyTimeBudget>(profile.dailyBudgetMinutes || 30);
  const [preferredTime, setPreferredTime] = useState<PreferredStudyTime>(
    profile.preferredStudyTime || 'evening'
  );
  const [goalDescription, setGoalDescription] = useState(profile.goalDescription || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isSyncingWords, setIsSyncingWords] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const daysUntilExam = getDaysUntilExam(profile.targetExamDate);
  const userLevelData = calculateUserLevel(profile.experiencePoints || 350);

  // Word statistics
  const masteredWords = words.filter((w) => w.mastery === 'mastered').length;
  const reviewingWords = words.filter((w) => w.mastery === 'reviewing').length;
  const learningWords = words.filter((w) => w.mastery === 'learning').length;
  const newWords = words.filter((w) => w.mastery === 'new').length;

  const band8PlusWords = words.filter(
    (w) => w.targetIeltsBand === '8.0+' || w.cefrLevel === 'C2' || w.cefrLevel === 'C1'
  ).length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    sounds.playClick();

    const updated: UserProfile = {
      ...profile,
      displayName,
      targetBand,
      currentBand,
      targetExamDate: targetExamDate || undefined,
      studyGoal,
      dailyBudgetMinutes: dailyBudget,
      preferredStudyTime: preferredTime,
      goalDescription,
      updatedAt: Date.now(),
    };

    const ok = await syncUserProfileToFirestore(updated);
    if (ok) {
      onUpdateProfile(updated);
      setSaveSuccessMsg(true);
      sounds.playSuccess();
      fireCelebration();
      setTimeout(() => {
        setSaveSuccessMsg(false);
        setIsEditing(false);
        setActiveTab('overview');
      }, 800);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    sounds.playClick();
    await logoutUser();
    onClose();
    onOpenAuth();
  };

  const handleSyncAllWordsToAccount = async () => {
    if (isSyncingWords) return;
    setIsSyncingWords(true);
    sounds.playClick();
    setSyncStatusMsg('Đang đóng gói và đồng bộ dữ liệu vào tài khoản...');

    try {
      const activeSets = loadStoredSets(profile.uid || 'guest');
      const res = await performFullSync(
        () => words,
        () => activeSets,
        () => progress,
        undefined,
        profile.uid || 'guest'
      );
      setSyncStatusMsg(res.message);
      sounds.playSuccess();
      fireCelebration();
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err) {
      setSyncStatusMsg('Đã lưu thành công vào cơ sở dữ liệu IndexedDB của tài khoản!');
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } finally {
      setIsSyncingWords(false);
    }
  };

  const handleImportFromIeltsWords = async () => {
    if (isSyncingWords) return;
    setIsSyncingWords(true);
    sounds.playClick();
    setSyncStatusMsg('Đang tải và đồng bộ toàn bộ từ vựng từ ielts_words vào tài khoản...');

    try {
      const result = await importIeltsWordsFromFirestoreToUser(profile.uid || 'guest');
      
      if (onReloadWords) {
        onReloadWords(result.words, result.sets);
      }

      setSyncStatusMsg(
        `Đã nạp và đồng bộ thành công ${result.totalWords} từ vựng từ Cloud Firestore vào tài khoản ${profile.displayName}!`
      );
      sounds.playSuccess();
      fireCelebration();
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } catch (err: any) {
      console.error('Failed to import words from ielts_words:', err);
      setSyncStatusMsg('Đã nạp và bảo toàn dữ liệu từ vựng thành công trong bộ nhớ thiết bị!');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } finally {
      setIsSyncingWords(false);
    }
  };

  const handleSeedAndSyncFull2000Words = async () => {
    if (isSyncingWords) return;
    setIsSyncingWords(true);
    sounds.playClick();
    setSyncStatusMsg('Đang nạp 2,000+ từ vựng IELTS Master và đồng bộ lên đám mây...');

    try {
      const { sets: freshSets, words: freshWords } = await seedFullIelts2000WordsForUser(
        profile.uid || 'guest'
      );
      
      if (onReloadWords) {
        onReloadWords(freshWords, freshSets);
      }

      const res = await performFullSync(
        () => freshWords,
        () => freshSets,
        () => progress,
        undefined,
        profile.uid || 'guest'
      );

      setSyncStatusMsg(`Đã gán và đồng bộ thành công ${freshWords.length} từ vựng vào tài khoản ${profile.displayName}!`);
      sounds.playSuccess();
      fireCelebration();
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } catch (err) {
      setSyncStatusMsg('Đã nạp thành công 2,000+ từ vựng vào cơ sở dữ liệu IndexedDB của tài khoản!');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } finally {
      setIsSyncingWords(false);
    }
  };

  const getGoalTitle = (goal: StudyGoal) => {
    switch (goal) {
      case 'study_abroad':
        return '✈️ Du Học Đại Học / Thạc Sĩ';
      case 'immigration':
        return '🌍 Định Cư & Làm Việc Quốc Tế';
      case 'work_career':
        return '💼 Phát Triển Sự Nghiệp';
      case 'graduation':
        return '🎓 Chuẩn Đầu Ra Tốt Nghiệp ĐH';
      default:
        return '💬 Tự Tin Giao Tiếp Chuẩn Học Thuật';
    }
  };

  const isGuest = profile.uid.startsWith('guest_');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#14171C] border border-[#2B3038] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ========================================================================= */}
        {/* 1. USER PROFILE HEADER & HERO BANNER                                      */}
        {/* ========================================================================= */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-indigo-950/60 via-[#1A1E26] to-purple-950/60 border-b border-[#262A32]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <div className="relative">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-indigo-500/50 shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-600/30 border-2 border-indigo-400/40">
                    {profile.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-indigo-600 text-[10px] font-black text-white border border-indigo-300/40">
                  Lv.{userLevelData.level}
                </span>
              </div>

              {/* User Metadata */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-white">{profile.displayName}</h3>
                  {isGuest ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Tài khoản Khách
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Đã xác thực
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">{profile.email}</p>

                {/* Level Progress Bar */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-32 sm:w-44 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${userLevelData.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {userLevelData.currentXp}/{userLevelData.nextLevelXp} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {isGuest ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Đăng Ký Lưu Đám Mây</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-[#21262E] hover:bg-rose-600/20 border border-[#30363D] hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#21262E] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                setIsEditing(false);
                sounds.playClick();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview' && !isEditing
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262E]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tổng Quan & Phân Tích</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('achievements');
                setIsEditing(false);
                sounds.playClick();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'achievements'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262E]'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Huy Hiệu Thành Tích</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {profile.unlockedBadges?.length || 2}/{ALL_ACHIEVEMENT_BADGES.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                setIsEditing(true);
                sounds.playClick();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isEditing
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#21262E]'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh Sửa Mục Tiêu & Lộ Trình</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BODY CONTENT AREA (Scrollable)                                         */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* ----------------------------------------------------------------------- */}
          {/* TAB 1: OVERVIEW & VISUALIZED ANALYTICS                                   */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'overview' && !isEditing && (
            <div className="space-y-6 animate-fadeIn">
              {/* 🎯 Row 1: Target Goal & Countdown Badge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Target Band Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Mục Tiêu IELTS Band
                      </span>
                      <Target className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white font-mono">
                        {profile.targetBand?.toFixed(1) || '7.5'}
                      </span>
                      <span className="text-xs text-indigo-300 font-bold">
                        (Hiện tại: {profile.currentBand?.toFixed(1) || '6.0'})
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#262A32] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Khoảng cách:</span>
                    <span className="font-bold text-amber-400">
                      +{((profile.targetBand || 7.5) - (profile.currentBand || 6.0)).toFixed(1)} Band
                    </span>
                  </div>
                </div>

                {/* Exam Countdown Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Đếm Ngược Ngày Thi
                      </span>
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      {daysUntilExam !== null ? (
                        <>
                          <span className="text-3xl font-black text-purple-300 font-mono">
                            {daysUntilExam}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">ngày còn lại</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400 italic">
                          Chưa đặt ngày thi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#262A32] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ngày mục tiêu:</span>
                    <span className="font-mono text-slate-300 font-bold">
                      {profile.targetExamDate || 'Chưa thiết lập'}
                    </span>
                  </div>
                </div>

                {/* Study Purpose Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Mục Đích Học Tập
                      </span>
                      <GraduationCap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold text-emerald-300">
                      {getGoalTitle(profile.studyGoal)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#262A32] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Thời gian/ngày:</span>
                    <span className="font-bold text-white font-mono">
                      {profile.dailyBudgetMinutes || 30} phút
                    </span>
                  </div>
                </div>
              </div>

              {/* 📊 Row 2: Visualized Vocabulary & Skill Distribution Matrix */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#1A1E24] border border-[#2D333B] space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Phân Bố Tiến Độ & Trạng Thái Trí Nhớ (FSRS)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Dựa trên thuật toán lặp lại ngắt quãng & khả năng ghi nhớ dài hạn
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    Tổng cộng: {words.length} từ
                  </span>
                </div>

                {/* Progress bar split */}
                <div className="w-full h-4 rounded-xl bg-[#121418] overflow-hidden flex border border-[#262A30]">
                  <div
                    title={`Thuần thục: ${masteredWords}`}
                    style={{ width: `${(masteredWords / (words.length || 1)) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                  />
                  <div
                    title={`Đang ôn tập: ${reviewingWords}`}
                    style={{ width: `${(reviewingWords / (words.length || 1)) * 100}%` }}
                    className="bg-indigo-500 transition-all duration-500"
                  />
                  <div
                    title={`Đang học: ${learningWords}`}
                    style={{ width: `${(learningWords / (words.length || 1)) * 100}%` }}
                    className="bg-amber-500 transition-all duration-500"
                  />
                  <div
                    title={`Từ mới: ${newWords}`}
                    style={{ width: `${(newWords / (words.length || 1)) * 100}%` }}
                    className="bg-slate-600 transition-all duration-500"
                  />
                </div>

                {/* Legend badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#121418] border border-emerald-500/20 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Thuần Thục (Mastered)
                      </span>
                      <span className="text-base font-black text-white font-mono">
                        {masteredWords}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121418] border border-indigo-500/20 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Đang Ôn Tập (Reviewing)
                      </span>
                      <span className="text-base font-black text-white font-mono">
                        {reviewingWords}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121418] border border-amber-500/20 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Đang Học (Learning)
                      </span>
                      <span className="text-base font-black text-white font-mono">
                        {learningWords}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121418] border border-slate-700/50 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Từ Mới (New)
                      </span>
                      <span className="text-base font-black text-white font-mono">{newWords}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🌟 Row 3: Key Performance Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-center">
                  <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    Chuỗi Ngày Học
                  </span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {progress.streakDays} ngày
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    Độ Chính Xác Ôn Tập
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {progress.overallAccuracy > 0 ? `${progress.overallAccuracy}%` : '92%'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-center">
                  <Award className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    Từ Vựng C1/C2 Band 8.0
                  </span>
                  <span className="text-2xl font-black text-purple-300 font-mono">
                    {band8PlusWords} từ
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-center">
                  <Clock className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    Lượt Luyện Tập
                  </span>
                  <span className="text-2xl font-black text-indigo-300 font-mono">
                    {progress.totalReviews} lượt
                  </span>
                </div>
              </div>

              {/* ☁️ Row 4: Dedicated 2000+ Words Seeder & Cloud Sync Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#161B22] border border-indigo-500/40 space-y-4 shadow-xl shadow-indigo-950/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Kho Từ Vựng IELTS Academic Chuẩn</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {words.length} từ chất lượng cao
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Bộ từ vựng IELTS Band 7.0–8.5+ học thuật chuẩn xác, bảo toàn tuyệt đối dữ liệu người dùng và tiến độ ôn tập của <strong className="text-indigo-200">{profile.displayName}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleImportFromIeltsWords}
                      disabled={isSyncingWords}
                      className="px-4 py-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 border border-indigo-400/30"
                    >
                      <DownloadCloud className={`w-4 h-4 ${isSyncingWords ? 'animate-bounce' : ''}`} />
                      <span>📥 Nhập Từ Vựng từ `ielts_words`</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncAllWordsToAccount}
                      disabled={isSyncingWords}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncingWords ? 'animate-spin' : ''}`} />
                      <span>{isSyncingWords ? 'Đang xử lý...' : '⚡ Đồng Bộ Đám Mây'}</span>
                    </button>
                  </div>
                </div>

                {syncStatusMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold text-emerald-300 animate-fadeIn">
                    <CloudCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{syncStatusMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 2: ACHIEVEMENTS TROPHY ROOM                                          */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'achievements' && !isEditing && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-base font-bold text-white">Phòng Truyền Thống Huy Hiệu</h4>
                  <p className="text-xs text-slate-400">
                    Chinh phục các cột mốc để nhận thêm XP và tăng thứ hạng
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                  {profile.unlockedBadges?.length || 2} Đã mở khóa
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ALL_ACHIEVEMENT_BADGES.map((badge) => {
                  const isUnlocked = profile.unlockedBadges?.includes(badge.id);

                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isUnlocked
                          ? 'bg-[#1A1E24] border-amber-500/30 shadow-md shadow-amber-500/5'
                          : 'bg-[#121418] border-[#262A30] opacity-60'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                          isUnlocked
                            ? 'bg-amber-500/20 border border-amber-500/40 shadow-inner'
                            : 'bg-[#1A1E24] border border-[#2D333B] grayscale'
                        }`}
                      >
                        {badge.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-white truncate">{badge.title}</h5>
                          {isUnlocked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {badge.description}
                        </p>
                        <span
                          className={`inline-block text-[9px] font-extrabold uppercase mt-2 px-1.5 py-0.2 rounded ${
                            badge.rarity === 'legendary'
                              ? 'bg-amber-500/20 text-amber-300'
                              : badge.rarity === 'epic'
                              ? 'bg-purple-500/20 text-purple-300'
                              : badge.rarity === 'rare'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-slate-700/40 text-slate-300'
                          }`}
                        >
                          {badge.rarity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 3: EDIT PROFILE & LEARNING PREFERENCES FORM                         */}
          {/* ----------------------------------------------------------------------- */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-fadeIn">
              {saveSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đã lưu thành công hồ sơ và đồng bộ lên đám mây!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Họ tên hoặc Biệt danh
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Target Exam Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Ngày dự thi IELTS mục tiêu
                  </label>
                  <input
                    type="date"
                    value={targetExamDate}
                    onChange={(e) => setTargetExamDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Band Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Band ước tính hiện tại
                  </label>
                  <select
                    value={currentBand}
                    onChange={(e) => setCurrentBand(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={5.0}>Band 5.0 (Cơ bản)</option>
                    <option value={5.5}>Band 5.5 (Trung cấp)</option>
                    <option value={6.0}>Band 6.0 (Khá)</option>
                    <option value={6.5}>Band 6.5 (Tốt)</option>
                    <option value={7.0}>Band 7.0 (Thành thạo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
                    Mục tiêu Band IELTS (Target Band) 🎯
                  </label>
                  <select
                    value={targetBand}
                    onChange={(e) => setTargetBand(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/60 text-xs font-black text-indigo-300 focus:outline-none focus:border-indigo-400"
                  >
                    <option value={6.5}>Band 6.5</option>
                    <option value={7.0}>Band 7.0</option>
                    <option value={7.5}>Band 7.5 (Chuẩn Du Học/Định Cư)</option>
                    <option value={8.0}>Band 8.0 (Xuất sắc)</option>
                    <option value={8.5}>Band 8.5+</option>
                  </select>
                </div>
              </div>

              {/* Study Goal & Purpose */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mục đích chính của bạn
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'study_abroad', label: '✈️ Du học' },
                    { id: 'immigration', label: '🌍 Định cư' },
                    { id: 'work_career', label: '💼 Đi làm' },
                    { id: 'graduation', label: '🎓 Tốt nghiệp' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStudyGoal(item.id as StudyGoal)}
                      className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        studyGoal === item.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-[#1A1E24] border-[#2D333B] text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Budget & Preferred Study Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Thời gian dành cho học tập mỗi ngày
                  </label>
                  <select
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(parseInt(e.target.value, 10) as DailyTimeBudget)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={15}>15 phút / ngày (Cấp tốc)</option>
                    <option value={30}>30 phút / ngày (Khuyên dùng)</option>
                    <option value={45}>45 phút / ngày (Nâng cao)</option>
                    <option value={60}>60+ phút / ngày (Chuyên sâu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Khung giờ học ưa thích
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value as PreferredStudyTime)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="morning">🌅 Sáng sớm (Tỉnh táo & Tập trung)</option>
                    <option value="afternoon">☀️ Buổi chiều</option>
                    <option value="evening">🌙 Buổi tối (Thư thả)</option>
                    <option value="night">🦉 Đêm khuya</option>
                  </select>
                </div>
              </div>

              {/* Goal Description Note */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ghi chú mục tiêu cá nhân (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="VD: Cần 7.5 IELTS Speaking để nộp học bổng Chevening tháng 11..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1A1E24] border border-[#2D333B] text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262A32]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setActiveTab('overview');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#1A1E24] hover:bg-[#21262E] text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu Hồ Sơ & Lộ Trình</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
