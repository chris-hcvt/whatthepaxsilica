import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Hash of everything in public/data, so data URLs change whenever the data does (no stale caches). */
function dataVersion(dir = resolve(__dirname, 'public/data')): string {
  const h = createHash('sha1');
  const walk = (d: string) => {
    for (const f of readdirSync(d).sort()) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else h.update(f).update(readFileSync(p));
    }
  };
  walk(dir);
  return h.digest('hex').slice(0, 10);
}

export default defineConfig({
  plugins: [react()],
  define: {
    __DATA_V__: JSON.stringify(dataVersion()),
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        report: resolve(__dirname, 'report/index.html'),
      },
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
});
