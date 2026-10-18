# Leaderboard

Zebra-striped list view of players ranked by score, with status badges, streaks and points from the last round. Your own row is highlighted.

**You provide:** `players` (`[{id, name, score, delta?, streak?, status?, note?}]`, where status is `guessing` | `locked` | `correct` | `wrong` | `away`), `highlight` (your player id), `caption` (screen-reader title), `sort` (`false` keeps your order; default sorts by score, high first), `locale` for number formatting.

- First place gets a gold trophy badge as the rank.
- `note` is a muted suffix like "(you)" or "(host)".
- Show at most one round's `delta`. Clear it when the next round starts.
