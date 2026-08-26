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
  Repeat,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Headphones,
  Zap,
  TrendingUp,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  ListChecks,
} from 'lucide-react';
import {
  VocabItem,
  WordSet,
  UserProgress,
  ShadowingEvaluationResult,
} from '../../types';
import { speakWord, ACCENT_OPTIONS, EnglishAccent } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { fireCelebration, fireStreakBonus } from '../../utils/confetti';
import { evaluateShadowingSentence } from '../../services/geminiService';

interface ShadowingLabModeProps {
  words: VocabItem[];
  allWords?: VocabItem[];
  activeSet?: WordSet;
  progress?: UserProgress;
  onBack: () => void;
  onRecordStudySession?: (wordsStudied: number, correctCount: number) => void;
}

interface ShadowingItem {
  id: string;
  term: string;
  ipa?: string;
  meaning: string;
  sentence: string;
  vietnameseMeaning?: string;
  topic?: string;
  accentContext?: string;
}

export const ShadowingLabMode: React.FC<ShadowingLabModeProps> = ({
  words,
  activeSet,
  onBack,
  onRecordStudySession,
}) => {
  // Extract or synthesize rich sentences from vocabulary
  const sentenceBank: ShadowingItem[] = useMemo(() => {
    const valid = words
      .filter((w) => w.example && w.example.trim().length > 10)
      .map((w, idx) => ({
        id: w.id || `shadow-${idx}`,
        term: w.term,
        ipa: w.ipa,
        meaning: w.meaning,
        sentence: w.example.trim(),
        vietnameseMeaning: w.meaning,
        topic: w.topic || 'IELTS Academic',
      }));

    if (valid.length > 0) return valid;

    // Default fallback academic sentences
    return [
      {
        id: 'default-1',
        term: 'sustainable development',
        ipa: '/səˈsteɪnəbl dɪˈveləpmənt/',
        meaning: 'phát triển bền vững',
        sentence: 'The exponential growth of urban areas poses an unprecedented challenge to sustainable development and infrastructure.',
        vietnameseMeaning: 'Sự tăng trưởng theo cấp số nhân của các khu vực đô thị đặt ra thách thức chưa từng có đối với sự phát triển bền vững.',
        topic: 'Môi trường & Đô thị',
      },
      {
        id: 'default-2',
        term: 'cutting-edge technology',
        ipa: '/ˈkʌtɪŋ edʒ tekˈnɑːlədʒi/',
        meaning: 'công nghệ tối tân',
        sentence: 'Researchers have harnessed cutting-edge technology to streamline data processing and optimize clinical trials.',
        vietnameseMeaning: 'Các nhà nghiên cứu đã khai thác công nghệ tối tân để hợp lý hóa việc xử lý dữ liệu và tối ưu hóa các thử nghiệm lâm sàng.',
        topic: 'Công nghệ & Đổi mới',
      },
      {
        id: 'default-3',
        term: 'socioeconomic disparity',
        ipa: '/ˌsəʊsiəʊˌekəˈnɒmɪk dɪˈspærəti/',
        meaning: 'chênh lệch kinh tế xã hội',
        sentence: 'Governments must implement targeted fiscal policies to bridge the widening socioeconomic disparity among citizens.',
        vietnameseMeaning: 'Chính phủ cần thực thi các chính sách tài khóa có mục tiêu để thu hẹp khoảng cách kinh tế xã hội ngày càng mở rộng.',
        topic: 'Kinh tế & Xã hội',
      },
    ];
  }, [words]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = sentenceBank[currentIndex] || sentenceBank[0];

  // Playback & Audio States
  const [selectedAccent, setSelectedAccent] = useState<'US' | 'UK' | 'AU'>('UK');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.9);
  const [isAudioLooping, setIsAudioLooping] = useState<boolean>(false);
  const [isPlayingNative, setIsPlayingNative] = useState<boolean>(false);

  // Recording & Shadowing States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<ShadowingEvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');

  const filteredSentences = useMemo(() => {
    return sentenceBank.filter((item) => {
      const matchSearch =
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sentence.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTopic =
        selectedTopicFilter === 'all' || item.topic === selectedTopicFilter;
      return matchSearch && matchTopic;
    });
  }, [sentenceBank, searchTerm, selectedTopicFilter]);

  const topicsList = useMemo(() => {
    return Array.from(new Set(sentenceBank.map((s) => s.topic).filter(Boolean)));
  }, [sentenceBank]);

  // Audio Recognition & MediaRecorder Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const latestBase64Ref = useRef<string | null>(null);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Map Selected Accent to Speech API code
  const accentCodeMap: Record<'US' | 'UK' | 'AU', EnglishAccent> = {
    UK: 'en-GB',
    US: 'en-US',
    AU: 'en-AU',
  };

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
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error in Shadowing:', err);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      window.speechSynthesis?.cancel();
    };
  }, [selectedAccent]);

  // Reset Result on Changing Sentence
  const handleSelectSentence = (index: number) => {
    setCurrentIndex(index);
    setEvaluationResult(null);
    setEvalError(null);
    setLiveTranscript('');
    setRecordedAudioUrl(null);
    setAudioBase64(null);
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Play Native Model Audio with Chosen Accent & Speed
  const handlePlayNativeAudio = () => {
    if (!currentItem) return;
    setIsPlayingNative(true);
    sounds.playClick();

    speakWord(
      currentItem.sentence,
      playbackSpeed,
      accentCodeMap[selectedAccent]
    );

    // Estimate duration based on word count
    const wordsCount = currentItem.sentence.split(' ').length;
    const durationMs = (wordsCount / (2.5 * playbackSpeed)) * 1000 + 800;

    setTimeout(() => {
      setIsPlayingNative(false);
    }, durationMs);
  };

  // Handle Start Recording (Shadowing User Audio)
  const handleStartShadowing = async () => {
    setLiveTranscript('');
    setRecordedAudioUrl(null);
    setAudioBase64(null);
    latestBase64Ref.current = null;
    setEvaluationResult(null);
    setEvalError(null);
    sounds.playStreak();

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

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const b64 = reader.result as string;
          setAudioBase64(b64);
          latestBase64Ref.current = b64;
        };
        stream.getTracks().forEach((track) => track.stop());
        if (mediaStreamRef.current === stream) {
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition already started');
        }
      }
    } catch (err) {
      console.warn('Mic permission error:', err);
    }
  };

  // Handle Stop Recording & Trigger AI Shadowing Diagnostic
  const handleStopAndEvaluate = async () => {
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

    setIsEvaluating(true);
    setEvalError(null);

    // Allow blob to finish processing
    setTimeout(async () => {
      try {
        const result = await evaluateShadowingSentence({
          originalSentence: currentItem.sentence,
          userTranscript: liveTranscript.trim(),
          audioBase64: latestBase64Ref.current || audioBase64 || undefined,
          targetAccent: selectedAccent,
          highlightedWord: currentItem.term,
        });

        setEvaluationResult(result);

        if (result.similarityScore >= 80) {
          sounds.playComplete();
          fireCelebration();
        } else {
          sounds.playStreak();
        }

        if (onRecordStudySession) {
          onRecordStudySession(1, result.similarityScore >= 70 ? 1 : 0);
        }
      } catch (err: any) {
        console.error('Shadowing eval error:', err);
        setEvalError(err.message || 'Lỗi khi chấm điểm Shadowing');
      } finally {
        setIsEvaluating(false);
      }
    }, 400);
  };

  return (
    <div className="max-w-[1680px] mx-auto space-y-6 animate-fadeIn px-2 sm:px-4">
      {/* Top Header Navigation Bar */}
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
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Headphones className="w-4 h-4" />
            </span>
            <span className="text-sm font-black text-white">
              Shadowing Lab • Luyện Ngữ Điệu & Nhại Giọng Bản Xứ
            </span>
          </div>
        </div>

        {/* Global Accent & Speed Pill Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Accent Switcher */}
          <div className="flex items-center bg-[#21262E] p-1 rounded-xl border border-[#30363D]">
            {(['UK', 'US', 'AU'] as const).map((acc) => (
              <button
                key={acc}
                onClick={() => setSelectedAccent(acc)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedAccent === acc
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-[#8E97A4] hover:text-white'
                }`}
              >
                {acc === 'UK' ? '🇬🇧 UK' : acc === 'US' ? '🇺🇸 US' : '🇦🇺 AU'}
              </button>
            ))}
          </div>

          {/* Speed Switcher */}
          <div className="flex items-center bg-[#21262E] p-1 rounded-xl border border-[#30363D]">
            {[0.75, 0.9, 1.1].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-amber-500 text-black shadow-xs font-extrabold'
                    : 'text-[#8E97A4] hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 3-Column Panoramic Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN (4 COLS): SENTENCE BANK & SELECTOR ================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Kho Câu Mẫu Học Thuật ({filteredSentences.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#8E97A4]">
                {currentIndex + 1} / {filteredSentences.length}
              </span>
            </div>

            {/* Search & Topic Filters */}
            <div className="space-y-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm từ vựng hoặc câu mẫu..."
                className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-[#1C2027] border border-[#2D333B] text-white placeholder-[#8E97A4] focus:outline-hidden focus:border-indigo-500"
              />

              {topicsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => setSelectedTopicFilter('all')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                      selectedTopicFilter === 'all'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-[#21262E] text-[#8E97A4] border-transparent hover:text-white'
                    }`}
                  >
                    Tất cả
                  </button>
                  {topicsList.slice(0, 3).map((topic, tIdx) => (
                    <button
                      key={tIdx}
                      onClick={() => setSelectedTopicFilter(topic!)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer truncate max-w-[120px] ${
                        selectedTopicFilter === topic
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-[#21262E] text-[#8E97A4] border-transparent hover:text-white'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable Sentence List */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {filteredSentences.map((item, idx) => {
                const isSelected = item.id === currentItem.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSentence(idx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-[#1C2027] border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-lg'
                        : 'bg-[#1C2027]/60 border-[#2D333B] hover:border-indigo-500/40 hover:bg-[#1C2027]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" /> {item.term}
                      </span>
                      {item.topic && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#21262E] text-[#8E97A4]">
                          {item.topic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9BA1A6] line-clamp-2 leading-relaxed font-serif italic">
                      "{item.sentence}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN (5 COLS): SHADOWING STAGE & RECORDING ================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Master Sentence Display Card */}
          <div className="bg-[#16191F] rounded-3xl p-6 sm:p-7 border border-[#2D333B] shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Câu Mẫu Học Thuật Cần Nhại Giọng
              </span>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    handleSelectSentence(
                      currentIndex > 0 ? currentIndex - 1 : sentenceBank.length - 1
                    )
                  }
                  className="p-1.5 rounded-lg bg-[#21262E] hover:bg-[#282D33] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    handleSelectSentence(
                      currentIndex < sentenceBank.length - 1 ? currentIndex + 1 : 0
                    )
                  }
                  className="p-1.5 rounded-lg bg-[#21262E] hover:bg-[#282D33] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Target Word & Phonetics Header */}
            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#1C2027] border border-[#2D333B]">
              <div>
                <span className="text-sm font-black text-white">{currentItem.term}</span>
                {currentItem.ipa && (
                  <span className="text-xs font-mono text-indigo-400 ml-2">{currentItem.ipa}</span>
                )}
              </div>
              <span className="text-xs text-[#8E97A4] font-medium">{currentItem.meaning}</span>
            </div>

            {/* Full Master Sentence with Word-Level Visual Emphasis */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C2027] to-[#16191F] border border-[#2D333B] shadow-inner space-y-3">
              <p className="text-base sm:text-lg text-white font-sans leading-relaxed tracking-wide">
                {currentItem.sentence.split(' ').map((word, wIdx) => {
                  const isKeyTerm =
                    currentItem.term.toLowerCase().includes(word.toLowerCase().replace(/[^a-z]/g, '')) &&
                    word.length > 2;
                  return (
                    <span
                      key={wIdx}
                      className={`inline-block mr-1.5 px-1 py-0.5 rounded-lg transition-colors ${
                        isKeyTerm
                          ? 'bg-amber-500/20 text-amber-300 font-extrabold border-b-2 border-amber-400'
                          : 'hover:text-indigo-300'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </p>

              {currentItem.vietnameseMeaning && (
                <p className="text-xs text-[#8E97A4] italic pt-2 border-t border-[#2D333B] leading-relaxed">
                  <strong>Nghĩa tiếng Việt:</strong> {currentItem.vietnameseMeaning}
                </p>
              )}
            </div>

            {/* Audio Playback Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handlePlayNativeAudio}
                className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingNative ? 'animate-bounce' : ''}`} />
                <span>
                  {isPlayingNative
                    ? 'Đang phát âm bản ngữ...'
                    : `Nghe Giọng Mẫu (${selectedAccent} • ${playbackSpeed}x)`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsAudioLooping(!isAudioLooping)}
                className={`px-3.5 py-3 rounded-2xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isAudioLooping
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#21262E] text-[#8E97A4] border-[#30363D] hover:text-white'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Lặp câu</span>
              </button>
            </div>
          </div>

          {/* User Shadowing Mic Recorder Card */}
          <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-rose-400" /> Bật Mic & Nhại Lại (Shadowing)
              </span>
              {isRecording && (
                <span className="text-xs font-bold text-rose-400 animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Đang thu âm...
                </span>
              )}
            </div>

            {/* Live Speech Recognition Transcript */}
            <div className="p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] min-h-[90px] flex items-center justify-center text-center">
              {liveTranscript ? (
                <p className="text-sm sm:text-base text-white font-sans leading-relaxed">
                  "{liveTranscript}"
                </p>
              ) : (
                <p className="text-xs text-[#8E97A4] leading-relaxed">
                  {isRecording
                    ? 'Hãy đọc nhại lại theo ngữ điệu và nối âm của người bản xứ...'
                    : 'Nhấn nút bên dưới để bắt đầu nhại giọng câu này.'}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartShadowing}
                  className="w-full py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mic className="w-5 h-5" />
                  <span>Bắt Đầu Nhại Giọng (Shadow Now)</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={handleStopAndEvaluate}
                  className="w-full py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Hoàn Thành & Chấm Điểm AI Ngay</span>
                </button>
              )}
            </div>

            {isEvaluating && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fadeIn">
                <Sparkles className="w-4 h-4 animate-spin" /> AI đang phân tích âm đuôi, trọng âm và nối âm...
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN (3 COLS): QUICK PHONETICS GUIDE & BLUEPRINT ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quick Phonetics Blueprint */}
          <div className="bg-[#16191F] rounded-3xl p-5 border border-[#2D333B] shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
              <ListChecks className="w-4 h-4" /> 3 Nguyên Tắc Shadowing Đỉnh Cao
            </h4>

            <div className="space-y-3 text-xs text-[#9BA1A6] leading-relaxed">
              <div className="p-3 rounded-xl bg-[#1C2027] border border-[#2D333B] space-y-1">
                <span className="font-bold text-white block">1. Nhấn Trọng Âm Nội Dung (Content Words)</span>
                <p className="text-[11px]">
                  Nhấn mạnh danh từ, động từ chính và tính từ; lướt nhẹ các mạo từ (a, the) và giới từ (in, on, to).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1C2027] border border-[#2D333B] space-y-1">
                <span className="font-bold text-white block">2. Giữ Trọn Âm Đuôi (Ending Sounds)</span>
                <p className="text-[11px]">
                  Tuyệt đối không nuốt âm đuôi quan trọng như <strong>/s/, /z/, /t/, /d/, /ed/</strong> để giám khảo chấm Pronunciation 7.5+.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1C2027] border border-[#2D333B] space-y-1">
                <span className="font-bold text-white block">3. Luyến & Nối Âm (Connected Speech)</span>
                <p className="text-[11px]">
                  Nối phụ âm cuối từ trước sang nguyên âm đầu từ sau một cách liền mạch, không ngắt cụt từng từ.
                </p>
              </div>
            </div>
          </div>

          {/* User Recorded Audio Playback */}
          {recordedAudioUrl && (
            <div className="bg-[#16191F] rounded-3xl p-4 border border-[#2D333B] shadow-xl space-y-2">
              <span className="text-[11px] font-bold text-[#8E97A4] uppercase tracking-wider block">
                Nghe lại giọng nhại của bạn:
              </span>
              <audio controls src={recordedAudioUrl} className="w-full h-8" />
            </div>
          )}
        </div>
      </div>

      {/* ================= FULL-WIDTH AI DIAGNOSTIC DASHBOARD (WHEN EVALUATED) ================= */}
      {evaluationResult && (
        <div className="bg-[#16191F] rounded-3xl p-6 sm:p-8 border border-[#2D333B] shadow-2xl space-y-6 animate-fadeIn relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />

          {/* Top Diagnostic Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pb-5 border-b border-[#2D333B]">
            <div className="sm:col-span-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-black flex flex-col items-center justify-center shadow-xl shadow-emerald-500/30 shrink-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Độ Tương Đồng</span>
                <span className="text-2xl font-black">{evaluationResult.similarityScore}%</span>
              </div>

              <div>
                <div className="text-lg font-black text-white">{evaluationResult.overallGrade}</div>
                <div className="text-xs text-emerald-400 font-bold mt-0.5">
                  Ngữ điệu: {evaluationResult.intonationRating}
                </div>
                <p className="text-[11px] text-[#8E97A4] mt-1">{evaluationResult.intonationFeedbackVi}</p>
              </div>
            </div>

            {/* Word-by-Word Colorized Interactive Visualization */}
            <div className="sm:col-span-8 p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-2">
              <span className="text-[11px] font-bold text-[#8E97A4] uppercase tracking-wider block">
                Phân tích độ chuẩn từng từ trong câu:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {evaluationResult.wordByWordFeedback.map((wf, wIdx) => (
                  <span
                    key={wIdx}
                    title={wf.commentVi || `Điểm chính xác: ${wf.accuracyScore}%`}
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                      wf.status === 'perfect'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : wf.status === 'minor_issue'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {wf.word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 3-Column Diagnostic Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Ending Sounds Analysis */}
            <div className="p-5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Kiểm Tra Âm Đuôi (Ending Sounds)
              </h4>

              <div className="space-y-2.5">
                {evaluationResult.endingSoundsAnalysis.map((es, eIdx) => (
                  <div key={eIdx} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">"{es.word}" ({es.sound})</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          es.status === 'accurate'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : es.status === 'weak'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {es.status === 'accurate' ? 'Chuẩn' : es.status === 'weak' ? 'Hơi mờ' : 'Nuốt âm'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E97A4] leading-relaxed">{es.tipVi}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Connected Speech & Linking */}
            <div className="p-5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Nối Âm & Luyến Âm (Connected Speech)
              </h4>

              <div className="space-y-2.5">
                {evaluationResult.connectedSpeechAnalysis.map((cs, cIdx) => (
                  <div key={cIdx} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-indigo-300">"{cs.phrase}"</span>
                      <span className="text-[10px] font-mono text-emerald-400">{cs.howToSay}</span>
                    </div>
                    <div className="text-[10px] text-amber-400">{cs.ruleType}</div>
                    <p className="text-[11px] text-[#8E97A4] leading-relaxed">{cs.guideVi}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 3-Step Practice Drill */}
            <div className="p-5 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-[#2D333B]">
                <Award className="w-4 h-4 text-emerald-400" /> 3 Bước Luyện Để Đạt Band 9.0
              </h4>

              <div className="space-y-2">
                {evaluationResult.practiceDrill.map((step, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-2 text-xs text-[#9BA1A6] leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {sIdx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartShadowing}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Luyện nhại lại câu này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
