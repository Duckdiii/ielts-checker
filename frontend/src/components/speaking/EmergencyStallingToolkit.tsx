import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Shield,
  LifeBuoy,
  Volume2,
  Mic,
  MicOff,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Flame,
  Zap,
  HelpCircle,
  BookOpen,
  VolumeX,
  RefreshCw,
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { StallingCategoryGroup, StallingPhraseItem, ContinuousSpeechMinigameQuestion } from '../../types';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { AccentSwitcher } from './AccentSwitcher';
import confetti from 'canvas-confetti';

interface EmergencyStallingProps {
  onBack: () => void;
  onOpenAreaExpander?: () => void;
  onStartPracticeInMock?: (questionText?: string) => void;
}

// 6 Core Categorized Academic Fillers & Emergency Stalling Phrases
export const STALLING_CATEGORY_GROUPS: StallingCategoryGroup[] = [
  {
    key: 'need_time_to_think',
    nameVi: '1. Cần 3-5 giây "câu giờ" suy nghĩ ý tưởng',
    nameEn: 'Buying 3-5 Seconds of Thinking Time',
    icon: '⏳',
    descriptionVi: 'Dùng ngay khi vừa nghe xong câu hỏi khó hoặc lạ để não có 3-5s tổng hợp ý mà giám khảo vẫn đánh giá cao sự tự nhiên.',
    phrases: [
      {
        id: 'st-1',
        phraseEn: "That's an intriguing question that I haven't contemplated in depth before...",
        meaningVi: 'Đó là một câu hỏi rất thú vị mà tôi chưa từng suy ngẫm sâu trước đây...',
        howToUseVi: 'Nói với giọng trầm ngâm tự nhiên để mua trọn 4 giây suy nghĩ luận điểm.',
        category: 'need_time_to_think',
        bandScore: 'Band 8.0+',
      },
      {
        id: 'st-2',
        phraseEn: "To be completely honest, off the top of my head, I'd say that...",
        meaningVi: 'Thành thật mà nói, ngay lập tức nảy ra trong đầu tôi, tôi sẽ nói rằng...',
        howToUseVi: 'Rất mượt mà cho cả Part 1 và Part 3 khi bạn muốn đưa ra trực giác đầu tiên.',
        category: 'need_time_to_think',
        bandScore: 'Band 8.0',
      },
      {
        id: 'st-3',
        phraseEn: "Well, that is quite a multi-faceted issue, but looking at the big picture...",
        meaningVi: 'À, đây là một vấn đề khá đa chiều, nhưng nhìn vào bức tranh toàn cảnh thì...',
        howToUseVi: 'Cực kỳ phù hợp cho các câu hỏi nghị luận xã hội Part 3.',
        category: 'need_time_to_think',
        bandScore: 'Band 8.5',
      },
      {
        id: 'st-4',
        phraseEn: "I've never really given that much thought until now, but if I had to speculate...",
        meaningVi: 'Tôi chưa bao giờ thực sự suy nghĩ nhiều về điều đó cho đến tận bây giờ, nhưng nếu phải phỏng đoán...',
        howToUseVi: 'Thể hiện sự chân thật và dùng cấu trúc điều kiện loại 2 ăn điểm ngữ pháp.',
        category: 'need_time_to_think',
        bandScore: 'Band 8.0+',
      },
    ],
  },
  {
    key: 'clarify_or_paraphrase_question',
    nameVi: '2. Khi nghe chưa rõ hoặc muốn xác nhận lại câu hỏi',
    nameEn: 'Clarifying & Paraphrasing the Prompt',
    icon: '🎯',
    descriptionVi: 'Thay vì nói "Sorry, repeat please", dùng các câu học thuật này để xác nhận ý mà không bị trừ điểm Fluency.',
    phrases: [
      {
        id: 'st-5',
        phraseEn: "If I understand your question correctly, you're asking whether...",
        meaningVi: 'Nếu tôi hiểu đúng câu hỏi của giám khảo, thầy/cô đang hỏi về việc liệu...',
        howToUseVi: 'Giúp bạn tự nhắc lại câu hỏi bằng từ ngữ của mình (Paraphrasing) để câu giờ.',
        category: 'clarify_or_paraphrase_question',
        bandScore: 'Band 8.0+',
      },
      {
        id: 'st-6',
        phraseEn: "Are you referring specifically to the short-term impact or the broader picture?",
        meaningVi: 'Giám khảo đang muốn đề cập cụ thể đến tác động ngắn hạn hay bức tranh rộng hơn?',
        howToUseVi: 'Làm hẹp phạm vi câu hỏi và thể hiện tư duy phản biện sắc bén.',
        category: 'clarify_or_paraphrase_question',
        bandScore: 'Band 8.5',
      },
      {
        id: 'st-7',
        phraseEn: "Just to clarify, do you mean in the context of our daily routine or on a macro level?",
        meaningVi: 'Để rõ hơn, ý giám khảo là trong bối cảnh đời sống hàng ngày hay ở tầm vĩ mô?',
        howToUseVi: 'Giúp chuyển hướng câu hỏi trừu tượng về trải nghiệm cá nhân gần gũi.',
        category: 'clarify_or_paraphrase_question',
        bandScore: 'Band 8.5',
      },
    ],
  },
  {
    key: 'no_prior_opinion',
    nameVi: '3. Khi gặp chủ đề hoàn toàn xa lạ (Chưa bao giờ làm/nghĩ)',
    nameEn: 'Handling Unfamiliar / Zero-Experience Topics',
    icon: '🤷‍♂️',
    descriptionVi: 'Cứu cánh khi gặp chủ đề về bảo tàng, hội họa, tiền ảo, không gian vũ trụ... mà bạn không có trải nghiệm thực tế.',
    phrases: [
      {
        id: 'st-8',
        phraseEn: "I have to admit, I'm certainly no expert in this domain, but from what I gather in the media...",
        meaningVi: 'Tôi phải thừa nhận tôi không phải là chuyên gia trong lĩnh vực này, nhưng theo những gì tôi nắm bắt được trên báo đài...',
        howToUseVi: 'Cho phép bạn chuyển sang kể về những gì đã thấy trên tin tức thay vì bản thân.',
        category: 'no_prior_opinion',
        bandScore: 'Band 8.0+',
      },
      {
        id: 'st-9',
        phraseEn: "Although I have never experienced this firsthand, I would imagine that...",
        meaningVi: 'Mặc dù tôi chưa từng trải nghiệm trực tiếp điều này, tôi có thể mường tượng rằng...',
        howToUseVi: 'Cụm từ "firsthand" và "I would imagine that" cứu bạn khỏi việc phải nói "I don\'t know".',
        category: 'no_prior_opinion',
        bandScore: 'Band 8.0',
      },
      {
        id: 'st-10',
        phraseEn: "To be frank, that's somewhat outside my wheelhouse, yet I suspect...",
        meaningVi: 'Thẳng thắn mà nói, điều đó hơi nằm ngoài sở trường của tôi, tuy nhiên tôi ngờ rằng...',
        howToUseVi: 'Thành ngữ "outside my wheelhouse" (Band 8.5 Idiom) cực kỳ tự nhiên.',
        category: 'no_prior_opinion',
        bandScore: 'Band 8.5',
      },
    ],
  },
  {
    key: 'pivot_or_alternative_view',
    nameVi: '4. Khi muốn "bẻ lái" hoặc lật lại góc nhìn khác',
    nameEn: 'Pivoting & Offering Alternative Perspectives',
    icon: '🔄',
    descriptionVi: 'Khi bạn đã nói hết ý 1 và không muốn im lặng, dùng câu nối này để mở sang khía cạnh 2 (Mặt trái, người khác nghĩ sao).',
    phrases: [
      {
        id: 'st-11',
        phraseEn: "On the flip side, if we look at it from an alternative perspective...",
        meaningVi: 'Ở một khía cạnh khác, nếu chúng ta nhìn nhận vấn đề từ một góc độ thay thế...',
        howToUseVi: 'Tự động mở ra thêm 20 giây nói về mặt đối lập mà không bị ngắt quãng.',
        category: 'pivot_or_alternative_view',
        bandScore: 'Band 8.0',
      },
      {
        id: 'st-12',
        phraseEn: "Having said that, there are definitely two sides to this coin...",
        meaningVi: 'Dẫu vậy, đồng xu này chắc chắn có hai mặt đối lập...',
        howToUseVi: 'Cụm từ chuyển ý C2 giúp câu trả lời trở nên cân bằng và sâu sắc.',
        category: 'pivot_or_alternative_view',
        bandScore: 'Band 8.5',
      },
      {
        id: 'st-13',
        phraseEn: "While that might hold true for the older generation, youngsters tend to take a completely different view...",
        meaningVi: 'Trong khi điều đó có thể đúng với thế hệ lớn tuổi, giới trẻ lại có xu hướng nhìn nhận hoàn toàn khác...',
        howToUseVi: 'Chiến thuật so sánh 2 thế hệ luôn luôn có ý để nói trong Part 3.',
        category: 'pivot_or_alternative_view',
        bandScore: 'Band 8.5',
      },
    ],
  },
  {
    key: 'struggling_for_word',
    nameVi: '5. Khi quên mất từ tiếng Anh (Bí từ giữa chừng)',
    nameEn: 'Recovering When You Forget an Exact Word',
    icon: '🆘',
    descriptionVi: 'Tuyệt đối KHÔNG im lặng hoặc nói tiếng Việt! Dùng các mẫu câu này để giám khảo đánh giá bạn có kỹ năng Circumlocution (Band 8).',
    phrases: [
      {
        id: 'st-14',
        phraseEn: "The exact terminology escapes me at the moment, but it is basically something that...",
        meaningVi: 'Thuật ngữ chính xác tạm thời tuột khỏi đầu tôi lúc này, nhưng về cơ bản nó là thứ mà...',
        howToUseVi: 'Thay vì ậm ừ "how to say", câu này biến sự cố quên từ thành màn biểu diễn từ vựng cao cấp.',
        category: 'struggling_for_word',
        bandScore: 'Band 8.5',
      },
      {
        id: 'st-15',
        phraseEn: "What's the word I'm looking for... ah yes, essentially it revolves around...",
        meaningVi: 'Từ tôi đang tìm kiếm là gì nhỉ... à đúng rồi, về bản chất nó xoay quanh...',
        howToUseVi: 'Rất đời thường, chứng minh bạn tự nhiên như người bản xứ đang tìm từ.',
        category: 'struggling_for_word',
        bandScore: 'Band 8.0',
      },
      {
        id: 'st-16',
        phraseEn: "To put it in layman's terms without getting too technical...",
        meaningVi: 'Nói theo cách bình dân dễ hiểu mà không quá thiên về kỹ thuật...',
        howToUseVi: 'Cho phép bạn giải thích bằng những từ vựng đơn giản hơn mà vẫn cực sang trọng.',
        category: 'struggling_for_word',
        bandScore: 'Band 8.5',
      },
    ],
  },
  {
    key: 'concluding_smoothly',
    nameVi: '6. Khi muốn chốt hạ câu trả lời mượt mà, không bị ngắt ngọn',
    nameEn: 'Smooth & Impactful Wrap-up Phrases',
    icon: '🏁',
    descriptionVi: 'Giúp bạn báo hiệu cho giám khảo là đã nói xong, tránh tình trạng nói xong cả 2 người cùng nhìn nhau im lặng khó xử.',
    phrases: [
      {
        id: 'st-17',
        phraseEn: "So, all in all, that pretty much encapsulates my stance on the matter.",
        meaningVi: 'Vì vậy, tóm lại, điều đó bao quát trọn vẹn quan điểm của tôi về vấn đề này.',
        howToUseVi: 'Từ "encapsulates" là C2 collocation đỉnh cao để chốt câu trả lời.',
        category: 'concluding_smoothly',
        bandScore: 'Band 8.5',
      },
      {
        id: 'st-18',
        phraseEn: "So yeah, that's the primary reason why I lean towards that perspective.",
        meaningVi: 'Vì vậy, đó chính là lý do chủ yếu tại sao tôi nghiêng về góc nhìn đó.',
        howToUseVi: 'Rất tự nhiên cho Part 1 sau khi bạn đã trình bày xong lý do.',
        category: 'concluding_smoothly',
        bandScore: 'Band 8.0',
      },
    ],
  },
];

