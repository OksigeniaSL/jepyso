// The recorded voice (app/voz.js, app/voz/): on a phone with no Spanish voice of its own, the person chooses a woman's
// or a man's voice and hears its takes: the countdown and the words of each phase; «Sin voz» stops it. On a phone
// in English, the same voices speak English (voz/mira-en, voz/altair-en), and nothing Spanish is asked for.
// Usage: node voz-grabada.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';

const base = process.argv[2];
const clave = (t) => createHash('sha1').update(t, 'utf8').digest('hex').slice(0, 12);
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
try {
  // Without the worker: the takes are asked for by the page, where the test sees them.
  const pagina = await (await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })).newPage();
  pagina.setDefaultTimeout(60000);
  // A phone with speech synthesis but no Spanish voice, like the in-app browser of the Moodle app.
  await pagina.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], speak() {}, cancel() {}, addEventListener() {} } });
  });
  const pedidas = [];
  pagina.on('request', (r) => {
    const m = r.url().match(/\/voz\/(mira|altair)\/([0-9a-f]{12})\.mp3$/);
    if (m) pedidas.push(`${m[1]}/${m[2]}`);
  });
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(`${base}/index.html?calidad=baja`);
  const codigo = await pagina.evaluate(async () => (await import('./datos.js')).codificar({ v: 1, d: 30, x: 1, c: 'a', e: [{ i: 'puente', s: 1, r: 2, t: [1, 0, 1] }] }));
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  await pagina.waitForSelector('.voz-elegir');
  const elegida = await pagina.getAttribute('.voz-elegir [aria-pressed="true"]', 'data-v');
  comprobar(elegida === 'mujer' || elegida === 'hombre', `la primera vez no le toca ninguna de las dos voces (${elegida})`);

  await pagina.click('.voz-elegir [data-v="hombre"]');
  await pagina.waitForTimeout(800);
  comprobar(pedidas.includes(`altair/${clave('Voz encendida')}`), `«Voz de hombre» no suena con Altair (${pedidas.join(' ')})`);
  await pagina.click('[data-r="empezar"]');
  await pagina.click('[data-r="en-posicion"]');
  await pagina.waitForSelector('[data-r="todas"]');
  for (const t of ['tres', 'dos', 'una', 'Sube la cadera', 'Baja despacio', 'Hecho']) {
    comprobar(pedidas.includes(`altair/${clave(t)}`), `no suena «${t}» con la voz grabada (${pedidas.length} tomas pedidas)`);
  }
  comprobar(!pedidas.some((p) => p.startsWith('mira/')), 'con «Voz de hombre» se piden tomas de la otra voz');

  await pagina.reload();
  await pagina.waitForSelector('.voz-elegir');
  const antes = pedidas.length;
  await pagina.click('.voz-elegir [data-v="mujer"]');
  await pagina.waitForTimeout(800);
  comprobar(pedidas.slice(antes).includes(`mira/${clave('Voz encendida')}`), '«Voz de mujer» no suena con Mira');
  await pagina.click('.voz-elegir [data-v="no"]');
  const tras = pedidas.length;
  await pagina.click('[data-r="empezar"]');
  await pagina.click('[data-r="en-posicion"]');
  await pagina.waitForSelector('[data-r="todas"]');
  comprobar(pedidas.length === tras, `con «Sin voz» se siguen pidiendo tomas (${pedidas.length - tras})`);
  comprobar(!errores.length, `errores en la página: ${errores.join(' | ')}`);

  // A phone in English with no voice of its own.
  const ingles = await (await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'en-GB' })).newPage();
  ingles.setDefaultTimeout(60000);
  await ingles.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], speak() {}, cancel() {}, addEventListener() {} } });
  });
  const pedidasEn = [];
  ingles.on('request', (r) => {
    const m = r.url().match(/\/voz\/([a-z-]+)\/([0-9a-f]{12})\.mp3$/);
    if (m) pedidasEn.push(`${m[1]}/${m[2]}`);
  });
  await ingles.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  await ingles.waitForSelector('.voz-elegir');
  await ingles.click('.voz-elegir [data-v="mujer"]');
  await ingles.waitForTimeout(800);
  comprobar(pedidasEn.includes(`mira-en/${clave('Voice on')}`), `en inglés, «Voz de mujer» no suena con Mira en inglés (${pedidasEn.join(' ')})`);
  await ingles.click('[data-r="empezar"]');
  await ingles.click('[data-r="en-posicion"]');
  await ingles.waitForSelector('[data-r="todas"]');
  for (const t of ['three', 'two', 'one', 'Done']) {
    comprobar(pedidasEn.includes(`mira-en/${clave(t)}`), `en inglés no suena «${t}» con la voz grabada (${pedidasEn.length} tomas pedidas)`);
  }
  comprobar(pedidasEn.every((p) => p.startsWith('mira-en/')), `en inglés se piden tomas de otra carpeta (${pedidasEn.filter((p) => !p.startsWith('mira-en/')).join(' ')})`);
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`voz grabada, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('voz grabada: cada persona elige voz de mujer u hombre, y la cuenta y las fases suenan con ella, también en inglés; sin voz, nada');
