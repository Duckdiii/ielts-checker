import React, { useState } from 'react';
import { X, Plus, Sparkles, BookOpen, Tag } from 'lucide-react';
import { VocabItem } from '../../types';
import { IELTS_TOPICS } from '../../utils/topicHelpers';

interface ManualWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    word: Omit<
      VocabItem,
      | 'id'
      | 'sourceSetId'
      | 'mastery'
      | 'srsStage'
      | 'nextReviewDate'
      | 'reviewCount'
      | 'correctCount'
      | 'incorrectCount'
    >
  ) => void;
}

export const ManualWordModal: React.FC<ManualWordModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [term, setTerm] = useState('');
  const [ipa, setIpa] = useState('');
  const [meaning, setMeaning] = useState('');
  const [wordFamily, setWordFamily] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [antonyms, setAntonyms] = useState('');
  const [example, setExample] = useState('');
  const [notes, setNotes] = useState('');
  const [targetIeltsBand, setTargetIeltsBand] = useState('7.5');
  const [topic, setTopic] = useState('Giáo dục & Học thuật');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !meaning.trim()) return;

    onSave({
      term: term.trim(),
      ipa: ipa.trim() || undefined,
      meaning: meaning.trim(),
      wordFamily: wordFamily.trim() || undefined,
      synonyms: synonyms.trim() || undefined,
      antonyms: antonyms.trim() || undefined,
      example: example.trim() || undefined,
      notes: notes.trim() || undefined,
      targetIeltsBand: targetIeltsBand as any,
      topic: topic || 'Học thuật tổng hợp',
    });

    // Reset
    setTerm('');
    setIpa('');
    setMeaning('');
    setWordFamily('');
    setSynonyms('');
    setAntonyms('');
    setExample('');
    setNotes('');
    setTopic('Giáo dục & Học thuật');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#16191D] rounded-3xl max-w-lg w-full shadow-2xl border border-[#2D3135] overflow-hidden my-8 animate-fadeIn text-[#E0E2E4] relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

        <div className="p-6 pb-4 border-b border-[#2D3135] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Thêm Từ Vựng Mới</h2>
              <p className="text-xs text-[#8B949E]">Thêm thủ công từ vựng vào bộ hiện tại kèm phân loại chủ đề</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
              Từ vựng tiếng Anh (bắt buộc) *
            </label>
            <input
              type="text"
              required
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g., Ubiquitous"
              className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                Phiên âm IPA
              </label>
              <input
                type="text"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                placeholder="/juːˈbɪk.wə.təs/"
                className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                Target IELTS Band
              </label>
              <select
                value={targetIeltsBand}
                onChange={(e) => setTargetIeltsBand(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="6.5">Band 6.5</option>
                <option value="7.0">Band 7.0</option>
                <option value="7.5">Band 7.5</option>
                <option value="8.0">Band 8.0</option>
                <option value="8.5">Band 8.5+</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Chủ đề từ vựng (Topic)
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              {IELTS_TOPICS.map((t) => (
                <option key={t.id} value={t.nameVi}>
                  {t.icon} {t.nameVi} ({t.nameEn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
              Nghĩa tiếng Việt (bắt buộc) *
            </label>
            <input
              type="text"
              required
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="e.g., Phổ biến ở khắp mọi nơi, có mặt ở khắp chốn"
              className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
              Word Family (Họ từ loại)
            </label>
            <input
              type="text"
              value={wordFamily}
              onChange={(e) => setWordFamily(e.target.value)}
              placeholder="e.g., Ubiquity (n), Ubiquitously (adv)"
              className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                Từ đồng nghĩa (Synonyms)
              </label>
              <input
                type="text"
                value={synonyms}
                onChange={(e) => setSynonyms(e.target.value)}
                placeholder="e.g., Omnipresent, Pervasive"
                className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                Từ trái nghĩa (Antonyms)
              </label>
              <input
                type="text"
                value={antonyms}
                onChange={(e) => setAntonyms(e.target.value)}
                placeholder="e.g., Rare, Scarce"
                className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
              Ví dụ câu ngữ cảnh
            </label>
            <textarea
              rows={2}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="e.g., Smart mobile devices have become ubiquitous in contemporary urban centers."
              className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
              Ghi chú / Mẹo nhớ
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Thường dùng trong IELTS Writing Task 2"
              className="w-full p-2.5 rounded-xl bg-[#21262D] border border-[#30363D] text-white text-xs focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-[#2D3135] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Lưu vào kho từ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
