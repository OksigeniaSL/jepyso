// Jepyso: the professional builds a routine, sends it as a link, the person does it with the 3D figure and sends
// back a summary link. No server: everything travels inside the links.
import {
  EJERCICIOS, ORDEN, ZONAS, MUSCULOS, buscarEjercicios, LADOS, TOPE_MOLESTIA, pasaDelTope, diaLocal, diaAnterior,
  codificar, decodificar, duracionEjercicio, minutos, almacen, BANDAS, conBanda, bandaDe, SIN_SITIO, unidad, porPasos, porMinutos, topeReps,
  tituloUnidad, palabraUnidad, cuentaUnidad, deTotalUnidad, fraseUnidad,
} from './datos.js';
import { t, tn, idioma, otroIdioma, ponerIdioma, IDIOMAS, locale, cargarIdioma } from './idioma.js';
import { limpiarRutina, limpiarResumen, limpiarPlantilla, limpiarPlantillas } from './entrada.js';
import { hayVoz, vozActiva, ponerVoz, decir, callar, numero, modoVoz, quienHabla, ponerQuien, rutasDeVoz, FRASES_GENERALES } from './voz.js';
import {
  leerPersonas, guardarPersonas, buscarPorNombre, crearPersona, apuntarRutina, apuntarResumen, semanas, copia, cargarCopia, caben, limite,
  esDePago, esEntornoDePruebas, leerBorradas, apuntarBorrada, LIMITE_GRATIS, sinNoticias,
} from './personas.js';
import { NUBES, nubeElegida, elegirNube, ultimaVez, apuntarVez, nubeAnterior, sincronizar } from './nube.js';
import { comprobarLicencia, licencia, licenciaPendiente, licenciaAnulada, comprobarVigencia, guardarLicencia, cuentaDelDrive, licenciaActiva, topeLicencia, nombrePlan } from './licencia.js';
import { ampliarPlan } from './tienda.js';
import {
  valesEnMarcha, fichaAbierta, fichaSinPlaza, cuentaDeVales, fichasQuedan, avisoVales, alCambiarVales, comprobarVales, pedirVale, pedirVales,
  soltarVale, botonGoogle,
} from './vales.js';
import { MAPA, PUNTOS } from './mapa.js';
import { PROGRAMAS } from './programas.js';
import { medida, dibujar, actualizar } from './goniometro.js';
import {
  enMoodle, armandoParaMoodle, rutinaDelFormulario, prepararMoodle, moodle, vistaPrevia, volverAlCurso, juntarHistorial, subirHistorial, recordarClave, TEXTO_ESTADO,
  devolverRutina, enAppDeMoodle, TEXTO_CERRAR,
} from './moodle.js';

// The language first (idioma.js): every text below is written in it, from the first screen on. The page's title and
// Oksigenia's accessibility panel (which redraws itself when its locale changes) follow it.
await cargarIdioma();
document.title = t('Rutina');
document.querySelector('oksigenia-access-panel')?.setAttribute('locale', idioma());

const app = document.getElementById('app');
const parametros = new URLSearchParams(location.search);
const RUTAS = { a: 'modelos/ejercicios.json', b: 'modelos/b/ejercicios.json' };
// The still of every exercise, for the library rows and the routine of the person, made by tools/posters/ next to each
// body's clips. One that is not there leaves its tile empty instead of a broken image.
// The still of an exercise; with a band colour, the one with the band in that colour.
const poster = (id, c, banda) => `modelos/${c === 'b' ? 'b/' : ''}posters/${id}${banda ? `-${banda}` : ''}.webp`;
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
  voz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  pantalla: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="12.5"/><path d="M8.5 20h7M12 16.5V20"/></svg>',
  completa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  salirCompleta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  sinVoz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  puntos: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  compartir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
  compartirIos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M8 10H6v11h12V10h-2"/></svg>',
  volver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  cuerpo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M5 9l7 1.5L19 9M12 10.5V15m0 0l-3 6m3-6l3 6"/></svg>',
  personas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2"/></svg>',
  plantillas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 4.5h11v14H4z"/><path d="M8 8h11v14H8z"/><path d="M11 12h5M11 15.5h5M11 19h3" stroke-linecap="round"/></svg>',
  candado: '<svg class="candado" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>',
  abrir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></svg>',
  girar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.4 4.3 2.9 11.4c-1.3.5-1.3 1.2-.2 1.6l4.7 1.5 1.8 5.5c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.3-1.5zM8.6 14l9.2-5.8c.5-.3.9-.1.5.2l-7.5 6.8-.3 3.3L8.6 14z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
  ayuda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/></svg>',
  idioma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3c2.4 2.6 3.5 5.6 3.5 9s-1.1 6.4-3.5 9c-2.4-2.6-3.5-5.6-3.5-9S9.6 5.6 12 3z"/></svg>',
  // Oksigenia's accessibility sign, the one the panel's own button wears on every Oksigenia website.
  acceso: '<svg viewBox="0 0 122.88 122.88" fill="currentColor"><path d="M61.44,0A61.46,61.46,0,1,1,18,18,61.21,61.21,0,0,1,61.44,0Zm-.39,74.18L52.1,98.91a4.94,4.94,0,0,1-2.58,2.83A5,5,0,0,1,42.7,95.5l6.24-17.28a26.3,26.3,0,0,0,1.17-4,40.64,40.64,0,0,0,.54-4.18c.24-2.53.41-5.27.54-7.9s.22-5.18.29-7.29c.09-2.63-.62-2.8-2.73-3.3l-.44-.1-18-3.39A5,5,0,0,1,27.08,46a5,5,0,0,1,5.05-7.74l19.34,3.63c.77.07,1.52.16,2.31.25a57.64,57.64,0,0,0,7.18.53A81.13,81.13,0,0,0,69.9,42c.9-.1,1.75-.21,2.6-.29l18.25-3.42A5,5,0,0,1,94.5,39a5,5,0,0,1,1.3,7,5,5,0,0,1-3.21,2.09L75.15,51.37c-.58.13-1.1.22-1.56.29-1.82.31-2.72.47-2.61,3.06.08,1.89.31,4.15.61,6.51.35,2.77.81,5.71,1.29,8.4.31,1.77.6,3.19,1,4.55s.79,2.75,1.39,4.42l6.11,16.9a5,5,0,0,1-6.82,6.24,4.94,4.94,0,0,1-2.58-2.83L63,74.23,62,72.4l-1,1.78Zm.39-53.52a8.83,8.83,0,1,1-6.24,2.59,8.79,8.79,0,0,1,6.24-2.59Zm36.35,4.43a51.42,51.42,0,1,0,15,36.35,51.27,51.27,0,0,0-15-36.35Z"/></svg>',
};

// The two bodies Gaudí made. Named by build, never by sex.
const FIGURAS = [['a', 'Figura 1'], ['b', 'Figura 2']];
// The figure at ease, with nothing in the hands: the first frame of this exercise.
const DE_PIE = 'extension_espalda_pie';
// When the copy does not bring it (the free sample of the Moodle activity), the start of a standing exercise it does.
const DE_PIE_MUESTRA = ['talones', 'sentadilla', 'equilibrio'];

// The choice of body with the still of each one standing (tools/posters/figuras.mjs): the names alone did not say how
// they differ.
function eleccionFigura(actual) {
  return `<div class="segmentos figuras" role="group" aria-label="${t('Figura')}">${FIGURAS.map(
    ([v, nombre]) => `<button type="button" data-accion="cuerpo" data-valor="${v}" aria-pressed="${v === actual}"><img src="imagenes/figura-${v}.webp" alt="" width="36" height="48">${t(nombre)}</button>`,
  ).join('')}</div>`;
}

