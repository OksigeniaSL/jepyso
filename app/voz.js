// The voice that guides a set: the words of each phase the first time round, then the count, and the countdown. First,
// the takes recorded with Oksigenia's two brand voices in voz/ (tools/voz/: one short clip per sentence, played through
// Web Audio, the same way as the tones): each person chooses «Voz de mujer» (Mira) or «Voz de hombre» (Altair), and the
// first time each phone gets one of the two at random, so neither is the default (Enrique, 15-11-2026). A sentence with
// no take at hand (no connection the first time) is said by a Spanish voice of the phone itself (localService:
// nothing the person hears is sent anywhere). Without either the routine goes on with its tones. On by default; the
// person can turn it off, and the choice stays on that phone. In English, the same two brand voices speak English
// (voz/mira-en, voz/altair-en), and the phone's own voice is an English one.
import { almacen } from './datos.js';
import { idioma, t } from './idioma.js';

let voz = null;
let buscada = false;
const tomas = new Map();
// A group in front of a big screen (modo de grupo) hears it on by default with its own switch, and a little slower: a
// room of people follows one voice from metres away.
let claveVoz = 'voz';
let ritmo = 1.05;
export function modoVoz({ grupo = false } = {}) {
  claveVoz = grupo ? 'voz-grupo' : 'voz';
  ritmo = grupo ? 0.9 : 1.05;
}

function elegirVoz() {
  if (!('speechSynthesis' in window)) return null;
  const en = idioma() === 'en';
  const locales = speechSynthesis.getVoices().filter((v) => v.localService && (en ? /^en\b/i : /^es\b/i).test(v.lang));
  // Spanish from Spain (British English) first, then any other; within each, the phone's default.
  const orden = (v) => ((en ? /^en[-_]GB/i : /^es[-_]ES/i).test(v.lang) ? 0 : 1) * 2 + (v.default ? 0 : 1);
  return locales.sort((a, b) => orden(a) - orden(b))[0] || null;
}

// Who speaks: each recorded voice in its folder, with voz/<folder>/indice.json saying the file of each sentence
// ({ "Descansa": "a1b2c3d4e5f6", … }).
const CARPETAS_DE = { es: { mujer: 'mira', hombre: 'altair' }, en: { mujer: 'mira-en', hombre: 'altair-en' } };
// Asked each time: the language is only settled once the app has loaded (a published routine brings its own).
const carpetas = () => CARPETAS_DE[idioma()] || CARPETAS_DE.es;
export const quienHabla = () => {
  let q = almacen.leer('voz-quien', '');
  if (!Object.hasOwn(carpetas(), q)) {
    q = Math.random() < 0.5 ? 'mujer' : 'hombre';
    almacen.guardar('voz-quien', q);
  }
  return q;
};
// Without connection, only what this phone keeps: a take never saved is said by the phone's voice, and nothing is
// asked for that can only fail.
async function pedir(url) {
  if (!navigator.onLine && 'caches' in window && !(await caches.match(url).catch(() => null))) return null;
  const r = await fetch(url);
  return r.ok ? r : null;
}
let indice = null;
let pidiendoIndice = null;
let indiceListo = false;
let indiceDe = '';
function cargarIndice() {
  const q = quienHabla();
  if (indiceDe !== q) {
    indiceDe = q;
    indice = null;
    pidiendoIndice = null;
    indiceListo = false;
    tomas.clear();
  }
  pidiendoIndice ||= pedir(`voz/${carpetas()[q]}/indice.json`)
    .then((r) => (r ? r.json() : null))
    .then((i) => {
      if (indiceDe === q) indice = i && typeof i === 'object' && !Array.isArray(i) ? i : null;
    })
    .catch(() => {})
    .finally(() => {
      if (indiceDe === q) indiceListo = true;
    });
  return pidiendoIndice;
}
export function ponerQuien(q) {
  if (!Object.hasOwn(carpetas(), q)) return;
  almacen.guardar('voz-quien', q);
  callar();
  cargarIndice();
}

function prepararVoz() {
  cargarIndice();
  if (buscada || !('speechSynthesis' in window)) return;
  buscada = true;
  voz = elegirVoz();
  // Some browsers fill the list a moment later.
  speechSynthesis.addEventListener?.('voiceschanged', () => (voz = elegirVoz()));
}

export const hayVoz = () => {
  prepararVoz();
  return !!voz || !!indice;
};
// Whether the voice heard is the recorded one (for the tests).
export const vozGrabada = () => !!indice;
export const vozActiva = () => almacen.leer(claveVoz, true) !== false;
export const ponerVoz = (si) => {
  almacen.guardar(claveVoz, !!si);
  if (!si) callar();
};

