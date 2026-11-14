// Jepyso: the professional builds a routine, sends it as a link, the person does it with the 3D figure and sends
// back a summary link. No server: everything travels inside the links.
import {
  EJERCICIOS, ORDEN, ZONAS, MUSCULOS, buscarEjercicios, LADOS, TOPE_MOLESTIA, pasaDelTope, diaLocal, diaAnterior,
  codificar, decodificar, duracionEjercicio, minutos, almacen, BANDAS, conBanda, bandaDe, SIN_SITIO,
} from './datos.js';
import { limpiarRutina, limpiarResumen, limpiarPlantilla, limpiarPlantillas } from './entrada.js';
import { hayVoz, vozActiva, ponerVoz, decir, callar, numero, modoVoz } from './voz.js';
import {
  leerPersonas, guardarPersonas, buscarPorNombre, crearPersona, apuntarRutina, apuntarResumen, semanas, copia, cargarCopia, caben, limite,
  esDePago, esEntornoDePruebas, leerBorradas, apuntarBorrada, LIMITE_GRATIS,
} from './personas.js';
import { conectar, sincronizar, cuentaDrive, olvidar } from './drive.js';
import { comprobarLicencia, licencia, licenciaPendiente, guardarLicencia, cuentaDelDrive } from './licencia.js';
import {
  valesEnMarcha, fichaAbierta, fichaSinPlaza, cuentaDeVales, fichasQuedan, avisoVales, alCambiarVales, comprobarVales, pedirVale, pedirVales,
  soltarVale, botonGoogle,
} from './vales.js';
import { MAPA, PUNTOS } from './mapa.js';
import { medida, dibujar, actualizar } from './goniometro.js';

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
  // Oksigenia's accessibility sign, the one the panel's own button wears on every Oksigenia website.
  acceso: '<svg viewBox="0 0 122.88 122.88" fill="currentColor"><path d="M61.44,0A61.46,61.46,0,1,1,18,18,61.21,61.21,0,0,1,61.44,0Zm-.39,74.18L52.1,98.91a4.94,4.94,0,0,1-2.58,2.83A5,5,0,0,1,42.7,95.5l6.24-17.28a26.3,26.3,0,0,0,1.17-4,40.64,40.64,0,0,0,.54-4.18c.24-2.53.41-5.27.54-7.9s.22-5.18.29-7.29c.09-2.63-.62-2.8-2.73-3.3l-.44-.1-18-3.39A5,5,0,0,1,27.08,46a5,5,0,0,1,5.05-7.74l19.34,3.63c.77.07,1.52.16,2.31.25a57.64,57.64,0,0,0,7.18.53A81.13,81.13,0,0,0,69.9,42c.9-.1,1.75-.21,2.6-.29l18.25-3.42A5,5,0,0,1,94.5,39a5,5,0,0,1,1.3,7,5,5,0,0,1-3.21,2.09L75.15,51.37c-.58.13-1.1.22-1.56.29-1.82.31-2.72.47-2.61,3.06.08,1.89.31,4.15.61,6.51.35,2.77.81,5.71,1.29,8.4.31,1.77.6,3.19,1,4.55s.79,2.75,1.39,4.42l6.11,16.9a5,5,0,0,1-6.82,6.24,4.94,4.94,0,0,1-2.58-2.83L63,74.23,62,72.4l-1,1.78Zm.39-53.52a8.83,8.83,0,1,1-6.24,2.59,8.79,8.79,0,0,1,6.24-2.59Zm36.35,4.43a51.42,51.42,0,1,0,15,36.35,51.27,51.27,0,0,0-15-36.35Z"/></svg>',
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
const textoTempo = ([s, m, b]) => (m ? `Ida en ${s} s, mantén ${m} s, vuelta en ${b} s` : `Ida en ${s} s, vuelta en ${b} s`);
// The same, with the exercise's own words when its sheet has them («Sube la cadera en 2 s, aguanta arriba 1 s…»).
const pautaTempo = (t, tempo) => (t?.subir && t?.bajar
  ? `${t.subir} en ${tempo[0]} s${tempo[1] ? `, ${(t.mantener || 'mantén').toLowerCase()} ${tempo[1]} s` : ''}, ${t.bajar.toLowerCase()} en ${tempo[2]} s`
  : textoTempo(tempo));
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

// ---------- The professional's app ----------
// The professional's side is an app for the phone and the tablet (Enrique, 11 November 2026): a tab bar at the foot of
// the phone, a rail at the side of a tablet, a bar on top with the title and, inside a file, the way back. The person's
// routine (#r=) has none of it, and no manifest: installed from there, its icon would open the builder, not the routine.
const PESTANAS = [['#', 'Nueva rutina', 'mas'], ['#personas', 'Personas', 'personas'], ['#plantillas', 'Plantillas', 'plantillas']];
let pestanas = null;
let firmaPro = null;

