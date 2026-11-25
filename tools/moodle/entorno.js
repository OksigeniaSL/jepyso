// What Jepyso is inside a Moodle course: the activity mod_oksigeniajepyso
// (https://github.com/OksigeniaSL/moodle-mod_oksigeniajepyso) brings the builder and the player of the app (app.js),
// and tools/construir-moodle.sh puts this module in the place of app/entorno.js, with the same exports. Its pages,
// player.php and builder.php, say on #app who is there and in which activity. The person's sessions go to the course:
// each one is sent when it is saved, through Moodle's own service for external functions, and what could not be sent
// (no connection, an expired login) goes the next time. The history comes from the course too, so it is the same on
// every device. The teacher builds the routine for the form of the activity, and tries it without saving.
import { almacen, codificar, decodificar, ORDEN } from './datos.js';
import { limpiarDia, limpiarRutina } from './entrada.js';
import { t } from './idioma.js';
import { PROGRAMAS } from './programas.js';

// The pieces of app.js used here: it hands them over as it starts, so neither module imports the other.
let app, ICONO, esc, rutinaAlBorrador, cargarManifiesto;
export function preparar(piezas) {
  ({ app, ICONO, esc, rutinaAlBorrador, cargarManifiesto } = piezas);
}

// ---------- The page ----------
const pagina = document.getElementById('app').dataset;
const cm = /^\d{1,10}$/.test(pagina.cm || '') ? pagina.cm : '';
const puede = pagina.puede === '1';
let sesskey = pagina.sesskey || '';
const mismoSitio = (u) => {
  try {
    const url = new URL(u, location.href);
    return url.origin === location.origin ? url.href : '';
  } catch {
    return '';
  }
};
const servicio = mismoSitio(pagina.servicio);
// Inside the Moodle app (official or Aty) the routine opens in its in-app browser, which says so in its user agent:
// there the way back is the window's own ×, and a link to the course would open the web page inside that window.
const enAppDeMoodle = /MoodleMobile/.test(navigator.userAgent);
const volver = enAppDeMoodle ? '' : mismoSitio(pagina.volver);

// The routine of the activity comes in the page; the rest of the app reads it from the address, like any link.
if (cm && pagina.rutina) history.replaceState(history.state, '', `${location.pathname}${location.search}#r=${pagina.rutina}`);

// ---------- What app.js asks ----------
// Building for an activity there are no people to follow: the course does that.
export const PESTANAS = [['#', 'Nueva rutina', 'mas'], ['#plantillas', 'Plantillas', 'plantillas']];
// Moodle serves the app: nothing to install, and no worker of its own.
export const INSTALABLE = false;
export const firma = () => t('Jepyso · un producto de Oksigenia');
export const avisoPestana = () => {};

export const etapasArmar = (b) => [
  ['para', t('Quién la manda'), b.de.trim()],
  ['ejercicios', t('Ejercicios'), b.orden.length ? String(b.orden.length) : ''],
  ['ajustes', t('Ajustes'), ''],
  ['enlace', t('Actividad'), ''],
];
export const textosArmar = () => ({
  crear: t('Usar en la actividad'),
  molestia: t('Si alguien pasa de esa molestia, el día te sale marcado en su seguimiento.'),
});
export const pasoPara = (b) => `<p class="etapa-titulo" id="etapa-para-t"><b>1</b>${t('Quién la manda')}</p>
            <div class="campos">
              <div class="campo"><label for="de">${t('Tu nombre')}</label><input id="de" data-accion="de" autocomplete="off" value="${esc(b.de)}"></div>
            </div>
            <p class="ayuda">${t('Es para toda la clase: cada uno la verá con su nombre, como «Tu rutina de» y el tuyo.')}</p>`;
export const bandaArmar = () => '';
export const alPintarArmar = () => {};
export const alPulsarArmar = () => {};
export const alEscribirArmar = (accion, { pintarEtapas }) => {
  if (accion === 'de') pintarEtapas();
};
export const alBorrarPlantilla = () => {};

// «Armar la rutina» on an activity that has one opens the builder with it, once per window. The builder opens from the
// form, on the same site, so it can read the field: a code, or a whole link that carries one (…#r=code); anything else
// gives nothing.
function rutinaDelFormulario() {
  try {
    const v = (window.opener?.document.getElementById('id_routine')?.value || '').trim();
    const codigo = v.includes('#r=') ? v.slice(v.indexOf('#r=') + 3) : v;
    return /^[A-Za-z0-9._-]{1,20000}$/.test(codigo) ? codigo : '';
  } catch {
    return '';
  }
}
let formularioLeido = false;
export async function antesDeArmar() {
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
  if (r?.e?.length) rutinaAlBorrador(r, { para: '', publicar: false, volver: '', ...(r.de ? { de: r.de } : {}) });
}

