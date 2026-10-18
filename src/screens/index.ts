// Every screen, by route name. To add a screen: write it in this folder, export a ScreenDef,
// add it here, and add its name to ScreenName in ../types.ts.
import type { ScreenDef, ScreenName } from '../types';
import { createScreen } from './Create';
import { homeScreen } from './Home';
import { joinScreen } from './Join';
import { lobbyScreen } from './Lobby';
import { playlistScreen, playlistsScreen } from './Playlists';
import { scoresScreen } from './Scores';
import { settingsScreen } from './Settings';

export const screens: Record<ScreenName, ScreenDef> = {
  home: homeScreen,
  join: joinScreen,
  create: createScreen,
  lobby: lobbyScreen,
  playlists: playlistsScreen,
  playlist: playlistScreen,
  scores: scoresScreen,
  settings: settingsScreen
};

export function isScreenName(name: string): name is ScreenName {
  return Object.prototype.hasOwnProperty.call(screens, name);
}