let contexto = null;
let sonando = [];
const audio = () => {
  contexto ||= new (window.AudioContext || window.webkitAudioContext)();
  if (contexto.state === 'suspended') contexto.resume().catch(() => {});
  return contexto;
};
const esClave = (k) => typeof k === 'string' && /^[0-9a-f]{12}$/.test(k);
function toma(texto) {
  const k = indice?.[texto];
  if (!esClave(k)) return null;
  if (!tomas.has(k)) {
    tomas.set(k, pedir(`voz/${carpetas()[indiceDe]}/${k}.mp3`)
      .then((r) => (r ? r.arrayBuffer() : Promise.reject(new Error(k))))
      .then((b) => audio().decodeAudioData(b))
      .catch(() => {
        tomas.delete(k);
        return null;
      }));
  }
  return tomas.get(k);
}
// A sentence that was not recorded whole («8. Hecho»), said in its parts.
const partes = (texto) => (indice?.[texto] ? [texto] : texto.split(/\.\s+/).map((t) => t.trim()).filter(Boolean));

function callarTomas() {
  for (const s of sonando) {
    try {
      s.stop();
    } catch {
      // Already over.
    }
  }
  sonando = [];
}

// Each sentence takes its turn: one still loading when a newer one interrupts it is not heard late.
let turno = 0;
async function decirGrabado(texto, mio) {
  const buffers = await Promise.all(partes(texto).map(toma));
  if (mio !== turno) return;
  // A take that is not at hand (no connection yet): the phone's own voice says it, if there is one.
  if (buffers.some((b) => !b)) return decirConElTelefono(texto);
  const ctx = audio();
  let t = ctx.currentTime + 0.02;
  for (const b of buffers) {
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start(t);
    sonando.push(s);
    t += b.duration + 0.12;
  }
}

// interrumpir: what is said now replaces what was still being said (a count that comes late is no use).
function decirConElTelefono(texto, interrumpir = true) {
  if (!voz) return;
  if (interrumpir) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.voice = voz;
  u.lang = voz.lang;
  u.rate = ritmo;
  speechSynthesis.speak(u);
}

export function decir(dicho, { interrumpir = true } = {}) {
  prepararVoz();
  if (!vozActiva() || !dicho) return;
  // In the language in use, whether the caller translated it or not (an English text is its own translation).
  const texto = t(dicho);
  // The list of takes of the voice just chosen is still on its way: said when it arrives.
  if (!indice && pidiendoIndice && !indiceListo) {
    pidiendoIndice.then(() => decir(texto, { interrumpir }));
    return;
  }
  // A sentence with no take (not in the list of this voice): the phone says it at once.
  if (!indice || !partes(texto).every((t) => esClave(indice[t]))) return decirConElTelefono(texto, interrumpir);
  if (interrumpir) {
    if (voz) speechSynthesis.cancel();
    callarTomas();
    turno += 1;
  }
  decirGrabado(texto, turno);
}

export function callar() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  callarTomas();
}

// The files of the voice chosen for some sentences (and its list), for the worker to keep them with a routine that
// is saved to be done without connection.
export async function rutasDeVoz(textos) {
  await cargarIndice();
  if (!indice) return [];
  const carpeta = `voz/${carpetas()[indiceDe]}`;
  const claves = new Set(textos.flatMap((x) => partes(t(x))).map((x) => indice[x]).filter(esClave));
  return [`${carpeta}/indice.json`, ...[...claves].map((k) => `${carpeta}/${k}.mp3`)];
}
// What the player may say in any routine: the count, its own sentences and the default words of the phases.
export const FRASES_GENERALES = ['Hecho', 'Descansa', 'Descansa. Ahora, el otro lado', 'Rutina terminada. Buen trabajo.', 'Voz encendida', 'Ida', 'Mantén', 'Vuelta', 'Respira'];

const NUMEROS = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
  'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
const VEINTI = ['veinte', '', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve'];
const DECENAS = { 3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta' };
const EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_DECENAS = { 2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty' };
function numeroEn(n) {
  if (n < 20) return EN[n] ?? String(n);
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (!EN_DECENAS[d] || n > 60) return String(n);
  return u === 0 ? EN_DECENAS[d] : `${EN_DECENAS[d]}-${EN[u]}`;
}

// The count in words up to sixty, as said aloud: figures would be read in another language by some voices. Steps and
// laps are counted «uno» (veintiuno, treinta y uno), repetitions «una» (veintiuna, treinta y una). English has one.
export function numero(n, masculino = false) {
  if (idioma() === 'en') return numeroEn(n);
  const uno = masculino ? 'uno' : 'una';
  if (n === 1) return uno;
  if (n <= 20) return NUMEROS[n] ?? String(n);
  if (n < 30) return n === 21 ? `veinti${uno}` : VEINTI[n - 20];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (!DECENAS[d] || n > 60) return String(n);
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${u === 1 ? uno : NUMEROS[u]}`;
}
