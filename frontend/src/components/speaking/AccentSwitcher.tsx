import React, { useState, useEffect } from 'react';
import { Volume2, ChevronDown, Check } from 'lucide-react';
import {
  ACCENT_OPTIONS,
  EnglishAccent,
  getGlobalAccent,
  setGlobalAccent,
  speakWord,
} from '../../utils/speech';

interface AccentSwitcherProps {
  currentWord?: string;
  compact?: boolean;
}

export const AccentSwitcher: React.FC<AccentSwitcherProps> = ({
  currentWord,
  compact = false,
}) => {
  const [selectedAccent, setSelectedAccent] = useState<EnglishAccent>(getGlobalAccent());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedAccent(getGlobalAccent());
  }, []);

  const handleSelectAccent = (accent: EnglishAccent) => {
    setSelectedAccent(accent);
    setGlobalAccent(accent);
    setIsOpen(false);
    if (currentWord) {
      speakWord(currentWord, 0.9, accent);
    }
  };

  const currentOption =
    ACCENT_OPTIONS.find((opt) => opt.code === selectedAccent) || ACCENT_OPTIONS[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1.5 rounded-xl border border-[#30363D] bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] transition-all cursor-pointer shadow-sm ${
          compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'
        }`}
        title={`Giọng phát âm hiện tại: ${currentOption.label}`}
      >
        <span className="text-sm">{currentOption.flag}</span>
        <span className="font-semibold">{currentOption.code.replace('en-', '')}</span>
        <ChevronDown className="w-3 h-3 text-[#8B949E]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-[#1C2128] border border-[#30363D] shadow-2xl z-50 p-1.5 space-y-1 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
              Chọn giọng đọc IELTS
            </div>
            {ACCENT_OPTIONS.map((opt) => {
              const isSelected = opt.code === selectedAccent;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSelectAccent(opt.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                      : 'text-[#C9D1D9] hover:bg-[#262C34]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{opt.flag}</span>
                    <div>
                      <div className="font-semibold text-white">{opt.label}</div>
                      <div className="text-[10px] text-[#8B949E] leading-tight line-clamp-1">
                        {opt.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
