# ChatPanel

The room chat on the right of the window: a timeline of speech bubbles next to player avatars, a brushed header with a breadcrumb label, and a message field at the bottom. Put it in `Window`'s `panel` slot.

**You provide:** `entries` (oldest first), `onSend(text)`, `title` (default "Chat"), `placeholder`, `icon` for the field (`chat`, or `music` while a round is on), `disabled`.

Each entry is `{ id, kind, author, text, time, mine?, tone?, avatar? }`:

- `message`: a speech bubble. Without `avatar`, the author's initials sit on a colour picked from their name, so each player keeps their colour.
- `guess`: a bubble tagged "guess", with muted text. Use it for wrong guesses during a round.
- `event`: a centred pill for what the game says: "Round 3 of 10 — name that tune". `tone: 'correct'` is green with a check ("Priya guessed it"), `tone: 'reveal'` is an LCD strip ("It was “Africa” by Toto").
- `mine: true` gives your own bubbles an `aqua` edge.

Rules:

- During a round every message is a guess. Show wrong guesses as `guess` entries, and never show a correct one: post a `correct` event with the player's name instead.
- Times show as "just now", "12 seconds ago", "3 minutes ago" and update by themselves.
- The list stays scrolled to the newest message unless the player scrolled up to read.
