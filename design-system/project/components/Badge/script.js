/* Badge preview: every tone, plus a badge without its icon. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('root', h(React.Fragment, null,
    h(S.Badge, null, 'Guessing'),
    h(S.Badge, { tone: 'aqua' }, 'Locked in'),
    h(S.Badge, { tone: 'correct' }, 'Correct'),
    h(S.Badge, { tone: 'wrong' }, 'Wrong'),
    h(S.Badge, { tone: 'gold' }, '3-streak'),
    h(S.Badge, { tone: 'correct', icon: null }, '+120')));
})();
