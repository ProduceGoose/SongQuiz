// Audio effects for a harder game. There are five kinds (speed, sound, distortion, reverb, delay)
// with one choice each, so effects stack across kinds (fast + telephone + distorted + reverb) but
// never within one (fast and slow). With random on, each round gets its own mix. The server picks a
// round's effects, so every player hears the same; game/audioEffects.ts plays them. Used by the
// server too.
import type { AudioEffects, RoomEffects } from '../types';

export const NO_EFFECTS: RoomEffects = { speed: 'normal', tone: 'clean', distort: 'off', reverb: 'off', delay: 'off', random: 'off' };

export const SPEED_LABELS: Record<AudioEffects['speed'], string> = { normal: 'Normal', fast: 'Fast', slow: 'Slow' };
export const TONE_LABELS: Record<AudioEffects['tone'], string> = { clean: 'Clean', muffled: 'Muffled', telephone: 'Telephone' };
export const SWITCH_LABELS: Record<'off' | 'on', string> = { off: 'Off', on: 'On' };

/** How fast the song plays; the pitch goes up and down with it. */
export const SPEED_RATES: Record<AudioEffects['speed'], number> = { normal: 1, fast: 1.5, slow: 0.75 };

/** The effects a browser sent, checked; null if any value is not one the form offers. Reverb and delay may be missing (older pages): then off. */
export function validEffects(e: unknown): RoomEffects | null {
  if (!e || typeof e !== 'object') return null;
  const { speed, tone, distort, random, reverb = 'off', delay = 'off' } = e as Record<string, string>;
  const ok = Object.hasOwn(SPEED_LABELS, speed!) && Object.hasOwn(TONE_LABELS, tone!)
    && [distort, random, reverb, delay].every((s) => Object.hasOwn(SWITCH_LABELS, s!));
  return ok ? ({ speed, tone, distort, reverb, delay, random } as RoomEffects) : null;
}

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]!;
const onOff = () => pick(['off', 'on'] as const);

/** The effects for a new round: the room's, or with random on a fresh mix of at least one effect. */
export function roundEffects(room: RoomEffects): AudioEffects {
  if (room.random !== 'on') {
    return { speed: room.speed, tone: room.tone, distort: room.distort, reverb: room.reverb ?? 'off', delay: room.delay ?? 'off' };
  }
  for (;;) {
    const mix: AudioEffects = {
      speed: pick(Object.keys(SPEED_LABELS) as Array<AudioEffects['speed']>),
      tone: pick(Object.keys(TONE_LABELS) as Array<AudioEffects['tone']>),
      distort: onOff(),
      reverb: onOff(),
      delay: onOff()
    };
    if (effectsText(mix)) return mix;
  }
}

/** "Fast, telephone, distorted, reverb, delay"; empty without effects. */
export function effectsText(e: AudioEffects): string {
  const parts = [
    e.speed !== 'normal' && SPEED_LABELS[e.speed],
    e.tone !== 'clean' && TONE_LABELS[e.tone],
    e.distort === 'on' && 'Distorted',
    e.reverb === 'on' && 'Reverb',
    e.delay === 'on' && 'Delay'
  ].filter((p): p is string => !!p);
  return parts.map((p, i) => (i ? p.toLowerCase() : p)).join(', ');
}

/** For the room's badge: "Random effects", the effects, or empty. */
export function roomEffectsText(e: RoomEffects | undefined): string {
  if (!e) return '';
  return e.random === 'on' ? 'Random effects' : effectsText(e);
}
