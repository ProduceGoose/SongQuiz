// Survival runs, the rules of Coop mode: get as far as you can with three lives, alone (the solo
// "Survival" game, game/useGame.ts) or as a team in an online room (worker/RoomObject.ts). A run has
// three levels, Easy, Medium and Hard. Each level plays PLAYLISTS_PER_LEVEL playlists, picked at
// random (a slot machine shows the pick), with SONGS_PER_STAGE songs from each. Every playlist is
// split by how popular its songs are (src/data/popularity.json, from `npm run popularity`): its
// best-known third are its easy songs, the least-known third its hard ones, and a level plays its
// own third. A level's last playlist adds effects (LEVEL_EFFECTS). A round costs a life when its
// time runs out and nobody has named the title or the artist; the run ends when the lives are gone
// or after the last Hard playlist. Used by the browser and the server alike.
import { playlistById, playlists } from '../data/demo';
import popularity from '../data/popularity.json';
import type { AudioEffects, Playlist, RoomEffects, Round, RunLevel, RunResult, Track } from '../types';
import { effectsText, NO_EFFECTS, roundEffects } from './effects';
import { pointsText } from './scoring';

export const LIVES = 3;
export const LEVELS: RunLevel[] = ['Easy', 'Medium', 'Hard'];
export const PLAYLISTS_PER_LEVEL = 3;
export const SONGS_PER_STAGE = 5;
export const STAGES = LEVELS.length * PLAYLISTS_PER_LEVEL;
/** Seconds of each song a run plays; Coop has no snippet setting. */
export const COOP_SNIPPET = 20;
/** How long the slot machine's reel turns before it stops on the next playlist; then a host starts it. */
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

function shuffled<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

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

export interface RunStage {
  level: RunLevel;
  playlistId: string;
  /** The level's last playlist only (LEVEL_EFFECTS). */
  effects?: StageEffects;
}

/** A run in progress: its stages, each round's stage (0-based, by round number - 1) and the lives left. */
export interface Run {
  stages: RunStage[];
  stageOf: number[];
  lives: number;
}

/**
 * A new run: STAGES different playlists in random order, PLAYLISTS_PER_LEVEL per level, and
 * SONGS_PER_STAGE songs for each from its level's third, in `order`. No song comes twice, though
 * playlists share many; if a third runs short, the next easier or harder third fills in.
 */
export function newRun(): Run & { order: Track[] } {
  const picks = shuffled(survivalPlaylists());
  const stages = LEVELS.flatMap((level, l) =>
    Array.from({ length: PLAYLISTS_PER_LEVEL }, (_, i): RunStage => {
      const playlistId = picks[(l * PLAYLISTS_PER_LEVEL + i) % picks.length]!.id;
      if (i < PLAYLISTS_PER_LEVEL - 1) return { level, playlistId };
      const fx = LEVEL_EFFECTS[level];
      return { level, playlistId, effects: fx === 'random' ? 'random' : randomEffects(fx) };
    }));
  const used = new Set<number>();
  const plan = stages.flatMap(({ level, playlistId }, stage) => {
    const l = LEVELS.indexOf(level);
    const fallback = [l, l - 1, l + 1, l - 2, l + 2].filter((i) => i >= 0 && i < LEVELS.length).map((i) => LEVELS[i]!);
    const picked: Track[] = [];
    for (const tier of fallback) {
      for (const t of shuffled(levelSongs(playlistById(playlistId), tier))) {
        if (picked.length < SONGS_PER_STAGE && !used.has(t.apple!.id)) {
          picked.push(t);
          used.add(t.apple!.id);
        }
      }
    }
    return picked.map((track) => ({ track, stage }));
  });
  return { stages, stageOf: plan.map((p) => p.stage), order: plan.map((p) => p.track), lives: LIVES };
}

// ---- A run's rounds, the same for both engines ----

/** Round n's stage (0-based), and whether it's the first song of that playlist. */
export function stageAt(run: Run, n: number): { stage: number; first: boolean } {
  const stage = run.stageOf[n - 1]!;
  return { stage, first: n === 1 || run.stageOf[n - 2] !== stage };
}

