# Toolbar

Three-zone toolbar row for the window head: playback on the left, the LCD centred, view switches and search on the right.

**You provide:** `start`, `center`, `end` nodes. `center` stretches to at most 460px and usually holds an `LcdDisplay`.

- Order: `start` = `Transport` (+ `VolumeSlider`), `center` = `LcdDisplay`, `end` = `SegmentedControl` + `SearchField`.
- Give non-hosts a disabled `Transport` rather than removing it, so the layout doesn't jump.
