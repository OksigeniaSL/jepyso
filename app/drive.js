// Google Drive as the professional's own cloud (the paid version): a folder «Jepyso» that the app creates and one file
// inside it, «jepyso.json». With the drive.file scope the app sees only the files it creates; the rest of the Drive is
// out of its reach. No server: Google's token model, in the browser. The token lives a short while, only in memory, and
// a new one needs a tap, because Google opens its window only from a gesture.
import { fusionar, empaquetar, esDatos } from './sincronia.js';

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
      mal(new Error('No se ha podido abrir la conexión con Google. Mira si hay red.'));
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
        if (r.error || !r.access_token) return mal(new Error('Google no ha dado permiso para tu Drive.'));
        if (!google.accounts.oauth2.hasGrantedAllScopes(r, AMBITO)) return mal(new Error('Hace falta el permiso para los archivos de Jepyso en tu Drive.'));
        token = { valor: r.access_token, caduca: Date.now() + (Number(r.expires_in) || 3600) * 1000 };
        ok();
      },
      error_callback: (e) => mal(new Error(e?.type === 'popup_closed' ? 'Se ha cerrado la ventana de Google.' : 'No se ha podido abrir la ventana de Google.')),
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
  if (!conectado()) throw new Error('La conexión con tu Drive ha caducado: vuelve a sincronizar.');
  const r = await fetch(url, { ...opciones, headers: { Authorization: `Bearer ${token.valor}`, ...(opciones.headers || {}) } });
  if (r.status === 401) {
    token = null;
    throw new Error('La conexión con tu Drive ha caducado: vuelve a sincronizar.');
  }
  if (!r.ok) throw new Error(`Tu Drive no ha respondido bien (${r.status}).`);
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

async function escribir(idCarpeta, id, datos) {
  // Without indentation: with a year of follow-up it was two and a half times bigger to send and to read.
  const cuerpo = JSON.stringify(datos);
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

// Brings the Drive and this device together: reads what the Drive has, joins it with what is here (sincronia.js) and
// keeps the result in both places. What is here and how to keep it come from the app, so this file knows nothing of
// where things live. A device that writes in between loses nothing: its own copy joins again at its next sync.
export async function sincronizar(local, guardarLocal) {
  const idCarpeta = await carpeta();
  const [ya] = await buscar(`name='${comillas(ARCHIVO)}' and '${idCarpeta}' in parents and trashed=false`);
  let remoto = {};
  if (ya) {
    const d = await (await pedir(`${API}/files/${ya.id}?alt=media`)).json();
    if (!esDatos(d)) throw new Error('El archivo jepyso.json de tu Drive no es de Jepyso: no se ha tocado nada.');
    remoto = d;
  }
  const junto = fusionar(local, remoto);
  guardarLocal(junto);
  await escribir(idCarpeta, ya?.id, empaquetar(junto));
  return { personas: junto.personas.length, plantillas: junto.plantillas.length };
}
