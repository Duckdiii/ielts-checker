import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Volume2,
  Star,
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  Tag,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Headphones,
  Zap,
  Flag,
} from 'lucide-react';
import { VocabItem, AIPronunciationFeedback } from '../../types';
import { speakWord } from '../../utils/speech';
import { getTopicInfo } from '../../utils/topicHelpers';
import { evaluatePronunciationWithAI } from '../../services/geminiService';
import { sounds } from '../../utils/soundEffects';

interface WordDetailModalProps {
  word: VocabItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleBookmark: (wordId: string) => void;
  onToggleUnlearned?: (wordId: string) => void;
  onOpenAiBoosterForWord: (word: VocabItem) => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  isOpen,
  onClose,
  onToggleBookmark,
  onToggleUnlearned,
  onOpenAiBoosterForWord,
}) => {
  // Voice Recording & AI Evaluation States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIPronunciationFeedback | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Stop Voice Recording helper
  const stopRecording = (shouldEvaluateAuto = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore already stopped error
      }
    }
    setIsRecording(false);
  };

  // Reset state when word changes or modal closes
  useEffect(() => {
    stopRecording(false);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      userAudioPlayerRef.current = null;
    }
    setIsPlayingUserAudio(false);
    setAiFeedback(null);
    setFeedbackError(null);
    setRecordingSeconds(0);

    return () => {
      stopRecording(false);
      if (userAudioPlayerRef.current) {
        userAudioPlayerRef.current.pause();
        userAudioPlayerRef.current = null;
      }
    };
  }, [word?.id, isOpen]);

  if (!isOpen || !word) return null;

  const topicInfo = getTopicInfo(word.topic);

  // Start Voice Recording
  const startRecording = async () => {
    try {
      setFeedbackError(null);
      setAiFeedback(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 10) {
            // Auto stop at 10 seconds max
            stopRecording(true);
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setFeedbackError(
        'Không thể truy cập Microphone. Vui lòng cho phép quyền truy cập micro trong trình duyệt.'
      );
      setIsRecording(false);
    }
  };


  // Play user's recorded audio
  const togglePlayUserAudio = () => {
    if (!audioUrl) return;

    if (!userAudioPlayerRef.current) {
      userAudioPlayerRef.current = new Audio(audioUrl);
      userAudioPlayerRef.current.onended = () => setIsPlayingUserAudio(false);
    } else {
      userAudioPlayerRef.current.src = audioUrl;
    }

    if (isPlayingUserAudio) {
      userAudioPlayerRef.current.pause();
      setIsPlayingUserAudio(false);
    } else {
      userAudioPlayerRef.current.currentTime = 0;
      userAudioPlayerRef.current
        .play()
        .then(() => setIsPlayingUserAudio(true))
        .catch((e) => console.error('Audio play error:', e));
    }
  };

  // Send audio to Gemini for evaluation
  const handleEvaluateAudioWithAI = async () => {
    if (!audioBlob || !word) return;

    setIsEvaluating(true);
    setFeedbackError(null);

    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const result = await evaluatePronunciationWithAI({
            term: word.term,
            ipa: word.ipa,
            meaning: word.meaning,
            audioBase64: base64Data,
            mimeType: audioBlob.type || 'audio/webm',
          });

          setAiFeedback(result);
        } catch (err: any) {
          console.error('AI Pronunciation eval error:', err);
          setFeedbackError(err.message || 'Không thể chấm điểm phát âm lúc này. Vui lòng thử lại.');
        } finally {
          setIsEvaluating(false);
        }
      };
    } catch (err: any) {
      setFeedbackError('Lỗi chuyển đổi dữ liệu âm thanh');
      setIsEvaluating(false);
    }
  };

  // Reset recording
  const handleResetRecording = () => {
    stopRecording(false);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAiFeedback(null);
    setFeedbackError(null);
    setRecordingSeconds(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#16191D] rounded-3xl max-w-xl w-full shadow-2xl border border-[#2D3135] overflow-hidden my-8 animate-fadeIn text-[#E0E2E4] relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

        {/* Header */}
        <div className="p-6 sm:p-7 pb-4 border-b border-[#2D3135] flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {word.targetIeltsBand ? `Band ${word.targetIeltsBand}` : 'IELTS Core'}
              </span>
              {word.cefrLevel && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {word.cefrLevel}
                </span>
              )}
              {word.topic && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 ${topicInfo.badgeBg} ${topicInfo.badgeBorder} ${topicInfo.badgeText}`}
                >
                  <span>{topicInfo.icon}</span>
                  <span>{word.topic}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{word.term}</h2>
              <button
                onClick={() => speakWord(word.term)}
                className="p-2.5 rounded-xl bg-[#21262D] hover:bg-indigo-600 text-indigo-300 hover:text-white border border-[#30363D] transition-colors cursor-pointer"
                title="Nghe phát âm bản xứ"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
            {word.ipa && (
              <p className="text-base sm:text-lg text-indigo-300 font-mono font-medium tracking-wide">{word.ipa}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 🚩 Chưa thuộc Icon Button */}
            <button
              onClick={() => {
                sounds.playClick();
                if (onToggleUnlearned) onToggleUnlearned(word.id);
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                word.isUnlearned
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/20 ring-1 ring-rose-500/40'
                  : 'bg-[#21262D] text-[#8B949E] hover:text-rose-400 hover:bg-rose-500/10 border-[#30363D]'
              }`}
              title={word.isUnlearned ? 'Đã đánh dấu CHƯA THUỘC (Nhấn để hủy)' : 'Đánh dấu từ này là CHƯA THUỘC'}
            >
              <Flag className={`w-5 h-5 ${word.isUnlearned ? 'fill-rose-400 text-rose-400' : ''}`} />
            </button>

            <button
              onClick={() => onToggleBookmark(word.id)}
              className={`p-2.5 rounded-xl border border-[#30363D] transition-colors cursor-pointer ${
                word.isBookmarked
                  ? 'bg-amber-500/15 text-amber-300 fill-amber-300 border-amber-500/40'
                  : 'bg-[#21262D] text-[#8B949E] hover:text-amber-300'
              }`}
              title="Đánh dấu sao"
            >
              <Star className={`w-5 h-5 ${word.isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Meaning */}
          <div className="p-5 rounded-2xl bg-[#21262D] border border-indigo-500/30">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
              Nghĩa tiếng Việt
            </span>
            <p className="text-xl sm:text-2xl font-black text-white leading-snug">{word.meaning}</p>
          </div>

          {/* ========================================================================= */}
          {/* 🎙️ GEMINI VOICE RECORDING & PRONUNCIATION COACH SECTION */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#1C1F26] to-[#16181D] border border-indigo-500/40 shadow-lg relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Luyện Phát Âm & AI Chấm Điểm</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      Gemini 3.7
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Ghi âm giọng đọc để AI chấm điểm độ chuẩn xác, trọng âm và phát âm IELTS
                  </p>
                </div>
              </div>

              <button
                onClick={() => speakWord(word.term)}
                className="text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/30 px-3 py-1.5 rounded-xl border border-indigo-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Nghe phát âm chuẩn"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Nghe mẫu</span>
              </button>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {!isRecording && !audioBlob && (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Bắt đầu Ghi Âm Giọng</span>
                </button>
              )}

              {isRecording && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => stopRecording(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all animate-pulse cursor-pointer"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>Dừng Ghi Âm ({recordingSeconds}s / 10s)</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-[11px] text-rose-400 font-mono font-medium">
                      Đang thu âm...
                    </span>
                  </div>
                </div>
              )}

              {audioBlob && !isRecording && (
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <button
                    onClick={togglePlayUserAudio}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-white border border-[#30363D] transition-colors"
                  >
                    <Play className={`w-3.5 h-3.5 ${isPlayingUserAudio ? 'text-emerald-400 animate-pulse' : ''}`} />
                    <span>{isPlayingUserAudio ? 'Đang phát...' : 'Nghe lại giọng bạn'}</span>
                  </button>

                  <button
                    onClick={handleEvaluateAudioWithAI}
                    disabled={isEvaluating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI đang phân tích âm thanh...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{aiFeedback ? 'Chấm Điểm Lại' : 'Chấm Điểm Bằng AI'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResetRecording}
                    className="p-2 rounded-xl bg-[#21262D] hover:bg-[#2D3135] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors"
                    title="Ghi âm lại từ đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Error message */}
            {feedbackError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{feedbackError}</span>
              </div>
            )}

            {/* AI Evaluation Results Panel */}
            {aiFeedback && (
              <div className="mt-3 p-4 rounded-xl bg-[#111317] border border-indigo-500/20 space-y-3.5 animate-fadeIn">
                {/* Score Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#2D3135]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-sm border shadow-inner ${
                        aiFeedback.score >= 85
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : aiFeedback.score >= 70
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <span>{aiFeedback.score}</span>
                      <span className="text-[8px] font-normal text-[#8B949E]">/100</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            aiFeedback.score >= 85
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : aiFeedback.score >= 70
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {aiFeedback.accuracyGrade}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            aiFeedback.stressCorrect
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}
                        >
                          {aiFeedback.stressCorrect ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Trọng âm chuẩn</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Trọng âm cần chỉnh</span>
                            </>
                          )}
                        </span>
                      </div>

                      {aiFeedback.transcription && (
                        <p className="text-[11px] text-[#8B949E] mt-1">
                          AI nghe thấy:{' '}
                          <span className="text-white font-medium">"{aiFeedback.transcription}"</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback Comment */}
                <div className="text-sm sm:text-base text-slate-100 leading-relaxed">
                  <p className="font-bold text-indigo-300 mb-1.5 flex items-center gap-1">💡 Nhận xét của AI:</p>
                  <p className="text-slate-100 bg-[#16191D] p-3.5 rounded-xl border border-[#30363D] leading-relaxed font-medium">
                    {aiFeedback.feedbackVi}
                  </p>
                </div>

                {/* Specific Errors if any */}
                {aiFeedback.specificErrors && aiFeedback.specificErrors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider block">
                      Điểm cần lưu ý:
                    </span>
                    <ul className="space-y-1.5">
                      {aiFeedback.specificErrors.map((err, idx) => (
                        <li
                          key={idx}
                          className="text-xs sm:text-sm text-amber-100 flex items-start gap-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20"
                        >
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* IELTS Speaking Tip */}
                {aiFeedback.ieltsSpeakingTips && (
                  <div className="p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-xs sm:text-sm text-indigo-100">
                    <div className="flex items-center gap-2 font-bold text-indigo-300 mb-1">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Mẹo IELTS Speaking (Pronunciation Band 7.5+):</span>
                    </div>
                    <p className="leading-relaxed">{aiFeedback.ieltsSpeakingTips}</p>
                  </div>
                )}

                {/* Phonetic & Mouth Shape Guidance */}
                {aiFeedback.phoneticTips && (
                  <div className="p-3.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs sm:text-sm text-purple-100">
                    <div className="flex items-center gap-2 font-bold text-purple-300 mb-1">
                      <Headphones className="w-4 h-4 text-purple-400" />
                      <span>Hướng dẫn khẩu hình & IPA:</span>
                    </div>
                    <p className="leading-relaxed">{aiFeedback.phoneticTips}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Word Family */}
          {word.wordFamily && (
            <div className="p-5 rounded-2xl bg-[#21262D] border border-amber-500/30">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Word Family (Họ từ loại):
              </span>
              <p className="text-base sm:text-lg font-bold text-amber-200">{word.wordFamily}</p>
            </div>
          )}

          {/* Synonyms & Antonyms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {word.synonyms && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#21262D] border border-emerald-500/30 space-y-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Từ đồng nghĩa (Synonyms):
                </span>
                <p className="text-sm sm:text-base font-bold text-emerald-200">{word.synonyms}</p>
              </div>
            )}

            {word.antonyms && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#21262D] border border-rose-500/30 space-y-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                  Từ trái nghĩa (Antonyms):
                </span>
                <p className="text-sm sm:text-base font-bold text-rose-200">{word.antonyms}</p>
              </div>
            )}
          </div>

          {/* Example */}
          {word.example && (
            <div className="p-5 rounded-2xl bg-[#21262D] border border-indigo-500/20 text-base sm:text-lg text-slate-100 italic space-y-1.5 leading-relaxed font-serif">
              <span className="font-sans font-bold text-indigo-300 not-italic block text-xs sm:text-sm uppercase tracking-wider">
                Ví dụ / Trích dẫn IELTS:
              </span>
              "{word.example}"
            </div>
          )}

          {/* Notes */}
          {word.notes && (
            <div className="p-4 bg-amber-500/15 rounded-2xl border border-amber-500/30 text-sm sm:text-base font-medium text-amber-200">
              💡 {word.notes}
            </div>
          )}

          {/* SRS Stats */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-[#21262D] rounded-2xl border border-[#30363D] text-center">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Giai đoạn SRS</span>
              <div className="text-base sm:text-lg font-black text-white mt-0.5">Stage {word.srsStage || 0}</div>
            </div>
            <div className="border-l border-[#30363D]">
              <span className="text-xs font-semibold text-slate-400 uppercase">Đã trả lời đúng</span>
              <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">{word.correctCount || 0} lần</div>
            </div>
            <div className="border-l border-[#30363D]">
              <span className="text-xs font-semibold text-slate-400 uppercase">Số lần sai</span>
              <div className="text-base sm:text-lg font-black text-rose-400 mt-0.5">{word.incorrectCount || 0} lần</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#2D3135] bg-[#16191D] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenAiBoosterForWord(word);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Mở rộng sâu bằng AI
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

