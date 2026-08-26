import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  Play,
  Pause,
  Zap,
  Flame,
  Award,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ListChecks,
  Compass,
  TrendingUp,
  Target,
  RefreshCw,
  Plus,
} from 'lucide-react';
import {
  VocabItem,
  WordSet,
  UserProgress,
  QuickDrillQuestion,
  QuickSpeakingDrillEvaluationResult,
} from '../../types';
import { speakWord, speakWordAsync, ACCENT_OPTIONS, EnglishAccent } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration, fireStreakBonus } from '../../utils/confetti';
import {
  evaluateQuickSpeakingDrill,
  generateQuickDrillQuestions,
} from '../../services/geminiService';
import { WpmSpeechRateMeter, SilenceAndFillerAdvisor } from './WpmSpeechRateMeter';
import {
  MandatoryVocabChallenge,
  MandatoryVocabReport,
  PinnedWordItem,
} from './MandatoryVocabChallenge';
import { Radio } from 'lucide-react';

interface QuickResponseDrillModeProps {
  words: VocabItem[];
  allWords?: VocabItem[];
  activeSet?: WordSet;
  progress?: UserProgress;
  onBack: () => void;
  onRecordStudySession?: (wordsStudied: number, correctCount: number) => void;
}

type DrillStage = 'idle' | 'thinking' | 'speaking' | 'evaluating' | 'result';

