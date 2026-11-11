// Jepyso: the professional builds a routine, sends it as a link, the person does it with the 3D figure and sends
// back a summary link. No server: everything travels inside the links.
import {
  EJERCICIOS, ORDEN, ZONAS, MUSCULOS, buscarEjercicios, LADOS, TOPE_MOLESTIA, pasaDelTope, diaLocal, diaAnterior,
  codificar, decodificar, duracionEjercicio, minutos, almacen,
} from './datos.js';
import { Figura } from './figura.js';
import { leerPersonas, guardarPersonas, buscarPorNombre, crearPersona, apuntarRutina, apuntarResumen, semanas, copia, cargarCopia, caben, limite } from './personas.js';
import { MAPA, PUNTOS } from './mapa.js';
import { medida, dibujar, actualizar } from './goniometro.js';
import { pintarRecorrido } from './recorrido.js';

const app = document.getElementById('app');
const parametros = new URLSearchParams(location.search);
const RUTAS = { a: 'modelos/ejercicios.json', b: 'modelos/b/ejercicios.json' };
// The still of every exercise, for the library rows and the routine of the person, made by tools/posters/ next to each
// body's clips. One that is not there leaves its tile empty instead of a broken image.
const poster = (id, c) => `modelos/${c === 'b' ? 'b/' : ''}posters/${id}.webp`;
app.addEventListener('error', (ev) => ev.target.closest?.('.biblio-poster, .tarjeta-poster')?.classList.add('vacio'), true);
const calidad = parametros.get('calidad') === 'baja' ? 'baja' : 'alta';
const manifiestos = {};
let figura = null;
let limpiar = () => {};

const ICONO = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.2"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  volver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  personas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2"/></svg>',
  plantillas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 4.5h11v14H4z"/><path d="M8 8h11v14H8z"/><path d="M11 12h5M11 15.5h5M11 19h3" stroke-linecap="round"/></svg>',
  abrir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></svg>',
  girar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.4 4.3 2.9 11.4c-1.3.5-1.3 1.2-.2 1.6l4.7 1.5 1.8 5.5c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.3-1.5zM8.6 14l9.2-5.8c.5-.3.9-.1.5.2l-7.5 6.8-.3 3.3L8.6 14z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
};

// The two bodies Gaudí made. Named by build, never by sex.
const FIGURAS = [['a', 'Figura 1'], ['b', 'Figura 2']];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------- Tempo line ----------
// Up, hold, down, then one second at rest: the same cycle the figure plays.
function puntosTempo(tempo, ancho, alto) {
  const [s, m, b] = tempo;
  const total = s + m + b + 1;
  const x = (seg) => (seg / total) * ancho;
  const arriba = 6;
  const abajo = alto - 6;
  return { total, x, arriba, abajo, vertices: [[0, abajo], [x(s), arriba], [x(s + m), arriba], [x(s + m + b), abajo], [ancho, abajo]] };
}

function svgTempo(tempo, { ancho = 240, alto = 46, etiquetas = false, punto = false } = {}) {
  const p = puntosTempo(tempo, ancho, alto);
  const traza = p.vertices.map((v) => v.join(',')).join(' ');
  const relleno = `0,${p.abajo} ${traza} ${ancho},${p.abajo}`;
  const [s, m, b] = tempo;
  const rotulos = etiquetas
    ? [
        [p.x(s / 2), `${s} s`],
        [p.x(s + m / 2), m ? `${m} s` : ''],
        [p.x(s + m + b / 2), `${b} s`],
      ]
        .map(([x, t]) => (t ? `<text x="${x}" y="${alto + 14}" text-anchor="middle">${t}</text>` : ''))
        .join('')
    : '';
  const datos = esc(JSON.stringify({ tempo, alto, etiquetas, punto }));
  return `<svg class="tempo" data-t="${datos}" viewBox="0 ${-2} ${ancho} ${alto + (etiquetas ? 20 : 4)}" aria-hidden="true">
    <line class="base" x1="0" y1="${p.abajo}" x2="${ancho}" y2="${p.abajo}"/>
    <polygon class="relleno" points="${relleno}" opacity="0.6"/>
    <polyline class="traza" points="${traza}"/>${rotulos}
    ${punto ? `<circle class="punto" r="7" cx="0" cy="${p.abajo}"/>` : ''}
  </svg>`;
}

function moverPunto(svg, tempo, progreso) {
  const c = svg?.querySelector('.punto');
  if (!c) return;
  const vb = svg.viewBox.baseVal;
  const alto = JSON.parse(svg.dataset.t).alto;
  const p = puntosTempo(tempo, vb.width, alto);
  const segundos = progreso * p.total;
  const [s, m, b] = tempo;
  let y = p.abajo;
  if (segundos < s) y = p.abajo + (p.arriba - p.abajo) * (segundos / s);
  else if (segundos < s + m) y = p.arriba;
  else if (segundos < s + m + b) y = p.arriba + (p.abajo - p.arriba) * ((segundos - s - m) / b);
  c.setAttribute('cx', p.x(segundos));
  c.setAttribute('cy', y);
}

// The tempo line is drawn at the real width of its box so the dot and the labels are never stretched.
function medirTempos(raiz = document) {
  for (const svg of raiz.querySelectorAll('svg.tempo[data-t]')) {
    const w = Math.round(svg.getBoundingClientRect().width);
    if (!w || svg.dataset.medido === String(w)) continue;
    const o = JSON.parse(svg.dataset.t);
    const plantilla = document.createElement('template');
    plantilla.innerHTML = svgTempo(o.tempo, { ancho: w, alto: o.alto, etiquetas: o.etiquetas, punto: o.punto }).trim();
    const nuevo = plantilla.content.firstElementChild;
    svg.setAttribute('viewBox', nuevo.getAttribute('viewBox'));
    svg.innerHTML = nuevo.innerHTML;
    svg.dataset.medido = String(w);
  }
}
new MutationObserver(() => medirTempos()).observe(document.body, { childList: true, subtree: true });
window.addEventListener('resize', () => medirTempos());

const textoTempo = ([s, m, b]) => (m ? `Sube en ${s} s, mantén ${m} s, baja en ${b} s` : `Sube en ${s} s, baja en ${b} s`);

// ---------- Figure ----------
async function cargarManifiesto(c = 'a') {
  const ruta = RUTAS[c] || RUTAS.a;
  manifiestos[ruta] ||= fetch(ruta).then((r) => r.json());
  return manifiestos[ruta];
}

// One figure for the whole app; it moves between containers and swaps body when the routine asks for the other one.
async function figuraEn(contenedor, c = 'a') {
  const manifiesto = await cargarManifiesto(c);
  if (!figura) figura = new Figura(contenedor, manifiesto, { calidad });
  else await figura.cambiarCuerpo(manifiesto);
  if (figura.renderer.domElement.parentElement !== contenedor) figura.mover(contenedor);
  return figura;
}

// A message with a link, ready in WhatsApp or in Telegram.
const enlaceMensaje = (canal, texto, url) =>
  canal === 'tg'
    ? `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`;

