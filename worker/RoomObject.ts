// One online room: a Durable Object per room code. It keeps the players, the chat and the
// rounds, and every player's browser holds a WebSocket to it (see src/game/protocol.ts).
//
// The game rules live here, not in the browsers: the server checks each chat message against
// the answer, so a correct guess is never sent to anyone, and the answer itself only leaves the
// server at the reveal. Round timers are Durable Object alarms.
//
// Each round's 30-second Apple Music preview is looked up when the round starts (or, for the
// next round, during the reveal). Players get an anonymous address, /api/rooms/:code/audio/:round,
// which worker/index.ts streams from Apple after asking audioFor() whether that round is current.
//
// The object uses the WebSocket Hibernation API: between messages Cloudflare may evict it from
// memory while the sockets stay open, so the state is saved to storage after every change and
// loaded again in the constructor.
import { DurableObject } from 'cloudflare:workers';
import { playlistById, playlists } from '../src/data/demo';
import { isCorrectGuess } from '../src/game/guess';
import { gameOrder, lookupPreview, REVEAL_SECONDS, snippetOffset } from '../src/game/preview';
import { CODE_PATTERN, type ClientMessage, type ServerMessage, type WireChat, type WireRoom, type WireRound } from '../src/game/protocol';
import type { Room, RoomOptions, Round, Track } from '../src/types';
import type { Env } from './index';

/** A room nobody is connected to is deleted after this long. */
const IDLE_MS = 60 * 60 * 1000;
const CHAT_LIMIT = 200;
const MAX_MESSAGE_BYTES = 4096;

interface Player {
  id: string;
  /** Secret from the player's browser; lets them rejoin after a reload. Never sent to others. */
  token: string;
  name: string;
  ready: boolean;
}

interface State {
  code: string;
  room: Omit<Room, 'players'> | null;
  players: Player[];
  chat: WireChat[];
  round: Round | null;
  /** The playlist's songs in this game's order. */
  order: Track[];
  /** Apple's preview address per round number, for the current and the next round. Never sent to players. */
  previews: Record<number, string>;
  lastActive: number;
}

interface Attachment {
  playerId: string;
}

const emptyState = (code = ''): State => ({ code, room: null, players: [], chat: [], round: null, order: [], previews: {}, lastActive: Date.now() });
const newId = () => crypto.randomUUID().slice(0, 8);
const cleanName = (name: unknown, fallback: string) => (typeof name === 'string' ? name.trim().slice(0, 20) : '') || fallback;


/** The room settings from the Create screen, checked; null if any value is not one the screen offers. */
function roomFromOptions(o: RoomOptions, code: string): Omit<Room, 'players'> | null {
  const rounds = Number(o.rounds), snippet = Number(o.snippet), maxPlayers = Number(o.maxPlayers);
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 32) : '';
  if (!name || ![5, 10, 15, 20].includes(rounds) || ![10, 20, 30].includes(snippet) || ![4, 8, 12].includes(maxPlayers)) return null;
  if (o.mode !== 'covers' && o.mode !== 'typed') return null;
  if (!playlists.some((p) => p.id === o.playlistId)) return null;
  return { name, code, hostId: '', playlistId: o.playlistId, rounds, mode: o.mode, snippet, maxPlayers };
}

