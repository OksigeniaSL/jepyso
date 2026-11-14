// The free files, five per Google account (app/vales.js), against a stand-in for Google's sign-in and for Oksigenia's
// server, which signs the tickets with a key made for this test (licencia.js is served with its public half). Files
// from before open after signing in; one with no room stays locked; a ticket keeps its file open with no sign-in after
// a reload; a deleted file gives its place back, at once or with the next sign-in; and the paid version needs none.
// Usage: node vales.mjs <base url> [screenshot dir]      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';
import { generateKeyPairSync, sign } from 'node:crypto';

const [base, capturas] = process.argv.slice(2);
const foto = async (pagina, nombre) => capturas && pagina.screenshot({ path: `${capturas}/${nombre}.png`, fullPage: true });
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const publica = publicKey.export({ format: 'jwk' }).x;
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const firmar = (datos) => {
  const carga = Buffer.from(JSON.stringify(datos));
  return `${carga.toString('base64url')}.${sign(null, carga, privateKey).toString('base64url')}`;
};
const CORREO = 'consulta.prueba@example.com';
const token = `${b64({ alg: 'RS256' })}.${b64({ email: CORREO, exp: Math.floor(Date.now() / 1000) + 3600 })}.firma`;

// Oksigenia's server: per account, the ids that hold a place. Four already taken on another device.
const servidor = new Map([[CORREO, new Set(['otro01', 'otro02', 'otro03', 'otro04'])]]);
const llamadas = [];
async function api(route) {
  const req = route.request();
  const baja = req.url().endsWith('/baja');
  const { token: t, ficha } = JSON.parse(req.postData() || '{}');
  llamadas.push(`${baja ? 'baja' : 'alta'} ${ficha}`);
  let correo = '';
  try {
    correo = JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()).email;
  } catch {
    return route.fulfill({ status: 401, json: { error: { code: 'token' } } });
  }
  const suyas = servidor.get(correo) || new Set();
  servidor.set(correo, suyas);
  if (baja) {
    suyas.delete(ficha);
    return route.fulfill({ json: { quedan: 5 - suyas.size } });
  }
  if (!suyas.has(ficha) && suyas.size >= 5) return route.fulfill({ status: 403, json: { error: { code: 'limit' }, usadas: suyas.size } });
  suyas.add(ficha);
  return route.fulfill({ json: { vale: firmar({ p: 'jepyso', t: 'ficha', f: ficha }), quedan: 5 - suyas.size } });
}

// Google's script: its button signs in with the token above; One Tap only counts the times it was asked.
const gis = `window.google = { accounts: { oauth2: {}, id: {
  initialize(c) { window.__gis = c; },
  renderButton(el) { const b = document.createElement('button'); b.type = 'button'; b.className = 'gsi-prueba'; b.textContent = 'Acceder con Google';
    b.onclick = () => window.__gis.callback({ credential: ${JSON.stringify(token)} }); el.append(b); },
  prompt() { window.__onetap = (window.__onetap || 0) + 1; },
} } };`;

