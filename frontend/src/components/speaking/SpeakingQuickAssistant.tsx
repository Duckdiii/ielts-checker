import React, { useState } from 'react';
import {
  LifeBuoy,
  Volume2,
  Copy,
  Check,
  History,
  TrendingUp,
  Award,
  Play,
  Pause,
  BarChart3,
  Clock,
  Sparkles,
  ArrowUpRight,
  Flame,
  Mic,
} from 'lucide-react';
import { SavedSpeakingAttempt, SpeakingEvaluationResult } from '../../types';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';

interface SpeakingQuickAssistantProps {
  recentAttempts: SavedSpeakingAttempt[];
  onSelectAttempt?: (attempt: SavedSpeakingAttempt) => void;
  onOpenPortfolio?: () => void;
  onOpenEmergencyStalling?: () => void;
  onOpenAreaExpander?: () => void;
  onOpenSpeechUpgrade?: () => void;
}

// Curated high-scoring natural stalling phrases (Anti-freeze formulas)
const EMERGENCY_STALLING_PHRASES = [
  {
    type: 'Bí ý câu khó',
    phrase: "Well, that's certainly a thought-provoking question to ponder...",
    vietnamese: 'Đó thực sự là một câu hỏi rất đáng để suy ngẫm...',
  },
  {
    type: 'Cần 3s nhớ lại',
    phrase: "Off the top of my head, I'd say that...",
    vietnamese: 'Bật ra ngay trong đầu tôi lúc này, tôi cho rằng...',
  },
  {
    type: 'Kỷ niệm quá khứ',
    phrase: "If my memory serves me correctly, it happened when...",
    vietnamese: 'Nếu trí nhớ của tôi không nhầm thì điều đó diễn ra khi...',
  },
  {
    type: 'Nhìn nhận 2 mặt',
    phrase: "It's worth acknowledging that there are two facets to this issue...",
    vietnamese: 'Cần thừa nhận rằng vấn đề này có hai mặt rõ rệt...',
  },
];

