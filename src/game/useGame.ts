// The demo room's chat and rounds, played offline: the other players are
// simulated, posting a few guesses each round, and some of them get it right. Online rooms run
// the same rules on the server (worker/RoomObject.ts).
//
// Chat rule: while a round is playing, every message is a guess. Wrong guesses show up in the
// chat; a correct one never does. The chat says "Priya guessed it" instead.
import { useEffect, useReducer, useRef } from 'react';
import type { ChatEntry } from '../components/chat/ChatMessage';
import { DEMO_CODE, demoChat, guessPhrases, playlistById, stumpedPhrases } from '../data/demo';
import { ME, type Room, type Round, type Track } from '../types';
import { isCorrectGuess } from './guess';

/** How long the answer stays up before the next round. */
const REVEAL_MS = 5000;
/** A simulated host starts this long after you are ready. */
const HOST_START_MS = 2000;
const CHAT_LIMIT = 200;

interface Scheduled {
  at: number;
  run: () => void;
}

interface GameState {
  chat: ChatEntry[];
  round: Round | null;
  /** The playlist's songs in this game's order. */
  order: Track[];
  /** Simulated players' messages, waiting for their time. */
  queue: Scheduled[];
}

export interface Game {
  chat: ChatEntry[];
  round: Round | null;
  sendChat(text: string): void;
  startGame(): void;
}

let nextId = 0;
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]!;
const between = (min: number, max: number) => min + Math.random() * Math.max(0, max - min);

function shuffle<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * @param onStart Called when a simulated host starts the game, so the app can mark everyone ready.
 */