const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// «a, b y c» in the language in use.
function enLista(cosas) {
  try {
    return new Intl.ListFormat(locale(), { type: 'conjunction' }).format(cosas);
  } catch {
    return cosas.length > 1 ? t('{a} y {b}', { a: cosas.slice(0, -1).join(', '), b: cosas.at(-1) }) : cosas[0] || '';
  }
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// A file made from a summary that brought no name is kept as «Sin nombre» (entrada.js): data, shown in the language
// in use. Any other name is the person's own.
const nombreDe = (p) => (p.nombre === 'Sin nombre' ? t('Sin nombre') : p.nombre);

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
        .map(([x, t]) => (t ? `<text x="${x}" y="${alto + 14}" text-anchor="middle">${esc(t)}</text>` : ''))
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

// Templates come from this browser, a copy or the cloud: read through entrada.js like any outside data.
const leerPlantillas = () => limpiarPlantillas(almacen.leer('plantillas', []));

// The professional's first use: no link made yet, nobody in Personas and no template. Until then the builder opens with
// the way (build it and send it, the person does it, the summary comes back) and a routine to try.
const primerUso = () => !armandoParaMoodle && !almacen.leer('estrenada', false) && !leerPersonas().length && !leerPlantillas().length;

// The routine to try, as the person will see it: three of the first exercises, one short set each, in the figure the
// professional has chosen. Made once per figure; the link is ready by the time the button is reached. Its note stays in
// Spanish inside the link, as everything in a link does; the person's screen shows it through t(), like any text.
const NOTA_EJEMPLO = 'Esta es una rutina de ejemplo: una serie corta de cada ejercicio, para verla entera en un par de minutos.';
const ejemplos = {};
const ejemplosListos = {};
function enlaceEjemplo(c) {
  ejemplos[c] ??= codificar({
    v: 1, para: '', de: '', d: 30, x: 1, m: TOPE_MOLESTIA, c,
    e: [['silla', 5], ['puente', 5], ['hombro', 6]].map(([id, reps], k) => {
      const d = EJERCICIOS[id].porDefecto;
      return { i: id, s: 1, r: reps, t: [...d.tempo], l: EJERCICIOS[id].unLado ? 'der' : null, n: k ? undefined : NOTA_EJEMPLO };
    }),
  }).then((codigo) => (ejemplosListos[c] = `${location.origin}${location.pathname}#r=${codigo}`));
  return ejemplos[c];
}

// «Así funciona», on top of the builder the first time: the way from the routine to its summary in three steps, where it
// is seen on arrival, and the routine to try.
function primerUsoBanda(b) {
  if (!primerUso()) return '';
  const url = ejemplosListos[b.cuerpo];
  return `<section class="primer-uso" aria-labelledby="primer-uso-t">
    <h2 id="primer-uso-t">${t('Así funciona')}</h2>
    <ol class="camino">
      <li>${t('<strong>Armas la rutina</strong> y se la mandas por WhatsApp o Telegram.')}</li>
      <li>${t('<strong>La persona la hace</strong> en su teléfono, con la figura, sin instalar nada.')}</li>
      <li>${t('<strong>Te vuelve su resumen</strong>: lo que hizo y la molestia que notó.')}</li>
    </ol>
    <p class="probar"><a class="boton secundario probar-ejemplo"${url ? ` href="${esc(url)}"` : ''} target="_blank" rel="noopener">${t('Probar con una rutina de ejemplo')}</a>
      <span>${t('Se abre aparte, tal como la verá la persona.')}</span></p>
  </section>`;
}

// Neutral words for the three parts: the first is not always «up» (a squat goes down first). In the player, the exercise
// names its own phases (figura.textos).
const textoTempo = ([s, m, b]) => (m ? t('Ida en {s} s, mantén {m} s, vuelta en {b} s', { s, m, b }) : t('Ida en {s} s, vuelta en {b} s', { s, b }));
// The same, with the exercise's own words when its sheet has them («Sube la cadera en 2 s, aguanta arriba 1 s…»).
function pautaTempo(f, tempo) {
  if (!f?.subir || !f?.bajar) return textoTempo(tempo);
  const v = { subir: t(f.subir), mantener: t(f.mantener || 'Mantén').toLowerCase(), bajar: t(f.bajar).toLowerCase(), s: tempo[0], m: tempo[1], b: tempo[2] };
  return tempo[1] ? t('{subir} en {s} s, {mantener} {m} s, {bajar} en {b} s', v) : t('{subir} en {s} s, {bajar} en {b} s', v);
}
const textosDeFicha = (ficha) => Object.fromEntries((Array.isArray(ficha?.fases) ? ficha.fases : []).filter((p) => p.texto).map((p) => [p.fase || p.nombre, p.texto]));

// ---------- Figure ----------
async function cargarManifiesto(c = 'a') {
  const ruta = RUTAS[c] || RUTAS.a;
  manifiestos[ruta] ||= fetch(ruta)
    .then((r) => {
      if (!r.ok) throw new Error(ruta);
      return r.json();
    })
    .catch((err) => {
      delete manifiestos[ruta];
      throw err;
    });
  return manifiestos[ruta];
}

// One figure for the whole app; it moves between containers and swaps body when the routine asks for the other one.
// The figure and three.js (850 KB) load when a figure is first needed: the routine's list and the builder show before
// that, instead of a blank page for half a minute on a slow connection. recorrido.js comes with them.
let moduloFigura = null;
let pintarRecorrido = () => {};
async function cargarFigura() {
  moduloFigura ??= Promise.all([import('./figura.js'), import('./recorrido.js')])
    .then(([f, rec]) => {
      pintarRecorrido = rec.pintarRecorrido;
      return f;
    })
    .catch((err) => {
      moduloFigura = null;
      throw err;
    });
  return moduloFigura;
}

// For a screen reader the figure is a picture with a name: what it is doing and, if it has sides, which one.
function nombrarFigura(f, id, lado) {
  const lienzo = f?.renderer?.domElement;
  const def = EJERCICIOS[id];
  if (!lienzo || !def) return;
  lienzo.setAttribute('role', 'img');
  const ejercicio = t(def.nombre);
  if (!def.unLado) lienzo.setAttribute('aria-label', t('Figura haciendo {ejercicio}', { ejercicio }));
  else lienzo.setAttribute('aria-label', lado === 'izq' ? t('Figura haciendo {ejercicio}, lado izquierdo', { ejercicio }) : t('Figura haciendo {ejercicio}, lado derecho', { ejercicio }));
}

async function figuraEn(contenedor, c = 'a') {
  const [{ Figura }, manifiesto] = await Promise.all([cargarFigura(), cargarManifiesto(c)]);
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

// The phone's own share sheet, where there is one: SMS, e-mail, Signal or whatever the professional uses besides
// WhatsApp and Telegram. Where there is none (most computers), the button is not shown.
const hayCompartir = () => typeof navigator.share === 'function';
const botonCompartir = (h) => (hayCompartir() ? `<button type="button" class="boton secundario" data-${h}="compartir">${ICONO.compartir}${t('Mandar con otra app')}</button>` : '');
async function compartir(texto, url) {
  try {
    await navigator.share({ text: texto, url });
  } catch {
    // Closed without choosing an app, or the browser said no: nothing to do.
  }
}

// ---------- The professional's app ----------
// The professional's side is an app for the phone and the tablet (Enrique, 11 November 2026): a tab bar at the foot of
// the phone, a rail at the side of a tablet, a bar on top with the title and, inside a file, the way back. The person's
// routine (#r=) has none of it, and no manifest: installed from there, its icon would open the builder, not the routine.
// Building for a Moodle activity there are no people to follow: the course does that.
const PESTANAS = [['#', 'Nueva rutina', 'mas'], ['#personas', 'Personas', 'personas'], ['#plantillas', 'Plantillas', 'plantillas']].filter(
  ([href]) => !(armandoParaMoodle && href === '#personas'),
);
let pestanas = null;
let firmaPro = null;

// Oksigenia signs every website it makes (shared/sitios-publicos.md): the line with its link, and beside it the button
// that opens the accessibility panel (index.html). The professional has it at the foot of the rail, or at the end of
// the page on a phone; the person, quiet at the end of the list, under the routine and away from «Empezar».
const FIRMA = `<p class="firma-linea">${t('Jepyso · un producto de <a href="https://oksigenia.com">Oksigenia</a>')}</p>`;
const botonAcceso = `<button type="button" class="firma-acceso" data-acceso aria-haspopup="dialog">${ICONO.acceso}<span>${t('Accesibilidad')}</span></button>`;
// The language switch, beside «Accesibilidad» (and «Ayuda»): the other language, in its own name. The page starts again
// in it, and the choice stays on this device (idioma.js). Routines, summaries and files read the same in both.
const botonIdioma = `<button type="button" class="firma-acceso firma-idioma" data-idioma lang="${otroIdioma()}">${ICONO.idioma}<span>${IDIOMAS[otroIdioma()]}</span></button>`;
const firmaPersona = `<div class="firma firma-persona"><span class="firma-botones">${botonAcceso}${botonIdioma}</span>${FIRMA}</div>`;
// jepyso.com in the language in use.
const WEB = idioma() === 'en'
  ? { inicio: 'https://jepyso.com/en/', privacidad: 'https://jepyso.com/en/privacy/', condiciones: 'https://jepyso.com/en/terms/' }
  : { inicio: 'https://jepyso.com', privacidad: 'https://jepyso.com/privacidad/', condiciones: 'https://jepyso.com/condiciones/' };
// Help and contact for the professional, beside «Accesibilidad»: what is asked most, and where to write. Someone who
// arrives from an app store finds them in the app itself.
const botonAyuda = `<button type="button" class="firma-acceso" data-ayuda aria-haspopup="dialog">${ICONO.ayuda}<span>${t('Ayuda')}</span></button>`;
function abrirAyuda() {
  const volverA = document.activeElement;
  const pregunta = (p, r) => `<details class="ayuda-plegada"><summary>${p}</summary><p>${r}</p></details>`;
  const dialogo = document.createElement('dialog');
  dialogo.className = 'hoja hoja-ayuda';
  dialogo.setAttribute('aria-labelledby', 'ayuda-titulo');
  dialogo.innerHTML = `<h2 id="ayuda-titulo" tabindex="-1">${t('Ayuda')}</h2>
    ${pregunta(t('¿Cómo le mando una rutina a alguien?'), t('Ármala en «Nueva rutina» y pulsa «Crear enlace»: se lo mandas por WhatsApp, Telegram u otra app. Lo abre en su teléfono, sin instalar nada.'))}
    ${pregunta(t('¿Qué hace la persona?'), t('Sigue a la figura, que lleva el ritmo, el lado y las series que pusiste. Al acabar apunta lo que hizo y la molestia que notó, y te manda su resumen con un enlace: ábrelo en este aparato y se guarda en su ficha.'))}
    ${pregunta(t('¿Dónde se guardan mis fichas?'), t('En este aparato, y con un plan de pago también en tu nube (Google Drive, OneDrive o Dropbox), para tenerlas en todos tus aparatos. Desde «Personas» puedes guardar una copia en un archivo cuando quieras.'))}
    ${pregunta(t('¿Cuántas personas caben?'), `${t('Gratis, {n} con ficha; con un plan, las que diga tu licencia. Las rutinas se mandan igual a cualquiera, con ficha o sin ella.', { n: LIMITE_GRATIS })} ${ampliarPlan()}`)}
    ${pregunta(t('¿Cómo activo mi licencia?'), t('Abre el enlace que te llegó con ella, o pégala en «Personas», en «¿Tienes una licencia de Jepyso?». Después conecta tu nube con la cuenta de la licencia.'))}
    ${pregunta(t('¿Se puede cambiar la voz?'), t('Sí: al abrir su rutina, cada persona elige voz de mujer, voz de hombre o sin voz.'))}
    <section class="ayuda-contacto">
      <h3>${t('Contacto')}</h3>
      <p>${t('¿Algo no va como esperabas o tienes una idea? Escríbenos a <a href="mailto:contacto@oksigenia.com">contacto@oksigenia.com</a>.')}</p>
      <p><a href="${WEB.privacidad}" target="_blank" rel="noopener">${t('Privacidad')}</a> · <a href="${WEB.condiciones}" target="_blank" rel="noopener">${t('Condiciones')}</a> · <a href="${WEB.inicio}" target="_blank" rel="noopener">jepyso.com</a></p>
    </section>
    <div class="hoja-como-pie"><button type="button" class="boton">${t('Entendido')}</button></div>`;
  document.body.appendChild(dialogo);
  dialogo.addEventListener('close', () => {
    dialogo.remove();
    volverA?.focus?.({ preventScroll: true });
  });
  dialogo.addEventListener('click', (ev) => {
    const r = dialogo.getBoundingClientRect();
    const fuera = ev.target === dialogo && (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom);
    if (fuera || ev.target.closest('.hoja-como-pie .boton')) dialogo.close();
  });
  dialogo.showModal();
  dialogo.querySelector('h2').focus({ preventScroll: true });
}
document.addEventListener('click', (ev) => {
  if (ev.target.closest?.('[data-acceso]')) document.querySelector('oksigenia-access-panel')?.open?.();
  if (ev.target.closest?.('[data-ayuda]')) abrirAyuda();
  if (ev.target.closest?.('[data-idioma]')) ponerIdioma(otroIdioma());
});

function marcoApp(h) {
  const pro = !h.startsWith('#r=');
  document.body.classList.toggle('pro', pro);
  // The builder keeps «Crear enlace» fixed over the tabs on a phone: the signature leaves it room.
  document.body.classList.toggle('en-armar', pro && !/^#(s=|personas$|plantillas$|persona=)/.test(h));
  if (pro && !pestanas) {
    pestanas = document.createElement('nav');
    pestanas.className = 'pestanas';
    pestanas.setAttribute('aria-label', 'Jepyso');
    pestanas.innerHTML = `<p class="marca-jepyso pestanas-marca">jepyso<span aria-hidden="true">°</span></p>${PESTANAS.map(
      ([href, texto, icono]) => `<a href="${href}" data-pestana="${href}">${ICONO[icono]}<span>${t(texto)}</span></a>`,
    ).join('')}`;
    document.body.append(pestanas);
    firmaPro = document.createElement('footer');
    firmaPro.className = 'firma firma-pro';
    firmaPro.innerHTML = botonAyuda + botonAcceso + botonIdioma + FIRMA;
    document.body.append(firmaPro);
  }
  if (firmaPro) firmaPro.hidden = !pro;
  if (pestanas) {
    pestanas.hidden = !pro;
    const actual = h.startsWith('#persona') ? '#personas' : h === '#plantillas' ? '#plantillas' : h.startsWith('#s=') ? '' : '#';
    pestanas.querySelectorAll('a').forEach((a) => (a.dataset.pestana === actual ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    if (pro) avisoPestana();
  }
  let m = document.querySelector('link[rel="manifest"]');
  // Inside a Moodle course the plugin serves the app and nothing installs it.
  if (pro && !m && !armandoParaMoodle) {
    m = document.createElement('link');
    m.rel = 'manifest';
    m.href = 'manifest.json';
    document.head.append(m);
  } else if (!pro && m) m.remove();
}

// The tab of Personas carries how many people have sent nothing since their routine (sinNoticias): the professional
// sees it from any screen, without opening the list.
function avisoPestana() {
  const a = pestanas?.querySelector('[data-pestana="#personas"]');
  if (!a) return;
  const n = leerPersonas().filter((p) => fichaAbierta(p) && sinNoticias(p)).length;
  let marca = a.querySelector('.pestana-cuenta');
  if (!n) {
    marca?.remove();
    a.removeAttribute('aria-label');
    return;
  }
  if (!marca) {
    marca = document.createElement('span');
    marca.className = 'pestana-cuenta';
    marca.setAttribute('aria-hidden', 'true');
    a.append(marca);
  }
  marca.textContent = n;
  a.setAttribute('aria-label', tn(n, 'Personas: {n} sin noticias desde su rutina', 'Personas: {n} sin noticias desde su rutina'));
}

const barraApp = (titulo, { volver = '', accion = '' } = {}) => `<header class="barra-app">
  ${volver ? `<a class="barra-volver" href="${volver}" aria-label="${t('Volver')}">${ICONO.volver}</a>` : ''}
  <h1>${titulo}</h1>${accion}
</header>`;
const botonNueva = `<a class="boton barra-boton" href="#">${ICONO.mas}${t('Nueva rutina')}</a>`;

// The free version keeps up to five people with a file (Enrique, 11 November 2026): how many there are, in sight, as five
// squares; full, said before a routine for someone new is made. A paid plan says its name and its top (Enrique, 15-11).
function capacidad(lista) {
  const n = lista.length;
  const max = limite();
  if (esDePago()) {
    const plan = licenciaActiva() ? t('plan {nombre}', { nombre: nombrePlan(topeLicencia()) }) : t('versión de pago');
    return `<p class="capacidad${n >= max ? ' llena' : ''}"><span>${t('<b>{n} de {max}</b> personas con ficha · {plan}', { n: Math.min(n, max), max, plan })}${n >= max ? `. ${ampliarPlan()}` : ''}</span></p>`;
  }
  const marcas = Array.from({ length: max }, (_, i) => `<i${i < n ? ' class="usada"' : ''}></i>`).join('');
  const cuantas = { n: Math.min(n, max), max };
  return `<p class="capacidad${n >= max ? ' llena' : ''}"><span class="capacidad-marcas" aria-hidden="true">${marcas}</span>
    <span>${n >= max ? t('<b>{n} de {max}</b> personas con ficha. Las rutinas para alguien nuevo van igual, sin ficha.', cuantas) : t('<b>{n} de {max}</b> personas con ficha.', cuantas)} ${ampliarPlan()}</span></p>`;
}
// The line of the link sheet about the file. A free file whose ticket waits for the Google sign-in says so.
function enFicha(p, esperaCuenta) {
  if (esperaCuenta) return t('Guardada en la ficha de {nombre}. Para abrirla, entra con tu cuenta de Google en <a href="#personas">Mis personas</a>.', { nombre: esc(nombreDe(p)) });
  return `${t('Guardada en la ficha de {nombre}.', { nombre: esc(nombreDe(p)) })} <a href="#persona=${esc(p.id)}">${t('Ver su ficha')}</a>`;
}
function avisoLleno(b) {
  const lista = leerPersonas();
  const nombre = b.para.trim();
  if (!nombre || caben(lista) || buscarPorNombre(lista, nombre).length) return '';
  return `<p class="aviso-lleno">${t('Tus {n} fichas están llenas: esta rutina va en el enlace, pero no se guarda en Personas.', { n: limite() })}</p>`;
}

// The steps of the builder, on top: for whom, the exercises, the settings and the link. One tap goes to each.
function etapasApp(b) {
  const pasos = [
    ['para', t('Para quién'), b.para.trim() ? b.para.trim() : ''],
    ['ejercicios', t('Ejercicios'), b.orden.length ? String(b.orden.length) : ''],
    ['ajustes', t('Ajustes'), ''],
    ['enlace', t('Enlace'), ''],
  ];
  return pasos
    .map(([k, rotulo, hecho], i) => `<button type="button" class="etapa-ir${hecho ? ' hecha' : ''}" data-accion="ir-etapa" data-etapa="${k}"${k === 'enlace' && !b.orden.length ? ' disabled' : ''}>
      <b>${hecho ? ICONO.check : i + 1}</b><span>${rotulo}</span></button>`)
    .join('');
}

// ---------- Builder ----------
// The draft: who it is for, the settings for the whole routine, the exercises in the order the professional chose
// (orden) and the settings of every exercise touched, so one taken out and put back keeps them. The library filter
// stays with the draft.
function ajustesIniciales(id) {
  const d = EJERCICIOS[id].porDefecto;
  return { series: d.series, reps: d.reps, tempo: [...d.tempo], lado: EJERCICIOS[id].unLado ? 'der' : null, banda: '', nota: '' };
}

function borradorInicial() {
  return {
    para: '', de: '', descanso: 45, veces: 1, semana: 0, tope: TOPE_MOLESTIA, cuerpo: 'a',
    activo: ORDEN[0], orden: [], ejercicios: {}, filtro: { zona: '', musculo: '', texto: '' }, mirado: false,
  };
}

// Drafts saved before the library had an order kept every exercise with an «incluido» flag.
function ponerAlDia(b) {
  if (!b || typeof b !== 'object') b = borradorInicial();
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
  // Whether the professional has looked at an exercise since the routine was last empty: until then the preview waits.
  b.mirado = b.mirado === true;
  // The draft lives in this browser's storage, which other pages of the same origin can write (on the bench): its
  // settings go through the same cleaning as a template.
  const limpia = limpiarPlantilla({ nombre: 'borrador', d: b.descanso, x: b.veces, w: b.semana, m: b.tope, c: b.cuerpo, orden: Object.keys(b.ejercicios), ejercicios: b.ejercicios });
  Object.assign(b, { descanso: limpia.d, veces: limpia.x, semana: limpia.w || 0, tope: limpia.m, cuerpo: limpia.c, ejercicios: limpia.ejercicios });
  b.para = typeof b.para === 'string' ? b.para : '';
  b.de = typeof b.de === 'string' ? b.de : '';
  return b;
}

function paso(accion, valor, etiqueta, min, max) {
  return `<div class="paso" role="group" aria-label="${esc(etiqueta)}">
    <button type="button" data-accion="${accion}" data-delta="-1" aria-label="${t('Menos')}" ${valor <= min ? 'disabled' : ''}>−</button>
    <output class="num">${esc(valor)}</output>
    <button type="button" data-accion="${accion}" data-delta="1" aria-label="${t('Más')}" ${valor >= max ? 'disabled' : ''}>+</button>
  </div>`;
}

function segmentos(accion, opciones, actual, etiqueta) {
  return `<div class="segmentos" role="group" aria-label="${esc(etiqueta)}">${opciones
    .map(([v, rotulo]) => `<button type="button" data-accion="${accion}" data-valor="${v}" aria-pressed="${String(v) === String(actual)}">${rotulo}</button>`)
    .join('')}</div>`;
}

// How an exercise is done, for the person (the how-to sheet) and for the professional (the card).
function explicacion(def) {
  return `<div class="explicacion">
    <p class="partida"><strong>${t('Para empezar.')}</strong> ${esc(t(def.partida))}</p>
    <ol class="como">${def.pasos.map((p) => `<li>${esc(t(p))}</li>`).join('')}</ol>
    ${def.notar ? `<p><strong>${t('Dónde se nota.')}</strong> ${esc(t(def.notar))}</p>` : ''}
    <p><strong>${t('Ojo.')}</strong> ${esc(t(def.error))}</p>
    ${def.para ? `<p><strong>${t('Para qué.')}</strong> ${esc(t(def.para))}</p>` : ''}
    ${def.ayuda ? `<p><strong>${t('Más fácil.')}</strong> ${esc(t(def.ayuda))}</p>` : ''}
    ${def.masDificil ? `<p><strong>${t('Para más.')}</strong> ${esc(t(def.masDificil))}</p>` : ''}
    ${def.cuidado ? `<p class="cuidado"><strong>${t('Cuidado.')}</strong> ${esc(t(def.cuidado))}</p>` : ''}
    <p class="parar">${t(PARAR)}</p>
  </div>`;
}

// When to stop, the same for every exercise (the guides behind the library and the Otago programme): it completes the
// pain-monitoring model, which only covers the expected discomfort.
const PARAR = 'Para y avisa a quien te dio la rutina si notas un dolor fuerte o distinto del de siempre, mareo, dolor en el pecho, falta de aire, u hormigueo o dolor que baja por un brazo o una pierna.';

// The colour of the band, as a small strip of it beside its name.
const muestraBanda = (banda) => `<i class="muestra-banda banda-${banda.clave}" aria-hidden="true"></i>`;

// The professional picks the colour of the band they gave the person: one strip per colour, and «Sin indicar».
function eleccionBanda(e) {
  return `<div class="ajuste"><span>${t('Color de la banda')}</span><div class="bandas" role="group" aria-label="${t('Color de la banda')}">${Object.entries(BANDAS)
    .map(([k, v]) => `<button type="button" class="banda banda-${k}" data-accion="banda" data-valor="${k}" aria-pressed="${e.banda === k}" aria-label="${esc(t(v.nombre))}" title="${esc(t(v.nombre))}"></button>`)
    .join('')}<button type="button" class="banda-sin" data-accion="banda" data-valor="" aria-pressed="${!e.banda}">${t('Sin indicar')}</button></div></div>`;
}

const chipsEjercicio = (def) =>
  `<span class="chip">${esc(t(def.posicion))}</span><span class="chip">${esc(t(def.material))}</span>${def.musculos.principales
    .map((mu) => `<span class="chip vivo">${esc(t(MUSCULOS[mu] || mu))}</span>`)
    .join('')}`;

// What a folded card says: sets and repetitions, the tempo line, the side and the band.
function dosis(def, e) {
  const banda = bandaDe(def, e.banda);
  const tempo = def.unidad ? `<span>${palabraUnidad(def)}</span>` : `${svgTempo(e.tempo, { ancho: 52, alto: 22 })}<span class="sr">${textoTempo(e.tempo)}</span>`;
  return `<span class="num">${e.series} × ${e.reps}</span>${tempo}${
    def.unLado && LADOS[e.lado] ? `<span>${esc(t(LADOS[e.lado]))}</span>` : ''
  }${banda ? `<span class="con-banda">${muestraBanda(banda)}${esc(t(banda.nombre))}</span>` : ''}`;
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
        <h3>${esc(t(def.nombre))}</h3>
        <span class="linea-chips">${chipsEjercicio(def)}</span>
        <span class="dosis">${dosis(def, e)}</span>
      </span>
      <span class="plegar" aria-hidden="true">${ICONO.abrir}</span>
    </button>
    <div class="ejercicio-ajustes">
      <div class="mini-figura"></div>
      <div class="fila">
        <div class="ajuste"><span>${t('Series')}</span>${paso('series', e.series, t('Series'), 1, 6)}</div>
        <div class="ajuste"><span>${tituloUnidad(def)}</span>${paso('reps', e.reps, tituloUnidad(def), 1, topeReps(def))}</div>
        ${def.unLado ? `<div class="ajuste"><span>${t('Lado')}</span>${segmentos('lado', [['der', t('Derecho')], ['izq', t('Izquierdo')], ['ambos', t('Los dos')]], e.lado, t('Lado'))}</div>` : ''}
      </div>
      ${conBanda(def) ? eleccionBanda(e) : ''}
      ${def.unidad && !porPasos(def) ? '' : porPasos(def) ? `<div class="ajuste">
        <span>${t('Ritmo del paso')}</span>
        <div class="ritmo"><div class="ritmo-mini"><span>${t('Cada paso')}</span>${paso('tp', s, t('Segundos por paso'), 1, 4)}</div></div>
      </div>` : `<div class="ajuste">
        <span>${t('Ritmo de cada repetición')}</span>
        <div class="ritmo">
          <div class="ritmo-mini"><span>${t('Ida')}</span>${paso('t0', s, t('Segundos de ida'), 1, 6)}</div>
          <div class="ritmo-mini"><span>${t('Mantén')}</span>${paso('t1', m, t('Segundos manteniendo'), 0, 30)}</div>
          <div class="ritmo-mini"><span>${t('Vuelta')}</span>${paso('t2', b, t('Segundos de vuelta'), 1, 6)}</div>
          ${svgTempo(e.tempo, { ancho: 200, alto: 44 })}
        </div>
      </div>`}
      <details class="detalle">
        <summary>${t('Cómo se explica a la persona')}</summary>
        ${explicacion(def)}
        <p class="fuente">${t('Fuente: {fuentes}.', { fuentes: def.fuentes.map((f) => esc(t(f))).join('; ') })}</p>
      </details>
      <div class="campo"><label for="nota-${id}">${t('Nota para la persona')}</label>
        <textarea id="nota-${id}" data-accion="nota" rows="2" placeholder="${t('Por ejemplo: sin dolor; si molesta, baja menos')}">${esc(e.nota)}</textarea></div>
      <div class="ordenar">
        <button type="button" class="boton secundario" data-accion="subir" ${pos === 0 ? 'disabled' : ''}>${t('Subir')}</button>
        <button type="button" class="boton secundario" data-accion="bajar" ${pos === total - 1 ? 'disabled' : ''}>${t('Bajar')}</button>
        <button type="button" class="boton fantasma" data-accion="quitar">${t('Quitar de la rutina')}</button>
      </div>
    </div>
  </article>`;
}

function seccionRutina(b, vaciada = null) {
  return `<section class="rutina-armada" aria-labelledby="rutina-titulo">
    <h2 id="rutina-titulo">${t('La rutina')}</h2>
    ${b.orden.length ? `<button type="button" class="boton fantasma vaciar" data-accion="vaciar">${t('Vaciar')}</button>` : ''}
    ${vaciada ? `<p class="vaciada" role="status">${t('Rutina vaciada.')} <button type="button" class="enlace" data-accion="deshacer-vaciar">${t('Deshacer')}</button></p>` : ''}
    ${
      b.orden.length
        ? b.orden.map((id, i) => tarjetaEjercicio(id, b.ejercicios[id], id === b.activo, i, b.orden.length)).join('')
        : `<div class="rutina-vacia"><p>${t('Todavía no tiene ejercicios.')}</p></div>`
    }
  </section>`;
}

// A library row: the still of the exercise, and one line of text under the name with where it starts, what it needs
// and what it works. Sixty of them must read as a list, not as a wall of chips; among sixty, the picture is found first.
function filaBiblioteca(id, b) {
  const def = EJERCICIOS[id];
  const dentro = b.orden.includes(id);
  const musculos = def.musculos.principales.map((mu) => `<span class="vivo">${esc(t(MUSCULOS[mu] || mu))}</span>`).join(', ');
  return `<li class="biblio-fila ${id === b.activo && !dentro && b.mirado ? 'activo' : ''}" data-id="${id}">
    <button type="button" class="biblio-ver" data-accion="ver">
      <span class="biblio-poster"><img src="${poster(id, b.cuerpo)}" alt="" width="96" height="72" loading="lazy" decoding="async"></span>
      <span class="titulo"><h3>${esc(t(def.nombre))}</h3><span class="biblio-meta">${esc(t(def.posicion))} · ${esc(t(def.material))}${musculos ? ` · ${musculos}` : ''}</span></span>
    </button>
    ${
      dentro
        ? `<span class="biblio-dentro">${ICONO.check}<span class="rotulo">${t('En la rutina')}</span></span>`
        : `<button type="button" class="boton secundario biblio-anadir" data-accion="anadir" aria-label="${t('Añadir {ejercicio}', { ejercicio: esc(t(def.nombre)) })}">${ICONO.mas}<span class="rotulo">${t('Añadir')}</span></button>`
    }
    <div class="mini-figura"></div>
  </li>`;
}

// Starting positions in the order a person can get into them: standing and sitting first, the floor after. They are
// the catalogue's own words (Spanish, as data); each heading shows through t().
const POSICIONES = ['De pie', 'Sentado', 'Sentado a la mesa', 'Sentado en el suelo', 'Boca arriba', 'Boca abajo', 'De lado', 'A cuatro patas'];
const grupoPosicion = (def) => def.posicion.split(',')[0].trim();
const rangoPosicion = (g) => (POSICIONES.includes(g) ? POSICIONES.indexOf(g) : POSICIONES.length);

// A long list goes under its starting positions, which is what tells whether this person can do an exercise at all.
// A short one stays flat: a heading over every single exercise is noise.
function listaBiblioteca(b) {
  const ids = buscarEjercicios(b.filtro);
  if (!ids.length) return `<li class="biblio-vacia">${t('Ningún ejercicio con esos filtros.')}</li>`;
  if (ids.length <= 6) return ids.map((id) => filaBiblioteca(id, b)).join('');
  const grupos = new Map();
  for (const id of ids) {
    const g = grupoPosicion(EJERCICIOS[id]);
    grupos.set(g, [...(grupos.get(g) || []), id]);
  }
  return [...grupos.keys()]
    .sort((x, y) => rangoPosicion(x) - rangoPosicion(y))
    .map((g) => `<li class="biblio-grupo"><span>${esc(t(g))}</span><span class="num">${grupos.get(g).length}</span></li>${grupos.get(g).map((id) => filaBiblioteca(id, b)).join('')}`)
    .join('');
}

function cuentaBiblioteca(b) {
  const n = buscarEjercicios(b.filtro).length;
  if (n === ORDEN.length) return tn(n, '{n} ejercicio', '{n} ejercicios');
  return t('{n} de {total}', { n, total: ORDEN.length });
}

// Only the areas and muscles some exercise has: a filter that can only give an empty list is noise.
const zonasConEjercicios = () => Object.keys(ZONAS).filter((z) => ORDEN.some((id) => EJERCICIOS[id].zonas.includes(z)));
const musculosDe = (id) => [...EJERCICIOS[id].musculos.principales, ...EJERCICIOS[id].musculos.secundarios];
const musculosConEjercicios = () => Object.keys(MUSCULOS).filter((mu) => ORDEN.some((id) => musculosDe(id).includes(mu)));

// The body map: Gaudí's body from the front and from the back, a point on every area with exercises and the muscle
// groups the figure lights. Touching a point or a muscle filters the library; touching it again lets it go. The
// muscle chosen lights as on the figure, so the map and the list below say the same thing.
// Places the map's points where their data says, through the style object, which a strict content policy allows.
function colocarPuntos(raiz) {
  raiz.querySelectorAll('.mapa-punto[data-x]').forEach((p) => {
    p.style.left = `${p.dataset.x}%`;
    p.style.top = `${p.dataset.y}%`;
  });
}

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
        return `<path class="${clase}" d="${d}"${con ? ` data-accion="musculo-mapa" data-valor="${mu}"` : ''}><title>${esc(t(MUSCULOS[mu]))}</title></path>`;
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
          // Where the point goes, as data: a style attribute would be blocked by a strict host (style-src 'self');
          // colocarPuntos() sets it from script after the map is drawn.
          const sitio = `data-x="${((x / ancho) * 100).toFixed(2)}" data-y="${((y / alto) * 100).toFixed(2)}"`;
          const nombre = esc(t(ZONAS[z]));
          return `<button type="button" class="mapa-punto" data-accion="zona" data-valor="${z}" data-nombre="${nombre}" aria-pressed="${b.filtro.zona === z}" ${sitio} ${
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
    b.filtro.zona && ZONAS[b.filtro.zona] && `<button type="button" class="mapa-quitar" data-accion="zona" data-valor="" aria-label="${t('Quitar {nombre}', { nombre: esc(t(ZONAS[b.filtro.zona])) })}">${esc(t(ZONAS[b.filtro.zona]))}${ICONO.cerrar}</button>`,
    b.filtro.musculo && MUSCULOS[b.filtro.musculo] && `<button type="button" class="mapa-quitar musculo" data-accion="musculo-mapa" data-valor="" aria-label="${t('Quitar {nombre}', { nombre: esc(t(MUSCULOS[b.filtro.musculo])) })}">${esc(t(MUSCULOS[b.filtro.musculo]))}${ICONO.cerrar}</button>`,
  ].filter(Boolean);
  return `<div class="mapa" role="group" aria-label="${t('Zona del cuerpo')}">
    <div class="mapa-vistas">${vista('delante', t('Delante'))}${vista('detras', t('Detrás'))}</div>
    <p class="mapa-pie">${elegidos.length ? elegidos.join('') : t('Elige una zona o un músculo en la figura.')}</p>
  </div>`;
}

function seccionBiblioteca(b) {
  const musculos = musculosConEjercicios();
  return `<section class="biblioteca" aria-labelledby="biblio-titulo">
    <div class="biblio-arriba">
      <div class="biblio-cabeza">
        <button type="button" class="biblio-cerrar" data-accion="cerrar-biblioteca" aria-label="${t('Volver a la rutina')}">${ICONO.volver}</button>
        <h2 id="biblio-titulo" tabindex="-1">${t('Añadir ejercicios')}</h2>
        <span class="biblio-cuenta num" aria-live="polite">${cuentaBiblioteca(b)}</span>
      </div>
      <div class="biblio-filtros">
        <input type="search" class="buscar" data-accion="buscar" autocomplete="off" placeholder="${t('Buscar por nombre')}" aria-label="${t('Buscar ejercicios por nombre')}" value="${esc(b.filtro.texto)}">
      <label class="campo-musculo"><span>${t('Músculo')}</span>
        <select data-accion="musculo">
          <option value="">${t('Todos los músculos')}</option>
          ${musculos.map((mu) => `<option value="${mu}" ${b.filtro.musculo === mu ? 'selected' : ''}>${esc(t(MUSCULOS[mu]))}</option>`).join('')}
        </select>
      </label>
        <button type="button" class="boton secundario biblio-ver-mapa" data-accion="ver-mapa" aria-expanded="false" aria-controls="hueco-mapa">${ICONO.cuerpo}<span>${t('En la figura')}</span></button>
      </div>
    </div>
    <div class="biblio-cuerpo">
      <div class="hueco-mapa" id="hueco-mapa">${mapaCuerpo(b)}</div>
      <ul class="biblio-lista">${listaBiblioteca(b)}</ul>
    </div>
  </section>`;
}

// Templates live in this browser. A template keeps the exercises, their settings and the settings for the whole
// routine; never who it was for.
function seccionPlantillas(b) {
  const lista = leerPlantillas();
  return `<section class="plantillas" aria-labelledby="plantillas-titulo">
    <div class="plantillas-cabeza">
      <h2 id="plantillas-titulo">${t('Plantillas')}</h2>
      <button type="button" class="boton fantasma" data-accion="nueva-plantilla" ${b.orden.length ? '' : 'hidden'}>${t('Guardar la rutina como plantilla')}</button>
    </div>
    <form class="plantilla-nueva" hidden>
      <input data-accion="nombre-plantilla" maxlength="60" autocomplete="off" placeholder="${t('Por ejemplo: rodilla, primera semana')}" aria-label="${t('Nombre de la plantilla')}">
      <button type="submit" class="boton">${t('Guardar')}</button>
      <button type="button" class="boton fantasma" data-accion="cancelar-plantilla">${t('Cancelar')}</button>
    </form>
    ${
      lista.length
        ? `<div class="lista-plantillas">${lista
            .map(
              (p, i) => `<span class="plantilla">
                <button type="button" class="usar" data-accion="usar-plantilla" data-i="${i}">${esc(p.nombre)}<span class="cuantos num">${p.orden.length}</span></button>
                <button type="button" class="borrar" data-accion="borrar-plantilla" data-i="${i}" aria-label="${t('Borrar la plantilla {nombre}', { nombre: esc(p.nombre) })}">${ICONO.cerrar}</button>
              </span>`,
            )
            .join('')}</div>`
        : `<p class="ayuda">${t('Aún no hay plantillas: guarda esta rutina como una cuando tenga ejercicios.')}</p>`
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
  return `<div class="recientes" role="group" aria-label="${t('Para una de tus personas')}">
    <span>${t('Para una de tus personas')}</span>
    ${seis.map((p) => `<button type="button" class="filtro" data-accion="persona" data-id="${esc(p.id)}" aria-pressed="${b.persona === p.id}">${esc(nombreDe(p))}</button>`).join('')}
    ${lista.length > 6 ? `<a href="#personas">${t('Todas')}</a>` : ''}
  </div>`;
}

// A routine back in the builder, to change it: its exercises with their settings, and the routine's own settings.
function rutinaAlBorrador(r, extra = {}) {
  const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
  Object.assign(b, { descanso: r.d, veces: r.x, semana: r.w || 0, tope: Number.isInteger(r.m) ? r.m : TOPE_MOLESTIA, cuerpo: r.c || 'a', ...extra });
  b.orden = r.e.map((e) => e.i).filter((i) => ORDEN.includes(i));
  for (const e of r.e) if (ORDEN.includes(e.i)) b.ejercicios[e.i] = { series: e.s, reps: e.r, tempo: [...e.t], lado: e.l ?? null, banda: e.b || '', nota: e.n || '' };
  b.activo = b.orden[0] || b.activo;
  almacen.guardar('borrador', b);
}

// In the Moodle activity form, «Armar la rutina» on an activity that has one opens the builder with it, once per window.
let formularioLeido = false;
async function rutinaDelFormularioAlBorrador() {
  if (formularioLeido) return;
  formularioLeido = true;
  const codigo = rutinaDelFormulario();
  if (!codigo) return;
  let r = null;
  try {
    r = limpiarRutina(await decodificar(codigo));
  } catch {
    // A code that cannot be read: the form says so itself when it is saved.
  }
  if (r?.e?.length) rutinaAlBorrador(r, { para: '', ...(r.de ? { de: r.de } : {}) });
}

function vistaArmar() {
  const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
  let gonio = null;
  const guardar = () => almacen.guardar('borrador', b);
  const ajustes = (id) => (b.ejercicios[id] ||= ajustesIniciales(id));

  const resumenCorto = () => {
    if (!b.orden.length) return t('Elige al menos un ejercicio');
    const seg = b.orden.reduce((suma, id) => suma + duracionEjercicio(b.ejercicios[id], b.descanso, EJERCICIOS[id]), 0);
    return `${tn(b.orden.length, '{n} ejercicio', '{n} ejercicios')} · ${minutos(seg)}`;
  };

  function pintar() {
    app.innerHTML = `<div class="armar${b.orden.length ? '' : ' sin-ejercicios'}">
      <div class="armar-biblio">${seccionBiblioteca(b)}</div>
      <div class="armar-izq">
        ${barraApp(t('Nueva rutina'))}
        <nav class="etapas-app" aria-label="${t('Pasos')}">${etapasApp(b)}</nav>
        <div class="armar-cuerpo">
          ${primerUsoBanda(b)}
          <section class="etapa" id="etapa-para" aria-labelledby="etapa-para-t">
            ${armandoParaMoodle ? `<p class="etapa-titulo" id="etapa-para-t"><b>1</b>${t('Quién la manda')}</p>
            <div class="campos">
              <div class="campo"><label for="de">${t('Tu nombre')}</label><input id="de" data-accion="de" autocomplete="off" value="${esc(b.de)}"></div>
            </div>
            <p class="ayuda">${t('Es para toda la clase: cada uno la verá con su nombre, como «Tu rutina de» y el tuyo.')}</p>` : `<p class="etapa-titulo" id="etapa-para-t"><b>1</b>${t('Para quién')}</p>
            <div class="campos">
              <div class="campo"><label for="para">${t('Nombre de la persona')}</label><input id="para" data-accion="para" autocomplete="off" value="${esc(b.para)}"></div>
              <div class="campo"><label for="de">${t('Tu nombre')}</label><input id="de" data-accion="de" autocomplete="off" value="${esc(b.de)}"></div>
            </div>
            <div class="hueco-recientes">${personasRecientes(b)}</div>
            <div class="hueco-lleno">${avisoLleno(b)}</div>`}
          </section>
          <section class="etapa" id="etapa-ejercicios" aria-labelledby="etapa-ejercicios-t">
            <p class="etapa-titulo" id="etapa-ejercicios-t"><b>2</b>${t('Ejercicios')}</p>
            <div class="hueco-plantillas">${seccionPlantillas(b)}</div>
            <div class="hueco-rutina">${seccionRutina(b)}</div>
            <button type="button" class="anadir-ejercicio" data-accion="abrir-biblioteca" aria-haspopup="dialog">${ICONO.mas}<span>${t('Añadir ejercicio')}</span></button>
          </section>
          <section class="etapa" id="etapa-ajustes" aria-labelledby="etapa-ajustes-t">
            <p class="etapa-titulo" id="etapa-ajustes-t"><b>3</b>${t('Ajustes')}</p>
            <section class="general">
              <h2>${t('Para toda la rutina')}</h2>
              <div class="fila">
                <div class="ajuste"><span>${t('Descanso entre series')}</span>${segmentos('descanso', [[30, '30 s'], [45, '45 s'], [60, '1 min'], [90, t('1 min 30')]], b.descanso, t('Descanso entre series'))}</div>
                <div class="ajuste"><span>${t('Veces al día')}</span>${segmentos('veces', [[1, '1'], [2, '2'], [3, '3']], b.veces, t('Veces al día'))}</div>
                <div class="ajuste"><span>${t('Días a la semana')}</span>${segmentos('semana', [[0, t('Libre')], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [7, '7']], b.semana, t('Días a la semana'))}</div>
                <div class="ajuste"><span>${t('Figura')}</span>${eleccionFigura(b.cuerpo)}</div>
                <div class="ajuste"><span>${t('Molestia aceptable, de 0 a 10')}</span>${paso('tope', b.tope, t('Molestia aceptable'), 0, 9)}</div>
              </div>
              <p class="ayuda">${armandoParaMoodle ? t('Si alguien pasa de esa molestia, el día te sale marcado en su seguimiento.') : t('Si la persona pasa de esa molestia, el día te sale marcado en su resumen.')}</p>
            </section>
          </section>
        </div>
        <div class="barra-crear" id="etapa-enlace">
          <span class="resumen-corto">${resumenCorto()}</span>
          <button type="button" class="boton" data-accion="crear" ${b.orden.length ? '' : 'disabled'}>${armandoParaMoodle ? t('Usar en la actividad') : t('Crear enlace')}</button>
          <button type="button" class="boton anadir-en-barra" data-accion="abrir-biblioteca" aria-haspopup="dialog">${ICONO.mas}${t('Añadir ejercicio')}</button>
        </div>
      </div>
      <aside class="vista">
        <h2>${t('Así lo verá')}</h2>
        <div class="vista-figura"></div>
        <div class="vista-pie"></div>
      </aside>
    </div>`;
    colocarPuntos(app);
    colocarFigura();
    ponerEjemplo();
  }

  // The preview: in the side panel on wide screens; on a phone, inside the active card or library row.
  async function colocarFigura() {
    // Nothing in the routine and nothing looked at in the library: the preview waits with its own words, not with the
    // library's first exercise.
    if (!b.orden.length && !b.mirado) return vistaVacia();
    app.querySelector('.vista')?.classList.remove('vacia');
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
      // Another exercise tapped meanwhile: that call shows it, this one stops here.
      if ((await f.poner(id, { tempo: e.tempo, lado: e.lado === 'izq' ? 'izq' : 'der', banda: bandaDe(EJERCICIOS[id], e.banda)?.color })) === false) return;
      nombrarFigura(f, id, e.lado);
      gonio = await medida(f);
      pintarGonio();
      f.empezar({ modo: 'demo' });
    } catch (err) {
      sitio.innerHTML = `<p class="chip">${t('La figura de este ejercicio aún no está')}</p>`;
      console.warn(err);
    }
  }

  // The side panel before anything is chosen: the figure of the routine standing at ease, with no exercise on it, and
  // what will move there. Changing «Figura» shows the other body at once.
  async function vistaVacia() {
    const vista = app.querySelector('.vista');
    if (!vista) return;
    vista.classList.add('vacia');
    vista.querySelector('.vista-pie').innerHTML = `<div class="tarjeta"><p>${t('Cuando elijas un ejercicio, aquí lo verás moverse como lo verá la persona, al ritmo que le pongas.')}</p></div>`;
    const sitio = vista.querySelector('.vista-figura');
    for (const c of [...sitio.children]) if (c.tagName !== 'CANVAS') c.remove();
    if (!window.matchMedia('(min-width: 980px)').matches) return;
    try {
      const f = await figuraEn(sitio, b.cuerpo);
      f.oyentes = {};
      await f.cargarCuerpo();
      // An exercise chosen meanwhile has asked for the figure already: this call must not overtake it.
      if (b.orden.length || b.mirado) return;
      const espera = [DE_PIE, ...DE_PIE_MUESTRA].find((id) => f.manifiesto.ejercicios[id]);
      if (!espera || (await f.poner(espera)) === false || b.orden.length || b.mirado) return;
      f.parar();
      f.posar(f.fases.subir[0]);
      f.musculos?.fuerza(0);
      f.renderer.domElement.setAttribute('aria-label', t('La figura, de pie, a la espera de un ejercicio'));
    } catch (err) {
      console.warn(err);
    }
  }

  function pintarPieVista() {
    const pie = app.querySelector('.vista-pie');
    const e = ajustes(b.activo);
    if (pie) pie.innerHTML = `<div class="tarjeta"><h3>${esc(t(EJERCICIOS[b.activo].nombre))}</h3>${svgTempo(e.tempo, { etiquetas: true, punto: true })}<span class="chip">${textoTempo(e.tempo)}</span><div class="gonio" hidden></div></div>`;
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
    app.querySelector('.armar').classList.toggle('sin-ejercicios', !b.orden.length);
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

  // Emptied a moment ago: «Deshacer» stays until something else is touched.
  let vaciada = null;
  function refrescarRutina() {
    const hueco = app.querySelector('.hueco-rutina');
    apartarLienzo(hueco);
    hueco.innerHTML = seccionRutina(b, vaciada);
    actualizarBarra();
    ponerEjemplo();
  }

  // The link of the routine to try, in the figure chosen, on its button as soon as it is made.
  function ponerEjemplo() {
    const boton = app.querySelector('.probar-ejemplo');
    if (boton) enlaceEjemplo(b.cuerpo).then((url) => boton.isConnected && (boton.href = url));
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
    colocarPuntos(app.querySelector('.hueco-mapa'));
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

  // Below 1280 px the library is a sheet over the whole screen: «Añadir ejercicio» opens it with the search on top,
  // choosing one closes it and leaves that exercise open in the routine, in sight. The phone's «back» closes it too, as
  // in any app. Enrique, 13 November 2026: «bajar, subir, bajar... hay que adivinar». From 1280 px it is a column of
  // its own at the left, with its own scroll: the routine in the middle never goes under it.
  const estrecho = () => !window.matchMedia('(min-width: 1280px)').matches;
  const hojaAbierta = () => !!app.querySelector('.armar.biblio-abierta');
  function abrirBiblioteca() {
    if (hojaAbierta()) return;
    app.querySelector('.armar').classList.add('biblio-abierta');
    document.body.classList.add('con-hoja');
    const hoja = app.querySelector('.biblioteca');
    hoja.setAttribute('role', 'dialog');
    hoja.setAttribute('aria-modal', 'true');
    hoja.scrollTop = 0;
    history.pushState({ jepysoHoja: 'biblioteca' }, '');
    app.querySelector('#biblio-titulo').focus({ preventScroll: true });
  }
  // Closes the sheet; «sinHistoria» when the history entry is already gone (the «back» of the phone).
  function cerrarBiblioteca(sinHistoria) {
    if (!hojaAbierta()) return;
    app.querySelector('.armar').classList.remove('biblio-abierta');
    document.body.classList.remove('con-hoja');
    const hoja = app.querySelector('.biblioteca');
    hoja.removeAttribute('role');
    hoja.removeAttribute('aria-modal');
    if (!sinHistoria && history.state?.jepysoHoja) history.back();
  }
  // The exercise just chosen, open and under the bars, with a moment of light so the eye finds it.
  function enseñarTarjeta(id) {
    const tarjeta = app.querySelector(`.ejercicio[data-id="${id}"]`);
    if (!tarjeta) return;
    const arriba = [...app.querySelectorAll('.barra-app, .etapas-app')].reduce((t, x) => t + x.getBoundingClientRect().height, 0);
    window.scrollTo(0, window.scrollY + tarjeta.getBoundingClientRect().top - arriba - 12);
    tarjeta.classList.add('recien');
    setTimeout(() => tarjeta.classList.remove('recien'), 1400);
    tarjeta.querySelector('.ejercicio-cabeza').focus({ preventScroll: true });
  }
  // Closing with «history.back()» ends in a «popstate», after which the browser would put back the scroll it had: the
  // card to show waits for it.
  let mostrarAlVolver = null;
  const alVolver = () => {
    cerrarBiblioteca(true);
    if (mostrarAlVolver) {
      const id = mostrarAlVolver;
      mostrarAlVolver = null;
      requestAnimationFrame(() => enseñarTarjeta(id));
    }
  };
  const alTeclear = (ev) => {
    if (ev.key === 'Escape' && hojaAbierta()) cerrarBiblioteca();
  };

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
    b.mirado = true;
    app.querySelectorAll('.ejercicio').forEach((t) => {
      t.classList.toggle('activo', t.dataset.id === id);
      t.querySelector('.ejercicio-cabeza').setAttribute('aria-expanded', String(t.dataset.id === id));
    });
    app.querySelectorAll('.biblio-fila').forEach((t) => t.classList.toggle('activo', t.dataset.id === id && !b.orden.includes(id)));
    colocarFigura();
  }

  function guardarPlantilla(nombre) {
    const lista = leerPlantillas().filter((p) => p.nombre !== nombre);
    lista.unshift({
      nombre, cambiada: new Date().toISOString(), d: b.descanso, x: b.veces, w: b.semana || undefined, m: b.tope, c: b.cuerpo, orden: [...b.orden],
      ejercicios: Object.fromEntries(b.orden.map((id) => [id, JSON.parse(JSON.stringify(b.ejercicios[id]))])),
    });
    almacen.guardar('plantillas', lista.slice(0, 60));
    refrescarPlantillas();
  }

  // «Hecho: empezar otra», from the sheet of the link: a clean routine for the next person. Their name, their file and
  // the exercises go; «De» and the settings for the whole routine stay, as they are the professional's.
  function empezarOtra() {
    Object.assign(b, { para: '', persona: undefined, orden: [], ejercicios: {}, filtro: { zona: '', musculo: '', texto: '' }, mirado: false });
    vaciada = null;
    guardar();
    apartarLienzo(app);
    pintar();
    window.scrollTo(0, 0);
    app.querySelector('#para')?.focus({ preventScroll: true });
  }

  function usarPlantilla(p) {
    Object.assign(b, { descanso: p.d, veces: p.x, semana: p.w || 0, tope: p.m ?? TOPE_MOLESTIA, cuerpo: p.c || 'a' });
    b.orden = p.orden.filter((id) => ORDEN.includes(id));
    for (const id of b.orden) b.ejercicios[id] = { ...ajustesIniciales(id), ...JSON.parse(JSON.stringify(p.ejercicios[id] || {})) };
    b.activo = b.orden[0] || b.activo;
    apartarLienzo(app);
    pintar();
  }

  let deshacerBorrar = null;
  app.onclick = (ev) => {
    const el = ev.target.closest('[data-accion]');
    const a = el?.dataset.accion;
    const sitio = ev.target.closest('.ejercicio, .biblio-fila');
    const id = sitio?.dataset.id;
    if (a !== 'borrar-plantilla' && deshacerBorrar) deshacerBorrar();
    if (vaciada && a && a !== 'vaciar' && a !== 'deshacer-vaciar') {
      vaciada = null;
      app.querySelector('.vaciada')?.remove();
    }
    if (sitio && (id !== b.activo || !b.mirado) && a !== 'anadir' && a !== 'quitar') {
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
      b.mirado = true;
      if (hojaAbierta()) {
        // From the sheet: back to the routine, with this exercise open in front, to set it.
        if (history.state?.jepysoHoja) mostrarAlVolver = id;
        cerrarBiblioteca();
        refrescarRutina();
        refrescarBiblioteca();
        enseñarTarjeta(id);
      } else {
        // The library is a column of its own: the row stays where it was, and the card just added comes into sight in
        // the routine, open, with a moment of light; the focus stays in the library to add another.
        refrescarRutina();
        const lista = app.querySelector('.biblio-lista');
        const arriba = lista.scrollTop;
        refrescarBiblioteca();
        lista.scrollTop = arriba;
        const tarjeta = app.querySelector(`.ejercicio[data-id="${id}"]`);
        if (tarjeta) {
          const r = tarjeta.getBoundingClientRect();
          const tapa = [...app.querySelectorAll('.barra-app, .etapas-app')].reduce((t, x) => t + x.getBoundingClientRect().height, 0);
          const pie = app.querySelector('.barra-crear')?.getBoundingClientRect().height || 0;
          if (r.top < tapa || r.bottom > innerHeight - pie) window.scrollTo(0, window.scrollY + r.top - tapa - 12);
          tarjeta.classList.add('recien');
          setTimeout(() => tarjeta.classList.remove('recien'), 1400);
        }
        app.querySelector(`.biblio-fila[data-id="${id}"] .biblio-ver`)?.focus({ preventScroll: true });
      }
      colocarFigura();
    } else if (a === 'abrir-biblioteca') {
      abrirBiblioteca();
    } else if (a === 'cerrar-biblioteca') {
      cerrarBiblioteca();
      [...app.querySelectorAll('[data-accion="abrir-biblioteca"]')].find((x) => x.offsetParent)?.focus({ preventScroll: true });
    } else if (a === 'ver-mapa') {
      const abierto = el.getAttribute('aria-expanded') !== 'true';
      el.setAttribute('aria-expanded', String(abierto));
      app.querySelector('.biblio-cuerpo').classList.toggle('con-mapa', abierto);
    } else if (a === 'quitar') {
      b.orden = b.orden.filter((x) => x !== id);
      if (b.activo === id) b.activo = b.orden[0] || id;
      if (!b.orden.length) b.mirado = false;
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
      const lim = a === 'series' ? [1, 6] : [1, topeReps(EJERCICIOS[id])];
      b.ejercicios[id][a] = Math.min(lim[1], Math.max(lim[0], b.ejercicios[id][a] + delta));
      refrescarTarjeta(id);
    } else if (a === 'tp') {
      // A walking exercise: each step takes the same, and there is no hold.
      const v = Math.min(4, Math.max(1, b.ejercicios[id].tempo[0] + delta));
      b.ejercicios[id].tempo = [v, 0, v];
      refrescarTarjeta(id);
      actualizarTempo(id);
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
    } else if (a === 'banda') {
      b.ejercicios[id].banda = Object.hasOwn(BANDAS, el.dataset.valor) ? el.dataset.valor : '';
      refrescarTarjeta(id);
      if (figura && id === b.activo) figura.colorBanda(bandaDe(EJERCICIOS[id], b.ejercicios[id].banda)?.color);
      app.querySelector(`.ejercicio[data-id="${id}"] [data-accion="banda"][data-valor="${b.ejercicios[id].banda}"]`)?.focus();
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
      ponerEjemplo();
    } else if (a === 'tope') {
      b.tope = Math.min(9, Math.max(0, b.tope + delta));
      el.closest('.paso').outerHTML = paso('tope', b.tope, t('Molestia aceptable'), 0, 9);
    } else if (a === 'descanso' || a === 'veces' || a === 'semana') {
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
      const p = leerPlantillas()[Number(el.dataset.i)];
      if (p) usarPlantilla(p);
    } else if (a === 'borrar-plantilla') {
      // A first touch asks; the second one deletes. Touching anything else, or waiting, leaves it as it was.
      if (el.dataset.confirmar) {
        deshacerBorrar = null;
        const lista = leerPlantillas();
        const [borrada] = lista.splice(Number(el.dataset.i), 1);
        if (borrada) apuntarBorrada('plantillas', borrada.nombre);
        almacen.guardar('plantillas', lista);
        refrescarPlantillas();
      } else {
        if (deshacerBorrar) deshacerBorrar();
        el.dataset.confirmar = '1';
        el.classList.add('confirmar');
        el.textContent = t('¿Borrar?');
        const espera = setTimeout(() => deshacerBorrar?.(), 4000);
        deshacerBorrar = () => {
          clearTimeout(espera);
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
        if (tope) tope.outerHTML = paso('tope', b.tope, t('Molestia aceptable'), 0, 9);
      }
    } else if (a === 'crear') {
      crearEnlace(b, empezarOtra);
      app.querySelector('.primer-uso')?.remove();
    } else if (a === 'vaciar') {
      // Emptying keeps each exercise's settings, so «Deshacer» brings the routine back exactly.
      vaciada = { orden: [...b.orden], activo: b.activo };
      b.orden = [];
      b.mirado = false;
      refrescarRutina();
      refrescarBiblioteca();
      colocarFigura();
      app.querySelector('[data-accion="deshacer-vaciar"]')?.focus({ preventScroll: true });
    } else if (a === 'deshacer-vaciar') {
      if (vaciada) Object.assign(b, vaciada, { mirado: true });
      vaciada = null;
      refrescarRutina();
      refrescarBiblioteca();
      colocarFigura();
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
  // A template chosen in the Plantillas tab arrives here, once.
  const pendiente = almacen.leer('plantilla-a-usar', null);
  if (pendiente !== null) {
    almacen.guardar('plantilla-a-usar', null);
    const p = leerPlantillas()[pendiente];
    if (p) usarPlantilla(p);
  }
  // A reference programme (Otago, Vivifrail), the same way.
  const programa = almacen.leer('programa-a-usar', null);
  if (programa !== null) {
    almacen.guardar('programa-a-usar', null);
    const p = PROGRAMAS.find((x) => x.id === programa);
    if (p) usarPlantilla(limpiarPlantilla(p));
  }
  const ancho = window.matchMedia('(min-width: 980px)');
  const conColumna = window.matchMedia('(min-width: 1280px)');
  const alCambiarAncho = () => {
    // Wide, the library is a column again: no sheet left open behind it.
    if (!estrecho()) cerrarBiblioteca();
    colocarFigura();
  };
  ancho.addEventListener('change', alCambiarAncho);
  conColumna.addEventListener('change', alCambiarAncho);
  window.addEventListener('popstate', alVolver);
  document.addEventListener('keydown', alTeclear);
  // The sheet's entry in the history is not a page: going back must not move the routine.
  const restaurar = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  return () => {
    history.scrollRestoration = restaurar;
    ancho.removeEventListener('change', alCambiarAncho);
    conColumna.removeEventListener('change', alCambiarAncho);
    window.removeEventListener('popstate', alVolver);
    document.removeEventListener('keydown', alTeclear);
    document.body.classList.remove('con-hoja');
    if (figura) figura.oyentes = {};
    app.onclick = app.oninput = app.onchange = app.onsubmit = null;
  };
}

async function crearEnlace(b, empezarOtra = null) {
  // The first link made: from now on the empty routine no longer explains the way.
  almacen.guardar('estrenada', true);
  const rutina = {
    v: 1,
    para: b.para.trim(),
    de: b.de.trim(),
    d: b.descanso,
    x: b.veces,
    w: b.semana || undefined,
    m: b.tope,
    c: b.cuerpo || 'a',
    f: diaLocal(),
    e: b.orden.map((id) => {
      const e = b.ejercicios[id];
      return { i: id, s: e.series, r: e.reps, t: e.tempo, l: e.lado, b: bandaDe(EJERCICIOS[id], e.banda)?.clave, n: e.nota.trim() || undefined };
    }),
  };
  // For a Moodle activity: the routine goes back to the activity form, for the whole class and with no file. Opened by
  // hand, without the form behind, it goes on as a link to copy.
  if (armandoParaMoodle && devolverRutina(await codificar({ ...rutina, para: '' }))) return;
  // With a name, the routine goes to that person's file: the one chosen in the builder, the only one with that name,
  // or a new one. Its id travels in the link (p) and comes back with each summary.
  const lista = leerPersonas();
  let persona = null;
  let sinSitio = false;
  if (rutina.para) {
    const iguales = buscarPorNombre(lista, rutina.para);
    persona = (b.persona && lista.find((x) => x.id === b.persona)) || (iguales.length === 1 ? iguales[0] : null);
    if (!persona && iguales.length > 1) sinSitio = 'elegir';
    else if (!persona && caben(lista)) persona = crearPersona(lista, rutina.para);
    if (persona) rutina.p = persona.id;
    else if (!sinSitio) sinSitio = true;
  }
  const codigo = await codificar(rutina);
  if (persona) {
    apuntarRutina(lista, { id: persona.id, nombre: rutina.para }, rutina, codigo);
    if (guardarPersonas(lista)) {
      b.persona = persona.id;
      almacen.guardar('borrador', b);
    } else {
      persona = null;
      sinSitio = 'lleno';
    }
  }
  // The free version: a file needs its ticket to open (vales.js). With the Google sign-in at hand it is asked now, while
  // the sheet opens; without it, the file waits locked until the professional signs in at Personas.
  const sinVale = persona && !fichaAbierta(persona);
  const url = `${location.origin}${location.pathname}#r=${codigo}`;
  // The message is the professional's, in their language; the link inside it reads the same in any.
  const mensaje = rutina.para
    ? t('Hola, {nombre}. Aquí tienes tu rutina de ejercicios. Ábrela en tu teléfono y sigue a la figura:', { nombre: rutina.para })
    : t('Aquí tienes tu rutina de ejercicios. Ábrela en tu teléfono y sigue a la figura:');

  let qr = '';
  try {
    const q = window.qrcode(0, 'L');
    q.addData(url);
    q.make();
    qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch {
    qr = `<p>${t('El enlace es demasiado largo para un código QR.')}</p>`;
  }

  // The sheet of the link: first what sends it (WhatsApp, Telegram, copy), under the message as it will arrive; the
  // code and the address folded, open by default on a computer, where the person scans it in the consultation. A
  // <dialog>: its ×, Escape and the phone's «back» close it, and the focus goes back to «Crear enlace».
  const nombre = rutina.para ? esc(rutina.para) : '';
  const dialogo = document.createElement('dialog');
  dialogo.className = 'hoja hoja-enlace';
  dialogo.setAttribute('aria-labelledby', 'hoja-titulo');
  const lleno = { n: limite() };
  dialogo.innerHTML = `<div class="hoja-cabeza"><h2 id="hoja-titulo" tabindex="-1">${t('La rutina, lista')}</h2>
      <button type="button" class="redondo" data-h="cerrar" aria-label="${t('Cerrar')}">${ICONO.cerrar}</button></div>
    ${persona ? `<p class="en-ficha">${enFicha(persona, sinVale && !cuentaDeVales())}</p>` : ''}
    ${sinSitio === 'lleno' ? `<p class="en-ficha">${t(SIN_SITIO)} ${t('La rutina va igual en el enlace.')}</p>` : ''}
    ${sinSitio === 'elegir' ? `<p class="en-ficha">${t('Tienes más de una ficha con el nombre {nombre}: elige cuál en «Para» y vuelve a crear el enlace para guardarla en su ficha. La rutina va igual en este enlace.', { nombre: esc(rutina.para) })}</p>` : ''}
    ${sinSitio === true ? `<p class="en-ficha">${esDePago()
      ? t('No se guarda en una ficha: ya tienes {n} personas con ficha, el máximo de tu plan. La rutina va igual en el enlace.', lleno)
      : t('No se guarda en una ficha: ya tienes {n} personas con ficha, el máximo de la versión gratis. La rutina va igual en el enlace.', lleno)} ${ampliarPlan()}</p>` : ''}
    <figure class="burbuja"><figcaption>${nombre ? t('Así le llega a {nombre}', { nombre }) : t('Así llega')}</figcaption><p>${esc(mensaje)} <span class="burbuja-enlace">${esc(location.host)}/…</span></p></figure>
    <div class="hoja-mandar">
      <a class="boton" href="${esc(enlaceMensaje('wa', mensaje, url))}" target="_blank" rel="noopener">${ICONO.whatsapp}${t('Mandar por WhatsApp')}</a>
      <a class="boton" href="${esc(enlaceMensaje('tg', mensaje, url))}" target="_blank" rel="noopener">${ICONO.telegram}${t('Mandar por Telegram')}</a>
      ${botonCompartir('h')}
      <button type="button" class="boton secundario" data-h="copiar">${t('Copiar enlace')}</button>
    </div>
    <a class="boton fantasma hoja-ver" href="${esc(url)}" target="_blank" rel="noopener">${nombre ? t('Ver la rutina como {nombre}', { nombre }) : t('Ver la rutina como la persona')}</a>
    <details class="hoja-mas"${window.matchMedia('(min-width: 700px)').matches ? ' open' : ''}><summary>${t('El código QR y el enlace')}</summary>
      <div class="qr">${qr}</div>
      <div class="enlace-texto">${esc(url)}</div>
    </details>
    <p class="hoja-pie">${t('Cuando la haga, te mandará su resumen: ábrelo en este aparato y se guarda en su ficha. Todo va dentro del enlace: no pasa por ningún servidor de Oksigenia.')}</p>
    ${empezarOtra ? `<button type="button" class="boton secundario hoja-otra" data-h="otra">${t('Hecho: empezar otra rutina')}</button>` : ''}`;
  document.body.appendChild(dialogo);
  const volverA = document.activeElement;
  let destino = null;
  const alAtras = () => dialogo.open && dialogo.close();
  dialogo.addEventListener('close', () => {
    window.removeEventListener('popstate', alAtras);
    dialogo.remove();
    // Closed by its × or Escape: its entry in the history goes too. «Ver su ficha» goes there after it.
    if (history.state?.jepysoHoja === 'enlace') {
      if (destino) window.addEventListener('popstate', () => (location.hash = destino), { once: true });
      history.back();
    } else if (destino) location.hash = destino;
    if (!destino) volverA?.focus?.({ preventScroll: true });
  });
  dialogo.showModal();
  if (sinVale && cuentaDeVales()) {
    pedirVale(persona.id).then((bien) => {
      const linea = dialogo.querySelector('.en-ficha');
      if (!linea) return;
      if (bien) linea.innerHTML = enFicha(persona, false);
      else if (fichaSinPlaza(persona.id)) linea.textContent = t('Guardada en la ficha de {nombre}, pero tu cuenta de Google ya tiene sus {n} fichas gratis: esta no se abrirá hasta que borres otra. La rutina va igual en el enlace.', { nombre: nombreDe(persona), n: LIMITE_GRATIS });
    });
  }
  history.pushState({ jepysoHoja: 'enlace' }, '');
  window.addEventListener('popstate', alAtras);
  dialogo.querySelector('#hoja-titulo').focus({ preventScroll: true });
  dialogo.addEventListener('click', async (ev) => {
    // A tap outside the sheet, on the dimmed page, closes it as before.
    if (ev.target === dialogo) {
      const r = dialogo.getBoundingClientRect();
      if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return dialogo.close();
    }
    if (ev.target.closest('[data-h="cerrar"]')) return dialogo.close();
    if (ev.target.closest('[data-h="otra"]')) {
      dialogo.close();
      return empezarOtra?.();
    }
    const ficha = ev.target.closest('.en-ficha a');
    if (ficha) {
      ev.preventDefault();
      destino = ficha.getAttribute('href');
      return dialogo.close();
    }
    if (ev.target.closest('[data-h="compartir"]')) return compartir(mensaje, url);
    if (ev.target.closest('[data-h="copiar"]')) {
      try {
        await navigator.clipboard.writeText(url);
        ev.target.closest('button').textContent = t('Copiado');
      } catch {
        ev.target.closest('button').textContent = t('No se pudo copiar');
      }
    }
  });
}

// ---------- Routine (the person) ----------
// A link that cannot be opened: whose app this is, the likely cause in plain words and what to do about it.
const avisoRoto = (titulo, texto) => `<div class="saludo aviso-roto"><p class="marca-jepyso">jepyso<span aria-hidden="true">°</span></p><h1>${titulo}</h1><p>${texto}</p></div>`;

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
  let r = null;
  try {
    r = limpiarRutina(await decodificar(codigo));
  } catch {
    // Read below as a link that cannot be opened.
  }
  if (!r) {
    app.innerHTML = avisoRoto(t('Este enlace no se puede abrir'), t('Suele pasar cuando el enlace se corta al copiarlo y pegarlo. Pídele a quien te lo mandó que te lo reenvíe, y ábrelo tocándolo en el mensaje, sin copiarlo.')) + firmaPersona;
    return () => {};
  }
  hayVoz(); // the list of voices fills while the person reads the routine
  const ejercicios = r.e.filter((e) => EJERCICIOS[e.i]);
  if (!ejercicios.length) {
    app.innerHTML = avisoRoto(t('Este enlace no trae ejercicios que se puedan abrir'), t('Puede que tu teléfono tenga guardada una versión anterior de Jepyso. Vuelve a abrir el enlace con conexión a internet; si sigue igual, pídele a quien te lo mandó que te lo reenvíe.')) + firmaPersona;
    return () => {};
  }
  const clave = 'hist:' + hashCorto(codigo);
  // In a Moodle course the history is the course's, joined to what this device kept, and the person is the one logged in.
  if (enMoodle) {
    await prepararMoodle();
    juntarHistorial(clave);
    recordarClave(clave);
    if (!r.para && moodle()?.nombre) r.para = moodle().nombre;
  }
  // Where what is done goes: to the course, or in a summary the person sends.
  const destinoMarca = (q) => (enMoodle ? t('saldrá marcado en lo que ve {quien} en el curso', { quien: q }) : t('saldrá marcado en el resumen que le mandes a {quien}', { quien: q }));
  const totalSeg = ejercicios.reduce((t, e) => t + duracionEjercicio({ series: e.s, reps: e.r, tempo: e.t, lado: e.l }, r.d, EJERCICIOS[e.i]), 0);
  const tope = Number.isInteger(r.m) ? r.m : TOPE_MOLESTIA;
  const quien = r.de ? esc(r.de) : t('quien te dio la rutina');
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
      <h3 id="manana-titulo">${t('¿Qué tal al levantarte?')}</h3>
      <p>${t('Ayer hiciste la rutina. Esta mañana, al levantarte, ¿cuánta molestia notabas? (0 es nada; 10, mucha)')}</p>
      <div class="escala">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-r="manana" data-v="${n}" aria-pressed="false" class="num">${n}</button>`).join('')}</div>
      <button type="button" class="boton fantasma" data-r="manana-no">${t('Ahora no')}</button>
    </section>`;
  }

  function apuntarManana(valor) {
    const hist = almacen.leer(clave, []);
    const i = sesionDeAyer(hist);
    if (i < 0) return;
    hist[i].a = valor;
    almacen.guardar(clave, hist);
    subirHistorial(clave);
    const tarjeta = app.querySelector('.manana');
    tarjeta.innerHTML = `<p class="apuntado">${t('Apuntado: {v} de 10 al levantarte.', { v: valor })}${
      pasaDelTope(valor, tope) ? ` ${t('Es más de {tope}: {destino}.', { tope, destino: destinoMarca(quien) })}` : ''
    }</p>`;
    pintarPie(hist);
  }

  // What has been done goes back from a card in the list, once there is something done; the foot keeps «Empezar» alone.
  function pintarPie(hist) {
    const sitio = app.querySelector('.mandar-sitio');
    if (!sitio) return;
    // The last days, each with «Corregir»; and a session done without the app can be noted too.
    const recientes = hist.map((d, k) => ({ d, k })).slice(-7).reverse();
    const fila = ({ d, k }) => `<li><span>${esc(fechaCorta(d.f))}${d.h ? ` · ${esc(d.h)}` : ''}${d.sinApp ? ` · ${t('sin la app')}` : ''}</span>
        <button type="button" class="enlace" data-r="corregir" data-k="${k}">${t('Corregir')}</button></li>`;
    // In a Moodle course it goes to the course by itself: the card says where it is and leads back.
    const salida = volverAlCurso() ? `<a class="boton secundario" href="${esc(volverAlCurso())}">${ICONO.volver}${t('Volver al curso')}</a>` : enAppDeMoodle ? `<p class="moodle-cerrar">${t(TEXTO_CERRAR)}</p>` : '';
    const enviar = enMoodle
      ? `<p class="moodle-estado" aria-live="polite"></p>${salida}`
      : `<p>${t('Mándaselo a {quien}: así ve cómo te va y te ajusta la rutina.', { quien })}</p>
        <div class="dos-botones"><button type="button" class="boton secundario" data-r="mandar" data-canal="wa">${ICONO.whatsapp}WhatsApp</button>
        <button type="button" class="boton secundario" data-r="mandar" data-canal="tg">${ICONO.telegram}Telegram</button></div>`;
    sitio.innerHTML = `<section class="tarjeta mandar-hecho" aria-labelledby="mandar-titulo">
        <h3 id="mandar-titulo">${t('Lo que llevas hecho')}</h3>
        ${hist.length ? `<ul class="dias-hechos">${recientes.map(fila).join('')}</ul>
        ${enviar}` : `<p>${t('Todavía nada.')}</p>${enMoodle ? salida : ''}`}
        <button type="button" class="enlace" data-r="sin-app">${t('Apuntar una vez que la hice sin la app')}</button>
      </section>`;
    if (enMoodle && hist.length) subirHistorial(clave);
  }

  // Who guides the sets: each person chooses (Enrique, 15-11-2026: «que cada usuario elija»).
  function tarjetaVoz() {
    const actual = vozActiva() ? quienHabla() : 'no';
    const boton = (v, rotulo) => `<button type="button" data-r="voz-quien" data-v="${v}" aria-pressed="${actual === v}">${rotulo}</button>`;
    return `<section class="tarjeta voz-elegir" aria-labelledby="voz-titulo">
          <h3 id="voz-titulo">${t('La voz que te guía')}</h3>
          <div class="segmentos" role="group" aria-label="${t('La voz que te guía')}">${boton('mujer', t('Voz de mujer'))}${boton('hombre', t('Voz de hombre'))}${boton('no', t('Sin voz'))}</div>
        </section>`;
  }

  function intro() {
    if (grupo) salirDeGrupo();
    const hist = almacen.leer(clave, []);
    const hoy = diaLocal();
    const vecesHoy = hist.filter((d) => d.f === hoy).length;
    app.innerHTML = `<div class="rutina rutina-intro">
      <header class="saludo">
        <div class="cabecera-yeso cabecera-rutina" aria-hidden="true"></div>
        ${r.de ? `<div class="de">${t('Tu rutina de {de}', { de: esc(r.de) })}</div>` : ''}
        <h1>${r.para ? t('Hola, {nombre}', { nombre: esc(r.para) }) : t('Tu rutina')}</h1>
        ${r.w ? `<p class="semana-rutina">${r.w === 7 ? t('Todos los días') : r.w <= 3 ? tn(r.w, '{n} día a la semana, mejor no seguidos', '{n} días a la semana, mejor no seguidos') : tn(r.w, '{n} día a la semana', '{n} días a la semana')}</p>` : ''}
        ${vistaPrevia() ? `<p class="moodle-aviso">${t(TEXTO_ESTADO['vista-previa'])}</p>` : ''}
        ${r.x > 1 ? `<p class="veces-hoy"><span class="casillas" aria-hidden="true">${Array.from({ length: r.x }, (_, n) => `<i${n < vecesHoy ? ' class="hecha"' : ''}></i>`).join('')}</span>${t('Hoy: {n} de {x} veces', { n: Math.min(vecesHoy, r.x), x: r.x })}</p>` : ''}
      </header>
      <section class="lista">
        ${sesionDeAyer(hist) >= 0 ? preguntaManana() : ''}
        <div class="mandar-sitio"></div>
        ${ejercicios
          .map((e) => {
            const def = EJERCICIOS[e.i];
            const banda = bandaDe(def, e.b);
            // The still of the exercise, of their figure and their side (the left side, in mirror), and in words what to
            // do: how many, at what rhythm with the exercise's own verbs, with what. No curve: that is the professional's.
            const material = [banda ? `<span class="con-banda">${muestraBanda(banda)}${esc(t(banda.nombre))}</span>` : def.material !== 'Sin material' ? esc(t(def.material)) : '', def.unLado && LADOS[e.l] ? esc(t(LADOS[e.l])) : '']
              .filter(Boolean).join(' · ');
            return `<article class="tarjeta tarjeta-ejercicio" data-i="${e.i}" data-t="${e.t.join(',')}">
              <div class="tarjeta-cabeza">
                <span class="tarjeta-poster"><img src="${poster(e.i, r.c, banda?.clave)}" alt="" width="112" height="84" decoding="async"${e.l === 'izq' ? ' class="espejo"' : ''}></span>
                <div>
                  <h3>${esc(t(def.nombre))}</h3>
                  <p class="tarjeta-dosis num">${tn(e.s, '{n} serie', '{n} series')} · ${cuentaUnidad(def, e.r)}</p>
                </div>
              </div>
              <p class="tarjeta-pauta">${esc(textoTempo(e.t))}</p>
              ${material ? `<p class="tarjeta-material">${material}</p>` : ''}
              ${e.n ? `<div class="nota">${esc(t(e.n))}</div>` : ''}
            </article>`;
          })
          .join('')}
        ${tarjetaVoz()}
        ${enMoodle ? '' : `<section class="tarjeta recordatorio" aria-labelledby="recordar-titulo">
          <h3 id="recordar-titulo">${t('Que no se te olvide')}</h3>
          <p>${t('Pon un aviso cada día en el calendario de tu teléfono, con el enlace a esta rutina.')}</p>
          <div class="recordatorio-fila">
            <label class="hora"><span>${t('A las')}</span><input type="time" value="10:00" data-r="hora-recordatorio"></label>
            <button type="button" class="boton secundario" data-r="recordatorio">${t('Añadir al calendario')}</button>
          </div>
          <p class="recordatorio-hecho" aria-live="polite"></p>
        </section>`}
        <p class="sin-conexion" aria-live="polite"></p>
        ${firmaPersona}
      </section>
      <footer class="pie pie-fijo">
        ${ejercicios[0] ? `<span class="pie-poster" aria-hidden="true"><img src="${poster(ejercicios[0].i, r.c, bandaDe(EJERCICIOS[ejercicios[0].i], ejercicios[0].b)?.clave)}" alt="" width="112" height="84" decoding="async"${ejercicios[0].l === 'izq' ? ' class="espejo"' : ''}></span>` : ''}
        <p class="pie-resumen num">${tn(ejercicios.length, '{n} ejercicio', '{n} ejercicios')} · ${minutos(totalSeg)}</p>
        ${(() => {
          const c = enCurso();
          return c
            ? `<button type="button" class="boton" data-r="seguir-donde">${ICONO.play}${t('Seguir donde lo dejaste')}</button>
               <button type="button" class="boton fantasma" data-r="empezar">${t('Empezar desde el principio')}</button>`
            : `<button type="button" class="boton" data-r="empezar">${ICONO.play}${t('Empezar')}</button>`;
        })()}
        <div class="a-grupo">
          <button type="button" class="boton secundario" data-r="grupo">${ICONO.pantalla}${t('Ponerla en pantalla grande')}</button>
          <p>${t('Para seguirla en grupo en una tele, un proyector o una pizarra. Sin preguntas a nadie y sin guardar nada.')}</p>
        </div>
      </footer>
    </div>`;
    pintarPie(hist);
    avisarSinConexion();
    ponerPautas();
  }

  // Each card's rhythm in the exercise's own words, once its sheet arrives (it is small and kept for offline use); until
  // then, and without it, the neutral words.
  async function ponerPautas() {
    try {
      const m = await cargarManifiesto(r.c);
      for (const art of app.querySelectorAll('.tarjeta-ejercicio')) {
        const ruta = m.ejercicios[art.dataset.i]?.ficha;
        if (!ruta) continue;
        const ficha = await fetch((m._base || '') + ruta).then((x) => (x.ok ? x.json() : null)).catch(() => null);
        const pauta = art.querySelector('.tarjeta-pauta');
        if (ficha && pauta) pauta.textContent = pautaTempo(textosDeFicha(ficha), art.dataset.t.split(',').map(Number));
      }
    } catch {
      // Without the manifest the neutral words stay.
    }
  }

  let guardada = null;
  async function avisarSinConexion() {
    guardada ||= guardarParaSinConexion(r.c, ejercicios).catch(() => false);
    if (!(await guardada)) return;
    const p = app.querySelector('.sin-conexion');
    if (p) p.textContent = t('Guardada en este teléfono: puedes hacerla aunque no tengas conexión.');
  }

  // Queue: every exercise, every side, every set.
  const cola = [];
  for (const e of ejercicios) for (const lado of e.l === 'ambos' && EJERCICIOS[e.i].unLado ? ['der', 'izq'] : [e.l === 'izq' ? 'izq' : 'der']) cola.push({ e, lado });
  let sesion = null;
  let bloqueo = null;
  // A group following the routine on a big screen (a TV, a projector, a classroom board): the same player, wide and big,
  // with no one's discomfort or repetitions asked, nothing kept and no summary: the group is not a person.
  let grupo = false;

  // Sound and the screen lock are extras: the set never waits for them. Without a gesture the browser may keep
  // resume() pending forever (seen on a Pixel), and the person would stay on «Empezar». A later touch unlocks the sound.
  // A session halfway is kept as it goes (after each set and each exercise rated): closing the page, the phone locking
  // or a reload in the middle no longer lose it. It is offered again the same day, starting from the exercise it was at.
  const claveCurso = `curso:${clave}`;
  function guardarCurso() {
    if (!sesion || grupo) return;
    const { item, serie, hechas, molestia, extra, inicio } = sesion;
    almacen.guardar(claveCurso, { dia: diaDeSesion(inicio), item, serie, hechas, molestia, extra, inicio: new Date(inicio).toISOString() });
  }
  function enCurso() {
    const c = almacen.leer(claveCurso, null);
    const valido =
      c && c.dia === diaDeSesion(new Date()) && Number.isInteger(c.item) && c.item >= 0 && c.item < cola.length &&
      Number.isInteger(c.serie) && c.serie >= 0 && Array.isArray(c.hechas) && c.hechas.length === cola.length &&
      c.hechas.every((h, i) => Array.isArray(h) && h.length === cola[i].e.s && h.every((v) => Number.isInteger(v) && v >= 0 && v <= 50)) &&
      c.hechas.some((h) => h.some((v) => v > 0));
    return valido ? c : null;
  }

  async function empezar(retomar = false) {
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
    const c = retomar ? enCurso() : null;
    sesion = c
      ? { item: c.item, serie: Math.min(c.serie, cola[c.item].e.s - 1), aValorar: c.serie >= cola[c.item].e.s, hechas: c.hechas, molestia: c.molestia && typeof c.molestia === 'object' ? c.molestia : {}, extra: c.extra && typeof c.extra === 'object' ? c.extra : {}, inicio: new Date(c.inicio), retomada: true }
      : { item: 0, serie: 0, hechas: cola.map((x) => Array(x.e.s).fill(0)), molestia: {}, inicio: new Date() };
    if (!c && !grupo) almacen.guardar(claveCurso, null);
    // «Back» on the phone during the routine asks the same as the ×, instead of leaving the page with the session.
    history.pushState({ jepysoJugador: 1 }, '');
    pintarJugador();
    if (sesion.aValorar) {
      // Left while rating the exercise: back to the rating, with the figure loaded for the screen around it.
      sesion.retomada = false;
      const { e } = actual();
      app.querySelector('.j-nombre').textContent = t(EJERCICIOS[e.i].nombre);
      app.querySelector('.j-sub').textContent = subtitulo(e, sesion.serie + 1);
      await figuraEn(app.querySelector('.escena'), r.c).catch(() => {});
      return valorar();
    }
    await prepararSerie();
  }
  app.oninput = (ev) => {
    if (ev.target.dataset.r !== 'nota-ejercicio' || !sesion) return;
    ((sesion.extra ||= {})[actual().e.i] ||= {}).n = ev.target.value.slice(0, 300);
    guardarCurso();
  };
  const alAtras = () => {
    if (!document.querySelector('.jugador')) return;
    const salir = app.querySelector('[data-r="salir"]');
    if (sesion?.estado !== 'salir') history.pushState({ jepysoJugador: 1 }, '');
    salir?.click();
  };
  window.addEventListener('popstate', alAtras);

  // The browser lets the screen lock go whenever the page is hidden (a look at WhatsApp mid-routine): back on it,
  // with a session going, it is asked for again, so the phone does not lock in the middle of a set.
  const alVolver = async () => {
    if (document.visibilityState !== 'visible' || !sesion || !document.querySelector('.jugador') || !navigator.wakeLock || (bloqueo && !bloqueo.released)) return;
    try {
      bloqueo = await navigator.wakeLock.request('screen');
    } catch {
      bloqueo = null;
    }
  };
  document.addEventListener('visibilitychange', alVolver);

  function pintarJugador() {
    // The hint goes by itself after a few seconds: it was covering the figure when the scene got small.
    setTimeout(() => app.querySelector('.girar-pista')?.style.setProperty('opacity', '0'), 5000);
    const completa = grupo && document.fullscreenEnabled
      ? `<button type="button" class="redondo" data-r="completa" aria-pressed="${!!document.fullscreenElement}" aria-label="${t('Pantalla completa')}">${document.fullscreenElement ? ICONO.salirCompleta : ICONO.completa}</button>`
      : '';
    app.innerHTML = `<div class="jugador${grupo ? ' grupo' : ''}">
      <div class="jugador-arriba">
        <button type="button" class="redondo" data-r="salir" aria-label="${t('Salir')}">${ICONO.cerrar}</button>
        <div class="titulo"><h2 class="j-nombre"></h2><div class="sub j-sub num"></div></div>
        ${hayVoz() ? `<button type="button" class="redondo" data-r="voz" aria-pressed="${vozActiva()}" aria-label="${t('Voz que guía')}">${vozActiva() ? ICONO.voz : ICONO.sinVoz}</button>` : ''}
        ${completa}
      </div>
      <div class="escena">
        <span class="chip lado-etiqueta j-lado oculto"></span>
        <div class="girar-pista">${ICONO.girar} ${t('Arrastra para girar la figura')}</div>
        <button type="button" class="recolocar oculto" data-r="recolocar">${ICONO.girar}${t('Recolocar')}</button>
      </div>
      <div class="mando j-mando"></div>
    </div>`;
  }

  const actual = () => cola[sesion.item];
  // Under the name: the set, and the band to use when the professional said its colour.
  const subtitulo = (e, serie) => {
    const banda = bandaDe(EJERCICIOS[e.i], e.b);
    return `${t('Serie {n} de {total}', { n: serie, total: e.s })}${banda ? ` · ${t(banda.nombre).toLowerCase()}` : ''}`;
  };

  async function prepararSerie() {
    const item = sesion.item;
    app.querySelector('.jugador')?.classList.remove('valorando');
    const { e, lado } = actual();
    const def = EJERCICIOS[e.i];
    const banda = bandaDe(def, e.b);
    app.querySelector('.j-nombre').textContent = t(def.nombre);
    app.querySelector('.j-sub').textContent = subtitulo(e, sesion.serie + 1);
    const etiquetaLado = app.querySelector('.j-lado');
    etiquetaLado.textContent = t(LADOS[lado]);
    etiquetaLado.classList.toggle('oculto', !def.unLado);
    let f;
    try {
      f = await figuraEn(app.querySelector('.escena'), r.c);
      f.oyentes = {};
      // Turned or pinched by a slip, the figure comes back with one tap: «Recolocar» shows over it until then.
      f.on('girado', () => {
        app.querySelector('.girar-pista')?.style.setProperty('opacity', '0');
        app.querySelector('.recolocar')?.classList.remove('oculto');
      });
      app.querySelector('.recolocar')?.classList.add('oculto');
      await f.poner(e.i, { tempo: e.t, lado, banda: banda?.color });
      nombrarFigura(f, e.i, lado);
    } catch {
      // No connection and the figure not kept yet, or a phone without the 3D it needs: say so, with a way on.
      if (sesion.item !== item) return;
      const sin3d = !document.createElement('canvas').getContext('webgl2');
      const porque = sin3d ? t('Este teléfono no puede mover la figura en 3D.') : t('Revisa la conexión y prueba otra vez.');
      app.querySelector('.j-mando').innerHTML = `<div class="centro"><p>${t('No se ha podido cargar la figura.')}</p><p>${porque}</p></div>
        <div class="mando-botones"><button type="button" class="boton fantasma" data-r="como">${t('Cómo se hace')}</button><button type="button" class="boton" data-r="reintentar">${t('Probar otra vez')}</button><span></span></div>`;
      return;
    }
    if (sesion.item !== item) return;
    // A new exercise waits for the person: from the band on the door to the chair takes longer than any countdown.
    // Between sets of the same exercise, and when only the side changes, the rest leads into the countdown.
    const nuevo = sesion.retomada || (sesion.serie === 0 && (item === 0 || cola[item - 1].e !== e));
    sesion.retomada = false;
    if (nuevo) preparacion();
    else cuentaAtras(5);
  }

  // Getting ready for an exercise, with no clock: the figure still in its starting position, how to stand, what is
  // needed (the band in its colour), and one big «Estoy en posición». Only then the countdown.
  function preparacion() {
    sesion.estado = 'prepara';
    const { e } = actual();
    const def = EJERCICIOS[e.i];
    const banda = bandaDe(def, e.b);
    app.querySelector('.j-sub').textContent = t('Ejercicio {n} de {total}', { n: ejercicios.indexOf(e) + 1, total: ejercicios.length });
    const queHace = def.material && def.material !== 'Sin material' ? t(def.material) : '';
    const material = banda
      ? `${muestraBanda(banda)}${esc(t(banda.nombre).toLowerCase())}`
      : queHace ? esc(queHace[0].toLowerCase() + queHace.slice(1)) : '';
    app.querySelector('.j-mando').innerHTML = `<div class="prepara">
        <h3 class="prepara-titulo">${grupo ? t('Posición de partida') : t('Ponte en posición')}</h3>
        <p class="prepara-partida">${esc(t(def.partida))}</p>
        ${material ? `<p class="prepara-material"><span>${grupo ? t('Hace falta') : t('Necesitas')}</span> ${material}</p>` : ''}
      </div>
      <div class="prepara-botones">
        <button type="button" class="boton" data-r="en-posicion">${grupo ? t('Todos en posición') : t('Estoy en posición')}</button>
        <button type="button" class="boton secundario" data-r="como">${t('Cómo se hace')}</button>
      </div>`;
    if (grupo) decir(t(def.nombre));
  }

  function cuentaAtras(n) {
    sesion.estado = 'cuenta';
    const mando = app.querySelector('.j-mando');
    const { e } = actual();
    const pauta = pautaTempo(figura?.textos, e.t);
    mando.innerHTML = `<div class="centro"><p>${t('Prepárate')}</p><h3 class="num cuenta-atras">${n}</h3><p>${esc(pauta)}</p></div>
      <div class="mando-botones"><button type="button" class="boton fantasma" data-r="como">${t('Cómo se hace')}</button><span></span><button type="button" class="boton fantasma" data-r="ya">${t('Empezar ya')}</button></div>`;
    tono(660, 0.08);
    if (n <= 3) decir(numero(n));
    clearTimeout(sesion.temporizador);
    sesion.temporizador = setTimeout(() => (n > 1 ? cuentaAtras(n - 1) : jugarSerie()), 1000);
  }

  function jugarSerie() {
    sesion.estado = 'serie';
    app.querySelector('.jugador')?.classList.remove('en-pausa');
    clearTimeout(sesion.temporizador);
    const { e } = actual();
    const mando = app.querySelector('.j-mando');
    const deTotal = deTotalUnidad(EJERCICIOS[e.i], e.r);
    // The count for a screen reader, said once per repetition: the phases change too often to be read aloud.
    mando.innerHTML = `<p class="sr j-anuncio" aria-live="polite"></p><div class="cuenta">
        <div class="grande num"><span class="j-rep">1</span> <small>${deTotal}</small></div>
        <div class="fase j-fase">${esc(t(figura?.textos?.subir || 'Ida'))}</div>
      </div>
      ${svgTempo(e.t, { punto: true })}
      <div class="mando-botones mando-serie">
        <button type="button" class="boton secundario" data-r="como">${t('Cómo se hace')}</button>
        <button type="button" class="principal" data-r="pausa" aria-pressed="false">${ICONO.pausa}<span>${t('Pausa')}</span></button>
        <button type="button" class="boton secundario" data-r="saltar">${t('Terminar serie')}</button>
      </div>`;
    const svg = mando.querySelector('.tempo');
    const elFase = mando.querySelector('.j-fase');
    const elRep = mando.querySelector('.j-rep');
    const elAnuncio = mando.querySelector('.j-anuncio');
    // The words of each phase, the exercise's own or the neutral ones, in the language in use (on screen and aloud).
    const nombres = Object.fromEntries(Object.entries({ subir: 'Ida', mantener: 'Mantén', bajar: 'Vuelta', reposo: 'Respira', ...figura.textos }).map(([k, v]) => [k, t(v)]));
    // The phrases of an exercise have different lengths: the box takes the height of the longest once, so the sheet
    // (and the figure above it) does not jump from phase to phase.
    const primera = elFase.textContent;
    elFase.style.minHeight = `${Math.max(...Object.values(nombres).map((t) => ((elFase.textContent = `${t} 88`), elFase.offsetHeight)))}px`;
    elFase.textContent = primera;
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
    // The voice: the words of each phase during the first repetition, then only the count (as a coach does).
    let primeraRep = true;
    f.on('cambio', (fase) => {
      if (fase === 'subir') tono(740);
      if (fase === 'mantener') tono(880, 0.18);
      if (fase === 'bajar') tono(520);
      if (primeraRep && fase !== 'reposo') decir(nombres[fase]);
    });
    const masculino = unidad(EJERCICIOS[e.i]).uno !== 'repetición' && unidad(EJERCICIOS[e.i]).uno !== 'vuelta';
    f.on('repeticion', (n) => {
      sesion.hechas[sesion.item][sesion.serie] = n;
      elRep.textContent = Math.min(n + 1, e.r);
      vibrar(25);
      if (n > 0) {
        primeraRep = false;
        decir(numero(n, masculino));
        elAnuncio.textContent = `${n} ${deTotal}`;
      }
    });
    f.on('fin', () => {
      decir(`${numero(e.r, masculino)}. ${t('Hecho')}`);
      sesion.hechas[sesion.item][sesion.serie] = e.r;
      tono(660, 0.12);
      setTimeout(() => tono(990, 0.25), 130);
      vibrar([40, 60, 40]);
      siguiente();
    });
    f.empezar({ modo: 'serie', reps: e.r, porPasos: porPasos(EJERCICIOS[e.i]), porMinutos: porMinutos(EJERCICIOS[e.i]) });
  }

  // Each step is kept as soon as it is known where the session goes next (guardarCurso): the set that follows, the
  // other side, or the rating (serie past the last one).
  function siguiente() {
    const { e } = actual();
    if (sesion.serie + 1 < e.s) {
      sesion.serie++;
      guardarCurso();
      descanso(r.d);
      return;
    }
    // Last set of this side: if the same exercise continues on the other side, go on; otherwise rate it.
    const sigue = cola[sesion.item + 1];
    if (sigue && sigue.e === e) {
      sesion.item++;
      sesion.serie = 0;
      guardarCurso();
      descanso(r.d, true);
      return;
    }
    if (grupo) {
      if (sesion.item + 1 >= cola.length) return finDeGrupo();
      sesion.item++;
      sesion.serie = 0;
      return prepararSerie();
    }
    sesion.serie = e.s;
    guardarCurso();
    sesion.serie = e.s - 1;
    valorar();
  }

  // A group: in, wide and with full screen where the screen allows it; out, as the person's routine left it.
  function empezarGrupo() {
    grupo = true;
    modoVoz({ grupo: true });
    if (document.fullscreenEnabled && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    return empezar(false);
  }
  function salirDeGrupo() {
    grupo = false;
    modoVoz({ grupo: false });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  // The end, for everyone: how long it took, again or out. Nothing is kept.
  function finDeGrupo() {
    sesion.estado = 'fin';
    clearInterval(sesion.reloj);
    figura?.parar();
    try {
      bloqueo?.release();
    } catch {
      // Already released.
    }
    const duro = minutos((new Date() - sesion.inicio) / 1000);
    app.querySelector('.j-nombre').textContent = r.de ? t('Rutina de {de}', { de: r.de }) : t('La rutina');
    app.querySelector('.j-sub').textContent = tn(ejercicios.length, '{n} ejercicio', '{n} ejercicios');
    app.querySelector('.j-mando').innerHTML = `<div class="grupo-fin">
        <h3>${t('Rutina terminada')}</h3>
        <p class="num">${t('{tiempo} de trabajo.', { tiempo: mayuscula(duro) })}</p>
      </div>
      <div class="prepara-botones">
        <button type="button" class="boton" data-r="grupo-otra">${ICONO.play}${t('Otra vez')}</button>
        <button type="button" class="boton secundario" data-r="dejar">${t('Salir')}</button>
      </div>`;
    tono(660, 0.12);
    setTimeout(() => tono(990, 0.25), 130);
    decir(t('Rutina terminada. Buen trabajo.'));
  }
  // Whoever drives it from the computer may have a presenter's remote: → or «Av Pág» goes on (in position, the rest or
  // the countdown cut short), the space pauses or resumes the set.
  const alTeclado = (ev) => {
    if (!grupo || !document.querySelector('.jugador.grupo') || ev.target.closest?.('input, textarea, dialog')) return;
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown') {
      const seguir = app.querySelector('[data-r="en-posicion"], [data-r="ya"]');
      if (seguir) {
        ev.preventDefault();
        seguir.click();
      }
    } else if (ev.key === ' ' && !ev.target.closest?.('button')) {
      const pausa = app.querySelector('[data-r="pausa"]');
      if (pausa) {
        ev.preventDefault();
        pausa.click();
      }
    }
  };
  document.addEventListener('keydown', alTeclado);
  // Out of full screen with the browser's own Esc: the button says so.
  const alCambiarCompleta = () => {
    const b = app.querySelector('[data-r="completa"]');
    if (!b) return;
    b.setAttribute('aria-pressed', String(!!document.fullscreenElement));
    b.innerHTML = document.fullscreenElement ? ICONO.salirCompleta : ICONO.completa;
  };
  document.addEventListener('fullscreenchange', alCambiarCompleta);

  function descanso(segundos, cambiaLado = false) {
    decir(cambiaLado ? t('Descansa. Ahora, el otro lado') : t('Descansa'));
    sesion.estado = 'descanso';
    const mando = app.querySelector('.j-mando');
    const { e, lado } = actual();
    const total = segundos;
    let quedan = segundos;
    const radio = 56;
    const largo = 2 * Math.PI * radio;
    mando.innerHTML = `<div class="centro"><h3>${t('Descansa')}</h3><p>${cambiaLado ? t('Ahora, {lado}', { lado: t(LADOS[lado]).toLowerCase() }) : t('Siguiente: serie {n} de {total}', { n: sesion.serie + 1, total: e.s })}</p></div>
      <svg class="anillo" viewBox="0 0 132 132"><circle class="fondo-anillo" cx="66" cy="66" r="${radio}"/><circle class="avance" cx="66" cy="66" r="${radio}" stroke-dasharray="${largo}" stroke-dashoffset="0" transform="rotate(-90 66 66)"/><text x="66" y="66" class="num">${quedan}</text></svg>
      <div class="mando-botones"><button type="button" class="boton fantasma" data-r="mas">+15 s</button><span></span><button type="button" class="boton fantasma" data-r="ya">${t('Seguir ya')}</button></div>`;
    if (cambiaLado) {
      app.querySelector('.j-sub').textContent = subtitulo(e, 1);
      app.querySelector('.j-lado').textContent = t(LADOS[lado]);
      figura.lado(lado);
    } else {
      app.querySelector('.j-sub').textContent = subtitulo(e, sesion.serie + 1);
    }
    figura.parar();
    const anillo = mando.querySelector('.avance');
    const texto = mando.querySelector('text');
    // The seconds added with «+15 s» are this rest's own: sesion.extra holds what the person adds about each exercise.
    let anadidos = 0;
    clearInterval(sesion.reloj);
    sesion.reloj = setInterval(() => {
      quedan--;
      texto.textContent = Math.max(0, quedan);
      anillo.setAttribute('stroke-dashoffset', String(largo * (1 - Math.max(0, quedan) / (total + anadidos))));
      if (quedan <= 3 && quedan > 0) tono(600, 0.06);
      if (quedan <= 0) {
        clearInterval(sesion.reloj);
        cuentaAtras(5);
      }
    }, 1000);
    sesion.sumar = () => {
      quedan += 15;
      anadidos += 15;
      texto.textContent = quedan;
    };
  }

  // Rating an exercise, one question at a time and without the 3D (its still beside the word «Hecho»): first «¿Hiciste
  // todas las repeticiones?», where «Hice menos» alone opens the − and + of each set; then the discomfort, in two rows
  // of big buttons. The button to go on is always in sight, and says what is missing until the discomfort is marked.
  // What the person may add about an exercise, for the professional: it cost them, or they could not do it, and a short
  // note in their own words («me molestó la rodilla al bajar»). Optional; it travels in the summary.
  function extraValorar(e) {
    const x = (sesion.extra ||= {})[e.i] || {};
    const boton = (v, texto) => `<button type="button" class="chip-elegir" data-r="dificultad" data-v="${v}" aria-pressed="${x.c === v}">${texto}</button>`;
    return `<section class="valorar-extra" aria-labelledby="v-extra">
        <h4 class="pregunta-suave" id="v-extra">${t('¿Algo más para {quien}? <span>Si quieres</span>', { quien })}</h4>
        <div class="chips-elegir" role="group" aria-labelledby="v-extra">${boton('cuesta', t('Me ha costado'))}${boton('no', t('No he podido hacerlo'))}</div>
        <label class="nota-persona"><span>${t('Una nota')}</span><textarea data-r="nota-ejercicio" rows="2" maxlength="300" placeholder="${t('Por ejemplo: me molestó la rodilla al bajar')}">${esc(x.n || '')}</textarea></label>
      </section>`;
  }

  function valorar() {
    sesion.estado = 'valorar';
    sesion.paso ||= 'reps';
    clearInterval(sesion.reloj);
    figura?.parar();
    app.querySelector('.jugador')?.classList.add('valorando');
    const { e } = actual();
    app.querySelector('.j-sub').textContent = t('Ejercicio {n} de {total}', { n: ejercicios.indexOf(e) + 1, total: ejercicios.length });
    const def = EJERCICIOS[e.i];
    const banda = bandaDe(def, e.b);
    const items = cola.map((c, i) => ({ c, i })).filter(({ c }) => c.e === e);
    const dosLados = items.length > 1;
    const ultimo = sesion.item + 1 >= cola.length;
    const seguir = ultimo ? t('Terminar') : t('Siguiente ejercicio');
    const lado = (c) => `<img src="${poster(e.i, r.c, banda?.clave)}" alt="" width="112" height="84" decoding="async"${c.lado === 'izq' ? ' class="espejo"' : ''}>`;
    const cabeza = `<div class="valorar-cabeza"><span class="tarjeta-poster">${lado(items[0].c)}</span>
      <div><h3>${t('Hecho')}</h3><p class="num">${dosLados ? tn(e.s, '{n} serie de cada lado', '{n} series de cada lado') : tn(e.s, '{n} serie', '{n} series')} · ${cuentaUnidad(def, e.r)}</p></div></div>`;
    let cuerpo = '';
    let pie = '';
    if (sesion.paso === 'reps') {
      cuerpo = `<section class="valorar-paso" aria-labelledby="v-reps"><h4 class="pregunta" id="v-reps" tabindex="-1">${fraseUnidad(def, 'pregunta')}</h4>
        <div class="dos-botones"><button type="button" class="boton" data-r="todas">${fraseUnidad(def, 'si')}</button><button type="button" class="boton secundario" data-r="menos">${t('Hice menos')}</button></div></section>`;
    } else if (sesion.paso === 'menos') {
      cuerpo = `<section class="valorar-paso" aria-labelledby="v-menos"><h4 class="pregunta" id="v-menos" tabindex="-1">${fraseUnidad(def, 'cuantas')}</h4>
        ${items.map(({ c, i }) => `<div class="series-lado">${dosLados ? `<h5>${t(LADOS[c.lado])}</h5>` : ''}${sesion.hechas[i]
          .map((v, n) => `<div class="serie-fila"><span>${t('Serie {n}', { n: n + 1 })}</span>${paso(`h-${i}-${n}`, v, dosLados ? t('{lado}, serie {n}', { lado: t(LADOS[c.lado]), n: n + 1 }) : t('Serie {n}', { n: n + 1 }), 0, 50)}</div>`)
          .join('')}</div>`).join('')}</section>`;
      pie = `<button type="button" class="boton" data-r="reps-listo">${t('Listo')}</button>`;
    } else {
      const todas = items.every(({ i }) => sesion.hechas[i].every((v) => v >= e.r));
      const marcada = Number.isInteger(sesion.molestia[e.i]);
      cuerpo = `<p class="valorar-hecho">${todas ? fraseUnidad(def, 'todas') : fraseUnidad(def, 'menos')} <button type="button" class="enlace" data-r="menos">${t('Cambiar')}</button></p>
        <section class="valorar-paso" aria-labelledby="v-molestia"><h4 class="pregunta" id="v-molestia" tabindex="-1">${t('¿Cuánta molestia notaste?')}</h4>
        <div class="escala" role="group" aria-labelledby="v-molestia">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-r="molestia" data-v="${n}" aria-pressed="${sesion.molestia[e.i] === n}" class="num">${n}</button>`).join('')}</div>
        <div class="escala-pie"><span>${t('0 · nada')}</span><span>${t('10 · mucha')}</span></div>
        <p class="aviso-molestia" aria-live="polite"></p></section>
        ${extraValorar(e)}`;
      pie = `<button type="button" class="boton" data-r="continuar"${marcada ? '' : ' aria-disabled="true"'} data-seguir="${seguir}">${marcada ? seguir : t('Marca tu molestia para seguir')}</button>
        <button type="button" class="boton fantasma" data-r="sin-molestia">${t('Prefiero no decirlo')}</button>`;
    }
    app.querySelector('.j-mando').innerHTML = `<div class="valorar">${cabeza}${cuerpo}${pie ? `<div class="valorar-pie">${pie}</div>` : ''}</div>`;
  }

  // parcial: the person left in the middle; what was done is kept and can be sent like any other day.
  function terminar(parcial = false) {
    callar();
    almacen.guardar(claveCurso, null);
    try {
      bloqueo?.release();
    } catch {
      // Already released.
    }
    figura?.parar();
    const ahora = new Date();
    const dia = {
      f: diaDeSesion(sesion.inicio),
      h: ahora.toTimeString().slice(0, 5),
      e: cola
        .map((c, i) => {
          const ultimoLado = cola[i + 1]?.e !== c.e;
          const x = ultimoLado ? sesion.extra?.[c.e.i] || {} : {};
          return { i: c.e.i, l: c.lado, s: c.e.s, r: c.e.r, p: sesion.hechas[i], m: sesion.molestia[c.e.i], c: x.c, n: x.n?.trim() || undefined };
        })
        .filter((x) => !parcial || x.p.some((v) => v > 0)),
    };
    if (parcial && !dia.e.length) return intro();
    const hist = almacen.leer(clave, []);
    hist.push(dia);
    almacen.guardar(clave, hist.slice(-200));
    const trabajo = t('{tiempo} de trabajo.', { tiempo: mayuscula(minutos((ahora - sesion.inicio) / 1000)) });
    // In a Moodle course the session goes to the course by itself; the way out leads back to it.
    const pie = enMoodle
      ? `<p class="moodle-estado" aria-live="polite"></p>
        ${volverAlCurso() ? `<a class="boton" href="${esc(volverAlCurso())}">${ICONO.volver}${t('Volver al curso')}</a>` : enAppDeMoodle ? `<p class="moodle-cerrar">${t(TEXTO_CERRAR)}</p>` : ''}
        <button type="button" class="boton fantasma" data-r="volver">${t('Volver a la rutina')}</button>`
      : `<button type="button" class="boton" data-r="mandar" data-canal="wa">${ICONO.whatsapp}${t('Mandar por WhatsApp')}</button>
        <button type="button" class="boton" data-r="mandar" data-canal="tg">${ICONO.telegram}${t('Mandar por Telegram')}</button>
        <button type="button" class="boton fantasma" data-r="volver">${t('Volver a la rutina')}</button>
        ${tarjetaAMano()}`;
    const faltan = [...new Set(cola.filter((c) => !dia.e.some((x) => x.i === c.e.i)).map((c) => EJERCICIOS[c.e.i].nombre))].map((n) => esc(t(n)));
    app.innerHTML = `<div class="rutina">
      <header class="saludo"><div class="de">${t('Hecho')}</div><h1>${parcial ? t('Lo de hoy, guardado') : t('Rutina de hoy, completa')}</h1>${
        parcial ? `<p>${t('Te faltó: {ejercicios}.', { ejercicios: faltan.join(', ') })}</p>` : ''
      }<p>${trabajo} ${r.de && !enMoodle ? t('Mándale a {de} cómo te ha ido.', { de: esc(r.de) }) : ''}</p></header>
      <section class="lista">${resumenDia(dia, tope)}</section>
      <footer class="pie">
        ${pie}
      </footer>
    </div>`;
    subirHistorial(clave);
  }

  // «Tenla a mano» (Fable B6): the routine lives in a message that tomorrow will be buried. On a phone, and until the
  // person says «Ya la tengo», the two steps to put it on the home screen, drawn as their browser shows them.
  function tarjetaAMano() {
    const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (instalada || !window.matchMedia('(pointer: coarse)').matches || almacen.leer('a-mano', false)) return '';
    const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const pasos = iphone
      ? [[ICONO.compartirIos, t('Toca <b>Compartir</b>, abajo, en la barra del navegador.')], [ICONO.mas, t('Toca <b>Añadir a pantalla de inicio</b>.')]]
      : [[ICONO.puntos, t('Toca los <b>tres puntos</b>, arriba a la derecha.')], [ICONO.mas, t('Toca <b>Añadir a pantalla de inicio</b>.')]];
    return `<section class="tarjeta a-mano" aria-labelledby="a-mano-titulo">
      <h3 id="a-mano-titulo">${t('Tenla a mano')}</h3>
      <p>${t('Así mañana no tendrás que buscar el mensaje: ponla en la pantalla de inicio del teléfono, como una app.')}</p>
      <ol class="a-mano-pasos">${pasos.map(([icono, texto]) => `<li><span class="a-mano-icono" aria-hidden="true">${icono}</span><span>${texto}</span></li>`).join('')}</ol>
      <button type="button" class="boton secundario" data-r="ya-la-tengo">${t('Ya la tengo')}</button>
    </section>`;
  }

  // The summary goes back by WhatsApp or Telegram, as the person prefers. It carries the id of their file on the
  // professional's side (p), so it lands on the right person even when two share a name.
  // Correcting a day after the fact, or noting one done without the app: the repetitions of each set, the discomfort,
  // «me ha costado» or «no he podido» and the note, in a sheet. The corrected day carries the moment (ed), so the
  // professional's copy takes it in place of the old one, and the next summary brings it.
  function editarDia(k) {
    const hist = almacen.leer(clave, []);
    const nuevo = k < 0 || !hist[k];
    const ahora = new Date();
    const dia = nuevo
      ? { f: diaDeSesion(ahora), h: ahora.toTimeString().slice(0, 5), sinApp: true, e: cola.map((c, i) => ({ i: c.e.i, l: c.lado, s: c.e.s, r: c.e.r, p: Array(c.e.s).fill(c.e.r), m: undefined })) }
      : JSON.parse(JSON.stringify(hist[k]));
    const ayer = diaAnterior();
    const volverA = document.activeElement;
    const dialogo = document.createElement('dialog');
    dialogo.className = 'hoja hoja-corregir';
    dialogo.setAttribute('aria-labelledby', 'corregir-titulo');
    const pintar = () => {
      const nombre = (x) => `${esc(EJERCICIOS[x.i] ? t(EJERCICIOS[x.i].nombre) : x.i)}${EJERCICIOS[x.i]?.unLado && x.l ? ` · ${t(LADOS[x.l]).toLowerCase()}` : ''}`;
      const serie = (n) => t('Serie {n}', { n });
      dialogo.innerHTML = `<h2 id="corregir-titulo" tabindex="-1">${nuevo ? t('Apuntar una vez sin la app') : t('Corregir el {fecha}', { fecha: esc(fechaCorta(dia.f)) })}</h2>
        ${nuevo ? `<div class="segmentos" role="group" aria-label="${t('Qué día')}"><button type="button" data-c="dia" data-v="${diaDeSesion(ahora)}" aria-pressed="${dia.f === diaDeSesion(ahora)}">${t('Hoy')}</button><button type="button" data-c="dia" data-v="${ayer}" aria-pressed="${dia.f === ayer}">${t('Ayer')}</button></div>` : ''}
        ${dia.e.map((x, j) => `<section class="corregir-ejercicio"><h3>${nombre(x)}</h3>
          <div class="series-lado">${x.p.map((v, n) => `<div class="serie-fila"><span>${serie(n + 1)}</span>${paso(`c-${j}-${n}`, v, serie(n + 1), 0, 50)}</div>`).join('')}</div>
          <p class="pregunta-suave">${t('Molestia')}</p>
          <div class="escala" role="group" aria-label="${t('Molestia en {ejercicio}', { ejercicio: nombre(x) })}">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-c="m" data-j="${j}" data-v="${n}" aria-pressed="${x.m === n}" class="num">${n}</button>`).join('')}</div>
          <div class="chips-elegir">${[['cuesta', t('Me ha costado')], ['no', t('No he podido hacerlo')]].map(([v, rotulo]) => `<button type="button" class="chip-elegir" data-c="dificultad" data-j="${j}" data-v="${v}" aria-pressed="${x.c === v}">${rotulo}</button>`).join('')}</div>
          <label class="nota-persona"><span>${t('Una nota')}</span><textarea data-c="nota" data-j="${j}" rows="2" maxlength="300">${esc(x.n || '')}</textarea></label>
        </section>`).join('')}
        <div class="hoja-como-pie dos-botones"><button type="button" class="boton" data-c="guardar">${t('Guardar')}</button><button type="button" class="boton secundario" data-c="cancelar">${t('Cancelar')}</button></div>`;
    };
    pintar();
    dialogo.addEventListener('input', (ev) => {
      const t = ev.target;
      if (t.dataset.c === 'nota') dia.e[Number(t.dataset.j)].n = t.value.slice(0, 300).trim() || undefined;
    });
    dialogo.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      const c = b.dataset.c;
      const paso = /^c-(\d+)-(\d+)$/.exec(b.dataset.accion || '');
      if (paso) {
        const [, j, n] = paso.map(Number);
        dia.e[j].p[n] = Math.max(0, Math.min(50, dia.e[j].p[n] + Number(b.dataset.delta)));
        b.parentElement.querySelector('output').textContent = dia.e[j].p[n];
        b.parentElement.querySelectorAll('button').forEach((x) => (x.disabled = (x.dataset.delta === '-1' && dia.e[j].p[n] <= 0) || (x.dataset.delta === '1' && dia.e[j].p[n] >= 50)));
        return;
      }
      if (c === 'dia') {
        dia.f = b.dataset.v;
        b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      } else if (c === 'm') {
        const x = dia.e[Number(b.dataset.j)];
        x.m = x.m === Number(b.dataset.v) ? undefined : Number(b.dataset.v);
        b.parentElement.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', String(Number(y.dataset.v) === x.m)));
      } else if (c === 'dificultad') {
        const x = dia.e[Number(b.dataset.j)];
        x.c = x.c === b.dataset.v ? undefined : b.dataset.v;
        b.parentElement.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', String(y.dataset.v === x.c)));
      } else if (c === 'guardar') {
        dia.ed = new Date().toISOString();
        const lista = almacen.leer(clave, []);
        if (nuevo) lista.push(dia);
        else lista[k] = dia;
        lista.sort((x, y) => `${x.f} ${x.h || ''}`.localeCompare(`${y.f} ${y.h || ''}`));
        almacen.guardar(clave, lista.slice(-200));
        dialogo.close();
        intro();
      } else if (c === 'cancelar') dialogo.close();
    });
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      volverA?.focus?.({ preventScroll: true });
    });
    document.body.appendChild(dialogo);
    dialogo.showModal();
    dialogo.querySelector('#corregir-titulo').focus({ preventScroll: true });
  }

  // A daily event in the phone's own calendar, with the link to this routine: an .ics file made here, opened by the
  // phone's calendar; nothing goes through any server, and no app is needed for the reminder.
  function recordatorio() {
    const [hh, mm] = (app.querySelector('[data-r="hora-recordatorio"]')?.value || '10:00').split(':').map(Number);
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;
    const hora = `${String(hh || 0).padStart(2, '0')}${String(mm || 0).padStart(2, '0')}00`;
    const url = `${location.origin}${location.pathname}#r=${codigo}`;
    const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    // The event is the person's, in their language: the link inside it reads the same in any.
    const titulo = r.x > 1 ? t('Tu rutina de ejercicios ({x} veces al día)', { x: r.x }) : t('Tu rutina de ejercicios');
    const aviso = r.de ? t('{titulo}, de {de}', { titulo, de: r.de }) : titulo;
    const ics = archivoCalendario([
      'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//Oksigenia//Jepyso//${idioma().toUpperCase()}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', `UID:${hashCorto(codigo)}-${fecha}@jepyso`, `DTSTAMP:${ahora}`, `DTSTART:${fecha}T${hora}`,
      `DURATION:PT${Math.max(5, Math.round(totalSeg / 60))}M`, 'RRULE:FREQ=DAILY', `SUMMARY:${textoCalendario(aviso)}`,
      `DESCRIPTION:${textoCalendario(t('Ábrela aquí: {url}', { url }))}`, `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${textoCalendario(titulo)}`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = t('rutina.ics');
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    const hecho = app.querySelector('.recordatorio-hecho');
    if (hecho) hecho.textContent = t('Ábrelo y elige «Añadir» en tu calendario: te avisará cada día a las {hora}.', { hora: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` });
  }

  async function mandar(canal = 'wa') {
    const hist = almacen.leer(clave, []);
    // What was not sent yet (however long ago) and the last two weeks, at most the 40 latest: a weekly summary of two
    // routines a day leaves nothing out. Sending marks them, so the next one starts after them.
    const enviado = almacen.leer(`env:${clave}`, '');
    const hace14 = new Date();
    hace14.setDate(hace14.getDate() - 14);
    const desde = diaLocal(hace14);
    const marca = (d) => `${d.f} ${d.h || ''}`;
    const enviadoEn = almacen.leer(`envT:${clave}`, '');
    const dias = hist.filter((d) => d.f >= desde || marca(d) > enviado || (d.ed && d.ed > enviadoEn)).slice(-40);
    const resumen = { v: 1, p: r.p, para: r.para, de: r.de, m: tope, dias };
    if (hist.length) almacen.guardar(`env:${clave}`, marca(hist[hist.length - 1]));
    almacen.guardar(`envT:${clave}`, new Date().toISOString());
    const cod = await codificar(resumen);
    const url = `${location.origin}${location.pathname}#s=${cod}`;
    // The message is the person's, in their language; the summary in the link reads the same in any.
    const texto = r.para
      ? tn(hist.length, '{nombre}: así va mi rutina ({n} vez).', '{nombre}: así va mi rutina ({n} veces).', { nombre: r.para })
      : tn(hist.length, 'así va mi rutina ({n} vez).', 'así va mi rutina ({n} veces).');
    window.open(enlaceMensaje(canal, texto, url), '_blank', 'noopener');
  }

  function como() {
    const { e } = actual();
    const def = EJERCICIOS[e.i];
    const banda = bandaDe(def, e.b);
    const estado = sesion.estado;
    const pausada = estado === 'serie' && figura?.enMarcha;
    if (pausada) figura.pausar();
    if (estado === 'cuenta') clearTimeout(sesion.temporizador);
    // A <dialog>: Escape and a tap outside close it as «Entendido» does, and the focus goes back where it was.
    const volverA = document.activeElement;
    const dialogo = document.createElement('dialog');
    dialogo.className = 'hoja hoja-como';
    dialogo.setAttribute('aria-labelledby', 'como-titulo');
    dialogo.innerHTML = `<h2 id="como-titulo" tabindex="-1">${esc(t(def.nombre))}</h2>
      ${explicacion(def)}
      ${banda ? `<p class="con-banda">${muestraBanda(banda)}<span>${t('Usa la {banda}.', { banda: esc(t(banda.nombre).toLowerCase()) })}</span></p>` : ''}
      ${e.n ? `<p class="nota">${esc(t(e.n))}</p>` : ''}
      <div class="hoja-como-pie"><button type="button" class="boton">${t('Entendido')}</button></div>`;
    document.body.appendChild(dialogo);
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      if (pausada) figura.seguir();
      else if (estado === 'cuenta') cuentaAtras(5);
      volverA?.focus?.({ preventScroll: true });
    });
    dialogo.addEventListener('click', (ev) => {
      const r = dialogo.getBoundingClientRect();
      const fuera = ev.target === dialogo && (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom);
      if (fuera || ev.target.closest('.boton')) dialogo.close();
    });
    dialogo.showModal();
    dialogo.querySelector('#como-titulo').focus({ preventScroll: true });
  }

  app.onclick = async (ev) => {
    const el = ev.target.closest('[data-r], [data-accion]');
    if (!el) return;
    const a = el.dataset.r || el.dataset.accion;
    if (a === 'empezar') return empezar();
    if (a === 'seguir-donde') return empezar(true);
    if (a === 'grupo') return empezarGrupo();
    if (a === 'grupo-otra') {
      sesion = null;
      return empezar(false);
    }
    if (a === 'completa') {
      if (document.fullscreenElement) return document.exitFullscreen().catch(() => {});
      return document.documentElement.requestFullscreen().catch(() => {});
    }
    // The voice that guides: a woman's, a man's or none; what is chosen is said once, to hear it.
    if (a === 'voz-quien') {
      const v = el.dataset.v;
      if (v === 'no') ponerVoz(false);
      else {
        ponerVoz(true);
        ponerQuien(v);
      }
      el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      return vozActiva() && decir(t('Voz encendida'));
    }
    if (a === 'voz') {
      ponerVoz(!vozActiva());
      el.setAttribute('aria-pressed', String(vozActiva()));
      el.innerHTML = vozActiva() ? ICONO.voz : ICONO.sinVoz;
      return vozActiva() && decir(t('Voz encendida'));
    }
    if (a === 'mandar') return mandar(el.dataset.canal);
    if (a === 'recordatorio') return recordatorio();
    if (a === 'corregir') return editarDia(Number(el.dataset.k));
    if (a === 'sin-app') return editarDia(-1);
    if (a === 'volver') return intro();
    if (a === 'salir') {
      callar();
      clearTimeout(sesion?.temporizador);
      clearInterval(sesion?.reloj);
      figura?.parar();
      // Halfway, the × asks first: leaving keeps what was done, so a slip does not throw the session away.
      const hecho = sesion?.hechas.some((h) => h.some((v) => v > 0));
      if (!hecho || sesion.estado === 'salir' || sesion.estado === 'fin') return intro();
      sesion.antes = sesion.estado;
      sesion.estado = 'salir';
      app.querySelector('.j-mando').innerHTML = grupo
        ? `<div class="centro"><p>${t('¿Salir de la rutina?')}</p><p>${t('El grupo va por el ejercicio {n} de {total}.', { n: ejercicios.indexOf(actual().e) + 1, total: ejercicios.length })}</p></div>
        <div class="mando-botones"><button type="button" class="boton fantasma" data-r="seguir-rutina">${t('Seguir')}</button><span></span><button type="button" class="boton fantasma" data-r="dejar">${t('Salir')}</button></div>`
        : `<div class="centro"><p>${t('¿Dejas la rutina aquí?')}</p><p>${enMoodle ? t('Lo que has hecho se guarda en el curso.') : t('Lo que has hecho se guarda y puedes mandarlo.')}</p></div>
        <div class="mando-botones"><button type="button" class="boton fantasma" data-r="seguir-rutina">${t('Seguir')}</button><span></span><button type="button" class="boton fantasma" data-r="dejar">${t('Dejarla')}</button></div>`;
      return;
    }
    if (a === 'seguir-rutina') return sesion.antes === 'valorar' ? valorar() : prepararSerie();
    if (a === 'dejar') return grupo ? intro() : terminar(true);
    if (a === 'como') return como();
    if (a === 'en-posicion') {
      app.querySelector('.j-sub').textContent = subtitulo(actual().e, sesion.serie + 1);
      return cuentaAtras(5);
    }
    if (a === 'ya') {
      clearInterval(sesion.reloj);
      return jugarSerie();
    }
    if (a === 'mas') return sesion.sumar?.();
    if (a === 'pausa') {
      // Paused, it shows: the word of the phase says «En pausa», the figure dims and the button says «Seguir».
      const pausar = figura.enMarcha;
      if (pausar) {
        figura.pausar();
        callar();
      }
      else figura.seguir();
      el.innerHTML = `${pausar ? ICONO.play : ICONO.pausa}<span>${pausar ? t('Seguir') : t('Pausa')}</span>`;
      el.setAttribute('aria-pressed', String(pausar));
      app.querySelector('.jugador')?.classList.toggle('en-pausa', pausar);
      const fase = app.querySelector('.j-fase');
      if (fase && pausar) {
        fase.dataset.antes = fase.textContent;
        fase.textContent = t('En pausa');
      } else if (fase?.dataset.antes) fase.textContent = fase.dataset.antes;
      return;
    }
    if (a === 'ya-la-tengo') {
      almacen.guardar('a-mano', true);
      return app.querySelector('.a-mano')?.remove();
    }
    if (a === 'recolocar') {
      figura.girado = false;
      figura.encuadrar(figura.camaraFicha);
      return el.classList.add('oculto');
    }
    if (a === 'saltar') {
      sesion.hechas[sesion.item][sesion.serie] = figura.repActual;
      figura.pausar();
      return siguiente();
    }
    if (a === 'todas' || a === 'menos' || a === 'reps-listo') {
      if (a === 'todas') for (const i of cola.keys()) if (cola[i].e === actual().e) sesion.hechas[i].fill(actual().e.r);
      sesion.paso = a === 'menos' ? 'menos' : 'molestia';
      valorar();
      // The new question takes the focus, so a screen reader reads it and the keyboard goes on from there.
      return app.querySelector('.valorar .pregunta')?.focus({ preventScroll: true });
    }
    if (a === 'dificultad') {
      const x = ((sesion.extra ||= {})[actual().e.i] ||= {});
      x.c = x.c === el.dataset.v ? undefined : el.dataset.v;
      el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === x.c)));
      return guardarCurso();
    }
    if (a === 'molestia') {
      el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
      const v = Number(el.dataset.v);
      sesion.molestia[actual().e.i] = v;
      const seguir = app.querySelector('[data-r="continuar"]');
      if (seguir) {
        seguir.removeAttribute('aria-disabled');
        seguir.textContent = seguir.dataset.seguir;
      }
      const aviso = app.querySelector('.aviso-molestia');
      if (aviso) {
        aviso.textContent = pasaDelTope(v, tope)
          ? `${t('Es más de {tope}: {destino}.', { tope, destino: destinoMarca(r.de || t('quien te dio la rutina')) })} ${t('La próxima vez, hazlo más suave o con menos repeticiones. Si es un dolor fuerte, para este ejercicio.')}`
          : '';
      }
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
    if (a === 'reintentar') return prepararSerie();
    if (a === 'sin-molestia') {
      delete sesion.molestia[actual().e.i];
      const seguir = app.querySelector('[data-r="continuar"]');
      seguir?.removeAttribute('aria-disabled');
      return seguir?.click();
    }
    if (a === 'continuar') {
      // Not before the discomfort is marked (or «Prefiero no decirlo»): the button says so.
      if (el.getAttribute('aria-disabled') === 'true') return app.querySelector('#v-molestia')?.focus();
      // One tap is one exercise: a second tap while the next figure loads must not skip one.
      if (el.disabled) return;
      el.disabled = true;
      sesion.paso = null;
      if (sesion.item + 1 < cola.length) {
        sesion.item++;
        sesion.serie = 0;
        guardarCurso();
        return prepararSerie();
      }
      return terminar();
    }
    const h = /^h-(\d+)-(\d+)$/.exec(a);
    if (h) {
      const [, i, s] = h.map(Number);
      const v = Math.max(0, Math.min(50, sesion.hechas[i][s] + Number(el.dataset.delta)));
      sesion.hechas[i][s] = v;
      // Drawn again, so that «−» comes back to life after rising from 0.
      const grupo = el.closest('.paso');
      const boton = Number(el.dataset.delta) > 0 ? 1 : 0;
      grupo.outerHTML = paso(a, v, grupo.getAttribute('aria-label'), 0, 50);
      app.querySelectorAll(`[data-accion="${a}"]`)[boton]?.focus({ preventScroll: true });
    }
  };

  intro();
  // The figure's code starts coming while the person reads the list: it is ready by «Empezar», and comes from the same
  // version of the app as the page.
  cargarFigura().catch(() => {});
  return () => {
    clearTimeout(sesion?.temporizador);
    clearInterval(sesion?.reloj);
    window.removeEventListener('popstate', alAtras);
    document.removeEventListener('visibilitychange', alVolver);
    document.removeEventListener('keydown', alTeclado);
    document.removeEventListener('fullscreenchange', alCambiarCompleta);
    if (grupo) salirDeGrupo();
    app.onclick = app.oninput = null;
  };
}

