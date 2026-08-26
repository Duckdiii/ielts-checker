import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  Play,
  Square,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Award,
  Zap,
  TrendingUp,
  Layers,
  HelpCircle,
  Clock,
  BookOpen,
  Headphones,
  RefreshCw,
  LifeBuoy,
} from 'lucide-react';
import {
  AISpeechUpgradeResult,
  SpeechUpgradeSentencePair,
  VocabItem,
  WordSet,
} from '../../types';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { AccentSwitcher } from './AccentSwitcher';
import { upgradeSpeechToBand8, generateSpeechLadderPromptAi } from '../../services/geminiService';
import confetti from 'canvas-confetti';

interface SpeechUpgradeShadowingProps {
  words?: VocabItem[];
  activeSet?: WordSet;
  onBack: () => void;
  initialQuestion?: string;
  initialTranscript?: string;
  onOpenEmergencyStalling?: () => void;
  onOpenLadder?: () => void;
  onOpenMindmap?: () => void;
}

// Preset samples for immediate demonstration
const DEMO_PRESETS = [
  {
    topic: 'Part 1: Daily Routine & Leisure',
    question: 'What do you usually do in your free time?',
    originalTranscript:
      'In my free time, I like listening to music and surfing Facebook on my phone. Sometimes I hang out with my close friends to drink milk tea. It helps me relax after studying hard.',
  },
  {
    topic: 'Part 2: A Memorable Journey',
    question: 'Describe a memorable journey you went on.',
    originalTranscript:
      'Last year I went to Da Lat with my best friends. We went by bus and the weather was very cold. We ate many good food and took beautiful photos. I will never forget this trip because it was very fun.',
  },
  {
    topic: 'Part 3: Technology in Society',
    question: 'Do you think modern technology makes people more isolated?',
    originalTranscript:
      'Yes, I think so. Many young people look at their smartphones all day and do not talk to their parents. They play games too much, so they have less real friends.',
  },
];