export const QuickResponseDrillMode: React.FC<QuickResponseDrillModeProps> = ({
  words,
  allWords,
  activeSet,
  progress,
  onBack,
  onRecordStudySession,
}) => {
  // Built-in High-Frequency Rapid-Fire Part 1 Questions
  const defaultQuestions: QuickDrillQuestion[] = useMemo(() => [
    {
      id: 'q-1',
      question: 'Do you prefer studying alone or with friends?',
      topic: 'Học Tập & Làm Việc',
      starterIdeaVi: 'Khẳng định thích học một mình hơn vì dễ tập trung cao độ, chỉ học nhóm khi cần brainstorm ý tưởng.',
      suggestedVocab: ['foster deep concentration', 'uninterrupted focus', 'brainstorming session'],
      sampleBand8Response:
        'To be completely honest, I lean towards studying independently because it fosters deeper concentration without distractions. However, collaborative study sessions are certainly invaluable when brainstorming complex projects.',
      sampleBand8Translation:
        'Thành thật mà nói, tôi nghiêng về việc tự học một mình vì nó giúp tập trung sâu hơn mà không bị phân tâm. Dù vậy, các buổi học nhóm vẫn rất hữu ích khi cần thảo luận các dự án phức tạp.',
    },
    {
      id: 'q-2',
      question: 'What do you usually do in your spare time?',
      topic: 'Sở Thích & Đời Sống',
      starterIdeaVi: 'Nêu hoạt động ưa thích giúp xả stress (đọc sách, tập gym, nghe podcast).',
      suggestedVocab: ['unwind after a hectic day', 'recharge my batteries', 'avid reader'],
      sampleBand8Response:
        'Whenever I have some downtime, I usually immerse myself in non-fiction books or hit the gym to blow off some steam. It is truly my go-to remedy to recharge my mental batteries after a hectic work week.',
      sampleBand8Translation:
        'Bất cứ khi nào có thời gian rảnh, tôi thường đắm mình vào những cuốn sách thực tế hoặc đi tập gym để xả stress. Đó thực sự là liệu pháp tuyệt vời giúp tôi nạp lại năng lượng sau một tuần bận rộn.',
    },
    {
      id: 'q-3',
      question: 'Do you think public transport in your city is efficient?',
      topic: 'Đô Thị & Giao Thông',
      starterIdeaVi: 'Đánh giá mức độ tiện lợi của xe bus/tàu điện và đề xuất cần cải thiện vào giờ cao điểm.',
      suggestedVocab: ['moderately reliable', 'congestion during rush hours', 'infrastructure upgrade'],
      sampleBand8Response:
        'I would say it is moderately efficient, with extensive bus routes covering major districts. Nevertheless, gridlock during peak hours remains a persistent issue that calls for significant infrastructure upgrades.',
      sampleBand8Translation:
        'Tôi cho rằng nó tương đối hiệu quả với các tuyến xe buýt bao phủ rộng khắp các quận chính. Tuy nhiên, tình trạng tắc nghẽn vào giờ cao điểm vẫn là một bài toán dai dẳng đòi hỏi phải nâng cấp hạ tầng.',
    },
    {
      id: 'q-4',
      question: 'How often do you use social media platforms?',
      topic: 'Công Nghệ & Mạng Xã Hội',
      starterIdeaVi: 'Dùng hàng ngày để cập nhật tin tức và giữ liên lạc, nhưng cố gắng hạn chế screen time.',
      suggestedVocab: ['stay abreast of current trends', 'digital footprint', 'mindful of screen time'],
      sampleBand8Response:
        'I access social platforms on a daily basis primarily to stay abreast of current news and keep in touch with peers. That being said, I am increasingly mindful of my screen time to avoid unnecessary digital fatigue.',
      sampleBand8Translation:
        'Tôi truy cập mạng xã hội hàng ngày chủ yếu để cập nhật tin tức thời sự và giữ liên lạc với bạn bè. Dù vậy, tôi ngày càng chú ý đến thời gian dùng màn hình để tránh mệt mỏi kỹ thuật số.',
    },
    {
      id: 'q-5',
      question: 'Do you prefer living in a house or an apartment?',
      topic: 'Nhà Cửa & Không Gian Sống',
      starterIdeaVi: 'Thích chung cư vì tiện nghi an ninh và tầm nhìn cao, hoặc thích nhà riêng vì sự riêng tư rộng rãi.',
      suggestedVocab: ['modern amenities', 'panoramic skyline view', 'sense of privacy'],
      sampleBand8Response:
        'I definitely gravitate towards high-rise apartments owing to the modern amenities and the breathtaking skyline views they offer, alongside top-tier 24/7 security.',
      sampleBand8Translation:
        'Tôi chắc chắn nghiêng về các căn hộ chung cư cao tầng nhờ vào tiện nghi hiện đại và tầm nhìn toàn cảnh thành phố tuyệt đẹp, cùng với an ninh 24/7 hàng đầu.',
    },
    {
      id: 'q-6',
      question: 'Did you enjoy your childhood?',
      topic: 'Ký Ức & Quá Khứ',
      starterIdeaVi: 'Nhấn mạnh một tuổi thơ êm đềm, ngập tràn các trò chơi ngoài trời trước kỷ nguyên smartphone.',
      suggestedVocab: ['cherished memories', 'carefree upbringing', 'outdoor activities'],
      sampleBand8Response:
        'Without a doubt, I had a blissful childhood filled with outdoor adventures and close-knit neighborhood bonds, well before the advent of ubiquitous smartphones and screens.',
      sampleBand8Translation:
        'Không còn nghi ngờ gì nữa, tôi đã có một tuổi thơ hạnh phúc tràn ngập những chuyến phiêu lưu ngoài trời và sự gắn kết hàng xóm khăng khít, trước cả khi điện thoại thông minh trở nên phổ biến.',
    },
  ], []);

  const [questionList, setQuestionList] = useState<QuickDrillQuestion[]>(defaultQuestions);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const currentQuestion = questionList[currentQIndex] || questionList[0];

  const [drillVocabSeed, setDrillVocabSeed] = useState<number>(0);

  // 🎯 Mandatory Vocab Challenge for Rapid Fire Speaking Drill
  const pinnedDrillWords: PinnedWordItem[] = useMemo(() => {
    const qVocab: PinnedWordItem[] = (currentQuestion.suggestedVocab || []).map((term) => {
      const found = words.find((w) => w.term.toLowerCase() === term.toLowerCase());
      return {
        term,
        ipa: found?.ipa,
        meaningVi: found?.meaningVi || found?.definitionVi || 'Từ vựng ghi điểm phản xạ',
        ieltsBand: found?.ieltsBand || '8.0+',
        collocation:
          found?.collocations?.[0]?.collocation ||
          found?.exampleSentence?.slice(0, 45) ||
          undefined,
      };
    });

    const allWordsPool = allWords && allWords.length > 0 ? allWords : words;
    const setVocab: PinnedWordItem[] = allWordsPool
      .filter((w) => !qVocab.some((qv) => qv.term.toLowerCase() === w.term.toLowerCase()))
      .map((w) => ({
        term: w.term,
        ipa: w.ipa,
        meaningVi: w.meaningVi || w.definitionVi || 'Từ vựng học thuật',
        ieltsBand: w.ieltsBand || '7.5+',
        collocation:
          w.collocations?.[0]?.collocation ||
          w.exampleSentence?.slice(0, 45) ||
          undefined,
      }));

    const combined = [...qVocab, ...setVocab];
    if (combined.length === 0) {
      return [
        { term: 'exponential', meaningVi: 'theo cấp số nhân', ieltsBand: '8.0', collocation: 'exponential growth' },
        { term: 'exacerbate', meaningVi: 'làm trầm trọng thêm', ieltsBand: '8.5', collocation: 'exacerbate the issue' },
        { term: 'detrimental', meaningVi: 'có hại, bất lợi', ieltsBand: '7.5', collocation: 'detrimental impact' },
      ];
    }
    const offset = drillVocabSeed % combined.length;
    const rotated = [...combined.slice(offset), ...combined.slice(0, offset)];
    return rotated.slice(0, 3);
  }, [currentQuestion, words, allWords, drillVocabSeed]);

  // Stage & Timer States
  const [stage, setStage] = useState<DrillStage>('idle');
  const [thinkTimeLimit, setThinkTimeLimit] = useState<number>(5); // 5 seconds
  const [speakTimeLimit, setSpeakTimeLimit] = useState<number>(15); // 15 seconds
  const [timeLeft, setTimeLeft] = useState<number>(5);

  // Settings & Accents
  const [selectedAccent, setSelectedAccent] = useState<'UK' | 'US' | 'AU'>('UK');
  const [streakCount, setStreakCount] = useState<number>(0);
  const [totalDrillsCompleted, setTotalDrillsCompleted] = useState<number>(0);

  // Speech Recognition & Audio
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [silenceSeconds, setSilenceSeconds] = useState<number>(0);
  const [evaluationResult, setEvaluationResult] = useState<QuickSpeakingDrillEvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Filter
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');

  // 🎙️ Hands-Free VAD (Voice Activity Detection) Mode
  const [isHandsFreeMode, setIsHandsFreeMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ielts_drill_hands_free') === 'true';
    } catch {
      return false;
    }
  });
  const [isQuestionSpeaking, setIsQuestionSpeaking] = useState<boolean>(false);
  const [autoVadCountdown, setAutoVadCountdown] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speakingStartTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const liveTranscriptRef = useRef<string>('');
  const stageRef = useRef<DrillStage>('idle');
  const isHandsFreeRef = useRef<boolean>(isHandsFreeMode);
  const hasSpokenEnoughRef = useRef<boolean>(false);

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    isHandsFreeRef.current = isHandsFreeMode;
    try {
      localStorage.setItem('ielts_drill_hands_free', String(isHandsFreeMode));
    } catch {}
  }, [isHandsFreeMode]);

  const accentCodeMap: Record<'US' | 'UK' | 'AU', EnglishAccent> = {
    UK: 'en-GB',
    US: 'en-US',
    AU: 'en-AU',
  };

  const topics = useMemo(() => {
    return Array.from(new Set(questionList.map((q) => q.topic)));
  }, [questionList]);

  const filteredQuestions = useMemo(() => {
    if (selectedTopicFilter === 'all') return questionList;
    return questionList.filter((q) => q.topic === selectedTopicFilter);
  }, [questionList, selectedTopicFilter]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = accentCodeMap[selectedAccent];

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(fullTranscript.trim());
        lastSpeechTimeRef.current = Date.now();
        setSilenceSeconds(0);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error in Quick Drill:', err);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [selectedAccent]);

  // Clean timer & streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Play Examiner Audio for current question
  const handlePlayQuestionAudio = async (qText: string) => {
    sounds.playClick();
    setIsQuestionSpeaking(true);
    try {
      await speakWordAsync(qText, 1.0, accentCodeMap[selectedAccent]);
    } finally {
      setIsQuestionSpeaking(false);
    }
  };

  // Start Quick Drill Cycle: Question Speech -> 5s Think -> 15s Speak -> Submit
  const handleStartDrill = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setEvaluationResult(null);
    setEvalError(null);
    setLiveTranscript('');
    setRecordedAudioUrl(null);
    setAudioBase64(null);
    setAutoVadCountdown(null);
    hasSpokenEnoughRef.current = false;

    // Speak question first with async awaiting
    if (isHandsFreeRef.current) {
      await handlePlayQuestionAudio(currentQuestion.question);
    } else {
      handlePlayQuestionAudio(currentQuestion.question);
    }

    // Enter Thinking Stage
    setStage('thinking');
    setTimeLeft(thinkTimeLimit);

    let currentSeconds = thinkTimeLimit;
    timerIntervalRef.current = setInterval(() => {
      currentSeconds -= 1;
      setTimeLeft(currentSeconds);

      if (currentSeconds <= 3 && currentSeconds > 0) {
        sounds.playClick();
      }

      if (currentSeconds <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        startSpeakingStage();
      }
    }, 1000);
  };

  // Transition from Thinking -> Speaking (15s)
  const startSpeakingStage = async () => {
    sounds.playStreak();
    setStage('speaking');
    setTimeLeft(speakTimeLimit);
    setAutoVadCountdown(null);
    hasSpokenEnoughRef.current = false;
    speakingStartTimeRef.current = Date.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        stream.getTracks().forEach((track) => track.stop());
        if (mediaStreamRef.current === stream) {
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.start();
      lastSpeechTimeRef.current = Date.now();
      setSilenceSeconds(0);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition already active');
        }
      }

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        const elapsedSec = (Date.now() - speakingStartTimeRef.current) / 1000;
        const remainingSec = Math.max(0, Math.ceil(speakTimeLimit - elapsedSec));
        setTimeLeft(remainingSec);

        const silenceSec = (Date.now() - lastSpeechTimeRef.current) / 1000;
        setSilenceSeconds(silenceSec);

        const wordsCount = liveTranscriptRef.current.trim().split(/\s+/).filter(Boolean).length;
        if (wordsCount >= 3) {
          hasSpokenEnoughRef.current = true;
        }

        // VAD Trigger for Quick Drill: If hands free is on, user spoke >= 3 words, elapsed >= 3s, and silent for >= 2s
        if (isHandsFreeRef.current && hasSpokenEnoughRef.current && elapsedSec >= 3) {
          if (silenceSec >= 2.0) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setAutoVadCountdown(null);
            handleFinishSpeaking();
            return;
          } else if (silenceSec >= 1.0) {
            setAutoVadCountdown(Math.max(0, Math.ceil((2.0 - silenceSec) * 10) / 10));
          } else {
            setAutoVadCountdown(null);
          }
        } else {
          setAutoVadCountdown(null);
        }

        if (remainingSec <= 3 && remainingSec > 0 && Math.floor(elapsedSec) !== Math.floor(elapsedSec - 0.25)) {
          sounds.playClick();
        }

        if (remainingSec <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleFinishSpeaking();
        }
      }, 250);
    } catch (err) {
      console.warn('Mic permission error:', err);
      // Still count down accurately
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        const elapsedSec = (Date.now() - speakingStartTimeRef.current) / 1000;
        const remainingSec = Math.max(0, Math.ceil(speakTimeLimit - elapsedSec));
        setTimeLeft(remainingSec);
        if (remainingSec <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleFinishSpeaking();
        }
      }, 250);
    }
  };

  // Finish Speaking & Send to AI
  const handleFinishSpeaking = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setStage('evaluating');
    setEvalError(null);

    setTimeout(async () => {
      try {
        const targetVocab = pinnedDrillWords.map((w) => w.term);
        const result = await evaluateQuickSpeakingDrill({
          question: currentQuestion.question,
          transcript: liveTranscript.trim() || undefined,
          audioBase64: audioBase64 || undefined,
          targetVocab,
          durationSeconds: speakTimeLimit,
        });

        setEvaluationResult(result);
        setStage('result');
        setTotalDrillsCompleted((prev) => prev + 1);

        if (result.fluencyScore >= 75) {
          sounds.playComplete();
          fireStreakBonus();
          setStreakCount((prev) => prev + 1);
        } else {
          sounds.playStreak();
        }

        if (onRecordStudySession) {
          onRecordStudySession(1, result.fluencyScore >= 70 ? 1 : 0);
        }
      } catch (err: any) {
        console.error('Quick drill eval error:', err);
        setEvalError(err.message || 'Lỗi khi chấm điểm phản xạ');
        setStage('idle');
      }
    }, 400);
  };

  // Select another question
  const handleSelectQuestion = (idx: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setCurrentQIndex(idx);
    setStage('idle');
    setEvaluationResult(null);
    setEvalError(null);
    setLiveTranscript('');
    setRecordedAudioUrl(null);
  };

  // AI Generator for More Rapid-Fire Part 1 Prompts
  const handleGenerateMoreQuestions = async () => {
    setIsGeneratingAi(true);
    sounds.playClick();
    try {
      const vocabKeywords = words.slice(0, 8).map((w) => w.term);
      const newQuestions = await generateQuickDrillQuestions({
        topic: currentQuestion.topic || 'IELTS Speaking Part 1',
        vocabTerms: vocabKeywords,
        count: 4,
      });

      if (newQuestions && newQuestions.length > 0) {
        setQuestionList((prev) => [...newQuestions, ...prev]);
        setCurrentQIndex(0);
        sounds.playComplete();
      }
    } catch (err) {
      console.error('Failed to generate quick questions:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="max-w-[1680px] mx-auto space-y-6 animate-fadeIn px-2 sm:px-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16191F] p-4 rounded-2xl border border-[#2D333B] shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8E97A4] hover:text-white transition-colors cursor-pointer bg-[#21262E] hover:bg-[#2A313C] px-3 py-1.5 rounded-xl border border-[#30363D]"
            title="Quay lại IELTS Speaking AI Studio"
          >
            <ArrowLeft className="w-4 h-4" /> Speaking Studio
          </button>
          <span className="text-[#30363D]">|</span>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-sm font-black text-white">
              Luyện Phản Xạ Nói Cấp Tốc 15 Giây • Part 1 Quick Response
            </span>
          </div>
        </div>

        {/* Global Controls & Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 🎙️ Hands-Free VAD Toggle Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsHandsFreeMode((prev) => !prev);
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isHandsFreeMode
                ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/40'
                : 'bg-[#21262E] hover:bg-[#282D33] text-slate-300 border-[#30363D]'
            }`}
            title="Chế độ Tự động Rảnh tay: Giám khảo đọc câu hỏi -> Mic tự mở sau 5s think -> Tự động nộp bài khi im lặng 2s"
          >
            <Radio className={`w-3.5 h-3.5 ${isHandsFreeMode ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Rảnh Tay (VAD)</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                isHandsFreeMode ? 'bg-emerald-500 text-black' : 'bg-[#30363D] text-slate-400'
              }`}
            >
              {isHandsFreeMode ? 'BẬT' : 'TẮT'}
            </span>
          </button>

          {/* Streak Combo Badge */}
          {streakCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-black animate-pulse">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>Combo {streakCount} Câu Mượt!</span>
            </div>
          )}

          {/* Accent Switcher */}
          <div className="flex items-center bg-[#21262E] p-1 rounded-xl border border-[#30363D]">
            {(['UK', 'US', 'AU'] as const).map((acc) => (
              <button
                key={acc}
                onClick={() => setSelectedAccent(acc)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedAccent === acc
                    ? 'bg-amber-500 text-black shadow-xs font-extrabold'
                    : 'text-[#8E97A4] hover:text-white'
                }`}
              >
                {acc === 'UK' ? '🇬🇧 UK' : acc === 'US' ? '🇺🇸 US' : '🇦🇺 AU'}
              </button>
            ))}
          </div>

          {/* Time Preset Switcher */}
          <div className="flex items-center bg-[#21262E] p-1 rounded-xl border border-[#30363D]">
            {[15, 20, 25].map((sec) => (
              <button
                key={sec}
                onClick={() => setSpeakTimeLimit(sec)}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  speakTimeLimit === sec
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-[#8E97A4] hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Column Panoramic Rapid-Fire Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN (4 COLS): QUESTION STREAM & STATS ================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Ngân Hàng Câu Hỏi Part 1 ({filteredQuestions.length})
                </h3>
              </div>
              <button
                onClick={handleGenerateMoreQuestions}
                disabled={isGeneratingAi}
                className="text-[11px] font-bold px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sparkles className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>Thêm câu mới</span>
              </button>
            </div>

            {/* Topic Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTopicFilter('all')}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                  selectedTopicFilter === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#21262E] text-[#8E97A4] border-transparent hover:text-white'
                }`}
              >
                Tất cả chủ đề
              </button>
              {topics.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTopicFilter(t)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer truncate max-w-[130px] ${
                    selectedTopicFilter === t
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-[#21262E] text-[#8E97A4] border-transparent hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Scrollable Question Items */}
            <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
              {filteredQuestions.map((q, idx) => {
                const isSelected = q.id === currentQuestion.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelectQuestion(idx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-[#1C2027] border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-[#1C2027]/60 border-[#2D333B] hover:border-amber-500/40 hover:bg-[#1C2027]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#21262E] text-amber-300">
                        {q.topic}
                      </span>
                      <span className="text-[10px] text-[#8E97A4] font-mono">#{idx + 1}</span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-relaxed">
                      "{q.question}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN (5 COLS): RAPID FIRE STAGE & TIMERS ================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Question Card with Interactive Timer */}
          <div className="bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Bắn Câu Hỏi Part 1 Bất Ngờ
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    handleSelectQuestion(
                      currentQIndex > 0 ? currentQIndex - 1 : questionList.length - 1
                    )
                  }
                  className="p-1.5 rounded-lg bg-[#21262E] hover:bg-[#282D33] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    handleSelectQuestion(
                      currentQIndex < questionList.length - 1 ? currentQIndex + 1 : 0
                    )
                  }
                  className="p-1.5 rounded-lg bg-[#21262E] hover:bg-[#282D33] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* The Question in Large High-Impact Typography */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C2027] to-[#16191F] border border-[#2D333B] shadow-inner space-y-3 text-center">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
                {currentQuestion.topic}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                "{currentQuestion.question}"
              </h2>

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePlayQuestionAudio(currentQuestion.question)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#21262E] hover:bg-[#282D33] text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nghe giọng giám khảo ({selectedAccent})</span>
                </button>
              </div>
            </div>

            {/* Visual Countdown Timer Ring */}
            {(stage === 'thinking' || stage === 'speaking') && (
              <div className="p-6 rounded-2xl bg-[#1C2027] border border-[#2D333B] flex flex-col items-center justify-center space-y-3 animate-fadeIn">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl transition-all ${
                      stage === 'thinking'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-amber-500/30'
                        : 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-rose-500/30 animate-pulse'
                    }`}
                  >
                    <span className="text-3xl font-black">{timeLeft}s</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {stage === 'thinking' ? 'Suy Nghĩ' : 'Đang Nói'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#8E97A4] font-medium text-center">
                  {stage === 'thinking'
                    ? '⏳ 5 giây định hình ý tưởng (Đừng dịch từng chữ, hãy phản xạ ý chính!)'
                    : '🎙️ Nói ngay vào trọng tâm trong 15 giây! (Không ngập ngừng)'}
                </p>
              </div>
            )}

            {/* Live WPM Speedometer & Silence Tracker during/after speaking */}
            {(stage === 'speaking' || stage === 'evaluating' || stage === 'result') && (
              <WpmSpeechRateMeter
                currentWpm={
                  speakTimeLimit - timeLeft > 1
                    ? Math.round(
                        (liveTranscript.trim().split(/\s+/).filter(Boolean).length /
                          (speakTimeLimit - timeLeft)) *
                          60
                      )
                    : 0
                }
                wordCount={liveTranscript.trim().split(/\s+/).filter(Boolean).length}
                elapsedSeconds={speakTimeLimit - timeLeft}
                isRecording={stage === 'speaking'}
                silenceSeconds={silenceSeconds}
              />
            )}

            {/* 🎙️ Hands-Free VAD Auto-Submit Notification in Drill Mode */}
            {stage === 'speaking' && isHandsFreeMode && autoVadCountdown !== null && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border border-emerald-500/50 flex items-center justify-between animate-fadeIn shadow-lg">
                <div className="flex items-center gap-2.5 text-xs text-emerald-200 font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Im lặng phát hiện: Đang tự nộp bài và chấm điểm...</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-black font-mono font-black text-xs">
                  {autoVadCountdown}s
                </span>
              </div>
            )}

            {/* Live Transcript Box during/after speaking */}
            <div className="p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] min-h-[90px] flex items-center justify-center text-center">
              {liveTranscript ? (
                <p className="text-sm text-white font-sans leading-relaxed">
                  "{liveTranscript}"
                </p>
              ) : (
                <p className="text-xs text-[#8E97A4] leading-relaxed">
                  {stage === 'speaking'
                    ? 'Đang nhận diện giọng nói thời gian thực...'
                    : 'Nhấn nút "Bắt Đầu Bắn Phản Xạ" để nhận câu hỏi và trả lời ngay trong 15s.'}
                </p>
              )}
            </div>

            {/* Action Trigger Buttons */}
            <div className="pt-2">
              {stage === 'idle' && (
                <button
                  type="button"
                  onClick={handleStartDrill}
                  className="w-full py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer font-black"
                >
                  <Zap className="w-5 h-5 fill-black" />
                  <span>Bắt Đầu Bắn Phản Xạ 15s (Start Drill)</span>
                </button>
              )}

              {stage === 'thinking' && (
                <button
                  type="button"
                  onClick={() => {
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                    startSpeakingStage();
                  }}
                  className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Nói Ngay Bây Giờ (Bỏ qua 5s chờ)</span>
                </button>
              )}

              {stage === 'speaking' && (
                <button
                  type="button"
                  onClick={handleFinishSpeaking}
                  className="w-full py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Nói Xong • Chấm Điểm AI Ngay</span>
                </button>
              )}

              {stage === 'evaluating' && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fadeIn">
                  <Sparkles className="w-4 h-4 animate-spin" /> AI đang phân tích độ trôi chảy & từ ngập ngừng...
                </div>
              )}

              {stage === 'result' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartDrill}
                    className="flex-1 py-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Thử lại câu này
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectQuestion(
                        currentQIndex < questionList.length - 1 ? currentQIndex + 1 : 0
                      );
                    }}
                    className="flex-1 py-3 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-black"
                  >
                    <span>Câu tiếp theo</span> <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (3 COLS): A-R-E-A BLUEPRINT & REVENUE ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quick Idea Blueprint for Part 1 */}
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
              <Compass className="w-4 h-4 text-amber-400" /> Công Thức Phản Xạ 15s (A-R-E)
            </h4>

            <div className="space-y-2.5 text-xs text-[#9BA1A6] leading-relaxed">
              <div className="p-3 rounded-xl bg-[#1C2027] border border-[#2D333B] space-y-1">
                <span className="font-bold text-amber-300 block">1. Direct Answer (Trả lời thẳng 2s đầu)</span>
                <p className="text-[11px]">
                  "To be completely honest, I lean towards..." hoặc "Without a doubt, I'm really into..."
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1C2027] border border-[#2D333B] space-y-1">
                <span className="font-bold text-indigo-300 block">2. Reason / Detail (Đưa lý do cốt lõi)</span>
                <p className="text-[11px]">
                  "The main reason is that it allows me to..."
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1C2027] border border-[#2D333B] space-y-1">
                <span className="font-bold text-emerald-300 block">3. Contrast / Example (Ví dụ hoặc mặt đối lập)</span>
                <p className="text-[11px]">
                  "However, whenever I have some downtime, I also..."
                </p>
              </div>
            </div>
          </div>

          {/* 🎯 Mandatory Target Vocabulary Challenge */}
          <MandatoryVocabChallenge
            pinnedWords={pinnedDrillWords}
            liveTranscript={liveTranscript}
            isRecording={stage === 'speaking'}
            onRefreshWords={() => setDrillVocabSeed((p) => p + 1)}
            allWords={words}
          />
        </div>
      </div>

      {/* ================= DIAGNOSTIC SCORECARD DASHBOARD ================= */}
      {evaluationResult && (
        <div className="bg-[#16191F] rounded-3xl p-6 sm:p-8 border border-[#2D333B] shadow-2xl space-y-6 animate-fadeIn relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

          {/* Score Header Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pb-5 border-b border-[#2D333B]">
            <div className="sm:col-span-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black flex flex-col items-center justify-center shadow-xl shadow-amber-500/30 shrink-0 font-black">
                <span className="text-[10px] uppercase tracking-wider">Độ Trôi Chảy</span>
                <span className="text-2xl font-black">{evaluationResult.fluencyScore}%</span>
              </div>

              <div>
                <div className="text-lg font-black text-white flex items-center gap-2">
                  <span>Part 1 Band {evaluationResult.estimatedBand.toFixed(1)}</span>
                </div>
                <div className="text-xs text-amber-400 font-bold mt-0.5">
                  Phản xạ: {evaluationResult.directnessRating}
                </div>
                <p className="text-[11px] text-[#8E97A4] mt-1">{evaluationResult.responseTimeGrade}</p>
              </div>
            </div>

            {/* Filler Words Found & Directness */}
            <div className="sm:col-span-8 p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Kiểm tra từ ngập ngừng (Filler Words):
                </span>
                <span className="text-xs font-bold text-[#8E97A4]">
                  {evaluationResult.fillerWordsFound.length === 0
                    ? '✨ Không có từ ngập ngừng!'
                    : `Tìm thấy ${evaluationResult.fillerWordsFound.length} từ`}
                </span>
              </div>

              {evaluationResult.fillerWordsFound.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {evaluationResult.fillerWordsFound.map((filler, fIdx) => (
                    <span
                      key={fIdx}
                      className="text-xs font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    >
                      "{filler}"
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-medium">
                  Tuyệt vời! Bạn đã phản xạ liền mạch, không sử dụng các âm đệm thừa ("uh", "um", "like").
                </p>
              )}
            </div>
          </div>

          {/* 🎯 Báo Cáo Chấm Điểm Thử Thách Lồng Ghép Từ Vựng Mục Tiêu */}
          <MandatoryVocabReport
            evaluations={evaluationResult.mandatoryVocabEvaluations}
            targetWordsUsed={evaluationResult.targetWordsUsed}
            targetWordsMissed={evaluationResult.targetWordsMissed}
          />

          {/* 🚀 Phân Tích Tốc Độ Nói (WPM) & Khoảng Lặng Chết (Silence & Academic Fillers) */}
          <SilenceAndFillerAdvisor
            wordsPerMinute={evaluationResult.wordsPerMinute}
            speechRateVerdictVi={evaluationResult.speechRateVerdictVi}
            deadSilencePausesCount={evaluationResult.deadSilencePausesCount}
            academicFillers={evaluationResult.recommendedStallingFillers}
          />

          {/* 3-Column Diagnostic Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Lexical Upgrades */}
            <div className="p-5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Nâng Cấp Diễn Đạt Tự Nhiên (Lexical Upgrades)
              </h4>

              <div className="space-y-2.5">
                {evaluationResult.lexicalUpgrades.map((upg, uIdx) => (
                  <div key={uIdx} className="text-xs space-y-1">
                    <div className="line-through text-rose-400 font-mono">"{upg.userPhrase}"</div>
                    <div className="font-bold text-emerald-300 font-mono">➜ "{upg.nativeAlternative}"</div>
                    <p className="text-[11px] text-[#8E97A4]">{upg.explanationVi}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Band 8.5+ 2-Sentence Punchy Model Answer */}
            <div className="p-5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2D333B]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> Câu Trả Lời Mẫu Band 8.5+ (2 Câu)
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    speakWord(
                      evaluationResult.quickModelResponse.answer,
                      1.0,
                      accentCodeMap[selectedAccent]
                    )
                  }
                  className="p-1 rounded-lg bg-[#21262E] hover:bg-[#282D33] text-amber-400 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-serif italic text-white leading-relaxed">
                  "{evaluationResult.quickModelResponse.answer}"
                </p>
                <p className="text-[11px] text-[#8E97A4] italic border-t border-[#2D333B] pt-1.5 leading-relaxed">
                  {evaluationResult.quickModelResponse.vietnameseTranslation}
                </p>
              </div>
            </div>

            {/* 3. Coach Advice */}
            <div className="p-5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Lời Khuyên Giám Khảo
              </h4>

              <p className="text-xs text-[#9BA1A6] leading-relaxed">
                {evaluationResult.coachAdviceVi}
              </p>

              {evaluationResult.grammaticalFeedbackVi && (
                <div className="p-2.5 rounded-xl bg-[#21262E] text-[11px] text-indigo-300 leading-relaxed border border-[#30363D]">
                  <strong>Ngữ pháp:</strong> {evaluationResult.grammaticalFeedbackVi}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
