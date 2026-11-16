// Jepyso in English: a browser set in English walks the main screens of the professional and of the person, and no
// Spanish may be left on them: the visible text, every aria-label, title, placeholder and alt, the values the app puts
// in its fields, the messages that go out by WhatsApp, Telegram or the phone's share sheet, the names of the files it
// saves, the reminder for the calendar and what the voice says. Each leftover is told apart as the screens' own
// (app/idiomas/en.js) or as exercise content (tools/idiomas/textos-ejercicios.json, app/idiomas/en-ejercicios.js).
// Besides: the switch beside «Accesibilidad» moves an English phone to Spanish and back, and the choice stays after a
// reload; a routine link made in English carries nothing that depends on the language.
// Usage: node idioma.mjs <base url> [screenshot dir]   (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [base, salida] = process.argv.slice(2);
if (!base) {
  console.error('Usage: node idioma.mjs <base url> [screenshot dir]');
  process.exit(2);
}

// ---------- What counts as Spanish ----------
// Accented letters and opening marks, and a short list of words that never appear in the English of the app. Words
// typed by the walk itself are English names and notes, so they never hit.
const PALABRAS = ['rutina', 'rutinas', 'empezar', 'ejercicio', 'ejercicios', 'serie', 'repeticiones', 'molestia', 'persona',
  'personas', 'guardar', 'guardado', 'guardada', 'ayuda', 'accesibilidad', 'volver', 'cerrar', 'para', 'con', 'sin', 'hoy',
  'ayer', 'semana', 'semanas', 'hecho', 'seguir', 'salir', 'nueva', 'nuevo', 'copiar', 'copia', 'enlace', 'ficha', 'fichas',
  'borrar', 'todas', 'todos', 'mandar', 'pasos', 'vueltas', 'minutos', 'lado', 'derecho', 'izquierdo', 'banda', 'nada',
  'mucha', 'otra', 'otro', 'vez', 'veces', 'de', 'del', 'la', 'las', 'los', 'el', 'una', 'que', 'contacto', 'privacidad',
  'condiciones', 'en', 'al', 'lo', 'le', 'se', 'te', 'tu', 'tus', 'su', 'sus', 'mi', 'es', 'por', 'como', 'cada', 'muy', 'hasta',
  'desde', 'este', 'esta', 'esto', 'ida', 'vuelta', 'figura', 'haciendo', 'nombre', 'cuenta', 'hace', 'falta', 'quien',
  'aqui', 'mejor', 'seguidos', 'listo', 'cambiar', 'ahora', 'otras', 'cuando', 'donde', 'ver', 'abrir', 'entra', 'tienes'];
const RE_PALABRA = new RegExp(`(?<![\\p{L}\\p{N}])(${PALABRAS.join('|')})(?![\\p{L}\\p{N}])`, 'iu');
const esEspanol = (s) => /[áéíóúñ¿¡]/i.test(s) || RE_PALABRA.test(s);
const normal = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
// Addresses, e-mails and the codes of the links are not words: base64 can spell «con» between two dashes. «Español»
// is the switch's own name in English, written in its own language on purpose.
const limpiar = (s) => normal(s)
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/\S+@\S+/g, ' ')
  .replace(/[\w-]+(\.[\w-]+)+(:\d+)?\/\S*/g, ' ')
  .replace(/[A-Za-z0-9_-]{24,}/g, ' ')
  .replace(/Español/g, ' ');

// The exercise texts, longest first, so a long one is taken out before a short one inside it. One counts only as a
// whole piece of the line (between its ends or the separators the screens put around them: «Puente de glúteo · Lado
// derecho», «Serie 1 de 2 · banda roja», «Mantén 3»): a phase word inside a sentence of the screens («Ida en 2 s, mantén
// 1 s…») is the screens' sentence, not exercise content.
const aqui = dirname(fileURLToPath(import.meta.url));
const EJERCICIO = [...new Set(JSON.parse(readFileSync(join(aqui, '..', 'tools', 'idiomas', 'textos-ejercicios.json'), 'utf8'))
  .map((x) => normal(x.es).toLowerCase()).filter(Boolean))].sort((a, b) => b.length - a.length);