// ---------- The professional's app ----------
// The professional's side is an app for the phone and the tablet (Enrique, 11 November 2026): a tab bar at the foot of
// the phone, a rail at the side of a tablet, a bar on top with the title and, inside a file, the way back. The person's
// routine (#r=) has none of it, and no manifest: installed from there, its icon would open the builder, not the routine.
const PESTANAS = [['#', 'Nueva rutina', 'mas'], ['#personas', 'Personas', 'personas'], ['#plantillas', 'Plantillas', 'plantillas']];
let pestanas = null;
function marcoApp(h) {
  const pro = !h.startsWith('#r=');
  document.body.classList.toggle('pro', pro);
  if (pro && !pestanas) {
    pestanas = document.createElement('nav');
    pestanas.className = 'pestanas';
    pestanas.setAttribute('aria-label', 'Jepyso');
    pestanas.innerHTML = `<p class="marca-jepyso pestanas-marca">jepyso<span aria-hidden="true">°</span></p>${PESTANAS.map(
      ([href, texto, icono]) => `<a href="${href}" data-pestana="${href}">${ICONO[icono]}<span>${texto}</span></a>`,
    ).join('')}`;
    document.body.append(pestanas);
  }
  if (pestanas) {
    pestanas.hidden = !pro;
    const actual = h.startsWith('#persona') ? '#personas' : h === '#plantillas' ? '#plantillas' : h.startsWith('#s=') ? '' : '#';
    pestanas.querySelectorAll('a').forEach((a) => (a.dataset.pestana === actual ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  }
  let m = document.querySelector('link[rel="manifest"]');
  if (pro && !m) {
    m = document.createElement('link');
    m.rel = 'manifest';
    m.href = 'manifest.json';
    document.head.append(m);
  } else if (!pro && m) m.remove();
}

const barraApp = (titulo, { volver = '', accion = '' } = {}) => `<header class="barra-app">
  ${volver ? `<a class="barra-volver" href="${volver}" aria-label="Volver">${ICONO.volver}</a>` : ''}
  <h1>${titulo}</h1>${accion}
</header>`;
const botonNueva = '<a class="boton barra-boton" href="#">' + ICONO.mas + 'Nueva rutina</a>';

// The free version keeps up to five people with a file (Enrique, 11 November 2026): how many there are, in sight, as five
// squares; full, said before a routine for someone new is made.
function capacidad(lista) {
  const n = lista.length;
  const max = limite();
  const marcas = Array.from({ length: max }, (_, i) => `<i${i < n ? ' class="usada"' : ''}></i>`).join('');
  return `<p class="capacidad${n >= max ? ' llena' : ''}"><span class="capacidad-marcas" aria-hidden="true">${marcas}</span>
    <span><b>${Math.min(n, max)} de ${max}</b> personas con ficha${n >= max ? '. Las rutinas para alguien nuevo van igual, sin ficha' : ''} · la versión de pago no tiene límite</span></p>`;
}
function avisoLleno(b) {
  const lista = leerPersonas();
  const nombre = b.para.trim();
  if (!nombre || caben(lista) || buscarPorNombre(lista, nombre).length) return '';
  return `<p class="aviso-lleno">Tus ${limite()} fichas están llenas: esta rutina va en el enlace, pero no se guarda en Personas.</p>`;
}

// The steps of the builder, on top: for whom, the exercises, the settings and the link. One tap goes to each.
function etapasApp(b) {
  const pasos = [
    ['para', 'Para quién', b.para.trim() ? b.para.trim() : ''],
    ['ejercicios', 'Ejercicios', b.orden.length ? String(b.orden.length) : ''],
    ['ajustes', 'Ajustes', ''],
    ['enlace', 'Enlace', ''],
  ];
  return pasos
    .map(([k, t, hecho], i) => `<button type="button" class="etapa-ir${hecho ? ' hecha' : ''}" data-accion="ir-etapa" data-etapa="${k}"${k === 'enlace' && !b.orden.length ? ' disabled' : ''}>
      <b>${hecho ? ICONO.check : i + 1}</b><span>${t}</span></button>`)
    .join('');
}

// ---------- Builder ----------
// The draft: who it is for, the settings for the whole routine, the exercises in the order the professional chose
// (orden) and the settings of every exercise touched, so one taken out and put back keeps them. The library filter
// stays with the draft.
function ajustesIniciales(id) {
  const d = EJERCICIOS[id].porDefecto;
  return { series: d.series, reps: d.reps, tempo: [...d.tempo], lado: EJERCICIOS[id].unLado ? 'der' : null, nota: '' };
}

function borradorInicial() {
  return {
    para: '', de: '', descanso: 45, veces: 1, tope: TOPE_MOLESTIA, cuerpo: 'a',
    activo: ORDEN[0], orden: [], ejercicios: {}, filtro: { zona: '', musculo: '', texto: '' },
  };
}

// Drafts saved before the library had an order kept every exercise with an «incluido» flag.
function ponerAlDia(b) {
  b.tope ??= TOPE_MOLESTIA;
  b.filtro ??= { zona: '', musculo: '', texto: '' };
  b.ejercicios ??= {};
  if (!Array.isArray(b.orden)) b.orden = ORDEN.filter((id) => b.ejercicios[id]?.incluido);
  b.orden = b.orden.filter((id) => ORDEN.includes(id));
  for (const id of Object.keys(b.ejercicios)) {
    if (EJERCICIOS[id]) delete b.ejercicios[id].incluido;
    else delete b.ejercicios[id];
  }
  if (!ORDEN.includes(b.activo)) b.activo = b.orden[0] || ORDEN[0];
  return b;
}

function paso(accion, valor, etiqueta, min, max) {
  return `<div class="paso" role="group" aria-label="${esc(etiqueta)}">
    <button type="button" data-accion="${accion}" data-delta="-1" aria-label="Menos" ${valor <= min ? 'disabled' : ''}>−</button>
    <output class="num">${valor}</output>
    <button type="button" data-accion="${accion}" data-delta="1" aria-label="Más" ${valor >= max ? 'disabled' : ''}>+</button>
  </div>`;
}

function segmentos(accion, opciones, actual) {
  return `<div class="segmentos" role="group">${opciones
    .map(([v, t]) => `<button type="button" data-accion="${accion}" data-valor="${v}" aria-pressed="${String(v) === String(actual)}">${t}</button>`)
    .join('')}</div>`;
}

// How an exercise is done, for the person (the how-to sheet) and for the professional (the card).
function explicacion(def) {
  return `<div class="explicacion">
    <p class="partida"><strong>Para empezar.</strong> ${esc(def.partida)}</p>
    <ol class="como">${def.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
    ${def.notar ? `<p><strong>Dónde se nota.</strong> ${esc(def.notar)}</p>` : ''}
    <p><strong>Ojo.</strong> ${esc(def.error)}</p>
    ${def.para ? `<p><strong>Para qué.</strong> ${esc(def.para)}</p>` : ''}
    ${def.ayuda ? `<p><strong>Más fácil.</strong> ${esc(def.ayuda)}</p>` : ''}
    ${def.masDificil ? `<p><strong>Para más.</strong> ${esc(def.masDificil)}</p>` : ''}
  </div>`;
}

const chipsEjercicio = (def) =>
  `<span class="chip">${esc(def.posicion)}</span><span class="chip">${esc(def.material)}</span>${def.musculos.principales
    .map((mu) => `<span class="chip vivo">${esc(MUSCULOS[mu] || mu)}</span>`)
    .join('')}`;

// What a folded card says: sets and repetitions, the tempo line and the side.
function dosis(def, e) {
  return `<span class="num">${e.series} × ${e.reps}</span>${svgTempo(e.tempo, { ancho: 52, alto: 22 })}<span class="sr">${textoTempo(e.tempo)}</span>${
    def.unLado && LADOS[e.lado] ? `<span>${esc(LADOS[e.lado])}</span>` : ''
  }`;
}

// An exercise of the routine, with its number in the routine and everything the professional sets for it. Only the
// one being looked at is open; the others fold to one line with their dose, so a long routine still fits.
function tarjetaEjercicio(id, e, activo, pos, total) {
  const def = EJERCICIOS[id];
  const [s, m, b] = e.tempo;
  return `<article class="ejercicio incluido ${activo ? 'activo' : ''}" data-id="${id}">
    <button type="button" class="ejercicio-cabeza" data-accion="elegir" aria-expanded="${activo}">
      <span class="marca num" aria-hidden="true">${pos + 1}</span>
      <span class="titulo">
        <h3>${esc(def.nombre)}</h3>
        <span class="linea-chips">${chipsEjercicio(def)}</span>
        <span class="dosis">${dosis(def, e)}</span>
      </span>
      <span class="plegar" aria-hidden="true">${ICONO.abrir}</span>
    </button>
    <div class="ejercicio-ajustes">
      <div class="mini-figura"></div>
      <div class="fila">
        <label class="ajuste"><span>Series</span>${paso('series', e.series, 'Series', 1, 6)}</label>
        <label class="ajuste"><span>Repeticiones</span>${paso('reps', e.reps, 'Repeticiones', 1, 30)}</label>
        ${def.unLado ? `<div class="ajuste"><span>Lado</span>${segmentos('lado', [['der', 'Derecho'], ['izq', 'Izquierdo'], ['ambos', 'Los dos']], e.lado)}</div>` : ''}
      </div>
      <div class="ajuste">
        <span>Ritmo de cada repetición</span>
        <div class="ritmo">
          <div class="ritmo-mini"><span>Sube</span>${paso('t0', s, 'Segundos subiendo', 1, 6)}</div>
          <div class="ritmo-mini"><span>Mantén</span>${paso('t1', m, 'Segundos manteniendo', 0, 30)}</div>
          <div class="ritmo-mini"><span>Baja</span>${paso('t2', b, 'Segundos bajando', 1, 6)}</div>
          ${svgTempo(e.tempo, { ancho: 200, alto: 44 })}
        </div>
      </div>
      <details class="detalle">
        <summary>Cómo se explica a la persona</summary>
        ${explicacion(def)}
        <p class="fuente">Fuente: ${def.fuentes.map(esc).join('; ')}.</p>
      </details>
      <div class="campo"><label for="nota-${id}">Nota para la persona</label>
        <textarea id="nota-${id}" data-accion="nota" rows="2" placeholder="Por ejemplo: sin dolor; si molesta, baja menos">${esc(e.nota)}</textarea></div>
      <div class="ordenar">
        <button type="button" class="boton secundario" data-accion="subir" ${pos === 0 ? 'disabled' : ''}>Subir</button>
        <button type="button" class="boton secundario" data-accion="bajar" ${pos === total - 1 ? 'disabled' : ''}>Bajar</button>
        <button type="button" class="boton fantasma" data-accion="quitar">Quitar de la rutina</button>
      </div>
    </div>
  </article>`;
}

function seccionRutina(b) {
  return `<section class="rutina-armada" aria-labelledby="rutina-titulo">
    <h2 id="rutina-titulo">La rutina</h2>
    ${
      b.orden.length
        ? b.orden.map((id, i) => tarjetaEjercicio(id, b.ejercicios[id], id === b.activo, i, b.orden.length)).join('')
        : '<p class="rutina-vacia">Todavía no tiene ejercicios. Añádelos desde la biblioteca, aquí debajo.</p>'
    }
  </section>`;
}

// A library row: the still of the exercise, and one line of text under the name with where it starts, what it needs
// and what it works. Sixty of them must read as a list, not as a wall of chips; among sixty, the picture is found first.
function filaBiblioteca(id, b) {
  const def = EJERCICIOS[id];
  const dentro = b.orden.includes(id);
  const musculos = def.musculos.principales.map((mu) => `<span class="vivo">${esc(MUSCULOS[mu] || mu)}</span>`).join(', ');
  return `<li class="biblio-fila ${id === b.activo && !dentro ? 'activo' : ''}" data-id="${id}">
    <button type="button" class="biblio-ver" data-accion="ver">
      <span class="biblio-poster"><img src="${poster(id, b.cuerpo)}" alt="" width="96" height="72" loading="lazy" decoding="async"></span>
      <span class="titulo"><h3>${esc(def.nombre)}</h3><span class="biblio-meta">${esc(def.posicion)} · ${esc(def.material)}${musculos ? ` · ${musculos}` : ''}</span></span>
    </button>
    ${
      dentro
        ? `<span class="biblio-dentro">${ICONO.check}<span class="rotulo">En la rutina</span></span>`
        : `<button type="button" class="boton secundario biblio-anadir" data-accion="anadir" aria-label="Añadir ${esc(def.nombre)}">${ICONO.mas}<span class="rotulo">Añadir</span></button>`
    }
    <div class="mini-figura"></div>
  </li>`;
}

// Starting positions in the order a person can get into them: standing and sitting first, the floor after.
const POSICIONES = ['De pie', 'Sentado', 'Boca arriba', 'Boca abajo', 'De lado', 'A cuatro patas'];
const grupoPosicion = (def) => def.posicion.split(',')[0].trim();
const rangoPosicion = (g) => (POSICIONES.includes(g) ? POSICIONES.indexOf(g) : POSICIONES.length);

// A long list goes under its starting positions, which is what tells whether this person can do an exercise at all.
// A short one stays flat: a heading over every single exercise is noise.
function listaBiblioteca(b) {
  const ids = buscarEjercicios(b.filtro);
  if (!ids.length) return '<li class="biblio-vacia">Ningún ejercicio con esos filtros.</li>';
  if (ids.length <= 6) return ids.map((id) => filaBiblioteca(id, b)).join('');
  const grupos = new Map();
  for (const id of ids) {
    const g = grupoPosicion(EJERCICIOS[id]);
    grupos.set(g, [...(grupos.get(g) || []), id]);
  }
  return [...grupos.keys()]
    .sort((x, y) => rangoPosicion(x) - rangoPosicion(y))
    .map((g) => `<li class="biblio-grupo"><span>${esc(g)}</span><span class="num">${grupos.get(g).length}</span></li>${grupos.get(g).map((id) => filaBiblioteca(id, b)).join('')}`)
    .join('');
}

function cuentaBiblioteca(b) {
  const n = buscarEjercicios(b.filtro).length;
  if (n === ORDEN.length) return `${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`;
  return `${n} de ${ORDEN.length}`;
}

// Only the areas and muscles some exercise has: a filter that can only give an empty list is noise.
const zonasConEjercicios = () => Object.keys(ZONAS).filter((z) => ORDEN.some((id) => EJERCICIOS[id].zonas.includes(z)));
const musculosDe = (id) => [...EJERCICIOS[id].musculos.principales, ...EJERCICIOS[id].musculos.secundarios];
const musculosConEjercicios = () => Object.keys(MUSCULOS).filter((mu) => ORDEN.some((id) => musculosDe(id).includes(mu)));

// The body map: Gaudí's body from the front and from the back, a point on every area with exercises and the muscle
// groups the figure lights. Touching a point or a muscle filters the library; touching it again lets it go. The
// muscle chosen lights as on the figure, so the map and the list below say the same thing.
function mapaCuerpo(b) {
  const zonas = zonasConEjercicios();
  const musculos = musculosConEjercicios();
  const { ancho, alto, vistas } = MAPA;
  const vista = (v, rotulo) => {
    const { silueta, musculos: regiones } = vistas[v];
    const partes = regiones
      .map(([mu, d]) => {
        const con = musculos.includes(mu);
        const clase = `mapa-musculo${con ? ' con' : ''}${b.filtro.musculo === mu ? ' encendido' : ''}`;
        return `<path class="${clase}" d="${d}"${con ? ` data-accion="musculo-mapa" data-valor="${mu}"` : ''}><title>${esc(MUSCULOS[mu])}</title></path>`;
      })
      .join('');
    const aqui = (z) => (PUNTOS[z] || []).filter((p) => p[0] === v);
    const halos = zonas
      .flatMap((z) => aqui(z).map(([, x, y]) => `<circle class="mapa-halo${b.filtro.zona === z ? ' encendido' : ''}" cx="${x}" cy="${y}" r="26"/>`))
      .join('');
    // Areas on both sides get two points; the second is the same button for the hand, not a second one for the keys.
    const puntos = zonas
      .flatMap((z) =>
        aqui(z).map(([, x, y], i) => {
          const sitio = `left:${((x / ancho) * 100).toFixed(2)}%;top:${((y / alto) * 100).toFixed(2)}%`;
          const nombre = esc(ZONAS[z]);
          return `<button type="button" class="mapa-punto" data-accion="zona" data-valor="${z}" data-nombre="${nombre}" aria-pressed="${b.filtro.zona === z}" style="${sitio}" ${
            i ? 'aria-hidden="true" tabindex="-1"' : `aria-label="${nombre}"`
          }></button>`;
        }),
      )
      .join('');
    return `<figure class="mapa-vista">
      <div class="mapa-lamina">
        <svg viewBox="0 0 ${ancho} ${alto}" aria-hidden="true">
          <defs><clipPath id="mapa-silueta-${v}"><path d="${silueta}"/></clipPath></defs>
          <path class="mapa-silueta" d="${silueta}"/>
          ${partes}
          <g class="mapa-halos" clip-path="url(#mapa-silueta-${v})">${halos}</g>
        </svg>
        ${puntos}
      </div>
      <figcaption>${rotulo}</figcaption>
    </figure>`;
  };
  const elegidos = [
    b.filtro.zona && ZONAS[b.filtro.zona] && `<button type="button" class="mapa-quitar" data-accion="zona" data-valor="" aria-label="Quitar ${esc(ZONAS[b.filtro.zona])}">${esc(ZONAS[b.filtro.zona])}${ICONO.cerrar}</button>`,
    b.filtro.musculo && MUSCULOS[b.filtro.musculo] && `<button type="button" class="mapa-quitar musculo" data-accion="musculo-mapa" data-valor="" aria-label="Quitar ${esc(MUSCULOS[b.filtro.musculo])}">${esc(MUSCULOS[b.filtro.musculo])}${ICONO.cerrar}</button>`,
  ].filter(Boolean);
  return `<div class="mapa" role="group" aria-label="Zona del cuerpo">
    <div class="mapa-vistas">${vista('delante', 'Delante')}${vista('detras', 'Detrás')}</div>
    <p class="mapa-pie">${elegidos.length ? elegidos.join('') : 'Elige una zona o un músculo en la figura.'}</p>
  </div>`;
}

function seccionBiblioteca(b) {
  const musculos = musculosConEjercicios();
  return `<section class="biblioteca" aria-labelledby="biblio-titulo">
    <div class="biblio-cabeza">
      <h2 id="biblio-titulo">Añadir ejercicios</h2>
      <span class="biblio-cuenta num" aria-live="polite">${cuentaBiblioteca(b)}</span>
    </div>
    <div class="biblio-filtros">
      <input type="search" class="buscar" data-accion="buscar" autocomplete="off" placeholder="Buscar por nombre" aria-label="Buscar ejercicios por nombre" value="${esc(b.filtro.texto)}">
      <label class="campo-musculo"><span>Músculo</span>
        <select data-accion="musculo">
          <option value="">Todos</option>
          ${musculos.map((mu) => `<option value="${mu}" ${b.filtro.musculo === mu ? 'selected' : ''}>${esc(MUSCULOS[mu])}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="biblio-cuerpo">
      <div class="hueco-mapa">${mapaCuerpo(b)}</div>
      <ul class="biblio-lista">${listaBiblioteca(b)}</ul>
    </div>
  </section>`;
}

// Templates live in this browser. A template keeps the exercises, their settings and the settings for the whole
// routine; never who it was for.
function seccionPlantillas(b) {
  const lista = almacen.leer('plantillas', []);
  return `<section class="plantillas" aria-labelledby="plantillas-titulo">
    <div class="plantillas-cabeza">
      <h2 id="plantillas-titulo">Plantillas</h2>
      <button type="button" class="boton fantasma" data-accion="nueva-plantilla" ${b.orden.length ? '' : 'hidden'}>Guardar la rutina como plantilla</button>
    </div>
    <form class="plantilla-nueva" hidden>
      <input data-accion="nombre-plantilla" maxlength="60" autocomplete="off" placeholder="Por ejemplo: rodilla, primera semana" aria-label="Nombre de la plantilla">
      <button type="submit" class="boton">Guardar</button>
      <button type="button" class="boton fantasma" data-accion="cancelar-plantilla">Cancelar</button>
    </form>
    ${
      lista.length
        ? `<div class="lista-plantillas">${lista
            .map(
              (p, i) => `<span class="plantilla">
                <button type="button" class="usar" data-accion="usar-plantilla" data-i="${i}">${esc(p.nombre)}<span class="cuantos num">${p.orden.length}</span></button>
                <button type="button" class="borrar" data-accion="borrar-plantilla" data-i="${i}" aria-label="Borrar la plantilla ${esc(p.nombre)}">${ICONO.cerrar}</button>
              </span>`,
            )
            .join('')}</div>`
        : '<p class="ayuda">Aún no hay plantillas: guarda esta rutina como una cuando tenga ejercicios.</p>'
    }
  </section>`;
}

// Under «Para», the people seen most recently: one tap fills the name, links the routine to their file and brings
// their acceptable discomfort.
function personasRecientes(b) {
  const lista = leerPersonas();
  if (!lista.length) return '';
  const reciente = (p) => [p.ultimoResumen, ...p.rutinas.map((r) => r.f)].filter(Boolean).sort().at(-1) || p.creada;
  const seis = [...lista].sort((x, y) => reciente(y).localeCompare(reciente(x))).slice(0, 6);
  return `<div class="recientes" role="group" aria-label="Para una de tus personas">
    <span>Para una de tus personas</span>
    ${seis.map((p) => `<button type="button" class="filtro" data-accion="persona" data-id="${esc(p.id)}" aria-pressed="${b.persona === p.id}">${esc(p.nombre)}</button>`).join('')}
    ${lista.length > 6 ? `<a href="#personas">Todas</a>` : ''}
  </div>`;
}

function vistaArmar() {
  const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
  let gonio = null;
  const guardar = () => almacen.guardar('borrador', b);
  const ajustes = (id) => (b.ejercicios[id] ||= ajustesIniciales(id));

  const resumenCorto = () => {
    if (!b.orden.length) return 'Elige al menos un ejercicio';
    const seg = b.orden.reduce((t, id) => t + duracionEjercicio(b.ejercicios[id], b.descanso), 0);
    return `${b.orden.length} ${b.orden.length === 1 ? 'ejercicio' : 'ejercicios'} · ${minutos(seg)}`;
  };

  function pintar() {
    app.innerHTML = `<div class="armar">
      <div class="armar-izq">
        ${barraApp('Nueva rutina')}
        <nav class="etapas-app" aria-label="Pasos">${etapasApp(b)}</nav>
        <div class="armar-cuerpo">
          <section class="etapa" id="etapa-para" aria-labelledby="etapa-para-t">
            <p class="etapa-titulo" id="etapa-para-t"><b>1</b>Para quién</p>
            <div class="campos">
              <div class="campo"><label for="para">Para</label><input id="para" data-accion="para" autocomplete="off" placeholder="Su nombre" value="${esc(b.para)}"></div>
              <div class="campo"><label for="de">De</label><input id="de" data-accion="de" autocomplete="off" placeholder="Tu nombre" value="${esc(b.de)}"></div>
            </div>
            <div class="hueco-recientes">${personasRecientes(b)}</div>
            <div class="hueco-lleno">${avisoLleno(b)}</div>
          </section>
          <section class="etapa" id="etapa-ejercicios" aria-labelledby="etapa-ejercicios-t">
            <p class="etapa-titulo" id="etapa-ejercicios-t"><b>2</b>Ejercicios</p>
            <div class="hueco-plantillas">${seccionPlantillas(b)}</div>
            <div class="hueco-rutina">${seccionRutina(b)}</div>
            ${seccionBiblioteca(b)}
          </section>
          <section class="etapa" id="etapa-ajustes" aria-labelledby="etapa-ajustes-t">
            <p class="etapa-titulo" id="etapa-ajustes-t"><b>3</b>Ajustes</p>
            <section class="general">
              <h2>Para toda la rutina</h2>
              <div class="fila">
                <div class="ajuste"><span>Descanso entre series</span>${segmentos('descanso', [[30, '30 s'], [45, '45 s'], [60, '1 min'], [90, '1 min 30']], b.descanso)}</div>
                <div class="ajuste"><span>Veces al día</span>${segmentos('veces', [[1, '1'], [2, '2'], [3, '3']], b.veces)}</div>
                <div class="ajuste"><span>Figura</span>${segmentos('cuerpo', FIGURAS, b.cuerpo)}</div>
                <div class="ajuste"><span>Molestia aceptable, de 0 a 10</span>${paso('tope', b.tope, 'Molestia aceptable', 0, 9)}</div>
              </div>
              <p class="ayuda">Si la persona pasa de esa molestia, el día te sale marcado en su resumen.</p>
            </section>
          </section>
        </div>
        <div class="barra-crear" id="etapa-enlace">
          <span class="resumen-corto">${resumenCorto()}</span>
          <button type="button" class="boton" data-accion="crear" ${b.orden.length ? '' : 'disabled'}>Crear enlace</button>
        </div>
      </div>
      <aside class="vista">
        <h2>Así lo verá</h2>
        <div class="vista-figura"></div>
        <div class="vista-pie"></div>
      </aside>
    </div>`;
    colocarFigura();
  }

  // The preview: in the side panel on wide screens; on a phone, inside the active card or library row.
  async function colocarFigura() {
    const ancho = window.matchMedia('(min-width: 980px)').matches;
    const id = b.activo;
    const e = ajustes(id);
    const sitio = ancho
      ? app.querySelector('.vista-figura')
      : app.querySelector(`.ejercicio[data-id="${id}"] .mini-figura`) || app.querySelector(`.biblio-fila.activo[data-id="${id}"] .mini-figura`);
    pintarPieVista();
    if (!sitio) return;
    try {
      const f = await figuraEn(sitio, b.cuerpo);
      // The professional's two marks over the preview: the path of the movement and, under it, the goniometer.
      f.oyentes = { fase: [alFase], dibujado: [() => pintarRecorrido(f, gonio && gonio.id === f.id ? gonio.k : null)] };
      await f.poner(id, { tempo: e.tempo, lado: e.lado === 'izq' ? 'izq' : 'der' });
      gonio = await medida(f);
      pintarGonio();
      f.empezar({ modo: 'demo' });
    } catch (err) {
      sitio.innerHTML = `<p class="chip">La figura de este ejercicio aún no está</p>`;
      console.warn(err);
    }
  }

  function pintarPieVista() {
    const pie = app.querySelector('.vista-pie');
    const e = ajustes(b.activo);
    if (pie) pie.innerHTML = `<div class="tarjeta"><h3>${esc(EJERCICIOS[b.activo].nombre)}</h3>${svgTempo(e.tempo, { etiquetas: true, punto: true })}<span class="chip">${textoTempo(e.tempo)}</span><div class="gonio" hidden></div></div>`;
    pintarGonio();
  }

  // The goniometer of the exercise on the figure, when its sheet has the angles; a new picture of the foot redraws it.
  function pintarGonio() {
    const cont = app.querySelector('.vista-pie .gonio');
    if (cont && gonio && gonio.id === b.activo) dibujar(cont, gonio);
  }

  const alFase = (fase, restante, progreso) => {
    if (progreso !== undefined) moverPunto(app.querySelector('.vista-pie .tempo'), ajustes(b.activo).tempo, progreso);
    if (gonio && fase) actualizar(app.querySelector('.vista-pie .gonio'), figura, gonio, fase, restante);
  };

  // Re-drawing a part of the page must not drop the figure's canvas: it is put aside and placed again.
  function apartarLienzo(zona) {
    const lienzo = figura?.renderer.domElement;
    if (lienzo && zona.contains(lienzo)) lienzo.remove();
  }

  function actualizarBarra() {
    app.querySelector('.resumen-corto').textContent = resumenCorto();
    const etapas = app.querySelector('.etapas-app');
    if (etapas) etapas.innerHTML = etapasApp(b);
    app.querySelector('[data-accion="crear"]').disabled = !b.orden.length;
    const nueva = app.querySelector('[data-accion="nueva-plantilla"]');
    if (nueva) nueva.hidden = !b.orden.length;
  }

  function refrescarTarjeta(id) {
    const vieja = app.querySelector(`.ejercicio[data-id="${id}"]`);
    const lienzo = figura?.renderer.domElement;
    const conservar = lienzo && vieja.contains(lienzo);
    const nueva = document.createElement('div');
    const pos = b.orden.indexOf(id);
    nueva.innerHTML = tarjetaEjercicio(id, b.ejercicios[id], id === b.activo, pos, b.orden.length);
    const art = nueva.firstElementChild;
    if (conservar) art.querySelector('.mini-figura').appendChild(lienzo);
    vieja.replaceWith(art);
    actualizarBarra();
  }

  function refrescarRutina() {
    const hueco = app.querySelector('.hueco-rutina');
    apartarLienzo(hueco);
    hueco.innerHTML = seccionRutina(b);
    actualizarBarra();
  }

  function refrescarBiblioteca() {
    const lista = app.querySelector('.biblio-lista');
    apartarLienzo(lista);
    lista.innerHTML = listaBiblioteca(b);
    app.querySelector('.biblio-cuenta').textContent = cuentaBiblioteca(b);
  }

  // The map and the muscle list say the same filter.
  function refrescarFiltros() {
    app.querySelector('.hueco-mapa').innerHTML = mapaCuerpo(b);
    app.querySelector('[data-accion="musculo"]').value = b.filtro.musculo;
    refrescarBiblioteca();
  }

  // Opening a card folds another one above it: what was just touched stays where it was on the screen.
  function sinSaltar(buscar, cambiar) {
    const antes = buscar()?.getBoundingClientRect().top;
    cambiar();
    const despues = buscar()?.getBoundingClientRect().top;
    if (antes !== undefined && despues !== undefined && Math.abs(despues - antes) > 1) window.scrollBy(0, despues - antes);
  }

  function refrescarPlantillas() {
    app.querySelector('.hueco-plantillas').innerHTML = seccionPlantillas(b);
  }

  function actualizarTempo(id) {
    const e = b.ejercicios[id];
    if (figura && id === b.activo) {
      figura.tempo = [...e.tempo];
      figura.lado(e.lado === 'izq' ? 'izq' : 'der');
    }
    if (id === b.activo) pintarPieVista();
  }

  function elegir(id) {
    b.activo = id;
    app.querySelectorAll('.ejercicio').forEach((t) => {
      t.classList.toggle('activo', t.dataset.id === id);
      t.querySelector('.ejercicio-cabeza').setAttribute('aria-expanded', String(t.dataset.id === id));
    });
    app.querySelectorAll('.biblio-fila').forEach((t) => t.classList.toggle('activo', t.dataset.id === id && !b.orden.includes(id)));
    colocarFigura();
  }

  function guardarPlantilla(nombre) {
    const lista = almacen.leer('plantillas', []).filter((p) => p.nombre !== nombre);
    lista.unshift({
      nombre, d: b.descanso, x: b.veces, m: b.tope, c: b.cuerpo, orden: [...b.orden],
      ejercicios: Object.fromEntries(b.orden.map((id) => [id, JSON.parse(JSON.stringify(b.ejercicios[id]))])),
    });
    almacen.guardar('plantillas', lista.slice(0, 60));
    refrescarPlantillas();
  }

  function usarPlantilla(p) {
    Object.assign(b, { descanso: p.d, veces: p.x, tope: p.m ?? TOPE_MOLESTIA, cuerpo: p.c || 'a' });
    b.orden = p.orden.filter((id) => ORDEN.includes(id));
    for (const id of b.orden) b.ejercicios[id] = { ...ajustesIniciales(id), ...JSON.parse(JSON.stringify(p.ejercicios[id] || {})) };
    b.activo = b.orden[0] || b.activo;
    apartarLienzo(app);
    pintar();
  // A template chosen in the Plantillas tab arrives here, once.
  const pendiente = almacen.leer('plantilla-a-usar', null);
  if (pendiente !== null) {
    almacen.guardar('plantilla-a-usar', null);
    const p = almacen.leer('plantillas', [])[pendiente];
    if (p) usarPlantilla(p);
  }
  }

  let deshacerBorrar = null;
  app.onclick = (ev) => {
    const el = ev.target.closest('[data-accion]');
    const a = el?.dataset.accion;
    const sitio = ev.target.closest('.ejercicio, .biblio-fila');
    const id = sitio?.dataset.id;
    if (a !== 'borrar-plantilla' && deshacerBorrar) deshacerBorrar();
    if (sitio && id !== b.activo && a !== 'anadir' && a !== 'quitar') {
      // Choosing a card or a row only moves the preview; it never re-draws, so a text field keeps its focus.
      sinSaltar(() => sitio, () => elegir(id));
      if (a === 'elegir' || a === 'ver' || !a) return guardar();
    }
    if (!el) return guardar();
    const delta = Number(el.dataset.delta || 0);
    if (a === 'anadir') {
      ajustes(id);
      if (!b.orden.includes(id)) b.orden.push(id);
      b.activo = id;
      // The routine grows above the library: the row just added stays under the pointer.
      sinSaltar(() => app.querySelector(`.biblio-fila[data-id="${id}"]`), () => {
        refrescarRutina();
        refrescarBiblioteca();
      });
      colocarFigura();
    } else if (a === 'quitar') {
      b.orden = b.orden.filter((x) => x !== id);
      if (b.activo === id) b.activo = b.orden[0] || id;
      refrescarRutina();
      refrescarBiblioteca();
      colocarFigura();
    } else if (a === 'subir' || a === 'bajar') {
      const i = b.orden.indexOf(id);
      const j = a === 'subir' ? i - 1 : i + 1;
      if (j >= 0 && j < b.orden.length) [b.orden[i], b.orden[j]] = [b.orden[j], b.orden[i]];
      refrescarRutina();
      colocarFigura();
      app.querySelector(`.ejercicio[data-id="${id}"] [data-accion="${a}"]:not(:disabled)`)?.focus();
    } else if (a === 'series' || a === 'reps') {
      const lim = a === 'series' ? [1, 6] : [1, 30];
      b.ejercicios[id][a] = Math.min(lim[1], Math.max(lim[0], b.ejercicios[id][a] + delta));
      refrescarTarjeta(id);
    } else if (/^t[012]$/.test(a)) {
      const i = Number(a[1]);
      const lim = i === 1 ? [0, 30] : [1, 6];
      b.ejercicios[id].tempo[i] = Math.min(lim[1], Math.max(lim[0], b.ejercicios[id].tempo[i] + delta));
      refrescarTarjeta(id);
      actualizarTempo(id);
    } else if (a === 'lado') {
      b.ejercicios[id].lado = el.dataset.valor;
      refrescarTarjeta(id);
      actualizarTempo(id);
    } else if (a === 'zona' || a === 'musculo-mapa') {
      const clave = a === 'zona' ? 'zona' : 'musculo';
      const valor = el.dataset.valor;
      b.filtro[clave] = valor && b.filtro[clave] === valor ? '' : valor;
      refrescarFiltros();
      // Keyboard users keep their place: focus goes back to the same point, or to the map after letting go.
      if (ev.detail === 0) (app.querySelector(`.mapa [data-accion="${a}"][data-valor="${valor}"]:not([aria-hidden])`) || app.querySelector('.mapa-punto'))?.focus();
    } else if (a === 'cuerpo') {
      b.cuerpo = el.dataset.valor;
      el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
      refrescarBiblioteca();
      colocarFigura();
    } else if (a === 'tope') {
      b.tope = Math.min(9, Math.max(0, b.tope + delta));
      el.closest('.paso').outerHTML = paso('tope', b.tope, 'Molestia aceptable', 0, 9);
    } else if (a === 'descanso' || a === 'veces') {
      b[a] = Number(el.dataset.valor);
      el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
      actualizarBarra();
    } else if (a === 'nueva-plantilla') {
      const form = app.querySelector('.plantilla-nueva');
      form.hidden = false;
      form.querySelector('input').focus();
    } else if (a === 'cancelar-plantilla') {
      app.querySelector('.plantilla-nueva').hidden = true;
    } else if (a === 'usar-plantilla') {
      const p = almacen.leer('plantillas', [])[Number(el.dataset.i)];
      if (p) usarPlantilla(p);
    } else if (a === 'borrar-plantilla') {
      // A first touch asks; the second one deletes. Touching anything else, or waiting, leaves it as it was.
      if (el.dataset.confirmar) {
        deshacerBorrar = null;
        const lista = almacen.leer('plantillas', []);
        lista.splice(Number(el.dataset.i), 1);
        almacen.guardar('plantillas', lista);
        refrescarPlantillas();
      } else {
        if (deshacerBorrar) deshacerBorrar();
        el.dataset.confirmar = '1';
        el.classList.add('confirmar');
        el.textContent = '¿Borrar?';
        const t = setTimeout(() => deshacerBorrar?.(), 4000);
        deshacerBorrar = () => {
          clearTimeout(t);
          deshacerBorrar = null;
          if (el.isConnected) {
            delete el.dataset.confirmar;
            el.classList.remove('confirmar');
            el.innerHTML = ICONO.cerrar;
          }
        };
      }
    } else if (a === 'persona') {
      const p = leerPersonas().find((x) => x.id === el.dataset.id);
      if (p) {
        b.para = p.nombre;
        b.persona = p.id;
        if (Number.isInteger(p.m)) b.tope = p.m;
        app.querySelector('#para').value = p.nombre;
        app.querySelector('.hueco-recientes').innerHTML = personasRecientes(b);
        const tope = app.querySelector('.general [data-accion="tope"]')?.closest('.paso');
        if (tope) tope.outerHTML = paso('tope', b.tope, 'Molestia aceptable', 0, 9);
      }
    } else if (a === 'crear') {
      crearEnlace(b);
    } else if (a === 'ir-etapa') {
      app.querySelector(`#etapa-${el.dataset.etapa}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (el.dataset.etapa === 'enlace') app.querySelector('[data-accion="crear"]')?.focus({ preventScroll: true });
    }
    guardar();
  };

  app.oninput = (ev) => {
    const a = ev.target.dataset.accion;
    if (a === 'para' || a === 'de') b[a] = ev.target.value;
    if (a === 'para') {
      const etapas = app.querySelector('.etapas-app');
      if (etapas) etapas.innerHTML = etapasApp(b);
      const lleno = app.querySelector('.hueco-lleno');
      if (lleno) lleno.innerHTML = avisoLleno(b);
    }
    if (a === 'para' && b.persona) {
      const elegida = leerPersonas().find((x) => x.id === b.persona);
      if (!elegida || elegida.nombre !== b.para.trim()) {
        b.persona = null;
        app.querySelector('.hueco-recientes').innerHTML = personasRecientes(b);
      }
    }
    if (a === 'nota') b.ejercicios[ev.target.closest('.ejercicio').dataset.id].nota = ev.target.value;
    if (a === 'buscar') {
      b.filtro.texto = ev.target.value;
      refrescarBiblioteca();
    }
    guardar();
  };

  app.onchange = (ev) => {
    if (ev.target.dataset.accion !== 'musculo') return;
    b.filtro.musculo = ev.target.value;
    refrescarFiltros();
    guardar();
  };

  app.onsubmit = (ev) => {
    ev.preventDefault();
    const entrada = ev.target.querySelector('[data-accion="nombre-plantilla"]');
    const nombre = entrada?.value.trim();
    if (!nombre) return entrada?.focus();
    guardarPlantilla(nombre);
  };

  pintar();
  const ancho = window.matchMedia('(min-width: 980px)');
  const alCambiarAncho = () => colocarFigura();
  ancho.addEventListener('change', alCambiarAncho);
  return () => {
    ancho.removeEventListener('change', alCambiarAncho);
    if (figura) figura.oyentes = {};
    app.onclick = app.oninput = app.onchange = app.onsubmit = null;
  };
}

