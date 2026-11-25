// Jepyso inside a Moodle course, on the copy tools/construir-moodle.sh makes (the one the plugin ships), with the whole
// library. Its pages (player.php, builder.php) are painted here from their template, and Moodle's lib/ajax/service.php
// answered by the test. The person sees her name and what she did on another device, nothing to send by WhatsApp, and
// what she notes reaches the course by itself; without connection it waits and goes when it comes back. The teacher
// tries it without saving, and builds the routine for the activity form, which receives it. Nothing is asked outside
// the site, and nothing leads out of it.
// Usage: node moodle.mjs <base url of the copy's reproductor/> <path of player.mustache>      (CHROMIUM_BIN as in correr.sh)
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.argv[2];
const plantilla = readFileSync(process.argv[3], 'utf8');
const SITIO = 'http://moodle.localhost';
const PLUGIN = `${SITIO}/mod/oksigeniajepyso`;
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);

const escapar = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// The page as Moodle paints it: the template with its values.
const pagina = (d) => plantilla.replace(/\{\{![\s\S]*?\}\}\n?/g, '')
  .replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (m, k, dentro) => (d[k] ? dentro : ''))
  .replace(/\{\{(\w+)\}\}/g, (m, k) => escapar(d[k] ?? ''));

// A course: the player at the plugin's path, the page of each who, and the web service, with what reached it.
async function curso(contexto, { puede = true, sesiones = [], codigo = '', idioma = 'es' } = {}) {
  const llegado = [];
  const curso = { caido: false, llegado, sesskey: 'clave1', fuera: [], leidas: 0 };
  contexto.on('request', (p) => {
    if (!p.url().startsWith(SITIO) && !/^(data|blob):/.test(p.url())) curso.fuera.push(p.url());
  });
  await contexto.route(`${PLUGIN}/reproductor/**`, async (ruta) => {
    const u = new URL(ruta.request().url());
    try {
      const respuesta = await ruta.fetch({ url: `${base}${u.pathname.replace('/mod/oksigeniajepyso/reproductor', '')}${u.search}` });
      await ruta.fulfill({ response: respuesta });
    } catch {
      // The builder closes itself once the routine is back in the form, with its pictures still on the way.
    }
  });
  const datos = { lang: 'es', title: 'Rutina de fuerza', base: `${PLUGIN}/reproductor`, version: '1', userlang: idioma };
  await contexto.route(`${PLUGIN}/player.php*`, (ruta) => (curso.caido ? ruta.abort('internetdisconnected') : ruta.fulfill({
    contentType: 'text/html',
    body: pagina({ ...datos, cmid: '7', code: codigo, sesskey: curso.sesskey, service: `${SITIO}/lib/ajax/service.php`, backurl: `${PLUGIN}/view.php?id=7`, firstname: 'Ana', cansubmit: puede }),
  })));
  await contexto.route(`${PLUGIN}/builder.php*`, (ruta) => ruta.fulfill({ contentType: 'text/html', body: pagina(datos) }));
  await contexto.route(`${SITIO}/lib/ajax/service.php*`, async (ruta) => {
    if (curso.caido) return ruta.abort('internetdisconnected');
    const u = new URL(ruta.request().url());
    const [llamada] = JSON.parse(ruta.request().postData());
    if (u.searchParams.get('sesskey') !== curso.sesskey) {
      return ruta.fulfill({ contentType: 'application/json', body: JSON.stringify([{ error: true, exception: { errorcode: 'invalidsesskey' } }]) });
    }
    if (llamada.methodname === 'mod_oksigeniajepyso_get_sessions') {
      curso.leidas += 1;
      return ruta.fulfill({ contentType: 'application/json', body: JSON.stringify([{ error: false, data: { sessions: JSON.stringify(sesiones) } }]) });
    }
    llegado.push({ sesskey: u.searchParams.get('sesskey'), metodo: llamada.methodname, cmid: llamada.args.cmid, sesiones: JSON.parse(llamada.args.sessions) });
    await ruta.fulfill({ contentType: 'application/json', body: JSON.stringify([{ error: false, data: { saved: 1, done: 1, target: 6, completed: false } }]) });
  });
  await contexto.route(`${PLUGIN}/view.php*`, (ruta) => ruta.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Curso</title><p>Curso</p>' }));
  return curso;
}

try {
  const pruebas = await navegador.newPage();
  await pruebas.goto(`${base}/catalogo.json`);
  const codigo = await pruebas.evaluate(async () => (await import('/datos.js')).codificar({
    v: 1, para: '', de: 'Luis', d: 30, x: 1, m: 4, c: 'a', f: '2026-11-14', e: [{ i: 'puente', s: 2, r: 10, t: [2, 1, 2] }],
  }));
  await pruebas.close();
  const antes = { f: '2026-11-10', h: '18:00', e: [{ i: 'puente', l: null, s: 2, r: 10, p: [10, 10], m: 2 }] };

  // The person, with a session she did on another device.
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const c = await curso(contexto, { sesiones: [antes], codigo });
  const pag = await contexto.newPage();
  pag.setDefaultTimeout(30000);
  const errores = [];
  pag.on('pageerror', (e) => errores.push(e.message));
  await pag.goto(`${PLUGIN}/player.php?id=7&calidad=baja`);
  await pag.waitForSelector('.mandar-hecho');
  const saludo = await pag.textContent('.saludo h1');
  comprobar(saludo.includes('Hola, Ana'), `no saluda a quien entró en el curso (${saludo})`);
  const dias = await pag.locator('.dias-hechos li').count();
  comprobar(dias === 1 && c.leidas === 1, `no sale la sesión hecha en otro aparato (${dias} días, ${c.leidas} lecturas)`);
  comprobar(!(await pag.$('[data-r="mandar"]')), 'en el curso sigue ofreciendo mandarlo por WhatsApp o Telegram');
  comprobar(!(await pag.$('.recordatorio')), 'en el curso sigue ofreciendo el recordatorio del calendario');
  const volver = await pag.getAttribute('.mandar-hecho a.boton', 'href');
  comprobar(volver === `${PLUGIN}/view.php?id=7`, `«Volver al curso» no lleva a la actividad (${volver})`);
  await pag.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'guardado');
  comprobar(!c.llegado.length, `lo que vino del curso se vuelve a mandar (${JSON.stringify(c.llegado)})`);

  // A session noted without the app goes to the course by itself, and only that one.
  await pag.click('[data-r="sin-app"]');
  await pag.waitForSelector('dialog.hoja-corregir');
  await pag.click('dialog.hoja-corregir [data-c="m"][data-v="3"]');
  await pag.click('dialog.hoja-corregir [data-c="guardar"]');
  await pag.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'guardado' && document.querySelector('.moodle-estado').textContent.includes('Guardado en el curso'));
  const ultima = c.llegado.at(-1);
  comprobar(ultima?.metodo === 'mod_oksigeniajepyso_save_sessions' && ultima.cmid === 7 && ultima.sesskey === 'clave1', `no llama al servicio del curso como debe (${JSON.stringify(ultima)})`);
  comprobar(ultima?.sesiones.length === 1 && ultima.sesiones[0].sinApp === true && ultima.sesiones[0].e[0].m === 3,
    `no manda solo la sesión nueva (${JSON.stringify(ultima?.sesiones)})`);

  // Without connection it waits on the phone, and goes when the connection comes back.
  c.caido = true;
  const n = c.llegado.length;
  await pag.click('[data-r="corregir"]');
  await pag.waitForSelector('dialog.hoja-corregir');
  await pag.click('dialog.hoja-corregir [data-c="m"][data-v="5"]');
  await pag.click('dialog.hoja-corregir [data-c="guardar"]');
  await pag.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'pendiente');
  const pendiente = await pag.textContent('.moodle-estado');
  comprobar(pendiente.includes('en cuanto haya conexión'), `sin conexión no dice que espera (${pendiente})`);
  c.caido = false;
  await pag.evaluate(() => window.dispatchEvent(new Event('online')));
  await pag.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'guardado');
  comprobar(c.llegado.length === n + 1 && c.llegado.at(-1).sesiones.length === 1, `al volver la conexión no manda lo que esperaba (${c.llegado.length - n})`);

  // The sesskey expired while the page was open: asked again to the same page, and what was noted goes.
  c.sesskey = 'clave2';
  await pag.click('[data-r="corregir"]');
  await pag.waitForSelector('dialog.hoja-corregir');
  await pag.click('dialog.hoja-corregir [data-c="m"][data-v="1"]');
  await pag.click('dialog.hoja-corregir [data-c="guardar"]');
  await pag.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'guardado');
  comprobar(c.llegado.length === n + 2 && c.llegado.at(-1).sesskey === 'clave2', `con el sesskey caducado no lo renueva (${JSON.stringify(c.llegado.at(-1))})`);
  const enlaces = await pag.$$eval('a[href]', (l) => l.map((a) => a.href).filter((h) => !h.startsWith(location.origin)));
  comprobar(!enlaces.length, `la rutina lleva fuera del sitio: ${enlaces.join(', ')}`);
  comprobar(!c.fuera.length, `la rutina pide cosas fuera del sitio: ${c.fuera.join(', ')}`);
  comprobar(!errores.length, `errores en la página: ${errores.join(' | ')}`);
  await contexto.close();

  // Inside the Moodle app's in-app browser (its user agent says MoodleMobile): the way back is the window's ×.
  const enApp = await navegador.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 16) Chrome/148.0 Mobile MoodleMobile 5.2.1 (52100)' });
  await curso(enApp, { sesiones: [antes], codigo });
  const app = await enApp.newPage();
  app.setDefaultTimeout(30000);
  app.on('pageerror', (e) => errores.push(e.message));
  await app.goto(`${PLUGIN}/player.php?id=7&calidad=baja`);
  await app.waitForSelector('.mandar-hecho');
  comprobar(!(await app.$('.mandar-hecho a.boton')), 'dentro de la app de Moodle sigue ofreciendo «Volver al curso»');
  const cerrar = await app.textContent('.moodle-cerrar').catch(() => '');
  comprobar(cerrar.includes('cierra esta ventana'), `dentro de la app de Moodle no dice cómo volver al curso (${cerrar})`);
  await enApp.close();

  // The teacher tries it: it says so, and nothing reaches the course.
  const profe = await navegador.newContext({ viewport: { width: 1366, height: 900 } });
  const cp = await curso(profe, { puede: false, codigo });
  const vista = await profe.newPage();
  vista.setDefaultTimeout(30000);
  vista.on('pageerror', (e) => errores.push(e.message));
  await vista.goto(`${PLUGIN}/player.php?id=7&calidad=baja`);
  const aviso = await vista.textContent('.moodle-aviso').catch(() => '');
  comprobar(aviso.includes('Vista previa'), `quien no hace la tarea no ve que es una vista previa (${aviso})`);
  await vista.click('[data-r="sin-app"]');
  await vista.click('dialog.hoja-corregir [data-c="guardar"]');
  await vista.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'vista-previa');
  comprobar(!cp.llegado.length, 'la vista previa manda sesiones al curso');

  // The teacher builds the routine from the activity form: it comes back to the form.
  await vista.goto(`${PLUGIN}/view.php?id=7`);
  await vista.evaluate(() => {
    window.addEventListener('message', (ev) => { window.recibida = ev.data; });
    window.ventana = window.open('/mod/oksigeniajepyso/builder.php?course=3&calidad=baja#plantillas', 'jepyso-armar');
  });
  const armar = await vista.waitForEvent('popup');
  armar.on('pageerror', (e) => errores.push(e.message));
  await armar.waitForSelector('[data-accion="programa"]');
  comprobar(!(await armar.$('[data-pestana="#personas"]')), 'al armar para el curso sale la pestaña de Personas');
  await armar.click('[data-accion="programa"][data-id="otago-a"]');
  await armar.waitForFunction(() => document.querySelectorAll('.ejercicio[data-id]').length > 0);
  comprobar(!(await armar.$('#para')), 'al armar para el curso pide el nombre de una persona');
  // The help and the accessibility panel: nothing about plans, nothing that leads out.
  await armar.click('[data-ayuda]');
  const ayuda = await armar.innerText('dialog.hoja-ayuda');
  comprobar(ayuda.includes('¿Cómo pongo la rutina en la actividad?') && !/licencia|plan de pago|nube|gratis/i.test(ayuda), `la ayuda del constructor no es la del curso (${ayuda})`);
  await armar.click('dialog.hoja-ayuda .hoja-como-pie .boton');
  const salidas = await armar.evaluate(() => [...document.querySelectorAll('a[href]'), ...(document.querySelector('oksigenia-access-panel')?.shadowRoot?.querySelectorAll('a[href]') || [])]
    .map((a) => a.href).filter((h) => !h.startsWith(location.origin)));
  comprobar(!salidas.length, `el constructor lleva fuera del sitio: ${salidas.join(', ')}`);
  // A circuit, for the activity too.
  await armar.click('[data-accion="forma"][data-valor="circuito"]');
  const boton = await armar.textContent('[data-accion="crear"]');
  comprobar(boton.trim() === 'Usar en la actividad', `el botón no dice «Usar en la actividad» (${boton})`);
  await armar.click('[data-accion="crear"]');
  const recibida = await (await vista.waitForFunction(() => window.recibida)).jsonValue();
  comprobar(recibida?.tipo === 'jepyso-rutina' && /^[dj]\./.test(recibida.codigo || ''), `el formulario no recibe la rutina (${JSON.stringify(recibida)})`);
  const rutina = await vista.evaluate(async (cod) => {
    const d = await import('/mod/oksigeniajepyso/reproductor/datos.js');
    return d.decodificar(cod);
  }, recibida?.codigo || 'j.e30');
  comprobar(rutina.e?.length === 13 && rutina.para === '' && rutina.w === 3 && rutina.k === 3 && rutina.g === undefined, `la rutina devuelta no es la de Otago A para toda la clase (${rutina.e?.length}, «${rutina.para}», ${rutina.w})`);

  // Again, on an activity that already has a routine (here a whole link of one): the builder opens with it, not with
  // what this browser built last.
  const otra = await vista.evaluate(async (cod) => {
    const d = await import('/mod/oksigeniajepyso/reproductor/datos.js');
    const r = await d.decodificar(cod);
    return d.codificar({ ...r, e: r.e.slice(0, 2), de: 'Carmen' });
  }, recibida?.codigo || 'j.e30');
  await vista.evaluate((cod) => {
    const campo = document.createElement('textarea');
    campo.id = 'id_routine';
    campo.value = `https://example.org/app/#r=${cod}`;
    document.body.append(campo);
    window.open('/mod/oksigeniajepyso/builder.php?course=3&calidad=baja', 'jepyso-armar-2');
  }, otra);
  const armar2 = await vista.waitForEvent('popup');
  armar2.on('pageerror', (e) => errores.push(e.message));
  await armar2.waitForFunction(() => document.querySelectorAll('.ejercicio[data-id]').length > 0);
  const enElConstructor = await armar2.$$eval('.ejercicio[data-id]', (l) => l.map((e) => e.dataset.id));
  const firmada = await armar2.inputValue('#de').catch(() => '');
  comprobar(enElConstructor.length === 2 && enElConstructor.join() === rutina.e.slice(0, 2).map((e) => e.i).join() && firmada === 'Carmen',
    `el constructor no abre con la rutina que ya tiene la actividad (${enElConstructor.join()}, «${firmada}»)`);
  // Opened without the form behind: the code to copy, and nothing to send it by.
  const suelta = await profe.newPage();
  suelta.on('pageerror', (e) => errores.push(e.message));
  await suelta.goto(`${PLUGIN}/builder.php?course=3&calidad=baja`);
  await suelta.waitForFunction(() => document.querySelectorAll('.ejercicio[data-id]').length > 0);
  await suelta.click('[data-accion="crear"]');
  const hoja = await suelta.innerText('dialog.hoja-enlace');
  comprobar(hoja.includes('Copiar el código') && !/WhatsApp|Telegram/.test(hoja), `sin el formulario detrás no da el código para copiar (${hoja.slice(0, 200)})`);
  // The professional's people are not here, even by their address.
  await suelta.goto(`${PLUGIN}/builder.php?course=3&calidad=baja#personas`);
  await suelta.waitForSelector('.armar');
  comprobar(!(await suelta.$('.lista-personas')), 'por su dirección salen las personas del profesional');

  // The language of the user in Moodle, over the phone's.
  for (const [idioma, lang, telefono] of [['en_us', 'en', 'es-ES'], ['es_mx', 'es', 'en-GB']]) {
    const otro = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: telefono });
    await curso(otro, { codigo, idioma });
    const enIdioma = await otro.newPage();
    enIdioma.on('pageerror', (e) => errores.push(e.message));
    await enIdioma.goto(`${PLUGIN}/player.php?id=7&calidad=baja`);
    await enIdioma.waitForSelector('.mandar-hecho');
    const puesto = await enIdioma.getAttribute('html', 'lang');
    comprobar(puesto === lang, `con ${idioma} en Moodle, un teléfono en ${telefono} abre en ${puesto}`);
    await otro.close();
  }
  comprobar(!cp.fuera.length, `el constructor pide cosas fuera del sitio: ${cp.fuera.join(', ')}`);
  comprobar(!errores.length, `errores: ${errores.join(' | ')}`);
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`moodle, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('moodle: en el curso, cada sesión va sola al curso (y espera sin conexión), el profesor la prueba sin guardar y arma la rutina para el formulario, partiendo de la que ya tiene');