const persona = (id, nombre) => ({ id, nombre, notas: '', creada: '2026-11-01', rutinas: [], dias: [] });

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
try {
  // No service worker: every file goes through the routes, licencia.js with the test key.
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await contexto.route('**/licencia.js', async (route) => {
    const r = await route.fetch();
    const texto = (await r.text()).replace(/const CLAVE_PUBLICA = '[^']+'/, `const CLAVE_PUBLICA = '${publica}'`);
    await route.fulfill({ response: r, body: texto });
  });
  await contexto.route('https://accounts.google.com/gsi/client', (route) => route.fulfill({ contentType: 'text/javascript', body: gis }));
  await contexto.route('**/api/fichas', api);
  await contexto.route('**/api/fichas/baja', api);
  const pagina = await contexto.newPage();
  pagina.setDefaultTimeout(20000);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(`${base}/index.html?vales=1`);
  await pagina.evaluate((lista) => localStorage.setItem('personas', JSON.stringify(lista)), [persona('viejo1', 'Marta'), persona('viejo2', 'Pedro')]);
  await pagina.goto(`${base}/index.html#personas`);
  const cerradas = () => pagina.$$eval('.lista-personas .persona-fila.cerrada .nombre', (l) => l.map((x) => x.textContent.trim()));

  // Files from before: locked, with Google's button and One Tap asked once.
  await pagina.waitForSelector('.gsi-prueba');
  comprobar((await cerradas()).length === 2, 'las fichas de antes, sin vale, no salen cerradas');
  comprobar(await pagina.$('.cuenta-fichas.pide'), 'la cuenta de Google no se marca mientras hay fichas cerradas');
  comprobar((await pagina.evaluate(() => window.__onetap)) === 1, 'One Tap no se pregunta una vez');
  await foto(pagina, 'vales-cerradas-movil');
  await pagina.goto(`${base}/index.html#persona=viejo1`);
  await pagina.waitForSelector('.ficha-cerrada .gsi-prueba');
  comprobar(!(await pagina.$('.ficha-cabeza')), 'una ficha sin vale enseña lo que tiene');

  // Signing in: Marta takes the account's fifth place; Pedro has no room.
  await pagina.goto(`${base}/index.html#personas`);
  await pagina.click('.gsi-prueba');
  await pagina.waitForSelector('.cuenta-dentro');
  comprobar((await cerradas()).join() === 'Pedro', `tras entrar, las cerradas no son solo Pedro (${await cerradas()})`);
  await foto(pagina, 'vales-dentro-movil');
  comprobar((await pagina.textContent('.lista-personas')).includes('ya tiene 5 fichas'), 'Pedro no dice que la cuenta está llena');
  comprobar((await pagina.textContent('.cuenta-dentro')).includes(CORREO) && (await pagina.textContent('.cuenta-dentro')).includes('no le quedan'),
    'no dice con qué cuenta se ha entrado ni que no quedan fichas');
  const guardadas = await pagina.evaluate(() => JSON.parse(localStorage.getItem('personas')));
  comprobar(guardadas.find((p) => p.id === 'viejo1')?.vale && !guardadas.find((p) => p.id === 'viejo2')?.vale, 'el vale no se guarda en su ficha');
  await pagina.goto(`${base}/index.html#persona=viejo2`);
  await pagina.waitForSelector('[data-accion="borrar-cerrada"]');
  await foto(pagina, 'vales-sin-plaza-movil');
  comprobar((await pagina.textContent('.ficha-cerrada')).includes('no cabe'), 'la ficha sin plaza no lo dice');

  // After a reload, with no sign-in: Marta opens with her ticket.
  await pagina.goto(`${base}/index.html#persona=viejo1`);
  await pagina.reload();
  await pagina.waitForSelector('.ficha-cabeza');
  comprobar(!(await pagina.$('.ficha-cerrada')), 'tras recargar, la ficha con vale no se abre');

  // Marta deleted with no sign-in: her place waits to be given back, and goes with the next one, when Pedro takes it.
  await pagina.click('[data-accion="borrar-persona"]');
  await pagina.click('[data-accion="borrar-persona"]');
  await pagina.waitForSelector('.lista-personas');
  comprobar(JSON.stringify(await pagina.evaluate(() => JSON.parse(localStorage.getItem('vales-bajas')))) === '["viejo1"]', 'la plaza de una ficha borrada sin entrar no queda pendiente');
  comprobar(servidor.get(CORREO).has('viejo1'), 'la plaza se suelta sin cuenta');
  await pagina.click('.gsi-prueba');
  await pagina.waitForSelector('.cuenta-dentro');
  comprobar(!servidor.get(CORREO).has('viejo1'), 'al entrar no se suelta la plaza pendiente');
  comprobar(servidor.get(CORREO).has('viejo2') && (await cerradas()).length === 0, 'Pedro no ocupa la plaza que dejó Marta');
  comprobar(JSON.stringify(await pagina.evaluate(() => JSON.parse(localStorage.getItem('vales-bajas')))) === '[]', 'la baja hecha sigue pendiente');

  // Deleting an open file with the sign-in at hand gives its place back at once.
  await pagina.goto(`${base}/index.html#persona=viejo2`);
  await pagina.click('[data-accion="borrar-persona"]');
  await pagina.click('[data-accion="borrar-persona"]');
  await pagina.waitForFunction(() => location.hash === '#personas');
  await pagina.waitForTimeout(300);
  comprobar(!servidor.get(CORREO).has('viejo2'), 'una ficha borrada con la cuenta a mano no suelta su plaza');
  // The count on screen follows at once, without leaving Personas (Enrique, 14-11: it kept saying 4 until he left).
  await pagina.waitForFunction(() => document.querySelector('.cuenta-dentro')?.textContent.includes('queda 1 ficha'), null, { timeout: 5000 })
    .catch(() => comprobar(false, `tras borrar, la cuenta no se repinta (${''})`));

  // The paid version: no tickets, no account section.
  await pagina.evaluate((lista) => localStorage.setItem('personas', JSON.stringify(lista)), [persona('nuevo1', 'Rosa')]);
  await pagina.goto(`${base}/index.html?pago=1#personas`);
  await pagina.waitForSelector('.lista-personas .persona-fila');
  comprobar(!(await pagina.$('.cuenta-fichas')) && (await cerradas()).length === 0, 'la versión de pago pide vales');
  await pagina.goto(`${base}/index.html?pago=0&vales=0#personas`);
  await pagina.waitForSelector('.lista-personas .persona-fila');
  comprobar(!(await pagina.$('.cuenta-fichas')) && (await cerradas()).length === 0, 'en el portátil, sin ?vales=1, las fichas se cierran');
  comprobar(!errores.length, `errores en la página: ${errores.join(' | ')}`);
  await contexto.close();
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`vales, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}\n  llamadas: ${llamadas.join(', ')}`);
  process.exit(1);
}
console.log('vales: cinco fichas por cuenta de Google, abiertas con su vale y con la plaza devuelta al borrar');
