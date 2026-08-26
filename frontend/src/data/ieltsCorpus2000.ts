import { VocabItem, WordSet } from '../types';

export interface TopicWordDef {
  term: string;
  ipa: string;
  meaning: string;
  wordFamily?: string;
  synonyms?: string;
  antonyms?: string;
  example: string;
  notes?: string;
  cefrLevel: 'B2' | 'C1' | 'C2';
  targetIeltsBand: '6.5' | '7.0' | '7.5' | '8.0+';
  topic: string;
}

export const TOPIC_SETS_METADATA: Array<{
  id: string;
  title: string;
  description: string;
  mainTopic: string;
  tags: string[];
}> = [
  {
    id: 'set-triumph-city',
    title: 'Điểm sách: Triumph of the City (Book Review)',
    description: 'Từ vựng cốt lõi phân tích theo bài đọc IELTS Triumph of the City (Đoạn A→G). Bao gồm từ/cụm, phiên âm IPA, nghĩa tiếng Việt, word family, đồng nghĩa và ngữ cảnh trích dẫn.',
    mainTopic: 'Đô thị & Kiến trúc',
    tags: ['IELTS Reading', 'Urban Planning', 'City Development', 'Book Review'],
  },
  {
    id: 'set-environment-ielts',
    title: 'IELTS Band 7.5+: Megafires & Environmental Ecology',
    description: 'Bộ từ vựng học thuật chủ đề Môi trường, biến đổi khí hậu và thảm họa tự nhiên thường gặp trong IELTS Reading & Writing Task 2.',
    mainTopic: 'Môi trường & Sinh thái',
    tags: ['Environment', 'Ecology', 'IELTS Academic'],
  },
  {
    id: 'set-education-pedagogy',
    title: 'IELTS Band 8.0: Education, Pedagogy & Cognitive Development',
    description: 'Hệ thống thuật ngữ học thuật chuyên sâu về cải cách giáo dục, phương pháp sư phạm, tâm lý tiếp thu và trí tuệ trẻ em.',
    mainTopic: 'Giáo dục & Học thuật',
    tags: ['Education', 'Pedagogy', 'Cognition', 'Academic Writing'],
  },
  {
    id: 'set-tech-ai',
    title: 'IELTS Band 8.0: AI, Automation & Digital Transformation',
    description: 'Từ vựng cao cấp về trí tuệ nhân tạo, tự động hóa quy trình, bảo mật dữ liệu và cuộc cách mạng công nghiệp 4.0.',
    mainTopic: 'Công nghệ & AI',
    tags: ['Technology', 'Artificial Intelligence', 'Cybersecurity', 'Automation'],
  },
  {
    id: 'set-health-biomedical',
    title: 'IELTS Band 8.0: Public Health, Epidemiology & Longevity',
    description: 'Bộ thuật ngữ y tế cộng đồng, dịch tễ học, tuổi thọ sinh học, y học dự phòng và áp lực lên hệ thống an sinh.',
    mainTopic: 'Y tế & Sức khỏe',
    tags: ['Health', 'Epidemiology', 'Healthcare', 'Medicine'],
  },
  {
    id: 'set-economy-globalization',
    title: 'IELTS Band 8.0: Economics, Trade & Fiscal Policies',
    description: 'Từ vựng phân tích kinh tế vĩ mô, lạm phát, thương mại quốc tế, bất bình đẳng thu nhập và chuỗi cung ứng toàn cầu.',
    mainTopic: 'Kinh tế & Kinh doanh',
    tags: ['Economics', 'Fiscal Policy', 'Globalization', 'Trade'],
  },
  {
    id: 'set-law-crime',
    title: 'IELTS Band 8.0: Jurisprudence, Criminology & Social Justice',
    description: 'Từ vựng pháp lý, tội phạm học, biện pháp răn đe, tái hòa nhập cộng đồng và cải cách tư pháp.',
    mainTopic: 'Pháp luật & Tội phạm',
    tags: ['Law', 'Criminology', 'Rehabilitation', 'Justice'],
  },
  {
    id: 'set-society-demographics',
    title: 'IELTS Band 8.0: Sociology, Demographics & Cultural Shifts',
    description: 'Phân tích xã hội học, già hóa dân số, phân tầng xã hội, đô thị hóa và sự thay đổi cấu trúc gia đình.',
    mainTopic: 'Xã hội & Con người',
    tags: ['Sociology', 'Demographics', 'Urbanization', 'Family Structure'],
  },
  {
    id: 'set-science-space',
    title: 'IELTS Band 8.0: Scientific Research, Astrophysics & Innovation',
    description: 'Thuật ngữ nghiên cứu thực nghiệm, khám phá không gian, công nghệ lượng tử và đột phá khoa học.',
    mainTopic: 'Khoa học & Tự nhiên',
    tags: ['Science', 'Astrophysics', 'Space Exploration', 'Innovation'],
  },
  {
    id: 'set-media-communication',
    title: 'IELTS Band 8.0: Mass Media, Journalism & Censorship',
    description: 'Từ vựng truyền thông đại chúng, tin giả, tự do báo chí, thuật toán thao túng dư luận và tiếp thị kỹ thuật số.',
    mainTopic: 'Truyền thông & Báo chí',
    tags: ['Media', 'Journalism', 'Censorship', 'Advertising'],
  },
  {
    id: 'set-psychology-behavior',
    title: 'IELTS Band 8.0: Human Psychology, Behavior & Mental Well-being',
    description: 'Thuật ngữ tâm lý học hành vi, nhận thức vô thức, sức khỏe tinh thần, áp lực công việc và động lực nội tại.',
    mainTopic: 'Tâm lý & Hành vi',
    tags: ['Psychology', 'Mental Health', 'Cognitive Bias', 'Behavior'],
  },
  {
    id: 'set-work-career',
    title: 'IELTS Band 8.0: Employment, Gig Economy & Remote Work Dynamics',
    description: 'Thị trường việc làm, nền kinh tế việc làm tự do, làm việc từ xa, văn hóa doanh nghiệp và cân bằng cuộc sống.',
    mainTopic: 'Việc làm & Sự nghiệp',
    tags: ['Employment', 'Gig Economy', 'Remote Work', 'Work-Life Balance'],
  },
  {
    id: 'set-energy-sustainability',
    title: 'IELTS Band 8.0: Renewable Energy, Nuclear Power & Resource Depletion',
    description: 'Năng lượng tái tạo, điện hạt nhân, cạn kiệt tài nguyên thiên nhiên, dấu chân carbon và nền kinh tế tuần hoàn.',
    mainTopic: 'Năng lượng & Tài nguyên',
    tags: ['Energy', 'Renewables', 'Carbon Footprint', 'Sustainability'],
  },
  {
    id: 'set-art-heritage',
    title: 'IELTS Band 8.0: Fine Arts, Cultural Heritage & Aesthetic Value',
    description: 'Bảo tồn di sản văn hóa phi vật thể, nghệ thuật thị giác, tài trợ công cho nghệ thuật và giá trị thẩm mỹ.',
    mainTopic: 'Nghệ thuật & Văn hóa',
    tags: ['Art', 'Cultural Heritage', 'Aesthetics', 'Museums'],
  },
  {
    id: 'set-awl-mastery-1',
    title: 'Academic Word List (AWL): Sublists 1-3 Core Band 7.5+',
    description: 'Danh mục từ vựng học thuật tần suất cao nhất trong các bài thi IELTS Reading & Writing học thuật chuẩn quốc tế.',
    mainTopic: 'Từ vựng học thuật cốt lõi (AWL)',
    tags: ['AWL', 'Academic Writing', 'High Frequency', 'Band 7.5+'],
  },
  {
    id: 'set-awl-mastery-2',
    title: 'Academic Word List (AWL): Sublists 4-6 Advanced Lexicon',
    description: 'Nhóm từ vựng học thuật nâng cao phục vụ diễn đạt luận điểm sắc bén và cấu trúc bài luận Task 2 đạt tiêu chuẩn C1.',
    mainTopic: 'Từ vựng học thuật cốt lõi (AWL)',
    tags: ['AWL', 'Advanced Lexicon', 'Task 2 Essays', 'Band 8.0'],
  },
  {
    id: 'set-awl-mastery-3',
    title: 'Academic Word List (AWL): Sublists 7-10 Mastery Band 8.5+',
    description: 'Tuyển tập từ vựng học thuật chuyên sâu và sắc sảo nhất giúp tối ưu hóa tiêu chí Lexical Resource lên 8.5+.',
    mainTopic: 'Từ vựng học thuật cốt lõi (AWL)',
    tags: ['AWL', 'Mastery Lexicon', 'Band 8.5+', 'Native-like Precision'],
  },
  {
    id: 'set-ielts-collocations',
    title: 'IELTS Academic Band 8.0+ Collocations & Phrasal Idioms',
    description: 'Các cụm từ kết hợp tự nhiên (Collocations), liên từ học thuật và diễn đạt tự nhiên theo chuẩn người bản xứ.',
    mainTopic: 'Cụm từ & Collocations',
    tags: ['Collocations', 'Idiomatic Expressions', 'Fluency & Coherence'],
  },
];
