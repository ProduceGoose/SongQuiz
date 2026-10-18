# SegmentedControl

Glossy segmented switch for views within the room, like "Round / Scores / History" or list vs. cover view.

**You provide:** `options` (strings, or `{value, label?, icon?, title?}`; an icon-only option needs `title`), `value` + `onChange(value)` or `defaultValue`, and `label` for the radio group.

- Keep it to 2–4 segments of one or two words in sentence case.
- The selected segment is the dark `pressed-top` → `pressed-bottom` gradient. Never show two selected.
