import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Globe,
  Clock,
  Award,
  Coffee,
  CheckCircle2,
  Lightbulb,
  Sliders,
  BookOpen,
  Volume1,
  Flame,
} from 'lucide-react';
import { VocabItem, WordSet, UserProgress, ChatPersona, ChatMessage, CoffeeChatSessionRecap } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { sendCoffeeChatReply, getCoffeeChatRecap } from '../../services/geminiService';
import { VirtualAvatar, AvatarEmotion } from '../index';

interface DailyCoffeeChatModeProps {
  words: VocabItem[];
  allWords?: VocabItem[];
  activeSet: WordSet;
  progress: UserProgress;
  onBack: () => void;
  onRecordStudySession?: (wordsCount: number, correctCount: number) => void;
  onOpenPortfolio?: () => void;
}

// Preset gentle voice tones
const VOICE_TONE_PRESETS = [
  {
    id: 'soft_gentle',
    label: '🌸 Nhẹ Nhàng & Ấm Áp',
    en: 'Soft & Gentle',
    speed: 0.90,
    pitch: 1.05,
    description: 'Giọng êm ái, từ tốn, tạo cảm giác thư thái và thân thiện',
  },
  {
    id: 'natural_friendly',
    label: '☕ Tự Nhiên & Thân Mật',
    en: 'Natural & Friendly',
    speed: 0.96,
    pitch: 1.00,
    description: 'Giọng trò chuyện đời thường như hai người bạn uống cà phê',
  },
  {
    id: 'slow_calm',
    label: '🌙 Thư Giãn & Chậm Rãi',
    en: 'Calm & Slow',
    speed: 0.82,
    pitch: 0.98,
    description: 'Tốc độ chậm rãi, rõ từng nguyên âm, rất dễ nghe theo',
  },
  {
    id: 'upbeat_lively',
    label: '⚡ Hoạt Bát & Trẻ Trung',
    en: 'Lively & Upbeat',
    speed: 1.05,
    pitch: 1.10,
    description: 'Năng động, tươi vui và giàu năng lượng tích cực',
  },
];

const PERSONAS: ChatPersona[] = [
  {
    id: 'emma',
    name: 'Emma',
    avatar: '🌿',
    roleTitleVi: 'Bạn cùng phòng London (Giọng dịu dàng)',
    roleTitleEn: 'London Flatmate (Soft & Warm)',
    accent: 'UK',
    personalityVi: 'Nhẹ nhàng, ấm áp, giọng nói êm dịu, thích đọc sách, nghệ thuật và chia sẻ cảm xúc chân thành',
    descriptionVi: 'Emma sử dụng giọng Anh-Anh dịu dàng và từ tốn, mang đến không gian trò chuyện thư thái như đang ngồi thưởng trà.',
    starterTopic: 'Daily Life & Relaxation',
    starterGreeting: "Hello! It's so lovely to chat with you today. I was just making some herbal tea. How are you feeling today?",
    starterGreetingVi: 'Xin chào! Thật vui được trò chuyện cùng bạn hôm nay. Mình vừa mới pha chút trà thảo mộc. Hôm nay bạn cảm thấy thế nào?',
  },
  {
    id: 'alex',
    name: 'Alex',
    avatar: '☕',
    roleTitleVi: 'Bạn thân đại học',
    roleTitleEn: 'College Bestie',
    accent: 'US',
    personalityVi: 'Thân thiện, vui vẻ, cởi mở, dí dỏm và luôn biết cách lắng nghe',
    descriptionVi: 'Alex thích tán gẫu về đời sống hàng ngày, cà phê sáng, phim ảnh, âm nhạc và những trải nghiệm thú vị.',
    starterTopic: 'Daily Life & Chill',
    starterGreeting: "Hey there! Great to see you! How's your week been treating you so far? Grab a drink and let's catch up!",
    starterGreetingVi: 'Chào bạn! Vui quá khi gặp lại bạn! Tuần này của bạn thế nào rồi? Cùng lấy cốc nước rồi buôn chuyện chút nào!',
  },
  {
    id: 'hannah',
    name: 'Hannah',
    avatar: '🎨',
    roleTitleVi: 'Bạn tâm sự nghệ thuật',
    roleTitleEn: 'Creative Confidante',
    accent: 'UK',
    personalityVi: 'Lắng nghe chân thành, ấm áp, giọng nói nhẹ nhàng và sâu sắc',
    descriptionVi: 'Hannah là người bạn tuyệt vời để bạn thoải mái bộc bạch suy nghĩ, nói về cảm xúc và những sở thích đời thường.',
    starterTopic: 'Mindfulness & Passions',
    starterGreeting: "Hi! I'm really glad you stopped by. How's everything going with you lately? Anything special on your mind?",
    starterGreetingVi: 'Chào bạn! Mình rất vui vì bạn ghé qua. Dạo này mọi chuyện của bạn thế nào rồi? Có điều gì đặc biệt đang khiến bạn suy nghĩ không?',
  },
  {
    id: 'sarah',
    name: 'Sarah',
    avatar: '💼',
    roleTitleVi: 'Đồng nghiệp quốc tế',
    roleTitleEn: 'Global Teammate',
    accent: 'US',
    personalityVi: 'Năng động, lịch thiệp, hiện đại, thích chia sẻ về công việc và cân bằng cuộc sống',
    descriptionVi: 'Sarah giúp bạn luyện phản xạ giao tiếp tự nhiên trong môi trường làm việc toàn cầu và các cuộc trò chuyện giờ giải lao.',
    starterTopic: 'Work & Lifestyle',
    starterGreeting: "Hey! Glad we could take a short break together. How are things going with your day?",
    starterGreetingVi: 'Chào bạn! Vui quá khi chúng ta có chút thời gian nghỉ giải lao cùng nhau. Ngày hôm nay của bạn thế nào rồi?',
  },
  {
    id: 'liam',
    name: 'Liam',
    avatar: '🌏',
    roleTitleVi: 'Bạn đồng hành du lịch',
    roleTitleEn: 'Travel Explorer',
    accent: 'AU',
    personalityVi: 'Phóng khoáng, ấm áp, mê du lịch, thiên nhiên và ẩm thực',
    descriptionVi: 'Liam mang phong cách Úc hào sảng, thoải mái chia sẻ về các chuyến đi và những trải nghiệm mới lạ.',
    starterTopic: 'Travel & Adventures',
    starterGreeting: "G'day mate! Always great to connect. Any exciting plans or interesting thoughts on your mind recently?",
    starterGreetingVi: 'Chào bạn nhé! Thật tuyệt được trò chuyện. Dạo này bạn có kế hoạch hay suy nghĩ gì thú vị không?',
  },
];