export const SpeakingQuickAssistant: React.FC<SpeakingQuickAssistantProps> = ({
  recentAttempts,
  onSelectAttempt,
  onOpenPortfolio,
  onOpenEmergencyStalling,
  onOpenAreaExpander,
  onOpenSpeechUpgrade,
}) => {
  const [activeTab, setActiveTab] = useState<'stalling' | 'history' | 'stamina'>('stalling');
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handleCopy = (phrase: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(phrase);
    setCopiedPhrase(phrase);
    setTimeout(() => setCopiedPhrase(null), 1800);
  };

  const handleSpeak = (phrase: string) => {
    sounds.playClick();
    speakWord(phrase);
  };

  // Calculate today's speaking stats
  const totalAttemptsToday = recentAttempts.length;
  const avgBand =
    totalAttemptsToday > 0
      ? (
          recentAttempts.reduce((acc, curr) => acc + (curr.overallBand || 6.5), 0) /
          totalAttemptsToday
        ).toFixed(1)
      : '7.0';

  return (
    <aside className="w-full bg-[#12161C] border border-[#242A36] rounded-3xl p-4 sm:p-4.5 shadow-xl space-y-4 backdrop-blur-md sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#202734] pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <LifeBuoy className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-black text-white tracking-wide uppercase">
              Phao Cứu Sinh & Bản Ghi
            </h3>
            <p className="text-[10px] text-[#8E97A4]">
              {totalAttemptsToday} lượt thi gần nhất • Band TB: {avgBand}
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Band 8.0+
        </span>
      </div>

      {/* Segmented Sub-tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0E1218] border border-[#202632]">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('stalling');
          }}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'stalling'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[#8E97A4] hover:text-white'
          }`}
        >
          🛡️ Phao Cứu Sinh
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('history');
          }}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[#8E97A4] hover:text-white'
          }`}
        >
          📜 Lượt Thu ({recentAttempts.slice(0, 4).length})
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('stamina');
          }}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'stamina'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[#8E97A4] hover:text-white'
          }`}
        >
          ⚡ Thể Lực
        </button>
      </div>

      {/* Tab 1: Emergency Stalling Phrases */}
      {activeTab === 'stalling' && (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar animate-fadeIn">
          <div className="text-[10px] text-[#8E97A4] font-medium flex items-center justify-between">
            <span>Cụm từ "câu giờ" tự nhiên khi bí ý:</span>
            <span className="text-amber-400 font-bold">Chống Freeze</span>
          </div>

          <div className="space-y-2">
            {EMERGENCY_STALLING_PHRASES.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-2xl bg-[#161C26] border border-[#262E3D] hover:border-amber-500/40 transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {item.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeak(item.phrase)}
                      className="p-1 rounded-lg bg-[#202736] hover:bg-amber-600 text-[#8E97A4] hover:text-white transition-all cursor-pointer"
                      title="Nghe phát âm chuẩn"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCopy(item.phrase)}
                      className="p-1 rounded-lg bg-[#202736] hover:bg-amber-600 text-[#8E97A4] hover:text-white transition-all cursor-pointer"
                      title="Sao chép mẫu câu"
                    >
                      {copiedPhrase === item.phrase ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors leading-relaxed">
                  "{item.phrase}"
                </div>

                <div className="text-[10px] text-[#8E97A4] italic">{item.vietnamese}</div>
              </div>
            ))}
          </div>

          {onOpenEmergencyStalling && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenEmergencyStalling();
              }}
              className="w-full mt-2 py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-[11px] font-bold flex items-center justify-center gap-1 border border-amber-500/30 cursor-pointer transition-all"
            >
              <span>Xem Full Kho Phao Cứu Sinh</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Tab 2: Recent Attempts History */}
      {activeTab === 'history' && (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar animate-fadeIn">
          {recentAttempts.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#161C26] border border-[#262E3D] text-center space-y-2">
              <Mic className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">
                Chưa có bản ghi nào hôm nay.
              </p>
              <p className="text-[10px] text-[#6F7B8C]">
                Hãy nhấn nút "Bắt Đầu Nói" ở giữa để thu âm câu trả lời đầu tiên!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttempts.slice(0, 5).map((att) => (
                <div
                  key={att.id}
                  onClick={() => onSelectAttempt && onSelectAttempt(att)}
                  className="p-2.5 rounded-2xl bg-[#161C26] border border-[#262E3D] hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        Part {att.part}
                      </span>
                      <span className="text-[10px] text-[#6F7B8C]">{att.date}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-amber-300 font-mono">
                        Band {att.overallBand?.toFixed(1) || '6.5'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-200 mt-1 line-clamp-1 group-hover:text-white transition-colors">
                    {att.question}
                  </p>

                  <p className="text-[10.5px] text-[#8E97A4] mt-0.5 line-clamp-1 italic">
                    "{att.transcript}"
                  </p>

                  {att.result?.criteriaScores && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#202734] grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                      <div className="bg-[#0E1218] p-0.5 rounded text-indigo-300">
                        FC: {att.result.criteriaScores.fluencyCoherence.score}
                      </div>
                      <div className="bg-[#0E1218] p-0.5 rounded text-purple-300">
                        LR: {att.result.criteriaScores.lexicalResource.score}
                      </div>
                      <div className="bg-[#0E1218] p-0.5 rounded text-cyan-300">
                        GR: {att.result.criteriaScores.grammaticalRange.score}
                      </div>
                      <div className="bg-[#0E1218] p-0.5 rounded text-emerald-300">
                        PR: {att.result.criteriaScores.pronunciation.score}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {onOpenPortfolio && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenPortfolio();
                  }}
                  className="w-full mt-2 py-1.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1 border border-indigo-500/30 cursor-pointer transition-all"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Mở Hồ Sơ & Đồ Thị Đầy Đủ</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Stamina & Daily Fluency Goals */}
      {activeTab === 'stamina' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-[#161C26] border border-[#262E3D] text-center">
              <div className="text-[10px] text-[#8E97A4] font-semibold">Lượt Thi Đã Xong</div>
              <div className="text-xl font-black text-indigo-400 font-mono mt-0.5">
                {totalAttemptsToday}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#161C26] border border-[#262E3D] text-center">
              <div className="text-[10px] text-[#8E97A4] font-semibold">Band Trung Bình</div>
              <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                {avgBand}
              </div>
            </div>
          </div>

          {/* Quick Tool Launchers */}
          <div className="space-y-2 pt-1 border-t border-[#202734]">
            <div className="text-[10px] text-[#8E97A4] font-bold">Chế độ bổ trợ nhanh:</div>

            {onOpenAreaExpander && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAreaExpander();
                }}
                className="w-full p-2 rounded-xl bg-[#161C26] hover:bg-[#1F2634] border border-[#262E3D] text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Khung A.R.E.A Kéo Dài Câu</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}

            {onOpenSpeechUpgrade && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenSpeechUpgrade();
                }}
                className="w-full p-2 rounded-xl bg-[#161C26] hover:bg-[#1F2634] border border-[#262E3D] text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>Nâng Cấp Bản Nói Band 8.0</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
