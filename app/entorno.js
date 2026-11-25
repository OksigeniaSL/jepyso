// What Jepyso is outside a course, at app.jepyso.com: the professional's people and their files, their cloud and their
// licence, the link that sends a routine, the summary that comes back and the help. app.js has the builder and the
// player, and asks this module for the rest; the copy for the Moodle activity (tools/construir-moodle.sh) comes with
// tools/moodle/entorno.js in its place, with the same exports, and with none of what is here nor of the modules only
// this one uses.
import {
  EJERCICIOS, TOPE_MOLESTIA, diaLocal, codificar, decodificar, almacen, pasaDelTope,
} from './datos.js';
import { t, tn, idioma, locale } from './idioma.js';
import { limpiarRutina, limpiarResumen, direccionVuelta } from './entrada.js';
import {
  leerPersonas, guardarPersonas, buscarPorNombre, crearPersona, apuntarRutina, apuntarResumen, semanas, copia, cargarCopia, caben, limite,
  esDePago, esEntornoDePruebas, leerBorradas, apuntarBorrada, LIMITE_GRATIS, sinNoticias,
} from './personas.js';
import { NUBES, nubeElegida, elegirNube, ultimaVez, apuntarVez, nubeAnterior, sincronizar } from './nube.js';
import { cargarGoogle } from './drive.js';
import { comprobarLicencia, licencia, licenciaPendiente, licenciaAnulada, comprobarVigencia, guardarLicencia, cuentaDelDrive, licenciaActiva, topeLicencia, nombrePlan } from './licencia.js';
import { ampliarPlan, enAppDeLaTienda } from './tienda.js';
import {
  valesEnMarcha, fichaAbierta, fichaSinPlaza, cuentaDeVales, fichasQuedan, avisoVales, alCambiarVales, comprobarVales, pedirVale, pedirVales,
  soltarVale, botonGoogle,
} from './vales.js';

// Kept in Spanish, as the key of its translation: the screens show it through t(SIN_SITIO).
const SIN_SITIO = 'No se ha podido guardar: este aparato no tiene más sitio para Jepyso. Guarda una copia en un archivo (en Personas) y borra lo que ya no uses.';

// The icons only used here.
const ICONOS = {
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.4 4.3 2.9 11.4c-1.3.5-1.3 1.2-.2 1.6l4.7 1.5 1.8 5.5c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.3-1.5zM8.6 14l9.2-5.8c.5-.3.9-.1.5.2l-7.5 6.8-.3 3.3L8.6 14z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
  compartir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
  compartirIos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M8 10H6v11h12V10h-2"/></svg>',
  puntos: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  candado: '<svg class="candado" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>',
  personas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2"/></svg>',
};

// The pieces of app.js used here (its page, its icons, its way of painting a day…): it hands them over as it starts, so
// neither module imports the other.
let app, ICONO, esc, barraApp, botonNueva, segmentos, paso, avisoRoto, resumenDia, diaMarcado, listaDias, hashCorto, leerPlantillas, ponerAlDia, borradorInicial, rutinaAlBorrador, ir;
export function preparar(piezas) {
  ({ app, ICONO, esc, barraApp, botonNueva, segmentos, paso, avisoRoto, resumenDia, diaMarcado, listaDias, hashCorto, leerPlantillas, ponerAlDia, borradorInicial, rutinaAlBorrador, ir } = piezas);
  Object.assign(ICONO, ICONOS);
}

// ---------- What app.js asks ----------
// The tabs of the professional's app.
export const PESTANAS = [['#', 'Nueva rutina', 'mas'], ['#personas', 'Personas', 'personas'], ['#plantillas', 'Plantillas', 'plantillas']];
// It can be installed, and its worker (sw.js) keeps it for when there is no connection.
export const INSTALABLE = true;
// Oksigenia signs every website it makes (shared/sitios-publicos.md): the line with its link.
export const firma = () => t('Jepyso · un producto de <a href="https://oksigenia.com">Oksigenia</a>');

