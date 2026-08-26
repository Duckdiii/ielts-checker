import { execSync } from 'child_process';
import esbuild from 'esbuild';

console.log('[Build] 1/2: Building frontend with Vite...');
execSync('node ./node_modules/vite/bin/vite.js build', { stdio: 'inherit' });

console.log('[Build] 2/2: Bundling backend server with esbuild...');
await esbuild.build({
  entryPoints: ['backend/src/server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: 'dist/server.js',
  logLevel: 'info',
});

console.log('[Build] ✅ Full production build completed successfully in seconds!');
process.exit(0);
