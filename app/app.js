// Jepyso: the professional builds a routine, sends it as a link, the person does it with the 3D figure and sends
// back a summary link. No server: everything travels inside the links. Here, the builder and the player; what changes
// between app.jepyso.com and a Moodle course (who the routine is for, where what is done goes) is in entorno.js.
import {
  EJERCICIOS, ORDEN, ZONAS, MUSCULOS, buscarEjercicios, LADOS, TOPE_MOLESTIA, pasaDelTope, diaLocal, diaAnterior,
  decodificar, duracionRutina, minutos, almacen, VUELTAS, DESCANSOS_CIRCUITO, ENTRE_VUELTAS, BANDAS, conBanda, bandaDe, unidad, porPasos, porMinutos, topeReps,
  tituloUnidad, palabraUnidad, cuentaUnidad, deTotalUnidad, fraseUnidad,
} from './datos.js';
import { t, tn, idioma, otroIdioma, ponerIdioma, IDIOMAS, locale, cargarIdioma } from './idioma.js';
import { limpiarRutina, limpiarPlantilla, limpiarPlantillas } from './entrada.js';
import { hayVoz, vozActiva, ponerVoz, decir, callar, numero, modoVoz, quienHabla, ponerQuien, rutasDeVoz, FRASES_GENERALES } from './voz.js';
import { MAPA, PUNTOS } from './mapa.js';
import { PROGRAMAS } from './programas.js';
import { medida, dibujar, actualizar } from './goniometro.js';
import {
  preparar, PESTANAS, INSTALABLE, firma, ayuda, avisoPestana, etapasArmar, textosArmar, pasoPara, bandaArmar, alPintarArmar, alPulsarArmar, alEscribirArmar,
  antesDeArmar, entregar, alBorrarPlantilla, alAbrir, alGuardar, avisoPersona, destinoMarca, tarjetaEnviar, tarjetaSinNada, tarjetaRecordatorio, invitacion,
  pieFin, textoFin, textoDejar, textoSinSitio, alPulsarRutina, direccion, vista, inicio,
} from './entorno.js';
import { RAIZ } from './raiz.js';

// The language first (idioma.js): every text below is written in it, from the first screen on. The page's title and
// Oksigenia's accessibility panel (which redraws itself when its locale changes) follow it.
await cargarIdioma();
document.title = t('Rutina');
document.querySelector('oksigenia-access-panel')?.setAttribute('locale', idioma());

const app = document.getElementById('app');
const parametros = new URLSearchParams(location.search);
const RUTAS = { a: `${RAIZ}modelos/ejercicios.json`, b: `${RAIZ}modelos/b/ejercicios.json` };
// The still of every exercise, for the library rows and the routine of the person, made by tools/posters/ next to each
// body's clips. One that is not there leaves its tile empty instead of a broken image.
// The still of an exercise; with a band colour, the one with the band in that colour.
const poster = (id, c, banda) => `${RAIZ}modelos/${c === 'b' ? 'b/' : ''}posters/${id}${banda ? `-${banda}` : ''}.webp`;
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
  volver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  cuerpo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M5 9l7 1.5L19 9M12 10.5V15m0 0l-3 6m3-6l3 6"/></svg>',
  plantillas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 4.5h11v14H4z"/><path d="M8 8h11v14H8z"/><path d="M11 12h5M11 15.5h5M11 19h3" stroke-linecap="round"/></svg>',
  abrir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></svg>',
  girar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
  ayuda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/></svg>',
  idioma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3c2.4 2.6 3.5 5.6 3.5 9s-1.1 6.4-3.5 9c-2.4-2.6-3.5-5.6-3.5-9S9.6 5.6 12 3z"/></svg>',
  // Oksigenia's accessibility sign, the one the panel's own button wears on every Oksigenia website.
  acceso: '<svg viewBox="0 0 122.88 122.88" fill="currentColor"><path d="M61.44,0A61.46,61.46,0,1,1,18,18,61.21,61.21,0,0,1,61.44,0Zm-.39,74.18L52.1,98.91a4.94,4.94,0,0,1-2.58,2.83A5,5,0,0,1,42.7,95.5l6.24-17.28a26.3,26.3,0,0,0,1.17-4,40.64,40.64,0,0,0,.54-4.18c.24-2.53.41-5.27.54-7.9s.22-5.18.29-7.29c.09-2.63-.62-2.8-2.73-3.3l-.44-.1-18-3.39A5,5,0,0,1,27.08,46a5,5,0,0,1,5.05-7.74l19.34,3.63c.77.07,1.52.16,2.31.25a57.64,57.64,0,0,0,7.18.53A81.13,81.13,0,0,0,69.9,42c.9-.1,1.75-.21,2.6-.29l18.25-3.42A5,5,0,0,1,94.5,39a5,5,0,0,1,1.3,7,5,5,0,0,1-3.21,2.09L75.15,51.37c-.58.13-1.1.22-1.56.29-1.82.31-2.72.47-2.61,3.06.08,1.89.31,4.15.61,6.51.35,2.77.81,5.71,1.29,8.4.31,1.77.6,3.19,1,4.55s.79,2.75,1.39,4.42l6.11,16.9a5,5,0,0,1-6.82,6.24,4.94,4.94,0,0,1-2.58-2.83L63,74.23,62,72.4l-1,1.78Zm.39-53.52a8.83,8.83,0,1,1-6.24,2.59,8.79,8.79,0,0,1,6.24-2.59Zm36.35,4.43a51.42,51.42,0,1,0,15,36.35,51.27,51.27,0,0,0-15-36.35Z"/></svg>',
};