// «Usar en la actividad»: the routine goes back to the form, for the whole class, and the window closes. Opened without
// the form behind, its code to copy.
export async function entregar(b, rutina) {
  const codigo = await codificar({ ...rutina, para: '' });
  if (window.opener) {
    window.opener.postMessage({ tipo: 'jepyso-rutina', codigo }, location.origin);
    window.close();
    return;
  }
  const volverA = document.activeElement;
  const dialogo = document.createElement('dialog');
  dialogo.className = 'hoja hoja-enlace';
  dialogo.setAttribute('aria-labelledby', 'hoja-titulo');
  dialogo.innerHTML = `<div class="hoja-cabeza"><h2 id="hoja-titulo" tabindex="-1">${t('La rutina, lista')}</h2>
      <button type="button" class="redondo" data-h="cerrar" aria-label="${t('Cerrar')}">${ICONO.cerrar}</button></div>
    <p>${t('El formulario de la actividad no está abierto detrás de esta ventana. Copia el código y pégalo allí.')}</p>
    <div class="enlace-texto">${esc(codigo)}</div>
    <div class="hoja-mandar"><button type="button" class="boton" data-h="copiar">${t('Copiar el código')}</button></div>`;
  document.body.appendChild(dialogo);
  dialogo.addEventListener('close', () => {
    dialogo.remove();
    volverA?.focus?.({ preventScroll: true });
  });
  dialogo.addEventListener('click', async (ev) => {
    if (ev.target.closest('[data-h="cerrar"]')) return dialogo.close();
    const boton = ev.target.closest('[data-h="copiar"]');
    if (!boton) return;
    try {
      await navigator.clipboard.writeText(codigo);
      boton.textContent = t('Copiado');
    } catch {
      boton.textContent = t('No se pudo copiar');
    }
  });
  dialogo.showModal();
  dialogo.querySelector('#hoja-titulo').focus({ preventScroll: true });
}

// The help of the builder.
export function ayuda() {
  const pregunta = (p, r) => `<details class="ayuda-plegada"><summary>${p}</summary><p>${r}</p></details>`;
  return `${pregunta(t('¿Cómo pongo la rutina en la actividad?'), t('Ármala en «Nueva rutina» y pulsa «Usar en la actividad»: vuelve sola al formulario. Guarda la actividad para que la clase la vea.'))}
    ${pregunta(t('¿Qué hace cada estudiante?'), t('Sigue a la figura, que lleva el ritmo, el lado y las series que pusiste. Al acabar apunta lo que hizo y la molestia que notó, y la sesión se guarda en el curso.'))}
    ${pregunta(t('¿Dónde veo cómo le va a la clase?'), t('En la actividad, en «Ver el seguimiento»: quién la ha hecho, los días que pasaron de la molestia aceptable, lo que costó y las notas.'))}
    ${pregunta(t('¿Dónde se guardan mis plantillas?'), t('En este navegador. Una plantilla guarda los ejercicios y sus ajustes, para usarlos en otra rutina.'))}
    ${pregunta(t('¿Se puede cambiar la voz?'), t('Sí: al abrir su rutina, cada persona elige voz de mujer, voz de hombre o sin voz.'))}`;
}

