// Checks that sw.js keeps every file the app needs: each one is in its list of app files or is one of the files it
// keeps for good (three.js, bodies, clips and their sheets). A file added to the app and forgotten in sw.js would
// be missing the first time the person opens a routine with no signal.
// Usage: node archivos-sw.mjs <app folder>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const app = process.argv[2];
const sw = readFileSync(join(app, 'sw.js'), 'utf8');
const lista = JSON.parse(sw.match(/const ARCHIVOS = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));
const fijo = (ruta) => ruta.startsWith('vendor/three/') || (/^modelos\/.+\.(glb|json|webp)$/.test(ruta) && !ruta.endsWith('ejercicios.json'));

const todos = [];
const recorrer = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else todos.push(relative(app, p).split('\\').join('/'));
  }
};
recorrer(app);

const faltan = todos.filter((r) => r !== 'sw.js' && !/(^|\/)(LICENSE|.*\.md)$/.test(r) && !fijo(r) && !lista.includes(r));
const sobran = lista.filter((r) => !todos.includes(r));
if (faltan.length || sobran.length) {
  if (faltan.length) console.error(`sw.js no guarda: ${faltan.join(', ')}`);
  if (sobran.length) console.error(`sw.js pide lo que no existe: ${sobran.join(', ')}`);
  process.exit(1);
}
console.log(`sw.js: ${lista.length} ficheros de la app y el resto fijos`);
