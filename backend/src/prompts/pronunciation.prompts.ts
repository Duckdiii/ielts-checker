import { Type } from '../services/gemini.service';

export function getEvaluatePronunciationPrompt(term: string, ipa?: string, meaning?: string): string {
  return `
Bạn là giám khảo chấm thi IELTS Speaking chuyên môn cao và là chuyên gia ngữ âm học tiếng Anh (Phonetics Specialist).
Nhiệm vụ của bạn là lắng nghe thật kỹ đoạn ghi âm của học viên và đánh giá độ chuẩn xác khi phát âm từ/cụm từ IELTS mục tiêu:
- Từ/Cụm từ mục tiêu: "${term}"
- Phiên âm IPA chuẩn: "${ipa || 'Tự động phân tích theo chuẩn Received Pronunciation / General American'}"
- Nghĩa tiếng Việt: "${meaning || ''}"

Hãy phân tích toàn diện các yếu tố:
1. Độ chính xác của các nguyên âm (Vowels) và phụ âm (Consonants).
2. Âm cuối (Ending sounds: /s/, /z/, /t/, /d/, /θ/, /ð/, /k/, /tʃ/, /dʒ/,...).
3. Trọng âm từ/cụm từ (Word stress & Primary stress placement).
4. Độ tự nhiên và nối âm (Linking sounds nếu là Collocation / Verb Phrase).

Yêu cầu xuất dữ liệu JSON theo schema chuẩn xác:
- "term": Từ/cụm từ mục tiêu
- "transcription": Văn bản những gì bạn nghe thấy học viên phát âm (nếu phát âm sai, ghi rõ từ/âm nghe được)
- "score": Điểm phát âm từ 0 đến 100 (Ví dụ: 95 là gần như chuẩn bản xứ, 80-89 là tốt, 65-79 là hiểu được nhưng còn lỗi, dưới 65 là sai nhiều)
- "accuracyGrade": Một trong các giá trị: "Xuất sắc", "Tốt", "Cần cải thiện", "Chưa chuẩn"
- "stressCorrect": true nếu nhấn đúng trọng âm, false nếu nhấn sai hoặc thiếu trọng âm
- "feedbackVi": Lời nhận xét chi tiết bằng tiếng Việt, giọng điệu động viên và chuyên nghiệp
- "specificErrors": Danh sách các lỗi cụ thể (ví dụ: "Bị nuốt âm đuôi /t/", "Nhấn sai trọng âm vào âm tiết 2 thay vì âm tiết 1", "Âm /æ/ bị đọc thành /e/")
- "ieltsSpeakingTips": Lời khuyên áp dụng vào IELTS Speaking để ghi điểm tiêu chí Pronunciation (Band 7.0 - 8.5)
- "phoneticTips": Hướng dẫn khẩu hình miệng hoặc mẹo nhớ phát âm IPA dễ hiểu.
`;
}

export const EVALUATE_PRONUNCIATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    term: { type: Type.STRING },
    transcription: { type: Type.STRING },
    score: { type: Type.NUMBER },
    accuracyGrade: {
      type: Type.STRING,
      enum: ['Xuất sắc', 'Tốt', 'Cần cải thiện', 'Chưa chuẩn'],
    },
    stressCorrect: { type: Type.BOOLEAN },
    feedbackVi: { type: Type.STRING },
    specificErrors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    ieltsSpeakingTips: { type: Type.STRING },
    phoneticTips: { type: Type.STRING },
  },
  required: [
    'term',
    'score',
    'accuracyGrade',
    'stressCorrect',
    'feedbackVi',
    'specificErrors',
    'ieltsSpeakingTips',
  ],
};

