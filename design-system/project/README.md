SongQuiz Aqua dresses a multiplayer song quiz in the brushed-metal jukebox look of late-2000s desktop music players. Every screen sits in one silver window. A glowing LCD tells everyone what is happening, a blue-gray source list runs down the left, and a dark wall of album art fills the middle. Use it for every screen of the game (lobby, round, reveal, scores) so a whole quiz night feels like one window.

Load `tokens.css`, `components/bundle.css`, React 18 and `components/bundle.js`; the components are on `window.SongQuiz`. In a React app with a bundler, import the components from `components/src/index.ts` (TypeScript source) and load `components/bundle.css` instead. `bundle.js` is built from that source; never edit it by hand. The `GameScreen` card shows a round put together from the kit.

## How the jukebox maps to the game

| Jukebox part | In SongQuiz | Component |
| --- | --- | --- |
| Title bar | The room name: "SongQuiz — Friday Night Room" | `Window` |
| Transport buttons | Host controls: replay snippet, play/pause, skip | `Transport` |
| LCD | Round, prompt, who is still guessing, snippet timer | `LcdDisplay` |
| Albums / Artists tabs | Round / Scores / History | `SegmentedControl` |
| Search field | Search songs; the large variant is the answer field | `SearchField` |
| Library sidebar | Room, players with scores, playlists | `SourceList` |
| Album wall | Answer choices as covers | `AlbumGrid`, `AlbumTile` |
| Now Playing art | The mystery track, hidden until reveal | `NowPlaying` |
| List view | The leaderboard | `Leaderboard` |
| Bottom bar | Room summary, invite / shuffle / repeat | `StatusBar` |

## Content fundamentals

- Address the player as "you" and everyone else by name: "Malik locked in", "You were 0.8 s faster than Priya".
- Use sentence case for buttons, titles, segments and LCD text: "Start game", "Lock in", "Round 3 of 10". The only uppercase text is source-list headings (`source-heading`): "ROOM", "PLAYERS", "PLAYLISTS".
- Chrome text is 11–12px, so keep it short. LCD line 1 says what is happening, line 2 who it is waiting on: "Round 3 of 10 — Name that tune" / "5 of 8 players locked in". Between rounds line 1 gives the answer: "It was “Africa” by Toto".
- Write times as m:ss. The LCD counts elapsed time on the left and remaining time on the right with a leading minus ("0:12" … "-0:18").
- Write scores with thousands separators ("12,480") and points earned with a plus ("+120"). Streaks use a multiplication sign ("3×") in tables and "3-streak" in badges.
- The status bar reads like a library summary: "8 players, round 3 of 10, 0:18 left".
- Don't use emoji. Each result is a word plus a glyph (✓ Correct, ✗ Wrong), never colour alone.

## Visual foundations

**The window.** Wrap every screen in `Window`. Its parts, top to bottom, are a `titlebar-h` title row with three window dots, a `toolbar-h` toolbar, the main area, and a `statusbar-h` status bar. The title bar and toolbar share one brushed gradient from `chrome-top` to `chrome-bottom` and end in a 1px `chrome-edge` line. The main area is a `sidebar-w` source list on `source-bg` next to the content on `grid-bg`. The window has `radius-md` corners and `shadow-window`. The close dot (`dot-close`) leaves the room. The other two dots are decoration.

**Colour.** The chrome is neutral silver. Colour comes from the covers on `grid-bg` (dark in both themes so the art glows), the LCD (`lcd-bg`, `lcd-ink`, `lcd-muted`, `lcd-fill`) and the brand blue `aqua`. Use `aqua` only for the primary action, the selected answer ring and the record label on placeholder sleeves. Selection in the sidebar and in lists is the `select-top` → `select-bottom` gradient with `on-select` text. Results use the signal pair: `correct` (lighter green, `on-correct` text) and `wrong` (deep red, `on-wrong` text). They differ by more than 3:1 in lightness and always carry a check or cross plus the word. `gold` with `on-gold` marks first place and streaks only.

**Gloss and depth.** Glossy controls (Button, segments, transport discs, bar buttons, column headers) use a `control-top` → `control-bottom` gradient, a 1px `bezel` border and `shadow-gloss`. When pressed, the gradient reverses and they take `shadow-pressed`. A selected segment uses `pressed-top` → `pressed-bottom` with `on-pressed` text. Recessed things (fields, slider track, LCD) use `shadow-field` or `shadow-lcd`. Chrome text has a 1px `engrave` text-shadow below it. Use `.sq-chrome-bg` for any custom bar that should match the toolbar.

**Type.** Chrome is set in the `ui` family (Lucida Grande, then Lucida Sans, Geneva and Verdana): `window-title` in the title bar, `body` for rows and buttons, `label` for the status bar, column headers and artist names, `label-strong` for segments and tile titles, `source-heading` (uppercase) for sidebar headings, and `lcd-time` for the timer with tabular figures. Game moments use the `display` family (Helvetica Neue): `question` for the round prompt on `grid-bg` in `grid-ink`, `heading` for panels, and `score` for final scores. The large answer field and large buttons use `answer`. No font files ship; both stacks use faces already on the device.

**Spacing and shape.** Spacing runs `space-1` 4px, `space-2` 8px, `space-3` 12px, `space-4` 16px and `space-6` 24px. Pad the album grid with `space-4` and put `space-6` above the round prompt. Rows are `row-h`, controls `control-h`, transport discs `transport-md`, and play/pause `transport-lg`. Buttons, fields, badges and count pills are pills (`radius-pill`), the segmented control and bar buttons use `radius-sm`, the window and LCD use `radius-md`, and album art uses `radius-xs` with `shadow-art`.

**States.** Show keyboard focus with `shadow-focus` everywhere. Its two rings (white then `focus` in Aqua, black then `focus` in Graphite) stay visible on chrome and on `grid-bg`. Rows show focus as an inset 2px `focus` line. A selected answer tile gets a `grid-ink` + `aqua` ring. At reveal, the right tile gets a `correct` ring and badge, the player's wrong pick gets a `wrong` ring and badge, and the rest are dimmed. Disabled controls drop to 45% opacity.

**Motion.** Keep motion minimal, as on the original desktop: the LCD progress bar fills linearly with the snippet, and nothing bounces. Swap a hidden sleeve for its art at reveal with at most a 200ms crossfade.

**Themes.** Aqua (light) is the default. Graphite (dark) darkens the chrome, sidebar and LCD (green on black) and keeps `aqua`, the signal colours and the dark album wall. Set `data-theme="dark"` on the root to switch.

## Iconography

Draw icons with `Icon`. It holds 16×16 glyphs drawn in `currentColor`: filled transport shapes (play, pause, prev, next) and 1.4–2.2px rounded strokes for the rest. Size them at 12px in controls, 16px in the source list and 8–10px in badges. Source-list glyphs take `source-icon`, or `on-select` when selected. A toggled-on bar button takes `toggle-on`. The set: `SongQuiz.iconNames`. No logo exists yet. Set the name "SongQuiz" in plain type (the `display` family, bold) until one is made.

## Album art

Real covers come from your music source at whatever size it gives. Show them square with `object-fit: cover`. When a cover is missing, `AlbumTile` and `NowPlaying` draw a placeholder sleeve: a silver jacket with a record and an `aqua` label. While a track is still a mystery, `state="hidden"` draws a dark jacket with a "?". Never show the real cover before the reveal.
