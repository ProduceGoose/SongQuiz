/* ChatPanel preview: round 3 in progress, with wrong guesses shown and a correct one hidden. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;
  var now = Date.now();
  var ago = function (s) { return now - s * 1000; };

  var entries = [
    { id: '1', kind: 'message', author: 'Malik', text: 'Last round was brutal. Who knew Soft Cell?', time: ago(80) },
    { id: '2', kind: 'message', author: 'Priya', text: 'Me. Obviously.', time: ago(70) },
    { id: '3', kind: 'event', text: 'Round 3 of 10 — name that tune', time: ago(14) },
    { id: '4', kind: 'guess', author: 'Jonas', text: 'is it Billie Jean?', time: ago(11) },
    { id: '5', kind: 'guess', author: 'Lena', text: 'Tainted Love', time: ago(9), mine: true },
    { id: '6', kind: 'event', tone: 'correct', text: 'Priya guessed it', time: ago(6) },
    { id: '7', kind: 'message', author: 'Sam', text: 'argh, the intro', time: ago(3) }
  ];

  function Demo() {
    var state = React.useState(entries);
    return h(S.ChatPanel, {
      title: 'Room chat', entries: state[0], icon: 'music', placeholder: 'Type your guess',
      onSend: function (text) {
        state[1](state[0].concat({ id: String(Date.now()), kind: 'guess', author: 'Lena', text: text, time: Date.now(), mine: true }));
      }
    });
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(Demo));
})();
