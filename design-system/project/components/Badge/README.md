# Badge

Small pill for one or two words of status: a player's state, a result or a streak.

**You provide:** `children`, `tone` (`neutral` | `aqua` | `correct` | `wrong` | `gold`), `icon` (defaults to check, cross or trophy for those tones; `null` for none).

- `correct` and `wrong` always keep their glyph and word. Never use colour alone.
- `aqua` = locked in, `neutral` = guessing / away / counts, `gold` = first place and streaks.
