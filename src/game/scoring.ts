// Points. Each round, the first three players to name a part of the song get 3, 2 and 1 points.
// Which parts count is the room's guess mode: the title and the artist on their own (so up to
// 6 points a round), only one of them, or both together. Naming every artist of a song with
// several is worth a bonus point wherever the artist counts. Used by the demo room (useGame.ts)
// and the server (worker/RoomObject.ts).
import type { GuessMode, Round, Session } from '../types';
import type { Named } from './guess';

export const POINTS = [3, 2, 1];

/** Points for the player in `place` (0 = first) to name a part. */
export function pointsFor(place: number): number {
  return POINTS[place] ?? 0;
}

/** Points per player id in a game; players without an entry have 0. */
export type Scores = Record<string, number>;

/** Extra points for naming every artist of a song that has several, on top of the artist's points. */
export const ALL_ARTISTS_BONUS = 1;

const points = POINTS.join(', ');
const bonus = ` Name every artist of a song with several for +${ALL_ARTISTS_BONUS}.`;
export const GUESS_RULES: Record<GuessMode, string> = {
  separate: `The first three to name the title get ${points} points, and so do the first three to name the artist.` + bonus,
  title: `Only the title counts: the first three to name it get ${points} points.`,
  artist: `Only the artist counts: the first three to name them get ${points} points.` + bonus,
  both: `Points only once you’ve named the title and the artist: ${points} for the first three.` + bonus
};

type Solved = Pick<Round, 'guess' | 'solvedTitle' | 'solvedArtist' | 'solvedBoth' | 'solvedAllArtists'>;

const needsTitle = (round: Pick<Round, 'guess'>) => round.guess !== 'artist';
const needsArtist = (round: Pick<Round, 'guess'>) => round.guess !== 'title';
const placePoints = (list: string[], id: string) => (list.includes(id) ? pointsFor(list.indexOf(id)) : 0);
// Rounds saved before the bonus existed have no list.
const allArtistsOf = (round: Pick<Round, 'solvedAllArtists'>) => round.solvedAllArtists ?? [];

/** The bonus the player has won this round; in "both" rounds it counts once they've named both. */
function bonusPoints(round: Solved, id: string): number {
  if (!needsArtist(round) || !allArtistsOf(round).includes(id)) return 0;
  return round.guess !== 'both' || round.solvedBoth.includes(id) ? ALL_ARTISTS_BONUS : 0;
}

/** The player's points from this round so far. */
export function roundPoints(round: Solved, id: string): number {
  const extra = bonusPoints(round, id);
  switch (round.guess) {
    case 'title': return placePoints(round.solvedTitle, id);
    case 'artist': return placePoints(round.solvedArtist, id) + extra;
    case 'both': return placePoints(round.solvedBoth, id) + extra;
    default: return placePoints(round.solvedTitle, id) + placePoints(round.solvedArtist, id) + extra;
  }
}

/** The player has named everything the round asks for. */
export function hasSolved(round: Solved, id: string): boolean {
  return (!needsTitle(round) || round.solvedTitle.includes(id)) && (!needsArtist(round) || round.solvedArtist.includes(id));
}

/** Every one of these players has named everything the round asks for. */
export function allSolved(round: Solved, ids: Iterable<string>): boolean {
  return [...ids].every((id) => hasSolved(round, id));
}

/** Who was quickest to what the round asks for, if anyone. */
export function fastest(round: Solved): string | undefined {
  switch (round.guess) {
    case 'title': return round.solvedTitle[0];
    case 'artist': return round.solvedArtist[0];
    case 'both': return round.solvedBoth[0];
    default: return round.solvedTitle[0] ?? round.solvedArtist[0];
  }
}

/**
 * Credits the player for the parts they named for the first time, of those the round counts.
 * Returns the updated round, the points won and the chat event ({who} stands for the player),
 * or null if nothing was new.
 */
export function award(round: Round, id: string, named: Named): { round: Round; points: number; text: string } | null {
  const title = named.title && needsTitle(round) && !round.solvedTitle.includes(id);
  const artist = named.artist && needsArtist(round) && !round.solvedArtist.includes(id);
  // Naming them all can come after naming one: "drake", then "drake wizkid kyla".
  const all = named.allArtists && needsArtist(round) && !allArtistsOf(round).includes(id);
  if (!title && !artist && !all) return null;
  let next: Round = {
    ...round,
    solvedTitle: title ? [...round.solvedTitle, id] : round.solvedTitle,
    solvedArtist: artist ? [...round.solvedArtist, id] : round.solvedArtist,
    solvedAllArtists: all ? [...allArtistsOf(round), id] : allArtistsOf(round)
  };
  const what = [title && 'the title', (artist || all) && (all ? 'all the artists' : 'the artist')].filter(Boolean).join(' and ');
  const said = (won: number) => (won ? ` · +${won}` : ' · no points left');
  if (round.guess === 'both') {
    // Half of it scores nothing yet; a bonus waits until then.
    if (!hasSolved(next, id)) return { round: next, points: 0, text: `{who} named ${what}` };
    if (round.solvedBoth.includes(id)) return { round: next, points: ALL_ARTISTS_BONUS, text: `{who} named ${what}` + said(ALL_ARTISTS_BONUS) };
    const won = pointsFor(next.solvedBoth.length) + (next.solvedAllArtists.includes(id) ? ALL_ARTISTS_BONUS : 0);
    next = { ...next, solvedBoth: [...next.solvedBoth, id] };
    return { round: next, points: won, text: (all ? `{who} named both and all the artists` : `{who} named both`) + said(won) };
  }
  const won = (title ? pointsFor(round.solvedTitle.length) : 0) + (artist ? pointsFor(round.solvedArtist.length) : 0) + (all ? ALL_ARTISTS_BONUS : 0);
  return { round: next, points: won, text: `{who} named ${what}` + said(won) };
}

export const pointsText = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`;

export interface GameResult<P> {
  /** The players with the most points; several on a tie, none if nobody scored. */
  winners: P[];
  points: number;
  /** "Priya wins with 14 points!"; a player named "You" reads "You win". */
  text: string;
}

/** Of these players, the ones with the most points; none if none of them scored. */
function winnersOf<P extends { id: string }>(scores: Scores, players: P[]): { winners: P[]; points: number } {
  const points = Math.max(0, ...players.map((p) => scores[p.id] ?? 0));
  return { winners: points ? players.filter((p) => scores[p.id] === points) : [], points };
}

/** Who won among these players. */
export function gameResult<P extends { id: string; name: string }>(scores: Scores, players: P[]): GameResult<P> {
  const { winners, points } = winnersOf(scores, players);
  const names = winners.map((p) => p.name);
  const text = !names.length ? 'Nobody scored any points.'
    : names.length === 1 ? `${names[0]} ${names[0] === 'You' ? 'win' : 'wins'} with ${pointsText(points)}!`
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} tie with ${pointsText(points)} each!`;
  return { winners, points, text };
}

export const emptySession = (): Session => ({ games: 0, players: {} });

/** The session with a finished game added: everyone's points, and a win for each winner. */
export function addGame(session: Session, scores: Scores, ids: string[]): Session {
  const players = ids.map((id) => ({ id }));
  const { winners } = winnersOf(scores, players);
  const totals = { ...session.players };
  for (const { id } of players) {
    const was = totals[id] ?? { wins: 0, points: 0 };
    totals[id] = { wins: was.wins + (winners.some((w) => w.id === id) ? 1 : 0), points: was.points + (scores[id] ?? 0) };
  }
  return { games: session.games + 1, players: totals };
}
