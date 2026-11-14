// Theme override for screenshots: ?tema=oscuro or ?tema=claro.
(function () {
  var t = new URLSearchParams(location.search).get('tema');
  if (t === 'oscuro') document.documentElement.dataset.theme = 'dark';
  if (t === 'claro') document.documentElement.dataset.theme = 'light';
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
