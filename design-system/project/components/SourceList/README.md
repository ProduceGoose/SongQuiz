# SourceList

The blue-gray sidebar: uppercase section headings, rows with a glyph, a label and an optional count pill, and one selected row.

**You provide:** `sections` (`[{title, collapsible?, collapsed?, items: [{id, label, icon?, badge?}]}]`), `selected` (an item id), `onSelect(id)`, `label` for the nav landmark.

- Typical sections: ROOM (room, current round, scores), PLAYERS (badge = score), PLAYLISTS.
- Badges hold short numbers: player count or score.
- Make long sections `collapsible`. Section titles are written in any case and shown uppercase.
