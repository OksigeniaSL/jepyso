// Jepyso inside a Moodle course (app/moodle.js), against a course played here: the plugin's sesion.php and Moodle's
// lib/ajax/service.php answered by the test, the app served at the plugin's path. The person sees her name and what she
// did on another device, nothing to send by WhatsApp, and what she notes reaches the course by itself; without
// connection it waits and goes when it comes back. The teacher tries it without saving, and builds the routine for
// the activity form, which receives it.
// Usage: node moodle.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const SITIO = 'http://moodle.localhost';
const PLUGIN = `${SITIO}/mod/oksigeniajepyso`;
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);

// A course: the app at the plugin's path, the person's config and the web service, with what reached it.
async function curso(contexto, { puede = true, sesiones = [] } = {}) {
  const llegado = [];
  const curso = { caido: false, llegado };
  await contexto.route(`${PLUGIN}/reproductor/**`, async (ruta) => {
    const u = new URL(ruta.request().url());
    try {
      const respuesta = await ruta.fetch({ url: `${base}${u.pathname.replace('/mod/oksigeniajepyso/reproductor', '')}${u.search}` });
      await ruta.fulfill({ response: respuesta });
    } catch {
      // The builder closes itself once the routine is back in the form, with its pictures still on the way.
    }
  });
  await contexto.route(`${PLUGIN}/sesion.php*`, (ruta) => ruta.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      sesskey: 'clave1', servicio: `${SITIO}/lib/ajax/service.php`, volver: `${PLUGIN}/view.php?id=7`, curso: 'EF',
      actividad: 'Rutina de fuerza', nombre: 'Ana', puede, sesiones, disponibles: ['puente'],
    }),
  }));
  await contexto.route(`${SITIO}/lib/ajax/service.php*`, async (ruta) => {
    if (curso.caido) return ruta.abort('internetdisconnected');
    const u = new URL(ruta.request().url());
    const [llamada] = JSON.parse(ruta.request().postData());
    llegado.push({ sesskey: u.searchParams.get('sesskey'), metodo: llamada.methodname, cmid: llamada.args.cmid, sesiones: JSON.parse(llamada.args.sessions) });
    await ruta.fulfill({ contentType: 'application/json', body: JSON.stringify([{ error: false, data: { saved: 1, done: 1, target: 6, completed: false } }]) });
  });
  await contexto.route(`${PLUGIN}/view.php*`, (ruta) => ruta.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Curso</title><p>Curso</p>' }));
  return curso;
}

