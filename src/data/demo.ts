// Demo content for the SongQuiz prototype. Every room, player and score here is example data.
import { CODE_CHARS } from '../game/protocol';
import { ME, type Playlist, type Room, type Settings, type GameMode, type Track } from '../types';
import playlistData from './playlists.json';
import coverIds from './covers.json';

// ---- Cover art -----------------------------------------------------------------
// A playlist's cover is public/assets/covers/<id>.webp (made by `npm run covers`). Playlists without
// one get a flat geometric SVG instead.
const COVERS = new Set<string>(coverIds);

function playlistArt(id: string, i: number): string {
  // Relative, like every other asset URL (vite.config.ts sets base: './').
  return COVERS.has(id) ? `assets/covers/${id}.webp` : coverArt(i);
}

/** A game mode's cover: public/assets/covers/mode-<mode>.webp once `npm run covers` has made it, else a generated one. */
export function modeArt(mode: GameMode): string {
  return playlistArt(`mode-${mode}`, mode === 'casual' ? 6 : 2);
}
const PALETTES = [
  ['#d9472b', '#f6d36b'], ['#1b3a5c', '#e9e2cf'], ['#2f7d5b', '#f1efe6'], ['#f2c14e', '#1c1c1c'],
  ['#7a2e8e', '#f4b6c2'], ['#e8e3d8', '#c0392b'], ['#0f4c81', '#ff8c42'], ['#3a3a3a', '#e5e5e5']
];

