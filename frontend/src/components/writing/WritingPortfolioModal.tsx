import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Trophy,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { WritingPortfolioItem } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface WritingPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadEssay: (essay: WritingPortfolioItem) => void;
  userId?: string;
}

export function WritingPortfolioModal({
  isOpen,
  onClose,
  onLoadEssay,
  userId = 'guest',
}: WritingPortfolioModalProps) {
  const [items, setItems] = useState<WritingPortfolioItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WritingPortfolioItem | null>(null);
  const [copied, setCopied] = useState(false);

  const storageKey = `ielts_writing_portfolio_v1_${userId}`;

  useEffect(() => {
    if (isOpen) {
      try {
        let raw = localStorage.getItem(storageKey);
        if (!raw && userId === 'guest') {
          raw = localStorage.getItem('ielts_writing_portfolio_v1');
        }
        if (raw) {
          const parsed = JSON.parse(raw);
          setItems(parsed);
          if (parsed.length > 0) {
            setSelectedItem(parsed[0]);
          }
        } else {
          setItems([]);
          setSelectedItem(null);
        }
      } catch (e) {
        console.error('Failed to load writing portfolio:', e);
      }
    }
  }, [isOpen, storageKey, userId]);

  if (!isOpen) return null;

  const averageBand = items.length > 0
    ? (items.reduce((acc, item) => acc + item.overallBand, 0) / items.length).toFixed(1)
    : '0.0';

  const handleCopyModel = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    sounds.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl neo-glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Hồ Sơ Bài Viết IELTS (Writing Portfolio)</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {items.length} Bài Đã Viết
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Lưu trữ lịch sử bài làm, xem lại bản sửa Band 8.5+ và biểu đồ tiến bộ
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
        {items.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">Chưa có bài viết nào được lưu</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Khi bạn hoàn thành và chấm điểm một bài viết trong Writing Lab, bài viết sẽ được tự động lưu trữ tại đây.
            </p>
          </div>
        ) : (
          <div className="my-4 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto max-h-[60vh] pr-1">
            {/* Left list of submissions (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Band Trung Bình:</span>
                <span className="text-base font-black text-indigo-300">Band {averageBand}</span>
              </div>

              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      sounds.playClick();
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedItem?.id === item.id
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-indigo-500/50 text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-indigo-300 px-1.5 py-0.2 rounded bg-indigo-500/20 border border-indigo-500/30">
                        {item.taskType === 'task2_essay' ? 'Task 2 Essay' : 'Task 1 Report'}
                      </span>
                      <span className="text-xs font-black text-emerald-400">
                        Band {item.overallBand.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 truncate">{item.topic}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span>{item.wordCount} từ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right details / side-by-side comparison (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedItem ? (
                <div className="space-y-4">
                  {/* Criteria Scores Row */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold">Task Response</span>
                      <span className="text-sm font-black text-indigo-300">
                        {selectedItem.criteriaScores?.taskResponse || selectedItem.overallBand}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold">Coherence</span>
                      <span className="text-sm font-black text-emerald-300">
                        {selectedItem.criteriaScores?.coherenceCohesion || selectedItem.overallBand}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold">Lexical</span>
                      <span className="text-sm font-black text-amber-300">
                        {selectedItem.criteriaScores?.lexicalResource || selectedItem.overallBand}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold">Grammar</span>
                      <span className="text-sm font-black text-purple-300">
                        {selectedItem.criteriaScores?.grammaticalRange || selectedItem.overallBand}
                      </span>
                    </div>
                  </div>

                  {/* Essay Comparison Tabs / Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Submission */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">Bài viết của bạn:</span>
                        <span className="text-[10px] text-slate-500">{selectedItem.wordCount} từ</span>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-mono">
                        {selectedItem.essayText}
                      </div>
                    </div>

                    {/* Model Rewrite */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Bản sửa Band 8.5+:
                        </span>
                        {selectedItem.modelRewrite && (
                          <button
                            type="button"
                            onClick={() => handleCopyModel(selectedItem.modelRewrite)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer flex items-center gap-1"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-serif italic">
                        {selectedItem.modelRewrite || 'Chưa có bản viết lại Band 8.5+ cho bài này.'}
                      </div>
                    </div>
                  </div>

                  {/* Load into editor button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadEssay(selectedItem);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Mở lại bài viết vào khung làm việc</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