try {
  const pruebas = await navegador.newPage();
  await pruebas.goto(`${base}/index.html?calidad=baja`);
  const codigo = await pruebas.evaluate(async () => (await import('./datos.js')).codificar({
    v: 1, para: '', de: 'Luis', d: 30, x: 1, m: 4, c: 'a', f: '2026-11-14', e: [{ i: 'puente', s: 2, r: 10, t: [2, 1, 2] }],
  }));
  await pruebas.close();
  const antes = { f: '2026-11-10', h: '18:00', e: [{ i: 'puente', l: null, s: 2, r: 10, p: [10, 10], m: 2 }] };

  // The person, with a session she did on another device.
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const c = await curso(contexto, { sesiones: [antes] });
  const pagina = await contexto.newPage();
  pagina.setDefaultTimeout(30000);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(`${PLUGIN}/reproductor/index.html?cm=7&calidad=baja#r=${codigo}`);
  await pagina.waitForSelector('.mandar-hecho');
  const saludo = await pagina.textContent('.saludo h1');
  comprobar(saludo.includes('Hola, Ana'), `no saluda a quien entró en el curso (${saludo})`);
  const dias = await pagina.locator('.dias-hechos li').count();
  comprobar(dias === 1, `no sale la sesión hecha en otro aparato (${dias} días)`);
  comprobar(!(await pagina.$('[data-r="mandar"]')), 'en el curso sigue ofreciendo mandarlo por WhatsApp o Telegram');
  comprobar(!(await pagina.$('.recordatorio')), 'en el curso sigue ofreciendo el recordatorio del calendario');
  const volver = await pagina.getAttribute('.mandar-hecho a.boton', 'href');
  comprobar(volver === `${PLUGIN}/view.php?id=7`, `«Volver al curso» no lleva a la actividad (${volver})`);
  await pagina.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'guardado');
  comprobar(!c.llegado.length, `lo que vino del curso se vuelve a mandar (${JSON.stringify(c.llegado)})`);

  // A session noted without the app goes to the course by itself, and only that one.
  await pagina.click('[data-r="sin-app"]');
  await pagina.waitForSelector('dialog.hoja-corregir');
  await pagina.click('dialog.hoja-corregir [data-c="m"][data-v="3"]');
  await pagina.click('dialog.hoja-corregir [data-c="guardar"]');
  await pagina.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'guardado' && document.querySelector('.moodle-estado').textContent.includes('Guardado en el curso'));
  const ultima = c.llegado.at(-1);
  comprobar(ultima?.metodo === 'mod_oksigeniajepyso_save_sessions' && ultima.cmid === 7 && ultima.sesskey === 'clave1', `no llama al servicio del curso como debe (${JSON.stringify(ultima)})`);
  comprobar(ultima?.sesiones.length === 1 && ultima.sesiones[0].sinApp === true && ultima.sesiones[0].e[0].m === 3,
    `no manda solo la sesión nueva (${JSON.stringify(ultima?.sesiones)})`);

  // Without connection it waits on the phone, and goes when the connection comes back.
  c.caido = true;
  const n = c.llegado.length;
  await pagina.click('[data-r="corregir"]');
  await pagina.waitForSelector('dialog.hoja-corregir');
  await pagina.click('dialog.hoja-corregir [data-c="m"][data-v="5"]');
  await pagina.click('dialog.hoja-corregir [data-c="guardar"]');
  await pagina.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'pendiente');
  const pendiente = await pagina.textContent('.moodle-estado');
  comprobar(pendiente.includes('en cuanto haya conexión'), `sin conexión no dice que espera (${pendiente})`);
  c.caido = false;
  await pagina.evaluate(() => window.dispatchEvent(new Event('online')));
  await pagina.waitForFunction(() => document.querySelector('.moodle-estado')?.dataset.estado === 'guardado');
  comprobar(c.llegado.length === n + 1 && c.llegado.at(-1).sesiones.length === 1, `al volver la conexión no manda lo que esperaba (${c.llegado.length - n})`);
  comprobar(!errores.length, `errores en la página: ${errores.join(' | ')}`);
  await contexto.close();

  // Inside the Moodle app's in-app browser (its user agent says MoodleMobile): the way back is the window's ×.
  const enApp = await navegador.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 16) Chrome/148.0 Mobile MoodleMobile 5.2.1 (52100)' });
  await curso(enApp, { sesiones: [antes] });
  const app = await enApp.newPage();
  app.setDefaultTimeout(30000);
  app.on('pageerror', (e) => errores.push(e.message));
  await app.goto(`${PLUGIN}/reproductor/index.html?cm=7&calidad=baja#r=${codigo}`);
  await app.waitForSelector('.mandar-hecho');
  comprobar(!(await app.$('.mandar-hecho a.boton')), 'dentro de la app de Moodle sigue ofreciendo «Volver al curso»');
  const cerrar = await app.textContent('.moodle-cerrar').catch(() => '');
  comprobar(cerrar.includes('cierra esta ventana'), `dentro de la app de Moodle no dice cómo volver al curso (${cerrar})`);
  await enApp.close();

  // The teacher tries it: it says so, and nothing reaches the course.
  const profe = await navegador.newContext({ viewport: { width: 1366, height: 900 } });
  const cp = await curso(profe, { puede: false });
  const vista = await profe.newPage();
  vista.setDefaultTimeout(30000);
  vista.on('pageerror', (e) => errores.push(e.message));
  await vista.goto(`${PLUGIN}/reproductor/index.html?cm=7&calidad=baja#r=${codigo}`);
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
    window.ventana = window.open('/mod/oksigeniajepyso/reproductor/index.html?armar=1&calidad=baja#plantillas', 'jepyso-armar');
  });
  const armar = await vista.waitForEvent('popup');
  armar.on('pageerror', (e) => errores.push(e.message));
  await armar.waitForSelector('[data-accion="programa"]');
  comprobar(!(await armar.$('[data-pestana="#personas"]')), 'al armar para el curso sale la pestaña de Personas');
  await armar.click('[data-accion="programa"][data-id="otago-a"]');
  await armar.waitForFunction(() => document.querySelectorAll('.ejercicio[data-id]').length > 0);
  comprobar(!(await armar.$('#para')), 'al armar para el curso pide el nombre de una persona');
  const boton = await armar.textContent('[data-accion="crear"]');
  comprobar(boton.trim() === 'Usar en la actividad', `el botón no dice «Usar en la actividad» (${boton})`);
  await armar.click('[data-accion="crear"]');
  const recibida = await (await vista.waitForFunction(() => window.recibida)).jsonValue();
  comprobar(recibida?.tipo === 'jepyso-rutina' && /^[dj]\./.test(recibida.codigo || ''), `el formulario no recibe la rutina (${JSON.stringify(recibida)})`);
  const rutina = await vista.evaluate(async (cod) => {
    const d = await import('/mod/oksigeniajepyso/reproductor/datos.js');
    return d.decodificar(cod);
  }, recibida?.codigo || 'j.e30');
  comprobar(rutina.e?.length === 13 && rutina.para === '' && rutina.w === 3, `la rutina devuelta no es la de Otago A para toda la clase (${rutina.e?.length}, «${rutina.para}», ${rutina.w})`);

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
    window.open('/mod/oksigeniajepyso/reproductor/index.html?armar=1&calidad=baja', 'jepyso-armar-2');
  }, otra);
  const armar2 = await vista.waitForEvent('popup');
  armar2.on('pageerror', (e) => errores.push(e.message));
  await armar2.waitForFunction(() => document.querySelectorAll('.ejercicio[data-id]').length > 0);
  const enElConstructor = await armar2.$$eval('.ejercicio[data-id]', (l) => l.map((e) => e.dataset.id));
  const firmada = await armar2.inputValue('#de').catch(() => '');
  comprobar(enElConstructor.length === 2 && enElConstructor.join() === rutina.e.slice(0, 2).map((e) => e.i).join() && firmada === 'Carmen',
    `el constructor no abre con la rutina que ya tiene la actividad (${enElConstructor.join()}, «${firmada}»)`);
  comprobar(!errores.length, `errores: ${errores.join(' | ')}`);
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`moodle, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('moodle: en el curso, cada sesión va sola al curso (y espera sin conexión), el profesor la prueba sin guardar y arma la rutina para el formulario, partiendo de la que ya tiene');
