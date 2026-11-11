// Checks the people's files (app/personas.js): routines go to the right person, summaries join without repeating,
// the week-by-week evolution and loading a copy.
// Usage: node personas.mjs <app folder>
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const app = resolve(process.argv[2]);
const P = await import(pathToFileURL(join(app, 'personas.js')).href);
const fallos = [];
const ok = (c, que) => c || fallos.push(que);

const lista = [];
const marta = P.apuntarRutina(lista, { nombre: 'Marta' }, { f: '2026-11-02', m: 4, e: [{ i: 'puente' }] }, 'cod1');
ok(lista.length === 1 && marta.m === 4 && marta.rutinas.length === 1, 'una rutina crea la ficha con su tope');
P.apuntarRutina(lista, { nombre: ' márta ' }, { f: '2026-11-03', e: [{ i: 'silla' }] }, 'cod2');
ok(lista.length === 1 && marta.rutinas.length === 2, 'el mismo nombre, sin tildes ni espacios, va a la misma ficha');
P.apuntarRutina(lista, { id: marta.id, nombre: 'Marta' }, { f: '2026-11-03', e: [{ i: 'silla' }] }, 'cod2');
ok(marta.rutinas.length === 2, 'la misma rutina no se apunta dos veces');
P.crearPersona(lista, 'Marta');
const otra = P.apuntarRutina(lista, { nombre: 'Marta' }, { f: '2026-11-04', e: [{ i: 'hombro' }] }, 'cod3');
ok(lista.length === 3 && otra.id !== marta.id, 'con dos «Marta», un nombre solo no elige: ficha nueva');

const dia = (f, h, m, a) => ({ f, h, e: [{ i: 'puente', l: 'der', s: 1, r: 10, p: [10], m }], ...(a === undefined ? {} : { a }) });
let n = P.apuntarResumen(marta, { m: 4, dias: [dia('2026-11-03', '10:00', 3), dia('2026-11-04', '10:00', 6)] });
ok(n === 2 && marta.dias.length === 2, 'un resumen añade sus sesiones');
n = P.apuntarResumen(marta, { m: 4, dias: [dia('2026-11-03', '10:00', 3, 2), dia('2026-11-04', '10:00', 6), dia('2026-11-10', '09:00', 5, 6)] });
ok(n === 1 && marta.dias.length === 3, 'otro resumen solo añade lo nuevo');
ok(marta.dias[0].a === 2, 'un resumen posterior trae la molestia al levantarse de una sesión ya guardada');

const s = P.semanas(marta.dias, 4);
ok(s.length === 2 && s[0].desde === '2026-11-02' && s[1].desde === '2026-11-09', 'las semanas empiezan en lunes');
ok(s[0].durante === 6 && s[0].manana === 2 && s[0].marcados === 1, 'la primera semana: máxima 6 durante, 2 al levantarse');
ok(s[1].manana === 6 && s[1].sube === true, 'la segunda sube: se marca');

const otraLista = [];
const r = P.cargarCopia(otraLista, JSON.parse(JSON.stringify(P.copia(lista))));
ok(r.total === 3 && r.nuevas === 3 && otraLista[0].dias.length === 3, 'una copia se carga entera en otro aparato');
const r2 = P.cargarCopia(otraLista, JSON.parse(JSON.stringify(P.copia(lista))));
ok(r2.nuevas === 0 && otraLista[0].dias.length === 3 && otraLista[0].rutinas.length === 2, 'cargar la misma copia otra vez no repite nada');
let rechaza = false;
try { P.cargarCopia(otraLista, { app: 'otra' }); } catch { rechaza = true; }
ok(rechaza, 'un archivo que no es una copia de Jepyso se rechaza');

// The free version: up to five people with a file. The ones already there keep receiving routines.
const llena = [];
for (let i = 0; i < 5; i++) P.crearPersona(llena, `Persona ${i}`);
ok(P.apuntarRutina(llena, { nombre: 'Sexta' }, { f: '2026-11-11', e: [{ i: 'puente' }] }, 'cod9') === null && llena.length === 5, 'con 5 fichas, una persona nueva no tiene sitio');
ok(P.apuntarRutina(llena, { nombre: 'Persona 2' }, { f: '2026-11-11', e: [{ i: 'puente' }] }, 'cod10')?.nombre === 'Persona 2', 'con 5 fichas, las que ya están siguen recibiendo rutinas');
const r3 = P.cargarCopia(llena, P.copia([{ id: 'x1', nombre: 'Otra', rutinas: [], dias: [] }]));
ok(r3.fuera === 1 && llena.length === 5, 'una copia no pasa del límite');

if (fallos.length) {
  console.error(`personas, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('personas: fichas, resúmenes, semanas y copias, bien');
