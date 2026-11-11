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

try {
  for (const tema of ['claro', 'oscuro']) {
    // Builder, wide. The acceptable discomfort goes down from 5 to 4 and travels inside the link.
    const ancho = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    vigilar(ancho, `armar-${tema}`);
    await ancho.goto(url(tema));
    await ancho.waitForTimeout(2500);
    await ancho.screenshot({ path: `${salida}/armar-1366-${tema}.png` });
    await ancho.click('.ejercicio[data-id="hombro"] .ejercicio-cabeza');
    await ancho.waitForTimeout(1500);
    await ancho.screenshot({ path: `${salida}/armar-1366-hombro-${tema}.png` });
    await ancho.click('[data-accion="tope"][data-delta="-1"]');
    comprobar((await ancho.textContent('.general .paso output')) === '4', `${tema}: el tope no baja a 4 en el constructor`);
    await ancho.locator('.general').scrollIntoViewIfNeeded();
    await ancho.screenshot({ path: `${salida}/armar-1366-tope-${tema}.png` });
    await ancho.click('[data-accion="crear"]');
    await ancho.waitForTimeout(800);
    await ancho.screenshot({ path: `${salida}/enlace-1366-${tema}.png` });
    const enlace = await ancho.textContent('.enlace-texto');
    const rutinaCreada = await ancho.evaluate(async (u) => {
      const { decodificar } = await import('./datos.js');
      return decodificar(u.split('#r=')[1]);
    }, enlace);
    comprobar(rutinaCreada.m === 4, `${tema}: el enlace no lleva el tope 4 (lleva ${rutinaCreada.m})`);
    comprobar(/^\d{4}-\d{2}-\d{2}$/.test(rutinaCreada.f), `${tema}: la fecha del enlace no es un día`);
    console.log(`enlace (${tema}): ${enlace.length} caracteres`);
    await ancho.close();

    if (tema === 'claro') {
      const muyAncho = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
      vigilar(muyAncho, 'armar-1800');
      await muyAncho.goto(url(tema));
      await muyAncho.waitForTimeout(2000);
      await muyAncho.screenshot({ path: `${salida}/armar-1800-claro.png` });
      await muyAncho.close();
    }

    // Builder on a phone.
    const movil = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    vigilar(movil, `movil-${tema}`);
    await movil.goto(url(tema));
    await movil.waitForTimeout(2500);
    await movil.screenshot({ path: `${salida}/armar-movil-${tema}.png` });
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
    await movil.goto(url(tema, `#r=${codigo}`));
    await movil.evaluate(() => localStorage.clear());
    await movil.reload();
    await movil.waitForTimeout(800);
    comprobar((await movil.locator('.manana').count()) === 0, `${tema}: la pregunta de la mañana sale sin sesión del día anterior`);
    await movil.screenshot({ path: `${salida}/rutina-movil-${tema}.png` });
    await movil.click('[data-r="empezar"]');
    await movil.waitForTimeout(1200);
    await movil.screenshot({ path: `${salida}/cuenta-movil-${tema}.png` });
    await movil.waitForTimeout(3900);
    await movil.screenshot({ path: `${salida}/serie-movil-${tema}.png` });
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
    const sinRed = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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
