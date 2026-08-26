import React from 'react';
import { Gauge, AlertTriangle, Sparkles, Volume2, Clock, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { speakWord } from '../../utils/speech';
import { AcademicStallingFiller, DeadSilencePause } from '../../types';

interface WpmSpeechRateMeterProps {
  currentWpm: number;
  wordCount: number;
  elapsedSeconds: number;
  isRecording: boolean;
  silenceSeconds?: number;
  compact?: boolean;
}

export const getWpmStatus = (wpm: number) => {
  if (wpm <= 0) return { label: 'Chưa có dữ liệu', color: 'text-[#8E97A4]', bg: 'bg-[#21262E]', border: 'border-[#30363D]', band: 'N/A' };
  if (wpm < 100) return { label: 'Quá Chậm (<100 WPM)', sub: 'Dễ bị trừ điểm Fluency do ngập ngừng hoặc dịch nhẩm', color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', band: 'Band 5.0 - 5.5' };
  if (wpm < 130) return { label: 'Hơi Chậm (100-129 WPM)', sub: 'Tốc độ vừa phải nhưng cần tăng độ liên tục', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', band: 'Band 6.0 - 6.5' };
  if (wpm <= 160) return { label: 'Tốc Độ Vàng (130-160 WPM)', sub: 'Chuẩn bản xứ Cambridge Band 8.0 - 9.0 lý tưởng', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', band: 'Band 7.5 - 9.0' };
  if (wpm <= 180) return { label: 'Hơi Nhanh (161-180 WPM)', sub: 'Chú ý giữ ngắt nghỉ theo cụm nghĩa (thought groups)', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', band: 'Band 7.0 - 7.5' };
  return { label: 'Quá Vội Vàng (>180 WPM)', sub: 'Nguy cơ nuốt âm đuôi và nói không kịp thở', color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', band: 'Band 6.0 - 6.5' };
};

export const WpmSpeechRateMeter: React.FC<WpmSpeechRateMeterProps> = ({
  currentWpm,
  wordCount,
  elapsedSeconds,
  isRecording,
  silenceSeconds = 0,
  compact = false,
}) => {
  const status = getWpmStatus(currentWpm);
  const isDeadSilence = isRecording && silenceSeconds >= 3;

  // Percentage on 0 - 220 WPM scale
  const gaugePercent = Math.min(100, Math.max(0, (currentWpm / 200) * 100));

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-[#1C2027] px-3.5 py-2 rounded-2xl border border-[#2D333B] shadow-sm">
        <div className="flex items-center gap-1.5">
          <Gauge className={`w-4 h-4 ${status.color}`} />
          <span className="text-xs font-bold text-white font-mono">{currentWpm > 0 ? `${currentWpm} WPM` : '-- WPM'}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${status.bg} ${status.color} ${status.border}`}>
          {status.label.split(' ')[0]} {status.label.split(' ')[1]}
        </span>
        {isDeadSilence && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Khoảng lặng {Math.floor(silenceSeconds)}s!</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#1C2027] rounded-2xl p-4 border border-[#2D333B] space-y-3 shadow-inner relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-xl ${status.bg} ${status.border} border`}>
            <Gauge className={`w-4 h-4 ${status.color}`} />
          </span>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              Đo Tốc Độ Nói Thời Gian Thực (Speech Rate WPM)
            </span>
            <span className="text-[11px] text-[#8E97A4] block">
              Mục tiêu lý tưởng: <strong>130 – 160 WPM</strong> (Chuẩn Band 8.0+)
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline justify-end gap-1">
            <span>{currentWpm > 0 ? currentWpm : '--'}</span>
            <span className="text-xs text-[#8E97A4] font-normal">WPM</span>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${status.bg} ${status.color} ${status.border}`}>
            {status.band}
          </span>
        </div>
      </div>

      {/* Speedometer Gauge Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-[#16191F] rounded-full overflow-hidden p-0.5 border border-[#30363D] relative">
          {/* Target Zone Highlight (130-160 WPM = 65% - 80%) */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-500/50"
            style={{ left: '65%', width: '15%' }}
            title="Vùng Tốc Độ Vàng: 130 - 160 WPM"
          />
          {/* Active Progress Marker */}
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              currentWpm >= 130 && currentWpm <= 160
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                : currentWpm < 130 && currentWpm > 0
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-rose-500 to-orange-500'
            }`}
            style={{ width: `${gaugePercent}%` }}
          />
        </div>

        {/* Legend Scale */}
        <div className="flex justify-between text-[10px] text-[#8E97A4] font-mono px-1">
          <span>0 WPM</span>
          <span>100 (Chậm)</span>
          <span className="text-emerald-400 font-bold">130-160 (Vàng 🌟)</span>
          <span>180 (Nhanh)</span>
          <span>200+</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        <div className="p-2 rounded-xl bg-[#16191F] border border-[#2D333B] text-center">
          <span className="text-[10px] text-[#8E97A4] block">Số từ đã phát âm</span>
          <span className="text-sm font-bold text-white">{wordCount} từ</span>
        </div>
        <div className="p-2 rounded-xl bg-[#16191F] border border-[#2D333B] text-center">
          <span className="text-[10px] text-[#8E97A4] block">Thời gian nói</span>
          <span className="text-sm font-bold text-white">{elapsedSeconds}s</span>
        </div>
        <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-[#16191F] border border-[#2D333B] text-center">
          <span className="text-[10px] text-[#8E97A4] block">Đánh giá nhịp độ</span>
          <span className={`text-xs font-bold ${status.color} truncate block`}>
            {status.label.split(' ')[0]} {status.label.split(' ')[1]}
          </span>
        </div>
      </div>

      {/* Real-Time Dead Silence Warning (> 3s without speech) */}
      {isDeadSilence && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium space-y-1.5 animate-pulse">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>CẢNH BÁO: Khoảng lặng chết kéo dài {Math.floor(silenceSeconds)} giây!</span>
          </div>
          <p className="text-[11px] text-rose-200/90 leading-relaxed">
            Trong IELTS Speaking, im lặng quá 3 giây sẽ bị giám khảo trừ điểm Fluency. <strong>Hãy dùng ngay cụm Filler học thuật để câu giờ:</strong>
          </p>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/30">
              "That is quite an intriguing question..."
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/30">
              "From my perspective, I'd say..."
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/30">
              "To be completely candid with you..."
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface SilenceAndFillerAdvisorProps {
  speechRateVerdictVi?: string;
  wordsPerMinute?: number;
  deadSilencePausesCount?: number;
  deadSilencePauses?: DeadSilencePause[];
  academicFillers?: AcademicStallingFiller[];
}

export const SilenceAndFillerAdvisor: React.FC<SilenceAndFillerAdvisorProps> = ({
  speechRateVerdictVi,
  wordsPerMinute = 0,
  deadSilencePausesCount = 0,
  deadSilencePauses = [],
  academicFillers = [],
}) => {
  const status = getWpmStatus(wordsPerMinute);

  const defaultFillers: AcademicStallingFiller[] = [
    {
      phrase: "That's quite an intriguing question to ponder...",
      situationVi: "Khi cần 2-3s câu giờ để tổ chức luận điểm mở bài",
      sampleContext: "That's quite an intriguing question to ponder, but from my perspective...",
    },
    {
      phrase: "To be completely candid with you...",
      situationVi: "Khi muốn bày tỏ quan điểm cá nhân thẳng thắn",
      sampleContext: "To be completely candid with you, I have always leaned towards...",
    },
    {
      phrase: "If memory serves me correctly...",
      situationVi: "Khi cần nhớ lại một sự kiện hoặc trải nghiệm trong quá khứ",
      sampleContext: "If memory serves me correctly, back when I was a freshman...",
    },
    {
      phrase: "From an economic / societal standpoint...",
      situationVi: "Khi mở rộng câu trả lời sang khía cạnh vĩ mô ở Part 3",
      sampleContext: "From a broader societal standpoint, this trend clearly indicates...",
    },
  ];

  const fillersToDisplay = academicFillers && academicFillers.length > 0 ? academicFillers : defaultFillers;

  return (
    <div className="bg-[#16191F] rounded-3xl p-6 border border-[#2D333B] shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#2D333B]">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Phân Tích Tốc Độ Nói (WPM) & Khoảng Lặng Chết (Silence Analysis)
          </h3>
        </div>
        <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${status.bg} ${status.color} ${status.border}`}>
          {wordsPerMinute > 0 ? `${wordsPerMinute} WPM • ${status.band}` : 'Chưa đo WPM'}
        </span>
      </div>

      {/* Top Banner: Verdict */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-4 p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] text-center space-y-1">
          <span className="text-[10px] text-[#8E97A4] uppercase tracking-wider block">Tốc Độ Bình Quân</span>
          <div className="text-3xl font-black text-white font-mono">{wordsPerMinute || '--'} <span className="text-xs text-[#8E97A4]">WPM</span></div>
          <span className={`text-xs font-bold ${status.color} block`}>
            {speechRateVerdictVi || status.label}
          </span>
        </div>

        <div className="sm:col-span-8 p-4 rounded-2xl bg-[#1C2027] border border-[#2D333B] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Phát hiện khoảng lặng chết (&gt;3 giây):
            </span>
            <span className="text-xs font-bold text-[#8E97A4]">
              {deadSilencePausesCount === 0 ? '✨ Không có khoảng lặng chết!' : `Phát hiện ${deadSilencePausesCount} lần ngập ngừng`}
            </span>
          </div>

          <p className="text-xs text-[#9BA1A6] leading-relaxed">
            {deadSilencePausesCount === 0
              ? 'Tuyệt vời! Bạn duy trì luồng nói liên tục, chuyển ý mượt mà không để lộ khoảng trống trong bài thi.'
              : `Có ${deadSilencePausesCount} thời điểm bài nói bị đứt đoạn quá 3 giây. Thay vì im lặng, hãy sử dụng các cụm từ đệm học thuật (Academic Stalling Fillers) dưới đây để kéo dài thời gian suy nghĩ hợp lệ:`}
          </p>

          {/* Specific Pauses if detected */}
          {deadSilencePauses && deadSilencePauses.length > 0 && (
            <div className="space-y-2 pt-1">
              {deadSilencePauses.map((pause, pIdx) => (
                <div key={pIdx} className="p-2.5 rounded-xl bg-[#21262E] border border-[#30363D] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400 font-bold">⚠️ Dừng {pause.approximateDuration} ({pause.aroundPhrase})</span>
                  </div>
                  <div className="text-emerald-300 font-medium flex items-center justify-between gap-2">
                    <span>💡 Thay bằng: <strong>"{pause.recommendedFiller}"</strong></span>
                    <button
                      onClick={() => speakWord(pause.recommendedFiller, 1.0, 'en-GB')}
                      className="p-1 rounded bg-[#16191F] text-emerald-400 hover:text-white cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8E97A4] italic">{pause.fillerMeaningVi}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Academic Stalling Fillers Bank */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Ngân Hàng Cụm Từ Đệm Học Thuật (Academic Stalling Fillers Band 8+)
          </h4>
          <span className="text-[10px] text-[#8E97A4]">Thay thế hoàn toàn "uh", "um" và im lặng</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fillersToDisplay.map((filler, fIdx) => (
            <div
              key={fIdx}
              className="p-3.5 rounded-2xl bg-[#1C2027] border border-[#2D333B] hover:border-indigo-500/40 transition-all space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-amber-300 leading-snug">
                  "{filler.phrase}"
                </span>
                <button
                  onClick={() => speakWord(filler.phrase, 1.0, 'en-GB')}
                  className="p-1.5 rounded-lg bg-[#21262E] hover:bg-[#282D33] text-indigo-300 transition-colors cursor-pointer shrink-0"
                  title="Nghe mẫu phát âm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-[#8E97A4]">{filler.situationVi}</p>
              {filler.sampleContext && (
                <p className="text-[10px] text-emerald-400/90 italic font-mono bg-[#16191F] p-1.5 rounded-lg border border-[#2D333B]">
                  Ví dụ: {filler.sampleContext}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
