// Survival, a solo mode: get as far as you can with three lives. A run has three levels, Easy,
// Medium and Hard. Each level plays PLAYLISTS_PER_LEVEL playlists, picked at random (a slot machine
// shows the pick), with SONGS_PER_STAGE songs from each. Every playlist is split by how popular its
// songs are (src/data/popularity.json, from `npm run popularity`): its best-known third are its easy
// songs, the least-known third its hard ones, and a level plays its own third. The run ends when the
// lives are gone or after the last Hard playlist. A round costs a life when its time runs out and
// you have named neither the title nor the artist. Played by game/useGame.ts.
import { playlists } from '../data/demo';
import popularity from '../data/popularity.json';
import type { AudioEffects, Playlist, RunLevel, RunResult, Track } from '../types';
import { effectsText } from './effects';

export const LIVES = 3;
export const LEVELS: RunLevel[] = ['Easy', 'Medium', 'Hard'];
export const PLAYLISTS_PER_LEVEL = 3;
export const SONGS_PER_STAGE = 5;
export const STAGES = LEVELS.length * PLAYLISTS_PER_LEVEL;
/** How long the slot machine's reel turns before it stops on the next playlist; then the player starts it. */
export const SPIN_MS = 2800;

/**
 * Effects on the last playlist of each level: one on Easy and two on Medium, the same for all its
 * songs; on Hard a fresh random mix for every song (see roundEffects).
 */
export const LEVEL_EFFECTS: Record<RunLevel, number | 'random'> = { Easy: 1, Medium: 2, Hard: 'random' };

/** A stage's effects: the same ones for every song, or a random mix per song. */
export type StageEffects = AudioEffects | 'random';

/** Each kind of effect with the ways it can be on (as in game/effects.ts). */
const EFFECT_KINDS: Array<Array<Partial<AudioEffects>>> = [
  [{ speed: 'fast' }, { speed: 'slow' }],
  [{ tone: 'muffled' }, { tone: 'telephone' }],
  [{ distort: 'on' }],
  [{ reverb: 'on' }],
  [{ delay: 'on' }]
];

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]!;

/** `count` effects of different kinds, at random. */
export function randomEffects(count: number): AudioEffects {
  const none: AudioEffects = { speed: 'normal', tone: 'clean', distort: 'off', reverb: 'off', delay: 'off' };
  return Object.assign(none, ...shuffled(EFFECT_KINDS).slice(0, count).map(pick));
}

/** "Fast, reverb", "A random mix every song", or empty. */
export function stageEffectsText(e: StageEffects | undefined): string {
  if (!e) return '';
  return e === 'random' ? 'A random mix every song' : effectsText(e);
}

/** The effects reel on the slot machine: random effect names, ending on the stage's. */
export function effectsReel(e: StageEffects, length = 16): string[] {
  const labels = Array.from({ length: length - 1 }, () => effectsText(randomEffects(1 + Math.floor(Math.random() * 2))));
  return [...labels, stageEffectsText(e)];
}

const POPULARITY = popularity as Record<string, number>;
const key = (t: Track) => `${t.apple!.store ?? 'us'}:${t.apple!.id}`;

/** Playlists a run can pick: all but Random (every song), with enough songs for each level. */
export function survivalPlaylists(): Playlist[] {
  return playlists.filter((p) => p.id !== 'random' && p.tracks.filter((t) => t.apple).length >= SONGS_PER_STAGE * LEVELS.length);
}

/**
 * A playlist's songs for a level: sorted by popularity, the first third for Easy, the middle one
 * for Medium, the last for Hard. Songs Deezer doesn't know sit in the middle.
 */
export function levelSongs(playlist: Playlist, level: RunLevel): Track[] {
  const songs = playlist.tracks.filter((t) => t.apple);
  const known = songs.filter((t) => key(t) in POPULARITY).sort((a, b) => POPULARITY[key(b)]! - POPULARITY[key(a)]!);
  const unknown = songs.filter((t) => !(key(t) in POPULARITY));
  const third = Math.ceil(known.length / 3);
  const tiers = [known.slice(0, third), [...known.slice(third, 2 * third), ...unknown], known.slice(2 * third)];
  return tiers[LEVELS.indexOf(level)]!;
}

