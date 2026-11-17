// jepyso.com: light or dark, as chosen with the goniometer (sitio.js) and kept on this device; until then, the
// device's. A plain script in the head, so the page paints in its mode and the goniometer's arm starts where it is.
(function () {
  var raiz = document.documentElement;
  var t = null;
  try { t = localStorage.getItem('jepyso-tema'); } catch (e) { /* no storage: the device's mode */ }
  if (t === 'dark' || t === 'light') raiz.dataset.theme = t;
  var oscuro = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  raiz.dataset.modo = oscuro ? 'oscuro' : 'claro';
})();