const ANTES = /(^|[·,;:—–(«"'¿¡]\s*)$/;
const DESPUES = /^(\s*$|\s*[·,;:.—–)»"'!?]|\s+\d|\s+(in|en)\s+\d)/i;
// A line without its exercise texts: what is left is the screens' own.
function sinEjercicios(linea) {
  let l = linea.toLowerCase();
  if (EJERCICIO.includes(l)) return '';
  for (const e of EJERCICIO) {
    if (e.length < 3 || !l.includes(e)) continue;
    let desde = 0;
    let i;
    while ((i = l.indexOf(e, desde)) >= 0) {
      if (ANTES.test(l.slice(0, i)) && DESPUES.test(l.slice(i + e.length))) {
        l = `${l.slice(0, i)} ${l.slice(i + e.length)}`;
        desde = i + 1;
      } else desde = i + e.length;
    }
  }
  return l;
}

const sobras = new Map();
const fallos = [];
const notas = [];
const comprobar = (bien, que) => bien || fallos.push(que);
function revisarTextos(pantalla, textos) {
  for (const x of textos) {
    const { a = '', t } = typeof x === 'string' ? { t: x } : x;
    const linea = limpiar(t);
    if (!linea || !esEspanol(linea)) continue;
    const tipo = esEspanol(sinEjercicios(linea)) ? 'pantallas' : 'ejercicios';
    const clave = `${tipo}\u0000${a}\u0000${linea}`;
    if (!sobras.has(clave)) sobras.set(clave, { tipo, a, linea, donde: new Set() });
    sobras.get(clave).donde.add(pantalla);
  }
}

// Everything a person sees or hears read out on the page: the rendered text, the names given to controls and pictures,
// the options of a list and the text the app puts in a field. The accessibility panel is Oksigenia's, with its own
// languages, in its shadow root; nothing hidden counts.
function recoger() {
  const visible = (el) => !!el && (el.checkVisibility ? el.checkVisibility({ visibilityProperty: true }) : el.getClientRects().length > 0);
  const out = [];
  for (const l of document.body.innerText.split('\n')) if (l.trim()) out.push({ a: '', t: l });
  for (const el of document.querySelectorAll('[aria-label], [title], [placeholder], [alt]')) {
    if (el.closest('oksigenia-access-panel') || !visible(el)) continue;
    for (const a of ['aria-label', 'title', 'placeholder', 'alt']) {
      const v = el.getAttribute(a);
      if (v && v.trim()) out.push({ a, t: v });
    }
  }
  for (const t of document.querySelectorAll('svg title')) if (visible(t.parentElement)) out.push({ a: 'svg title', t: t.textContent });
  for (const s of document.querySelectorAll('select')) if (visible(s)) for (const o of s.options) out.push({ a: 'option', t: o.textContent });
  for (const c of document.querySelectorAll('textarea, input:not([type]), input[type="text"]')) if (visible(c) && c.value.trim()) out.push({ a: 'value', t: c.value });
  out.push({ a: 'document.title', t: document.title });
  return out;
}

// ---------- The browser, in English ----------
// correr.sh speaks Spanish to every other walk: this browser gets English of its own.
const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  env: { ...process.env, LANG: 'en_GB.UTF-8', LANGUAGE: 'en_GB:en' },
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--lang=en-GB'],
});
const inicio = Date.now();
const contextos = [];
// The contexts a part of the walk opens are closed when it ends: a figure left moving in the software renderer slows
// every page after it, and a click then waits for frames that hardly come.
let delPaso = [];
// A context in English (or in the language given), with the phone's voice, the share sheet and window.open caught,
// and the recorded takes out of reach, so what the voice says is heard by the walk. Only the person's phone keeps the
// worker (to say the routine is saved for offline use); the others go lighter without it.
async function contexto({ locale = 'en-GB', movil = false, ancho = 1366, alto = 900, trabajador = false, queda = false } = {}) {
  const c = await navegador.newContext({
    locale,
    serviceWorkers: trabajador ? 'allow' : 'block',
    viewport: movil ? { width: 390, height: 844 } : { width: ancho, height: alto },
    // A phone at single density: the walk reads text, and the figure costs four times less in the software renderer.
    ...(movil ? { deviceScaleFactor: 1, isMobile: true, hasTouch: true } : {}),
    acceptDownloads: true,
  });
  contextos.push(c);
  if (!queda) delPaso.push(c);
  await c.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin }).catch(() => {});
  await c.route('**/voz/**', (r) => r.fulfill({ contentType: 'application/json', body: '{}' }));
  await c.addInitScript(() => {
    window.__dicho = [];
    window.__abierto = [];
    const voz = { name: 'Prueba', lang: navigator.language, localService: true, default: true };
    Object.defineProperty(window, 'speechSynthesis', {
      value: { getVoices: () => [voz], speak: (u) => window.__dicho.push(u.text), cancel() {}, addEventListener() {} },
    });
    window.SpeechSynthesisUtterance = class {
      constructor(t) {
        this.text = t;
      }
    };
    window.open = (u) => {
      window.__abierto.push(String(u));
      return null;
    };
    navigator.share = async (d) => {
      window.__compartido = d;
    };
  });
  return c;
}
async function pagina(c, nombre) {
  const p = await c.newPage();
  // As in recorrido.mjs: on a machine busy with other work the figure in the software renderer slows every frame, and
  // a click waits for two of them; every step gets more room, and a real hang still fails.
  p.setDefaultTimeout(120000);
  p.setDefaultNavigationTimeout(120000);
  p.on('pageerror', (e) => fallos.push(`${nombre}: error en la página: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/Refused to/.test(m.text())) fallos.push(`${nombre}: la política de contenido rechaza algo: ${m.text()}`);
    else if (nombre !== 'vales') notas.push(`${nombre}: ${m.text()}`);
  });
  return p;
}
// Every wait has its end: an evaluate has none of its own, and a page starved by a busy machine could hold it forever.
// Its timer goes with it, or Node would wait for it before exiting.
function conTope(promesa, ms, que) {
  let reloj;
  const tope = new Promise((_, mal) => {
    reloj = setTimeout(() => mal(new Error(`${que}: más de ${ms / 1000} s`)), ms);
  });
  return Promise.race([promesa, tope]).finally(() => clearTimeout(reloj));
}
const revisar = async (p, pantalla) => revisarTextos(pantalla, await conTope(p.evaluate(recoger), 120000, `leer «${pantalla}»`));
// A few screenshots of the English screens; one that does not come out in the software renderer is only noted.
const foto = async (p, nombre, o = {}) => {
  if (!salida) return;
  try {
    await p.screenshot({ path: `${salida}/idioma-${nombre}.png`, timeout: 60000, ...o });
    console.log(`${String(Math.round((Date.now() - inicio) / 1000)).padStart(5)} s  idioma-${nombre}.png`);
  } catch (e) {
    notas.push(`captura idioma-${nombre}: ${e.message.split('\n')[0]}`);
  }
};
// Each part of the walk on its own: one that breaks says so, with what Playwright was waiting for, and the rest still
// runs, so the report is whole. IDIOMA_PASOS (a regular expression) walks only the parts it names, to look into one.
const SOLO = process.env.IDIOMA_PASOS ? new RegExp(process.env.IDIOMA_PASOS) : null;
async function paso(nombre, f) {
  if (SOLO && !SOLO.test(nombre)) return;
  delPaso = [];
  try {
    // A whole part has its end too: some of Playwright's calls (a count, a read of the page) wait without one for a
    // renderer that a busy machine has stopped; closing the part's contexts then lets them go.
    await conTope(f(), 10 * 60000, 'el paso entero');
  } catch (e) {
    const registro = e.message.replace(/\u001b\[\d+m/g, '').split('\n').slice(1).map((l) => l.trim()).filter((l) => l && !l.startsWith('=')).slice(-3);
    fallos.push(`${nombre}: no se ha podido recorrer (${e.message.split('\n')[0]})${registro.length ? `\n      ${registro.join('\n      ')}` : ''}`);
  } finally {
    for (const c of delPaso) await c.close().catch(() => {});
    delPaso = [];
  }
}
const app = (q = '', h = '') => `${base}/index.html?calidad=baja${q}${h}`;
// The text of a WhatsApp or Telegram link, as it will arrive.
const textoDe = (href) => {
  try {
    const u = new URL(href);
    return u.searchParams.get('text') || '';
  } catch {
    return '';
  }
};
// Every string a link carries must be data (names typed, dates, ids, keys): nothing in either language.
function soloDatos(obj, permitidas, ruta = '') {
  const malas = [];
  if (typeof obj === 'string') {
    if (!(permitidas.has(obj) || /^\d{4}-\d{2}-\d{2}$/.test(obj) || /^\d{2}:\d{2}$/.test(obj) || /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(obj) || /(^|\.)p$/.test(ruta))) malas.push(`${ruta}=${obj}`);
  } else if (Array.isArray(obj)) obj.forEach((x, i) => malas.push(...soloDatos(x, permitidas, `${ruta}[${i}]`)));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) malas.push(...soloDatos(v, permitidas, ruta ? `${ruta}.${k}` : k));
  return malas;
}
const NOTA_EJEMPLO = 'Esta es una rutina de ejemplo: una serie corta de cada ejercicio, para verla entera en un par de minutos.';

let samId = '';
let hist = null;
let codigoPersona = '';

try {
  // The professional's browser goes through several parts: it stays open, and waits on a screen without a figure.
  const pro = await contexto({ queda: true });
  const p = await pagina(pro, 'profesional');

  // ---------- The builder, wide ----------
  await paso('constructor vacío', async () => {
    await p.goto(app());
    await p.waitForSelector('.armar');
    await p.waitForTimeout(1500);
    const lenguas = await p.evaluate(() => [...navigator.languages]);
    comprobar(/^en\b/i.test(lenguas[0] || ''), `el navegador de la prueba no está en inglés (${lenguas})`);
    comprobar((await p.getAttribute('html', 'lang')) === 'en', `<html lang> no es «en» (${await p.getAttribute('html', 'lang')})`);
    const locale = await p.evaluate(() => document.querySelector('oksigenia-access-panel')?.getAttribute('locale'));
    comprobar(/^en\b/i.test(locale || ''), `el panel de accesibilidad no está en inglés (locale="${locale}")`);
    const acceso = normal(await p.locator('.firma-pro [data-acceso]').innerText());
    comprobar(acceso && !esEspanol(acceso), `el botón de accesibilidad no está en inglés («${acceso}»)`);
    const cambio = p.locator('.firma-pro [data-idioma]');
    comprobar((await cambio.count()) === 1 && normal(await cambio.innerText()) === 'Español', `el profesional no tiene el cambio de idioma con «Español» al lado de «Accesibilidad» (${await cambio.count()})`);
    await revisar(p, 'constructor vacío');
    await foto(p, 'armar-vacio');
    // The routine to try: its note stays in the data as it was written; the screen translates it.
    await p.waitForFunction(() => document.querySelector('.probar-ejemplo')?.getAttribute('href'), null, { timeout: 30000 });
    const ejemplo = await p.evaluate(async () => (await import('./datos.js')).decodificar(document.querySelector('.probar-ejemplo').getAttribute('href').split('#r=')[1]));
    comprobar(ejemplo.e?.[0]?.n === NOTA_EJEMPLO, `la nota de la rutina de ejemplo cambia con el idioma (${ejemplo.e?.[0]?.n})`);
    codigoPersona = (await p.getAttribute('.probar-ejemplo', 'href')).split('#r=')[1];
  });

  await paso('biblioteca, mapa y filtros', async () => {
    const verMapa = p.locator('[data-accion="ver-mapa"]');
    if (await verMapa.isVisible()) await verMapa.click();
    await p.waitForTimeout(400);
    await revisar(p, 'biblioteca con el mapa');
    await p.locator('.mapa-punto[data-valor="rodilla"]:not([aria-hidden])').first().click();
    await revisar(p, 'mapa con una zona');
    await p.click('.mapa-quitar');
    await p.selectOption('[data-accion="musculo"]', 'cuadriceps');
    await revisar(p, 'biblioteca por músculo');
    await p.selectOption('[data-accion="musculo"]', '');
    await p.fill('[data-accion="buscar"]', 'zzzz');
    await p.waitForTimeout(300);
    await revisar(p, 'biblioteca sin resultados');
    await p.fill('[data-accion="buscar"]', '');
    // The search finds an exercise by its English name, once it has one.
    const ingles = await p.evaluate(async () => (await import('./idiomas/en-ejercicios.js')).default['Puente de glúteo'] || '');
    if (ingles) {
      const palabra = ingles.toLowerCase().split(/\s+/).find((w) => w.length > 3) || ingles.toLowerCase();
      await p.fill('[data-accion="buscar"]', palabra);
      await p.waitForTimeout(300);
      const ids = await p.$$eval('.biblio-fila', (l) => l.map((x) => x.dataset.id));
      comprobar(ids.includes('puente'), `buscar «${palabra}» (de «${ingles}») no encuentra el puente de glúteo (${ids.join(',')})`);
      await p.fill('[data-accion="buscar"]', '');
    } else notas.push('sin el inglés de «Puente de glúteo» todavía: la búsqueda en inglés no se comprueba');
  });

  await paso('ayuda', async () => {
    await p.click('.firma-pro [data-ayuda]');
    await p.waitForSelector('dialog.hoja-ayuda[open]');
    for (const s of await p.locator('dialog.hoja-ayuda summary').all()) await s.click();
    await revisar(p, 'ayuda');
    await foto(p, 'ayuda');
    await p.click('dialog.hoja-ayuda .hoja-como-pie .boton');
    await p.waitForSelector('dialog.hoja-ayuda', { state: 'detached', timeout: 30000 });
  });

  await paso('rutina armada y enlace', async () => {
    for (const id of ['puente', 'hombro', 'andar_atras', 'andar_ocho', 'caminar', 'dorsal_banda']) {
      await p.click(`.biblio-fila[data-id="${id}"] [data-accion="anadir"]`);
      await p.waitForTimeout(300);
    }
    await p.click('.ejercicio[data-id="hombro"] .ejercicio-cabeza');
    await p.click('.ejercicio[data-id="hombro"] [data-accion="lado"][data-valor="ambos"]');
    await p.click('.ejercicio[data-id="hombro"] [data-accion="banda"][data-valor="roja"]');
    await p.waitForTimeout(500);
    await revisar(p, 'constructor con rutina (hombro: los dos lados y banda)');
    await foto(p, 'armar-rutina');
    await p.click('.ejercicio[data-id="hombro"] .detalle summary');
    await revisar(p, 'explicación del ejercicio en el constructor');
    for (const [id, que] of [['andar_atras', 'pasos'], ['andar_ocho', 'vueltas'], ['caminar', 'minutos'], ['dorsal_banda', 'un lado y banda']]) {
      await p.click(`.ejercicio[data-id="${id}"] .ejercicio-cabeza`);
      await p.waitForTimeout(300);
      if (id === 'dorsal_banda') {
        await p.click('.ejercicio[data-id="dorsal_banda"] [data-accion="lado"][data-valor="izq"]');
        await p.click('.ejercicio[data-id="dorsal_banda"] [data-accion="banda"][data-valor="verde"]');
      }
      await revisar(p, `tarjeta del constructor (${que})`);
    }
    await p.fill('#para', 'Sam');
    await p.fill('#de', 'Chris');
    // A template: the name field, then «¿Borrar?» on its first touch, which goes back by itself.
    await p.click('[data-accion="nueva-plantilla"]');
    await revisar(p, 'nombre de la plantilla');
    await p.fill('[data-accion="nombre-plantilla"]', 'Knee, week one');
    await p.press('[data-accion="nombre-plantilla"]', 'Enter');
    await p.waitForSelector('.plantilla');
    await p.click('[data-accion="borrar-plantilla"]');
    await revisar(p, 'borrar plantilla en el constructor');
    await p.waitForTimeout(4300);
    await p.click('[data-accion="vaciar"]');
    await revisar(p, 'rutina vaciada');
    await p.click('[data-accion="deshacer-vaciar"]');
    await p.waitForTimeout(300);
    await p.click('[data-accion="crear"]');
    await p.waitForSelector('dialog.hoja-enlace[open]');
    await p.waitForTimeout(800);
    await revisar(p, 'hoja del enlace');
    await foto(p, 'enlace');
    const mensajes = await p.$$eval('dialog.hoja-enlace a[href*="wa.me"], dialog.hoja-enlace a[href*="t.me"]', (l) => l.map((a) => a.href));
    comprobar(mensajes.length === 2, `la hoja del enlace no trae WhatsApp y Telegram (${mensajes.length})`);
    revisarTextos('mensaje de la rutina (WhatsApp y Telegram)', mensajes.map(textoDe));
    if (await p.locator('[data-h="compartir"]').count()) {
      await p.click('[data-h="compartir"]');
      await p.waitForTimeout(200);
      revisarTextos('mensaje de la rutina (otra app)', [String((await p.evaluate(() => window.__compartido?.text)) || '')]);
    } else fallos.push('la hoja del enlace no ofrece «Mandar con otra app» aunque el teléfono puede compartir');
    await p.click('[data-h="copiar"]');
    await p.waitForTimeout(300);
    await revisar(p, 'enlace copiado');
    // The link made in English: only data inside, the same as one made in Spanish.
    const enlace = await p.textContent('.enlace-texto');
    const rutina = await p.evaluate(async (u) => (await import('./datos.js')).decodificar(u.split('#r=')[1]), enlace);
    samId = rutina.p || '';
    const permitidas = new Set(['Sam', 'Chris', 'a', 'b', 'der', 'izq', 'ambos', 'roja', 'verde', ...rutina.e.map((e) => e.i)]);
    const malas = soloDatos(rutina, permitidas);
    comprobar(!malas.length, `el enlace hecho en inglés lleva textos que no son datos: ${malas.join(' | ')}`);
    comprobar(rutina.e.map((e) => e.i).join(',') === 'puente,hombro,andar_atras,andar_ocho,caminar,dorsal_banda', `el enlace no lleva los ejercicios en su orden (${rutina.e.map((e) => e.i)})`);
    comprobar(Object.keys(rutina).every((k) => ['v', 'para', 'de', 'd', 'x', 'w', 'm', 'c', 'f', 'p', 'e'].includes(k)), `el enlace lleva campos nuevos (${Object.keys(rutina)})`);
    await p.click('[data-h="otra"]');
    await p.waitForSelector('dialog.hoja-enlace', { state: 'detached', timeout: 30000 });
    await revisar(p, 'constructor tras «empezar otra»');
  });

  // ---------- The builder on a phone ----------
  await paso('constructor en el móvil', async () => {
    const m = await pagina(await contexto({ movil: true }), 'móvil');
    await m.goto(app());
    await m.waitForSelector('.armar');
    await m.waitForTimeout(1000);
    await revisar(m, 'constructor en el móvil');
    await m.click('.barra-crear [data-accion="abrir-biblioteca"]');
    await m.evaluate(async () => {
      const el = document.querySelector('.biblioteca');
      await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
    });
    await revisar(m, 'biblioteca en el móvil');
    await foto(m, 'biblioteca-movil');
    await m.click('[data-accion="ver-mapa"]');
    await revisar(m, 'mapa en el móvil');
    await m.click('[data-accion="ver-mapa"]');
    await m.click('.biblio-fila[data-id="puente"] [data-accion="anadir"]');
    await m.waitForTimeout(800);
    await revisar(m, 'constructor en el móvil con un ejercicio');
    await m.close();
  });

  // ---------- Personas ----------
  await paso('personas', async () => {
    await p.evaluate(async () => {
      const P = await import('./personas.js');
      const { diaLocal } = await import('./datos.js');
      const hace = (n) => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return diaLocal(d);
      };
      const lista = P.leerPersonas();
      const alex = P.crearPersona(lista, 'Alex', 'alexalex');
      alex.creada = hace(30);
      alex.rutinas.push({ f: hace(20), codigo: 'codalex', e: ['puente', 'hombro'] });
      P.apuntarResumen(alex, {
        m: 4,
        dias: [
          { f: hace(13), h: '10:00', e: [{ i: 'puente', l: 'der', s: 2, r: 10, p: [10, 8], m: 3, c: 'cuesta', n: 'Felt fine' }], a: 2 },
          { f: hace(6), h: '18:30', e: [{ i: 'hombro', l: 'izq', s: 1, r: 12, p: [12], m: 6, c: 'no' }], a: 5 },
          { f: hace(2), h: '09:15', e: [{ i: 'andar_atras', s: 1, r: 10, p: [10], m: 2 }, { i: 'caminar', s: 1, r: 15, p: [12] }] },
        ],
      });
      alex.m = 4;
      const jordan = P.crearPersona(lista, 'Jordan', 'jordanjordan');
      jordan.creada = hace(4);
      jordan.rutinas.push({ f: hace(4), codigo: 'codjordan', e: ['puente'] });
      P.guardarPersonas(lista);
    });
    await p.goto(app('', '#personas'));
    await p.waitForSelector('.persona-fila');
    for (const s of await p.locator('details > summary').all()) await s.click();
    await revisar(p, 'personas');
    await foto(p, 'personas');
    await p.fill('[data-accion="licencia"]', 'abc');
    await p.click('[data-accion="guardar-licencia"]');
    await p.waitForFunction(() => document.querySelector('.aviso-licencia')?.textContent.trim(), null, { timeout: 30000 });
    await revisar(p, 'licencia no válida');
    const [descarga] = await Promise.all([p.waitForEvent('download', { timeout: 120000 }), p.click('[data-accion="exportar"]')]);
    revisarTextos('nombre del archivo de la copia', [descarga.suggestedFilename()]);
    await revisar(p, 'copia guardada');
    const avisoAntes = await p.textContent('.aviso-copia');
    await p.setInputFiles('[data-accion="importar"]', { name: 'otro.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await p.waitForFunction((antes) => document.querySelector('.aviso-copia')?.textContent !== antes, avisoAntes, { timeout: 30000 });
    await revisar(p, 'copia que no es de Jepyso');
    const copia = await p.evaluate(async () => {
      const P = await import('./personas.js');
      return JSON.stringify(P.copia(P.leerPersonas()));
    });
    await p.setInputFiles('[data-accion="importar"]', { name: 'copia.json', mimeType: 'application/json', buffer: Buffer.from(copia) });
    await p.waitForTimeout(800);
    await revisar(p, 'copia cargada');
    await p.fill('[data-accion="buscar-persona"]', 'zzzz');
    await p.waitForTimeout(400);
    await revisar(p, 'nadie con ese nombre');
    await p.fill('[data-accion="buscar-persona"]', '');
    // The paid version, on this laptop only (?pago=1): the Drive section.
    await p.goto(app('&pago=1', '#personas'));
    await p.waitForSelector('.nube');
    await revisar(p, 'personas, versión de pago');
    await p.goto(app('&pago=0', '#personas'));
    await p.waitForSelector('.persona-fila');
  });

  await paso('ficha de una persona', async () => {
    await p.goto(app('', '#persona=alexalex'));
    await p.waitForSelector('.persona-ficha');
    await revisar(p, 'ficha con semanas y días');
    await foto(p, 'ficha', { fullPage: true });
    await p.click('[data-accion="borrar-persona"]');
    await revisar(p, 'borrar la ficha');
    await p.click('#notas');
    await p.goto(app('', '#persona=jordanjordan'));
    await p.waitForSelector('.sin-noticias');
    await revisar(p, 'ficha sin noticias');
    revisarTextos('mensaje a quien no ha dado noticias', (await p.$$eval('.sin-noticias a[href*="wa.me"], .sin-noticias a[href*="t.me"]', (l) => l.map((a) => a.href))).map(textoDe));
    if (await p.locator('.sin-noticias [data-accion="compartir"]').count()) {
      await p.click('.sin-noticias [data-accion="compartir"]');
      await p.waitForTimeout(200);
      revisarTextos('mensaje a quien no ha dado noticias (otra app)', [String((await p.evaluate(() => window.__compartido?.text)) || '')]);
    }
    if (samId) {
      await p.goto(app('', `#persona=${samId}`));
      await p.waitForSelector('.rutinas-mandadas li');
      await p.click('[data-accion="copiar-rutina"]');
      await p.waitForTimeout(300);
      await revisar(p, 'ficha con la rutina mandada');
    }
    await p.goto(app('', '#persona=nadienadie'));
    await p.waitForSelector('.personas h1');
    await revisar(p, 'ficha que no está en este navegador');
  });

  await paso('plantillas y programas', async () => {
    await p.goto(app('', '#plantillas'));
    await p.waitForSelector('[data-accion="programa"]');
    for (const s of await p.locator('details > summary').all()) await s.click();
    await revisar(p, 'plantillas y programas de referencia');
    await foto(p, 'plantillas');
    if (await p.locator('[data-accion="quitar"]').count()) {
      await p.click('[data-accion="quitar"]');
      await revisar(p, 'borrar plantilla');
    } else fallos.push('la plantilla guardada no sale en Plantillas');
    await p.click('[data-accion="programa"][data-id="otago-a"]');
    await p.waitForFunction(() => document.querySelectorAll('.ejercicio[data-id]').length > 0);
    await p.waitForTimeout(500);
    await revisar(p, 'programa Otago A en el constructor');
    // A blank page while the person walks: the builder's figure, left behind, would keep the renderer busy.
    await p.goto('about:blank');
  });

  // ---------- The person ----------
  await paso('rutina de la persona', async () => {
    const per = await contexto({ movil: true, trabajador: true });
    const q = await pagina(per, 'persona');
    await q.goto(app());
    const codigo = await q.evaluate(async () => {
      const { codificar, diaLocal } = await import('./datos.js');
      return codificar({
        v: 1, para: 'Sam', de: 'Chris', d: 5, x: 2, w: 3, m: 4, c: 'a', f: diaLocal(),
        e: [
          { i: 'puente', s: 2, r: 2, t: [1, 1, 1], n: 'Keep it gentle.' },
          { i: 'hombro', s: 1, r: 2, t: [1, 0, 1], l: 'ambos', b: 'roja' },
          { i: 'andar_atras', s: 1, r: 3, t: [1, 0, 1] },
          { i: 'caminar', s: 1, r: 1, t: [1, 0, 1] },
          { i: 'andar_ocho', s: 1, r: 1, t: [2, 1, 2] },
          { i: 'dorsal_banda', s: 1, r: 1, t: [1, 0, 1], l: 'izq', b: 'verde' },
        ],
      });
    });
    await q.goto(app('', `#r=${codigo}`));
    await q.waitForSelector('.rutina-intro');
    await q.waitForFunction(() => document.querySelector('.sin-conexion')?.textContent.trim(), null, { timeout: 40000 })
      .catch(() => notas.push('la rutina no llegó a guardarse para hacerla sin conexión: su aviso no se ha revisado'));
    await revisar(q, 'rutina de la persona');
    await foto(q, 'rutina');
    comprobar((await q.locator('.firma-persona [data-idioma]').count()) === 1, 'la persona no tiene el cambio de idioma al lado de «Accesibilidad»');
    const [ics] = await Promise.all([q.waitForEvent('download', { timeout: 120000 }), q.click('[data-r="recordatorio"]')]);
    const calendario = readFileSync(await conTope(ics.path(), 30000, 'el archivo del calendario'), 'utf8').replace(/\r\n /g, '');
    revisarTextos('recordatorio del calendario', [ics.suggestedFilename(), ...calendario.split(/\r?\n/).filter((l) => /^(SUMMARY|DESCRIPTION):/.test(l)).map((l) => l.replace(/^[A-Z]+:/, '').replace(/\\([,;\\])/g, '$1'))]);
    await revisar(q, 'recordatorio puesto');
    await q.click('[data-r="voz-quien"][data-v="mujer"]');

    // The player: getting ready, how it is done, the countdown, a set, the pause, the rest and the rating.
    await q.click('[data-r="empezar"]');
    await q.waitForSelector('[data-r="en-posicion"]');
    await revisar(q, 'prepárate');
    await foto(q, 'prepara');
    await q.click('[data-r="como"]');
    await q.waitForSelector('dialog.hoja-como[open]');
    await revisar(q, 'cómo se hace');
    await q.click('dialog.hoja-como .boton');
    await q.waitForSelector('dialog.hoja-como', { state: 'detached', timeout: 30000 });
    await q.click('[data-r="en-posicion"]');
    await q.waitForSelector('.cuenta-atras');
    await revisar(q, 'cuenta atrás');
    await q.click('[data-r="ya"]');
    await q.waitForSelector('.j-fase');
    await q.waitForTimeout(800);
    await revisar(q, 'serie');
    await foto(q, 'serie');
    await q.click('[data-r="pausa"]');
    await revisar(q, 'serie en pausa');
    await q.click('[data-r="pausa"]');
    await q.waitForSelector('.anillo, [data-r="todas"]', { timeout: 120000 });
    if (await q.locator('.anillo').count()) {
      await revisar(q, 'descanso');
      await q.click('[data-r="ya"]');
    } else notas.push('el descanso ya había pasado (máquina cargada): sin revisar');
    await q.waitForSelector('[data-r="todas"]', { timeout: 120000 });
    await revisar(q, 'valorar: repeticiones');
    await foto(q, 'valorar');
    await q.click('[data-r="menos"]');
    await revisar(q, 'valorar: hice menos');
    await q.click('[data-r="reps-listo"]');
    await revisar(q, 'valorar: molestia sin marcar');
    await q.click('[data-r="molestia"][data-v="7"]');
    await q.click('[data-r="dificultad"][data-v="cuesta"]');
    await q.fill('[data-r="nota-ejercicio"]', 'Knee hurt a bit');
    await revisar(q, 'valorar: molestia por encima de la aceptable');
    await q.click('[data-r="continuar"]');

    // The shoulder: the band in its colour, then the other side after a rest.
    await q.waitForSelector('[data-r="en-posicion"]');
    await revisar(q, 'prepárate, con banda');
    await q.click('[data-r="en-posicion"]');
    await q.waitForSelector('.cuenta-atras');
    await q.click('[data-r="ya"]');
    await q.waitForSelector('.anillo', { timeout: 120000 });
    await revisar(q, 'descanso: ahora, el otro lado');
    await q.click('[data-r="ya"]');
    await q.waitForSelector('[data-r="todas"]', { timeout: 120000 });
    await q.click('[data-r="todas"]');
    await q.click('[data-r="molestia"][data-v="2"]');
    await q.click('[data-r="continuar"]');

    // Walking, in steps: the × halfway asks first; then the set is ended by hand.
    const serieHastaValorar = async (nombre, antes) => {
      await q.waitForSelector('[data-r="en-posicion"]');
      if (antes) await revisar(q, `prepárate (${nombre})`);
      await q.click('[data-r="en-posicion"]');
      await q.waitForSelector('.cuenta-atras');
      await q.click('[data-r="ya"]');
      await q.waitForSelector('.j-fase');
      await q.waitForTimeout(500);
      await revisar(q, `serie (${nombre})`);
    };
    await serieHastaValorar('pasos');
    await q.click('[data-r="salir"]');
    await q.waitForSelector('[data-r="seguir-rutina"]');
    await revisar(q, '¿dejas la rutina aquí?');
    await q.click('[data-r="seguir-rutina"]');
    await serieHastaValorar('pasos, otra vez');
    await q.click('[data-r="saltar"]');
    await q.waitForSelector('[data-r="todas"]');
    await revisar(q, 'valorar: pasos');
    await q.click('[data-r="todas"]');
    await q.click('[data-r="sin-molestia"]');
    for (const [nombre, molestia] of [['minutos', 0], ['vueltas', 1], ['lado izquierdo y banda', 3]]) {
      await serieHastaValorar(nombre, true);
      await q.click('[data-r="saltar"]');
      await q.waitForSelector('[data-r="todas"]');
      await revisar(q, `valorar: ${nombre}`);
      await q.click('[data-r="todas"]');
      await q.click(`[data-r="molestia"][data-v="${molestia}"]`);
      await q.click('[data-r="continuar"]');
    }

    // The end, the summary that goes back, and the days done with «Corregir» and «sin la app».
    await q.waitForSelector('[data-r="volver"]');
    await q.waitForTimeout(500);
    await revisar(q, 'rutina terminada');
    await foto(q, 'final');
    hist = await q.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('hist:')))));
    await q.click('[data-r="mandar"][data-canal="wa"]');
    await q.waitForTimeout(500);
    const abierto = await q.evaluate(() => window.__abierto.at(-1) || '');
    comprobar(abierto.includes('wa.me'), `«Mandar por WhatsApp» no abre WhatsApp (${abierto})`);
    const textoResumen = textoDe(abierto);
    revisarTextos('mensaje del resumen', [textoResumen]);
    const codResumen = /#s=(\S+)/.exec(textoResumen)?.[1];
    if (codResumen) {
      const resumen = await q.evaluate(async (c) => (await import('./datos.js')).decodificar(c), codResumen);
      const permitidas = new Set(['Sam', 'Chris', 'Knee hurt a bit', 'cuesta', 'no', 'der', 'izq', 'puente', 'hombro', 'andar_atras', 'caminar', 'andar_ocho', 'dorsal_banda']);
      const malas = soloDatos(resumen, permitidas);
      comprobar(!malas.length, `el resumen hecho en inglés lleva textos que no son datos: ${malas.join(' | ')}`);
    } else fallos.push('el mensaje del resumen no lleva su enlace');
    if (await q.locator('[data-r="ya-la-tengo"]').count()) await q.click('[data-r="ya-la-tengo"]');
    await q.click('[data-r="volver"]');
    await q.waitForSelector('[data-r="corregir"]');
    await revisar(q, 'rutina con lo hecho');
    await q.click('[data-r="corregir"]');
    await q.waitForSelector('dialog.hoja-corregir[open]');
    await revisar(q, 'corregir un día');
    await q.click('dialog.hoja-corregir [data-c="cancelar"]');
    await q.waitForSelector('dialog.hoja-corregir', { state: 'detached', timeout: 30000 });
    await q.click('[data-r="sin-app"]');
    await q.waitForSelector('dialog.hoja-corregir[open]');
    await revisar(q, 'apuntar una vez sin la app');
    await q.click('dialog.hoja-corregir [data-c="cancelar"]');
    await q.waitForSelector('dialog.hoja-corregir', { state: 'detached', timeout: 30000 });

    // A routine left halfway, offered again.
    const corta = await q.evaluate(async () => (await import('./datos.js')).codificar({ v: 1, de: 'Chris', d: 30, x: 1, m: 5, c: 'a', e: [{ i: 'puente', s: 2, r: 1, t: [1, 0, 1] }] }));
    await q.goto(app('', `#r=${corta}`));
    await q.click('[data-r="empezar"]');
    await q.click('[data-r="en-posicion"]');
    await q.waitForSelector('.cuenta-atras');
    await q.click('[data-r="ya"]');
    await q.waitForSelector('.anillo', { timeout: 120000 });
    await q.reload();
    await q.waitForSelector('[data-r="seguir-donde"]');
    await revisar(q, 'seguir donde lo dejaste');

    // The next morning: the question about getting up, and its answer.
    await q.clock.setFixedTime(new Date(Date.now() + 86400e3).setHours(10, 0, 0, 0));
    await q.evaluate(async () => {
      const { diaAnterior } = await import('./datos.js');
      const clave = Object.keys(localStorage).find((k) => k.startsWith('hist:') && JSON.parse(localStorage.getItem(k)).length);
      const h = JSON.parse(localStorage.getItem(clave));
      h.at(-1).f = diaAnterior();
      localStorage.setItem(clave, JSON.stringify(h));
    });
    await q.goto(app('', `#r=${codigo}`));
    await q.waitForSelector('.manana');
    await revisar(q, 'pregunta de la mañana');
    await q.click('[data-r="manana"][data-v="6"]');
    await revisar(q, 'mañana apuntada');
    hist = await q.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('hist:') && JSON.parse(localStorage.getItem(k)).length))));

    // Links that cannot be opened.
    await q.goto(app('', '#r=d.roto'));
    await q.waitForSelector('.aviso-roto');
    await revisar(q, 'enlace de rutina roto');
    await q.goto(app('', '#s=d.roto'));
    await q.waitForSelector('.aviso-roto');
    await revisar(q, 'enlace de resumen roto');
    revisarTextos('lo que dice la voz', await q.evaluate(() => window.__dicho));
    await q.close();
  });

  // ---------- The group on a big screen (a board's 1280×600), to its end ----------
  await paso('pantalla grande', async () => {
    const g = await pagina(await contexto({ ancho: 1280, alto: 600 }), 'grupo');
    await g.goto(app());
    const deGrupo = await g.evaluate(async () => (await import('./datos.js')).codificar({ v: 1, de: 'Chris', d: 5, x: 1, c: 'a', e: [{ i: 'puente', s: 1, r: 1, t: [1, 0, 1] }] }));
    await g.goto(app('', `#r=${deGrupo}`));
    await g.waitForSelector('[data-r="grupo"]');
    await revisar(g, 'rutina en el ordenador');
    await g.click('[data-r="grupo"]');
    await g.waitForSelector('.jugador.grupo [data-r="en-posicion"]');
    await revisar(g, 'pantalla grande: posición de partida');
    await g.click('[data-r="en-posicion"]');
    await g.waitForSelector('.cuenta-atras');
    await g.click('[data-r="ya"]');
    await g.waitForSelector('.grupo-fin', { timeout: 120000 });
    await revisar(g, 'pantalla grande: rutina terminada');
    revisarTextos('lo que dice la voz en grupo', await g.evaluate(() => window.__dicho));
    await g.click('[data-r="dejar"]');
  });

  // ---------- The summary, back with the professional ----------
  await paso('resumen recibido', async () => {
    if (!hist) throw new Error('sin días hechos por la persona');
    await p.goto(app('', '#personas'));
    await p.waitForSelector('.lista-personas');
    const cod = (extra) => p.evaluate(async ([d, x]) => (await import('./datos.js')).codificar({ v: 1, para: 'Sam', de: 'Chris', m: 4, dias: d, ...x }), [hist, extra]);
    await p.goto(app('', `#s=${await cod(samId ? { p: samId } : {})}`));
    await p.waitForSelector('.en-ficha');
    await p.waitForTimeout(300);
    await revisar(p, 'resumen recibido');
    await foto(p, 'resumen');
    await p.reload();
    await p.waitForSelector('.en-ficha');
    await revisar(p, 'resumen que ya estaba');
    await p.goto(app('', `#s=${await cod({ para: 'Alex' })}`));
    await p.waitForSelector('[data-accion="guardar-resumen"]');
    await revisar(p, 'resumen para guardar en una ficha');
    await p.click('[data-accion="guardar-resumen"]');
    await p.waitForTimeout(300);
    await revisar(p, 'resumen guardado en la ficha');
    await p.goto(app('', `#s=${await cod({ para: 'Taylor' })}`));
    await p.waitForSelector('[data-accion="guardar-resumen"]');
    await revisar(p, 'resumen de alguien sin ficha');
  });

  // ---------- The app of Google Play, with the five free files full ----------
  await paso('app de la tienda', async () => {
    const tienda = await contexto({ movil: true });
    await tienda.addInitScript(() => {
      if (sessionStorage.getItem('sembrado')) return;
      sessionStorage.setItem('sembrado', '1');
      const ficha = (id, nombre) => ({ id, nombre, notas: '', creada: '2026-11-10', rutinas: [], dias: [] });
      localStorage.setItem('personas', JSON.stringify([['aaaa01', 'Sam'], ['bbbb02', 'Alex'], ['cccc03', 'Jordan'], ['dddd04', 'Chris'], ['eeee05', 'Robin']].map(([i, n]) => ficha(i, n))));
    });
    const t = await pagina(tienda, 'tienda');
    await t.goto(app('&app=android', '#personas'));
    await t.waitForSelector('.capacidad');
    await revisar(t, 'personas en la app de la tienda, fichas llenas');
    await t.click('.firma-pro [data-ayuda]');
    await t.waitForSelector('dialog.hoja-ayuda[open]');
    for (const s of await t.locator('dialog.hoja-ayuda summary').all()) await s.click();
    await revisar(t, 'ayuda en la app de la tienda');
    await t.click('dialog.hoja-ayuda .hoja-como-pie .boton');
    await t.waitForSelector('dialog.hoja-ayuda', { state: 'detached', timeout: 30000 });
    await t.evaluate(() => {
      location.hash = '#';
    });
    await t.waitForSelector('#para');
    await t.fill('#para', 'Taylor');
    await t.waitForTimeout(300);
    await revisar(t, 'constructor con las fichas llenas');
    await t.click('.barra-crear [data-accion="abrir-biblioteca"]');
    await t.click('.biblio-fila[data-id="puente"] [data-accion="anadir"]');
    await t.waitForTimeout(800);
    await t.click('[data-accion="crear"]');
    await t.waitForSelector('dialog.hoja-enlace[open]');
    await revisar(t, 'enlace sin sitio en las fichas');
    await t.click('[data-h="cerrar"]');
    await t.waitForSelector('dialog.hoja-enlace', { state: 'detached', timeout: 30000 });
  });

  // ---------- The free files with a Google account (Google out of reach) ----------
  await paso('fichas con la cuenta de Google', async () => {
    const vales = await contexto();
    await vales.route('https://accounts.google.com/**', (r) => r.abort());
    await vales.addInitScript(() => {
      if (sessionStorage.getItem('sembrado')) return;
      sessionStorage.setItem('sembrado', '1');
      localStorage.setItem('personas', JSON.stringify([{ id: 'ffff06', nombre: 'Sam', notas: '', creada: '2026-11-10', rutinas: [], dias: [] }]));
    });
    const v = await pagina(vales, 'vales');
    await v.goto(app('&vales=1', '#personas'));
    await v.waitForSelector('.cuenta-fichas');
    await v.waitForTimeout(2000);
    await revisar(v, 'personas con la cuenta de Google');
    await v.goto(app('', '#persona=ffff06'));
    await v.waitForSelector('.ficha-cerrada');
    await v.waitForTimeout(1500);
    await revisar(v, 'ficha cerrada');
  });

  // ---------- The switch ----------
  await paso('cambio de idioma', async () => {
    const c = await pagina(await contexto(), 'cambio');
    await c.goto(app());
    await c.waitForSelector('.armar');
    const boton = c.locator('.firma-pro [data-idioma]');
    if (!(await boton.count())) throw new Error('no hay botón [data-idioma] al lado de «Accesibilidad»');
    comprobar(normal(await boton.innerText()) === 'Español', `en inglés, el cambio no dice «Español» («${normal(await boton.innerText())}»)`);
    const cambiar = async () => {
      // The click with a shorter wait than the reload, so a button that cannot be pressed says so.
      await Promise.all([c.waitForEvent('load', { timeout: 120000 }), c.locator('.firma-pro [data-idioma]').click({ timeout: 30000 })]);
      await c.waitForSelector('.armar');
    };
    const estado = async () => ({
      lang: await c.getAttribute('html', 'lang'),
      boton: normal(await c.locator('.firma-pro [data-idioma]').innerText()),
      guardado: await c.evaluate(() => JSON.parse(localStorage.getItem('idioma') || 'null')),
      titulo: normal(await c.locator('.barra-app h1').innerText()),
    });
    await cambiar();
    let e = await estado();
    comprobar(e.lang === 'es' && e.boton === 'English' && e.guardado === 'es' && e.titulo === 'Nueva rutina', `el cambio no pasa un teléfono en inglés al español (${JSON.stringify(e)})`);
    await c.reload();
    await c.waitForSelector('.armar');
    e = await estado();
    comprobar(e.lang === 'es' && e.boton === 'English', `tras recargar, el español elegido no se queda (${JSON.stringify(e)})`);
    await cambiar();
    await c.reload();
    await c.waitForSelector('.armar');
    e = await estado();
    comprobar(e.lang === 'en' && e.boton === 'Español' && e.guardado === 'en', `de vuelta al inglés, no se queda tras recargar (${JSON.stringify(e)})`);
    // The person has it too, and a routine sent in Spanish opens in the phone's language.
    if (codigoPersona) {
      await c.goto(app('', `#r=${codigoPersona}`));
      await c.waitForSelector('.rutina-intro');
      comprobar((await c.locator('.firma-persona [data-idioma]').count()) === 1, 'en la rutina de la persona no está el cambio de idioma');
      await revisar(c, 'rutina de ejemplo, en inglés');
    }
    // A phone in Spanish: Spanish, and the switch offers English.
    const es = await pagina(await contexto({ locale: 'es-ES' }), 'español');
    await es.goto(app());
    await es.waitForSelector('.armar');
    comprobar((await es.getAttribute('html', 'lang')) === 'es', 'un teléfono en español no abre en español');
    const enEs = es.locator('.firma-pro [data-idioma]');
    comprobar((await enEs.count()) === 1 && normal(await enEs.innerText()) === 'English', 'en un teléfono en español, el cambio no dice «English»');
    // Inside a Moodle course the player follows the user's language there (?idioma=, as player.php writes it).
    await es.goto(app('&idioma=en_us'));
    await es.waitForSelector('.armar');
    comprobar((await es.getAttribute('html', 'lang')) === 'en', 'con ?idioma=en_us de Moodle, un teléfono en español no abre en inglés');
    await c.evaluate(() => localStorage.removeItem('idioma'));
    await c.goto(app('&idioma=es_mx'));
    await c.waitForSelector('.armar');
    comprobar((await c.getAttribute('html', 'lang')) === 'es', 'con ?idioma=es_mx de Moodle, un teléfono en inglés no abre en español');
  });
} finally {
  for (const c of contextos) await c.close().catch(() => {});
  await navegador.close();
}

// ---------- The report ----------
const grupos = { pantallas: [], ejercicios: [] };
for (const s of sobras.values()) grupos[s.tipo].push(s);
const linea = (s) => `    «${s.linea}»${s.a ? ` [${s.a}]` : ''} — ${[...s.donde].join('; ')}`;
if (notas.length) console.log(`idioma, notas:\n  ${[...new Set(notas)].join('\n  ')}`);
if (grupos.pantallas.length || grupos.ejercicios.length) {
  console.error(`idioma: español que queda en inglés: ${grupos.pantallas.length} en las pantallas, ${grupos.ejercicios.length} en el contenido de los ejercicios`);
  if (grupos.pantallas.length) console.error(`  pantallas (app/idiomas/en.js):\n${grupos.pantallas.map(linea).join('\n')}`);
  if (grupos.ejercicios.length) console.error(`  ejercicios (app/idiomas/en-ejercicios.js):\n${grupos.ejercicios.map(linea).join('\n')}`);
}
if (fallos.length) console.error(`idioma, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
if (fallos.length || sobras.size) process.exit(1);
console.log('idioma: en inglés no queda español en las pantallas, los mensajes, los archivos ni la voz; el cambio pasa al español y vuelve, y se queda al recargar');