// The steps on top of the builder: the key, the name and what is done of each.
export const etapasArmar = (b) => [
  ['para', t('Para quién'), b.publicar ? t('Para publicar') : b.para.trim()],
  ['ejercicios', t('Ejercicios'), b.orden.length ? String(b.orden.length) : ''],
  ['ajustes', t('Ajustes'), ''],
  ['enlace', t('Enlace'), ''],
];
export const textosArmar = () => ({
  crear: t('Crear enlace'),
  molestia: t('Si la persona pasa de esa molestia, el día te sale marcado en su resumen.'),
});
// Step 1 of the builder: for one person, or published.
export const pasoPara = (b) => `<p class="etapa-titulo" id="etapa-para-t"><b>1</b>${t('Para quién')}</p>
            <div class="destino">${segmentos('destino', [['persona', t('Para una persona')], ['publicar', t('Para publicar')]], b.publicar ? 'publicar' : 'persona', t('Para quién'))}</div>
            <div class="hueco-para">${camposPara(b)}</div>`;
// The taps and the typing of step 1. «editor» is the draft (b) and what paints the builder's steps again.
export function alPulsarArmar(accion, el, { b, actualizarBarra }) {
  if (accion === 'destino') {
    b.publicar = el.dataset.valor === 'publicar';
    el.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
    app.querySelector('.hueco-para').innerHTML = camposPara(b);
    actualizarBarra();
  } else if (accion === 'persona') {
    const p = leerPersonas().find((x) => x.id === el.dataset.id);
    if (!p) return;
    b.para = p.nombre;
    b.persona = p.id;
    if (Number.isInteger(p.m)) b.tope = p.m;
    app.querySelector('#para').value = p.nombre;
    app.querySelector('.hueco-recientes').innerHTML = personasRecientes(b);
    const tope = app.querySelector('.general [data-accion="tope"]')?.closest('.paso');
    if (tope) tope.outerHTML = paso('tope', b.tope, t('Molestia aceptable'), 0, 9);
  }
}
export function alEscribirArmar(accion, { b, pintarEtapas }) {
  if (accion === 'volver') {
    const aviso = app.querySelector('.aviso-volver');
    if (aviso) aviso.textContent = b.volver.trim() && !direccionVuelta(b.volver.trim()) ? t('La página tiene que empezar por https://') : '';
  }
  if (accion !== 'para') return;
  pintarEtapas();
  const lleno = app.querySelector('.hueco-lleno');
  if (lleno) lleno.innerHTML = avisoLleno(b);
  if (!b.persona) return;
  const elegida = leerPersonas().find((x) => x.id === b.persona);
  if (elegida && elegida.nombre === b.para.trim()) return;
  b.persona = null;
  app.querySelector('.hueco-recientes').innerHTML = personasRecientes(b);
}
// Before the builder opens: nothing to bring here.
export const antesDeArmar = async () => {};
// A template deleted is remembered, so a sync does not bring it back.
export const alBorrarPlantilla = (nombre) => apuntarBorrada('plantillas', nombre);

// The person's routine. «persona» is the routine (r), the key of its history (clave), its code, the acceptable
// discomfort (tope) and its seconds (totalSeg).
export const alAbrir = async () => {};
export const alGuardar = () => {};
export const avisoPersona = () => '';
// Where a day above the acceptable discomfort will show.
export const destinoMarca = (quien) => t('saldrá marcado en el resumen que le mandes a {quien}', { quien });
// The card with what is done: the way it goes back to the professional; with nothing done yet, no way.
export const tarjetaEnviar = (r, quien) => (r.o ? '' : `<p>${t('Mándaselo a {quien}: así ve cómo te va y te ajusta la rutina.', { quien })}</p>
        <div class="dos-botones"><button type="button" class="boton secundario" data-r="mandar" data-canal="wa">${ICONO.whatsapp}WhatsApp</button>
        <button type="button" class="boton secundario" data-r="mandar" data-canal="tg">${ICONO.telegram}Telegram</button></div>`);
export const tarjetaSinNada = () => '';
// A reminder in the phone's own calendar.
export const tarjetaRecordatorio = () => `<section class="tarjeta recordatorio" aria-labelledby="recordar-titulo">
          <h3 id="recordar-titulo">${t('Que no se te olvide')}</h3>
          <p>${t('Pon un aviso cada día en el calendario de tu teléfono, con el enlace a esta rutina.')}</p>
          <div class="recordatorio-fila">
            <label class="hora"><span>${t('A las')}</span><input type="time" value="10:00" data-r="hora-recordatorio"></label>
            <button type="button" class="boton secundario" data-r="recordatorio">${t('Añadir al calendario')}</button>
          </div>
          <p class="recordatorio-hecho" aria-live="polite"></p>
        </section>`;