// Minigame 30s Continuous Speech Questions
const MINIGAME_QUESTIONS: ContinuousSpeechMinigameQuestion[] = [
  {
    id: 'mg-1',
    topic: 'Daily Routine',
    question: 'What is your favorite part of the day and why?',
    requiredConnectors: ["To be completely honest", "The underlying reason", "For instance", "On the flip side"],
    challengeDurationSeconds: 30,
  },
  {
    id: 'mg-2',
    topic: 'Technology & Habits',
    question: 'How has social media changed the way we maintain friendships?',
    requiredConnectors: ["From my perspective", "A classic case in point", "Having said that", "Consequently"],
    challengeDurationSeconds: 30,
  },
  {
    id: 'mg-3',
    topic: 'Travel & Lifestyle',
    question: 'Do you prefer travelling solo or in a group of close friends?',
    requiredConnectors: ["It largely depends on", "What appeals to me most", "Take my recent trip as an example", "Looking ahead"],
    challengeDurationSeconds: 30,
  },
  {
    id: 'mg-4',
    topic: 'Work & Environment',
    question: 'Do you think remote working will become the dominant trend in future decades?',
    requiredConnectors: ["Without a shadow of a doubt", "Empirical evidence suggests", "On the other hand", "All in all"],
    challengeDurationSeconds: 30,
  },
];

