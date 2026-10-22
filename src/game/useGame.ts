// The demo room's chat and rounds, played offline: the other players are
// simulated, posting a few guesses each round, and some of them get the title or the artist
// right. Online rooms run the same rules on the server (worker/RoomObject.ts).
//
// Chat rule: while a round is playing, every message is a guess. Wrong guesses show up in the
// chat; a correct one never does. The chat says "Priya named the artist · +3" instead.
import { useEffect, useReducer, useRef } from 'react';
import type { ChatEntry } from '../components/chat/ChatMessage';
import { DEMO_CODE, demoChat, guessPhrases, isSolo, playlistById, stumpedPhrases } from '../data/demo';
import { ME, type Room, type Round, type RunResult, type Session, type Track } from '../types';
import { checkGuess, type Named } from './guess';
import { NO_EFFECTS, roundEffects, SPEED_RATES } from './effects';
import { gameOrder, lookupPreview, REVEAL_SECONDS, roundSeconds, snippetOffset } from './preview';
import { canHost, canVoteSkip, controlsRound, isSkipVote, votesToSkip, waitsForHost } from './rooms';
import { addGame, allSolved, award, emptySession, gameResult, pointsText, type Scores } from './scoring';
import { effectsReel, hearts, LIVES, PLAYLISTS_PER_LEVEL, recordRun, SPIN_MS, spinReel, stageEffectsText, survivalPlan, type RunStage } from './survival';

const REVEAL_MS = REVEAL_SECONDS * 1000;
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
  /** Points in the current or last game; null before the first. */
  scores: Scores | null;
  /** Wins and points since you joined the room. */
  session: Session;
  /** The playlist's songs in this game's order. */
  order: Track[];
  /** Simulated players' messages, waiting for their time. */
  queue: Scheduled[];
  /** Apple preview addresses by round number, looked up as rounds come up. */
  previews: Map<number, Promise<string | null>>;
  /** The game is a survival run (game/survival.ts). */
  survival: boolean;
  /** Survival: the run's playlists with their levels, and each round's place among them (0-based, by round). */
  stages: RunStage[];
  stageOf: number[];
  lives: number;
  /** The last finished survival run. */
  run: RunResult | null;
}

export interface Game {
  chat: ChatEntry[];
  round: Round | null;
  scores: Scores | null;
  session: Session;
  run: RunResult | null;
  sendChat(text: string): void;
  startGame(): void;
  nextRound(): void;
  endGame(): void;
  pauseRound(paused: boolean): void;
  skipRound(): void;
  resetSession(): void;
  /** Survival: starts the playlist the slot machine stopped on. */
  continueRun(): void;
}

let nextId = 0;
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]!;
const between = (min: number, max: number) => min + Math.random() * Math.max(0, max - min);


/**
 * @param onStart Called when a simulated host starts the game, so the app can mark everyone ready.
 */