export function getEvaluateShadowingPrompt(
  originalSentence: string,
  userTranscript: string,
  targetAccent: string = 'US',
  highlightedWord: string = ''
): string {
  return `You are a World-Class IELTS Speaking & English Phonetics Coach specializing in Pronunciation, Intonation, and the Shadowing Technique.
A candidate has shadowed the following target native sentence in ${targetAccent === 'UK' ? 'British English (RP)' : targetAccent === 'AU' ? 'Australian English' : 'General American English'}.

Target Master Sentence:
"${originalSentence}"

Candidate's Spoken Speech-to-Text Transcript:
"${userTranscript || '(Audio submitted)'}"

Target Vocabulary Focus (if any): "${highlightedWord}"

Perform a precise, rigorous phonetics diagnostic covering:
1. Similarity & Intonation: Assess overall phonetic similarity (0 to 100). Evaluate rhythm, natural pausing across thought groups, and pitch modulation (Rise, Fall, Fall-Rise).
2. Ending Sounds (Cực kỳ quan trọng): Check key ending consonants (/s/, /z/, /t/, /d/, /ed/, /k/, /θ/, /ð/). Identify if they were clearly pronounced, missed (nuốt âm), or weak.
3. Sentence Stress: Identify content words (nouns, main verbs, adjectives) that must receive strong stress vs function words (articles, prepositions, auxiliaries) that should be reduced. Check if candidate emphasized the right words.
4. Connected Speech & Linking: Identify linking phenomena in this sentence (e.g. Consonant-to-Vowel, Linking /r/, Flap T, Elision, Assimilation). Give exact pronunciation guides (e.g. "poses an" -> /poʊzɪz-ən/).
5. Word-by-Word Scoring: Score each individual word in the sentence (0-100) with status 'perfect' (85+), 'minor_issue' (60-84), or 'needs_work' (<60).
6. Coaching Feedback & 3-Step Practice Drill: Clear, empowering Vietnamese explanation and 3 quick steps to master this sentence.

Respond in JSON format adhering strictly to the schema.`;
}

export const EVALUATE_SHADOWING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    originalSentence: { type: Type.STRING },
    userTranscript: { type: Type.STRING },
    targetAccent: { type: Type.STRING, enum: ['US', 'UK', 'AU'] },
    similarityScore: { type: Type.NUMBER },
    overallGrade: { type: Type.STRING },
    intonationRating: { type: Type.STRING },
    intonationFeedbackVi: { type: Type.STRING },
    thoughtGroupsGuide: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    endingSoundsAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          sound: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['accurate', 'missed', 'weak'] },
          tipVi: { type: Type.STRING },
        },
        required: ['word', 'sound', 'status', 'tipVi'],
      },
    },
    sentenceStressAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          isStressed: { type: Type.BOOLEAN },
          status: { type: Type.STRING, enum: ['correct', 'understressed', 'overstressed'] },
          explanationVi: { type: Type.STRING },
        },
        required: ['word', 'isStressed', 'status', 'explanationVi'],
      },
    },
    connectedSpeechAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          ruleType: { type: Type.STRING },
          howToSay: { type: Type.STRING },
          userExecutedCorrectly: { type: Type.BOOLEAN },
          guideVi: { type: Type.STRING },
        },
        required: ['phrase', 'ruleType', 'howToSay', 'userExecutedCorrectly', 'guideVi'],
      },
    },
    wordByWordFeedback: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          accuracyScore: { type: Type.NUMBER },
          status: { type: Type.STRING, enum: ['perfect', 'minor_issue', 'needs_work'] },
          commentVi: { type: Type.STRING },
        },
        required: ['word', 'accuracyScore', 'status'],
      },
    },
    vietnameseSummary: { type: Type.STRING },
    practiceDrill: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'originalSentence',
    'userTranscript',
    'targetAccent',
    'similarityScore',
    'overallGrade',
    'intonationRating',
    'intonationFeedbackVi',
    'thoughtGroupsGuide',
    'endingSoundsAnalysis',
    'sentenceStressAnalysis',
    'connectedSpeechAnalysis',
    'wordByWordFeedback',
    'vietnameseSummary',
    'practiceDrill',
  ],
};