// A session is marked when the discomfort went above the professional's level during an exercise or the next morning.
const diaMarcado = (dia, tope) => pasaDelTope(dia.a, tope) || dia.e.some((x) => pasaDelTope(x.m, tope));

// One day that cannot be read must not take the whole file down with it (nor its «Borrar su ficha»).
function resumenDia(dia, tope = TOPE_MOLESTIA) {
  try {
    return pintarDia(dia, tope);
  } catch {
    return `<article class="tarjeta dia"><p>${t('Este día no se puede leer.')}</p></article>`;
  }
}

function pintarDia(dia, tope) {
  const fecha = new Date(dia.f + 'T12:00:00');
  const titulo = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(fecha);
  const marcado = diaMarcado(dia, tope);
  return `<article class="tarjeta dia ${marcado ? 'marcado' : ''}"><h3>${titulo.charAt(0).toUpperCase() + titulo.slice(1)}${dia.h ? ` · ${esc(dia.h)}` : ''}${
    marcado ? ` <span class="marca-dia">${t('Pasa de {tope}', { tope })}</span>` : ''
  }</h3>
    ${dia.e
      .map((x) => {
        const def = Object.hasOwn(EJERCICIOS, x.i) ? EJERCICIOS[x.i] : null;
        if (!def) return '';
        const bien = x.p.every((v) => v >= x.r);
        return `<div class="hecho">
          <span class="nombre">${esc(t(def.nombre))}${def.unLado ? ` · ${t(LADOS[x.l]).toLowerCase()}` : ''}</span>
          ${typeof x.m === 'number' ? `<span class="chip ${pasaDelTope(x.m, tope) ? 'alta' : ''}">${t('Molestia {v}/10', { v: x.m })}</span>` : '<span></span>'}
          <div class="barra-series">${x.p.map((v) => `<span class="${v < x.r ? 'corta' : ''}" title="${t('{n} de {total}', { n: esc(v), total: esc(x.r) })}"></span>`).join('')}</div>
          ${x.c === 'cuesta' ? `<span class="chip">${t('Costó')}</span>` : x.c === 'no' ? `<span class="chip alta">${t('No se pudo hacer')}</span>` : ''}
          ${x.n ? `<p class="nota-dia">${t('«{nota}»', { nota: esc(x.n) })}</p>` : ''}
          <span class="detalle num">${
            bien
              ? tn(x.p.length, '{n} serie de {r}, completa', '{n} series de {r}, completas', { r: x.r })
              : fraseUnidad(def, 'porSerie', { lista: enLista(x.p.map(String)), r: x.r })
          }</span>
        </div>`;
      })
      .join('')}
    ${
      typeof dia.a === 'number'
        ? `<div class="manana-linea"><span>${t('A la mañana siguiente')}</span><span class="chip ${pasaDelTope(dia.a, tope) ? 'alta' : ''}">${t('Molestia {v}/10', { v: dia.a })}</span></div>`
        : ''
    }
  </article>`;
}

