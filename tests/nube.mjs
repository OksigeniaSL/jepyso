// The professional's cloud (app/nube.js) on the page, for Google Drive, Dropbox and OneDrive, against stand-ins for the
// three services: their permission windows (Dropbox's and Microsoft's coming back to conectar.html, with PKCE), their
// token addresses, their accounts and their files. No real account and nothing leaves this machine: every address of
// the services is answered here, through the browser's own content policy (a host missing from it is refused, and the
// walk fails). For each service: the first sync makes the file, a second device joins it, a licence counts only with
// its own account, and moving to another service joins everything into it without touching the old one. Besides: the
// window closed by hand, a refused permission, conectar.html opened by hand (in Spanish and English) and through the
// service worker, and the section in English with no Spanish left.
// Licences are signed with a key made for this test (licencia.js is served with its public half), as in vales.mjs.
// Usage: node nube.mjs <base url> [screenshot dir]      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';

const [base, capturas] = process.argv.slice(2);
if (!base) {
  console.error('Usage: node nube.mjs <base url> [screenshot dir]');
  process.exit(2);
}
const foto = async (pagina, nombre) => capturas && pagina.screenshot({ path: `${capturas}/${nombre}.png`, fullPage: true });

// ---------- The licence ----------
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const publica = publicKey.export({ format: 'jwk' }).x;
const firmar = (datos) => {
  const carga = Buffer.from(JSON.stringify(datos));
  return `${carga.toString('base64url')}.${sign(null, carga, privateKey).toString('base64url')}`;
};
const CUENTA = 'licencia.nube@example.com';
const OTRA = 'otra.cuenta@example.com';
const PEDIDO = 'prueba-nube';
const LICENCIA = firmar({ p: 'jepyso', s: 'consulta', c: CUENTA, f: '2026-11-16', n: PEDIDO, m: 50 });
let vigencias = 0;

// ---------- The services ----------
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, dropbox-api-arg',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, OPTIONS',
};
const json = (route, cuerpo, status = 200) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
const texto = (route, cuerpo, status = 200) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/octet-stream' }, body: cuerpo });
const s256 = (v) => createHash('sha256').update(v).digest('base64url');

// The account each service signs in with next (the window's choice), and what each one keeps: its jepyso.json.
const cuentaDe = { google: CUENTA, dropbox: CUENTA, onedrive: CUENTA };
const archivo = { google: null, dropbox: null, onedrive: null };
// Whether the OneDrive app folder exists yet (it is made the first time it is asked for).
const carpetas = { onedrive: false };
// What the permission windows were asked, and the codes they gave: code → { servicio, reto, cuenta, vuelta }.
const autorizaciones = [];
const codigos = new Map();
// Tokens: token → { servicio, cuenta }.
const tokens = new Map();
const nuevoToken = (servicio, cuenta) => {
  const tk = `${servicio}-${randomBytes(9).toString('base64url')}`;
  tokens.set(tk, { servicio, cuenta });
  return tk;
};
const delToken = (req, servicio) => {
  const tk = (req.headers().authorization || '').replace(/^Bearer /, '');
  const t = tokens.get(tk);
  return t && t.servicio === servicio ? t : null;
};
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
// What a window of a service does next: come back with a code, come back refused, or stay open (to be closed by hand).
let ventanaHace = 'codigo';
// One Google Drive for the whole walk, as each service keeps one account's files: { id, name, parents, contenido }.
const drive = new Map();
let siguiente = 1;
// Anything asked of any other address is refused and noted: nothing may reach a real service.
const origen = new URL(base).origin;
const fuera = new Set();
// OneDrive's downloads, to hand out each storage host in turn.
let descargas = 0;
const hosts = new Set();

