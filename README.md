# SongQuiz

A multiplayer song quiz to play with friends, styled like a late-2000s desktop jukebox.
The website is currently a clickable prototype of the menus: home, join a room, create a room,
lobby, playlists, scores and settings. Gameplay is not built yet; all rooms, players and scores
are example data from `src/data/demo.ts`.

Built with Vite, React 18 and TypeScript.

```
npm install
npm run dev                  # the website, with live reload, usually http://localhost:5173
npm run build                # type-check and build the website into dist/
npm run preview              # serve dist/ to check the production build
npm run build:design-system  # rebuild the design system's bundle.js and bundle.css after changing a component
```

A bare `#name` in the address opens that screen, for example `#playlists` or `#settings`.

## What's where

The app is one jukebox window. Components are grouped by the part of the window they belong to,
and each component's styles sit next to it (`LcdDisplay.tsx` + `LcdDisplay.css`).

```
index.html                  page skeleton; loads src/main.tsx
public/                     favicon
src/
  main.tsx                  entry: loads the styles and mounts <App>
  App.tsx                   app state and actions (AppApi), and the window around the current screen
  App.css                   the page behind the window, and the narrow-screen layout
  types.ts                  shared types: rooms, playlists, settings, screens
  components/
    window/                 Window: the frame, title bar and dots
    toolbar/                Toolbar, Transport, VolumeSlider; AppToolbar fills the toolbar for this app
    lcd/                    LcdDisplay; AppLcd shows a flashed message or the current screen's text
    sidebar/                SourceList, NowPlaying; AppSidebar is the app's navigation
    statusbar/              StatusBar, BarButton; AppStatusBar is the app's bottom bar
    albums/                 AlbumGrid, AlbumTile and the placeholder Sleeve
    controls/               Button, SegmentedControl, SearchField, Badge, Icon
    tables/                 Leaderboard, Table and the shared list style (List.css)
    content/                ScreenHeader, Section, Sheet, Notice, Field, Setting for screen content
    base.css                rules every component shares (glossy surface, focus ring…)
    utils.ts                cx, formatTime, useMaybeControlled
    design-system.ts        entry for the design-system bundle: lists the reusable components
  screens/                  one file per screen (+ its CSS); index.ts maps route names to screens
  data/demo.ts              example playlists, rooms and past games
  lib/settings.ts           saving settings in the browser and switching the theme
build/                      build helpers: tokens.json → CSS, and the bundle's JSX runtime
design-system/project/      the SongQuiz Aqua design system: docs, tokens and previews (see below)
```

Files named `App…` are this app's wiring: they connect a region's components to the app state.
Everything else in `src/components/` is a reusable design-system component.

### Screens

Each screen file exports a `ScreenDef`: the component that renders the content area, plus
`lcd(app)` and `status(app)`, which fill the toolbar LCD and the status bar. To add a screen,
write it in `src/screens/`, add it to `src/screens/index.ts`, and add its name to `ScreenName`
in `src/types.ts`.

### The design system

`design-system/project/` is the SongQuiz Aqua design system. Start with its `README.md`.

- `tokens.json`: colours, type, spacing, radii and shadows. The website compiles them to CSS
  (`build/design-tokens.ts`); editing them reloads the dev server.
- `components/<Name>/`: each component's usage notes (`README.md`) and live preview
  (`preview.html`, `style.css`, `script.js`). Example data shared by the previews is in
  `components/demo/demo-data.js`. These previews are not part of the website.
- `components/bundle.js` and `bundle.css`: the components from `src/components/`, built for the
  design system page by `npm run build:design-system`. Don't edit them by hand.
