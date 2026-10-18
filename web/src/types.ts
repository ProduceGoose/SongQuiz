import type { ComponentType } from 'react';

// ---- Music -------------------------------------------------------------------

export interface Track {
  title: string;
  artist: string;
  year: number;
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
  updateSettings(patch: Partial<Settings>): void;
  joinRoom(code: string, name: string): void;
  createRoom(options: RoomOptions): void;
  leaveRoom(): void;
  toggleReady(): void;
  resetPrototype(): void;
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