// "el lunes 9, el martes 10 y el jueves 12": the marked days named one by one, never a bare count.
function listaDias(fechas) {
  const nombres = fechas.map((f) => {
    const d = new Date(f + 'T12:00:00');
    return t('el {dia} {n}', { dia: new Intl.DateTimeFormat(locale(), { weekday: 'long' }).format(d), n: d.getDate() });
  });
  return enLista(nombres);
}

// Text in a calendar file: backslash, semicolon, comma and line breaks escaped.
const textoCalendario = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Lines of at most 75 bytes, the rest on the next one after a space, joined with CRLF.
function archivoCalendario(lineas) {
  const cod = new TextEncoder();
  const plegar = (linea) => {
    const trozos = [];
    let actual = '';
    for (const c of linea) {
      if (cod.encode(actual + c).length > (trozos.length ? 74 : 75)) {
        trozos.push(actual);
        actual = '';
      }
      actual += c;
    }
    trozos.push(actual);
    return trozos.join('\r\n ');
  };
  return lineas.map(plegar).join('\r\n') + '\r\n';
}

// A session belongs to the day it started, and one started before five in the morning to the night before: a routine
// done from 23:50 to 00:10, or at half past midnight, is that evening's, and the next morning's question finds it.
function diaDeSesion(inicio) {
  const d = new Date(inicio);
  if (d.getHours() < 5) d.setDate(d.getDate() - 1);
  return diaLocal(d);
}

