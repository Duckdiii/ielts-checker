import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { ModernNavbar } from './components/common/ModernNavbar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { LoadingFallback } from './components/common/LoadingFallback';
import { CommandPalette } from './components/common/CommandPalette';
import { ModernDashboard } from './components/analytics/ModernDashboard';
import { ModernVocabHub } from './components/study/ModernVocabHub';
import { ModernSpeakingHub } from './components/speaking/ModernSpeakingHub';
import { sounds } from './utils/soundEffects';
import { fireCelebration, fireStreakBonus } from './utils/confetti';
import { useHashNavigation, AppViewTab } from './hooks/useHashNavigation';

import { VocabItem, WordSet, UserProgress, StudyRecord, UserProfile } from './types';
import {
  loadStoredSets,
  saveStoredSets,
  loadStoredWords,
  saveStoredWords,
  loadStoredProgress,
  saveStoredProgress,
  recordStudySession,
  initializeDatabaseForUser,
} from './utils/storage';
import { calculateNextFSRSReview, estimateIeltsBand, SrsRating } from './utils/srs';
import {
  auth,
  getLocalCachedProfile,
  saveLocalCachedProfile,
  fetchUserProfileFromFirestore,
  DEFAULT_ANONYMOUS_PROFILE,
  syncUserProfileToFirestore,
} from './utils/firebaseAuth';
import {
  syncWordsToFirebase,
  syncSetsToFirebase,
  syncProgressToFirebase,
} from './utils/firebaseSync';
import { globalSearchEngine } from './utils/searchIndex';
import { calculateUnlockedBadges } from './utils/achievementBadges';
import { onAuthStateChanged } from 'firebase/auth';

// Lazy load study modes for substantial bundle size reduction
const FlashcardMode = React.lazy(() =>
  import('./components/study/FlashcardMode').then((m) => ({ default: m.FlashcardMode }))
);
const QuizMode = React.lazy(() =>
  import('./components/study/QuizMode').then((m) => ({ default: m.QuizMode }))
);
const SpellingMode = React.lazy(() =>
  import('./components/study/SpellingMode').then((m) => ({ default: m.SpellingMode }))
);
const WordFamilyMatchMode = React.lazy(() =>
  import('./components/study/WordFamilyMatchMode').then((m) => ({ default: m.WordFamilyMatchMode }))
);
const SentenceClozeMode = React.lazy(() =>
  import('./components/study/SentenceClozeMode').then((m) => ({ default: m.SentenceClozeMode }))
);
const TimedDrillMode = React.lazy(() =>
  import('./components/study/TimedDrillMode').then((m) => ({ default: m.TimedDrillMode }))
);
const AiBandBooster = React.lazy(() =>
  import('./components/vocab/AiBandBooster').then((m) => ({ default: m.AiBandBooster }))
);
const WritingAssistantLab = React.lazy(() =>
  import('./components/writing/WritingAssistantLab').then((m) => ({ default: m.WritingAssistantLab }))
);

// Lazy load speaking & audio modes
const SpeakingMockExaminer = React.lazy(() =>
  import('./components/speaking/SpeakingMockExaminer').then((m) => ({ default: m.SpeakingMockExaminer }))
);
const SpeakingPart2Trainer = React.lazy(() =>
  import('./components/speaking/SpeakingPart2Trainer').then((m) => ({ default: m.SpeakingPart2Trainer }))
);
const ShadowingLabMode = React.lazy(() =>
  import('./components/speaking/ShadowingLabMode').then((m) => ({ default: m.ShadowingLabMode }))
);
const QuickResponseDrillMode = React.lazy(() =>
  import('./components/speaking/QuickResponseDrillMode').then((m) => ({ default: m.QuickResponseDrillMode }))
);
const SpeakingPortfolio = React.lazy(() =>
  import('./components/speaking/SpeakingPortfolio').then((m) => ({ default: m.SpeakingPortfolio }))
);
const FullMockTestSimulation = React.lazy(() =>
  import('./components/speaking/FullMockTestSimulation').then((m) => ({ default: m.FullMockTestSimulation }))
);
const AreaAnswerExpander = React.lazy(() =>
  import('./components/speaking/AreaAnswerExpander').then((m) => ({ default: m.AreaAnswerExpander }))
);
const EmergencyStallingToolkit = React.lazy(() =>
  import('./components/speaking/EmergencyStallingToolkit').then((m) => ({ default: m.EmergencyStallingToolkit }))
);
const ProgressiveSpeechLadder = React.lazy(() =>
  import('./components/speaking/ProgressiveSpeechLadder').then((m) => ({ default: m.ProgressiveSpeechLadder }))
);
const SpeechUpgradeShadowing = React.lazy(() =>
  import('./components/speaking/SpeechUpgradeShadowing').then((m) => ({ default: m.SpeechUpgradeShadowing }))
);
const IdeaMindmapToolkit = React.lazy(() =>
  import('./components/speaking/IdeaMindmapToolkit').then((m) => ({ default: m.IdeaMindmapToolkit }))
);
const DailyCoffeeChatMode = React.lazy(() =>
  import('./components/speaking/DailyCoffeeChatMode').then((m) => ({ default: m.DailyCoffeeChatMode }))
);

