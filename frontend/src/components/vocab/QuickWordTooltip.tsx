import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Sparkles, X, BookOpen, Bookmark } from 'lucide-react';
import { speakWord } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';

interface QuickWordTooltipProps {
  text: string;
  highlightWord?: string;
  ipa?: string;
  meaning?: string;
  collocations?: string[];
  cefrLevel?: string;
  onOpenDetails?: () => void;
}

export const QuickWordTooltip: React.FC<QuickWordTooltipProps> = ({
  text,
  highlightWord,
  ipa,
  meaning,
  collocations,
  cefrLevel = 'C1',
  onOpenDetails,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!highlightWord) {
    return <span>{text}</span>;
  }

  // Split text by highlight word (case-insensitive)
  const regex = new RegExp(`(${highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    speakWord(highlightWord);
  };

  return (
    <span className="relative inline">
      {parts.map((part, i) => {
        if (part.toLowerCase() === highlightWord.toLowerCase()) {
          return (
            <span
              key={i}
              ref={popoverRef}
              onClick={(e) => {
                e.stopPropagation();
                sounds.playClick();
                setIsOpen(!isOpen);
              }}
              className="relative inline-block cursor-pointer px-1.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border-b-2 border-indigo-400 hover:bg-indigo-500/30 transition-all group"
            >
              {part}

              {/* Mini Tooltip Popover */}
              {isOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#181B22] border border-[#30363D] rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-left cursor-default"
                >
                  {/* Tooltip Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#2D333B]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{highlightWord}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {cefrLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSpeak}
                        className="p-1 rounded-lg hover:bg-[#252B35] text-indigo-400 hover:text-indigo-300"
                        title="Phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 rounded-lg hover:bg-[#252B35] text-[#8E97A4] hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pronunciation & Meaning */}
                  {ipa && (
                    <div className="text-[11px] font-mono text-[#8E97A4] mt-1.5">
                      /{ipa.replace(/^\/|\/$/g, '')}/
                    </div>
                  )}

                  {meaning && (
                    <div className="text-xs font-semibold text-emerald-300 mt-1">
                      {meaning}
                    </div>
                  )}

                  {/* Collocations preview */}
                  {collocations && collocations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#2D333B]/60">
                      <div className="text-[10px] font-bold uppercase text-[#8E97A4]">
                        Collocation IELTS:
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {collocations.slice(0, 2).map((col, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-[#21262E] text-[#D0D7DE] px-2 py-0.5 rounded-md border border-[#30363D]"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {onOpenDetails && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenDetails();
                      }}
                      className="w-full mt-2.5 pt-2 border-t border-[#2D333B] text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" /> Xem chi tiết từ này
                    </button>
                  )}
                </div>
              )}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