// The end of a session: what to do with it. A published routine leads back to the page it came from, by its name.
export function pieFin(r) {
  if (r.o) {
    const sitio = r.u ? new URL(r.u).hostname.replace(/^www\./, '') : '';
    return `${r.u ? `<a class="boton" href="${esc(r.u)}">${ICONO.volver}${t('Volver a {sitio}', { sitio: esc(sitio) })}</a>` : ''}
        <button type="button" class="boton${r.u ? ' fantasma' : ''}" data-r="volver">${t('Volver a la rutina')}</button>
        ${tarjetaAMano()}`;
  }
  return `<button type="button" class="boton" data-r="mandar" data-canal="wa">${ICONO.whatsapp}${t('Mandar por WhatsApp')}</button>
        <button type="button" class="boton" data-r="mandar" data-canal="tg">${ICONO.telegram}${t('Mandar por Telegram')}</button>
        <button type="button" class="boton fantasma" data-r="volver">${t('Volver a la rutina')}</button>
        ${tarjetaAMano()}`;
}
export const textoFin = (r) => (r.o ? t('Queda apuntado en tu teléfono.') : r.de ? t('Mándale a {de} cómo te ha ido.', { de: esc(r.de) }) : '');
// Leaving halfway: what happens with what was done.
export const textoDejar = () => t('Lo que has hecho se guarda y puedes mandarlo.');
// The browser's storage is full: said once, with what to do.
export const textoSinSitio = () => t(SIN_SITIO);
// The taps on what this module paints in the routine: true when the tap was one of them.
export function alPulsarRutina(accion, el, persona) {
  if (accion === 'mandar') mandar(el.dataset.canal || 'wa', persona);
  else if (accion === 'recordatorio') recordatorio(persona);
  else if (accion === 'ya-la-tengo') {
    almacen.guardar('a-mano', true);
    app.querySelector('.a-mano')?.remove();
  } else return false;
  return true;
}

// The address before its view: a licence arriving in its link is kept, and the address cleaned (it is in the fragment,
// so no server saw it), then the professional's people, where it says what to do next.
export async function direccion(h) {
  if (!h.startsWith('#licencia=')) return h;
  const l = await guardarLicencia(h.slice(10));
  history.replaceState(null, '', `${location.pathname}#personas`);
  if (!l.valida) setTimeout(() => {
    const aviso = app.querySelector('.aviso-licencia');
    if (aviso) aviso.textContent = t(MOTIVOS_LICENCIA[l.motivo] || MOTIVOS_LICENCIA.formato);
  }, 0);
  return '#personas';
}
// The views that are only here, or null.
export function vista(h) {
  if (h.startsWith('#s=')) return () => vistaResumen(h.slice(3));
  if (h === '#personas') return vistaPersonas;
  if (!h.startsWith('#persona=')) return null;
  let id = '';
  try {
    id = decodeURIComponent(h.slice(9));
  } catch {
    // A mistyped address: read as a file that is not here.
  }
  return () => vistaPersona(id);
}
// Before the first view: the licence and the free files' tickets, as what is open must be known when it paints.
export function inicio() {
  // The paid version without a licence, for the tests: ?pago=1 switches it on in this browser, ?pago=0 off, only on
  // this laptop (personas.js). Anywhere else a switch left from before is cleared.
  const parametros = new URLSearchParams(location.search);
  if (!esEntornoDePruebas()) {
    if (almacen.leer('version', '') === 'pago') almacen.guardar('version', '');
  } else {
    if (parametros.has('pago')) almacen.guardar('version', parametros.get('pago') === '1' ? 'pago' : '');
    // The free files' tickets, on this laptop only when a test asks for them (?vales=1): on a public address, always.
    if (parametros.has('vales')) almacen.guardar('vales', parametros.get('vales') === '1' ? 'si' : '');
  }
  // After the Google sign-in, the files that opened: the professional's people, painted again where they are on view.
  alCambiarVales(() => {
    if (location.hash === '#personas' || location.hash.startsWith('#persona=')) ir();
  });
  return comprobarLicencia().then(comprobarVales);
}

