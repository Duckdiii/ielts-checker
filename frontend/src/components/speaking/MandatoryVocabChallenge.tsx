import React, { useState } from 'react';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  Sparkles,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { VocabItem, MandatoryWordEvaluation } from '../../types';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';

export interface PinnedWordItem {
  term: string;
  ipa?: string;
  meaningVi: string;
  ieltsBand?: string;
  collocation?: string;
  samplePhraseVi?: string;
}

interface MandatoryVocabChallengeProps {
  pinnedWords: PinnedWordItem[];
  liveTranscript?: string;
  isRecording?: boolean;
  onRefreshWords?: () => void;
  allWords?: VocabItem[];
  onSelectCustomWord?: (word: PinnedWordItem) => void;
  compact?: boolean;
}

/**
 * Check if a word or its root/plural/past tense is present in the transcript
 */
export function isWordInTranscript(word: string, transcript: string): boolean {
  if (!transcript || !word) return false;
  const cleanTranscript = transcript.toLowerCase();
  const base = word.toLowerCase().trim();

  // Direct word match with word boundary
  const regex = new RegExp(`\\b${base}\\b`, 'i');
  if (regex.test(cleanTranscript)) return true;

  // Stem variations (e.g. exacerbate -> exacerbates, exacerbated, exacerbating)
  const stem = base.replace(/(e|ing|ed|es|s|tion|ly)$/, '');
  if (stem.length >= 4) {
    const stemRegex = new RegExp(`\\b${stem}[a-z]{0,5}\\b`, 'i');
    if (stemRegex.test(cleanTranscript)) return true;
  }

  return false;
}

/**
 * Component: Pinned Target Vocabulary Challenge before/during speaking
 */
