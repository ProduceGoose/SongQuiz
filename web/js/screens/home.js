/* Home: create or join a room, and browse popular playlists. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = window.SQApp;
  var ui = App.ui;

  function Home(props) {
    var app = props.app;
    var room = app.room;

    return h('div', { className: 'app-screen' },
      h(ui.ScreenHeader, {
        title: 'Ready for a song quiz?',
        hint: 'Open a room and share its code, or join friends who already started one.'
      },
        h(S.Button, { variant: 'primary', size: 'lg', icon: 'plus', onClick: function () { app.go('create'); } }, 'Create a room'),
        h(S.Button, { size: 'lg', icon: 'broadcast', onClick: function () { app.go('join'); } }, 'Join with a code')),

      room ? h(ui.Notice, null,
        'You’re in ', h('strong', null, room.name), ' with ' + (room.players.length - 1) + ' others. ',
        h('button', { type: 'button', className: 'app-link', onClick: function () { app.go('lobby'); } }, 'Back to the lobby')) : null,

      h(ui.Section, {
        title: 'Popular playlists',
        hint: 'Open one to see sample songs, or start a room with it.',
        action: h(S.Button, { onClick: function () { app.go('playlists'); } }, 'See all')
      },
        h(S.AlbumGrid, { label: 'Popular playlists' }, App.data.playlists.slice(0, 6).map(function (p) {
          return h(S.AlbumTile, {
            key: p.id, art: p.art, title: p.title, subtitle: p.subtitle,
            onClick: function () { app.go('playlist', p.id); }
          });
        }))));
  }

  App.screens.home = {
    title: 'Home',
    component: Home,
    lcd: function (app) {
      return { title: 'SongQuiz', subtitle: app.room ? 'In ' + app.room.name + ' · code ' + app.room.code : 'Not in a room yet' };
    },
    status: function (app) {
      return App.data.playlists.length + ' playlists, ' + (app.room ? app.room.players.length + ' players in your room' : 'not in a room');
    }
  };
})();
