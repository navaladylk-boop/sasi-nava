import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

async function buildElectron() {
  const distElectronDir = path.resolve(process.cwd(), 'dist-electron');
  
  if (!fs.existsSync(distElectronDir)) {
    fs.mkdirSync(distElectronDir, { recursive: true });
  }

  // Compile main process with esbuild
  await esbuild.build({
    entryPoints: ['electron/main.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    outfile: path.join(distElectronDir, 'main.cjs'),
    sourcemap: true
  });

  // Cross-platform copy for preload.cjs
  const srcPreload = path.resolve(process.cwd(), 'electron/preload.cjs');
  const destPreload = path.join(distElectronDir, 'preload.cjs');

  if (fs.existsSync(srcPreload)) {
    fs.copyFileSync(srcPreload, destPreload);
  } else {
    throw new Error(`Source preload file not found at: ${srcPreload}`);
  }

  console.log('[build-electron] Successfully generated dist-electron/main.cjs and dist-electron/preload.cjs');
}

buildElectron().catch(err => {
  console.error('[build-electron] Build failed:', err);
  process.exit(1);
});