export const MandatoryVocabChallenge: React.FC<MandatoryVocabChallengeProps> = ({
  pinnedWords,
  liveTranscript = '',
  isRecording = false,
  onRefreshWords,
  compact = false,
}) => {
  const [showTips, setShowTips] = useState<boolean>(false);

  if (!pinnedWords || pinnedWords.length === 0) return null;

  const usedCount = pinnedWords.filter((w) => isWordInTranscript(w.term, liveTranscript)).length;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#181C24] via-[#161B22] to-[#12151B] border border-amber-500/30 shadow-xl overflow-hidden animate-fadeIn transition-all">
      {/* Header Banner */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-[#30363D] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Target className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Thử Thách Lồng Ghép Từ Vựng Mục Tiêu
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300">
                {usedCount}/{pinnedWords.length} ĐÃ DÙNG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Bắt buộc lồng ghép tự nhiên vào bài nói để chứng minh năng lực từ vựng Band 8.0+
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshWords && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onRefreshWords();
              }}
              className="p-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-slate-300 hover:text-amber-400 border border-[#30363D] text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
              title="Đổi bộ từ vựng mục tiêu khác"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">Đổi từ</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="p-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-slate-400 hover:text-slate-200 border border-[#30363D] text-xs transition-all cursor-pointer"
            title="Mẹo lồng ghép từ vựng tự nhiên"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Guide tooltip if open */}
      {showTips && (
        <div className="px-5 py-3 bg-amber-950/20 border-b border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Tiêu chí chấm điểm của Giám Khảo AI:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-slate-300">
              <li>Không chỉ nói từ đơn lẻ, hãy dùng đúng <strong>Collocation tự nhiên</strong> (cụm từ đi kèm).</li>
              <li>Đảm bảo đúng <strong>ngữ pháp</strong> (danh từ, động từ hay tính từ).</li>
              <li>Tránh nhồi nhét gượng ép làm mất tính mạch lạc của bài nói.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Words Grid */}
      <div className={`p-4 grid ${compact ? 'grid-cols-1 sm:grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-3.5'}`}>
        {pinnedWords.map((wordItem, idx) => {
          const isUsed = isWordInTranscript(wordItem.term, liveTranscript);

          return (
            <div
              key={idx}
              className={`relative rounded-2xl p-3.5 border transition-all duration-300 ${
                isUsed
                  ? 'bg-emerald-950/25 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                  : 'bg-[#1C2128] border-[#30363D] hover:border-amber-500/40'
              }`}
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isUsed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isRecording
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                      : 'bg-[#2D333B] text-slate-400'
                  }`}
                >
                  {isUsed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ĐÃ DÙNG
                    </>
                  ) : (
                    <>
                      <Flame className="w-3 h-3 text-amber-400" />
                      MỤC TIÊU
                    </>
                  )}
                </span>

                {wordItem.ieltsBand && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Band {wordItem.ieltsBand}
                  </span>
                )}
              </div>

              {/* Term & Audio */}
              <div className="flex items-baseline justify-between gap-1">
                <span className="font-extrabold text-sm text-slate-100 font-mono tracking-tight">
                  {wordItem.term}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    speakWord(wordItem.term);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-[#2D333B] transition-all cursor-pointer"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {wordItem.ipa && (
                <div className="text-[11px] font-mono text-slate-400 mb-1">{wordItem.ipa}</div>
              )}

              <div className="text-xs text-slate-300 font-medium line-clamp-1 mb-2">
                {wordItem.meaningVi}
              </div>

              {/* Suggested Collocation / Context */}
              {wordItem.collocation && (
                <div className="pt-2 border-t border-[#2D333B]/60 text-[11px]">
                  <span className="text-amber-400/90 font-semibold">Cụm gợi ý: </span>
                  <span className="text-slate-300 italic font-mono">
                    "{wordItem.collocation}"
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Component: Detailed Post-Speaking Mandatory Vocab Diagnostic Report
 */
interface MandatoryVocabReportProps {
  evaluations?: MandatoryWordEvaluation[];
  targetWordsUsed?: string[];
  targetWordsMissed?: string[];
}

export const MandatoryVocabReport: React.FC<MandatoryVocabReportProps> = ({
  evaluations = [],
  targetWordsUsed = [],
  targetWordsMissed = [],
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // If no evaluations array was returned from Gemini, fallback to basic list
  if (!evaluations || evaluations.length === 0) {
    if ((!targetWordsUsed || targetWordsUsed.length === 0) && (!targetWordsMissed || targetWordsMissed.length === 0)) {
      return null;
    }

    return (
      <div className="p-5 rounded-3xl bg-[#16191F] border border-[#2D333B] shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">Kiểm Tra Từ Vựng Mục Tiêu</h4>
            <p className="text-xs text-slate-400">Đánh giá khả năng áp dụng từ vựng C1/C2 vào bài thi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Từ vựng đã sử dụng ({targetWordsUsed.length})
            </div>
            {targetWordsUsed.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {targetWordsUsed.map((w, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold">
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa phát hiện từ vựng mục tiêu nào trong bài nói.</p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30">
            <div className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Từ vựng bị bỏ lỡ ({targetWordsMissed.length})
            </div>
            {targetWordsMissed.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {targetWordsMissed.map((w, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-xs font-semibold">
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-300 font-semibold">Tuyệt vời! Bạn đã không bỏ sót từ nào.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const successCount = evaluations.filter((e) => e.used && e.correctGrammar && e.correctCollocationAndRegister).length;
  const totalCount = evaluations.length;
  const percentage = Math.round((successCount / totalCount) * 100);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#161B22] to-[#12151B] border border-amber-500/40 shadow-2xl space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2D333B]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
            <Award className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-100">
                🎯 Đánh Giá Thử Thách Lồng Ghép Từ Vựng
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  percentage >= 75
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : percentage >= 50
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {successCount}/{totalCount} ĐẠT CHUẨN ({percentage}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân tích độ tự nhiên của Collocation, tính chính xác ngữ pháp và sắc thái học thuật (Register)
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Word Cards */}
      <div className="space-y-3.5">
        {evaluations.map((item, idx) => {
          const isSuccess = item.used && item.correctGrammar && item.correctCollocationAndRegister;
          const isPartial = item.used && (!item.correctGrammar || !item.correctCollocationAndRegister);
          const isMissed = !item.used;
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isSuccess
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : isPartial
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-900/60 border-[#30363D]'
              }`}
            >
              {/* Card Summary Header */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSuccess
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isPartial
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isPartial ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-100 font-mono">
                        {item.term}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isPartial
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {isSuccess
                          ? 'Dùng Xuất Sắc'
                          : isPartial
                          ? 'Cần Chỉnh Collocation/Ngữ Pháp'
                          : 'Chưa Dùng'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      speakWord(item.term);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-[#2D333B] transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Diagnostic Body */}
              <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] space-y-3 text-xs">
                {/* Candidate Context Quote */}
                {item.contextSentence ? (
                  <div className="p-3 rounded-xl bg-[#12141A] border border-[#2D333B] text-slate-300">
                    <span className="text-slate-400 font-semibold block mb-1">
                      🗣️ Câu bạn đã nói trong bài thi:
                    </span>
                    <p className="italic font-serif text-slate-200">
                      "{item.contextSentence}"
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300/90 text-xs">
                    ⚠️ Từ này chưa xuất hiện trong bài nói. Hãy tập lồng ghép vào câu mở đầu hoặc phần lập luận!
                  </div>
                )}

                {/* AI Feedback */}
                <div className="space-y-1">
                  <span className="font-bold text-amber-300">
                    Nhận xét của Giám khảo AI:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{item.feedbackVi}</p>
                </div>

                {/* Recommended Upgrade */}
                {item.suggestedUpgradeVi && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/30 text-purple-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        Gợi ý Collocation Chuẩn Band 8.5+:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          speakWord(item.suggestedUpgradeVi || '');
                        }}
                        className="text-[11px] text-purple-300 hover:text-purple-100 flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Nghe Mẫu
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {item.suggestedUpgradeVi}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
