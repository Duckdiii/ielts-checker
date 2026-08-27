import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Layers,
  Check,
  X,
  ArrowRight,
  ArrowUpRight,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { SentenceUpgradeResult } from '../../types';
import { upgradeWritingSentence } from '../../services/apiService';
import { sounds } from '../../utils/soundEffects';

interface InlineSentenceUpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  contextSentence?: string;
  onReplaceText: (newText: string) => void;
}

export function InlineSentenceUpgradePopup({
  isOpen,
  onClose,
  selectedText,
  contextSentence = '',
  onReplaceText,
}: InlineSentenceUpgradePopupProps) {
  const [loading, setLoading] = useState(false);
  const [upgradeData, setUpgradeData] = useState<SentenceUpgradeResult | null>(null);

  if (!isOpen || !selectedText.trim()) return null;

  const handleUpgrade = async (mode: 'all' | 'lexical_band8' | 'complex_grammar' | 'concise_academic') => {
    setLoading(true);
    try {
      sounds.playClick();
      const data = await upgradeWritingSentence({
        selectedText,
        contextSentence,
        targetMode: mode,
      });
      setUpgradeData(data);
      sounds.playComplete();
    } catch (err: any) {
      console.error('Error upgrading sentence:', err);
      sounds.playWrong();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (text: string) => {
    sounds.playSuccess();
    onReplaceText(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl neo-glass-panel rounded-3xl border border-indigo-500/30 p-6 sm:p-7 shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Inline AI Sentence Surgery</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  Nâng Cấp Câu
                </span>
              </h3>
              <p className="text-xs text-slate-400">Phẫu thuật nâng cấp câu bôi đen lên chuẩn Band 8.5+</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Highlighted text preview */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Câu gốc được chọn:
          </span>
          <p className="text-xs sm:text-sm font-semibold text-rose-300 italic">
            "{selectedText}"
          </p>
        </div>

        {/* Trigger initial load if not loaded */}
        {!upgradeData && (
          <div className="text-center py-6 space-y-3">
            <p className="text-xs text-slate-400">Chọn hướng nâng cấp mà bạn mong muốn:</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => handleUpgrade('all')}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                <span>{loading ? 'Đang phân tích...' : 'Nâng cấp toàn diện (3 Biến thể)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {upgradeData && (
          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            {/* Variation 1: Lexical Upgrade */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  1. Nâng Cấp Từ Vựng Học Thuật ({upgradeData.lexicalVariation.cefrLevel || 'C1/C2'})
                </span>
                <button
                  type="button"
                  onClick={() => handleApply(upgradeData.lexicalVariation.text)}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <span>Áp dụng câu này</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                "{upgradeData.lexicalVariation.text}"
              </p>
              <p className="text-[11px] text-slate-300 italic">
                {upgradeData.lexicalVariation.explanationVi}
              </p>
            </div>

            {/* Variation 2: Complex Grammar */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-emerald-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  2. Cấu Trúc Ngữ Pháp Đa Dạng ({upgradeData.grammarVariation.structureType || 'Complex Clause'})
                </span>
                <button
                  type="button"
                  onClick={() => handleApply(upgradeData.grammarVariation.text)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <span>Áp dụng câu này</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                "{upgradeData.grammarVariation.text}"
              </p>
              <p className="text-[11px] text-slate-300 italic">
                {upgradeData.grammarVariation.explanationVi}
              </p>
            </div>

            {/* Variation 3: Concise */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  3. Rút Gọn Súc Tích (Academic Conciseness)
                </span>
                <button
                  type="button"
                  onClick={() => handleApply(upgradeData.conciseVariation.text)}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <span>Áp dụng câu này</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                "{upgradeData.conciseVariation.text}"
              </p>
              <p className="text-[11px] text-slate-300 italic">
                {upgradeData.conciseVariation.explanationVi}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          {upgradeData && (
            <button
              type="button"
              onClick={() => handleUpgrade('all')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tạo lại biến thể khác</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
