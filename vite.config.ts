// The SongQuiz website and its server. `npm run dev` serves index.html and src/, and runs the
// Worker in worker/ (with its Durable Objects) locally through the Cloudflare plugin.
// `npm run build` writes dist/, which `npm run deploy` publishes to Cloudflare.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import { designTokens } from './build/design-tokens.ts';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // Relative asset URLs, so the build works from any folder or static host.
  base: './',
  plugins: [react(), designTokens(path('./design-system/project/tokens.json')), cloudflare()],
  server: {
    // The project is in OneDrive, which can hide file changes from the watcher; polling always sees them.
    watch: { usePolling: true, interval: 300 }
  }
});
