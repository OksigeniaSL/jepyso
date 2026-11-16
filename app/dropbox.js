// Dropbox as the professional's own cloud (the paid version): the app's own folder, «Apps/Jepyso», which is all the
// app can see, and one file in it, «jepyso.json». No server: the permission window and the token exchange happen in
// the browser (oauth.js), and the token, short-lived (token_access_type=online), lives only in memory. A new one
// needs a tap, as with Google.
import { t } from './idioma.js';
import { pedirPermiso, canjear } from './oauth.js';

// Oksigenia's Dropbox app «Jepyso» (scoped, app folder only, public client with PKCE). Public by design: it names the
// app, and there is no secret.
export const CLAVE = 'ea6864u2uckm0dw';
const AUTORIZAR = 'https://www.dropbox.com/oauth2/authorize';
const TOKEN = 'https://api.dropboxapi.com/oauth2/token';
const API = 'https://api.dropboxapi.com/2';
const CONTENIDO = 'https://content.dropboxapi.com/2';
// Inside the app folder: «/» is «Apps/Jepyso».
const RUTA = '/jepyso.json';
const NUBE = 'Dropbox';

let token = null; // { valor, caduca }
// After an account the licence refused, the next window asks to sign in again (once): Dropbox would otherwise go
// straight back with the account already signed in on this browser.
let otraCuenta = false;

export const conectado = () => !!token && token.caduca > Date.now() + 60_000;
export const olvidar = () => {
  token = null;
  otraCuenta = true;
};

// A token for the app folder: the one in memory while it lasts, or a new one through Dropbox's window. Call it from
// a tap.
export async function conectar() {
  if (conectado()) return;
  const reautenticar = otraCuenta;
  otraCuenta = false;
  const { code, verificador, redireccion } = await pedirPermiso({
    empresa: NUBE,
    nube: NUBE,
    autorizar: ({ reto, estado, redireccion: vuelta }) => `${AUTORIZAR}?${new URLSearchParams({
      client_id: CLAVE,
      response_type: 'code',
      redirect_uri: vuelta,
      state: estado,
      code_challenge: reto,
      code_challenge_method: 'S256',
      token_access_type: 'online',
      ...(reautenticar ? { force_reauthentication: 'true' } : {}),
    })}`,
  });
  token = await canjear(TOKEN, { code, grant_type: 'authorization_code', code_verifier: verificador, client_id: CLAVE, redirect_uri: redireccion }, NUBE);
}

const caducada = () => new Error(t('La conexión con tu {nube} ha caducado: vuelve a sincronizar.', { nube: NUBE }));
const malaRespuesta = (estado) => new Error(t('Tu {nube} no ha respondido bien ({estado}).', { nube: NUBE, estado }));

// Every call to Dropbox is a POST with the token; an expired one is forgotten and said.
async function pedir(url, { headers = {}, body } = {}) {
  if (!conectado()) throw caducada();
  let r;
  try {
    r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token.valor}`, ...headers }, body, cache: 'no-store' });
  } catch {
    throw new Error(t('No se ha podido hablar con {empresa}. Mira si hay red.', { empresa: NUBE }));
  }
  if (r.status === 401) {
    token = null;
    throw caducada();
  }
  return r;
}
// Dropbox says what went wrong in error_summary, such as «path/not_found/..» or «path/insufficient_space/».
const resumenDeError = async (r) => String((await r.json().catch(() => ({}))).error_summary || '');

// The Dropbox account's e-mail, to tell whether a licence is this professional's. Only a confirmed one: anyone can
// open a Dropbox account with someone else's address, but cannot confirm it.
export async function cuenta() {
  const r = await pedir(`${API}/users/get_current_account`);
  if (!r.ok) throw malaRespuesta(r.status);
  const d = await r.json();
  if (d.email && d.email_verified === false) throw new Error(t('Confirma el correo de tu cuenta de {empresa} y vuelve a sincronizar.', { empresa: NUBE }));
  return d.email || '';
}

// What the app folder keeps, as text, or null while there is no file yet (nube.js joins and checks it).
export async function leer() {
  const r = await pedir(`${CONTENIDO}/files/download`, { headers: { 'Dropbox-API-Arg': JSON.stringify({ path: RUTA }) } });
  if (r.status === 409 && (await resumenDeError(r)).startsWith('path/not_found')) return null;
  if (!r.ok) throw malaRespuesta(r.status);
  return r.text();
}

// Writes the file whole, over the one there (mute: no notice on the professional's computers for each sync).
export async function escribir(texto) {
  const r = await pedir(`${CONTENIDO}/files/upload`, {
    headers: { 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': JSON.stringify({ path: RUTA, mode: 'overwrite', mute: true }) },
    body: texto,
  });
  if (r.status === 409 && (await resumenDeError(r)).includes('insufficient_space')) throw new Error(t('Tu {nube} está lleno: haz sitio y vuelve a sincronizar.', { nube: NUBE }));
  if (!r.ok) throw malaRespuesta(r.status);
}
