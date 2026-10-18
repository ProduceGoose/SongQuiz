/* Toolbar preview: playback, the LCD, the view switch and search. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('root', h(S.Toolbar, {
    start: h(React.Fragment, null,
      h(S.Transport, { playing: true }),
      h(S.VolumeSlider, {})),
    center: h(S.LcdDisplay, {
      title: 'Round 3 of 10 — Name that tune', subtitle: '5 of 8 players locked in',
      progress: 0.4, elapsed: 12, remaining: 18
    }),
    end: h(React.Fragment, null,
      h(S.SegmentedControl, {
        label: 'View', defaultValue: 'grid',
        options: [{ value: 'list', icon: 'list', title: 'List' }, { value: 'grid', icon: 'grid', title: 'Covers' }]
      }),
      h(S.SearchField, { placeholder: 'Search songs' }))
  }));
})();