// ---------- The person ----------
// A call to an external function of the plugin, at the address core/ajax uses. The player is a page of its own, without
// Moodle's scripts. A sesskey that expired while it was open is asked again, once, to the same page: with the session
// over, what comes is the login page, which has none.
async function llamar(metodo, args, otraVez = true) {
  const r = await fetch(`${servicio}?sesskey=${encodeURIComponent(sesskey)}&info=${metodo}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ index: 0, methodname: metodo, args }]),
  });
  const cuerpo = await r.json();
  const respuesta = Array.isArray(cuerpo) ? cuerpo[0] : cuerpo;
  if (respuesta && !respuesta.error) return respuesta.data;
  if (otraVez && (await renovar())) return llamar(metodo, args, false);
  throw new Error(respuesta?.exception?.errorcode || respuesta?.errorcode || 'error');
}
async function renovar() {
  const r = await fetch(`${location.pathname}${location.search}`, { credentials: 'same-origin', cache: 'no-store' });
  const nueva = new DOMParser().parseFromString(await r.text(), 'text/html').querySelector('#app[data-sesskey]')?.dataset.sesskey || '';
  if (!nueva || nueva === sesskey) return false;
  sesskey = nueva;
  return true;
}

// The sessions this person has in the course. Without connection or with the login expired it stays null: the routine
// still opens, with what this device kept.
let delCurso = null;
async function pedirSesiones() {
  if (!puede || delCurso) return;
  try {
    const d = await llamar('mod_oksigeniajepyso_get_sessions', { cmid: Number(cm) });
    const lista = JSON.parse(d.sessions);
    delCurso = (Array.isArray(lista) ? lista : []).map((x) => limpiarDia(x, true)).filter(Boolean);
  } catch {
    delCurso = null;
  }
}

const claveDia = (d) => `${d.f} ${d.h || ''}`;
const forma = (d) => JSON.stringify(limpiarDia(d, true));
const enviados = () => almacen.leer(`moodle:${cm}:enviado`, {});

// The course's sessions joined to the ones of this device: for the same day and time, the one corrected last wins, and
// the next-morning discomfort is kept if only one of them has it. What came from the course counts as sent.
function juntarHistorial(clave) {
  if (!delCurso) return;
  const todos = new Map(almacen.leer(clave, []).map((d) => [claveDia(d), d]));
  const hecho = enviados();
  for (const d of delCurso) {
    const k = claveDia(d);
    const aqui = todos.get(k);
    const gana = !aqui || (d.ed || '') >= (aqui.ed || '') ? d : aqui;
    const otro = gana === d ? aqui : d;
    if (gana.a === undefined && otro?.a !== undefined) gana.a = otro.a;
    todos.set(k, gana);
    if (gana === d) hecho[k] = forma(d);
  }
  almacen.guardar(clave, [...todos.values()].sort((x, y) => claveDia(x).localeCompare(claveDia(y))).slice(-200));
  almacen.guardar(`moodle:${cm}:enviado`, hecho);
}

// The person is the one logged in, and the history, the course's.
export async function alAbrir(r, clave) {
  r.para ||= (pagina.nombre || '').slice(0, 100);
  await pedirSesiones();
  juntarHistorial(clave);
  if (cm) almacen.guardar(`moodle:${cm}:clave`, clave);
}

let subiendo = Promise.resolve();
// Sends what changed since the last time and says how it went where the page has a place for it (.moodle-estado):
// «guardado», «pendiente» (it goes when there is connection) or «vista-previa» (the teacher, or anyone without the
// capability to submit).
export function alGuardar(clave) {
  subiendo = subiendo.then(async () => {
    if (!puede) return mostrarEstado('vista-previa');
    const hecho = enviados();
    const pendientes = almacen.leer(clave, []).filter((d) => hecho[claveDia(d)] !== forma(d));
    if (!pendientes.length) return mostrarEstado('guardado');
    try {
      await llamar('mod_oksigeniajepyso_save_sessions', { cmid: Number(cm), sessions: JSON.stringify(pendientes) });
    } catch {
      return mostrarEstado('pendiente');
    }
    for (const d of pendientes) hecho[claveDia(d)] = forma(d);
    almacen.guardar(`moodle:${cm}:enviado`, hecho);
    return mostrarEstado('guardado');
  });
  return subiendo;
}

const textoEstado = (estado) => ({
  guardado: t('Guardado en el curso.'),
  pendiente: t('Guardado en este teléfono. Se pasará al curso en cuanto haya conexión.'),
  'vista-previa': t('Vista previa: lo que hagas aquí no se guarda en el curso.'),
})[estado] || '';
function mostrarEstado(estado) {
  document.querySelectorAll('.moodle-estado').forEach((p) => {
    p.textContent = textoEstado(estado);
    p.dataset.estado = estado;
  });
  return estado;
}

// What waited for a connection goes as soon as there is one.
window.addEventListener('online', () => {
  const clave = cm && almacen.leer(`moodle:${cm}:clave`, '');
  if (clave) alGuardar(clave);
});

export const avisoPersona = () => (puede ? '' : `<p class="moodle-aviso">${textoEstado('vista-previa')}</p>`);
export const destinoMarca = (quien) => t('saldrá marcado en lo que ve {quien} en el curso', { quien });
// What is done goes to the course by itself: the card says where it is and leads back.
const salida = (clase) => (volver
  ? `<a class="${clase}" href="${esc(volver)}">${ICONO.volver}${t('Volver al curso')}</a>`
  : enAppDeMoodle ? `<p class="moodle-cerrar">${t('Para volver al curso, cierra esta ventana con la × de arriba.')}</p>` : '');
export const tarjetaEnviar = () => `<p class="moodle-estado" aria-live="polite"></p>${salida('boton secundario')}`;
export const tarjetaSinNada = () => salida('boton secundario');
export const tarjetaRecordatorio = () => '';
export const invitacion = () => '';
export const pieFin = () => `<p class="moodle-estado" aria-live="polite"></p>
        ${salida('boton')}
        <button type="button" class="boton fantasma" data-r="volver">${t('Volver a la rutina')}</button>`;
export const textoFin = () => '';
export const textoDejar = () => t('Lo que has hecho se guarda en el curso.');
export const textoSinSitio = () => t('No se ha podido guardar: este navegador no tiene más sitio. Borra lo que ya no uses.');
export const alPulsarRutina = () => false;

// ---------- The addresses ----------
export const direccion = async (h) => h;
export const vista = () => null;
// The library and the programmes offer only what the plugin brings (its sample, or the whole library): the exercises
// with their clip in both figures.
export async function inicio() {
  if (cm) return;
  try {
    const [a, b] = await Promise.all([cargarManifiesto('a'), cargarManifiesto('b')]);
    const hay = (id) => !!(a.ejercicios[id] && b.ejercicios[id]);
    for (let k = ORDEN.length - 1; k >= 0; k--) if (!hay(ORDEN[k])) ORDEN.splice(k, 1);
    for (let k = PROGRAMAS.length - 1; k >= 0; k--) if (!PROGRAMAS[k].orden.every(hay)) PROGRAMAS.splice(k, 1);
  } catch {
    // Without the lists the whole library stays: the activity form says which exercises the site does not have.
  }
}
