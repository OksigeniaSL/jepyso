// End-to-end walk through Jepyso: the builder, the link sheet, the person's routine (a short test routine), the
// rating screen, the finish screen, the morning-after question and the summary the professional receives. Runs in
// light and dark, wide and on a phone, saves screenshots and fails on a broken check or a console error.
// Usage: node recorrido.mjs <base url> <screenshot dir>   (CHROMIUM_BIN may point at a Chromium binary)
import { chromium } from 'playwright-core';

const [base, salida] = process.argv.slice(2);
if (!base || !salida) {
  console.error('Usage: node recorrido.mjs <base url> <screenshot dir>');
  process.exit(2);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const errores = [];
const avisos = [];
const fallos = [];
const comprobar = (condicion, que) => {
  if (!condicion) fallos.push(que);
};
const vigilar = (page, nombre) => {
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(`${nombre}: ${m.text()}`);
    if (m.type() === 'warning') avisos.push(`${nombre}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errores.push(`${nombre} pageerror: ${e.message}`));
};
const url = (tema, fragmento = '') => `${base}/index.html?tema=${tema}${fragmento}`;
// The figure renders on the CPU (SwiftShader). On a machine busy with other work a screenshot or a reload can take
// far longer than Playwright's 30 s default, so every step gets more room; a real hang still fails.
const abrir = async (opciones) => {
  const page = await browser.newPage(opciones);
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);
  return page;
};

try {
  for (const tema of ['claro', 'oscuro']) {
    // Builder, wide: an empty routine, the library with its filters, the order, a template and the acceptable
    // discomfort lowered from 5 to 4, which travels inside the link.
    const ancho = await abrir({ viewport: { width: 1366, height: 768 } });
    vigilar(ancho, `armar-${tema}`);
    await ancho.goto(url(tema));
    await ancho.waitForTimeout(2500);
    comprobar((await ancho.locator('.rutina-armada .ejercicio').count()) === 0, `${tema}: la rutina nueva no empieza vacía`);
    await ancho.screenshot({ path: `${salida}/armar-1366-vacia-${tema}.png` });
    // Every row carries the still of its exercise, of the body chosen for the routine.
    const posterCargado = () => ancho.locator('.biblio-fila .biblio-poster img').first().evaluate((i) => i.decode().then(() => i.naturalWidth > 0, () => false));
    await ancho.locator('.biblio-fila .biblio-poster').first().scrollIntoViewIfNeeded();
    comprobar(await posterCargado(), `${tema}: la primera fila no trae el póster de su ejercicio`);
    await ancho.click('[data-accion="cuerpo"][data-valor="b"]');
    const srcB = await ancho.locator('.biblio-fila .biblio-poster img').first().getAttribute('src');
    comprobar(srcB.startsWith('modelos/b/posters/') && (await posterCargado()), `${tema}: con la Figura 2, la fila no cambia de póster (${srcB})`);
    await ancho.click('[data-accion="cuerpo"][data-valor="a"]');
    for (const id of ['puente', 'silla', 'hombro']) await ancho.click(`.biblio-fila[data-id="${id}"] [data-accion="anadir"]`);
    await ancho.waitForTimeout(1200);
    const orden = () => ancho.$$eval('.rutina-armada .ejercicio', (t) => t.map((x) => x.dataset.id).join(','));
    comprobar((await orden()) === 'puente,silla,hombro', `${tema}: los añadidos no salen en su orden (${await orden()})`);
    comprobar((await ancho.locator('.biblio-dentro').count()) === 3, `${tema}: la biblioteca no marca lo que ya está en la rutina`);
    await ancho.click('.ejercicio[data-id="hombro"] [data-accion="subir"]');
    comprobar((await orden()) === 'puente,hombro,silla', `${tema}: subir no cambia el orden (${await orden()})`);
    await ancho.screenshot({ path: `${salida}/armar-1366-hombro-${tema}.png` });
    // Only the card being looked at is open; the others fold to their dose.
    const abiertas = () => ancho.locator('.ejercicio-ajustes:visible').count();
    comprobar((await abiertas()) === 1, `${tema}: hay ${await abiertas()} tarjetas abiertas a la vez`);
    await ancho.click('.ejercicio[data-id="silla"] .ejercicio-cabeza');
    comprobar((await ancho.locator('.ejercicio[data-id="silla"] .ejercicio-ajustes:visible').count()) === 1, `${tema}: la tarjeta tocada no se abre`);
    comprobar((await abiertas()) === 1, `${tema}: al abrir una tarjeta no se pliega la otra`);
    comprobar((await ancho.textContent('.ejercicio[data-id="hombro"] .dosis')).includes('3 × 12'), `${tema}: la tarjeta plegada no dice sus series y repeticiones`);
    await ancho.click('.ejercicio[data-id="silla"] .detalle summary');
    comprobar((await ancho.textContent('.ejercicio[data-id="silla"] .detalle')).includes('Fuente:'), `${tema}: la tarjeta no trae la explicación con su fuente`);
    await ancho.locator('.ejercicio[data-id="silla"] .detalle').scrollIntoViewIfNeeded();
    await ancho.screenshot({ path: `${salida}/armar-1366-explicacion-${tema}.png` });

    // Filters: area, muscle and words; each one narrows the library to what the catalogue says.
    // A long list goes under its starting positions, so the rows are compared as a set, not in catalogue order.
    const filas = () => ancho.$$eval('.biblio-fila', (t) => t.map((x) => x.dataset.id).sort().join(','));
    const esperado = (filtro) => ancho.evaluate(async (f) => (await import('./datos.js')).buscarEjercicios(f).sort().join(','), filtro);
    const total = await ancho.locator('.biblio-fila').count();
    await ancho.click('[data-accion="zona"][data-valor="hombro"]');
    const hombro = await filas();
    comprobar(hombro === (await esperado({ zona: 'hombro' })) && hombro.includes('hombro') && hombro.split(',').length < total, `${tema}: el filtro de hombro da ${hombro}`);
    comprobar((await ancho.locator('.mapa-halo.encendido').count()) === 2, `${tema}: el mapa no enciende los dos hombros`);
    await ancho.screenshot({ path: `${salida}/armar-1366-mapa-${tema}.png` });
    await ancho.click('[data-accion="zona"][data-valor=""]');
    await ancho.selectOption('[data-accion="musculo"]', 'cuadriceps');
    const cuadriceps = await filas();
    comprobar(cuadriceps === (await esperado({ musculo: 'cuadriceps' })) && cuadriceps.includes('silla') && !cuadriceps.includes('hombro'), `${tema}: el filtro de cuádriceps da ${cuadriceps}`);
    await ancho.selectOption('[data-accion="musculo"]', '');
    // A muscle touched on the map filters like the list, lights, and lets go when touched again.
    await ancho.click('.mapa-musculo[data-valor="cuadriceps"]');
    const delMapa = await filas();
    comprobar(delMapa === cuadriceps, `${tema}: el cuádriceps del mapa da ${delMapa} y la lista de músculos ${cuadriceps}`);
    comprobar((await ancho.inputValue('[data-accion="musculo"]')) === 'cuadriceps', `${tema}: la lista de músculos no sigue al mapa`);
    comprobar((await ancho.locator('.mapa-musculo.encendido').count()) >= 1, `${tema}: el músculo elegido no se enciende`);
    await ancho.click('.mapa-musculo[data-valor="cuadriceps"]');
    comprobar((await filas()).split(',').length === total, `${tema}: tocar otra vez el músculo no lo suelta`);
    await ancho.fill('[data-accion="buscar"]', 'gluteo');
    comprobar((await filas()) === 'puente', `${tema}: buscar «gluteo» da ${await filas()}`);
    await ancho.fill('[data-accion="buscar"]', 'sit to stand');
    comprobar((await filas()) === 'silla', `${tema}: buscar por otro nombre («sit to stand») da ${await filas()}`);
    await ancho.fill('[data-accion="buscar"]', 'nada parecido');
    comprobar((await ancho.locator('.biblio-vacia').count()) === 1, `${tema}: una búsqueda sin resultados no lo dice`);
    await ancho.fill('[data-accion="buscar"]', '');

    await ancho.click('[data-accion="tope"][data-delta="-1"]');
    comprobar((await ancho.textContent('.general .paso output')) === '4', `${tema}: el tope no baja a 4 en el constructor`);
    await ancho.locator('.general').scrollIntoViewIfNeeded();
    await ancho.screenshot({ path: `${salida}/armar-1366-tope-${tema}.png` });

    // Template: saved, the routine changes, the template brings it back; deleting asks first.
    await ancho.click('[data-accion="nueva-plantilla"]');
    await ancho.fill('[data-accion="nombre-plantilla"]', 'Rodilla y hombro, primera semana');
    await ancho.press('[data-accion="nombre-plantilla"]', 'Enter');
    comprobar((await ancho.locator('.plantilla').count()) === 1, `${tema}: la plantilla no se guarda`);
    await ancho.click('.ejercicio[data-id="silla"] [data-accion="quitar"]');
    await ancho.click('[data-accion="tope"][data-delta="1"]');
    comprobar((await orden()) === 'puente,hombro', `${tema}: quitar no saca el ejercicio (${await orden()})`);
    await ancho.locator('.plantillas').scrollIntoViewIfNeeded();
    await ancho.screenshot({ path: `${salida}/armar-1366-plantilla-${tema}.png` });
    await ancho.click('[data-accion="usar-plantilla"]');
    await ancho.waitForTimeout(800);
    comprobar((await orden()) === 'puente,hombro,silla', `${tema}: la plantilla no trae su rutina (${await orden()})`);
    comprobar((await ancho.textContent('.general .paso output')) === '4', `${tema}: la plantilla no trae su tope`);
    await ancho.click('[data-accion="borrar-plantilla"]');
    comprobar((await ancho.locator('.plantilla').count()) === 1, `${tema}: la plantilla se borra sin preguntar`);
    await ancho.click('[data-accion="borrar-plantilla"]');
    comprobar((await ancho.locator('.plantilla').count()) === 0, `${tema}: la plantilla no se borra al confirmar`);

    await ancho.click('[data-accion="crear"]');
    await ancho.waitForTimeout(800);
    await ancho.screenshot({ path: `${salida}/enlace-1366-${tema}.png` });
    const enlace = await ancho.textContent('.enlace-texto');
    const rutinaCreada = await ancho.evaluate(async (u) => {
      const { decodificar } = await import('./datos.js');
      return decodificar(u.split('#r=')[1]);
    }, enlace);
    comprobar(rutinaCreada.m === 4, `${tema}: el enlace no lleva el tope 4 (lleva ${rutinaCreada.m})`);
    comprobar(rutinaCreada.e.map((e) => e.i).join(',') === 'puente,hombro,silla', `${tema}: el enlace no lleva el orden elegido`);
    comprobar(/^\d{4}-\d{2}-\d{2}$/.test(rutinaCreada.f), `${tema}: la fecha del enlace no es un día`);
    console.log(`enlace (${tema}): ${enlace.length} caracteres`);
    await ancho.close();

    if (tema === 'claro') {
      const muyAncho = await abrir({ viewport: { width: 1800, height: 1000 } });
      vigilar(muyAncho, 'armar-1800');
      await muyAncho.goto(url(tema));
      for (const id of ['puente', 'hombro']) await muyAncho.click(`.biblio-fila[data-id="${id}"] [data-accion="anadir"]`);
      await muyAncho.waitForTimeout(2000);
      await muyAncho.screenshot({ path: `${salida}/armar-1800-claro.png` });
      await muyAncho.close();
    }

    // Builder on a phone: the preview goes inside the row looked at, then inside the card once added.
    const movil = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    vigilar(movil, `movil-${tema}`);
    await movil.goto(url(tema));
    await movil.waitForTimeout(1500);
    await movil.screenshot({ path: `${salida}/armar-movil-${tema}.png` });
    await movil.click('.biblio-fila[data-id="silla"] .biblio-ver');
    await movil.waitForTimeout(1800);
    comprobar((await movil.locator('.biblio-fila.activo[data-id="silla"] .mini-figura canvas').count()) === 1, `${tema}: en el móvil, la fila mirada no enseña la figura`);
    await movil.locator('.biblio-fila[data-id="silla"]').scrollIntoViewIfNeeded();
    await movil.screenshot({ path: `${salida}/armar-movil-ver-${tema}.png` });
    await movil.click('.biblio-fila[data-id="puente"] [data-accion="anadir"]');
    await movil.waitForTimeout(1800);
    comprobar((await movil.locator('.ejercicio[data-id="puente"] .mini-figura canvas').count()) === 1, `${tema}: en el móvil, la tarjeta añadida no enseña la figura`);
    await movil.screenshot({ path: `${salida}/armar-movil-entera-${tema}.png`, fullPage: true });

    // A short routine so the walk takes seconds: two sets of two reps, then the shoulder on both sides. Tope 4.
    const codigo = await movil.evaluate(async () => {
      const { codificar } = await import('./datos.js');
      return codificar({
        v: 1, para: 'Marta', de: 'Daniel', d: 5, x: 2, m: 4, f: '2026-11-10',
        e: [
          { i: 'puente', s: 2, r: 2, t: [1, 1, 1], n: 'Sin dolor. Si molesta, sube menos.' },
          { i: 'hombro', s: 1, r: 2, t: [1, 0, 1], l: 'ambos' },
        ],
      });
    });
    // In the routine of the person, each exercise with its still, of their figure and their side: the left one in mirror.
    const izquierda = await movil.evaluate(async () => (await import('./datos.js')).codificar({
      v: 1, c: 'b', d: 5, x: 1, m: 5, f: '2026-11-10', e: [{ i: 'hombro', s: 1, r: 2, t: [1, 0, 1], l: 'izq' }],
    }));
    await movil.goto(url(tema, `#r=${izquierda}`));
    await movil.waitForSelector('.tarjeta-poster img');
    const espejo = movil.locator('.tarjeta-poster img').first();
    comprobar((await espejo.getAttribute('src')) === 'modelos/b/posters/hombro.webp', `${tema}: la rutina no trae el póster de su figura`);
    comprobar((await espejo.getAttribute('class')) === 'espejo', `${tema}: el lado izquierdo no sale en espejo`);
    await movil.goto(url(tema, `#r=${codigo}`));
    await movil.evaluate(() => localStorage.clear());
    await movil.reload();
    await movil.waitForTimeout(800);
    comprobar((await movil.locator('.manana').count()) === 0, `${tema}: la pregunta de la mañana sale sin sesión del día anterior`);
    const posters = movil.locator('.tarjeta-poster img');
    comprobar((await posters.count()) === 2 && (await posters.first().evaluate((i) => i.decode().then(() => i.naturalWidth > 0, () => false))),
      `${tema}: las tarjetas de la rutina no traen su póster`);
    comprobar((await movil.locator('.tarjeta-poster img.espejo').count()) === 0, `${tema}: un ejercicio de los dos lados sale en espejo`);
    await movil.screenshot({ path: `${salida}/rutina-movil-${tema}.png` });
    await movil.click('[data-r="empezar"]');
    await movil.waitForTimeout(1200);
    await movil.screenshot({ path: `${salida}/cuenta-movil-${tema}.png` });
    await movil.waitForTimeout(3900);
    await movil.screenshot({ path: `${salida}/serie-movil-${tema}.png` });
    await movil.click('[data-r="como"]');
    comprobar((await movil.locator('.hoja .explicacion .partida').count()) === 1, `${tema}: «Cómo se hace» no trae la posición de partida`);
    await movil.screenshot({ path: `${salida}/como-movil-${tema}.png` });
    await movil.click('.hoja .boton');
    await movil.waitForSelector('.anillo', { timeout: 20000 });
    await movil.screenshot({ path: `${salida}/descanso-movil-${tema}.png` });
    await movil.click('[data-r="ya"]');
    await movil.waitForSelector('[data-r="continuar"]', { timeout: 20000 });
    await movil.click('[data-r="molestia"][data-v="3"]');
    comprobar((await movil.textContent('.aviso-molestia')) === '', `${tema}: aviso con una molestia de 3 y tope 4`);
    await movil.screenshot({ path: `${salida}/valorar-movil-${tema}.png` });
    await movil.click('[data-r="continuar"]');
    // Shoulder: right side, then the left after a rest, then rating above the level.
    await movil.waitForSelector('.anillo', { timeout: 30000 });
    await movil.screenshot({ path: `${salida}/cambio-lado-movil-${tema}.png` });
    await movil.click('[data-r="ya"]');
    await movil.waitForTimeout(1500);
    await movil.screenshot({ path: `${salida}/serie-izquierda-movil-${tema}.png` });
    await movil.waitForSelector('[data-r="continuar"]', { timeout: 30000 });
    await movil.click('[data-r="molestia"][data-v="6"]');
    comprobar((await movil.textContent('.aviso-molestia')).includes('Es más de 4'), `${tema}: sin aviso con una molestia de 6 y tope 4`);
    await movil.screenshot({ path: `${salida}/valorar-alta-movil-${tema}.png` });
    await movil.click('[data-r="continuar"]');
    await movil.waitForTimeout(500);
    comprobar((await movil.locator('.dia.marcado').count()) === 1, `${tema}: el día con molestia 6 no sale marcado al terminar`);
    await movil.screenshot({ path: `${salida}/final-movil-${tema}.png` });

    // Next day at ten in the morning: the session moves to yesterday and the routine asks about getting up.
    await movil.clock.setFixedTime(new Date(Date.now() + 86400e3).setHours(10, 0, 0, 0));
    await movil.evaluate(async () => {
      const { diaAnterior } = await import('./datos.js');
      const clave = Object.keys(localStorage).find((k) => k.startsWith('hist:'));
      const hist = JSON.parse(localStorage.getItem(clave));
      hist.at(-1).f = diaAnterior();
      localStorage.setItem(clave, JSON.stringify(hist));
    });
    await movil.reload();
    await movil.waitForTimeout(800);
    comprobar((await movil.locator('.manana').count()) === 1, `${tema}: no sale la pregunta de la mañana`);
    await movil.screenshot({ path: `${salida}/manana-movil-${tema}.png` });
    await movil.click('[data-r="manana"][data-v="5"]');
    const apuntado = await movil.textContent('.manana');
    comprobar(apuntado.includes('Apuntado: 5 de 10') && apuntado.includes('Es más de 4'), `${tema}: la respuesta de la mañana no se apunta bien («${apuntado.trim()}»)`);
    await movil.screenshot({ path: `${salida}/manana-apuntado-movil-${tema}.png` });
    await movil.reload();
    await movil.waitForTimeout(500);
    comprobar((await movil.locator('.manana').count()) === 0, `${tema}: la pregunta de la mañana se repite tras contestarla`);

    // The summary link the person sends back, read by the professional.
    const resumen = await movil.evaluate(async () => {
      const { codificar } = await import('./datos.js');
      const clave = Object.keys(localStorage).find((k) => k.startsWith('hist:'));
      const dias = JSON.parse(localStorage.getItem(clave));
      return codificar({ v: 1, para: 'Marta', de: 'Daniel', m: 4, dias });
    });
    await movil.goto(url(tema, `#s=${resumen}`));
    await movil.waitForTimeout(600);
    const cabecera = await movil.textContent('.saludo');
    comprobar(/La molestia pasó de 4 el \S+ \d+\./.test(cabecera), `${tema}: el resumen no nombra el día que pasó de 4`);
    comprobar((await movil.locator('.dia.marcado').count()) === 1, `${tema}: el resumen no marca el día`);
    comprobar((await movil.locator('.manana-linea').count()) === 1, `${tema}: el resumen no trae la mañana siguiente`);
    await movil.screenshot({ path: `${salida}/resumen-movil-${tema}.png` });

    // A routine link from before the level existed (no m) still opens, with 5.
    const antiguo = await movil.evaluate(async () => {
      const { codificar } = await import('./datos.js');
      return codificar({ v: 1, para: 'Marta', de: 'Daniel', dias: [{ f: '2026-11-09', h: '10:00', e: [{ i: 'puente', l: 'der', s: 1, r: 10, p: [10], m: 5 }] }] });
    });
    await movil.goto(url(tema, `#s=${antiguo}`));
    await movil.waitForTimeout(400);
    comprobar((await movil.textContent('.saludo')).includes('no pasó de 5'), `${tema}: un resumen sin tope no usa 5`);
    await movil.close();

    // Without a connection: a new phone opens the routine once, then does it with no signal at all.
    const sinRed = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    vigilar(sinRed, `sin-conexion-${tema}`);
    await sinRed.goto(url(tema, `#r=${codigo}`));
    try {
      await sinRed.waitForFunction(() => document.querySelector('.sin-conexion')?.textContent.length > 0, null, { timeout: 60000 });
    } catch {
      comprobar(false, `${tema}: la rutina no dice que queda guardada para hacerla sin conexión`);
    }
    await sinRed.screenshot({ path: `${salida}/guardada-movil-${tema}.png`, fullPage: true });
    await sinRed.context().setOffline(true);
    await sinRed.reload();
    await sinRed.waitForSelector('[data-r="empezar"]', { timeout: 10000 });
    comprobar(await sinRed.locator('.tarjeta-poster img').first().evaluate((i) => i.decode().then(() => i.naturalWidth > 0, () => false)),
      `${tema}: sin conexión, la tarjeta no trae su póster`);
    await sinRed.click('[data-r="empezar"]');
    try {
      await sinRed.waitForSelector('.j-fase', { timeout: 15000 });
      await sinRed.waitForTimeout(1200);
      comprobar((await sinRed.locator('.escena canvas').count()) === 1, `${tema}: sin conexión, la figura no sale`);
    } catch {
      comprobar(false, `${tema}: sin conexión, la serie no empieza`);
    }
    await sinRed.screenshot({ path: `${salida}/sin-conexion-serie-movil-${tema}.png` });
    await sinRed.context().setOffline(false);
    await sinRed.close();
  }
} finally {
  await browser.close();
}

if (avisos.length) console.log(`avisos de consola (no cuentan como fallo):\n  ${[...new Set(avisos)].join('\n  ')}`);
if (errores.length) fallos.push(...errores.map((e) => `consola: ${e}`));
if (fallos.length) {
  console.error(`FALLOS (${fallos.length}):\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('todo bien: sin fallos ni errores en consola');
