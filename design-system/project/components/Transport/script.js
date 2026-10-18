/* Transport preview: idle, playing and disabled. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('idle', h(S.Transport, {}));
  mount('playing', h(S.Transport, { playing: true }));
  mount('disabled', h(S.Transport, { disabled: true }));
})();
