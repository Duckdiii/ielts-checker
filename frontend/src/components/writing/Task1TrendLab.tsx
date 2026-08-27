import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  PieChart,
  GitCommit,
  Map,
  Layers,
  Copy,
  Check,
  Search,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface Task1TrendLabProps {
  onInsertPhrase?: (phrase: string) => void;
}

export function Task1TrendLab({ onInsertPhrase }: Task1TrendLabProps) {
  const [activeCategory, setActiveCategory] = useState<'up' | 'down' | 'fluctuate' | 'proportion' | 'comparison'>('up');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  const trendCategories = [
    {
      id: 'up',
      name: '📈 Tăng Trưởng (Upward Trends)',
      items: [
        { verb: 'surge / soar', noun: 'a sharp surge', meaning: 'Tăng vọt đột biến', sample: 'The number of visitors soared dramatically to a peak of 50,000 in 2020.' },
        { verb: 'climb steadily', noun: 'a steady climb', meaning: 'Tăng đều đặn theo thời gian', sample: 'Sales climbed steadily over the 5-year period.' },
        { verb: 'double / threefold increase', noun: 'a twofold rise', meaning: 'Tăng gấp đôi / gấp ba', sample: 'Car ownership witnessed a twofold increase between 2000 and 2010.' },
        { verb: 'reach a pinnacle / peak', noun: 'an all-time high', meaning: 'Đạt đỉnh cao nhất', sample: 'The figures reached a peak of 85% before declining slightly.' },
      ],
    },
    {
      id: 'down',
      name: '📉 Suy Giảm (Downward Trends)',
      items: [
        { verb: 'plummet / plunge', noun: 'a precipitous drop', meaning: 'Lao dốc không phanh', sample: 'Coal consumption plummeted sharply after new environmental regulations.' },
        { verb: 'dwindle / diminish', noun: 'a gradual reduction', meaning: 'Thu hẹp / giảm dần', sample: 'The student population dwindled to just under 500 by the end of the decade.' },
        { verb: 'hit a trough / hit rock bottom', noun: 'the lowest point', meaning: 'Chạm đáy thấp nhất', sample: 'Unemployment hit a trough of 2.1% in late 2015.' },
      ],
    },
    {
      id: 'fluctuate',
      name: '〰️ Biến Động & Đi Ngang (Plateaus)',
      items: [
        { verb: 'oscillate / fluctuate wildy', noun: 'wild fluctuations', meaning: 'Dao động liên tục', sample: 'Oil prices fluctuated wildly between $40 and $110 per barrel.' },
        { verb: 'plateau / level off', noun: 'a period of stability', meaning: 'Đi ngang ổn định', sample: 'After a decade of growth, production leveled off at around 2 million tons.' },
        { verb: 'remain static / unchanged', noun: 'no significant alteration', meaning: 'Giữ nguyên không đổi', sample: 'The proportion of elderly citizens remained static at approximately 15%.' },
      ],
    },
    {
      id: 'proportion',
      name: '📊 Tỷ Lệ & Chiếm Phần (Proportions & Shares)',
      items: [
        { verb: 'account for / constitute', noun: 'the dominant share', meaning: 'Chiếm tỷ lệ bao nhiêu %', sample: 'Renewable energy accounted for nearly two-fifths of total generation.' },
        { verb: 'represent / comprise', noun: 'a negligible fraction', meaning: 'Bao gồm / tạo thành', sample: 'International students comprised roughly 25% of the overall intake.' },
        { verb: 'make up the lion\'s share', noun: 'the overwhelming majority', meaning: 'Chiếm phần lớn nhất', sample: 'Smartphones made up the lion\'s share of consumer electronics expenditure.' },
      ],
    },
    {
      id: 'comparison',
      name: '⚖️ So Sánh Số Liệu (Comparisons)',
      items: [
        { verb: 'outstrip / eclipse', noun: 'a vast disparity', meaning: 'Vượt mặt / áp đảo', sample: 'Expenditure on education comfortably outstripped spending on healthcare.' },
        { verb: 'in stark contrast to', noun: 'a marked contrast', meaning: 'Tương phản rõ rệt với', sample: 'In stark contrast to the urban surge, rural figures witnessed a sharp decline.' },
        { verb: 'be twice as high as', noun: 'a double ratio', meaning: 'Cao gấp đôi so với', sample: 'The proportion of female graduates was twice as high as that of their male counterparts.' },
      ],
    },
  ];

  const currentCategoryData = trendCategories.find((c) => c.id === activeCategory);

  const filteredItems = (currentCategoryData?.items || []).filter(
    (item) =>
      item.verb.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sample.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (sample: string) => {
    navigator.clipboard.writeText(sample);
    setCopiedPhrase(sample);
    sounds.playSuccess();
    setTimeout(() => setCopiedPhrase(null), 2000);
  };

  const handleInsert = (sample: string) => {
    if (onInsertPhrase) {
      onInsertPhrase(sample);
      sounds.playSuccess();
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Category selector & Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {trendCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as any);
                sounds.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm cụm từ Task 1..."
            className="pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Vocabulary Table Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="neo-glass-card p-4 border-white/10 space-y-2.5 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-sm font-black text-indigo-300 font-mono">{item.verb}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                  {item.noun}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold">{item.meaning}</p>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 mt-2">
                <p className="text-xs text-slate-200 italic font-serif leading-relaxed">
                  "{item.sample}"
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => handleCopy(item.sample)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedPhrase === item.sample ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPhrase === item.sample ? 'Đã chép' : 'Sao chép'}</span>
              </button>

              {onInsertPhrase && (
                <button
                  type="button"
                  onClick={() => handleInsert(item.sample)}
                  className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-bold transition-colors border border-indigo-500/30 cursor-pointer flex items-center gap-1"
                >
                  <span>Chèn vào bài</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
