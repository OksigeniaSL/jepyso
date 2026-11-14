// Keeps Jepyso working without a connection once a routine has been opened on the phone.
// - The app files are answered from the cache, always as one whole set: a new version is fetched complete into a cache
//   of its own and only then takes over, so the page never gets a new app.js with an old datos.js (a request that
//   failed, or a server caught halfway through an upload, left the app blank, even offline).
// - Figures, exercises, their stills and the three.js files are fetched once and kept. When Gaudí changes a figure or an exercise
//   with the same name, FIJOS goes up by one so every phone fetches them again.
// The page asks for the files of the routine it opens (message 'guardar') and is told when they are all here.
const APP = 'jepyso-app-1'; // the set of the first versions; later sets are named when they are fetched
const PUNTERO = 'jepyso-activa'; // which set of the app is the current one
const FIJOS = 'jepyso-fijos-8';
const ARCHIVOS = [
  'index.html',
  'estilos.css',
  'tema.js',
  'app.js',
  'datos.js',
  'personas.js',
  'entrada.js',
  'inflar.js',
  'voz.js',
  'licencia.js',
  'sincronia.js',
  'drive.js',
  'figura.js',
  'mapa.js',
  'goniometro.js',
  'recorrido.js',
  'fuentes/red-hat-display.woff2',
  'fuentes/red-hat-text.woff2',
  'fuentes/red-hat-mono.woff2',
  'imagenes/yeso-puente.webp',
  'imagenes/yeso-silla.webp',
  'iconos/icono.svg',
  'iconos/icono-32.png',
  'iconos/icono-192.png',
  'iconos/apple-touch-icon.png',
  'iconos/icono-512.png',
  'iconos/maskable-512.png',
  'manifest.json',
  'modelos/musculos.js',
  'modelos/ejercicios.json',
  'modelos/b/ejercicios.json',
  'vendor/qrcode/qrcode.js',
  'vendor/oksigenia-access-panel/oksigenia-access-panel.js',
];

