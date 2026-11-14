// Joining two devices through the cloud (app/sincronia.js): everything adds up, nothing deleted comes back, the later
// change of a file wins, sessions are not counted twice and templates go by name.
// Usage: node sincronia.mjs <app folder>
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const app = process.argv[2];
const { fusionar, empaquetar, esDatos } = await import(pathToFileURL(join(app, 'sincronia.js')).href);

const dia = (f, h, m) => ({ f, h, e: [{ i: 'puente', l: null, s: [10], m }] });
const persona = (id, extra = {}) => ({ id, nombre: id, notas: '', creada: '2026-11-01', rutinas: [], dias: [], ...extra });

// Two devices, each with something the other lacks.
const movil = {
  personas: [
    persona('ana', { notas: 'Rodilla', cambiada: '2026-11-10T10:00:00Z', rutinas: [{ f: '2026-11-02', codigo: 'A', e: ['puente'] }], dias: [dia('2026-11-03', '09:00', 2)] }),
    persona('luis'),
  ],
  plantillas: [{ nombre: 'Rodilla', cambiada: '2026-11-05T00:00:00Z', orden: ['puente'] }],
  borradas: { personas: {}, plantillas: {} },
};
const tableta = {
  personas: [
    persona('ana', { notas: 'Rodilla derecha', m: 3, cambiada: '2026-11-12T10:00:00Z', rutinas: [{ f: '2026-11-02', codigo: 'A', e: ['puente'] }, { f: '2026-11-09', codigo: 'B', e: ['silla'] }], dias: [dia('2026-11-03', '09:00', 2), dia('2026-11-10', '18:00', 4)] }),
    persona('marta'),
  ],
  plantillas: [{ nombre: 'Rodilla', cambiada: '2026-11-11T00:00:00Z', orden: ['puente', 'silla'] }, { nombre: 'Hombro', cambiada: '2026-11-06T00:00:00Z', orden: ['hombro'] }],
  borradas: { personas: { luis: '2026-11-11T00:00:00Z' }, plantillas: {} },
};

const r = fusionar(movil, tableta);
assert.deepEqual(r.personas.map((p) => p.id).sort(), ['ana', 'marta'], 'una ficha borrada en otro aparato vuelve');
const ana = r.personas.find((p) => p.id === 'ana');
assert.equal(ana.notas, 'Rodilla derecha', 'no gana la nota cambiada más tarde');
assert.equal(ana.m, 3, 'no gana la molestia aceptable cambiada más tarde');
assert.deepEqual(ana.rutinas.map((x) => x.codigo).sort(), ['A', 'B'], 'las rutinas no se suman');
assert.equal(ana.dias.length, 2, 'una sesión que está en los dos aparatos se cuenta dos veces');
assert.deepEqual(r.plantillas.map((t) => t.nombre), ['Rodilla', 'Hombro'], 'las plantillas no van por nombre y de la más nueva');
assert.deepEqual(r.plantillas[0].orden, ['puente', 'silla'], 'no gana la plantilla guardada más tarde');

// The same join, the other way round, gives the same people and templates.
const al = fusionar(tableta, movil);
assert.deepEqual(al.personas.map((p) => p.id).sort(), ['ana', 'marta']);
assert.equal(al.personas.find((p) => p.id === 'ana').notas, 'Rodilla derecha');

// A template deleted on one device stays deleted; saved again later under the same name, it comes back.
const borrada = fusionar({ plantillas: [{ nombre: 'Hombro', cambiada: '2026-11-06T00:00:00Z' }] }, { plantillas: [], borradas: { plantillas: { Hombro: '2026-11-07T00:00:00Z' } } });
assert.equal(borrada.plantillas.length, 0, 'una plantilla borrada vuelve');
const otraVez = fusionar({ plantillas: [{ nombre: 'Hombro', cambiada: '2026-11-08T00:00:00Z' }] }, { plantillas: [], borradas: { plantillas: { Hombro: '2026-11-07T00:00:00Z' } } });
assert.equal(otraVez.plantillas.length, 1, 'una plantilla guardada después de borrarla no vuelve');

// The inputs are not touched, and what travels is recognised.
assert.equal(movil.personas[0].notas, 'Rodilla', 'juntar cambia los datos de entrada');
const paquete = empaquetar(r);
assert.ok(esDatos(paquete) && paquete.borradas.personas.luis, 'el paquete no se reconoce o pierde lo borrado');
assert.ok(!esDatos({ app: 'jepyso', tipo: 'personas', personas: [] }), 'una copia de personas pasa por datos de la nube');

// A file deleted on one device stays deleted for the others, but one made again later with the same id stays.
{
  const borradas = { personas: { rosa: '2026-11-10T10:00:00.000Z' }, plantillas: {} };
  const vieja = fusionar({ personas: [persona('rosa')], borradas }, { personas: [] });
  assert.equal(vieja.personas.length, 0, 'una ficha borrada vuelve desde otro aparato');
  const rehecha = fusionar({ personas: [persona('rosa', { cambiada: '2026-11-12T09:00:00.000Z' })], borradas }, { personas: [] });
  assert.equal(rehecha.personas.length, 1, 'una ficha hecha otra vez después de borrarla desaparece al sincronizar');
  const raro = fusionar({ personas: [persona('__proto__'), { id: 7 }], plantillas: [{ nombre: 'constructor' }] }, JSON.parse('{"personas":[],"borradas":{"plantillas":{"__proto__":"2026-11-10T00:00:00Z"}}}'));
  assert.equal(raro.personas.length + raro.plantillas.length, 0, 'claves de objeto pasan como fichas o plantillas');
  assert.equal({}.polluted, undefined);
}

console.log('sincronía: dos aparatos se juntan sin perder ni resucitar nada');
