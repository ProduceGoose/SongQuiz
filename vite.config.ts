// The SongQuiz website. `npm run dev` serves index.html and src/; `npm run build` writes dist/.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { designTokens } from './build/design-tokens.ts';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // Relative asset URLs, so the build works from any folder or static host.
  base: './',
  plugins: [react(), designTokens(path('./design-system/project/tokens.json'))],
  server: {
    // The project is in OneDrive, which can hide file changes from the watcher; polling always sees them.
    watch: { usePolling: true, interval: 300 }
  }
});
