// The paid version's licence (the coordinator's design, 14-11-2026). A key signed by Oksigenia with Ed25519:
// base64url(payload) + "." + base64url(signature), no padding. The payload is the JSON
// {"p":"jepyso","s":"consulta","c":"<Google account, lower case>","f":"YYYY-MM-DD","n":"<order>"}, signed byte for byte.
// One payment, no expiry. It is checked here, with no connection, against Oksigenia's public key, and it only counts
// with the Drive connected to that same account: a key passed to a colleague is no use to them. It arrives in a link
// (#licencia=…, a fragment: no server sees it) or pasted. Nothing about it is sent anywhere.
import { almacen } from './datos.js';

const CLAVE_PUBLICA = 'WyU9AFvH45c_mKFK4-E4Qj2BZ4mRChFm6BNOVS5n8Z0';
const deBase64url = (t) => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

// What a key says, once its signature is checked: { valida, cuenta, fecha, pedido } or { valida: false, motivo }.
// motivo: «formato» (not a key), «firma» (not signed by Oksigenia, or changed), «navegador» (this browser cannot check
// Ed25519 signatures).
export async function leerLicencia(clave) {
  const partes = String(clave || '').trim().split('.');
  if (partes.length !== 2 || !partes[0] || !partes[1]) return { valida: false, motivo: 'formato' };
  let carga;
  let firma;
  try {
    carga = deBase64url(partes[0]);
    firma = deBase64url(partes[1]);
  } catch {
    return { valida: false, motivo: 'formato' };
  }
  let clavePublica;
  try {
    clavePublica = await crypto.subtle.importKey('raw', deBase64url(CLAVE_PUBLICA), { name: 'Ed25519' }, false, ['verify']);
  } catch {
    return { valida: false, motivo: 'navegador' };
  }
  let bien = false;
  try {
    bien = await crypto.subtle.verify({ name: 'Ed25519' }, clavePublica, firma, carga);
  } catch {
    bien = false;
  }
  if (!bien) return { valida: false, motivo: 'firma' };
  let datos;
  try {
    datos = JSON.parse(new TextDecoder().decode(carga));
  } catch {
    return { valida: false, motivo: 'formato' };
  }
  if (datos?.p !== 'jepyso' || datos?.s !== 'consulta' || typeof datos?.c !== 'string' || !datos.c.includes('@')) return { valida: false, motivo: 'formato' };
  return { valida: true, cuenta: datos.c.trim().toLowerCase(), fecha: String(datos.f || ''), pedido: String(datos.n || '') };
}

// The state for this browser, checked once at start (comprobarLicencia) and kept in memory for the synchronous
// question «is this the paid version?».
let estado = { clave: '', valida: false, cuenta: '', activa: false };

export async function comprobarLicencia() {
  const clave = almacen.leer('licencia', '');
  const l = clave ? await leerLicencia(clave) : { valida: false };
  const comprobada = almacen.leer('licencia-cuenta', '');
  estado = { clave, valida: l.valida, motivo: l.motivo, cuenta: l.cuenta || '', activa: l.valida && comprobada === l.cuenta };
  return estado;
}

export const licencia = () => estado;
export const licenciaActiva = () => estado.activa;
// A key that verifies but whose account has not yet been seen on the Drive connection.
export const licenciaPendiente = () => estado.valida && !estado.activa;

export async function guardarLicencia(clave) {
  const l = await leerLicencia(clave);
  if (!l.valida) return l;
  almacen.guardar('licencia', String(clave).trim());
  if (almacen.leer('licencia-cuenta', '') !== l.cuenta) almacen.guardar('licencia-cuenta', '');
  await comprobarLicencia();
  return l;
}

// After connecting the Drive: the account it was connected with. True when it is the licence's (and then it counts on
// this browser from now on); false when the licence is for another account.
export async function cuentaDelDrive(email) {
  const cuenta = String(email || '').trim().toLowerCase();
  if (!estado.valida) return false;
  if (cuenta !== estado.cuenta) return false;
  almacen.guardar('licencia-cuenta', cuenta);
  await comprobarLicencia();
  return true;
}