function shuffled<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export interface RunStage {
  level: RunLevel;
  playlist: Playlist;
  /** The level's last playlist only (LEVEL_EFFECTS). */
  effects?: StageEffects;
}

/**
 * A run: STAGES different playlists in random order, PLAYLISTS_PER_LEVEL per level, and
 * SONGS_PER_STAGE songs for each from its level's third. No song comes twice, though playlists
 * share many; if a third runs short, the next easier or harder third fills in.
 */
export function survivalPlan(): { stages: RunStage[]; order: Array<{ track: Track; stage: number }> } {
  const picks = shuffled(survivalPlaylists());
  const stages = LEVELS.flatMap((level, l) =>
    Array.from({ length: PLAYLISTS_PER_LEVEL }, (_, i): RunStage => {
      const playlist = picks[(l * PLAYLISTS_PER_LEVEL + i) % picks.length]!;
      if (i < PLAYLISTS_PER_LEVEL - 1) return { level, playlist };
      const fx = LEVEL_EFFECTS[level];
      return { level, playlist, effects: fx === 'random' ? 'random' : randomEffects(fx) };
    }));
  const used = new Set<number>();
  const order = stages.flatMap(({ level, playlist }, stage) => {
    const l = LEVELS.indexOf(level);
    const fallback = [l, l - 1, l + 1, l - 2, l + 2].filter((i) => i >= 0 && i < LEVELS.length).map((i) => LEVELS[i]!);
    const picked: Track[] = [];
    for (const tier of fallback) {
      for (const t of shuffled(levelSongs(playlist, tier))) {
        if (picked.length < SONGS_PER_STAGE && !used.has(t.apple!.id)) {
          picked.push(t);
          used.add(t.apple!.id);
        }
      }
    }
    return picked.map((track) => ({ track, stage }));
  });
  return { stages, order };
}

/** The slot machine's reel for a stage: random covers, ending on the picked playlist. */
export function spinReel(picked: Playlist, length = 24): string[] {
  const others = survivalPlaylists().filter((p) => p.id !== picked.id).map((p) => p.id);
  const reel: string[] = [];
  while (reel.length < length - 1) reel.push(...shuffled(others));
  return [...reel.slice(0, length - 1), picked.id];
}

/** "♥♥♡" for 2 of 3 lives. */
export const hearts = (lives: number, of = LIVES) => '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, of - lives));

export const SURVIVAL_RULES = `${LIVES} lives, three levels: Easy, Medium and Hard. Each level spins up ${PLAYLISTS_PER_LEVEL} playlists with ${SONGS_PER_STAGE} of their easy, medium or hard songs, and its last playlist adds effects: one on Easy, two on Medium, a random mix on Hard. Name the title or the artist before the time runs out, or lose a life.`;

/** "34 songs, up to Medium (Rock Mix)" or "all three levels". */
export function runText(run: RunResult): string {
  if (run.outcome === 'cleared') return 'all three levels';
  // Best runs saved before levels existed have none.
  return `${run.songs} songs, up to ${run.level ?? `stage ${run.stage}`} (${run.playlistTitle})`;
}

const BEST_KEY = 'iquiz.survival.best';

/** The best run on this device: the most songs, then the most points. Null if none or no storage. */
export function bestRun(): RunResult | null {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? 'null') as RunResult | null;
  } catch {
    return null;
  }
}

/** Saves the run if it beats the best one; true if it did. */
export function recordRun(run: Omit<RunResult, 'best'>): boolean {
  const best = bestRun();
  const better = !best || run.songs > best.songs || (run.songs === best.songs && run.points > best.points);
  if (better) {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ ...run, best: true }));
    } catch {
      // Not saved; the run still counts for this game.
    }
  }
  return better;
}
