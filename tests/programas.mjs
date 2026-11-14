// The reference programmes (app/programas.js): Otago's level A opens in the builder with its exercises and its three
// days a week, and the routine sent says so to the person.
// Usage: node programas.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
try {
  const pagina = await navegador.newPage({ viewport: { width: 1366, height: 900 } });
  pagina.setDefaultTimeout(30000);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(`${base}/index.html?calidad=baja#plantillas`);
  const programas = await pagina.$$eval('[data-accion="programa"] .nombre', (l) => l.map((x) => x.textContent.trim()));
  comprobar(programas.length === 8 && programas[0] === 'Otago, nivel A' && programas.includes('Vivifrail D'), `los programas no son los ocho (${programas})`);
  await pagina.click('[data-accion="programa"][data-id="otago-a"]');
  await pagina.waitForFunction(() => document.querySelectorAll('.ejercicio[data-id]').length > 0);
  const n = await pagina.locator('.ejercicio[data-id]').count();
  comprobar(n === 13, `Otago A no abre sus 13 ejercicios (${n})`);
  const dias = await pagina.getAttribute('[data-accion="semana"][data-valor="3"]', 'aria-pressed');
  comprobar(dias === 'true', 'Otago A no marca 3 días a la semana');
  const nota = await pagina.inputValue('#nota-extension_rodilla_lastre').catch(() => '');
  comprobar(nota.includes('tobillera'), `la fuerza de Otago no lleva su nota de la tobillera (${nota})`);
  // The link: the person sees the days.
  const codigo = await pagina.evaluate(async () => {
    const p = (await import('./programas.js')).PROGRAMAS[0];
    return (await import('./datos.js')).codificar({
      v: 1, para: 'Ana', de: 'Luis', d: p.d, x: p.x, w: p.w, m: 5, c: 'a', f: '2026-11-14',
      e: p.orden.slice(0, 2).map((i) => ({ i, s: 1, r: 5, t: [2, 1, 2] })),
    });
  });
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  const semana = await pagina.textContent('.semana-rutina').catch(() => '');
  comprobar(semana.includes('3 días a la semana'), `la rutina no dice los días a la semana (${semana})`);
  comprobar(!errores.length, `errores en la página: ${errores.join(' | ')}`);
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`programas, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('programas: Otago y Vivifrail se abren como plantilla, con sus días a la semana, que la persona ve');
