/* StatusBar preview: bar buttons (shuffle and repeat toggle) around the room summary. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  function Demo() {
    var repeat = React.useState(true);
    var shuffle = React.useState(false);

    var start = h(React.Fragment, null,
      h(S.BarButton, { icon: 'plus', label: 'Invite friends' }),
      h(S.BarButton, { icon: 'shuffle', label: 'Shuffle playlist', active: shuffle[0], onClick: function () { shuffle[1](!shuffle[0]); } }),
      h(S.BarButton, { icon: 'repeat', label: 'Play again after the last round', active: repeat[0], onClick: function () { repeat[1](!repeat[0]); } }));

    return h(S.StatusBar, { start: start, end: h(S.BarButton, { icon: 'users', label: 'Players' }) },
      '8 players, round 3 of 10, 0:18 left');
  }

  mount('root', h(Demo));
})();
