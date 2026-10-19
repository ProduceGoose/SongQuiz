# SongQuiz

A multiplayer song quiz to play with friends, styled like a late-2000s desktop jukebox.
Create a room, share its 4-character code, and everyone who joins plays in the same room:
they chat, and while a round plays every message is a guess. Wrong guesses show up for
everyone; a correct one never does. The title and the artist score on their own: the first three
players to name each one get 3, 2 and 1 points, and the scores come up as each round starts. Each round plays a snippet of the song's 30-second Apple
Music preview; at the reveal the song's cover and a link to it on Apple Music appear.

You start outside any room. A demo room that works offline with simulated players is behind a
code that the app doesn't show (`DEMO_CODE` in `src/data/demo.ts`): join with it, press
"I'm ready" in its lobby, and the host starts the game two seconds later. Playlists are example data from
`src/data/demo.ts`. The Scores screen shows the game in your room and the room's session: games
won and points since the room was opened, which the host can reset. Between games the host can change
the room's playlist, rounds, snippet length (0.1 to 30 seconds; guessing always lasts at least
20), what has to be guessed (title and artist apart, only one of them, or both for any points),
the player limit and whether everyone may act as host, in the lobby or under a game's result;
the room's name stays as it was opened. Host controls (hosts pause a round for everyone or
skip a song with the playback buttons) are chosen when the room is created and can't change later. Rooms
without them can let players vote instead: typing `/skip` in the chat counts a vote, and the song
is skipped once half the players have voted.

Built with Vite, React 18 and TypeScript. The server is a Cloudflare Worker with one
Durable Object per room.

```
npm install
npm run dev                  # website and server, with live reload, usually http://localhost:5173
npm run build                # type-check and build into dist/ (dist/client: website, dist/songquiz: server)
npm run preview              # serve the production build locally, server included
npm run deploy               # build and publish to Cloudflare (run `npx wrangler login` once first)
npm run apple-music          # find new songs in src/data/playlists.json on Apple Music
npm run build:design-system  # rebuild the design system's bundle.js and bundle.css after changing a component
```

To play with several people locally, open the site in two browsers (or a normal and a private
window): each browser is its own player.

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
    chat/                   ChatPanel, ChatMessage, Avatar; AppChat is the room chat on the right
    statusbar/              StatusBar, BarButton; AppStatusBar is the app's bottom bar
    albums/                 AlbumGrid, AlbumTile and the placeholder Sleeve
    controls/               Button, SegmentedControl, SearchField, Badge, Icon
    tables/                 Leaderboard, Table and the shared list style (List.css)
    content/                ScreenHeader, Section, Sheet, Notice, Field, Setting for screen content
    base.css                rules every component shares (glossy surface, focus ring…)
    utils.ts                cx, formatTime, useMaybeControlled
    design-system.ts        entry for the design-system bundle: lists the reusable components
  screens/                  one file per screen (+ its CSS); index.ts maps route names to screens
  game/                     useOnlineRoom: an online room over its WebSocket;
                            useGame: the demo room's chat, rounds and simulated players;
                            guess: does a message name the title or the artist? (used by the server too);
                            scoring: points per round (3, 2, 1 for title and artist);
                            protocol: the messages between browser and server
  game/preview.ts           Apple previews: lookup by id, where a snippet starts, song order
  game/useSnippet.ts        plays the round's song in step with the round
  data/playlists.json       the songs, with their Apple Music id, link and cover
  data/demo.ts              example rooms, chat and past games; loads playlists.json
scripts/apple-music.mjs     looks up the songs in playlists.json on Apple Music
  lib/settings.ts           saving settings in the browser and switching the theme
worker/                     the server (Cloudflare Worker)
  index.ts                  routes /api/rooms/:code/ws to the room's Durable Object
  RoomObject.ts             one room: players, chat, rounds and their timers, guess checking
wrangler.jsonc              Cloudflare settings: the Durable Object binding and the website's files
build/                      build helpers: tokens.json → CSS, and the bundle's JSX runtime
design-system/project/      the SongQuiz Aqua design system: docs, tokens and previews (see below)
```

Files named `App…` are this app's wiring: they connect a region's components to the app state.
Everything else in `src/components/` is a reusable design-system component.

### Online rooms

Every room code is a Durable Object on Cloudflare, created when the host opens the room and
deleted when the last player leaves or after an hour with nobody connected. Each browser keeps a
WebSocket to it. The room runs the game, not the browsers: it checks each chat message against
the answer (`src/game/guess.ts`), so a correct guess is never sent to anyone, and the answer only
leaves the server at the reveal. Round timers are Durable Object alarms.

There are no accounts. A player is a random token saved in the browser, so a reload (or a
dropped connection) rejoins the same room as the same player. Locally, `npm run dev` keeps the
rooms in `.wrangler/state`.

### Music

The songs come from Apple Music's free 30-second previews (the iTunes Search API, no account
needed). `npm run apple-music` finds each song in `src/data/playlists.json` and saves its Apple
id, Apple Music link and cover next to it; it skips live, remix, karaoke and cover versions and
lists any song it can't match safely. Run it after adding songs.

When a round starts, the room looks up the song's preview by id and picks a start point that
leaves room for the round and the reveal. Players load it from `/api/rooms/:code/audio/:round`,
which the Worker streams from Apple without anything that names the song, and only while that
round is on (or, during the reveal, the next one, so it can load ahead). Everyone hears the same
moment: the browser starts at the start point plus the time since the round began.

Browsers only play sound after a click. Most players click "I'm ready" or "Start game" first;
otherwise the LCD says "Click anywhere to hear the song". The toolbar's play button pauses the song
for you and the back button replays the snippet. The demo room plays the previews straight
from Apple. Songs without a preview come last in a game and play silently.

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