// ---------- Summary (the professional) ----------
async function vistaResumen(codigo) {
  let s = null;
  try {
    s = limpiarResumen(await decodificar(codigo));
  } catch {
    // Read below as a summary that cannot be opened.
  }
  if (!s) {
    app.innerHTML = avisoRoto(t('Este resumen no se puede abrir'), t('Suele pasar cuando el enlace se corta al copiarlo y pegarlo. Pídele a la persona que te lo reenvíe, y ábrelo tocándolo en el mensaje, sin copiarlo.'));
    return () => {};
  }
  const dias = [...s.dias].reverse();
  const tope = Number.isInteger(s.m) ? s.m : TOPE_MOLESTIA;
  const marcados = [...new Set(dias.filter((d) => diaMarcado(d, tope)).map((d) => d.f))].reverse();
  const molestia = marcados.length
    ? t('La molestia pasó de {tope} {dias}.', { tope, dias: listaDias(marcados) })
    : t('La molestia no pasó de {tope} ningún día.', { tope });
  app.innerHTML = `<div class="rutina">
    <header class="saludo">
      <div class="de">${s.de ? t('Resumen para {de}', { de: esc(s.de) }) : t('Resumen para ti')}</div>
      <h1>${tn(dias.length, '{nombre} ha hecho su rutina {n} vez', '{nombre} ha hecho su rutina {n} veces', { nombre: esc(s.para || t('La persona')) })}</h1>
      <p class="${marcados.length ? 'molestia-alta' : ''}">${molestia}</p>
      <p class="en-ficha" aria-live="polite">${guardarEnFicha(s)}</p>
      <p>${t('Lo que ha hecho, de lo más reciente a lo más antiguo.')}</p>
    </header>
    <section class="lista">${dias.map((d) => resumenDia(d, tope)).join('')}</section>
  </div>`;
  app.onclick = (ev) => {
    const boton = ev.target.closest('[data-accion="guardar-resumen"]');
    if (!boton) return;
    app.querySelector('.en-ficha').innerHTML = guardarEnFicha(s, boton.dataset.destino);
  };
  return () => {
    app.onclick = null;
  };
}

