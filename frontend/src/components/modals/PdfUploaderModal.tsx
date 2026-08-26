import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  ArrowRight,
  BookOpen,
  Tag,
  Layers,
  Filter,
  Split,
  FolderPlus,
  Files,
  RefreshCw,
  Search,
  CheckCircle2,
  CheckCheck,
  Eye,
  Info,
} from 'lucide-react';
import { parsePdfFile, parsePdfFileStream, StreamProgressUpdate, ParsedPdfResult } from '../../services/geminiService';
import { VocabItem, WordSet } from '../../types';
import { IELTS_TOPICS, getTopicInfo } from '../../utils/topicHelpers';

interface PdfUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSet: (set: WordSet, words: VocabItem[]) => void;
  onSaveMultipleSets?: (setsWithWords: Array<{ set: WordSet; words: VocabItem[] }>) => void;
}

export interface PdfQueueItem {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: ParsedPdfResult;
  wordCount?: number;
  mainTopic?: string;
  detectedTopics?: string[];
  streamProgress?: StreamProgressUpdate;
}

export interface ParsedWordRow {
  id: string;
  sourceFileId: string;
  sourceFileName: string;
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const PdfUploaderModal: React.FC<PdfUploaderModalProps> = ({
  isOpen,
  onClose,
  onSaveSet,
  onSaveMultipleSets,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [pdfQueue, setPdfQueue] = useState<PdfQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [step, setStep] = useState<'queue' | 'preview'>('queue');

  // Preview & configuration state
  const [extractedRows, setExtractedRows] = useState<ParsedWordRow[]>([]);
  const [selectedFileFilter, setSelectedFileFilter] = useState<string>('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deduplicate, setDeduplicate] = useState(true);

  // Save mode: 'per-file' (1 WordSet per PDF) | 'per-topic' (Split by detected topics) | 'merged' (1 master combined set)
  const [saveMode, setSaveMode] = useState<'per-file' | 'per-topic' | 'merged'>('per-file');
  const [mergedSetTitle, setMergedSetTitle] = useState('');
  const [mergedSetDescription, setMergedSetDescription] = useState('');
  const [mergedSetMainTopic, setMergedSetMainTopic] = useState('Học thuật tổng hợp');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Add files to upload queue
  const handleAddFiles = (files: FileList | File[]) => {
    const newItems: PdfQueueItem[] = [];

    Array.from(files).forEach((f) => {
      if (f.name.toLowerCase().endsWith('.pdf')) {
        // Prevent adding duplicate identical files
        const alreadyExists = pdfQueue.some(
          (q) => q.name === f.name && q.file.size === f.size
        );
        if (!alreadyExists) {
          newItems.push({
            id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            file: f,
            name: f.name,
            sizeFormatted: formatFileSize(f.size),
            status: 'pending',
          });
        }
      }
    });

    if (newItems.length > 0) {
      setPdfQueue((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemoveQueueItem = (id: string) => {
    if (isProcessingQueue) return;
    setPdfQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearAllQueue = () => {
    if (isProcessingQueue) return;
    setPdfQueue([]);
  };

  // Process all files in queue
  const handleStartBatchProcessing = async () => {
    if (pdfQueue.length === 0 || isProcessingQueue) return;

    setIsProcessingQueue(true);
    const updatedQueue = [...pdfQueue];
    const allExtractedWords: ParsedWordRow[] = [];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status === 'completed' && item.result) {
        // Already processed, collect words
        continue;
      }

      setCurrentProcessingIndex(i);
      updatedQueue[i] = { ...item, status: 'processing', error: undefined };
      setPdfQueue([...updatedQueue]);

      try {
        const result = await parsePdfFileStream(item.file, (update) => {
          setPdfQueue((prevQueue) => {
            const next = [...prevQueue];
            if (next[i]) {
              next[i] = { ...next[i], streamProgress: update };
            }
            return next;
          });
        });
        const detectedMainTopic = result.mainTopic || 'Học thuật tổng hợp';
        const detectedTopics = result.topics && result.topics.length > 0 ? result.topics : [detectedMainTopic];

        updatedQueue[i] = {
          ...item,
          status: 'completed',
          result,
          wordCount: result.words?.length || 0,
          mainTopic: detectedMainTopic,
          detectedTopics,
          streamProgress: { progress: 100, stage: 'done', message: 'Hoàn tất trích xuất!' },
        };
        setPdfQueue([...updatedQueue]);

        // Transform and enrich words
        const rows: ParsedWordRow[] = (result.words || []).map((w, wIdx) => ({
          id: `w-${item.id}-${wIdx}-${Math.random().toString(36).substring(2, 6)}`,
          sourceFileId: item.id,
          sourceFileName: item.name,
          term: w.term.trim(),
          ipa: w.ipa?.trim(),
          meaning: w.meaning.trim(),
          wordFamily: w.wordFamily?.trim(),
          synonyms: w.synonyms?.trim(),
          antonyms: w.antonyms?.trim(),
          example: w.example?.trim(),
          notes: w.notes?.trim(),
          targetIeltsBand: w.targetIeltsBand || '7.5',
          topic: w.topic && w.topic.trim() ? w.topic.trim() : detectedMainTopic,
        }));

        allExtractedWords.push(...rows);
      } catch (err: any) {
        console.error(`Error parsing ${item.name}:`, err);
        updatedQueue[i] = {
          ...item,
          status: 'error',
          error: err.message || 'Lỗi khi giải mã PDF. Vui lòng kiểm tra lại định dạng tệp.',
        };
        setPdfQueue([...updatedQueue]);
      }
    }

    setIsProcessingQueue(false);
    setCurrentProcessingIndex(-1);

    // Check if at least one file succeeded
    const successfulItems = updatedQueue.filter((q) => q.status === 'completed' && q.result);
    if (successfulItems.length > 0) {
      // Collect all words across all successful items
      const collected: ParsedWordRow[] = [];
      successfulItems.forEach((q) => {
        const res = q.result!;
        const fallbackTopic = q.mainTopic || 'Học thuật tổng hợp';
        (res.words || []).forEach((w, wIdx) => {
          collected.push({
            id: `w-${q.id}-${wIdx}-${Math.random().toString(36).substring(2, 6)}`,
            sourceFileId: q.id,
            sourceFileName: q.name,
            term: w.term.trim(),
            ipa: w.ipa?.trim(),
            meaning: w.meaning.trim(),
            wordFamily: w.wordFamily?.trim(),
            synonyms: w.synonyms?.trim(),
            antonyms: w.antonyms?.trim(),
            example: w.example?.trim(),
            notes: w.notes?.trim(),
            targetIeltsBand: w.targetIeltsBand || '7.5',
            topic: w.topic && w.topic.trim() ? w.topic.trim() : fallbackTopic,
          });
        });
      });

      setExtractedRows(collected);

      // Default merged title & topic
      if (successfulItems.length === 1) {
        setMergedSetTitle(successfulItems[0].result?.title || successfulItems[0].name.replace('.pdf', ''));
        setMergedSetMainTopic(successfulItems[0].mainTopic || 'Học thuật tổng hợp');
        setMergedSetDescription(
          successfulItems[0].result?.description ||
            `Bộ từ vựng IELTS trích xuất tự động từ tệp ${successfulItems[0].name}.`
        );
        setSaveMode('per-file');
      } else {
        setMergedSetTitle(`Trọn Bộ Từ Vựng IELTS (${successfulItems.length} Tệp PDF)`);
        setMergedSetMainTopic('Học thuật tổng hợp');
        setMergedSetDescription(
          `Gộp tổng hợp từ vựng IELTS từ ${successfulItems.length} tài liệu: ${successfulItems
            .map((s) => s.name)
            .join(', ')}.`
        );
        setSaveMode(successfulItems.length > 1 ? 'per-file' : 'merged');
      }

      setStep('preview');
    }
  };

  const handleRetrySingle = async (index: number) => {
    if (isProcessingQueue) return;
    const item = pdfQueue[index];
    if (!item) return;

    setIsProcessingQueue(true);
    setCurrentProcessingIndex(index);
    const updatedQueue = [...pdfQueue];
    updatedQueue[index] = { ...item, status: 'processing', error: undefined };
    setPdfQueue([...updatedQueue]);

    try {
      const result = await parsePdfFile(item.file);
      const detectedMainTopic = result.mainTopic || 'Học thuật tổng hợp';
      const detectedTopics = result.topics && result.topics.length > 0 ? result.topics : [detectedMainTopic];

      updatedQueue[index] = {
        ...item,
        status: 'completed',
        result,
        wordCount: result.words?.length || 0,
        mainTopic: detectedMainTopic,
        detectedTopics,
      };
      setPdfQueue([...updatedQueue]);
    } catch (err: any) {
      updatedQueue[index] = {
        ...item,
        status: 'error',
        error: err.message || 'Lỗi khi đọc file PDF.',
      };
      setPdfQueue([...updatedQueue]);
    } finally {
      setIsProcessingQueue(false);
      setCurrentProcessingIndex(-1);
    }
  };

  // Word editing handlers in preview
  const handleRemoveWord = (wordId: string) => {
    setExtractedRows((prev) => prev.filter((r) => r.id !== wordId));
  };

  const handleWordChange = (wordId: string, field: keyof ParsedWordRow, value: string) => {
    setExtractedRows((prev) =>
      prev.map((r) => (r.id === wordId ? { ...r, [field]: value } : r))
    );
  };

  // Get distinct files and topics
  const successfulQueueItems = pdfQueue.filter((q) => q.status === 'completed' && q.result);

  const distinctTopics: string[] = Array.from(
    new Set(
      extractedRows
        .map((r) => (r.topic?.trim() || 'Học thuật tổng hợp') as string)
        .filter((t): t is string => Boolean(t))
    )
  );

  // Apply filters to words
  const displayedRows = extractedRows.filter((row) => {
    if (selectedFileFilter !== 'all' && row.sourceFileId !== selectedFileFilter) {
      return false;
    }
    if (selectedTopicFilter !== 'all' && (row.topic || 'Học thuật tổng hợp') !== selectedTopicFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        row.term.toLowerCase().includes(q) ||
        row.meaning.toLowerCase().includes(q) ||
        (row.synonyms && row.synonyms.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Calculate deduplication stats
  const uniqueTermsCount = new Set(extractedRows.map((r) => r.term.trim().toLowerCase())).size;
  const duplicateWordsCount = extractedRows.length - uniqueTermsCount;

  // Final Save Handler
  const handleConfirmSave = () => {
    if (extractedRows.length === 0) return;

    // Optional deduplication helper
    const getFinalWordList = (rows: ParsedWordRow[]) => {
      if (!deduplicate) return rows;
      const seen = new Set<string>();
      const result: ParsedWordRow[] = [];
      rows.forEach((r) => {
        const key = r.term.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(r);
        }
      });
      return result;
    };

    const finalRows = getFinalWordList(extractedRows);
    const now = Date.now();

    // 1. SAVE MODE: 'per-file' (Create separate WordSets for each PDF file)
    if (saveMode === 'per-file' && successfulQueueItems.length > 1 && onSaveMultipleSets) {
      const setsWithWords: Array<{ set: WordSet; words: VocabItem[] }> = [];

      successfulQueueItems.forEach((qItem, sIdx) => {
        const fileWords = finalRows.filter((r) => r.sourceFileId === qItem.id);
        if (fileWords.length === 0) return;

        const fileDetectedTopics = Array.from(
          new Set(
            fileWords
              .map((w) => (w.topic?.trim() || qItem.mainTopic || 'Học thuật tổng hợp') as string)
              .filter((t): t is string => Boolean(t))
          )
        );

        const setId = `set-${now}-${sIdx}-${Math.random().toString(36).substring(2, 6)}`;
        const setObj: WordSet = {
          id: setId,
          title: qItem.result?.title || qItem.name.replace('.pdf', ''),
          description:
            qItem.result?.description ||
            `Bộ từ vựng IELTS trích xuất tự động từ tệp ${qItem.name}.`,
          totalWords: fileWords.length,
          createdAt: now + sIdx * 10,
          sourceType: 'pdf',
          fileName: qItem.name,
          mainTopic: qItem.mainTopic || fileDetectedTopics[0] || 'Học thuật tổng hợp',
          topics: fileDetectedTopics,
          tags: [
            ...fileDetectedTopics,
            'IELTS',
            'PDF',
            qItem.name.replace('.pdf', ''),
          ].filter(Boolean) as string[],
        };

        const wordsObj: VocabItem[] = fileWords.map((row, wIdx) => ({
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
          topic: row.topic?.trim() || qItem.mainTopic || 'Học thuật tổng hợp',
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

    // 2. SAVE MODE: 'per-topic' (Split into sets by Academic Topic across all PDFs)
    if (saveMode === 'per-topic' && distinctTopics.length > 1 && onSaveMultipleSets) {
      const setsWithWords: Array<{ set: WordSet; words: VocabItem[] }> = [];

      distinctTopics.forEach((topicName, tIdx) => {
        const topicInfo = getTopicInfo(topicName);
        const topicWords = finalRows.filter(
          (r) => (r.topic?.trim() || 'Học thuật tổng hợp') === topicName
        );
        if (topicWords.length === 0) return;

        const setId = `set-${now}-${tIdx}-${Math.random().toString(36).substring(2, 6)}`;
        const setObj: WordSet = {
          id: setId,
          title: `Chuyên Đề ${topicInfo.icon} ${topicName}`,
          description: `Bộ từ vựng IELTS chuyên đề "${topicName}" trích xuất từ ${successfulQueueItems.length} tài liệu PDF.`,
          totalWords: topicWords.length,
          createdAt: now + tIdx * 10,
          sourceType: 'pdf',
          mainTopic: topicName,
          topics: [topicName],
          tags: [topicName, 'IELTS', 'Topic-Vocabulary'].filter(Boolean) as string[],
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

    // 3. SAVE MODE: 'merged' (Single Combined Master Set)
    const setId = `set-${Date.now()}`;
    const newSet: WordSet = {
      id: setId,
      title: mergedSetTitle.trim() || 'Bộ Từ Vựng IELTS Tổng Hợp',
      description: mergedSetDescription.trim() || `Tổng hợp từ vựng từ ${successfulQueueItems.length} tệp PDF.`,
      totalWords: finalRows.length,
      createdAt: Date.now(),
      sourceType: 'pdf',
      fileName: successfulQueueItems.map((q) => q.name).join(', '),
      mainTopic: mergedSetMainTopic || distinctTopics[0] || 'Học thuật tổng hợp',
      topics: distinctTopics,
      tags: [
        ...distinctTopics,
        'IELTS',
        'PDF',
        ...successfulQueueItems.map((q) => q.name.replace('.pdf', '')),
      ].filter(Boolean) as string[],
    };

    const newWords: VocabItem[] = finalRows.map((row, idx) => ({
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
      topic: row.topic?.trim() || distinctTopics[0] || 'Học thuật tổng hợp',
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

  const completedCount = pdfQueue.filter((q) => q.status === 'completed').length;
  const errorCount = pdfQueue.filter((q) => q.status === 'error').length;
  const queueProgressPercent =
    pdfQueue.length > 0 ? Math.round(((completedCount + errorCount) / pdfQueue.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#16191D] rounded-3xl max-w-4xl w-full shadow-2xl border border-[#2D3135] overflow-hidden my-4 sm:my-8 animate-fadeIn text-[#E0E2E4] relative flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#2D3135] flex items-center justify-between shrink-0 bg-[#16191D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Nạp Nhiều File PDF Cùng Lúc</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Collocations & Verb Phrases
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  Tự Phân Loại Chủ Đề
                </span>
              </h2>
              <p className="text-xs text-[#8B949E]">
                Nhận diện mọi dạng: Từ đơn, Cụm Collocations, Phrasal Verbs & Cụm động từ học thuật từ sách hoặc đề thi IELTS bất kỳ.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessingQueue}
            className="p-2 rounded-xl bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: QUEUE & MULTI-FILE UPLOAD */}
        {step === 'queue' && (
          <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
            {/* Multi-Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleAddFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => {
                if (!isProcessingQueue) fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                  : 'border-[#30363D] bg-[#21262D]/40 hover:bg-[#21262D] hover:border-indigo-500/50'
              } ${isProcessingQueue ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAddFiles(e.target.files);
                    e.target.value = ''; // Reset input
                  }
                }}
                disabled={isProcessingQueue}
              />

              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-inner mb-3">
                <Upload className="w-7 h-7" />
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white">
                Kéo thả nhiều file PDF đề thi vào đây, hoặc nhấn để chọn tệp
              </h3>
              <p className="text-xs text-[#8B949E] mt-1 max-w-md mx-auto leading-relaxed">
                Hỗ trợ chọn <strong>cùng lúc nhiều file PDF</strong> (Ví dụ: Cam 18 Test 1, Test 2, Test 3...). AI sẽ phân tích và trích xuất song song.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all">
                <Plus className="w-3.5 h-3.5" /> Chọn các tệp PDF từ máy tính
              </div>
            </div>

            {/* Selected Files Queue List */}
            {pdfQueue.length > 0 && (
              <div className="space-y-3 bg-[#16191D] p-4 rounded-2xl border border-[#2D3135]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Danh Sách Tệp Đã Chọn ({pdfQueue.length} tệp)
                    </span>
                    {completedCount > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {completedCount} đã xong
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {errorCount} lỗi
                      </span>
                    )}
                  </div>

                  {!isProcessingQueue && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm file khác
                      </button>
                      <button
                        onClick={handleClearAllQueue}
                        className="text-xs text-[#8B949E] hover:text-rose-400 flex items-center gap-1 cursor-pointer ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Bar if processing */}
                {isProcessingQueue && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-300 font-medium flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang phân tích tệp {currentProcessingIndex + 1}/{pdfQueue.length}:{' '}
                        <strong className="text-white truncate max-w-xs">
                          {pdfQueue[currentProcessingIndex]?.name}
                        </strong>
                      </span>
                      <span className="font-bold text-white font-mono">{queueProgressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#16191D] rounded-full overflow-hidden border border-[#30363D]">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${queueProgressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* File items list */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {pdfQueue.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        item.status === 'processing'
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                          : item.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-[#E0E2E4]'
                          : item.status === 'error'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-[#21262D] border-[#30363D] text-[#C9D1D9]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-[#16191D] border border-[#30363D] flex items-center justify-center shrink-0">
                          {item.status === 'processing' ? (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          ) : item.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : item.status === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-[#8B949E]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-[#8B949E] font-mono shrink-0">
                              {item.sizeFormatted}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#8B949E] flex flex-col gap-1 mt-0.5">
                            {item.status === 'completed' && (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                ✓ Trích xuất thành công {item.wordCount} từ
                                {item.mainTopic && ` • Chủ đề: ${item.mainTopic}`}
                              </span>
                            )}
                            {item.status === 'processing' && (
                              <div className="space-y-1">
                                <span className="text-indigo-400 font-semibold flex items-center gap-1.5">
                                  <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                                  {item.streamProgress?.message || 'Đang xử lý phân tích AI...'}
                                </span>
                                {item.streamProgress?.progress && (
                                  <div className="w-full bg-[#16191D] h-1.5 rounded-full overflow-hidden border border-indigo-500/20">
                                    <div
                                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                      style={{ width: `${item.streamProgress.progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {item.status === 'error' && (
                              <span className="text-rose-400 font-medium line-clamp-1">
                                {item.error || 'Lỗi xử lý'}
                              </span>
                            )}
                            {item.status === 'pending' && <span>Chờ phân tích...</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-1 shrink-0">
                        {item.status === 'error' && !isProcessingQueue && (
                          <button
                            onClick={() => handleRetrySingle(idx)}
                            className="p-1.5 rounded-lg bg-[#16191D] text-amber-400 hover:text-white hover:bg-amber-600 transition-colors cursor-pointer"
                            title="Thử lại file này"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isProcessingQueue && (
                          <button
                            onClick={() => handleRemoveQueueItem(item.id)}
                            className="p-1.5 rounded-lg text-[#8B949E] hover:text-rose-400 hover:bg-[#16191D] transition-colors cursor-pointer"
                            title="Bỏ file này khỏi danh sách"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Files className="w-3.5 h-3.5 text-indigo-400" />
                  Xử Lý Hàng Loạt
                </div>
                <p className="text-[#8B949E] text-[11px] leading-relaxed">
                  Nhận 1 đến 10+ file PDF cùng lúc, tự động trích xuất bảng từ vựng trong từng trang.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  Nhận Diện Chủ Đề Tự Động
                </div>
                <p className="text-[#8B949E] text-[11px] leading-relaxed">
                  Tự động phân loại từ vựng vào các chủ đề học thuật IELTS (Môi trường, Động vật, Kinh tế...).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-emerald-400" />
                  3 Chế Độ Lưu Linh Hoạt
                </div>
                <p className="text-[#8B949E] text-[11px] leading-relaxed">
                  Lưu theo từng File PDF riêng biệt, tách theo Chủ đề học thuật hoặc Gộp chung thành 1 bộ lớn.
                </p>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[#2D3135]">
              <button
                onClick={onClose}
                disabled={isProcessingQueue}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleStartBatchProcessing}
                disabled={pdfQueue.length === 0 || isProcessingQueue}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isProcessingQueue ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang trích xuất ({completedCount}/{pdfQueue.length})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Bắt Đầu Phân Tích {pdfQueue.length > 0 ? `${pdfQueue.length} Tệp PDF` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MULTI-FILE PREVIEW, MERGE & SAVE */}
        {step === 'preview' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Top Multi-File Aggregation Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1E2227] via-[#16191D] to-indigo-950/30 border border-indigo-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Đã trích xuất thành công {extractedRows.length} từ vựng từ {successfulQueueItems.length} tệp PDF
                    </h3>
                  </div>
                  <p className="text-xs text-[#8B949E]">
                    Nhận diện {distinctTopics.length} chủ đề học thuật • {uniqueTermsCount} từ đơn nhất
                    {duplicateWordsCount > 0 && ` (${duplicateWordsCount} từ trùng lặp giữa các file)`}
                  </p>
                </div>

                {/* Deduplication Toggle */}
                {duplicateWordsCount > 0 && (
                  <label className="flex items-center gap-2 text-xs text-[#C9D1D9] bg-[#21262D] px-3 py-1.5 rounded-xl border border-[#30363D] cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={deduplicate}
                      onChange={(e) => setDeduplicate(e.target.checked)}
                      className="rounded border-[#30363D] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tự động loại bỏ từ trùng lặp</span>
                  </label>
                )}
              </div>

              {/* 3 Storage Mode Selector */}
              <div className="pt-2 border-t border-[#2D3135] space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  Chọn Cách Thức Lưu Trữ & Phân Nhóm:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Mode 1: Per-File */}
                  <button
                    type="button"
                    onClick={() => setSaveMode('per-file')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      saveMode === 'per-file'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500'
                        : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:border-[#484F58]'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <Files className="w-3.5 h-3.5 text-indigo-400" />
                        Tách theo từng File PDF
                      </span>
                      {saveMode === 'per-file' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <span className="text-[11px] text-[#8B949E] leading-relaxed">
                      Tạo <strong>{successfulQueueItems.length} bộ từ vựng</strong> tương ứng với từng file PDF tải lên.
                    </span>
                  </button>

                  {/* Mode 2: Per-Topic */}
                  <button
                    type="button"
                    onClick={() => setSaveMode('per-topic')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      saveMode === 'per-topic'
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md ring-1 ring-purple-500'
                        : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:border-[#484F58]'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <Split className="w-3.5 h-3.5 text-purple-400" />
                        Tách theo Chủ Đề ({distinctTopics.length})
                      </span>
                      {saveMode === 'per-topic' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <span className="text-[11px] text-[#8B949E] leading-relaxed">
                      Tự động gom từ tất cả các file thành các bộ theo Topic (Động vật, Môi trường...).
                    </span>
                  </button>

                  {/* Mode 3: Merged Master Set */}
                  <button
                    type="button"
                    onClick={() => setSaveMode('merged')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      saveMode === 'merged'
                        ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500'
                        : 'bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white hover:border-[#484F58]'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        Gộp thành 1 Siêu Bộ Lớn
                      </span>
                      {saveMode === 'merged' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-[11px] text-[#8B949E] leading-relaxed">
                      Gộp toàn bộ từ của {successfulQueueItems.length} file vào 1 bộ từ vựng tổng hợp duy nhất.
                    </span>
                  </button>
                </div>
              </div>

              {/* Set Title input if in Merged mode */}
              {saveMode === 'merged' && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#16191D] p-3 rounded-xl border border-[#30363D] animate-fadeIn">
                  <div>
                    <label className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                      Tên Siêu Bộ Từ Vựng Gộp:
                    </label>
                    <input
                      type="text"
                      value={mergedSetTitle}
                      onChange={(e) => setMergedSetTitle(e.target.value)}
                      placeholder="VD: Trọn Bộ Từ Vựng Cam 18 Reading"
                      className="w-full p-2 rounded-lg bg-[#21262D] border border-[#30363D] text-white text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider block mb-1">
                      Chủ đề chính tổng quan:
                    </label>
                    <select
                      value={mergedSetMainTopic}
                      onChange={(e) => setMergedSetMainTopic(e.target.value)}
                      className="w-full p-2 rounded-lg bg-[#21262D] border border-[#30363D] text-indigo-300 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      {IELTS_TOPICS.map((t) => (
                        <option key={t.id} value={t.nameVi}>
                          {t.icon} {t.nameVi} ({t.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Filter & View Controls */}
            <div className="space-y-2.5">
              {/* File Filter Tabs */}
              {successfulQueueItems.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider shrink-0 mr-1">
                    Lọc theo file:
                  </span>
                  <button
                    onClick={() => setSelectedFileFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      selectedFileFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D]'
                    }`}
                  >
                    📁 Tất cả file ({extractedRows.length})
                  </button>
                  {successfulQueueItems.map((q) => {
                    const count = extractedRows.filter((r) => r.sourceFileId === q.id).length;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setSelectedFileFilter(q.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedFileFilter === q.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D]'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[140px]">{q.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Topic Filter Chips & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#21262D] p-3 rounded-2xl border border-[#30363D]">
                {/* Topic chips */}
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  <button
                    onClick={() => setSelectedTopicFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedTopicFilter === 'all'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-[#16191D] text-[#8B949E] hover:text-white'
                    }`}
                  >
                    Tất cả chủ đề
                  </button>
                  {distinctTopics.map((tName, idx) => {
                    const info = getTopicInfo(tName);
                    const count = extractedRows.filter((r) => r.topic === tName).length;
                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedTopicFilter(selectedTopicFilter === tName ? 'all' : tName)
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedTopicFilter === tName
                            ? `${info.badgeBg} ${info.badgeBorder} ${info.badgeText} border font-bold ring-1 ring-indigo-500`
                            : 'bg-[#16191D] text-[#8B949E] hover:text-white border border-[#30363D]'
                        }`}
                      >
                        <span>{info.icon}</span>
                        <span>{tName}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Search */}
                <div className="relative shrink-0 w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-[#8B949E] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm từ vựng..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#16191D] border border-[#30363D] text-xs text-white placeholder-[#484F58] focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Extracted Words List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>
                  Đang hiển thị <strong>{displayedRows.length}</strong> / {extractedRows.length} từ
                </span>
                <span>Chỉnh sửa trực tiếp trước khi lưu</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {displayedRows.map((row, idx) => {
                  const topicInfo = getTopicInfo(row.topic);

                  return (
                    <div
                      key={row.id}
                      className="p-3.5 rounded-xl bg-[#21262D] border border-[#30363D] space-y-2 relative transition-colors hover:border-indigo-500/40"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Term, IPA, Band, File source */}
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-bold text-indigo-400">#{idx + 1}</span>
                          <input
                            type="text"
                            value={row.term}
                            onChange={(e) => handleWordChange(row.id, 'term', e.target.value)}
                            placeholder="Từ vựng"
                            className="font-bold text-sm bg-transparent border-b border-[#30363D] focus:border-indigo-500 text-white focus:outline-hidden px-1 py-0.5 flex-1"
                          />
                          <input
                            type="text"
                            value={row.ipa || ''}
                            onChange={(e) => handleWordChange(row.id, 'ipa', e.target.value)}
                            placeholder="IPA (Phiên âm)"
                            className="text-xs text-[#8B949E] font-mono bg-transparent border-b border-[#30363D] focus:border-indigo-500 focus:outline-hidden px-1 py-0.5 w-28"
                          />
                          <input
                            type="text"
                            value={row.targetIeltsBand || '7.5'}
                            onChange={(e) =>
                              handleWordChange(row.id, 'targetIeltsBand', e.target.value)
                            }
                            placeholder="Band"
                            className="text-xs text-indigo-300 font-bold bg-transparent border-b border-[#30363D] focus:border-indigo-500 focus:outline-hidden px-1 py-0.5 w-14 text-center"
                          />
                        </div>

                        {/* File & Topic Indicator */}
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-mono text-[#8B949E] bg-[#16191D] px-2 py-0.5 rounded border border-[#30363D] truncate max-w-[120px]"
                            title={row.sourceFileName}
                          >
                            📄 {row.sourceFileName}
                          </span>

                          <div className="flex items-center gap-1.5 bg-[#16191D] px-2.5 py-1 rounded-xl border border-[#30363D]">
                            <span className="text-xs">{topicInfo.icon}</span>
                            <select
                              value={row.topic || 'Học thuật tổng hợp'}
                              onChange={(e) => handleWordChange(row.id, 'topic', e.target.value)}
                              className="bg-transparent text-[11px] font-semibold text-white focus:outline-hidden cursor-pointer"
                            >
                              {IELTS_TOPICS.map((t) => (
                                <option
                                  key={t.id}
                                  value={t.nameVi}
                                  className="bg-[#16191D] text-white"
                                >
                                  {t.icon} {t.nameVi}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={() => handleRemoveWord(row.id)}
                            className="p-1.5 rounded-lg text-[#484F58] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Xóa từ này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Meaning & Word Family */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          value={row.meaning}
                          onChange={(e) => handleWordChange(row.id, 'meaning', e.target.value)}
                          placeholder="Nghĩa tiếng Việt"
                          className="p-2 rounded-lg bg-[#16191D] border border-[#30363D] text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                        />
                        <input
                          type="text"
                          value={row.wordFamily || ''}
                          onChange={(e) => handleWordChange(row.id, 'wordFamily', e.target.value)}
                          placeholder="Word family (Họ từ loại: n, v, adj, adv)"
                          className="p-2 rounded-lg bg-[#16191D] border border-[#30363D] text-[#8B949E] focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      {/* Synonyms & Example */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          value={row.synonyms || ''}
                          onChange={(e) => handleWordChange(row.id, 'synonyms', e.target.value)}
                          placeholder="Từ đồng nghĩa Paraphrase (Synonyms)"
                          className="p-2 rounded-lg bg-[#16191D] border border-[#30363D] text-emerald-400 focus:outline-hidden focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={row.example || ''}
                          onChange={(e) => handleWordChange(row.id, 'example', e.target.value)}
                          placeholder="Ví dụ ngữ cảnh IELTS trong bài đọc"
                          className="p-2 rounded-lg bg-[#16191D] border border-[#30363D] text-[#C9D1D9] italic focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-[#2D3135] flex items-center justify-between">
              <button
                onClick={() => setStep('queue')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#2D3135] text-[#E0E2E4] border border-[#30363D] cursor-pointer"
              >
                Quay lại danh sách tệp
              </button>

              <button
                onClick={handleConfirmSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {saveMode === 'per-file'
                    ? `Lưu ${successfulQueueItems.length} Bộ từ vựng theo File (${extractedRows.length} từ)`
                    : saveMode === 'per-topic'
                    ? `Lưu & Tách ${distinctTopics.length} Bộ theo Chủ Đề`
                    : `Lưu Siêu Bộ Gộp (${extractedRows.length} từ)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
