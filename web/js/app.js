/* The app shell: window chrome, sidebar, toolbar, status bar, navigation and app state.
   Each screen lives in js/screens/ and registers itself on SQApp.screens. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = window.SQApp;
  var D = App.data;

  var STORAGE_KEY = 'songquiz.settings';
  var HOST_THEME = document.documentElement.getAttribute('data-theme');

  // ---- Settings persistence (best effort: storage can be unavailable) ----
  function loadSettings() {
    try { return Object.assign({}, D.defaultSettings, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}); }
    catch (e) { return Object.assign({}, D.defaultSettings); }
  }
  function saveSettings(settings) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* not saved */ }
  }
  function clearSettings() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing to clear */ }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    var value = theme === 'system' ? HOST_THEME : theme;
    if (value) root.setAttribute('data-theme', value); else root.removeAttribute('data-theme');
  }

  // A bare #name in the address opens that screen, e.g. index.html#playlists.
  function initialRoute() {
    var name = (location.hash || '').slice(1);
    return App.screens[name] && name !== 'playlist' ? { name: name } : { name: 'home' };
  }

  function sidebarSections(room) {
    return [
      { title: 'SongQuiz', items: [
        { id: 'home', label: 'Home', icon: 'music' },
        { id: 'join', label: 'Join a room', icon: 'broadcast' },
        { id: 'create', label: 'Create a room', icon: 'plus' }
      ] },
      room ? { title: 'Room', items: [
        { id: 'lobby', label: room.name, icon: 'users', badge: room.players.length }
      ] } : null,
      { title: 'Library', items: [
        { id: 'playlists', label: 'Playlists', icon: 'playlist', badge: D.playlists.length },
        { id: 'scores', label: 'Scores', icon: 'trophy' }
      ] },
      { title: 'You', items: [
        { id: 'settings', label: 'Profile & settings', icon: 'user' }
      ] }
    ].filter(Boolean);
  }

  function SongQuizApp() {
    var initialSettings = React.useMemo(loadSettings, []);
    var routeState = React.useState(initialRoute);
    var settingsState = React.useState(initialSettings);
    var roomState = React.useState(function () { return D.demoRoom(initialSettings.name); });
    var queryState = React.useState('');
    var viewState = React.useState('grid');
    var messageState = React.useState(null);
    var navState = React.useState(false);
    var shuffleState = React.useState(false);
    var repeatState = React.useState(true);
    var flashTimer = React.useRef(null);

    var route = routeState[0];
    var settings = settingsState[0];
    var room = roomState[0];
    var screen = App.screens[route.name];

    React.useEffect(function () { applyTheme(settings.theme); }, [settings.theme]);

    // ---- Actions the screens can call ----
    var app = {
      route: route,
      room: room,
      settings: settings,
      query: queryState[0],
      playlistView: viewState[0],

      go: function (name, id) {
        routeState[1]({ name: name, id: id });
        navState[1](false);
        try { history.replaceState(null, '', name === 'playlist' ? '#playlists' : '#' + name); } catch (e) { /* no history */ }
        var content = document.querySelector('.sq-window-content');
        if (content) content.scrollTop = 0;
      },

      flash: function (title, subtitle) {
        messageState[1]({ title: title, subtitle: subtitle });
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(function () { messageState[1](null); }, 4000);
      },

      setQuery: function (q) {
        queryState[1](q);
        if (q && route.name !== 'playlists') app.go('playlists');
      },

      updateSettings: function (patch) {
        var next = Object.assign({}, settings, patch);
        settingsState[1](next);
        saveSettings(next);
        if (patch.name && room) {
          roomState[1](Object.assign({}, room, {
            players: room.players.map(function (p) { return p.id === 'you' ? Object.assign({}, p, { name: patch.name }) : p; })
          }));
        }
      },

      joinRoom: function (code, name) {
        if (name !== settings.name) app.updateSettings({ name: name });
        var joined = D.joinRoom(code, name);
        roomState[1](joined);
        app.go('lobby');
        app.flash('Joined ' + joined.name, 'Waiting for the host to start');
      },

      createRoom: function (options) {
        var created = D.newRoom(options, settings.name);
        roomState[1](created);
        app.go('lobby');
        app.flash('Room open', 'Share code ' + created.code + ' with your friends');
      },

      leaveRoom: function () {
        if (!room) { app.flash('You’re not in a room', 'Create one or join with a code'); return; }
        roomState[1](null);
        app.go('home');
        app.flash('You left ' + room.name, 'Rejoin any time with code ' + room.code);
      },

      toggleReady: function () {
        roomState[1](Object.assign({}, room, {
          players: room.players.map(function (p) { return p.id === 'you' ? Object.assign({}, p, { ready: !p.ready }) : p; })
        }));
      },

      resetPrototype: function () {
        clearSettings();
        settingsState[1](Object.assign({}, D.defaultSettings));
        roomState[1](D.demoRoom(D.defaultSettings.name));
        queryState[1]('');
        viewState[1]('grid');
        app.go('home');
        app.flash('Prototype reset', 'Back to the demo room and default settings');
      }
    };

    // ---- Window parts ----
    var lcd = messageState[0] || screen.lcd(app);
    var selected = screen.parent || route.name;

    var toolbar = h(S.Toolbar, {
      start: h(React.Fragment, null,
        h(S.Transport, { disabled: true }),
        h(S.VolumeSlider, { value: settings.volume, onChange: function (v) { app.updateSettings({ volume: v }); } })),
      center: h(S.LcdDisplay, {
        title: lcd.title, subtitle: lcd.subtitle,
        start: h(S.Icon, { name: 'music', size: 14 }),
        end: room ? h(S.Icon, { name: 'users', size: 14, title: room.players.length + ' players in your room' }) : null
      }),
      end: h(React.Fragment, null,
        screen.toolbarViews ? h(S.SegmentedControl, {
          label: 'View', value: viewState[0], onChange: viewState[1],
          options: [{ value: 'list', icon: 'list', title: 'List' }, { value: 'grid', icon: 'grid', title: 'Covers' }]
        }) : null,
        h(S.SearchField, {
          placeholder: 'Search playlists', label: 'Search playlists, songs and artists',
          value: queryState[0], onChange: app.setQuery,
          onSubmit: function () { app.go('playlists'); }
        }))
    });

    var sidebar = h(React.Fragment, null,
      h(S.SourceList, { sections: sidebarSections(room), selected: selected, onSelect: function (id) { app.go(id); } }),
      room
        ? h(S.NowPlaying, { label: 'Up next', art: D.playlistById(room.playlistId).art, title: D.playlistById(room.playlistId).title, subtitle: room.rounds + ' rounds in ' + room.name })
        : h(S.NowPlaying, { hidden: true, title: 'Nothing playing', subtitle: 'Join or create a room' }));

    var statusBar = h(S.StatusBar, {
      start: h(React.Fragment, null,
        h(S.BarButton, { icon: 'list', label: 'Show menu', className: 'app-menu-btn', active: navState[0], onClick: function () { navState[1](!navState[0]); } }),
        h(S.BarButton, { icon: 'plus', label: 'Create a room', onClick: function () { app.go('create'); } }),
        h(S.BarButton, { icon: 'shuffle', label: 'Shuffle songs', active: shuffleState[0], onClick: function () { shuffleState[1](!shuffleState[0]); } }),
        h(S.BarButton, { icon: 'repeat', label: 'Play again after the last round', active: repeatState[0], onClick: function () { repeatState[1](!repeatState[0]); } })),
      end: h(S.BarButton, { icon: 'users', label: room ? 'Open the lobby' : 'Join a room', onClick: function () { app.go(room ? 'lobby' : 'join'); } })
    }, screen.status(app));

    return h(S.Window, {
      title: room ? 'SongQuiz — ' + room.name : 'SongQuiz',
      className: navState[0] ? 'app-nav-open' : undefined,
      closeLabel: 'Leave room', onClose: app.leaveRoom,
      toolbar: toolbar, sidebar: sidebar, statusBar: statusBar
    }, h(screen.component, { key: route.name + ':' + (route.id || ''), app: app, id: route.id }));
  }

  ReactDOM.createRoot(document.getElementById('app')).render(h(SongQuizApp));
})();
