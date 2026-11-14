// Walking is counted in steps (Gaudí's «andar»: two steps per clip, on a running floor): a set of 5 steps counts 1 to 5,
// ends halfway through the third clip, takes no rest between clips, and the rating asks about «todos los pasos».
// Usage: node andar.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
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
    v: 1, para: 'Ana', de: 'Luis', d: 30, x: 1, m: 5, c: 'a', f: '2026-11-14', e: [{ i: 'andar_atras', s: 1, r: 5, t: [1, 0, 1] }],
  }));
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  const tarjeta = await pagina.textContent('.tarjeta-dosis');
  if (!tarjeta.includes('5 pasos')) fallos.push(`la tarjeta no habla de pasos (${tarjeta})`);
  await pagina.click('[data-r="empezar"]');
  await pagina.click('[data-r="en-posicion"]');
  await pagina.waitForSelector('.j-rep');
  const vistos = new Set();
  const inicio = Date.now();
  while (Date.now() - inicio < 20000 && !(await pagina.locator('#v-reps').count())) {
    const n = await pagina.locator('.j-rep').textContent().catch(() => null);
    if (n) vistos.add(n.trim());
    await pagina.waitForTimeout(150);
  }
  const segundos = (Date.now() - inicio) / 1000;
  if (!(await pagina.locator('#v-reps').count())) fallos.push('la serie de 5 pasos no termina');
  else {
    const pregunta = await pagina.textContent('#v-reps');
    if (!pregunta.includes('todos los pasos')) fallos.push(`la valoración no pregunta por los pasos (${pregunta})`);
    // Five steps of 1 s with no rest between clips: about 5 s (with the 1 s rest of other exercises it would be about 7).
    if (segundos > 6.6) fallos.push(`cinco pasos de un segundo duran ${segundos.toFixed(1)} s: hay pausas entre pasos`);
  }
  for (const n of ['1', '3', '5']) if (!vistos.has(n)) fallos.push(`la cuenta no pasa por ${n} (${[...vistos].join(', ')})`);
  if (errores.length) fallos.push(...errores.map((e) => `error: ${e}`));
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`andar, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('andar: los pasos se cuentan de uno en uno, sin pausas, y la valoración pregunta por ellos');