export const SpeechUpgradeShadowing: React.FC<SpeechUpgradeShadowingProps> = ({
  words = [],
  activeSet,
  onBack,
  initialQuestion = '',
  initialTranscript = '',
  onOpenEmergencyStalling,
  onOpenLadder,
  onOpenMindmap,
}) => {
  // Inputs
  const [question, setQuestion] = useState<string>(
    initialQuestion || DEMO_PRESETS[0].question
  );
  const [userTranscript, setUserTranscript] = useState<string>(
    initialTranscript || DEMO_PRESETS[0].originalTranscript
  );
  const [targetBand, setTargetBand] = useState<number>(8.5);
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState<boolean>(false);

  // States
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [upgradeResult, setUpgradeResult] = useState<AISpeechUpgradeResult | null>(null);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'comparison' | 'shadowing' | 'collocations'>('comparison');

  // Recording & Shadowing Practice
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [shadowTranscript, setShadowTranscript] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const handleApplyPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    sounds.playClick();
    setQuestion(preset.question);
    setUserTranscript(preset.originalTranscript);
    setUpgradeResult(null);
  };

  const handleGenerateAiSample = async () => {
    sounds.playClick();
    setIsGeneratingAiDraft(true);
    try {
      const activeVocab = words.map((w) => w.term);
      const res = await generateSpeechLadderPromptAi({
        topic: activeSet?.title || 'IELTS Speaking Daily Topic',
        vocabTerms: activeVocab,
      });

      if (res && res.questionText) {
        setQuestion(res.questionText);
        setUserTranscript(
          res.level1Guide?.sampleBand7Response ||
            `Well, in terms of ${res.topic || 'this topic'}, I usually spend some time on it every weekend. It helps me relax and stay connected with people around me.`
        );
        setUpgradeResult(null);
        sounds.playLevelUp();
      }
    } catch (err) {
      console.error('Error generating AI draft:', err);
    } finally {
      setIsGeneratingAiDraft(false);
    }
  };

  // Perform AI Speech Upgrade
  const handleUpgradeSpeech = async () => {
    if (!userTranscript.trim()) {
      sounds.playWrong();
      return;
    }

    sounds.playClick();
    setIsUpgrading(true);

    try {
      const data = await upgradeSpeechToBand8({
        question,
        userTranscript,
        targetBand,
      });

      setUpgradeResult(data);
      setActiveSentenceIndex(0);
      sounds.playLevelUp();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Error upgrading speech:', err);
      sounds.playWrong();
    } finally {
      setIsUpgrading(false);
    }
  };

  // Shadowing Audio Controls
  const handlePlayFullBand8 = () => {
    if (!upgradeResult) return;
    sounds.playClick();
    setIsPlayingAudio(true);
    speakWord(upgradeResult.upgradedBand8FullText);
    setTimeout(() => setIsPlayingAudio(false), 5000);
  };

  const handlePlaySentence = (text: string) => {
    sounds.playClick();
    speakWord(text);
  };

  // Shadowing Microphone Test
  const startRecording = () => {
    sounds.playStart();
    setIsRecording(true);
    setRecordingSeconds(0);
    setShadowTranscript('');

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
        setShadowTranscript(text);
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

  const handleCopyFullText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFull(true);
    sounds.playClick();
    setTimeout(() => setCopiedFull(false), 2000);
  };

  return (
    <div className="max-w-[1520px] w-full mx-auto space-y-6 pb-28 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#151D2A] p-4 sm:p-6 rounded-3xl border border-[#2D333B] shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-[#8E97A4] hover:text-white transition-colors cursor-pointer"
            title="Quay lại IELTS Speaking AI Studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                AI Speech Upgrade & Shadowing
              </span>
              <span className="text-xs text-[#8E97A4]">Biến Bản Nói Gốc Thành Band 8.0+</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              🪞 Gương Soi Nâng Cấp & Luyện Shadowing Chuẩn Bản Xứ
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AccentSwitcher compact={true} />
          {onOpenMindmap && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenMindmap();
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Mindmap 5 Lăng Kính 💡</span>
            </button>
          )}
        </div>
      </div>

      {/* Feature Intro Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-[#151D2A] to-indigo-950/30 p-5 rounded-3xl border border-purple-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Headphones className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-purple-300">
              Giữ Trọn Ý Tưởng Của Bạn – Thay Bằng Phong Cách Band 8.0 Tự Nhiên!
            </h4>
            <p className="text-xs text-[#8E97A4] leading-relaxed">
              AI sẽ giữ nguyên 100% nội dung bạn muốn nói, tự động nâng cấp từ vựng C1/C2, sửa lỗi ngữ pháp, thêm từ nối bản xứ và tạo phòng tập Shadowing từng câu có giọng đọc mẫu!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Native Accent TTS & Shadowing
          </span>
        </div>
      </div>

      {/* Input Workbench */}
      <div className="bg-[#151D2A] p-6 rounded-3xl border border-purple-500/40 shadow-xl space-y-4">
        {/* Preset quick picker */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D333B] pb-3">
          <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            Chọn đề mẫu hoặc tự nhập câu trả lời của bạn:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {DEMO_PRESETS.map((demo, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(demo)}
                className="px-2.5 py-1 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-[11px] text-purple-300 font-bold border border-[#2D333B] transition-colors cursor-pointer"
              >
                Mẫu #{idx + 1}
              </button>
            ))}
            <button
              onClick={handleGenerateAiSample}
              disabled={isGeneratingAiDraft}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-[11px] text-white font-black transition-all cursor-pointer flex items-center gap-1 shadow-md disabled:opacity-50"
            >
              <Sparkles className={`w-3 h-3 ${isGeneratingAiDraft ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAiDraft ? 'AI Đang Tạo...' : 'Tạo Đề Bằng AI 🪄'}</span>
            </button>
          </div>
        </div>

        {/* Question Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400">Câu hỏi IELTS Speaking:</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="VD: What do you usually do in your free time?"
            className="w-full bg-[#101520] text-white p-3 rounded-2xl border border-[#2D333B] focus:border-purple-500 text-sm font-semibold outline-none"
          />
        </div>

        {/* User Transcript Input Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-400">
              Bài nói gốc của bạn (Có thể nói thử bằng micro hoặc gõ vào):
            </label>
            <span className="text-[11px] font-mono text-gray-500">
              {userTranscript.split(/\s+/).filter(Boolean).length} từ
            </span>
          </div>
          <textarea
            rows={4}
            value={userTranscript}
            onChange={(e) => setUserTranscript(e.target.value)}
            placeholder="Gõ hoặc nói câu trả lời của bạn tại đây..."
            className="w-full bg-[#101520] text-gray-100 placeholder-gray-500 p-4 rounded-2xl border border-[#2D333B] focus:border-purple-500 outline-none text-sm font-mono leading-relaxed"
          />
        </div>

        {/* Trigger Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Mục tiêu nâng cấp:</span>
            <select
              value={targetBand}
              onChange={(e) => setTargetBand(Number(e.target.value))}
              className="bg-[#101520] text-purple-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-[#2D333B] outline-none cursor-pointer"
            >
              <option value={8.0}>Band 8.0 (Tự nhiên & Trôi chảy)</option>
              <option value={8.5}>Band 8.5 (Học thuật & C2 Collocations)</option>
              <option value={9.0}>Band 9.0 (Đỉnh cao Bản xứ & Văn phong sâu sắc)</option>
            </select>
          </div>

          <button
            onClick={handleUpgradeSpeech}
            disabled={isUpgrading || !userTranscript.trim()}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl flex items-center gap-2 ${
              isUpgrading || !userTranscript.trim()
                ? 'bg-[#21262D] text-gray-500 cursor-not-allowed border border-[#2D333B]'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/60 scale-105'
            }`}
          >
            {isUpgrading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>AI Đang Nâng Cấp Bản Nói Lên Band {targetBand}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Nâng Cấp Lên Band {targetBand} & Mở Phòng Shadowing ➔</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UPGRADE RESULTS & SHADOWING LAB */}
      {/* ========================================================================= */}
      {upgradeResult && (
        <div className="bg-[#151D2A] rounded-3xl p-6 sm:p-8 border border-purple-500/40 shadow-2xl space-y-6 animate-fadeIn">
          {/* Header Score Diff Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-purple-950/60 via-[#101520] to-indigo-950/60 p-5 rounded-3xl border border-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="text-center bg-[#151D2A] p-3 rounded-2xl border border-gray-700">
                <div className="text-[10px] uppercase font-bold text-gray-400">Bản Gốc</div>
                <div className="text-xl font-black text-gray-300 font-mono">
                  {upgradeResult.originalBandEstimate.toFixed(1)}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-400" />
              <div className="text-center bg-purple-500/20 p-3 rounded-2xl border border-purple-500/40">
                <div className="text-[10px] uppercase font-bold text-purple-300">Bản Nâng Cấp</div>
                <div className="text-2xl font-black text-purple-300 font-mono">
                  {upgradeResult.upgradedBandEstimate.toFixed(1)} 🌟
                </div>
              </div>
              <div className="hidden sm:block">
                <h3 className="text-base font-black text-white">
                  Đã Nâng Cấp Thành Công Phong Cách Band {upgradeResult.upgradedBandEstimate.toFixed(1)}!
                </h3>
                <p className="text-xs text-gray-400">
                  Ý tưởng của bạn được diễn đạt lại với vốn từ C1/C2 và cấu trúc đa dạng.
                </p>
              </div>
            </div>

            {/* Quick Audio Play & Copy */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayFullBand8}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe Toàn Bài Band 8</span>
              </button>
              <button
                onClick={() => handleCopyFullText(upgradeResult.upgradedBand8FullText)}
                className="p-2.5 rounded-2xl bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Sao chép toàn bài"
              >
                {copiedFull ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-[#2D333B] pb-3">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('comparison');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Đối Chiếu Từng Câu (Sentence-by-Sentence)</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('shadowing');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'shadowing'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Phòng Luyện Shadowing (Nói Đuổi Theo Audio)</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('collocations');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'collocations'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>C1/C2 Collocations Thu Hoạch ({upgradeResult.keyCollocationsEarned.length})</span>
            </button>
          </div>

          {/* TAB 1: COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Full Text Highlight View */}
              <div className="bg-[#101520] p-5 rounded-2xl border border-[#2D333B] space-y-2">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bản Nói Hoàn Chỉnh Band 8.5 Polished Text:
                </span>
                <p className="text-sm font-mono text-gray-100 leading-relaxed">
                  "{upgradeResult.upgradedBand8FullText}"
                </p>
              </div>

              {/* Word / Phrase Replacements */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Chi tiết nâng cấp từ vựng & cấu trúc:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upgradeResult.highlightedReplacements.map((rep, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#101520] border border-[#2D333B] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-rose-400 line-through">"{rep.originalText}"</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-emerald-300 font-black">"{rep.improvedText}"</span>
                      </div>
                      <p className="text-[11px] text-gray-400">{rep.explanationVi}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHADOWING LAB */}
          {activeTab === 'shadowing' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#101520] p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Câu {activeSentenceIndex + 1} / {upgradeResult.sentencePairs.length}
                    </span>
                    <h4 className="text-sm font-black text-white mt-0.5">
                      Luyện Nghe & Nói Đuổi Từng Câu Chuẩn Âm Điệu:
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {upgradeResult.sentencePairs.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          sounds.playClick();
                          setActiveSentenceIndex(idx);
                          setShadowTranscript('');
                        }}
                        className={`w-7 h-7 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                          activeSentenceIndex === idx
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-[#21262D] text-gray-400 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Sentence Card */}
                {upgradeResult.sentencePairs[activeSentenceIndex] && (
                  <div className="p-5 rounded-2xl bg-[#151D2A] border border-indigo-500/40 space-y-3">
                    <div className="text-xs text-gray-400 italic">
                      Câu gốc của bạn: "{upgradeResult.sentencePairs[activeSentenceIndex].originalSentence}"
                    </div>

                    <div className="text-base font-mono font-bold text-emerald-300 leading-relaxed">
                      "{upgradeResult.sentencePairs[activeSentenceIndex].upgradedBand8Sentence}"
                    </div>

                    <div className="text-xs text-gray-300 bg-[#101520] p-3 rounded-xl border border-[#2D333B]">
                      💡 {upgradeResult.sentencePairs[activeSentenceIndex].breakdownVi}
                    </div>

                    {/* Audio & Shadowing Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() =>
                          handlePlaySentence(
                            upgradeResult.sentencePairs[activeSentenceIndex].upgradedBand8Sentence
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Nghe câu này (Native Audio)</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Bấm & Nói Đuổi (Shadow)</span>
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 animate-pulse shadow"
                          >
                            <Square className="w-4 h-4 fill-current" />
                            <span>Dừng ({recordingSeconds}s)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Shadow Transcript Feedback */}
                    {shadowTranscript && (
                      <div className="p-3.5 rounded-xl bg-[#101520] border border-emerald-500/30 text-xs font-mono space-y-1">
                        <span className="text-emerald-400 font-bold">Giọng bạn vừa nói:</span>
                        <p className="text-gray-200">"{shadowTranscript}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stylistic notes */}
                {upgradeResult.nativeStylisticNotesVi && (
                  <div className="p-4 rounded-2xl bg-[#151D2A] border border-[#2D333B] space-y-1.5">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      Mẹo phát âm & ngữ điệu (Intonation & Chunking):
                    </span>
                    <ul className="space-y-1">
                      {upgradeResult.nativeStylisticNotesVi.map((note, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COLLOCATIONS */}
          {activeTab === 'collocations' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-fadeIn">
              {upgradeResult.keyCollocationsEarned.map((col, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    sounds.playClick();
                    speakWord(col.phrase);
                  }}
                  className="p-4 rounded-2xl bg-[#101520] hover:bg-[#1C2433] border border-[#2D333B] hover:border-emerald-500/40 transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-emerald-300 group-hover:text-white">
                      {col.phrase}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {col.cefrLevel}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300">{col.meaningVi}</div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-gray-400 group-hover:text-emerald-400" />
                    <span>Bấm để nghe phát âm</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
