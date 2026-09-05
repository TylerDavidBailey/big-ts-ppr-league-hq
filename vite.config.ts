import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Base path for GitHub Pages project sites.
 *
 * CI passes `VITE_BASE` derived from `$GITHUB_REPOSITORY`, so a fork under any
 * repository name deploys correctly without editing this file.
 *
 * The dev server stays at `/` so local URLs are short; builds and `vite
 * preview` both use the sub-path, so `make preview` exercises exactly what
 * Pages will serve. Everything that needs the prefix reads
 * `import.meta.env.BASE_URL` rather than hardcoding it.
 */
const buildBase = process.env.VITE_BASE ?? '/big-ts-ppr-league-hq/';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? buildBase : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Vite 8 bundles with rolldown, which takes only the function form of
        // manualChunks. Matching on the module id keeps each package's own
        // dependencies in the chunk with it, as the object form did.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (
            /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(
              id,
            )
          ) {
            return 'react';
          }
          if (/node_modules[\\/]@tanstack[\\/]react-query[\\/]/.test(id)) return 'query';
        },
      },
    },
  },
}));
