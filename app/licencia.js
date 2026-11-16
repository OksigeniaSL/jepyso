// The paid version's licence (the coordinator's design, 14-11-2026). A key signed by Oksigenia with Ed25519:
// base64url(payload) + "." + base64url(signature), no padding. The payload is the JSON
// {"p":"jepyso","s":"consulta","c":"<the account's e-mail, lower case>","f":"YYYY-MM-DD","n":"<order>"}, signed byte
// for byte. One payment, no expiry. It is checked here, with no connection, against Oksigenia's public key, and it only
// counts with the cloud connected to that same account (Google Drive, Dropbox or OneDrive, whose e-mail must be the
// licence's): a key passed to a colleague is no use to them. It arrives in a link (#licencia=…, a fragment: no server
// sees it) or pasted. Nothing about it is sent anywhere.
import { almacen } from './datos.js';
import { t } from './idioma.js';

const CLAVE_PUBLICA = 'WyU9AFvH45c_mKFK4-E4Qj2BZ4mRChFm6BNOVS5n8Z0';
const deBase64url = (t) => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

// Whatever Oksigenia signs with this key (a licence, a free file's ticket): its payload once the signature is checked,
// { datos } or { motivo }. motivo: «formato» (not a signed key), «firma» (not signed by Oksigenia, or changed),
// «navegador» (this browser cannot check Ed25519 signatures).
export async function verificarFirma(clave) {
  const partes = String(clave || '').trim().split('.');
  if (partes.length !== 2 || !partes[0] || !partes[1]) return { motivo: 'formato' };
  let carga;
  let firma;
  try {
    carga = deBase64url(partes[0]);
    firma = deBase64url(partes[1]);
  } catch {
    return { motivo: 'formato' };
  }
  let clavePublica;
  try {
    clavePublica = await crypto.subtle.importKey('raw', deBase64url(CLAVE_PUBLICA), { name: 'Ed25519' }, false, ['verify']);
  } catch {
    return { motivo: 'navegador' };
  }
  let bien = false;
  try {
    bien = await crypto.subtle.verify({ name: 'Ed25519' }, clavePublica, firma, carga);
  } catch {
    bien = false;
  }
  if (!bien) return { motivo: 'firma' };
  try {
    return { datos: JSON.parse(new TextDecoder().decode(carga)) };
  } catch {
    return { motivo: 'formato' };
  }
}

// The plans (Enrique, 15-11-2026): the licence says how many people with a file it holds in «m». One without it is
// of the highest plan (as the first ones, given before there were plans).
export const TOPE_MAXIMO = 300;
const PLANES = { 50: 'Profesional', 300: 'Centro' };
// Its name on screen: «Profesional», «Centro», or one made for another number of files.
export const nombrePlan = (tope) => (PLANES[tope] ? t(PLANES[tope]) : t('de {n} fichas', { n: tope }));

// What a key says, once its signature is checked: { valida, cuenta, fecha, pedido, tope } or { valida: false, motivo }.
export async function leerLicencia(clave) {
  const { datos, motivo } = await verificarFirma(clave);
  if (motivo) return { valida: false, motivo };
  if (datos?.p !== 'jepyso' || datos?.s !== 'consulta' || typeof datos?.c !== 'string' || !datos.c.includes('@')) return { valida: false, motivo: 'formato' };
  const tope = Number.isInteger(datos.m) && datos.m > 0 ? datos.m : TOPE_MAXIMO;
  return { valida: true, cuenta: datos.c.trim().toLowerCase(), fecha: String(datos.f || ''), pedido: String(datos.n || ''), tope };
}

// The state for this browser, checked once at start (comprobarLicencia) and kept in memory for the synchronous
// question «is this the paid version?».
let estado = { clave: '', valida: false, cuenta: '', activa: false, anulada: false };

export async function comprobarLicencia() {
  const clave = almacen.leer('licencia', '');
  const l = clave ? await leerLicencia(clave) : { valida: false };
  const comprobada = almacen.leer('licencia-cuenta', '');
  const anulada = l.valida && !!l.pedido && almacen.leer('licencia-anulada', '') === l.pedido;
  estado = {
    clave, valida: l.valida, motivo: l.motivo, cuenta: l.cuenta || '', pedido: l.pedido || '', tope: l.tope || 0, anulada,
    activa: l.valida && comprobada === l.cuenta && !anulada,
  };
  return estado;
}

export const licencia = () => estado;
export const licenciaActiva = () => estado.activa;
export const topeLicencia = () => estado.tope || TOPE_MAXIMO;
// A key that verifies but whose account has not yet been seen on the Drive connection.
export const licenciaPendiente = () => estado.valida && !estado.activa && !estado.anulada;
// A licence Oksigenia cancelled (passed to another account): its files are read, not synced, and no new ones are made.
export const licenciaAnulada = () => estado.valida && estado.anulada;

// Whether the licence is still alive, asked to Oksigenia's server on every sync with the Drive, which already needs a
// connection (the coordinator, 16-11-2026: a licence moved to a new e-mail cancels the old one, so changing account
// gives no more room). The answer, «estado», is signed with the licence key, {"p":"jepyso","t":"estado","n",
// "viva","f"}: about this order and dated within a week, so neither an invented answer nor an old one kept counts.
// Without connection, without an answer or with one that does not check, nothing changes. True while it is alive.
const DIAS_RESPUESTA = 7;
const reciente = (f) => {
  const dia = Date.parse(`${f}T12:00:00Z`);
  return Number.isFinite(dia) && Math.abs(Date.now() - dia) <= (DIAS_RESPUESTA + 1) * 86400000;
};
export async function comprobarVigencia() {
  if (!estado.valida || !estado.pedido) return !estado.anulada;
  let respuesta;
  try {
    const r = await fetch('/api/licencia/estado', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ n: estado.pedido }), cache: 'no-store',
    });
    respuesta = r.ok ? await r.json() : null;
  } catch {
    respuesta = null;
  }
  const { datos } = respuesta && typeof respuesta.estado === 'string' ? await verificarFirma(respuesta.estado) : {};
  if (!datos || datos.p !== 'jepyso' || datos.t !== 'estado' || datos.n !== estado.pedido || typeof datos.viva !== 'boolean' || !reciente(datos.f)) {
    return !estado.anulada;
  }
  if (!datos.viva) almacen.guardar('licencia-anulada', estado.pedido);
  else if (almacen.leer('licencia-anulada', '') === estado.pedido) almacen.guardar('licencia-anulada', '');
  await comprobarLicencia();
  return datos.viva;
}

export async function guardarLicencia(clave) {
  const l = await leerLicencia(clave);
  if (!l.valida) return l;
  almacen.guardar('licencia', String(clave).trim());
  if (almacen.leer('licencia-cuenta', '') !== l.cuenta) almacen.guardar('licencia-cuenta', '');
  await comprobarLicencia();
  return l;
}

// After connecting the cloud (Google Drive, Dropbox or OneDrive, nube.js): the e-mail of the account it was connected
// with. True when it is the licence's (and then it counts on this browser from now on); false when the licence is for
// another account. The same for every service: one licence, one account, so another service gives no more files.
export async function cuentaDelDrive(email) {
  const cuenta = String(email || '').trim().toLowerCase();
  if (!estado.valida) return false;
  if (cuenta !== estado.cuenta) return false;
  almacen.guardar('licencia-cuenta', cuenta);
  await comprobarLicencia();
  return true;
}