// Dropbox's and Microsoft's window: checks what the app asks for and comes back to conectar.html.
function autorizar(servicio) {
  return (route) => {
    const u = new URL(route.request().url());
    const q = Object.fromEntries(u.searchParams);
    autorizaciones.push({ servicio, ...q });
    if (ventanaHace === 'quieta') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Entrar</title><p>Entrar</p>' });
    const vuelta = new URL(q.redirect_uri);
    if (ventanaHace === 'deniega') {
      vuelta.search = new URLSearchParams({ error: 'access_denied', error_description: 'The user denied access', state: q.state }).toString();
    } else {
      const code = randomBytes(12).toString('base64url');
      codigos.set(code, { servicio, reto: q.code_challenge, metodo: q.code_challenge_method, cuenta: cuentaDe[servicio], vuelta: q.redirect_uri, cliente: q.client_id });
      vuelta.search = new URLSearchParams({ code, state: q.state }).toString();
    }
    return route.fulfill({ status: 302, headers: { location: vuelta.href } });
  };
}

// The token address: the code once, with the verifier whose S256 is the challenge, the same client and return address.
function canjear(servicio, cliente) {
  return (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const f = Object.fromEntries(new URLSearchParams(req.postData() || ''));
    const c = codigos.get(f.code);
    codigos.delete(f.code);
    const bien = c && c.servicio === servicio && f.grant_type === 'authorization_code' && f.client_id === cliente && c.cliente === cliente
      && f.redirect_uri === c.vuelta && c.metodo === 'S256' && f.code_verifier && s256(f.code_verifier) === c.reto;
    comprobar(bien, `${servicio}: el canje del código no es el de PKCE (${JSON.stringify(f)})`);
    if (!bien) return json(route, { error: 'invalid_grant' }, 400);
    return json(route, { access_token: nuevoToken(servicio, c.cuenta), token_type: 'bearer', expires_in: 14400 });
  };
}

