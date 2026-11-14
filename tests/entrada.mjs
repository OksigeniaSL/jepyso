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
const r = limpiarRutina({ para: marca, d: 'x', x: 9, m: 99, c: '"', e: [{ i: 'puente', s: '3', r: 999, t: [marca, 40, -1], l: 'x', n: 'n'.repeat(900) }, { i: 'toString' }] });
assert.equal(r.e.length, 1);
assert.deepEqual([r.d, r.x, r.m, r.c], [45, 3, 9, 'a']);
assert.deepEqual([r.e[0].s, r.e[0].r], [3, 30]);
assert.deepEqual(r.e[0].t, [2, 30, 1]);
assert.equal(r.e[0].n.length, 500);
assert.equal(r.para, marca, 'names stay text: they are escaped where they are painted');
assert.equal(limpiarRutina({ e: 'x' }), null);

// People, templates and deletions from a copy or the cloud.
const personas = limpiarPersonas([{ id: '__proto__', nombre: 'a' }, { id: 'ab12', nombre: '', creada: 'mal', dias: [{ f: 'no' }], rutinas: [{ codigo: '<x>' }, { codigo: 'd.Abc_-', e: ['puente', 'constructor'] }] }, 7]);
assert.equal(personas.length, 1);
assert.equal(personas[0].nombre, 'Sin nombre');
assert.match(personas[0].creada, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(personas[0].dias.length, 0);
assert.deepEqual(personas[0].rutinas, [{ f: undefined, codigo: 'd.Abc_-', e: ['puente'] }]);
assert.deepEqual(limpiarPlantillas([{ nombre: 'constructor' }, { nombre: 'Rodilla', orden: ['puente', 'nada'], ejercicios: { puente: { series: 99 } } }]).map((t) => [t.nombre, t.orden, t.ejercicios.puente.series]), [['Rodilla', ['puente'], 6]]);
const b = limpiarBorradas(JSON.parse('{"personas":{"__proto__":"2026-11-10T00:00:00Z","ab12":"2026-11-10T00:00:00Z","x y":"2026-11-10"},"plantillas":{"constructor":"2026-11-10T00:00:00Z","Rodilla":"no es fecha"}}'));
assert.deepEqual(Object.keys(b.personas), ['ab12']);
assert.deepEqual(Object.keys(b.plantillas), []);
assert.equal(Object.getPrototypeOf({}).polluted, undefined);
console.log('entrada: bien');
