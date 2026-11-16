// The mouse wheel over the figure (app/figura.js) does not reach the figure's controls, which would zoom instead of
// letting the page scroll; with Ctrl held (how a trackpad pinch arrives) it reaches them and zooms.
// Usage: node tests/rueda.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
try {
  const pagina = await (await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })).newPage();
  pagina.setDefaultTimeout(60000);
  await pagina.goto(`${base}/index.html?calidad=baja`);
  const codigo = await pagina.evaluate(async () => (await import('./datos.js')).codificar({ v: 1, d: 30, x: 1, c: 'a', e: [{ i: 'puente', s: 1, r: 2, t: [1, 0, 1] }] }));
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  await pagina.click('[data-r="empezar"]');
  const lienzo = pagina.locator('.escena canvas').first();
  await lienzo.waitFor();
  // What reaches the canvas, where the figure's controls listen.
  await lienzo.evaluate((c) => {
    window.ruedas = [];
    c.addEventListener('wheel', (ev) => window.ruedas.push(ev.ctrlKey));
  });
  const caja = await lienzo.boundingBox();
  await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await pagina.mouse.wheel(0, 300);
  await pagina.waitForTimeout(500);
  let ruedas = await pagina.evaluate(() => window.ruedas);
  if (ruedas.length) fallos.push('la rueda llega a la figura y la acerca o la aleja en vez de bajar la página');
  await pagina.keyboard.down('Control');
  await pagina.mouse.wheel(0, 100);
  await pagina.keyboard.up('Control');
  await pagina.waitForTimeout(300);
  ruedas = await pagina.evaluate(() => window.ruedas);
  if (!ruedas.includes(true)) fallos.push('con Ctrl (el pellizco del trackpad), la rueda no llega a la figura');
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.log(`rueda, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('rueda: sobre la figura, la rueda es de la página; con Ctrl, el pellizco del trackpad, acerca la figura');
