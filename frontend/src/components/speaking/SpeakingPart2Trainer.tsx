import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  ChevronRight,
  BookOpen,
  HelpCircle,
  FileText,
  Lightbulb,
  Edit3,
  Bookmark,
  Share2,
  Trash2,
  Clock,
  ArrowRight,
  ListChecks,
  BarChart3,
} from 'lucide-react';
import { VocabItem, WordSet, UserProgress, SpeakingQuestion, SpeakingEvaluationResult } from '../../types';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration } from '../../utils/confetti';
import { evaluateSpeakingResponse, generateSpeakingQuestionAi } from '../../services/geminiService';
import { WpmSpeechRateMeter, SilenceAndFillerAdvisor } from './WpmSpeechRateMeter';
import {
  MandatoryVocabChallenge,
  MandatoryVocabReport,
  PinnedWordItem,
} from './MandatoryVocabChallenge';
import { WeaknessPreSessionAlert } from '../index';
import { saveSpeakingAttemptToPortfolio } from '../../utils/speakingStorage';

interface SpeakingPart2TrainerProps {
  words: VocabItem[];
  activeSet?: WordSet;
  progress?: UserProgress;
  onBack: () => void;
  onRecordStudySession?: (wordsStudied: number, correctCount: number) => void;
  onOpenPortfolio?: () => void;
  onOpenRadar?: () => void;
}


// Preset Cambridge Part 2 Real Exam Cue Cards
const PRESET_CUE_CARDS: SpeakingQuestion[] = [
  {
    id: 'cue-p2-1',
    part: 2,
    topic: 'Công nghệ & Đổi mới',
    questionText: 'Describe an occasion when you used technology or software to solve a challenging problem.',
    subPrompts: [
      'What the problem was and when it occurred',
      'What specific technology or software tool you utilized',
      'How you applied it to tackle the issue',
      'And explain how you felt after solving the problem and what you learned from it',
    ],
    suggestedVocab: ['cutting-edge', 'streamline', 'troubleshoot', 'breakthrough', 'innovative', 'steep learning curve'],
    suggestedIdeas: [
      'An academic group project where data was disorganized until using automated tools',
      'Overcoming a technical glitch during an online presentation or exam',
      'Using digital tools to automate a tedious repetitive task',
    ],
    powerCollocations: [
      'harness the power of technology',
      'encounter a formidable obstacle',
      'devise an ingenious solution',
      'yield fruitful results',
      'a major turning point',
    ],
    idioms: ['think outside the box', 'at the 11th hour', 'breathe a sigh of relief'],
    storyFrameworkTips: [
      { phase: '1. Mở đầu & Bối cảnh', timeRange: '0 - 30s', guide: 'Giới thiệu tình huống, thời gian, và độ nghiêm trọng của vấn đề gặp phải.' },
      { phase: '2. Diễn biến & Giải pháp', timeRange: '30 - 80s', guide: 'Chi tiết từng bước sử dụng công nghệ, khó khăn ban đầu và cách bạn khắc phục.' },
      { phase: '3. Kết quả & Đánh giá', timeRange: '80 - 120s', guide: 'Cảm xúc nhẹ nhõm, bài học rút ra và tầm quan trọng của kỹ năng số.' },
    ],
  },
  {
    id: 'cue-p2-2',
    part: 2,
    topic: 'Môi trường & Đô thị',
    questionText: 'Describe an environmental initiative or project in your community that you think is effective.',
    subPrompts: [
      'What the initiative is and where it took place',
      'Who participated and how it was organized',
      'What positive environmental impact it achieved',
      'And explain why you consider this project particularly successful and meaningful',
    ],
    suggestedVocab: ['sustainable development', 'biodegradable', 'ecological footprint', 'conserve energy', 'heighten awareness'],
    suggestedIdeas: [
      'A neighborhood tree-planting drive or green canopy project',
      'A local plastic-free market or recycling campaign in your university/city',
      'A community cleanup campaign preserving a local canal or park',
    ],
    powerCollocations: [
      'raise public environmental consciousness',
      'mitigate environmental degradation',
      'foster a sense of community ownership',
      'set a shining precedent',
      'make significant strides',
    ],
    idioms: ['do one\'s bit for the planet', 'every cloud has a silver lining', 'join hands'],
    storyFrameworkTips: [
      { phase: '1. Giới thiệu dự án', timeRange: '0 - 30s', guide: 'Tên sáng kiến, vị trí tổ chức và vấn đề môi trường địa phương.' },
      { phase: '2. Cách thức triển khai', timeRange: '30 - 80s', guide: 'Sự tham gia của cộng đồng, các hoạt động cụ thể và khó khăn lúc đầu.' },
      { phase: '3. Tác động & Tầm nhìn', timeRange: '80 - 120s', guide: 'Lợi ích sinh thái đo lường được và bài học cho các thế hệ sau.' },
    ],
  },
  {
    id: 'cue-p2-3',
    part: 2,
    topic: 'Giáo dục & Bản thân',
    questionText: 'Describe an ambitious personal goal or achievement that you worked hard to accomplish.',
    subPrompts: [
      'What the goal was and when you set it',
      'What preparations and sacrifices you made to achieve it',
      'What major obstacles you had to overcome along the way',
      'And explain how achieving this goal influenced your confidence and future outlook',
    ],
    suggestedVocab: ['perseverance', 'unwavering determination', 'milestone', 'broaden horizons', 'resilience'],
    suggestedIdeas: [
      'Mastering an academic qualification or high IELTS target band',
      'Winning an intense speech or debate competition',
      'Building a healthy habit or running a marathon after months of training',
    ],
    powerCollocations: [
      'pursue one\'s aspirations relentlessly',
      'burn the midnight oil',
      'overcome insurmountable odds',
      'instill immense pride',
      'stand someone in good stead',
    ],
    idioms: ['go the extra mile', 'over the moon', 'keep one\'s eyes on the prize'],
    storyFrameworkTips: [
      { phase: '1. Thiết lập mục tiêu', timeRange: '0 - 30s', guide: 'Lý do bạn đặt mục tiêu cao và tâm thế lúc khởi đầu.' },
      { phase: '2. Quá trình vượt khó', timeRange: '30 - 80s', guide: 'Lịch trình kỷ luật, những lần vấp ngã và động lực đứng dậy.' },
      { phase: '3. Khoảnh khắc đạt được', timeRange: '80 - 120s', guide: 'Cảm giác chiến thắng bản thân và cách nó định hình tương lai.' },
    ],
  },
  {
    id: 'cue-p2-4',
    part: 2,
    topic: 'Kinh tế & Kinh doanh',
    questionText: 'Describe a successful business or entrepreneur you admire.',
    subPrompts: [
      'Who this person/business is and what industry they operate in',
      'How they started and grew their enterprise',
      'What qualities make them stand out from competitors',
      'And explain why you find their journey inspiring and worth learning from',
    ],
    suggestedVocab: ['entrepreneurial spirit', 'disruptive innovation', 'market saturation', 'visionary leader', 'financial viability'],
    suggestedIdeas: [
      'A local start-up founder who turned an eco-friendly idea into a profitable enterprise',
      'A renowned global innovator who revolutionized renewable transport or communications',
      'A family-owned legacy business that successfully embraced digital transformation',
    ],
    powerCollocations: [
      'carve out a niche in the market',
      'demonstrate visionary leadership',
      'weather economic downturns',
      'garner widespread acclaim',
      'generate substantial revenue',
    ],
    idioms: ['climb the corporate ladder', 'against all odds', 'ahead of the curve'],
    storyFrameworkTips: [
      { phase: '1. Giới thiệu doanh nhân', timeRange: '0 - 30s', guide: 'Tên tuổi, lĩnh vực kinh doanh và vị thế hiện tại.' },
      { phase: '2. Hành trình lập nghiệp', timeRange: '30 - 80s', guide: 'Khó khăn ban đầu, chiến lược bứt phá và văn hóa công ty.' },
      { phase: '3. Bài học truyền cảm hứng', timeRange: '80 - 120s', guide: 'Những phẩm chất đáng học tập cho sự nghiệp của chính bạn.' },
    ],
  },
];

