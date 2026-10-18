// The app: its state and actions (AppApi), and the window that holds the current screen.
// Each window region has its own folder in ./components; each screen is in ./screens.
//
// You are in at most one room. The demo room (code KX7Q) runs offline with simulated players
// (game/useGame.ts); every other room is online, on the server (game/useOnlineRoom.ts).
import { useEffect, useRef, useState } from 'react';
import { AppChat } from './components/chat/AppChat';
import { AppSidebar } from './components/sidebar/AppSidebar';
import { AppStatusBar } from './components/statusbar/AppStatusBar';
import { AppToolbar } from './components/toolbar/AppToolbar';
import { Window } from './components/window/Window';
import { DEMO_CODE, defaultSettings, demoRoom, randomCode } from './data/demo';
import { useGame } from './game/useGame';
import { useOnlineRoom, type OnlineTarget } from './game/useOnlineRoom';
import { applyTheme, clearSettings, loadSettings, saveSettings } from './lib/settings';
import { isScreenName, screens } from './screens';
import { ME, type AppApi, type LcdText, type Room, type Route, type ScreenName, type Settings } from './types';

/** The online room this tab was in, so a reload rejoins it. */
const SESSION_KEY = 'songquiz.room';

/** A bare #name in the address opens that screen, e.g. index.html#playlists. */
function initialRoute(): Route {
  const name = location.hash.slice(1);
  return isScreenName(name) && name !== 'playlist' ? { name } : { name: 'home' };
}

function savedOnlineRoom(): OnlineTarget | null {
  try {
    const code = sessionStorage.getItem(SESSION_KEY);
    return code ? { code } : null;
  } catch {
    return null;
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [online, setOnline] = useState<OnlineTarget | null>(savedOnlineRoom);
  const [demo, setDemo] = useState<Room | null>(() => (online ? null : demoRoom(settings.name)));
  const [query, setQueryState] = useState('');
  const [playlistView, setPlaylistView] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<LcdText | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const flashTimer = useRef<number>();

  const sim = useGame(demo, settings.name, () => {
    setDemo((r) => r && { ...r, players: r.players.map((p) => ({ ...p, ready: true })) });
  });
  const net = useOnlineRoom(online, settings.name, {
    onJoined(room) {
      if (room.hostId === ME && online?.create) app.flash('Room open', `Share code ${room.code} with your friends`);
      else app.flash('You’re in ' + room.name, room.hostId === ME ? 'You’re the host' : 'Waiting for the host to start');
    },
    onFail(error) {
      if (error.code === 'taken' && online?.create) {
        // Someone already has that code: try another one.
        setOnline({ code: randomCode(), create: online.create });
        return;
      }
      setOnline(null);
      app.go(error.code === 'not_found' || error.code === 'full' ? 'join' : 'home');
      app.flash(error.code === 'offline' ? 'You’re offline' : 'Couldn’t join', error.message);
    }
  });

  const room = online ? net.room : demo;
  const game = online ? net : sim;
  const screen = screens[route.name];

  useEffect(() => applyTheme(settings.theme), [settings.theme]);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);
  useEffect(() => {
    try {
      if (online) sessionStorage.setItem(SESSION_KEY, online.code);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Without storage a reload just doesn't rejoin.
    }
  }, [online?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Leaves whatever room you're in, without navigating. */
  function exitRoom() {
    if (online) net.leave();
    setOnline(null);
    setDemo(null);
  }

  // ---- Actions the screens can call ----
  const app: AppApi = {
    route, room, settings, query, playlistView, setPlaylistView,
    online: online ? { code: online.code, status: net.status } : null,
    chat: game.chat, round: game.round, sendChat: game.sendChat, startGame: game.startGame,

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
      if (patch.name) {
        if (online) net.rename(patch.name);
        else if (demo) setDemo({ ...demo, players: demo.players.map((p) => (p.id === ME ? { ...p, name: patch.name! } : p)) });
      }
    },

    joinRoom(code, name) {
      if (name !== settings.name) app.updateSettings({ name });
      if (online?.code === code) {
        app.go('lobby');
        return;
      }
      exitRoom();
      if (code === DEMO_CODE) {
        setDemo(demoRoom(name));
        app.flash('You’re in Friday Night Room', 'The demo room: everyone else is simulated');
      } else {
        setOnline({ code });
      }
      app.go('lobby');
    },

    createRoom(options) {
      exitRoom();
      setOnline({ code: randomCode(), create: options });
      app.go('lobby');
    },

    leaveRoom() {
      if (!room) {
        app.flash('You’re not in a room', 'Create one or join with a code');
        return;
      }
      exitRoom();
      app.go('home');
      app.flash('You left ' + room.name, 'Rejoin any time with code ' + room.code);
    },

    toggleReady() {
      const me = room?.players.find((p) => p.id === ME);
      if (!me) return;
      if (online) net.setReady(!me.ready);
      else if (demo) setDemo({ ...demo, players: demo.players.map((p) => (p.id === ME ? { ...p, ready: !p.ready } : p)) });
    },

    resetPrototype() {
      clearSettings();
      setSettings({ ...defaultSettings });
      exitRoom();
      setDemo(demoRoom(defaultSettings.name));
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
      className={[navOpen && 'app-nav-open', chatOpen && 'app-chat-open'].filter(Boolean).join(' ') || undefined}
      closeLabel="Leave room" onClose={app.leaveRoom}
      toolbar={<AppToolbar app={app} screen={screen} message={message} />}
      sidebar={<AppSidebar app={app} selected={screen.parent ?? route.name} />}
      panel={room ? <AppChat app={app} /> : null}
      statusBar={
        <AppStatusBar
          app={app} screen={screen}
          navOpen={navOpen} onToggleNav={() => setNavOpen(!navOpen)}
          chatOpen={chatOpen} onToggleChat={() => setChatOpen(!chatOpen)}
        />
      }
    >
      <Screen key={route.name + ':' + (route.id ?? '')} app={app} id={route.id} />
    </Window>
  );
}
