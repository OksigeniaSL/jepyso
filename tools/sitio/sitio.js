// jepyso.com: the «Accesibilidad» link opens Oksigenia's accessibility panel (no floating button over the page), the
// goniometer switches light and dark, and the scrollbar is the wall-bar ladder.
import '/espaldera.js';

document.addEventListener('click', (ev) => {
  if (!ev.target.closest('[data-acceso]')) return;
  document.querySelector('oksigenia-access-panel')?.open?.();
});

// Light or dark: the device's until someone turns the goniometer, and then theirs, kept on this device (tema.js puts it
// on before the page paints). The button names the mode it goes to; the bar of the phone's browser follows.
const raiz = document.documentElement;
const sistema = matchMedia('(prefers-color-scheme: dark)');
const COLOR = { claro: '#e4e6e3', oscuro: '#121517' };
const NOMBRE = raiz.lang === 'en' ? { claro: 'Light mode', oscuro: 'Dark mode' } : { claro: 'Modo claro', oscuro: 'Modo oscuro' };
const modo = () => (raiz.dataset.theme ? raiz.dataset.theme === 'dark' : sistema.matches) ? 'oscuro' : 'claro';
function pintar() {
  const m = modo();
  raiz.dataset.modo = m;
  const destino = NOMBRE[m === 'oscuro' ? 'claro' : 'oscuro'];
  document.querySelectorAll('[data-tema]').forEach((b) => {
    b.setAttribute('aria-label', destino);
    b.title = destino;
  });
  document.querySelectorAll('meta[name="theme-color"]').forEach((x) => {
    x.content = raiz.dataset.theme ? COLOR[m] : COLOR[x.media.includes('dark') ? 'oscuro' : 'claro'];
  });
}
document.addEventListener('click', (ev) => {
  if (!ev.target.closest('[data-tema]')) return;
  const nuevo = modo() === 'oscuro' ? 'light' : 'dark';
  raiz.dataset.theme = nuevo;
  try { localStorage.setItem('jepyso-tema', nuevo); } catch { /* it lasts this visit */ }
  pintar();
});
sistema.addEventListener('change', pintar);
pintar();