async function crearEnlace(b) {
  const rutina = {
    v: 1,
    para: b.para.trim(),
    de: b.de.trim(),
    d: b.descanso,
    x: b.veces,
    m: b.tope,
    c: b.cuerpo || 'a',
    f: diaLocal(),
    e: b.orden.map((id) => {
      const e = b.ejercicios[id];
      return { i: id, s: e.series, r: e.reps, t: e.tempo, l: e.lado, n: e.nota.trim() || undefined };
    }),
  };
  // With a name, the routine goes to that person's file: the one chosen in the builder, the only one with that name,
  // or a new one. Its id travels in the link (p) and comes back with each summary.
  const lista = leerPersonas();
  let persona = null;
  let sinSitio = false;
  if (rutina.para) {
    const iguales = buscarPorNombre(lista, rutina.para);
    persona = (b.persona && lista.find((x) => x.id === b.persona)) || (iguales.length === 1 ? iguales[0] : null);
    if (!persona && caben(lista)) persona = crearPersona(lista, rutina.para);
    if (persona) rutina.p = persona.id;
    else sinSitio = true;
  }
  const codigo = await codificar(rutina);
  if (persona) {
    apuntarRutina(lista, { id: persona.id, nombre: rutina.para }, rutina, codigo);
    guardarPersonas(lista);
    b.persona = persona.id;
    almacen.guardar('borrador', b);
  }
  const url = `${location.origin}${location.pathname}${location.search}#r=${codigo}`;
  const saludo = rutina.para ? `Hola, ${rutina.para}. ` : '';
  const mensaje = `${saludo}Aquí tienes tu rutina de ejercicios. Ábrela en el móvil y sigue a la figura:`;

  let qr = '';
  try {
    const q = window.qrcode(0, 'L');
    q.addData(url);
    q.make();
    qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch {
    qr = '<p>El enlace es demasiado largo para un código QR.</p>';
  }

  const capa = document.createElement('div');
  capa.className = 'capa';
  capa.innerHTML = `<div class="hoja" role="dialog" aria-modal="true" aria-labelledby="hoja-titulo">
    <h2 id="hoja-titulo">La rutina, lista</h2>
    <p>Mándale el enlace por WhatsApp o Telegram, o que escanee el código con su móvil. Todo va dentro del enlace: no se guarda en ningún servidor.</p>
    ${persona ? `<p class="en-ficha">Guardada en la ficha de ${esc(persona.nombre)}. <a href="#persona=${esc(persona.id)}">Ver su ficha</a></p>` : ''}
    ${sinSitio ? `<p class="en-ficha">No se guarda en una ficha: ya tienes ${limite()} personas con ficha, el máximo de la versión gratis. La rutina va igual en el enlace. Para guardar a más personas, la versión de pago no tiene límite.</p>` : ''}
    <div class="qr">${qr}</div>
    <div class="enlace-texto">${esc(url)}</div>
    <div class="botones">
      <a class="boton" href="${esc(enlaceMensaje('wa', mensaje, url))}" target="_blank" rel="noopener">${ICONO.whatsapp}Enviar por WhatsApp</a>
      <a class="boton" href="${esc(enlaceMensaje('tg', mensaje, url))}" target="_blank" rel="noopener">${ICONO.telegram}Enviar por Telegram</a>
      <button type="button" class="boton secundario" data-h="copiar">Copiar enlace</button>
      <a class="boton fantasma" href="${esc(url)}" target="_blank" rel="noopener">Verla como la persona</a>
    </div>
  </div>`;
  document.body.appendChild(capa);
  capa.addEventListener('click', async (ev) => {
    if (ev.target === capa || ev.target.closest('.en-ficha a')) capa.remove();
    if (ev.target.closest('[data-h="copiar"]')) {
      try {
        await navigator.clipboard.writeText(url);
        ev.target.closest('button').textContent = 'Copiado';
      } catch {
        ev.target.closest('button').textContent = 'No se pudo copiar';
      }
    }
  });
}

// ---------- Routine (the person) ----------
function hashCorto(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

let audio = null;
function tono(frecuencia, duracion = 0.12, volumen = 0.08) {
  if (!audio) return;
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = 'sine';
  o.frequency.value = frecuencia;
  g.gain.setValueAtTime(0, audio.currentTime);
  g.gain.linearRampToValueAtTime(volumen, audio.currentTime + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duracion);
  o.connect(g).connect(audio.destination);
  o.start();
  o.stop(audio.currentTime + duracion + 0.02);
}
const vibrar = (ms) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Some browsers throw without a user gesture.
  }
};

