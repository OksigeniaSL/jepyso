// Jepyso inside a Moodle course: the activity mod_oksigeniajepyso (https://github.com/OksigeniaSL/moodle-mod_oksigeniajepyso)
// serves a copy of this app at /mod/oksigeniajepyso/reproductor/ and opens it as index.html?cm=<id>#r=<code>. There the
// person's sessions go to the course instead of a summary by WhatsApp or Telegram: each one is sent when it is saved,
// and what could not be sent (no connection, an expired login) goes the next time. The history comes from the course
// too, so it is the same on every device. The teacher opens the same address to build the routine (?armar=1) and to try
// it, without saving. Anywhere else (app.jepyso.com, the tests) nothing here does anything.
import { almacen } from './datos.js';
import { limpiarDia } from './entrada.js';
import { t } from './idioma.js';

const parametros = new URLSearchParams(location.search);
const enPlugin = location.pathname.includes('/mod/oksigeniajepyso/');
const cm = /^\d{1,10}$/.test(parametros.get('cm') || '') ? parametros.get('cm') : '';
export const enMoodle = enPlugin && !!cm;
export const armandoParaMoodle = enPlugin && parametros.get('armar') === '1';

let config = null;
let pidiendo = null;
const mismoSitio = (u) => {
  try {
    const url = new URL(u, location.href);
    return url.origin === location.origin ? url.href : '';
  } catch {
    return '';
  }
};

// What the course says about this person and this activity (sesion.php of the plugin). Without connection or with the
// login expired it stays null: the routine still opens, with what this device kept.
export function prepararMoodle() {
  if (!enMoodle) return Promise.resolve(null);
  pidiendo ||= fetch(`../sesion.php?cm=${cm}`, { credentials: 'same-origin', cache: 'no-store' })
    .then((r) => r.json())
    .then((c) => {
      if (!c || typeof c.sesskey !== 'string' || !mismoSitio(c.servicio)) return null;
      config = {
        sesskey: c.sesskey,
        servicio: mismoSitio(c.servicio),
        volver: mismoSitio(c.volver),
        actividad: typeof c.actividad === 'string' ? c.actividad.slice(0, 255) : '',
        nombre: typeof c.nombre === 'string' ? c.nombre.slice(0, 100) : '',
        puede: c.puede === true,
        sesiones: (Array.isArray(c.sesiones) ? c.sesiones : []).map((d) => limpiarDia(d, true)).filter(Boolean),
      };
      return config;
    })
    .catch(() => null)
    .finally(() => {
      pidiendo = null;
    });
  return pidiendo;
}

export const moodle = () => config;
// Who tries the routine without saving: the teacher, or anyone without the capability to submit.
export const vistaPrevia = () => enMoodle && config && !config.puede;
// Inside the Moodle app (official or Aty) the routine opens in its in-app browser, which says so in its user agent:
// there the way back is the window's own ×, and a link to the course would open the web page inside that window.
export const enAppDeMoodle = enMoodle && /MoodleMobile/.test(navigator.userAgent);
export const volverAlCurso = () => (enAppDeMoodle ? '' : config?.volver || '');
// The texts of this file are the keys of their translation: the screens show them through t().
export const TEXTO_CERRAR = 'Para volver al curso, cierra esta ventana con la × de arriba.';

const claveDia = (d) => `${d.f} ${d.h || ''}`;
const forma = (d) => JSON.stringify(limpiarDia(d, true));
const enviados = () => almacen.leer(`moodle:${cm}:enviado`, {});

// The course's sessions joined to the ones of this device: for the same day and time, the one corrected last wins, and
// the next-morning discomfort is kept if only one of them has it. What came from the course counts as sent.
export function juntarHistorial(clave) {
  const local = almacen.leer(clave, []);
  if (!config?.puede) return local;
  const todos = new Map(local.map((d) => [claveDia(d), d]));
  const hecho = enviados();
  for (const d of config.sesiones) {
    const k = claveDia(d);
    const aqui = todos.get(k);
    const gana = !aqui || (d.ed || '') >= (aqui.ed || '') ? d : aqui;
    const otro = gana === d ? aqui : d;
    if (gana.a === undefined && otro?.a !== undefined) gana.a = otro.a;
    todos.set(k, gana);
    if (gana === d) hecho[k] = forma(d);
  }
  const lista = [...todos.values()].sort((x, y) => claveDia(x).localeCompare(claveDia(y))).slice(-200);
  almacen.guardar(clave, lista);
  almacen.guardar(`moodle:${cm}:enviado`, hecho);
  return lista;
}

