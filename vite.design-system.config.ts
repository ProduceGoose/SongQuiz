// Builds design-system/project/components/bundle.js from the TypeScript sources in
// design-system/project/components/src/. Run `npm run build:design-system` after changing a component.
//
// The design system page loads React 18 as a global and then this bundle as one classic script,
// which must assign `window.SongQuiz`. So: an IIFE, React external (read from window.React),
// readable output (consumers and agents read it), and the @ds-bundle header on line 1.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const COMPONENTS = [
  'Window', 'Toolbar', 'Transport', 'VolumeSlider', 'LcdDisplay', 'SegmentedControl', 'SearchField', 'Button',
  'SourceList', 'AlbumGrid', 'AlbumTile', 'NowPlaying', 'Leaderboard', 'Badge', 'StatusBar', 'Icon'
];
const header = { format: 4, namespace: 'SongQuiz', components: COMPONENTS.map((name) => ({ name })) };

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Compiled JSX calls the global React's createElement (see build/jsx-runtime-global.ts).
    alias: [{ find: /^react\/jsx(-dev)?-runtime$/, replacement: path('./build/jsx-runtime-global.ts') }]
  },
  build: {
    outDir: path('./design-system/project/components'),
    emptyOutDir: false,
    copyPublicDir: false,
    minify: false,
    sourcemap: false,
    lib: {
      entry: path('./design-system/project/components/src/index.ts'),
      formats: ['iife'],
      name: 'SongQuiz',
      fileName: () => 'bundle.js'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
        banner: `/* @ds-bundle: ${JSON.stringify(header)} */`
      }
    }
  }
});
