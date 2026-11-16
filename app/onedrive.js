// OneDrive as the professional's own cloud (the paid version): the app's own folder, «Apps/Jepyso», which is all the
// app can see (Files.ReadWrite.AppFolder), and one file in it, «jepyso.json». Personal Microsoft accounts and work or
// school ones alike (the «common» authority). No server: the permission window and the token exchange happen in the
// browser (oauth.js), and the token lives only in memory, with no refresh token. A new one needs a tap, as with Google.
import { t } from './idioma.js';
import { pedirPermiso, canjear } from './oauth.js';

// Oksigenia's registration «Jepyso» in its Entra directory (single-page application, PKCE). Public by design: it names
// the app, and there is no secret.
export const CLIENTE = 'e52faaf4-fe0c-49d3-9950-d92bec40b060';
const AUTORIDAD = 'https://login.microsoftonline.com/common/oauth2/v2.0';
// The app folder and the account's address: nothing more. No offline_access: the token is not kept, so a refresh token
// would only be one more thing to ask for.
const AMBITOS = 'Files.ReadWrite.AppFolder User.Read';
const GRAPH = 'https://graph.microsoft.com/v1.0';
const ARCHIVO = `${GRAPH}/me/drive/special/approot:/jepyso.json`;
const NUBE = 'OneDrive';
const EMPRESA = 'Microsoft';

let token = null; // { valor, caduca }

export const conectado = () => !!token && token.caduca > Date.now() + 60_000;
export const olvidar = () => {
  token = null;
};

// A token for the app folder: the one in memory while it lasts, or a new one through Microsoft's window, which always
// asks which account (prompt=select_account). Call it from a tap.
export async function conectar() {
  if (conectado()) return;
  const { code, verificador, redireccion } = await pedirPermiso({
    empresa: EMPRESA,
    nube: NUBE,
    autorizar: ({ reto, estado, redireccion: vuelta }) => `${AUTORIDAD}/authorize?${new URLSearchParams({
      client_id: CLIENTE,
      response_type: 'code',
      redirect_uri: vuelta,
      response_mode: 'query',
      scope: AMBITOS,
      state: estado,
      code_challenge: reto,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    })}`,
  });
  token = await canjear(`${AUTORIDAD}/token`, {
    client_id: CLIENTE, scope: AMBITOS, code, redirect_uri: redireccion, grant_type: 'authorization_code', code_verifier: verificador,
  }, EMPRESA);
}

const caducada = () => new Error(t('La conexión con tu {nube} ha caducado: vuelve a sincronizar.', { nube: NUBE }));
const malaRespuesta = (estado) => new Error(t('Tu {nube} no ha respondido bien ({estado}).', { nube: NUBE, estado }));
const sinRed = () => new Error(t('No se ha podido hablar con {empresa}. Mira si hay red.', { empresa: EMPRESA }));

// Every call to Microsoft Graph carries the token; an expired one is forgotten and said.
async function pedir(url, { method = 'GET', headers = {}, body } = {}) {
  if (!conectado()) throw caducada();
  let r;
  try {
    r = await fetch(url, { method, headers: { Authorization: `Bearer ${token.valor}`, ...headers }, body, cache: 'no-store' });
  } catch {
    throw sinRed();
  }
  if (r.status === 401) {
    token = null;
    throw caducada();
  }
  return r;
}

// The Microsoft account's e-mail, to tell whether a licence is this professional's: its mail, or the address it signs
// in with (personal accounts often have no mail of their own).
export async function cuenta() {
  const r = await pedir(`${GRAPH}/me?$select=mail,userPrincipalName`);
  if (!r.ok) throw malaRespuesta(r.status);
  const d = await r.json();
  return d.mail || d.userPrincipalName || '';
}

// What the app folder keeps, as text, or null while there is no file yet (nube.js joins and checks it). The file's
// own address (/content) answers with a redirect to Microsoft's storage, which a browser cannot follow with the token
// on (Microsoft's guide for JavaScript apps); so the file's details are read first, and its download address, signed
// for a few minutes, is fetched without the token.
export async function leer() {
  const r = await pedir(ARCHIVO);
  if (r.status === 404) return null;
  if (!r.ok) throw malaRespuesta(r.status);
  const item = await r.json();
  const enlace = item['@microsoft.graph.downloadUrl'];
  if (!item.file || !enlace) throw new Error(t('El archivo jepyso.json de tu {nube} no es de Jepyso: no se ha tocado nada.', { nube: NUBE }));
  let d;
  try {
    d = await fetch(enlace, { cache: 'no-store' });
  } catch {
    throw sinRed();
  }
  if (!d.ok) throw malaRespuesta(d.status);
  return d.text();
}

// Writes the file whole, over the one there (the simple upload: a year of follow-up is far below its limit).
export async function escribir(texto) {
  const r = await pedir(`${ARCHIVO}:/content`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: texto });
  if (r.status === 507) throw new Error(t('Tu {nube} está lleno: haz sitio y vuelve a sincronizar.', { nube: NUBE }));
  if (!r.ok) throw malaRespuesta(r.status);
}
