// Jepyso: the professional builds a routine, sends it as a link, the person does it with the 3D figure and sends
// back a summary link. No server: everything travels inside the links.
import {
  EJERCICIOS, ORDEN, LADOS, TOPE_MOLESTIA, pasaDelTope, diaLocal, diaAnterior,
  codificar, decodificar, duracionEjercicio, minutos, almacen,
} from './datos.js';
import { Figura } from './figura.js';

const app = document.getElementById('app');
const parametros = new URLSearchParams(location.search);
const RUTAS = { a: 'modelos/ejercicios.json', b: 'modelos/b/ejercicios.json' };
const calidad = parametros.get('calidad') === 'baja' ? 'baja' : 'alta';
const manifiestos = {};
let figura = null;
let limpiar = () => {};

const ICONO = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.2"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  girar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
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
  if (figura.renderer.domElement.parentElement !== contenedor) {
    contenedor.appendChild(figura.renderer.domElement);
    figura.contenedor = contenedor;
    figura.ajustar();
  }
  return figura;
}

// ---------- Builder ----------
function borradorInicial() {
  return {
    para: '',
    de: '',
    descanso: 45,
    veces: 1,
    tope: TOPE_MOLESTIA,
    cuerpo: 'a',
    activo: 'puente',
    ejercicios: Object.fromEntries(
      ORDEN.map((id) => {
        const d = EJERCICIOS[id].porDefecto;
        return [id, { incluido: id !== 'hombro', series: d.series, reps: d.reps, tempo: [...d.tempo], lado: EJERCICIOS[id].unLado ? 'der' : null, nota: '' }];
      }),
    ),
  };
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

function tarjetaEjercicio(id, e, activo) {
  const def = EJERCICIOS[id];
  const [s, m, b] = e.tempo;
  return `<article class="ejercicio ${e.incluido ? 'incluido' : ''} ${activo ? 'activo' : ''}" data-id="${id}">
    <button type="button" class="ejercicio-cabeza" data-accion="incluir" aria-pressed="${e.incluido}">
      <span class="marca">${ICONO.check}</span>
      <span class="titulo">
        <h3>${esc(def.nombre)}</h3>
        <span class="linea-chips">
          <span class="chip">${esc(def.posicion)}</span><span class="chip">${esc(def.material)}</span>
          ${def.musculos.map((mu) => `<span class="chip vivo">${esc(mu)}</span>`).join('')}
        </span>
      </span>
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
      <div class="campo"><label for="nota-${id}">Nota para la persona</label>
        <textarea id="nota-${id}" data-accion="nota" rows="2" placeholder="Por ejemplo: sin dolor; si molesta, baja menos">${esc(e.nota)}</textarea></div>
    </div>
  </article>`;
}

function vistaArmar() {
  const b = almacen.leer('borrador', null) || borradorInicial();
  b.tope ??= TOPE_MOLESTIA;
  const guardar = () => almacen.guardar('borrador', b);

  const incluidos = () => ORDEN.filter((id) => b.ejercicios[id].incluido);
  const resumenCorto = () => {
    const ids = incluidos();
    if (!ids.length) return 'Elige al menos un ejercicio';
    const seg = ids.reduce((t, id) => t + duracionEjercicio(b.ejercicios[id], b.descanso), 0);
    return `${ids.length} ${ids.length === 1 ? 'ejercicio' : 'ejercicios'} · ${minutos(seg)}`;
  };

  function pintar() {
    app.innerHTML = `<div class="armar">
      <div class="armar-izq">
        <header class="armar-cabecera">
          <h1>Nueva rutina</h1>
          <p>Elige los ejercicios, ajústalos y mándasela por un enlace. La persona no tiene que instalar nada.</p>
        </header>
        <div class="armar-cuerpo">
          <div class="campos">
            <div class="campo"><label for="para">Para</label><input id="para" data-accion="para" autocomplete="off" placeholder="Su nombre" value="${esc(b.para)}"></div>
            <div class="campo"><label for="de">De</label><input id="de" data-accion="de" autocomplete="off" placeholder="Tu nombre" value="${esc(b.de)}"></div>
          </div>
          ${ORDEN.map((id) => tarjetaEjercicio(id, b.ejercicios[id], id === b.activo)).join('')}
          <section class="general">
            <h2>Para toda la rutina</h2>
            <div class="fila">
              <div class="ajuste"><span>Descanso entre series</span>${segmentos('descanso', [[30, '30 s'], [45, '45 s'], [60, '1 min'], [90, '1 min 30']], b.descanso)}</div>
              <div class="ajuste"><span>Veces al día</span>${segmentos('veces', [[1, '1'], [2, '2'], [3, '3']], b.veces)}</div>
              <div class="ajuste"><span>Figura</span>${segmentos('cuerpo', FIGURAS, b.cuerpo)}</div>
              <div class="ajuste"><span>Molestia aceptable, de 0 a 10</span>${paso('tope', b.tope, 'Molestia aceptable', 0, 9)}</div>
            </div>
            <p class="ayuda">Si al hacer un ejercicio o a la mañana siguiente la persona pasa de esa molestia, el día te sale marcado en su resumen.</p>
          </section>
        </div>
        <div class="barra-crear">
          <span class="resumen-corto">${resumenCorto()}</span>
          <button type="button" class="boton" data-accion="crear" ${incluidos().length ? '' : 'disabled'}>Crear enlace</button>
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

  async function colocarFigura() {
    const ancho = window.matchMedia('(min-width: 980px)').matches;
    const id = b.activo;
    const e = b.ejercicios[id];
    const sitio = ancho ? app.querySelector('.vista-figura') : app.querySelector(`.ejercicio[data-id="${id}"] .mini-figura`);
    const pie = app.querySelector('.vista-pie');
    if (pie) pie.innerHTML = `<div class="tarjeta"><h3>${esc(EJERCICIOS[id].nombre)}</h3>${svgTempo(e.tempo, { etiquetas: true, punto: true })}<span class="chip">${textoTempo(e.tempo)}</span></div>`;
    if (!sitio || (!ancho && !e.incluido)) return;
    try {
      const f = await figuraEn(sitio, b.cuerpo);
      f.oyentes = { fase: [alFase] };
      await f.poner(id, { tempo: e.tempo, lado: e.lado === 'izq' ? 'izq' : 'der' });
      f.empezar({ modo: 'demo' });
    } catch (err) {
      sitio.innerHTML = `<p class="chip">La figura de este ejercicio aún no está</p>`;
      console.warn(err);
    }
  }

  const alFase = (fase, restante, progreso) => {
    if (progreso !== undefined) moverPunto(app.querySelector('.vista-pie .tempo'), b.ejercicios[b.activo].tempo, progreso);
  };

  function refrescarTarjeta(id) {
    const vieja = app.querySelector(`.ejercicio[data-id="${id}"]`);
    const lienzo = figura?.renderer.domElement;
    const conservar = lienzo && vieja.contains(lienzo);
    const nueva = document.createElement('div');
    nueva.innerHTML = tarjetaEjercicio(id, b.ejercicios[id], id === b.activo);
    const art = nueva.firstElementChild;
    if (conservar) art.querySelector('.mini-figura').appendChild(lienzo);
    vieja.replaceWith(art);
    app.querySelector('.resumen-corto').textContent = resumenCorto();
    app.querySelector('[data-accion="crear"]').disabled = !incluidos().length;
  }

  function actualizarTempo(id) {
    const e = b.ejercicios[id];
    if (figura && id === b.activo) {
      figura.tempo = [...e.tempo];
      figura.lado(e.lado === 'izq' ? 'izq' : 'der');
    }
    const pie = app.querySelector('.vista-pie');
    if (pie && id === b.activo) pie.innerHTML = `<div class="tarjeta"><h3>${esc(EJERCICIOS[id].nombre)}</h3>${svgTempo(e.tempo, { etiquetas: true, punto: true })}<span class="chip">${textoTempo(e.tempo)}</span></div>`;
  }

  app.onclick = (ev) => {
    const el = ev.target.closest('[data-accion]');
    const tarjeta = ev.target.closest('.ejercicio');
    const id = tarjeta?.dataset.id;
    const a = el?.dataset.accion;
    if (tarjeta && id !== b.activo) {
      // Selecting a card only moves the preview; it never re-renders, so a text field keeps its focus.
      b.activo = id;
      app.querySelectorAll('.ejercicio').forEach((t) => t.classList.toggle('activo', t === tarjeta));
      if (a === 'incluir') {
        if (!b.ejercicios[id].incluido) {
          b.ejercicios[id].incluido = true;
          refrescarTarjeta(id);
        }
        guardar();
        colocarFigura();
        return;
      }
      colocarFigura();
    }
    if (!el) return guardar();
    const delta = Number(el.dataset.delta || 0);
    if (a === 'incluir') {
      b.ejercicios[id].incluido = !b.ejercicios[id].incluido;
      refrescarTarjeta(id);
      colocarFigura();
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
    } else if (a === 'cuerpo') {
      b.cuerpo = el.dataset.valor;
      el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
      colocarFigura();
    } else if (a === 'tope') {
      b.tope = Math.min(9, Math.max(0, b.tope + delta));
      el.closest('.paso').outerHTML = paso('tope', b.tope, 'Molestia aceptable', 0, 9);
    } else if (a === 'descanso' || a === 'veces') {
      b[a] = Number(el.dataset.valor);
      el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
      app.querySelector('.resumen-corto').textContent = resumenCorto();
    } else if (a === 'crear') {
      crearEnlace(b);
    }
    guardar();
  };

  app.oninput = (ev) => {
    const a = ev.target.dataset.accion;
    if (a === 'para' || a === 'de') b[a] = ev.target.value;
    if (a === 'nota') b.ejercicios[ev.target.closest('.ejercicio').dataset.id].nota = ev.target.value;
    guardar();
  };

  pintar();
  const ancho = window.matchMedia('(min-width: 980px)');
  const alCambiarAncho = () => colocarFigura();
  ancho.addEventListener('change', alCambiarAncho);
  return () => {
    ancho.removeEventListener('change', alCambiarAncho);
    if (figura) figura.oyentes = {};
    app.onclick = app.oninput = null;
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
    e: ORDEN.filter((id) => b.ejercicios[id].incluido).map((id) => {
      const e = b.ejercicios[id];
      return { i: id, s: e.series, r: e.reps, t: e.tempo, l: e.lado, n: e.nota.trim() || undefined };
    }),
  };
  const codigo = await codificar(rutina);
  const url = `${location.origin}${location.pathname}${location.search}#r=${codigo}`;
  const saludo = rutina.para ? `Hola, ${rutina.para}. ` : '';
  const mensaje = `${saludo}Aquí tienes tu rutina de ejercicios. Ábrela en el móvil y sigue a la figura: ${url}`;

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
    <p>Mándale el enlace por WhatsApp o que escanee el código con su móvil. Todo va dentro del enlace: no se guarda en ningún servidor.</p>
    <div class="qr">${qr}</div>
    <div class="enlace-texto">${esc(url)}</div>
    <div class="botones">
      <a class="boton" href="https://wa.me/?text=${encodeURIComponent(mensaje)}" target="_blank" rel="noopener">${ICONO.whatsapp}Enviar por WhatsApp</a>
      <button type="button" class="boton secundario" data-h="copiar">Copiar enlace</button>
      <a class="boton fantasma" href="${esc(url)}" target="_blank" rel="noopener">Verla como la persona</a>
    </div>
  </div>`;
  document.body.appendChild(capa);
  capa.addEventListener('click', async (ev) => {
    if (ev.target === capa) capa.remove();
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
        ${hist.length ? `<button type="button" class="boton fantasma" data-r="mandar">Mandar lo hecho a ${quien}</button>` : ''}`;
    }
  }

  function intro() {
    const hist = almacen.leer(clave, []);
    const hoy = diaLocal();
    const vecesHoy = hist.filter((d) => d.f === hoy).length;
    app.innerHTML = `<div class="rutina">
      <header class="saludo">
        ${r.de ? `<div class="de">Tu rutina de ${esc(r.de)}</div>` : ''}
        <h1>${r.para ? `Hola, ${esc(r.para)}` : 'Tu rutina'}</h1>
        <p>${ejercicios.length} ${ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}, ${minutos(totalSeg)}${r.x > 1 ? ` · ${r.x} veces al día` : ''}${vecesHoy ? ` · hoy llevas ${vecesHoy}` : ''}.</p>
      </header>
      <section class="lista">
        ${sesionDeAyer(hist) >= 0 ? preguntaManana() : ''}
        ${ejercicios
          .map((e) => {
            const def = EJERCICIOS[e.i];
            return `<article class="tarjeta">
              <h3>${esc(def.nombre)}</h3>
              <div class="linea-chips">
                <span class="chip num">${e.s} ${e.s === 1 ? 'serie' : 'series'} de ${e.r}</span>
                ${def.unLado ? `<span class="chip">${LADOS[e.l]}</span>` : ''}
                <span class="chip">${esc(def.material)}</span>
              </div>
              ${svgTempo(e.t, { etiquetas: true })}
              ${e.n ? `<div class="nota">${esc(e.n)}</div>` : ''}
            </article>`;
          })
          .join('')}
      </section>
      <footer class="pie"></footer>
    </div>`;
    pintarPie(hist);
  }

  // Queue: every exercise, every side, every set.
  const cola = [];
  for (const e of ejercicios) for (const lado of e.l === 'ambos' && EJERCICIOS[e.i].unLado ? ['der', 'izq'] : [e.l === 'izq' ? 'izq' : 'der']) cola.push({ e, lado });
  let sesion = null;
  let bloqueo = null;

  async function empezar() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      await audio.resume();
    } catch {
      audio = null;
    }
    try {
      bloqueo = await navigator.wakeLock?.request('screen');
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
        <button type="button" class="boton" data-r="mandar">${ICONO.whatsapp}Mandar a ${quien}</button>
        <button type="button" class="boton fantasma" data-r="volver">Volver a la rutina</button>
      </footer>
    </div>`;
  }

  async function mandar() {
    const hist = almacen.leer(clave, []);
    const resumen = { v: 1, para: r.para, de: r.de, m: tope, dias: hist.slice(-14) };
    const cod = await codificar(resumen);
    const url = `${location.origin}${location.pathname}${location.search}#s=${cod}`;
    const texto = `${r.para ? r.para + ': ' : ''}así va mi rutina (${hist.length} ${hist.length === 1 ? 'vez' : 'veces'}). ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
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
    capa.innerHTML = `<div class="hoja" role="dialog" aria-modal="true"><h2>${esc(def.nombre)}</h2>
      <ol class="como">${def.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
      ${e.n ? `<div class="tarjeta"><div class="nota">${esc(e.n)}</div></div>` : ''}
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
    if (a === 'mandar') return mandar();
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
          ${typeof x.m === 'number' ? `<span class="chip ${pasaDelTope(x.m, tope) ? 'vivo' : ''}">Molestia ${x.m}/10</span>` : '<span></span>'}
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
        ? `<div class="manana-linea"><span>A la mañana siguiente</span><span class="chip ${pasaDelTope(dia.a, tope) ? 'vivo' : ''}">Molestia ${dia.a}/10</span></div>`
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
      <p>Lo que ha hecho, de lo más reciente a lo más antiguo.</p>
    </header>
    <section class="lista">${dias.map((d) => resumenDia(d, tope)).join('')}</section>
  </div>`;
  return () => {};
}

// ---------- Router ----------
async function ir() {
  limpiar();
  document.querySelectorAll('.capa').forEach((c) => c.remove());
  const h = location.hash;
  if (h.startsWith('#r=')) limpiar = await vistaRutina(h.slice(3));
  else if (h.startsWith('#s=')) limpiar = await vistaResumen(h.slice(3));
  else limpiar = vistaArmar();
}
window.addEventListener('hashchange', ir);
ir();