export function useGame(room: Room | null, myName: string, onStart: () => void): Game {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  // Mutable game state; the timers below read and change it, then re-render.
  const g = useRef<GameState>({ chat: [], round: null, scores: null, session: emptySession(), order: [], queue: [], previews: new Map(),
    survival: false, stages: [], stageOf: [], lives: LIVES, run: null
  }).current;
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

  /** Round n's preview address from Apple, looked up once. */
  function preview(n: number): Promise<string | null> {
    if (!g.previews.has(n)) {
      const apple = g.order[(n - 1) % g.order.length]?.apple;
      g.previews.set(n, apple ? lookupPreview(apple) : Promise.resolve(null));
    }
    return g.previews.get(n)!;
  }

  function startGame() {
    const { room } = latest.current;
    if (!room || g.round) return;
    g.survival = room.mode === 'survival';
    if (g.survival) {
      const plan = survivalPlan();
      g.stages = plan.stages;
      g.order = plan.order.map((p) => p.track);
      g.stageOf = plan.order.map((p) => p.stage);
      g.lives = LIVES;
    } else {
      g.order = gameOrder(playlistById(room.playlistId).tracks);
    }
    g.run = null;
    g.previews.clear();
    g.scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
    event(room.hostId === ME ? 'You started the game' : `${nameOf(room.hostId)} started the game`);
    beginRound(1);
  }

  /** Survival: round n's stage, 0-based, and whether it's the first song of a new playlist. */
  function stageAt(n: number) {
    const stage = g.stageOf[n - 1]!;
    return { stage, first: n === 1 || g.stageOf[n - 2] !== stage };
  }

  /** Round n; in a survival run, a new playlist first gets the slot machine (see play). */
  function beginRound(n: number) {
    if (g.survival && stageAt(n).first) spin(n);
    else play(n);
  }

  /** The round as it starts; survival rounds also carry the run's lives and stage. */
  function newRound(n: number, phase: Round['phase']): Round {
    const room = latest.current.room!;
    // A survival run takes each round from its stage's playlist and lasts as long as its songs.
    const stage = g.survival ? stageAt(n).stage : -1;
    const run = g.survival ? g.stages[stage]! : null;
    const playlist = run ? run.playlist : playlistById(room.playlistId);
    return {
      number: n, total: g.survival ? g.order.length : room.rounds, track: g.order[(n - 1) % g.order.length]!, art: playlist.art,
      startedAt: Date.now(), phase, length: roundSeconds(room.snippet), snippet: room.snippet, guess: room.guess,
      // A survival stage with effects has them on every song (or a fresh random mix on each).
      effects: run?.effects === 'random' ? roundEffects({ ...NO_EFFECTS, random: 'on' }) : run?.effects ?? roundEffects(room.effects ?? NO_EFFECTS),
      solvedTitle: [], solvedArtist: [], solvedBoth: [], solvedAllArtists: [], skipVotes: [],
      run: run ? {
        lives: g.lives, stage: stage + 1, stages: g.stages.length, level: run.level,
        levelStage: (stage % PLAYLISTS_PER_LEVEL) + 1, playlistId: playlist.id, playlistTitle: playlist.title
      } : undefined
    };
  }

  /** Survival's slot machine before a new playlist: no song yet; play(n) follows when it stops. */
  function spin(n: number) {
    const r = newRound(n, 'spin');
    const stage = g.stages[stageAt(n).stage]!;
    g.round = { ...r, spin: { reel: spinReel(stage.playlist), until: Date.now() + SPIN_MS, effects: stage.effects ? effectsReel(stage.effects) : undefined } };
    g.queue = [];
    // Looked up while the reel turns, so the song is ready when the player starts.
    void preview(n);
    const previous = n > 1 ? g.stages[g.stageOf[n - 2]!]! : null;
    if (previous && previous.level !== r.run!.level) event(`Level up! Now the ${r.run!.level.toLowerCase()} songs · ${hearts(g.lives)}`, 'correct');
    rerender();
  }

  /** The player starts the playlist the slot machine picked, once its reel has stopped. */
  function continueRun() {
    const r = g.round;
    if (r?.phase === 'spin' && Date.now() >= r.spin!.until) play(r.number);
  }

  function play(n: number) {
    const { room } = latest.current;
    if (!room) return;
    const round = newRound(n, 'playing');
    const { track } = round;
    const playlist = round.run ? g.stages[round.run.stage - 1]!.playlist : playlistById(room.playlistId);
    g.round = round;
    const offset = snippetOffset(room.snippet * SPEED_RATES[round.effects.speed]);
    void preview(n).then((src) => {
      // Only once it plays: a song on the slot machine's round would start too early.
      if (src && g.round?.number === n && g.round.phase !== 'spin') {
        g.round = { ...g.round, audio: { src, offset } };
        rerender();
      }
    });
    if (round.run) {
      const { level, levelStage } = round.run;
      if (stageAt(n).first) {
        const fx = stageEffectsText(g.stages[round.run.stage - 1]!.effects);
        event(`${level} ${levelStage} of ${PLAYLISTS_PER_LEVEL}: ${playlist.title}` + (fx ? ` · effects: ${fx}` : ''), 'reveal');
      }
      event(`Song ${n} — name that tune · ${hearts(g.lives)}`);
    } else {
      event(`Round ${n} of ${room.rounds} — name that tune`);
    }
    const wrong = (text: string) => { const c = checkGuess(text, track); return !c.title && !c.artist; };
    const decoys = playlist.tracks.filter((t) => wrong(t.title) && wrong(t.artist));
    g.queue = room.players.filter((p) => p.id !== ME).flatMap((p) => simulatedGuesses(p.id, n, decoys));
  }

  /**
   * A simulated player's messages: up to two wrong guesses, then the artist (70% chance; every
   * artist half the time, if the song has several) and the title (60% chance), sometimes both in
   * one message.
   */
  function simulatedGuesses(id: string, n: number, decoys: Track[]): Scheduled[] {
    const r = g.round!;
    const title = Math.random() < 0.6, artist = Math.random() < 0.7;
    const allArtists = artist && Math.random() < 0.5 && checkGuess(r.track.artist, r.track).allArtists;
    const right: Named[] = title && artist && Math.random() < 0.4
      ? [{ title: true, artist: true, allArtists }]
      : [...(artist ? [{ title: false, artist: true, allArtists }] : []), ...(title ? [{ title: true, artist: false, allArtists: false }] : [])];
    const misses = Math.floor(Math.random() * 3) + (right.length ? 0 : 1);
    const times = Array.from({ length: misses + right.length }, () => r.startedAt + between(2, r.length - 1.5) * 1000).sort((a, b) => a - b);
    return times.map((at, i) => ({
      at,
      run: () => {
        const now = g.round;
        if (!now || now.number !== n || now.phase !== 'playing') return;
        if (i >= misses) {
          score(id, right[i - misses]!);
        } else if (Math.random() < 0.2 || !decoys.length) {
          post({ kind: 'message', author: nameOf(id), text: pick(stumpedPhrases) });
        } else {
          const decoy = pick(decoys);
          const text = pick(guessPhrases).replace('{title}', Math.random() < 0.3 ? decoy.artist : decoy.title);
          post({ kind: 'guess', author: nameOf(id), text: Math.random() < 0.4 ? text.toLowerCase() : text });
        }
      }
    }));
  }

  /** Credits what the player named for the first time; false if it was nothing new. */
  function score(id: string, named: Named): boolean {
    const got = award(g.round!, id, named);
    if (!got) return false;
    g.round = got.round;
    g.scores = { ...g.scores, [id]: (g.scores?.[id] ?? 0) + got.points };
    event(got.text.replace('{who}', id === ME ? 'You' : nameOf(id)), 'correct');
    if (allSolved(g.round, latest.current.room?.players.map((p) => p.id) ?? [])) reveal();
    return true;
  }

  function reveal() {
    const r = g.round;
    if (!r || r.phase !== 'playing') return;
    const revealedAt = Date.now();
    const auto = (latest.current.room?.advance ?? 'auto') === 'auto';
    g.round = { ...r, phase: 'reveal', revealedAt, nextAt: auto ? revealedAt + REVEAL_MS : undefined };
    g.queue = [];
    event(`It was “${r.track.title}” by ${r.track.artist}`, 'reveal');
    if (r.number < r.total) {
      void preview(r.number + 1).then((src) => {
        if (src && g.round?.number === r.number && g.round.phase === 'reveal') {
          g.round = { ...g.round, nextAudio: src };
          rerender();
        }
      });
    }
    if (!r.solvedTitle.length && !r.solvedArtist.length) event('Nobody got this one');
    if (g.survival && !r.solvedTitle.includes(ME) && !r.solvedArtist.includes(ME)) {
      g.lives -= 1;
      g.round = { ...g.round, run: { ...r.run!, lives: g.lives } };
      event(g.lives ? `You lost a life · ${hearts(g.lives)}` : `No lives left · ${hearts(0)}`, 'reveal');
    }
    if (!auto) event(r.number < r.total ? 'Waiting for the host to start the next round' : 'Waiting for the host to show the result');
  }

  function next() {
    const r = g.round!;
    if (g.survival && (g.lives <= 0 || r.number >= r.total)) {
      finishRun(r);
    } else if (r.number < r.total) {
      beginRound(r.number + 1);
    } else {
      g.round = null;
      g.session = addGame(g.session, g.scores ?? {}, latest.current.room?.players.map((p) => p.id) ?? []);
      const players = (latest.current.room?.players ?? []).map((p) => ({ id: p.id, name: p.id === ME ? 'You' : p.name }));
      event(`Game over after ${r.total} rounds. ${gameResult(g.scores ?? {}, players).text}`, 'reveal');
    }
  }

  /** The end of a survival run: out of lives, or through the last playlist. */
  function finishRun(r: Round) {
    const points = g.scores?.[ME] ?? 0;
    const result = {
      outcome: g.lives > 0 ? 'cleared' as const : 'out' as const,
      songs: r.number, stage: r.run!.stage, stages: r.run!.stages, level: r.run!.level, playlistTitle: r.run!.playlistTitle, points
    };
    g.run = { ...result, best: recordRun(result) };
    g.round = null;
    g.session = addGame(g.session, g.scores ?? {}, [ME]);
    event((result.outcome === 'cleared'
      ? `You beat all three levels with ${pointsText(points)}!`
      : `Out of lives after ${result.songs} songs, at ${result.level} (${result.playlistTitle}) with ${pointsText(points)}.`)
      + (g.run.best ? ' A new best run!' : ''), 'reveal');
  }

  function nextRound() {
    const { room } = latest.current;
    if (room && canHost(room, ME) && waitsForHost(g.round)) next();
  }

  function endGame() {
    const { room } = latest.current;
    if (!room || !canHost(room, ME) || !g.round) return;
    g.round = null;
    g.scores = null;
    g.queue = [];
    event('You ended the game. Its points are gone.');
  }

  function pauseRound(paused: boolean) {
    const { room } = latest.current;
    const r = g.round;
    if (!room || !controlsRound(room, ME) || r?.phase !== 'playing' || paused === (r.pausedAt !== undefined)) return;
    if (paused) {
      g.round = { ...r, pausedAt: Date.now() };
      event('You paused the round');
    } else {
      // The clock and the simulated players carry on where they stopped.
      const held = Date.now() - r.pausedAt!;
      g.round = { ...r, startedAt: r.startedAt + held, pausedAt: undefined };
      g.queue = g.queue.map((a) => ({ ...a, at: a.at + held }));
      event('You resumed the round');
    }
  }

  function skipRound() {
    const { room } = latest.current;
    if (!room || !controlsRound(room, ME) || g.round?.phase !== 'playing') return;
    event('You skipped the song');
    reveal();
  }

  function resetSession() {
    const { room } = latest.current;
    if (!room || !canHost(room, ME)) return;
    g.session = emptySession();
    event('You reset the session scores');
  }

  // ---- Chat ----

  function sendChat(text: string) {
    const { room, myName } = latest.current;
    if (!room) return;
    const r = g.round;
    if (isSkipVote(text)) {
      if (!canVoteSkip(room)) event('Voting to skip is off in this room.');
      else if (r?.phase !== 'playing') event('There’s no song to skip right now.');
      else if (r.skipVotes.includes(ME)) event('You already voted to skip this song.');
      else {
        g.round = { ...r, skipVotes: [...r.skipVotes, ME] };
        const needed = votesToSkip(room.players.length);
        event(`You voted to skip · ${g.round.skipVotes.length} of ${needed}`);
        if (g.round.skipVotes.length >= needed) {
          event('Skipped by vote');
          reveal();
        }
      }
      return;
    }
    const named = r?.phase === 'playing' ? checkGuess(text, r.track) : null;
    if (named && (named.title || named.artist)) {
      if (!score(ME, named)) event('Hidden, so you don’t give the answer away');
      return;
    }
    const guessing = r?.phase === 'playing' && !allSolved(r, [ME]);
    post({ kind: guessing ? 'guess' : 'message', author: myName, text, mine: true });
  }

  // ---- Effects ----

  // A new room starts a new chat.
  useEffect(() => {
    g.round = null;
    g.scores = null;
    g.session = emptySession();
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
      event(isSolo(room) ? 'Solo game: just you and the music. Start it in the lobby.'
        : room.hostId === ME ? `You opened ${room.name} · code ${room.code}` : `You joined ${room.name}`);
    }
    rerender();
  }, [room?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  // One clock drives the simulated players, the end of each round and the LCD timer.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      const paused = g.round?.pausedAt !== undefined;
      const due = paused ? [] : g.queue.filter((a) => a.at <= t);
      if (due.length) {
        g.queue = g.queue.filter((a) => a.at > t);
        due.forEach((a) => a.run());
      }
      const r = g.round;
      // A spin waits for the player (continueRun) once its reel has stopped.
      if (r?.phase === 'playing' && !paused && t >= r.startedAt + r.length * 1000) reveal();
      else if (r?.phase === 'reveal' && r.nextAt !== undefined && t >= r.nextAt) next();
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

  return { chat: g.chat, round: g.round, scores: g.scores, session: g.session, run: g.run, sendChat, startGame, nextRound, endGame, pauseRound, skipRound, resetSession, continueRun };
}
