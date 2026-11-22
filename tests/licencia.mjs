// The paid version's licence (app/licencia.js): a key signed by Oksigenia (Ed25519) for one Google account.
// Oksigenia's test key verifies; changed by one letter, or for another product, it does not; and it only counts once
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
assert.deepEqual([l.valida, l.cuenta], [true, 'prueba.jepyso@example.com'], 'la clave de prueba de Oksigenia no verifica');
// Without «m», the highest plan (Centro, 300), as the licences given before there were plans.
assert.equal(l.tope, 300, `una licencia sin tope no es del plan más alto (${l.tope})`);
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
const { limite } = await import(`${raiz}/personas.js`);
assert.equal(limite(), 300, `con su licencia caben ${limite()} fichas, no las 300 del plan Centro`);
// A licence of the Profesional plan: 50 people with a file; changing its top breaks the signature.
const plan50 = 'eyJwIjoiamVweXNvIiwicyI6ImNvbnN1bHRhIiwiYyI6InBydWViYS5qZXB5c29AZXhhbXBsZS5jb20iLCJmIjoiMjAyNi0xMS0xNSIsIm4iOiJwcnVlYmEtcGxhbiIsIm0iOjUwfQ.PhdPmE7hHGeHEnnz0hXRAu4wWXYWKMUJg4-Pst0NN70cW41E-8nhPS-6s07PMnWHxAT7Fe2EHwNqrxDCmvZ-AQ';
assert.equal((await L.leerLicencia(plan50)).tope, 50, 'la licencia del plan Profesional no dice 50');
const [carga50, firma50] = plan50.split('.');
const mas = `${Buffer.from(Buffer.from(carga50, 'base64url').toString().replace('"m":50', '"m":500')).toString('base64url')}.${firma50}`;
assert.equal((await L.leerLicencia(mas)).motivo, 'firma', 'cambiar el tope de una licencia no rompe su firma');
assert.equal((await L.guardarLicencia(plan50)).valida, true);
assert.equal(await L.cuentaDelDrive('prueba.jepyso@example.com'), true);
assert.equal(limite(), 50, `con la licencia del plan Profesional caben ${limite()} fichas, no 50`);
assert.equal(L.nombrePlan(L.topeLicencia()), 'Profesional');
await L.comprobarLicencia();
assert.equal(esDePago(), true, 'al volver a abrir la app, la licencia comprobada se pierde');

// Whether the licence is still alive (comprobarVigencia, asked on every sync with the Drive). Without an answer, or
// with one that does not check, nothing changes.
const respuestas = [];
globalThis.fetch = async (url, op) => {
  respuestas.push([url, JSON.parse(op.body).n]);
  const r = respuestas.siguiente;
  if (r instanceof Error) throw r;
  return { ok: true, json: async () => r };
};
respuestas.siguiente = new Error('sin red');
assert.equal(await L.comprobarVigencia(), true, 'sin red, la licencia deja de valer');
assert.deepEqual(respuestas.at(-1), ['/api/licencia/estado', 'prueba-plan'], 'no pregunta por su pedido');
const inventado = Buffer.from(JSON.stringify({ p: 'jepyso', t: 'estado', n: 'prueba-plan', viva: false, f: '2026-11-16' })).toString('base64url');
respuestas.siguiente = { viva: false, estado: `${inventado}.${firma50}` };
assert.equal(await L.comprobarVigencia(), true, 'una respuesta sin la firma de Oksigenia anula la licencia');
assert.equal(esDePago(), true);
// Signed by Oksigenia for the test order, dated 16-11-2026: the clock is put on that day, so they never get old.
const ANULADA = 'eyJwIjoiamVweXNvIiwidCI6ImVzdGFkbyIsIm4iOiJwcnVlYmEtcGxhbiIsInZpdmEiOmZhbHNlLCJmIjoiMjAyNi0xMS0xNiJ9.XYWf_qelXBVBVb0ewC-JegmVUVdHJdL52zl8bdbIPx3J6fdOWgkrmhdwOqrpqrTNJqOqKXtbMB-Rzn_uufQHDA';
const VIVA = 'eyJwIjoiamVweXNvIiwidCI6ImVzdGFkbyIsIm4iOiJwcnVlYmEtcGxhbiIsInZpdmEiOnRydWUsImYiOiIyMDI2LTExLTE2In0.WIiOMTRZj7zg8PpSqwsddWlG0tFX5khYpmQToqZ-J8tFRdBmfqG4M-VhLMiaEgvFxN8YXtUshRt3HpkLh6zvAg';
{
  const ahora = Date.now;
  Date.now = () => Date.parse('2026-11-16T10:00:00Z');
  respuestas.siguiente = { viva: false, estado: ANULADA };
  assert.equal(await L.comprobarVigencia(), false, 'una licencia anulada sigue viva');
  assert.equal(L.licenciaAnulada(), true);
  assert.equal(esDePago(), false, 'una licencia anulada sigue siendo de pago');
  assert.equal(limite(), 5, `con la licencia anulada caben ${limite()} fichas nuevas`);
  await L.comprobarLicencia();
  assert.equal(L.licenciaAnulada(), true, 'al volver a abrir la app, la anulación se olvida');
  respuestas.siguiente = { viva: true, estado: VIVA };
  assert.equal(await L.comprobarVigencia(), true);
  assert.equal(esDePago(), true, 'una licencia que vuelve a estar viva no cuenta');
  // An answer more than a week old is not believed.
  Date.now = () => Date.parse('2026-12-01T10:00:00Z');
  respuestas.siguiente = { viva: false, estado: ANULADA };
  assert.equal(await L.comprobarVigencia(), true, 'una respuesta vieja anula la licencia');
  Date.now = ahora;
}
console.log('licencia: la firma de Oksigenia, ligada a la cuenta del Drive; anulada, sus fichas se leen y no crece');