// The two bodies of the figures. Named by build, never by sex.
const FIGURAS = [['a', 'Figura 1'], ['b', 'Figura 2']];
// The figure at ease, with nothing in the hands: the first frame of this exercise.
const DE_PIE = 'extension_espalda_pie';
// When the copy does not bring it (the Moodle activity), the start of a standing exercise it does.
const DE_PIE_MUESTRA = ['talones', 'sentadilla', 'equilibrio'];

// The choice of body with the still of each one standing (tools/posters/figuras.mjs): the names alone did not say how
// they differ.
function eleccionFigura(actual) {
  return `<div class="segmentos figuras" role="group" aria-label="${t('Figura')}">${FIGURAS.map(
    ([v, nombre]) => `<button type="button" data-accion="cuerpo" data-valor="${v}" aria-pressed="${v === actual}"><img src="${RAIZ}imagenes/figura-${v}.webp" alt="" width="36" height="48">${t(nombre)}</button>`,
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
    .then((m) => Object.assign(m, { _base: m._base || RAIZ }))
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

// ---------- The professional's app ----------
// The professional's side is an app for the phone and the tablet (Enrique, 11 November 2026): a tab bar at the foot of
// the phone, a rail at the side of a tablet, a bar on top with the title and, inside a file, the way back. The person's
// routine (#r=) has none of it, and no manifest: installed from there, its icon would open the builder, not the routine.
let pestanas = null;
let firmaPro = null;

// Oksigenia signs every website it makes (shared/sitios-publicos.md): the line with its link, and beside it the button
// that opens the accessibility panel (index.html). The professional has it at the foot of the rail, or at the end of
// the page on a phone; the person, quiet at the end of the list, under the routine and away from «Empezar».
const FIRMA = `<p class="firma-linea">${firma()}</p>`;
const botonAcceso = `<button type="button" class="firma-acceso" data-acceso aria-haspopup="dialog">${ICONO.acceso}<span>${t('Accesibilidad')}</span></button>`;
// The language switch, beside «Accesibilidad» (and «Ayuda»): the other language, in its own name. The page starts again
// in it, and the choice stays on this device (idioma.js). Routines, summaries and files read the same in both.
const botonIdioma = `<button type="button" class="firma-acceso firma-idioma" data-idioma lang="${otroIdioma()}">${ICONO.idioma}<span>${IDIOMAS[otroIdioma()]}</span></button>`;
// Light or dark, beside them: a goniometer whose arm sweeps more graphite for dark (estilos.css, «.tema-gonio»). The device's
// mode until someone turns it, then theirs on this device (tema.js); the button says the mode it goes to.
const GONIO = '<svg class="tema-gonio" viewBox="0 0 32 24" aria-hidden="true" focusable="false"><path class="tg-arco" d="M4 20a12 12 0 0 1 24 0"/><circle class="tg-sector" cx="16" cy="20" r="6"/><path class="tg-marcas" d="M27.52 13.35L28.9 12.55M22.65 8.48L23.45 7.1M16 6.7V5.1M9.35 8.48L8.55 7.1M4.48 13.35L3.1 12.55"/><path class="tg-base" d="M1 20h30"/><path class="tg-brazo" d="M16 20h14.5"/><circle class="tg-eje" cx="16" cy="20" r="1.8"/></svg>';
const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)');
const modoActual = () => document.documentElement.dataset.modo === 'oscuro' ? 'oscuro' : 'claro';
const nombreTema = () => t(modoActual() === 'oscuro' ? 'Modo claro' : 'Modo oscuro');
const botonTema = `<button type="button" class="firma-acceso firma-tema" data-tema>${GONIO}<span>${nombreTema()}</span></button>`;
function pintarTema() {
  const raiz = document.documentElement;
  const oscuro = raiz.dataset.theme ? raiz.dataset.theme === 'dark' : sistemaOscuro.matches;
  raiz.dataset.modo = oscuro ? 'oscuro' : 'claro';
  document.querySelectorAll('[data-tema] span').forEach((s) => { s.textContent = nombreTema(); });
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    const o = raiz.dataset.theme ? oscuro : m.media.includes('dark');
    m.content = o ? '#121517' : '#e4e6e3';
  });
}
function cambiarTema() {
  const nuevo = modoActual() === 'oscuro' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nuevo;
  try { localStorage.setItem('jepyso-tema', nuevo); } catch { /* it lasts this visit */ }
  pintarTema();
}
sistemaOscuro.addEventListener?.('change', pintarTema);
const firmaPersona = `<div class="firma firma-persona"><span class="firma-botones">${botonAcceso}${botonIdioma}${botonTema}</span>${FIRMA}</div>`;
// Help and contact for the professional, beside «Accesibilidad»: what is asked most, and where to write. Someone who
// arrives from an app store finds them in the app itself.
const botonAyuda = `<button type="button" class="firma-acceso" data-ayuda aria-haspopup="dialog">${ICONO.ayuda}<span>${t('Ayuda')}</span></button>`;
function abrirAyuda() {
  const volverA = document.activeElement;
  const dialogo = document.createElement('dialog');
  dialogo.className = 'hoja hoja-ayuda';
  dialogo.setAttribute('aria-labelledby', 'ayuda-titulo');
  dialogo.innerHTML = `<h2 id="ayuda-titulo" tabindex="-1">${t('Ayuda')}</h2>
    ${ayuda()}
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
  if (ev.target.closest?.('[data-tema]')) cambiarTema();
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
    firmaPro.innerHTML = botonAyuda + botonAcceso + botonIdioma + botonTema + FIRMA;
    document.body.append(firmaPro);
  }
  if (firmaPro) firmaPro.hidden = !pro;
  if (pestanas) {
    pestanas.hidden = !pro;
    const actual = h.startsWith('#persona') ? '#personas' : h === '#plantillas' ? '#plantillas' : h.startsWith('#s=') ? '' : '#';
    pestanas.querySelectorAll('a').forEach((a) => (a.dataset.pestana === actual ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    if (pro) avisoPestana(pestanas);
  }
  let m = document.querySelector('link[rel="manifest"]');
  if (pro && !m && INSTALABLE) {
    m = document.createElement('link');
    m.rel = 'manifest';
    m.href = 'manifest.json';
    document.head.append(m);
  } else if (!pro && m) m.remove();
}

const barraApp = (titulo, { volver = '', accion = '' } = {}) => `<header class="barra-app">
  ${volver ? `<a class="barra-volver" href="${volver}" aria-label="${t('Volver')}">${ICONO.volver}</a>` : ''}
  <h1>${titulo}</h1>${accion}
</header>`;
const botonNueva = `<a class="boton barra-boton" href="#">${ICONO.mas}${t('Nueva rutina')}</a>`;

// The steps of the builder, on top: for whom, the exercises, the settings and the link. One tap goes to each.
function etapasApp(b) {
  const pasos = etapasArmar(b);
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
    vueltas: 0, entreEjercicios: 30, entreVueltas: 120, publicar: false, volver: '',
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
  // A circuit (vueltas, 0 for a routine by sets) keeps its own rests, so going from one way to the other loses neither.
  b.vueltas = VUELTAS.includes(b.vueltas) ? b.vueltas : 0;
  b.entreEjercicios = DESCANSOS_CIRCUITO.includes(b.entreEjercicios) ? b.entreEjercicios : 30;
  b.entreVueltas = ENTRE_VUELTAS.includes(b.entreVueltas) ? b.entreVueltas : 120;
  b.publicar = b.publicar === true;
  b.volver = typeof b.volver === 'string' ? b.volver.slice(0, 300) : '';
  return b;
}

// The routine's settings as a link or a template carries them: d is the rest between sets or, in a circuit, between
// exercises; k and kd, the rounds and the rest between them.
const ajustesDeRutina = (b) => (b.vueltas ? { d: b.entreEjercicios, k: b.vueltas, kd: b.entreVueltas } : { d: b.descanso });
// And back, from a link or a template to the draft.
const rutinaEnBorrador = (x) => (x.k ? { vueltas: x.k, entreEjercicios: x.d, entreVueltas: x.kd || 120 } : { vueltas: 0, descanso: x.d });
// Seconds of the draft's routine.
const duracionBorrador = (b) =>
  duracionRutina(b.orden.map((id) => ({ e: b.vueltas ? { ...b.ejercicios[id], series: b.vueltas } : b.ejercicios[id], def: EJERCICIOS[id] })), {
    descanso: b.vueltas ? b.entreEjercicios : b.descanso, vueltas: b.vueltas, entreVueltas: b.entreVueltas,
  });

function paso(accion, valor, etiqueta, min, max) {
  return `<div class="paso" role="group" aria-label="${esc(etiqueta)}">
    <button type="button" data-accion="${accion}" data-delta="-1" aria-label="${t('Menos')}" ${valor <= min ? 'disabled' : ''}>−</button>
    <output class="num">${esc(valor)}</output>
    <button type="button" data-accion="${accion}" data-delta="1" aria-label="${t('Más')}" ${valor >= max ? 'disabled' : ''}>+</button>
  </div>`;
}

// A rest in words, as the builder offers it: 2 min, 1 min 30, 45 s.
const segundosEnTexto = (s) => ({ 60: '1 min', 90: t('1 min 30'), 120: '2 min', 180: '3 min' })[s] || `${s} s`;

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
function dosis(def, e, vueltas = 0) {
  const banda = bandaDe(def, e.banda);
  const tempo = def.unidad ? `<span>${palabraUnidad(def)}</span>` : `${svgTempo(e.tempo, { ancho: 52, alto: 22 })}<span class="sr">${textoTempo(e.tempo)}</span>`;
  return `<span class="num">${vueltas ? e.reps : `${e.series} × ${e.reps}`}</span>${tempo}${
    def.unLado && LADOS[e.lado] ? `<span>${esc(t(LADOS[e.lado]))}</span>` : ''
  }${banda ? `<span class="con-banda">${muestraBanda(banda)}${esc(t(banda.nombre))}</span>` : ''}`;
}

// An exercise of the routine, with its number in the routine and everything the professional sets for it. Only the
// one being looked at is open; the others fold to one line with their dose, so a long routine still fits.
// In a circuit (vueltas) there are no sets to set: every exercise does one in each round.
function tarjetaEjercicio(id, e, activo, pos, total, vueltas = 0) {
  const def = EJERCICIOS[id];
  const [s, m, b] = e.tempo;
  return `<article class="ejercicio incluido ${activo ? 'activo' : ''}" data-id="${id}">
    <button type="button" class="ejercicio-cabeza" data-accion="elegir" aria-expanded="${activo}">
      <span class="marca num" aria-hidden="true">${pos + 1}</span>
      <span class="titulo">
        <h3>${esc(t(def.nombre))}</h3>
        <span class="linea-chips">${chipsEjercicio(def)}</span>
        <span class="dosis">${dosis(def, e, vueltas)}</span>
      </span>
      <span class="plegar" aria-hidden="true">${ICONO.abrir}</span>
    </button>
    <div class="ejercicio-ajustes">
      <div class="mini-figura"></div>
      <div class="fila">
        ${vueltas ? '' : `<div class="ajuste"><span>${t('Series')}</span>${paso('series', e.series, t('Series'), 1, 6)}</div>`}
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

// Step 3: how the routine goes. By sets, exercise after exercise; or as a circuit, every exercise once in each round,
// one after the other, with a short rest between exercises and a longer one between rounds.
function ajustesForma(b) {
  const forma = `<div class="ajuste"><span>${t('Cómo se hace')}</span>${segmentos('forma', [['series', t('Por series')], ['circuito', t('En circuito')]], b.vueltas ? 'circuito' : 'series', t('Cómo se hace'))}</div>`;
  if (!b.vueltas) return `${forma}<div class="ajuste"><span>${t('Descanso entre series')}</span>${segmentos('descanso', [[30, '30 s'], [45, '45 s'], [60, '1 min'], [90, t('1 min 30')]], b.descanso, t('Descanso entre series'))}</div>`;
  return `${forma}
    <div class="ajuste"><span>${t('Vueltas del circuito')}</span>${segmentos('vueltas', VUELTAS.map((v) => [v, String(v)]), b.vueltas, t('Vueltas del circuito'))}</div>
    <div class="ajuste"><span>${t('Descanso entre ejercicios')}</span>${segmentos('entreEjercicios', [[15, '15 s'], [30, '30 s'], [45, '45 s'], [60, '1 min']], b.entreEjercicios, t('Descanso entre ejercicios'))}</div>
    <div class="ajuste"><span>${t('Descanso entre vueltas')}</span>${segmentos('entreVueltas', [[60, '1 min'], [90, t('1 min 30')], [120, '2 min'], [180, '3 min']], b.entreVueltas, t('Descanso entre vueltas'))}</div>`;
}

function seccionRutina(b, vaciada = null) {
  return `<section class="rutina-armada" aria-labelledby="rutina-titulo">
    <h2 id="rutina-titulo">${t('La rutina')}</h2>
    ${b.orden.length ? `<button type="button" class="boton fantasma vaciar" data-accion="vaciar">${t('Vaciar')}</button>` : ''}
    ${vaciada ? `<p class="vaciada" role="status">${t('Rutina vaciada.')} <button type="button" class="enlace" data-accion="deshacer-vaciar">${t('Deshacer')}</button></p>` : ''}
    ${b.vueltas && b.orden.length ? `<p class="ayuda circuito-nota">${tn(b.vueltas, 'En circuito: {n} vuelta, con una serie de cada ejercicio.', 'En circuito: {n} vueltas, con una serie de cada ejercicio en cada una.')}</p>` : ''}
    ${
      b.orden.length
        ? b.orden.map((id, i) => tarjetaEjercicio(id, b.ejercicios[id], id === b.activo, i, b.orden.length, b.vueltas)).join('')
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

// The body map: the figure's body from the front and from the back, a point on every area with exercises and the muscle
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

// A routine back in the builder, to change it: its exercises with their settings, and the routine's own settings.
function rutinaAlBorrador(r, extra = {}) {
  const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
  Object.assign(b, {
    ...rutinaEnBorrador(r), veces: r.x, semana: r.w || 0, tope: Number.isInteger(r.m) ? r.m : TOPE_MOLESTIA, cuerpo: r.c || 'a',
    publicar: r.o === 1, volver: r.u || '', ...extra,
  });
  b.orden = r.e.map((e) => e.i).filter((i) => ORDEN.includes(i));
  for (const e of r.e) if (ORDEN.includes(e.i)) b.ejercicios[e.i] = { series: e.s, reps: e.r, tempo: [...e.t], lado: e.l ?? null, banda: e.b || '', nota: e.n || '' };
  b.activo = b.orden[0] || b.activo;
  almacen.guardar('borrador', b);
}

function vistaArmar() {
  const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
  let gonio = null;
  const guardar = () => almacen.guardar('borrador', b);
  const ajustes = (id) => (b.ejercicios[id] ||= ajustesIniciales(id));

  const resumenCorto = () => {
    if (!b.orden.length) return t('Elige al menos un ejercicio');
    const vueltas = b.vueltas ? ` · ${tn(b.vueltas, 'circuito de {n} vuelta', 'circuito de {n} vueltas')}` : '';
    return `${tn(b.orden.length, '{n} ejercicio', '{n} ejercicios')}${vueltas} · ${minutos(duracionBorrador(b))}`;
  };

  function pintar() {
    app.innerHTML = `<div class="armar${b.orden.length ? '' : ' sin-ejercicios'}">
      <div class="armar-biblio">${seccionBiblioteca(b)}</div>
      <div class="armar-izq">
        ${barraApp(t('Nueva rutina'))}
        <nav class="etapas-app" aria-label="${t('Pasos')}">${etapasApp(b)}</nav>
        <div class="armar-cuerpo">
          ${bandaArmar(b)}
          <section class="etapa" id="etapa-para" aria-labelledby="etapa-para-t">
            ${pasoPara(b)}
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
              <div class="fila hueco-forma">${ajustesForma(b)}</div>
              <div class="fila">
                <div class="ajuste"><span>${t('Veces al día')}</span>${segmentos('veces', [[1, '1'], [2, '2'], [3, '3']], b.veces, t('Veces al día'))}</div>
                <div class="ajuste"><span>${t('Días a la semana')}</span>${segmentos('semana', [[0, t('Libre')], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [7, '7']], b.semana, t('Días a la semana'))}</div>
                <div class="ajuste"><span>${t('Figura')}</span>${eleccionFigura(b.cuerpo)}</div>
                <div class="ajuste"><span>${t('Molestia aceptable, de 0 a 10')}</span>${paso('tope', b.tope, t('Molestia aceptable'), 0, 9)}</div>
              </div>
              <p class="ayuda">${textosArmar().molestia}</p>
            </section>
          </section>
        </div>
        <div class="barra-crear" id="etapa-enlace">
          <span class="resumen-corto">${resumenCorto()}</span>
          <button type="button" class="boton" data-accion="crear" ${b.orden.length ? '' : 'disabled'}>${textosArmar().crear}</button>
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
    alPintarArmar(b);
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

  function pintarEtapas() {
    const etapas = app.querySelector('.etapas-app');
    if (etapas) etapas.innerHTML = etapasApp(b);
  }

  function actualizarBarra() {
    app.querySelector('.resumen-corto').textContent = resumenCorto();
    app.querySelector('.armar').classList.toggle('sin-ejercicios', !b.orden.length);
    pintarEtapas();
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
    nueva.innerHTML = tarjetaEjercicio(id, b.ejercicios[id], id === b.activo, pos, b.orden.length, b.vueltas);
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
    alPintarArmar(b);
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
      nombre, cambiada: new Date().toISOString(), ...ajustesDeRutina(b), x: b.veces, w: b.semana || undefined, m: b.tope, c: b.cuerpo, orden: [...b.orden],
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
    Object.assign(b, { ...rutinaEnBorrador(p), veces: p.x, semana: p.w || 0, tope: p.m ?? TOPE_MOLESTIA, cuerpo: p.c || 'a' });
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
      alPintarArmar(b);
    } else if (a === 'tope') {
      b.tope = Math.min(9, Math.max(0, b.tope + delta));
      el.closest('.paso').outerHTML = paso('tope', b.tope, t('Molestia aceptable'), 0, 9);
    } else if (a === 'descanso' || a === 'veces' || a === 'semana' || a === 'entreEjercicios' || a === 'entreVueltas') {
      b[a] = Number(el.dataset.valor);
      el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
      actualizarBarra();
    } else if (a === 'forma' || a === 'vueltas') {
      // By sets or as a circuit, and its rounds: the cards lose or get back their sets.
      b.vueltas = a === 'vueltas' ? Number(el.dataset.valor) : el.dataset.valor === 'circuito' ? b.vueltas || 3 : 0;
      app.querySelector('.hueco-forma').innerHTML = ajustesForma(b);
      refrescarRutina();
      colocarFigura();
      app.querySelector(`.hueco-forma [data-accion="${a}"][data-valor="${el.dataset.valor}"]`)?.focus({ preventScroll: true });
    } else if (a === 'destino' || a === 'persona') {
      alPulsarArmar(a, el, { b, actualizarBarra });
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
        if (borrada) alBorrarPlantilla(borrada.nombre);
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
    } else if (a === 'crear') {
      crear(b, empezarOtra);
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
    if (a === 'para' || a === 'de' || a === 'volver') b[a] = ev.target.value;
    alEscribirArmar(a, { b, pintarEtapas });
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

// The routine of the draft, as a link carries it. Where it goes (a link to send, the form of an activity) is entorno.js's.
function crear(b, empezarOtra) {
  const rutina = {
    v: 1,
    para: b.para.trim(),
    de: b.de.trim(),
    ...ajustesDeRutina(b),
    x: b.veces,
    w: b.semana || undefined,
    m: b.tope,
    c: b.cuerpo || 'a',
    f: diaLocal(),
    e: b.orden.map((id) => {
      const e = b.ejercicios[id];
      return { i: id, s: b.vueltas || e.series, r: e.reps, t: e.tempo, l: e.lado, b: bandaDe(EJERCICIOS[id], e.banda)?.clave, n: e.nota.trim() || undefined };
    }),
  };
  return entregar(b, rutina, empezarOtra);
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
  await alAbrir(r, clave);
  // Above the acceptable discomfort: where it will show. A published routine sends nothing, so it only says so.
  const masDelTope = (q) => (r.o ? t('Es más de {tope}.', { tope }) : t('Es más de {tope}: {destino}.', { tope, destino: destinoMarca(q) }));
  // A circuit: every exercise once in each round (its sets are the rounds), the rest between rounds in r.kd.
  const circuito = r.k > 0;
  const totalSeg = duracionRutina(ejercicios.map((e) => ({ e: { series: e.s, reps: e.r, tempo: e.t, lado: e.l }, def: EJERCICIOS[e.i] })), { descanso: r.d, vueltas: r.k, entreVueltas: r.kd });
  const tope = Number.isInteger(r.m) ? r.m : TOPE_MOLESTIA;
  const quien = r.de ? esc(r.de) : t('quien te dio la rutina');
  const persona = { r, clave, codigo, tope, totalSeg };
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
    alGuardar(clave);
    const tarjeta = app.querySelector('.manana');
    tarjeta.innerHTML = `<p class="apuntado">${t('Apuntado: {v} de 10 al levantarte.', { v: valor })}${
      pasaDelTope(valor, tope) ? ` ${masDelTope(quien)}` : ''
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
    const enviar = tarjetaEnviar(r, quien);
    sitio.innerHTML = `<section class="tarjeta mandar-hecho" aria-labelledby="mandar-titulo">
        <h3 id="mandar-titulo">${t('Lo que llevas hecho')}</h3>
        ${hist.length ? `<ul class="dias-hechos">${recientes.map(fila).join('')}</ul>
        ${enviar}` : `<p>${t('Todavía nada.')}</p>${tarjetaSinNada()}`}
        <button type="button" class="enlace" data-r="sin-app">${t('Apuntar una vez que la hice sin la app')}</button>
      </section>`;
    if (hist.length) alGuardar(clave);
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
        <div class="de-fila">${r.de ? `<div class="de">${r.o ? t('Rutina de {de}', { de: esc(r.de) }) : t('Tu rutina de {de}', { de: esc(r.de) })}</div>` : ''}${botonIdioma}</div>
        <h1>${r.para ? t('Hola, {nombre}', { nombre: esc(r.para) }) : t('Tu rutina')}</h1>
        ${r.w ? `<p class="semana-rutina">${r.w === 7 ? t('Todos los días') : r.w <= 3 ? tn(r.w, '{n} día a la semana, mejor no seguidos', '{n} días a la semana, mejor no seguidos') : tn(r.w, '{n} día a la semana', '{n} días a la semana')}</p>` : ''}
        ${circuito ? `<p class="semana-rutina">${tn(r.k, 'En circuito: {n} vuelta, con los ejercicios uno detrás de otro.', 'En circuito: {n} vueltas, con los ejercicios uno detrás de otro y {descanso} de descanso entre vueltas.', { descanso: segundosEnTexto(r.kd) })}</p>` : ''}
        ${avisoPersona()}
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
                  <p class="tarjeta-dosis num">${circuito ? cuentaUnidad(def, e.r) : `${tn(e.s, '{n} serie', '{n} series')} · ${cuentaUnidad(def, e.r)}`}</p>
                </div>
              </div>
              <p class="tarjeta-pauta">${esc(textoTempo(e.t))}</p>
              ${material ? `<p class="tarjeta-material">${material}</p>` : ''}
              ${e.n ? `<div class="nota">${esc(t(e.n))}</div>` : ''}
            </article>`;
          })
          .join('')}
        ${tarjetaVoz()}
        ${tarjetaRecordatorio()}
        ${invitacion(r, 'lista')}
        <p class="sin-conexion" aria-live="polite"></p>
        ${firmaPersona}
      </section>
      <footer class="pie pie-fijo">
        ${ejercicios[0] ? `<span class="pie-poster" aria-hidden="true"><img src="${poster(ejercicios[0].i, r.c, bandaDe(EJERCICIOS[ejercicios[0].i], ejercicios[0].b)?.clave)}" alt="" width="112" height="84" decoding="async"${ejercicios[0].l === 'izq' ? ' class="espejo"' : ''}></span>` : ''}
        <p class="pie-resumen num">${tn(ejercicios.length, '{n} ejercicio', '{n} ejercicios')}${circuito ? ` · ${tn(r.k, 'circuito de {n} vuelta', 'circuito de {n} vueltas')}` : ''} · ${minutos(totalSeg)}</p>
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
        ${invitacion(r, 'panel')}
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
  // «Ejercicio 2 de 7», and in a circuit, the round first.
  const enQueVamos = (e) => {
    const ejercicio = t('Ejercicio {n} de {total}', { n: ejercicios.indexOf(e) + 1, total: ejercicios.length });
    return circuito ? `${t('Vuelta {n} de {total}', { n: sesion.serie + 1, total: r.k })} · ${ejercicio}` : ejercicio;
  };
  // Under the name: the set, and the band to use when the professional said its colour.
  const subtitulo = (e, serie) => {
    const banda = bandaDe(EJERCICIOS[e.i], e.b);
    return `${circuito ? t('Vuelta {n} de {total}', { n: serie, total: r.k }) : t('Serie {n} de {total}', { n: serie, total: e.s })}${banda ? ` · ${t(banda.nombre).toLowerCase()}` : ''}`;
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
    // In a circuit, from the second round on, the next exercise comes after a short rest (a longer one between rounds),
    // with the figure already in its starting position.
    const nuevo = sesion.retomada || (sesion.serie === 0 && (item === 0 || cola[item - 1].e !== e));
    const transicion = sesion.transicion;
    sesion.retomada = false;
    sesion.transicion = null;
    if (nuevo) preparacion();
    else if (transicion) descanso(transicion.segundos, { siguiente: true, vuelta: transicion.vuelta });
    else cuentaAtras(5);
  }

  // Getting ready for an exercise, with no clock: the figure still in its starting position, how to stand, what is
  // needed (the band in its colour), and one big «Estoy en posición». Only then the countdown.
  function preparacion() {
    sesion.estado = 'prepara';
    const { e } = actual();
    const def = EJERCICIOS[e.i];
    const banda = bandaDe(def, e.b);
    app.querySelector('.j-sub').textContent = enQueVamos(e);
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
    if (circuito) return siguienteEnCircuito(e);
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
      descanso(r.d, { cambiaLado: true });
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

  // A circuit: the other side at once, as by sets; after the last round of an exercise, its rating (in the last round,
  // so each one is rated once, as by sets); otherwise on to the next exercise or the next round.
  function siguienteEnCircuito(e) {
    const sigue = cola[sesion.item + 1];
    if (sigue && sigue.e === e) {
      sesion.item++;
      guardarCurso();
      return descanso(r.d, { cambiaLado: true });
    }
    if (sesion.serie + 1 >= r.k && !grupo) {
      sesion.serie = e.s;
      guardarCurso();
      sesion.serie = e.s - 1;
      return valorar();
    }
    return pasarEnCircuito();
  }
  function pasarEnCircuito() {
    if (sesion.item + 1 < cola.length) {
      sesion.item++;
      sesion.transicion = { segundos: r.d };
    } else if (sesion.serie + 1 < r.k) {
      sesion.item = 0;
      sesion.serie++;
      sesion.transicion = { segundos: r.kd, vuelta: true };
    } else return grupo ? finDeGrupo() : terminar();
    guardarCurso();
    return prepararSerie();
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

  // siguiente: in a circuit, the rest before the next exercise (vuelta: before the next round), with its figure in place.
  function descanso(segundos, { cambiaLado = false, siguiente = false, vuelta = false } = {}) {
    const { e, lado } = actual();
    const nombre = t(EJERCICIOS[e.i].nombre);
    decir(cambiaLado ? t('Descansa. Ahora, el otro lado') : siguiente ? `${t('Descansa')}. ${nombre}` : t('Descansa'));
    sesion.estado = 'descanso';
    const mando = app.querySelector('.j-mando');
    const total = segundos;
    let quedan = segundos;
    const radio = 56;
    const largo = 2 * Math.PI * radio;
    const queSigue = cambiaLado
      ? t('Ahora, {lado}', { lado: t(LADOS[lado]).toLowerCase() })
      : vuelta
        ? t('Ahora, la vuelta {n} de {total}, empezando por {ejercicio}', { n: sesion.serie + 1, total: r.k, ejercicio: esc(nombre.toLowerCase()) })
        : siguiente
          ? t('Siguiente: {ejercicio}', { ejercicio: esc(nombre.toLowerCase()) })
          : t('Siguiente: serie {n} de {total}', { n: sesion.serie + 1, total: e.s });
    mando.innerHTML = `<div class="centro"><h3>${t('Descansa')}</h3><p>${queSigue}</p></div>
      <svg class="anillo" viewBox="0 0 132 132"><circle class="fondo-anillo" cx="66" cy="66" r="${radio}"/><circle class="avance" cx="66" cy="66" r="${radio}" stroke-dasharray="${largo}" stroke-dashoffset="0" transform="rotate(-90 66 66)"/><text x="66" y="66" class="num">${quedan}</text></svg>
      <div class="mando-botones"><button type="button" class="boton fantasma" data-r="mas">+15 s</button><span></span><button type="button" class="boton fantasma" data-r="ya">${t('Seguir ya')}</button></div>`;
    if (cambiaLado) {
      app.querySelector('.j-sub').textContent = subtitulo(e, circuito ? sesion.serie + 1 : 1);
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
    if (r.o) return '';
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
    app.querySelector('.j-sub').textContent = enQueVamos(e);
    const def = EJERCICIOS[e.i];
    const banda = bandaDe(def, e.b);
    const items = cola.map((c, i) => ({ c, i })).filter(({ c }) => c.e === e);
    const dosLados = items.length > 1;
    const ultimo = sesion.item + 1 >= cola.length;
    const seguir = ultimo ? t('Terminar') : t('Siguiente ejercicio');
    const lado = (c) => `<img src="${poster(e.i, r.c, banda?.clave)}" alt="" width="112" height="84" decoding="async"${c.lado === 'izq' ? ' class="espejo"' : ''}>`;
    const cabeza = `<div class="valorar-cabeza"><span class="tarjeta-poster">${lado(items[0].c)}</span>
      <div><h3>${t('Hecho')}</h3><p class="num">${circuito
        ? dosLados ? tn(e.s, '{n} vuelta de cada lado', '{n} vueltas de cada lado') : tn(e.s, '{n} vuelta', '{n} vueltas')
        : dosLados ? tn(e.s, '{n} serie de cada lado', '{n} series de cada lado') : tn(e.s, '{n} serie', '{n} series')} · ${cuentaUnidad(def, e.r)}</p></div></div>`;
    let cuerpo = '';
    let pie = '';
    if (sesion.paso === 'reps') {
      cuerpo = `<section class="valorar-paso" aria-labelledby="v-reps"><h4 class="pregunta" id="v-reps" tabindex="-1">${fraseUnidad(def, 'pregunta')}</h4>
        <div class="dos-botones"><button type="button" class="boton" data-r="todas">${fraseUnidad(def, 'si')}</button><button type="button" class="boton secundario" data-r="menos">${t('Hice menos')}</button></div></section>`;
    } else if (sesion.paso === 'menos') {
      cuerpo = `<section class="valorar-paso" aria-labelledby="v-menos"><h4 class="pregunta" id="v-menos" tabindex="-1">${fraseUnidad(def, 'cuantas')}</h4>
        ${items.map(({ c, i }) => `<div class="series-lado">${dosLados ? `<h5>${t(LADOS[c.lado])}</h5>` : ''}${sesion.hechas[i]
          .map((v, n) => {
            const cual = circuito ? t('Vuelta {n}', { n: n + 1 }) : t('Serie {n}', { n: n + 1 });
            const etiqueta = dosLados ? (circuito ? t('{lado}, vuelta {n}', { lado: t(LADOS[c.lado]), n: n + 1 }) : t('{lado}, serie {n}', { lado: t(LADOS[c.lado]), n: n + 1 })) : cual;
            return `<div class="serie-fila"><span>${cual}</span>${paso(`h-${i}-${n}`, v, etiqueta, 0, 50)}</div>`;
          })
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
    const faltan = [...new Set(cola.filter((c) => !dia.e.some((x) => x.i === c.e.i)).map((c) => EJERCICIOS[c.e.i].nombre))].map((n) => esc(t(n)));
    app.innerHTML = `<div class="rutina">
      <header class="saludo"><div class="de">${t('Hecho')}</div><h1>${parcial ? t('Lo de hoy, guardado') : t('Rutina de hoy, completa')}</h1>${
        parcial ? `<p>${t('Te faltó: {ejercicios}.', { ejercicios: faltan.join(', ') })}</p>` : ''
      }<p>${trabajo} ${textoFin(r)}</p></header>
      <section class="lista">${resumenDia(dia, tope)}${invitacion(r, 'fin')}</section>
      <footer class="pie">
        ${pieFin(r)}
      </footer>
    </div>`;
    alGuardar(clave);
  }

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
    if (alPulsarRutina(a, el, persona)) return;
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
        : `<div class="centro"><p>${t('¿Dejas la rutina aquí?')}</p><p>${textoDejar()}</p></div>
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
          ? `${masDelTope(r.de || t('quien te dio la rutina'))} ${t('La próxima vez, hazlo más suave o con menos repeticiones. Si es un dolor fuerte, para este ejercicio.')}`
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
      if (circuito) return pasarEnCircuito();
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

// A session belongs to the day it started, and one started before five in the morning to the night before: a routine
// done from 23:50 to 00:10, or at half past midnight, is that evening's, and the next morning's question finds it.
function diaDeSesion(inicio) {
  const d = new Date(inicio);
  if (d.getHours() < 5) d.setDate(d.getDate() - 1);
  return diaLocal(d);
}

// «jueves, 13 de noviembre», for the person's own days.
const fechaCorta = (f) => {
  const d = new Date(f + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? t('día sin fecha') : new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
};

// ---------- Without a connection ----------
// sw.js keeps the app. Each routine opened on the phone also keeps its body, clips and the three.js files, so the
// person can do it later with no signal. The answer says how many of the files are kept.
// Next to each body's cuerpo.glb: its clothes (ropa.png, outside the GLB so it loads from the site and not as a blob:,
// which the content policy blocks) and its drawn muscles: TEXTURAS in modelos/musculos.js (not imported here, so
// three.js does not load with the app's first screen).
const TEXTURAS_MUSCULOS = ['musculos-0.png', 'musculos-1.png', 'musculos-2.png', 'musculos-3.png', 'musculos-4.png', 'fibras.png'];
const MOTOR = [
  'vendor/three/three.module.js',
  'vendor/three/addons/loaders/GLTFLoader.js',
  'vendor/three/addons/controls/OrbitControls.js',
  'vendor/three/addons/utils/BufferGeometryUtils.js',
];

function registrarTrabajador() {
  if (!('serviceWorker' in navigator) || !INSTALABLE) return null;
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
  aviso.innerHTML = `<p>${textoSinSitio()}</p><button type="button" class="nueva-version-cerrar" aria-label="${t('Cerrar')}">${ICONO.cerrar}</button>`;
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
  const fichas = await Promise.all(ejercicios.map(({ i }) => (m.ejercicios[i] ? fetch(m._base + m.ejercicios[i].ficha).then((r) => r.json()).catch(() => null) : null)));
  const tope = Math.max(3, ...ejercicios.map((e) => e.r));
  const textosVoz = [...FRASES_GENERALES, ...Array.from({ length: Math.min(tope, 60) + 1 }, (_, n) => [numero(n), numero(n, true)]).flat(),
    ...fichas.flatMap((f) => (Array.isArray(f?.fases) ? f.fases.map((x) => x.texto).filter(Boolean) : [])),
    ...ejercicios.map(({ i }) => EJERCICIOS[i]?.nombre).filter(Boolean)];
  const voz = vozActiva() ? await rutasDeVoz(textosVoz).catch(() => []) : [];
  const rutas = [...new Set([...MOTOR, RUTAS[c] || RUTAS.a, m.cuerpo, m.cuerpo.replace(/cuerpo\.glb$/, 'ropa.png'),
    ...TEXTURAS_MUSCULOS.map((f) => m.cuerpo.replace(/cuerpo\.glb$/, 'musculos/') + f),
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
      ${PROGRAMAS.length ? `<section class="programas">
        <h2>${t('Programas de referencia')}</h2>
        <p class="ayuda">${t('Otago y Vivifrail, dos programas probados para prevenir caídas en personas mayores, con la dosis de partida de cada nivel. Se abren como una plantilla: cambia lo que haga falta antes de mandarla.')}</p>
        <ul class="lista-plantillas-app">${PROGRAMAS.map((p) => `<li class="plantilla-fila">
          <button type="button" class="plantilla-usar" data-accion="programa" data-id="${esc(p.id)}">
            <span class="nombre">${esc(t(p.nombre))}</span>
            <span class="meta">${esc(t(p.descripcion))} · ${tn(p.orden.length, '{n} ejercicio', '{n} ejercicios')}</span>
          </button>
        </li>`).join('')}</ul>
      </section>` : ''}
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
        if (borrada) alBorrarPlantilla(borrada.nombre);
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
  const h = await direccion(location.hash);
  marcoApp(h);
  if (h.startsWith('#r=')) limpiar = await vistaRutina(h.slice(3));
  else if (h === '#plantillas') limpiar = vistaPlantillas();
  else if (vista(h)) limpiar = await vista(h)();
  else {
    await antesDeArmar();
    limpiar = vistaArmar();
  }
}
window.addEventListener('hashchange', ir);
preparar({
  app, ICONO, esc, barraApp, botonNueva, segmentos, paso, avisoRoto, resumenDia, diaMarcado, listaDias, hashCorto, leerPlantillas, ponerAlDia, borradorInicial, rutinaAlBorrador,
  cargarManifiesto, ir,
});
// Before the first view: what is open here, or what this copy brings (entorno.js).
inicio().finally(ir);
