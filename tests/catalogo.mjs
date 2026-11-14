// Checks the exercise catalogue (app/datos.js) before the walk: every exercise has its full explanation and its open
// guides, settings the builder can show, known areas and muscles; every exercise in the library has its clips and its
// still (tools/posters/) for both bodies, and the muscles the card names are the ones the figure lights.
// Usage: node catalogo.mjs <app folder>
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const app = resolve(process.argv[2]);
const { EJERCICIOS, ORDEN, ZONAS, MUSCULOS } = await import(pathToFileURL(join(app, 'datos.js')).href);
const fallos = [];
const mal = (id, que) => fallos.push(`${id}: ${que}`);
const entre = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;

for (const [id, e] of Object.entries(EJERCICIOS)) {
  for (const campo of ['nombre', 'posicion', 'material', 'partida', 'error']) if (!e[campo]?.trim()) mal(id, `sin ${campo}`);
  if (!e.pasos?.length) mal(id, 'sin pasos');
  if (!e.fuentes?.length) mal(id, 'sin fuentes');
  if (!e.zonas?.length || e.zonas.some((z) => !ZONAS[z])) mal(id, `zonas desconocidas: ${e.zonas}`);
  const musculos = [...(e.musculos?.principales || []), ...(e.musculos?.secundarios || [])];
  if (musculos.some((m) => !MUSCULOS[m])) mal(id, `músculos desconocidos: ${musculos}`);
  const d = e.porDefecto || {};
  const [s, m, b] = d.tempo || [];
  // Laps (the figure of eight) show no pace in the builder: each half takes as long as the figure walks it (up to 12 s,
  // what a link carries).
  const tope = e.unidad === 'vueltas' ? 12 : 6;
  if (!entre(d.series, 1, 6) || !entre(d.reps, 1, 30) || !entre(s, 1, tope) || !entre(m, 0, 30) || !entre(b, 1, tope)) {
    mal(id, `ajustes por defecto fuera de lo que el constructor enseña: ${JSON.stringify(d)}`);
  }
}

for (const c of ['modelos/ejercicios.json', 'modelos/b/ejercicios.json']) {
  const manifiesto = JSON.parse(readFileSync(join(app, c), 'utf8'));
  for (const id of ORDEN) {
    const m = manifiesto.ejercicios[id];
    if (!EJERCICIOS[id]) mal(id, 'en la biblioteca sin texto');
    else if (!m) mal(id, `en la biblioteca sin clip en ${c}`);
    else {
      const a = [...m.musculos.principales].sort().join(',');
      const b = [...EJERCICIOS[id].musculos.principales].sort().join(',');
      if (a !== b) mal(id, `la tarjeta nombra ${b} y la figura enciende ${a} (${c})`);
      const still = c.replace('ejercicios.json', `posters/${id}.webp`);
      if (!existsSync(join(app, still))) mal(id, `en la biblioteca sin póster (${still}; tools/posters/hacer.sh)`);
    }
  }
}

if (fallos.length) {
  console.error(`catálogo, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log(`catálogo: ${Object.keys(EJERCICIOS).length} ejercicios con su texto, ${ORDEN.length} en la biblioteca`);