type ChallengeStage = 'select_topic' | 'prep_countdown' | 'speaking_live' | 'evaluating' | 'result_dashboard';

export const SpeakingPart2Trainer: React.FC<SpeakingPart2TrainerProps> = ({
  words,
  activeSet,
  onBack,
  onRecordStudySession,
  onOpenPortfolio,
  onOpenRadar,
}) => {

  const [stage, setStage] = useState<ChallengeStage>('select_topic');
  const [selectedCard, setSelectedCard] = useState<SpeakingQuestion>(PRESET_CUE_CARDS[0]);
  const [isGeneratingAiCard, setIsGeneratingAiCard] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const latestAudioBlobRef = useRef<Blob | null>(null);

  // 60-Second Preparation State
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(60);
  const [userNotes, setUserNotes] = useState('');

  // 2-Minute Speaking State
  const [speechSecondsLeft, setSpeechSecondsLeft] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [silenceSeconds, setSilenceSeconds] = useState<number>(0);
  const [evaluationResult, setEvaluationResult] = useState<SpeakingEvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const [vocabChallengeSeed, setVocabChallengeSeed] = useState<number>(0);

  // 🎯 Mandatory Target Vocabulary Challenge for Part 2 Long Turn
  const pinnedPart2Words: PinnedWordItem[] = React.useMemo(() => {
    const cardVocab: PinnedWordItem[] = (selectedCard.suggestedVocab || []).map((term) => {
      const found = words.find((w) => w.term.toLowerCase() === term.toLowerCase());
      return {
        term,
        ipa: found?.ipa,
        meaningVi: found?.meaningVi || found?.definitionVi || 'Từ vựng trọng tâm',
        ieltsBand: found?.ieltsBand || '8.0+',
        collocation:
          found?.collocations?.[0]?.collocation ||
          found?.exampleSentence?.slice(0, 50) ||
          undefined,
      };
    });

    const availableSetWords: PinnedWordItem[] = words
      .filter((w) => !cardVocab.some((cv) => cv.term.toLowerCase() === w.term.toLowerCase()))
      .map((w) => ({
        term: w.term,
        ipa: w.ipa,
        meaningVi: w.meaningVi || w.definitionVi || 'Từ vựng học thuật',
        ieltsBand: w.ieltsBand || '7.5+',
        collocation:
          w.collocations?.[0]?.collocation ||
          w.exampleSentence?.slice(0, 50) ||
          undefined,
      }));

    const combined = [...cardVocab, ...availableSetWords];
    if (combined.length === 0) {
      return [
        { term: 'innovative', meaningVi: 'mang tính đổi mới sáng tạo', ieltsBand: '7.5', collocation: 'innovative approach' },
        { term: 'streamline', meaningVi: 'hợp lý hóa quy trình', ieltsBand: '8.0', collocation: 'streamline the workflow' },
        { term: 'breakthrough', meaningVi: 'bước đột phá lớn', ieltsBand: '8.5', collocation: 'major breakthrough' },
      ];
    }
    const offset = vocabChallengeSeed % combined.length;
    const rotated = [...combined.slice(offset), ...combined.slice(0, offset)];
    return rotated.slice(0, 3);
  }, [selectedCard, words, vocabChallengeSeed]);

  // Audio & Speech Recognition Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechStartTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(Date.now());

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

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
        console.warn('Speech recognition error:', err);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      if (speechTimerRef.current) clearInterval(speechTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
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

  // Handle Generating Custom Cue Card with Gemini
  const handleGenerateCustomCard = async () => {
    setIsGeneratingAiCard(true);
    try {
      const vocabTerms = words.slice(0, 10).map((w) => w.term);
      const generated = await generateSpeakingQuestionAi({
        part: 2,
        topic: customTopicInput.trim() || activeSet?.title || 'IELTS Speaking Cambridge',
        vocabTerms,
      });

      setSelectedCard(generated);
      sounds.playSuccess();
    } catch (err: any) {
      console.error('Failed to generate cue card:', err);
    } finally {
      setIsGeneratingAiCard(false);
    }
  };

  // Start 60s Preparation Phase
  const handleStartPreparation = (card: SpeakingQuestion) => {
    setSelectedCard(card);
    setPrepSecondsLeft(60);
    setUserNotes('');
    setStage('prep_countdown');
    sounds.playClick();

    // Speak Cue Card Question Prompt
    speakWord(card.questionText);

    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    prepTimerRef.current = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current!);
          handleStartSpeakingLive();
          return 0;
        }
        // Audio cue on last 5 seconds
        if (prev <= 6 && prev > 1) {
          sounds.playClick();
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start 2-Minute Speaking Presentation
  const handleStartSpeakingLive = async () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setSpeechSecondsLeft(120);
    setLiveTranscript('');
    setRecordedAudioUrl(null);
    setStage('speaking_live');
    sounds.playStreak();
    speechStartTimeRef.current = Date.now();

    // Start Audio Recorder & Web Speech API
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
        latestAudioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        if (mediaStreamRef.current === stream) {
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      lastSpeechTimeRef.current = Date.now();
      setSilenceSeconds(0);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition already active');
        }
      }
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
    }

    // 120s Speaking Timer & Silence calculation
    if (speechTimerRef.current) clearInterval(speechTimerRef.current);
    speechTimerRef.current = setInterval(() => {
      const silenceSec = (Date.now() - lastSpeechTimeRef.current) / 1000;
      setSilenceSeconds(silenceSec);

      const elapsedSec = Math.floor((Date.now() - speechStartTimeRef.current) / 1000);
      const remainingSec = Math.max(0, 120 - elapsedSec);
      setSpeechSecondsLeft(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(speechTimerRef.current!);
        handleFinishSpeaking();
      }
    }, 500);
  };

  // Finish Speaking & Send to Gemini for 2-Minute In-Depth Evaluation
  const handleFinishSpeaking = useCallback(async () => {
    if (speechTimerRef.current) clearInterval(speechTimerRef.current);
    setIsRecording(false);

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

    const elapsed = speechStartTimeRef.current > 0 ? Math.floor((Date.now() - speechStartTimeRef.current) / 1000) : (120 - speechSecondsLeft);
    const spokenTime = Math.min(120, Math.max(5, elapsed));
    const finalTranscript = liveTranscript.trim() || 'Candidate presented without microphone speech capture.';

    try {
      const targetWords = pinnedPart2Words.map((w) => w.term);
      const result = await evaluateSpeakingResponse({
        question: selectedCard.questionText,
        part: 2,
        topic: selectedCard.topic,
        transcript: finalTranscript,
        durationSeconds: spokenTime,
        targetWords,
      });

      setEvaluationResult(result);
      setStage('result_dashboard');

      // Save to persistent Speaking Portfolio
      saveSpeakingAttemptToPortfolio(
        {
          mode: 'part2-trainer',
          part: 2,
          topic: selectedCard.topic,
          question: selectedCard.questionText,
          transcript: finalTranscript,
          durationSeconds: spokenTime,
          overallBand: result.overallBand,
          criteriaScores: {
            fluency: result.criteriaScores.fluencyCoherence.score,
            lexical: result.criteriaScores.lexicalResource.score,
            grammar: result.criteriaScores.grammaticalRange.score,
            pronunciation: result.criteriaScores.pronunciation.score,
            wordsPerMinute: result.criteriaScores.fluencyCoherence.wordsPerMinute,
            hesitationsCount: result.criteriaScores.fluencyCoherence.hesitationsCount,
            deadSilencePausesCount: result.criteriaScores.fluencyCoherence.deadSilencePausesCount,
          },
          targetWordsUsed: result.targetWordsUsed || [],
          targetWordsMissed: result.targetWordsMissed || [],
          mandatoryVocabEvaluations: result.mandatoryVocabEvaluations,
          evalResult: result,
          audioUrl: recordedAudioUrl || undefined,
        },
        latestAudioBlobRef.current || undefined
      ).catch(() => {});

      if (result.overallBand >= 7.0) {
        sounds.playComplete();
        fireCelebration();
      } else {
        sounds.playStreak();
      }

      if (onRecordStudySession) {
        onRecordStudySession(targetWords.length || 5, result.overallBand >= 6.5 ? 5 : 3);
      }
    } catch (err: any) {
      console.error('Part 2 Evaluation error:', err);
      setEvalError(err.message || 'Lỗi phân tích bài nói Part 2 từ AI');
      setStage('result_dashboard');
    }
  }, [liveTranscript, speechSecondsLeft, selectedCard, onRecordStudySession]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-100px)] py-3 px-3 sm:px-6 lg:px-8">
      {/* Subtle Background Gradient Accents to fill empty side space on wide screens */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-28 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-amber-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-24 -left-36 w-72 h-72 bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-36 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-28 -right-36 w-80 h-80 bg-rose-500/6 rounded-full blur-[140px]" />
      </div>

      {/* Main Spacious Container with widescreen layout */}
      <div className="relative z-10 max-w-[1520px] w-full mx-auto space-y-6 animate-fadeIn pb-16">
        {/* Top Header Navigation */}
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
              <Flame className="w-4 h-4" />
            </span>
            <span className="text-sm font-black text-white">
              Thử Thách Part 2 Cue Card (1p Chuẩn Bị + 2p Nói)
            </span>
          </div>
        </div>

        {/* Phase Indicator Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {onOpenPortfolio && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenPortfolio();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer mr-1"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kho Bản Ghi & Đồ Thị 📊</span>
            </button>
          )}

          <span
            className={`px-3 py-1 rounded-xl transition-all ${
              stage === 'select_topic'
                ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/30'
                : 'bg-[#21262E] text-[#8E97A4]'
            }`}
          >
            1. Chọn Đề
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#30363D]" />
          <span
            className={`px-3 py-1 rounded-xl transition-all ${
              stage === 'prep_countdown'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                : 'bg-[#21262E] text-[#8E97A4]'
            }`}
          >
            2. Chuẩn Bị (60s)
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#30363D]" />
          <span
            className={`px-3 py-1 rounded-xl transition-all ${
              stage === 'speaking_live'
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/40 ring-2 ring-rose-400'
                : 'bg-[#21262E] text-[#8E97A4]'
            }`}
          >
            3. Trình Bày (120s)
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#30363D]" />
          <span
            className={`px-3 py-1 rounded-xl transition-all ${
              stage === 'result_dashboard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-[#21262E] text-[#8E97A4]'
            }`}
          >
            4. AI Phân Tích
          </span>
        </div>
      </div>

      {/* 🛑 Pre-session Weakness Radar Alert for Part 2 */}
      {stage === 'select_topic' && (
        <WeaknessPreSessionAlert
          part={2}
          onOpenRadar={onOpenRadar}
        />
      )}

      {/* ================= STAGE 1: SELECT OR GENERATE CUE CARD ================= */}

      {stage === 'select_topic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 Cols): Preset Cambridge Cue Cards */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" /> Ngân Hàng Đề Thi Dự Đoán Cambridge Part 2
                  </h2>
                  <p className="text-xs text-[#8E97A4] mt-0.5">
                    Chọn một chủ đề Cue Card thực tế để rèn luyện phản xạ 1 phút chuẩn bị và nói liên tục 2 phút.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRESET_CUE_CARDS.map((card) => {
                  const isSelected = selectedCard.id === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#1C2027] border-amber-500/80 ring-2 ring-amber-500/30 shadow-xl'
                          : 'bg-[#1C2027]/70 border-[#2D333B] hover:border-amber-500/40 hover:bg-[#1C2027]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {card.topic}
                          </span>
                          <span className="text-[10px] font-mono text-[#8E97A4]">IELTS Cue Card</span>
                        </div>

                        <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                          {card.questionText}
                        </h3>

                        <div className="space-y-1 pt-2 border-t border-[#2D333B]">
                          <span className="text-[10px] text-[#8E97A4] uppercase font-bold block">
                            You should say:
                          </span>
                          <ul className="text-xs text-[#9BA1A6] space-y-0.5 list-disc list-inside">
                            {card.subPrompts?.slice(0, 3).map((prompt, idx) => (
                              <li key={idx} className="truncate">
                                {prompt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#2D333B]">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8E97A4]">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>{card.suggestedVocab?.length || 0} từ C1/C2</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPreparation(card);
                          }}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1"
                        >
                          Bắt đầu <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (4 Cols): AI Custom Card Generator & Challenge Info */}
          <div className="lg:col-span-4 space-y-4">
            {/* AI Generator Box */}
            <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#2D333B]">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Tạo Đề Cue Card Tùy Biến (Gemini AI)
                </h3>
              </div>

              <p className="text-xs text-[#9BA1A6] leading-relaxed">
                Tự động tạo thẻ đề Part 2 chuẩn format Cambridge kết nối trực tiếp với danh sách từ vựng trong bộ đang học.
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  placeholder="Nhập chủ đề (vd: Trí tuệ nhân tạo, Du lịch vũ trụ...)"
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl bg-[#1C2027] border border-[#2D333B] text-white placeholder-[#8E97A4] focus:outline-hidden focus:border-indigo-500"
                />

                <button
                  type="button"
                  disabled={isGeneratingAiCard}
                  onClick={handleGenerateCustomCard}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGeneratingAiCard ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" /> Đang soạn đề IELTS...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Tạo đề thi Part 2 mới
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Rules Box */}
            <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                <ListChecks className="w-4 h-4" /> Quy Tắc Tính Điểm Part 2
              </h4>
              <ul className="text-xs text-[#9BA1A6] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span><strong>Ghi chú 60s:</strong> Tận dụng ghi lại từ khóa, cấu trúc câu phức, không cần viết nguyên câu.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span><strong>Nói đủ 2 phút:</strong> Duy trì độ mượt, tránh dừng quá 5s hoặc lặp đi lặp lại từ nối `and... and...`.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span><strong>Phát hiện Filler words:</strong> Giảm thiểu `uh`, `um`, `like`, `you know` để nâng band Fluency lên 8.0+.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGE 2: 60-SECOND PREPARATION PHASE ================= */}
      {stage === 'prep_countdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* Left Column (5 Cols): Countdown & Cue Card Prompt */}
          <div className="lg:col-span-5 space-y-5">
            {/* Giant Countdown Clock */}
            <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-2xl text-center space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Timer className="w-4 h-4" /> Thời Gian Chuẩn Bị (1 Phút)
                </span>
                <span className="text-xs font-bold text-amber-400 animate-pulse">
                  Đang ghi chú...
                </span>
              </div>

              {/* Circular Timer Visual */}
              <div className="py-2">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="text-[#1C2027]"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="text-indigo-500 transition-all duration-1000 ease-linear"
                      strokeWidth="8"
                      strokeDasharray={326.7}
                      strokeDashoffset={326.7 * (1 - prepSecondsLeft / 60)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white font-mono">
                      {prepSecondsLeft}s
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#8E97A4]">Còn lại</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartSpeakingLive}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Sẵn Sàng Nói Ngay (Bỏ qua chuẩn bị)</span>
                </button>
              </div>
            </div>

            {/* Official Cue Card Paper Display */}
            <div className="bg-[#FFFDF7] text-[#1E293B] rounded-3xl p-6 sm:p-7 border-2 border-[#E2E8F0] shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]">
                <span className="text-xs font-black uppercase tracking-wider text-[#475569]">
                  IELTS Candidate Task Card
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#E2E8F0] text-[#334155]">
                  Part 2 Speaking
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
                {selectedCard.questionText}
              </h2>

              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#475569] uppercase">You should say:</p>
                <ul className="space-y-1.5 text-xs text-[#334155] list-disc list-inside leading-relaxed font-medium">
                  {selectedCard.subPrompts?.map((prompt, idx) => (
                    <li key={idx}>{prompt}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Digital Scratchpad & Power Collocations Suggestion */}
          <div className="lg:col-span-7 space-y-5">
            {/* Digital Scratchpad / Notes Sheet */}
            <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Bảng Ghi Chú Nhanh 60 Giây (Digital Scratchpad)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setUserNotes('')}
                  className="text-xs text-[#8E97A4] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Xóa nháp
                </button>
              </div>

              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Ghi nhanh dàn ý 4 ý chính theo cấu trúc câu chuyện (vd: 1. When: 2 years ago, graduation... 2. What: mobile app bug... 3. How: collaborative debugging, cutting-edge software... 4. Feelings: sense of accomplishment...)"
                rows={7}
                className="w-full text-sm font-mono leading-relaxed p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] text-white placeholder-[#8E97A4] focus:outline-hidden focus:border-amber-500 shadow-inner resize-none"
              />

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setUserNotes(
                      (prev) =>
                        prev +
                        '\n- Intro: To embark on my story, I would like to recount...\n- Development: What struck me most was...\n- Climax: Against all odds, we managed to...\n- Reflection: Looking back, this milestone taught me...'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#21262E] hover:bg-[#282D33] text-amber-300 border border-[#30363D] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> Chèn sườn bài mẫu Band 8.0+
                </button>
              </div>
            </div>

            {/* Power Collocations & Idioms Box */}
            <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Power Collocations & Idioms Nên Dùng Cho Đề Này
              </h3>

              <div className="space-y-3">
                {/* Collocations */}
                <div>
                  <span className="text-[11px] text-[#8E97A4] block mb-1.5 font-bold uppercase">
                    Collocations Học Thuật (Nhấn để thêm vào ghi chú):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard.powerCollocations?.map((col, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setUserNotes((prev) => `${prev} • ${col}`)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        + {col}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Idioms */}
                {selectedCard.idioms && selectedCard.idioms.length > 0 && (
                  <div className="pt-2 border-t border-[#2D333B]">
                    <span className="text-[11px] text-[#8E97A4] block mb-1.5 font-bold uppercase">
                      Thành Ngữ Tự Nhiên (Idiomatic Language):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.idioms.map((idm, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setUserNotes((prev) => `${prev} • ${idm}`)}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          + {idm}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGE 3: 2-MINUTE SPEAKING LIVE PRESENTATION ================= */}
      {stage === 'speaking_live' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* Left Column (5 Cols): Live Timer & Cue Card Reference */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live 2-Minute Timer Box */}
            <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-2xl text-center space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-rose-400 animate-pulse" /> Đang Ghi Âm & Nhận Diện Giọng Nói
                </span>
                <span className="text-xs font-bold text-rose-400 animate-pulse">
                  Trình bày liên tục
                </span>
              </div>

              {/* Giant 120s Countdown Visual */}
              <div className="py-2">
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="text-[#1C2027]"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="text-rose-500 transition-all duration-1000 ease-linear"
                      strokeWidth="8"
                      strokeDasharray={326.7}
                      strokeDashoffset={326.7 * (1 - speechSecondsLeft / 120)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white font-mono">
                      {formatSeconds(speechSecondsLeft)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#8E97A4]">
                      {120 - speechSecondsLeft}s đã nói
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Pacing Phase Indicator */}
              <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-1 text-center">
                <span className="text-[11px] text-[#8E97A4] font-bold uppercase block">
                  Nhịp độ khuyến nghị hiện tại:
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {120 - speechSecondsLeft < 35
                    ? '1. Mở bài & Thiết lập bối cảnh (0 - 35s)'
                    : 120 - speechSecondsLeft < 85
                    ? '2. Đi sâu vào diễn biến cốt lõi & cảm xúc (35 - 85s)'
                    : '3. Bài học, ý nghĩa sâu xa & kết luận (85 - 120s)'}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishSpeaking}
                  className="w-full py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Hoàn Thành & Chấm Điểm AI Ngay</span>
                </button>
              </div>
            </div>

            {/* Quick Candidate Notes Preview */}
            {userNotes && (
              <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Ghi chú của bạn:
                </span>
                <p className="text-xs font-mono text-[#E0E2E4] whitespace-pre-wrap leading-relaxed">
                  {userNotes}
                </p>
              </div>
            )}

            {/* 🎯 Mandatory Target Vocabulary Challenge */}
            <MandatoryVocabChallenge
              pinnedWords={pinnedPart2Words}
              liveTranscript={liveTranscript}
              isRecording={isRecording}
              onRefreshWords={() => setVocabChallengeSeed((p) => p + 1)}
              allWords={words}
            />
          </div>

          {/* Right Column (7 Cols): Live Speech Transcript Stream */}
          <div className="lg:col-span-7 space-y-5">
            {/* Live WPM Speedometer & Silence Alert */}
            <WpmSpeechRateMeter
              currentWpm={
                120 - speechSecondsLeft > 2
                  ? Math.round((liveTranscript.trim().split(/\s+/).filter(Boolean).length / (120 - speechSecondsLeft)) * 60)
                  : 0
              }
              wordCount={liveTranscript.trim().split(/\s+/).filter(Boolean).length}
              elapsedSeconds={120 - speechSecondsLeft}
              isRecording={isRecording}
              silenceSeconds={silenceSeconds}
            />

            <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Bản Ghi Âm Nhận Diện Giọng Nói Thời Gian Thực
                  </span>
                </div>
                <span className="text-xs font-mono text-[#8E97A4]">
                  {liveTranscript.split(' ').filter(Boolean).length} từ
                </span>
              </div>

              <div className="min-h-[260px] max-h-[400px] overflow-y-auto p-5 rounded-2xl bg-[#1C2027] border border-[#2D333B] shadow-inner space-y-3">
                {liveTranscript ? (
                  <p className="text-base text-white leading-relaxed font-sans">
                    {liveTranscript}
                  </p>
                ) : (
                  <div className="text-center py-16 text-[#8E97A4] space-y-2">
                    <Mic className="w-8 h-8 mx-auto text-[#8E97A4] opacity-50 animate-bounce" />
                    <p className="text-sm">Hãy bắt đầu trình bày câu chuyện của bạn...</p>
                    <p className="text-xs text-[#8E97A4] opacity-75">
                      Giọng nói sẽ được chuyển thành văn bản tức thì và gửi cho Gemini AI phân tích.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cue Card Reference Card */}
            <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-2">
              <span className="text-[11px] font-bold text-[#8E97A4] uppercase tracking-wider block">
                Đề bài Part 2:
              </span>
              <h4 className="text-sm font-bold text-white leading-snug">{selectedCard.questionText}</h4>
              <ul className="text-xs text-[#9BA1A6] space-y-0.5 list-disc list-inside pt-1">
                {selectedCard.subPrompts?.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGE 4: EVALUATION IN PROGRESS SPINNER ================= */}
      {stage === 'evaluating' && (
        <div className="max-w-2xl mx-auto bg-[#16191F] rounded-3xl p-12 border border-[#2D333B] shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-10 h-10 animate-spin" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Giám Khảo AI Đang Phân Tích Bài Nói 2 Phút...</h2>
            <p className="text-xs text-[#9BA1A6] max-w-md mx-auto leading-relaxed">
              Hệ thống đang đếm số lần ngập ngừng (filler words), phát hiện lỗi ngữ pháp, kiểm tra collocations và soạn bài mẫu Band 8.5+.
            </p>
          </div>
        </div>
      )}

      {/* ================= STAGE 5: RESULT & DIAGNOSTIC DASHBOARD ================= */}
      {stage === 'result_dashboard' && evaluationResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Score Banner */}
          <div className="bg-[#16191F] rounded-3xl p-6 sm:p-8 border border-[#2D333B] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Overall Band */}
              <div className="lg:col-span-4 text-center lg:text-left flex flex-col sm:flex-row items-center gap-5">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black flex flex-col items-center justify-center shadow-2xl shadow-amber-500/30 shrink-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Overall Band</span>
                  <span className="text-3xl font-black">{evaluationResult.overallBand.toFixed(1)}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Kết Quả Đánh Giá IELTS Part 2</h3>
                  <p className="text-xs text-[#9BA1A6]">
                    Thời gian nói: <strong>{evaluationResult.durationSeconds}s</strong> • Đề: {selectedCard.topic}
                  </p>
                  {recordedAudioUrl && (
                    <div className="pt-2">
                      <audio controls src={recordedAudioUrl} className="h-8 max-w-[220px]" />
                    </div>
                  )}
                </div>
              </div>

              {/* 4 IELTS Criteria Sub-Scores */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B]">
                  <div className="text-xl font-black text-emerald-400">
                    {evaluationResult.criteriaScores.fluencyCoherence.score.toFixed(1)}
                  </div>
                  <div className="text-[11px] font-bold text-[#8E97A4] mt-0.5">Fluency (FC)</div>
                  <div className="text-[10px] text-emerald-400/80 mt-1">
                    {evaluationResult.criteriaScores.fluencyCoherence.speedPacing}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B]">
                  <div className="text-xl font-black text-indigo-400">
                    {evaluationResult.criteriaScores.lexicalResource.score.toFixed(1)}
                  </div>
                  <div className="text-[11px] font-bold text-[#8E97A4] mt-0.5">Vocabulary (LR)</div>
                  <div className="text-[10px] text-indigo-400/80 mt-1">
                    {evaluationResult.criteriaScores.lexicalResource.academicWordsUsed.length} từ học thuật
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B]">
                  <div className="text-xl font-black text-purple-400">
                    {evaluationResult.criteriaScores.grammaticalRange.score.toFixed(1)}
                  </div>
                  <div className="text-[11px] font-bold text-[#8E97A4] mt-0.5">Grammar (GRA)</div>
                  <div className="text-[10px] text-purple-400/80 mt-1">
                    {evaluationResult.criteriaScores.grammaticalRange.grammarErrors.length} lỗi cần sửa
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B]">
                  <div className="text-xl font-black text-rose-400">
                    {evaluationResult.criteriaScores.pronunciation.score.toFixed(1)}
                  </div>
                  <div className="text-[11px] font-bold text-[#8E97A4] mt-0.5">Pronunciation (PR)</div>
                  <div className="text-[10px] text-rose-400/80 mt-1">
                    {evaluationResult.criteriaScores.pronunciation.trickyWords.length} từ lưu ý
                  </div>
                </div>
              </div>
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
            wordsPerMinute={evaluationResult.criteriaScores.fluencyCoherence.wordsPerMinute}
            speechRateVerdictVi={evaluationResult.criteriaScores.fluencyCoherence.speechRateVerdictVi}
            deadSilencePausesCount={evaluationResult.criteriaScores.fluencyCoherence.deadSilencePausesCount}
            deadSilencePauses={evaluationResult.criteriaScores.fluencyCoherence.deadSilencePauses}
            academicFillers={evaluationResult.criteriaScores.fluencyCoherence.academicFillerRecommendations}
          />

          {/* 3-Column Detailed Diagnostic Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (4 Cols): Filler Words & Grammar Correction */}
            <div className="lg:col-span-4 space-y-4">
              {/* Filler Words Diagnostic */}
              <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Phân Tích Từ Ngập Ngừng (Filler Words)
                </h4>

                <p className="text-xs text-[#9BA1A6] leading-relaxed">
                  {evaluationResult.criteriaScores.fluencyCoherence.hesitationsCommentVi ||
                    'Độ lưu loát ổn định, nhịp độ nói tự nhiên.'}
                </p>

                {evaluationResult.criteriaScores.fluencyCoherence.fillerWordsFound &&
                  evaluationResult.criteriaScores.fluencyCoherence.fillerWordsFound.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#2D333B]">
                      <span className="text-[11px] font-bold text-[#8E97A4] block">
                        Các từ chêm/ngập ngừng phát hiện:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {evaluationResult.criteriaScores.fluencyCoherence.fillerWordsFound.map(
                          (filler, fIdx) => (
                            <span
                              key={fIdx}
                              className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25"
                            >
                              {filler}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Grammar Errors & Corrections */}
              <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> Sửa Lỗi Ngữ Pháp Chi Tiết
                </h4>

                {evaluationResult.criteriaScores.grammaticalRange.grammarErrors.length === 0 ? (
                  <p className="text-xs text-emerald-400 font-bold">
                    ✓ Không phát hiện lỗi ngữ pháp nghiêm trọng trong bài nói!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {evaluationResult.criteriaScores.grammaticalRange.grammarErrors.map((err, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-3 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-1.5 text-xs"
                      >
                        <div className="text-rose-400 line-through">"{err.original}"</div>
                        <div className="text-emerald-400 font-bold">➜ "{err.corrected}"</div>
                        <div className="text-[11px] text-[#8E97A4] italic">{err.explanationVi}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center Column (5 Cols): Transcript & Praised Highlights */}
            <div className="lg:col-span-5 space-y-4">
              {/* Spoken Transcript */}
              <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E97A4] block pb-2 border-b border-[#2D333B]">
                  Bản Ghi Âm Lời Nói Của Bạn:
                </span>
                <p className="text-sm text-white font-sans leading-relaxed p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B]">
                  "{evaluationResult.transcript}"
                </p>
              </div>

              {/* Praised Lexical Items */}
              <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Khen Ngợi Từ Vựng & Collocations Dùng Đúng
                </h4>

                <div className="flex flex-wrap gap-2">
                  {evaluationResult.criteriaScores.lexicalResource.academicWordsUsed.map((w, wIdx) => (
                    <span
                      key={wIdx}
                      className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    >
                      ✓ {w}
                    </span>
                  ))}
                  {evaluationResult.criteriaScores.lexicalResource.collocationsUsed.map((c, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                    >
                      ✦ {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (3 Cols): Band 8.5+ Model Answer & Next Steps */}
            <div className="lg:col-span-3 space-y-4">
              {/* Band 8.5+ Model Script */}
              <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                  <Award className="w-4 h-4 text-amber-400" /> Bài Mẫu Part 2 Chuẩn Band 8.5+
                </h4>

                <div className="p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-2 max-h-[300px] overflow-y-auto">
                  <p className="text-xs text-white leading-relaxed font-sans italic">
                    "{evaluationResult.band8ModelAnswer.answer}"
                  </p>

                  <div className="pt-2 border-t border-[#2D333B] text-[11px] text-[#8E97A4] leading-relaxed">
                    <strong>Bản dịch:</strong> {evaluationResult.band8ModelAnswer.vietnameseTranslation}
                  </div>
                </div>

                {/* Key collocations used in model */}
                <div className="space-y-1.5 pt-2 border-t border-[#2D333B]">
                  <span className="text-[11px] font-bold text-amber-400 block">Collocations ăn điểm:</span>
                  <div className="flex flex-wrap gap-1">
                    {evaluationResult.band8ModelAnswer.keyCollocations.map((col, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartPreparation(selectedCard)}
                  className="w-full py-3 rounded-2xl text-xs font-bold bg-[#21262E] hover:bg-[#282D33] text-white border border-[#30363D] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Luyện lại đề này
                </button>

                <button
                  type="button"
                  onClick={() => setStage('select_topic')}
                  className="w-full py-3 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Thử thách đề Cue Card khác <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