// The summary joins the person's file on its own only when it brings that file's id (p): the routine was sent from
// this browser to that person. Anything else waits for a tap that says where it goes, the only person with that name or
// a new file, so a link from anyone cannot fill or change a file by itself. A new file never takes an id from the link.
function guardarEnFicha(s, destino = '') {
  const lista = leerPersonas();
  const suya = s.p ? lista.find((x) => x.id === s.p) : null;
  const iguales = s.para ? buscarPorNombre(lista, s.para) : [];
  const porNombre = !suya && iguales.length === 1 ? iguales[0] : null;
  let p = suya || (destino === 'nombre' ? porNombre : null);
  if (!p && destino !== 'nueva') {
    if (porNombre) {
      return `<button type="button" class="boton secundario" data-accion="guardar-resumen" data-destino="nombre">${t('Guardar en la ficha de {nombre}', { nombre: esc(nombreDe(porNombre)) })}</button>`;
    }
    if (!caben(lista)) return t('No se ha guardado en una ficha: ya tienes {n} personas con ficha, el máximo de la versión gratis.', { n: limite() });
    const texto = !lista.length ? t('Guardar en mis personas')
      : s.para ? t('Guardar en una ficha nueva para {nombre}', { nombre: esc(s.para) }) : t('Guardar en una ficha nueva para esta persona');
    return `<button type="button" class="boton secundario" data-accion="guardar-resumen" data-destino="nueva">${texto}</button>`;
  }
  if (!p && !caben(lista)) return t('No se ha guardado en una ficha: ya tienes {n} personas con ficha, el máximo de la versión gratis.', { n: limite() });
  const nueva = !p;
  // «Sin nombre» is data, the same in every language (entrada.js); nombreDe() shows it in the language in use.
  if (!p) p = crearPersona(lista, s.para || 'Sin nombre');
  const n = apuntarResumen(p, s);
  if (!guardarPersonas(lista)) return t(SIN_SITIO);
  const nombre = { nombre: esc(nombreDe(p)) };
  const que = nueva ? t('Ficha nueva para {nombre}', nombre) : n ? t('Guardado en la ficha de {nombre}', nombre) : t('Ya estaba en la ficha de {nombre}', nombre);
  if (!fichaAbierta(p)) {
    if (cuentaDeVales()) pedirVale(p.id);
    else return `${que}. ${t('Para abrirla, entra con tu cuenta de Google en <a href="#personas">Mis personas</a>.')}`;
  }
  return `${que}. <a href="#persona=${esc(p.id)}">${t('Ver su ficha')}</a>`;
}

