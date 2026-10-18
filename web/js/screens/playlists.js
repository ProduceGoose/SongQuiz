/* Playlists: browse as covers or as a list, search, and open one for its sample songs. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = window.SQApp;
  var ui = App.ui;

  function matches(playlist, query) {
    var haystack = [playlist.title, playlist.era, playlist.level]
      .concat(playlist.tracks.map(function (t) { return t.title + ' ' + t.artist; }))
      .join(' ').toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function filtered(query) {
    var q = query.trim().toLowerCase();
    return q ? App.data.playlists.filter(function (p) { return matches(p, q); }) : App.data.playlists;
  }

  function Playlists(props) {
    var app = props.app;
    var list = filtered(app.query);
    var open = function (p) { return function () { app.go('playlist', p.id); }; };
    var hint = app.query
      ? list.length + (list.length === 1 ? ' playlist matches' : ' playlists match') + ' “' + app.query + '”'
      : list.length + ' playlists to quiz on. Open one to see sample songs.';

    var body;
    if (!list.length) {
      body = h('div', { className: 'app-empty' },
        h('p', null, 'No playlist has a title, song or artist matching “' + app.query + '”.'),
        h(S.Button, { onClick: function () { app.setQuery(''); } }, 'Clear search'));
    } else if (app.playlistView === 'list') {
      body = h(ui.Table, {
        caption: 'Playlists',
        columns: [{ label: 'Name' }, { label: 'Songs', className: 'sq-col-num' }, { label: 'Era' }, { label: 'Level' }]
      }, list.map(function (p) {
        return h('tr', Object.assign({ key: p.id }, ui.rowLink(open(p))),
          h('td', null, h('span', { className: 'app-cell-art' }, h('img', { src: p.art, alt: '' }), p.title)),
          h('td', { className: 'sq-col-num' }, p.songs),
          h('td', null, p.era),
          h('td', null, p.level));
      }));
    } else {
      body = h(S.AlbumGrid, { label: 'Playlists' }, list.map(function (p) {
        return h(S.AlbumTile, { key: p.id, art: p.art, title: p.title, subtitle: p.subtitle, onClick: open(p) });
      }));
    }

    return h('div', { className: 'app-screen' },
      h(ui.ScreenHeader, { align: 'left', title: 'Playlists', hint: hint }),
      body);
  }

  function Playlist(props) {
    var app = props.app;
    var p = App.data.playlistById(props.id);

    return h('div', { className: 'app-screen' },
      h('button', { type: 'button', className: 'app-back', onClick: function () { app.go('playlists'); } },
        h(S.Icon, { name: 'disclosure', size: 8 }), 'Playlists'),

      h('div', { className: 'app-detail' },
        h('img', { className: 'app-detail-art', src: p.art, alt: 'Cover of ' + p.title }),
        h('div', { className: 'app-detail-text' },
          h('h1', { className: 'app-question' }, p.title),
          h('p', { className: 'app-hint' }, p.description),
          h('div', { className: 'app-meta' },
            h(S.Badge, null, p.subtitle), h(S.Badge, null, p.era), h(S.Badge, null, p.level)),
          h('div', { className: 'app-actions' },
            h(S.Button, { variant: 'primary', icon: 'plus', onClick: function () { app.go('create', p.id); } }, 'Create a room with this playlist')))),

      h(ui.Section, { title: 'Sample songs', hint: p.tracks.length + ' of ' + p.songs + ' songs. Players see titles only after each round.' },
        h(ui.Table, {
          caption: 'Sample songs in ' + p.title,
          columns: [{ label: '#', className: 'sq-col-rank' }, { label: 'Title' }, { label: 'Artist' }, { label: 'Year', className: 'sq-col-num' }]
        }, p.tracks.map(function (t, i) {
          return h('tr', { key: t.title },
            h('td', { className: 'sq-col-rank' }, i + 1),
            h('td', null, t.title),
            h('td', null, t.artist),
            h('td', { className: 'sq-col-num' }, t.year));
        }))));
  }

  App.screens.playlists = {
    title: 'Playlists',
    component: Playlists,
    toolbarViews: true,
    lcd: function (app) {
      return app.query
        ? { title: 'Searching playlists', subtitle: filtered(app.query).length + ' results for “' + app.query + '”' }
        : { title: 'Playlists', subtitle: App.data.playlists.length + ' playlists · ' + (app.playlistView === 'list' ? 'list view' : 'cover view') };
    },
    status: function (app) {
      var list = filtered(app.query);
      var songs = list.reduce(function (n, p) { return n + p.songs; }, 0);
      return list.length + ' playlists, ' + songs.toLocaleString('en-US') + ' songs';
    }
  };

  App.screens.playlist = {
    title: 'Playlist',
    component: Playlist,
    parent: 'playlists',
    lcd: function (app) {
      var p = App.data.playlistById(app.route.id);
      return { title: p.title, subtitle: p.subtitle + ' · ' + p.era + ' · ' + p.level };
    },
    status: function (app) {
      var p = App.data.playlistById(app.route.id);
      return p.songs + ' songs, ' + p.tracks.length + ' samples shown';
    }
  };
})();
