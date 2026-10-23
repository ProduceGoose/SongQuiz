// An online room: a WebSocket to the room's Durable Object (worker/RoomObject.ts), reconnecting
// after drops. It turns what the server sends into the same Room, Round and chat entries the demo
// room uses, with your own player id swapped for ME, so the screens don't care which it is.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ChatEntry } from '../components/chat/ChatMessage';
import { ME, type Room, type RoomOptions, type Round, type RunResult, type Session } from '../types';
import type { ClientMessage, ServerMessage, WireChat, WireRoom, WireRound } from './protocol';
import { NO_EFFECTS } from './effects';
import type { Scores } from './scoring';

export interface OnlineTarget {
  code: string;
  /** Set when creating the room; joining sends no options. */
  create?: RoomOptions;
}

export type OnlineStatus = 'connecting' | 'open' | 'reconnecting';

export interface OnlineRoom {
  status: OnlineStatus;
  room: Room | null;
  chat: ChatEntry[];
  round: Round | null;
  scores: Scores | null;
  session: Session | null;
  /** The room's last finished Coop run. */
  run: RunResult | null;
  /** The room's best Coop run; null until one has finished. */
  bestRun: RunResult | null;
  sendChat(text: string): void;
  startGame(): void;
  nextRound(): void;
  endGame(): void;
  pauseRound(paused: boolean): void;
  skipRound(): void;
  resetSession(): void;
  /** Hosts, in Coop: starts the playlist the slot machine stopped on. */
  continueRun(): void;
  votePlaylist(playlistId: string): void;
  updateRoom(options: RoomOptions): void;
  setReady(ready: boolean): void;
  rename(name: string): void;
  /** Tells the server you left; the caller then drops the target. */
  leave(): void;
}

export interface OnlineCallbacks {
  /** First welcome on this target, with the room as you see it. */
  onJoined(room: Room): void;
  /** The server refused (no such room, code taken, room full) or can't be reached. */
  onFail(error: { code: string; message: string }): void;
}

const TOKEN_KEY = 'songquiz.token';
const PING_MS = 30_000;
const MAX_RETRIES = 8;

let fallbackToken: string | undefined;

/** A random secret that identifies this browser's player across reloads. */
function playerToken(): string {
  try {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) return saved;
    const token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    // No storage: a token per page load still works, it just can't rejoin after a reload.
    return (fallbackToken ??= crypto.randomUUID());
  }
}
/** Placeholder for the answer while a round plays; the server only sends it at the reveal. */
const UNKNOWN_TRACK = { title: '', artist: '', year: 0 };

interface Snapshot {
  you: string;
  room: WireRoom;
  round: WireRound | null;
  scores: Scores | null;
  run: RunResult | null;
  best: RunResult | null;
  session: Session;
  chat: WireChat[];
  /** Server clock minus this browser's clock, in ms. */
  offset: number;
}

