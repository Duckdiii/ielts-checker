import { Router } from 'express';
import pdfRoutes from './pdf.routes';
import vocabRoutes from './vocab.routes';
import pronunciationRoutes from './pronunciation.routes';
import speakingRoutes from './speaking.routes';
import writingRoutes from './writing.routes';

const apiRouter = Router();

// Mount domain routes
apiRouter.use(pdfRoutes);
apiRouter.use(vocabRoutes);
apiRouter.use(pronunciationRoutes);
apiRouter.use(speakingRoutes);
apiRouter.use('/writing', writingRoutes);

export default apiRouter;
