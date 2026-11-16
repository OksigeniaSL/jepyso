// Google Drive as the professional's own cloud (the paid version): a folder «Jepyso» that the app creates and one file
// inside it, «jepyso.json». With the drive.file scope the app sees only the files it creates; the rest of the Drive is
// out of its reach. No server: Google's token model, in the browser. The token lives a short while, only in memory, and
// a new one needs a tap, because Google opens its window only from a gesture. Joining what the Drive has with this
// device is the same for every cloud (nube.js): this file only reads and writes the file.
import { t } from './idioma.js';

// Oksigenia's OAuth client (project jepyso-514617, in Oksigenia's Google account). Public by design: it names the app.
export const CLIENTE = '728186575121-mqkqj3qhmkjrmfiqr31e2dv4gsfr9ttj.apps.googleusercontent.com';
const AMBITO = 'https://www.googleapis.com/auth/drive.file';
const API = 'https://www.googleapis.com/drive/v3';
const SUBIDA = 'https://www.googleapis.com/upload/drive/v3';
const CARPETA = 'Jepyso';
const ARCHIVO = 'jepyso.json';
const CARPETA_TIPO = 'application/vnd.google-apps.folder';

let token = null; // { valor, caduca }
let guion = null;

export function cargarGoogle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  guion ||= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => ok(window.google);
    s.onerror = () => {
      guion = null;
      mal(new Error(t('No se ha podido abrir la conexión con Google. Mira si hay red.')));
    };
    document.head.append(s);
  });
  return guion;
}

export const conectado = () => !!token && token.caduca > Date.now() + 60_000;
export const olvidar = () => {
  token = null;
};

// A token for Drive: the one in memory while it lasts, or a new one through Google's window. Call it from a tap.
export async function conectar() {
  if (conectado()) return;
  const google = await cargarGoogle();
  await new Promise((ok, mal) => {
    const cliente = google.accounts.oauth2.initTokenClient({
      client_id: CLIENTE,
      scope: AMBITO,
      callback: (r) => {
        if (r.error || !r.access_token) return mal(new Error(t('Google no ha dado permiso para tu Drive.')));
        if (!google.accounts.oauth2.hasGrantedAllScopes(r, AMBITO)) return mal(new Error(t('Hace falta el permiso para los archivos de Jepyso en tu Drive.')));
        token = { valor: r.access_token, caduca: Date.now() + (Number(r.expires_in) || 3600) * 1000 };
        ok();
      },
      error_callback: (e) => mal(new Error(e?.type === 'popup_closed' ? t('Se ha cerrado la ventana de Google.') : t('No se ha podido abrir la ventana de Google.'))),
    });
    cliente.requestAccessToken({ prompt: '' });
  });
}

// The Google account the Drive is connected with, to tell whether a licence is this professional's.
export async function cuentaDrive() {
  const r = await pedir(`${API}/about?fields=user(emailAddress)`);
  return (await r.json()).user?.emailAddress || '';
}

async function pedir(url, opciones = {}) {
  if (!conectado()) throw new Error(t('La conexión con tu Drive ha caducado: vuelve a sincronizar.'));
  const r = await fetch(url, { ...opciones, headers: { Authorization: `Bearer ${token.valor}`, ...(opciones.headers || {}) } });
  if (r.status === 401) {
    token = null;
    throw new Error(t('La conexión con tu Drive ha caducado: vuelve a sincronizar.'));
  }
  if (!r.ok) throw new Error(t('Tu Drive no ha respondido bien ({estado}).', { estado: r.status }));
  return r;
}

const comillas = (t) => t.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
// Oldest first: if two devices made the folder or the file at the same time the first time, every device keeps using
// the same one (the oldest) from then on.
async function buscar(consulta) {
  const r = await pedir(`${API}/files?q=${encodeURIComponent(consulta)}&spaces=drive&fields=files(id,name)&orderBy=createdTime&pageSize=10`);
  return (await r.json()).files || [];
}

async function carpeta() {
  const [ya] = await buscar(`name='${comillas(CARPETA)}' and mimeType='${CARPETA_TIPO}' and trashed=false`);
  if (ya) return ya.id;
  const r = await pedir(`${API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: CARPETA, mimeType: CARPETA_TIPO }),
  });
  return (await r.json()).id;
}

async function subir(idCarpeta, id, cuerpo) {
  if (id) {
    await pedir(`${SUBIDA}/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: cuerpo });
    return id;
  }
  const limite = `jepyso-${Math.random().toString(36).slice(2)}`;
  const meta = JSON.stringify({ name: ARCHIVO, parents: [idCarpeta], mimeType: 'application/json' });
  const partes = `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${limite}\r\nContent-Type: application/json\r\n\r\n${cuerpo}\r\n--${limite}--`;
  const r = await pedir(`${SUBIDA}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${limite}` },
    body: partes,
  });
  return (await r.json()).id;
}

// Where the file lives, found again on every read: the folder «Jepyso» (made the first time) and the file in it, if
// there is one yet. The write that follows in the same sync uses what the read found.
let sitio = null;
async function ubicar() {
  const idCarpeta = await carpeta();
  const [ya] = await buscar(`name='${comillas(ARCHIVO)}' and '${idCarpeta}' in parents and trashed=false`);
  sitio = { carpeta: idCarpeta, archivo: ya?.id };
  return sitio;
}

// What the Drive keeps, as text, or null while there is no file yet (nube.js joins and checks it).
export async function leer() {
  const { archivo } = await ubicar();
  if (!archivo) return null;
  return (await pedir(`${API}/files/${archivo}?alt=media`)).text();
}

// Writes the file whole: over the one there, or a new one in the folder the first time.
export async function escribir(texto) {
  const { carpeta: idCarpeta, archivo } = sitio || (await ubicar());
  sitio = { carpeta: idCarpeta, archivo: await subir(idCarpeta, archivo, texto) };
}
