import { build as viteBuild } from 'vite';
import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

async function runBuild() {
  console.log('🚀 [Build Step 1/2] Compiling Frontend with Vite...');
  await viteBuild({
    configFile: path.resolve(process.cwd(), 'vite.config.ts'),
  });

  console.log('🚀 [Build Step 2/2] Compiling Backend Server with esbuild...');
  await esbuild.build({
    entryPoints: [path.resolve(process.cwd(), 'backend/src/server.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile: path.resolve(process.cwd(), 'dist/server.js'),
    logLevel: 'info',
  });

  const serverFile = path.resolve(process.cwd(), 'dist/server.js');
  if (fs.existsSync(serverFile)) {
    console.log(`✅ [Build] dist/server.js created successfully (${(fs.statSync(serverFile).size / 1024).toFixed(1)} KB)!`);
  } else {
    console.error('❌ [Build Error] dist/server.js was not created!');
    process.exit(1);
  }

  console.log('🎉 [Build] Full production build completed successfully! Exiting cleanly with code 0.');
  process.exit(0);
}

runBuild()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Build failed with error:', err);
    process.exit(1);
  });