const base = new URL('./', self.location).href;
const relativa = (url) => (url.startsWith(base) ? url.slice(base.length).split(/[?#]/)[0] : null);
// Files that never change under the same name: three.js (pinned version), the bodies, the clips and their sheets.
const esFijo = (ruta) => ruta.startsWith('vendor/three/') || (/^modelos\/.+\.(glb|json|webp)$/.test(ruta) && !ruta.endsWith('ejercicios.json'));

// The current set of the app files: its cache name, kept in a cache of its own so it survives the worker stopping.
let activa = null;
async function cacheActiva() {
  if (!activa) {
    const r = await (await caches.open(PUNTERO)).match('activa');
    activa = r ? await r.text() : APP;
  }
  return activa;
}

// Fetches every app file, bypassing the browser cache, into a new set; only when all of them arrived does it become the
// current one. The previous set stays for pages still running on it; older ones go.
let renovando = null;
function renovar({ avisar = true } = {}) {
  renovando ??= (async () => {
    const nombre = `jepyso-app-${Date.now()}`;
    const nueva = await caches.open(nombre);
    try {
      await nueva.addAll(ARCHIVOS.map((a) => new Request(a, { cache: 'reload' })));
    } catch {
      await caches.delete(nombre);
      return false;
    }
    const anterior = await cacheActiva();
    await (await caches.open(PUNTERO)).put('activa', new Response(nombre));
    activa = nombre;
    const claves = await caches.keys();
    await Promise.all(claves.filter((k) => k.startsWith('jepyso-app-') && k !== nombre && k !== anterior).map((k) => caches.delete(k)));
    if (avisar) await avisarVersionNueva();
    return true;
  })().finally(() => (renovando = null));
  return renovando;
}

self.addEventListener('install', (ev) => {
  // A new worker brings a whole set with it (or does not install, and the old one carries on).
  ev.waitUntil(
    (async () => {
      const habia = await caches.has(PUNTERO) || await caches.has(APP);
      if (!(await renovar({ avisar: false }))) throw new Error('sin la app completa');
      self.habiaVersion = habia;
    })().then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    (async () => {
      const actual = await cacheActiva();
      const claves = await caches.keys();
      await Promise.all(
        claves.filter((k) => k.startsWith('jepyso-') && k !== actual && k !== FIJOS && k !== PUNTERO && !k.startsWith('jepyso-app-')).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
      if (self.habiaVersion) await avisarVersionNueva();
    })(),
  );
});

// The page gets every answer at once; copies go to the cache behind it (event.waitUntil). Writing the copy before
// answering held the cache while a whole clip was read: a reload during the routine's «guardar» could wait minutes
// for its own files.
async function fijo(ev, ruta) {
  const cache = await caches.open(FIJOS);
  const guardada = await cache.match(ruta);
  if (guardada) return guardada;
  const r = await fetch(ev.request);
  if (r.ok) ev.waitUntil(cache.put(ruta, r.clone()).catch(() => {}));
  return r;
}

const mismosBytes = (a, b) => {
  if (a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
};

// A new set of the app is ready: the open pages are told, so they can offer to update now instead of showing the old
// version until the next visit.
async function avisarVersionNueva() {
  for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ tipo: 'nueva-version' });
}

// Each page keeps the set it was loaded from, even if a new one takes over while its modules are still loading.
const porPagina = new Map();
async function cacheDe(ev) {
  if (ev.request.mode === 'navigate') {
    const nombre = await cacheActiva();
    if (ev.resultingClientId) porPagina.set(ev.resultingClientId, nombre);
    return nombre;
  }
  return (ev.clientId && porPagina.get(ev.clientId)) || cacheActiva();
}

// Is the server's copy of this file different from the current set's? Then a whole new set is fetched. The server
// sends no ETag, so the bytes are compared.
async function comprobar(peticion, clave) {
  const r = await fetch(peticion, { cache: 'no-cache' });
  if (!r.ok || r.type !== 'basic') return;
  const actual = await (await caches.open(await cacheActiva())).match(clave);
  if (!actual || !mismosBytes(await actual.arrayBuffer(), await r.arrayBuffer())) await renovar();
}

// A page load (any query, any fragment) is index.html. Files of the app come from the page's set; one that is not in
// it (an older set without it) comes from the network.
async function deLaApp(ev, ruta) {
  const cache = await caches.open(await cacheDe(ev));
  const clave = ev.request.mode === 'navigate' || ruta === '' ? 'index.html' : ruta;
  const guardada = await cache.match(clave);
  if (guardada) {
    ev.waitUntil(comprobar(ev.request.mode === 'navigate' ? new Request(clave) : ev.request, clave).catch(() => {}));
    return guardada;
  }
  const r = await fetch(ev.request);
  if (r.ok && r.type === 'basic' && ARCHIVOS.includes(clave)) ev.waitUntil(cache.put(clave, r.clone()).catch(() => {}));
  return r;
}

self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET') return;
  const ruta = relativa(ev.request.url);
  if (ruta === null || ruta === 'sw.js') return;
  ev.respondWith(esFijo(ruta) ? fijo(ev, ruta) : deLaApp(ev, ruta));
});

// Keeps one file for the routine, unless it is already there. Nobody else reads the response, so it goes straight
// into the cache, without a copy.
async function guardarUno(ruta) {
  const cache = await caches.open(esFijo(ruta) ? FIJOS : await cacheActiva());
  if (await cache.match(ruta)) return true;
  const r = await fetch(base + ruta);
  if (!r.ok) return false;
  await cache.put(ruta, r);
  return true;
}

// The page sends the paths a routine needs (body, clips, sheets, stills, three.js) and gets back how many are kept.
self.addEventListener('message', (ev) => {
  const { tipo, rutas } = ev.data || {};
  // A page asks whether the set it was loaded from is still the current one.
  if (tipo === 'version') {
    const id = ev.source?.id;
    ev.waitUntil(
      cacheActiva().then((actual) => {
        if (id && porPagina.has(id) && porPagina.get(id) !== actual) ev.source.postMessage({ tipo: 'nueva-version' });
      }),
    );
    return;
  }
  if (tipo !== 'guardar' || !Array.isArray(rutas)) return;
  const puerto = ev.ports[0];
  ev.waitUntil(
    Promise.allSettled(
      rutas.map((ruta) => {
        const limpia = relativa(new URL(ruta, base).href);
        return limpia === null ? Promise.reject(new Error(ruta)) : guardarUno(limpia);
      }),
    ).then((res) => puerto?.postMessage({ guardados: res.filter((x) => x.status === 'fulfilled' && x.value).length, total: rutas.length })),
  );
});
