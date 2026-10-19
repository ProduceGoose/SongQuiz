// Points. Each round, the title and the artist are scored on their own: the first three players
// to name the title get 3, 2 and 1 points, and so do the first three to name the artist. Used by
// the demo room (useGame.ts) and the server (worker/RoomObject.ts).
import type { Round, Session } from '../types';
import type { Named } from './guess';

export const POINTS = [3, 2, 1];

/** Points for the player in `place` (0 = first) to name a part. */
export function pointsFor(place: number): number {
  return POINTS[place] ?? 0;
}

/** Points per player id in a game; players without an entry have 0. */
export type Scores = Record<string, number>;

type Solved = Pick<Round, 'solvedTitle' | 'solvedArtist'>;

/** The player's points from this round so far. */
export function roundPoints(round: Solved, id: string): number {
  const from = (list: string[]) => (list.includes(id) ? pointsFor(list.indexOf(id)) : 0);
  return from(round.solvedTitle) + from(round.solvedArtist);
}

/** Every one of these players has named both the title and the artist. */
export function allSolved(round: Solved, ids: Iterable<string>): boolean {
  return [...ids].every((id) => round.solvedTitle.includes(id) && round.solvedArtist.includes(id));
}

/**
 * Credits the player for the parts they named for the first time. Returns the updated round, the
 * points won and the chat event ({who} stands for the player), or null if nothing was new.
 */
export function award(round: Round, id: string, named: Named): { round: Round; points: number; text: string } | null {
  const title = named.title && !round.solvedTitle.includes(id);
  const artist = named.artist && !round.solvedArtist.includes(id);
  if (!title && !artist) return null;
  const points = (title ? pointsFor(round.solvedTitle.length) : 0) + (artist ? pointsFor(round.solvedArtist.length) : 0);
  const next: Round = {
    ...round,
    solvedTitle: title ? [...round.solvedTitle, id] : round.solvedTitle,
    solvedArtist: artist ? [...round.solvedArtist, id] : round.solvedArtist
  };
  const what = title && artist ? 'the title and the artist' : title ? 'the title' : 'the artist';
  return { round: next, points, text: `{who} named ${what}` + (points ? ` · +${points}` : ' · no points left') };
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
