# IELTS VocabMaster AI - Ôn luyện & Phát triển Từ vựng IELTS Chuẩn Quốc Tế

Ứng dụng thông minh hỗ trợ người học IELTS mở rộng vốn từ học thuật (Academic Lexical Resource), luyện phát âm & Shadowing, phản xạ Speaking tốc độ cao và chấm bài thi thử 15 phút IELTS Speaking Mock Test toàn diện theo chuẩn khảo thí Cambridge / IDP / British Council.

---

## 🏛️ Kiến trúc Dự án (Architecture Overview)

Dự án được cấu trúc phân tách rõ ràng giữa **Backend (Node.js + Express + Google GenAI SDK)** và **Frontend (React 19 + Tailwind CSS + Lucide Icons + Firebase SDK)**.

```
ielts-vocabmaster-ai/
├── backend/                              # [BACKEND] Express API Server & Gemini AI Engine
│   ├── src/
│   │   ├── config/                       # Quản lý cấu hình & biến môi trường
│   │   │   └── env.ts
│   │   ├── controllers/                  # Điều phối request/response theo từng domain
│   │   │   ├── pdf.controller.ts         # Xử lý trích xuất PDF (stream & standard)
│   │   │   ├── vocab.controller.ts       # Mở rộng từ vựng, chấm câu, tạo bài đọc
│   │   │   ├── pronunciation.controller.ts # Chấm phát âm, Shadowing, Band 8 Upgrade
│   │   │   └── speaking.controller.ts    # IELTS Speaking Mock, Quick Drill, AREA, Mindmap, Coffee Chat
│   │   ├── routes/                       # Router định tuyến theo module
│   │   │   ├── pdf.routes.ts             # /api/parse-pdf, /api/parse-pdf-stream
│   │   │   ├── vocab.routes.ts           # /api/expand-vocab, /api/evaluate-sentence...
│   │   │   ├── pronunciation.routes.ts   # /api/evaluate-pronunciation, /api/shadowing/evaluate...
│   │   │   ├── speaking.routes.ts        # /api/speaking/*
│   │   │   └── index.ts                  # Central API Router
│   │   ├── services/                     # Business Logic & Google GenAI API Client
│   │   │   └── gemini.service.ts         # Multi-model retry & fast failover mechanism
│   │   ├── middlewares/                  # Centralized error handler & utilities
│   │   │   └── errorHandler.ts
│   │   ├── app.ts                        # Express App factory
│   │   └── server.ts                     # Production HTTP server entry point
│   └── tsconfig.json                     # TypeScript config cho Backend
│
├── frontend/                             # [FRONTEND] Single Page Application (SPA)
│   ├── src/
│   │   ├── components/                   # Phân chia UI Components theo domain
│   │   │   ├── common/                   # Navbar, MobileBottomNav, VirtualAvatar, SyncStatusIndicator...
│   │   │   ├── modals/                   # AuthModal, UserProfileModal, PdfUploaderModal, WordDetailModal...
│   │   │   ├── study/                    # Flashcard, Quiz, Spelling, Cloze, Timed Drill, Study Hub...
│   │   │   ├── speaking/                 # Mock Examiner, Part 2, Shadowing, Quick Drill, AREA, Mindmap...
│   │   │   ├── analytics/                # Dashboard, ProgressReport, WeaknessRadar, GapMatrix...
│   │   │   ├── vocab/                    # VocabList, QuickWordTooltip, AiBandBooster...
│   │   │   └── index.ts                  # Barrel export toàn bộ components
│   │   ├── data/                         # Dữ liệu từ điển 2000 từ vựng cốt lõi & bộ từ mặc định
│   │   │   ├── defaultSets.ts
│   │   │   ├── ieltsCorpus2000.ts
│   │   │   └── ieltsWordBank2000.ts
│   │   ├── services/                     # HTTP API Client & Firebase Services
│   │   │   ├── apiService.ts             # Client API gọi Backend endpoints với SSE Stream & Cache
│   │   │   └── geminiService.ts          # Compatibility wrapper
│   │   ├── types/                        # TypeScript Interfaces & Data Models
│   │   │   └── index.ts
│   │   ├── utils/                        # SRS FSRS, Storage, Cache, Confetti, Sound effects...
│   │   │   ├── srs.ts
│   │   │   ├── storage.ts
│   │   │   ├── soundEffects.ts
│   │   │   ├── confetti.ts
│   │   │   ├── aiCache.ts
│   │   │   ├── firebaseAuth.ts
│   │   │   ├── firebaseSync.ts
│   │   │   └── ...
│   │   ├── App.tsx                       # Component gốc quản lý navigation và global state
│   │   ├── main.tsx                      # React Entry point
│   │   └── index.css                     # Tailwind CSS style
│   ├── index.html                        # HTML Entry point
│   ├── vite.config.ts                    # Vite config cho frontend
│   └── tsconfig.json                     # TypeScript config cho frontend
│
├── dist/                                 # Build output production bundle
├── .env.example                          # File mẫu cấu hình biến môi trường
├── package.json                          # Cấu hình scripts & dependencies chung
├── tsconfig.json                         # Root TypeScript config
└── vite.config.ts                        # Root Vite config tích hợp Backend Dev Server
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Getting Started)

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Biến Môi Trường
Tạo file `.env` tại thư mục gốc:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

### 3. Khởi chạy Development Server
```bash
# Chạy đồng thời cả Frontend và Backend API server
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### 4. Các lệnh Script khác
```bash
# Build frontend cho production
npm run build

# Chạy production server (phục vụ API và static assets từ dist/)
npm run start

# Kiểm tra toàn bộ kiểu dữ liệu TypeScript (Backend + Frontend)
npm run lint

# Type-check riêng backend
npm run lint:backend

# Type-check riêng frontend
npm run lint:frontend
```