async function vistaRutina(codigo) {
  let r;
  try {
    r = await decodificar(codigo);
  } catch {
    app.innerHTML = `<div class="saludo"><h1>Este enlace no se puede abrir</h1><p>Pide que te lo vuelvan a mandar.</p></div>`;
    return () => {};
  }
  const ejercicios = r.e.filter((e) => EJERCICIOS[e.i]);
  const clave = 'hist:' + hashCorto(codigo);
  const totalSeg = ejercicios.reduce((t, e) => t + duracionEjercicio({ series: e.s, reps: e.r, tempo: e.t, lado: e.l }, r.d), 0);
  const tope = Number.isInteger(r.m) ? r.m : TOPE_MOLESTIA;
  const quien = r.de ? esc(r.de) : 'quien te dio la rutina';
  let mananaOmitida = false;

  // The day after a session, the person says how the area felt on getting up: under the pain-monitoring model the
  // discomfort should be gone by then. The answer goes with the last session of the day before. Not asked in the
  // small hours, when "this morning" has not happened yet, nor twice.
  function sesionDeAyer(hist) {
    if (mananaOmitida || new Date().getHours() < 5) return -1;
    const ayer = diaAnterior();
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].f === ayer) return hist[i].a === undefined ? i : -1;
      if (hist[i].f < ayer) return -1;
    }
    return -1;
  }

  function preguntaManana() {
    return `<section class="tarjeta manana" aria-labelledby="manana-titulo">
      <h3 id="manana-titulo">¿Qué tal al levantarte?</h3>
      <p>Ayer hiciste la rutina. Esta mañana, al levantarte, ¿cuánta molestia notabas? (0 es nada; 10, mucha)</p>
      <div class="escala">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-r="manana" data-v="${n}" aria-pressed="false" class="num">${n}</button>`).join('')}</div>
      <button type="button" class="boton fantasma" data-r="manana-no">Ahora no</button>
    </section>`;
  }

  function apuntarManana(valor) {
    const hist = almacen.leer(clave, []);
    const i = sesionDeAyer(hist);
    if (i < 0) return;
    hist[i].a = valor;
    almacen.guardar(clave, hist);
    const tarjeta = app.querySelector('.manana');
    tarjeta.innerHTML = `<p class="apuntado">Apuntado: ${valor} de 10 al levantarte.${
      pasaDelTope(valor, tope) ? ` Es más de ${tope}: saldrá marcado en el resumen que le mandes a ${quien}.` : ''
    }</p>`;
    pintarPie(hist);
  }

  function pintarPie(hist) {
    const pie = app.querySelector('.pie');
    if (pie) {
      pie.innerHTML = `<button type="button" class="boton" data-r="empezar">${ICONO.play}Empezar</button>
        ${hist.length ? `<div class="mandar-por"><span>Mandar lo hecho a ${quien}</span>
          <button type="button" class="boton fantasma" data-r="mandar" data-canal="wa">${ICONO.whatsapp}WhatsApp</button>
          <button type="button" class="boton fantasma" data-r="mandar" data-canal="tg">${ICONO.telegram}Telegram</button></div>` : ''}`;
    }
  }

  function intro() {
    const hist = almacen.leer(clave, []);
    const hoy = diaLocal();
    const vecesHoy = hist.filter((d) => d.f === hoy).length;
    app.innerHTML = `<div class="rutina">
      <header class="saludo">
        <div class="cabecera-yeso cabecera-rutina" aria-hidden="true"></div>
        ${r.de ? `<div class="de">Tu rutina de ${esc(r.de)}</div>` : ''}
        <h1>${r.para ? `Hola, ${esc(r.para)}` : 'Tu rutina'}</h1>
        <p>${ejercicios.length} ${ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}, ${minutos(totalSeg)}${r.x > 1 ? ` · ${r.x} veces al día` : ''}${vecesHoy ? ` · hoy llevas ${vecesHoy}` : ''}.</p>
      </header>
      <section class="lista">
        ${sesionDeAyer(hist) >= 0 ? preguntaManana() : ''}
        ${ejercicios
          .map((e) => {
            const def = EJERCICIOS[e.i];
            // The still of the exercise, of their figure and their side: the left side, in mirror.
            return `<article class="tarjeta">
              <div class="tarjeta-cabeza">
                <span class="tarjeta-poster"><img src="${poster(e.i, r.c)}" alt="" width="112" height="84" decoding="async"${e.l === 'izq' ? ' class="espejo"' : ''}></span>
                <div>
                  <h3>${esc(def.nombre)}</h3>
                  <div class="linea-chips">
                    <span class="chip num">${e.s} ${e.s === 1 ? 'serie' : 'series'} de ${e.r}</span>
                    ${def.unLado ? `<span class="chip">${LADOS[e.l]}</span>` : ''}
                    <span class="chip">${esc(def.material)}</span>
                  </div>
                </div>
              </div>
              ${svgTempo(e.t, { etiquetas: true })}
              ${e.n ? `<div class="nota">${esc(e.n)}</div>` : ''}
            </article>`;
          })
          .join('')}
        <p class="sin-conexion" aria-live="polite"></p>
      </section>
      <footer class="pie"></footer>
    </div>`;
    pintarPie(hist);
    avisarSinConexion();
  }

  let guardada = null;
  async function avisarSinConexion() {
    guardada ||= guardarParaSinConexion(r.c, [...new Set(ejercicios.map((e) => e.i))]).catch(() => false);
    if (!(await guardada)) return;
    const p = app.querySelector('.sin-conexion');
    if (p) p.textContent = 'Guardada en este móvil: puedes hacerla aunque no tengas conexión.';
  }

  // Queue: every exercise, every side, every set.
  const cola = [];
  for (const e of ejercicios) for (const lado of e.l === 'ambos' && EJERCICIOS[e.i].unLado ? ['der', 'izq'] : [e.l === 'izq' ? 'izq' : 'der']) cola.push({ e, lado });
  let sesion = null;
  let bloqueo = null;

  // Sound and the screen lock are extras: the set never waits for them. Without a gesture the browser may keep
  // resume() pending forever (seen on a Pixel), and the person would stay on «Empezar». A later touch unlocks the sound.
  async function empezar() {
    const unRato = () => new Promise((r) => setTimeout(r, 400));
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      await Promise.race([audio.resume(), unRato()]);
      if (audio.state !== 'running') app.addEventListener('pointerdown', () => audio?.resume().catch(() => {}), { once: true });
    } catch {
      audio = null;
    }
    try {
      const pedido = navigator.wakeLock?.request('screen');
      bloqueo = (await Promise.race([pedido, unRato()])) || null;
      if (!bloqueo && pedido) pedido.then((b) => (bloqueo = b)).catch(() => {});
    } catch {
      bloqueo = null;
    }
    sesion = { item: 0, serie: 0, hechas: cola.map((c) => Array(c.e.s).fill(0)), molestia: {}, inicio: new Date() };
    pintarJugador();
    await prepararSerie();
  }

  function pintarJugador() {
    app.innerHTML = `<div class="jugador">
      <div class="jugador-arriba">
        <button type="button" class="redondo" data-r="salir" aria-label="Salir">${ICONO.cerrar}</button>
        <div class="titulo"><h2 class="j-nombre"></h2><div class="sub j-sub num"></div></div>
      </div>
      <div class="escena">
        <span class="chip lado-etiqueta j-lado oculto"></span>
        <div class="girar-pista">${ICONO.girar} Arrastra para girar la figura</div>
      </div>
      <div class="mando j-mando"></div>
    </div>`;
  }

  const actual = () => cola[sesion.item];

  async function prepararSerie() {
    const { e, lado } = actual();
    const def = EJERCICIOS[e.i];
    app.querySelector('.j-nombre').textContent = def.nombre;
    app.querySelector('.j-sub').textContent = `Serie ${sesion.serie + 1} de ${e.s}`;
    const etiquetaLado = app.querySelector('.j-lado');
    etiquetaLado.textContent = LADOS[lado];
    etiquetaLado.classList.toggle('oculto', !def.unLado);
    const f = await figuraEn(app.querySelector('.escena'), r.c);
    f.oyentes = {};
    f.on('girado', () => app.querySelector('.girar-pista')?.style.setProperty('opacity', '0'));
    await f.poner(e.i, { tempo: e.t, lado });
    cuentaAtras(3);
  }

  function cuentaAtras(n) {
    sesion.estado = 'cuenta';
    const mando = app.querySelector('.j-mando');
    const { e } = actual();
    mando.innerHTML = `<div class="centro"><p>Prepárate</p><h3 class="num cuenta-atras">${n}</h3><p>${textoTempo(e.t)}</p></div>
      <div class="mando-botones"><button type="button" class="boton fantasma" data-r="como">Cómo se hace</button><span></span><button type="button" class="boton fantasma" data-r="ya">Empezar ya</button></div>`;
    tono(660, 0.08);
    clearTimeout(sesion.temporizador);
    sesion.temporizador = setTimeout(() => (n > 1 ? cuentaAtras(n - 1) : jugarSerie()), 1000);
  }

  function jugarSerie() {
    sesion.estado = 'serie';
    clearTimeout(sesion.temporizador);
    const { e } = actual();
    const mando = app.querySelector('.j-mando');
    mando.innerHTML = `<div class="cuenta">
        <div class="grande num"><span class="j-rep">1</span> <small>de ${e.r}</small></div>
        <div class="fase j-fase">Sube</div>
      </div>
      ${svgTempo(e.t, { punto: true })}
      <div class="mando-botones">
        <button type="button" class="boton fantasma" data-r="como">Cómo se hace</button>
        <button type="button" class="principal" data-r="pausa" aria-label="Pausa">${ICONO.pausa}</button>
        <button type="button" class="boton fantasma" data-r="saltar">Terminar serie</button>
      </div>`;
    const svg = mando.querySelector('.tempo');
    const elFase = mando.querySelector('.j-fase');
    const elRep = mando.querySelector('.j-rep');
    const nombres = { subir: 'Sube', mantener: 'Mantén', bajar: 'Baja', reposo: 'Respira' };
    const f = figura;
    f.oyentes.fase = [];
    f.oyentes.cambio = [];
    f.oyentes.repeticion = [];
    f.oyentes.fin = [];
    f.on('fase', (fase, restante, progreso) => {
      if (!fase) return;
      moverPunto(svg, e.t, progreso);
      const seg = fase === 'mantener' ? ` ${Math.ceil(restante)}` : '';
      const texto = nombres[fase] + seg;
      if (elFase.textContent !== texto) elFase.textContent = texto;
      elFase.classList.toggle('mantener', fase === 'mantener');
    });
    f.on('cambio', (fase) => {
      if (fase === 'subir') tono(740);
      if (fase === 'mantener') tono(880, 0.18);
      if (fase === 'bajar') tono(520);
    });
    f.on('repeticion', (n) => {
      sesion.hechas[sesion.item][sesion.serie] = n;
      elRep.textContent = Math.min(n + 1, e.r);
      vibrar(25);
    });
    f.on('fin', () => {
      sesion.hechas[sesion.item][sesion.serie] = e.r;
      tono(660, 0.12);
      setTimeout(() => tono(990, 0.25), 130);
      vibrar([40, 60, 40]);
      siguiente();
    });
    f.empezar({ modo: 'serie', reps: e.r });
  }

  function siguiente() {
    const { e } = actual();
    if (sesion.serie + 1 < e.s) {
      sesion.serie++;
      descanso(r.d);
      return;
    }
    // Last set of this side: if the same exercise continues on the other side, go on; otherwise rate it.
    const sigue = cola[sesion.item + 1];
    if (sigue && sigue.e === e) {
      sesion.item++;
      sesion.serie = 0;
      descanso(r.d, true);
      return;
    }
    valorar();
  }

  function descanso(segundos, cambiaLado = false) {
    sesion.estado = 'descanso';
    const mando = app.querySelector('.j-mando');
    const { e, lado } = actual();
    const total = segundos;
    let quedan = segundos;
    const radio = 56;
    const largo = 2 * Math.PI * radio;
    mando.innerHTML = `<div class="centro"><h3>Descansa</h3><p>${cambiaLado ? `Ahora, ${LADOS[lado].toLowerCase()}` : `Siguiente: serie ${sesion.serie + 1} de ${e.s}`}</p></div>
      <svg class="anillo" viewBox="0 0 132 132"><circle class="fondo-anillo" cx="66" cy="66" r="${radio}"/><circle class="avance" cx="66" cy="66" r="${radio}" stroke-dasharray="${largo}" stroke-dashoffset="0" transform="rotate(-90 66 66)"/><text x="66" y="66" class="num">${quedan}</text></svg>
      <div class="mando-botones"><button type="button" class="boton fantasma" data-r="mas">+15 s</button><span></span><button type="button" class="boton fantasma" data-r="ya">Seguir ya</button></div>`;
    if (cambiaLado) {
      app.querySelector('.j-sub').textContent = `Serie 1 de ${e.s}`;
      app.querySelector('.j-lado').textContent = LADOS[lado];
      figura.lado(lado);
    } else {
      app.querySelector('.j-sub').textContent = `Serie ${sesion.serie + 1} de ${e.s}`;
    }
    figura.parar();
    const anillo = mando.querySelector('.avance');
    const texto = mando.querySelector('text');
    sesion.extra = 0;
    clearInterval(sesion.reloj);
    sesion.reloj = setInterval(() => {
      quedan--;
      texto.textContent = Math.max(0, quedan);
      anillo.setAttribute('stroke-dashoffset', String(largo * (1 - Math.max(0, quedan) / (total + sesion.extra))));
      if (quedan <= 3 && quedan > 0) tono(600, 0.06);
      if (quedan <= 0) {
        clearInterval(sesion.reloj);
        cuentaAtras(3);
      }
    }, 1000);
    sesion.sumar = () => {
      quedan += 15;
      sesion.extra += 15;
      texto.textContent = quedan;
    };
  }

  function valorar() {
    sesion.estado = 'valorar';
    clearInterval(sesion.reloj);
    figura.parar();
    const { e } = actual();
    const def = EJERCICIOS[e.i];
    const items = cola.map((c, i) => ({ c, i })).filter(({ c }) => c.e === e);
    const mando = app.querySelector('.j-mando');
    mando.innerHTML = `<div class="centro"><h3>${esc(def.nombre)}, hecho</h3><p>Corrige si hiciste menos repeticiones.</p></div>
      ${items
        .map(
          ({ c, i }) => `<div class="series-hechas">${def.unLado ? `<span class="chip">${LADOS[c.lado]}</span>` : ''}${sesion.hechas[i]
            .map((v, s) => `<label class="ajuste"><span>Serie ${s + 1}</span>${paso(`h-${i}-${s}`, v, `Serie ${s + 1}`, 0, 50)}</label>`)
            .join('')}</div>`,
        )
        .join('')}
      <div class="ajuste"><span>¿Cuánta molestia has notado? (0 es nada; 10, mucha)</span>
        <div class="escala">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-r="molestia" data-v="${n}" aria-pressed="false" class="num">${n}</button>`).join('')}</div>
        <p class="aviso-molestia" aria-live="polite"></p>
      </div>
      <button type="button" class="boton" data-r="continuar">${sesion.item + 1 < cola.length ? 'Siguiente ejercicio' : 'Terminar'}</button>`;
  }

  function terminar() {
    try {
      bloqueo?.release();
    } catch {
      // Already released.
    }
    figura?.parar();
    const ahora = new Date();
    const dia = {
      f: diaLocal(ahora),
      h: ahora.toTimeString().slice(0, 5),
      e: cola.map((c, i) => ({ i: c.e.i, l: c.lado, s: c.e.s, r: c.e.r, p: sesion.hechas[i], m: sesion.molestia[c.e.i] })),
    };
    const hist = almacen.leer(clave, []);
    hist.push(dia);
    almacen.guardar(clave, hist.slice(-60));
    app.innerHTML = `<div class="rutina">
      <header class="saludo"><div class="de">Hecho</div><h1>Rutina de hoy, completa</h1><p>${((t) => t[0].toUpperCase() + t.slice(1))(minutos((ahora - sesion.inicio) / 1000))} de trabajo. ${r.de ? `Mándale a ${esc(r.de)} cómo te ha ido.` : ''}</p></header>
      <section class="lista">${resumenDia(dia, tope)}</section>
      <footer class="pie">
        <button type="button" class="boton" data-r="mandar" data-canal="wa">${ICONO.whatsapp}Mandar por WhatsApp</button>
        <button type="button" class="boton" data-r="mandar" data-canal="tg">${ICONO.telegram}Mandar por Telegram</button>
        <button type="button" class="boton fantasma" data-r="volver">Volver a la rutina</button>
      </footer>
    </div>`;
  }

  // The summary goes back by WhatsApp or Telegram, as the person prefers. It carries the id of their file on the
  // professional's side (p), so it lands on the right person even when two share a name.
  async function mandar(canal = 'wa') {
    const hist = almacen.leer(clave, []);
    const resumen = { v: 1, p: r.p, para: r.para, de: r.de, m: tope, dias: hist.slice(-14) };
    const cod = await codificar(resumen);
    const url = `${location.origin}${location.pathname}${location.search}#s=${cod}`;
    const texto = `${r.para ? r.para + ': ' : ''}así va mi rutina (${hist.length} ${hist.length === 1 ? 'vez' : 'veces'}).`;
    window.open(enlaceMensaje(canal, texto, url), '_blank', 'noopener');
  }

  function como() {
    const { e } = actual();
    const def = EJERCICIOS[e.i];
    const estado = sesion.estado;
    const pausada = estado === 'serie' && figura?.enMarcha;
    if (pausada) figura.pausar();
    if (estado === 'cuenta') clearTimeout(sesion.temporizador);
    const capa = document.createElement('div');
    capa.className = 'capa';
    capa.innerHTML = `<div class="hoja" role="dialog" aria-modal="true" aria-labelledby="como-titulo"><h2 id="como-titulo">${esc(def.nombre)}</h2>
      ${explicacion(def)}
      ${e.n ? `<p class="nota">${esc(e.n)}</p>` : ''}
      <button type="button" class="boton">Entendido</button></div>`;
    document.body.appendChild(capa);
    capa.addEventListener('click', (ev) => {
      if (ev.target === capa || ev.target.closest('.boton')) {
        capa.remove();
        if (pausada) figura.seguir();
        else if (estado === 'cuenta') cuentaAtras(3);
      }
    });
  }

  app.onclick = async (ev) => {
    const el = ev.target.closest('[data-r], [data-accion]');
    if (!el) return;
    const a = el.dataset.r || el.dataset.accion;
    if (a === 'empezar') return empezar();
    if (a === 'mandar') return mandar(el.dataset.canal);
    if (a === 'volver') return intro();
    if (a === 'salir') {
      clearTimeout(sesion?.temporizador);
      clearInterval(sesion?.reloj);
      figura?.parar();
      return intro();
    }
    if (a === 'como') return como();
    if (a === 'ya') {
      clearInterval(sesion.reloj);
      return jugarSerie();
    }
    if (a === 'mas') return sesion.sumar?.();
    if (a === 'pausa') {
      if (figura.enMarcha) {
        figura.pausar();
        el.innerHTML = ICONO.play;
        el.setAttribute('aria-label', 'Seguir');
      } else {
        figura.seguir();
        el.innerHTML = ICONO.pausa;
        el.setAttribute('aria-label', 'Pausa');
      }
      return;
    }
    if (a === 'saltar') {
      sesion.hechas[sesion.item][sesion.serie] = figura.repActual;
      figura.pausar();
      return siguiente();
    }
    if (a === 'molestia') {
      el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
      const v = Number(el.dataset.v);
      sesion.molestia[actual().e.i] = v;
      const aviso = app.querySelector('.aviso-molestia');
      if (aviso) aviso.textContent = pasaDelTope(v, tope) ? `Es más de ${tope}: saldrá marcado en el resumen que le mandes a ${r.de || 'quien te dio la rutina'}.` : '';
      return;
    }
    if (a === 'manana') {
      el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
      return apuntarManana(Number(el.dataset.v));
    }
    if (a === 'manana-no') {
      mananaOmitida = true;
      return app.querySelector('.manana')?.remove();
    }
    if (a === 'continuar') {
      if (sesion.item + 1 < cola.length) {
        sesion.item++;
        sesion.serie = 0;
        return prepararSerie();
      }
      return terminar();
    }
    const h = /^h-(\d+)-(\d+)$/.exec(a);
    if (h) {
      const [, i, s] = h.map(Number);
      const v = Math.max(0, Math.min(50, sesion.hechas[i][s] + Number(el.dataset.delta)));
      sesion.hechas[i][s] = v;
      el.parentElement.querySelector('output').textContent = v;
    }
  };

  intro();
  return () => {
    clearTimeout(sesion?.temporizador);
    clearInterval(sesion?.reloj);
    app.onclick = null;
  };
}

