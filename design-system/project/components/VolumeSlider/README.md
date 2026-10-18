# VolumeSlider

Small speaker-to-speaker range slider for each player's own volume.

**You provide:** `value` + `onChange(number)` (controlled) or `defaultValue` (default 70), optional `min`/`max` (0–100), `label` (default "Volume").

- Volume is local to each player. Never sync it across the room.
