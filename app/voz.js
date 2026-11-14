// The voice that guides a set: the words of each phase the first time round, then the count, and the countdown. Only
// voices that live on the phone itself (localService): nothing the person hears is sent anywhere. Without a Spanish
// voice of that kind the routine goes on with its tones, as before. On by default; the person can turn it off, and
// the choice stays on that phone.
import { almacen } from './datos.js';

let voz = null;
let buscada = false;

function elegirVoz() {
  if (!('speechSynthesis' in window)) return null;
  const locales = speechSynthesis.getVoices().filter((v) => v.localService && /^es\b/i.test(v.lang));
  // Spanish from Spain first, then any other; within each, the phone's default.
  const orden = (v) => (/^es[-_]ES/i.test(v.lang) ? 0 : 1) * 2 + (v.default ? 0 : 1);
  return locales.sort((a, b) => orden(a) - orden(b))[0] || null;
}

function prepararVoz() {
  if (buscada || !('speechSynthesis' in window)) return;
  buscada = true;
  voz = elegirVoz();
  // Some browsers fill the list a moment later.
  speechSynthesis.addEventListener?.('voiceschanged', () => (voz = elegirVoz()));
}

export const hayVoz = () => {
  prepararVoz();
  return !!voz;
};
export const vozActiva = () => almacen.leer('voz', true) !== false;
export const ponerVoz = (si) => {
  almacen.guardar('voz', !!si);
  if (!si) callar();
};

// interrumpir: what is said now replaces what was still being said (a count that comes late is no use).
export function decir(texto, { interrumpir = true } = {}) {
  prepararVoz();
  if (!voz || !vozActiva() || !texto) return;
  if (interrumpir) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.voice = voz;
  u.lang = voz.lang;
  u.rate = 1.05;
  speechSynthesis.speak(u);
}

export function callar() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

const NUMEROS = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
  'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
export const numero = (n) => NUMEROS[n] || String(n);
