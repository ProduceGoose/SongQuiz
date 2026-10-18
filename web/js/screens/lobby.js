/* Lobby: the room code to share, who is in the room and who is ready. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = window.SQApp;
  var ui = App.ui;

  var MODE_LABELS = { covers: 'Pick a cover', typed: 'Type it' };

  function NoRoom(props) {
    var app = props.app;
    return h('div', { className: 'app-screen' },
      h(ui.ScreenHeader, { title: 'You’re not in a room', hint: 'Create a room for your friends, or join one with a code.' },
        h(S.Button, { variant: 'primary', size: 'lg', icon: 'plus', onClick: function () { app.go('create'); } }, 'Create a room'),
        h(S.Button, { size: 'lg', icon: 'broadcast', onClick: function () { app.go('join'); } }, 'Join with a code')));
  }

  function Lobby(props) {
    var app = props.app;
    var room = app.room;
    var triedStart = React.useState(false);
    if (!room) return h(NoRoom, { app: app });

    var playlist = App.data.playlistById(room.playlistId);
    var me = room.players.filter(function (p) { return p.id === 'you'; })[0];
    var host = room.players.filter(function (p) { return p.id === room.hostId; })[0];
    var isHost = room.hostId === 'you';
    var readyCount = room.players.filter(function (p) { return p.ready; }).length;

    function copyCode() {
      var failed = function () { app.flash('Couldn’t copy the code', 'Tell your friends: ' + room.code); };
      try {
        navigator.clipboard.writeText(room.code).then(function () {
          app.flash('Room code copied', 'Send ' + room.code + ' to your friends');
        }, failed);
      } catch (e) { failed(); }
    }

    return h('div', { className: 'app-screen' },
      h('div', { className: 'app-room-head' },
        h('div', { className: 'app-room-title' },
          h('h1', { className: 'app-question' }, room.name),
          h('div', { className: 'app-meta' },
            h(S.Badge, { icon: 'playlist' }, playlist.title),
            h(S.Badge, null, room.rounds + ' rounds'),
            h(S.Badge, null, MODE_LABELS[room.mode]),
            h(S.Badge, null, room.snippet + ' s snippets'))),
        h('div', { className: 'app-code-box' },
          h('span', { className: 'app-code-label' }, 'Room code'),
          h('span', { className: 'app-code' }, room.code),
          h(S.Button, { onClick: copyCode }, 'Copy code'))),

      h(ui.Section, { title: 'Players', hint: room.players.length + ' of ' + room.maxPlayers + ' joined · ' + readyCount + ' ready' },
        h(ui.Table, {
          caption: 'Players in ' + room.name,
          columns: [{ label: '#', className: 'sq-col-rank' }, { label: 'Player' }, { label: 'Status', className: 'sq-col-status' }]
        }, room.players.map(function (p, i) {
          var notes = [p.id === room.hostId ? 'host' : null, p.id === 'you' ? 'you' : null].filter(Boolean);
          return h('tr', { key: p.id, className: p.id === 'you' ? 'is-on' : undefined },
            h('td', { className: 'sq-col-rank' }, i + 1),
            h('td', null, p.name, notes.length ? h('span', { className: 'sq-list-note' }, ' (' + notes.join(', ') + ')') : null),
            h('td', { className: 'sq-col-status' }, p.ready
              ? h(S.Badge, { tone: 'aqua', icon: 'check' }, 'Ready')
              : h(S.Badge, null, 'Not ready')));
        }))),

      triedStart[0] ? h(ui.Notice, null, 'Gameplay isn’t part of this prototype yet. In the full game the first round would start now.') : null,

      h('div', { className: 'app-form-actions' },
        h(S.Button, { size: 'lg', onClick: app.leaveRoom }, 'Leave room'),
        h(S.Button, { size: 'lg', icon: me.ready ? null : 'check', onClick: app.toggleReady }, me.ready ? 'I’m not ready' : 'I’m ready'),
        isHost
          ? h(S.Button, { variant: 'primary', size: 'lg', onClick: function () { triedStart[1](true); } }, 'Start game')
          : h(S.Button, { variant: 'primary', size: 'lg', disabled: true }, 'Waiting for ' + host.name)));
  }

  App.screens.lobby = {
    title: 'Lobby',
    component: Lobby,
    lcd: function (app) {
      var room = app.room;
      if (!room) return { title: 'No room', subtitle: 'Create one or join with a code' };
      var ready = room.players.filter(function (p) { return p.ready; }).length;
      return { title: room.name + ' · code ' + room.code, subtitle: ready + ' of ' + room.players.length + ' players ready' };
    },
    status: function (app) {
      var room = app.room;
      if (!room) return 'Not in a room';
      var n = room.players.length;
      return n + (n === 1 ? ' player, ' : ' players, ') + room.rounds + ' rounds, ' + App.data.playlistById(room.playlistId).title;
    }
  };
})();