// A session is marked when the discomfort went above the professional's level during an exercise or the next morning.
const diaMarcado = (dia, tope) => pasaDelTope(dia.a, tope) || dia.e.some((x) => pasaDelTope(x.m, tope));

function resumenDia(dia, tope = TOPE_MOLESTIA) {
  const fecha = new Date(dia.f + 'T12:00:00');
  const titulo = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(fecha);
  const marcado = diaMarcado(dia, tope);
  return `<article class="tarjeta dia ${marcado ? 'marcado' : ''}"><h3>${titulo.charAt(0).toUpperCase() + titulo.slice(1)}${dia.h ? ` · ${dia.h}` : ''}${
    marcado ? ` <span class="marca-dia">Pasa de ${tope}</span>` : ''
  }</h3>
    ${dia.e
      .map((x) => {
        const def = EJERCICIOS[x.i];
        if (!def) return '';
        const bien = x.p.every((v) => v >= x.r);
        return `<div class="hecho">
          <span class="nombre">${esc(def.nombre)}${def.unLado ? ` · ${LADOS[x.l].toLowerCase()}` : ''}</span>
          ${typeof x.m === 'number' ? `<span class="chip ${pasaDelTope(x.m, tope) ? 'alta' : ''}">Molestia ${x.m}/10</span>` : '<span></span>'}
          <div class="barra-series">${x.p.map((v) => `<span class="${v < x.r ? 'corta' : ''}" title="${v} de ${x.r}"></span>`).join('')}</div>
          <span class="detalle num">${
            bien
              ? `${x.p.length} ${x.p.length === 1 ? 'serie' : 'series'} de ${x.r}, ${x.p.length === 1 ? 'completa' : 'completas'}`
              : `Repeticiones por serie: ${x.p.slice(0, -1).join(', ')}${x.p.length > 1 ? ' y ' : ''}${x.p.at(-1)} de ${x.r}`
          }</span>
        </div>`;
      })
      .join('')}
    ${
      typeof dia.a === 'number'
        ? `<div class="manana-linea"><span>A la mañana siguiente</span><span class="chip ${pasaDelTope(dia.a, tope) ? 'alta' : ''}">Molestia ${dia.a}/10</span></div>`
        : ''
    }
  </article>`;
}

