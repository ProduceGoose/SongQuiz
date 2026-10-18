// Copies the SongQuiz Aqua design system into web/vendor/songquiz/ so the website
// can run without a build step:
//   - tokens.css  generated from design-system/project/tokens.json
//   - bundle.css  copied from design-system/project/components/
//   - bundle.js   copied from design-system/project/components/
//
// Run from the repository root after changing the design system:
//   node scripts/sync-design-system.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'design-system/project');
const out = path.join(root, 'web/vendor/songquiz');

const tokens = JSON.parse(fs.readFileSync(path.join(src, 'tokens.json'), 'utf8'));
const themes = tokens.color.themes.map((t) => t.id);
const [firstTheme, darkTheme = 'dark'] = themes;

// "{other-token}" aliases become var(--other-token).
const cssValue = (v) => v.replace(/^\{(.+)\}$/, 'var(--$1)');

function declarations(theme) {
  const lines = [];
  for (const t of [...tokens.color.tokens, ...(tokens.shadow?.tokens ?? [])]) {
    if (typeof t.value === 'string') {
      if (theme === firstTheme) lines.push(`  --${t.name}: ${cssValue(t.value)};`);
    } else if (t.value[theme]) {
      lines.push(`  --${t.name}: ${cssValue(t.value[theme])};`);
    }
  }
  return lines.join('\n');
}

const plain = ['spacing', 'radius', 'size']
  .flatMap((family) => tokens[family]?.tokens ?? [])
  .map((t) => `  --${t.name}: ${t.value};`);
const fonts = Object.entries(tokens.type.families).map(([key, stack]) => `  --font-${key}: ${stack};`);
const dark = declarations(darkTheme);

const css = `/* ${tokens.name} — generated from tokens.json by scripts/sync-design-system.mjs. Do not edit. */

:root, [data-theme="${firstTheme}"] {
${declarations(firstTheme)}
  color-scheme: light;
}

/* No explicit theme: follow the device. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="${firstTheme}"]) {
${dark.replace(/^/gm, '  ')}
    color-scheme: dark;
  }
}

[data-theme="${darkTheme}"] {
${dark}
  color-scheme: dark;
}

:root {
${[...plain, ...fonts].join('\n')}
}
`;

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'tokens.css'), css);
for (const file of ['bundle.css', 'bundle.js']) {
  fs.copyFileSync(path.join(src, 'components', file), path.join(out, file));
}
console.log(`Synced ${tokens.name} into ${path.relative(root, out)}/`);
