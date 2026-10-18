// The app: its state and actions (AppApi), and the window that holds the current screen.
// Each window region has its own folder in ./components; each screen is in ./screens.
import { useEffect, useRef, useState } from 'react';
import { AppSidebar } from './components/sidebar/AppSidebar';
import { AppStatusBar } from './components/statusbar/AppStatusBar';
import { AppToolbar } from './components/toolbar/AppToolbar';
import { Window } from './components/window/Window';
import { defaultSettings, demoRoom, joinRoom, newRoom } from './data/demo';
import { applyTheme, clearSettings, loadSettings, saveSettings } from './lib/settings';
import { isScreenName, screens } from './screens';
import { ME, type AppApi, type LcdText, type Room, type Route, type ScreenName, type Settings } from './types';

/** A bare #name in the address opens that screen, e.g. index.html#playlists. */
function initialRoute(): Route {
  const name = location.hash.slice(1);
  return isScreenName(name) && name !== 'playlist' ? { name } : { name: 'home' };
}

export function App() {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [room, setRoom] = useState<Room | null>(() => demoRoom(settings.name));
  const [query, setQueryState] = useState('');
  const [playlistView, setPlaylistView] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<LcdText | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const flashTimer = useRef<number>();

  const screen = screens[route.name];

  useEffect(() => applyTheme(settings.theme), [settings.theme]);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // ---- Actions the screens can call ----
  const app: AppApi = {
    route, room, settings, query, playlistView, setPlaylistView,

    go(name: ScreenName, id?: string) {
      setRoute({ name, id });
      setNavOpen(false);
      try {
        history.replaceState(null, '', '#' + (name === 'playlist' ? 'playlists' : name));
      } catch {
        // No history API (e.g. sandboxed frame); navigation still works.
      }
      document.querySelector('.sq-window-content')?.scrollTo(0, 0);
    },

    flash(title, subtitle) {
      setMessage({ title, subtitle });
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setMessage(null), 4000);
    },

    setQuery(q) {
      setQueryState(q);
      if (q && route.name !== 'playlists') app.go('playlists');
    },

    updateSettings(patch) {
      const next = { ...settings, ...patch };
      setSettings(next);
      saveSettings(next);
      if (patch.name && room) {
        setRoom({ ...room, players: room.players.map((p) => (p.id === ME ? { ...p, name: patch.name! } : p)) });
      }
    },

    joinRoom(code, name) {
      if (name !== settings.name) app.updateSettings({ name });
      const joined = joinRoom(code, name);
      setRoom(joined);
      app.go('lobby');
      app.flash('Joined ' + joined.name, 'Waiting for the host to start');
    },

    createRoom(options) {
      const created = newRoom(options, settings.name);
      setRoom(created);
      app.go('lobby');
      app.flash('Room open', `Share code ${created.code} with your friends`);
    },

    leaveRoom() {
      if (!room) {
        app.flash('You’re not in a room', 'Create one or join with a code');
        return;
      }
      setRoom(null);
      app.go('home');
      app.flash('You left ' + room.name, 'Rejoin any time with code ' + room.code);
    },

    toggleReady() {
      if (!room) return;
      setRoom({ ...room, players: room.players.map((p) => (p.id === ME ? { ...p, ready: !p.ready } : p)) });
    },

    resetPrototype() {
      clearSettings();
      setSettings({ ...defaultSettings });
      setRoom(demoRoom(defaultSettings.name));
      setQueryState('');
      setPlaylistView('grid');
      app.go('home');
      app.flash('Prototype reset', 'Back to the demo room and default settings');
    }
  };

  const Screen = screen.Component;
  return (
    <Window
      title={room ? 'SongQuiz — ' + room.name : 'SongQuiz'}
      className={navOpen ? 'app-nav-open' : undefined}
      closeLabel="Leave room" onClose={app.leaveRoom}
      toolbar={<AppToolbar app={app} screen={screen} message={message} />}
      sidebar={<AppSidebar app={app} selected={screen.parent ?? route.name} />}
      statusBar={<AppStatusBar app={app} screen={screen} navOpen={navOpen} onToggleNav={() => setNavOpen(!navOpen)} />}
    >
      <Screen key={route.name + ':' + (route.id ?? '')} app={app} id={route.id} />
    </Window>
  );
}
