# AlbumTile

One cover with its title and artist. It is the answer choice in a round and carries the reveal states.

**You provide:** `art` (image URL; omit for the placeholder sleeve), `title`, `subtitle` (artist), `state`, `playing` (adds a speaker glyph before the title), `onClick` (makes it a button), `size` (art px), `badgeLabel` to override "Correct"/"Wrong".

States: `idle` · `selected` (the player's pick, `aqua` ring) · `correct` (`correct` ring + ✓ Correct badge) · `wrong` (the player's wrong pick, `wrong` ring + ✗ Wrong badge) · `hidden` (dark sleeve with "?", the mystery track) · `dimmed` (other choices after reveal).

- Never pass the real cover for the mystery track before the reveal. Use `state="hidden"`.
- At reveal, mark the right tile `correct`, the player's wrong pick `wrong` and every other tile `dimmed`.
