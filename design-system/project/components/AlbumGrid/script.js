/* AlbumGrid preview: ten covers; click one to select it. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;
  var demo = window.SQDemo;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  function Demo() {
    var picked = React.useState(-1);
    return h(S.AlbumGrid, { label: 'Answer choices' }, demo.SONGS.map(function (song, i) {
      return h(S.AlbumTile, {
        key: i, art: demo.cover(i), title: song.title, subtitle: song.artist,
        state: picked[0] === i ? 'selected' : 'idle',
        onClick: function () { picked[1](i); }
      });
    }));
  }

  mount('root', h(Demo));
})();
