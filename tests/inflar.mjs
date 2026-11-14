// The fallback decoder for phones without DecompressionStream (app/inflar.js) gives back exactly what zlib compressed:
// real routines and summaries, random and repetitive data, at every compression level (stored, fixed and dynamic
// blocks), and it refuses broken input instead of hanging.
import assert from 'node:assert/strict';
import { deflateRawSync, constants } from 'node:zlib';
import { randomBytes } from 'node:crypto';

const app = process.argv[2] || new URL('../app', import.meta.url).pathname;
const { inflar } = await import(`file://${(await import('node:path')).resolve(app)}/inflar.js`);

const casos = [
  Buffer.from(JSON.stringify({ v: 1, para: 'Marta', de: 'Daniel', d: 45, x: 1, m: 4, c: 'a', e: [{ i: 'puente', s: 3, r: 10, t: [2, 2, 2], n: 'Sin dolor. Si molesta, baja menos.' }] })),
  Buffer.from(JSON.stringify({ dias: Array.from({ length: 14 }, (_, k) => ({ f: `2026-11-${String(k + 1).padStart(2, '0')}`, h: '10:00', e: [{ i: 'silla', p: [10, 9], r: 10, m: k % 7 }] })) })),
  Buffer.from('ñandú, cigüeña y pingüino; '.repeat(400)),
  randomBytes(5000),
  Buffer.alloc(70000, 7),
  Buffer.alloc(0),
];
let n = 0;
for (const datos of casos) {
  for (const level of [0, 1, 6, 9]) {
    for (const strategy of [constants.Z_DEFAULT_STRATEGY, constants.Z_FIXED, constants.Z_HUFFMAN_ONLY]) {
      const comprimido = deflateRawSync(datos, { level, strategy });
      assert.deepEqual(Buffer.from(inflar(comprimido)), datos, `nivel ${level}, estrategia ${strategy}, ${datos.length} bytes`);
      n++;
    }
  }
}
assert.throws(() => inflar(deflateRawSync(casos[0]).subarray(0, 20)), 'acepta datos cortados');
assert.throws(() => inflar(Uint8Array.from([0xff, 0xff, 0xff])), 'acepta basura');
assert.throws(() => inflar(deflateRawSync(Buffer.alloc(2_000_000, 1)), 1 << 20), 'no pone tope a lo que crece');
console.log(`inflar: ${n} casos iguales que zlib`);
