// What the browser and a room's Durable Object (worker/RoomObject.ts) send each other over the
// room's WebSocket, as JSON. Player ids here are the server's; the browser swaps its own id for
// ME when it receives them, so the screens work the same online and in the demo room.
import type { Room, RoomOptions, Round, Track } from '../types';

/** A room as the server sends it. `connected` is false while a player's browser is away. */
export type WireRoom = Omit<Room, 'players'> & {
  players: Array<{ id: string; name: string; ready: boolean; connected: boolean }>;
};

/** A round as the server sends it: the track and its art only once the round is revealed. */
export type WireRound = Omit<Round, 'track' | 'art'> & { track?: Track; art?: string };

/**
 * A chat line. In event texts, {who} stands for the player in `playerId`, so the browser can say
 * "You guessed it" to that player and "Priya guessed it" to everyone else.
 */
export interface WireChat {
  id: string;
  kind: 'message' | 'guess' | 'event';
  playerId?: string;
  /** The player's name when it was sent, for players who have left since. */
  name?: string;
  text: string;
  time: number;
  tone?: 'neutral' | 'correct' | 'reveal';
}

export type ClientMessage =
  /** First message on every connection. `token` is a secret kept in the browser that identifies the player across reloads. */
  | { type: 'hello'; token: string; name: string; create?: RoomOptions }
  | { type: 'chat'; text: string }
  | { type: 'ready'; ready: boolean }
  | { type: 'start' }
  | { type: 'rename'; name: string }
  | { type: 'leave' };

export type ServerMessage =
  /** Sent after hello. `now` is the server's clock, to line up round timers. */
  | { type: 'welcome'; you: string; room: WireRoom; round: WireRound | null; chat: WireChat[]; now: number }
  | { type: 'room'; room: WireRoom }
  | { type: 'round'; round: WireRound | null }
  | { type: 'chat'; entry: WireChat }
  | { type: 'error'; code: 'not_found' | 'taken' | 'full' | 'bad_request'; message: string };

/** Room codes: 4 characters without look-alikes (no 0/O, 1/I). */
export const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_PATTERN = /^[A-Z0-9]{4}$/;
