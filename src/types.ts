import type { ComponentType } from 'react';
import type { ChatEntry } from './components/chat/ChatMessage';

// ---- Music -------------------------------------------------------------------

export interface Track {
  title: string;
  artist: string;
  year: number;
  /** The song on Apple Music, from `npm run apple-music`. Without it the round has no sound. */
  apple?: {
    id: number;
    /** The song's Apple Music page. */
    url: string;
    /** Cover image URL with {size} where the size in px goes; see artworkUrl in data/demo.ts. */
    artwork: string;
    /** The Apple Music store the song is from when it isn't the US one, e.g. "de"; its preview is looked up there. */
    store?: string;
  };
}

export interface Playlist {
  id: string;
  title: string;
  era: string;
  level: 'Easy' | 'Medium' | 'Hard';
  /** Songs in the full playlist; `tracks` is a sample. */
  songs: number;
  description: string;
  tracks: Track[];
  /** Cover image URL. */
  art: string;
  /** "48 songs" */
  subtitle: string;
}

// ---- Rooms -------------------------------------------------------------------

/** The player using the app always has the id "you". */
export const ME = 'you';

export interface RoomPlayer {
  id: string;
  name: string;
  ready: boolean;
  /** Online rooms only: false while the player's browser is disconnected. */
  connected?: boolean;
}

/**
 * What players have to name. separate: the title and the artist each score on their own.
 * title / artist: only that one counts. both: points only once a player has named both.
 */
export type GuessMode = 'separate' | 'title' | 'artist' | 'both';

/** Who may start games, change the settings and reset the scores: the host, or everyone. */
export type Hosting = 'host' | 'everyone';

/** After a reveal, the next round starts by itself or when a host presses Next round. */
export type Advance = 'auto' | 'host';

/** Hosts can pause the round for everyone and skip a song. Chosen when the room is created. */
export type HostControls = 'on' | 'off';

/** Players can type /skip to vote a song away. Never on together with host controls. */
export type VoteSkip = 'on' | 'off';

/** Effects on a round's song (game/effects.ts). One choice per kind, so they stack across kinds only. */
export interface AudioEffects {
  /** fast and slow change the pitch too. */
  speed: 'normal' | 'fast' | 'slow';
  /** muffled: only the lows get through. telephone: only a narrow middle band. */
  tone: 'clean' | 'muffled' | 'telephone';
  distort: 'off' | 'on';
  /** A big hall around the song. Optional: rooms and rounds saved before it existed lack it. */
  reverb?: 'off' | 'on';
  /** An echo that repeats a few times. Optional like reverb. */
  delay?: 'off' | 'on';
}

/** A room's effects. With random on, each round gets its own mix and the others are ignored. */
export interface RoomEffects extends AudioEffects {
  random: 'off' | 'on';
}

/** A survival run's levels, easiest first; each plays that third of its playlists' songs. */
export type RunLevel = 'Easy' | 'Medium' | 'Hard';

/** How far a survival run (game/survival.ts) got. */
export interface RunResult {
  /** out: no lives left. cleared: through the last playlist. */
  outcome: 'out' | 'cleared';
  /** Songs played, the one that cost the last life included. */
  songs: number;
  /** 1-based stage reached, of `stages`, and its level. */
  stage: number;
  stages: number;
  level: RunLevel;
  playlistTitle: string;
  points: number;
  /** Better than every run before on this device. */
  best: boolean;
}

/** free: your own playlist and rules. survival: three lives through every playlist, easy to hard. */
export type SoloMode = 'free' | 'survival';

export interface Room {
  name: string;
  /** 4 letters or digits, e.g. "KX7Q". */
  code: string;
  hostId: string;
  playlistId: string;
  rounds: number;
  /** Snippet length in seconds: how long the song plays while players guess. */
  snippet: number;
  guess: GuessMode;
  hosting: Hosting;
  advance: Advance;
  hostControls: HostControls;
  voteSkip: VoteSkip;
  effects: RoomEffects;
  maxPlayers: number;
  players: RoomPlayer[];
  /** Solo games only: free play, or a survival run (game/survival.ts). Unset means free. */
  mode?: SoloMode;
}

/** What the Create screen collects. Numbers stay strings while they are segment values. */
export interface RoomOptions {
  name: string;
  playlistId: string;
  rounds: string;
  snippet: string;
  guess: GuessMode;
  hosting: Hosting;
  advance: Advance;
  hostControls: HostControls;
  voteSkip: VoteSkip;
  effects: RoomEffects;
  maxPlayers: string;
}

// ---- Game --------------------------------------------------------------------

/** Totals for a room since it was opened (or since the host last reset them). */
export interface Session {
  /** Games played to the end. */
  games: number;
  /** Per player id; a game won by a tie counts as a win for each winner. */
  players: Record<string, { wins: number; points: number }>;
}

