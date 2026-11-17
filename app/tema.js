// Light or dark: the one chosen with the goniometer beside «Accesibilidad» (app.js), kept on this device; until then,
// the device's. ?tema=oscuro or ?tema=claro wins, for screenshots. data-modo says which one shows, for the goniometer's
// arm, before the page paints.
(function () {
  var raiz = document.documentElement;
  var t = new URLSearchParams(location.search).get('tema');
  var elegido = null;
  if (t === 'oscuro') elegido = 'dark';
  else if (t === 'claro') elegido = 'light';
  else {
    try { elegido = localStorage.getItem('jepyso-tema'); } catch (e) { /* no storage: the device's mode */ }
    if (elegido !== 'dark' && elegido !== 'light') elegido = null;
  }
  if (elegido) raiz.dataset.theme = elegido;
  var oscuro = elegido ? elegido === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  raiz.dataset.modo = oscuro ? 'oscuro' : 'claro';
})();

// Two small pieces older phones lack (iOS before 15.4: iPhone 6s, 7 and the first SE stay on 15.x). The person doing a
// routine may well have one of them.
if (!Object.hasOwn) Object.hasOwn = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    value: function (i) { i = Math.trunc(i) || 0; if (i < 0) i += this.length; return i < 0 || i >= this.length ? undefined : this[i]; },
    writable: true, configurable: true,
  });
}
