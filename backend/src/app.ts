import express from 'express';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { standardApiLimiter, heavyAiLimiter } from './middlewares/rateLimiter';

export function createApp(): express.Application {
  const app = express();

  // Body parser with 50mb limit for large base64 PDF and audio uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Apply rate limiters
  app.use('/api', standardApiLimiter);
  app.use('/api/parse-pdf', heavyAiLimiter);
  app.use('/api/parse-pdf-stream', heavyAiLimiter);
  app.use('/api/speaking/full-mock-evaluate', heavyAiLimiter);

  // Mount central API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Central error handling middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
