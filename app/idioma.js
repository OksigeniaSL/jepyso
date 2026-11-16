// The language of the screens: Spanish, in which Jepyso is written, or English. Each phone follows its own language
// unless someone chose one with the switch beside «Accesibilidad»: a routine sent from a phone in Spanish opens in
// English on a phone set in English, and the other way round. What people write themselves (names, notes) stays as
// they wrote it.
//
// Texts are looked up by their Spanish wording, as gettext does: t('Nueva rutina'), t('Hola, {nombre}', { nombre }),
// tn(n, '{n} serie', '{n} series'). The English ones are in idiomas/en.js (the screens) and idiomas/en-ejercicios.js
// (the exercises, programmes and phases: tools/idiomas/extraer.mjs lists them and checks that none is missing). They
// load only in English, so a phone in Spanish downloads nothing more. A text with no translation shows in Spanish;
// tests/idioma.mjs walks the app in English looking for any.
import { almacen } from './datos.js';

export const IDIOMAS = { es: 'Español', en: 'English' };

// The languages of Spain and of Paraguay read Spanish better than English; any other one gets English.
const HISPANAS = /^(es|ca|gl|eu|ast|an|gn)\b/i;
function delTelefono() {
  const lista = navigator.languages?.length ? navigator.languages : [navigator.language || 'es'];
  for (const l of lista) {
    if (HISPANAS.test(l)) return 'es';
    if (/^en\b/i.test(l)) return 'en';
  }
  return 'en';
}

let actual = '';
export function idioma() {
  if (!actual) {
    const elegido = almacen.leer('idioma', '');
    actual = Object.hasOwn(IDIOMAS, elegido) ? elegido : delTelefono();
  }
  return actual;
}
// Whether this phone's language was chosen by hand (and not taken from the phone).
export const idiomaElegido = () => Object.hasOwn(IDIOMAS, almacen.leer('idioma', ''));
// The other language, for the switch.
export const otroIdioma = () => (idioma() === 'es' ? 'en' : 'es');
// Changing language starts the page again: every screen and every sentence of the voice change with it.
export function ponerIdioma(l) {
  if (!Object.hasOwn(IDIOMAS, l)) return;
  almacen.guardar('idioma', l);
  location.reload();
}
// For dates and numbers. British English: the spelling of the programmes Otago and Vivifrail and of most of the world.
export const locale = () => (idioma() === 'en' ? 'en-GB' : 'es-ES');

let textos = {};
// Loads the translation of the language in use. The app awaits it before its first screen.
export async function cargarIdioma() {
  document.documentElement.lang = idioma();
  if (idioma() === 'es') return;
  const [pantallas, ejercicios] = await Promise.all([import('./idiomas/en.js'), import('./idiomas/en-ejercicios.js')]);
  textos = { ...ejercicios.default, ...pantallas.default };
}

const rellenar = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => (Object.hasOwn(v, k) ? String(v[k]) : m)) : s);
// A text in the language in use; {name} parts are filled from v.
export const t = (es, v) => rellenar((typeof textos[es] === 'string' && textos[es]) || es, v);
// A text that changes with a number: tn(3, '{n} serie', '{n} series'). Spanish and English agree: one, and the rest.
export const tn = (n, uno, varios, v) => t(n === 1 ? uno : varios, { n, ...v });
// Whether a Spanish text has its English one (for the tests and for texts that are better left out than half done).
export const traducido = (es) => idioma() === 'es' || (typeof textos[es] === 'string' && !!textos[es]);
