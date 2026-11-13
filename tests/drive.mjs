// The Drive connector (app/drive.js) against a small fake of Google: the token window and the Drive files API. Two
// devices meet through the folder «Jepyso», a deletion travels, a foreign jepyso.json is left untouched, and an
// expired token is said, not hidden.
// Usage: node drive.mjs <app folder>
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const app = process.argv[2];

// Google's token window: grants drive.file at once.
let concedido = true;
globalThis.window = {
  google: {
    accounts: {
      oauth2: {
        initTokenClient: ({ callback }) => ({
          requestAccessToken: () => callback(concedido ? { access_token: 'tok', expires_in: 3600, scope: 'https://www.googleapis.com/auth/drive.file' } : { error: 'access_denied' }),
        }),
        hasGrantedAllScopes: (r, s) => (r.scope || '').split(' ').includes(s),
      },
    },
  },
};

// The Drive: files with id, name, mimeType, parents and content.
const archivos = new Map();
let siguiente = 1;
let caducado = false;
const respuesta = (cuerpo, estado = 200) => ({ ok: estado < 400, status: estado, json: async () => (typeof cuerpo === 'string' ? JSON.parse(cuerpo) : cuerpo) });
globalThis.fetch = async (url, { method = 'GET', headers = {}, body } = {}) => {
  if (headers.Authorization !== 'Bearer tok') return respuesta({}, 401);
  if (caducado) return respuesta({}, 401);
  const u = new URL(url);
  const ruta = u.pathname;
  if (method === 'GET' && ruta === '/drive/v3/files') {
    const q = u.searchParams.get('q');
    const nombre = /name='([^']+)'/.exec(q)?.[1];
    const tipo = /mimeType='([^']+)'/.exec(q)?.[1];
    const padre = /'([^']+)' in parents/.exec(q)?.[1];
    const files = [...archivos.values()].filter((f) => f.name === nombre && (!tipo || f.mimeType === tipo) && (!padre || f.parents.includes(padre)));
    return respuesta({ files: files.map(({ id, name }) => ({ id, name })) });
  }
  if (method === 'POST' && ruta === '/drive/v3/files') {
    const meta = JSON.parse(body);
    const id = `f${siguiente++}`;
    archivos.set(id, { id, ...meta, parents: meta.parents || [] });
    return respuesta({ id });
  }
  const leer = /^\/drive\/v3\/files\/([^/]+)$/.exec(ruta);
  if (method === 'GET' && leer && u.searchParams.get('alt') === 'media') return respuesta(archivos.get(leer[1]).contenido);
  const cambiar = /^\/upload\/drive\/v3\/files\/([^/]+)$/.exec(ruta);
  if (method === 'PATCH' && cambiar) {
    archivos.get(cambiar[1]).contenido = body;
    return respuesta({ id: cambiar[1] });
  }
  if (method === 'POST' && ruta === '/upload/drive/v3/files' && u.searchParams.get('uploadType') === 'multipart') {
    const limite = /boundary=(.+)$/.exec(headers['Content-Type'])[1];
    const partes = body.split(`--${limite}`).slice(1, 3).map((p) => p.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim());
    const meta = JSON.parse(partes[0]);
    const id = `f${siguiente++}`;
    archivos.set(id, { id, ...meta, contenido: partes[1] });
    return respuesta({ id });
  }
  return respuesta({}, 404);
};

const drive = await import(pathToFileURL(join(app, 'drive.js')).href);

// A device: its people, templates and deletions, kept as the app keeps them.
const aparato = (personas, plantillas = []) => {
  const d = { personas, plantillas, borradas: { personas: {}, plantillas: {} } };
  return { d, local: () => JSON.parse(JSON.stringify(d)), guardar: (r) => Object.assign(d, JSON.parse(JSON.stringify(r))) };
};
const persona = (id, extra = {}) => ({ id, nombre: id, notas: '', creada: '2026-11-13', rutinas: [], dias: [], ...extra });

await drive.conectar();
assert.ok(drive.conectado(), 'no queda conectado tras el permiso');

// The phone syncs first: the folder and the file are created.
const movil = aparato([persona('ana', { notas: 'Rodilla' })], [{ nombre: 'Rodilla', cambiada: '2026-11-13T09:00:00Z' }]);
const r1 = await drive.sincronizar(movil.local(), movil.guardar);
assert.equal(r1.personas, 1);
const carpetas = [...archivos.values()].filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
assert.equal(carpetas.length, 1, 'no crea una sola carpeta «Jepyso»');
assert.equal(carpetas[0].name, 'Jepyso');
const datos = () => JSON.parse([...archivos.values()].find((f) => f.name === 'jepyso.json').contenido);
assert.equal(datos().app, 'jepyso');

// The tablet brings someone else and gets Ana; the phone then gets Luis. One folder, one file.
const tableta = aparato([persona('luis')]);
await drive.sincronizar(tableta.local(), tableta.guardar);
assert.deepEqual(tableta.d.personas.map((p) => p.id).sort(), ['ana', 'luis'], 'la tableta no recibe lo del móvil');
await drive.sincronizar(movil.local(), movil.guardar);
assert.deepEqual(movil.d.personas.map((p) => p.id).sort(), ['ana', 'luis'], 'el móvil no recibe lo de la tableta');
assert.equal([...archivos.values()].filter((f) => f.name === 'jepyso.json').length, 1, 'se duplica el archivo de datos');
assert.equal([...archivos.values()].filter((f) => f.name === 'Jepyso').length, 1, 'se duplica la carpeta');

// Luis is deleted on the phone; after both sync, he is gone from both.
movil.d.personas = movil.d.personas.filter((p) => p.id !== 'luis');
movil.d.borradas.personas.luis = '2026-11-13T10:00:00Z';
await drive.sincronizar(movil.local(), movil.guardar);
await drive.sincronizar(tableta.local(), tableta.guardar);
assert.deepEqual(tableta.d.personas.map((p) => p.id), ['ana'], 'una ficha borrada en el móvil sigue en la tableta');
assert.ok(!datos().personas.some((p) => p.id === 'luis'), 'una ficha borrada sigue en el Drive');

// A jepyso.json that is not Jepyso's is left as it was.
const ajeno = [...archivos.values()].find((f) => f.name === 'jepyso.json');
ajeno.contenido = '{"otra":"cosa"}';
await assert.rejects(() => drive.sincronizar(movil.local(), movil.guardar), /no es de Jepyso/);
assert.equal(ajeno.contenido, '{"otra":"cosa"}', 'se escribe encima de un archivo ajeno');

// An expired token is said, and the next sync asks for a new one.
caducado = true;
await assert.rejects(() => drive.sincronizar(movil.local(), movil.guardar), /caducado/);
assert.ok(!drive.conectado(), 'tras un 401 sigue dándose por conectado');

// Without the permission, the error says so.
caducado = false;
concedido = false;
await assert.rejects(() => drive.conectar(), /permiso/);

console.log('drive: dos aparatos se juntan en la carpeta Jepyso; lo borrado no vuelve y lo ajeno no se toca');
