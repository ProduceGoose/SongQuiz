/* Create: pick the rules and a playlist, then open the room. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = window.SQApp;
  var ui = App.ui;

  var ANSWER_HINTS = {
    covers: 'Players pick the song from six covers.',
    typed: 'Players type the title or the artist.'
  };

  function Create(props) {
    var app = props.app;
    var D = App.data;
    var form = React.useState({
      name: app.settings.name + '’s room',
      playlistId: props.id || 'synth-80s',
      rounds: '10', mode: 'covers', snippet: '20', maxPlayers: '8'
    });
    var error = React.useState(null);
    var cfg = form[0];
    var playlist = D.playlistById(cfg.playlistId);

    function set(key) {
      return function (value) {
        var next = Object.assign({}, cfg);
        next[key] = value;
        form[1](next);
        if (key === 'name') error[1](null);
      };
    }

    function submit(e) {
      e.preventDefault();
      if (!cfg.name.trim()) { error[1]('Give the room a name so friends know they’re in the right place.'); return; }
      app.createRoom(Object.assign({}, cfg, { name: cfg.name.trim() }));
    }

    return h('form', { className: 'app-screen', onSubmit: submit, noValidate: true },
      h(ui.ScreenHeader, { title: 'Create a room', hint: 'Choose the music and the rules. You get a code to share as soon as the room opens.' }),

      h('div', { className: 'app-columns' },
        h(ui.Sheet, { title: 'Rules' },
          h(ui.Field, { id: 'room-name', label: 'Room name', icon: 'broadcast', maxLength: 32, value: cfg.name, error: error[0], onChange: set('name') }),
          h(ui.Setting, { label: 'Rounds' },
            h(S.SegmentedControl, { label: 'Rounds', options: ['5', '10', '15', '20'], value: cfg.rounds, onChange: set('rounds') })),
          h(ui.Setting, { label: 'Answers', hint: ANSWER_HINTS[cfg.mode] },
            h(S.SegmentedControl, {
              label: 'Answers', value: cfg.mode, onChange: set('mode'),
              options: [{ value: 'covers', label: 'Pick a cover' }, { value: 'typed', label: 'Type it' }]
            })),
          h(ui.Setting, { label: 'Snippet length' },
            h(S.SegmentedControl, {
              label: 'Snippet length', value: cfg.snippet, onChange: set('snippet'),
              options: [{ value: '10', label: '10 s' }, { value: '20', label: '20 s' }, { value: '30', label: '30 s' }]
            })),
          h(ui.Setting, { label: 'Max players' },
            h(S.SegmentedControl, { label: 'Max players', options: ['4', '8', '12'], value: cfg.maxPlayers, onChange: set('maxPlayers') }))),

        h(ui.Section, { title: 'Playlist', hint: playlist.title + ' · ' + playlist.subtitle + ' · ' + playlist.level },
          h(S.AlbumGrid, { label: 'Choose a playlist' }, D.playlists.map(function (p) {
            return h(S.AlbumTile, {
              key: p.id, art: p.art, title: p.title, subtitle: p.subtitle,
              state: p.id === cfg.playlistId ? 'selected' : 'idle',
              onClick: function () { set('playlistId')(p.id); }
            });
          })))),

      h('div', { className: 'app-form-actions' },
        h(S.Button, { size: 'lg', onClick: function () { app.go('home'); } }, 'Cancel'),
        h(S.Button, { variant: 'primary', size: 'lg', type: 'submit' }, 'Open room')));
  }

  App.screens.create = {
    title: 'Create a room',
    component: Create,
    lcd: function () { return { title: 'New room', subtitle: 'Pick the rules and a playlist' }; },
    status: function () { return App.data.playlists.length + ' playlists to choose from'; }
  };
})();
