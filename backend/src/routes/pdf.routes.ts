import { Router } from 'express';
import { handleParsePdf, handleParsePdfStream } from '../controllers/pdf.controller';

const router = Router();

router.post('/parse-pdf', handleParsePdf);
router.post('/parse-pdf-stream', handleParsePdfStream);

export default router;
