# StatusBar

Bottom bar with square bar buttons on the left and right and a one-line room summary in the middle.

**You provide:** `children` (the summary, e.g. "8 players, round 3 of 10, 0:18 left"), `start` and `end` nodes, usually `SongQuiz.BarButton`s (`icon`, `label`, `onClick`, `active` for toggles such as repeat and shuffle).

- Keep the summary to comma-separated facts. It is announced politely to screen readers when it changes.
- A toggled-on bar button turns its glyph `toggle-on`.
