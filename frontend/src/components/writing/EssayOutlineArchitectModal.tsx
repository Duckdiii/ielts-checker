import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  X,
  Check,
  Copy,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Layers,
  Award,
  Zap,
} from 'lucide-react';
import { EssayOutline, VocabItem } from '../../types';
import { generateEssayOutline } from '../../services/apiService';
import { sounds } from '../../utils/soundEffects';

interface EssayOutlineArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskType: string;
  topic: string;
  promptQuestion: string;
  words: VocabItem[];
  onInsertOutline: (outlineText: string) => void;
}

export function EssayOutlineArchitectModal({
  isOpen,
  onClose,
  taskType,
  topic,
  promptQuestion,
  words,
  onInsertOutline,
}: EssayOutlineArchitectModalProps) {
  const [userStance, setUserStance] = useState('Đồng ý một phần / Phân tích 2 chiều cân bằng');
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState<EssayOutline | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetVocabTerms = words.slice(0, 8).map((w) => w.term);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      sounds.playClick();
      const data = await generateEssayOutline({
        taskType,
        topic,
        promptQuestion,
        userStance,
        targetWords: targetVocabTerms,
      });
      setOutline(data);
      sounds.playComplete();
    } catch (err: any) {
      console.error('Error generating outline:', err);
      sounds.playWrong();
    } finally {
      setLoading(false);
    }
  };

  const formatOutlineForInsert = (data: EssayOutline) => {
    return `/* 🧠 DÀN Ý ESSAY ARCHITECT (BAND 8.5) */

[INTRODUCTION]
- Paraphrase: ${data.introduction.paraphraseEn}
- Thesis Statement: ${data.introduction.thesisEn}

[BODY PARAGRAPH 1]
- Topic Sentence: ${data.body1.topicSentenceEn}
- Explanation: ${data.body1.explanationVi}
- Example: ${data.body1.exampleEn}

[BODY PARAGRAPH 2]
- Topic Sentence: ${data.body2.topicSentenceEn}
- Explanation: ${data.body2.explanationVi}
- Example: ${data.body2.exampleEn}

[CONCLUSION]
- Summary: ${data.conclusion.summaryEn}
- Final Thought: ${data.conclusion.finalThoughtVi}
`;
  };

  const handleInsert = () => {
    if (!outline) return;
    sounds.playSuccess();
    onInsertOutline(formatOutlineForInsert(outline));
    onClose();
  };

  const handleCopy = () => {
    if (!outline) return;
    navigator.clipboard.writeText(formatOutlineForInsert(outline));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl neo-glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>AI Essay Architect</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  Dàn Ý 4 Đoạn
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Thiết kế Thesis Statement sắc bén và luận điểm logic trong 30 giây
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="my-4 overflow-y-auto space-y-4 pr-1">
          {/* Prompt Question Display */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Đề bài hiện tại:</span>
            <p className="text-slate-200 font-semibold italic">"{promptQuestion}"</p>
          </div>

          {/* Stance Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Lập trường / Quan điểm của bạn cho bài viết:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                'Đồng ý hoàn toàn (Strongly Agree)',
                'Không đồng ý (Strongly Disagree)',
                'Cân bằng / Thảo luận 2 phía (Balanced View)',
              ].map((stance) => (
                <button
                  key={stance}
                  type="button"
                  onClick={() => setUserStance(stance)}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                    userStance === stance
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm'
                      : 'bg-white/[0.03] text-slate-400 border-white/5 hover:bg-white/[0.06] hover:text-slate-200'
                  }`}
                >
                  {stance}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          {!outline && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-indigo-600/40 hover:shadow-indigo-600/60 disabled:opacity-50 cursor-pointer flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>AI đang kiến tạo dàn bài 4 đoạn...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Tạo Dàn Ý Chuẩn Band 8.5 Ngay</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Generated Outline Result */}
          {outline && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Thesis Statement Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-transparent border border-indigo-500/30">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 block mb-1">
                  ✨ Thesis Statement (Câu Luận Điểm Đinh):
                </span>
                <p className="text-sm sm:text-base font-black text-white leading-relaxed">
                  "{outline.thesisStatement}"
                </p>
                <p className="text-xs text-slate-300 italic mt-1">({outline.thesisStatementVi})</p>
              </div>

              {/* 4 Paragraph Sections */}
              <div className="grid grid-cols-1 gap-3">
                {/* Introduction */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="text-xs font-black text-indigo-300 uppercase mb-1">1. Introduction (Mở Bài)</div>
                  <p className="text-xs text-slate-300"><strong>Paraphrase:</strong> {outline.introduction.paraphraseEn}</p>
                </div>

                {/* Body 1 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
                  <div className="text-xs font-black text-emerald-400 uppercase">2. Body 1 (Thân Bài 1)</div>
                  <p className="text-xs text-slate-200"><strong>Topic Sentence:</strong> {outline.body1.topicSentenceEn}</p>
                  <p className="text-xs text-slate-400"><strong>Giải thích:</strong> {outline.body1.explanationVi}</p>
                  <p className="text-xs text-slate-300 italic"><strong>Ví dụ:</strong> "{outline.body1.exampleEn}"</p>
                </div>

                {/* Body 2 */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
                  <div className="text-xs font-black text-amber-400 uppercase">3. Body 2 (Thân Bài 2)</div>
                  <p className="text-xs text-slate-200"><strong>Topic Sentence:</strong> {outline.body2.topicSentenceEn}</p>
                  <p className="text-xs text-slate-400"><strong>Giải thích:</strong> {outline.body2.explanationVi}</p>
                  <p className="text-xs text-slate-300 italic"><strong>Ví dụ:</strong> "{outline.body2.exampleEn}"</p>
                </div>

                {/* Conclusion */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="text-xs font-black text-purple-300 uppercase mb-1">4. Conclusion (Kết Bài)</div>
                  <p className="text-xs text-slate-300"><strong>Summary:</strong> {outline.conclusion.summaryEn}</p>
                </div>
              </div>

              {/* Recommended Collocations */}
              {outline.suggestedCollocations && outline.suggestedCollocations.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Collocations Band 8+ khuyên dùng trong bài:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {outline.suggestedCollocations.map((col, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-indigo-300 font-semibold"
                      >
                        {col.phrase} <span className="text-slate-400 font-normal text-[10px]">({col.meaningVi})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {outline && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép dàn bài'}</span>
              </button>

              <button
                type="button"
                onClick={handleInsert}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Chèn vào khung viết bài</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
