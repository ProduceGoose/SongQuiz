# LcdDisplay

The recessed LCD panel that tells the room what is happening: a bold first line, a muted second line and an optional snippet progress bar with elapsed and remaining time.

**You provide:** `title`, `subtitle`, `progress` (0–1; omit to hide the bar), `elapsed` and `remaining` (seconds as numbers, formatted m:ss with remaining shown as "-0:18", or preformatted strings), `start`/`end` side glyphs (usually `Icon` `music` and `clock`), `progressLabel` for screen readers.

- Line 1: what is happening ("Round 3 of 10 — Name that tune"). Line 2: who it is waiting on ("5 of 8 players locked in").
- At reveal, drop the bar and give the answer: "It was “Africa” by Toto" / "Malik was fastest · next round in 0:05".
- Only `lcd-ink`, `lcd-muted` and `lcd-fill` go on `lcd-bg`.
