// The voice that guides a set (app/voz.js), with a pretend local Spanish voice: the countdown, the words of each phase
// in the first repetition, the count and «Hecho»; and once turned off, nothing more is said.
// Usage: node voz.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
try {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  pagina.setDefaultTimeout(60000);
  await pagina.addInitScript(() => {
    window.dicho = [];
    const voz = { name: 'Prueba', lang: 'es-ES', localService: true, default: true };
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [voz], speak: (u) => window.dicho.push(u.text), cancel() {}, addEventListener() {} } });
    window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  });
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(`${base}/index.html?calidad=baja`);
  const codigo = await pagina.evaluate(async () => (await import('./datos.js')).codificar({ v: 1, d: 30, x: 1, c: 'a', e: [{ i: 'puente', s: 1, r: 2, t: [1, 0, 1] }] }));
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  await pagina.click('[data-r="empezar"]');
  await pagina.click('[data-r="en-posicion"]');
  await pagina.waitForSelector('[data-r="todas"]');
  const dicho = await pagina.evaluate(() => window.dicho);
  for (const t of ['tres', 'dos', 'una', 'Sube la cadera', 'Baja despacio', 'dos. Hecho']) if (!dicho.includes(t)) fallos.push(`no dice «${t}» (${dicho.join(' · ')})`);
  if (dicho.filter((t) => t === 'Sube la cadera').length !== 1) fallos.push('dice las fases también después de la primera repetición');
  if (!(await pagina.locator('[data-r="voz"][aria-pressed="true"]').count())) fallos.push('no hay botón de la voz encendido');
  await pagina.click('[data-r="voz"]');
  const antes = (await pagina.evaluate(() => window.dicho)).length;
  await pagina.evaluate(async () => (await import('./voz.js')).decir('prueba'));
  if ((await pagina.evaluate(() => window.dicho)).length !== antes) fallos.push('apagada, sigue hablando');
  if (errores.length) fallos.push(...errores.map((e) => `error: ${e}`));
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`voz, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('voz: cuenta atrás, fases la primera vez, la cuenta y «Hecho»; y se apaga');