export function useOnlineRoom(target: OnlineTarget | null, myName: string, callbacks: OnlineCallbacks): OnlineRoom {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<OnlineStatus>('connecting');
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const socket = useRef<WebSocket | null>(null);
  const latest = useRef({ myName, callbacks, target });
  latest.current = { myName, callbacks, target };

  function send(msg: ClientMessage) {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(msg));
  }

  // Connect while there is a target; reconnect with growing pauses if the connection drops.
  useEffect(() => {
    setSnap(null);
    if (!target) return;
    let stopped = false;
    let retries = 0;
    let joined = false;
    let retryTimer: number | undefined;

    function connect() {
      setStatus(retries ? 'reconnecting' : 'connecting');
      const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${scheme}://${location.host}/api/rooms/${target!.code}/ws`);
      socket.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'hello', token: playerToken(), name: latest.current.myName, create: target!.create } satisfies ClientMessage));
      };

      ws.onmessage = (e) => {
        if (e.data === 'pong') return;
        const msg = JSON.parse(e.data as string) as ServerMessage;
        switch (msg.type) {
          case 'welcome':
            retries = 0;
            setStatus('open');
            setSnap({ you: msg.you, room: msg.room, round: msg.round, scores: msg.scores, run: msg.run ?? null, best: msg.best ?? null, session: msg.session, chat: msg.chat, offset: msg.now - Date.now() });
            if (!joined) {
              joined = true;
              latest.current.callbacks.onJoined(localRoom(msg.room, msg.you));
            }
            break;
          case 'room':
            setSnap((s) => s && { ...s, room: msg.room });
            break;
          case 'round':
            setSnap((s) => s && { ...s, round: msg.round, scores: msg.scores, run: msg.run ?? null, best: msg.best ?? null });
            break;
          case 'session':
            setSnap((s) => s && { ...s, session: msg.session });
            break;
          case 'chat':
            setSnap((s) => s && { ...s, chat: [...s.chat, msg.entry].slice(-200) });
            break;
          case 'error':
            stopped = true;
            latest.current.callbacks.onFail(msg);
            break;
        }
      };

      ws.onclose = () => {
        if (socket.current === ws) socket.current = null;
        if (stopped) return;
        retries++;
        if (retries > MAX_RETRIES) {
          latest.current.callbacks.onFail({ code: 'offline', message: 'Can’t reach the iQuiz server.' });
          return;
        }
        setStatus('reconnecting');
        retryTimer = window.setTimeout(connect, Math.min(500 * 2 ** retries, 8000));
      };
    }

    connect();
    const ping = window.setInterval(() => {
      if (socket.current?.readyState === WebSocket.OPEN) socket.current.send('ping');
    }, PING_MS);

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      window.clearInterval(ping);
      socket.current?.close(1000);
      socket.current = null;
    };
  }, [target?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render while a round is on, so the LCD timer and status bar count down.
  const roundOn = !!snap?.round;
  useEffect(() => {
    if (!roundOn) return;
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [roundOn]);

  const room = useMemo(() => (snap ? localRoom(snap.room, snap.you) : null), [snap?.room, snap?.you]); // eslint-disable-line react-hooks/exhaustive-deps
  const round = useMemo(() => (snap?.round ? localRound(snap.round, snap.you, snap.offset) : null), [snap?.round]); // eslint-disable-line react-hooks/exhaustive-deps
  const scores = useMemo(() => (snap?.scores ? localIds(snap.scores, snap.you) : null), [snap?.scores]); // eslint-disable-line react-hooks/exhaustive-deps
  const session = useMemo(() => (snap ? { ...snap.session, players: localIds(snap.session.players, snap.you) } : null), [snap?.session]); // eslint-disable-line react-hooks/exhaustive-deps
  const chat = useMemo(() => (snap ? snap.chat.map((w) => localChat(w, snap.you, snap.room)) : []), [snap?.chat, snap?.room]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status, room, chat, round, scores, session, run: snap?.run ?? null, bestRun: snap?.best ?? null,
    sendChat: (text) => send({ type: 'chat', text }),
    startGame: () => send({ type: 'start' }),
    nextRound: () => send({ type: 'next' }),
    endGame: () => send({ type: 'end' }),
    pauseRound: (paused) => send({ type: 'pause', paused }),
    skipRound: () => send({ type: 'skip' }),
    resetSession: () => send({ type: 'resetSession' }),
    continueRun: () => send({ type: 'continue' }),
    votePlaylist: (playlistId) => send({ type: 'vote', playlistId }),
    updateRoom: (options) => send({ type: 'updateRoom', options }),
    setReady: (ready) => send({ type: 'ready', ready }),
    rename: (name) => send({ type: 'rename', name }),
    leave: () => send({ type: 'leave' })
  };
}

// ---- From the server's view to yours ----

function localRoom(room: WireRoom, you: string): Room {
  const id = (p: string) => (p === you ? ME : p);
  return { ...room, hostId: id(room.hostId), players: room.players.map((p) => ({ ...p, id: id(p.id) })) };
}

function localRound(round: WireRound, you: string, offset: number): Round {
  const id = (p: string) => (p === you ? ME : p);
  return {
    ...round,
    track: round.track ?? UNKNOWN_TRACK,
    art: round.art ?? '',
    solvedTitle: round.solvedTitle.map(id),
    solvedArtist: round.solvedArtist.map(id),
    solvedBoth: round.solvedBoth.map(id),
    solvedAllArtists: (round.solvedAllArtists ?? []).map(id),
    effects: round.effects ?? NO_EFFECTS,
    skipVotes: (round.skipVotes ?? []).map(id),
    years: round.years && localIds(round.years, you),
    // Server times to this browser's clock.
    startedAt: round.startedAt - offset,
    pausedAt: round.pausedAt === undefined ? undefined : round.pausedAt - offset,
    revealedAt: round.revealedAt === undefined ? undefined : round.revealedAt - offset,
    nextAt: round.nextAt === undefined ? undefined : round.nextAt - offset,
    spin: round.spin && { ...round.spin, until: round.spin.until - offset },
    vote: round.vote && {
      ...round.vote, until: round.vote.until - offset,
      shownUntil: round.vote.shownUntil === undefined ? undefined : round.vote.shownUntil - offset,
      votes: Object.fromEntries(Object.entries(round.vote.votes).map(([p, v]) => [id(p), v]))
    }
  };
}

/** A record by player id, with your id as ME. */
function localIds<T>(byId: Record<string, T>, you: string): Record<string, T> {
  return Object.fromEntries(Object.entries(byId).map(([p, v]) => [p === you ? ME : p, v]));
}

function localChat(w: WireChat, you: string, room: WireRoom): ChatEntry {
  const mine = w.playerId !== undefined && w.playerId === you;
  const name = room.players.find((p) => p.id === w.playerId)?.name ?? w.name ?? 'Someone';
  if (w.kind === 'event') {
    return { id: w.id, kind: 'event', time: w.time, tone: w.tone, text: w.text.replace('{who}', mine ? 'You' : name) };
  }
  return { id: w.id, kind: w.kind, time: w.time, author: name, text: w.text, mine };
}