// ---------- The professional's people ----------
// «jueves, 13 de noviembre», for the person's own days.
const fechaCorta = (f) => {
  const d = new Date(f + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? t('día sin fecha') : new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
};
const fechaLarga = (f) => {
  const d = new Date(f + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? t('sin fecha') : new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long' }).format(d);
};
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
  // A free file without its ticket: its name, and what opens it. Nothing of its content until then.
  if (!fichaAbierta(p)) {
    const sinPlaza = fichaSinPlaza(p.id);
    return `<li><a class="persona-fila cerrada" href="#persona=${esc(p.id)}">
    <span class="nombre">${ICONO.candado}${esc(nombreDe(p))}</span>
    <span class="meta">${sinPlaza ? t('Tu cuenta de Google ya tiene {n} fichas', { n: LIMITE_GRATIS }) : t('Entra con tu cuenta de Google para abrirla')}</span>
  </a></li>`;
  }
  const marcado = ultimoMarcado(p);
  const callado = sinNoticias(p);
  const rutinas = p.rutinas.length ? tn(p.rutinas.length, '{n} rutina', '{n} rutinas') : t('sin rutinas');
  const resumen = p.ultimoResumen ? t('último resumen el {fecha}', { fecha: fechaLarga(p.ultimoResumen) }) : t('sin resúmenes todavía');
  return `<li><a class="persona-fila" href="#persona=${esc(p.id)}">
    <span class="nombre">${esc(nombreDe(p))}</span>
    <span class="meta">${rutinas} · ${resumen}</span>
    ${marcado || callado ? `<span class="marcas">${marcado ? `<span class="chip alta">${t('Pasó de {tope} {dias}', { tope: marcado.tope, dias: listaDias([marcado.f]) })}</span>` : ''}${callado ? `<span class="chip">${tn(callado.dias, '{n} día sin noticias', '{n} días sin noticias')}</span>` : ''}</span>` : ''}
  </a></li>`;
}

// The paid version keeps the files in the professional's own cloud (nube.js): Google Drive, Dropbox or OneDrive, as
// they choose on this device, each with one folder the app only can see. Syncing joins what this device has with what
// that cloud has, and keeps it in both places.
const ultimaSincronia = (id) => {
  const f = ultimaVez(id);
  if (!f) return t('Todavía sin conectar.');
  const d = new Date(f);
  const hora = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  return diaLocal(d) === diaLocal() ? t('Última vez: hoy, a las {hora}.', { hora }) : t('Última vez: el {fecha}, a las {hora}.', { fecha: fechaLarga(diaLocal(d)), hora });
};

// The three services side by side, the chosen one pressed; what it keeps and where; the licence; and one button.
// Moving to a service this device has never synced with says what happens: this device's data joins what is there,
// and the other one keeps what it had. With a cancelled licence there is nothing to choose or sync.
function seccionNube() {
  const id = nubeElegida();
  const nube = NUBES[id];
  const pendiente = licenciaPendiente();
  const antes = nubeAnterior(id);
  return `<section class="general nube">
    <h2>${t('Tu nube')}</h2>
    ${licenciaAnulada() ? '' : `<div class="segmentos" role="group" aria-label="${t('Dónde se guardan tus fichas')}">${Object.entries(NUBES)
    .map(([k, n]) => `<button type="button" data-accion="elegir-nube" data-valor="${k}" aria-pressed="${k === id}">${n.nombre}</button>`)
    .join('')}</div>`}
    <p class="ayuda">${t('Tus fichas y tus plantillas se guardan en una carpeta «Jepyso» de tu {nube}, y así las tienes en todos tus aparatos. Jepyso solo ve esa carpeta.', { nube: nube.corto })}</p>
    ${antes && !licenciaAnulada() ? `<p class="ayuda cambio-nube">${t('Al sincronizar, lo de este aparato se junta con lo que haya en tu {nube}. Lo que tienes en {antes} se queda allí, sin tocar.', { nube: nube.nombre, antes: NUBES[antes].nombre })}</p>` : ''}
    ${pendiente ? `<p class="ayuda">${t('<strong>Para activar tu licencia,</strong> conecta el {nube} con la cuenta {cuenta}.', { nube: nube.corto, cuenta: esc(licencia().cuenta) })}</p>` : ''}
    ${licenciaAnulada()
    ? `<p class="ayuda licencia-anulada">${t('<strong>Esta licencia ya no vale:</strong> Oksigenia la ha pasado a otra cuenta. Tus fichas siguen aquí y se pueden leer, pero no se sincronizan ni se crean nuevas. Pega abajo tu licencia nueva.')}</p>`
    : `${licencia().valida ? `<p class="ayuda plan">${t('Plan {nombre}: hasta {n} personas con ficha, de por vida. Licencia de {cuenta}.', { nombre: esc(nombrePlan(topeLicencia())), n: topeLicencia(), cuenta: esc(licencia().cuenta) })}</p>` : ''}
    <div class="botones"><button type="button" class="boton" data-accion="sincronizar-nube">${t('Sincronizar con {nube}', { nube: nube.nombre })}</button></div>`}
    <p class="aviso-nube" aria-live="polite">${ultimaSincronia(id)}</p>
  </section>`;
}

// The free version's Google account (vales.js): who is in and how many files are left, or Google's own button. Said
// plainly what goes to the server and what does not.
function seccionCuenta() {
  const correo = cuentaDeVales();
  const quedan = fichasQuedan();
  const cerradas = leerPersonas().filter((p) => !fichaAbierta(p)).length;
  const estado = correo
    ? `<p class="cuenta-dentro">${t('Con la cuenta <strong>{correo}</strong>', { correo: esc(correo) })}${Number.isInteger(quedan) ? ` · ${quedan === 0 ? t('no le quedan fichas nuevas') : tn(quedan, 'le queda {n} ficha nueva', 'le quedan {n} fichas nuevas')}` : ''}</p>`
    : '<div class="hueco-google"></div>';
  return `<section class="general cuenta-fichas${cerradas && !correo ? ' pide' : ''}">
    <h2>${t('Tus fichas, con tu cuenta de Google')}</h2>
    ${correo ? '' : `<p class="ayuda">${t('La versión gratis tiene {n} fichas por cuenta de Google. Entra con la tuya para abrirlas y para hacer fichas nuevas. Oksigenia solo guarda una huella de tu cuenta y el código de cada ficha: los nombres, las rutinas y los resúmenes se quedan en este aparato.', { n: LIMITE_GRATIS })}</p>`}
    ${estado}
    <p class="aviso-vales" aria-live="polite">${esc(avisoVales())}</p>
  </section>`;
}

// Where to paste a licence, in Personas, for the free version.
function seccionLicencia() {
  return `<details class="general licencia-pegar">
    <summary>${t('¿Tienes una licencia de Jepyso?')}</summary>
    <p class="ayuda">${t('Pégala aquí, o abre el enlace que te llegó con ella. Se activa al conectar tu nube (Google Drive, OneDrive o Dropbox) con la cuenta de la licencia.')}</p>
    <div class="licencia-fila"><input type="text" data-accion="licencia" autocomplete="off" spellcheck="false" aria-label="${t('Tu licencia')}"><button type="button" class="boton secundario" data-accion="guardar-licencia">${t('Guardar')}</button></div>
    <p class="aviso-licencia" aria-live="polite"></p>
  </details>`;
}

// Shown through t(), as the keys of their translation.
const MOTIVOS_LICENCIA = {
  formato: 'Eso no es una licencia de Jepyso: cópiala entera, sin espacios.',
  firma: 'Esa licencia no es válida: no la ha firmado Oksigenia, o ha cambiado al copiarla.',
  navegador: 'Este navegador no puede comprobar licencias. Actualízalo, o usa Chrome, Edge, Safari o Firefox al día.',
};

// Syncs with the chosen cloud. The licence counts against the connected account's e-mail, whichever the service: one
// licence, one account. While it runs, the service cannot be changed.
async function sincronizarNube(seccion) {
  const aviso = seccion.querySelector('.aviso-nube');
  const id = nubeElegida();
  const nube = NUBES[id];
  const botones = [...seccion.querySelectorAll('button')];
  for (const b of botones) b.disabled = true;
  try {
    aviso.textContent = t('Conectando con {empresa}…', { empresa: nube.empresa });
    await nube.conectar();
    // With a licence: it counts once the cloud is connected with its account; with another account, nothing is synced.
    if (licencia().valida) {
      const cuenta = await nube.cuenta();
      if (!(await cuentaDelDrive(cuenta))) {
        nube.olvidar();
        aviso.textContent = t('Tu licencia es de {licencia}, y has conectado el {nube} de {cuenta}. Conéctalo con la cuenta de la licencia.', { licencia: licencia().cuenta, nube: nube.corto, cuenta: cuenta || t('otra cuenta') });
        return;
      }
      // Still alive? A licence moved to another account syncs no more (the page shows why).
      if (!(await comprobarVigencia())) {
        ir();
        return;
      }
    }
    aviso.textContent = t('Sincronizando…');
    const local = { personas: leerPersonas(), plantillas: leerPlantillas(), borradas: leerBorradas() };
    const r = await sincronizar(id, local, (junto) => {
      const bien = guardarPersonas(junto.personas) && almacen.guardar('plantillas', junto.plantillas) && almacen.guardar('borradas', junto.borradas);
      if (!bien) throw new Error(t(SIN_SITIO));
    });
    apuntarVez(id);
    seccion.querySelector('.cambio-nube')?.remove();
    aviso.textContent = t('Hecho: {personas} y {plantillas} en tu {nube} y en este aparato.', {
      nube: nube.corto,
      personas: tn(r.personas, '{n} persona', '{n} personas'),
      plantillas: tn(r.plantillas, '{n} plantilla', '{n} plantillas'),
    });
  } catch (err) {
    aviso.textContent = err.message;
  } finally {
    for (const b of botones) b.disabled = false;
  }
}

function vistaPersonas() {
  let texto = '';
  let buscando = null;
  const pintarLista = () => {
    const todas = leerPersonas().sort((x, y) => ultimaFecha(y).localeCompare(ultimaFecha(x)));
    const lista = todas.filter((p) => !texto || p.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(texto));
    const cap = app.querySelector('.hueco-capacidad');
    if (cap) cap.innerHTML = todas.length ? capacidad(todas) : '';
    const ul = app.querySelector('.lista-personas');
    ul.innerHTML = todas.length
      ? lista.map(filaPersona).join('') || `<li class="vacio">${t('Nadie con ese nombre.')}</li>`
      : `<li class="vacio">${t('Todavía no hay nadie. Cuando mandes una rutina con el nombre de la persona, aparece aquí con su ficha.')}</li>`;
  };
  app.innerHTML = `<div class="personas">
    ${barraApp(t('Personas'), { accion: botonNueva })}
    <div class="armar-cuerpo">
      <input type="search" class="buscar" data-accion="buscar-persona" autocomplete="off" placeholder="${t('Buscar por nombre')}" aria-label="${t('Buscar personas por nombre')}">
      <div class="hueco-capacidad"></div>
      ${valesEnMarcha() ? seccionCuenta() : ''}
      <ul class="lista-personas"></ul>
      <details class="ayuda-plegada"><summary>${t('Cómo funciona')}</summary><p>${t('Cada rutina que mandas y cada resumen que te devuelven quedan en la ficha de su persona. Se guardan en este aparato; con una copia te las llevas a otro.')}</p></details>
      ${licenciaAnulada() ? `${seccionNube()}${seccionLicencia()}` : esDePago() || licenciaPendiente() ? seccionNube() : seccionLicencia()}
      <section class="general copia">
        <h2>${t('Copia')}</h2>
        <p class="ayuda">${t('Al cargarla se añade lo que falte; no se borra nada.')}</p>
        <div class="botones">
          <button type="button" class="boton secundario" data-accion="exportar">${t('Guardar copia')}</button>
          <label class="boton secundario">${t('Cargar copia')}<input type="file" accept=".json,application/json" data-accion="importar" class="oculto"></label>
        </div>
        <p class="aviso-copia" aria-live="polite"></p>
      </section>
    </div>
  </div>`;
  pintarLista();
  const huecoGoogle = app.querySelector('.hueco-google');
  if (huecoGoogle) botonGoogle(huecoGoogle);
  app.oninput = (ev) => {
    if (ev.target.dataset.accion !== 'buscar-persona') return;
    texto = ev.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    // With hundreds of files, painting on every key made typing lag: the list follows a moment after the last one.
    clearTimeout(buscando);
    buscando = setTimeout(pintarLista, 150);
  };
  app.onclick = async (ev) => {
    if (ev.target.closest('[data-accion="guardar-licencia"]')) {
      const aviso = app.querySelector('.aviso-licencia');
      const l = await guardarLicencia(app.querySelector('[data-accion="licencia"]')?.value);
      if (!l.valida) {
        aviso.textContent = t(MOTIVOS_LICENCIA[l.motivo] || MOTIVOS_LICENCIA.formato);
        return;
      }
      return vistaPersonas();
    }
    // Another service: the section says what it keeps and where; nothing is synced until the button.
    const otra = ev.target.closest('[data-accion="elegir-nube"]');
    if (otra) {
      if (otra.getAttribute('aria-pressed') === 'true') return;
      elegirNube(otra.dataset.valor);
      const seccion = otra.closest('.nube');
      seccion.outerHTML = seccionNube();
      app.querySelector(`.nube [data-valor="${otra.dataset.valor}"]`)?.focus();
      return;
    }
    if (ev.target.closest('[data-accion="sincronizar-nube"]')) {
      await sincronizarNube(ev.target.closest('.nube'));
      return pintarLista();
    }
    if (!ev.target.closest('[data-accion="exportar"]')) return;
    const archivo = new Blob([JSON.stringify(copia(leerPersonas()))], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(archivo);
    a.download = t('jepyso-personas-{fecha}.json', { fecha: diaLocal() });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    app.querySelector('.aviso-copia').textContent = t('Copia guardada en tus descargas.');
  };
  app.onchange = async (ev) => {
    if (ev.target.dataset.accion !== 'importar' || !ev.target.files[0]) return;
    const aviso = app.querySelector('.aviso-copia');
    try {
      const lista = leerPersonas();
      const r = cargarCopia(lista, JSON.parse(await ev.target.files[0].text()));
      if (!guardarPersonas(lista)) {
        aviso.textContent = t(SIN_SITIO);
        return;
      }
      const cargadas = t('Copia cargada: {personas}, {nuevas}.', {
        personas: tn(r.total, '{n} persona', '{n} personas'),
        nuevas: r.nuevas ? tn(r.nuevas, '{n} nueva', '{n} nuevas') : t('ninguna nueva'),
      });
      aviso.textContent = `${cargadas}${r.fuera ? ` ${tn(r.fuera, '{n} no cabe: la versión gratis guarda hasta {max}.', '{n} no caben: la versión gratis guarda hasta {max}.', { max: limite() })}` : ''}`;
      await comprobarVales();
      pintarLista();
      if (cuentaDeVales()) pedirVales().then(() => location.hash === '#personas' && pintarLista());
    } catch {
      aviso.textContent = t('Ese archivo no es una copia de Jepyso.');
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
    <h2>${t('Evolución por semanas')}</h2>
    <p class="ayuda">${t('La molestia más alta de cada semana. La raya marca su molestia aceptable, {tope}. Según el modelo de control del dolor, no debería subir de una semana a la siguiente.', { tope })}</p>
    <table class="semanas">
      <thead><tr><th scope="col">${t('Semana del')}</th><th scope="col">${t('Sesiones')}</th><th scope="col">${t('Durante')}</th><th scope="col">${t('Al levantarse')}</th></tr></thead>
      <tbody>${lista
        .map((s) => `<tr class="${s.sube ? 'sube' : ''}">
          <th scope="row">${fechaLarga(s.desde)}${s.sube ? ` <span class="marca-dia">${t('Sube')}</span>` : ''}</th>
          <td class="num" data-etiqueta="${t('Sesiones')}">${s.sesiones}</td>
          <td data-etiqueta="${t('Durante')}">${barraMolestia(s.durante, tope)}</td>
          <td data-etiqueta="${t('Al levantarse')}">${barraMolestia(s.manana, tope)}</td>
        </tr>`)
        .join('')}</tbody>
    </table>
  </section>`;
}

// A free file without its ticket: its name, Google's button and, if it has no room on the account, the way to delete
// it. What is inside stays kept, but out of sight, until it opens.
function vistaFichaCerrada(p) {
  const sinPlaza = fichaSinPlaza(p.id);
  app.innerHTML = `<div class="personas persona ficha-cerrada">
    ${barraApp(esc(nombreDe(p)), { volver: '#personas' })}
    <div class="armar-cuerpo">
      <section class="general cuenta-fichas pide">
        <h2>${ICONO.candado}${sinPlaza ? t('Esta ficha no cabe en tu cuenta') : t('Entra para abrir esta ficha')}</h2>
        <p class="ayuda">${sinPlaza
          ? `${t('Tu cuenta de Google ya tiene sus {n} fichas gratis. Borra una que ya no uses, aquí o en otro aparato.', { n: LIMITE_GRATIS })} ${ampliarPlan()}`
          : t('En la versión gratis, cada ficha va con tu cuenta de Google: {n} por cuenta. Entra con la tuya y la ficha se abre en este aparato, también sin conexión.', { n: LIMITE_GRATIS })}</p>
        ${cuentaDeVales() ? '' : '<div class="hueco-google"></div>'}
        <p class="aviso-vales" aria-live="polite">${esc(avisoVales())}</p>
      </section>
      ${sinPlaza ? `<div class="botones"><button type="button" class="boton fantasma" data-accion="borrar-cerrada">${t('Borrar esta ficha')}</button></div>` : ''}
    </div>
  </div>`;
  const hueco = app.querySelector('.hueco-google');
  if (hueco) botonGoogle(hueco);
  let confirmar = null;
  app.onclick = (ev) => {
    const el = ev.target.closest('[data-accion="borrar-cerrada"]');
    if (!el) return;
    if (!confirmar) {
      el.textContent = t('¿Borrar la ficha de {nombre}? Toca otra vez', { nombre: nombreDe(p) });
      confirmar = setTimeout(() => {
        confirmar = null;
        if (el.isConnected) el.textContent = t('Borrar esta ficha');
      }, 4000);
      return;
    }
    clearTimeout(confirmar);
    apuntarBorrada('personas', p.id);
    guardarPersonas(leerPersonas().filter((x) => x.id !== p.id));
    location.hash = '#personas';
  };
  return () => {
    clearTimeout(confirmar);
    app.onclick = null;
  };
}

function vistaPersona(id) {
  const lista = leerPersonas();
  const p = lista.find((x) => x.id === id);
  if (!p) {
    app.innerHTML = `<div class="personas"><header class="armar-cabecera"><a class="ir-personas" href="#personas">${t('Mis personas')}</a><h1>${t('Esta ficha no está en este navegador')}</h1><p>${t('Si la tienes en otro aparato, trae su copia desde Mis personas.')}</p></header></div>`;
    return () => {};
  }
  if (!fichaAbierta(p)) return vistaFichaCerrada(p);
  const tope = Number.isInteger(p.m) ? p.m : TOPE_MOLESTIA;
  const dias = [...p.dias].reverse();
  const callado = sinNoticias(p);
  const urlCallado = callado ? `${location.origin}${location.pathname}#r=${callado.codigo}` : '';
  // The professional's message, in their language; the routine in the link reads the same in any.
  const textoCallado = t('Hola, {nombre}. ¿Qué tal vas con la rutina? Si algún ejercicio te cuesta o te molesta, dímelo y lo ajustamos. Aquí la tienes otra vez:', { nombre: p.nombre });
  app.innerHTML = `<div class="personas persona">
    ${barraApp(esc(nombreDe(p)), { volver: '#personas' })}
    <div class="ficha-cabeza">
      <p>${t('Ficha desde el {fecha} · molestia aceptable {tope}', { fecha: fechaLarga(p.creada), tope })}</p>
      <div class="botones"><button type="button" class="boton" data-accion="rutina-para">${ICONO.mas}${t('Nueva rutina para {nombre}', { nombre: esc(nombreDe(p)) })}</button></div>
    </div>
    <div class="armar-cuerpo">
      <div class="persona-ficha">
      ${callado ? `<section class="general sin-noticias" aria-labelledby="sin-noticias">
        <h2 id="sin-noticias">${tn(callado.dias, '{n} día sin noticias', '{n} días sin noticias')}</h2>
        <p>${t('Le mandaste la rutina el {fecha} y todavía no te ha llegado nada. Las dos primeras semanas son las que más cuestan: es buen momento para preguntarle qué tal va.', { fecha: fechaLarga(callado.f) })}</p>
        <div class="botones">
          <a class="boton" href="${esc(enlaceMensaje('wa', textoCallado, urlCallado))}" target="_blank" rel="noopener">${ICONO.whatsapp}${t('Escribirle por WhatsApp')}</a>
          <a class="boton secundario" href="${esc(enlaceMensaje('tg', textoCallado, urlCallado))}" target="_blank" rel="noopener">${ICONO.telegram}${t('Por Telegram')}</a>
          ${botonCompartir('accion')}
        </div>
      </section>` : ''}
      <section class="general notas">
        <h2><label for="notas">${t('Notas')}</label></h2>
        <textarea id="notas" data-accion="notas" rows="3" placeholder="${t('Lo que quieras recordar de esta persona')}">${esc(p.notas)}</textarea>
      </section>
      ${tablaSemanas(p)}
      <section class="general mandadas">
        <h2>${t('Rutinas que le has mandado')}</h2>
        ${p.rutinas.length ? '' : `<p class="ayuda">${t('Ninguna desde este navegador. Las que le mandes con su nombre se apuntan aquí.')}</p>`}
        <ul class="rutinas-mandadas">${[...p.rutinas]
          .reverse()
          .map((r) => `<li>
            <span><strong>${fechaLarga(r.f)}</strong> · ${r.e.map((i) => esc(EJERCICIOS[i] ? t(EJERCICIOS[i].nombre) : i)).join(', ')}</span>
            <span class="botones-fila">
              <button type="button" class="boton fantasma" data-accion="abrir-rutina" data-codigo="${esc(r.codigo)}">${t('Abrir en el constructor')}</button>
              <button type="button" class="boton fantasma" data-accion="copiar-rutina" data-codigo="${esc(r.codigo)}">${t('Copiar enlace')}</button>
            </span>
          </li>`)
          .join('')}</ul>
      </section>
      <section class="borrar-ficha">
        <button type="button" class="boton fantasma" data-accion="borrar-persona">${t('Borrar su ficha')}</button>
      </section>
      </div>
      <section class="lo-hecho">
        <h2>${t('Lo que ha hecho')}</h2>
        ${dias.length ? dias.map((d) => resumenDia(d, tope)).join('') : `<p class="vacio">${t('Aún no te ha mandado ningún resumen. Cuando lo abras, se guarda aquí.')}</p>`}
      </section>
    </div>
  </div>`;

  const guardar = () => {
    // Only the notes change here, on the file as it is now: a summary kept from another tab meanwhile (WhatsApp Web
    // opens each link in a new one) must stay.
    const todas = leerPersonas();
    const fresca = todas.find((x) => x.id === id);
    if (!fresca) return;
    fresca.notas = p.notas;
    fresca.cambiada = p.cambiada;
    if (!guardarPersonas(todas)) app.querySelector('.notas h2').insertAdjacentHTML('afterend', `<p class="aviso-nube">${t(SIN_SITIO)}</p>`);
  };
  // Saved a moment after the last key (every save reads and writes all the files), and at once on leaving the file,
  // closing or reloading the page.
  let porGuardar = null;
  const guardarYa = () => {
    if (!porGuardar) return;
    clearTimeout(porGuardar);
    porGuardar = null;
    guardar();
  };
  window.addEventListener('pagehide', guardarYa);
  app.oninput = (ev) => {
    if (ev.target.dataset.accion !== 'notas') return;
    p.notas = ev.target.value;
    p.cambiada = new Date().toISOString();
    clearTimeout(porGuardar);
    porGuardar = setTimeout(() => {
      porGuardar = null;
      guardar();
    }, 400);
  };
  let confirmar = null;
  app.onclick = async (ev) => {
    const el = ev.target.closest('[data-accion]');
    const a = el?.dataset.accion;
    if (a !== 'borrar-persona' && confirmar) {
      clearTimeout(confirmar);
      confirmar = null;
      const b = app.querySelector('[data-accion="borrar-persona"]');
      if (b) b.textContent = t('Borrar su ficha');
    }
    if (a === 'compartir') return compartir(textoCallado, urlCallado);
    if (a === 'rutina-para') {
      const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
      Object.assign(b, { para: p.nombre, persona: p.id, tope });
      almacen.guardar('borrador', b);
      location.hash = '';
    } else if (a === 'abrir-rutina') {
      // The routine as it was sent, back in the builder for this person, to change it and send it again.
      const r = limpiarRutina(await decodificar(el.dataset.codigo));
      if (!r) return;
      rutinaAlBorrador(r, { para: p.nombre, persona: p.id, tope: Number.isInteger(r.m) ? r.m : tope });
      location.hash = '';
    } else if (a === 'copiar-rutina') {
      const url = `${location.origin}${location.pathname}#r=${el.dataset.codigo}`;
      try {
        await navigator.clipboard.writeText(url);
        el.textContent = t('Copiado');
      } catch {
        el.textContent = t('No se pudo copiar');
      }
    } else if (a === 'borrar-persona') {
      // A first touch asks; the second one deletes. Waiting, or touching anything else, leaves it as it was.
      if (!confirmar) {
        el.textContent = t('¿Borrar la ficha de {nombre}? Toca otra vez', { nombre: nombreDe(p) });
        confirmar = setTimeout(() => {
          confirmar = null;
          if (el.isConnected) el.textContent = t('Borrar su ficha');
        }, 4000);
        return;
      }
      clearTimeout(confirmar);
      apuntarBorrada('personas', id);
      guardarPersonas(leerPersonas().filter((x) => x.id !== id));
      soltarVale(p);
      location.hash = '#personas';
    }
  };
  return () => {
    guardarYa();
    window.removeEventListener('pagehide', guardarYa);
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
  // Inside a Moodle course the plugin serves the app: no worker of its own there.
  if (!('serviceWorker' in navigator) || enMoodle || armandoParaMoodle) return null;
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
// The browser's storage is full: said once, on top of whatever screen, with what to do.
window.addEventListener('jepyso-lleno', () => {
  if (document.querySelector('.aviso-almacen')) return;
  const aviso = document.createElement('div');
  aviso.className = 'nueva-version aviso-almacen';
  aviso.setAttribute('role', 'alert');
  aviso.innerHTML = `<p>${t(SIN_SITIO)}</p><button type="button" class="nueva-version-cerrar" aria-label="${t('Cerrar')}">${ICONO.cerrar}</button>`;
  aviso.querySelector('button').addEventListener('click', () => aviso.remove());
  document.body.append(aviso);
});

// A new set may have taken over while this page was still loading, before it listened: it asks once.
navigator.serviceWorker?.controller?.postMessage({ tipo: 'version' });
function mostrarVersionNueva() {
  if (document.querySelector('.nueva-version')) return;
  if (document.querySelector('.jugador')) {
    avisoVersion = setTimeout(mostrarVersionNueva, 5000);
    return;
  }
  const aviso = document.createElement('div');
  aviso.className = 'nueva-version';
  aviso.setAttribute('role', 'status');
  aviso.innerHTML = `<span>${t('Hay una versión nueva de Jepyso.')}</span><button type="button" class="boton">${t('Actualizar')}</button>
    <button type="button" class="nueva-version-cerrar" aria-label="${t('Ahora no')}">${ICONO.cerrar}</button>`;
  aviso.querySelector('.boton').addEventListener('click', () => location.reload());
  // «Not now»: it goes until the next time Jepyso is opened, which already brings the new version.
  aviso.querySelector('.nueva-version-cerrar').addEventListener('click', () => aviso.remove());
  document.body.append(aviso);
}

// Every file the routine needs, so it can be done with no connection: its exercises ({ i, b } as in the link), each
// with its clip, its sheet and its still (the one with the chosen band colour).
async function guardarParaSinConexion(c, ejercicios) {
  if (!(await trabajador)) return false;
  const m = await cargarManifiesto(c);
  // The voice too, in the voice this person chose: the count up to the top of the routine, the player's own sentences
  // and the words of each phase of these exercises (from their sheets, which are kept as well).
  const fichas = await Promise.all(ejercicios.map(({ i }) => (m.ejercicios[i] ? fetch(m.ejercicios[i].ficha).then((r) => r.json()).catch(() => null) : null)));
  const tope = Math.max(3, ...ejercicios.map((e) => e.r));
  const textosVoz = [...FRASES_GENERALES, ...Array.from({ length: Math.min(tope, 60) + 1 }, (_, n) => [numero(n), numero(n, true)]).flat(),
    ...fichas.flatMap((f) => (Array.isArray(f?.fases) ? f.fases.map((x) => x.texto).filter(Boolean) : [])),
    ...ejercicios.map(({ i }) => EJERCICIOS[i]?.nombre).filter(Boolean)];
  const voz = vozActiva() ? await rutasDeVoz(textosVoz).catch(() => []) : [];
  const rutas = [...new Set([...MOTOR, RUTAS[c] || RUTAS.a, m.cuerpo,
    ...ejercicios.flatMap(({ i, b }) => (m.ejercicios[i] ? [m.ejercicios[i].glb, m.ejercicios[i].ficha, poster(i, c, bandaDe(EJERCICIOS[i], b)?.clave)] : [])),
    ...voz])];
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
    const lista = leerPlantillas();
    app.querySelector('.lista-plantillas-app').innerHTML = lista.length
      ? lista.map((p, i) => `<li class="plantilla-fila">
          <button type="button" class="plantilla-usar" data-accion="usar" data-i="${i}">
            <span class="nombre">${esc(p.nombre)}</span>
            <span class="meta">${tn(p.orden.length, '{n} ejercicio', '{n} ejercicios')} · ${p.orden.map((id) => esc(EJERCICIOS[id] ? t(EJERCICIOS[id].nombre) : id)).join(', ')}</span>
          </button>
          <button type="button" class="plantilla-quitar" data-accion="quitar" data-i="${i}" aria-label="${t('Borrar la plantilla {nombre}', { nombre: esc(p.nombre) })}">${ICONO.cerrar}</button>
        </li>`).join('')
      : `<li class="vacio">${t('Todavía no hay plantillas. Arma una rutina y, en sus ejercicios, «Guardar la rutina como plantilla».')}</li>`;
  };
  app.innerHTML = `<div class="personas plantillas-app">
    ${barraApp(t('Plantillas'), { accion: botonNueva })}
    <div class="armar-cuerpo">
      <ul class="lista-plantillas-app"></ul>
      <section class="programas">
        <h2>${t('Programas de referencia')}</h2>
        <p class="ayuda">${t('Otago y Vivifrail, dos programas probados para prevenir caídas en personas mayores, con la dosis de partida de cada nivel. Se abren como una plantilla: cambia lo que haga falta antes de mandarla.')}</p>
        <ul class="lista-plantillas-app">${PROGRAMAS.map((p) => `<li class="plantilla-fila">
          <button type="button" class="plantilla-usar" data-accion="programa" data-id="${esc(p.id)}">
            <span class="nombre">${esc(t(p.nombre))}</span>
            <span class="meta">${esc(t(p.descripcion))} · ${tn(p.orden.length, '{n} ejercicio', '{n} ejercicios')}</span>
          </button>
        </li>`).join('')}</ul>
      </section>
      <details class="ayuda-plegada"><summary>${t('Cómo funciona')}</summary><p>${t('Una plantilla guarda los ejercicios y sus ajustes. Al usarla se abre una rutina nueva con ellos, para cambiar lo que haga falta y mandarla. Se guardan en este aparato.')}</p></details>
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
    } else if (el.dataset.accion === 'programa') {
      almacen.guardar('programa-a-usar', el.dataset.id);
      location.hash = '';
    } else if (el.dataset.accion === 'quitar') {
      // A first touch asks; the second deletes.
      if (el.dataset.confirmar) {
        const lista = leerPlantillas();
        const [borrada] = lista.splice(Number(el.dataset.i), 1);
        if (borrada) apuntarBorrada('plantillas', borrada.nombre);
        almacen.guardar('plantillas', lista);
        clearTimeout(confirmar);
        pintarLista();
      } else {
        el.dataset.confirmar = '1';
        el.classList.add('confirmar');
        el.textContent = t('¿Borrar?');
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
  let h = location.hash;
  // A licence arriving in its link: kept, and the address cleaned (it is in the fragment, so no server saw it), then
  // the professional's people, where it says what to do next.
  if (h.startsWith('#licencia=')) {
    const l = await guardarLicencia(h.slice(10));
    history.replaceState(null, '', `${location.pathname}#personas`);
    h = '#personas';
    if (!l.valida) setTimeout(() => {
      const aviso = app.querySelector('.aviso-licencia');
      if (aviso) aviso.textContent = t(MOTIVOS_LICENCIA[l.motivo] || MOTIVOS_LICENCIA.formato);
    }, 0);
  }
  marcoApp(h);
  if (h.startsWith('#r=')) limpiar = await vistaRutina(h.slice(3));
  else if (h.startsWith('#s=')) limpiar = await vistaResumen(h.slice(3));
  else if (h === '#personas') limpiar = vistaPersonas();
  else if (h === '#plantillas') limpiar = vistaPlantillas();
  else if (h.startsWith('#persona=')) {
    let id = '';
    try {
      id = decodeURIComponent(h.slice(9));
    } catch {
      // A mistyped address: read as a file that is not here.
    }
    limpiar = vistaPersona(id);
  }
  else {
    if (armandoParaMoodle) await rutinaDelFormularioAlBorrador();
    limpiar = vistaArmar();
  }
}
// The paid version without a licence, for the tests: ?pago=1 switches it on in this browser, ?pago=0 off, only on
// this laptop (personas.js). Anywhere else a switch left from before is cleared.
if (!esEntornoDePruebas()) {
  if (almacen.leer('version', '') === 'pago') almacen.guardar('version', '');
} else {
  if (parametros.has('pago')) almacen.guardar('version', parametros.get('pago') === '1' ? 'pago' : '');
  // The free files' tickets, on this laptop only when a test asks for them (?vales=1): on a public address, always.
  if (parametros.has('vales')) almacen.guardar('vales', parametros.get('vales') === '1' ? 'si' : '');
}
window.addEventListener('hashchange', ir);
// After the Google sign-in, the files that opened: the professional's people, painted again where they are on view.
alCambiarVales(() => {
  if (location.hash === '#personas' || location.hash.startsWith('#persona=')) ir();
});
// The licence and the free files' tickets are checked once, before the first view: what is open must be known when it
// paints.
// Building for a Moodle activity, the library and the programmes offer only what the plugin brings (its free sample,
// or the whole library): the exercises with their clip in both figures.
async function soloLoQueHay() {
  if (!armandoParaMoodle) return;
  try {
    const [a, b] = await Promise.all([cargarManifiesto('a'), cargarManifiesto('b')]);
    const hay = (id) => !!(a.ejercicios[id] && b.ejercicios[id]);
    for (let k = ORDEN.length - 1; k >= 0; k--) if (!hay(ORDEN[k])) ORDEN.splice(k, 1);
    for (let k = PROGRAMAS.length - 1; k >= 0; k--) if (!PROGRAMAS[k].orden.every(hay)) PROGRAMAS.splice(k, 1);
  } catch {
    // Without the lists the whole library stays: the activity form says which exercises the site does not have.
  }
}
// In a Moodle course neither applies: the course is the licence and keeps the sessions.
(enMoodle || armandoParaMoodle ? soloLoQueHay() : comprobarLicencia().then(comprobarVales)).finally(ir);
