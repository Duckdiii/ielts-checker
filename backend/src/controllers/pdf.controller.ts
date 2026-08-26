import { Request, Response } from 'express';
import { generateWithRetryAndFallback } from '../services/gemini.service';
import { PDF_PARSE_PROMPT, PDF_PARSE_SCHEMA } from '../prompts/pdf.prompts';
import { safeParseAiJson } from '../utils/aiParser';

/**
 * Endpoint to parse IELTS Vocabulary PDFs with Real-Time SSE Stream Progress
 */
export async function handleParsePdfStream(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendSSE = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { pdfBase64, fileName } = req.body;
    if (!pdfBase64) {
      sendSSE('error', { message: 'Thiếu dữ liệu PDF (pdfBase64)' });
      return res.end();
    }

    sendSSE('progress', {
      progress: 15,
      stage: 'reading',
      message: `Đang tải và giải mã tệp "${fileName || 'Tài liệu'}"...`,
    });

    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

    sendSSE('progress', {
      progress: 35,
      stage: 'ai_analyzing',
      message: 'Gemini 3.7 Flash đang đọc bảng từ vựng, trích xuất IPA, ngữ nghĩa tiếng Việt và ví dụ...',
    });

    sendSSE('progress', {
      progress: 65,
      stage: 'parsing',
      message: 'Đang tổng hợp cấu trúc Lexical Resource & phân nhóm chủ đề...',
    });

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64,
            },
          },
          { text: PDF_PARSE_PROMPT },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: PDF_PARSE_SCHEMA,
      },
    });

    sendSSE('progress', {
      progress: 90,
      stage: 'finalizing',
      message: 'Chuẩn hóa dữ liệu và kiểm tra toàn vẹn định dạng...',
    });

    const parsedData = safeParseAiJson(response.text, { words: [], topics: [] });

    sendSSE('completed', {
      progress: 100,
      stage: 'done',
      message: `Đã trích xuất thành công ${parsedData.words?.length || 0} từ vựng học thuật!`,
      data: parsedData,
    });
    res.end();
  } catch (error: any) {
    console.error('Error in handleParsePdfStream:', error);
    sendSSE('error', { message: error.message || 'Lỗi khi trích xuất PDF từ vựng' });
    res.end();
  }
}

/**
 * Endpoint to parse IELTS Vocabulary PDFs using Gemini Multimodal PDF parsing
 */
export async function handleParsePdf(req: Request, res: Response) {
  try {
    const { pdfBase64, fileName } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu PDF (pdfBase64)' });
    }

    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

    const response = await generateWithRetryAndFallback({
      primaryModel: 'gemini-3.7-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64,
            },
          },
          { text: PDF_PARSE_PROMPT },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: PDF_PARSE_SCHEMA,
      },
    });

    const parsedData = safeParseAiJson(response.text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in handleParsePdf:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi trích xuất PDF từ vựng' });
  }
}
