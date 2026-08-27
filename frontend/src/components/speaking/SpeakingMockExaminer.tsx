import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Award,
  Clock,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Play,
  Pause,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Flame,
  Check,
  Send,
  Loader2,
  FileText,
  Lightbulb,
  Headphones,
  Zap,
  Info,
  History,
  Layers,
  Sparkle,
  Radio,
  Sliders,
  VolumeX,
  BarChart3,
  ShieldAlert,
  LifeBuoy,
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  VocabItem,
  WordSet,
  UserProgress,
  SpeakingQuestion,
  SpeakingEvaluationResult,
  SavedSpeakingAttempt,
} from '../../types';
import { evaluateSpeakingResponse, generateSpeakingQuestionAi } from '../../services/geminiService';
import { speakWord, speakWordAsync } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration } from '../../utils/confetti';
import { AccentSwitcher } from './AccentSwitcher';
import { WpmSpeechRateMeter, SilenceAndFillerAdvisor } from './WpmSpeechRateMeter';
import {
  MandatoryVocabChallenge,
  MandatoryVocabReport,
  PinnedWordItem,
} from './MandatoryVocabChallenge';
import { WeaknessPreSessionAlert } from '../index';
import { saveSpeakingAttemptToPortfolio } from '../../utils/speakingStorage';
import { SpeakingHubHeader } from './SpeakingHubHeader';
import { SpeakingTopicCompanion } from './SpeakingTopicCompanion';
import { SpeakingQuickAssistant } from './SpeakingQuickAssistant';
import { LayoutGrid, PanelLeftClose, PanelLeftOpen, Sidebar } from 'lucide-react';

interface SpeakingMockExaminerProps {
  words: VocabItem[];
  activeSet: WordSet;
  progress?: UserProgress;
  onBack: () => void;
  onRecordStudySession?: (wordsCount: number, correctCount: number, durationSeconds: number) => void;
  onOpenPortfolio?: () => void;
  onOpenRadar?: () => void;
  onOpenAreaExpander?: (questionText?: string) => void;
  onOpenEmergencyStalling?: () => void;
  onNavigateMode?: (mode: string) => void;
  currentUserId?: string;
}

// Curated authentic Cambridge IELTS Speaking question bank
const DEFAULT_SPEAKING_QUESTIONS: SpeakingQuestion[] = [
  // PART 1
  {
    id: 'p1-tech-1',
    part: 1,
    topic: 'Công nghệ & Đời sống số (Technology)',
    questionText: 'How has modern technology changed the way you study or work on a daily basis?',
    suggestedVocab: ['facilitate', 'streamline', 'indispensable', 'revolutionize'],
    suggestedIdeas: [
      'Allows access to vast educational resources instantaneously',
      'Automates repetitive tasks and boosts overall productivity',
      'Helps maintain seamless communication with peers and colleagues',
    ],
  },
  {
    id: 'p1-env-2',
    part: 1,
    topic: 'Môi trường & Đô thị (Environment & Living)',
    questionText: 'Do you think your hometown is an environmentally friendly place to live? Why or why not?',
    suggestedVocab: ['sustainable', 'urbanization', 'biodiversity', 'deteriorate'],
    suggestedIdeas: [
      'Presence of green parks versus air pollution from heavy traffic',
      'Local government waste management initiatives',
      'Public awareness regarding plastic consumption',
    ],
  },
  {
    id: 'p1-edu-3',
    part: 1,
    topic: 'Giáo dục & Học tập (Education & Career)',
    questionText: 'What skills do you consider the most crucial for young people entering the modern workforce?',
    suggestedVocab: ['adaptability', 'proficiency', 'critical thinking', 'perseverance'],
    suggestedIdeas: [
      'Digital literacy and technological agility',
      'Interpersonal skills and collaborative teamwork',
      'Continuous learning in a rapidly changing economy',
    ],
  },
  {
    id: 'p1-art-4',
    part: 1,
    topic: 'Văn hóa & Nghệ thuật (Culture & Leisure)',
    questionText: 'Why do many people enjoy visiting museums and art galleries during their free time?',
    suggestedVocab: ['heritage', 'aesthetic', 'enriching', 'contemplate'],
    suggestedIdeas: [
      'Broadens historical understanding and cultural appreciation',
      'Offers a peaceful escape from hectic urban life',
      'Inspires creative and analytical thinking',
    ],
  },

  // PART 2 (CUE CARDS)
  {
    id: 'p2-env-1',
    part: 2,
    topic: 'Bảo vệ môi trường (Environmental Challenge)',
    questionText: 'Describe an environmental problem that has occurred in your city or country.',
    subPrompts: [
      'What the problem is and where it happens',
      'What causes this environmental issue',
      'How it impacts people\'s daily lives and health',
      'And explain what measures should be implemented to mitigate it',
    ],
    suggestedVocab: ['degradation', 'mitigate', 'unprecedented', 'catastrophic', 'implement'],
    suggestedIdeas: [
      'Air smog / plastic pollution resulting from rapid industrialization',
      'Respiratory illnesses among vulnerable populations',
      'Transition towards renewable energy and stricter emissions regulations',
    ],
  },
  {
    id: 'p2-tech-2',
    part: 2,
    topic: 'Đổi mới công nghệ (Technological Innovation)',
    questionText: 'Describe an innovative electronic device or software application that you find remarkably useful.',
    subPrompts: [
      'What this technology is and when you started using it',
      'What key features make it stand out',
      'How frequently you utilize it for learning or work',
      'And explain why you consider it indispensable in your life',
    ],
    suggestedVocab: ['indispensable', 'cutting-edge', 'streamline', 'versatile', 'profound'],
    suggestedIdeas: [
      'AI-powered language learning platform or smart productivity tool',
      'Real-time adaptive algorithms and intuitive interface',
      'Saving substantial time and enhancing academic mastery',
    ],
  },
  {
    id: 'p2-pers-3',
    part: 2,
    topic: 'Kỷ niệm & Trải nghiệm (Personal Growth)',
    questionText: 'Describe a challenging goal you set for yourself and successfully accomplished.',
    subPrompts: [
      'What the goal was and why you chose it',
      'What major obstacles you encountered along the way',
      'How you persevered to overcome those difficulties',
      'And explain how achieving this goal influenced your personal development',
    ],
    suggestedVocab: ['perseverance', 'formidable', 'attainment', 'resilience', 'transformative'],
    suggestedIdeas: [
      'Preparing for a high-stakes exam (such as IELTS 7.5+)',
      'Balancing tight schedules and battling self-doubt',
      'Gaining immense self-discipline and confidence for future endeavours',
    ],
  },

  // PART 3
  {
    id: 'p3-soc-1',
    part: 3,
    topic: 'Xã hội & Tương lai (Society & Automation)',
    questionText: 'To what extent will artificial intelligence and automation alter employment opportunities for future generations?',
    suggestedVocab: ['inevitable', 'disruptive', 'obsolete', 'augment', 'competence'],
    suggestedIdeas: [
      'Routine repetitive jobs may become obsolete while high-cognitive roles emerge',
      'The need for continuous upskilling and lifelong education',
      'Ethical considerations and human-AI synergy',
    ],
  },
  {
    id: 'p3-edu-2',
    part: 3,
    topic: 'Cải cách giáo dục (Higher Education)',
    questionText: 'Should universities prioritize theoretical academic research or practical job-market skills?',
    suggestedVocab: ['pragmatic', 'holistic', 'discrepancy', 'interdisciplinary', 'foster'],
    suggestedIdeas: [
      'Theoretical research drives fundamental human scientific breakthroughs',
      'Practical vocational training ensures immediate economic employability',
      'A synergistic, interdisciplinary approach combining both paradigms is ideal',
    ],
  },
  {
    id: 'p3-glob-3',
    part: 3,
    topic: 'Toàn cầu hóa & Văn hóa (Globalization)',
    questionText: 'Does globalization lead to cultural homogenization or does it encourage cultural diversity?',
    suggestedVocab: ['homogenization', 'preserve', 'indigenous', 'interconnected', 'coexistence'],
    suggestedIdeas: [
      'Risk of dominant cultures overshadowing unique indigenous traditions',
      'Global connectivity enables rich cultural cross-pollination and appreciation',
      'Government policies are essential to safeguard intangible cultural heritage',
    ],
  },
];

