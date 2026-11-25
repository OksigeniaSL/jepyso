// Checks that every text the screens look up (t('…') and tn(n, '…', '…') with a literal in app/*.js and in the module of
// the Moodle activity) has its English
// in app/idiomas/en.js or en-ejercicios.js, so a new sentence cannot reach a phone in English half in Spanish.
// Texts built at run time (exercise content, data) are checked by tools/idiomas/extraer.mjs and tests/idioma.mjs.
// Usage: node tools/idiomas/pantallas.mjs        (exit 1 and the list when something lacks its English)
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app');
const en = {
  ...(await import(pathToFileURL(join(APP, 'idiomas', 'en-ejercicios.js')))).default,
  ...(await import(pathToFileURL(join(APP, 'idiomas', 'en.js')))).default,
};
// A JS string literal in single quotes, with its escapes.
const LIT = String.raw`'((?:[^'\\\n]|\\.)*)'`;
const LLAMADAS = [new RegExp(String.raw`\bt\(\s*${LIT}`, 'g'), new RegExp(String.raw`\btn\([^,()]+,\s*${LIT}\s*,\s*${LIT}`, 'g')];
const valor = (s) => s.replace(/\\(.)/g, (m, c) => ({ n: '\n', t: '\t' }[c] ?? c));

const faltan = new Map();
let vistas = 0;
for (const f of [...readdirSync(APP).filter((n) => n.endsWith('.js')), '../tools/moodle/entorno.js']) {
  const codigo = readFileSync(join(APP, f), 'utf8');
  for (const re of LLAMADAS) {
    for (const m of codigo.matchAll(re)) {
      for (const g of m.slice(1).filter((x) => x !== undefined)) {
        vistas += 1;
        const es = valor(g);
        if (!(typeof en[es] === 'string' && en[es].trim())) faltan.set(es, f);
      }
    }
  }
}
for (const [es, f] of faltan) console.log(`sin inglés (${f}): ${es}`);
console.log(`${vistas} textos de pantalla, ${faltan.size} sin inglés`);
process.exit(faltan.size ? 1 : 0);
