// Room settings: the values the room form offers, and checking what a browser sends. Used by the
// screens and the server (worker/RoomObject.ts).
import { playlists } from '../data/demo';
import { NO_EFFECTS, validEffects } from './effects';
import { PICK_LABELS } from './playlistPick';
import { isYearPlaylist } from './years';
import type { Advance, GameMode, GuessMode, HostControls, Hosting, Room, RoomOptions, Round, VoteSkip } from '../types';

export const ROUND_OPTIONS = ['5', '10', '15', '20'];
export const SNIPPET_OPTIONS = ['0.1', '0.5', '1', '5', '10', '20', '30'];
export const MAX_PLAYER_OPTIONS = ['4', '8', '12'];
export const GUESS_LABELS: Record<GuessMode, string> = { separate: 'Title & artist', title: 'Title only', artist: 'Artist only', both: 'Need both' };
export const HOSTING_LABELS: Record<Hosting, string> = { host: 'One Host', everyone: 'Everyone' };
export const ADVANCE_LABELS: Record<Advance, string> = { auto: 'Automatically', host: 'Host starts it' };

export const MODE_LABELS: Record<GameMode, string> = { casual: 'Casual', coop: 'Coop', years: 'Years' };

export const HOST_CONTROL_LABELS: Record<HostControls, string> = { on: 'Pause & skip', off: 'Off' };
export const VOTE_SKIP_LABELS: Record<VoteSkip, string> = { on: 'On', off: 'Off' };

/** What a player types in the chat to vote for skipping the song. */
export const SKIP_COMMAND = '/skip';
export const isSkipVote = (text: string) => text.trim().toLowerCase() === SKIP_COMMAND;

/** Votes it takes to skip a song: half the players, rounded up. */
export const votesToSkip = (players: number) => Math.max(1, Math.ceil(players / 2));

/** Players may vote to skip; with host controls only hosts skip, and never in Coop. */
export function canVoteSkip(room: Pick<Room, 'voteSkip' | 'hostControls' | 'mode'>): boolean {
  return room.voteSkip === 'on' && room.hostControls !== 'on' && room.mode !== 'coop';
}

/** The round is revealed and the room waits for a host to press Next round. */
export function waitsForHost(round: Round | null): boolean {
  return round?.phase === 'reveal' && round.nextAt === undefined;
}

/** Nothing happens until a host acts: the room waits for Next round or a Coop playlist's start, or the round is paused. */
export function onHold(round: Round | null): boolean {
  return waitsForHost(round) || round?.phase === 'spin' || (round?.phase === 'playing' && round.pausedAt !== undefined);
}

/** The player may pause the round for everyone and skip songs; never in Coop, where both would save a life. */
export function controlsRound(room: Pick<Room, 'hostId' | 'hosting' | 'hostControls' | 'mode'>, id: string): boolean {
  return room.hostControls === 'on' && room.mode !== 'coop' && canHost(room, id);
}

/** The player may start games, change the settings and reset the scores. */
export function canHost(room: Pick<Room, 'hostId' | 'hosting'>, id: string): boolean {
  return room.hostId === id || room.hosting === 'everyone';
}

export type RoomSettings = Omit<Room, 'code' | 'hostId' | 'players'>;

/** The settings, checked; null if any value is not one the room form offers. */
export function settingsFromOptions(o: RoomOptions): RoomSettings | null {
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 32) : '';
  const effects = validEffects(o.effects);
  // Browsers from before the modes and playlist picking send none: casual, picked by a host.
  const mode = o.mode ?? 'casual';
  const pick = o.pick ?? 'host';
  const ok = name && effects && ROUND_OPTIONS.includes(o.rounds) && SNIPPET_OPTIONS.includes(o.snippet) && MAX_PLAYER_OPTIONS.includes(o.maxPlayers)
    && Object.hasOwn(GUESS_LABELS, o.guess) && Object.hasOwn(HOSTING_LABELS, o.hosting) && Object.hasOwn(ADVANCE_LABELS, o.advance)
    && Object.hasOwn(HOST_CONTROL_LABELS, o.hostControls) && Object.hasOwn(VOTE_SKIP_LABELS, o.voteSkip) && playlists.some((p) => p.id === o.playlistId) && Object.hasOwn(MODE_LABELS, mode) && Object.hasOwn(PICK_LABELS, pick);
  if (!ok) return null;
  // Year guessing can't play a decade playlist (game/years.ts); the room form switches to Random too.
  const playlistId = mode === 'years' && !isYearPlaylist(o.playlistId) ? 'random' : o.playlistId;
  return {
    name, playlistId, rounds: Number(o.rounds), snippet: Number(o.snippet),
    guess: o.guess, hosting: o.hosting, advance: o.advance, hostControls: o.hostControls,
    voteSkip: o.hostControls === 'on' ? 'off' : o.voteSkip, effects: effects!, maxPlayers: Number(o.maxPlayers), mode, pick
  };
}

/** A room's settings as the room form holds them. */
export function optionsOf(room: Room | RoomSettings): RoomOptions {
  return {
    name: room.name, playlistId: room.playlistId, rounds: String(room.rounds), snippet: String(room.snippet),
    // Rooms opened before these settings existed have neither.
    guess: room.guess ?? 'separate', hosting: room.hosting ?? 'host', advance: room.advance ?? 'auto',
    hostControls: room.hostControls ?? 'off', voteSkip: room.voteSkip ?? 'off',
    effects: room.effects ?? NO_EFFECTS, maxPlayers: String(room.maxPlayers), mode: room.mode ?? 'casual', pick: room.pick ?? 'host'
  };
}
