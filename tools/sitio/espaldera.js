// jepyso.com's scrollbar: a wall-bar ladder. The band wrapped round its rungs is where you are and goes where you drag
// it; a click on the ladder takes the band there. The darker rungs are the sections: their name shows on hover, and
// while the band is held, the one you are in. With a mouse on wide screens only; with touch, forced colours or a page
// that does not scroll, the browser's own bar stays. It sits over the native scrolling, so keys and wheel work as ever.
const PASO = 24; // rung pitch, as in estilos.css
const CENTRO = 21; // middle of the first rung
const apto = matchMedia('(pointer: fine) and (hover: hover) and (min-width: 900px)');
const forzados = matchMedia('(forced-colors: active)');
const quieta = matchMedia('(prefers-reduced-motion: reduce)');
const raiz = document.documentElement;

let barra = null;
let banda = null;
let rotulo = null;
let capa = null;
let marcas = [];
let medida = { alto: 0, banda: 0, recorrido: 0 };
let arrastre = null;
let pendiente = false;

const hueco = () => medida.alto - medida.banda;
const aRecorrido = (y) => (hueco() > 0 ? (y / hueco()) * medida.recorrido : 0);

function crear() {
  barra = document.createElement('div');
  barra.className = 'espaldera';
  barra.setAttribute('aria-hidden', 'true');
  capa = document.createElement('div');
  banda = document.createElement('div');
  banda.className = 'espaldera-banda';
  rotulo = document.createElement('span');
  banda.append(rotulo);
  barra.append(capa, banda);
  document.body.append(barra);

  barra.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const marca = ev.target.closest('.espaldera-marca');
    if (marca) {
      ir(marcas[Number(marca.dataset.i)].destino, true);
      return;
    }
    let desde = scrollY;
    if (ev.target !== banda) {
      // On the ladder: the band goes there, centred on the pointer, and can be dragged from there on.
      desde = Math.min(Math.max(aRecorrido(ev.clientY - medida.banda / 2), 0), medida.recorrido);
      ir(desde, true);
    }
    arrastre = { y: ev.clientY, desde };
    barra.setPointerCapture(ev.pointerId);
    barra.classList.add('arrastrando', 'sobre-banda');
  });
  barra.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    ir(arrastre.desde + aRecorrido(ev.clientY - arrastre.y), false);
  });
  const soltar = () => {
    arrastre = null;
    barra.classList.remove('arrastrando');
    if (!banda.matches(':hover')) barra.classList.remove('sobre-banda');
  };
  barra.addEventListener('pointerup', soltar);
  barra.addEventListener('pointercancel', soltar);
  banda.addEventListener('pointerenter', () => barra.classList.add('sobre-banda'));
  banda.addEventListener('pointerleave', () => arrastre || barra.classList.remove('sobre-banda'));
}

function ir(y, suave) {
  scrollTo({ top: y, behavior: suave && !quieta.matches ? 'smooth' : 'instant' });
}

// The sections: each heading of the page (not the plan cards), where the page stops for it under a sticky header.
function secciones() {
  const cabecera = document.querySelector('.cabecera');
  const encima = cabecera && getComputedStyle(cabecera).position === 'sticky' ? cabecera.offsetHeight : 0;
  return [...document.querySelectorAll('main h1, main h2')]
    .filter((h) => !h.closest('.tarjeta') && h.textContent.trim())
    .map((h) => {
      const arriba = h.getBoundingClientRect().top + scrollY;
      return { nombre: h.textContent.trim(), arriba, destino: Math.max(0, arriba - encima - 16) };
    });
}

function medir() {
  const total = raiz.scrollHeight;
  const vista = innerHeight;
  const sirve = apto.matches && !forzados.matches && total > vista + 2;
  raiz.classList.toggle('con-espaldera', sirve);
  if (!sirve) {
    barra?.remove();
    barra = null;
    return;
  }
  if (!barra) crear();
  medida.alto = barra.clientHeight;
  medida.recorrido = Math.max(0, raiz.scrollHeight - innerHeight);
  // As long as the page is, but never more than five rungs: a band, not a block.
  medida.banda = Math.round(Math.min(5 * PASO, Math.max(2.5 * PASO, (medida.alto * innerHeight) / raiz.scrollHeight)));
  banda.style.height = `${medida.banda}px`;

  // Each section on the rung nearest to where its heading is down the page, as on a map of it; two on one rung share it.
  const porPeldano = new Map();
  const largo = raiz.scrollHeight;
  for (const s of secciones()) {
    const y = (s.arriba / largo) * medida.alto;
    const k = Math.min(Math.max(0, Math.round((y - CENTRO) / PASO)), Math.floor((medida.alto - CENTRO) / PASO));
    const ya = porPeldano.get(k);
    if (ya) ya.nombre += ` · ${s.nombre}`;
    else porPeldano.set(k, { ...s, k });
  }
  marcas = [...porPeldano.values()];
  capa.replaceChildren(...marcas.map((m, i) => {
    const d = document.createElement('div');
    d.className = 'espaldera-marca';
    d.dataset.i = i;
    d.style.top = `${m.k * PASO + CENTRO}px`;
    const r = document.createElement('span');
    r.textContent = m.nombre;
    d.append(r);
    return d;
  }));
  colocar();
}

function colocar() {
  pendiente = false;
  if (!barra) return;
  const parte = medida.recorrido ? Math.min(Math.max(scrollY / medida.recorrido, 0), 1) : 0;
  const arriba = parte * hueco();
  banda.style.transform = `translateY(${arriba.toFixed(1)}px)`;
  // The section you are in, by the band while it is held: the last heading in the top third of the screen.
  const linea = scrollY + innerHeight / 3;
  let actual = '';
  for (const m of marcas) if (m.arriba <= linea || m.destino <= scrollY + 2) actual = m.nombre;
  if (rotulo.textContent !== actual) rotulo.textContent = actual;
  rotulo.hidden = !actual;
}

const pedir = () => {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(colocar);
};
addEventListener('scroll', pedir, { passive: true });
addEventListener('resize', medir);
apto.addEventListener('change', medir);
forzados.addEventListener('change', medir);
new ResizeObserver(() => medir()).observe(document.body);
medir();
