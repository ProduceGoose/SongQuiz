/* SourceList preview: the sidebar with a selectable item and collapsible sections. */
(function () {
  var S = window.SongQuiz;
  var h = React.createElement;
  var demo = window.SQDemo;

  function mount(id, element) {
    ReactDOM.createRoot(document.getElementById(id)).render(element);
  }

  function Demo() {
    var selected = React.useState('room');
    return h(S.SourceList, { sections: demo.SECTIONS, selected: selected[0], onSelect: selected[1] });
  }

  mount('root', h(Demo));
})();
