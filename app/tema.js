// Theme override for screenshots: ?tema=oscuro or ?tema=claro.
(function () {
  var t = new URLSearchParams(location.search).get('tema');
  if (t === 'oscuro') document.documentElement.dataset.theme = 'dark';
  if (t === 'claro') document.documentElement.dataset.theme = 'light';
})();
