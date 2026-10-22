// One online room: a Durable Object per room code. It keeps the players, the chat and the
// rounds, and every player's browser holds a WebSocket to it (see src/game/protocol.ts).
//
// The game rules live here, not in the browsers: the server checks each chat message against
// the answer, so a correct guess is never sent to anyone, and the answer itself only leaves the
// server at the reveal. It also keeps the points (src/game/scoring.ts). Round timers are Durable
// Object alarms.
//
// Each round's 30-second Apple Music preview is looked up when the round starts (or, for the
// next round, during the reveal). Players get an anonymous address,
// /api/rooms/:code/audio/:game/:round, which worker/index.ts streams from Apple after asking
// audioFor() whether that round is current. The game id is new for every game: round 1 of the next
// game has a different address, so browsers can't play the copy they kept of the last one.
//
// The object uses the WebSocket Hibernation API: between messages Cloudflare may evict it from
// memory while the sockets stay open, so the state is saved to storage after every change and
// loaded again in the constructor.
import { DurableObject } from 'cloudflare:workers';
import { playlistById } from '../src/data/demo';
import { checkGuess, type Named } from '../src/game/guess';
import { gameOrder, lookupPreview, previewKey, REVEAL_SECONDS, roundSeconds, snippetOffset } from '../src/game/preview';
// Saved by `npm run apple-music`: Apple refuses most lookups from Cloudflare (HTTP 403).
import savedPreviews from '../src/data/previews.json';
import { NO_EFFECTS, roundEffects, SPEED_RATES } from '../src/game/effects';
import { canHost, canVoteSkip, controlsRound, isSkipVote, onHold, settingsFromOptions, votesToSkip, waitsForHost } from '../src/game/rooms';
import { CODE_PATTERN, type ClientMessage, type ServerMessage, type WireChat, type WireRoom, type WireRound } from '../src/game/protocol';
import { addGame, allSolved, award, emptySession, gameResult, type Scores } from '../src/game/scoring';
import type { Room, Round, Session, Track } from '../src/types';
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
  /** Points in the current or last game; null before the first. */
  scores: Scores | null;
  /** Wins and points since the room was opened. */
  session: Session;
  /** The current or last game's id, in its audio addresses. */
  game: string;
  /** The playlist's songs in this game's order. */
  order: Track[];
  /** Apple's preview address per round number, for the current and the next round. Never sent to players. */
  previews: Record<number, string>;
  lastActive: number;
}

interface Attachment {
  playerId: string;
}

const emptyState = (code = ''): State => ({ code, room: null, players: [], chat: [], round: null, scores: null, session: emptySession(), game: '', order: [], previews: {}, lastActive: Date.now() });
const newId = () => crypto.randomUUID().slice(0, 8);
const cleanName = (name: unknown, fallback: string) => (typeof name === 'string' ? name.trim().slice(0, 20) : '') || fallback;


