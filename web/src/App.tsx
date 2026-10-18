// The app shell: window chrome, sidebar, toolbar, status bar, navigation and app state.
// Each screen lives in ./screens and is registered in ./screens/index.ts.
import { useEffect, useRef, useState } from 'react';
import {
  BarButton, Icon, LcdDisplay, NowPlaying, SearchField, SegmentedControl, SourceList, StatusBar, Toolbar, Transport,
  VolumeSlider, Window, type SourceSection
} from '@songquiz/ui';
import { defaultSettings, demoRoom, joinRoom, newRoom, playlistById, playlists } from './data/demo';
import { applyTheme, clearSettings, loadSettings, saveSettings } from './lib/settings';
import { isScreenName, screens } from './screens';
import { ME, type AppApi, type LcdText, type Room, type Route, type ScreenName, type Settings } from './types';

/** A bare #name in the address opens that screen, e.g. index.html#playlists. */
function initialRoute(): Route {
  const name = location.hash.slice(1);
  return isScreenName(name) && name !== 'playlist' ? { name } : { name: 'home' };
}

function sidebarSections(room: Room | null): SourceSection[] {
  const sections: Array<SourceSection | null> = [
    {
      title: 'SongQuiz', items: [
        { id: 'home', label: 'Home', icon: 'music' },
        { id: 'join', label: 'Join a room', icon: 'broadcast' },
        { id: 'create', label: 'Create a room', icon: 'plus' }
      ]
    },
    room ? { title: 'Room', items: [{ id: 'lobby', label: room.name, icon: 'users', badge: room.players.length }] } : null,
    {
      title: 'Library', items: [
        { id: 'playlists', label: 'Playlists', icon: 'playlist', badge: playlists.length },
        { id: 'scores', label: 'Scores', icon: 'trophy' }
      ]
    },
    { title: 'You', items: [{ id: 'settings', label: 'Profile & settings', icon: 'user' }] }
  ];
  return sections.filter((s): s is SourceSection => s !== null);
}

export function App() {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [room, setRoom] = useState<Room | null>(() => demoRoom(settings.name));
  const [query, setQueryState] = useState('');
  const [playlistView, setPlaylistView] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<LcdText | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(true);
  const flashTimer = useRef<number>();

  const screen = screens[route.name];

  useEffect(() => applyTheme(settings.theme), [settings.theme]);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // ---- Actions the screens can call ----
  const app: AppApi = {
    route, room, settings, query, playlistView,

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

  // ---- Window parts ----
  const lcd = message ?? screen.lcd(app);
  const upNext = room ? playlistById(room.playlistId) : null;

  const toolbar = (
    <Toolbar
      start={<>
        <Transport disabled />
        <VolumeSlider value={settings.volume} onChange={(v) => app.updateSettings({ volume: v })} />
      </>}
      center={
        <LcdDisplay
          title={lcd.title} subtitle={lcd.subtitle}
          start={<Icon name="music" size={14} />}
          end={room ? <Icon name="users" size={14} title={`${room.players.length} players in your room`} /> : null}
        />
      }
      end={<>
        {screen.toolbarViews ? (
          <SegmentedControl
            label="View" value={playlistView} onChange={(v) => setPlaylistView(v as 'grid' | 'list')}
            options={[{ value: 'list', icon: 'list', title: 'List' }, { value: 'grid', icon: 'grid', title: 'Covers' }]}
          />
        ) : null}
        <SearchField
          placeholder="Search playlists" label="Search playlists, songs and artists"
          value={query} onChange={app.setQuery} onSubmit={() => app.go('playlists')}
        />
      </>}
    />
  );

  const sidebar = (
    <>
      <SourceList
        sections={sidebarSections(room)} selected={screen.parent ?? route.name}
        onSelect={(id) => { if (isScreenName(id)) app.go(id); }}
      />
      {room && upNext
        ? <NowPlaying label="Up next" art={upNext.art} title={upNext.title} subtitle={`${room.rounds} rounds in ${room.name}`} />
        : <NowPlaying hidden title="Nothing playing" subtitle="Join or create a room" />}
    </>
  );

  const statusBar = (
    <StatusBar
      start={<>
        <BarButton icon="list" label="Show menu" className="app-menu-btn" active={navOpen} onClick={() => setNavOpen(!navOpen)} />
        <BarButton icon="plus" label="Create a room" onClick={() => app.go('create')} />
        <BarButton icon="shuffle" label="Shuffle songs" active={shuffle} onClick={() => setShuffle(!shuffle)} />
        <BarButton icon="repeat" label="Play again after the last round" active={repeat} onClick={() => setRepeat(!repeat)} />
      </>}
      end={<BarButton icon="users" label={room ? 'Open the lobby' : 'Join a room'} onClick={() => app.go(room ? 'lobby' : 'join')} />}
    >
      {screen.status(app)}
    </StatusBar>
  );

  const Screen = screen.Component;
  return (
    <Window
      title={room ? 'SongQuiz — ' + room.name : 'SongQuiz'}
      className={navOpen ? 'app-nav-open' : undefined}
      closeLabel="Leave room" onClose={app.leaveRoom}
      toolbar={toolbar} sidebar={sidebar} statusBar={statusBar}
    >
      <Screen key={route.name + ':' + (route.id ?? '')} app={app} id={route.id} />
    </Window>
  );
}
