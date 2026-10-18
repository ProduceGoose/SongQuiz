# Window

The silver window every SongQuiz screen lives in: title bar with window dots, a toolbar, an optional sidebar, the content area and a status bar.

**You provide:** `title` (the room name, e.g. "SongQuiz — Friday Night Room"), `toolbar` (usually a `Toolbar`), `sidebar` (a `SourceList`, optionally followed by `NowPlaying`), `statusBar` (a `StatusBar`), `children` for the content area, and a height through `style` or a sized parent. `onClose` makes the close dot leave the room; `closeLabel` names it for screen readers (default "Leave room").

- Use one Window per screen; never nest them.
- The content area is `grid-bg` with `grid-ink` text. Put an `AlbumGrid` or `Leaderboard` there, not chrome controls.
- Keep the title short. It ellipsizes at 60% of the width.
