import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Flame,
  ArrowRight,
  X,
} from 'lucide-react';
import { getPreSessionWarning } from '../../utils/weaknessRadar';
import { sounds } from '../../utils/soundEffects';

interface WeaknessPreSessionAlertProps {
  part?: 1 | 2 | 3 | 'part2' | 'mock' | 'drill' | 'full';
  onOpenRadar?: () => void;
  className?: string;
  autoExpand?: boolean;
}

export const WeaknessPreSessionAlert: React.FC<WeaknessPreSessionAlertProps> = ({
  part,
  onOpenRadar,
  className = '',
  autoExpand = false,
}) => {
  const [warningData, setWarningData] = useState<{
    id: string;
    title: string;
    headline: string;
    subtitle: string;
    tipVi: string;
    categoryLabelVi: string;
    drillRule: string;
  } | null>(null);

  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    getPreSessionWarning(part).then((data) => {
      setWarningData(data);
    });
  }, [part]);

  if (!warningData || isDismissed) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 border border-amber-500/40 shadow-xl shadow-amber-950/30 p-4 transition-all duration-300 ${className}`}
    >
      {/* Background Accent Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                Cảnh Báo Bẫy Lỗi Thói Quen (Weakness Radar)
              </span>
              <span className="text-[11px] text-amber-200/80 font-medium">
                {warningData.categoryLabelVi}
              </span>
            </div>

            <h4 className="text-sm font-bold text-amber-100 leading-snug">
              {warningData.headline}
            </h4>

            <p className="text-xs text-amber-200/70 leading-relaxed">
              {warningData.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-lg text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 transition-colors cursor-pointer"
            title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setIsDismissed(true);
            }}
            className="p-1.5 rounded-lg text-amber-400/60 hover:text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer"
            title="Tạm ẩn cảnh báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Advice & Prescribed Fix */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2.5 text-xs animate-fadeIn">
          <div className="bg-amber-950/60 rounded-xl p-3 border border-amber-500/30 text-amber-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300">Quy tắc vàng 2s sửa lỗi:</span>
              <p className="text-amber-200/90 leading-relaxed">{warningData.tipVi}</p>
              {warningData.drillRule && (
                <div className="mt-1 font-mono text-[11px] bg-black/40 px-2 py-1 rounded text-amber-200 border border-amber-500/30 inline-block">
                  👉 {warningData.drillRule}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              onClick={() => {
                sounds.playComplete();
                setIsDismissed(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold border border-amber-500/40 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đã ghi nhớ, sẵn sàng nói!</span>
            </button>

            {onOpenRadar && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenRadar();
                }}
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-200 font-bold hover:underline cursor-pointer"
              >
                <span>Xem toàn bộ Sổ Tay Bẫy Lỗi ({warningData.title})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