export class RoomObject extends DurableObject<Env> {
  private s: State = emptyState();
  /** True while a game is starting: the first preview lookup can take a moment. */
  private starting = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      // Spread over an empty state, so rooms saved by an older version get any new fields.
      this.s = { ...emptyState(), ...(await ctx.storage.get<State>('state')) };
      // A round saved before the guess modes can't go on.
      if (this.s.round && !this.s.round.guess) this.s.round = null;
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
        if (this.isHost(player)) await this.startGame(player);
        break;
      case 'next':
        if (this.isHost(player) && waitsForHost(this.s.round)) await this.next();
        break;
      case 'end':
        if (this.isHost(player) && this.s.round && !this.starting) this.endGame(player);
        break;
      case 'pause':
        if (this.controls(player)) this.pause(player, !!msg.paused);
        break;
      case 'skip':
        if (this.controls(player) && this.s.round?.phase === 'playing') {
          this.event('{who} skipped the song', player);
          await this.reveal();
        }
        break;
      case 'updateRoom':
        if (this.isHost(player)) this.updateRoom(ws, msg.options);
        break;
      case 'resetSession':
        if (this.isHost(player)) {
          this.s.session = emptySession();
          this.event('{who} reset the session scores', player);
          this.broadcastSession();
        }
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
      const settings = msg.create && typeof msg.create === 'object' ? settingsFromOptions(msg.create) : null;
      if (!settings) return this.reject(ws, 'bad_request', 'Those room settings aren’t valid.');
      player = { id: newId(), token, name, ready: true };
      this.s = { ...emptyState(this.s.code), room: { ...settings, code: this.s.code, hostId: player.id }, players: [player] };
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
    this.send(ws, { type: 'welcome', you: player.id, room: this.wireRoom(), round: this.wireRound(), scores: this.s.scores, session: this.wireSession(), chat: this.s.chat, now: Date.now() });
    this.broadcastRoom();
    await this.save();
  }

  /**
   * The host's new playlist and rules, between games; the name stays as the room was opened.
   * Anything else only gets a note back to the host.
   */
  private updateRoom(ws: WebSocket, options: unknown) {
    const room = this.s.room!;
    const settings = options && typeof options === 'object' ? settingsFromOptions(options as Parameters<typeof settingsFromOptions>[0]) : null;
    const note = (text: string) => this.send(ws, { type: 'chat', entry: { id: newId(), kind: 'event', text, time: Date.now() } });
    if (this.s.round || this.starting) return note('The settings can change once the game is over.');
    if (!settings) return note('Those room settings aren’t valid.');
    if (settings.maxPlayers < this.s.players.length) return note(`There are already ${this.s.players.length} players in the room.`);
    this.s.room = { ...room, ...settings, name: room.name, hostControls: room.hostControls };
    this.broadcastRoom();
  }

  /** Ends the game early: no result, and its points don't count for the session. */
  private endGame(player: Player) {
    this.s.round = null;
    this.s.scores = null;
    this.s.previews = {};
    this.event('{who} ended the game. Its points are gone.', player);
    this.broadcastRound();
  }

  /** Stops the round's clock for everyone, or starts it again where it stopped. */
  private pause(player: Player, paused: boolean) {
    const r = this.s.round;
    if (r?.phase !== 'playing' || paused === (r.pausedAt !== undefined)) return;
    if (paused) {
      r.pausedAt = Date.now();
      this.event('{who} paused the round', player);
    } else {
      r.startedAt += Date.now() - r.pausedAt!;
      delete r.pausedAt;
      this.event('{who} resumed the round', player);
    }
    this.broadcastRound();
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
    if (isSkipVote(text)) return this.voteSkip(ws, player);
    const r = this.s.round;
    const named = r?.phase === 'playing' ? checkGuess(text, r.track) : null;
    if (named && (named.title || named.artist)) {
      if (!(await this.score(player, named))) {
        // Only the sender sees this; the message itself goes nowhere.
        this.send(ws, { type: 'chat', entry: { id: newId(), kind: 'event', text: 'Hidden, so you don’t give the answer away', time: Date.now() } });
      }
      return;
    }
    const guessing = r?.phase === 'playing' && !allSolved(r, [player.id]);
    this.post({ kind: guessing ? 'guess' : 'message', playerId: player.id, name: player.name, text });
  }

  /** A /skip from a player: once half the players have voted, the song ends and the answer shows. */
  private async voteSkip(ws: WebSocket, player: Player) {
    const r = this.s.round;
    const note = (text: string) => this.send(ws, { type: 'chat', entry: { id: newId(), kind: 'event', text, time: Date.now() } });
    if (!this.s.room || !canVoteSkip(this.s.room)) return note('Voting to skip is off in this room.');
    if (r?.phase !== 'playing') return note('There’s no song to skip right now.');
    const votes = r.skipVotes ?? [];
    if (votes.includes(player.id)) return note('You already voted to skip this song.');
    r.skipVotes = [...votes, player.id];
    const needed = votesToSkip(this.connectedIds().size);
    this.event(`{who} voted to skip · ${r.skipVotes.length} of ${needed}`, player);
    this.broadcastRound();
    if (r.skipVotes.length >= needed) {
      this.event('Skipped by vote');
      await this.reveal();
    }
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
      this.s.game = newId();
      this.s.scores = Object.fromEntries(this.s.players.map((p) => [p.id, 0]));
      this.event('{who} started the game', host);
      await this.beginRound(1);
    } finally {
      this.starting = false;
    }
  }

  private trackFor(n: number): Track {
    return this.s.order[(n - 1) % this.s.order.length]!;
  }

  /**
   * Finds round n's preview unless it already has it: the saved address, or else a lookup at
   * Apple, which works only now and then from Cloudflare. True if the song has one.
   */
  private async preparePreview(n: number): Promise<boolean> {
    if (!this.s.previews[n]) {
      const apple = this.trackFor(n).apple;
      const saved = apple ? (savedPreviews as Record<string, string>)[previewKey(apple)] : undefined;
      const url = saved ?? (apple ? await lookupPreview(apple) : null);
      if (url) this.s.previews[n] = url;
    }
    return !!this.s.previews[n];
  }

  private audioPath(n: number): string {
    return `/api/rooms/${this.s.code}/audio/${this.s.game}/${n}`;
  }

  private async beginRound(n: number) {
    const room = this.s.room!;
    const playlist = playlistById(room.playlistId);
    const track = this.trackFor(n);
    const hasAudio = await this.preparePreview(n);
    const effects = roundEffects(room.effects ?? NO_EFFECTS);
    for (const key of Object.keys(this.s.previews)) if (Number(key) < n) delete this.s.previews[Number(key)];
    this.s.round = {
      number: n, total: room.rounds, track, art: playlist.art,
      startedAt: Date.now(), phase: 'playing', length: roundSeconds(room.snippet), snippet: room.snippet,
      guess: room.guess ?? 'separate', effects, solvedTitle: [], solvedArtist: [], solvedBoth: [], solvedAllArtists: [], skipVotes: [],
      audio: hasAudio ? { src: this.audioPath(n), offset: snippetOffset(room.snippet * SPEED_RATES[effects.speed]) } : undefined
    };
    this.event(`Round ${n} of ${room.rounds} — name that tune`);
    this.broadcastRound();
  }

  /** Credits what the player named for the first time; false if it was nothing new. */
  private async score(player: Player, named: Named): Promise<boolean> {
    const got = award(this.s.round!, player.id, named);
    if (!got) return false;
    this.s.round = got.round;
    this.s.scores = { ...this.s.scores, [player.id]: (this.s.scores?.[player.id] ?? 0) + got.points };
    this.event(got.text, player, 'correct');
    this.broadcastRound();
    if (allSolved(got.round, this.connectedIds())) await this.reveal();
    return true;
  }

  private async reveal() {
    const r = this.s.round;
    if (!r || r.phase !== 'playing') return;
    r.phase = 'reveal';
    r.revealedAt = Date.now();
    if ((this.s.room?.advance ?? 'auto') === 'auto') r.nextAt = r.revealedAt + REVEAL_SECONDS * 1000;
    this.event(`It was “${r.track.title}” by ${r.track.artist}`, undefined, 'reveal');
    if (!r.solvedTitle.length && !r.solvedArtist.length) this.event('Nobody got this one');
    if (waitsForHost(r)) this.event(r.number < r.total ? 'Waiting for the host to start the next round' : 'Waiting for the host to show the result');
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
      this.s.session = addGame(this.s.session, this.s.scores ?? {}, this.s.players.map((p) => p.id));
      this.broadcastSession();
      this.event(`Game over after ${r.total} rounds. ${gameResult(this.s.scores ?? {}, this.s.players).text}`, undefined, 'reveal');
      this.broadcastRound();
    }
  }

  async alarm(): Promise<void> {
    const r = this.s.round;
    const now = Date.now() + 100; // Alarms can fire a moment early.
    if (r?.phase === 'playing' && r.pausedAt === undefined && now >= r.startedAt + r.length * 1000) await this.reveal();
    else if (r?.phase === 'reveal' && r.nextAt !== undefined && now >= r.nextAt) await this.next();
    else if ((!r || onHold(r)) && this.connectedIds().size === 0) {
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
  async audioFor(game: string, n: number): Promise<string | null> {
    const r = this.s.round;
    if (!r || game !== this.s.game || !(n === r.number || (r.phase === 'reveal' && n === r.number + 1))) return null;
    return this.s.previews[n] ?? null;
  }

  // ---- State -----------------------------------------------------------------

  /** Saves the state and sets the alarm for the next thing that has to happen on its own. */
  private async save(closing?: WebSocket) {
    if (!this.s.room) return;
    const r = this.s.round;
    const connected = this.connectedIds(closing).size > 0;
    // A room waiting for a host counts as idle, so it's deleted when nobody comes back.
    if (connected || (r && !onHold(r))) this.s.lastActive = Date.now();
    await this.ctx.storage.put('state', this.s);

    let at: number | null = null;
    if (r?.phase === 'playing' && r.pausedAt === undefined) at = r.startedAt + r.length * 1000;
    else if (r?.phase === 'reveal' && r.nextAt !== undefined) at = r.nextAt;
    else if (!connected) at = this.s.lastActive + IDLE_MS;
    if (at === null) await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(at);
  }

  private isHost(player: Player): boolean {
    return !!this.s.room && canHost(this.s.room, player.id);
  }

  private controls(player: Player): boolean {
    return !!this.s.room && controlsRound(this.s.room, player.id);
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

  /** The session for the players still in the room. */
  private wireSession(): Session {
    const players = Object.fromEntries(this.s.players.flatMap((p) => (this.s.session.players[p.id] ? [[p.id, this.s.session.players[p.id]!]] : [])));
    return { games: this.s.session.games, players };
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

  private broadcastSession() {
    this.broadcast({ type: 'session', session: this.wireSession() });
  }

  private broadcastRound() {
    this.broadcast({ type: 'round', round: this.wireRound(), scores: this.s.scores });
  }

  private reject(ws: WebSocket, code: Extract<ServerMessage, { type: 'error' }>['code'], message: string) {
    this.send(ws, { type: 'error', code, message });
    ws.close(1008, code);
  }
}
