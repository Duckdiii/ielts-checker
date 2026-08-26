import express from 'express';
import path from 'path';
import fs from 'fs';
import { app } from './app';
import { config } from './config/env';

const PORT = config.port;

// Serve static assets in production (checking both dist and frontend/dist)
const possibleDistPaths = [
  path.resolve(process.cwd(), 'frontend', 'dist'),
  path.resolve(process.cwd(), 'dist'),
];

const distPath = possibleDistPaths.find((p) => fs.existsSync(p)) || path.resolve(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Catch-all SPA route
app.get('*', (req, res, next) => {
  // Pass API requests through (if not handled, let them 404)
  if (req.path.startsWith('/api')) {
    return next();
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  const rootIndexPath = path.resolve(process.cwd(), 'frontend', 'index.html');
  if (fs.existsSync(rootIndexPath)) {
    return res.sendFile(rootIndexPath);
  }

  res.sendFile(path.resolve(process.cwd(), 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VocabMaster AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
