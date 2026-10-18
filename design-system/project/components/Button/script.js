/* Button preview: default, primary, large primary and disabled. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('root', h(React.Fragment, null,
    h(S.Button, { icon: 'plus' }, 'Invite friends'),
    h(S.Button, { variant: 'primary' }, 'Lock in'),
    h(S.Button, { variant: 'primary', size: 'lg' }, 'Start game'),
    h(S.Button, { disabled: true }, 'Waiting…')));
})();
