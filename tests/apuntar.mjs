// What the person adds or fixes after a session reaches the professional: a session noted without the app, a day
// corrected afterwards, «me ha costado» and a note; and the daily reminder comes as a calendar file with the link.
// Usage: node apuntar.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
try {
  const persona = await navegador.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const pagina = await persona.newPage();
  pagina.setDefaultTimeout(30000);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(`${base}/index.html?calidad=baja`);
  const codigo = await pagina.evaluate(async () => (await import('./datos.js')).codificar({
    v: 1, para: 'Ana', de: 'Luis', p: 'ana001', d: 30, x: 1, m: 4, c: 'a', f: '2026-11-14', e: [{ i: 'puente', s: 2, r: 10, t: [2, 1, 2] }],
  }));
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);

  // The reminder: an .ics with a daily event and the routine's link.
  await pagina.fill('[data-r="hora-recordatorio"]', '18:30');
  const [descarga] = await Promise.all([pagina.waitForEvent('download'), pagina.click('[data-r="recordatorio"]')]);
  const ics = (await (await import('node:fs/promises')).readFile(await descarga.path(), 'utf8')).replace(/\r\n /g, '');
  comprobar(descarga.suggestedFilename() === 'rutina.ics', 'el recordatorio no se llama rutina.ics');
  comprobar(ics.includes('RRULE:FREQ=DAILY') && /DTSTART:\d{8}T183000/.test(ics), 'el recordatorio no es diario a las 18:30');
  comprobar(ics.includes(`#r=${codigo}`), 'el recordatorio no lleva el enlace de la rutina');

  // A session done without the app: noted with its discomfort, «me ha costado» and a note.
  await pagina.click('[data-r="sin-app"]');
  await pagina.waitForSelector('dialog.hoja-corregir');
  await pagina.click('dialog.hoja-corregir [data-c="m"][data-v="3"]');
  await pagina.click('dialog.hoja-corregir [data-c="dificultad"][data-v="cuesta"]');
  await pagina.fill('dialog.hoja-corregir [data-c="nota"]', 'Me molestó la rodilla al bajar');
  await pagina.click('dialog.hoja-corregir [data-c="guardar"]');
  let hist = await pagina.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('hist:')))));
  comprobar(hist.length === 1 && hist[0].sinApp && hist[0].e[0].m === 3 && hist[0].e[0].c === 'cuesta' && hist[0].e[0].n === 'Me molestó la rodilla al bajar' && hist[0].ed,
    `la sesión sin la app no se guarda con lo marcado (${JSON.stringify(hist)})`);

  // Corrected afterwards: fewer repetitions in the second set.
  await pagina.click('[data-r="corregir"]');
  await pagina.waitForSelector('dialog.hoja-corregir');
  for (let i = 0; i < 4; i++) await pagina.click('dialog.hoja-corregir [data-accion="c-0-1"][data-delta="-1"]');
  await pagina.click('dialog.hoja-corregir [data-c="guardar"]');
  hist = await pagina.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('hist:')))));
  comprobar(hist[0].e[0].p.join(',') === '10,6', `la corrección no cambia las repeticiones (${hist[0].e[0].p})`);

  // The summary carries it, and the professional sees «Costó» and the note.
  await pagina.evaluate(() => { window.open = (u) => { window.abierto = u; }; });
  await pagina.click('[data-r="mandar"][data-canal="wa"]');
  const abierto = await (await pagina.waitForFunction(() => window.abierto)).jsonValue();
  const enlace = decodeURIComponent(new URL(abierto).searchParams.get('text')).split(' ').pop();
  const profesional = await (await navegador.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  profesional.on('pageerror', (e) => errores.push(e.message));
  await profesional.goto(enlace.replace(/^https?:\/\/[^/]+/, base));
  await profesional.waitForSelector('.lista .dia');
  const texto = await profesional.textContent('.lista');
  comprobar(texto.includes('Costó') && texto.includes('Me molestó la rodilla al bajar'), `el profesional no ve «Costó» ni la nota (${texto.slice(0, 200)})`);
  comprobar(texto.includes('10 y 6') || texto.includes('10, 6') || texto.includes('6 de 10'), 'el profesional no ve la corrección');
  if (errores.length) fallos.push(...errores.map((e) => `error: ${e}`));
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`apuntar, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('apuntar: sin la app, corregido, con nota y recordatorio, y el profesional lo ve');
