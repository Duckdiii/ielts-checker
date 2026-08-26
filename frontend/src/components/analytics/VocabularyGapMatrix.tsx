import React from 'react';
import { VocabItem } from '../../types';
import { IELTS_TOPICS, getTopicInfo } from '../../utils/topicHelpers';
import { AlertCircle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface TopicMatrixItem {
  topic: string;
  totalWords: number;
  masteredWords: number;
  weakWords: number;
  masteryRate: number; // 0 - 100
  color: string;
  icon: string;
  status: 'strong' | 'moderate' | 'weak' | 'critical';
}

interface VocabularyGapMatrixProps {
  words: VocabItem[];
  onSelectTopicFilter?: (topic: string) => void;
  onPracticeTopic?: (topic: string) => void;
}

export const VocabularyGapMatrix: React.FC<VocabularyGapMatrixProps> = ({
  words,
  onSelectTopicFilter,
  onPracticeTopic,
}) => {
  // Aggregate statistics by major IELTS topics
  const topicsList = IELTS_TOPICS.map((t) => t.nameVi);

  // Add any custom topics from words
  words.forEach((w) => {
    if (w.topic && !topicsList.includes(w.topic)) {
      topicsList.push(w.topic);
    }
  });

  const matrixData: TopicMatrixItem[] = topicsList
    .map((topicName) => {
      const topicWords = words.filter((w) => (w.topic || 'Học thuật tổng hợp') === topicName);
      const total = topicWords.length;
      if (total === 0) return null;

      const mastered = topicWords.filter((w) => w.mastery === 'mastered').length;
      const weak = topicWords.filter((w) => (w.incorrectCount || 0) > 0).length;
      const rate = Math.round((mastered / total) * 100);

      let status: 'strong' | 'moderate' | 'weak' | 'critical' = 'moderate';
      if (rate >= 70 && weak <= 2) status = 'strong';
      else if (rate >= 40) status = 'moderate';
      else if (weak > 3 || rate < 25) status = 'critical';
      else status = 'weak';

      const info = getTopicInfo(topicName);

      return {
        topic: topicName,
        totalWords: total,
        masteredWords: mastered,
        weakWords: weak,
        masteryRate: rate,
        color: info.colorClass,
        icon: info.icon,
        status,
      };
    })
    .filter((item): item is TopicMatrixItem => item !== null)
    .sort((a, b) => a.masteryRate - b.masteryRate); // Weakest topics first

  const criticalGaps = matrixData.filter((m) => m.status === 'critical' || m.status === 'weak');
  const strongTopics = matrixData.filter((m) => m.status === 'strong');

  // SVG Radar Polygon calculation for top 6 topics
  const radarTopics = matrixData.slice(0, 6);
  const totalPoints = Math.max(3, radarTopics.length);
  const radius = 80;
  const centerX = 110;
  const centerY = 110;

  const pointsString = radarTopics
    .map((item, idx) => {
      const angle = (Math.PI * 2 / totalPoints) * idx - Math.PI / 2;
      const valRadius = Math.max(15, (item.masteryRate / 100) * radius);
      const x = centerX + valRadius * Math.cos(angle);
      const y = centerY + valRadius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-[#16191D] p-6 rounded-3xl border border-[#2D3135] shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D3135] pb-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Ma Trận Lỗ Hổng Từ Vựng Theo Chủ Đề (Vocabulary Gap Matrix)
          </h3>
          <p className="text-xs text-[#8B949E] mt-0.5">
            Phát hiện chính xác mảng chủ đề bạn đang bị thiếu hụt hoặc hay quên để tập trung ôn tập bù.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
            {criticalGaps.length} Lỗ hổng cần vá
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
            {strongTopics.length} Chủ đề vững vàng
          </span>
        </div>
      </div>

      {/* Radar + Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Graphic */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-[#21262D]/60 rounded-2xl border border-[#30363D]">
          <div className="relative w-[220px] h-[220px]">
            <svg viewBox="0 0 220 220" className="w-full h-full">
              {/* Background Concentric Webs */}
              {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
                <circle
                  key={i}
                  cx={centerX}
                  cy={centerY}
                  r={radius * level}
                  fill="none"
                  stroke="#30363D"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              ))}

              {/* Axes lines */}
              {radarTopics.map((_, idx) => {
                const angle = (Math.PI * 2 / totalPoints) * idx - Math.PI / 2;
                const x2 = centerX + radius * Math.cos(angle);
                const y2 = centerY + radius * Math.sin(angle);
                return (
                  <line
                    key={idx}
                    x1={centerX}
                    y1={centerY}
                    x2={x2}
                    y2={y2}
                    stroke="#30363D"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data Polygon */}
              {radarTopics.length >= 3 && (
                <polygon
                  points={pointsString}
                  fill="rgba(99, 102, 241, 0.3)"
                  stroke="#6366F1"
                  strokeWidth="2"
                  className="transition-all duration-500"
                />
              )}

              {/* Node points */}
              {radarTopics.map((item, idx) => {
                const angle = (Math.PI * 2 / totalPoints) * idx - Math.PI / 2;
                const valRadius = Math.max(15, (item.masteryRate / 100) * radius);
                const x = centerX + valRadius * Math.cos(angle);
                const y = centerY + valRadius * Math.sin(angle);
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={item.masteryRate >= 60 ? '#10B981' : '#F43F5E'}
                    stroke="#16191D"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>

          <div className="text-center mt-2">
            <span className="text-[11px] text-[#8B949E] font-medium">
              Biểu đồ cân đối vốn từ (Radar Balance)
            </span>
          </div>
        </div>

        {/* Matrix Topic List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {matrixData.map((m) => (
              <div
                key={m.topic}
                className={`p-3.5 rounded-2xl border transition-all ${
                  m.status === 'critical'
                    ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/60'
                    : m.status === 'weak'
                    ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-[#21262D] border-[#30363D] hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.icon}</span>
                    <span className="font-bold text-xs text-white line-clamp-1">{m.topic}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      m.status === 'strong'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : m.status === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {m.masteryRate}% thuộc
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#16191D] rounded-full overflow-hidden mt-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      m.status === 'strong'
                        ? 'bg-emerald-500'
                        : m.status === 'critical'
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${m.masteryRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8B949E] mt-2">
                  <span>
                    Tổng: <strong>{m.totalWords}</strong> từ
                  </span>
                  {m.weakWords > 0 && (
                    <span className="text-rose-400 font-semibold">
                      {m.weakWords} từ hay quên
                    </span>
                  )}
                  {onPracticeTopic && (
                    <button
                      onClick={() => onPracticeTopic(m.topic)}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline text-[10px]"
                    >
                      Học bù topic này
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