// Oksigenia signs every website it makes (shared/sitios-publicos.md): the line with its link, and beside it the button
// that opens the accessibility panel (index.html). The professional has it at the foot of the rail, or at the end of
// the page on a phone; the person, quiet at the end of the list, under the routine and away from «Empezar».
const FIRMA = '<p class="firma-linea">Jepyso · un producto de <a href="https://oksigenia.com">Oksigenia</a></p>';
const botonAcceso = `<button type="button" class="firma-acceso" data-acceso aria-haspopup="dialog">${ICONO.acceso}<span>Accesibilidad</span></button>`;
const firmaPersona = `<div class="firma firma-persona">${botonAcceso}${FIRMA}</div>`;
document.addEventListener('click', (ev) => {
  if (ev.target.closest?.('[data-acceso]')) document.querySelector('oksigenia-access-panel')?.open?.();
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
      ([href, texto, icono]) => `<a href="${href}" data-pestana="${href}">${ICONO[icono]}<span>${texto}</span></a>`,
    ).join('')}`;
    document.body.append(pestanas);
    firmaPro = document.createElement('footer');
    firmaPro.className = 'firma firma-pro';
    firmaPro.innerHTML = botonAcceso + FIRMA;
    document.body.append(firmaPro);
  }
  if (firmaPro) firmaPro.hidden = !pro;
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
  if (esDePago()) return `<p class="capacidad"><span><b>${n}</b> ${n === 1 ? 'persona' : 'personas'} con ficha · sin límite</span></p>`;
  const max = limite();
  const marcas = Array.from({ length: max }, (_, i) => `<i${i < n ? ' class="usada"' : ''}></i>`).join('');
  return `<p class="capacidad${n >= max ? ' llena' : ''}"><span class="capacidad-marcas" aria-hidden="true">${marcas}</span>
    <span><b>${Math.min(n, max)} de ${max}</b> personas con ficha${n >= max ? '. Las rutinas para alguien nuevo van igual, sin ficha' : ''} · la versión de pago no tiene límite</span></p>`;
}
// The line of the link sheet about the file. A free file whose ticket waits for the Google sign-in says so.
function enFicha(p, esperaCuenta) {
  if (esperaCuenta) return `Guardada en la ficha de ${esc(p.nombre)}. Para abrirla, entra con tu cuenta de Google en <a href="#personas">Mis personas</a>.`;
  return `Guardada en la ficha de ${esc(p.nombre)}. <a href="#persona=${esc(p.id)}">Ver su ficha</a>`;
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
  return { series: d.series, reps: d.reps, tempo: [...d.tempo], lado: EJERCICIOS[id].unLado ? 'der' : null, banda: '', nota: '' };
}

function borradorInicial() {
  return {
    para: '', de: '', descanso: 45, veces: 1, tope: TOPE_MOLESTIA, cuerpo: 'a',
    activo: ORDEN[0], orden: [], ejercicios: {}, filtro: { zona: '', musculo: '', texto: '' },
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
  // The draft lives in this browser's storage, which other pages of the same origin can write (on the bench): its
  // settings go through the same cleaning as a template.
  const limpia = limpiarPlantilla({ nombre: 'borrador', d: b.descanso, x: b.veces, m: b.tope, c: b.cuerpo, orden: Object.keys(b.ejercicios), ejercicios: b.ejercicios });
  Object.assign(b, { descanso: limpia.d, veces: limpia.x, tope: limpia.m, cuerpo: limpia.c, ejercicios: limpia.ejercicios });
  b.para = typeof b.para === 'string' ? b.para : '';
  b.de = typeof b.de === 'string' ? b.de : '';
  return b;
}

function paso(accion, valor, etiqueta, min, max) {
  return `<div class="paso" role="group" aria-label="${esc(etiqueta)}">
    <button type="button" data-accion="${accion}" data-delta="-1" aria-label="Menos" ${valor <= min ? 'disabled' : ''}>−</button>
    <output class="num">${esc(valor)}</output>
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
    ${def.cuidado ? `<p class="cuidado"><strong>Cuidado.</strong> ${esc(def.cuidado)}</p>` : ''}
    <p class="parar">${PARAR}</p>
  </div>`;
}

// When to stop, the same for every exercise (the guides behind the library and the Otago programme): it completes the
// pain-monitoring model, which only covers the expected discomfort.
const PARAR = 'Para y avisa a quien te dio la rutina si notas un dolor fuerte o distinto del de siempre, mareo, dolor en el pecho, falta de aire, u hormigueo o dolor que baja por un brazo o una pierna.';

// The colour of the band, as a small strip of it beside its name.
const muestraBanda = (banda) => `<i class="muestra-banda banda-${banda.clave}" aria-hidden="true"></i>`;

// The professional picks the colour of the band they gave the person: one strip per colour, and «Sin indicar».
function eleccionBanda(e) {
  return `<div class="ajuste"><span>Color de la banda</span><div class="bandas" role="group" aria-label="Color de la banda">${Object.entries(BANDAS)
    .map(([k, v]) => `<button type="button" class="banda banda-${k}" data-accion="banda" data-valor="${k}" aria-pressed="${e.banda === k}" aria-label="${esc(v.nombre)}" title="${esc(v.nombre)}"></button>`)
    .join('')}<button type="button" class="banda-sin" data-accion="banda" data-valor="" aria-pressed="${!e.banda}">Sin indicar</button></div></div>`;
}

const chipsEjercicio = (def) =>
  `<span class="chip">${esc(def.posicion)}</span><span class="chip">${esc(def.material)}</span>${def.musculos.principales
    .map((mu) => `<span class="chip vivo">${esc(MUSCULOS[mu] || mu)}</span>`)
    .join('')}`;

// What a folded card says: sets and repetitions, the tempo line, the side and the band.
function dosis(def, e) {
  const banda = bandaDe(def, e.banda);
  return `<span class="num">${e.series} × ${e.reps}</span>${svgTempo(e.tempo, { ancho: 52, alto: 22 })}<span class="sr">${textoTempo(e.tempo)}</span>${
    def.unLado && LADOS[e.lado] ? `<span>${esc(LADOS[e.lado])}</span>` : ''
  }${banda ? `<span class="con-banda">${muestraBanda(banda)}${esc(banda.nombre)}</span>` : ''}`;
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
        <div class="ajuste"><span>Series</span>${paso('series', e.series, 'Series', 1, 6)}</div>
        <div class="ajuste"><span>Repeticiones</span>${paso('reps', e.reps, 'Repeticiones', 1, 30)}</div>
        ${def.unLado ? `<div class="ajuste"><span>Lado</span>${segmentos('lado', [['der', 'Derecho'], ['izq', 'Izquierdo'], ['ambos', 'Los dos']], e.lado)}</div>` : ''}
      </div>
      ${conBanda(def) ? eleccionBanda(e) : ''}
      <div class="ajuste">
        <span>Ritmo de cada repetición</span>
        <div class="ritmo">
          <div class="ritmo-mini"><span>Ida</span>${paso('t0', s, 'Segundos de ida', 1, 6)}</div>
          <div class="ritmo-mini"><span>Mantén</span>${paso('t1', m, 'Segundos manteniendo', 0, 30)}</div>
          <div class="ritmo-mini"><span>Vuelta</span>${paso('t2', b, 'Segundos de vuelta', 1, 6)}</div>
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

function seccionRutina(b, vaciada = null) {
  return `<section class="rutina-armada" aria-labelledby="rutina-titulo">
    <h2 id="rutina-titulo">La rutina</h2>
    ${b.orden.length ? '<button type="button" class="boton fantasma vaciar" data-accion="vaciar">Vaciar</button>' : ''}
    ${vaciada ? `<p class="vaciada" role="status">Rutina vaciada. <button type="button" class="enlace" data-accion="deshacer-vaciar">Deshacer</button></p>` : ''}
    ${
      b.orden.length
        ? b.orden.map((id, i) => tarjetaEjercicio(id, b.ejercicios[id], id === b.activo, i, b.orden.length)).join('')
        : '<p class="rutina-vacia">Todavía no tiene ejercicios.</p>'
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
const POSICIONES = ['De pie', 'Sentado', 'Sentado a la mesa', 'Sentado en el suelo', 'Boca arriba', 'Boca abajo', 'De lado', 'A cuatro patas'];
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
          // Where the point goes, as data: a style attribute would be blocked by a strict host (style-src 'self');
          // colocarPuntos() sets it from script after the map is drawn.
          const sitio = `data-x="${((x / ancho) * 100).toFixed(2)}" data-y="${((y / alto) * 100).toFixed(2)}"`;
          const nombre = esc(ZONAS[z]);
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
    <div class="biblio-arriba">
      <div class="biblio-cabeza">
        <button type="button" class="biblio-cerrar" data-accion="cerrar-biblioteca" aria-label="Volver a la rutina">${ICONO.volver}</button>
        <h2 id="biblio-titulo" tabindex="-1">Añadir ejercicios</h2>
        <span class="biblio-cuenta num" aria-live="polite">${cuentaBiblioteca(b)}</span>
      </div>
      <div class="biblio-filtros">
        <input type="search" class="buscar" data-accion="buscar" autocomplete="off" placeholder="Buscar por nombre" aria-label="Buscar ejercicios por nombre" value="${esc(b.filtro.texto)}">
      <label class="campo-musculo"><span>Músculo</span>
        <select data-accion="musculo">
          <option value="">Todos los músculos</option>
          ${musculos.map((mu) => `<option value="${mu}" ${b.filtro.musculo === mu ? 'selected' : ''}>${esc(MUSCULOS[mu])}</option>`).join('')}
        </select>
      </label>
        <button type="button" class="boton secundario biblio-ver-mapa" data-accion="ver-mapa" aria-expanded="false" aria-controls="hueco-mapa">${ICONO.cuerpo}<span>En la figura</span></button>
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
    app.innerHTML = `<div class="armar${b.orden.length ? '' : ' sin-ejercicios'}">
      <div class="armar-biblio">${seccionBiblioteca(b)}</div>
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
            <button type="button" class="anadir-ejercicio" data-accion="abrir-biblioteca" aria-haspopup="dialog">${ICONO.mas}<span>Añadir ejercicio</span></button>
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
          <button type="button" class="boton anadir-en-barra" data-accion="abrir-biblioteca" aria-haspopup="dialog">${ICONO.mas}Añadir ejercicio</button>
        </div>
      </div>
      <aside class="vista">
        <h2>Así lo verá</h2>
        <div class="vista-figura"></div>
        <div class="vista-pie"></div>
      </aside>
    </div>`;
    colocarPuntos(app);
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
      // Another exercise tapped meanwhile: that call shows it, this one stops here.
      if ((await f.poner(id, { tempo: e.tempo, lado: e.lado === 'izq' ? 'izq' : 'der', banda: bandaDe(EJERCICIOS[id], e.banda)?.color })) === false) return;
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
      nombre, cambiada: new Date().toISOString(), d: b.descanso, x: b.veces, m: b.tope, c: b.cuerpo, orden: [...b.orden],
      ejercicios: Object.fromEntries(b.orden.map((id) => [id, JSON.parse(JSON.stringify(b.ejercicios[id]))])),
    });
    almacen.guardar('plantillas', lista.slice(0, 60));
    refrescarPlantillas();
  }

  // «Hecho: empezar otra», from the sheet of the link: a clean routine for the next person. Their name, their file and
  // the exercises go; «De» and the settings for the whole routine stay, as they are the professional's.
  function empezarOtra() {
    Object.assign(b, { para: '', persona: undefined, orden: [], ejercicios: {}, filtro: { zona: '', musculo: '', texto: '' } });
    vaciada = null;
    guardar();
    apartarLienzo(app);
    pintar();
    window.scrollTo(0, 0);
    app.querySelector('#para')?.focus({ preventScroll: true });
  }

  function usarPlantilla(p) {
    Object.assign(b, { descanso: p.d, veces: p.x, tope: p.m ?? TOPE_MOLESTIA, cuerpo: p.c || 'a' });
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
      crearEnlace(b, empezarOtra);
    } else if (a === 'vaciar') {
      // Emptying keeps each exercise's settings, so «Deshacer» brings the routine back exactly.
      vaciada = { orden: [...b.orden], activo: b.activo };
      b.orden = [];
      refrescarRutina();
      refrescarBiblioteca();
      colocarFigura();
      app.querySelector('[data-accion="deshacer-vaciar"]')?.focus({ preventScroll: true });
    } else if (a === 'deshacer-vaciar') {
      if (vaciada) Object.assign(b, vaciada);
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
      return { i: id, s: e.series, r: e.reps, t: e.tempo, l: e.lado, b: bandaDe(EJERCICIOS[id], e.banda)?.clave, n: e.nota.trim() || undefined };
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
  const saludo = rutina.para ? `Hola, ${rutina.para}. ` : '';
  const mensaje = `${saludo}Aquí tienes tu rutina de ejercicios. Ábrela en tu teléfono y sigue a la figura:`;

  let qr = '';
  try {
    const q = window.qrcode(0, 'L');
    q.addData(url);
    q.make();
    qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch {
    qr = '<p>El enlace es demasiado largo para un código QR.</p>';
  }

  // The sheet of the link: first what sends it (WhatsApp, Telegram, copy), under the message as it will arrive; the
  // code and the address folded, open by default on a computer, where the person scans it in the consultation. A
  // <dialog>: its ×, Escape and the phone's «back» close it, and the focus goes back to «Crear enlace».
  const nombre = rutina.para ? esc(rutina.para) : '';
  const dialogo = document.createElement('dialog');
  dialogo.className = 'hoja hoja-enlace';
  dialogo.setAttribute('aria-labelledby', 'hoja-titulo');
  dialogo.innerHTML = `<div class="hoja-cabeza"><h2 id="hoja-titulo" tabindex="-1">La rutina, lista</h2>
      <button type="button" class="redondo" data-h="cerrar" aria-label="Cerrar">${ICONO.cerrar}</button></div>
    ${persona ? `<p class="en-ficha">${enFicha(persona, sinVale && !cuentaDeVales())}</p>` : ''}
    ${sinSitio === 'lleno' ? `<p class="en-ficha">${SIN_SITIO} La rutina va igual en el enlace.</p>` : ''}
    ${sinSitio === 'elegir' ? `<p class="en-ficha">Tienes más de una ficha con el nombre ${esc(rutina.para)}: elige cuál en «Para» y vuelve a crear el enlace para guardarla en su ficha. La rutina va igual en este enlace.</p>` : ''}
    ${sinSitio === true ? `<p class="en-ficha">No se guarda en una ficha: ya tienes ${limite()} personas con ficha, el máximo de la versión gratis. La rutina va igual en el enlace. Para guardar a más personas, la versión de pago no tiene límite.</p>` : ''}
    <figure class="burbuja"><figcaption>${nombre ? `Así le llega a ${nombre}` : 'Así llega'}</figcaption><p>${esc(mensaje)} <span class="burbuja-enlace">${esc(location.host)}/…</span></p></figure>
    <div class="hoja-mandar">
      <a class="boton" href="${esc(enlaceMensaje('wa', mensaje, url))}" target="_blank" rel="noopener">${ICONO.whatsapp}Mandar por WhatsApp</a>
      <a class="boton" href="${esc(enlaceMensaje('tg', mensaje, url))}" target="_blank" rel="noopener">${ICONO.telegram}Mandar por Telegram</a>
      <button type="button" class="boton secundario" data-h="copiar">Copiar enlace</button>
    </div>
    <a class="boton fantasma hoja-ver" href="${esc(url)}" target="_blank" rel="noopener">${nombre ? `Ver la rutina como ${nombre}` : 'Ver la rutina como la persona'}</a>
    <details class="hoja-mas"${window.matchMedia('(min-width: 700px)').matches ? ' open' : ''}><summary>El código QR y el enlace</summary>
      <div class="qr">${qr}</div>
      <div class="enlace-texto">${esc(url)}</div>
    </details>
    <p class="hoja-pie">Cuando la haga, te mandará su resumen: ábrelo en este aparato y se guarda en su ficha. Todo va dentro del enlace: no pasa por ningún servidor de Oksigenia.</p>
    ${empezarOtra ? `<button type="button" class="boton secundario hoja-otra" data-h="otra">Hecho: empezar otra rutina</button>` : ''}`;
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
      else if (fichaSinPlaza(persona.id)) linea.textContent = `Guardada en la ficha de ${persona.nombre}, pero tu cuenta de Google ya tiene sus ${LIMITE_GRATIS} fichas gratis: esta no se abrirá hasta que borres otra. La rutina va igual en el enlace.`;
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
  let r = null;
  try {
    r = limpiarRutina(await decodificar(codigo));
  } catch {
    // Read below as a link that cannot be opened.
  }
  if (!r) {
    app.innerHTML = `<div class="saludo"><h1>Este enlace no se puede abrir</h1><p>Pide que te lo vuelvan a mandar.</p></div>${firmaPersona}`;
    return () => {};
  }
  hayVoz(); // the list of voices fills while the person reads the routine
  const ejercicios = r.e.filter((e) => EJERCICIOS[e.i]);
  if (!ejercicios.length) {
    app.innerHTML = `<div class="saludo"><h1>Este enlace no trae ejercicios que se puedan abrir</h1><p>Pide que te lo vuelvan a mandar.</p></div>${firmaPersona}`;
    return () => {};
  }
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

  // What has been done goes back from a card in the list, once there is something done; the foot keeps «Empezar» alone.
  function pintarPie(hist) {
    const sitio = app.querySelector('.mandar-sitio');
    if (!sitio) return;
    // The last days, each with «Corregir»; and a session done without the app can be noted too.
    const recientes = hist.map((d, k) => ({ d, k })).slice(-7).reverse();
    const fila = ({ d, k }) => `<li><span>${esc(fechaCorta(d.f))}${d.h ? ` · ${esc(d.h)}` : ''}${d.sinApp ? ' · sin la app' : ''}</span>
        <button type="button" class="enlace" data-r="corregir" data-k="${k}">Corregir</button></li>`;
    sitio.innerHTML = `<section class="tarjeta mandar-hecho" aria-labelledby="mandar-titulo">
        <h3 id="mandar-titulo">Lo que llevas hecho</h3>
        ${hist.length ? `<ul class="dias-hechos">${recientes.map(fila).join('')}</ul>
        <p>Mándaselo a ${quien}: así ve cómo te va y te ajusta la rutina.</p>
        <div class="dos-botones"><button type="button" class="boton secundario" data-r="mandar" data-canal="wa">${ICONO.whatsapp}WhatsApp</button>
        <button type="button" class="boton secundario" data-r="mandar" data-canal="tg">${ICONO.telegram}Telegram</button></div>` : '<p>Todavía nada.</p>'}
        <button type="button" class="enlace" data-r="sin-app">Apuntar una vez que la hice sin la app</button>
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
        ${r.de ? `<div class="de">Tu rutina de ${esc(r.de)}</div>` : ''}
        <h1>${r.para ? `Hola, ${esc(r.para)}` : 'Tu rutina'}</h1>
        ${r.x > 1 ? `<p class="veces-hoy"><span class="casillas" aria-hidden="true">${Array.from({ length: r.x }, (_, n) => `<i${n < vecesHoy ? ' class="hecha"' : ''}></i>`).join('')}</span>Hoy: ${Math.min(vecesHoy, r.x)} de ${r.x} veces</p>` : ''}
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
            const material = [banda ? `<span class="con-banda">${muestraBanda(banda)}${esc(banda.nombre)}</span>` : def.material !== 'Sin material' ? esc(def.material) : '', def.unLado && LADOS[e.l] ? esc(LADOS[e.l]) : '']
              .filter(Boolean).join(' · ');
            return `<article class="tarjeta tarjeta-ejercicio" data-i="${e.i}" data-t="${e.t.join(',')}">
              <div class="tarjeta-cabeza">
                <span class="tarjeta-poster"><img src="${poster(e.i, r.c, banda?.clave)}" alt="" width="112" height="84" decoding="async"${e.l === 'izq' ? ' class="espejo"' : ''}></span>
                <div>
                  <h3>${esc(def.nombre)}</h3>
                  <p class="tarjeta-dosis num">${e.s} ${e.s === 1 ? 'serie' : 'series'} · ${e.r} ${e.r === 1 ? 'repetición' : 'repeticiones'}</p>
                </div>
              </div>
              <p class="tarjeta-pauta">${esc(textoTempo(e.t))}</p>
              ${material ? `<p class="tarjeta-material">${material}</p>` : ''}
              ${e.n ? `<div class="nota">${esc(e.n)}</div>` : ''}
            </article>`;
          })
          .join('')}
        <section class="tarjeta recordatorio" aria-labelledby="recordar-titulo">
          <h3 id="recordar-titulo">Que no se te olvide</h3>
          <p>Pon un aviso cada día en el calendario de tu teléfono, con el enlace a esta rutina.</p>
          <div class="recordatorio-fila">
            <label class="hora"><span>A las</span><input type="time" value="10:00" data-r="hora-recordatorio"></label>
            <button type="button" class="boton secundario" data-r="recordatorio">Añadir al calendario</button>
          </div>
          <p class="recordatorio-hecho" aria-live="polite"></p>
        </section>
        <p class="sin-conexion" aria-live="polite"></p>
        ${firmaPersona}
      </section>
      <footer class="pie pie-fijo">
        ${ejercicios[0] ? `<span class="pie-poster" aria-hidden="true"><img src="${poster(ejercicios[0].i, r.c, bandaDe(EJERCICIOS[ejercicios[0].i], ejercicios[0].b)?.clave)}" alt="" width="112" height="84" decoding="async"${ejercicios[0].l === 'izq' ? ' class="espejo"' : ''}></span>` : ''}
        <p class="pie-resumen num">${ejercicios.length} ${ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'} · ${minutos(totalSeg)}</p>
        ${(() => {
          const c = enCurso();
          return c
            ? `<button type="button" class="boton" data-r="seguir-donde">${ICONO.play}Seguir donde lo dejaste</button>
               <button type="button" class="boton fantasma" data-r="empezar">Empezar desde el principio</button>`
            : `<button type="button" class="boton" data-r="empezar">${ICONO.play}Empezar</button>`;
        })()}
        <div class="a-grupo">
          <button type="button" class="boton secundario" data-r="grupo">${ICONO.pantalla}Ponerla en pantalla grande</button>
          <p>Para seguirla en grupo en una tele, un proyector o una pizarra. Sin preguntas a nadie y sin guardar nada.</p>
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
    if (p) p.textContent = 'Guardada en este teléfono: puedes hacerla aunque no tengas conexión.';
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
      app.querySelector('.j-nombre').textContent = EJERCICIOS[e.i].nombre;
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
      ? `<button type="button" class="redondo" data-r="completa" aria-pressed="${!!document.fullscreenElement}" aria-label="Pantalla completa">${document.fullscreenElement ? ICONO.salirCompleta : ICONO.completa}</button>`
      : '';
    app.innerHTML = `<div class="jugador${grupo ? ' grupo' : ''}">
      <div class="jugador-arriba">
        <button type="button" class="redondo" data-r="salir" aria-label="Salir">${ICONO.cerrar}</button>
        <div class="titulo"><h2 class="j-nombre"></h2><div class="sub j-sub num"></div></div>
        ${hayVoz() ? `<button type="button" class="redondo" data-r="voz" aria-pressed="${vozActiva()}" aria-label="Voz que guía">${vozActiva() ? ICONO.voz : ICONO.sinVoz}</button>` : ''}
        ${completa}
      </div>
      <div class="escena">
        <span class="chip lado-etiqueta j-lado oculto"></span>
        <div class="girar-pista">${ICONO.girar} Arrastra para girar la figura</div>
        <button type="button" class="recolocar oculto" data-r="recolocar">${ICONO.girar}Recolocar</button>
      </div>
      <div class="mando j-mando"></div>
    </div>`;
  }

  const actual = () => cola[sesion.item];
  // Under the name: the set, and the band to use when the professional said its colour.
  const subtitulo = (e, serie) => {
    const banda = bandaDe(EJERCICIOS[e.i], e.b);
    return `Serie ${serie} de ${e.s}${banda ? ` · ${banda.nombre.toLowerCase()}` : ''}`;
  };

  async function prepararSerie() {
    const item = sesion.item;
    app.querySelector('.jugador')?.classList.remove('valorando');
    const { e, lado } = actual();
    const def = EJERCICIOS[e.i];
    const banda = bandaDe(def, e.b);
    app.querySelector('.j-nombre').textContent = def.nombre;
    app.querySelector('.j-sub').textContent = subtitulo(e, sesion.serie + 1);
    const etiquetaLado = app.querySelector('.j-lado');
    etiquetaLado.textContent = LADOS[lado];
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
    } catch {
      // No connection and the figure not kept yet, or a phone without the 3D it needs: say so, with a way on.
      if (sesion.item !== item) return;
      const sin3d = !document.createElement('canvas').getContext('webgl2');
      const porque = sin3d ? 'Este teléfono no puede mover la figura en 3D.' : 'Revisa la conexión y prueba otra vez.';
      app.querySelector('.j-mando').innerHTML = `<div class="centro"><p>No se ha podido cargar la figura.</p><p>${porque}</p></div>
        <div class="mando-botones"><button type="button" class="boton fantasma" data-r="como">Cómo se hace</button><button type="button" class="boton" data-r="reintentar">Probar otra vez</button><span></span></div>`;
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
    app.querySelector('.j-sub').textContent = `Ejercicio ${ejercicios.indexOf(e) + 1} de ${ejercicios.length}`;
    const material = banda
      ? `${muestraBanda(banda)}${esc(banda.nombre.toLowerCase())}`
      : def.material && def.material !== 'Sin material' ? esc(def.material[0].toLowerCase() + def.material.slice(1)) : '';
    app.querySelector('.j-mando').innerHTML = `<div class="prepara">
        <h3 class="prepara-titulo">${grupo ? 'Posición de partida' : 'Ponte en posición'}</h3>
        <p class="prepara-partida">${esc(def.partida)}</p>
        ${material ? `<p class="prepara-material"><span>${grupo ? 'Hace falta' : 'Necesitas'}</span> ${material}</p>` : ''}
      </div>
      <div class="prepara-botones">
        <button type="button" class="boton" data-r="en-posicion">${grupo ? 'Todos en posición' : 'Estoy en posición'}</button>
        <button type="button" class="boton secundario" data-r="como">Cómo se hace</button>
      </div>`;
    if (grupo) decir(def.nombre);
  }

  function cuentaAtras(n) {
    sesion.estado = 'cuenta';
    const mando = app.querySelector('.j-mando');
    const { e } = actual();
    const pauta = pautaTempo(figura?.textos, e.t);
    mando.innerHTML = `<div class="centro"><p>Prepárate</p><h3 class="num cuenta-atras">${n}</h3><p>${esc(pauta)}</p></div>
      <div class="mando-botones"><button type="button" class="boton fantasma" data-r="como">Cómo se hace</button><span></span><button type="button" class="boton fantasma" data-r="ya">Empezar ya</button></div>`;
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
    mando.innerHTML = `<div class="cuenta">
        <div class="grande num"><span class="j-rep">1</span> <small>de ${e.r}</small></div>
        <div class="fase j-fase">${esc(figura?.textos?.subir || 'Ida')}</div>
      </div>
      ${svgTempo(e.t, { punto: true })}
      <div class="mando-botones mando-serie">
        <button type="button" class="boton secundario" data-r="como">Cómo se hace</button>
        <button type="button" class="principal" data-r="pausa" aria-pressed="false">${ICONO.pausa}<span>Pausa</span></button>
        <button type="button" class="boton secundario" data-r="saltar">Terminar serie</button>
      </div>`;
    const svg = mando.querySelector('.tempo');
    const elFase = mando.querySelector('.j-fase');
    const elRep = mando.querySelector('.j-rep');
    const nombres = { subir: 'Ida', mantener: 'Mantén', bajar: 'Vuelta', reposo: 'Respira', ...figura.textos };
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
    f.on('repeticion', (n) => {
      sesion.hechas[sesion.item][sesion.serie] = n;
      elRep.textContent = Math.min(n + 1, e.r);
      vibrar(25);
      if (n > 0) {
        primeraRep = false;
        decir(numero(n));
      }
    });
    f.on('fin', () => {
      decir(`${numero(e.r)}. Hecho`);
      sesion.hechas[sesion.item][sesion.serie] = e.r;
      tono(660, 0.12);
      setTimeout(() => tono(990, 0.25), 130);
      vibrar([40, 60, 40]);
      siguiente();
    });
    f.empezar({ modo: 'serie', reps: e.r });
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
    app.querySelector('.j-nombre').textContent = r.de ? `Rutina de ${r.de}` : 'La rutina';
    app.querySelector('.j-sub').textContent = `${ejercicios.length} ${ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}`;
    app.querySelector('.j-mando').innerHTML = `<div class="grupo-fin">
        <h3>Rutina terminada</h3>
        <p class="num">${duro[0].toUpperCase() + duro.slice(1)} de trabajo.</p>
      </div>
      <div class="prepara-botones">
        <button type="button" class="boton" data-r="grupo-otra">${ICONO.play}Otra vez</button>
        <button type="button" class="boton secundario" data-r="dejar">Salir</button>
      </div>`;
    tono(660, 0.12);
    setTimeout(() => tono(990, 0.25), 130);
    decir('Rutina terminada. Buen trabajo.');
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
    decir(cambiaLado ? 'Descansa. Ahora, el otro lado' : 'Descansa');
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
      app.querySelector('.j-sub').textContent = subtitulo(e, 1);
      app.querySelector('.j-lado').textContent = LADOS[lado];
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
        <h4 class="pregunta-suave" id="v-extra">¿Algo más para ${quien}? <span>Si quieres</span></h4>
        <div class="chips-elegir" role="group" aria-labelledby="v-extra">${boton('cuesta', 'Me ha costado')}${boton('no', 'No he podido hacerlo')}</div>
        <label class="nota-persona"><span>Una nota</span><textarea data-r="nota-ejercicio" rows="2" maxlength="300" placeholder="Por ejemplo: me molestó la rodilla al bajar">${esc(x.n || '')}</textarea></label>
      </section>`;
  }

  function valorar() {
    sesion.estado = 'valorar';
    sesion.paso ||= 'reps';
    clearInterval(sesion.reloj);
    figura?.parar();
    app.querySelector('.jugador')?.classList.add('valorando');
    const { e } = actual();
    app.querySelector('.j-sub').textContent = `Ejercicio ${ejercicios.indexOf(e) + 1} de ${ejercicios.length}`;
    const def = EJERCICIOS[e.i];
    const banda = bandaDe(def, e.b);
    const items = cola.map((c, i) => ({ c, i })).filter(({ c }) => c.e === e);
    const dosLados = items.length > 1;
    const ultimo = sesion.item + 1 >= cola.length;
    const seguir = ultimo ? 'Terminar' : 'Siguiente ejercicio';
    const lado = (c) => `<img src="${poster(e.i, r.c, banda?.clave)}" alt="" width="112" height="84" decoding="async"${c.lado === 'izq' ? ' class="espejo"' : ''}>`;
    const cabeza = `<div class="valorar-cabeza"><span class="tarjeta-poster">${lado(items[0].c)}</span>
      <div><h3>Hecho</h3><p class="num">${e.s} ${e.s === 1 ? 'serie' : 'series'}${dosLados ? ' de cada lado' : ''} · ${e.r} repeticiones</p></div></div>`;
    let cuerpo = '';
    let pie = '';
    if (sesion.paso === 'reps') {
      cuerpo = `<section class="valorar-paso" aria-labelledby="v-reps"><h4 class="pregunta" id="v-reps" tabindex="-1">¿Hiciste todas las repeticiones?</h4>
        <div class="dos-botones"><button type="button" class="boton" data-r="todas">Sí, todas</button><button type="button" class="boton secundario" data-r="menos">Hice menos</button></div></section>`;
    } else if (sesion.paso === 'menos') {
      cuerpo = `<section class="valorar-paso" aria-labelledby="v-menos"><h4 class="pregunta" id="v-menos" tabindex="-1">¿Cuántas hiciste en cada serie?</h4>
        ${items.map(({ c, i }) => `<div class="series-lado">${dosLados ? `<h5>${LADOS[c.lado]}</h5>` : ''}${sesion.hechas[i]
          .map((v, n) => `<div class="serie-fila"><span>Serie ${n + 1}</span>${paso(`h-${i}-${n}`, v, `${dosLados ? LADOS[c.lado] + ', s' : 'S'}erie ${n + 1}`, 0, 50)}</div>`)
          .join('')}</div>`).join('')}</section>`;
      pie = `<button type="button" class="boton" data-r="reps-listo">Listo</button>`;
    } else {
      const todas = items.every(({ i }) => sesion.hechas[i].every((v) => v >= e.r));
      const marcada = Number.isInteger(sesion.molestia[e.i]);
      cuerpo = `<p class="valorar-hecho">${todas ? 'Todas las repeticiones' : 'Hiciste menos repeticiones'} <button type="button" class="enlace" data-r="menos">Cambiar</button></p>
        <section class="valorar-paso" aria-labelledby="v-molestia"><h4 class="pregunta" id="v-molestia" tabindex="-1">¿Cuánta molestia notaste?</h4>
        <div class="escala" role="group" aria-labelledby="v-molestia">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-r="molestia" data-v="${n}" aria-pressed="${sesion.molestia[e.i] === n}" class="num">${n}</button>`).join('')}</div>
        <div class="escala-pie"><span>0 · nada</span><span>10 · mucha</span></div>
        <p class="aviso-molestia" aria-live="polite"></p></section>
        ${extraValorar(e)}`;
      pie = `<button type="button" class="boton" data-r="continuar"${marcada ? '' : ' aria-disabled="true"'} data-seguir="${seguir}">${marcada ? seguir : 'Marca tu molestia para seguir'}</button>
        <button type="button" class="boton fantasma" data-r="sin-molestia">Prefiero no decirlo</button>`;
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
    app.innerHTML = `<div class="rutina">
      <header class="saludo"><div class="de">Hecho</div><h1>${parcial ? 'Lo de hoy, guardado' : 'Rutina de hoy, completa'}</h1>${
        parcial ? `<p>Te faltó: ${[...new Set(cola.filter((c) => !dia.e.some((x) => x.i === c.e.i)).map((c) => EJERCICIOS[c.e.i].nombre))].map(esc).join(', ')}.</p>` : ''
      }<p>${((t) => t[0].toUpperCase() + t.slice(1))(minutos((ahora - sesion.inicio) / 1000))} de trabajo. ${r.de ? `Mándale a ${esc(r.de)} cómo te ha ido.` : ''}</p></header>
      <section class="lista">${resumenDia(dia, tope)}</section>
      <footer class="pie">
        <button type="button" class="boton" data-r="mandar" data-canal="wa">${ICONO.whatsapp}Mandar por WhatsApp</button>
        <button type="button" class="boton" data-r="mandar" data-canal="tg">${ICONO.telegram}Mandar por Telegram</button>
        <button type="button" class="boton fantasma" data-r="volver">Volver a la rutina</button>
        ${tarjetaAMano()}
      </footer>
    </div>`;
  }

  // «Tenla a mano» (Fable B6): the routine lives in a message that tomorrow will be buried. On a phone, and until the
  // person says «Ya la tengo», the two steps to put it on the home screen, drawn as their browser shows them.
  function tarjetaAMano() {
    const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (instalada || !window.matchMedia('(pointer: coarse)').matches || almacen.leer('a-mano', false)) return '';
    const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const pasos = iphone
      ? [[ICONO.compartirIos, 'Toca <b>Compartir</b>, abajo, en la barra del navegador.'], [ICONO.mas, 'Toca <b>Añadir a pantalla de inicio</b>.']]
      : [[ICONO.puntos, 'Toca los <b>tres puntos</b>, arriba a la derecha.'], [ICONO.mas, 'Toca <b>Añadir a pantalla de inicio</b>.']];
    return `<section class="tarjeta a-mano" aria-labelledby="a-mano-titulo">
      <h3 id="a-mano-titulo">Tenla a mano</h3>
      <p>Así mañana no tendrás que buscar el mensaje: ponla en la pantalla de inicio del teléfono, como una app.</p>
      <ol class="a-mano-pasos">${pasos.map(([icono, texto]) => `<li><span class="a-mano-icono" aria-hidden="true">${icono}</span><span>${texto}</span></li>`).join('')}</ol>
      <button type="button" class="boton secundario" data-r="ya-la-tengo">Ya la tengo</button>
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
      const nombre = (x) => `${esc(EJERCICIOS[x.i]?.nombre || x.i)}${EJERCICIOS[x.i]?.unLado && x.l ? ` · ${LADOS[x.l].toLowerCase()}` : ''}`;
      dialogo.innerHTML = `<h2 id="corregir-titulo" tabindex="-1">${nuevo ? 'Apuntar una vez sin la app' : `Corregir el ${esc(fechaCorta(dia.f))}`}</h2>
        ${nuevo ? `<div class="segmentos" role="group" aria-label="Qué día"><button type="button" data-c="dia" data-v="${diaDeSesion(ahora)}" aria-pressed="${dia.f === diaDeSesion(ahora)}">Hoy</button><button type="button" data-c="dia" data-v="${ayer}" aria-pressed="${dia.f === ayer}">Ayer</button></div>` : ''}
        ${dia.e.map((x, j) => `<section class="corregir-ejercicio"><h3>${nombre(x)}</h3>
          <div class="series-lado">${x.p.map((v, n) => `<div class="serie-fila"><span>Serie ${n + 1}</span>${paso(`c-${j}-${n}`, v, `Serie ${n + 1}`, 0, 50)}</div>`).join('')}</div>
          <p class="pregunta-suave">Molestia</p>
          <div class="escala" role="group" aria-label="Molestia en ${nombre(x)}">${Array.from({ length: 11 }, (_, n) => `<button type="button" data-c="m" data-j="${j}" data-v="${n}" aria-pressed="${x.m === n}" class="num">${n}</button>`).join('')}</div>
          <div class="chips-elegir">${[['cuesta', 'Me ha costado'], ['no', 'No he podido hacerlo']].map(([v, t]) => `<button type="button" class="chip-elegir" data-c="dificultad" data-j="${j}" data-v="${v}" aria-pressed="${x.c === v}">${t}</button>`).join('')}</div>
          <label class="nota-persona"><span>Una nota</span><textarea data-c="nota" data-j="${j}" rows="2" maxlength="300">${esc(x.n || '')}</textarea></label>
        </section>`).join('')}
        <div class="hoja-como-pie dos-botones"><button type="button" class="boton" data-c="guardar">Guardar</button><button type="button" class="boton secundario" data-c="cancelar">Cancelar</button></div>`;
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
    const titulo = r.x > 1 ? `Tu rutina de ejercicios (${r.x} veces al día)` : 'Tu rutina de ejercicios';
    const aviso = r.de ? `${titulo}, de ${r.de}` : titulo;
    const ics = archivoCalendario([
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Oksigenia//Jepyso//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', `UID:${hashCorto(codigo)}-${fecha}@jepyso`, `DTSTAMP:${ahora}`, `DTSTART:${fecha}T${hora}`,
      `DURATION:PT${Math.max(5, Math.round(totalSeg / 60))}M`, 'RRULE:FREQ=DAILY', `SUMMARY:${textoCalendario(aviso)}`,
      `DESCRIPTION:${textoCalendario(`Ábrela aquí: ${url}`)}`, `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${textoCalendario(titulo)}`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'rutina.ics';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    const hecho = app.querySelector('.recordatorio-hecho');
    if (hecho) hecho.textContent = `Ábrelo y elige «Añadir» en tu calendario: te avisará cada día a las ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}.`;
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
    const texto = `${r.para ? r.para + ': ' : ''}así va mi rutina (${hist.length} ${hist.length === 1 ? 'vez' : 'veces'}).`;
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
    dialogo.innerHTML = `<h2 id="como-titulo" tabindex="-1">${esc(def.nombre)}</h2>
      ${explicacion(def)}
      ${banda ? `<p class="con-banda">${muestraBanda(banda)}<span>Usa la ${esc(banda.nombre.toLowerCase())}.</span></p>` : ''}
      ${e.n ? `<p class="nota">${esc(e.n)}</p>` : ''}
      <div class="hoja-como-pie"><button type="button" class="boton">Entendido</button></div>`;
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
    if (a === 'voz') {
      ponerVoz(!vozActiva());
      el.setAttribute('aria-pressed', String(vozActiva()));
      el.innerHTML = vozActiva() ? ICONO.voz : ICONO.sinVoz;
      return vozActiva() && decir('Voz encendida');
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
        ? `<div class="centro"><p>¿Salir de la rutina?</p><p>El grupo va por el ejercicio ${ejercicios.indexOf(actual().e) + 1} de ${ejercicios.length}.</p></div>
        <div class="mando-botones"><button type="button" class="boton fantasma" data-r="seguir-rutina">Seguir</button><span></span><button type="button" class="boton fantasma" data-r="dejar">Salir</button></div>`
        : `<div class="centro"><p>¿Dejas la rutina aquí?</p><p>Lo que has hecho se guarda y puedes mandarlo.</p></div>
        <div class="mando-botones"><button type="button" class="boton fantasma" data-r="seguir-rutina">Seguir</button><span></span><button type="button" class="boton fantasma" data-r="dejar">Dejarla</button></div>`;
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
      el.innerHTML = `${pausar ? ICONO.play : ICONO.pausa}<span>${pausar ? 'Seguir' : 'Pausa'}</span>`;
      el.setAttribute('aria-pressed', String(pausar));
      app.querySelector('.jugador')?.classList.toggle('en-pausa', pausar);
      const fase = app.querySelector('.j-fase');
      if (fase && pausar) {
        fase.dataset.antes = fase.textContent;
        fase.textContent = 'En pausa';
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
      if (aviso) aviso.textContent = pasaDelTope(v, tope) ? `Es más de ${tope}: saldrá marcado en el resumen que le mandes a ${r.de || 'quien te dio la rutina'}. La próxima vez, hazlo más suave o con menos repeticiones. Si es un dolor fuerte, para este ejercicio.` : '';
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
    return '<article class="tarjeta dia"><p>Este día no se puede leer.</p></article>';
  }
}

function pintarDia(dia, tope) {
  const fecha = new Date(dia.f + 'T12:00:00');
  const titulo = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(fecha);
  const marcado = diaMarcado(dia, tope);
  return `<article class="tarjeta dia ${marcado ? 'marcado' : ''}"><h3>${titulo.charAt(0).toUpperCase() + titulo.slice(1)}${dia.h ? ` · ${esc(dia.h)}` : ''}${
    marcado ? ` <span class="marca-dia">Pasa de ${tope}</span>` : ''
  }</h3>
    ${dia.e
      .map((x) => {
        const def = Object.hasOwn(EJERCICIOS, x.i) ? EJERCICIOS[x.i] : null;
        if (!def) return '';
        const bien = x.p.every((v) => v >= x.r);
        return `<div class="hecho">
          <span class="nombre">${esc(def.nombre)}${def.unLado ? ` · ${LADOS[x.l].toLowerCase()}` : ''}</span>
          ${typeof x.m === 'number' ? `<span class="chip ${pasaDelTope(x.m, tope) ? 'alta' : ''}">Molestia ${x.m}/10</span>` : '<span></span>'}
          <div class="barra-series">${x.p.map((v) => `<span class="${v < x.r ? 'corta' : ''}" title="${esc(v)} de ${esc(x.r)}"></span>`).join('')}</div>
          ${x.c === 'cuesta' ? '<span class="chip">Costó</span>' : x.c === 'no' ? '<span class="chip alta">No se pudo hacer</span>' : ''}
          ${x.n ? `<p class="nota-dia">«${esc(x.n)}»</p>` : ''}
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
    app.innerHTML = `<div class="saludo"><h1>Este resumen no se puede abrir</h1><p>Pide que te lo vuelvan a mandar.</p></div>`;
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
      return `<button type="button" class="boton secundario" data-accion="guardar-resumen" data-destino="nombre">Guardar en la ficha de ${esc(porNombre.nombre)}</button>`;
    }
    if (!caben(lista)) return `No se ha guardado en una ficha: ya tienes ${limite()} personas con ficha, el máximo de la versión gratis.`;
    const texto = lista.length ? `Guardar en una ficha nueva para ${esc(s.para || 'esta persona')}` : 'Guardar en mis personas';
    return `<button type="button" class="boton secundario" data-accion="guardar-resumen" data-destino="nueva">${texto}</button>`;
  }
  if (!p && !caben(lista)) return `No se ha guardado en una ficha: ya tienes ${limite()} personas con ficha, el máximo de la versión gratis.`;
  const nueva = !p;
  if (!p) p = crearPersona(lista, s.para || 'Sin nombre');
  const n = apuntarResumen(p, s);
  if (!guardarPersonas(lista)) return SIN_SITIO;
  const que = nueva ? `Ficha nueva para ${esc(p.nombre)}` : n ? `Guardado en la ficha de ${esc(p.nombre)}` : `Ya estaba en la ficha de ${esc(p.nombre)}`;
  if (!fichaAbierta(p)) {
    if (cuentaDeVales()) pedirVale(p.id);
    else return `${que}. Para abrirla, entra con tu cuenta de Google en <a href="#personas">Mis personas</a>.`;
  }
  return `${que}. <a href="#persona=${esc(p.id)}">Ver su ficha</a>`;
}

// ---------- The professional's people ----------
// «jueves, 13 de noviembre», for the person's own days.
const fechaCorta = (f) => {
  const d = new Date(f + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? 'día sin fecha' : new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
};
const fechaLarga = (f) => {
  const d = new Date(f + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? 'sin fecha' : new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(d);
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
    <span class="nombre">${ICONO.candado}${esc(p.nombre)}</span>
    <span class="meta">${sinPlaza ? `Tu cuenta de Google ya tiene ${LIMITE_GRATIS} fichas` : 'Entra con tu cuenta de Google para abrirla'}</span>
  </a></li>`;
  }
  const marcado = ultimoMarcado(p);
  const rutinas = p.rutinas.length ? `${p.rutinas.length} ${p.rutinas.length === 1 ? 'rutina' : 'rutinas'}` : 'sin rutinas';
  const resumen = p.ultimoResumen ? `último resumen el ${fechaLarga(p.ultimoResumen)}` : 'sin resúmenes todavía';
  return `<li><a class="persona-fila" href="#persona=${esc(p.id)}">
    <span class="nombre">${esc(p.nombre)}</span>
    <span class="meta">${rutinas} · ${resumen}</span>
    ${marcado ? `<span class="chip alta">Pasó de ${marcado.tope} ${listaDias([marcado.f])}</span>` : ''}
  </a></li>`;
}

// The paid version keeps the files in the professional's own Google Drive (drive.js): a folder «Jepyso» that the app
// only can see. Syncing joins what this device has with what the Drive has, and keeps it in both places.
const ultimaSincronia = () => {
  const f = almacen.leer('drive-ultima', '');
  if (!f) return 'Todavía sin conectar.';
  const d = new Date(f);
  const hora = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  return `Última vez: ${diaLocal(d) === diaLocal() ? 'hoy' : `el ${fechaLarga(diaLocal(d))}`}, a las ${hora}.`;
};

function seccionDrive() {
  const pendiente = licenciaPendiente();
  return `<section class="general nube">
    <h2>Tu Google Drive</h2>
    <p class="ayuda">Tus fichas y tus plantillas se guardan en una carpeta «Jepyso» de tu Drive, y así las tienes en todos tus aparatos. Jepyso solo ve esa carpeta.</p>
    ${pendiente ? `<p class="ayuda"><strong>Para activar tu licencia,</strong> conecta el Drive con la cuenta ${esc(licencia().cuenta)}.</p>` : ''}
    <div class="botones"><button type="button" class="boton" data-accion="drive">Sincronizar con Google Drive</button></div>
    <p class="aviso-nube" aria-live="polite">${ultimaSincronia()}</p>
  </section>`;
}

// The free version's Google account (vales.js): who is in and how many files are left, or Google's own button. Said
// plainly what goes to the server and what does not.
function seccionCuenta() {
  const correo = cuentaDeVales();
  const quedan = fichasQuedan();
  const cerradas = leerPersonas().filter((p) => !fichaAbierta(p)).length;
  const estado = correo
    ? `<p class="cuenta-dentro">Con la cuenta <strong>${esc(correo)}</strong>${Number.isInteger(quedan) ? ` · ${quedan === 0 ? 'no le quedan fichas nuevas' : `le ${quedan === 1 ? 'queda 1 ficha nueva' : `quedan ${quedan} fichas nuevas`}`}` : ''}</p>`
    : '<div class="hueco-google"></div>';
  return `<section class="general cuenta-fichas${cerradas && !correo ? ' pide' : ''}">
    <h2>Tus fichas, con tu cuenta de Google</h2>
    ${correo ? '' : `<p class="ayuda">La versión gratis tiene ${LIMITE_GRATIS} fichas por cuenta de Google. Entra con la tuya para abrirlas y para hacer fichas nuevas. Oksigenia solo guarda una huella de tu cuenta y el código de cada ficha: los nombres, las rutinas y los resúmenes se quedan en este aparato.</p>`}
    ${estado}
    <p class="aviso-vales" aria-live="polite">${esc(avisoVales())}</p>
  </section>`;
}

// Where to paste a licence, in Personas, for the free version.
function seccionLicencia() {
  return `<details class="general licencia-pegar">
    <summary>¿Tienes una licencia de Jepyso?</summary>
    <p class="ayuda">Pégala aquí, o abre el enlace que te llegó con ella. Se activa al conectar tu Drive con la cuenta de la licencia.</p>
    <div class="licencia-fila"><input type="text" data-accion="licencia" autocomplete="off" spellcheck="false" aria-label="Tu licencia"><button type="button" class="boton secundario" data-accion="guardar-licencia">Guardar</button></div>
    <p class="aviso-licencia" aria-live="polite"></p>
  </details>`;
}

const MOTIVOS_LICENCIA = {
  formato: 'Eso no es una licencia de Jepyso: cópiala entera, sin espacios.',
  firma: 'Esa licencia no es válida: no la ha firmado Oksigenia, o ha cambiado al copiarla.',
  navegador: 'Este navegador no puede comprobar licencias. Actualízalo, o usa Chrome, Edge, Safari o Firefox al día.',
};

async function sincronizarDrive(boton) {
  const aviso = app.querySelector('.aviso-nube');
  boton.disabled = true;
  try {
    aviso.textContent = 'Conectando con Google…';
    await conectar();
    // With a licence: it counts once the Drive is connected with its account; with another account, nothing is synced.
    if (licencia().valida) {
      const cuenta = await cuentaDrive();
      if (!(await cuentaDelDrive(cuenta))) {
        olvidar();
        aviso.textContent = `Tu licencia es de ${licencia().cuenta}, y has conectado el Drive de ${cuenta || 'otra cuenta'}. Conéctalo con la cuenta de la licencia.`;
        return;
      }
    }
    aviso.textContent = 'Sincronizando…';
    const local = { personas: leerPersonas(), plantillas: leerPlantillas(), borradas: leerBorradas() };
    const r = await sincronizar(local, (junto) => {
      const bien = guardarPersonas(junto.personas) && almacen.guardar('plantillas', junto.plantillas) && almacen.guardar('borradas', junto.borradas);
      if (!bien) throw new Error(SIN_SITIO);
    });
    almacen.guardar('drive-ultima', new Date().toISOString());
    aviso.textContent = `Hecho: ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'} y ${r.plantillas} ${r.plantillas === 1 ? 'plantilla' : 'plantillas'} en tu Drive y en este aparato.`;
  } catch (err) {
    aviso.textContent = err.message;
  } finally {
    boton.disabled = false;
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
      ? lista.map(filaPersona).join('') || '<li class="vacio">Nadie con ese nombre.</li>'
      : '<li class="vacio">Todavía no hay nadie. Cuando mandes una rutina con el nombre de la persona, aparece aquí con su ficha.</li>';
  };
  app.innerHTML = `<div class="personas">
    ${barraApp('Personas', { accion: botonNueva })}
    <div class="armar-cuerpo">
      <input type="search" class="buscar" data-accion="buscar-persona" autocomplete="off" placeholder="Buscar por nombre" aria-label="Buscar personas por nombre">
      <div class="hueco-capacidad"></div>
      ${valesEnMarcha() ? seccionCuenta() : ''}
      <ul class="lista-personas"></ul>
      <details class="ayuda-plegada"><summary>Cómo funciona</summary><p>Cada rutina que mandas y cada resumen que te devuelven quedan en la ficha de su persona. Se guardan en este aparato; con una copia te las llevas a otro.</p></details>
      ${esDePago() || licenciaPendiente() ? seccionDrive() : seccionLicencia()}
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
        aviso.textContent = MOTIVOS_LICENCIA[l.motivo] || MOTIVOS_LICENCIA.formato;
        return;
      }
      return vistaPersonas();
    }
    if (ev.target.closest('[data-accion="drive"]')) {
      await sincronizarDrive(ev.target.closest('[data-accion="drive"]'));
      return pintarLista();
    }
    if (!ev.target.closest('[data-accion="exportar"]')) return;
    const archivo = new Blob([JSON.stringify(copia(leerPersonas()))], { type: 'application/json' });
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
      if (!guardarPersonas(lista)) {
        aviso.textContent = SIN_SITIO;
        return;
      }
      aviso.textContent = `Copia cargada: ${r.total} ${r.total === 1 ? 'persona' : 'personas'}${r.nuevas ? `, ${r.nuevas} ${r.nuevas === 1 ? 'nueva' : 'nuevas'}` : ', ninguna nueva'}.${
        r.fuera ? ` ${r.fuera} no ${r.fuera === 1 ? 'cabe' : 'caben'}: la versión gratis guarda hasta ${limite()}.` : ''}`;
      await comprobarVales();
      pintarLista();
      if (cuentaDeVales()) pedirVales().then(() => location.hash === '#personas' && pintarLista());
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

// A free file without its ticket: its name, Google's button and, if it has no room on the account, the way to delete
// it. What is inside stays kept, but out of sight, until it opens.
function vistaFichaCerrada(p) {
  const sinPlaza = fichaSinPlaza(p.id);
  app.innerHTML = `<div class="personas persona ficha-cerrada">
    ${barraApp(esc(p.nombre), { volver: '#personas' })}
    <div class="armar-cuerpo">
      <section class="general cuenta-fichas pide">
        <h2>${ICONO.candado}${sinPlaza ? 'Esta ficha no cabe en tu cuenta' : 'Entra para abrir esta ficha'}</h2>
        <p class="ayuda">${sinPlaza
          ? `Tu cuenta de Google ya tiene sus ${LIMITE_GRATIS} fichas gratis. Borra una que ya no uses, aquí o en otro aparato, o pasa a la versión de pago, que no tiene límite.`
          : `En la versión gratis, cada ficha va con tu cuenta de Google: ${LIMITE_GRATIS} por cuenta. Entra con la tuya y la ficha se abre en este aparato, también sin conexión.`}</p>
        ${cuentaDeVales() ? '' : '<div class="hueco-google"></div>'}
        <p class="aviso-vales" aria-live="polite">${esc(avisoVales())}</p>
      </section>
      ${sinPlaza ? '<div class="botones"><button type="button" class="boton fantasma" data-accion="borrar-cerrada">Borrar esta ficha</button></div>' : ''}
    </div>
  </div>`;
  const hueco = app.querySelector('.hueco-google');
  if (hueco) botonGoogle(hueco);
  let confirmar = null;
  app.onclick = (ev) => {
    const el = ev.target.closest('[data-accion="borrar-cerrada"]');
    if (!el) return;
    if (!confirmar) {
      el.textContent = `¿Borrar la ficha de ${p.nombre}? Toca otra vez`;
      confirmar = setTimeout(() => {
        confirmar = null;
        if (el.isConnected) el.textContent = 'Borrar esta ficha';
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
    app.innerHTML = `<div class="personas"><header class="armar-cabecera"><a class="ir-personas" href="#personas">Mis personas</a><h1>Esta ficha no está en este navegador</h1><p>Si la tienes en otro aparato, trae su copia desde Mis personas.</p></header></div>`;
    return () => {};
  }
  if (!fichaAbierta(p)) return vistaFichaCerrada(p);
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
    // Only the notes change here, on the file as it is now: a summary kept from another tab meanwhile (WhatsApp Web
    // opens each link in a new one) must stay.
    const todas = leerPersonas();
    const fresca = todas.find((x) => x.id === id);
    if (!fresca) return;
    fresca.notas = p.notas;
    fresca.cambiada = p.cambiada;
    if (!guardarPersonas(todas)) app.querySelector('.notas h2').insertAdjacentHTML('afterend', `<p class="aviso-nube">${SIN_SITIO}</p>`);
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
      if (b) b.textContent = 'Borrar su ficha';
    }
    if (a === 'rutina-para') {
      const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
      Object.assign(b, { para: p.nombre, persona: p.id, tope });
      almacen.guardar('borrador', b);
      location.hash = '';
    } else if (a === 'abrir-rutina') {
      // The routine as it was sent, back in the builder for this person, to change it and send it again.
      const r = limpiarRutina(await decodificar(el.dataset.codigo));
      if (!r) return;
      const b = ponerAlDia(almacen.leer('borrador', null) || borradorInicial());
      Object.assign(b, { para: p.nombre, persona: p.id, descanso: r.d, veces: r.x, tope: Number.isInteger(r.m) ? r.m : tope, cuerpo: r.c || 'a' });
      b.orden = r.e.map((e) => e.i).filter((i) => ORDEN.includes(i));
      for (const e of r.e) if (ORDEN.includes(e.i)) b.ejercicios[e.i] = { series: e.s, reps: e.r, tempo: [...e.t], lado: e.l ?? null, banda: e.b || '', nota: e.n || '' };
      b.activo = b.orden[0] || b.activo;
      almacen.guardar('borrador', b);
      location.hash = '';
    } else if (a === 'copiar-rutina') {
      const url = `${location.origin}${location.pathname}#r=${el.dataset.codigo}`;
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
// The browser's storage is full: said once, on top of whatever screen, with what to do.
window.addEventListener('jepyso-lleno', () => {
  if (document.querySelector('.aviso-almacen')) return;
  const aviso = document.createElement('div');
  aviso.className = 'nueva-version aviso-almacen';
  aviso.setAttribute('role', 'alert');
  aviso.innerHTML = `<p>${SIN_SITIO}</p><button type="button" class="nueva-version-cerrar" aria-label="Cerrar">${ICONO.cerrar}</button>`;
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
  aviso.innerHTML = `<span>Hay una versión nueva de Jepyso.</span><button type="button" class="boton">Actualizar</button>
    <button type="button" class="nueva-version-cerrar" aria-label="Ahora no">${ICONO.cerrar}</button>`;
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
  const rutas = [...new Set([...MOTOR, RUTAS[c] || RUTAS.a, m.cuerpo,
    ...ejercicios.flatMap(({ i, b }) => (m.ejercicios[i] ? [m.ejercicios[i].glb, m.ejercicios[i].ficha, poster(i, c, bandaDe(EJERCICIOS[i], b)?.clave)] : []))])];
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
        const lista = leerPlantillas();
        const [borrada] = lista.splice(Number(el.dataset.i), 1);
        if (borrada) apuntarBorrada('plantillas', borrada.nombre);
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
  let h = location.hash;
  // A licence arriving in its link: kept, and the address cleaned (it is in the fragment, so no server saw it), then
  // the professional's people, where it says what to do next.
  if (h.startsWith('#licencia=')) {
    const l = await guardarLicencia(h.slice(10));
    history.replaceState(null, '', `${location.pathname}#personas`);
    h = '#personas';
    if (!l.valida) setTimeout(() => {
      const aviso = app.querySelector('.aviso-licencia');
      if (aviso) aviso.textContent = MOTIVOS_LICENCIA[l.motivo] || MOTIVOS_LICENCIA.formato;
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
  else limpiar = vistaArmar();
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
comprobarLicencia().then(comprobarVales).finally(ir);