export class RoomObject extends DurableObject<Env> {
  private s: State = emptyState();
  /** True while a game is starting: the first preview lookup can take a moment. */
  private starting = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      // Spread over an empty state, so rooms saved by an older version get any new fields.
      this.s = { ...emptyState(), ...(await ctx.storage.get<State>('state')) };
    });
    // Browsers ping every 30 s to keep the connection alive; answer without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  // ---- Connections -----------------------------------------------------------

  async fetch(request: Request): Promise<Response> {
    const code = new URL(request.url).pathname.split('/')[3] ?? '';
    if (!CODE_PATTERN.test(code)) return new Response('Bad room code', { status: 400 });
    if (!this.s.code) this.s.code = code;
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    if (typeof data !== 'string' || data.length > MAX_MESSAGE_BYTES) return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data) as ClientMessage;
    } catch {
      return;
    }
    if (msg.type === 'hello') return this.hello(ws, msg);

    const player = this.playerOf(ws);
    if (!player) return;
    switch (msg.type) {
      case 'chat': {
        const text = typeof msg.text === 'string' ? msg.text.trim().slice(0, 200) : '';
        if (text) await this.chat(ws, player, text);
        break;
      }
      case 'ready':
        player.ready = !!msg.ready;
        this.broadcastRoom();
        break;
      case 'rename':
        player.name = cleanName(msg.name, player.name);
        this.broadcastRoom();
        break;
      case 'start':
        if (player.id === this.s.room?.hostId) await this.startGame(player);
        break;
      case 'leave':
        return this.leave(player);
    }
    await this.save();
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    try {
      ws.close(1000, 'Closed');
    } catch {
      // Already closed.
    }
    if (!this.s.room) return;
    this.broadcastRoom(ws);
    await this.save(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  private async hello(ws: WebSocket, msg: Extract<ClientMessage, { type: 'hello' }>) {
    const token = typeof msg.token === 'string' ? msg.token.slice(0, 64) : '';
    if (token.length < 16) return this.reject(ws, 'bad_request', 'Your browser didn’t send a player token.');
    const name = cleanName(msg.name, 'Player');
    let player = this.s.players.find((p) => p.token === token);

    if (!this.s.room) {
      if (!msg.create) return this.reject(ws, 'not_found', `There’s no room with code ${this.s.code}. Check the code with your host.`);
      const room = roomFromOptions(msg.create, this.s.code);
      if (!room) return this.reject(ws, 'bad_request', 'Those room settings aren’t valid.');
      player = { id: newId(), token, name, ready: true };
      this.s = { ...emptyState(this.s.code), room: { ...room, hostId: player.id }, players: [player] };
      this.event('{who} opened the room', player);
    } else if (!player) {
      // A rejoining player is found by token above, so a create here means the code is in use.
      if (msg.create) return this.reject(ws, 'taken', 'That room code is already in use.');
      if (this.s.players.length >= this.s.room.maxPlayers) return this.reject(ws, 'full', `${this.s.room.name} is full.`);
      player = { id: newId(), token, name, ready: false };
      this.s.players.push(player);
      this.event('{who} joined', player);
    } else {
      player.name = name;
    }

    ws.serializeAttachment({ playerId: player.id } satisfies Attachment);
    this.send(ws, { type: 'welcome', you: player.id, room: this.wireRoom(), round: this.wireRound(), chat: this.s.chat, now: Date.now() });
    this.broadcastRoom();
    await this.save();
  }

  private async leave(player: Player) {
    const room = this.s.room!;
    this.s.players = this.s.players.filter((p) => p !== player);
    for (const ws of this.ctx.getWebSockets()) {
      if (this.attachment(ws)?.playerId === player.id) {
        ws.serializeAttachment(null);
        ws.close(1000, 'Left the room');
      }
    }
    if (!this.s.players.length) {
      // The last player left: the room is gone.
      await this.ctx.storage.deleteAll();
      this.s = emptyState(this.s.code);
      return;
    }
    this.event('{who} left', player);
    if (room.hostId === player.id) {
      const host = this.s.players[0]!;
      room.hostId = host.id;
      this.event('{who} is the host now', host);
    }
    this.broadcastRoom();
    await this.save();
  }

  // ---- Chat and guesses --------------------------------------------------------

  private async chat(ws: WebSocket, player: Player, text: string) {
    const r = this.s.round;
    if (r?.phase === 'playing' && isCorrectGuess(text, r.track)) {
      if (r.solved.includes(player.id)) {
        // Only the sender sees this; the message itself goes nowhere.
        this.send(ws, { type: 'chat', entry: { id: newId(), kind: 'event', text: 'Hidden, so you don’t give the answer away', time: Date.now() } });
      } else {
        await this.solve(player);
      }
      return;
    }
    const guessing = r?.phase === 'playing' && !r.solved.includes(player.id);
    this.post({ kind: guessing ? 'guess' : 'message', playerId: player.id, name: player.name, text });
  }

  private post(entry: Omit<WireChat, 'id' | 'time'>) {
    const full: WireChat = { ...entry, id: newId(), time: Date.now() };
    this.s.chat = [...this.s.chat, full].slice(-CHAT_LIMIT);
    this.broadcast({ type: 'chat', entry: full });
  }

  private event(text: string, about?: Player, tone?: WireChat['tone']) {
    this.post({ kind: 'event', text, tone, playerId: about?.id, name: about?.name });
  }

  // ---- Rounds --------------------------------------------------------------------

  private async startGame(host: Player) {
    if (this.s.round || !this.s.room || this.starting) return;
    this.starting = true;
    try {
      this.s.order = gameOrder(playlistById(this.s.room.playlistId).tracks);
      this.s.previews = {};
      this.event('{who} started the game', host);
      await this.beginRound(1);
    } finally {
      this.starting = false;
    }
  }

  private trackFor(n: number): Track {
    return this.s.order[(n - 1) % this.s.order.length]!;
  }

  /** Looks up round n's preview unless it already is; true if the song has one. */
  private async preparePreview(n: number): Promise<boolean> {
    if (!this.s.previews[n]) {
      const id = this.trackFor(n).apple?.id;
      const url = id ? await lookupPreview(id) : null;
      if (url) this.s.previews[n] = url;
    }
    return !!this.s.previews[n];
  }

  private audioPath(n: number): string {
    return `/api/rooms/${this.s.code}/audio/${n}`;
  }

  private async beginRound(n: number) {
    const room = this.s.room!;
    const playlist = playlistById(room.playlistId);
    const track = this.trackFor(n);
    const hasAudio = await this.preparePreview(n);
    for (const key of Object.keys(this.s.previews)) if (Number(key) < n) delete this.s.previews[Number(key)];
    this.s.round = {
      number: n, total: room.rounds, track, art: playlist.art,
      startedAt: Date.now(), length: room.snippet, solved: [], phase: 'playing',
      audio: hasAudio ? { src: this.audioPath(n), offset: snippetOffset(room.snippet) } : undefined
    };
    this.event(`Round ${n} of ${room.rounds} — name that tune`);
    this.broadcastRound();
  }

  private async solve(player: Player) {
    const r = this.s.round!;
    r.solved = [...r.solved, player.id];
    this.event('{who} guessed it', player, 'correct');
    this.broadcastRound();
    const online = this.connectedIds();
    if ([...online].every((id) => r.solved.includes(id))) await this.reveal();
  }

  private async reveal() {
    const r = this.s.round;
    if (!r || r.phase !== 'playing') return;
    r.phase = 'reveal';
    r.nextAt = Date.now() + REVEAL_SECONDS * 1000;
    this.event(`It was “${r.track.title}” by ${r.track.artist}`, undefined, 'reveal');
    if (!r.solved.length) this.event('Nobody got this one');
    this.broadcastRound();
    // Look up the next song now, so players can load it during the reveal.
    if (r.number < r.total && (await this.preparePreview(r.number + 1)) && this.s.round === r) {
      r.nextAudio = this.audioPath(r.number + 1);
      this.broadcastRound();
    }
  }

  private async next() {
    const r = this.s.round!;
    if (r.number < r.total) {
      await this.beginRound(r.number + 1);
    } else {
      this.s.round = null;
      this.event(`Game over after ${r.total} rounds. Thanks for playing!`);
      this.broadcastRound();
    }
  }

  async alarm(): Promise<void> {
    const r = this.s.round;
    const now = Date.now() + 100; // Alarms can fire a moment early.
    if (r?.phase === 'playing' && now >= r.startedAt + r.length * 1000) await this.reveal();
    else if (r?.phase === 'reveal' && now >= (r.nextAt ?? 0)) await this.next();
    else if (!r && this.connectedIds().size === 0) {
      await this.ctx.storage.deleteAll();
      this.s = emptyState(this.s.code);
      return;
    }
    await this.save();
  }

  // ---- Audio -------------------------------------------------------------------

  /**
   * Apple's preview address for round n, if players may load it now: the round being played or
   * revealed, or the next one during the reveal. Called by worker/index.ts (RPC).
   */
  async audioFor(n: number): Promise<string | null> {
    const r = this.s.round;
    if (!r || !(n === r.number || (r.phase === 'reveal' && n === r.number + 1))) return null;
    return this.s.previews[n] ?? null;
  }

  // ---- State -----------------------------------------------------------------

  /** Saves the state and sets the alarm for the next thing that has to happen on its own. */
  private async save(closing?: WebSocket) {
    if (!this.s.room) return;
    const r = this.s.round;
    const connected = this.connectedIds(closing).size > 0;
    if (connected || r) this.s.lastActive = Date.now();
    await this.ctx.storage.put('state', this.s);

    let at: number | null = null;
    if (r?.phase === 'playing') at = r.startedAt + r.length * 1000;
    else if (r?.phase === 'reveal') at = r.nextAt ?? Date.now();
    else if (!connected) at = this.s.lastActive + IDLE_MS;
    if (at === null) await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(at);
  }

  private attachment(ws: WebSocket): Attachment | null {
    return ws.deserializeAttachment() as Attachment | null;
  }

  private playerOf(ws: WebSocket): Player | undefined {
    const id = this.attachment(ws)?.playerId;
    return id ? this.s.players.find((p) => p.id === id) : undefined;
  }

  private connectedIds(except?: WebSocket): Set<string> {
    const ids = new Set<string>();
    for (const ws of this.ctx.getWebSockets()) {
      const id = ws === except ? undefined : this.attachment(ws)?.playerId;
      if (id) ids.add(id);
    }
    return ids;
  }

  private wireRoom(except?: WebSocket): WireRoom {
    const online = this.connectedIds(except);
    return {
      ...this.s.room!,
      players: this.s.players.map((p) => ({ id: p.id, name: p.name, ready: p.ready, connected: online.has(p.id) }))
    };
  }

  private wireRound(): WireRound | null {
    const r = this.s.round;
    if (!r) return null;
    const { track, art, ...rest } = r;
    return r.phase === 'reveal' ? { ...rest, track, art } : rest;
  }

  // ---- Sending -----------------------------------------------------------------

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // The socket closed meanwhile; webSocketClose cleans up.
    }
  }

  private broadcast(msg: ServerMessage, except?: WebSocket) {
    const data = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except || !this.attachment(ws)) continue;
      try {
        ws.send(data);
      } catch {
        // As above.
      }
    }
  }

  private broadcastRoom(except?: WebSocket) {
    if (this.s.room) this.broadcast({ type: 'room', room: this.wireRoom(except) }, except);
  }

  private broadcastRound() {
    this.broadcast({ type: 'round', round: this.wireRound() });
  }

  private reject(ws: WebSocket, code: Extract<ServerMessage, { type: 'error' }>['code'], message: string) {
    this.send(ws, { type: 'error', code, message });
    ws.close(1008, code);
  }
}
