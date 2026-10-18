/* NowPlaying preview: the hidden mystery track and a revealed song. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;
  var demo = window.SQDemo;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('hidden', h(S.NowPlaying, { hidden: true, title: 'Mystery track', subtitle: 'Revealed when time runs out' }));
  mount('revealed', h(S.NowPlaying, { label: 'Last song', art: demo.cover(2), title: 'Africa', subtitle: 'Toto · 1982' }));
})();