// "el lunes 9, el martes 10 y el jueves 12": the marked days named one by one, never a bare count.
function listaDias(fechas) {
  const nombres = fechas.map((f) => {
    const d = new Date(f + 'T12:00:00');
    return `el ${new Intl.DateTimeFormat('es', { weekday: 'long' }).format(d)} ${d.getDate()}`;
  });
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0];
}

// ---------- Summary (the professional) ----------
async function vistaResumen(codigo) {
  let s;
  try {
    s = await decodificar(codigo);
  } catch {
    app.innerHTML = `<div class="saludo"><h1>Este resumen no se puede abrir</h1></div>`;
    return () => {};
  }
  const dias = [...s.dias].reverse();
  const tope = Number.isInteger(s.m) ? s.m : TOPE_MOLESTIA;
  const marcados = [...new Set(dias.filter((d) => diaMarcado(d, tope)).map((d) => d.f))].reverse();
  const molestia = marcados.length
    ? `La molestia pasó de ${tope} ${listaDias(marcados)}.`
    : `La molestia no pasó de ${tope} ningún día.`;
  app.innerHTML = `<div class="rutina">
    <header class="saludo">
      <div class="de">Resumen para ${esc(s.de || 'ti')}</div>
      <h1>${esc(s.para || 'La persona')} ha hecho su rutina ${dias.length} ${dias.length === 1 ? 'vez' : 'veces'}</h1>
      <p class="${marcados.length ? 'molestia-alta' : ''}">${molestia}</p>
      <p class="en-ficha" aria-live="polite">${guardarEnFicha(s)}</p>
      <p>Lo que ha hecho, de lo más reciente a lo más antiguo.</p>
    </header>
    <section class="lista">${dias.map((d) => resumenDia(d, tope)).join('')}</section>
  </div>`;
  app.onclick = (ev) => {
    if (!ev.target.closest('[data-accion="guardar-resumen"]')) return;
    app.querySelector('.en-ficha').innerHTML = guardarEnFicha(s, true);
  };
  return () => {
    app.onclick = null;
  };
}

