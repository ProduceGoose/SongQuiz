/* Leaderboard preview: scores after round 3, with your row highlighted. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;
  var demo = window.SQDemo;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('root', h(S.Leaderboard, { players: demo.PLAYERS, highlight: 'lena', caption: 'Scores after round 3' }));
})();
