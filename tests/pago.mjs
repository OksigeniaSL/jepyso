// Without a licence, the paid version can only be switched on on this laptop, for the tests: not at the app's public
// address, nor in the showcase copy, nor on the device bench, which is public too (Enrique, 14-11).
import assert from 'node:assert/strict';

const app = process.argv[2] || new URL('../app', import.meta.url).pathname;
globalThis.window = globalThis;
const guardado = { version: JSON.stringify('pago') };
globalThis.localStorage = { getItem: (k) => guardado[k] ?? null, setItem: (k, v) => (guardado[k] = v), removeItem: (k) => delete guardado[k] };
const { esDePago, limite } = await import(`file://${(await import('node:path')).resolve(app)}/personas.js`);
const en = (hostname, pathname) => (globalThis.location = { hostname, pathname });

en('jepyso.oksigenia.com', '/');
assert.equal(esDePago(), false, 'la dirección pública acepta la versión de pago sin licencia');
assert.equal(limite(), 5);
en('oksigenia.com', '/demo/jepyso/app/index.html');
assert.equal(esDePago(), false, 'la copia del escaparate acepta la versión de pago sin licencia');
en('aravo.oksigenia.com', '/eq/b/ejercicios/index.html');
assert.equal(esDePago(), false, 'el banco, que también es público, acepta la versión de pago sin licencia');
en('127.0.0.1', '/index.html');
assert.equal(esDePago(), true, 'en el portátil no se puede probar la versión de pago');
console.log('pago: sin licencia, solo se enciende en el portátil');
