import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';
import { app } from './backend/src/app';

dotenv.config();

function backendApiPlugin(): Plugin {
  return {
    name: 'backend-api-server',
    configureServer(server) {
      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    root: path.resolve(__dirname, 'frontend'),
    plugins: [react(), tailwindcss(), backendApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'frontend/src'),
      },
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('xlsx')) {
                return 'vendor-xlsx';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('lucide-react') || id.includes('motion') || id.includes('canvas-confetti')) {
                return 'vendor-ui';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
            }
            if (id.includes('frontend/src/data/ieltsWordBank2000') || id.includes('frontend/src/data/ieltsCorpus2000')) {
              return 'ielts-wordbank-corpus';
            }
          },
        },
      },
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