// The summary joins the person's file: by the id it brings (routines sent from this browser), or by the only person
// with that name. On the professional's browser (one with people or a draft) a person not yet here gets a new file;
// anywhere else it waits for a tap, so a person opening their own summary does not start a list of people.
function guardarEnFicha(s, aMano = false) {
  const lista = leerPersonas();
  const iguales = s.para ? buscarPorNombre(lista, s.para) : [];
  let p = (s.p && lista.find((x) => x.id === s.p)) || (iguales.length === 1 ? iguales[0] : null);
  const profesional = lista.length > 0 || almacen.leer('borrador', null) !== null;
  if (!p && !aMano && !profesional) {
    return `<button type="button" class="boton secundario" data-accion="guardar-resumen">Guardar en mis personas</button>`;
  }
  if (!p && !caben(lista)) {
    return `No se ha guardado en una ficha: ya tienes ${limite()} personas con ficha, el máximo de la versión gratis.`;
  }
  const nueva = !p;
  if (!p) p = crearPersona(lista, s.para || 'Sin nombre', s.p || undefined);
  const n = apuntarResumen(p, s);
  guardarPersonas(lista);
  const que = nueva ? `Ficha nueva para ${esc(p.nombre)}` : n ? `Guardado en la ficha de ${esc(p.nombre)}` : `Ya estaba en la ficha de ${esc(p.nombre)}`;
  return `${que}. <a href="#persona=${esc(p.id)}">Ver su ficha</a>`;
}

// ---------- The professional's people ----------
const fechaLarga = (f) => new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(new Date(f + 'T12:00:00'));
const ultimaFecha = (p) => [p.ultimoResumen, ...p.rutinas.map((r) => r.f)].filter(Boolean).sort().at(-1) || p.creada;

// A day that passed the person's level in the last two weeks, the latest one, to see at a glance who needs a look.
function ultimoMarcado(p) {
  const tope = Number.isInteger(p.m) ? p.m : TOPE_MOLESTIA;
  const desde = new Date();
  desde.setDate(desde.getDate() - 14);
  const limite = diaLocal(desde);
  const d = [...p.dias].reverse().find((x) => x.f >= limite && diaMarcado(x, tope));
  return d ? { f: d.f, tope } : null;
}

function filaPersona(p) {
  const marcado = ultimoMarcado(p);
  const rutinas = p.rutinas.length ? `${p.rutinas.length} ${p.rutinas.length === 1 ? 'rutina' : 'rutinas'}` : 'sin rutinas';
  const resumen = p.ultimoResumen ? `último resumen el ${fechaLarga(p.ultimoResumen)}` : 'sin resúmenes todavía';
  return `<li><a class="persona-fila" href="#persona=${esc(p.id)}">
    <span class="nombre">${esc(p.nombre)}</span>
    <span class="meta">${rutinas} · ${resumen}</span>
    ${marcado ? `<span class="chip alta">Pasó de ${marcado.tope} ${listaDias([marcado.f])}</span>` : ''}
  </a></li>`;
}

