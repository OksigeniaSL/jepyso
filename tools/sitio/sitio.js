// jepyso.com: the «Accesibilidad» link opens Oksigenia's accessibility panel (no floating button over the page), and the
// scrollbar is the wall-bar ladder.
import '/espaldera.js';

document.addEventListener('click', (ev) => {
  if (!ev.target.closest('[data-acceso]')) return;
  document.querySelector('oksigenia-access-panel')?.open?.();
});
