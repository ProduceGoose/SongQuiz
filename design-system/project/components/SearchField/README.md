# SearchField

Pill-shaped text field with a leading glyph and a clear button: small for searching songs, large for typing an answer.

**You provide:** `placeholder`, `value` + `onChange(text)` or `defaultValue`, `onSubmit(text)` (Enter), `size` (`md` | `lg`), `icon` (default `search`; use `music` for answers), `label` for screen readers, `disabled`, `autoFocus`.

- The answer field is `size="lg"` next to a primary `lg` Button "Lock in". Pressing Enter also locks in.
- Disable it once the player has locked in or time is up.
