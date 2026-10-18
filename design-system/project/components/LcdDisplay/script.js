/* LcdDisplay preview: a round in progress and the reveal between rounds. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('round', h(S.LcdDisplay, {
    title: 'Round 3 of 10 — Name that tune', subtitle: '5 of 8 players locked in',
    progress: 0.4, elapsed: 12, remaining: 18,
    start: h(S.Icon, { name: 'music', size: 14 }),
    end: h(S.Icon, { name: 'clock', size: 14 })
  }));

  mount('reveal', h(S.LcdDisplay, {
    title: 'It was “Africa” by Toto',
    subtitle: 'Malik was fastest · next round in 0:05'
  }));
})();
