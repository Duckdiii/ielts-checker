import { Type } from '../services/gemini.service';

export function getExpandVocabPrompt(term: string, meaning?: string, example?: string): string {
  return `
Bạn là chuyên gia IELTS 9.0 Lexical Resource. Hãy phân tích chuyên sâu từ vựng sau:
- Từ vựng: "${term}"
- Nghĩa: "${meaning || ''}"
- Ví dụ ngữ cảnh: "${example || ''}"

Hãy cung cấp:
1. Phiên âm IPA chuẩn & IELTS Band ước tính của từ này (ví dụ "7.5", "8.0", "8.5").
2. Ngữ cảnh học thuật (Academic register: Formal, Semi-formal, Literary, Academic essay).
3. Họ từ loại (Word Family): danh sách dạng từ, loại từ (noun/verb/adj/adv) và nghĩa tiếng Việt.
4. Danh sách các từ đồng nghĩa cao cấp (Synonyms) kèm:
   - Phiên âm IPA
   - Nghĩa tiếng Việt
   - IELTS Band (e.g. 7.5, 8.0, 8.5)
   - Sắc thái nghĩa chi tiết (Nuance) để học viên không dùng sai ngữ cảnh
   - Cụm Collocation mẫu
   - Câu ví dụ học thuật
5. Từ trái nghĩa (Antonyms)
6. Các Collocation ăn điểm cao (High-band collocations) thường gặp trong IELTS Writing/Speaking kèm ví dụ
7. Lỗi phổ biến người Việt hay mắc (Common mistakes / False friends / Collocation errors)
8. Bí quyết nâng Band Speaking & Writing khi sử dụng từ này trong phòng thi.
`;
}

export const EXPAND_VOCAB_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    term: { type: Type.STRING },
    ipa: { type: Type.STRING },
    meaningVi: { type: Type.STRING },
    ieltsBand: { type: Type.STRING },
    academicRegister: { type: Type.STRING },
    wordFamily: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          type: { type: Type.STRING },
          meaning: { type: Type.STRING },
        },
        required: ['word', 'type', 'meaning'],
      },
    },
    synonymsWithNuance: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          ipa: { type: Type.STRING },
          meaningVi: { type: Type.STRING },
          band: { type: Type.STRING },
          nuance: { type: Type.STRING },
          collocation: { type: Type.STRING },
          example: { type: Type.STRING },
        },
        required: ['word', 'meaningVi', 'nuance', 'band', 'collocation'],
      },
    },
    antonyms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          meaningVi: { type: Type.STRING },
        },
        required: ['word', 'meaningVi'],
      },
    },
    highBandCollocations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          collocation: { type: Type.STRING },
          meaningVi: { type: Type.STRING },
          example: { type: Type.STRING },
        },
        required: ['collocation', 'meaningVi', 'example'],
      },
    },
    commonMistakes: { type: Type.STRING },
    ieltsSpeakingWritingTip: { type: Type.STRING },
  },
  required: [
    'term',
    'meaningVi',
    'ieltsBand',
    'synonymsWithNuance',
    'highBandCollocations',
    'commonMistakes',
    'ieltsSpeakingWritingTip',
  ],
};

export function getEvaluateSentencePrompt(
  sentence: string,
  targetWords: string[] = [],
  mode: string = 'writing',
  promptTopic: string = ''
): string {
  return `
Bạn là giám khảo chấm thi IELTS kỳ cựu. Hãy chấm và nâng cấp câu văn của thí sinh:
- Câu của học viên: "${sentence}"
- Mục tiêu từ vựng cần áp dụng: [${targetWords.join(', ')}]
- Kỹ năng kiểm tra: ${mode === 'speaking' ? 'IELTS Speaking' : 'IELTS Writing Task 2'}
- Chủ đề thảo luận: "${promptTopic || 'Tự do'}"

Yêu cầu chấm:
1. Liệt kê các từ mục tiêu đã được dùng chính xác (targetWordsUsed).
2. Chấm điểm theo thang IELTS:
   - Grammar Score (thang 9.0, vd 6.5)
   - Lexical Score (thang 9.0, vd 7.0)
   - Overall Band ước tính (thang 9.0, vd 6.5)
3. Nhận xét chi tiết bằng tiếng Việt (feedbackVi): khen ngợi điểm tốt, chỉ rõ điểm yếu về ngữ pháp hoặc tính tự nhiên của cụm từ.
4. Danh sách các lỗi sai và cách sửa cụ thể (errorsIdentified: error, correction, explanationVi).
5. Phiên bản Nâng cấp chuẩn Band 8.5+ (band8Upgrade): Viết lại câu sang phong cách học thuật xuất sắc (sentence), giải thích lý do nâng cấp (explanationVi), và danh sách các collocations đắt giá (keyCollocations).
`;
}

