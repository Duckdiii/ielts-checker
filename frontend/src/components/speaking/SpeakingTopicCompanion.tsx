import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { VocabItem } from '../../types';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';

interface SpeakingTopicCompanionProps {
  currentTopic: string;
  part: number;
  activeSetWords?: VocabItem[];
  onInsertText?: (text: string) => void;
  onOpenRadar?: () => void;
}

// Curated Band 8.0+ Academic Discourse Markers by Function
const DISCOURSE_MARKERS = [
  {
    category: 'Mở Rộng & Bổ Sung',
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    items: [
      { phrase: 'Furthermore', meaning: 'Hơn thế nữa', example: 'Furthermore, it fosters critical thinking.' },
      { phrase: 'What is more', meaning: 'Thêm vào đó', example: 'What is more, it saves substantial time.' },
      { phrase: 'Equally important is that', meaning: 'Quan trọng không kém là', example: 'Equally important is that we stay disciplined.' },
    ],
  },
  {
    category: 'Tương Phản & Đảo Ý',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    items: [
      { phrase: 'On the flip side', meaning: 'Ở một khía cạnh khác', example: 'On the flip side, it poses severe risks.' },
      { phrase: 'Notwithstanding this', meaning: 'Mặc dù vậy', example: 'Notwithstanding this, the benefits outweigh costs.' },
      { phrase: 'Conversely', meaning: 'Ngược lại', example: 'Conversely, traditional methods remain vital.' },
    ],
  },
  {
    category: 'Dẫn Chứng & Minh Họa',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    items: [
      { phrase: 'To illustrate this point', meaning: 'Để minh họa điều này', example: 'To illustrate this point, consider electric cars.' },
      { phrase: 'A prime exemplar is', meaning: 'Một ví dụ điển hình là', example: 'A prime exemplar is the rise of AI assistants.' },
      { phrase: 'In light of this', meaning: 'Xét theo góc nhìn này', example: 'In light of this, reforms are imperative.' },
    ],
  },
  {
    category: 'Kết Luận & Hệ Quả',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    items: [
      { phrase: 'This inevitably breeds', meaning: 'Điều này ắt dẫn đến', example: 'This inevitably breeds higher productivity.' },
      { phrase: 'All things considered', meaning: 'Cân nhắc mọi yếu tố', example: 'All things considered, it is a prudent choice.' },
      { phrase: 'As a direct corollary', meaning: 'Như một hệ quả trực tiếp', example: 'As a direct corollary, job security rises.' },
    ],
  },
];

// Curated high-yield topic vocabulary map
const TOPIC_VOCAB_DICTIONARY: Record<
  string,
  Array<{ term: string; ipa: string; meaningVi: string; collocation: string }>
