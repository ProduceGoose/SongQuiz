// The app's status bar: menu, create, shuffle and repeat buttons, the current screen's
// one-line summary (ScreenDef.status) and a shortcut to the lobby.
import { useState } from 'react';
import type { AppApi, ScreenDef } from '../../types';
import { BarButton, StatusBar } from './StatusBar';

export interface AppStatusBarProps {
  app: AppApi;
  screen: ScreenDef;
  /** Whether the sidebar drawer is open on narrow screens. */
  navOpen: boolean;
  onToggleNav: () => void;
}

export function AppStatusBar({ app, screen, navOpen, onToggleNav }: AppStatusBarProps) {
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(true);
  const { room } = app;
  return (
    <StatusBar
      start={<>
        <BarButton icon="list" label="Show menu" className="app-menu-btn" active={navOpen} onClick={onToggleNav} />
        <BarButton icon="plus" label="Create a room" onClick={() => app.go('create')} />
        <BarButton icon="shuffle" label="Shuffle songs" active={shuffle} onClick={() => setShuffle(!shuffle)} />
        <BarButton icon="repeat" label="Play again after the last round" active={repeat} onClick={() => setRepeat(!repeat)} />
      </>}
      end={<BarButton icon="users" label={room ? 'Open the lobby' : 'Join a room'} onClick={() => app.go(room ? 'lobby' : 'join')} />}
    >
      {screen.status(app)}
    </StatusBar>
  );
}
