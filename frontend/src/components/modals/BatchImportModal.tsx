import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  BookOpen,
  Tag,
  Layers,
  FileText,
  Copy,
  Info,
  CheckCircle2,
  HelpCircle,
  Database,
} from 'lucide-react';
import { VocabItem, WordSet } from '../../types';
import { IELTS_TOPICS, getTopicInfo } from '../../utils/topicHelpers';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSet: (set: WordSet, words: VocabItem[]) => void;
  onSaveMultipleSets?: (setsWithWords: Array<{ set: WordSet; words: VocabItem[] }>) => void;
  currentSetsCount: number;
}

interface ParsedImportRow {
  term: string;
  ipa?: string;
  meaning: string;
  wordFamily?: string;
  synonyms?: string;
  antonyms?: string;
  example?: string;
  notes?: string;
  targetIeltsBand?: string;
  topic?: string;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onSaveSet,
  onSaveMultipleSets,
  currentSetsCount,
}) => {
  const [importTab, setImportTab] = useState<'paste' | 'file'>('paste');
  const [rawText, setRawText] = useState('');
  const [setTitle, setSetTitle] = useState('Kho 1500 Từ Vựng IELTS Tổng Hợp');
  const [defaultTopic, setDefaultTopic] = useState('Học thuật tổng hợp');
  const [parsedWords, setParsedWords] = useState<ParsedImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<{ percent: number; count: number; total: number }>({
    percent: 0,
    count: 0,
    total: 0,
  });
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [splitByTopic, setSplitByTopic] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Smart Async Chunked Parser for raw text (prevents UI freeze on 5,000+ words)
  const parseRawTextContent = async (text: string) => {
    setIsParsing(true);
    setParseProgress({ percent: 0, count: 0, total: 0 });

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const totalLines = lines.length;
    const results: ParsedImportRow[] = [];

    // Check if JSON
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
      try {
        const jsonArray = JSON.parse(text);
        if (Array.isArray(jsonArray)) {
          jsonArray.forEach((item: any) => {
            if (item.term || item.word) {
              results.push({
                term: (item.term || item.word || '').trim(),
                ipa: item.ipa?.trim() || undefined,
                meaning: (item.meaning || item.definition || item.vietnamese || '').trim(),
                wordFamily: item.wordFamily || item.family || undefined,
                synonyms: item.synonyms || item.synonym || undefined,
                antonyms: item.antonyms || item.antonym || undefined,
                example: item.example || item.sentence || undefined,
                notes: item.notes || item.note || undefined,
                targetIeltsBand: item.targetIeltsBand || item.band || '7.5',
                topic: item.topic || defaultTopic,
              });
            }
          });
          if (results.length > 0) {
            setParsedWords(results);
            setStep('preview');
            setIsParsing(false);
            return;
          }
        }
      } catch (e) {
        // Not JSON, continue to line-by-line parsing
      }
    }

    const CHUNK_SIZE = 150;
    for (let chunkStart = 0; chunkStart < totalLines; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, totalLines);
      
      for (let i = chunkStart; i < chunkEnd; i++) {
        const line = lines[i];

        if (
          line.startsWith('#') ||
          line.startsWith('//') ||
          (i === 0 && (line.toLowerCase().includes('term') || line.toLowerCase().includes('từ vựng')))
        ) {
          continue;
        }

        let term = '';
        let ipa = '';
        let meaning = '';
        let wordFamily = '';
        let synonyms = '';
        let example = '';
        let topic = defaultTopic;

        // 1. Tab separated (TSV / Excel copy paste)
        if (line.includes('\t')) {
          const parts = line.split('\t').map((p) => p.trim());
          term = parts[0] || '';
          if (parts.length >= 2) {
            if (parts[1].startsWith('/') || parts[1].startsWith('[')) {
              ipa = parts[1];
              meaning = parts[2] || '';
              wordFamily = parts[3] || '';
              synonyms = parts[4] || '';
              example = parts[5] || '';
              if (parts[6]) topic = parts[6];
            } else {
              meaning = parts[1] || '';
              wordFamily = parts[2] || '';
              synonyms = parts[3] || '';
              example = parts[4] || '';
              if (parts[5]) topic = parts[5];
            }
          }
        }
        // 2. Comma separated (CSV)
        else if (line.includes(',') && !line.includes(' - ') && !line.includes(': ')) {
          const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
          term = parts[0] || '';
          meaning = parts[1] || '';
          if (parts[2]) ipa = parts[2];
          if (parts[3]) example = parts[3];
          if (parts[4]) topic = parts[4];
        }
        // 3. Colon / Dash separated
        else if (line.includes(' - ') || line.includes(': ') || line.includes(' – ')) {
          const separator = line.includes(' - ') ? ' - ' : line.includes(' – ') ? ' – ' : ': ';
          const parts = line.split(separator);
          term = parts[0].trim();
          const rest = parts.slice(1).join(separator).trim();

          const ipaMatch = term.match(/\/(.*?)\/|\[(.*?)\]/);
          if (ipaMatch) {
            ipa = ipaMatch[0];
            term = term.replace(ipaMatch[0], '').trim();
          }

          const typeMatch = term.match(/\((n|v|adj|adv|prep|conj|phrase)\)/i);
          if (typeMatch) {
            wordFamily = typeMatch[0];
            term = term.replace(typeMatch[0], '').trim();
          }

          meaning = rest;

          if (meaning.includes('e.g.') || meaning.includes('Ex:') || meaning.includes('Ví dụ:')) {
            const exParts = meaning.split(/e\.g\.|Ex:|Ví dụ:/i);
            meaning = exParts[0].trim();
            example = exParts[1]?.trim() || '';
          }
        }
        // 4. Fallback single word per line
        else {
          term = line;
          meaning = 'Từ vựng học thuật IELTS';
        }

        if (term.trim()) {
          results.push({
            term: term.trim(),
            ipa: ipa.trim() || undefined,
            meaning: meaning.trim() || 'Nghĩa tiếng Việt',
            wordFamily: wordFamily.trim() || undefined,
            synonyms: synonyms.trim() || undefined,
            example: example.trim() || undefined,
            targetIeltsBand: '7.5',
            topic: topic || defaultTopic,
          });
        }
      }

      // Update progress state & yield main thread
      const progressPercent = Math.min(100, Math.round((chunkEnd / totalLines) * 100));
      setParseProgress({
        percent: progressPercent,
        count: results.length,
        total: totalLines,
      });

      if (totalLines > 300) {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    }

    setParsedWords(results);
    setIsParsing(false);
    if (results.length > 0) {
      setStep('preview');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSetTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
        parseRawTextContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample1500 = () => {
    const sample = `Ubiquitous\t/juːˈbɪk.wə.təs/\tPhổ biến, có mặt khắp nơi\t(adj) ubiquity (n)\tomnipresent, pervasive\tSmartphones have become ubiquitous in modern society.\tCông nghệ & Đổi mới
Biodiversity\t/ˌbaɪ.oʊ.daɪˈvɜːr.sə.ti/\tSự đa dạng sinh học\t(n) biodiverse (adj)\tecosystem variety, biological diversity\tDeforestation poses a severe threat to global biodiversity.\tĐộng vật & Sinh thái
Mitigate\t/ˈmɪt.ɪ.ɡeɪt/\tLàm giảm nhẹ, xoa dịu hậu quả\t(v) mitigation (n), mitigative (adj)\talleviate, reduce, lessen\tGovernments must take immediate measures to mitigate climate change.\tMôi trường & Khí hậu
Sustainable\t/səˈsteɪ.nə.bəl/\tBền vững, thân thiện môi trường\t(adj) sustain (v), sustainability (n)\trenewable, eco-friendly\tSolar energy is a sustainable alternative to fossil fuels.\tMôi trường & Khí hậu
Pedagogy\t/ˈped.ə.ɡɒdʒ.i/\tPhương pháp sư phạm, giáo dục học\t(n) pedagogical (adj)\tteaching methodology\tModern pedagogy focuses on interactive, student-centered learning.\tGiáo dục & Học thuật
Cognitive\t/ˈkɒɡ.nə.tɪv/\tThuộc về nhận thức, trí tuệ\t(adj) cognition (n)\tmental, intellectual\tReading regularly enhances cognitive development in young children.\tTâm lý học & Con người
Fluctuation\t/ˌflʌk.tʃuˈeɪ.ʃən/\tSự biến động, dao động\t(n) fluctuate (v)\tvariation, volatility\tThe stock market experienced significant fluctuations this month.\tKinh tế & Kinh doanh
Infrastructure\t/ˈɪn.frəˌstrʌk.tʃər/\tCơ sở hạ tầng\t(n) infrastructural (adj)\tframework, foundation\tHeavy investment in transportation infrastructure boosts the national economy.\tĐô thị & Xã hội
Archaeological\t/ˌɑːr.ki.əˈlɑː.dʒɪ.kəl/\tThuộc khảo cổ học\t(adj) archaeology (n)\thistorical excavation\tThe archaeological findings provided deep insights into ancient Roman life.\tLịch sử & Khảo cổ
Detrimental\t/ˌdet.rɪˈmen.təl/\tCó hại, gây bất lợi\t(adj) detriment (n)\tharmful, damaging, deleterious\tExcessive screen time has detrimental effects on eyesight.\tY tế & Sức khỏe`;
    setRawText(sample);
    parseRawTextContent(sample);
  };

  const handleConfirmSave = () => {
    if (parsedWords.length === 0) return;

    const now = Date.now();
    const distinctTopics: string[] = Array.from(
      new Set(parsedWords.map((w) => w.topic || defaultTopic))
    );

    // If user wants to split into sets by Topic
    if (splitByTopic && distinctTopics.length > 1 && onSaveMultipleSets) {
      const setsWithWords: Array<{ set: WordSet; words: VocabItem[] }> = [];

      distinctTopics.forEach((topicName: string, tIdx: number) => {
        const topicInfo = getTopicInfo(topicName);
        const topicWords = parsedWords.filter((w) => (w.topic || defaultTopic) === topicName);
        if (topicWords.length === 0) return;

        const setId = `set-${now}-${tIdx}-${Math.random().toString(36).substring(2, 6)}`;
        const setObj: WordSet = {
          id: setId,
          title: `Bộ Từ Vựng ${topicInfo.icon} ${topicName}`,
          description: `Bộ từ vựng IELTS chuyên đề "${topicName}" (${topicWords.length} từ) nạp từ danh sách lớn.`,
          totalWords: topicWords.length,
          createdAt: now + tIdx * 10,
          sourceType: 'custom',
          mainTopic: topicName,
          topics: [topicName],
          tags: [topicName, 'IELTS', 'Batch-Import'].filter(Boolean) as string[],
        };

        const wordsObj: VocabItem[] = topicWords.map((row, wIdx) => ({
          id: `word-${setId}-${wIdx}-${Date.now()}`,
          term: row.term.trim(),
          ipa: row.ipa?.trim(),
          meaning: row.meaning.trim(),
          wordFamily: row.wordFamily?.trim(),
          synonyms: row.synonyms?.trim(),
          antonyms: row.antonyms?.trim(),
          example: row.example?.trim(),
          notes: row.notes?.trim(),
          targetIeltsBand: (row.targetIeltsBand as any) || '7.5',
          topic: topicName,
          sourceSetId: setId,
          mastery: 'new',
          srsStage: 0,
          nextReviewDate: Date.now(),
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
        }));

        setsWithWords.push({ set: setObj, words: wordsObj });
      });

      if (setsWithWords.length > 0) {
        onSaveMultipleSets(setsWithWords);
        onClose();
        return;
      }
    }

    // Otherwise save as Single Combined Master Set
    const setId = `set-master-${Date.now()}`;
    const newSet: WordSet = {
      id: setId,
      title: setTitle.trim() || `Kho Từ Vựng Lớn (${parsedWords.length} từ)`,
      description: `Bộ từ vựng tổng hợp ${parsedWords.length} từ vựng IELTS.`,
      totalWords: parsedWords.length,
      createdAt: Date.now(),
      sourceType: 'custom',
      mainTopic: defaultTopic,
      topics: distinctTopics,
      tags: [...distinctTopics, 'IELTS', 'Master-Library'].filter(Boolean) as string[],
    };

    const newWords: VocabItem[] = parsedWords.map((row, idx) => ({
      id: `word-${setId}-${idx}-${Date.now()}`,
      term: row.term.trim(),
      ipa: row.ipa?.trim(),
      meaning: row.meaning.trim(),
      wordFamily: row.wordFamily?.trim(),
      synonyms: row.synonyms?.trim(),
      antonyms: row.antonyms?.trim(),
      example: row.example?.trim(),
      notes: row.notes?.trim(),
      targetIeltsBand: (row.targetIeltsBand as any) || '7.5',
      topic: row.topic || defaultTopic,
      sourceSetId: setId,
      mastery: 'new',
      srsStage: 0,
      nextReviewDate: Date.now(),
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
    }));

    onSaveSet(newSet, newWords);
    onClose();
  };

  const filteredPreview = parsedWords.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.term.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      (w.topic && w.topic.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#16191D] rounded-3xl max-w-4xl w-full shadow-2xl border border-[#2D3135] overflow-hidden my-4 sm:my-8 animate-fadeIn text-[#E0E2E4] relative flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#2D3135] flex items-center justify-between shrink-0 bg-[#16191D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Nạp Siêu Tốc 1500+ Từ Vựng</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Bulk Importer (CSV/Excel/Text/JSON)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  IndexedDB 10,000+ từ
                </span>
              </h2>
              <p className="text-xs text-[#8B949E]">
                Copy & Paste hoặc nạp file Excel/CSV/Text chứa hàng trăm đến 1500+ từ vựng vào hệ thống trong 1 giây.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: INPUT / UPLOAD */}
        {step === 'input' && (
          <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
            {/* Tab navigation */}
            <div className="flex items-center gap-2 bg-[#21262D] p-1 rounded-2xl border border-[#30363D] w-fit">
              <button
                onClick={() => setImportTab('paste')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  importTab === 'paste'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                <Copy className="w-3.5 h-3.5" /> Dán Văn Bản / Bảng Excel (Copy-Paste)
              </button>
              <button
                onClick={() => setImportTab('file')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  importTab === 'file'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Tải Tệp CSV / TSV / TXT / JSON
              </button>
            </div>

            {/* General Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#21262D]/50 p-3.5 rounded-2xl border border-[#30363D]">
              <div>
                <label className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                  Tên Bộ Từ Vựng:
                </label>
                <input
                  type="text"
                  value={setTitle}
                  onChange={(e) => setSetTitle(e.target.value)}
                  placeholder="VD: Kho 1500 Từ Vựng IELTS Tổng Hợp"
                  className="w-full p-2.5 rounded-xl bg-[#16191D] border border-[#30363D] text-white text-xs font-semibold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                  Chủ Đề Mặc Định (nếu không xác định):
                </label>
                <select
                  value={defaultTopic}
                  onChange={(e) => setDefaultTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#16191D] border border-[#30363D] text-indigo-300 text-xs font-semibold focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  {IELTS_TOPICS.map((t) => (
                    <option key={t.id} value={t.nameVi}>
                      {t.icon} {t.nameVi} ({t.nameEn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TAB 1: PASTE TEXT */}
            {importTab === 'paste' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    Dán danh sách từ vựng vào đây (hỗ trợ tới 1500 - 3000 từ):
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSample1500}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Thử dữ liệu mẫu chuẩn IELTS
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Ví dụ các định dạng được hệ thống tự động nhận diện:\n\n1. Dạng Tab từ Excel / Google Sheets:\nUbiquitous\t/juːˈbɪk.wə.təs/\tPhổ biến, có mặt khắp nơi\t(adj)\tomnipresent\tCông nghệ & Đổi mới\n\n2. Dạng dấu hai chấm / gạch ngang:\nAbundant: dồi dào, phong phú e.g. An abundant supply of food.\nMitigate - làm giảm nhẹ, xoa dịu hậu quả\n\n3. Dạng JSON mảng từ vựng [{ "term": "...", "meaning": "..." }]`}
                  className="w-full p-3.5 rounded-2xl bg-[#21262D] border border-[#30363D] text-white text-xs font-mono placeholder-[#484F58] focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                />

                <div className="flex items-center gap-2 text-xs text-[#8B949E]">
                  <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Hệ thống tự động nhận diện dấu Tab (Excel), dấu phẩy (CSV), dấu hai chấm (:), dấu gạch ngang (-) và JSON.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: FILE UPLOAD */}
            {importTab === 'file' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#30363D] bg-[#21262D]/40 hover:bg-[#21262D] hover:border-emerald-500/50 rounded-3xl p-8 text-center transition-all cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Chọn tệp .CSV, .TSV, .TXT hoặc .JSON từ máy tính
                </h3>
                <p className="text-xs text-[#8B949E] mt-1 max-w-md mx-auto">
                  Dung lượng không giới hạn. Bộ xử lý sẽ đọc tức thì hàng ngàn dòng trong chớp mắt.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Duyệt tệp trên máy tính
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-[#2D3135]">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] cursor-pointer"
              >
                Đóng
              </button>

              <button
                onClick={() => parseRawTextContent(rawText)}
                disabled={!rawText.trim() || isParsing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đọc dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tiếp Tục & Xem Trước Danh Sách</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & IMPORT OPTIONS */}
        {step === 'preview' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Top Overview Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1E2227] via-[#16191D] to-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Đã nhận diện thành công {parsedWords.length} từ vựng
                  </h3>
                </div>
                <p className="text-xs text-[#8B949E]">
                  Kho dữ liệu đã sẵn sàng nạp vào hệ thống lưu trữ vĩnh viễn (IndexedDB & LocalStorage).
                </p>
              </div>

              {/* Organization Mode */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-2 text-xs text-[#C9D1D9] bg-[#21262D] px-3 py-2 rounded-xl border border-[#30363D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splitByTopic}
                    onChange={(e) => setSplitByTopic(e.target.checked)}
                    className="rounded border-[#30363D] text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Tự động chia thành các bộ theo Chủ đề IELTS</span>
                </label>
              </div>
            </div>

            {/* Quick search inside preview */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-[#8B949E]">
                Hiển thị <strong>{filteredPreview.length}</strong> / {parsedWords.length} từ
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ trong danh sách vừa nạp..."
                className="px-3 py-1.5 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-white placeholder-[#484F58] focus:outline-hidden focus:border-emerald-500 w-64"
              />
            </div>

            {/* Parsed Words Table / Grid */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredPreview.slice(0, 200).map((row, idx) => {
                const topicInfo = getTopicInfo(row.topic);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-emerald-400 font-mono">#{idx + 1}</span>
                      <span className="font-bold text-white text-sm">{row.term}</span>
                      {row.ipa && (
                        <span className="text-[11px] text-[#8B949E] font-mono">{row.ipa}</span>
                      )}
                      {row.wordFamily && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-medium">
                          {row.wordFamily}
                        </span>
                      )}
                      <span className="text-[#8B949E] truncate max-w-xs sm:max-w-md">
                        — {row.meaning}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${topicInfo.badgeBg} ${topicInfo.badgeBorder} ${topicInfo.badgeText}`}
                      >
                        {topicInfo.icon} {row.topic || defaultTopic}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                        Band {row.targetIeltsBand || '7.5'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredPreview.length > 200 && (
                <div className="p-3 text-center text-xs text-[#8B949E] bg-[#16191D] rounded-xl border border-[#30363D]">
                  ...và <strong>{filteredPreview.length - 200}</strong> từ vựng khác sẽ được nạp đầy đủ vào kho.
                </div>
              )}
            </div>

            {/* Preview Footer Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-[#2D3135]">
              <button
                onClick={() => setStep('input')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] cursor-pointer"
              >
                ← Quay lại chỉnh sửa văn bản
              </button>

              <button
                onClick={handleConfirmSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận & Lưu {parsedWords.length} Từ Vào Kho Học</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
