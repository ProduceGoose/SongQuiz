// Demo content for the SongQuiz prototype. Every room, player and score here is example data.
import { CODE_CHARS } from '../game/protocol';
import { ME, type Playlist, type Room, type Settings, type Track } from '../types';
import playlistData from './playlists.json';

// ---- Cover art -----------------------------------------------------------------
// Flat geometric SVGs stand in for real album covers.
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

export const playlists: Playlist[] = PLAYLIST_DATA.map((p, i) => ({ ...p, art: coverArt(i), subtitle: `${p.songs} songs` }));

/** A song's Apple Music cover at the given size in px, or undefined if it has none. */
export function artworkUrl(track: Track, size: number): string | undefined {
  return track.apple?.artwork.replaceAll('{size}', String(size));
}

export function playlistById(id: string | undefined): Playlist {
  return playlists.find((p) => p.id === id) ?? playlists[0];
}

// ---- Rooms ---------------------------------------------------------------------
/** The demo room plays offline with simulated players; every other code is a real online room. */
export const DEMO_CODE = 'KX7Q';

/** A code for a new online room; never the demo room's. */
export function randomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code === DEMO_CODE ? randomCode() : code;
}

export function demoRoom(myName: string): Room {
  return {
    name: 'Friday Night Room', code: DEMO_CODE, hostId: 'malik',
    playlistId: 'synth-80s', rounds: 10, mode: 'covers', snippet: 20, maxPlayers: 8,
    players: [
      { id: 'malik', name: 'Malik', ready: true },
      { id: 'priya', name: 'Priya', ready: true },
      { id: ME, name: myName, ready: false },
      { id: 'jonas', name: 'Jonas', ready: false },
      { id: 'sam', name: 'Sam', ready: true }
    ]
  };
}

// ---- Chat ----------------------------------------------------------------------

/** What the other players in the demo room said before you arrived. */
export const demoChat: Array<{ playerId: string; text: string; secondsAgo: number }> = [
  { playerId: 'malik', text: 'Welcome to Friday Night Room! We start as soon as everyone is ready.', secondsAgo: 170 },
  { playerId: 'priya', text: '80s again? Fine by me, I know all of these.', secondsAgo: 95 },
  { playerId: 'sam', text: 'Bold claim, Priya. Volume up, everyone.', secondsAgo: 60 },
  { playerId: 'jonas', text: 'Grabbing a drink, back in a sec', secondsAgo: 25 }
];

/** How the demo players phrase a guess; {title} is the song they guess. */
export const guessPhrases = ['{title}', '{title}?', 'is it {title}?', '{title}!!', 'hmm… {title}', 'pretty sure {title}'];

/** Chat the demo players send while they have no idea. */
export const stumpedPhrases = ['no idea', 'I know this one…', 'so familiar', 'replay it!', 'argh, the intro'];

export const defaultSettings: Settings = { name: 'Lena', theme: 'system', volume: 70, covers: 'on' };
