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

export type AnswerMode = 'covers' | 'typed';

export interface Room {
  name: string;
  /** 4 letters or digits, e.g. "KX7Q". */
  code: string;
  hostId: string;
  playlistId: string;
  rounds: number;
  mode: AnswerMode;
  /** Snippet length in seconds. */
  snippet: number;
  maxPlayers: number;
  players: RoomPlayer[];
}

/** What the Create screen collects. Numbers stay strings while they are segment values. */
export interface RoomOptions {
  name: string;
  playlistId: string;
  rounds: string;
  mode: AnswerMode;
  snippet: string;
  maxPlayers: string;
}

export interface PastGame {
  id: string;
  date: string;
  room: string;
  playlistId: string;
  /** The entry with id "you" has no name; the current display name fills it in. */
  players: Array<{ id: string; name?: string; score: number; streak?: number }>;
}

// ---- Game --------------------------------------------------------------------

export interface Round {
  /** 1-based. */
  number: number;
  total: number;
  /** The answer. Never shown before the reveal; in online rooms it is blank until then. */
  track: Track;
  /** Cover of the playlist the track is from, shown at the reveal. */
  art: string;
  /** Date.now() when the snippet started. */
  startedAt: number;
  /** Snippet length in seconds. */
  length: number;
  /** Ids of the players who guessed it, fastest first. */
  solved: string[];
  /** playing: guesses count. reveal: the answer is shown until `nextAt`. */
  phase: 'playing' | 'reveal';
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

export type ScreenName = 'home' | 'join' | 'create' | 'lobby' | 'playlists' | 'playlist' | 'scores' | 'settings';

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
  leaveRoom(): void;
  toggleReady(): void;
  resetPrototype(): void;
  /** Set while you're in, or joining, an online room; null in the demo room or no room. */
  online: { code: string; status: 'connecting' | 'open' | 'reconnecting' } | null;
  /** The room chat, oldest first. */
  chat: ChatEntry[];
  /** The round being played or revealed; null between games. */
  round: Round | null;
  /** Posts to the room chat. During a round it is also a guess; a correct one stays hidden. */
  sendChat(text: string): void;
  startGame(): void;
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