export const SpeakingMockExaminer: React.FC<SpeakingMockExaminerProps> = ({
  words,
  activeSet,
  progress,
  onBack,
  onRecordStudySession,
  onOpenPortfolio,
  onOpenRadar,
  onOpenAreaExpander,
  onOpenEmergencyStalling,
  onNavigateMode,
}) => {
  // Navigation & Selection states
  const [selectedPart, setSelectedPart] = useState<1 | 2 | 3>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingAiQuestion, setIsGeneratingAiQuestion] = useState(false);
  const [questionList, setQuestionList] = useState<SpeakingQuestion[]>(DEFAULT_SPEAKING_QUESTIONS);
  const latestAudioBlobRef = useRef<Blob | null>(null);

  // Active UI drawer tab inside question stage
  const [activeStageTab, setActiveStageTab] = useState<'vocab' | 'ideas' | 'new-topic'>('vocab');

  // Focus Mode toggle (Chế độ tập trung cao độ)
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Widescreen Sidebars toggle (Trợ lý từ vựng & Phao cứu sinh hai bên màn hình)
  const [isSidebarsVisible, setIsSidebarsVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ielts_speaking_sidebars_visible');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSidebars = () => {
    sounds.playClick();
    setIsSidebarsVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ielts_speaking_sidebars_visible', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  // Active question filter
  const filteredQuestions = questionList.filter((q) => q.part === selectedPart);
  const currentQuestion: SpeakingQuestion =
    filteredQuestions[currentQuestionIndex] ||
    filteredQuestions[0] ||
    DEFAULT_SPEAKING_QUESTIONS[0];

  const [challengeWordsSeed, setChallengeWordsSeed] = useState<number>(0);

  // 🎯 Mandatory Target Vocabulary Challenge (3-4 high-band words pinned per question)
  const pinnedChallengeWords: PinnedWordItem[] = React.useMemo(() => {
    const questionWords: PinnedWordItem[] = (currentQuestion.suggestedVocab || []).map((term) => {
      const found = words.find((w) => w.term.toLowerCase() === term.toLowerCase());
      return {
        term,
        ipa: found?.ipa,
        meaningVi: found?.meaningVi || found?.definitionVi || 'Từ vựng học thuật trọng tâm',
        ieltsBand: found?.ieltsBand || '8.0+',
        collocation:
          found?.collocations?.[0]?.collocation ||
          found?.exampleSentence?.slice(0, 50) ||
          `collocation trong chủ đề ${currentQuestion.topic}`,
      };
    });

    const setWords: PinnedWordItem[] = words
      .filter((w) => !questionWords.some((qw) => qw.term.toLowerCase() === w.term.toLowerCase()))
      .map((w) => ({
        term: w.term,
        ipa: w.ipa,
        meaningVi: w.meaningVi || w.definitionVi || 'Từ vựng trọng tâm',
        ieltsBand: w.ieltsBand || '7.5+',
        collocation:
          w.collocations?.[0]?.collocation ||
          w.exampleSentence?.slice(0, 50) ||
          undefined,
      }));

    const combined = [...questionWords, ...setWords];
    if (combined.length === 0) {
      return [
        { term: 'exponential', meaningVi: 'theo cấp số nhân, tăng vọt', ieltsBand: '8.0', collocation: 'exponential growth' },
        { term: 'exacerbate', meaningVi: 'làm trầm trọng thêm', ieltsBand: '8.5', collocation: 'exacerbate the problem' },
        { term: 'detrimental', meaningVi: 'có hại, bất lợi', ieltsBand: '7.5', collocation: 'detrimental impact on' },
      ];
    }

    const offset = challengeWordsSeed % combined.length;
    const rotated = [...combined.slice(offset), ...combined.slice(0, offset)];
    return rotated.slice(0, 3);
  }, [currentQuestion, words, challengeWordsSeed]);

  // Target vocabulary terms array for AI evaluator
  const targetVocabList = React.useMemo(() => {
    return pinnedChallengeWords.map((w) => w.term);
  }, [pinnedChallengeWords]);

  // Speaking Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Part 2 Cue Card Timer States
  const [isPart2PrepPhase, setIsPart2PrepPhase] = useState(false);
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [prepNotes, setPrepNotes] = useState('');

  // AI Evaluation states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<SpeakingEvaluationResult | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'feedback' | 'speed' | 'model'>('feedback');

  const [savedAttempts, setSavedAttempts] = useState<SavedSpeakingAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('ielts_saved_speaking_attempts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isPlayingModelAudio, setIsPlayingModelAudio] = useState(false);

  // Audio wave visualizer animation bar heights
  const [waveHeights, setWaveHeights] = useState<number[]>([20, 45, 70, 30, 85, 60, 40, 75, 50, 90, 35, 65]);
  const [silenceSeconds, setSilenceSeconds] = useState<number>(0);

  // 🎙️ Hands-Free VAD (Voice Activity Detection) Mode States
  const [isHandsFreeMode, setIsHandsFreeMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ielts_hands_free_speaking') === 'true';
    } catch {
      return false;
    }
  });
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState<boolean>(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const prepTimerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<any>(null);
  const isHandsFreeRef = useRef<boolean>(isHandsFreeMode);
  const isRecordingRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    isHandsFreeRef.current = isHandsFreeMode;
    try {
      localStorage.setItem('ielts_hands_free_speaking', isHandsFreeMode ? 'true' : 'false');
    } catch {}
  }, [isHandsFreeMode]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      clearInterval(prepTimerIntervalRef.current);
      clearInterval(vadIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Timer effect for recording duration & simulated wave animation
  useEffect(() => {
    let animInterval: any;
    if (isRecording) {
      animInterval = setInterval(() => {
        setWaveHeights(
          Array.from({ length: 14 }, () => Math.floor(Math.random() * 80) + 15)
        );
      }, 100);
    } else {
      setWaveHeights([20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]);
    }
    return () => clearInterval(animInterval);
  }, [isRecording]);

  // Part 2 Preparation Timer countdown
  useEffect(() => {
    if (isPart2PrepPhase && prepTimeLeft > 0) {
      prepTimerIntervalRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepTimerIntervalRef.current);
            setIsPart2PrepPhase(false);
            sounds.playLevelUp();
            startRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(prepTimerIntervalRef.current);
  }, [isPart2PrepPhase, prepTimeLeft]);

  // Start Recording Audio & Speech-to-Text
  const startRecording = async () => {
    try {
      sounds.playClick();
      setEvalError(null);
      setTranscript('');
      transcriptRef.current = '';
      setAudioUrl(null);
      setRecordingDuration(0);
      setSilenceSeconds(0);
      setAutoSubmitCountdown(null);
      audioChunksRef.current = [];

      // 1. Microphone capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Audio Context & Volume Analyser for VAD & silence detection
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // 3. MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        latestAudioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start(250);

      // 4. Web Speech API SpeechRecognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentFullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentFullTranscript += event.results[i][0].transcript + ' ';
          }
          const cleaned = currentFullTranscript.trim();
          setTranscript(cleaned);
          transcriptRef.current = cleaned;
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition event:', e.error);
        };

        recognition.onend = () => {
          if (isRecordingRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
      }

      setIsRecording(true);
      isRecordingRef.current = true;

      // 5. Start Duration Timer
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);

      // 6. VAD (Voice Activity Detection) Polling
      let silenceDurationMs = 0;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      vadIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || !isRecordingRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        if (avg < 12) {
          silenceDurationMs += 250;
        } else {
          silenceDurationMs = 0;
        }

        const silenceSec = silenceDurationMs / 1000;
        setSilenceSeconds(silenceSec);

        const currentWords = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length;
        const elapsedSec = Math.floor((Date.now() - startTime) / 1000);

        if (
          isHandsFreeRef.current &&
          currentWords >= 4 &&
          elapsedSec >= 4
        ) {
          if (silenceSec >= 2.0) {
            handleAutoVadComplete();
          } else if (silenceSec >= 1.0) {
            const remaining = Math.max(0, Math.ceil((2.0 - silenceSec) * 10) / 10);
            setAutoSubmitCountdown(remaining);
          } else {
            setAutoSubmitCountdown(null);
          }
        } else {
          setAutoSubmitCountdown(null);
        }
      }, 250);
    } catch (err) {
      console.error('Microphone access error:', err);
      setIsRecording(false);
      setEvalError('Không thể truy cập Microphone. Vui lòng cho phép quyền sử dụng mic trong trình duyệt hoặc gõ câu trả lời bên dưới.');
    }
  };

  const handleAutoVadComplete = () => {
    setAutoSubmitCountdown(null);
    stopRecording();
    setTimeout(() => {
      if (transcriptRef.current.trim()) {
        sounds.playClick();
        handleEvaluateAnswer();
      }
    }, 400);
  };

  const stopRecording = () => {
    sounds.playClick();
    setIsRecording(false);
    isRecordingRef.current = false;
    setAutoSubmitCountdown(null);
    clearInterval(timerIntervalRef.current);
    clearInterval(vadIntervalRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleStartPart2Preparation = () => {
    sounds.playClick();
    setIsPart2PrepPhase(true);
    setPrepTimeLeft(60);
    setPrepNotes('');
    setEvalResult(null);
    setTranscript('');
  };

  const handleSkipPrepAndSpeak = () => {
    clearInterval(prepTimerIntervalRef.current);
    setIsPart2PrepPhase(false);
    startRecording();
  };

  const handleEvaluateAnswer = async () => {
    if (!transcript.trim()) {
      setEvalError('Vui lòng ghi âm hoặc nhập câu trả lời của bạn trước khi chấm điểm.');
      return;
    }

    sounds.playClick();
    setIsEvaluating(true);
    setEvalError(null);

    try {
      const response = await evaluateSpeakingResponse({
        question: currentQuestion.questionText,
        part: currentQuestion.part,
        topic: currentQuestion.topic,
        transcript: transcript.trim(),
        durationSeconds: recordingDuration || 35,
        targetWords: targetVocabList,
      });

      setEvalResult(response);
      sounds.playCorrect();

      if (response.overallBand >= 7.0) {
        fireCelebration();
      }

      const newAttempt: SavedSpeakingAttempt = {
        id: `speaking-${Date.now()}`,
        date: new Date().toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        question: currentQuestion.questionText,
        part: currentQuestion.part,
        topic: currentQuestion.topic,
        transcript: transcript.trim(),
        overallBand: response.overallBand,
        result: response,
      };

      setSavedAttempts((prev) => [newAttempt, ...prev]);

      saveSpeakingAttemptToPortfolio(
        {
          mode: 'mock-examiner',
          part: currentQuestion.part,
          topic: currentQuestion.topic,
          question: currentQuestion.questionText,
          transcript: transcript.trim(),
          durationSeconds: recordingDuration || 35,
          overallBand: response.overallBand,
          criteriaScores: {
            fluency: response.criteriaScores.fluencyCoherence.score,
            lexical: response.criteriaScores.lexicalResource.score,
            grammar: response.criteriaScores.grammaticalRange.score,
            pronunciation: response.criteriaScores.pronunciation.score,
            wordsPerMinute: response.criteriaScores.fluencyCoherence.wordsPerMinute,
            hesitationsCount: response.criteriaScores.fluencyCoherence.hesitationsCount,
            deadSilencePausesCount: response.criteriaScores.fluencyCoherence.deadSilencePausesCount,
          },
          targetWordsUsed: response.targetWordsUsed || [],
          targetWordsMissed: response.targetWordsMissed || [],
          mandatoryVocabEvaluations: response.mandatoryVocabEvaluations,
          evalResult: response,
          audioUrl: audioUrl || undefined,
        },
        latestAudioBlobRef.current || undefined
      ).catch(() => {});

      if (onRecordStudySession) {
        onRecordStudySession(
          response.targetWordsUsed?.length || 3,
          response.overallBand >= 6.5 ? 1 : 0,
          recordingDuration || 45
        );
      }
    } catch (err: any) {
      console.error('Speaking eval error:', err);
      setEvalError(err.message || 'Có lỗi xảy ra khi chấm điểm IELTS Speaking. Vui lòng thử lại.');
      sounds.playWrong();
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGenerateAiQuestion = async () => {
    sounds.playClick();
    setIsGeneratingAiQuestion(true);
    setEvalError(null);

    try {
      const activeTopic = customTopic.trim() || currentQuestion.topic || activeSet.title;
      const vocabTerms = words.map((w) => w.term);

      const generated = await generateSpeakingQuestionAi({
        part: selectedPart,
        topic: activeTopic,
        vocabTerms,
      });

      setQuestionList((prev) => [generated, ...prev]);
      setCurrentQuestionIndex(0);
      setTranscript('');
      setEvalResult(null);
      sounds.playLevelUp();
    } catch (err: any) {
      console.error('Generate question error:', err);
      setEvalError('Không thể tạo câu hỏi AI lúc này. Hệ thống sử dụng ngân hàng đề thi chuẩn Cambridge.');
    } finally {
      setIsGeneratingAiQuestion(false);
    }
  };

  const handleSpeakQuestion = async (autoStartRecordingOnEnd: boolean = false) => {
    sounds.playClick();
    setIsExaminerSpeaking(true);
    try {
      await speakWordAsync(currentQuestion.questionText);
    } finally {
      setIsExaminerSpeaking(false);
      if (autoStartRecordingOnEnd || isHandsFreeRef.current) {
        setTimeout(() => {
          if (!isRecordingRef.current) {
            startRecording();
          }
        }, 500);
      }
    }
  };

  const handleNextQuestion = (triggerHandsFreeSpeech: boolean = false) => {
    sounds.playClick();
    const nextIdx = (currentQuestionIndex + 1) % filteredQuestions.length;
    setCurrentQuestionIndex(nextIdx);
    setTranscript('');
    setEvalResult(null);
    setEvalError(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPart2PrepPhase(false);
    setAutoSubmitCountdown(null);

    if (triggerHandsFreeSpeech || isHandsFreeRef.current) {
      const nextQ = filteredQuestions[nextIdx];
      if (nextQ) {
        setTimeout(() => {
          setIsExaminerSpeaking(true);
          speakWordAsync(nextQ.questionText).then(() => {
            setIsExaminerSpeaking(false);
            if (isHandsFreeRef.current && nextQ.part !== 2) {
              setTimeout(() => {
                startRecording();
              }, 600);
            }
          });
        }, 600);
      }
    }
  };

  const handleSpeakModelAnswer = (text: string) => {
    if (isPlayingModelAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingModelAudio(false);
    } else {
      setIsPlayingModelAudio(true);
      speakWord(text);
      setTimeout(() => {
        setIsPlayingModelAudio(false);
      }, (text.split(' ').length / 2.2) * 1000);
    }
  };

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const currentWpm =
    recordingDuration > 2 ? Math.round((wordCount / recordingDuration) * 60) : 0;

  return (
    <div className="relative w-full min-h-[calc(100vh-100px)] py-3 px-3 sm:px-6 lg:px-8">
      {/* Subtle Background Gradient Accents to fill empty side space on wide screens */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Left Side Subtle Glow */}
        <div className="absolute top-28 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-purple-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-24 -left-36 w-72 h-72 bg-indigo-600/8 rounded-full blur-[120px]" />
        {/* Right Side Subtle Glow */}
        <div className="absolute top-36 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-28 -right-36 w-80 h-80 bg-amber-500/6 rounded-full blur-[140px]" />
      </div>

      {/* Main Container with Spacious Widescreen Layout */}
      <div className="relative z-10 max-w-[1520px] w-full mx-auto space-y-6 animate-fadeIn pb-20">
        {/* 🧭 Unified Speaking Hub Header Navigation */}
        <SpeakingHubHeader
          currentMode="speaking"
          onSelectMode={(modeId) => {
            if (onNavigateMode) {
              onNavigateMode(modeId);
            } else if (modeId === 'speaking-portfolio' && onOpenPortfolio) {
              onOpenPortfolio();
            } else if (modeId === 'weakness-radar' && onOpenRadar) {
              onOpenRadar();
            } else if (modeId === 'area-expander' && onOpenAreaExpander) {
              onOpenAreaExpander(currentQuestion.questionText);
            } else if (modeId === 'emergency-stalling' && onOpenEmergencyStalling) {
              onOpenEmergencyStalling();
            }
          }}
          onBack={onBack}
          title="IELTS Speaking AI Mock Examiner"
          subtitle="Phòng thi tương tác 1-1 • Nhận diện giọng nói siêu mượt • Chấm 4 tiêu chí chuẩn Cambridge"
          badge="Cambridge Real-Time"
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          rightActions={
            <>
              {/* Hands-Free VAD Toggle */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsHandsFreeMode((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isHandsFreeMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                    : 'bg-[#1A202C] hover:bg-[#242C3D] text-[#8E97A4] hover:text-white border-[#2D3648]'
                }`}
                title="Chế độ Rảnh Tay (Hands-Free): Tự động bật Mic sau khi Giám Khảo hỏi, tự nộp bài khi im lặng 2s"
              >
                <Radio className={`w-3.5 h-3.5 ${isHandsFreeMode ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Rảnh Tay</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                    isHandsFreeMode ? 'bg-emerald-500 text-black' : 'bg-[#2D3648] text-slate-400'
                  }`}
                >
                  {isHandsFreeMode ? 'ON' : 'OFF'}
                </span>
              </button>

              <AccentSwitcher compact={true} />

              {/* View History Button */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowHistoryModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A202C] hover:bg-[#222836] border border-[#2D3648] text-xs font-bold text-[#8E97A4] hover:text-white transition-all cursor-pointer"
                title="Xem lại lịch sử các câu đã thi"
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Lịch Sử</span>
                <span className="px-1.5 py-0.2 rounded-md bg-[#252C3B] text-[10px] text-slate-300 font-mono">
                  {savedAttempts.length}
                </span>
              </button>
            </>
          }
        />

      {/* Weakness Radar Pre-session alert (only shown when not in strict focus mode) */}
      {!isFocusMode && (
        <WeaknessPreSessionAlert part={selectedPart} onOpenRadar={onOpenRadar} />
      )}

      {/* Part 1 / Part 2 / Part 3 Segmented Selector */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            part: 1 as const,
            title: 'Part 1: Phỏng Vấn Tổng Quan',
            sub: 'Câu ngắn 20 - 30s • Trả lời trôi chảy tự nhiên',
            activeStyle:
              'from-indigo-600/35 via-purple-600/25 to-[#161C26] border-indigo-500/80 text-indigo-200 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-950/50',
            badgeBg: 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40',
          },
          {
            part: 2 as const,
            title: 'Part 2: Độc Thoại Cue Card',
            sub: '1 phút Chuẩn bị + 2 phút Nói độc thoại liên tục',
            activeStyle:
              'from-purple-600/35 via-pink-600/25 to-[#161C26] border-purple-500/80 text-purple-200 ring-2 ring-purple-500/40 shadow-xl shadow-purple-950/50',
            badgeBg: 'bg-purple-500/25 text-purple-300 border border-purple-500/40',
          },
          {
            part: 3 as const,
            title: 'Part 3: Thảo Luận Chuyên Sâu',
            sub: 'Phân tích đa chiều • Lập luận nâng cao Band 7.5+',
            activeStyle:
              'from-cyan-600/35 via-blue-600/25 to-[#161C26] border-cyan-500/80 text-cyan-200 ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-950/50',
            badgeBg: 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40',
          },
        ].map((item) => (
          <button
            key={item.part}
            onClick={() => {
              sounds.playClick();
              setSelectedPart(item.part);
              setCurrentQuestionIndex(0);
              setEvalResult(null);
              setTranscript('');
              setIsPart2PrepPhase(false);
            }}
            className={`p-3.5 sm:p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
              selectedPart === item.part
                ? `bg-gradient-to-br ${item.activeStyle}`
                : 'bg-[#12161C]/90 border-[#242A36] hover:border-[#3E475A] hover:bg-[#161B23] text-[#8E97A4] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-lg shadow-sm ${item.badgeBg}`}>
                Part {item.part}
              </span>
              <ChevronRight
                className={`w-4 h-4 transition-all duration-200 ${
                  selectedPart === item.part ? 'text-white translate-x-1 scale-110' : 'text-slate-600 group-hover:text-slate-400'
                }`}
              />
            </div>
            <div className="text-xs sm:text-base font-black text-white mt-2 line-clamp-1">
              {item.title}
            </div>
            <div className="text-[11px] sm:text-xs text-[#8E97A4] hidden sm:block mt-1">
              {item.sub}
            </div>
          </button>
        ))}
      </div>

      {/* Main Examination Workspace: Balanced 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT STAGE: Examiner Stage & Question Intelligence (5.5 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#12161C]/95 rounded-3xl border border-[#242A36] p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5 backdrop-blur-xl">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Examiner Profile & Interaction Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-300 ${
                      isExaminerSpeaking
                        ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 scale-110 shadow-purple-500/60 ring-4 ring-purple-500/40 animate-pulse'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-700 shadow-purple-950/60'
                    }`}
                  >
                    <Headphones className="w-6 h-6" />
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#12161C] ${
                      isExaminerSpeaking ? 'bg-purple-400 animate-ping' : 'bg-emerald-400 shadow-sm'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>Cambridge AI Examiner</span>
                  </h3>
                  <div className="text-xs text-purple-300 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="line-clamp-1">{currentQuestion.topic}</span>
                  </div>
                </div>
              </div>

              {/* Speak Question Button */}
              <button
                type="button"
                onClick={() => handleSpeakQuestion(isHandsFreeMode)}
                disabled={isExaminerSpeaking}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black shadow-md ${
                  isExaminerSpeaking
                    ? 'bg-purple-600 text-white animate-pulse shadow-purple-600/50 scale-105'
                    : 'bg-purple-500/20 hover:bg-purple-500/35 text-purple-200 border border-purple-500/40 hover:scale-105 active:scale-95'
                }`}
                title="Giám khảo phát âm câu hỏi bằng giọng chuẩn bản xứ"
              >
                <Volume2 className={`w-4 h-4 ${isExaminerSpeaking ? 'animate-bounce' : ''}`} />
                <span>{isExaminerSpeaking ? 'Đang Đọc...' : 'Giám Khảo Đọc'}</span>
              </button>
            </div>

            {/* Hands-Free Live Notification Banner */}
            {isHandsFreeMode && (
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200 font-semibold animate-fadeIn shadow-sm">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                <span className="line-clamp-1">
                  {isExaminerSpeaking
                    ? 'Giám khảo đang đọc đề... Chuẩn bị nói!'
                    : isRecording
                    ? 'Mic đang mở tự động • Im lặng 2s để nộp bài'
                    : 'Rảnh tay: Nhấn "Giám Khảo Đọc" để bắt đầu'}
                </span>
              </div>
            )}

            {/* Question Text Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#161C26] to-[#0E1218] border border-[#2B3444] shadow-inner space-y-3">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#8E97A4]">
                <span>
                  Câu hỏi {currentQuestionIndex + 1} / {filteredQuestions.length}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-mono">Part {currentQuestion.part}</span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white leading-relaxed">
                "{currentQuestion.questionText}"
              </h2>

              {/* Part 2 Cue Card Sub-prompts */}
              {currentQuestion.part === 2 && currentQuestion.subPrompts && (
                <div className="mt-3 pt-3 border-t border-[#262E3D] space-y-2">
                  <span className="text-xs font-black text-amber-300 block uppercase tracking-wider">
                    You should say:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-200 pl-1">
                    {currentQuestion.subPrompts.map((prompt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Stage Tabs (Vocab / Ideas / New Topic) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0E1218] border border-[#222834]">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveStageTab('vocab');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeStageTab === 'vocab'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                      : 'text-[#8E97A4] hover:text-white'
                  }`}
                >
                  🎯 Từ Vựng ({pinnedChallengeWords.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveStageTab('ideas');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeStageTab === 'ideas'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                      : 'text-[#8E97A4] hover:text-white'
                  }`}
                >
                  💡 Ý Tưởng 5D
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveStageTab('new-topic');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeStageTab === 'new-topic'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                      : 'text-[#8E97A4] hover:text-white'
                  }`}
                >
                  ⚙️ Đổi / Tạo Đề AI
                </button>
              </div>

              {/* Tab 1: Mandatory Target Vocabulary Challenge */}
              {activeStageTab === 'vocab' && (
                <div className="animate-fadeIn">
                  <MandatoryVocabChallenge
                    pinnedWords={pinnedChallengeWords}
                    liveTranscript={transcript}
                    isRecording={isRecording}
                    onRefreshWords={() => setChallengeWordsSeed((prev) => prev + 1)}
                    allWords={words}
                  />
                </div>
              )}

              {/* Tab 2: Brainstorming Ideas */}
              {activeStageTab === 'ideas' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#161C26] border border-indigo-500/20 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Ý tưởng phản xạ nhanh (Brainstorming):</span>
                  </div>
                  {currentQuestion.suggestedIdeas && currentQuestion.suggestedIdeas.length > 0 ? (
                    <ul className="space-y-2 text-xs text-slate-300 pl-1">
                      {currentQuestion.suggestedIdeas.map((idea, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-indigo-400 font-bold shrink-0">✓</span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Hãy mở rộng câu theo công thức A.R.E.A: Answer ➔ Reason ➔ Example ➔ Alternative.
                    </p>
                  )}
                </div>
              )}

              {/* Tab 3: Question Switcher & AI Generator */}
              {activeStageTab === 'new-topic' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#161C26] border border-[#2B3444] space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-[#8E97A4]">
                    <span>Ngân hàng câu hỏi: {filteredQuestions.length} câu</span>
                    <button
                      onClick={handleNextQuestion}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Câu tiếp theo</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Nhập chủ đề tùy ý (VD: Artificial Intelligence, Travel...)"
                      className="w-full bg-[#0E1218] text-white px-3.5 py-2.5 rounded-xl border border-[#2B3444] text-xs outline-none focus:border-purple-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAiQuestion}
                      disabled={isGeneratingAiQuestion}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-950/40 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGeneratingAiQuestion ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>{isGeneratingAiQuestion ? 'AI Đang Tạo Câu Hỏi Mới...' : 'Tạo Câu Hỏi Mới Bằng AI 🪄'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT STAGE: Recording Studio & Diagnostic Report (7 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* Part 2 Preparation Phase Card (if active) */}
          {selectedPart === 2 && isPart2PrepPhase && (
            <div className="bg-gradient-to-br from-[#1C182A] via-[#141822] to-[#0E1218] rounded-3xl border border-purple-500/40 p-5 sm:p-6 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-purple-400 animate-spin" />
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Thời Gian Chuẩn Bị Part 2</h4>
                    <p className="text-xs text-[#8E97A4]">Ghi nhanh từ khóa & dàn ý trước khi nói</p>
                  </div>
                </div>

                <div className="text-2xl font-black text-purple-400 font-mono px-3.5 py-1 rounded-2xl bg-purple-500/15 border border-purple-500/30">
                  00:{prepTimeLeft < 10 ? `0${prepTimeLeft}` : prepTimeLeft}
                </div>
              </div>

              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Ghi chú nhanh các ý chính: 1. Introduction -> 2. Problem -> 3. Solution -> 4. Lesson..."
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-[#0A0D12] border border-[#242A36] text-white text-xs focus:border-purple-500 font-mono leading-relaxed outline-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#8E97A4]">
                  Hết 60s, máy thu âm sẽ tự động bật để bạn nói liên tục 2 phút.
                </span>
                <button
                  type="button"
                  onClick={handleSkipPrepAndSpeak}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Nói Ngay</span>
                </button>
              </div>
            </div>
          )}

          {/* Recording Studio Box */}
          <div className="bg-[#12161C]/95 rounded-3xl border border-[#242A36] p-5 sm:p-7 shadow-2xl space-y-5 backdrop-blur-xl">
            {/* Header: Status, Part 2 Prep Button, Duration */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-indigo-400" />
                  Phòng Thu Âm Câu Trả Lời
                </span>
                {isRecording && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-black animate-pulse shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    ĐANG THU ÂM
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {/* Part 2 Start Prep Button */}
                {selectedPart === 2 && !isRecording && !isPart2PrepPhase && (
                  <button
                    type="button"
                    onClick={handleStartPart2Preparation}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>1 Phút Chuẩn Bị</span>
                  </button>
                )}

                {/* Duration Counter */}
                <div className="flex items-center gap-2 text-xs font-mono font-black text-white bg-[#1A202C] px-3.5 py-1.5 rounded-xl border border-[#2D3648] shadow-inner">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm">
                    {Math.floor(recordingDuration / 60)}:
                    {recordingDuration % 60 < 10 ? `0${recordingDuration % 60}` : recordingDuration % 60}
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Wave Visualizer Animation */}
            <div className="h-14 rounded-2xl bg-[#0A0D12] border border-[#222834] flex items-center justify-center gap-1.5 px-4 overflow-hidden shadow-inner">
              {waveHeights.map((h, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isRecording
                      ? 'bg-gradient-to-t from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.6)]'
                      : 'bg-[#222834]'
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Live WPM Speedometer & Silence Tracker */}
            <WpmSpeechRateMeter
              currentWpm={currentWpm}
              wordCount={wordCount}
              elapsedSeconds={recordingDuration}
              isRecording={isRecording}
              silenceSeconds={silenceSeconds}
            />

            {/* VAD Hands-Free Auto-Submission Alert */}
            {isRecording && isHandsFreeMode && autoSubmitCountdown !== null && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/60 flex items-center justify-between animate-fadeIn shadow-xl">
                <div className="flex items-center gap-2.5 text-xs text-emerald-200 font-black">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span>Im lặng phát hiện: Đang tự động nộp bài và chấm điểm...</span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-500 text-black font-mono font-black text-xs shadow-md">
                  {autoSubmitCountdown}s
                </span>
              </div>
            )}

            {/* Live Transcript Display / Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8E97A4]">
                <span className="font-black flex items-center gap-1.5 text-slate-300">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Nhận diện giọng nói (Live Speech-to-Text):
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#1A202C] text-indigo-300 font-bold">{wordCount} từ</span>
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  isRecording
                    ? 'Đang lắng nghe giọng nói của bạn... Hãy nói tự nhiên và tự tin!'
                    : 'Bấm nút "Bật Mic & Bắt Đầu Nói" bên dưới, hoặc bạn cũng có thể gõ câu trả lời trực tiếp tại đây...'
                }
                rows={4}
                className="w-full p-4 rounded-2xl bg-[#0A0D12] border border-[#222834] text-white text-xs sm:text-sm focus:border-indigo-500 leading-relaxed font-sans outline-none transition-colors"
              />
            </div>

            {/* Audio Player if recorded */}
            {audioUrl && !isRecording && (
              <div className="p-3.5 rounded-2xl bg-[#161C26] border border-[#2B3444] flex items-center justify-between gap-3 shadow-sm">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Nghe lại bản thu âm của bạn:</span>
                </span>
                <audio src={audioUrl} controls className="h-8 max-w-[240px]" />
              </div>
            )}

            {/* Error Banner */}
            {evalError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{evalError}</span>
              </div>
            )}

            {/* Ergonomic Recording & Evaluation Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl shadow-purple-950/60 transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>Bật Mic & Bắt Đầu Nói</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-950/60 transition-all cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <MicOff className="w-5 h-5" />
                  <span>Dừng Thu Âm & Hoàn Thành</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleEvaluateAnswer}
                disabled={isRecording || isEvaluating || !transcript.trim()}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2.5"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI Đang Chấm Điểm...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Chấm Điểm Với AI 🌟</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🌟 AI 4-CRITERION CAMBRIDGE DIAGNOSTIC REPORT */}
          {/* ========================================================================= */}
          {evalResult && (
            <div className="bg-[#12161C] rounded-3xl border border-indigo-500/40 p-5 sm:p-7 shadow-2xl space-y-5 animate-fadeIn relative overflow-hidden backdrop-blur-md">
              {/* Overall Band Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#242A36]">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Báo Cáo Đánh Giá IELTS Speaking 4 Tiêu Chí
                    </h3>
                  </div>
                  <p className="text-xs text-[#8E97A4] mt-0.5">
                    Hội đồng chấm thi Cambridge Senior AI Examiner
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                      Ước Tính Overall
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                      Band {evalResult.overallBand.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-amber-500/20">
                    {evalResult.overallBand.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* 4 Criterion Score Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    code: 'FC',
                    name: 'Fluency & Coherence',
                    score: evalResult.criteriaScores.fluencyCoherence.score,
                    color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
                  },
                  {
                    code: 'LR',
                    name: 'Lexical Resource',
                    score: evalResult.criteriaScores.lexicalResource.score,
                    color: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
                  },
                  {
                    code: 'GRA',
                    name: 'Grammar Range',
                    score: evalResult.criteriaScores.grammaticalRange.score,
                    color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
                  },
                  {
                    code: 'P',
                    name: 'Pronunciation',
                    score: evalResult.criteriaScores.pronunciation.score,
                    color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
                  },
                ].map((crit) => (
                  <div key={crit.code} className={`p-3 rounded-2xl border text-center ${crit.color}`}>
                    <div className="text-[10px] font-black uppercase">{crit.code}</div>
                    <div className="text-lg font-black text-white font-mono my-0.5">
                      {crit.score.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-[#8E97A4] line-clamp-1">{crit.name}</div>
                  </div>
                ))}
              </div>

              {/* Report Review Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0A0D12] border border-[#222834]">
                <button
                  type="button"
                  onClick={() => setActiveReportTab('feedback')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'feedback'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#8E97A4] hover:text-white'
                  }`}
                >
                  ✍️ Sửa Lỗi & Nâng Từ Vựng
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReportTab('speed')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'speed'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#8E97A4] hover:text-white'
                  }`}
                >
                  ⏱️ Tốc Độ & Khoảng Lặng
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReportTab('model')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'model'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#8E97A4] hover:text-white'
                  }`}
                >
                  🌟 Bài Mẫu Band 8.5+
                </button>
              </div>

              {/* Tab 1: Detailed Criteria Feedback & Corrections */}
              {activeReportTab === 'feedback' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Mandatory Vocab Report */}
                  <MandatoryVocabReport
                    evaluations={evalResult.mandatoryVocabEvaluations}
                    targetWordsUsed={evalResult.targetWordsUsed}
                    targetWordsMissed={evalResult.targetWordsMissed}
                  />

                  {/* Grammar Corrections */}
                  {evalResult.criteriaScores.grammaticalRange.grammarErrors &&
                    evalResult.criteriaScores.grammaticalRange.grammarErrors.length > 0 && (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                          Các lỗi ngữ pháp cần sửa:
                        </span>
                        <div className="space-y-2">
                          {evalResult.criteriaScores.grammaticalRange.grammarErrors.map((err, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-[#161C26] border border-[#242A36] text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="line-through text-rose-400 font-medium">{err.original}</span>
                                <span className="text-slate-400">➔</span>
                                <span className="text-emerald-400 font-bold">{err.corrected}</span>
                              </div>
                              <p className="text-[#8E97A4]">{err.explanationVi}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Actionable Tips */}
                  {evalResult.actionableImprovementTips?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#161C26] border border-[#2B3444] space-y-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        Lời khuyên bứt phá lên Band 8.0+:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {evalResult.actionableImprovementTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Speech Rate & Silence Advisor */}
              {activeReportTab === 'speed' && (
                <div className="animate-fadeIn">
                  <SilenceAndFillerAdvisor
                    wordsPerMinute={evalResult.criteriaScores.fluencyCoherence.wordsPerMinute}
                    speechRateVerdictVi={evalResult.criteriaScores.fluencyCoherence.speechRateVerdictVi}
                    deadSilencePausesCount={evalResult.criteriaScores.fluencyCoherence.deadSilencePausesCount}
                    deadSilencePauses={evalResult.criteriaScores.fluencyCoherence.deadSilencePauses}
                    academicFillers={evalResult.criteriaScores.fluencyCoherence.academicFillerRecommendations}
                  />
                </div>
              )}

              {/* Tab 3: Upgraded Model Answer Band 8.5+ */}
              {activeReportTab === 'model' && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#161C26] to-[#12161C] border border-indigo-500/40 space-y-3.5 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="font-extrabold text-sm text-white">
                        Bài Nói Mẫu Band 8.5+ (Model Answer)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpeakModelAnswer(evalResult.band8ModelAnswer.answer)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingModelAudio ? 'Đang đọc...' : 'Nghe Audio Mẫu'}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0A0D12] border border-[#222834] text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                    "{evalResult.band8ModelAnswer.answer}"
                  </div>

                  <div className="text-xs text-[#8E97A4] bg-[#12161C] p-3 rounded-xl border border-[#242A36] leading-relaxed">
                    <strong className="text-indigo-300 block mb-1">Dịch nghĩa tiếng Việt:</strong>
                    {evalResult.band8ModelAnswer.vietnameseTranslation}
                  </div>

                  {evalResult.band8ModelAnswer.keyCollocations?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                        Cụm từ đắt giá trong bài mẫu:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {evalResult.band8ModelAnswer.keyCollocations.map((colloc, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold"
                          >
                            💎 {colloc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Next Question CTA */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-[#8E97A4]">
                  {isHandsFreeMode
                    ? 'Chế độ Rảnh Tay: Bấm câu tiếp theo để Giám Khảo tự động đọc.'
                    : 'Hãy ghi nhớ từ vựng hay trước khi sang câu mới.'}
                </span>

                <button
                  type="button"
                  onClick={() => handleNextQuestion(isHandsFreeMode)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Chuyển Sang Câu Kế Tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Companion Toolkits (Topic Vocab & Quick Assistant) */}
      {!isFocusMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <SpeakingTopicCompanion
            currentTopic={currentQuestion.topic}
            part={currentQuestion.part}
            activeSetWords={words}
            onOpenRadar={onOpenRadar}
          />
          <SpeakingQuickAssistant
            recentAttempts={savedAttempts}
            onSelectAttempt={(att) => {
              if (att.result) {
                setEvalResult(att.result);
                setTranscript(att.transcript);
              }
            }}
            onOpenPortfolio={onOpenPortfolio}
            onOpenEmergencyStalling={onOpenEmergencyStalling}
            onOpenAreaExpander={onOpenAreaExpander}
            onOpenSpeechUpgrade={() => {
              if (onNavigateMode) onNavigateMode('speech-upgrade');
            }}
          />
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#12161C] w-full max-w-3xl rounded-3xl border border-[#242A36] shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#242A36]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <span className="font-black text-base text-white">Lịch Sử Thi Thử Speaking</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1.5 rounded-xl bg-[#1A202C] text-[#8E97A4] hover:text-white text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {savedAttempts.length === 0 ? (
              <div className="py-12 text-center text-[#8E97A4] space-y-2">
                <Headphones className="w-10 h-10 mx-auto text-slate-600" />
                <p>Bạn chưa có bài thi thử Speaking nào được lưu.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="p-4 rounded-2xl bg-[#161C26] border border-[#242A36] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Part {attempt.part}
                        </span>
                        <span className="text-xs text-[#8E97A4]">{attempt.date}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Band {attempt.overallBand.toFixed(1)}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-white">"{attempt.question}"</div>
                    <div className="text-xs text-slate-300 font-sans italic bg-[#0A0D12] p-3 rounded-xl border border-[#222834]">
                      "{attempt.transcript}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
