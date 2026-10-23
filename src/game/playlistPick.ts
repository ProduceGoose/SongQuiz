// How a casual game gets its playlist (Room.pick): the host's choice in the settings, a vote among
// three random playlists when the game starts, or a random one shown by the slot machine. Used by
// the browser (game/useGame.ts) and the server (worker/RoomObject.ts).
import { playlists } from '../data/demo';
import type { GameMode, Playlist, PlaylistPick, Round } from '../types';
import { spinReel } from './survival';
import { isYearPlaylist } from './years';

export const PICK_LABELS: Record<PlaylistPick, string> = { host: 'Host', vote: 'Voting', random: 'Random' };

export const PICK_HINTS: Record<PlaylistPick, string> = {
  host: 'A host picks the playlist below.',
  vote: 'When the game starts, everyone votes for one of three random playlists. After 10 seconds the most votes win.',
  random: 'When the game starts, the slot machine picks a random playlist.'
};

/** How long the players vote, and how many playlists they choose from. */
export const VOTE_MS = 10_000;
export const VOTE_OPTIONS = 3;
/** How long the winner is shown after the vote, before round 1. */
export const VOTE_REVEAL_MS = 2500;

const pickOne = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]!;

/** The playlists a game in this mode can play: year guessing leaves out the decade playlists. */
export const modePlaylists = (mode: GameMode = 'casual'): Playlist[] =>
  mode === 'years' ? playlists.filter((p) => isYearPlaylist(p.id)) : playlists;

/** Playlists a vote or the slot machine can pick: those of the mode with songs to play (not the empty template). */
export function pickablePlaylists(mode?: GameMode): Playlist[] {
  return modePlaylists(mode).filter((p) => p.tracks.filter((t) => t.apple).length >= 5);
}

/** A new vote for round 1: VOTE_OPTIONS different random playlists of the mode, nobody voted yet. */
export function newVote(mode?: GameMode, now = Date.now()): NonNullable<Round['vote']> {
  const pool = pickablePlaylists(mode).map((p) => p.id);
  const options: string[] = [];
  while (options.length < Math.min(VOTE_OPTIONS, pool.length)) {
    const id = pickOne(pool);
    if (!options.includes(id)) options.push(id);
  }
  return { options, votes: {}, until: now + VOTE_MS };
}

/** Votes per option, in the options' order. */
export const voteCounts = (vote: NonNullable<Round['vote']>) =>
  vote.options.map((id) => Object.values(vote.votes).filter((v) => v === id).length);

/** The vote's winner: the most votes; a tie (or no votes at all) is decided at random among the leaders. */
export function voteWinner(vote: NonNullable<Round['vote']>): { playlistId: string; votes: number } {
  const counts = voteCounts(vote);
  const most = Math.max(...counts);
  return { playlistId: pickOne(vote.options.filter((_, i) => counts[i] === most)), votes: most };
}

/** "Rock Mix won the vote with 3 of 5 votes" for the chat. */
export function voteResultText(title: string, votes: number, voters: number): string {
  return votes ? `${title} won the vote with ${votes} of ${voters} ${voters === 1 ? 'vote' : 'votes'}` : `Nobody voted, so it’s ${title}`;
}

/** A random playlist of the mode for the slot machine, and its reel of that mode's playlists. */
export function randomSpin(now: number, spinMs: number, mode?: GameMode): { playlistId: string; spin: NonNullable<Round['spin']> } {
  const pool = pickablePlaylists(mode);
  const picked = pickOne(pool);
  return { playlistId: picked.id, spin: { reel: spinReel(picked, undefined, pool), until: now + spinMs } };
}