> = {
  Technology: [
    { term: 'streamline', ipa: '/ˈstriːmlaɪn/', meaningVi: 'tinh gọn, đẩy nhanh tiến độ', collocation: 'streamline daily operations' },
    { term: 'indispensable', ipa: '/ˌɪndɪˈspensəbl/', meaningVi: 'không thể thiếu', collocation: 'play an indispensable role' },
    { term: 'revolutionize', ipa: '/ˌrevəˈluːʃənaɪz/', meaningVi: 'cách mạng hóa', collocation: 'revolutionize modern education' },
    { term: 'cutting-edge', ipa: '/ˌkʌtɪŋ ˈedʒ/', meaningVi: 'tiên tiến bậc nhất', collocation: 'cutting-edge innovation' },
  ],
  Environment: [
    { term: 'mitigate', ipa: '/ˈmɪtɪɡeɪt/', meaningVi: 'làm giảm nhẹ, xoa dịu', collocation: 'mitigate environmental degradation' },
    { term: 'sustainable', ipa: '/səˈsteɪnəbl/', meaningVi: 'bền vững lâu dài', collocation: 'sustainable eco-friendly practices' },
    { term: 'biodiversity', ipa: '/ˌbaɪəʊdaɪˈvɜːsəti/', meaningVi: 'đa dạng sinh học', collocation: 'safeguard endangered biodiversity' },
    { term: 'deteriorate', ipa: '/dɪˈtɪəriəreɪt/', meaningVi: 'xuống cấp, xấu đi', collocation: 'deteriorating air quality' },
  ],
  Education: [
    { term: 'adaptability', ipa: '/əˌdæptəˈbɪləti/', meaningVi: 'khả năng thích nghi', collocation: 'foster cognitive adaptability' },
    { term: 'perseverance', ipa: '/ˌpɜːsɪˈvɪərəns/', meaningVi: 'sự kiên trì, bền bỉ', collocation: 'demonstrate remarkable perseverance' },
    { term: 'holistic', ipa: '/həʊˈlɪstɪk/', meaningVi: 'toàn diện', collocation: 'a holistic educational framework' },
    { term: 'interdisciplinary', ipa: '/ˌɪntəˌdɪsəˈplɪnəri/', meaningVi: 'liên ngành', collocation: 'interdisciplinary research' },
  ],
  Society: [
    { term: 'homogenization', ipa: '/həˌmɒdʒənaɪˈzeɪʃn/', meaningVi: 'đồng nhất hóa văn hóa', collocation: 'resist cultural homogenization' },
    { term: 'interconnected', ipa: '/ˌɪntəkəˈnektɪd/', meaningVi: 'gắn kết chặt chẽ', collocation: 'deeply interconnected world' },
    { term: 'discrepancy', ipa: '/dɪˈskrepənsi/', meaningVi: 'sự chênh lệch, bất cân xứng', collocation: 'glaring socio-economic discrepancy' },
    { term: 'coexistence', ipa: '/ˌkəʊɪɡˈzɪstəns/', meaningVi: 'sự chung sống hòa bình', collocation: 'harmonious cultural coexistence' },
  ],
};

