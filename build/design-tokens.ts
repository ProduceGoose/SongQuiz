// Vite plugin: `import 'virtual:design-tokens.css'` gives the CSS custom properties
// compiled from design-system/project/tokens.json, so the tokens have one source.
// Editing tokens.json during `npm run dev` reloads the page with the new values.
import fs from 'node:fs';
import type { Plugin } from 'vite';

const MODULE_ID = 'virtual:design-tokens.css';
// The ".css" ending makes Vite treat the module as a stylesheet.
const RESOLVED_ID = '\0design-tokens.css';

interface Token { name: string; value: string | Record<string, string> }
interface Tokens {
  name: string;
  color: { themes: Array<{ id: string }>; tokens: Token[] };
  shadow?: { tokens: Token[] };
  type: { families: Record<string, string> };
  [family: string]: unknown;
}

/** Compiles tokens.json into CSS: light values on :root, dark values for the dark theme and for devices set to dark. */
export function tokensToCss(tokens: Tokens): string {
  const [first, dark = 'dark'] = tokens.color.themes.map((t) => t.id);
  const alias = (v: string) => v.replace(/^\{(.+)\}$/, 'var(--$1)');
  const themed = [...tokens.color.tokens, ...(tokens.shadow?.tokens ?? [])];

  const declarations = (theme: string, indent = '  ') =>
    themed
      .map((t) => {
        if (typeof t.value === 'string') return theme === first ? `${indent}--${t.name}: ${alias(t.value)};` : null;
        return t.value[theme] ? `${indent}--${t.name}: ${alias(t.value[theme])};` : null;
      })
      .filter(Boolean)
      .join('\n');

  const plain = ['spacing', 'radius', 'size']
    .flatMap((family) => (tokens[family] as { tokens?: Token[] } | undefined)?.tokens ?? [])
    .map((t) => `  --${t.name}: ${t.value};`);
  const fonts = Object.entries(tokens.type.families).map(([key, stack]) => `  --font-${key}: ${stack};`);

  return `/* ${tokens.name} — compiled from tokens.json */
:root, [data-theme="${first}"] {
${declarations(first)}
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="${first}"]) {
${declarations(dark, '    ')}
    color-scheme: dark;
  }
}
[data-theme="${dark}"] {
${declarations(dark)}
  color-scheme: dark;
}
:root {
${[...plain, ...fonts].join('\n')}
}
`;
}

export function designTokens(tokensPath: string): Plugin {
  return {
    name: 'songquiz-design-tokens',
    resolveId(id) {
      return id === MODULE_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      this.addWatchFile(tokensPath);
      return tokensToCss(JSON.parse(fs.readFileSync(tokensPath, 'utf8')) as Tokens);
    },
    configureServer(server) {
      server.watcher.add(tokensPath);
      server.watcher.on('change', (file) => {
        if (file !== tokensPath) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      });
    }
  };
}