function vistaPersonas() {
  let texto = '';
  const pintarLista = () => {
    const todas = leerPersonas().sort((x, y) => ultimaFecha(y).localeCompare(ultimaFecha(x)));
    const lista = todas.filter((p) => !texto || p.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(texto));
    const cap = app.querySelector('.hueco-capacidad');
    if (cap) cap.innerHTML = todas.length ? capacidad(todas) : '';
    const ul = app.querySelector('.lista-personas');
    ul.innerHTML = todas.length
      ? lista.map(filaPersona).join('') || '<li class="vacio">Nadie con ese nombre.</li>'
      : '<li class="vacio">Todavía no hay nadie. Cuando mandes una rutina con el nombre de la persona, aparece aquí con su ficha.</li>';
  };
  app.innerHTML = `<div class="personas">
    ${barraApp('Personas', { accion: botonNueva })}
    <div class="armar-cuerpo">
      <input type="search" class="buscar" data-accion="buscar-persona" autocomplete="off" placeholder="Buscar por nombre" aria-label="Buscar personas por nombre">
      <div class="hueco-capacidad"></div>
      <ul class="lista-personas"></ul>
      <details class="ayuda-plegada"><summary>Cómo funciona</summary><p>Cada rutina que mandas y cada resumen que te devuelven quedan en la ficha de su persona. Se guardan en este aparato; con una copia te las llevas a otro.</p></details>
      <section class="general copia">
        <h2>Copia</h2>
        <p class="ayuda">Al cargarla se añade lo que falte; no se borra nada.</p>
        <div class="botones">
          <button type="button" class="boton secundario" data-accion="exportar">Guardar copia</button>
          <label class="boton secundario">Cargar copia<input type="file" accept=".json,application/json" data-accion="importar" class="oculto"></label>
        </div>
        <p class="aviso-copia" aria-live="polite"></p>
      </section>
    </div>
  </div>`;
  pintarLista();
  app.oninput = (ev) => {
    if (ev.target.dataset.accion !== 'buscar-persona') return;
    texto = ev.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    pintarLista();
  };
  app.onclick = (ev) => {
    if (!ev.target.closest('[data-accion="exportar"]')) return;
    const archivo = new Blob([JSON.stringify(copia(leerPersonas()), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(archivo);
    a.download = `jepyso-personas-${diaLocal()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    app.querySelector('.aviso-copia').textContent = 'Copia guardada en tus descargas.';
  };
  app.onchange = async (ev) => {
    if (ev.target.dataset.accion !== 'importar' || !ev.target.files[0]) return;
    const aviso = app.querySelector('.aviso-copia');
    try {
      const lista = leerPersonas();
      const r = cargarCopia(lista, JSON.parse(await ev.target.files[0].text()));
      guardarPersonas(lista);
      aviso.textContent = `Copia cargada: ${r.total} ${r.total === 1 ? 'persona' : 'personas'}${r.nuevas ? `, ${r.nuevas} ${r.nuevas === 1 ? 'nueva' : 'nuevas'}` : ', ninguna nueva'}.${
        r.fuera ? ` ${r.fuera} no ${r.fuera === 1 ? 'cabe' : 'caben'}: la versión gratis guarda hasta ${limite()}.` : ''}`;
      pintarLista();
    } catch {
      aviso.textContent = 'Ese archivo no es una copia de Jepyso.';
    }
    ev.target.value = '';
  };
  return () => {
    app.oninput = app.onclick = app.onchange = null;
  };
}

// The week-by-week evolution: the highest discomfort during the exercises and on getting up, against the person's
// level. Graphite only; the numbers are written, and the bars only repeat them.
function barraMolestia(v, tope) {
  if (typeof v !== 'number') return '<span class="sin-dato">—</span>';
  return `<span class="valor-molestia ${pasaDelTope(v, tope) ? 'pasa' : ''}">
    <svg class="barra-molestia" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
      <rect class="pista" x="0" y="5" width="100" height="2"/>
      ${v > 0 ? `<rect class="valor" x="0" y="3" width="${v * 10}" height="6" rx="1"/>` : ''}
      <line class="tope" x1="${tope * 10}" x2="${tope * 10}" y1="0" y2="12"/>
    </svg>
    <span class="num">${v}</span>
  </span>`;
}

function tablaSemanas(p) {
  const tope = Number.isInteger(p.m) ? p.m : TOPE_MOLESTIA;
  const lista = semanas(p.dias, tope);
  if (!lista.length) return '';
  return `<section class="general evolucion">
    <h2>Evolución por semanas</h2>
    <p class="ayuda">La molestia más alta de cada semana. La raya marca su molestia aceptable, ${tope}. Según el modelo de control del dolor, no debería subir de una semana a la siguiente.</p>
    <table class="semanas">
      <thead><tr><th scope="col">Semana del</th><th scope="col">Sesiones</th><th scope="col">Durante</th><th scope="col">Al levantarse</th></tr></thead>
      <tbody>${lista
        .map((s) => `<tr class="${s.sube ? 'sube' : ''}">
          <th scope="row">${fechaLarga(s.desde)}${s.sube ? ' <span class="marca-dia">Sube</span>' : ''}</th>
          <td class="num" data-etiqueta="Sesiones">${s.sesiones}</td>
          <td data-etiqueta="Durante">${barraMolestia(s.durante, tope)}</td>
          <td data-etiqueta="Al levantarse">${barraMolestia(s.manana, tope)}</td>
        </tr>`)
        .join('')}</tbody>
    </table>
  </section>`;
}

function vistaPersona(id) {
  const lista = leerPersonas();
  const p = lista.find((x) => x.id === id);
  if (!p) {
    app.innerHTML = `<div class="personas"><header class="armar-cabecera"><a class="ir-personas" href="#personas">Mis personas</a><h1>Esta ficha no está en este navegador</h1><p>Si la tienes en otro aparato, trae su copia desde Mis personas.</p></header></div>`;
    return () => {};
  }
  const tope = Number.isInteger(p.m) ? p.m : TOPE_MOLESTIA;
  const dias = [...p.dias].reverse();
  app.innerHTML = `<div class="personas persona">
    ${barraApp(esc(p.nombre), { volver: '#personas' })}
    <div class="ficha-cabeza">
      <p>Ficha desde el ${fechaLarga(p.creada)} · molestia aceptable ${tope}</p>
      <div class="botones"><button type="button" class="boton" data-accion="rutina-para">${ICONO.mas}Nueva rutina para ${esc(p.nombre)}</button></div>
    </div>
    <div class="armar-cuerpo">
      <div class="persona-ficha">
      <section class="general notas">
        <h2><label for="notas">Notas</label></h2>
        <textarea id="notas" data-accion="notas" rows="3" placeholder="Lo que quieras recordar de esta persona">${esc(p.notas)}</textarea>
      </section>
      ${tablaSemanas(p)}
      <section class="general mandadas">
        <h2>Rutinas que le has mandado</h2>
        ${p.rutinas.length ? '' : '<p class="ayuda">Ninguna desde este navegador. Las que le mandes con su nombre se apuntan aquí.</p>'}
        <ul class="rutinas-mandadas">${[...p.rutinas]
          .reverse()
          .map((r) => `<li>
            <span><strong>${fechaLarga(r.f)}</strong> · ${r.e.map((i) => esc(EJERCICIOS[i]?.nombre || i)).join(', ')}</span>
            <span class="botones-fila">
              <button type="button" class="boton fantasma" data-accion="abrir-rutina" data-codigo="${esc(r.codigo)}">Abrir en el constructor</button>
              <button type="button" class="boton fantasma" data-accion="copiar-rutina" data-codigo="${esc(r.codigo)}">Copiar enlace</button>
            </span>
          </li>`)
          .join('')}</ul>
      </section>
      <section class="borrar-ficha">
        <button type="button" class="boton fantasma" data-accion="borrar-persona">Borrar su ficha</button>
      </section>
      </div>
      <section class="lo-hecho">
        <h2>Lo que ha hecho</h2>
        ${dias.length ? dias.map((d) => resumenDia(d, tope)).join('') : '<p class="vacio">Aún no te ha mandado ningún resumen. Cuando lo abras, se guarda aquí.</p>'}
      </section>
    </div>
  </div>`;

  const guardar = () => {
    const todas = leerPersonas();
    const i = todas.findIndex((x) => x.id === id);
    if (i >= 0) todas[i] = p;
    guardarPersonas(todas);
  };
  app.oninput = (ev) => {
    if (ev.target.dataset.accion !== 'notas') return;
    p.notas = ev.target.value;
    guardar();
  };
  let confirmar = null;
  app.onclick = async (ev) => {
    const el = ev.target.closest('[data-accion]');
    const a = el?.dataset.accion;
    if (a !== 'borrar-persona' && confirmar) {
      clearTimeout(confirmar);
      confirmar = null;
      const b = app.querySelector('[data-accion="borrar-persona"]');
      if (b) b.textContent = 'Borrar su ficha';
    }
    if (a === 'rutina-para') {
      const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
      Object.assign(b, { para: p.nombre, persona: p.id, tope });
      almacen.guardar('borrador', b);
      location.hash = '';
    } else if (a === 'abrir-rutina') {
      // The routine as it was sent, back in the builder for this person, to change it and send it again.
      const r = await decodificar(el.dataset.codigo);
      const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
      Object.assign(b, { para: p.nombre, persona: p.id, descanso: r.d, veces: r.x, tope: Number.isInteger(r.m) ? r.m : tope, cuerpo: r.c || 'a' });
      b.orden = r.e.map((e) => e.i).filter((i) => ORDEN.includes(i));
      for (const e of r.e) if (ORDEN.includes(e.i)) b.ejercicios[e.i] = { series: e.s, reps: e.r, tempo: [...e.t], lado: e.l ?? null, nota: e.n || '' };
      b.activo = b.orden[0] || b.activo;
      almacen.guardar('borrador', b);
      location.hash = '';
    } else if (a === 'copiar-rutina') {
      const url = `${location.origin}${location.pathname}${location.search}#r=${el.dataset.codigo}`;
      try {
        await navigator.clipboard.writeText(url);
        el.textContent = 'Copiado';
      } catch {
        el.textContent = 'No se pudo copiar';
      }
    } else if (a === 'borrar-persona') {
      // A first touch asks; the second one deletes. Waiting, or touching anything else, leaves it as it was.
      if (!confirmar) {
        el.textContent = `¿Borrar la ficha de ${p.nombre}? Toca otra vez`;
        confirmar = setTimeout(() => {
          confirmar = null;
          if (el.isConnected) el.textContent = 'Borrar su ficha';
        }, 4000);
        return;
      }
      clearTimeout(confirmar);
      guardarPersonas(leerPersonas().filter((x) => x.id !== id));
      location.hash = '#personas';
    }
  };
  return () => {
    clearTimeout(confirmar);
    app.oninput = app.onclick = null;
  };
}

// ---------- Without a connection ----------
// sw.js keeps the app. Each routine opened on the phone also keeps its body, clips and the three.js files, so the
// person can do it later with no signal. The answer says how many of the files are kept.
const MOTOR = [
  'vendor/three/three.module.js',
  'vendor/three/addons/loaders/GLTFLoader.js',
  'vendor/three/addons/controls/OrbitControls.js',
  'vendor/three/addons/utils/BufferGeometryUtils.js',
];

function registrarTrabajador() {
  if (!('serviceWorker' in navigator)) return null;
  // Offline, the update check of an existing worker fails; the one already installed keeps working.
  return navigator.serviceWorker.register('sw.js').catch(async (err) => {
    const ya = await navigator.serviceWorker.getRegistration().catch(() => null);
    if (!ya) console.warn('sin conexión no disponible', err);
    return ya || null;
  });
}
const trabajador = registrarTrabajador();

// A new version arrived in the background (sw.js compares each file it refreshes). The page offers to update, a moment
// after the last file so they all come together, and never in the middle of a set: reloading would lose it.
let avisoVersion = null;
navigator.serviceWorker?.addEventListener('message', (ev) => {
  if (ev.data?.tipo !== 'nueva-version') return;
  clearTimeout(avisoVersion);
  avisoVersion = setTimeout(mostrarVersionNueva, 1500);
});
function mostrarVersionNueva() {
  if (document.querySelector('.nueva-version')) return;
  if (document.querySelector('.jugador')) {
    avisoVersion = setTimeout(mostrarVersionNueva, 5000);
    return;
  }
  const aviso = document.createElement('div');
  aviso.className = 'nueva-version';
  aviso.setAttribute('role', 'status');
  aviso.innerHTML = `<span>Hay una versión nueva de Jepyso.</span><button type="button" class="boton">Actualizar</button>
    <button type="button" class="nueva-version-cerrar" aria-label="Ahora no">${ICONO.cerrar}</button>`;
  aviso.querySelector('.boton').addEventListener('click', () => location.reload());
  // «Not now»: it goes until the next time Jepyso is opened, which already brings the new version.
  aviso.querySelector('.nueva-version-cerrar').addEventListener('click', () => aviso.remove());
  document.body.append(aviso);
}

async function guardarParaSinConexion(c, ids) {
  if (!(await trabajador)) return false;
  const m = await cargarManifiesto(c);
  const rutas = [...MOTOR, RUTAS[c] || RUTAS.a, m.cuerpo,
    ...ids.flatMap((id) => (m.ejercicios[id] ? [m.ejercicios[id].glb, m.ejercicios[id].ficha, poster(id, c)] : []))];
  const listo = await navigator.serviceWorker.ready;
  return new Promise((resolver) => {
    const canal = new MessageChannel();
    const espera = setTimeout(() => resolver(false), 60000);
    canal.port1.onmessage = (ev) => {
      clearTimeout(espera);
      resolver(ev.data.guardados === ev.data.total);
    };
    listo.active.postMessage({ tipo: 'guardar', rutas }, [canal.port2]);
  });
}

// ---------- Templates, as a tab of their own ----------
function vistaPlantillas() {
  const pintarLista = () => {
    const lista = almacen.leer('plantillas', []);
    app.querySelector('.lista-plantillas-app').innerHTML = lista.length
      ? lista.map((p, i) => `<li class="plantilla-fila">
          <button type="button" class="plantilla-usar" data-accion="usar" data-i="${i}">
            <span class="nombre">${esc(p.nombre)}</span>
            <span class="meta">${p.orden.length} ${p.orden.length === 1 ? 'ejercicio' : 'ejercicios'} · ${p.orden.map((id) => esc(EJERCICIOS[id]?.nombre || id)).join(', ')}</span>
          </button>
          <button type="button" class="plantilla-quitar" data-accion="quitar" data-i="${i}" aria-label="Borrar la plantilla ${esc(p.nombre)}">${ICONO.cerrar}</button>
        </li>`).join('')
      : '<li class="vacio">Todavía no hay plantillas. Arma una rutina y, en sus ejercicios, «Guardar la rutina como plantilla».</li>';
  };
  app.innerHTML = `<div class="personas plantillas-app">
    ${barraApp('Plantillas', { accion: botonNueva })}
    <div class="armar-cuerpo">
      <ul class="lista-plantillas-app"></ul>
      <details class="ayuda-plegada"><summary>Cómo funciona</summary><p>Una plantilla guarda los ejercicios y sus ajustes. Al usarla se abre una rutina nueva con ellos, para cambiar lo que haga falta y mandarla. Se guardan en este aparato.</p></details>
    </div>
  </div>`;
  pintarLista();
  let confirmar = null;
  app.onclick = (ev) => {
    const el = ev.target.closest('[data-accion]');
    if (!el) return;
    if (el.dataset.accion === 'usar') {
      almacen.guardar('plantilla-a-usar', Number(el.dataset.i));
      location.hash = '';
    } else if (el.dataset.accion === 'quitar') {
      // A first touch asks; the second deletes.
      if (el.dataset.confirmar) {
        const lista = almacen.leer('plantillas', []);
        lista.splice(Number(el.dataset.i), 1);
        almacen.guardar('plantillas', lista);
        clearTimeout(confirmar);
        pintarLista();
      } else {
        el.dataset.confirmar = '1';
        el.classList.add('confirmar');
        el.textContent = '¿Borrar?';
        clearTimeout(confirmar);
        confirmar = setTimeout(pintarLista, 4000);
      }
    }
  };
  return () => {
    clearTimeout(confirmar);
    app.onclick = null;
  };
}

// ---------- Router ----------
async function ir() {
  limpiar();
  document.querySelectorAll('.capa').forEach((c) => c.remove());
  const h = location.hash;
  marcoApp(h);
  if (h.startsWith('#r=')) limpiar = await vistaRutina(h.slice(3));
  else if (h.startsWith('#s=')) limpiar = await vistaResumen(h.slice(3));
  else if (h === '#personas') limpiar = vistaPersonas();
  else if (h === '#plantillas') limpiar = vistaPlantillas();
  else if (h.startsWith('#persona=')) limpiar = vistaPersona(decodeURIComponent(h.slice(9)));
  else limpiar = vistaArmar();
}
window.addEventListener('hashchange', ir);
ir();
