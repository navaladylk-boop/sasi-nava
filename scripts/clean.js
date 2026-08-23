import fs from 'fs';
import path from 'path';

function clean() {
  const targets = ['dist', 'dist-electron', 'dist-electron-release', 'server.js'];

  for (const target of targets) {
    const fullPath = path.resolve(process.cwd(), target);
    if (fs.existsSync(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        console.log(`[clean] Removed: ${target}`);
      } catch (err) {
        console.warn(`[clean] Warning: Failed to remove ${target}:`, err.message);
      }
    }
  }
}

clean();