// Lazy load analytics & list views
const PersonalizedWeaknessRadar = React.lazy(() =>
  import('./components/analytics/PersonalizedWeaknessRadar').then((m) => ({ default: m.PersonalizedWeaknessRadar }))
);
const VocabList = React.lazy(() =>
  import('./components/vocab/VocabList').then((m) => ({ default: m.VocabList }))
);
const ProgressReport = React.lazy(() =>
  import('./components/analytics/ProgressReport').then((m) => ({ default: m.ProgressReport }))
);

// Lazy load modals
const PdfUploaderModal = React.lazy(() =>
  import('./components/modals/PdfUploaderModal').then((m) => ({ default: m.PdfUploaderModal }))
);
const BatchImportModal = React.lazy(() =>
  import('./components/modals/BatchImportModal').then((m) => ({ default: m.BatchImportModal }))
);
const ExcelCsvImportModal = React.lazy(() =>
  import('./components/modals/ExcelCsvImportModal').then((m) => ({ default: m.ExcelCsvImportModal }))
);
const ManualWordModal = React.lazy(() =>
  import('./components/modals/ManualWordModal').then((m) => ({ default: m.ManualWordModal }))
);
const WordDetailModal = React.lazy(() =>
  import('./components/modals/WordDetailModal').then((m) => ({ default: m.WordDetailModal }))
);
const AuthModal = React.lazy(() =>
  import('./components/modals/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const UserProfileModal = React.lazy(() =>
  import('./components/modals/UserProfileModal').then((m) => ({ default: m.UserProfileModal }))
);

export function App() {
  const [currentUserId, setCurrentUserId] = useState<string>(() => auth.currentUser?.uid || 'guest');

  // Global persistent state (scoped to active user)
  const [sets, setSets] = useState<WordSet[]>(() => loadStoredSets(auth.currentUser?.uid || 'guest'));
  const [words, setWords] = useState<VocabItem[]>(() => loadStoredWords(auth.currentUser?.uid || 'guest'));
  const [progress, setProgress] = useState<UserProgress>(() =>
    loadStoredProgress(undefined, auth.currentUser?.uid || 'guest')
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    getLocalCachedProfile(auth.currentUser?.uid || 'guest')
  );

  // Active view state with URL hash synchronization & browser Back/Forward support
  const { activeTab, setActiveTab } = useHashNavigation('dashboard');

  const [activeSetId, setActiveSetId] = useState<string>(() => sets[0]?.id || 'all-words-library');

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Modals state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isManualWordModalOpen, setIsManualWordModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [selectedDetailWord, setSelectedDetailWord] = useState<VocabItem | null>(null);
  const [aiInitialWord, setAiInitialWord] = useState<VocabItem | null>(null);

  // Listen for global custom event to open command palette
  useEffect(() => {
    const handleToggle = () => setIsCommandPaletteOpen((prev) => !prev);
    window.addEventListener('toggle-command-palette', handleToggle);
    return () => window.removeEventListener('toggle-command-palette', handleToggle);
  }, []);

  // Listen to Firebase Auth state & dynamically switch isolated datasets
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const targetUid = firebaseUser ? firebaseUser.uid : 'guest';
      setCurrentUserId(targetUid);

      if (firebaseUser) {
        let firestoreProfile = await fetchUserProfileFromFirestore(firebaseUser.uid);
        if (!firestoreProfile) {
          firestoreProfile = {
            ...DEFAULT_ANONYMOUS_PROFILE,
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'user@ieltsmaster.ai',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'IELTS Scholar',
            photoURL: firebaseUser.photoURL || undefined,
            updatedAt: Date.now(),
          };
          await syncUserProfileToFirestore(firestoreProfile);
        }
        if (isMounted) setUserProfile(firestoreProfile);
      } else {
        const guestProfile = getLocalCachedProfile('guest');
        if (isMounted) setUserProfile(guestProfile);
      }

      // Load user-specific isolated storage & IndexedDB with automatic synthetic data purge
      const { sets: loadedSets, words: loadedWords, progress: loadedProgress } =
        await initializeDatabaseForUser(targetUid);

      if (isMounted) {
        setWords(loadedWords);
        setSets(loadedSets);
        if (loadedProgress) {
          setProgress(loadedProgress);
        } else {
          setProgress(loadStoredProgress(loadedWords, targetUid));
        }
        if (loadedSets.length > 0) {
          setActiveSetId(loadedSets[0].id);
        }
        globalSearchEngine.buildIndex(loadedWords);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync to local storage & IndexedDB scoped by currentUserId
  useEffect(() => {
    if (!sets || sets.length === 0) return;
    saveStoredSets(sets, currentUserId);
    if (currentUserId && currentUserId !== 'guest') {
      syncSetsToFirebase(sets, currentUserId).catch(() => {});
    }
  }, [sets, currentUserId]);

  useEffect(() => {
    if (!words || words.length === 0) return;
    saveStoredWords(words, currentUserId);
    globalSearchEngine.buildIndex(words);

    if (currentUserId && currentUserId !== 'guest') {
      syncWordsToFirebase(words, currentUserId).catch(() => {});
    }

    // Recalculate Band
    const band = estimateIeltsBand(words);
    setProgress((prev) => ({ ...prev, estimatedBand: band }));

    // Automatically check achievement badges
    const newBadges = calculateUnlockedBadges(words, progress, userProfile.unlockedBadges);
    if (newBadges.length > (userProfile.unlockedBadges?.length || 0)) {
      setUserProfile((prev) => {
        const updated = {
          ...prev,
          unlockedBadges: newBadges,
          experiencePoints: (prev.experiencePoints || 0) + 50,
          currentBand: band,
        };
        saveLocalCachedProfile(updated);
        if (currentUserId !== 'guest') {
          syncUserProfileToFirestore(updated);
        }
        return updated;
      });
    }
  }, [words, currentUserId]);

  useEffect(() => {
    saveStoredProgress(progress, currentUserId);
    if (currentUserId && currentUserId !== 'guest') {
      syncProgressToFirebase(progress, currentUserId).catch(() => {});
    }
  }, [progress, currentUserId]);

  const isAllLibrary = activeSetId === 'all-words-library' || activeSetId === 'all-words';

  const allWordsVirtualSet: WordSet = useMemo(
    () => ({
      id: 'all-words-library',
      title: 'Toàn Bộ Kho Từ Vựng',
      description: `Toàn bộ ${words.length} từ vựng trong kho lưu trữ`,
      sourceType: 'custom',
      createdAt: 0,
      totalWords: words.length,
      mainTopic: 'Tất cả chuyên đề IELTS',
      topics: Array.from(new Set(words.map((w) => w.topic || 'Học thuật tổng hợp'))),
    }),
    [words]
  );

  const activeSet: WordSet = useMemo(() => {
    if (isAllLibrary) return allWordsVirtualSet;
    return sets.find((s) => s.id === activeSetId) || sets[0] || allWordsVirtualSet;
  }, [isAllLibrary, allWordsVirtualSet, sets, activeSetId]);

  const activeSetWords: VocabItem[] = useMemo(() => {
    if (isAllLibrary) return words;
    return words.filter((w) => w.sourceSetId === activeSet?.id);
  }, [isAllLibrary, words, activeSet?.id]);

  // FSRS Rating handler
  const handleRateWord = useCallback(
    (targetWord: VocabItem, rating: SrsRating, responseTimeMs?: number) => {
      const updated = calculateNextFSRSReview(targetWord, rating, responseTimeMs);

      setWords((prevWords) => prevWords.map((w) => (w.id === targetWord.id ? updated : w)));

      setProgress((prev) => {
        const updatedWords = words.map((w) => (w.id === targetWord.id ? updated : w));
        return {
          ...prev,
          totalReviews: prev.totalReviews + 1,
          estimatedBand: estimateIeltsBand(updatedWords),
          lastStudyDate: new Date().toISOString().split('T')[0],
        };
      });
    },
    [words]
  );

  // Bookmark toggle
  const handleToggleBookmark = useCallback((wordId: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, isBookmarked: !w.isBookmarked } : w))
    );
  }, []);

  // Toggle "Chưa thuộc" (Unlearned / Need Review)
  const handleToggleUnlearned = useCallback(
    (wordId: string) => {
      setWords((prev) =>
        prev.map((w) => {
          if (w.id === wordId) {
            const nextState = !w.isUnlearned;
            return {
              ...w,
              isUnlearned: nextState,
              mastery: nextState && w.mastery === 'mastered' ? 'reviewing' : w.mastery,
            };
          }
          return w;
        })
      );

      if (selectedDetailWord && selectedDetailWord.id === wordId) {
        setSelectedDetailWord((prev) => (prev ? { ...prev, isUnlearned: !prev.isUnlearned } : null));
      }
    },
    [selectedDetailWord]
  );

  // Delete word
  const handleDeleteWord = useCallback((wordId: string) => {
    setWords((prev) => prev.filter((w) => w.id !== wordId));
  }, []);

  // Add word manually to current set
  const handleAddManualWord = useCallback(
    (
      wordData: Omit<
        VocabItem,
        | 'id'
        | 'sourceSetId'
        | 'mastery'
        | 'srsStage'
        | 'nextReviewDate'
        | 'reviewCount'
        | 'correctCount'
        | 'incorrectCount'
      >
    ) => {
      const targetSetId =
        isAllLibrary || !activeSet?.id ? sets[0]?.id || 'custom-manual-set' : activeSet.id;

      const newWord: VocabItem = {
        ...wordData,
        id: `word-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceSetId: targetSetId,
        mastery: 'new',
        srsStage: 0,
        nextReviewDate: Date.now(),
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
      };

      setWords((prev) => {
        const updated = [newWord, ...prev];
        saveStoredWords(updated, currentUserId);
        if (currentUserId !== 'guest') syncWordsToFirebase(updated, currentUserId).catch(() => {});
        return updated;
      });
      setSets((prev) => {
        const updated = prev.map((s) => (s.id === targetSetId ? { ...s, totalWords: s.totalWords + 1 } : s));
        saveStoredSets(updated, currentUserId);
        if (currentUserId !== 'guest') syncSetsToFirebase(updated, currentUserId).catch(() => {});
        return updated;
      });
    },
    [isAllLibrary, activeSet?.id, sets, currentUserId]
  );

  // Add PDF or Bulk Set (Single)
  const handleSaveSet = useCallback(
    (newSet: WordSet, newWords: VocabItem[]) => {
      setSets((prev) => {
        const updated = [newSet, ...prev];
        saveStoredSets(updated, currentUserId);
        if (currentUserId !== 'guest') syncSetsToFirebase(updated, currentUserId).catch(() => {});
        return updated;
      });
      setWords((prev) => {
        const updated = [...newWords, ...prev];
        saveStoredWords(updated, currentUserId);
        if (currentUserId !== 'guest') syncWordsToFirebase(updated, currentUserId).catch(() => {});
        return updated;
      });
      setActiveSetId(newSet.id);
      setActiveTab('dashboard');
    },
    [setActiveTab, currentUserId]
  );

  // Import from Excel or CSV handler
  const handleImportExcelComplete = useCallback(
    (newWords: VocabItem[], newSet?: WordSet) => {
      if (newSet) {
        setSets((prev) => {
          const updated = [newSet, ...prev];
          saveStoredSets(updated, currentUserId);
          if (currentUserId !== 'guest') syncSetsToFirebase(updated, currentUserId).catch(() => {});
          return updated;
        });
        setActiveSetId(newSet.id);
      } else {
        setSets((prev) => {
          const updated = prev.map((s) =>
            s.id === activeSetId ? { ...s, totalWords: s.totalWords + newWords.length } : s
          );
          saveStoredSets(updated, currentUserId);
          if (currentUserId !== 'guest') syncSetsToFirebase(updated, currentUserId).catch(() => {});
          return updated;
        });
      }

      setWords((prev) => {
        const updated = [...newWords, ...prev];
        saveStoredWords(updated, currentUserId);
        if (currentUserId !== 'guest') syncWordsToFirebase(updated, currentUserId).catch(() => {});
        return updated;
      });
      fireCelebration();
      setActiveTab('dashboard');
    },
    [activeSetId, setActiveTab, currentUserId]
  );

  // Add Multiple topic-split sets
  const handleSaveMultipleSets = useCallback(
    (setsWithWords: Array<{ set: WordSet; words: VocabItem[] }>) => {
      const newSets = setsWithWords.map((item) => item.set);
      const newWords = setsWithWords.flatMap((item) => item.words);
      setSets((prev) => {
        const updated = [...newSets, ...prev];
        saveStoredSets(updated, currentUserId);
        if (currentUserId !== 'guest') syncSetsToFirebase(updated, currentUserId).catch(() => {});
        return updated;
      });
      setWords((prev) => {
        const updated = [...newWords, ...prev];
        saveStoredWords(updated, currentUserId);
        if (currentUserId !== 'guest') syncWordsToFirebase(updated, currentUserId).catch(() => {});
        return updated;
      });
      if (newSets[0]) {
        setActiveSetId(newSets[0].id);
      }
      setActiveTab('dashboard');
    },
    [setActiveTab, currentUserId]
  );

  // Study session completion handler
  const handleCompleteSession = useCallback(
    (mode: StudyRecord['mode'], correct: number, total: number) => {
      const updated = recordStudySession(
        {
          wordsStudied: total,
          correctAnswers: correct,
          totalQuestions: total,
          durationSeconds: Math.max(60, total * 20),
          mode,
        },
        words,
        currentUserId
      );
      setProgress(updated);

      if (total > 0 && correct / total >= 0.7) {
        sounds.playComplete();
        fireCelebration();
      } else {
        sounds.playStreak();
      }
    },
    [words, currentUserId]
  );

  const handleOpenAiBoosterForWord = useCallback(
    (word: VocabItem) => {
      setAiInitialWord(word);
      setActiveTab('ai-booster');
    },
    [setActiveTab]
  );

  const handleDataSynced = useCallback(
    (syncedData: { words: VocabItem[]; sets: WordSet[]; progress: UserProgress }) => {
      if (syncedData.words && syncedData.words.length > 0) {
        setWords(syncedData.words);
      }
      if (syncedData.sets && syncedData.sets.length > 0) {
        setSets(syncedData.sets);
      }
      if (syncedData.progress) {
        setProgress(syncedData.progress);
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#E2E8F0] flex flex-col font-sans selection:bg-indigo-600 selection:text-white bg-mesh-radial">
      {/* Universal Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onSelectWord={(word) => setSelectedDetailWord(word)}
        onOpenUpload={() => setIsPdfModalOpen(true)}
        onOpenExcelImport={() => setIsExcelModalOpen(true)}
        onOpenAddWord={() => setIsManualWordModalOpen(true)}
        words={words}
        sets={sets}
      />

      {/* Top Modern Glassmorphic Navigation Bar */}
      <ModernNavbar
        currentView={activeTab}
        onNavigate={(view: AppViewTab) => setActiveTab(view)}
        sets={sets}
        activeSetId={activeSetId}
        onSelectSet={(id) => setActiveSetId(id)}
        onOpenUpload={() => setIsPdfModalOpen(true)}
        onOpenBatchImport={() => setIsBatchImportOpen(true)}
        onOpenExcelImport={() => setIsExcelModalOpen(true)}
        onOpenAddWord={() => setIsManualWordModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
        }}
        progress={progress}
        totalWordsCount={words.length}
        userProfile={userProfile}
        getWords={() => words}
        getSets={() => sets}
        getProgress={() => progress}
        onDataSynced={handleDataSynced}
      />

      {/* Main Content Space with Suspense */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-10 py-5 sm:py-7 pb-24 md:pb-8">
        <Suspense fallback={<LoadingFallback message="Đang tải không gian học..." />}>
          {/* 🏠 Studio / Dashboard View (Eager loaded for instant first paint) */}
          {activeTab === 'dashboard' && (
            <ModernDashboard
              activeSet={activeSet}
              words={words}
              progress={progress}
              userProfile={userProfile}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenAuth={() => {
                setAuthModalMode('signin');
                setIsAuthModalOpen(true);
              }}
              onStartMode={(mode) => setActiveTab(mode as AppViewTab)}
              onSelectSet={(id) => setActiveSetId(id)}
              onOpenUpload={() => setIsPdfModalOpen(true)}
              onOpenBatchImport={() => setIsBatchImportOpen(true)}
              onOpenExcelImport={() => setIsExcelModalOpen(true)}
              onOpenAddWord={() => setIsManualWordModalOpen(true)}
              onSelectWord={(word) => setSelectedDetailWord(word)}
              onToggleBookmark={handleToggleBookmark}
              onToggleUnlearned={handleToggleUnlearned}
            />
          )}

          {/* 📚 Vocab Lab Hub (7 Modes & Study Suite) */}
          {activeTab === 'vocab-hub' && (
            <ModernVocabHub
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              allWords={words}
              progress={progress}
              onBack={() => setActiveTab('dashboard')}
              onNavigateMode={(mode) => setActiveTab(mode as AppViewTab)}
            />
          )}

          {/* 🎙️ Speaking Hub (10 Modes Suite) */}
          {activeTab === 'speaking-hub' && (
            <ModernSpeakingHub
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('dashboard')}
              onNavigateMode={(mode) => setActiveTab(mode as AppViewTab)}
            />
          )}

          {/* Flashcard SRS Mode */}
          {activeTab === 'flashcard' && (
            <FlashcardMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              onBack={() => setActiveTab('dashboard')}
              onRateWord={handleRateWord}
              onToggleBookmark={handleToggleBookmark}
              onToggleUnlearned={handleToggleUnlearned}
              onOpenAiBoosterForWord={handleOpenAiBoosterForWord}
              onCompleteSession={(correct, total) => handleCompleteSession('flashcard', correct, total)}
            />
          )}

          {/* Quiz Mode */}
          {activeTab === 'quiz' && (
            <QuizMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              allWords={words}
              activeSet={activeSet}
              onBack={() => setActiveTab('dashboard')}
              onRateWord={handleRateWord}
              onCompleteQuiz={(correct, total) => handleCompleteSession('quiz', correct, total)}
            />
          )}

          {/* Spelling & Dictation Mode */}
          {activeTab === 'spelling' && (
            <SpellingMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              onBack={() => setActiveTab('dashboard')}
              onRateWord={handleRateWord}
              onCompleteSession={(correct, total) => handleCompleteSession('spelling', correct, total)}
            />
          )}

          {/* Word Family & Synonyms Matching Mode */}
          {activeTab === 'word-family' && (
            <WordFamilyMatchMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              onBack={() => setActiveTab('dashboard')}
              onCompleteSession={(correct, total) => handleCompleteSession('word-family', correct, total)}
            />
          )}

          {/* Sentence Cloze Context Mode */}
          {activeTab === 'cloze' && (
            <SentenceClozeMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              allWords={words}
              activeSet={activeSet}
              onBack={() => setActiveTab('dashboard')}
              onRateWord={handleRateWord}
              onCompleteSession={(correct, total) => handleCompleteSession('cloze', correct, total)}
            />
          )}

          {/* Timed Drill / Focus Mode */}
          {activeTab === 'timed-drill' && (
            <TimedDrillMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              allWords={words}
              activeSet={activeSet}
              onBack={() => setActiveTab('dashboard')}
              onRateWord={handleRateWord}
              onCompleteDrill={(correct, total) => handleCompleteSession('timed-drill', correct, total)}
            />
          )}

          {/* AI Band Booster Center */}
          {activeTab === 'ai-booster' && (
            <AiBandBooster
              words={activeSetWords.length > 0 ? activeSetWords : words}
              allWords={words}
              activeSet={activeSet}
              progress={progress}
              initialWord={aiInitialWord}
              onBack={() => setActiveTab('dashboard')}
              onAddWordToSet={handleAddManualWord}
            />
          )}

          {/* IELTS Writing Assistant & Lexical Heatmap Lab */}
          {activeTab === 'writing' && (
            <WritingAssistantLab
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('dashboard')}
              currentUserId={currentUserId}
            />
          )}

          {/* IELTS Speaking AI Mock Examiner */}
          {activeTab === 'speaking' && (
            <SpeakingMockExaminer
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('dashboard')}
              onRecordStudySession={(wordsCount, correctCount) =>
                handleCompleteSession('speaking', correctCount, wordsCount)
              }
              onOpenPortfolio={() => setActiveTab('speaking-portfolio')}
              onOpenRadar={() => setActiveTab('weakness-radar')}
              onOpenAreaExpander={() => setActiveTab('area-expander')}
              onOpenEmergencyStalling={() => setActiveTab('emergency-stalling')}
              onNavigateMode={(mode) => setActiveTab(mode as AppViewTab)}
            />
          )}

          {/* IELTS Speaking Part 2 Dedicated Cue Card Trainer */}
          {activeTab === 'speaking-part2' && (
            <SpeakingPart2Trainer
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('speaking')}
              onRecordStudySession={(wordsCount, correctCount) =>
                handleCompleteSession('speaking', correctCount, wordsCount)
              }
              onOpenPortfolio={() => setActiveTab('speaking-portfolio')}
              onOpenRadar={() => setActiveTab('weakness-radar')}
            />
          )}

          {/* Shadowing Lab */}
          {activeTab === 'shadowing' && (
            <ShadowingLabMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              allWords={words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('speaking')}
              onRecordStudySession={(wordsCount, correctCount) =>
                handleCompleteSession('shadowing', correctCount, wordsCount)
              }
            />
          )}

          {/* Quick Response Drill */}
          {activeTab === 'quick-speaking-drill' && (
            <QuickResponseDrillMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              allWords={words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('speaking')}
              onRecordStudySession={(wordsCount, correctCount) =>
                handleCompleteSession('quick-speaking-drill', correctCount, wordsCount)
              }
            />
          )}

          {/* IELTS Speaking Portfolio */}
          {activeTab === 'speaking-portfolio' && (
            <SpeakingPortfolio
              words={words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('speaking')}
              onStartSpeakingMode={(mode) => setActiveTab(mode as AppViewTab)}
              userId={userProfile.uid}
            />
          )}

          {/* Personalized Weakness Radar */}
          {activeTab === 'weakness-radar' && (
            <PersonalizedWeaknessRadar
              words={words}
              onBack={() => setActiveTab('speaking')}
              onStartMode={(mode) => setActiveTab(mode as AppViewTab)}
            />
          )}

          {/* Full 15-Minute Mock Test Simulation */}
          {activeTab === 'full-mock-test' && (
            <FullMockTestSimulation
              words={activeSetWords.length > 0 ? activeSetWords : words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('speaking')}
              onRecordStudySession={(wordsCount, correctCount) =>
                handleCompleteSession('speaking', correctCount, wordsCount)
              }
              onOpenPortfolio={() => setActiveTab('speaking-portfolio')}
              onOpenRadar={() => setActiveTab('weakness-radar')}
            />
          )}

          {/* AREA / PEEL Answer Expander */}
          {activeTab === 'area-expander' && (
            <AreaAnswerExpander
              words={words}
              activeSet={activeSet}
              onBack={() => setActiveTab('speaking')}
              onOpenEmergencyStalling={() => setActiveTab('emergency-stalling')}
              onStartPracticeInMock={() => {
                setActiveTab('speaking');
              }}
            />
          )}

          {/* Emergency Stalling Toolkit */}
          {activeTab === 'emergency-stalling' && (
            <EmergencyStallingToolkit
              onBack={() => setActiveTab('speaking')}
              onOpenAreaExpander={() => setActiveTab('area-expander')}
              onStartPracticeInMock={() => {
                setActiveTab('speaking');
              }}
            />
          )}

          {/* Progressive Speech Ladder */}
          {activeTab === 'speech-ladder' && (
            <ProgressiveSpeechLadder
              words={words}
              activeSet={activeSet}
              onBack={() => setActiveTab('speaking')}
              onOpenEmergencyStalling={() => setActiveTab('emergency-stalling')}
              onOpenAreaExpander={() => setActiveTab('area-expander')}
              onStartPracticeInMock={() => {
                setActiveTab('speaking');
              }}
            />
          )}

          {/* AI Speech Upgrade & Shadowing */}
          {activeTab === 'speech-upgrade' && (
            <SpeechUpgradeShadowing
              words={words}
              activeSet={activeSet}
              onBack={() => setActiveTab('speaking')}
              onOpenEmergencyStalling={() => setActiveTab('emergency-stalling')}
              onOpenLadder={() => setActiveTab('speech-ladder')}
              onOpenMindmap={() => setActiveTab('idea-mindmap')}
            />
          )}

          {/* 5-Dimensional Mindmap Idea Generator */}
          {activeTab === 'idea-mindmap' && (
            <IdeaMindmapToolkit
              words={words}
              activeSet={activeSet}
              onBack={() => setActiveTab('speaking')}
              onOpenEmergencyStalling={() => setActiveTab('emergency-stalling')}
              onOpenLadder={() => setActiveTab('speech-ladder')}
              onOpenSpeechUpgrade={() => setActiveTab('speech-upgrade')}
              onStartPracticeInMock={() => {
                setActiveTab('speaking');
              }}
            />
          )}

          {/* AI Daily Coffee Chat Lounge */}
          {activeTab === 'daily-chat' && (
            <DailyCoffeeChatMode
              words={activeSetWords.length > 0 ? activeSetWords : words}
              allWords={words}
              activeSet={activeSet}
              progress={progress}
              onBack={() => setActiveTab('speaking')}
              onRecordStudySession={(wordsCount, correctCount) =>
                handleCompleteSession('speaking', correctCount, wordsCount)
              }
              onOpenPortfolio={() => setActiveTab('speaking-portfolio')}
            />
          )}

          {/* Full Vocabulary List & Search */}
          {activeTab === 'list' && (
            <VocabList
              words={words}
              activeSet={activeSet}
              onBack={() => setActiveTab('dashboard')}
              onSelectWord={(word) => setSelectedDetailWord(word)}
              onToggleBookmark={handleToggleBookmark}
              onToggleUnlearned={handleToggleUnlearned}
              onDeleteWord={handleDeleteWord}
              onOpenAddWord={() => setIsManualWordModalOpen(true)}
              onOpenBatchImport={() => setIsBatchImportOpen(true)}
              onOpenExcelImport={() => setIsExcelModalOpen(true)}
              onOpenAiBoosterForWord={handleOpenAiBoosterForWord}
              onStartMode={(mode) => setActiveTab(mode as AppViewTab)}
              onSelectSet={(id) => setActiveSetId(id)}
            />
          )}

          {/* Progress & SRS Analytics Report */}
          {activeTab === 'progress' && (
            <ProgressReport
              progress={progress}
              words={words}
              sets={sets}
              activeSetId={activeSetId}
              onSelectSet={(id) => {
                setActiveSetId(id);
                setActiveTab('dashboard');
              }}
              onStartMode={(mode) => setActiveTab(mode as AppViewTab)}
              onBack={() => setActiveTab('dashboard')}
              onPracticeWeakWords={() => setActiveTab('flashcard')}
              onSelectWord={(word) => setSelectedDetailWord(word)}
            />
          )}
        </Suspense>
      </main>

      {/* Modals with Suspense */}
      <Suspense fallback={null}>
        {/* PDF Uploader Modal */}
        {isPdfModalOpen && (
          <PdfUploaderModal
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            onSaveSet={handleSaveSet}
            onSaveMultipleSets={handleSaveMultipleSets}
          />
        )}

        {/* Direct Batch 1500+ Words Importer Modal */}
        {isBatchImportOpen && (
          <BatchImportModal
            isOpen={isBatchImportOpen}
            onClose={() => setIsBatchImportOpen(false)}
            onSaveSet={handleSaveSet}
            onSaveMultipleSets={handleSaveMultipleSets}
            currentSetsCount={sets.length}
          />
        )}

        {/* Dedicated Excel / CSV Spreadsheet Importer Modal */}
        {isExcelModalOpen && (
          <ExcelCsvImportModal
            isOpen={isExcelModalOpen}
            onClose={() => setIsExcelModalOpen(false)}
            sets={sets}
            activeSetId={activeSetId}
            onImportComplete={(newWords, newSet) => {
              if (newSet) {
                handleSaveSet(newSet, newWords);
              } else {
                setWords((prev) => [...newWords, ...prev]);
                setSets((prev) =>
                  prev.map((s) =>
                    s.id === activeSetId ? { ...s, totalWords: s.totalWords + newWords.length } : s
                  )
                );
                fireCelebration();
              }
            }}
          />
        )}

        {/* Manual Word Add Modal */}
        {isManualWordModalOpen && (
          <ManualWordModal
            isOpen={isManualWordModalOpen}
            onClose={() => setIsManualWordModalOpen(false)}
            onSave={handleAddManualWord}
          />
        )}

        {/* Word Detail Modal */}
        {selectedDetailWord && (
          <WordDetailModal
            word={selectedDetailWord}
            isOpen={!!selectedDetailWord}
            onClose={() => setSelectedDetailWord(null)}
            onToggleBookmark={handleToggleBookmark}
            onToggleUnlearned={handleToggleUnlearned}
            onOpenAiBoosterForWord={handleOpenAiBoosterForWord}
          />
        )}

        {/* Auth Sign In & Sign Up Modal */}
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            initialMode={authModalMode}
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={(newProfile) => {
              setUserProfile(newProfile);
              setIsAuthModalOpen(false);
              saveLocalCachedProfile(newProfile);
            }}
          />
        )}

        {/* Visualized User Profile & Personalization Hub Modal */}
        {isProfileModalOpen && (
          <UserProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            profile={userProfile}
            progress={progress}
            words={words}
            onUpdateProfile={(updated) => {
              setUserProfile(updated);
              saveLocalCachedProfile(updated);
            }}
            onOpenAuth={() => {
              setIsAuthModalOpen(true);
            }}
            onReloadWords={(newWords, newSets) => {
              setWords(newWords);
              setSets(newSets);
              if (newSets.length > 0) {
                setActiveSetId(newSets[0].id);
              }
              globalSearchEngine.buildIndex(newWords);
            }}
          />
        )}
      </Suspense>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as AppViewTab)}
        onOpenAddWord={() => setIsManualWordModalOpen(true)}
        bandScore={progress.estimatedBand}
      />
    </div>
  );
}

export default App;