export interface Round {
  /** 1-based. */
  number: number;
  total: number;
  /** The answer. Never shown before the reveal; in online rooms it is blank until then. */
  track: Track;
  /** Cover of the playlist the track is from, shown at the reveal. */
  art: string;
  /** Date.now() when the snippet started; moved on by the time spent paused. */
  startedAt: number;
  /** Date.now() when a host paused the round; unset while it runs. See roundElapsed. */
  pausedAt?: number;
  /** Guessing time in seconds; at least MIN_ROUND_SECONDS, longer if the snippet is. */
  length: number;
  /** How long the song plays while players guess, in seconds. */
  snippet: number;
  guess: GuessMode;
  /** What the song sounds like while players guess; at the reveal it plays clean. */
  effects: AudioEffects;
  /** Ids of the players who named the title, fastest first. */
  solvedTitle: string[];
  /** Ids of the players who named the artist, fastest first. */
  solvedArtist: string[];
  /** "both" rounds: ids of the players who have named both, fastest first. */
  solvedBoth: string[];
  /** Ids of the players who named every artist of a song with several, for a bonus point (see ALL_ARTISTS_BONUS). */
  solvedAllArtists: string[];
  /** Ids of the players who typed /skip this round. */
  skipVotes: string[];
  /** Survival runs: lives left and where in the run this round is. */
  run?: {
    lives: number;
    /** 1-based, of `stages`. */
    stage: number;
    stages: number;
    level: RunLevel;
    /** 1-based place of the stage in its level, e.g. the 2nd of 3 Easy playlists. */
    levelStage: number;
    playlistId: string;
    playlistTitle: string;
  };
  /**
   * Survival, at a new playlist: the slot machine's covers (playlist ids, the pick last) and when
   * the reel stops; then the player starts the playlist (AppApi.continueRun). A level's last
   * playlist also spins its effects: effect names, the stage's last ("Fast, reverb"). Only during
   * the "spin" phase.
   */
  spin?: { reel: string[]; until: number; effects?: string[] };
  /**
   * spin: survival's slot machine picks the next playlist; no song, no guesses yet. playing:
   * guesses count. reveal: the answer is shown until `nextAt`.
   */
  phase: 'spin' | 'playing' | 'reveal';
  /** Date.now() when the answer was shown. */
  revealedAt?: number;
  /** When the next round starts; unset during a reveal that waits for a host (see waitsForHost). */
  nextAt?: number;
  /**
   * The snippet: an audio address and where in it the round starts, in seconds. Online it is an
   * anonymous address on our server, so it doesn't give the song away. Missing when the song
   * has no preview.
   */
  audio?: { src: string; offset: number };
  /** During the reveal: the next round's audio address, to load ahead. */
  nextAudio?: string;
}

/** The round's song playing in this browser (game/useSnippet.ts). */
export interface Snippet {
  /** The round has a song to play. */
  available: boolean;
  playing: boolean;
  /** The browser refused to start the sound until the next click. */
  blocked: boolean;
  /** Pause or resume, for you only; resuming jumps back to where the round is. */
  toggle(): void;
  /** Starts the round's snippet again from its beginning, for you only. */
  replay(): void;
}

// ---- Settings ----------------------------------------------------------------

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  name: string;
  theme: Theme;
  volume: number;
  covers: 'on' | 'off';
}

// ---- Navigation --------------------------------------------------------------

export type ScreenName = 'home' | 'join' | 'create' | 'solo' | 'lobby' | 'playlists' | 'playlist' | 'scores' | 'settings';

export interface Route {
  name: ScreenName;
  /** A playlist id, for the playlist screen and to preselect one on Create. */
  id?: string;
}

/** The two lines shown in the toolbar's LCD. */
export interface LcdText {
  title: string;
  subtitle?: string;
}

/** App state and actions, handed to every screen as `app`. */
export interface AppApi {
  route: Route;
  room: Room | null;
  settings: Settings;
  query: string;
  playlistView: 'grid' | 'list';
  go(name: ScreenName, id?: string): void;
  /** Shows a message in the LCD for a few seconds. */
  flash(title: string, subtitle?: string): void;
  setQuery(query: string): void;
  setPlaylistView(view: 'grid' | 'list'): void;
  updateSettings(patch: Partial<Settings>): void;
  joinRoom(code: string, name: string): void;
  createRoom(options: RoomOptions): void;
  /** Hosts only (see canHost), between games: changes the room's playlist and rules (not its name). */
  updateRoom(options: RoomOptions): void;
  leaveRoom(): void;
  /** A game with only you, offline: no server, no room code. */
  playSolo(mode: SoloMode): void;
  toggleReady(): void;
  resetPrototype(): void;
  /** Set while you're in, or joining, an online room; null in the demo room or no room. */
  online: { code: string; status: 'connecting' | 'open' | 'reconnecting' } | null;
  /** The room chat, oldest first. */
  chat: ChatEntry[];
  /** The round being played or revealed; null between games. */
  round: Round | null;
  /** Points by player id in the room's current or last game; null before the first game. */
  scores: Record<string, number> | null;
  /** The room's wins and points since it was opened; null when you're not in a room. */
  session: Session | null;
  /** The last finished survival run in your solo game; null otherwise. */
  run: RunResult | null;
  /** Host only: sets the session's wins and points back to 0. */
  resetSession(): void;
  /** Survival: starts the playlist the slot machine stopped on. */
  continueRun(): void;
  /** Posts to the room chat. During a round it is also a guess; a correct title or artist stays hidden. */
  sendChat(text: string): void;
  startGame(): void;
  /** Hosts only, while the room waits for them after a reveal: the next round, or the result after the last. */
  nextRound(): void;
  /** Hosts only, during a game: stops it now; its points are dropped and it doesn't count for the session. */
  endGame(): void;
  /** Hosts only, in rooms with host controls, while a round plays: pauses or resumes it for everyone. */
  pauseRound(paused: boolean): void;
  /** Hosts only, in rooms with host controls, while a round plays: ends it now and shows the answer. */
  skipRound(): void;
  /** The round's song in this browser. */
  snippet: Snippet;
}

export interface ScreenProps {
  app: AppApi;
  id?: string;
}

/** A screen: its content plus what it shows in the LCD and the status bar. */
export interface ScreenDef {
  title: string;
  Component: ComponentType<ScreenProps>;
  /** Sidebar item to highlight instead of this screen's own. */
  parent?: ScreenName;
  /** Show the list / cover view switch in the toolbar. */
  toolbarViews?: boolean;
  lcd(app: AppApi): LcdText;
  status(app: AppApi): string;
}