export const SpeakingTopicCompanion: React.FC<SpeakingTopicCompanionProps> = ({
  currentTopic,
  part,
  activeSetWords = [],
  onInsertText,
  onOpenRadar,
}) => {
  const [activeTab, setActiveTab] = useState<'topic-vocab' | 'connectors' | 'checklist'>('topic-vocab');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedMarkerCat, setExpandedMarkerCat] = useState<string>('Mở Rộng & Bổ Sung');

  // Find matching topic dictionary
  const matchedKey =
    Object.keys(TOPIC_VOCAB_DICTIONARY).find((k) =>
      currentTopic.toLowerCase().includes(k.toLowerCase())
    ) || 'Technology';

  const curatedVocab = TOPIC_VOCAB_DICTIONARY[matchedKey] || TOPIC_VOCAB_DICTIONARY.Technology;

  const handleCopy = (text: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const handleSpeak = (text: string) => {
    sounds.playClick();
    speakWord(text);
  };

  return (
    <aside className="w-full bg-[#12161C] border border-[#242A36] rounded-3xl p-4 sm:p-4.5 shadow-xl space-y-4 backdrop-blur-md sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#202734] pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <BookOpen className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-black text-white tracking-wide uppercase">
              Trợ Lý Từ Vựng & C1/C2
            </h3>
            <p className="text-[10px] text-[#8E97A4] line-clamp-1">
              Dành riêng cho {currentTopic.split('(')[0]}
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
          Part {part}
        </span>
      </div>

      {/* Segmented Sub-tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0E1218] border border-[#202632]">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('topic-vocab');
          }}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'topic-vocab'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-[#8E97A4] hover:text-white'
          }`}
        >
          🎯 Topic Vocab
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('connectors');
          }}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'connectors'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-[#8E97A4] hover:text-white'
          }`}
        >
          🔗 Từ Nối C1
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('checklist');
          }}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-[#8E97A4] hover:text-white'
          }`}
        >
          ⚠️ Bẫy Lỗi
        </button>
      </div>

      {/* Tab 1: Topic Vocab & Collocations */}
      {activeTab === 'topic-vocab' && (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar animate-fadeIn">
          <div className="text-[10px] text-[#8E97A4] font-medium flex items-center justify-between">
            <span>Từ vựng & Cụm ăn điểm theo chủ đề:</span>
            <span className="text-purple-400 font-bold">{curatedVocab.length} từ Band 8.0+</span>
          </div>

          <div className="space-y-2">
            {curatedVocab.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-2xl bg-[#161C26] border border-[#262E3D] hover:border-purple-500/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">
                      {item.term}
                    </span>
                    <span className="text-[10px] text-[#6F7B8C] font-mono">{item.ipa}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeak(item.term)}
                      className="p-1 rounded-lg bg-[#202736] hover:bg-purple-600 text-[#8E97A4] hover:text-white transition-all cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCopy(item.collocation)}
                      className="p-1 rounded-lg bg-[#202736] hover:bg-purple-600 text-[#8E97A4] hover:text-white transition-all cursor-pointer"
                      title="Sao chép cụm Collocation"
                    >
                      {copiedText === item.collocation ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[#8E97A4] mt-1 font-medium">{item.meaningVi}</div>

                <div className="mt-1.5 pt-1.5 border-t border-[#202734] flex items-center justify-between text-[10px]">
                  <span className="text-purple-300/90 font-mono italic truncate max-w-[200px]">
                    ✨ {item.collocation}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 text-[9px] font-bold">
                    Band 8+
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Active Set Injector (if available) */}
          {activeSetWords.length > 0 && (
            <div className="pt-2 border-t border-[#202734]">
              <div className="text-[10px] text-[#8E97A4] font-bold mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>Từ vựng từ bộ từ đang học ({activeSetWords.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeSetWords.slice(0, 5).map((w, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSpeak(w.term)}
                    className="px-2 py-1 rounded-lg bg-[#181E2A] hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-[#252E40] text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    {w.term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Academic Connectors & Discourse Markers */}
      {activeTab === 'connectors' && (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar animate-fadeIn">
          <div className="text-[10px] text-[#8E97A4] font-medium">
            Liên từ nối nâng cao giúp đẩy tiêu chí <strong className="text-white">Fluency & Coherence</strong>:
          </div>

          <div className="space-y-2">
            {DISCOURSE_MARKERS.map((cat, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#161C26] border border-[#242C3D] overflow-hidden transition-all"
              >
                <button
                  onClick={() => {
                    sounds.playClick();
                    setExpandedMarkerCat(expandedMarkerCat === cat.category ? '' : cat.category);
                  }}
                  className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#1C2332] transition-colors cursor-pointer"
                >
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${cat.color}`}>
                    {cat.category}
                  </span>
                  {expandedMarkerCat === cat.category ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {expandedMarkerCat === cat.category && (
                  <div className="p-2.5 pt-0 space-y-2 border-t border-[#202734]">
                    {cat.items.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-2 rounded-xl bg-[#0E1218] border border-[#222938] space-y-1 hover:border-purple-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white font-mono">{m.phrase}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSpeak(m.phrase)}
                              className="p-0.5 rounded text-[#8E97A4] hover:text-white cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleCopy(m.phrase)}
                              className="p-0.5 rounded text-[#8E97A4] hover:text-white cursor-pointer"
                            >
                              {copiedText === m.phrase ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#8E97A4]">{m.meaning}</div>
                        <div className="text-[9.5px] text-slate-400 italic">Ví dụ: "{m.example}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Pre-Speaking Checklist & Radar Watchlist */}
      {activeTab === 'checklist' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Sổ Tay Radar: 4 Điểm Cần Nhớ</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-black">1.</span>
                <span>Phát âm rõ âm đuôi <strong className="text-white">/s/, /z/, /ed/</strong>, không nuốt âm.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-black">2.</span>
                <span>Tránh lặp các từ đệm: <em className="text-amber-300">"like", "you know", "I mean"</em>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-black">3.</span>
                <span>Dùng ít nhất 1 câu ghép hoặc câu điều kiện giả định (Hypothetical).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-black">4.</span>
                <span>Giữ nhịp độ từ <strong className="text-emerald-400 font-mono">130 - 160 WPM</strong>.</span>
              </li>
            </ul>

            {onOpenRadar && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenRadar();
                }}
                className="w-full mt-2 py-1.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-bold flex items-center justify-center gap-1 border border-red-500/40 cursor-pointer transition-all"
              >
                <span>Mở Toàn Bộ Sổ Tay Bẫy Lỗi (Radar)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