async function llamar(pendientes) {
  const r = await fetch(`${config.servicio}?sesskey=${encodeURIComponent(config.sesskey)}&info=mod_oksigeniajepyso_save_sessions`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ index: 0, methodname: 'mod_oksigeniajepyso_save_sessions', args: { cmid: Number(cm), sessions: JSON.stringify(pendientes) } }]),
  });
  const [respuesta] = await r.json();
  if (!respuesta || respuesta.error) throw new Error(respuesta?.exception?.errorcode || 'error');
  return respuesta.data;
}

let subiendo = Promise.resolve();
// Sends what changed since the last time and says how it went where the page has a place for it (.moodle-estado):
// «guardado», «pendiente» (it goes when there is connection) or «vista-previa».
export function subirHistorial(clave) {
  if (!enMoodle) return Promise.resolve('');
  subiendo = subiendo.then(async () => {
    if (!config) await prepararMoodle();
    if (!config) return mostrarEstado('pendiente');
    if (!config.puede) return mostrarEstado('vista-previa');
    const hecho = enviados();
    const pendientes = almacen.leer(clave, []).filter((d) => hecho[claveDia(d)] !== forma(d));
    if (!pendientes.length) return mostrarEstado('guardado');
    try {
      await llamar(pendientes);
    } catch {
      // A login or sesskey that expired while the page was open: asked again once.
      config = null;
      if (!(await prepararMoodle()) || !config.puede) return mostrarEstado('pendiente');
      try {
        await llamar(pendientes);
      } catch {
        return mostrarEstado('pendiente');
      }
    }
    for (const d of pendientes) hecho[claveDia(d)] = forma(d);
    almacen.guardar(`moodle:${cm}:enviado`, hecho);
    return mostrarEstado('guardado');
  });
  return subiendo;
}

export const TEXTO_ESTADO = {
  guardado: 'Guardado en el curso.',
  pendiente: 'Guardado en este teléfono. Se pasará al curso en cuanto haya conexión.',
  'vista-previa': 'Vista previa: lo que hagas aquí no se guarda en el curso.',
};

function mostrarEstado(estado) {
  document.querySelectorAll('.moodle-estado').forEach((p) => {
    p.textContent = TEXTO_ESTADO[estado] ? t(TEXTO_ESTADO[estado]) : '';
    p.dataset.estado = estado;
  });
  return estado;
}

// What waited for a connection goes as soon as there is one.
if (enMoodle) {
  window.addEventListener('online', () => {
    const clave = almacen.leer(`moodle:${cm}:clave`, '');
    if (clave) subirHistorial(clave);
  });
}
export const recordarClave = (clave) => enMoodle && almacen.guardar(`moodle:${cm}:clave`, clave);

// The routine already in the activity form, to build on it. The builder opens from that form, on the same site, so it
// can read the field: a code, or a whole link that carries one (…#r=code); anything else gives nothing.
export function rutinaDelFormulario() {
  if (!armandoParaMoodle) return '';
  try {
    const v = (window.opener?.document.getElementById('id_routine')?.value || '').trim();
    const codigo = v.includes('#r=') ? v.slice(v.indexOf('#r=') + 3) : v;
    return /^[A-Za-z0-9._-]{1,20000}$/.test(codigo) ? codigo : '';
  } catch {
    return '';
  }
}

// The teacher's builder, opened from the activity form: the routine goes back to the form, which fills its field.
export function devolverRutina(codigo) {
  if (!armandoParaMoodle || !window.opener) return false;
  window.opener.postMessage({ tipo: 'jepyso-rutina', codigo }, location.origin);
  window.close();
  return true;
}
