/* SearchField preview: the small search field and the large answer field. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('search', h(S.SearchField, { placeholder: 'Search songs' }));

  mount('answer', h(S.SearchField, {
    size: 'lg', icon: 'music', label: 'Your answer',
    placeholder: 'Type the song or artist…', defaultValue: 'Take On'
  }));
})();
