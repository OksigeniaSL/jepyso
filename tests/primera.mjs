// The professional's first use, in light and dark, wide and on a phone: the builder opens with the way in three steps,
// in sight on arrival, and a routine to try, which opens as the person will see it; the preview waits with the figure
// standing and its own words until an exercise is looked at, and goes back to them when the routine is emptied; the
// name field says whose name it is; each figure shows its body. After the first link, «Así funciona» goes.
// Usage: node primera.mjs <base url> <screenshot dir>   (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const [base, salida] = process.argv.slice(2);
if (!base || !salida) {
  console.error('Usage: node primera.mjs <base url> <screenshot dir>');
  process.exit(2);
}
const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const fallos = [];
const errores = [];
const comprobar = (c, que) => c || fallos.push(que);
const abrir = async (contexto, nombre) => {
  const p = await contexto.newPage();
  p.setDefaultTimeout(120000);
  p.on('pageerror', (e) => errores.push(`${nombre}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errores.push(`${nombre}: ${m.text()}`));
  return p;
};
const deLado = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const vistaVacia = (p) => p.waitForFunction(() => {
  const v = document.querySelector('.vista');
  return !!v && v.classList.contains('vacia') && !v.querySelector('.vista-pie h3, svg.recorrido')
    && v.querySelector('canvas')?.getAttribute('aria-label') === 'La figura, de pie, a la espera de un ejercicio'
    && v.querySelector('.vista-pie').textContent.includes('Cuando elijas un ejercicio');
}, null, { timeout: 30000 }).then(() => true, () => false);
const alLlegar = (p) => p.evaluate(() => { const r = document.querySelector('.primer-uso .camino')?.getBoundingClientRect(); return !!r && r.bottom <= innerHeight - 90; });

try {
  for (const tema of ['claro', 'oscuro']) {
    const ancho = await navegador.newContext({ viewport: { width: 1366, height: 768 } });
    const p = await abrir(ancho, `primera-1366-${tema}`);
    await p.goto(`${base}/index.html?tema=${tema}&calidad=baja`);
    await p.waitForSelector('.primer-uso');
    comprobar(await alLlegar(p), `${tema}: en ancho, el camino no se ve al llegar`);
    comprobar((await p.locator('.camino li').count()) === 3, `${tema}: el camino no tiene sus tres pasos`);
    const [arriba1, arriba3] = await p.evaluate(() => [...document.querySelectorAll('.camino li')].map((li) => Math.round(li.getBoundingClientRect().top)).filter((_, i) => i !== 1));
    comprobar(arriba1 === arriba3, `${tema}: en ancho, los tres pasos no van en una línea`);
    comprobar((await p.textContent('label[for="para"]')) === 'Nombre de la persona', `${tema}: el nombre no dice de quién es`);
    comprobar(await vistaVacia(p), `${tema}: con la rutina vacía, «Así lo verá» no espera con su texto`);
    const figuras = await p.$$eval('.segmentos.figuras img', (is) => Promise.all(is.map((i) => i.decode().then(() => i.naturalWidth > 0, () => false))));
    comprobar(figuras.length === 2 && figuras.every(Boolean), `${tema}: «Figura» no enseña los dos cuerpos`);
    await p.waitForSelector('.probar-ejemplo[href*="#r="]', { timeout: 10000 }).catch(() => fallos.push(`${tema}: «Probar con una rutina de ejemplo» no tiene su enlace`));
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${salida}/primera-1366-${tema}.png` });

    // The routine to try opens apart, as the person will see it.
    const [persona] = await Promise.all([ancho.waitForEvent('page'), p.click('.probar-ejemplo')]);
    persona.on('pageerror', (e) => errores.push(`ejemplo-${tema}: ${e.message}`));
    await persona.waitForSelector('.intro-lista, .ejercicios-intro, h1', { timeout: 60000 });
    await persona.waitForTimeout(1500);
    const texto = await persona.textContent('body');
    for (const n of ['Levantarse de la silla', 'Puente de glúteo', 'Rotación externa con banda', 'rutina de ejemplo']) comprobar(texto.includes(n), `${tema}: la rutina de ejemplo no trae «${n}»`);
    await persona.setViewportSize({ width: 390, height: 844 });
    await persona.waitForTimeout(600);
    await persona.screenshot({ path: `${salida}/ejemplo-persona-390-${tema}.png` });
    await persona.close();

    // An exercise looked at in the library: the preview moves; the routine emptied: it waits again.
    await p.click('.biblio-fila[data-id="talon"] .biblio-ver');
    await p.waitForSelector('.vista:not(.vacia) .vista-figura canvas');
    comprobar((await p.textContent('.vista-pie h3')) === 'Deslizamiento de talón', `${tema}: al mirar una fila, «Así lo verá» no la enseña`);
    await p.click('.biblio-fila[data-id="silla"] [data-accion="anadir"]');
    await p.waitForSelector('.rutina-armada .ejercicio');
    await p.click('.ejercicio[data-id="silla"] [data-accion="quitar"]');
    await p.waitForTimeout(400);
    comprobar(await vistaVacia(p), `${tema}: con la rutina vaciada otra vez, «Así lo verá» sigue con un ejercicio`);
    comprobar(!(await p.locator('.biblio-fila.activo').count()), `${tema}: con la rutina vaciada, una fila de la biblioteca sigue marcada`);
    // With the second figure, the routine to try comes in it.
    await p.click('[data-accion="cuerpo"][data-valor="b"]');
    await p.waitForFunction(() => document.querySelector('.probar-ejemplo')?.href.includes('#r='));
    comprobar(await vistaVacia(p), `${tema}: con la Figura 2, «Así lo verá» no espera con ella`);
    await p.locator('.general').scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${salida}/figura2-1366-${tema}.png` });
    const conB = await p.evaluate(async () => {
      const { decodificar } = await import('./datos.js');
      return (await decodificar(document.querySelector('.probar-ejemplo').href.split('#r=')[1])).c;
    });
    comprobar(conB === 'b', `${tema}: con la Figura 2, la rutina de ejemplo no la trae`);
    await p.click('[data-accion="cuerpo"][data-valor="a"]');

    // After the first link, an empty routine says only that.
    await p.click('.biblio-fila[data-id="silla"] [data-accion="anadir"]');
    await p.click('[data-accion="crear"]');
    await p.waitForSelector('dialog.hoja-enlace[open]');
    await p.click('dialog.hoja-enlace [data-h="cerrar"]');
    await p.waitForTimeout(400);
    await p.click('[data-accion="vaciar"]');
    await p.waitForTimeout(400);
    comprobar((await p.locator('.rutina-vacia').count()) === 1 && !(await p.locator('.primer-uso').count()), `${tema}: tras el primer enlace, sigue «Así funciona»`);
    await p.reload();
    await p.waitForSelector('.rutina-vacia');
    comprobar(!(await p.locator('.primer-uso').count()), `${tema}: tras el primer enlace, «Así funciona» vuelve al recargar`);
    await ancho.close();

    // On a phone: the steps one under the other, nothing sideways.
    const movil = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const m = await abrir(movil, `primera-390-${tema}`);
    await m.goto(`${base}/index.html?tema=${tema}&calidad=baja`);
    await m.waitForSelector('.primer-uso');
    comprobar(await alLlegar(m), `${tema}: en el móvil, el camino no se ve al llegar`);
    const tops = await m.evaluate(() => [...document.querySelectorAll('.camino li')].map((li) => li.getBoundingClientRect().top));
    comprobar(tops[0] < tops[1] && tops[1] < tops[2], `${tema}: en el móvil, los pasos no van uno debajo de otro`);
    comprobar((await deLado(m)) <= 1, `${tema}: en el móvil, la página se sale de lado`);
    await m.waitForTimeout(500);
    await m.screenshot({ path: `${salida}/primera-390-${tema}.png` });
    await m.locator('#para').scrollIntoViewIfNeeded();
    await m.evaluate(() => window.scrollBy(0, 160));
    await m.waitForTimeout(300);
    await m.screenshot({ path: `${salida}/para-390-${tema}.png` });
    await m.locator('.general').scrollIntoViewIfNeeded();
    await m.waitForTimeout(300);
    await m.screenshot({ path: `${salida}/figuras-390-${tema}.png` });
    await movil.close();
  }
} finally {
  await navegador.close();
}
if (errores.length) fallos.push(...errores.map((e) => `error en la consola: ${e}`));
if (fallos.length) {
  console.error(`primera.mjs: ${fallos.length} fallos\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('primera.mjs: el primer uso, en claro y oscuro, ancho y móvil');