export function getUpgradeSpeechPrompt(
  question: string,
  userTranscript: string,
  targetBand: number = 8.0,
  accentStyle: string = 'US'
): string {
  return `
Bạn là Chuyên gia Khảo thí IELTS & Voice Coach bản xứ cao cấp.
Thí sinh vừa hoàn thành câu trả lời cho câu hỏi Speaking sau:
- Câu hỏi: "${question}"
- Bài nói gốc của thí sinh (ngây ngô / ngắn / có lỗi ngữ pháp / từ vựng hạn chế): "${userTranscript}"
- Mục tiêu: Nâng cấp thành bản nói Band ${targetBand} chuẩn bản xứ (${accentStyle}) mà VẪN GIỮ NGUYÊN 100% Ý TƯỞNG VÀ QUAN ĐIỂM GỐC của thí sinh!

Nhiệm vụ của bạn:
1. 'originalTranscript': Giữ nguyên bài nói gốc.
2. 'upgradedBand8FullText': Viết lại hoàn chỉnh toàn bộ câu trả lời sang chuẩn Band 8.0 - 8.5 mượt mà, dùng cấu trúc ngữ pháp phong phú (đảo ngữ, mệnh đề phân từ, câu điều kiện, câu chẻ), collocations học thuật C1/C2 tự nhiên, từ nối tự nhiên của người bản xứ (natural discourse markers).
3. 'originalBandEstimate': Ước tính band của bản gốc (ví dụ: 5.5).
4. 'upgradedBandEstimate': Band của bản nâng cấp (ví dụ: 8.5).
5. 'highlightedReplacements': Danh sách các chỗ đã sửa/thay thế (originalText -> improvedText, category: lexical/grammar/cohesion/collocation, explanationVi giải thích lý do vì sao cách diễn đạt mới ăn điểm hơn).
6. 'sentencePairs': Chia nhỏ bài nói theo từng cặp câu đối chiếu (originalSentence vs upgradedBand8Sentence) kèm phân tích breakdownVi và danh sách collocationsUsed.
7. 'nativeStylisticNotesVi': 2-3 lời khuyên ngắn bằng tiếng Việt về cách ngắt nhịp (chunking), ngữ điệu (intonation) và nối âm khi luyện Shadowing bản nâng cấp này.
8. 'keyCollocationsEarned': Danh sách 3-5 collocations đắt giá nhất trong bản nâng cấp kèm phiên âm, nghĩa tiếng Việt và cấp độ CEFR (C1/C2).
`;
}

export const UPGRADE_SPEECH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    originalTranscript: { type: Type.STRING },
    upgradedBand8FullText: { type: Type.STRING },
    originalBandEstimate: { type: Type.NUMBER },
    upgradedBandEstimate: { type: Type.NUMBER },
    highlightedReplacements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING },
          improvedText: { type: Type.STRING },
          category: { type: Type.STRING },
          explanationVi: { type: Type.STRING },
        },
        required: ['originalText', 'improvedText', 'category', 'explanationVi'],
      },
    },
    sentencePairs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          originalSentence: { type: Type.STRING },
          upgradedBand8Sentence: { type: Type.STRING },
          breakdownVi: { type: Type.STRING },
          collocationsUsed: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['id', 'originalSentence', 'upgradedBand8Sentence', 'breakdownVi', 'collocationsUsed'],
      },
    },
    nativeStylisticNotesVi: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    keyCollocationsEarned: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          meaningVi: { type: Type.STRING },
          cefrLevel: { type: Type.STRING },
        },
        required: ['phrase', 'meaningVi', 'cefrLevel'],
      },
    },
  },
  required: [
    'originalTranscript',
    'upgradedBand8FullText',
    'originalBandEstimate',
    'upgradedBandEstimate',
    'highlightedReplacements',
    'sentencePairs',
    'nativeStylisticNotesVi',
    'keyCollocationsEarned',
  ],
};