export function useGame(room: Room | null, myName: string, onStart: () => void): Game {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  // Mutable game state; the timers below read and change it, then re-render.
  const g = useRef<GameState>({ chat: [], round: null, order: [], queue: [] }).current;
  const latest = useRef({ room, myName, onStart });
  latest.current = { room, myName, onStart };

  const nameOf = (id: string) =>
    id === ME ? latest.current.myName : latest.current.room?.players.find((p) => p.id === id)?.name ?? 'Someone';

  function post(entry: Omit<ChatEntry, 'id' | 'time'>, time = Date.now()) {
    g.chat = [...g.chat, { ...entry, id: 'c' + ++nextId, time }].slice(-CHAT_LIMIT);
    rerender();
  }

  const event = (text: string, tone?: ChatEntry['tone']) => post({ kind: 'event', text, tone });

  // ---- Rounds ----

  function startGame() {
    const { room } = latest.current;
    if (!room || g.round) return;
    g.order = shuffle(playlistById(room.playlistId).tracks);
    event(room.hostId === ME ? 'You started the game' : `${nameOf(room.hostId)} started the game`);
    beginRound(1);
  }

  function beginRound(n: number) {
    const { room } = latest.current;
    if (!room) return;
    const playlist = playlistById(room.playlistId);
    const track = g.order[(n - 1) % g.order.length]!;
    const startedAt = Date.now();
    g.round = { number: n, total: room.rounds, track, art: playlist.art, startedAt, length: room.snippet, solved: [], phase: 'playing' };
    event(`Round ${n} of ${room.rounds} — name that tune`);
    const decoys = playlist.tracks.filter((t) => !isCorrectGuess(t.title, track));
    g.queue = room.players.filter((p) => p.id !== ME).flatMap((p) => simulatedGuesses(p.id, n, decoys));
  }

  /** One to three messages from a simulated player; with a 60% chance the last one is right. */
  function simulatedGuesses(id: string, n: number, decoys: Track[]): Scheduled[] {
    const r = g.round!;
    const knows = Math.random() < 0.6;
    const tries = 1 + Math.floor(Math.random() * 3);
    const times = Array.from({ length: tries }, () => r.startedAt + between(2, r.length - 1.5) * 1000).sort((a, b) => a - b);
    return times.map((at, i) => ({
      at,
      run: () => {
        const now = g.round;
        if (!now || now.number !== n || now.phase !== 'playing' || now.solved.includes(id)) return;
        if (knows && i === tries - 1) {
          solve(id);
        } else if (Math.random() < 0.2) {
          post({ kind: 'message', author: nameOf(id), text: pick(stumpedPhrases) });
        } else {
          const text = pick(guessPhrases).replace('{title}', pick(decoys).title);
          post({ kind: 'guess', author: nameOf(id), text: Math.random() < 0.4 ? text.toLowerCase() : text });
        }
      }
    }));
  }

  function solve(id: string) {
    const r = g.round!;
    g.round = { ...r, solved: [...r.solved, id] };
    event(id === ME ? 'You guessed it!' : `${nameOf(id)} guessed it`, 'correct');
    const players = latest.current.room?.players.length ?? 0;
    if (g.round.solved.length >= players) reveal();
  }

  function reveal() {
    const r = g.round;
    if (!r || r.phase !== 'playing') return;
    g.round = { ...r, phase: 'reveal', nextAt: Date.now() + REVEAL_MS };
    g.queue = [];
    event(`It was “${r.track.title}” by ${r.track.artist}`, 'reveal');
    if (!r.solved.length) event('Nobody got this one');
  }

  function next() {
    const r = g.round!;
    if (r.number < r.total) {
      beginRound(r.number + 1);
    } else {
      g.round = null;
      event(`Game over after ${r.total} rounds. Thanks for playing!`);
    }
  }

  // ---- Chat ----

  function sendChat(text: string) {
    const { room, myName } = latest.current;
    if (!room) return;
    const r = g.round;
    if (r?.phase === 'playing' && isCorrectGuess(text, r.track)) {
      if (r.solved.includes(ME)) event('Hidden, so you don’t give the answer away');
      else solve(ME);
      return;
    }
    const guessing = r?.phase === 'playing' && !r.solved.includes(ME);
    post({ kind: guessing ? 'guess' : 'message', author: myName, text, mine: true });
  }

  // ---- Effects ----

  // A new room starts a new chat.
  useEffect(() => {
    g.round = null;
    g.queue = [];
    g.chat = [];
    if (room) {
      const now = Date.now();
      if (room.code === DEMO_CODE) {
        for (const m of demoChat) {
          const player = room.players.find((p) => p.id === m.playerId);
          if (player) post({ kind: 'message', author: player.name, text: m.text }, now - m.secondsAgo * 1000);
        }
      }
      event(room.hostId === ME ? `You opened ${room.name} · code ${room.code}` : `You joined ${room.name}`);
    }
    rerender();
  }, [room?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  // One clock drives the simulated players, the end of each round and the LCD timer.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      const due = g.queue.filter((a) => a.at <= t);
      if (due.length) {
        g.queue = g.queue.filter((a) => a.at > t);
        due.forEach((a) => a.run());
      }
      const r = g.round;
      if (r?.phase === 'playing' && t >= r.startedAt + r.length * 1000) reveal();
      else if (r?.phase === 'reveal' && t >= (r.nextAt ?? 0)) next();
      if (g.round) rerender();
    }, 250);
    return () => window.clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A simulated host starts the game once you are ready.
  const hostIsSimulated = !!room && room.hostId !== ME;
  const ready = !!room?.players.find((p) => p.id === ME)?.ready;
  useEffect(() => {
    if (!hostIsSimulated || !ready || g.round) return;
    const timer = window.setTimeout(() => {
      const { room, onStart } = latest.current;
      if (!room || g.round) return;
      onStart();
      post({ kind: 'message', author: nameOf(room.hostId), text: 'Everyone’s ready, here we go!' });
      startGame();
    }, HOST_START_MS);
    return () => window.clearTimeout(timer);
  }, [hostIsSimulated, ready, room?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  return { chat: g.chat, round: g.round, sendChat, startGame };
}
