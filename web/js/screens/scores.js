/* Scores: your recent games and the final standings of the one you pick. */
(function () {
  var h = React.createElement;
  var S = window.SongQuiz;
  var App = window.SQApp;
  var ui = App.ui;

  // Past games store "you" without a name; fill in the current display name.
  function withYou(players, myName) {
    return players.map(function (p) {
      return p.id === 'you' ? Object.assign({}, p, { name: myName, note: '(you)' }) : p;
    });
  }

  function winnerOf(game) {
    return game.players.reduce(function (best, p) { return p.score > best.score ? p : best; });
  }

  function Scores(props) {
    var app = props.app;
    var games = App.data.pastGames;
    var selected = React.useState(games[0].id);
    var game = games.filter(function (g) { return g.id === selected[0]; })[0];
    var playlist = App.data.playlistById(game.playlistId);

    return h('div', { className: 'app-screen' },
      h(ui.ScreenHeader, { align: 'left', title: 'Scores', hint: 'Your last ' + games.length + ' games. Pick one to see the final standings.' }),

      h(ui.Table, {
        caption: 'Recent games',
        columns: [{ label: 'Date' }, { label: 'Room' }, { label: 'Playlist' }, { label: 'Players', className: 'sq-col-num' }, { label: 'Winner' }]
      }, games.map(function (g) {
        var winner = winnerOf(g);
        return h('tr', Object.assign({ key: g.id }, ui.rowLink(function () { selected[1](g.id); }, g.id === game.id)),
          h('td', null, g.date),
          h('td', null, g.room),
          h('td', null, App.data.playlistById(g.playlistId).title),
          h('td', { className: 'sq-col-num' }, g.players.length),
          h('td', null, winner.id === 'you' ? app.settings.name + ' (you)' : winner.name));
      })),

      h(ui.Section, { title: game.room, hint: 'Final scores · ' + game.date + ' · ' + playlist.title },
        h('div', { className: 'app-table' },
          h(S.Leaderboard, { players: withYou(game.players, app.settings.name), highlight: 'you', caption: 'Final scores for ' + game.room }))));
  }

  App.screens.scores = {
    title: 'Scores',
    component: Scores,
    lcd: function () {
      var last = App.data.pastGames[0];
      var winner = winnerOf(last);
      return { title: 'Scores', subtitle: 'Last game: ' + last.room + ' · won by ' + (winner.name || 'you') };
    },
    status: function () { return App.data.pastGames.length + ' games played'; }
  };
})();
