import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Command,
  BookOpen,
  Mic,
  BarChart3,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  X,
  Volume2,
  FileText,
  FileSpreadsheet,
  PlusCircle,
  Trophy,
  PenTool,
} from 'lucide-react';
import { VocabItem, WordSet } from '../../types';
import { AppViewTab } from '../../hooks/useHashNavigation';
import { globalSearchEngine } from '../../utils/searchIndex';
import { playNativeSpeech } from '../../utils/speech';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: AppViewTab) => void;
  onSelectWord: (word: VocabItem) => void;
  onOpenUpload: () => void;
  onOpenExcelImport: () => void;
  onOpenAddWord: () => void;
  words: VocabItem[];
  sets: WordSet[];
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSelectWord,
  onOpenUpload,
  onOpenExcelImport,
  onOpenAddWord,
  words,
  sets,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via custom event or parent
          const event = new CustomEvent('toggle-command-palette');
          window.dispatchEvent(event);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Navigation actions available in palette
  const staticActions = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        type: 'action',
        title: 'IELTS Studio (Dashboard)',
        subtitle: 'Lộ trình học tập & nhiệm vụ hôm nay',
        icon: Layers,
        iconColor: 'text-indigo-400',
        badge: 'Studio',
        action: () => {
          onNavigate('dashboard');
          onClose();
        },
      },
      {
        id: 'nav-flashcard',
        type: 'action',
        title: 'Flashcard 3D SRS',
        subtitle: 'Ôn tập từ vựng bằng thuật toán lặp ngắt quãng FSRS',
        icon: BookOpen,
        iconColor: 'text-emerald-400',
        badge: 'Vocab',
        action: () => {
          onNavigate('flashcard');
          onClose();
        },
      },
      {
        id: 'nav-speaking-mock',
        type: 'action',
        title: 'IELTS Speaking AI Mock Examiner',
        subtitle: 'Luyện thi nói 3 phần với Giám khảo AI Cambridge',
        icon: Mic,
        iconColor: 'text-rose-400',
        badge: 'Speaking',
        action: () => {
          onNavigate('speaking');
          onClose();
        },
      },
      {
        id: 'nav-full-mock',
        type: 'action',
        title: 'Full 15-Minute Mock Test',
        subtitle: 'Mô phỏng bài thi thử Speaking chuẩn phòng thi thật',
        icon: Trophy,
        iconColor: 'text-amber-400',
        badge: 'Exam',
        action: () => {
          onNavigate('full-mock-test');
          onClose();
        },
      },
      {
        id: 'nav-shadowing',
        type: 'action',
        title: 'Shadowing Lab (Nhại giọng bản xứ)',
        subtitle: 'Luyện ngữ điệu, nối âm, trọng âm theo giọng US/UK/AU',
        icon: Zap,
        iconColor: 'text-cyan-400',
        badge: 'Pronounce',
        action: () => {
          onNavigate('shadowing');
          onClose();
        },
      },
      {
        id: 'nav-ai-booster',
        type: 'action',
        title: 'AI Band Booster Center',
        subtitle: 'Mở rộng collocations, nuances & nâng cấp câu lên Band 8.5+',
        icon: Sparkles,
        iconColor: 'text-purple-400',
        badge: 'AI Lexical',
        action: () => {
          onNavigate('ai-booster');
          onClose();
        },
      },
      {
        id: 'nav-writing-lab',
        type: 'action',
        title: 'IELTS Writing AI Assistant & Heatmap',
        subtitle: 'Chấm bài Task 1 & 2 theo 4 tiêu chí Cambridge & bản đồ nhiệt từ vựng',
        icon: PenTool,
        iconColor: 'text-indigo-400',
        badge: 'Writing',
        action: () => {
          onNavigate('writing');
          onClose();
        },
      },
      {
        id: 'nav-analytics',
        type: 'action',
        title: 'Analytics & Sổ tay bẫy lỗi (Radar)',
        subtitle: 'Phân tích điểm yếu & báo cáo tiến trình IELTS Band',
        icon: BarChart3,
        iconColor: 'text-blue-400',
        badge: 'Stats',
        action: () => {
          onNavigate('progress');
          onClose();
        },
      },
      {
        id: 'act-upload-pdf',
        type: 'action',
        title: 'Nạp Từ vựng từ PDF (Gemini AI Parser)',
        subtitle: 'Trích xuất tự động từ vựng, collocations từ tài liệu Cambridge',
        icon: FileText,
        iconColor: 'text-indigo-400',
        badge: 'Import',
        action: () => {
          onClose();
          onOpenUpload();
        },
      },
      {
        id: 'act-upload-excel',
        type: 'action',
        title: 'Nhập từ bảng tính Excel / CSV',
        subtitle: 'Tải lên bảng từ vựng cá nhân từ Excel',
        icon: FileSpreadsheet,
        iconColor: 'text-emerald-400',
        badge: 'Import',
        action: () => {
          onClose();
          onOpenExcelImport();
        },
      },
      {
        id: 'act-add-word',
        type: 'action',
        title: 'Thêm Từ Vựng Mới Thủ Công',
        subtitle: 'Tự thêm từ mới vào bộ từ vựng hiện tại',
        icon: PlusCircle,
        iconColor: 'text-amber-400',
        badge: 'Create',
        action: () => {
          onClose();
          onOpenAddWord();
        },
      },
    ],
    [onNavigate, onClose, onOpenUpload, onOpenExcelImport, onOpenAddWord]
  );

  // Search results combining matching words and matching actions
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return {
        actions: staticActions.slice(0, 6),
        words: words.slice(0, 4),
      };
    }

    // Filter actions
    const matchedActions = staticActions.filter(
      (a) =>
        a.title.toLowerCase().includes(trimmed) ||
        a.subtitle.toLowerCase().includes(trimmed) ||
        a.badge.toLowerCase().includes(trimmed)
    );

    // Search words using fast indexed search or fallback
    let matchedWords: VocabItem[] = [];
    if (globalSearchEngine.isIndexed()) {
      matchedWords = globalSearchEngine.search(trimmed).slice(0, 8);
    } else {
      matchedWords = words
        .filter(
          (w) =>
            w.term.toLowerCase().includes(trimmed) ||
            w.meaning.toLowerCase().includes(trimmed) ||
            (w.topic && w.topic.toLowerCase().includes(trimmed))
        )
        .slice(0, 8);
    }

    return {
      actions: matchedActions,
      words: matchedWords,
    };
  }, [query, staticActions, words]);

  const flatResults = useMemo(() => {
    const list: Array<{ type: 'action' | 'word'; item: any }> = [];
    results.actions.forEach((a) => list.push({ type: 'action', item: a }));
    results.words.forEach((w) => list.push({ type: 'word', item: w }));
    return list;
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < flatResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatResults[selectedIndex];
      if (current) {
        if (current.type === 'action') {
          current.item.action();
        } else if (current.type === 'word') {
          onSelectWord(current.item);
          onClose();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#11131F] border border-white/15 rounded-2xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm từ vựng, chủ đề IELTS hoặc nhảy nhanh đến tính năng... (ESC để đóng)"
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-400 text-sm sm:text-base outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2 py-1 rounded bg-white/5 border border-white/10 shrink-0">
            <kbd className="font-mono">ESC</kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-3 divide-y divide-white/5 flex-1">
          {/* Actions Section */}
          {results.actions.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center gap-1.5">
                <Command className="w-3 h-3 text-indigo-400" />
                <span>Chức năng & Lối tắt</span>
              </div>
              {results.actions.map((action, idx) => {
                const isSelected = selectedIndex === idx;
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg bg-white/5 border border-white/10 shrink-0 ${action.iconColor}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{action.title}</div>
                        <div className="text-xs text-slate-400 truncate">{action.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-indigo-300">
                        {action.badge}
                      </span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Words Section */}
          {results.words.length > 0 && (
            <div className="pt-2 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span>Từ vựng tìm thấy ({results.words.length})</span>
              </div>
              {results.words.map((word, wordIdx) => {
                const globalIndex = results.actions.length + wordIdx;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <div
                    key={word.id}
                    onClick={() => {
                      onSelectWord(word);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-600/20 border border-emerald-500/40 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playNativeSpeech(word.term);
                        }}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shrink-0 border border-emerald-500/20"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{word.term}</span>
                          {word.ipa && <span className="text-xs text-slate-400 font-mono">{word.ipa}</span>}
                          {word.cefrLevel && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {word.cefrLevel}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 truncate">{word.meaning}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">{word.topic || 'IELTS'}</span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {results.actions.length === 0 && results.words.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm">Không tìm thấy từ hoặc tính năng khớp với "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">↑</kbd>{' '}
              <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">↓</kbd> để di
              chuyển
            </span>
            <span>
              <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">↵</kbd> để chọn
            </span>
          </div>
          <div className="text-indigo-400 font-medium hidden sm:block">IELTS VocabMaster AI Universal Search</div>
        </div>
      </div>
    </div>
  );
}
