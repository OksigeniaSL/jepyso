// Lists every Spanish text of the exercises that a person or a professional reads or hears: the catalogue (app/datos.js),
// the reference programmes (app/programas.js) and the sheets of every clip (app/modelos/*.json and modelos/b/*.json:
// their names and the words of each phase, which the voice says). Each text once, with where it comes from, so the
// translation misses none. Usage: node tools/idiomas/extraer.mjs > tools/idiomas/textos-ejercicios.json
// With --comprobar <file>, says which texts the dictionary in that file lacks (and which it has that no longer exist).
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app');
const { EJERCICIOS, ZONAS, MUSCULOS, LADOS, BANDAS } = await import(pathToFileURL(join(APP, 'datos.js')));
const { PROGRAMAS } = await import(pathToFileURL(join(APP, 'programas.js')));

const textos = new Map();
const apuntar = (es, donde) => {
  if (typeof es !== 'string' || !es.trim()) return;
  if (!textos.has(es)) textos.set(es, []);
  if (textos.get(es).length < 3) textos.get(es).push(donde);
};
const CAMPOS = ['nombre', 'otrosNombres', 'posicion', 'material', 'partida', 'pasos', 'notar', 'error', 'ayuda', 'para', 'masDificil', 'cuidado', 'fuentes'];
for (const [id, e] of Object.entries(EJERCICIOS)) {
  for (const c of CAMPOS) [].concat(e[c] ?? []).forEach((s) => apuntar(s, `${id}.${c}`));
}
for (const [tabla, valores] of Object.entries({ ZONAS, MUSCULOS, LADOS })) Object.entries(valores).forEach(([k, s]) => apuntar(s, `${tabla}.${k}`));
Object.entries(BANDAS).forEach(([k, b]) => apuntar(b.nombre, `BANDAS.${k}`));
for (const p of PROGRAMAS) {
  apuntar(p.nombre, `programa ${p.id}.nombre`);
  apuntar(p.descripcion, `programa ${p.id}.descripcion`);
  Object.entries(p.ejercicios || {}).forEach(([id, x]) => apuntar(x.nota, `programa ${p.id}.${id}.nota`));
}
for (const carpeta of ['modelos', 'modelos/b']) {
  for (const f of readdirSync(join(APP, carpeta)).filter((n) => n.endsWith('.json') && n !== 'ejercicios.json')) {
    const ficha = JSON.parse(readFileSync(join(APP, carpeta, f), 'utf8'));
    apuntar(ficha.nombre, `${carpeta}/${f}.nombre`);
    (ficha.fases || []).forEach((x) => apuntar(x.texto, `${carpeta}/${f}.fase ${x.fase}`));
  }
}

const comprobar = process.argv.indexOf('--comprobar');
if (comprobar > 0) {
  const { default: dic } = await import(pathToFileURL(process.argv[comprobar + 1]));
  const faltan = [...textos.keys()].filter((es) => typeof dic[es] !== 'string' || !dic[es].trim());
  const sobran = Object.keys(dic).filter((es) => !textos.has(es));
  faltan.forEach((es) => console.log(`falta: ${es}`));
  sobran.forEach((es) => console.log(`sobra: ${es}`));
  console.log(`${textos.size} textos, ${faltan.length} sin traducir, ${sobran.length} que ya no existen`);
  process.exit(faltan.length ? 1 : 0);
}
console.log(JSON.stringify([...textos].map(([es, donde]) => ({ es, donde })), null, 1));
