// The app's status bar: menu, create, shuffle and repeat buttons, a one-line summary
// (the round while one is playing, otherwise the current screen's ScreenDef.status),
// and shortcuts to the chat and the lobby.
import { useState } from 'react';
import { roundElapsed } from '../../game/preview';
import { formatTime } from '../utils';
import type { AppApi, ScreenDef } from '../../types';
import { BarButton, StatusBar } from './StatusBar';

export interface AppStatusBarProps {
  app: AppApi;
  screen: ScreenDef;
  /** Whether the sidebar drawer is open on narrow screens. */
  navOpen: boolean;
  onToggleNav: () => void;
  /** Whether the chat drawer is open on narrow screens. */
  chatOpen: boolean;
  onToggleChat: () => void;
}

function summary(app: AppApi, screen: ScreenDef): string {
  const { room, round } = app;
  if (room && round?.phase === 'playing') {
    const left = Math.max(0, round.length - roundElapsed(round));
    const paused = round.pausedAt !== undefined ? ', paused' : '';
    return `${room.players.length} players, round ${round.number} of ${round.total}, ${formatTime(Math.ceil(left))} left${paused}`;
  }
  return screen.status(app);
}

export function AppStatusBar({ app, screen, navOpen, onToggleNav, chatOpen, onToggleChat }: AppStatusBarProps) {
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
      end={<>
        {room ? <BarButton icon="chat" label="Show chat" className="app-chat-btn" active={chatOpen} onClick={onToggleChat} /> : null}
        <BarButton icon="users" label={room ? 'Open the lobby' : 'Join a room'} onClick={() => app.go(room ? 'lobby' : 'join')} />
      </>}
    >
      {summary(app, screen)}
    </StatusBar>
  );
}