function coverArt(i: number): string {
  const [bg, fg] = PALETTES[i % PALETTES.length];
  const shapes = [
    `<circle cx="50" cy="54" r="28" fill="${fg}"/>`,
    `<path d="M0 60h100v9H0zM0 76h100v9H0zM0 92h100v8H0z" fill="${fg}"/>`,
    `<path d="M0 100L100 20v80z" fill="${fg}"/>`,
    `<path d="M14 74a36 36 0 0 1 72 0z" fill="${fg}"/><path d="M0 78h100v22H0z" fill="${fg}" opacity=".5"/>`,
    `<path d="M20 20h28v28H20zM52 52h28v28H52z" fill="${fg}"/>`
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/>${shapes[i % shapes.length]}</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// ---- Playlists -----------------------------------------------------------------
// The songs live in playlists.json, together with their Apple Music ids and covers
// (filled in by `npm run apple-music`).
const PLAYLIST_DATA = playlistData as Array<Omit<Playlist, 'art' | 'subtitle'>>;

/**
 * "Random": every song of every other playlist, built here rather than kept in playlists.json, so
 * it follows the other playlists when songs are added or removed. A song in several playlists is
 * in it once.
 */
function randomPlaylist(): Omit<Playlist, 'art' | 'subtitle'> {
  const seen = new Set<string>();
  const tracks = PLAYLIST_DATA.flatMap((p) => p.tracks).filter((t) => {
    const key = t.apple ? `apple:${t.apple.id}` : `${t.title}|${t.artist}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const years = tracks.map((t) => t.year);
  return {
    id: 'random', title: 'Random', era: `${Math.min(...years)}–${Math.max(...years)}`, level: 'Medium',
    songs: tracks.length, description: 'Every song from every playlist, all mixed together.', tracks
  };
}

export const playlists: Playlist[] = [...PLAYLIST_DATA, randomPlaylist()]
  .map((p, i) => ({ ...p, art: playlistArt(p.id, i), subtitle: `${p.songs} songs` }));

/** A song's Apple Music cover at the given size in px, or undefined if it has none. */
export function artworkUrl(track: Track, size: number): string | undefined {
  return track.apple?.artwork.replaceAll('{size}', String(size));
}

export function playlistById(id: string | undefined): Playlist {
  return playlists.find((p) => p.id === id) ?? playlists[0];
}

// ---- Rooms ---------------------------------------------------------------------
/**
 * The demo room plays offline with simulated players; every other code is a real online room.
 * Its code isn't shown anywhere in the app. It has a 1, which CODE_CHARS leaves out, so no online
 * room can get it.
 */
export const DEMO_CODE = 'SH1T';

/**
 * A solo game: a room with only you, offline like the demo room, so nothing goes to the server.
 * Its code has a 0, which CODE_CHARS leaves out too, and it isn't shown anywhere either.
 */
export const SOLO_CODE = 'S0LO';

export const isSolo = (room: Pick<Room, 'code'> | null | undefined) => room?.code === SOLO_CODE;

/**
 * Free play starts on Random with the usual rules, which you can change. A survival run has fixed
 * rules (game/survival.ts) and no pause or skip, since both would save a life.
 */
export function soloRoom(myName: string, mode: GameMode = 'casual'): Room {
  const survival = mode === 'coop';
  return {
    name: survival ? 'Survival' : 'Solo', code: SOLO_CODE, hostId: ME, mode,
    playlistId: 'random', rounds: 10, snippet: 20, guess: 'separate', hosting: 'host', advance: 'auto', hostControls: survival ? 'off' : 'on', voteSkip: 'off',
    // The limit is hidden in solo; it only has to be one the room form offers (see settingsFromOptions).
    effects: { speed: 'normal', tone: 'clean', distort: 'off', reverb: 'off', delay: 'off', random: 'off' }, maxPlayers: 4,
    players: [{ id: ME, name: myName, ready: true }]
  };
}

/** A code for a new online room; never the demo room's, since CODE_CHARS has no 1. */
export function randomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export function demoRoom(myName: string): Room {
  return {
    name: 'Friday Night Room', code: DEMO_CODE, hostId: 'malik',
    playlistId: 'synth-80s', rounds: 10, snippet: 20, guess: 'separate', hosting: 'host', advance: 'auto', hostControls: 'off', voteSkip: 'off',
    effects: { speed: 'normal', tone: 'clean', distort: 'off', reverb: 'off', delay: 'off', random: 'off' }, maxPlayers: 8,
    players: [
      { id: 'malik', name: 'Hans', ready: true },
      { id: 'priya', name: 'Grätel', ready: true },
      { id: ME, name: myName, ready: false },
      { id: 'jonas', name: 'Kukuk', ready: false },
      { id: 'sam', name: 'The Wise One', ready: true }
    ]
  };
}

// ---- Chat ----------------------------------------------------------------------

/** What the other players in the demo room said before you arrived. */
export const demoChat: Array<{ playerId: string; text: string; secondsAgo: number }> = [
  { playerId: 'malik', text: 'Welcome to the Demo Room. Nothing is real here.', secondsAgo: 170 },
  { playerId: 'priya', text: 'We are not real! But that doesn\'t bother you.', secondsAgo: 95 },
  { playerId: 'sam', text: 'Its never about the game, its about perspective.', secondsAgo: 60 },
  { playerId: 'jonas', text: 'Which you wont understand. So have fun!', secondsAgo: 25 }
];

/** How the demo players phrase a guess; {title} is the song they guess. */
export const guessPhrases = ['{title}', '{title}?', 'is it {title}?', '{title}!!', 'hmm… {title}', 'pretty sure {title}'];

/** Chat the demo players send while they have no idea. */
export const stumpedPhrases = ['no idea', 'I know this one…', 'so familiar', 'replay it!', 'argh, the intro'];

/** The names a first-time visitor can get, one at random (see randomName); they can change it in Settings. */
export const DEFAULT_NAMES = [
  'Pivo', 'PussySmok', 'ncl', 'pikapikatchu', 'buckleboy_mf', 'galaxyboy', 'venvixus', 'Macim',
  'BibiGlocksberg', 'producegoose', 'Dewri', 'Stalxim', 'Pinksheep69', 'Traubenjäger'
];

export const randomName = () => DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)]!;

/** Every setting's default; a visitor without a saved name gets a randomName instead (lib/settings.ts). */
export const defaultSettings: Settings = { name: '', theme: 'system', volume: 70, covers: 'on' };
