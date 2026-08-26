import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  ChevronRight,
  AlertTriangle,
  Play,
  Square,
  BookOpen,
  Zap,
  Target,
  FileText,
  LifeBuoy,
  PlusCircle,
  Copy,
  Check,
  Flame,
} from 'lucide-react';
import {
  SpeechLadderLevel,
  SpeechLadderPrompt,
  SpeechLadderEvaluationResult,
  WordSet,
  VocabItem,
} from '../../types';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { AccentSwitcher } from './AccentSwitcher';
import { evaluateSpeechLadderStep } from '../../services/geminiService';
import confetti from 'canvas-confetti';

interface ProgressiveSpeechLadderProps {
  words?: VocabItem[];
  activeSet?: WordSet;
  onBack: () => void;
  onOpenEmergencyStalling?: () => void;
  onOpenAreaExpander?: () => void;
  onStartPracticeInMock?: (questionText?: string) => void;
}

// Curated Progressive Speech Ladder Prompts
export const SPEECH_LADDER_PROMPTS: SpeechLadderPrompt[] = [
  {
    id: 'ladder-1',
    topic: 'An unforgettable trip / Travel Experience',
    part: 2,
    questionText: 'Describe a memorable journey or trip you went on.',
    cueCardPoints: [
      'Where you went and who you went with',
      'What you did on this journey',
      'Why this trip remains memorable in your mind',
    ],
    recommendedVocab: [
      {
        word: 'breathtaking scenery',
        phonetic: '/ˈbreθˌteɪ.kɪŋ ˈsiː.nər.i/',
        meaningVi: 'Cảnh quan đẹp đến nghẹt thở',
        level: 'C1',
        collocation: 'marvel at the breathtaking scenery',
      },
      {
        word: 'off the beaten track',
        phonetic: '/ɒf ðə ˈbiː.tən træk/',
        meaningVi: 'Nơi hoang sơ, ít du khách lui tới',
        level: 'C2 Idiom',
        collocation: 'explore destinations off the beaten track',
      },
      {
        word: 'etched into my memory',
        phonetic: '/etʃt ˈɪn.tuː maɪ ˈmem.ər.i/',
        meaningVi: 'Khắc sâu vào tâm trí tôi',
        level: 'C2 Collocation',
        collocation: 'an experience forever etched into my memory',
      },
    ],
    level1Guide: {
      targetDuration: '30s',
      targetSeconds: 30,
      goalVi: 'Khởi động 30s: Nói trực diện chuyến đi ở đâu, với ai và 1 lý do bạn nhớ nhất. Tuyệt đối không im lặng.',
      starterTemplate: "If I were to pick one unforgettable trip, it would definitely be my journey to...",
      sampleBand7Response: "If I were to pick one unforgettable trip, it would definitely be my journey to Da Lat two years ago with my university friends. The primary reason it stands out is the cool climate and how we were able to disconnect from the hustle and bustle of city life.",
      keyPointsVi: ['Địa điểm & Bạn đồng hành', 'Lý do chính yếu'],
    },
    level2Guide: {
      targetDuration: '60s',
      targetSeconds: 60,
      goalVi: 'Phát triển 60s: Đắp thêm mốc thời gian, chi tiết 1 sự cố hoặc hoạt động đặc biệt (săn mây, thưởng thức ẩm thực) và cảm xúc thực sự.',
      starterTemplate: "Building upon that, what truly made this trip special was when we woke up at 4 AM to...",
      sampleBand7Response: "If I were to pick one unforgettable trip, it would definitely be my journey to Da Lat two years ago with my university friends. The primary reason it stands out is the cool climate and peaceful atmosphere. What truly made this trip special was when we woke up at 4 AM to catch the sunrise above the clouds on a remote hilltop. Tasting hot street food in the chilly evening gave me a profound sense of serenity that I rarely experience during hectic workdays.",
      keyPointsVi: ['Chi tiết hoạt động (4 AM săn mây)', 'Cảm xúc cá nhân & Trải nghiệm giác quan'],
    },
    level3Guide: {
      targetDuration: '90s - 120s',
      targetSeconds: 90,
      goalVi: 'Bùng nổ 90-120s: So sánh bản thân trước vs sau chuyến đi, đúc kết bài học về sự gắn kết bạn bè và giá trị của việc đi du lịch.',
      starterTemplate: "Looking back on it now from a broader perspective, that journey marked a major turning point because...",
      sampleBand7Response: "If I were to pick one unforgettable trip, it would definitely be my journey to Da Lat two years ago with my university friends. The primary reason it stands out is the cool climate and peaceful atmosphere. What truly made this trip special was when we woke up at 4 AM to catch the sunrise above the clouds on a remote hilltop. Tasting hot street food in the chilly evening gave me a profound sense of serenity. Looking back on it now from a broader perspective, that journey marked a major turning point for our friendship. Before the trip, we were all overwhelmed by academic pressure. Had we not taken that spontaneous getaway, we wouldn't have forged such unbreakable bonds. It taught me that travelling isn't just about sightseeing, but about reconnecting with our inner self.",
      keyPointsVi: ['Phân tích quá khứ vs Hiện tại', 'Câu điều kiện loại 3 (Had we not...)', 'Đúc kết triết lý sống'],
    },
  },
  {
    id: 'ladder-2',
    topic: 'Technological Innovation / AI in Education',
    part: 3,
    questionText: 'How has artificial intelligence changed the way students study nowadays?',
    recommendedVocab: [
      {
        word: 'paradigm shift',
        phonetic: '/ˈpær.ə.daɪm ʃɪft/',
        meaningVi: 'Bước chuyển biến mang tính bước ngoặt',
        level: 'C2',
        collocation: 'trigger a massive paradigm shift',
      },
      {
        word: 'tailored learning experience',
        phonetic: '/ˈteɪ.ləd ˈlɜː.nɪŋ/',
        meaningVi: 'Trải nghiệm học tập được cá nhân hóa',
        level: 'C1',
        collocation: 'deliver a tailored learning experience',
      },
      {
        word: 'double-edged sword',
        phonetic: '/ˌdʌb.əl.edʒd ˈsɔːd/',
        meaningVi: 'Con dao hai lưỡi (Vừa lợi vừa hại)',
        level: 'C2 Idiom',
        collocation: 'acts as a double-edged sword',
      },
    ],
    level1Guide: {
      targetDuration: '30s',
      targetSeconds: 30,
      goalVi: 'Khởi động 30s: Trả lời trực diện rằng AI đã cá nhân hóa việc học và giúp tiết kiệm thời gian tra cứu.',
      starterTemplate: "In my view, artificial intelligence has fundamentally revolutionized education by...",
      sampleBand7Response: "In my view, artificial intelligence has fundamentally revolutionized education by providing instant personalized feedback. Instead of waiting days for teachers to grade assignments, students can now receive tailored explanations within seconds.",
      keyPointsVi: ['Luận điểm chính (Cá nhân hóa)', 'Lợi ích tốc độ'],
    },
    level2Guide: {
      targetDuration: '60s',
      targetSeconds: 60,
      goalVi: 'Phát triển 60s: Đưa ra ví dụ thực tế về việc học ngoại ngữ hoặc tự học lập trình, phân tích hiệu suất học tập tăng vọt.',
      starterTemplate: "To illustrate this point specifically, take language learning as a prime example...",
      sampleBand7Response: "In my view, artificial intelligence has fundamentally revolutionized education by providing instant personalized feedback. Instead of waiting days for teachers to grade assignments, students can now receive tailored explanations within seconds. To illustrate this point specifically, take English speaking practice as a prime example. AI tools can analyze pronunciation nuances and grammar errors in real time, which allows learners to overcome their hesitation without feeling self-conscious.",
      keyPointsVi: ['Ví dụ học tiếng Anh', 'Tác động tâm lý (giảm tự ti)'],
    },
    level3Guide: {
      targetDuration: '90s - 120s',
      targetSeconds: 90,
      goalVi: 'Bùng nổ 90-120s: Phân tích mặt trái (con dao hai lưỡi - nguy cơ mất tính tư duy độc lập) và kết luận giải pháp cân bằng trong tương lai.',
      starterTemplate: "Having said that, we cannot overlook the fact that AI is somewhat of a double-edged sword...",
      sampleBand7Response: "In my view, artificial intelligence has fundamentally revolutionized education by providing instant personalized feedback. Instead of waiting days for teachers to grade assignments, students can now receive tailored explanations within seconds. To illustrate this point specifically, take language learning as a prime example, where learners can interact with AI examiners around the clock. Having said that, we cannot overlook the fact that AI is somewhat of a double-edged sword. If students become excessively reliant on automated solutions, their critical thinking skills might gradually erode. Therefore, moving forward, the ideal approach is human-AI synergy, where technology serves as a facilitator rather than a total replacement for human teachers.",
      keyPointsVi: ['Mặt trái & Nguy cơ thụ động', 'Từ vựng C2 (synergy, erode)', 'Giải pháp tương lai'],
    },
  },
  {
    id: 'ladder-3',
    topic: 'An inspiring person you admire',
    part: 2,
    questionText: 'Describe a person who has inspired you to work hard or achieve a goal.',
    cueCardPoints: [
      'Who this person is and how you know them',
      'What qualities they possess',
      'How they influenced your mindset and actions',
    ],
    recommendedVocab: [
      {
        word: 'unwavering perseverance',
        phonetic: '/ʌnˈweɪ.vər.ɪŋ ˌpɜː.sɪˈvɪə.rəns/',
        meaningVi: 'Sự kiên trì bền bỉ không lay chuyển',
        level: 'C2 Collocation',
        collocation: 'demonstrate unwavering perseverance',
      },
      {
        word: 'role model',
        phonetic: '/ˈrəʊl ˌmɒd.əl/',
        meaningVi: 'Hình mẫu lý tưởng',
        level: 'B2',
        collocation: 'serve as an exemplary role model',
      },
      {
        word: 'instill in me a passion',
        phonetic: '/ɪnˈstɪl/',
        meaningVi: 'Thấm nhuần/truyền lửa đam mê cho tôi',
        level: 'C1',
        collocation: 'instill in me a lifelong passion for excellence',
      },
    ],
    level1Guide: {
      targetDuration: '30s',
      targetSeconds: 30,
      goalVi: 'Khởi động 30s: Giới thiệu người đó là ai (người thân/thầy cô/mentor) và phẩm chất nổi bật nhất.',
      starterTemplate: "When it comes to someone who has profoundly influenced my life, I immediately think of...",
      sampleBand7Response: "When it comes to someone who has profoundly influenced my life, I immediately think of my high school English teacher. What I admire most about her is her unwavering dedication to helping every single student thrive.",
      keyPointsVi: ['Người được chọn', 'Phẩm chất đáng nể'],
    },
    level2Guide: {
      targetDuration: '60s',
      targetSeconds: 60,
      goalVi: 'Phát triển 60s: Kể lại 1 kỷ niệm cụ thể khi bạn gặp khó khăn và người ấy đã động viên/hướng dẫn bạn vượt qua.',
      starterTemplate: "I vividly remember a time during my senior year when I was struggling immensely with...",
      sampleBand7Response: "When it comes to someone who has profoundly influenced my life, I immediately think of my high school English teacher. What I admire most about her is her unwavering dedication. I vividly remember a time during my senior year when I was struggling immensely with public speaking and felt like giving up. Instead of criticizing my mistakes, she spent extra hours after class to coach me on intonation and self-confidence, which completely transformed my fear into passion.",
      keyPointsVi: ['Kỷ niệm khó khăn thời học sinh', 'Sự hỗ trợ tận tình'],
    },
    level3Guide: {
      targetDuration: '90s - 120s',
      targetSeconds: 90,
      goalVi: 'Bùng nổ 90-120s: Phân tích tác động lâu dài đến đạo đức làm việc hiện tại và bài học bạn muốn truyền lại cho thế hệ sau.',
      starterTemplate: "To this day, the principles she instilled in me continue to shape the way I tackle challenges...",
      sampleBand7Response: "When it comes to someone who has profoundly influenced my life, I immediately think of my high school English teacher. What I admire most about her is her unwavering dedication. I vividly remember a time when I struggled immensely with public speaking. Instead of criticizing me, she spent extra hours coaching me, which completely transformed my fear into passion. To this day, the principles she instilled in me continue to shape the way I tackle challenges in both my academic and professional endeavors. Whenever I encounter a formidable obstacle, her voice reminds me that persistence invariably triumphs over adversity. Ultimately, she is not just an educator, but a true lifelong compass.",
      keyPointsVi: ['Tác động đến công việc hiện tại', 'Châm ngôn sống C2 (persistence triumphs)', 'Kết bài ẩn dụ sâu sắc'],
    },
  },
];