export const runPlaylist = (run: Run, n: number): Playlist => playlistById(run.stages[stageAt(run, n).stage]!.playlistId);

/** What a round of the run shows about it: lives, level, stage and playlist. */
export function runInfo(run: Run, n: number): NonNullable<Round['run']> {
  const { stage } = stageAt(run, n);
  const { level, playlistId } = run.stages[stage]!;
  return {
    lives: run.lives, stage: stage + 1, stages: run.stages.length, level,
    levelStage: (stage % PLAYLISTS_PER_LEVEL) + 1, playlistId, playlistTitle: playlistById(playlistId).title
  };
}

/** Round n's effects: its stage's (the same on every song, or a fresh random mix), else none. */
export function runEffects(run: Run, n: number): AudioEffects {
  const fx = run.stages[stageAt(run, n).stage]!.effects;
  if (fx === 'random') return roundEffects({ ...NO_EFFECTS, random: 'on' } satisfies RoomEffects);
  return fx ?? roundEffects(NO_EFFECTS);
}

/** The slot machine for round n, the first of its playlist. */
export function spinFor(run: Run, n: number, now = Date.now()): NonNullable<Round['spin']> {
  const stage = run.stages[stageAt(run, n).stage]!;
  return { reel: spinReel(playlistById(stage.playlistId)), until: now + SPIN_MS, effects: stage.effects ? effectsReel(stage.effects) : undefined };
}

/** "Level up! …" when round n starts a new level, else null. */
export function levelUpText(run: Run, n: number): string | null {
  if (n === 1) return null;
  const level = run.stages[stageAt(run, n).stage]!.level;
  if (run.stages[run.stageOf[n - 2]!]!.level === level) return null;
  return `Level up! Now the ${level.toLowerCase()} songs · ${hearts(run.lives)}`;
}

/** "Easy 3 of 3: Rock Mix · effects: Fast", for a playlist's first song. */
export function stageStartText(run: Run, n: number): string {
  const info = runInfo(run, n);
  const fx = stageEffectsText(run.stages[info.stage - 1]!.effects);
  return `${info.level} ${info.levelStage} of ${PLAYLISTS_PER_LEVEL}: ${info.playlistTitle}` + (fx ? ` · effects: ${fx}` : '');
}

/** The round cost a life: nobody named the title or the artist. */
export const missedRound = (r: Pick<Round, 'solvedTitle' | 'solvedArtist'>) => !r.solvedTitle.length && !r.solvedArtist.length;

export const lifeLostText = (lives: number) => (lives ? `A life lost · ${hearts(lives)}` : `No lives left · ${hearts(0)}`);

/** The run's end after round r: out of lives, or through the last playlist. `points` are the team's. */
export function runResult(run: Run, r: Round, points: number): Omit<RunResult, 'best'> {
  const info = r.run!;
  return {
    outcome: run.lives > 0 ? 'cleared' : 'out',
    songs: r.number, stage: info.stage, stages: info.stages, level: info.level, playlistTitle: info.playlistTitle, points
  };
}

/** The chat line at a run's end; `team` for a Coop room. */
export function runOverText(result: Omit<RunResult, 'best'>, team: boolean): string {
  const who = team ? 'Your team' : 'You';
  return result.outcome === 'cleared'
    ? `${who} beat all three levels with ${pointsText(result.points)}!`
    : `Out of lives after ${result.songs} songs, at ${result.level} (${result.playlistTitle}) with ${pointsText(result.points)}.`;
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

export const COOP_RULES = `Everyone plays together with ${LIVES} shared lives through three levels: Easy, Medium and Hard. Each level spins up ${PLAYLISTS_PER_LEVEL} playlists with ${SONGS_PER_STAGE} of their easy, medium or hard songs, and its last playlist adds effects. A song costs a life when nobody names the title or the artist in time.`;

/** "34 songs, up to Medium (Rock Mix)" or "all three levels". */
export function runText(run: RunResult): string {
  if (run.outcome === 'cleared') return 'all three levels';
  // Best runs saved before levels existed have none.
  return `${run.songs} songs, up to ${run.level ?? `stage ${run.stage}`} (${run.playlistTitle})`;
}