const POPULAR_TOPICS = [
  { id: 'daily', label: '☕ Đời sống & Thói quen', en: 'Daily Life & Routines' },
  { id: 'entertainment', label: '🎬 Phim ảnh & Âm nhạc', en: 'Movies, Music & Pop Culture' },
  { id: 'travel', label: '✈️ Du lịch & Ẩm thực', en: 'Travel, Food & Culture' },
  { id: 'work', label: '💼 Công việc & Mục tiêu', en: 'Work, Career & Self-Growth' },
  { id: 'free', label: '💬 Tán gẫu tự do 1-1', en: 'Free Casual Chat' },
];

export const DailyCoffeeChatMode: React.FC<DailyCoffeeChatModeProps> = ({
  words,
  allWords = words,
  activeSet,
  progress,
  onBack,
  onRecordStudySession,
  onOpenPortfolio,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<ChatPersona>(PERSONAS[0]);
  const [selectedTopic, setSelectedTopic] = useState<string>(POPULAR_TOPICS[0].en);
  const [selectedTonePreset, setSelectedTonePreset] = useState<string>('soft_gentle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputSpeechText, setInputSpeechText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<AvatarEmotion>('idle');
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.90);
  const [speechPitch, setSpeechPitch] = useState<number>(1.05);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [showTranslations, setShowTranslations] = useState<{ [msgId: string]: boolean }>({});
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState<boolean>(false);
  const [recapData, setRecapData] = useState<CoffeeChatSessionRecap | null>(null);
  const [isLoadingRecap, setIsLoadingRecap] = useState<boolean>(false);

  // Recognition and synth refs
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Target vocabulary pool
  const targetWordTerms = (activeSet?.id === 'all-words-library' ? words : words.filter((w) => w.sourceSetId === activeSet?.id))
    .slice(0, 25)
    .map((w) => w.term);

  // Load available speech synthesis voices and categorize natural/soft ones
  useEffect(() => {
    const loadVoices = () => {
      if (!('speechSynthesis' in window)) return;
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);
    };

    loadVoices();
    if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Pick softest, gentle natural voice whenever persona changes
  useEffect(() => {
    if (availableVoices.length === 0) return;
    const accent = selectedPersona.accent;
    let targetLang = 'en-US';
    if (accent === 'UK') targetLang = 'en-GB';
    if (accent === 'AU') targetLang = 'en-AU';

    const isMale = selectedPersona.id === 'alex' || selectedPersona.id === 'liam';

    // Prioritize natural neural/soft voices (Google, Jenny, Sonia, Samantha, Victoria, Serena, Karen)
    const matchedVoice =
      availableVoices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const matchesLang = v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase());
        const isSoftVoice =
          nameLower.includes('natural') ||
          nameLower.includes('google') ||
          nameLower.includes('jenny') ||
          nameLower.includes('sonia') ||
          nameLower.includes('samantha') ||
          nameLower.includes('victoria') ||
          nameLower.includes('serena');
        const matchesGender = isMale
          ? nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('george') || nameLower.includes('ryan') || nameLower.includes('guy')
          : nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('susan') || nameLower.includes('hazel') || nameLower.includes('jenny') || nameLower.includes('samantha');
        return matchesLang && isSoftVoice && matchesGender;
      }) ||
      availableVoices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const matchesLang = v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase());
        const matchesGender = isMale
          ? nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('george')
          : nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('susan') || nameLower.includes('samantha');
        return matchesLang && matchesGender;
      }) ||
      availableVoices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase())) ||
      availableVoices[0];

    if (matchedVoice) {
      setSelectedVoiceURI(matchedVoice.voiceURI);
    }
  }, [selectedPersona, availableVoices]);

  // Apply Tone Preset
  const handleSelectTonePreset = (presetId: string) => {
    const preset = VOICE_TONE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedTonePreset(preset.id);
    setSpeechSpeed(preset.speed);
    setSpeechPitch(preset.pitch);
    sounds.playClick();
    speakAiText(`Hello! I'm speaking in a ${preset.en.toLowerCase()} voice now. How does this sound to you?`);
  };

  // Initialize Starter Greeting on persona change
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setIsAiSpeaking(false);
    setCurrentEmotion('idle');

    const starterMsg: ChatMessage = {
      id: 'starter-' + Date.now(),
      sender: 'assistant',
      text: selectedPersona.starterGreeting,
      timestamp: Date.now(),
      translationVi: selectedPersona.starterGreetingVi,
      suggestedResponses: [
        "I'm doing pretty well, thanks for asking! Just relaxing a bit.",
        "Honestly, I've had a busy day with work and studies!",
        "Pretty good! Tell me a bit about yourself too!",
      ],
    };
    setMessages([starterMsg]);
    setSessionStartTime(Date.now());
    setElapsedSeconds(0);

    if (autoPlayAudio) {
      setTimeout(() => {
        speakAiText(starterMsg.text);
      }, 400);
    }
  }, [selectedPersona]);

  // Live Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Helper to Speak AI text with chosen voice, speed, pitch
  const speakAiText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechSpeed;
    utterance.pitch = speechPitch;

    if (selectedVoiceURI) {
      const voice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsAiSpeaking(true);
      setCurrentEmotion('speaking');
    };

    utterance.onend = () => {
      setIsAiSpeaking(false);
      setCurrentEmotion('idle');
    };

    utterance.onerror = () => {
      setIsAiSpeaking(false);
      setCurrentEmotion('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Web Speech Recognition handler
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt chưa hỗ trợ nhận diện giọng nói Web Speech. Bạn có thể gõ trực tiếp vào ô chat bên dưới!');
      return;
    }

    try {
      window.speechSynthesis?.cancel();
      setIsAiSpeaking(false);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setCurrentEmotion('listening');
        sounds.playClick();
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setInputSpeechText(currentTranscript.trim());
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
        setCurrentEmotion('idle');
      };

      recognition.onend = () => {
        setIsRecording(false);
        setCurrentEmotion('idle');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Error starting recognition:', e);
      setIsRecording(false);
      setCurrentEmotion('idle');
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setCurrentEmotion('idle');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Send message to AI
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputSpeechText).trim();
    if (!text || isSending) return;

    if (isRecording) {
      stopSpeechRecognition();
    }

    sounds.playClick();
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputSpeechText('');
    setIsSending(true);
    setCurrentEmotion('thinking');

    try {
      const aiReply = await sendCoffeeChatReply({
        messages: newMessages.map((m) => ({ sender: m.sender, text: m.text })),
        persona: selectedPersona,
        topic: selectedTopic,
        targetWords: targetWordTerms,
      });

      // Update user message with native polish upgrade if provided
      if (aiReply.nativePolishUpgrade) {
        userMsg.nativePolishUpgrade = aiReply.nativePolishUpgrade;
        userMsg.detectedVocabWords = aiReply.detectedVocabWords;
      }

      const assistantMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: aiReply.replyText,
        timestamp: Date.now(),
        translationVi: aiReply.translationVi,
        suggestedResponses: aiReply.suggestedResponses,
        detectedVocabWords: aiReply.detectedVocabWords,
      };

      setMessages([...newMessages, assistantMsg]);
      sounds.playSuccess();

      // Emotion response
      if ((aiReply as any).emotion) {
        setCurrentEmotion((aiReply as any).emotion as AvatarEmotion);
      } else {
        setCurrentEmotion('speaking');
      }

      if (autoPlayAudio) {
        setTimeout(() => {
          speakAiText(assistantMsg.text);
        }, 150);
      }
    } catch (error: any) {
      console.error('Error in coffee chat:', error);
      
      const lower = text.toLowerCase().trim();
      let adaptiveReply = `That makes a lot of sense! Speaking of that, what's been on your mind the most lately?`;
      let adaptiveTrans = `Điều đó rất có lý! Nhân tiện nói về điều đó, dạo này điều gì đang khiến bạn suy nghĩ nhiều nhất?`;
      let emotion: AvatarEmotion = 'happy';

      if (lower === 'no' || lower === 'nope' || lower.startsWith('no,') || lower === 'not really') {
        adaptiveReply = `Haha fair enough! What would you prefer talking about or doing instead?`;
        adaptiveTrans = `Haha hợp lý luôn! Vậy bạn muốn nói về chủ đề gì hay làm gì khác nè?`;
        emotion = 'surprised';
      } else if (lower.includes('yourself') || lower.includes('who are you') || lower.includes('about you') || lower.includes('tell me all')) {
        adaptiveReply = `Well, I'm ${selectedPersona.name}! I love cozy spots, good music, and having relaxed chats like this. What about your favorite way to unwind?`;
        adaptiveTrans = `Mình là ${selectedPersona.name}! Mình rất thích những nơi ấm cúng, âm nhạc và những buổi trò chuyện thoải mái thế này. Còn bạn thích xả hơi bằng cách nào nhất?`;
        emotion = 'happy';
      } else if (lower.includes('tea') || lower.includes('black tea') || lower.includes('flavor') || lower.includes('milk') || lower.includes('drink')) {
        adaptiveReply = `Pure black tea is such a wonderful choice! I love that rich, authentic taste too. Do you usually drink it hot or iced?`;
        adaptiveTrans = `Trà đen nguyên chất thật sự là lựa chọn tuyệt vời! Mình cũng thích hương vị đậm đà nguyên bản đó. Bạn thường thích uống nóng hay lạnh?`;
        emotion = 'happy';
      } else if (lower.includes('hear me') || lower.includes('hello') || lower.includes('can you hear')) {
        adaptiveReply = `Yes, I hear you loud and clear! I'm right here with you. What were you saying?`;
        adaptiveTrans = `Có chứ, mình nghe bạn rất rõ ràng luôn nè! Mình vẫn đang ở đây cùng bạn. Bạn đang nói đến đoạn nào rồi?`;
        emotion = 'encouraging';
      } else if (lower.includes('tired') || lower.includes('busy') || lower.includes('work') || lower.includes('stress')) {
        adaptiveReply = `I completely understand, life can get pretty hectic! Make sure to take a good breather and relax today.`;
        adaptiveTrans = `Mình hoàn toàn hiểu, cuộc sống đôi khi thật bận rộn! Nhớ dành chút thời gian xả hơi và nghỉ ngơi hôm nay nhé.`;
        emotion = 'encouraging';
      } else if (lower.includes('coffee') || lower.includes('cafe')) {
        adaptiveReply = `Coffee really is a lifesaver! Are you more of an espresso person or do you like creamy lattes?`;
        adaptiveTrans = `Cà phê đúng là cứu tinh mỗi ngày luôn! Bạn là người thích espresso đậm vị hay thích các món latte béo ngậy hơn?`;
        emotion = 'happy';
      }

      const fallbackMsg: ChatMessage = {
        id: 'ai-fallback-' + Date.now(),
        sender: 'assistant',
        text: adaptiveReply,
        timestamp: Date.now(),
        translationVi: adaptiveTrans,
        suggestedResponses: [
          "I usually prefer having something warm and relaxing.",
          "I'm trying to balance my daily routine a bit better.",
          "Tell me more about what you like to do on weekends!",
        ],
      };
      setMessages([...newMessages, fallbackMsg]);
      setCurrentEmotion(emotion);
      if (autoPlayAudio) {
        speakAiText(fallbackMsg.text);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Generate Recap Session
  const handleFinishAndRecap = async () => {
    window.speechSynthesis?.cancel();
    setIsAiSpeaking(false);
    setIsLoadingRecap(true);
    setIsRecapModalOpen(true);
    sounds.playComplete();

    const userMsgs = messages.filter((m) => m.sender === 'user');
    const userWordsCount = userMsgs.reduce((acc, m) => acc + m.text.split(/\s+/).length, 0);
    const durationMin = Math.max(0.5, elapsedSeconds / 60);
    const approxWpm = Math.round(userWordsCount / durationMin);

    try {
      const recap = await getCoffeeChatRecap({
        messages: messages.map((m) => ({ sender: m.sender, text: m.text })),
        durationSeconds: elapsedSeconds,
        personaName: selectedPersona.name,
        topic: selectedTopic,
        approxWpm,
        userWordCount: userWordsCount,
      });

      setRecapData(recap);
      if (onRecordStudySession) {
        onRecordStudySession(userWordsCount, userMsgs.length);
      }
    } catch (e: any) {
      console.error('Failed to get recap:', e);
      setRecapData({
        durationSeconds: elapsedSeconds,
        totalTurns: userMsgs.length,
        userWordCount: userWordsCount,
        approxWpm,
        personaName: selectedPersona.name,
        topic: selectedTopic,
        overallCheerVi: 'Bạn đã có một buổi trò chuyện rất tự nhiên và thoải mái! Việc duy trì thói quen nói tiếng Anh tự do mỗi ngày sẽ giúp bạn phản xạ nhanh hơn rất nhiều.',
        fluencyScoreEstimate: 'Rất tích cực & Tự nhiên',
        highlightPhrases: [
          { phraseEn: 'Catch up', meaningVi: 'Gặp gỡ hàn huyên', context: 'Dùng trong rủ rê bạn bè' },
          { phraseEn: 'To be honest', meaningVi: 'Thành thật mà nói', context: 'Mở đầu chia sẻ cảm xúc tự nhiên' },
          { phraseEn: 'Take a breather', meaningVi: 'Nghỉ xả hơi một chút', context: 'Thay cho take a rest thông thường' },
        ],
        gentleTipsVi: [
          'Thử sử dụng thêm các từ nối tự nhiên như "You know", "Actually", "To be fair" để tạo nhịp điệu bản xứ.',
          'Đừng quá lo lắng về việc mắc lỗi ngữ pháp nhỏ, ưu tiên giữ mạch nói liên tục.',
        ],
        encouragingFeedbackVi: 'Chúc mừng bạn đã hoàn thành buổi nói chuyện hôm nay! Hãy tiếp tục duy trì 10-15 phút trò chuyện mỗi ngày nhé!',
      });
    } finally {
      setIsLoadingRecap(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-4 animate-fadeIn px-2 sm:px-4 pb-12">
      {/* 1. TOP HEADER & BAR */}
      <div className="bg-[#16191F] border border-[#2D333B] rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-[#21262E] hover:bg-[#282E37] text-slate-300 hover:text-white border border-[#30363D] transition-colors cursor-pointer"
              title="Quay lại Speaking Studio"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Coffee className="w-3.5 h-3.5" />
                  Phòng Trò Chuyện Tự Do 3D Avatar
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#21262E] text-emerald-400 font-bold border border-[#30363D] flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {formatTimer(elapsedSeconds)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                AI Daily Coffee Chat Lounge
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Trò chuyện trực tiếp cùng nhân vật ảo 3D • Luyện phản xạ tự nhiên không áp lực thi cử
              </p>
            </div>
          </div>

          {/* Quick Voice Settings & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Voice Config */}
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showVoiceSettings
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#21262E] text-slate-300 border-[#30363D] hover:text-white'
              }`}
              title="Tùy chỉnh giọng đọc & âm sắc"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Chỉnh Giọng AI</span>
            </button>

            {/* Auto Play Toggle */}
            <button
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
              title={autoPlayAudio ? 'Tự động phát giọng AI khi trả lời' : 'Tắt tự động phát âm'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                autoPlayAudio
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-[#21262E] text-slate-400 border-[#30363D]'
              }`}
            >
              {autoPlayAudio ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{autoPlayAudio ? 'Auto-Voice' : 'Mute'}</span>
            </button>

            {/* Finish & Recap */}
            <button
              onClick={handleFinishAndRecap}
              disabled={messages.length <= 1}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Award className="w-4 h-4" />
              <span>Tổng Kết Buổi Nói</span>
            </button>
          </div>
        </div>

        {/* Expandable Voice Settings Drawer */}
        {showVoiceSettings && (
          <div className="mt-4 p-4.5 rounded-3xl bg-[#121418] border border-[#2D333B] space-y-4 animate-fadeIn text-xs shadow-2xl">
            {/* Tone Presets Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chọn phong cách giọng điệu (Voice Style Preset):</span>
                </span>
                <span className="text-[11px] text-slate-400">Tự động tối ưu độ mềm mại & tốc độ</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VOICE_TONE_PRESETS.map((preset) => {
                  const isPresetActive = selectedTonePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectTonePreset(preset.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isPresetActive
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-400/50 shadow-md'
                          : 'bg-[#1C2128] border-[#30363D] text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{preset.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{preset.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Voice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#262A30]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <label className="text-slate-300 flex items-center gap-1">
                    <Volume1 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Giọng máy (Speech Voice):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      speakAiText(`Hello! This is a gentle, natural conversation test from ${selectedPersona.name}.`);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                  >
                    🔊 Nghe thử giọng
                  </button>
                </div>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => {
                    setSelectedVoiceURI(e.target.value);
                    const voice = availableVoices.find((v) => v.voiceURI === e.target.value);
                    if (voice) speakAiText(`Hello! I'm ${selectedPersona.name}. How are you feeling today?`);
                  }}
                  className="w-full bg-[#1C2128] text-white p-2.5 rounded-xl border border-[#30363D] focus:outline-hidden cursor-pointer text-xs"
                >
                  {availableVoices.map((v) => {
                    const isSoft =
                      v.name.toLowerCase().includes('natural') ||
                      v.name.toLowerCase().includes('google') ||
                      v.name.toLowerCase().includes('jenny') ||
                      v.name.toLowerCase().includes('samantha');
                    return (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {isSoft ? '🌸 ' : '🎙️ '}
                        {v.name} ({v.lang})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Tốc độ nói (Speed): {speechSpeed}x</span>
                  <span className="text-[10px] text-amber-400">
                    {speechSpeed <= 0.85 ? 'Rất chậm rãi' : speechSpeed <= 0.95 ? 'Nhẹ nhàng êm tai' : 'Bản xứ nhanh'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={speechSpeed}
                  onChange={(e) => {
                    setSelectedTonePreset('custom');
                    setSpeechSpeed(parseFloat(e.target.value));
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Cao độ âm sắc (Pitch): {speechPitch}</span>
                  <span className="text-[10px] text-amber-400">
                    {speechPitch >= 1.05 ? 'Ấm áp, dịu dàng' : 'Trầm, tự nhiên'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.25"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => {
                    setSelectedTonePreset('custom');
                    setSpeechPitch(parseFloat(e.target.value));
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Persona Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-4 pt-4 border-t border-[#262A30]">
          <div className="lg:col-span-8 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Bạn trò chuyện:
            </span>
            {PERSONAS.map((persona) => {
              const isSelected = selectedPersona.id === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedPersona(persona);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
                      : 'bg-[#21262E] border-[#30363D] text-slate-300 hover:bg-[#282E37] hover:text-white'
                  }`}
                >
                  <span className="text-base">{persona.avatar}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span>{persona.name}</span>
                      <span className="text-[10px] px-1 rounded bg-[#16191F] text-slate-400 font-mono">
                        {persona.accent}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">{persona.roleTitleVi}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-4 flex items-center gap-2 justify-end">
            <span className="text-xs font-bold text-slate-400 shrink-0">Chủ đề:</span>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-[#21262E] text-xs font-semibold text-white px-3 py-2 rounded-xl border border-[#30363D] focus:outline-hidden cursor-pointer w-full max-w-[240px]"
            >
              {POPULAR_TOPICS.map((t) => (
                <option key={t.id} value={t.en}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE LOUNGE (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (5 Cols): Virtual Avatar Stage */}
        <div className="lg:col-span-5 bg-[#16191F] rounded-3xl border border-[#2D333B] shadow-2xl p-5 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[580px]">
          {/* Ambient Lighting */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Badge on Stage */}
          <div className="w-full flex items-center justify-between text-xs relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Virtual Lounge • Live 1-on-1
              </span>
            </div>

            <button
              onClick={() => {
                if (messages.length > 0) {
                  const lastAiMsg = [...messages].reverse().find((m) => m.sender === 'assistant');
                  if (lastAiMsg) speakAiText(lastAiMsg.text);
                }
              }}
              className="p-1.5 rounded-xl bg-[#21262E] hover:bg-[#282E37] text-slate-300 hover:text-white border border-[#30363D] transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              title="Phát lại giọng nói của AI"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Nghe lại</span>
            </button>
          </div>

          {/* Center: Live 3D/Interactive Avatar Character */}
          <div className="py-4 relative z-10 my-auto">
            <VirtualAvatar
              persona={selectedPersona}
              emotion={currentEmotion}
              isSpeaking={isAiSpeaking}
              isListening={isRecording}
            />

            {/* Audio Waveform Effect */}
            <div className="mt-4 flex items-center justify-center gap-1.5 h-8">
              {[40, 70, 90, 60, 100, 50, 80, 60, 95, 45, 75, 30].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isAiSpeaking
                      ? 'bg-amber-400 animate-pulse'
                      : isRecording
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-[#2D333B]'
                  }`}
                  style={{
                    height: isAiSpeaking || isRecording ? `${Math.max(8, Number((h * 0.7).toFixed(0)))}px` : '6px',
                    animationDelay: `${i * 70}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Target Words Mini-Widget */}
          <div className="w-full bg-[#121418] p-3.5 rounded-2xl border border-[#262A30] text-left relative z-10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Từ vựng nên áp dụng ({targetWordTerms.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">Chạm để chèn</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {targetWordTerms.slice(0, 12).map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputSpeechText((prev) => (prev ? `${prev} ${term}` : term))}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-[#21262E] text-indigo-300 border border-[#30363D] hover:border-indigo-500 hover:bg-indigo-600/20 transition-all cursor-pointer"
                >
                  +{term}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Chat Dialogue & Input */}
        <div className="lg:col-span-7 bg-[#16191F] rounded-3xl border border-[#2D333B] shadow-2xl flex flex-col h-[600px] sm:h-[650px] overflow-hidden">
          {/* Chat Messages Feed */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              const isTranslated = showTranslations[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isAssistant ? 'justify-start' : 'justify-end'} animate-fadeIn`}
                >
                  {isAssistant && (
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg border border-amber-500/30 shrink-0 shadow-md">
                      {selectedPersona.avatar}
                    </div>
                  )}

                  <div className="max-w-[85%] sm:max-w-[78%] space-y-2">
                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-3xl shadow-md ${
                        isAssistant
                          ? 'bg-[#21262E] border border-[#30363D] text-white rounded-tl-sm'
                          : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-tr-sm shadow-amber-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                          {msg.text}
                        </p>

                        {isAssistant && (
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              onClick={() => speakAiText(msg.text)}
                              className="p-1.5 rounded-lg bg-[#16191F]/70 text-slate-300 hover:text-white hover:bg-amber-600 transition-colors cursor-pointer"
                              title="Nghe phát âm câu này"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            {msg.translationVi && (
                              <button
                                onClick={() =>
                                  setShowTranslations((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                                }
                                className="p-1.5 rounded-lg bg-[#16191F]/70 text-slate-300 hover:text-white hover:bg-[#2D333B] transition-colors cursor-pointer"
                                title="Bật/Tắt dịch nghĩa tiếng Việt"
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Vietnamese Translation Accordion */}
                      {isAssistant && isTranslated && msg.translationVi && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#30363D] text-xs text-amber-200/90 leading-relaxed font-normal bg-[#16191F]/40 p-2.5 rounded-xl">
                          <span className="font-bold text-amber-400 block mb-0.5">🌐 Bản dịch:</span>
                          {msg.translationVi}
                        </div>
                      )}
                    </div>

                    {/* Native Polish Upgrade Box for User Messages */}
                    {!isAssistant && msg.nativePolishUpgrade && (
                      <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-xs space-y-1.5 animate-fadeIn text-left shadow-lg">
                        <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Gợi ý cách nói bản xứ tự nhiên hơn (Native Polish):</span>
                        </div>
                        <p className="text-emerald-300 font-bold text-sm">
                          "{msg.nativePolishUpgrade.polishedText}"
                        </p>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          💡 {msg.nativePolishUpgrade.explanationVi}
                        </p>
                      </div>
                    )}

                    {/* Target Vocab Badge */}
                    {!isAssistant && msg.detectedVocabWords && msg.detectedVocabWords.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold px-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã sử dụng từ mục tiêu: {msg.detectedVocabWords.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg border border-amber-500/30">
                  {selectedPersona.avatar}
                </div>
                <div className="p-3.5 rounded-2xl bg-[#21262E] text-xs text-slate-400 flex items-center gap-2 border border-[#30363D]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>{selectedPersona.name} đang suy nghĩ và phản hồi...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Hints Bar */}
          {messages.length > 0 &&
            messages[messages.length - 1].sender === 'assistant' &&
            messages[messages.length - 1].suggestedResponses && (
              <div className="bg-[#121418] px-4 py-2.5 border-t border-[#262A30] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gợi ý phản xạ (Bấm để gửi hoặc luyện nói theo):</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {messages[messages.length - 1].suggestedResponses?.map((hint, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(hint)}
                      className="px-3 py-1.5 rounded-xl bg-[#21262E] hover:bg-amber-500/20 hover:border-amber-500/40 text-slate-200 hover:text-amber-200 text-xs border border-[#30363D] transition-all shrink-0 text-left cursor-pointer font-medium"
                    >
                      💬 {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Bottom Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-[#16191F] border-t border-[#2D333B]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Mic Speech-to-Text Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3.5 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                    : 'bg-[#21262E] hover:bg-[#282E37] text-amber-400 border border-[#30363D]'
                }`}
                title={isRecording ? 'Đang lắng nghe... Bấm để dừng' : 'Bấm để nói bằng giọng nói (STT)'}
              >
                <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce' : ''}`} />
              </button>

              {/* Text Input Box */}
              <input
                type="text"
                value={inputSpeechText}
                onChange={(e) => setInputSpeechText(e.target.value)}
                placeholder={
                  isRecording
                    ? '🎙️ Đang nghe giọng nói của bạn... Hãy nói tự nhiên bằng tiếng Anh!'
                    : 'Nhập tin nhắn tiếng Anh hoặc bấm Mic để nói...'
                }
                className="flex-1 bg-[#21262E] text-sm text-white placeholder-slate-400 px-4 py-3.5 rounded-2xl border border-[#30363D] focus:outline-hidden focus:border-amber-500 transition-colors"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputSpeechText.trim() || isSending}
                className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title="Gửi câu nói"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. RECAP MODAL */}
      {isRecapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#16191F] border border-[#2D333B] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto text-3xl shadow-lg">
                ☕
              </div>
              <h2 className="text-2xl font-black text-white">Tổng Kết Phiên Trò Chuyện Tự Do</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Bạn đã hoàn thành phiên đối thoại tự nhiên cùng {selectedPersona.name}
              </p>
            </div>

            {isLoadingRecap ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
                <p className="text-sm text-slate-300">AI đang tổng kết lại những điểm sáng trong buổi nói của bạn...</p>
              </div>
            ) : recapData ? (
              <div className="space-y-5 animate-fadeIn">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#21262E] border border-[#30363D] text-center">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Thời lượng</span>
                    <span className="text-lg font-black text-amber-300">
                      {formatTimer(recapData.durationSeconds)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Số lượt nói</span>
                    <span className="text-lg font-black text-emerald-400">
                      {recapData.totalTurns} lượt
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Tốc độ ước tính</span>
                    <span className="text-lg font-black text-indigo-300">
                      {recapData.approxWpm} WPM
                    </span>
                  </div>
                </div>

                {/* Overall Cheer */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Flame className="w-4 h-4" />
                    <span>Đánh giá sự trôi chảy: {recapData.fluencyScoreEstimate}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {recapData.overallCheerVi}
                  </p>
                </div>

                {/* Highlight Native Phrases */}
                {recapData.highlightPhrases && recapData.highlightPhrases.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Cụm từ hay xuất hiện trong buổi nói:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {recapData.highlightPhrases.map((phrase, i) => (
                        <div key={i} className="p-3 rounded-xl bg-[#21262E] border border-[#30363D] space-y-1">
                          <div className="text-xs font-black text-emerald-300">{phrase.phraseEn}</div>
                          <div className="text-[11px] text-slate-300 font-medium">👉 {phrase.meaningVi}</div>
                          <div className="text-[10px] text-slate-400 italic">"{phrase.context}"</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gentle Tips */}
                {recapData.gentleTipsVi && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gợi ý nhẹ nhàng để nói mượt hơn:</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {recapData.gentleTipsVi.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 bg-[#21262E] p-2.5 rounded-xl border border-[#30363D]">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262A30]">
                  <button
                    onClick={() => setIsRecapModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#21262E] hover:bg-[#282E37] text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tiếp tục trò chuyện
                  </button>
                  <button
                    onClick={() => {
                      setIsRecapModalOpen(false);
                      onBack();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Xong & Quay lại
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
