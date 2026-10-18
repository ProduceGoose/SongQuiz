/* Window preview: a lobby window with toolbar, sidebar and status bar. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  var toolbar = h(S.Toolbar, {
    start: h(S.Transport, {}),
    center: h(S.LcdDisplay, { title: 'Waiting for players', subtitle: 'Share code KX7Q to invite friends' }),
    end: h(S.Button, { variant: 'primary' }, 'Start game')
  });

  var sidebar = h(S.SourceList, {
    selected: 'room',
    sections: [{ title: 'Room', items: [{ id: 'room', label: 'Friday Night Room', icon: 'broadcast', badge: 3 }] }]
  });

  var statusBar = h(S.StatusBar, { start: h(S.BarButton, { icon: 'plus', label: 'Invite' }) }, '3 players in the lobby');

  mount('root', h(S.Window, { title: 'Friday Night Room', style: { height: 280 }, toolbar: toolbar, sidebar: sidebar, statusBar: statusBar },
    h('div', { className: 'placeholder' }, 'Content goes here, usually an AlbumGrid.')));
})();
