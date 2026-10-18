# Transport

The three round glossy discs: replay snippet, play/pause and skip. Play/pause is the larger disc.

**You provide:** `playing` (shows pause when true), `onPrevious`, `onToggle`, `onNext`, `disabled`. For a single disc use `SongQuiz.TransportButton` with `icon` (`play` · `pause` · `prev` · `next`), `size` (`md` | `lg`) and `label`.

- Only the host controls playback. Everyone else sees the discs disabled.
- `prev` means "replay the snippet" in a round, so its accessible label is "Replay snippet".