// The help: what is asked most, and where to write. Someone who arrives from an app store finds them in the app itself.
export function ayuda() {
  const pregunta = (p, r) => `<details class="ayuda-plegada"><summary>${p}</summary><p>${r}</p></details>`;
  return `${pregunta(t('¿Cómo le mando una rutina a alguien?'), t('Ármala en «Nueva rutina» y pulsa «Crear enlace»: se lo mandas por WhatsApp, Telegram u otra app. Lo abre en su teléfono, sin instalar nada.'))}
    ${pregunta(t('¿Qué hace la persona?'), t('Sigue a la figura, que lleva el ritmo, el lado y las series que pusiste. Al acabar apunta lo que hizo y la molestia que notó, y te manda su resumen con un enlace: ábrelo en este aparato y se guarda en su ficha.'))}
    ${pregunta(t('¿Dónde se guardan mis fichas?'), t('En este aparato, y con un plan de pago también en tu nube (Google Drive, OneDrive o Dropbox), para tenerlas en todos tus aparatos. Desde «Personas» puedes guardar una copia en un archivo cuando quieras.'))}
    ${pregunta(t('¿Cuántas personas caben?'), `${t('Gratis, {n} con ficha; con un plan, las que diga tu licencia. Las rutinas se mandan igual a cualquiera, con ficha o sin ella.', { n: LIMITE_GRATIS })} ${ampliarPlan()}`)}
    ${pregunta(t('¿Cómo activo mi licencia?'), t('Abre el enlace que te llegó con ella, o pégala en «Personas», en «¿Tienes una licencia de Jepyso?». Después conecta tu nube con la cuenta de la licencia.'))}
    ${pregunta(t('¿Se puede cambiar la voz?'), t('Sí: al abrir su rutina, cada persona elige voz de mujer, voz de hombre o sin voz.'))}
    <section class="ayuda-contacto">
      <h3>${t('Contacto')}</h3>
      <p>${t('¿Algo no va como esperabas o tienes una idea? Escríbenos a <a href="mailto:contacto@oksigenia.com">contacto@oksigenia.com</a>.')}</p>
      <p><a href="${web().privacidad}" target="_blank" rel="noopener">${t('Privacidad')}</a> · <a href="${web().condiciones}" target="_blank" rel="noopener">${t('Condiciones')}</a> · <a href="${web().inicio}" target="_blank" rel="noopener">jepyso.com</a></p>
    </section>`;
}

