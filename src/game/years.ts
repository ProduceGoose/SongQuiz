// Year guessing (GameMode "years"): players hear a song and type the year it came out. Each
// player has one guess per song. It can't be changed, and nobody sees it before the reveal, where
// the closer it is the more points it gets (YEAR_POINTS). The song's title and artist count for
// nothing, and typing them stays hidden like any right answer, since they'd give the year away.
// Used by the browser (game/useGame.ts) and the server (worker/RoomObject.ts).
import type { Round } from '../types';

/** Points by how many years off a guess is: exactly right, 1 off, 2 off, then up to 5 off. */
export const YEAR_POINTS = [5, 3, 2, 1, 1, 1];

export const yearPoints = (guess: number, year: number) => YEAR_POINTS[Math.abs(guess - year)] ?? 0;

export const YEAR_RULES = `Type the year the song came out. One guess per song, hidden until the reveal: spot on is ${YEAR_POINTS[0]} points, 1 year off ${YEAR_POINTS[1]}, 2 off ${YEAR_POINTS[2]}, up to ${YEAR_POINTS.length - 1} off ${YEAR_POINTS.at(-1)}.`;

/**
 * Playlists of one decade or year, where every song is from about the same years. Year guessing
 * leaves them out: the playlist would give the answer away.
 */
const DECADE_PLAYLISTS = new Set(['70s', 'synth-80s', '90s', 'y2k-pop', '2010s', '2016', '2020']);

export const isYearPlaylist = (id: string) => !DECADE_PLAYLISTS.has(id);

/** The first year in a message ("1985", "i think 1985?"), or a message that is only "85" or "'85"; null if none. */
export function parseYear(text: string, thisYear = new Date().getFullYear()): number | null {
  const full = /(?:^|\D)((?:19|20)\d\d)(?!\d)/.exec(text);
  if (full) {
    const year = Number(full[1]);
    return year <= thisYear ? year : null;
  }
  const short = /^\s*['’]?(\d\d)\s*$/.exec(text);
  if (!short) return null;
  const n = Number(short[1]);
  return n <= thisYear % 100 ? 2000 + n : 1900 + n;
}

/** The round with the player's guess, or null if they have one already. */
export function guessYear(round: Round, id: string, year: number): Round | null {
  if (!round.years || id in round.years) return null;
  return { ...round, years: { ...round.years, [id]: year } };
}

/** The player's points from the round: none before the reveal, so they don't tell how close a guess is. */
export function yearRoundPoints(round: Pick<Round, 'years' | 'phase' | 'track'>, id: string): number {
  const guess = round.years?.[id];
  return guess === undefined || round.phase !== 'reveal' ? 0 : yearPoints(guess, round.track.year);
}

export interface YearResult {
  id: string;
  year: number;
  off: number;
  points: number;
}

/** Every guess of the round with its points, closest first. */
export function yearResults(round: Pick<Round, 'years' | 'track'>): YearResult[] {
  return Object.entries(round.years ?? {})
    .map(([id, year]) => ({ id, year, off: Math.abs(year - round.track.year), points: yearPoints(year, round.track.year) }))
    .sort((a, b) => a.off - b.off);
}

const offText = (off: number) => (off === 0 ? 'spot on' : `${off} ${off === 1 ? 'year' : 'years'} off`);

/** "{who} guessed 1984 · 1 year off · +3" for the chat at the reveal; {who} stands for the player. */
export const yearResultText = (r: YearResult) => `{who} guessed ${r.year} · ${offText(r.off)}${r.points ? ` · +${r.points}` : ''}`;

/** "Priya was closest · 1 year off" for the LCD at the reveal; `nameOf` gives "You" for you. */
export function closestText(round: Pick<Round, 'years' | 'track'>, nameOf: (id: string) => string): string {
  const best = yearResults(round)[0];
  if (!best) return 'Nobody guessed';
  const who = nameOf(best.id);
  return `${who} ${who === 'You' ? 'were' : 'was'} closest · ${offText(best.off)}`;
}

/** The chat's line at the reveal of a year round. */
export const yearRevealText = (round: Pick<Round, 'track'>) => `“${round.track.title}” by ${round.track.artist} is from ${round.track.year}`;

/** The guesses as the server sends them while the song plays: who has guessed, each year as 0. */
export const hiddenYears = (years: Record<string, number>) => Object.fromEntries(Object.keys(years).map((id) => [id, 0]));
