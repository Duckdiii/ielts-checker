import { Type } from '../services/gemini.service';

export const PDF_PARSE_PROMPT = `
Bạn là chuyên gia ngôn ngữ học và giám khảo chấm thi IELTS. Hãy phân tích tài liệu PDF đính kèm (chứa bảng từ vựng IELTS tiếng Anh - tiếng Việt, giáo trình từ vựng, hoặc bài đọc IELTS Reading).
Nhiệm vụ của bạn là trích xuất TOÀN BỘ danh sách từ vựng trong tất cả các trang của PDF thành cấu trúc JSON chuẩn xác VÀ TỰ ĐỘNG PHÂN LOẠI THEO CHỦ ĐỀ IELTS.

QUAN TRỌNG - NHẬN DIỆN MỌI DẠNG TỪ VỰNG HỌC THUẬT (SINGLE WORDS, COLLOCATIONS & VERB PHRASES):
- Không chỉ trích xuất từ đơn lẻ (Single words), bạn BẮT BUỘC PHẢI trích xuất đầy đủ:
  1. Cụm từ cố định & Collocations (e.g., "pose a severe threat to", "reap the benefits of", "gain momentum", "exert an influence on", "strike a delicate balance")
  2. Cụm động từ & Phrasal Verbs / Verb Phrases (e.g., "stem from", "boil down to", "phase out", "bring about", "account for", "hinge upon", "embark on")
  3. Cụm danh từ / Tính từ ghép học thuật (e.g., "sustainable development", "irreversible consequence", "socioeconomic disparity", "cutting-edge technology")
  4. Cụm thành ngữ học thuật / Academic Idiomatic Expressions nếu có trong tài liệu.

LƯU Ý CỰC KỲ QUAN TRỌNG VỀ PHÂN LOẠI CHỦ ĐỀ:
- Tên file PDF hoặc tiêu đề tài liệu thường chỉ là tên mã đề thi / bài test (ví dụ "Cam 18 Test 1.pdf", "Reading Test 4 Passage 2.pdf", "IELTS Mock 2024.pdf"...), KHÔNG PHẢI là tên chủ đề từ vựng.
- Bạn PHẢI đọc kỹ nội dung bài đọc và ngữ nghĩa từng từ để tự động phân loại chính xác từng từ/cụm từ vào các CHỦ ĐỀ HỌC THUẬT IELTS (IELTS Academic Topics).
- Các chủ đề tiêu chuẩn gợi ý (bằng tiếng Việt chuẩn):
  + "Động vật & Sinh thái" (Animals & Wildlife, Biodiversity, Marine life, Habitats)
  + "Giáo dục & Học thuật" (Education, Schools, Universities, Academic Research, Teaching)
  + "Môi trường & Khí hậu" (Environment, Global Warming, Renewable Energy, Pollution, Conservation)
  + "Công nghệ & Đổi mới" (Technology, AI, Robotics, Computer Science, Automation)
  + "Kinh tế & Kinh doanh" (Economy, Business, Finance, Commerce, Employment, Trade)
  + "Y tế & Sức khỏe" (Health, Medicine, Diseases, Healthcare, Mental Health, Nutrition)
  + "Đô thị & Xã hội" (Society, Urban Planning, Architecture, Community, Demographics)
  + "Văn hóa & Nghệ thuật" (Culture, Arts, Literature, Music, Media, Heritage)
  + "Tâm lý học & Con người" (Psychology, Human Behavior, Cognition, Emotions, Social interaction)
  + "Luật pháp & Chính phủ" (Law, Crime, Governance, Public Policy, Justice)
  + "Lịch sử & Khảo cổ" (History, Archaeology, Ancient Civilizations, Heritage)
  + "Du lịch & Giao thông" (Tourism, Transportation, Travel, Infrastructure)

Quy tắc trích xuất:
1. Đọc kỹ tất cả các cột hoặc dòng của tài liệu:
   - "Từ/cụm" (Word / Collocation / Verb Phrase): Giữ nguyên vẹn cụm từ và tạo phiên âm IPA chuẩn.
   - "Nghĩa" (Vietnamese meaning): Giữ nghĩa tiếng Việt đầy đủ và giải thích ngữ cảnh dùng.
   - "Word family" (Họ từ): Ghi lại các dạng từ loại liên quan nếu có.
   - "Đồng nghĩa" (Synonyms/Paraphrase) & Trái nghĩa (Antonyms nếu có).
   - "Ví dụ/Ghi chú" (Example / Notes): Câu ví dụ minh họa cách kết hợp từ trong IELTS Writing & Speaking.
2. Với TỪNG TỪ/CỤM TỪ, gán trường "topic" với tên chủ đề tiếng Việt phù hợp nhất.
3. Đánh giá trình độ CEFR (B1, B2, C1, C2) và mục tiêu IELTS Band (6.0, 6.5, 7.0, 7.5, 8.0+).
4. Trích xuất tiêu đề thực tế của bài đọc/tài liệu.
5. Xác định "mainTopic" và "topics".
`;

export const PDF_PARSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Tiêu đề tài liệu hoặc bài đọc' },
    description: { type: Type.STRING, description: 'Mô tả ngắn về chủ đề từ vựng' },
    mainTopic: { type: Type.STRING, description: 'Chủ đề chính nổi bật nhất' },
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Danh sách các chủ đề từ vựng xuất hiện trong tài liệu',
    },
    totalWordsCount: { type: Type.INTEGER },
    words: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: 'Từ hoặc cụm từ tiếng Anh chính' },
          ipa: { type: Type.STRING, description: 'Phiên âm IPA chuẩn' },
          meaning: { type: Type.STRING, description: 'Nghĩa tiếng Việt đầy đủ' },
          wordFamily: { type: Type.STRING, description: 'Các dạng họ từ' },
          synonyms: { type: Type.STRING, description: 'Từ đồng nghĩa' },
          antonyms: { type: Type.STRING, description: 'Từ trái nghĩa nếu có' },
          example: { type: Type.STRING, description: 'Ví dụ ngữ cảnh thực tế' },
          notes: { type: Type.STRING, description: 'Ghi chú học thuật' },
          cefrLevel: { type: Type.STRING, description: 'B1, B2, C1, hoặc C2' },
          targetIeltsBand: { type: Type.STRING, description: '6.0, 6.5, 7.0, 7.5, 8.0+' },
          topic: { type: Type.STRING, description: 'Chủ đề IELTS phân loại' },
        },
        required: ['term', 'meaning', 'topic'],
      },
    },
  },
  required: ['title', 'words', 'mainTopic', 'topics'],
};
