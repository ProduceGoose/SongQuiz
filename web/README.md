# SongQuiz website (menu prototype)

A clickable prototype of the SongQuiz menus: home, join a room, create a room, lobby,
playlists, scores and settings. Gameplay is not built yet; all rooms, players and scores
are example data from `src/data/demo.ts`.

Built with Vite, React 18 and TypeScript. Run the commands below from the repository root.

## Run it

```
npm install
npm run dev        # dev server with live reload, usually http://localhost:5173
npm run build      # type-check, then build the site into dist/
npm run preview    # serve dist/ to check the production build
```

A bare `#name` in the address opens that screen, for example `#playlists` or `#settings`.

## Structure

```
web/
  index.html              page skeleton; loads src/main.tsx
  public/favicon.svg
  src/
    main.tsx              entry: imports the design-system styles and mounts <App>
    App.tsx               the window shell, navigation and app state (AppApi)
    types.ts              shared types: rooms, playlists, settings, screens
    screens/              one file per screen; index.ts maps route names to screens
    components/           small shared pieces: ScreenHeader, Section, Sheet, Field, Table…
    data/demo.ts          example playlists, rooms and past games
    lib/settings.ts       saving settings in the browser and switching the theme
    styles/app.css        layout and screen styles for this site
```

Each screen file exports a `ScreenDef`: the component that renders the content area, plus
`lcd(app)` and `status(app)`, which fill the toolbar LCD and the status bar.

## The design system

The jukebox components come from `@songquiz/ui`, an alias (in `vite.config.ts` and
`tsconfig.json`) for `design-system/project/components/src/`. Their styles are
`@songquiz/ui/styles.css` (the design system's `bundle.css`), and the colour, spacing and
font tokens are compiled from `design-system/project/tokens.json` by `build/design-tokens.ts`.
Editing a component or a token shows up in the dev server straight away.
