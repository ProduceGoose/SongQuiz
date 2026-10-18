/* VolumeSlider preview: loud and quiet. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('loud', h(S.VolumeSlider, { defaultValue: 70 }));
  mount('quiet', h(S.VolumeSlider, { defaultValue: 20 }));
})();