---

## 🔌 Danh Sách API Endpoints (Backend)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/parse-pdf-stream` | Trích xuất từ vựng từ PDF theo thời gian thực (SSE Stream) |
| `POST` | `/api/parse-pdf` | Trích xuất từ vựng từ PDF dạng chuẩn |
| `POST` | `/api/expand-vocab` | Mở rộng từ vựng: collocations, từ đồng nghĩa nuance, idioms |
| `POST` | `/api/evaluate-sentence` | Chấm và nâng cấp câu văn Writing/Speaking lên Band 8.5+ |
| `POST` | `/api/generate-passage` | Tạo bài đọc IELTS Reading theo chủ đề lồng ghép từ vựng |
| `POST` | `/api/study-recommendations` | Đưa ra chiến lược và lộ trình học tập cá nhân hóa |
| `POST` | `/api/evaluate-pronunciation` | Phân tích âm thanh và chấm điểm phát âm chi tiết |
| `POST` | `/api/shadowing/evaluate` | Đánh giá phát âm câu Shadowing, trọng âm và nối âm |
| `POST` | `/api/speaking/evaluate` | Chấm bài thi Speaking theo 4 tiêu chí Cambridge |
| `POST` | `/api/speaking/generate-question` | Tạo câu hỏi IELTS Speaking theo chủ đề và từ vựng |
| `POST` | `/api/speaking/quick-drill-evaluate` | Chấm điểm phản xạ Part 1 tốc độ cao (15 giây) |
| `POST` | `/api/speaking/quick-drill-generate` | Tạo ngân hàng câu hỏi phản xạ nhanh Part 1 |
| `POST` | `/api/speaking/full-mock-evaluate` | Chấm bài thi toàn diện 15 phút Full Mock Test (Part 1, 2, 3) |
| `POST` | `/api/speaking/full-mock-generate-pack` | Tạo bộ đề thi thử 15 phút Full Mock đồng bộ chủ đề |
| `POST` | `/api/speaking/area-expand` | Tạo khung mở rộng ý tưởng 4 bước AREA / PEEL |
| `POST` | `/api/speaking/area-evaluate` | Chấm điểm bài nói theo khung AREA / PEEL |
| `POST` | `/api/speaking/ladder-evaluate` | Chấm điểm nấc thang luyện nói tăng tiến (30s ➔ 60s ➔ 90s) |
| `POST` | `/api/speaking/ladder-generate-prompt` | Tạo đề bài nấc thang luyện nói tăng tiến |
| `POST` | `/api/speaking/upgrade-band8` | Nâng cấp bài nói của học viên lên chuẩn Band 8.0+ |
| `POST` | `/api/speaking/mindmap-5d` | Tạo Mindmap 5 Lăng kính ý tưởng vạn năng |
| `POST` | `/api/speaking/coffee-chat/reply` | Trò chuyện tiếng Anh tự do cùng AI Coffee Buddy |
| `POST` | `/api/speaking/coffee-chat/recap` | Tổng kết buổi trò chuyện tự do và gợi ý cải thiện |
| `POST` | `/api/writing/evaluate` | Chấm điểm bài viết IELTS Writing Task 1 & 2 và tạo Lexical Heatmap |
| `POST` | `/api/writing/generate-prompt` | Tạo đề bài thi thử Writing chuẩn Cambridge lồng ghép từ vựng |
