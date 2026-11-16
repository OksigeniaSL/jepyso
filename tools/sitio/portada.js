// jepyso.com's home, «the room»: the app's own figure (figura/, copied from app/ by hacer.py) stays in its plaster room
// while the story goes down beside it, and each step changes what it does and what lies over it. Without the figure
// (no WebGL, an old browser) the room keeps its still and the page reads the same.
import { Figura } from '/figura/figura.js';

const en = document.documentElement.lang === 'en';
const quieta = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escenario = document.querySelector('.escenario');
const lienzo = document.querySelector('.escenario-figura');
if (escenario && lienzo) iniciar().catch(() => escenario.classList.add('sin-figura'));

// The QR of the example link, drawn on its canvas with the vendor's generator.
function qr() {
  const c = document.querySelector('.ejemplo-qr');
  if (!c || typeof qrcode !== 'function') return;
  const q = qrcode(0, 'M');
  q.addData(c.dataset.enlace);
  q.make();
  const n = q.getModuleCount();
  const t = c.width / n;
  const x = c.getContext('2d');
  x.fillStyle = '#f2f3f1';
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#1d2225';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect(Math.floor(k * t), Math.floor(r * t), Math.ceil(t), Math.ceil(t));
}

async function iniciar() {
  qr();
  const [manifiesto, ingles] = await Promise.all([
    fetch('/figura/modelos/ejercicios.json').then((r) => r.json()),
    en ? fetch('/figura/textos-en.json').then((r) => r.json()) : {},
  ]);
  const f = new Figura(lienzo, { ...manifiesto, _base: '/figura/' });
  // The wheel moves the page, not the figure's camera; it still turns with a finger or by dragging.
  f.controles.enableZoom = false;
  const EJERCICIO = ['puente', 'silla', 'silla', 'hombro', 'silla'];
  const LADO = { hombro: 'der' };
  const PALABRA = en ? { subir: 'Up', mantener: 'Hold', bajar: 'Down', reposo: 'Rest' } : { subir: 'Sube', mantener: 'Mantén', bajar: 'Baja', reposo: 'Descansa' };
  const nombre = document.querySelector('.pauta-nombre');
  let actual = null;
  async function paso(n) {
    escenario.dataset.paso = n;
    const id = EJERCICIO[n];
    if (id === actual) return;
    actual = id;
    await f.poner(id, { tempo: [2, 1, 2], lado: LADO[id] || 'der' });
    if (quieta) f.posar(f.fases.mantener[0]);
    else f.empezar({ modo: 'demo' });
    nombre.textContent = nombre.dataset[id] || '';
  }
  await paso(0);
  escenario.classList.add('con-figura');

  const fase = document.querySelector('.fase');
  const cursor = document.querySelector('.tempo-cursor');
  const cuenta = document.querySelector('.cuenta b');
  const cuentaSerie = document.querySelector('.serie-cuenta');
  const voz = document.querySelector('.voz-texto');
  const palabra = (x) => { const t = f.textos?.[x]; return (en ? ingles[t] : t) || PALABRA[x]; };
  f.on('fase', (x, _resto, p) => { if (x) cursor.style.left = `${(p * 100).toFixed(2)}%`; });
  f.on('cambio', (x) => {
    fase.textContent = palabra(x);
    fase.dataset.fase = x;
    if (x !== 'reposo') voz.textContent = en ? `“${palabra(x)}”` : `«${palabra(x)}»`;
  });
  f.on('repeticion', (h) => { cuenta.textContent = (h % 10) + 1; cuentaSerie.textContent = (h % 12) + 1; });

  // The step in the middle of the screen is the one the room plays.
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && paso(Number(e.target.dataset.paso))), { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('.paso[data-paso]').forEach((p) => io.observe(p));
}
