// A routine left halfway (the page reloaded after the first set) offers to go on from where it was, the same day.
// Usage: node seguir.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
try {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  pagina.setDefaultTimeout(60000);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(`${base}/index.html?calidad=baja`);
  const codigo = await pagina.evaluate(async () => (await import('./datos.js')).codificar({
    v: 1, para: 'Ana', de: 'Luis', d: 30, x: 1, m: 5, c: 'a', f: '2026-11-14', e: [{ i: 'puente', s: 2, r: 1, t: [1, 0, 1] }],
  }));
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  await pagina.click('[data-r="empezar"]');
  await pagina.click('[data-r="en-posicion"]');
  await pagina.waitForSelector('.anillo');
  await pagina.reload();
  await pagina.waitForSelector('.rutina');
  if (!(await pagina.locator('[data-r="seguir-donde"]').count())) fallos.push('tras la primera serie y una recarga, no ofrece seguir donde lo dejó');
  else {
    await pagina.click('[data-r="seguir-donde"]');
    await pagina.click('[data-r="en-posicion"]');
    const sub = await pagina.textContent('.j-sub');
    if (!sub.includes('Serie 2 de 2')) fallos.push(`al seguir, no va a la segunda serie (${sub})`);
  }
  if (errores.length) fallos.push(...errores.map((e) => `error: ${e}`));
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`seguir, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('seguir: una rutina a medias se retoma donde se dejó');
