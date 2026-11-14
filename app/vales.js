// The free version's files, counted per Google account (the coordinator's design, with Enrique's yes, 14-11-2026). A
// free file opens only with its ticket («vale»): Oksigenia's server gives one per file to a Google account, up to five
// per account, so opening the app in more browsers, profiles or containers gives no more files. The ticket is signed
// like the licence, with the payload {"p":"jepyso","t":"ficha","f":<file id>}, and it is kept in the file itself: once
// a file has it, it opens in this browser with no connection and no account. The server keeps an HMAC of the account
// and the files' ids, nothing else; the names, routines and summaries never leave the professional's device. Each
// browser still keeps five files at most (personas.js), so two accounts do not make ten files in one browser. The paid
// version needs no tickets.
import { almacen } from './datos.js';
import { verificarFirma } from './licencia.js';
import { CLIENTE, cargarGoogle } from './drive.js';
import { leerPersonas, guardarPersonas, esDePago, esEntornoDePruebas } from './personas.js';
import { esId } from './entrada.js';

const API = '/api/fichas';

let cuenta = null; // { token, correo, caduca }: the Google sign-in, only in memory
const validas = new Set(); // files whose ticket checked
const sinPlaza = new Set(); // files the account had no room for, this session
let quedan = null; // free files left on the account, as the server last said
let aviso = ''; // the last thing that went wrong, said under Google's button
let alCambiar = () => {};

// On a public address, always; on this laptop only with ?vales=1, so the other tests keep their files open.
export const valesEnMarcha = () => !esDePago() && (!esEntornoDePruebas() || almacen.leer('vales', '') === 'si');
export const fichaAbierta = (p) => !valesEnMarcha() || validas.has(p.id);
export const fichaSinPlaza = (id) => sinPlaza.has(id);
export const cuentaDeVales = () => (cuenta && cuenta.caduca > Date.now() + 30_000 ? cuenta.correo : '');
export const fichasQuedan = () => quedan;
export const avisoVales = () => aviso;
export const alCambiarVales = (f) => {
  alCambiar = f;
};

const deBase64url = (t) => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const json = (t) => JSON.parse(new TextDecoder().decode(deBase64url(t)));

// A ticket for this file. A browser that cannot check Ed25519 (an older iPhone) takes it on its word: the server is
// where the count is kept, and locking those phones out would only punish them.
async function valeDe(vale, id) {
  if (typeof vale !== 'string') return false;
  let { datos, motivo } = await verificarFirma(vale);
  if (motivo === 'navegador') {
    try {
      datos = json(vale.split('.')[0]);
      motivo = '';
    } catch {
      return false;
    }
  }
  return !motivo && datos?.p === 'jepyso' && datos?.t === 'ficha' && datos?.f === id;
}

// Once at start, before the first view, and again whenever the files may have changed under it (a copy loaded).
export async function comprobarVales() {
  validas.clear();
  if (!valesEnMarcha()) return;
  for (const p of leerPersonas()) if (await valeDe(p.vale, p.id)) validas.add(p.id);
}

async function llamar(ruta, ficha) {
  const r = await fetch(API + ruta, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: cuenta.token, ficha }),
    credentials: 'omit',
    cache: 'no-store',
  });
  let datos = {};
  try {
    datos = await r.json();
  } catch {
    // An error page from a proxy: only the status counts.
  }
  return { estado: r.status, datos };
}

const NO_HAY_SERVICIO = 'Ahora no se puede hablar con Jepyso para abrir las fichas. Mira si hay conexión y vuelve a probar en un rato.';

