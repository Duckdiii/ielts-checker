import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  ArrowRight,
  FolderPlus,
  RefreshCw,
  HelpCircle,
  Layers,
  Database,
} from 'lucide-react';
import { VocabItem, WordSet } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface ExcelCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sets: WordSet[];
  activeSetId: string;
  onImportComplete: (newWords: VocabItem[], newSet?: WordSet) => void;
}

interface ColumnMapping {
  term: string;
  meaning: string;
  ipa: string;
  example: string;
  wordFamily: string;
  synonyms: string;
  antonyms: string;
  topic: string;
  targetIeltsBand: string;
  cefrLevel: string;
  notes: string;
}

export const ExcelCsvImportModal: React.FC<ExcelCsvImportModalProps> = ({
  isOpen,
  onClose,
  sets,
  activeSetId,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    term: '',
    meaning: '',
    ipa: '',
    example: '',
    wordFamily: '',
    synonyms: '',
    antonyms: '',
    topic: '',
    targetIeltsBand: '',
    cefrLevel: '',
    notes: '',
  });

  const [importTarget, setImportTarget] = useState<'new_set' | 'existing_set'>('new_set');
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetTopic, setNewSetTopic] = useState('Học thuật tổng hợp');
  const [selectedSetId, setSelectedSetId] = useState(activeSetId || sets[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto-detect columns based on common header names in Vietnamese & English
  const autoDetectColumns = (headerList: string[]): ColumnMapping => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '');

    const findMatch = (keywords: string[]) => {
      for (const key of keywords) {
        const found = headerList.find((h) => normalize(h).includes(normalize(key)));
        if (found) return found;
      }
      return '';
    };

    return {
      term: findMatch(['term', 'word', 'vocabulary', 'từ vựng', 'từ', 'collocation', 'tuvung', 'tu']),
      meaning: findMatch(['meaning', 'definition', 'nghĩa', 'nghia', 'ý nghĩa', 'dịch', 'dich']),
      ipa: findMatch(['ipa', 'phonetic', 'phiên âm', 'phienam', 'phát âm']),
      example: findMatch(['example', 'sentence', 'ví dụ', 'vividu', 'câu ví dụ', 'cau']),
      wordFamily: findMatch(['wordfamily', 'word_family', 'họ từ', 'hotu', 'từ loại']),
      synonyms: findMatch(['synonym', 'đồng nghĩa', 'dongnghia', 'từ đồng nghĩa']),
      antonyms: findMatch(['antonym', 'trái nghĩa', 'trainghia', 'từ trái nghĩa']),
      topic: findMatch(['topic', 'chủ đề', 'chude', 'category', 'chuyên đề']),
      targetIeltsBand: findMatch(['band', 'ieltsband', 'ielts_band', 'ielts']),
      cefrLevel: findMatch(['cefr', 'level', 'trình độ']),
      notes: findMatch(['note', 'notes', 'ghi chú', 'ghichu']),
    };
  };

  // Parse Excel / CSV file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON array of objects
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          setErrorMessage('File không chứa dữ liệu hoặc bảng trống.');
          return;
        }

        // Extract header names
        const sheetHeaders = Object.keys(json[0]);
        setHeaders(sheetHeaders);
        setRawData(json);

        // Auto map headers
        const detected = autoDetectColumns(sheetHeaders);
        setColumnMapping(detected);

        // Suggest set title from file name without extension
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setNewSetTitle(cleanName);

        setStep('mapping');
      } catch (err: any) {
        console.error('Error parsing spreadsheet:', err);
        setErrorMessage('Không thể đọc tệp Excel/CSV. Vui lòng kiểm tra lại định dạng tệp.');
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  // Download Sample Excel Template
  const downloadSampleTemplate = (format: 'xlsx' | 'csv') => {
    const sampleData = [
      {
        'Từ vựng (Term)': 'sustainable development',
        'Nghĩa tiếng Việt': 'sự phát triển bền vững',
        'Phiên âm (IPA)': '/səˈsteɪnəbl dɪˈveləpmənt/',
        'Câu ví dụ (Example)': 'Governments should prioritize sustainable development over short-term economic gains.',
        'Họ từ (Word Family)': 'sustain (v), sustainability (n)',
        'Từ đồng nghĩa (Synonyms)': 'eco-friendly growth, renewable progression',
        'Từ trái nghĩa (Antonyms)': 'environmental degradation',
        'Chủ đề (Topic)': 'Môi trường & Biến đổi khí hậu',
        'IELTS Band': '7.5',
      },
      {
        'Từ vựng (Term)': 'pose a severe threat to',
        'Nghĩa tiếng Việt': 'gây ra mối đe dọa nghiêm trọng đối với',
        'Phiên âm (IPA)': '/pəʊz ə sɪˈvɪər θret tuː/',
        'Câu ví dụ (Example)': 'Rising sea levels pose a severe threat to coastal communities.',
        'Họ từ (Word Family)': 'threaten (v), threatening (adj)',
        'Từ đồng nghĩa (Synonyms)': 'imperil, jeopardize, endanger',
        'Từ trái nghĩa (Antonyms)': 'safeguard, protect',
        'Chủ đề (Topic)': 'Môi trường & Biến đổi khí hậu',
        'IELTS Band': '8.0+',
      },
      {
        'Từ vựng (Term)': 'cutting-edge technology',
        'Nghĩa tiếng Việt': 'công nghệ tiên tiến, mũi nhọn',
        'Phiên âm (IPA)': '/ˌkʌt.ɪŋˈedʒ tekˈnɒl.ə.dʒi/',
        'Câu ví dụ (Example)': 'The hospital is equipped with cutting-edge technology for precision surgery.',
        'Họ từ (Word Family)': 'technological (adj)',
        'Từ đồng nghĩa (Synonyms)': 'state-of-the-art technology, groundbreaking innovation',
        'Từ trái nghĩa (Antonyms)': 'obsolete equipment',
        'Chủ đề (Topic)': 'Khoa học & Công nghệ',
        'IELTS Band': '7.5',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IELTS_Vocab_Template');

    if (format === 'xlsx') {
      XLSX.writeFile(wb, 'IELTS_Vocab_Sample_Template.xlsx');
    } else {
      XLSX.writeFile(wb, 'IELTS_Vocab_Sample_Template.csv');
    }
  };

  // Convert mapped rows to VocabItem[]
  const parseMappedWords = (): VocabItem[] => {
    const targetSetId =
      importTarget === 'new_set'
        ? `set-${Date.now()}`
        : selectedSetId || activeSetId || 'set-default';

    return rawData
      .map((row, idx) => {
        const term = columnMapping.term ? String(row[columnMapping.term] || '').trim() : '';
        const meaning = columnMapping.meaning
          ? String(row[columnMapping.meaning] || '').trim()
          : '';

        if (!term) return null;

        const ipa = columnMapping.ipa ? String(row[columnMapping.ipa] || '').trim() : undefined;
        const example = columnMapping.example
          ? String(row[columnMapping.example] || '').trim()
          : undefined;
        const wordFamily = columnMapping.wordFamily
          ? String(row[columnMapping.wordFamily] || '').trim()
          : undefined;
        const synonyms = columnMapping.synonyms
          ? String(row[columnMapping.synonyms] || '').trim()
          : undefined;
        const antonyms = columnMapping.antonyms
          ? String(row[columnMapping.antonyms] || '').trim()
          : undefined;
        const topic = columnMapping.topic
          ? String(row[columnMapping.topic] || '').trim()
          : newSetTopic || 'Học thuật tổng hợp';
        const targetIeltsBand = columnMapping.targetIeltsBand
          ? (String(row[columnMapping.targetIeltsBand] || '').trim() as any)
          : '7.0';
        const cefrLevel = columnMapping.cefrLevel
          ? (String(row[columnMapping.cefrLevel] || '').trim() as any)
          : undefined;
        const notes = columnMapping.notes
          ? String(row[columnMapping.notes] || '').trim()
          : undefined;

        const vocabItem: VocabItem = {
          id: `excel-word-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          term,
          meaning: meaning || 'Chưa có định nghĩa',
          ipa,
          example,
          wordFamily,
          synonyms,
          antonyms,
          topic,
          targetIeltsBand: ['6.0', '6.5', '7.0', '7.5', '8.0+'].includes(targetIeltsBand)
            ? targetIeltsBand
            : '7.0',
          cefrLevel: ['B1', 'B2', 'C1', 'C2'].includes(cefrLevel) ? cefrLevel : undefined,
          notes,
          sourceSetId: targetSetId,
          mastery: 'new',
          srsStage: 0,
          nextReviewDate: Date.now(),
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
        };

        return vocabItem;
      })
      .filter((w): w is VocabItem => w !== null);
  };

  const handleFinalImport = () => {
    const validWords = parseMappedWords();
    if (validWords.length === 0) {
      setErrorMessage('Không tìm thấy từ vựng hợp lệ nào để nhập (Cột từ vựng không được để trống).');
      return;
    }

    setIsProcessing(true);

    try {
      let createdSet: WordSet | undefined = undefined;

      if (importTarget === 'new_set') {
        const setId = validWords[0]?.sourceSetId || `set-${Date.now()}`;
        createdSet = {
          id: setId,
          title: newSetTitle.trim() || file?.name.replace(/\.[^/.]+$/, '') || 'Bộ từ vựng Excel',
          description: `Nhập từ tệp ${file?.name || 'Excel/CSV'} (${validWords.length} từ vựng)`,
          sourceType: 'custom',
          fileName: file?.name,
          createdAt: Date.now(),
          totalWords: validWords.length,
          mainTopic: newSetTopic || 'Học thuật tổng hợp',
          topics: Array.from(new Set(validWords.map((w) => w.topic || 'Học thuật tổng hợp'))),
        };
      }

      sounds.playSuccess();
      onImportComplete(validWords, createdSet);
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage('Có lỗi xảy ra khi lưu từ vựng vào hệ thống.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validWordsCount = columnMapping.term
    ? rawData.filter((r) => String(r[columnMapping.term] || '').trim().length > 0).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#16191D] rounded-3xl max-w-3xl w-full shadow-2xl border border-[#2D3135] overflow-hidden my-6 text-[#E0E2E4] relative animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#2D3135] flex items-center justify-between bg-[#1A1D23]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Nạp Từ Vựng Từ Excel / CSV</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  .xlsx, .xls, .csv
                </span>
              </div>
              <p className="text-xs text-[#8B949E]">
                Nhận diện bảng tính tự động, ánh xạ cột thông minh & nạp vào kho từ vựng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Upload File */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#30363D] hover:border-emerald-500/50 bg-[#1C2128]/50 hover:bg-[#1C2128] rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                  Kéo thả file Excel (.xlsx, .xls) hoặc CSV (.csv) vào đây
                </h3>
                <p className="text-xs text-[#8B949E] max-w-md mx-auto mb-6">
                  Hỗ trợ mọi cấu trúc cột: Từ vựng, Nghĩa tiếng Việt, Phiên âm IPA, Ví dụ, Từ loại,
                  Chủ đề,...
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Chọn Tệp Bảng Tính Từ Máy Tính</span>
                </button>
              </div>

              {/* Sample Templates */}
              <div className="p-4 rounded-2xl bg-[#1F242C] border border-[#30363D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Tải File Mẫu Chuẩn IELTS</h4>
                    <p className="text-[11px] text-[#8B949E]">
                      Xem trước cấu trúc cột mẫu để điền từ vựng nhanh nhất
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => downloadSampleTemplate('xlsx')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#282E37] hover:bg-[#323945] text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Mẫu Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => downloadSampleTemplate('csv')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#282E37] hover:bg-[#323945] text-blue-400 border border-blue-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Mẫu CSV (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Mapping Columns */}
          {step === 'mapping' && (
            <div className="space-y-6">
              {/* File Info Banner */}
              <div className="p-4 rounded-2xl bg-[#1C2128] border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    XLS
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{file?.name}</h4>
                    <p className="text-[11px] text-[#8B949E]">
                      Tìm thấy <strong className="text-emerald-400">{rawData.length}</strong> hàng dữ
                      liệu & <strong className="text-indigo-400">{headers.length}</strong> cột
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                  }}
                  className="text-xs text-[#8B949E] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đổi file khác</span>
                </button>
              </div>

              {/* Import Destination Options */}
              <div className="p-4 rounded-2xl bg-[#1A1D23] border border-[#2D3135] space-y-3">
                <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                  1. Nơi lưu trữ từ vựng:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      importTarget === 'new_set'
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-white'
                        : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importTarget"
                      checked={importTarget === 'new_set'}
                      onChange={() => setImportTarget('new_set')}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                        <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                        Tạo Bộ Từ Mới
                      </span>
                      <span className="text-[11px] text-[#8B949E]">
                        Tạo một thư mục bộ từ riêng cho file này
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      importTarget === 'existing_set'
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-white'
                        : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importTarget"
                      checked={importTarget === 'existing_set'}
                      onChange={() => setImportTarget('existing_set')}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Gộp vào Bộ Từ Có Sẵn
                      </span>
                      <span className="text-[11px] text-[#8B949E]">
                        Thêm từ vào bộ từ bạn đang học
                      </span>
                    </div>
                  </label>
                </div>

                {importTarget === 'new_set' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#8B949E] block mb-1">
                        Tên Bộ Từ Mới:
                      </label>
                      <input
                        type="text"
                        value={newSetTitle}
                        onChange={(e) => setNewSetTitle(e.target.value)}
                        placeholder="Ví dụ: 3000 Oxford Vocab, Cam 18 Collocations..."
                        className="w-full px-3 py-2 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#8B949E] block mb-1">
                        Chủ đề chính:
                      </label>
                      <input
                        type="text"
                        value={newSetTopic}
                        onChange={(e) => setNewSetTopic(e.target.value)}
                        placeholder="Ví dụ: Môi trường, Giáo dục, Kinh tế..."
                        className="w-full px-3 py-2 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-[#8B949E] block mb-1">
                      Chọn Bộ Từ Mục Tiêu:
                    </label>
                    <select
                      value={selectedSetId}
                      onChange={(e) => setSelectedSetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {sets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.totalWords} từ)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Column Mapping Grid */}
              <div className="p-4 rounded-2xl bg-[#1A1D23] border border-[#2D3135] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                    2. Khớp cột bảng tính (Column Mapping):
                  </h3>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã nhận diện {validWordsCount} từ hợp lệ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Term (Required) */}
                  <div className="p-3 rounded-xl bg-[#21262D] border border-indigo-500/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white flex items-center gap-1">
                        <span>Từ vựng / Cụm từ</span>
                        <span className="text-rose-400">* (Bắt buộc)</span>
                      </label>
                    </div>
                    <select
                      value={columnMapping.term}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, term: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#16191D] border border-[#30363D] text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Chọn cột chứa từ vựng --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Meaning (Required) */}
                  <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white flex items-center gap-1">
                        <span>Nghĩa tiếng Việt</span>
                        <span className="text-indigo-400">(Khuyến nghị)</span>
                      </label>
                    </div>
                    <select
                      value={columnMapping.meaning}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, meaning: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#16191D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Chọn cột chứa nghĩa --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IPA */}
                  <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <label className="text-xs font-semibold text-[#8B949E] block mb-1.5">
                      Phiên âm (IPA):
                    </label>
                    <select
                      value={columnMapping.ipa}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, ipa: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#16191D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Bỏ qua hoặc tự động --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Example */}
                  <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <label className="text-xs font-semibold text-[#8B949E] block mb-1.5">
                      Câu ví dụ (Example):
                    </label>
                    <select
                      value={columnMapping.example}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, example: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#16191D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Bỏ qua hoặc tự động --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Word Family */}
                  <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <label className="text-xs font-semibold text-[#8B949E] block mb-1.5">
                      Word Family / Từ loại:
                    </label>
                    <select
                      value={columnMapping.wordFamily}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, wordFamily: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#16191D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Bỏ qua --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Synonyms */}
                  <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <label className="text-xs font-semibold text-[#8B949E] block mb-1.5">
                      Từ đồng nghĩa (Synonyms):
                    </label>
                    <select
                      value={columnMapping.synonyms}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, synonyms: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#16191D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Bỏ qua --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IELTS Band */}
                  <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <label className="text-xs font-semibold text-[#8B949E] block mb-1.5">
                      IELTS Band (Target Band):
                    </label>
                    <select
                      value={columnMapping.targetIeltsBand}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, targetIeltsBand: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#16191D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Mặc định 7.0 --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic */}
                  <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <label className="text-xs font-semibold text-[#8B949E] block mb-1.5">
                      Chuyên đề / Topic:
                    </label>
                    <select
                      value={columnMapping.topic}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, topic: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#16191D] border border-[#30363D] text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Dùng chủ đề chung --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Preview Table (First 3 Rows) */}
              {columnMapping.term && (
                <div className="p-4 rounded-2xl bg-[#1A1D23] border border-[#2D3135] space-y-2">
                  <h4 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                    Xem trước 3 hàng đầu tiên:
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#30363D] text-[#8B949E]">
                          <th className="py-2 px-3 font-semibold">Từ vựng (Term)</th>
                          <th className="py-2 px-3 font-semibold">Nghĩa tiếng Việt</th>
                          <th className="py-2 px-3 font-semibold">Phiên âm</th>
                          <th className="py-2 px-3 font-semibold">Ví dụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30363D]/50 text-white">
                        {rawData.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#21262D]/50">
                            <td className="py-2.5 px-3 font-bold text-indigo-300">
                              {columnMapping.term ? String(row[columnMapping.term] || '') : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-[#E0E2E4]">
                              {columnMapping.meaning
                                ? String(row[columnMapping.meaning] || '')
                                : '-'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#8B949E]">
                              {columnMapping.ipa ? String(row[columnMapping.ipa] || '') : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-[#8B949E] italic truncate max-w-xs">
                              {columnMapping.example
                                ? String(row[columnMapping.example] || '')
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2D3135] bg-[#16191D] flex items-center justify-between">
          {step === 'mapping' ? (
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] transition-colors cursor-pointer"
            >
              Quay lại
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors cursor-pointer"
            >
              Hủy
            </button>
          )}

          {step === 'mapping' && (
            <button
              onClick={handleFinalImport}
              disabled={isProcessing || !columnMapping.term || validWordsCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Đang lưu từ vựng...'
                  : `Nhập ${validWordsCount} Từ Vào Kho Từ Vựng`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
