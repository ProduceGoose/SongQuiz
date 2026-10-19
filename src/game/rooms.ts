// Room settings: the values the room form offers, and checking what a browser sends. Used by the
// screens and the server (worker/RoomObject.ts).
import { playlists } from '../data/demo';
import type { Advance, GuessMode, Hosting, Room, RoomOptions, Round } from '../types';

export const ROUND_OPTIONS = ['5', '10', '15', '20'];
export const SNIPPET_OPTIONS = ['0.1', '0.5', '1', '5', '10', '20', '30'];
export const MAX_PLAYER_OPTIONS = ['4', '8', '12'];
export const GUESS_LABELS: Record<GuessMode, string> = { separate: 'Title & artist', title: 'Title only', artist: 'Artist only', both: 'Need both' };
export const HOSTING_LABELS: Record<Hosting, string> = { host: 'One Host', everyone: 'Everyone' };
export const ADVANCE_LABELS: Record<Advance, string> = { auto: 'Automatically', host: 'Host starts it' };

/** The round is revealed and the room waits for a host to press Next round. */
export function waitsForHost(round: Round | null): boolean {
  return round?.phase === 'reveal' && round.nextAt === undefined;
}

/** The player may start games, change the settings and reset the scores. */
export function canHost(room: Pick<Room, 'hostId' | 'hosting'>, id: string): boolean {
  return room.hostId === id || room.hosting === 'everyone';
}

export type RoomSettings = Omit<Room, 'code' | 'hostId' | 'players'>;

/** The settings, checked; null if any value is not one the room form offers. */
export function settingsFromOptions(o: RoomOptions): RoomSettings | null {
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 32) : '';
  const ok = name && ROUND_OPTIONS.includes(o.rounds) && SNIPPET_OPTIONS.includes(o.snippet) && MAX_PLAYER_OPTIONS.includes(o.maxPlayers)
    && Object.hasOwn(GUESS_LABELS, o.guess) && Object.hasOwn(HOSTING_LABELS, o.hosting) && Object.hasOwn(ADVANCE_LABELS, o.advance) && playlists.some((p) => p.id === o.playlistId);
  if (!ok) return null;
  return {
    name, playlistId: o.playlistId, rounds: Number(o.rounds), snippet: Number(o.snippet),
    guess: o.guess, hosting: o.hosting, advance: o.advance, maxPlayers: Number(o.maxPlayers)
  };
}

/** A room's settings as the room form holds them. */
export function optionsOf(room: Room | RoomSettings): RoomOptions {
  return {
    name: room.name, playlistId: room.playlistId, rounds: String(room.rounds), snippet: String(room.snippet),
    // Rooms opened before these settings existed have neither.
    guess: room.guess ?? 'separate', hosting: room.hosting ?? 'host', advance: room.advance ?? 'auto', maxPlayers: String(room.maxPlayers)
  };
}
