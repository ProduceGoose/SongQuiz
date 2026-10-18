# SongQuiz

A multiplayer song quiz to play with friends, styled like a late-2000s desktop jukebox.

Built with Vite, React 18 and TypeScript.

```
npm install
npm run dev                  # the website, with live reload
npm run build                # type-check and build the website into dist/
npm run build:design-system  # rebuild the design system's bundle.js after changing a component
```

## What's where

- `web/`: the website, currently a clickable menu prototype without gameplay. See `web/README.md`.
- `design-system/project/`: the SongQuiz Aqua design system. Start with its `README.md`.
  - `tokens.json`: colours, type, spacing, radii and shadows. The website compiles them to CSS.
  - `components/src/`: the React components in TypeScript. The website imports them directly
    as `@songquiz/ui`.
  - `components/bundle.js`: the same components built for the design system page
    (`npm run build:design-system`). Don't edit it by hand.
  - `components/bundle.css`: the component styles, shared by the website and the design system page.
  - `components/<Name>/`: each component's usage notes (`README.md`) and live preview
    (`preview.html`, `style.css`, `script.js`). Example data shared by the previews is in
    `components/demo/demo-data.js`.
- `build/`: build helpers. `design-tokens.ts` turns `tokens.json` into CSS, and
  `jsx-runtime-global.ts` lets the design-system bundle use the page's global React.