// ---------- First use ----------
// The professional's first use: no link made yet, nobody in Personas and no template. Until then the builder opens with
// the way (build it and send it, the person does it, the summary comes back) and a routine to try.
const primerUso = () => !almacen.leer('estrenada', false) && !leerPersonas().length && !leerPlantillas().length;

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
export function bandaArmar(b) {
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

// The link of the routine to try, in the figure chosen, on its button as soon as it is made.
export function alPintarArmar(b) {
  const boton = app.querySelector('.probar-ejemplo');
  if (boton) enlaceEjemplo(b.cuerpo).then((url) => boton.isConnected && (boton.href = url));
}

// ---------- Sending ----------
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

// jepyso.com in the language in use.
const web = () => (idioma() === 'en'
  ? { inicio: 'https://jepyso.com/en/', privacidad: 'https://jepyso.com/en/privacy/', condiciones: 'https://jepyso.com/en/terms/' }
  : { inicio: 'https://jepyso.com', privacidad: 'https://jepyso.com/privacidad/', condiciones: 'https://jepyso.com/condiciones/' });
// A routine made with the free plan (g), published on a website or sent to one person, reaches professionals too: an
// invitation to make their own, with the routine and after the session. On Android it leads to the app on Google Play;
// elsewhere, to jepyso.com. Never inside the Google Play app, where nothing leads to buying. «donde»: «lista» (the list,
// on a phone), «panel» (the panel at the right, wide) or «fin» (after the session).
const PLAY = 'https://play.google.com/store/apps/details?id=com.oksigenia.jepyso';
export function invitacion(r, donde) {
  if (!r.g || enAppDeLaTienda) return '';
  const titulo = `invitacion-${donde}`;
  const ir = /Android/i.test(navigator.userAgent)
    ? `<a class="boton secundario" href="${PLAY}" target="_blank" rel="noopener">${t('Descárgala en Google Play')}</a>
       <a class="enlace" href="${web().inicio}" target="_blank" rel="noopener">${t('O conócela en jepyso.com')}</a>`
    : `<a class="boton secundario" href="${web().inicio}" target="_blank" rel="noopener">${t('Conoce Jepyso')}</a>`;
  return `<section class="tarjeta invitacion-pro invitacion-${donde}" aria-labelledby="${titulo}">
      <h3 id="${titulo}">${t('¿Eres profesional?')}</h3>
      <p>${t('Con Jepyso mandas rutinas como esta a tus pacientes, clientes o alumnos. Cada uno la hace en su teléfono, siguiendo a la figura, y tú ves cómo le va. Gratis para empezar.')}</p>
      ${ir}
    </section>`;
}

// ---------- The steps of the builder ----------
// Step 1, «Para quién»: one person (their name, and their file), or published (a blog, a website, social media), for
// whoever opens it: no name, no file and nothing sent back, with the page to go back to when it ends.
function camposPara(b) {
  if (b.publicar) {
    return `<div class="campos">
        <div class="campo"><label for="de">${t('Tu nombre o el de tu consulta')}</label><input id="de" data-accion="de" autocomplete="off" value="${esc(b.de)}"></div>
        <div class="campo"><label for="volver">${t('Tu página (si quieres)')}</label><input id="volver" data-accion="volver" type="url" inputmode="url" autocomplete="url" placeholder="https://" value="${esc(b.volver)}"></div>
      </div>
      <p class="ayuda">${t('Para ponerla en tu web, tu blog o tus redes. Quien la abra la hace en su teléfono y no te manda nada. Con tu página, al terminar le sale un enlace para volver a ella.')}</p>
      <p class="ayuda aviso-volver" aria-live="polite">${b.volver.trim() && !direccionVuelta(b.volver.trim()) ? t('La página tiene que empezar por https://') : ''}</p>`;
  }
  return `<div class="campos">
      <div class="campo"><label for="para">${t('Nombre de la persona')}</label><input id="para" data-accion="para" autocomplete="off" value="${esc(b.para)}"></div>
      <div class="campo"><label for="de">${t('Tu nombre')}</label><input id="de" data-accion="de" autocomplete="off" value="${esc(b.de)}"></div>
    </div>
    <div class="hueco-recientes">${personasRecientes(b)}</div>
    <div class="hueco-lleno">${avisoLleno(b)}</div>`;
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

// «Crear enlace»: the routine goes to its person's file, and the sheet with the link to send it opens.
export async function entregar(b, rutina, empezarOtra = null) {
  // The first link made: from now on the empty routine no longer explains the way.
  almacen.guardar('estrenada', true);
  if (b.publicar) Object.assign(rutina, { para: '', o: 1, u: direccionVuelta(b.volver.trim()), lg: idioma() });
  // Made with the free plan: the routine invites the professionals who see it (Enrique, 22-11-2026). With a paid plan
  // the routine is the professional's own, and carries nothing of Jepyso's.
  if (!licenciaActiva()) rutina.g = 1;
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
  const mensaje = rutina.o
    ? t('Una rutina de ejercicios para hacer en tu teléfono, siguiendo a la figura:')
    : rutina.para
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
    <p class="hoja-pie">${rutina.o
      ? t('Pon el enlace en tu web, tu blog o tus redes. Quien la abra la hace en su teléfono, y lo que apunte se queda en su teléfono. Todo va dentro del enlace: no pasa por ningún servidor de Oksigenia.')
      : t('Cuando la haga, te mandará su resumen: ábrelo en este aparato y se guarda en su ficha. Todo va dentro del enlace: no pasa por ningún servidor de Oksigenia.')}</p>
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

// ---------- The person: what goes back, the reminder, the home screen ----------
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

// A daily event in the phone's own calendar, with the link to this routine: an .ics file made here, opened by the
// phone's calendar; nothing goes through any server, and no app is needed for the reminder.
function recordatorio({ r, codigo, totalSeg }) {
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

// The summary goes back by WhatsApp or Telegram, as the person prefers. It carries the id of their file on the
// professional's side (p), so it lands on the right person even when two share a name.
async function mandar(canal, { r, clave, tope }) {
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
// A file made from a summary that brought no name is kept as «Sin nombre» (entrada.js): data, shown in the language
// in use. Any other name is the person's own.
const nombreDe = (p) => (p.nombre === 'Sin nombre' ? t('Sin nombre') : p.nombre);

const fechaLarga = (f) => {
  const d = new Date(f + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? t('sin fecha') : new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long' }).format(d);
};
const ultimaFecha = (p) => [p.ultimoResumen, ...p.rutinas.map((r) => r.f)].filter(Boolean).sort().at(-1) || p.creada;

// The tab of Personas carries how many people have sent nothing since their routine (sinNoticias): the professional
// sees it from any screen, without opening the list.
export function avisoPestana(pestanas) {
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

// With Google Drive chosen, its script loads as People opens, so the tap on «Sincronizar» opens Google's window at once:
// Safari blocks a window asked for after a download.
function precargarDrive() {
  if (app.querySelector('.nube') && nubeElegida() === 'google') cargarGoogle().catch(() => {});
}

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
  precargarDrive();
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
      precargarDrive();
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
