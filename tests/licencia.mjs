// The paid version's licence (app/licencia.js): a key signed by Oksigenia (Ed25519) for one Google account. The
// coordinator's test key verifies; changed by one letter, or for another product, it does not; and it only counts once
// the Drive was connected with that same account.
import assert from 'node:assert/strict';

const app = process.argv[2] || new URL('../app', import.meta.url).pathname;
globalThis.window = globalThis;
const guardado = {};
globalThis.localStorage = { getItem: (k) => guardado[k] ?? null, setItem: (k, v) => (guardado[k] = v), removeItem: (k) => delete guardado[k] };
globalThis.location = { hostname: 'jepyso.oksigenia.com', pathname: '/' };
const raiz = `file://${(await import('node:path')).resolve(app)}`;
const L = await import(`${raiz}/licencia.js`);
const { esDePago } = await import(`${raiz}/personas.js`);

const buena = 'eyJwIjoiamVweXNvIiwicyI6ImNvbnN1bHRhIiwiYyI6InBydWViYS5qZXB5c29AZXhhbXBsZS5jb20iLCJmIjoiMjAyNi0xMS0xNCIsIm4iOiJwcnVlYmEtZm9ybWF0byJ9.oSjSSB2vYoLq3XDak-USpAnPmB-MBCF2vqV1s_1pErRgSVrsY__ISTszEyySTUX-QlIfmoFZEcNEC5W_YhqtAA';
const l = await L.leerLicencia(buena);
assert.deepEqual([l.valida, l.cuenta], [true, 'prueba.jepyso@example.com'], 'la clave de prueba del coordinador no verifica');
const [carga, firma] = buena.split('.');
const cambiar = (de, a) => `${Buffer.from(Buffer.from(carga, 'base64url').toString().replace(de, a)).toString('base64url')}.${firma}`;
assert.equal((await L.leerLicencia(cambiar('prueba.jepyso', 'otro'))).motivo, 'firma', 'una licencia con otra cuenta verifica');
assert.equal((await L.leerLicencia(cambiar('consulta', 'consultb'))).motivo, 'firma');
assert.equal((await L.leerLicencia('esto no es una clave')).motivo, 'formato');

assert.equal((await L.guardarLicencia(buena)).valida, true);
assert.equal(esDePago(), false, 'la licencia cuenta antes de conectar el Drive con su cuenta');
assert.equal(L.licenciaPendiente(), true);
assert.equal(await L.cuentaDelDrive('Otra.Persona@example.com'), false, 'vale con el Drive de otra cuenta');
assert.equal(esDePago(), false);
assert.equal(await L.cuentaDelDrive('Prueba.Jepyso@Example.com'), true, 'no reconoce la cuenta de la licencia');
assert.equal(esDePago(), true, 'con el Drive de su cuenta, no es la versión de pago');
await L.comprobarLicencia();
assert.equal(esDePago(), true, 'al volver a abrir la app, la licencia comprobada se pierde');
console.log('licencia: la firma de Oksigenia, ligada a la cuenta del Drive');