export const ProgressiveSpeechLadder: React.FC<ProgressiveSpeechLadderProps> = ({
  words = [],
  activeSet,
  onBack,
  onOpenEmergencyStalling,
  onOpenAreaExpander,
  onStartPracticeInMock,
}) => {
  // Navigation & Selected Prompt
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<SpeechLadderLevel>(1);
  const [unlockedLevels, setUnlockedLevels] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({
    1: true,
    2: false,
    3: false,
  });

  // Candidate transcripts across the 3 levels for comparative diffing
  const [levelTranscripts, setLevelTranscripts] = useState<{
    1: string;
    2: string;
    3: string;
  }>({
    1: '',
    2: '',
    3: '',
  });

  // Recording & Timer states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<SpeechLadderEvaluationResult | null>(null);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);

  // Active prompt
  const currentPrompt = SPEECH_LADDER_PROMPTS[selectedPromptIndex];

  // Speech Recognition & Timer refs
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Get current level guide details
  const getLevelGuide = (lvl: SpeechLadderLevel) => {
    if (lvl === 1) return currentPrompt.level1Guide;
    if (lvl === 2) return currentPrompt.level2Guide;
    return currentPrompt.level3Guide;
  };

  const activeGuide = getLevelGuide(currentLevel);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  // Handle Switch Level
  const handleSelectLevel = (lvl: SpeechLadderLevel) => {
    if (!unlockedLevels[lvl]) {
      sounds.playWrong();
      return;
    }
    sounds.playClick();
    setCurrentLevel(lvl);
    setLiveTranscript(levelTranscripts[lvl] || '');
    setEvaluationResult(null);
    setRecordingSeconds(0);
  };

  // Start Recording with Web Speech Recognition
  const startRecording = () => {
    sounds.playStart();
    setIsRecording(true);
    setRecordingSeconds(0);
    setLiveTranscript('');
    setEvaluationResult(null);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(text);
      };

      recognitionRef.current = recognizer;
      try {
        recognizer.start();
      } catch (_) {}
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  // Evaluate Level with Gemini AI
  const handleEvaluateCurrentLevel = async () => {
    if (!liveTranscript.trim()) {
      sounds.playWrong();
      return;
    }

    sounds.playClick();
    setIsEvaluating(true);

    try {
      const prevTranscript =
        currentLevel === 2
          ? levelTranscripts[1]
          : currentLevel === 3
          ? levelTranscripts[2]
          : '';

      const evalData = await evaluateSpeechLadderStep({
        question: currentPrompt.questionText,
        level: currentLevel,
        targetDurationSeconds: activeGuide.targetSeconds,
        userTranscript: liveTranscript,
        spokenDurationSeconds: Math.max(recordingSeconds, 15),
        previousLevelTranscript: prevTranscript,
        targetVocab: currentPrompt.recommendedVocab,
      });

      setEvaluationResult(evalData);
      setLevelTranscripts((prev) => ({
        ...prev,
        [currentLevel]: liveTranscript,
      }));

      // Unlock next level if passed
      if (evalData.passedLevel || evalData.bandEstimate >= 6.0) {
        sounds.playLevelUp();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (currentLevel === 1) {
          setUnlockedLevels((prev) => ({ ...prev, 2: true }));
        } else if (currentLevel === 2) {
          setUnlockedLevels((prev) => ({ ...prev, 3: true }));
        }
      } else {
        sounds.playCorrect();
      }
    } catch (err: any) {
      console.error(err);
      sounds.playWrong();
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    sounds.playClick();
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleApplyNextLevelDraft = (draft: string) => {
    const nextLvl = (Math.min(3, currentLevel + 1) as SpeechLadderLevel);
    if (!unlockedLevels[nextLvl]) {
      setUnlockedLevels((prev) => ({ ...prev, [nextLvl]: true }));
    }
    setCurrentLevel(nextLvl);
    setLiveTranscript(draft);
    setLevelTranscripts((prev) => ({ ...prev, [nextLvl]: draft }));
    setEvaluationResult(null);
    sounds.playLevelUp();
  };

  return (
    <div className="max-w-[1520px] w-full mx-auto space-y-6 pb-28 animate-fadeIn">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#151D2A] p-4 sm:p-6 rounded-3xl border border-[#2D333B] shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                Progressive Speech Ladder
              </span>
              <span className="text-xs text-[#8E97A4]">Luyện Nói Tăng Tiến 3 Nấc Thang</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              🎯 Luyện Nói Tăng Tiến (30s ➔ 60s ➔ 90s - 120s)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AccentSwitcher compact={true} />
          {onOpenEmergencyStalling && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenEmergencyStalling();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Phao Cứu Sinh Khi Bí Ý 🛡️</span>
            </button>
          )}
        </div>
      </div>

      {/* Intro Box for Overwhelmed / Introvert Candidates */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#151D2A] to-yellow-950/30 p-5 rounded-3xl border border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-300">
              Giải Pháp Chống Choáng Ngợp: Đừng Ép Mình Nói 2 Phút Ngay Từ Đầu!
            </h4>
            <p className="text-xs text-[#8E97A4] leading-relaxed">
              Hãy chinh phục từng nấc: <strong>Nấc 1 (30s)</strong> giải phóng tâm lý, <strong>Nấc 2 (60s)</strong> đắp thêm mốc thời gian & cảm xúc, <strong>Nấc 3 (90s - 120s)</strong> bùng nổ lập luận sâu và từ vựng C1/C2!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Micro-Turn ➔ Master Turn
          </span>
        </div>
      </div>

      {/* Select Topic Bar */}
      <div className="space-y-2">
        <span className="text-xs font-black text-[#8E97A4] uppercase tracking-wider flex items-center gap-1.5 px-1">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Chọn Đề Tài Luyện Tập Tăng Tiến:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SPEECH_LADDER_PROMPTS.map((prompt, idx) => {
            const isSelected = selectedPromptIndex === idx;
            return (
              <button
                key={prompt.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedPromptIndex(idx);
                  setCurrentLevel(1);
                  setEvaluationResult(null);
                  setLiveTranscript('');
                }}
                className={`p-4 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#2D2111] to-[#1C160B] border-amber-500 text-white shadow-xl ring-1 ring-amber-500/50'
                    : 'bg-[#151D2A] border-[#2D333B] text-[#8E97A4] hover:bg-[#1E2635] hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Part {prompt.part}
                    </span>
                    <span className="text-gray-400">Đề #{idx + 1}</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                    {prompt.topic}
                  </h4>
                </div>
                <div className="text-[11px] text-gray-400 mt-2 line-clamp-1 italic font-mono">
                  "{prompt.questionText}"
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Question Box */}
      <div className="bg-[#151D2A] p-6 rounded-3xl border border-amber-500/40 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D333B] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Chủ đề Part {currentPrompt.part}: {currentPrompt.topic}
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              speakWord(currentPrompt.questionText);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-amber-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Nghe câu hỏi</span>
          </button>
        </div>

        <h2 className="text-lg sm:text-xl font-black text-white leading-relaxed">
          "{currentPrompt.questionText}"
        </h2>

        {/* Cue card points if any */}
        {currentPrompt.cueCardPoints && (
          <div className="bg-[#101520] p-4 rounded-2xl border border-[#2D333B] space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Gợi ý triển khai (You should say):
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {currentPrompt.cueCardPoints.map((pt, pIdx) => (
                <li
                  key={pIdx}
                  className="text-xs text-gray-300 flex items-start gap-1.5 bg-[#151D2A] p-2.5 rounded-xl border border-[#2D333B]"
                >
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Band 8 Collocations */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Từ vựng & Collocations C1/C2 khuyên dùng cho bài nói này:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {currentPrompt.recommendedVocab.map((voc, vIdx) => (
              <div
                key={vIdx}
                onClick={() => {
                  sounds.playClick();
                  speakWord(voc.word);
                }}
                className="p-3 rounded-2xl bg-[#101520] hover:bg-[#1A2333] border border-[#2D333B] hover:border-emerald-500/40 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-emerald-300 group-hover:text-white">
                    {voc.word}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {voc.level}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">{voc.meaningVi}</div>
                <div className="text-[10px] text-gray-500 italic line-clamp-1">
                  "{voc.collocation}"
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-STEP LADDER PROGRESS BAR TABS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Level 1: 30s */}
        <button
          onClick={() => handleSelectLevel(1)}
          className={`p-4 rounded-3xl border transition-all text-left flex items-start justify-between cursor-pointer ${
            currentLevel === 1
              ? 'bg-gradient-to-br from-emerald-950/60 to-[#151D2A] border-emerald-500 shadow-xl ring-2 ring-emerald-500/40 scale-[1.02]'
              : 'bg-[#151D2A] border-[#2D333B] hover:bg-[#1E2635]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs flex items-center justify-center border border-emerald-500/40">
                1
              </span>
              <span className="text-xs font-black text-white">Nấc 1: Khởi Động 30s</span>
            </div>
            <p className="text-[11px] text-[#8E97A4] line-clamp-1">
              Micro-Turn (1 Ý chính + 1 Giải thích)
            </p>
          </div>
          <div className="shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </button>

        {/* Level 2: 60s */}
        <button
          onClick={() => handleSelectLevel(2)}
          className={`p-4 rounded-3xl border transition-all text-left flex items-start justify-between cursor-pointer ${
            currentLevel === 2
              ? 'bg-gradient-to-br from-blue-950/60 to-[#151D2A] border-blue-500 shadow-xl ring-2 ring-blue-500/40 scale-[1.02]'
              : 'bg-[#151D2A] border-[#2D333B] hover:bg-[#1E2635]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 font-mono font-black text-xs flex items-center justify-center border border-blue-500/40">
                2
              </span>
              <span className="text-xs font-black text-white">Nấc 2: Phát Triển 60s</span>
            </div>
            <p className="text-[11px] text-[#8E97A4] line-clamp-1">
              Story Builder (Thời gian + Cảm xúc)
            </p>
          </div>
          <div className="shrink-0">
            {unlockedLevels[2] ? (
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            ) : (
              <Lock className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>

        {/* Level 3: 90s - 120s */}
        <button
          onClick={() => handleSelectLevel(3)}
          className={`p-4 rounded-3xl border transition-all text-left flex items-start justify-between cursor-pointer ${
            currentLevel === 3
              ? 'bg-gradient-to-br from-purple-950/60 to-[#151D2A] border-purple-500 shadow-xl ring-2 ring-purple-500/40 scale-[1.02]'
              : 'bg-[#151D2A] border-[#2D333B] hover:bg-[#1E2635]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 font-mono font-black text-xs flex items-center justify-center border border-purple-500/40">
                3
              </span>
              <span className="text-xs font-black text-white">Nấc 3: Bùng Nổ 90-120s</span>
            </div>
            <p className="text-[11px] text-[#8E97A4] line-clamp-1">
              Master Long Turn (So sánh + Đúc kết)
            </p>
          </div>
          <div className="shrink-0">
            {unlockedLevels[3] ? (
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            ) : (
              <Lock className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* CURRENT LEVEL INTERACTIVE WORKBENCH */}
      {/* ========================================================================= */}
      <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-6">
        {/* Level Guide Banner */}
        <div className="bg-[#101520] p-5 rounded-2xl border border-[#2D333B] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                Mục tiêu: {activeGuide.targetDuration} ({activeGuide.targetSeconds} giây)
              </span>
              <span className="text-xs font-bold text-gray-300">
                {currentLevel === 1 ? 'Khởi động Micro-Turn' : currentLevel === 2 ? 'Phát triển Story Builder' : 'Bùng nổ Master Long Turn'}
              </span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                speakWord(activeGuide.sampleBand7Response);
              }}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Nghe bài mẫu Nấc {currentLevel} (Band 7.5+)</span>
            </button>
          </div>

          <p className="text-sm font-semibold text-white leading-relaxed">
            {activeGuide.goalVi}
          </p>

          {/* Key Checklist Points */}
          <div className="flex flex-wrap gap-2 pt-1">
            {activeGuide.keyPointsVi.map((kpt, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-[#151D2A] text-amber-200 border border-amber-500/30 flex items-center gap-1"
              >
                <Target className="w-3 h-3 text-amber-400" />
                {kpt}
              </span>
            ))}
          </div>

          {/* Sentence Starter Template */}
          <div className="pt-2 border-t border-[#2D333B] flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-gray-400 font-mono">
              Mẫu câu mở đầu gợi ý: <strong className="text-amber-300">"{activeGuide.starterTemplate}"</strong>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setLiveTranscript((prev) =>
                  prev ? prev + ' ' + activeGuide.starterTemplate : activeGuide.starterTemplate
                );
              }}
              className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Chèn mẫu câu mồi</span>
            </button>
          </div>
        </div>

        {/* Live Speaking / Transcript Workspace */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className={`w-4 h-4 ${isRecording ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
              Phòng Thu Âm Nấc {currentLevel} (Live Speech Input):
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Đã nói: <strong className="text-white">{recordingSeconds}s</strong> / {activeGuide.targetSeconds}s
              </span>
            </div>
          </div>

          {/* Progress bar toward target duration */}
          <div className="w-full h-2 bg-[#101520] rounded-full overflow-hidden border border-[#2D333B]">
            <div
              className={`h-full transition-all duration-300 ${
                recordingSeconds >= activeGuide.targetSeconds
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{
                width: `${Math.min(100, (recordingSeconds / activeGuide.targetSeconds) * 100)}%`,
              }}
            />
          </div>

          <textarea
            value={liveTranscript}
            onChange={(e) => setLiveTranscript(e.target.value)}
            rows={5}
            placeholder={`Bấm nút thu âm bên dưới để nói trong ${activeGuide.targetDuration}, hoặc gõ câu trả lời của bạn vào đây...`}
            className="w-full bg-[#101520] text-gray-100 placeholder-gray-500 p-4 rounded-2xl border border-[#2D333B] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm font-mono leading-relaxed"
          />

          {/* Action Buttons: Record & Evaluate */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Bắt Đầu Nói ({activeGuide.targetDuration}) 🎙️</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-2 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Dừng Thu Âm ({recordingSeconds}s)</span>
                </button>
              )}

              {liveTranscript && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    speakWord(liveTranscript);
                  }}
                  className="p-3 rounded-2xl bg-[#21262D] hover:bg-[#30363D] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
                  title="Nghe lại bài nói"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleEvaluateCurrentLevel}
              disabled={isEvaluating || !liveTranscript.trim()}
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl flex items-center gap-2 ${
                isEvaluating || !liveTranscript.trim()
                  ? 'bg-[#21262D] text-gray-500 cursor-not-allowed border border-[#2D333B]'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-950/60 scale-105'
              }`}
            >
              {isEvaluating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-black" />
                  <span>AI Đang Chấm Nấc {currentLevel}...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Chấm Điểm & Mở Khóa Nấc Tiếp Theo ➔</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* AI EVALUATION & STEP UPGRADE FEEDBACK */}
        {/* ========================================================================= */}
        {evaluationResult && (
          <div className="bg-[#101520] p-6 rounded-3xl border border-amber-500/40 space-y-6 animate-fadeIn">
            {/* Top Score Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2D333B] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-2xl flex items-center justify-center">
                  {evaluationResult.bandEstimate.toFixed(1)}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400">Đánh giá Nấc {evaluationResult.level}</div>
                  <h3 className="text-lg font-black text-white">
                    {evaluationResult.passedLevel
                      ? '🎉 Xuất Sắc! Bạn Đã Vượt Qua Nấc Này'
                      : '👍 Khá Tốt! Cần Đắp Thêm Ý Để Đạt Chỉ Tiêu'}
                  </h3>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#151D2A] text-gray-300 border border-[#2D333B]">
                  {evaluationResult.wordCount} từ
                </span>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {evaluationResult.wordsPerMinute} WPM
                </span>
              </div>
            </div>

            {/* Praise & Growth Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#151D2A] p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Điểm Cộng Đã Làm Tốt Ở Nấc Này:
                </span>
                <ul className="space-y-1.5">
                  {evaluationResult.praisePointsVi.map((pt, idx) => (
                    <li key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#151D2A] p-4 rounded-2xl border border-amber-500/30 space-y-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  Hướng Dẫn Đắp Thêm Ý Cho Nấc Sau:
                </span>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {evaluationResult.suggestedExpansionToNextLevel}
                </p>
              </div>
            </div>

            {/* Vocabulary Upgrades (Đắp thêm từ vựng xịn Band 8.5) */}
            {evaluationResult.vocabularyUpgrades && evaluationResult.vocabularyUpgrades.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Từ Vựng Nâng Cấp (Lexical Scaffolding):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {evaluationResult.vocabularyUpgrades.map((upg, idx) => (
                    <div
                      key={idx}
                      className="bg-[#151D2A] p-3.5 rounded-2xl border border-[#2D333B] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-red-400 line-through">"{upg.originalWordOrPhrase}"</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-emerald-300 font-black">"{upg.upgradedAlternative}"</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {upg.whyBetterVi}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scaffolded Draft for Next Level */}
            {currentLevel < 3 && evaluationResult.scaffoldedNextLevelDraftEn && (
              <div className="bg-gradient-to-br from-[#1C1A2E] to-[#121120] p-5 rounded-2xl border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    Bản Mẫu Đắp Thêm Ý Tự Động Cho Nấc {currentLevel + 1} ({getLevelGuide((currentLevel + 1) as SpeechLadderLevel).targetDuration}):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        speakWord(evaluationResult.scaffoldedNextLevelDraftEn);
                      }}
                      className="p-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-indigo-300 hover:text-white transition-colors cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopyDraft(evaluationResult.scaffoldedNextLevelDraftEn)}
                      className="p-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Sao chép"
                    >
                      {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-mono text-indigo-100 leading-relaxed bg-[#101520] p-4 rounded-xl border border-[#2D333B]">
                  "{evaluationResult.scaffoldedNextLevelDraftEn}"
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleApplyNextLevelDraft(evaluationResult.scaffoldedNextLevelDraftEn)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <span>Lấy bài này & Lên Nấc {currentLevel + 1} ➔</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