async function rutasDeServicios(c) {
  // First, so it has the lowest priority: whatever the routes below do not answer.
  await c.route((url) => url.origin !== origen, (route) => {
    fuera.add(new URL(route.request().url()).origin);
    return route.abort();
  });
  // Oksigenia's licence check and its answer, signed with the test key: alive.
  await c.route('**/licencia.js', async (route) => {
    const r = await route.fetch();
    const cuerpo = (await r.text()).replace(/const CLAVE_PUBLICA = '[^']+'/, `const CLAVE_PUBLICA = '${publica}'`);
    await route.fulfill({ response: r, body: cuerpo });
  });
  await c.route('**/api/licencia/estado', (route) => {
    vigencias += 1;
    return route.fulfill({ json: { estado: firmar({ p: 'jepyso', t: 'estado', n: PEDIDO, viva: true, f: new Date().toISOString().slice(0, 10) }) } });
  });

  // Google: its script grants drive.file at once with the account chosen for it; the Drive files API keeps a folder
  // and files, as tests/drive.mjs.
  await c.route('https://accounts.google.com/gsi/client', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: `window.google = { accounts: { oauth2: {
      initTokenClient: (o) => ({ requestAccessToken: () => setTimeout(() => o.callback({ access_token: ${JSON.stringify(nuevoToken('google', cuentaDe.google))},
        expires_in: 3600, scope: 'https://www.googleapis.com/auth/drive.file' })) }),
      hasGrantedAllScopes: (r, s) => (r.scope || '').split(' ').includes(s),
    } } };`,
  }));
  await c.route('https://www.googleapis.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const t = delToken(req, 'google');
    if (!t) return json(route, {}, 401);
    const u = new URL(req.url());
    const ruta = u.pathname;
    if (ruta === '/drive/v3/about') return json(route, { user: { emailAddress: t.cuenta } });
    if (req.method() === 'GET' && ruta === '/drive/v3/files') {
      const q = u.searchParams.get('q');
      const nombre = /name='([^']+)'/.exec(q)?.[1];
      const padre = /'([^']+)' in parents/.exec(q)?.[1];
      return json(route, { files: [...drive.values()].filter((f) => f.name === nombre && (!padre || f.parents.includes(padre))).map(({ id, name }) => ({ id, name })) });
    }
    if (req.method() === 'POST' && ruta === '/drive/v3/files') {
      const id = `g${siguiente++}`;
      drive.set(id, { id, ...JSON.parse(req.postData()), parents: [] });
      return json(route, { id });
    }
    const leer = /^\/drive\/v3\/files\/([^/]+)$/.exec(ruta);
    if (req.method() === 'GET' && leer) return texto(route, drive.get(leer[1]).contenido);
    const cambiar = /^\/upload\/drive\/v3\/files\/([^/]+)$/.exec(ruta);
    if (req.method() === 'PATCH' && cambiar) {
      drive.get(cambiar[1]).contenido = req.postData();
      archivo.google = req.postData();
      return json(route, { id: cambiar[1] });
    }
    if (req.method() === 'POST' && ruta === '/upload/drive/v3/files') {
      const limite = /boundary=(.+)$/.exec(req.headers()['content-type'])[1];
      const partes = req.postData().split(`--${limite}`).slice(1, 3).map((p) => p.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim());
      const id = `g${siguiente++}`;
      drive.set(id, { id, ...JSON.parse(partes[0]), contenido: partes[1] });
      archivo.google = partes[1];
      return json(route, { id });
    }
    return json(route, {}, 404);
  });

  // Dropbox.
  await c.route('https://www.dropbox.com/oauth2/authorize**', autorizar('dropbox'));
  await c.route('https://api.dropboxapi.com/oauth2/token', canjear('dropbox', 'ea6864u2uckm0dw'));
  await c.route('https://api.dropboxapi.com/2/users/get_current_account', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const t = delToken(route.request(), 'dropbox');
    return t ? json(route, { account_id: 'dbid:prueba', email: t.cuenta, email_verified: true }) : json(route, { error_summary: 'invalid_access_token/' }, 401);
  });
  await c.route('https://content.dropboxapi.com/2/files/**', (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (!delToken(req, 'dropbox')) return json(route, { error_summary: 'invalid_access_token/' }, 401);
    const arg = JSON.parse(req.headers()['dropbox-api-arg'] || '{}');
    comprobar(arg.path === '/jepyso.json', `dropbox: la ruta no es /jepyso.json (${arg.path})`);
    if (req.url().endsWith('/files/download')) {
      return archivo.dropbox === null ? json(route, { error_summary: 'path/not_found/..', error: { '.tag': 'path', path: { '.tag': 'not_found' } } }, 409) : texto(route, archivo.dropbox);
    }
    comprobar(arg.mode === 'overwrite', 'dropbox: la subida no sobrescribe');
    archivo.dropbox = req.postData();
    return json(route, { name: 'jepyso.json', path_lower: '/jepyso.json' });
  });

  // Microsoft: the window and the token at the «common» authority, Graph and the storage it hands out. A personal
  // account: no mail, its address in userPrincipalName. The file's download address is signed and has no token.
  await c.route('https://login.microsoftonline.com/common/oauth2/v2.0/authorize**', autorizar('onedrive'));
  await c.route('https://login.microsoftonline.com/common/oauth2/v2.0/token', canjear('onedrive', 'e52faaf4-fe0c-49d3-9950-d92bec40b060'));
  await c.route('https://graph.microsoft.com/**', (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const t = delToken(req, 'onedrive');
    if (!t) return json(route, { error: { code: 'InvalidAuthenticationToken' } }, 401);
    const u = new URL(req.url());
    if (u.pathname === '/v1.0/me') return json(route, { mail: null, userPrincipalName: t.cuenta });
    // The app folder itself, which the app asks for first: on a personal account a path inside it answers 400 until
    // it exists (measured with a real account, 16-11-2026), and asking for it makes it.
    if (u.pathname === '/v1.0/me/drive/special/approot' && req.method() === 'GET') {
      carpetas.onedrive = true;
      return json(route, { id: 'approot' });
    }
    if (u.pathname.startsWith('/v1.0/me/drive/special/approot:') && !carpetas.onedrive) return json(route, { error: { code: 'invalidRequest' } }, 400);
    if (u.pathname === '/v1.0/me/drive/special/approot:/jepyso.json' && req.method() === 'GET') {
      if (archivo.onedrive === null) return json(route, { error: { code: 'itemNotFound' } }, 404);
      // Personal storage on either of its hosts, in turns.
      descargas += 1;
      const enlace = descargas % 2 ? `https://public.dm.files.1drv.com/y4m${randomBytes(9).toString('base64url')}` : `https://my.microsoftpersonalcontent.com/personal/abc/_layouts/15/download.aspx?t=${descargas}`;
      return json(route, { id: 'od1', name: 'jepyso.json', file: { mimeType: 'application/json' }, '@microsoft.graph.downloadUrl': enlace });
    }
    if (u.pathname === '/v1.0/me/drive/special/approot:/jepyso.json:/content' && req.method() === 'PUT') {
      archivo.onedrive = req.postData();
      return json(route, { id: 'od1', name: 'jepyso.json' }, 201);
    }
    return json(route, { error: { code: 'itemNotFound' } }, 404);
  });
  const almacenamiento = (route) => {
    hosts.add(new URL(route.request().url()).hostname);
    comprobar(!route.request().headers().authorization, 'onedrive: la descarga lleva el token a otro sitio');
    return texto(route, archivo.onedrive);
  };
  await c.route('https://*.files.1drv.com/**', almacenamiento);
  await c.route('https://my.microsoftpersonalcontent.com/**', almacenamiento);
}