// The ticket for one file, from the server. True when the file has it now.
export async function pedirVale(id) {
  if (!valesEnMarcha() || validas.has(id)) return true;
  if (!cuentaDeVales() || !esId(id)) return false;
  let r;
  try {
    r = await llamar('', id);
  } catch {
    aviso = NO_HAY_SERVICIO;
    return false;
  }
  if (r.estado === 200 && (await valeDe(r.datos?.vale, id))) {
    const lista = leerPersonas();
    const p = lista.find((x) => x.id === id);
    if (!p) {
      // Deleted while the answer was on its way: its place goes back.
      soltarId(id);
      return false;
    }
    p.vale = r.datos.vale;
    guardarPersonas(lista);
    validas.add(id);
    sinPlaza.delete(id);
    if (Number.isInteger(r.datos.quedan)) quedan = r.datos.quedan;
    aviso = '';
    return true;
  }
  if (r.estado === 403) {
    sinPlaza.add(id);
    quedan = 0;
    aviso = '';
  } else if (r.estado === 401) {
    cuenta = null;
    aviso = 'Google no ha dado por buena la entrada. Vuelve a entrar con tu cuenta.';
  } else if (r.estado === 429) aviso = 'Demasiadas peticiones seguidas. Espera un minuto y vuelve a probar.';
  else aviso = NO_HAY_SERVICIO;
  return false;
}

// Every file here without its ticket, oldest first, so the ones in use since before keep their place. A file the
// account already has from another device comes back without counting, so a «no room» for one does not stop the rest.
export async function pedirVales() {
  for (const p of leerPersonas()) {
    if (validas.has(p.id) || sinPlaza.has(p.id)) continue;
    const bien = await pedirVale(p.id);
    if (!bien && !sinPlaza.has(p.id)) break;
  }
}

// A deleted file gives its place back. Without a sign-in at hand it waits, and goes with the next one.
const leerBajas = () => {
  const b = almacen.leer('vales-bajas', []);
  return Array.isArray(b) ? b.filter((id) => typeof id === 'string' && esId(id)) : [];
};
function soltarId(id) {
  const b = leerBajas();
  if (!b.includes(id)) almacen.guardar('vales-bajas', [...b, id]);
  validas.delete(id);
  sinPlaza.delete(id);
  soltarPendientes();
}
export function soltarVale(p) {
  if (p?.vale) soltarId(p.id);
}
async function soltarPendientes() {
  if (!cuentaDeVales()) return;
  for (const id of leerBajas()) {
    let r;
    try {
      r = await llamar('/baja', id);
    } catch {
      return;
    }
    if (r.estado === 401) {
      cuenta = null;
      return;
    }
    if (r.estado === 429 || r.estado >= 500) return;
    if (Number.isInteger(r.datos?.quedan)) quedan = r.datos.quedan;
    almacen.guardar('vales-bajas', leerBajas().filter((x) => x !== id));
  }
}

// Google's sign-in (Google Identity Services): its own button, and One Tap for someone who already came in, who then
// gets in without a tap. Only the ID token is used: it says which account, to the server, and nothing else is asked.
async function entrar(credencial) {
  try {
    const d = json(String(credencial).split('.')[1]);
    cuenta = { token: credencial, correo: String(d.email || ''), caduca: Number(d.exp) * 1000 };
  } catch {
    return;
  }
  aviso = '';
  await soltarPendientes();
  await pedirVales();
  alCambiar();
}

let iniciado = false;
let preguntado = false;
async function prepararGoogle() {
  const google = await cargarGoogle();
  if (!iniciado) {
    google.accounts.id.initialize({
      client_id: CLIENTE,
      callback: (r) => entrar(r.credential),
      auto_select: true,
      cancel_on_tap_outside: true,
      context: 'signin',
      itp_support: true,
      use_fedcm_for_prompt: true,
      use_fedcm_for_button: true,
    });
    iniciado = true;
  }
  return google;
}

// Google's button in this space, in the app's light or dark. The first time in a visit, One Tap too.
export async function botonGoogle(hueco) {
  try {
    const google = await prepararGoogle();
    if (!hueco.isConnected) return;
    hueco.textContent = '';
    const oscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    google.accounts.id.renderButton(hueco, {
      type: 'standard',
      theme: oscuro ? 'filled_black' : 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      locale: 'es',
    });
    if (!preguntado) {
      preguntado = true;
      google.accounts.id.prompt();
    }
  } catch (err) {
    if (hueco.isConnected) hueco.textContent = err.message;
  }
}
