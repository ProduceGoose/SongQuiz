/* AlbumTile preview: every state, left to right. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;
  var demo = window.SQDemo;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  var song = function (i) { return demo.SONGS[i]; };
  var noop = function () {};

  mount('root', h(React.Fragment, null,
    h(S.AlbumTile, { art: demo.cover(0), title: song(0).title, subtitle: song(0).artist, onClick: noop }),
    h(S.AlbumTile, { art: demo.cover(1), title: song(1).title, subtitle: song(1).artist, state: 'selected', onClick: noop }),
    h(S.AlbumTile, { art: demo.cover(2), title: song(2).title, subtitle: song(2).artist, state: 'correct' }),
    h(S.AlbumTile, { art: demo.cover(3), title: song(3).title, subtitle: song(3).artist, state: 'wrong' }),
    h(S.AlbumTile, { title: 'Mystery track', subtitle: 'Round 4', state: 'hidden' }),
    h(S.AlbumTile, { art: demo.cover(5), title: song(5).title, subtitle: song(5).artist, state: 'dimmed' }),
    h(S.AlbumTile, { title: song(6).title, subtitle: song(6).artist, playing: true })));
})();
