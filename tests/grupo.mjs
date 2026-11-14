// The group mode: a routine put on a big screen (a board's 1280×600), followed to the end with a pretend local voice.
// It asks no one about discomfort or repetitions, keeps nothing on the device, names each exercise slowly, and
// «Salir» goes back to the routine. The panel never needs scrolling.
// Usage: node grupo.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
try {
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 600 } });
  pagina.setDefaultTimeout(120000);
  await pagina.addInitScript(() => {
    window.dicho = [];
    const voz = { name: 'Prueba', lang: 'es-ES', localService: true, default: true };
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [voz], speak: (u) => window.dicho.push([u.text, u.rate]), cancel() {}, addEventListener() {} } });
    window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  });
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  await pagina.goto(`${base}/index.html?calidad=baja`);
  const codigo = await pagina.evaluate(async () => (await import('./datos.js')).codificar({ v: 1, de: 'Lucía', d: 30, x: 1, c: 'a',
    e: [{ i: 'puente', s: 2, r: 1, t: [1, 0, 1] }, { i: 'silla', s: 1, r: 1, t: [1, 0, 1] }] }));
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  await pagina.click('[data-r="grupo"]');
  await pagina.waitForSelector('.jugador.grupo [data-r="en-posicion"]');
  const panel = () => pagina.evaluate(() => { const m = document.querySelector('.jugador.grupo .mando'); return m.scrollHeight - m.clientHeight; });
  if ((await panel()) > 1) fallos.push(`al prepararse, el panel necesita bajar ${await panel()} px`);
  // A presenter's remote: → goes on.
  await pagina.keyboard.press('ArrowRight');
  await pagina.waitForSelector('.j-fase');
  if ((await panel()) > 1) fallos.push(`en la serie, el panel necesita bajar ${await panel()} px`);
  await pagina.waitForSelector('.anillo');
  await pagina.click('[data-r="ya"]');
  // The second set, then straight to the next exercise: no rating.
  await pagina.waitForSelector('[data-r="en-posicion"], [data-r="todas"]');
  if (await pagina.locator('[data-r="todas"]').count()) fallos.push('el grupo pasa por valorar');
  if (!(await pagina.textContent('.j-nombre')).includes('Levantarse de la silla')) fallos.push('tras el primer ejercicio no viene el siguiente');
  await pagina.click('[data-r="en-posicion"]');
  await pagina.waitForSelector('.grupo-fin');
  if ((await pagina.textContent('.j-nombre')) !== 'Rutina de Lucía') fallos.push('al final, arriba no dice de quién es la rutina');
  const r = await pagina.evaluate(() => ({ dicho: window.dicho, guardado: Object.keys(localStorage).filter((k) => /^(hist|curso):/.test(k) && localStorage.getItem(k) !== 'null') }));
  for (const t of ['Puente de glúteo', 'Levantarse de la silla', 'Rutina terminada. Buen trabajo.']) if (!r.dicho.some(([x]) => x === t)) fallos.push(`la voz no dice «${t}»`);
  if (r.dicho.some(([, v]) => v !== 0.9)) fallos.push('la voz del grupo no va más despacio');
  if (r.guardado.length) fallos.push(`el grupo deja guardado ${r.guardado.join(', ')}`);
  await pagina.click('[data-r="dejar"]');
  await pagina.waitForSelector('[data-r="empezar"]');
  // Back in the person's routine, the voice is the person's again.
  const ritmo = await pagina.evaluate(async () => { (await import('./voz.js')).decir('prueba'); return window.dicho.at(-1)[1]; });
  if (ritmo !== 1.05) fallos.push(`fuera del grupo, la voz sigue a ${ritmo}`);
  if (errores.length) fallos.push(...errores.map((e) => `error: ${e}`));
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`grupo, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('grupo: a lo ancho y sin bajar, sin valorar ni guardar, la voz despacio y de vuelta a la rutina');