export const EVALUATE_SENTENCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    originalSentence: { type: Type.STRING },
    targetWordsUsed: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    grammarScore: { type: Type.NUMBER },
    lexicalScore: { type: Type.NUMBER },
    overallBand: { type: Type.NUMBER },
    feedbackVi: { type: Type.STRING },
    errorsIdentified: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          error: { type: Type.STRING },
          correction: { type: Type.STRING },
          explanationVi: { type: Type.STRING },
        },
        required: ['error', 'correction', 'explanationVi'],
      },
    },
    band8Upgrade: {
      type: Type.OBJECT,
      properties: {
        sentence: { type: Type.STRING },
        explanationVi: { type: Type.STRING },
        keyCollocations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['sentence', 'explanationVi', 'keyCollocations'],
    },
  },
  required: [
    'originalSentence',
    'targetWordsUsed',
    'grammarScore',
    'lexicalScore',
    'overallBand',
    'feedbackVi',
    'errorsIdentified',
    'band8Upgrade',
  ],
};

export function getGeneratePassagePrompt(wordList: string[], topic: string = 'Urban Development & Society'): string {
  return `
Bạn là chuyên gia soạn đề thi IELTS Academic Reading. Hãy tạo một đoạn văn ngắn (mini-passage khoảng 180-250 từ) học thuật chuẩn IELTS mang phong cách Cambridge IELTS.
- Chủ đề: "${topic}"
- BẮT BUỘC phải lồng ghép tự nhiên các từ vựng sau vào bài đọc: [${wordList.slice(0, 10).join(', ')}]
- Sau đoạn văn, hãy soạn đúng 3 câu hỏi trắc nghiệm đọc hiểu chuẩn IELTS (Multiple Choice 4 lựa chọn A, B, C, D) để người học luyện tập khả năng hiểu ngữ cảnh từ vựng.
- Mỗi câu hỏi BẮT BUỘC phải có mảng "options" chứa chính xác 4 lựa chọn khác nhau.
- Cung cấp đáp án đúng (correctAnswer) và lời giải thích chi tiết bằng tiếng Việt (explanationVi).
`;
}

export const GENERATE_PASSAGE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    topic: { type: Type.STRING },
    passage: { type: Type.STRING, description: 'Đoạn văn đọc hiểu IELTS' },
    targetWordsIncluded: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: 'multiple-choice' },
          questionText: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctAnswer: { type: Type.STRING },
          explanationVi: { type: Type.STRING },
        },
        required: ['id', 'type', 'questionText', 'options', 'correctAnswer', 'explanationVi'],
      },
    },
  },
  required: ['title', 'passage', 'targetWordsIncluded', 'questions'],
};

export function getStudyRecommendationsPrompt(payload: {
  totalWords: number;
  masteredCount: number;
  learningCount: number;
  weakWords?: string[];
  estimatedBand?: number;
}): string {
  return `
Bạn là huấn luyện viên IELTS chuyên về phương pháp ghi nhớ từ vựng học thuật & Nâng Band Lexical Resource.
Học viên hiện có thông số học tập thực tế:
- Tổng số từ vựng: ${payload.totalWords}
- Đã thành thạo (Mastered): ${payload.masteredCount}
- Đang học (Learning/Reviewing): ${payload.learningCount}
- Các từ hay sai / cần củng cố: [${(payload.weakWords || []).join(', ')}]
- IELTS Lexical Band ước tính hiện tại: ${payload.estimatedBand || 6.5}

Hãy phân tích và đưa ra:
1. "progressEvaluation": Đánh giá chi tiết tiến độ học và phân tích khả năng đạt Band mục tiêu 8.0+.
2. "weakWordsStrategy": Chiến lược ôn tập cụ thể cho các từ vựng yếu và cách khắc phục lỗi nhớ sai nghĩa.
3. "priorityWordsToReview": Danh sách 3-5 từ vựng cần ưu tiên ôn lại ngay hôm nay (lấy từ các từ yếu hoặc từ học thuật quan trọng).
4. "recommendedCollocations": Danh sách 4-6 cụm Collocations đắt giá nên bổ sung thêm để tăng Lexical Resource.
5. "actionableTips": 3 lời khuyên thực chiến cụ thể để áp dụng từ vựng vào bài thi IELTS Speaking & Writing Task 2.
6. "recommendedNextTopics": 3 chủ đề IELTS nên học tiếp theo dựa trên hồ sơ từ vựng này.
7. "motivationalQuoteVi": 1 câu nói truyền cảm hứng học IELTS bằng tiếng Việt.
`;
}

export const STUDY_RECOMMENDATIONS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    progressEvaluation: { type: Type.STRING },
    weakWordsStrategy: { type: Type.STRING },
    priorityWordsToReview: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendedCollocations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    actionableTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendedNextTopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    motivationalQuoteVi: { type: Type.STRING },
  },
  required: [
    'progressEvaluation',
    'weakWordsStrategy',
    'priorityWordsToReview',
    'recommendedCollocations',
    'actionableTips',
    'recommendedNextTopics',
  ],
};
