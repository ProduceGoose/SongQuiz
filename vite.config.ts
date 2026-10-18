// The SongQuiz website. `npm run dev` serves web/; `npm run build` writes dist/.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { designTokens } from './build/design-tokens.ts';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: 'web',
  // Relative asset URLs, so the build works from any folder or static host.
  base: './',
  plugins: [react(), designTokens(path('./design-system/project/tokens.json'))],
  resolve: {
    alias: [
      // The design system's components, imported from source.
      { find: /^@songquiz\/ui$/, replacement: path('./design-system/project/components/src/index.ts') },
      { find: /^@songquiz\/ui\/styles\.css$/, replacement: path('./design-system/project/components/bundle.css') }
    ]
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
