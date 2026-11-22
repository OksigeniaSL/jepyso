// What comes from outside (links, copies, the cloud, storage) is cleaned before use (app/entrada.js): forged values
// must come out as plain data of the right type, never as markup or as keys every object already has.
import assert from 'node:assert/strict';

const raiz = new URL(`file://${process.argv[2] ? (await import('node:path')).resolve(process.argv[2]) : new URL('../app', import.meta.url).pathname}/`);
globalThis.window = globalThis;
const { limpiarRutina, limpiarResumen, limpiarPersonas, limpiarPlantillas, limpiarBorradas } = await import(new URL('entrada.js', raiz));

const marca = '<img src=x onerror=alert(1)>';

// A summary with markup where numbers and times go.
const s = limpiarResumen({
  p: '<b>', para: 'Ana', m: '9', dias: [
    { f: '2026-11-10', h: marca, a: '3', e: [{ i: 'puente', l: 'der', s: 2, r: marca, p: [10, marca, 99], m: 4 }] },
    { f: 'x', e: [] },
    { f: '2026-11-11', e: [{ i: 'constructor', p: [1] }, { i: '__proto__', p: [1] }, { i: 'puente', p: [8, 9], r: 10 }] },
  ],
});
assert.equal(s.p, undefined);
assert.equal(s.m, undefined);
assert.equal(s.dias.length, 2, 'a day with a date that is not one goes out');
assert.equal(s.dias[0].h, undefined);
assert.equal(s.dias[0].a, undefined);
assert.deepEqual(s.dias[0].e[0].p, [10, 0, 50]);
assert.equal(s.dias[0].e[0].r, 1);
assert.deepEqual(s.dias[1].e.map((x) => x.i), ['puente']);

// A routine: unknown exercises out, numbers within the builder's ranges, texts cut.
const r = limpiarRutina({ para: marca, d: 'x', x: 9, m: 99, c: '"', e: [{ i: 'puente', s: '3', r: 999, t: [marca, 40, -1], l: 'x', n: 'n'.repeat(9000) }, { i: 'toString' }] });
assert.equal(r.e.length, 1);
assert.deepEqual([r.d, r.x, r.m, r.c], [45, 3, 9, 'a']);
assert.deepEqual([r.e[0].s, r.e[0].r], [3, 30]);
assert.deepEqual(r.e[0].t, [2, 30, 1]);
assert.equal(r.e[0].n.length, 4000);
assert.equal(r.para, marca, 'names stay text: they are escaped where they are painted');
assert.equal(limpiarRutina({ e: 'x' }), null);

// A circuit: its rounds are every exercise's sets; the rests, from the builder's own lists.
const c = limpiarRutina({ k: 3, kd: 120, d: 15, e: [{ i: 'puente', s: 1 }, { i: 'plancha', s: 5 }] });
assert.deepEqual([c.k, c.kd, c.d], [3, 120, 15]);
assert.deepEqual(c.e.map((x) => x.s), [3, 3]);
const c2 = limpiarRutina({ k: 40, kd: 7, d: 15, e: [{ i: 'puente', s: 2 }] });
assert.deepEqual([c2.k, c2.kd, c2.d, c2.e[0].s], [undefined, undefined, 45, 2], 'rounds out of range: a routine by sets');
assert.equal(limpiarRutina({ k: 2, kd: 7, d: 90, e: [] }).kd, 120);
assert.equal(limpiarRutina({ k: 2, d: 90, e: [] }).d, 30, 'between exercises, the circuit list');

// Published: no name, no file, and back only to a plain https page.
const pub = limpiarRutina({ o: 1, para: 'Ana', p: 'ab12', de: 'Abakinesis', u: 'https://abakinesis.com/articulos/x/', e: [] });
assert.deepEqual([pub.o, pub.para, pub.p, pub.u], [1, '', undefined, 'https://abakinesis.com/articulos/x/']);
for (const u of ['javascript:alert(1)', 'http://abakinesis.com/', 'https://user:pw@abakinesis.com/', 'https://localhost/', 'data:text/html,x', 'https://' + 'a'.repeat(300) + '.com', 7]) {
  assert.equal(limpiarRutina({ o: 1, u, e: [] }).u, undefined, String(u).slice(0, 40));
}
assert.equal(limpiarRutina({ o: 2, u: 'https://a.com/', para: 'Ana', e: [] }).u, undefined, 'a page only with a published routine');
// The language it was written in: only on a published routine, and only one the app speaks.
assert.equal(limpiarRutina({ o: 1, lg: 'es', e: [] }).lg, 'es');
assert.equal(limpiarRutina({ o: 1, lg: 'fr', e: [] }).lg, undefined, 'a language the app does not speak');
assert.equal(limpiarRutina({ lg: 'es', para: 'Ana', e: [] }).lg, undefined, 'a routine for one person follows the phone');
assert.equal(limpiarRutina({ o: 2, para: 'Ana', e: [] }).para, 'Ana');

// People, templates and deletions from a copy or the cloud.
const personas = limpiarPersonas([{ id: '__proto__', nombre: 'a' }, { id: 'ab12', nombre: '', creada: 'mal', dias: [{ f: 'no' }], rutinas: [{ codigo: '<x>' }, { codigo: 'd.Abc_-', e: ['puente', 'constructor'] }] }, 7]);
assert.equal(personas.length, 1);
assert.equal(personas[0].nombre, 'Sin nombre');
assert.match(personas[0].creada, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(personas[0].dias.length, 0);
assert.deepEqual(personas[0].rutinas, [{ f: personas[0].creada, codigo: 'd.Abc_-', e: ['puente'] }], 'a routine without a date takes the file\'s, so the file still opens');
// What a professional wrote is never cut: long notes stay whole.
assert.equal(limpiarPersonas([{ id: 'x1', nombre: 'Ana', notas: 'a'.repeat(8400) }])[0].notas.length, 8400);
assert.deepEqual(limpiarPlantillas([{ nombre: 'constructor' }, { nombre: 'Rodilla', orden: ['puente', 'nada'], ejercicios: { puente: { series: 99 } } }]).map((t) => [t.nombre, t.orden, t.ejercicios.puente.series]), [['Rodilla', ['puente'], 6]]);
const b = limpiarBorradas(JSON.parse('{"personas":{"__proto__":"2026-11-10T00:00:00Z","ab12":"2026-11-10T00:00:00Z","x y":"2026-11-10"},"plantillas":{"constructor":"2026-11-10T00:00:00Z","Rodilla":"no es fecha"}}'));
assert.deepEqual(Object.keys(b.personas), ['ab12']);
assert.deepEqual(Object.keys(b.plantillas), []);
assert.equal(Object.getPrototypeOf({}).polluted, undefined);
// Fields a newer version adds survive an older one reading and saving the file.
assert.deepEqual(limpiarPersonas([{ id: 'x2', nombre: 'Ana', etiquetas: ['rodilla'] }])[0].etiquetas, ['rodilla']);
assert.equal(limpiarPlantillas([{ nombre: 'R', orden: [], color: 'azul' }])[0].color, 'azul');
console.log('entrada: bien');
