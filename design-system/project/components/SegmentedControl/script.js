/* SegmentedControl preview: text segments and icon-only segments. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  mount('sections', h(S.SegmentedControl, { label: 'Section', options: ['Round', 'Scores', 'History'] }));

  mount('views', h(S.SegmentedControl, {
    label: 'View', defaultValue: 'grid',
    options: [{ value: 'list', icon: 'list', title: 'List' }, { value: 'grid', icon: 'grid', title: 'Covers' }]
  }));
})();
