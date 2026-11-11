// Keeps Jepyso working without a connection once a routine has been opened on the phone.
// - The app files are answered from the cache and refreshed in the background: the next visit gets the new version.
// - Figures, exercises, their stills and the three.js files are fetched once and kept. When Gaudí changes a figure or an exercise
//   with the same name, FIJOS goes up by one so every phone fetches them again.
// The page asks for the files of the routine it opens (message 'guardar') and is told when they are all here.
const APP = 'jepyso-app-1';
const FIJOS = 'jepyso-fijos-1';
const ARCHIVOS = [
  'index.html',
  'estilos.css',
  'tema.js',
  'app.js',
  'datos.js',
  'figura.js',
  'mapa.js',
  'modelos/musculos.js',
  'modelos/ejercicios.json',
  'modelos/b/ejercicios.json',
  'vendor/qrcode/qrcode.js',
];

const base = new URL('./', self.location).href;
const relativa = (url) => (url.startsWith(base) ? url.slice(base.length).split(/[?#]/)[0] : null);
// Files that never change under the same name: three.js (pinned version), the bodies, the clips and their sheets.
const esFijo = (ruta) => ruta.startsWith('vendor/three/') || (/^modelos\/.+\.(glb|json|webp)$/.test(ruta) && !ruta.endsWith('ejercicios.json'));

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(APP).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith('jepyso-') && k !== APP && k !== FIJOS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
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

// Stale while revalidate. A page load (any query, any fragment) is index.html.
async function deLaApp(ev, ruta) {
  const cache = await caches.open(APP);
  const clave = ev.request.mode === 'navigate' || ruta === '' ? 'index.html' : ruta;
  const guardada = await cache.match(clave);
  const red = fetch(ev.request).then((r) => {
    if (r.ok && r.type === 'basic') ev.waitUntil(cache.put(clave, r.clone()).catch(() => {}));
    return r;
  });
  if (guardada) {
    ev.waitUntil(red.catch(() => {}));
    return guardada;
  }
  return red;
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
  const cache = await caches.open(esFijo(ruta) ? FIJOS : APP);
  if (await cache.match(ruta)) return true;
  const r = await fetch(base + ruta);
  if (!r.ok) return false;
  await cache.put(ruta, r);
  return true;
}

// The page sends the paths a routine needs (body, clips, sheets, stills, three.js) and gets back how many are kept.
self.addEventListener('message', (ev) => {
  const { tipo, rutas } = ev.data || {};
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