export const EmergencyStallingToolkit: React.FC<EmergencyStallingProps> = ({
  onBack,
  onOpenAreaExpander,
  onStartPracticeInMock,
}) => {
  const [activeTab, setActiveTab] = useState<'phrase_vault' | 'minigame_30s' | 'bad_habits'>('phrase_vault');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('need_time_to_think');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Minigame 30s States
  const [currentMinigameIndex, setCurrentMinigameIndex] = useState(0);
  const [minigameState, setMinigameState] = useState<'ready' | 'running' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(30);
  const [silenceWarnings, setSilenceWarnings] = useState(0);
  const [usedConnectors, setUsedConnectors] = useState<string[]>([]);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [wpmSpeed, setWpmSpeed] = useState(0);

  // Audio recognition & silence detection
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const lastSoundTimeRef = useRef<number>(Date.now());

  const currentMinigameQ = MINIGAME_QUESTIONS[currentMinigameIndex];

  // Clean up
  useEffect(() => {
    return () => {
      stopMinigameChallenge();
    };
  }, []);

  const handleCopyPhrase = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    sounds.playClick();
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Start 30s Continuous Speech Minigame
  const startMinigameChallenge = () => {
    sounds.playStart();
    setMinigameState('running');
    setTimeLeft(30);
    setSilenceWarnings(0);
    setUsedConnectors([]);
    setSpeechTranscript('');
    lastSoundTimeRef.current = Date.now();

    // Start Timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleCompleteMinigame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Initialize Web Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event: any) => {
        lastSoundTimeRef.current = Date.now();
        let fullText = '';
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + ' ';
        }
        setSpeechTranscript(fullText);

        // Check connectors used
        const detected: string[] = [];
        currentMinigameQ.requiredConnectors.forEach((conn) => {
          if (fullText.toLowerCase().includes(conn.toLowerCase().slice(0, 8))) {
            if (!detected.includes(conn)) detected.push(conn);
          }
        });
        setUsedConnectors(detected);
      };

      recognitionRef.current = recognizer;
      try {
        recognizer.start();
      } catch (_) {}
    }

    // Silence Check Interval: If silence > 3 seconds, trigger warning
    silenceTimerRef.current = setInterval(() => {
      const silenceDuration = (Date.now() - lastSoundTimeRef.current) / 1000;
      if (silenceDuration >= 3.2) {
        sounds.playWarning();
        setSilenceWarnings((prev) => prev + 1);
        lastSoundTimeRef.current = Date.now(); // reset
      }
    }, 1000);
  };

  const handleCompleteMinigame = () => {
    stopMinigameChallenge();
    setMinigameState('completed');
    sounds.playLevelUp();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const stopMinigameChallenge = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  const handleResetMinigame = () => {
    stopMinigameChallenge();
    setMinigameState('ready');
    setTimeLeft(30);
    setSpeechTranscript('');
    setUsedConnectors([]);
    setSilenceWarnings(0);
  };

  const activeCategory = STALLING_CATEGORY_GROUPS.find((g) => g.key === selectedCategoryKey) || STALLING_CATEGORY_GROUPS[0];

  return (
    <div className="relative w-full min-h-[calc(100vh-100px)] py-3 px-3 sm:px-6 lg:px-8">
      {/* Subtle Background Gradient Accents to fill empty side space on wide screens */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-28 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-rose-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-24 -left-36 w-72 h-72 bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-36 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-amber-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-28 -right-36 w-80 h-80 bg-indigo-500/6 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1520px] w-full mx-auto space-y-6 pb-24 animate-fadeIn">
        {/* Top Navigation Bar */}
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
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 uppercase tracking-wider">
                <LifeBuoy className="w-3.5 h-3.5" />
                Emergency Lifesaver
              </span>
              <span className="text-xs text-[#8E97A4]">Chữa Bệnh Im Lặng & Bí Từ</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              🛡️ Bộ Phao Cứu Sinh Khi "Bí Ý / Đứng Hình" (Academic Fillers)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AccentSwitcher compact={true} />
          {onOpenAreaExpander && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAreaExpander();
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Khung Mở Rộng A.R.E.A ➔</span>
            </button>
          )}
        </div>
      </div>

      {/* Psychological Intro for Introverts */}
      <div className="bg-gradient-to-r from-red-950/40 via-[#151D2A] to-rose-950/30 p-5 rounded-3xl border border-red-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-red-300">
              Quy Tắc Vàng: Trong IELTS Speaking, Im Lặng Quá 3 Giây Là Bị Trừ Điểm!
            </h4>
            <p className="text-xs text-[#8E97A4] leading-relaxed">
              Người bản xứ khi bí ý không im lặng mà dùng các cụm từ <strong>"Câu Giờ Học Thuật" (Buying-time Phrases)</strong>. Chúng giúp bạn mua 3-5 giây để suy nghĩ, xóa bỏ hoàn toàn từ đệm ngô nghê <em>"um, ah, like, you know"</em> và ghi điểm Lexical Resource Band 8.0+!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            0% Dead Silence
          </span>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            +3.5s Thinking Time
          </span>
        </div>
      </div>

      {/* 3 Main View Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('phrase_vault');
          }}
          className={`p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'phrase_vault'
              ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-950/50 scale-[1.01]'
              : 'bg-[#151D2A] text-[#8E97A4] hover:text-white border-[#2D333B] hover:bg-[#1E2635]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Kho Cụm Từ Câu Giờ (6 Tình Huống) 📚</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('minigame_30s');
          }}
          className={`p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'minigame_30s'
              ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-950/50 scale-[1.01]'
              : 'bg-[#151D2A] text-[#8E97A4] hover:text-white border-[#2D333B] hover:bg-[#1E2635]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>2. Minigame: Nói Không Ngắt Quãng 30s ⏱️</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('bad_habits');
          }}
          className={`p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'bad_habits'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/50 scale-[1.01]'
              : 'bg-[#151D2A] text-[#8E97A4] hover:text-white border-[#2D333B] hover:bg-[#1E2635]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>3. Bảng Khử Từ Đệm Xấu (Anti-Fillers) 🚫</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CATEGORIZED PHRASE VAULT (KHO CỤM TỪ CÂU GIỜ THEO TÌNH HUỐNG) */}
      {/* ========================================================================= */}
      {activeTab === 'phrase_vault' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 6 Category Buttons (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            <span className="text-xs font-black text-[#8E97A4] uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Layers className="w-3.5 h-3.5 text-red-400" />
              Chọn Tình Huống Bạn Thường Gặp Sự Cố:
            </span>
            {STALLING_CATEGORY_GROUPS.map((group) => {
              const isSelected = selectedCategoryKey === group.key;
              return (
                <button
                  key={group.key}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCategoryKey(group.key);
                  }}
                  className={`w-full p-4 rounded-2xl text-left transition-all cursor-pointer border flex items-center justify-between group ${
                    isSelected
                      ? 'bg-gradient-to-r from-red-600/20 to-[#1A2230] border-red-500 text-white shadow-lg ring-1 ring-red-500/50'
                      : 'bg-[#151D2A] border-[#2D333B] text-[#8E97A4] hover:bg-[#1E2635] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{group.icon}</span>
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-red-300 transition-colors">
                        {group.nameVi}
                      </div>
                      <div className="text-[10px] text-[#8E97A4] line-clamp-1 mt-0.5 font-mono">
                        {group.nameEn}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform shrink-0 ${
                      isSelected ? 'text-red-400 translate-x-1' : 'text-[#8E97A4]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Phrases List in Selected Category (7 cols) */}
          <div className="lg:col-span-7 bg-[#151D2A] p-6 rounded-3xl border border-red-500/30 shadow-2xl space-y-4">
            <div className="border-b border-[#2D333B] pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base">{activeCategory.icon}</span>
                  {activeCategory.nameVi}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
                  {activeCategory.phrases.length} Cụm Từ Chuẩn Band 8.5
                </span>
              </div>
              <p className="text-xs text-[#8E97A4] leading-relaxed">
                {activeCategory.descriptionVi}
              </p>
            </div>

            {/* Phrase Cards */}
            <div className="space-y-3">
              {activeCategory.phrases.map((phrase) => {
                const isCopied = copiedId === phrase.id;
                return (
                  <div
                    key={phrase.id}
                    className="p-4 rounded-2xl bg-[#101520] border border-[#2D333B] hover:border-red-500/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                            {phrase.bandScore}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            +3.5s Suy nghĩ
                          </span>
                        </div>
                        <p className="text-sm font-black text-white font-mono leading-relaxed group-hover:text-red-200 transition-colors">
                          "{phrase.phraseEn}"
                        </p>
                        <p className="text-xs text-gray-400 italic">
                          Dịch: {phrase.meaningVi}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            speakWord(phrase.phraseEn);
                          }}
                          className="p-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-red-300 hover:text-white transition-colors cursor-pointer"
                          title="Nghe phát âm chuẩn bản xứ"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyPhrase(phrase.id, phrase.phraseEn)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-[#21262D] hover:bg-[#30363D] text-[#8E97A4] hover:text-white border-transparent'
                          }`}
                          title="Sao chép"
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* How to use tip */}
                    <div className="pt-2 border-t border-[#2D333B] flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Cách dùng: {phrase.howToUseVi}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MINIGAME "NÓI KHÔNG NGẮT QUÃNG 30S" (FLUENCY CHALLENGE) */}
      {/* ========================================================================= */}
      {activeTab === 'minigame_30s' && (
        <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-6">
          {/* Header */}
          <div className="space-y-1 border-b border-[#2D333B] pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Thử Thách Phản Xạ 30 Giây Không Có Khoảng Lặng Chết
              </span>
              <span className="text-xs font-mono font-bold text-gray-400">
                Câu {currentMinigameIndex + 1}/{MINIGAME_QUESTIONS.length}
              </span>
            </div>
            <h3 className="text-xl font-black text-white">
              Duy Trì Luồng Âm Thanh Liên Tục Bằng Từ Nối Học Thuật!
            </h3>
            <p className="text-xs text-[#8E97A4]">
              Luật chơi: Bấm "Bắt Đầu", nói liên tục trong 30s. Nếu bạn im lặng quá 3 giây, hệ thống sẽ phát chuông cảnh báo 🚨 và trừ điểm độ trôi chảy!
            </p>
          </div>

          {/* Prompt Box */}
          <div className="bg-[#101520] p-5 rounded-2xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Chủ đề: {currentMinigameQ.topic}
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  speakWord(currentMinigameQ.question);
                }}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Nghe câu hỏi
              </button>
            </div>
            <p className="text-base sm:text-lg font-black text-white">
              "{currentMinigameQ.question}"
            </p>

            {/* Target Required Connectors Badges */}
            <div className="pt-2 border-t border-[#2D333B] space-y-2">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Nhiệm vụ: Chèn ít nhất 2 cụm từ nối này vào bài nói 30s:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentMinigameQ.requiredConnectors.map((conn, idx) => {
                  const isUsed = usedConnectors.includes(conn);
                  return (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
                        isUsed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 scale-105'
                          : 'bg-[#151D2A] text-gray-400 border-[#2D333B]'
                      }`}
                    >
                      {isUsed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-gray-500" />}
                      <span>"{conn}"</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Live Screen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Timer Metric */}
            <div className="bg-[#101520] p-4 rounded-2xl border border-[#2D333B] flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-lg ${
                timeLeft <= 5 ? 'bg-red-500/20 text-red-400 animate-ping' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {timeLeft}s
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400">Thời gian còn lại</div>
                <div className="text-sm font-black text-white">30s Thử thách</div>
              </div>
            </div>

            {/* Silence Violations Warning Metric */}
            <div className="bg-[#101520] p-4 rounded-2xl border border-[#2D333B] flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-lg ${
                silenceWarnings > 0 ? 'bg-red-500/30 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {silenceWarnings}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400">Số lần ngắt lặng (&gt;3s)</div>
                <div className={`text-xs font-black ${silenceWarnings === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {silenceWarnings === 0 ? 'Hoàn hảo! Không im lặng' : 'Bị ngập ngừng!'}
                </div>
              </div>
            </div>

            {/* Connectors hit metric */}
            <div className="bg-[#101520] p-4 rounded-2xl border border-[#2D333B] flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-black text-lg">
                {usedConnectors.length}/{currentMinigameQ.requiredConnectors.length}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400">Từ nối đã kích hoạt</div>
                <div className="text-xs font-black text-indigo-300">
                  {usedConnectors.length >= 2 ? 'Đạt chỉ tiêu ✅' : 'Cần thêm từ nối'}
                </div>
              </div>
            </div>
          </div>

          {/* Live Transcript Output */}
          <div className="bg-[#101520] p-4 rounded-2xl border border-[#2D333B] min-h-[90px] space-y-1">
            <span className="text-[11px] font-bold text-[#8E97A4] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Live Speech Transcript (Nhận diện giọng nói trực tiếp):
            </span>
            <p className="text-xs sm:text-sm font-mono text-gray-200 leading-relaxed">
              {speechTranscript || (
                <span className="text-gray-500 italic">
                  {minigameState === 'running' ? 'Đang lắng nghe... Hãy nói liên tục không ngừng!' : 'Bấm "Bắt Đầu 30s Nói Không Ngắt Quãng" bên dưới để kích hoạt mic.'}
                </span>
              )}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {minigameState === 'ready' && (
              <button
                onClick={startMinigameChallenge}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl shadow-amber-950/50 flex items-center gap-2 scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bắt Đầu 30s Nói Không Ngắt Quãng 🎙️</span>
              </button>
            )}

            {minigameState === 'running' && (
              <button
                onClick={handleCompleteMinigame}
                className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl flex items-center gap-2 animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn Thành Trước Hạn ({timeLeft}s)</span>
              </button>
            )}

            {minigameState === 'completed' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetMinigame}
                  className="px-5 py-3 rounded-2xl bg-[#21262D] hover:bg-[#30363D] text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Thử lại câu này</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playStart();
                    setCurrentMinigameIndex((prev) => (prev + 1) % MINIGAME_QUESTIONS.length);
                    handleResetMinigame();
                  }}
                  className="px-7 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <span>Câu tiếp theo ➔</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANTI-BAD-HABITS & FILLER ELIMINATION (BẢNG KHỬ TỪ ĐỆM XẤU) */}
      {/* ========================================================================= */}
      {activeTab === 'bad_habits' && (
        <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl space-y-6">
          <div className="space-y-1 border-b border-[#2D333B] pb-4">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Bảng Thay Thế Từ Đệm Ngô Nghê Bằng Cụm Từ Band 8.0+
            </span>
            <h3 className="text-xl font-black text-white">
              Tuyệt Đối Loại Bỏ Các Từ Đệm Khiến Bạn Bị Kẹt Ở Band 5.5
            </h3>
            <p className="text-xs text-[#8E97A4]">
              Trong kỳ thi IELTS Speaking, thói quen lặp lại "like, you know, ah, um" liên tục sẽ kéo tụt điểm Fluency xuống dưới 6.0. Hãy thay thế ngay bằng bảng đối chiếu chuẩn dưới đây:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                bad: 'Like... like...',
                whyBad: 'Lặp lại hơn 3 lần/câu chứng tỏ vốn từ vựng nghèo nàn và thiếu kiểm soát nhịp thở.',
                upgrades: [
                  'To illustrate this point specifically...',
                  'Such as, for example...',
                  'In a manner of speaking...',
                ],
              },
              {
                bad: 'You know / As you know...',
                whyBad: 'Giám khảo KHÔNG biết câu chuyện của bạn. Dùng từ này nghe thiếu tôn trọng và thiếu tính học thuật.',
                upgrades: [
                  'As is widely documented...',
                  'It is common knowledge that...',
                  'Speaking from widespread consensus...',
                ],
              },
              {
                bad: 'Um... Ah... (Im lặng 4 giây)',
                whyBad: 'Khoảng lặng chết (Dead Silence) khiến giám khảo nghĩ bạn không hiểu câu hỏi.',
                upgrades: [
                  "That's an intriguing angle to consider...",
                  "Off the top of my head, I'd say that...",
                  "Well, looking at it objectively...",
                ],
              },
              {
                bad: 'I don\'t know / No idea...',
                whyBad: 'Tuyệt đối KHÔNG ĐƯỢC đầu hàng trước bất kỳ câu hỏi nào trong phòng thi!',
                upgrades: [
                  "I'm certainly no expert in this domain, but from what I understand...",
                  "Although I haven't experienced this firsthand, I would imagine that...",
                  "That's somewhat outside my wheelhouse, yet I suspect...",
                ],
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[#101520] p-5 rounded-2xl border border-[#2D333B] hover:border-indigo-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#2D333B] pb-2.5">
                  <span className="text-xs font-black text-red-400 font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    ❌ Từ Cấm: "{item.bad}"
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                    Band 5.0 Penalty
                  </span>
                </div>

                <p className="text-[11px] text-[#8E97A4] leading-relaxed">
                  {item.whyBad}
                </p>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ✅ Cụm Thay Thế Band 8.0+:
                  </span>
                  <div className="space-y-1">
                    {item.upgrades.map((upg, uIdx) => (
                      <div
                        key={uIdx}
                        onClick={() => {
                          sounds.playClick();
                          speakWord(upg);
                        }}
                        className="p-2 rounded-xl bg-[#151D2A] hover:bg-[#1C2433] border border-[#2D333B] hover:border-emerald-500/40 text-xs font-mono text-emerald-200 flex items-center justify-between cursor-pointer group"
                      >
                        <span>"{upg}"</span>
                        <Volume2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