// ---------- Devices ----------
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const abiertos = [];
// Every evaluate has its end: a page starved by a busy machine could hold one forever.
function conTope(promesa, ms, que) {
  let reloj;
  const tope = new Promise((_, mal) => {
    reloj = setTimeout(() => mal(new Error(`${que}: más de ${ms / 1000} s`)), ms);
  });
  return Promise.race([promesa, tope]).finally(() => clearTimeout(reloj));
}
// Errors on the page fail, and so does any console error but the browser's note of the answers a service gives on
// purpose when there is no file yet (Dropbox's 409, Graph's 404).
const vigilar = (pagina, nombre) => {
  pagina.on('pageerror', (e) => fallos.push(`${nombre}: error en la página: ${e.message}`));
  pagina.on('console', (m) => {
    if (m.type() === 'error' && !/status of (404|409)/.test(m.text())) fallos.push(`${nombre}: consola: ${m.text()}`);
  });
};
// A device with the licence (or the paid version without one) and its own people, on Personas.
async function aparato(nombre, { personas = [], locale = 'es-ES', conLicencia = true, sw = false } = {}) {
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: sw ? 'allow' : 'block', locale });
  abiertos.push(c);
  await rutasDeServicios(c);
  // Once, on the app's own origin (not on a blank page or a service's).
  await c.addInitScript(({ licencia, lista, origen: suyo }) => {
    if (location.origin !== suyo || localStorage.getItem('__sembrado')) return;
    localStorage.setItem('__sembrado', '1');
    if (licencia) localStorage.setItem('licencia', JSON.stringify(licencia));
    localStorage.setItem('personas', JSON.stringify(lista));
  }, { licencia: conLicencia ? LICENCIA : '', lista: personas, origen });
  const p = await c.newPage();
  // The permission windows it opens, from here on.
  c.on('page', (v) => vigilar(v, `${nombre} (ventana)`));
  p.setDefaultTimeout(30000);
  p.setDefaultNavigationTimeout(60000);
  vigilar(p, nombre);
  await p.goto(`${base}/index.html${conLicencia ? '' : '?pago=1'}#personas`);
  await p.waitForSelector('.nube');
  return p;
}
const persona = (id, nombre = id) => ({ id, nombre, notas: '', creada: '2026-11-10', rutinas: [], dias: [] });
const ids = (lista) => lista.map((x) => x.id).sort().join(',');
const idsLocales = async (p) => ids(await conTope(p.evaluate(() => JSON.parse(localStorage.getItem('personas') || '[]')), 20000, 'leer las fichas'));
const idsDe = (servicio) => (archivo[servicio] === null ? '' : ids(JSON.parse(archivo[servicio]).personas));
const aviso = (p) => p.textContent('.aviso-nube');

async function elegir(p, servicio) {
  await p.click(`[data-accion="elegir-nube"][data-valor="${servicio}"]`);
  await p.waitForSelector(`[data-accion="elegir-nube"][data-valor="${servicio}"][aria-pressed="true"]`);
}
// Taps «Sincronizar con …» and waits until the button is back (done, refused or failed); gives what the section says.
async function sincronizar(p, servicio) {
  if (servicio) await elegir(p, servicio);
  await p.click('[data-accion="sincronizar-nube"]');
  await p.waitForFunction(() => {
    const b = document.querySelector('[data-accion="sincronizar-nube"]');
    return b && !b.disabled && !/…$/.test(document.querySelector('.aviso-nube')?.textContent || '');
  }, null, { timeout: 30000 });
  return aviso(p);
}

const NOMBRES = { google: 'Google Drive', dropbox: 'Dropbox', onedrive: 'OneDrive' };
try {
  // ---------- Each service: two devices, the licence's account and another ----------
  for (const servicio of ['google', 'dropbox', 'onedrive']) {
    const movil = await aparato(`${servicio} móvil`, { personas: [persona(`${servicio}-ana`, 'Ana')] });
    comprobar((await movil.locator('[data-accion="elegir-nube"]').count()) === 3, `${servicio}: no se ofrecen los tres servicios`);
    if (servicio !== 'google') {
      comprobar((await movil.getAttribute('[data-valor="google"]', 'aria-pressed')) === 'true', 'sin elegir, no es Google Drive');
      await elegir(movil, servicio);
    }
    comprobar((await movil.textContent('[data-accion="sincronizar-nube"]')).trim() === `Sincronizar con ${NOMBRES[servicio]}`, `${servicio}: el botón no dice su servicio`);
    comprobar((await movil.textContent('.nube')).includes('Para activar tu licencia'), `${servicio}: la licencia pendiente no lo dice`);
    const antesVigencias = vigencias;
    const hecho = await sincronizar(movil);
    comprobar(/^Hecho: 1 persona y 0 plantillas en tu /.test(hecho), `${servicio}: la primera vez no dice «Hecho» (${hecho})`);
    comprobar(idsDe(servicio) === `${servicio}-ana`, `${servicio}: la primera vez no crea el archivo con la ficha (${idsDe(servicio)})`);
    comprobar(JSON.parse(archivo[servicio] || '{}').app === 'jepyso', `${servicio}: el archivo no es de Jepyso`);
    comprobar(vigencias === antesVigencias + 1, `${servicio}: la sincronía no pregunta si la licencia sigue viva`);
    comprobar(await conTope(movil.evaluate(() => JSON.parse(localStorage.getItem('licencia-cuenta'))), 20000, 'licencia-cuenta') === CUENTA, `${servicio}: la licencia no queda activa con su cuenta`);
    if (servicio === 'dropbox') await foto(movil, 'nube-dropbox-hecho');

    // A second device joins what the first one left, and the first gets the second's at its next sync.
    const tableta = await aparato(`${servicio} tableta`, { personas: [persona(`${servicio}-luis`, 'Luis')] });
    if (servicio !== 'google') await elegir(tableta, servicio);
    await sincronizar(tableta);
    const juntos = [`${servicio}-ana`, `${servicio}-luis`].sort().join(',');
    comprobar((await idsLocales(tableta)) === juntos, `${servicio}: la tableta no recibe lo del móvil`);
    comprobar(idsDe(servicio) === juntos, `${servicio}: el archivo no junta los dos aparatos`);
    await sincronizar(movil);
    comprobar((await idsLocales(movil)) === juntos, `${servicio}: el móvil no recibe lo de la tableta`);
    comprobar(vigencias === antesVigencias + 3, `${servicio}: no se pregunta por la licencia en cada sincronía`);

    // Another account: refused, nothing written, the licence still waits for its own.
    cuentaDe[servicio] = OTRA;
    const ajeno = await aparato(`${servicio} otra cuenta`, { personas: [persona(`${servicio}-intruso`)] });
    if (servicio !== 'google') await elegir(ajeno, servicio);
    const guardado = archivo[servicio];
    const rechazo = await sincronizar(ajeno);
    comprobar(rechazo.includes(`Tu licencia es de ${CUENTA}`) && rechazo.includes(OTRA), `${servicio}: con otra cuenta no lo rechaza (${rechazo})`);
    comprobar(archivo[servicio] === guardado, `${servicio}: con otra cuenta se escribe en la nube`);
    const activa = await conTope(ajeno.evaluate(() => JSON.parse(localStorage.getItem('licencia-cuenta') || '""')), 20000, 'licencia-cuenta');
    comprobar(!activa, `${servicio}: con otra cuenta la licencia queda activa`);
    if (servicio === 'dropbox') {
      // Dropbox would go straight back with the same account: the next window asks to sign in again.
      await sincronizar(ajeno);
      comprobar(autorizaciones.filter((a) => a.servicio === 'dropbox').at(-1).force_reauthentication === 'true', 'dropbox: tras otra cuenta, no pide entrar de nuevo');
    }
    cuentaDe[servicio] = CUENTA;
    for (const p of [movil, tableta, ajeno]) await p.context().close();
  }

  // What each window was asked: PKCE S256, its own return address, and each service's own terms.
  const vuelta = new URL('conectar.html', `${base}/`).href;
  for (const a of autorizaciones) {
    comprobar(a.response_type === 'code' && a.code_challenge_method === 'S256' && a.code_challenge?.length === 43 && a.state?.length >= 16 && a.redirect_uri === vuelta,
      `${a.servicio}: la ventana no pide un código con PKCE y su vuelta (${JSON.stringify(a)})`);
    if (a.servicio === 'dropbox') comprobar(a.client_id === 'ea6864u2uckm0dw' && a.token_access_type === 'online', 'dropbox: no pide un token corto con su clave');
    if (a.servicio === 'onedrive') {
      comprobar(a.client_id === 'e52faaf4-fe0c-49d3-9950-d92bec40b060' && a.prompt === 'select_account', 'onedrive: no pide elegir cuenta con su cliente');
      comprobar(a.scope.split(' ').includes('Files.ReadWrite.AppFolder') && a.scope.split(' ').includes('User.Read'), `onedrive: no pide la carpeta de la app y la cuenta (${a.scope})`);
    }
  }
  comprobar(new Set(autorizaciones.map((a) => a.state)).size === autorizaciones.length, 'el state se repite entre ventanas');

  // ---------- Moving between services ----------
  // One device with its own file: Google Drive first, then Dropbox and OneDrive. Each new one gets everything this
  // device has joined with what it had; the one left behind is not touched.
  const consulta = await aparato('mudanza', { personas: [persona('mudanza-rosa', 'Rosa')] });
  await sincronizar(consulta, 'google');
  const google = archivo.google;
  comprobar(idsDe('google').includes('mudanza-rosa'), 'mudanza: Google Drive no recibe la ficha');
  await elegir(consulta, 'dropbox');
  const nota = await consulta.textContent('.cambio-nube').catch(() => '');
  comprobar(nota.includes('Dropbox') && nota.includes('Google Drive'), `mudanza: al pasar a Dropbox no dice que se junta y que Google Drive queda igual (${nota})`);
  comprobar((await aviso(consulta)).includes('sin conectar'), 'mudanza: Dropbox lleva la hora de Google Drive');
  comprobar((await consulta.textContent('.nube .plan')).includes('hasta 50 personas'), 'mudanza: otro servicio cambia el tope de la licencia');
  await foto(consulta, 'nube-cambio');
  const dropboxAntes = idsDe('dropbox');
  await sincronizar(consulta);
  const todo = [...new Set([...idsDe('google').split(','), ...dropboxAntes.split(',')])].sort().join(',');
  comprobar(idsDe('dropbox') === todo, `mudanza: Dropbox no lo junta todo (${idsDe('dropbox')} / ${todo})`);
  comprobar((await idsLocales(consulta)) === todo, 'mudanza: el aparato no recibe lo que tenía Dropbox');
  comprobar(archivo.google === google, 'mudanza: se toca Google Drive al pasar a Dropbox');
  comprobar((await consulta.locator('.cambio-nube').count()) === 0, 'mudanza: la nota sigue tras sincronizar');
  const dropbox = archivo.dropbox;
  await sincronizar(consulta, 'onedrive');
  const todoYa = [...new Set([...todo.split(','), ...idsDe('onedrive').split(',')])].filter(Boolean).sort().join(',');
  comprobar((await idsLocales(consulta)) === todoYa && idsDe('onedrive') === todoYa, 'mudanza: OneDrive no lo junta todo');
  comprobar(archivo.google === google && archivo.dropbox === dropbox, 'mudanza: se tocan las nubes de antes al pasar a OneDrive');
  // Back to Google Drive: it is remembered as synced before, and it gets what the others brought.
  await consulta.reload();
  await consulta.waitForSelector('.nube');
  comprobar((await consulta.getAttribute('[data-valor="onedrive"]', 'aria-pressed')) === 'true', 'mudanza: el servicio elegido no se recuerda');
  await sincronizar(consulta, 'google');
  comprobar(idsDe('google') === todoYa, 'mudanza: al volver a Google Drive no recibe lo de los otros');

  // ---------- The window ----------
  const ventana = await aparato('ventana', { personas: [persona('ventana-eva')] });
  await elegir(ventana, 'dropbox');
  ventanaHace = 'quieta';
  const [emergente] = await Promise.all([ventana.context().waitForEvent('page', { timeout: 30000 }), ventana.click('[data-accion="sincronizar-nube"]')]);
  await emergente.waitForURL(/dropbox\.com/, { timeout: 30000 });
  await emergente.close();
  await ventana.waitForFunction(() => !document.querySelector('[data-accion="sincronizar-nube"]').disabled, null, { timeout: 30000 });
  comprobar((await aviso(ventana)) === 'Se ha cerrado la ventana de Dropbox.', `cerrar la ventana a mano no lo dice (${await aviso(ventana)})`);
  ventanaHace = 'deniega';
  const denegada = await sincronizar(ventana, 'onedrive');
  comprobar(denegada === 'Sin tu permiso, Jepyso no puede guardar en tu OneDrive.', `sin permiso no lo dice (${denegada})`);
  ventanaHace = 'codigo';

  // conectar.html opened by hand: what it is for, and the way back; in English too.
  for (const [locale, frase] of [['es-ES', 'Ciérrala y vuelve a la app'], ['en-GB', 'Close it and go back to the app']]) {
    const c = await navegador.newContext({ serviceWorkers: 'block', locale });
    abiertos.push(c);
    const p = await c.newPage();
    p.setDefaultTimeout(30000);
    vigilar(p, `conectar ${locale}`);
    await p.goto(`${base}/conectar.html`);
    await p.waitForFunction(() => document.querySelector('.conectar-aviso')?.textContent, null, { timeout: 30000 });
    comprobar((await p.textContent('.conectar-aviso')).includes(frase), `${locale}: conectar.html a mano no dice que se vuelva a la app`);
    comprobar(await p.locator('.conectar a').isVisible(), `${locale}: conectar.html a mano no lleva a la app`);
    if (locale === 'es-ES') await foto(p, 'nube-conectar');
  }

  // With the service worker in charge, conectar.html is itself, not the app's page.
  {
    const c = await navegador.newContext({ serviceWorkers: 'allow', locale: 'es-ES' });
    abiertos.push(c);
    const p = await c.newPage();
    p.setDefaultTimeout(60000);
    await p.goto(`${base}/index.html`);
    await conTope(p.evaluate(() => navigator.serviceWorker.ready.then(() => true)), 60000, 'el trabajador');
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60000 });
    await p.goto(`${base}/conectar.html?state=nadie&code=nada`);
    await p.waitForFunction(() => document.querySelector('.conectar-aviso')?.textContent, null, { timeout: 30000 });
    comprobar((await p.locator('#app').count()) === 0, 'con el trabajador, conectar.html abre la app');
    comprobar(new URL(p.url()).search === '', 'conectar.html deja el código en la dirección');
  }

  // ---------- In English: no Spanish left ----------
  const PALABRAS = /(?<![\p{L}])(de|del|la|las|el|los|tu|tus|con|sin|en|para|que|se|y|una|nube|fichas|cuenta|sincronizar|conectar|carpeta|aparato|licencia|ventana|hecho|permiso)(?![\p{L}])/iu;
  const espanol = (s) => {
    const l = String(s || '').replace(/\S+@\S+/g, ' ').replace(/\s+/g, ' ').trim();
    return l && (/[áéíóúñ¿¡]/i.test(l) || PALABRAS.test(l)) ? l : '';
  };
  const sobras = new Set();
  const revisar = async (p, donde) => {
    const textos = await conTope(p.evaluate(() => {
      const s = document.querySelector('.nube');
      return [...s.innerText.split('\n'), ...[...s.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))];
    }), 20000, 'leer la sección');
    for (const x of textos) if (espanol(x)) sobras.add(`${donde}: ${espanol(x)}`);
  };
  const ingles = await aparato('en inglés', { personas: [persona('en-sam', 'Sam')], locale: 'en-GB' });
  comprobar((await ingles.textContent('.nube h2')).trim() === 'Your cloud', 'en inglés, la sección no se llama «Your cloud»');
  for (const s of ['google', 'dropbox', 'onedrive']) {
    await elegir(ingles, s);
    await revisar(ingles, `elegido ${s}`);
  }
  const done = await sincronizar(ingles, 'dropbox');
  comprobar(done.startsWith('Done:'), `en inglés no dice «Done» (${done})`);
  await revisar(ingles, 'hecho');
  await elegir(ingles, 'onedrive');
  comprobar((await ingles.locator('.cambio-nube').count()) === 1, 'en inglés no sale la nota del cambio');
  await revisar(ingles, 'cambio');
  await foto(ingles, 'nube-en');
  cuentaDe.onedrive = OTRA;
  await sincronizar(ingles);
  cuentaDe.onedrive = CUENTA;
  await revisar(ingles, 'otra cuenta');
  // OneDrive forgot the refused account: the next tap opens its window again, and the permission is refused there.
  ventanaHace = 'deniega';
  const sinPermiso = await sincronizar(ingles);
  ventanaHace = 'codigo';
  comprobar(sinPermiso.startsWith('Without your permission'), `en inglés, sin permiso no lo dice (${sinPermiso})`);
  await revisar(ingles, 'sin permiso');
  for (const s of sobras) fallos.push(`en inglés queda español: ${s}`);

  // The paid version without a licence (?pago=1) syncs with any account.
  const sinLicencia = await aparato('sin licencia', { personas: [persona('libre-pepe')], conLicencia: false });
  cuentaDe.onedrive = OTRA;
  const libre = await sincronizar(sinLicencia, 'onedrive');
  cuentaDe.onedrive = CUENTA;
  comprobar(libre.startsWith('Hecho:'), `sin licencia no sincroniza (${libre})`);
} finally {
  for (const c of abiertos) await c.close().catch(() => {});
  await navegador.close();
}
if (hosts.size !== 2) fallos.push(`onedrive: no se ha descargado de los dos sitios de Microsoft (${[...hosts].join(', ')})`);
if (fuera.size) fallos.push(`se pidió algo fuera de los servicios de prueba: ${[...fuera].join(', ')}`);

if (fallos.length) {
  console.error(`nube, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('nube: Google Drive, Dropbox y OneDrive se juntan entre aparatos con la cuenta de la licencia, y al cambiar de una a otra no se pierde ni se toca nada; también en inglés');
