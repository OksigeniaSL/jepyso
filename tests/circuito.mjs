// A circuit (every exercise once in each round, then the next round) and a published routine (for a blog: nothing to
// send back, a way back to its page, the language it was written in and an invitation to professionals). Usage: node circuito.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
try {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  pagina.setDefaultTimeout(60000);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto(`${base}/index.html?calidad=baja`);
  await pagina.evaluate(async () => (await import('./voz.js')).ponerVoz(false));
  const codigo = await pagina.evaluate(async () => (await import('./datos.js')).codificar({
    v: 1, de: 'Abakinesis', d: 15, x: 1, m: 5, c: 'a', f: '2026-11-21', k: 2, kd: 60, o: 1, u: 'https://abakinesis.com/articulos/fuerza/', lg: 'es',
    e: [{ i: 'puente', s: 1, r: 1, t: [1, 0, 1] }, { i: 'plancha_lateral', s: 1, r: 1, t: [1, 1, 1], l: 'ambos' }],
  }));
  await pagina.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  await pagina.waitForSelector('.rutina-intro');
  const intro = await pagina.textContent('.rutina-intro');
  comprobar(intro.includes('Rutina de Abakinesis') && !intro.includes('Tu rutina de'), 'publicada: la cabecera no dice «Rutina de Abakinesis»');
  comprobar(intro.includes('En circuito: 2 vueltas') && intro.includes('1 min de descanso entre vueltas'), 'el circuito no se explica arriba');
  comprobar(!/\d serie/.test(await pagina.textContent('.tarjeta-ejercicio')), 'en circuito, las tarjetas no deberían hablar de series');
  comprobar(intro.includes('circuito de 2 vueltas'), 'el pie no dice el circuito');
  comprobar((await pagina.locator('.saludo [data-idioma]').count()) === 1, 'el cambio de idioma no está arriba, con la rutina');
  const invita = pagina.locator('.invitacion-lista');
  comprobar((await invita.count()) === 1 && (await invita.locator('a.boton').getAttribute('href')) === 'https://jepyso.com', 'publicada: no invita a los profesionales a conocer Jepyso');

  // On a phone set in English, a published routine still opens in the language it was written in.
  const ingles = await (await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-GB' })).newPage();
  ingles.setDefaultTimeout(60000);
  await ingles.goto(`${base}/index.html?calidad=baja#r=${codigo}`);
  await ingles.waitForSelector('.rutina-intro');
  comprobar((await ingles.textContent('.saludo')).includes('Rutina de Abakinesis'), 'publicada en español, en un teléfono en inglés sale en inglés');
  comprobar((await ingles.textContent('.saludo [data-idioma]')).includes('English'), 'arriba no se ofrece pasarla a inglés');
  await ingles.close();
  // A routine for one person invites no one: it is the professional's.
  const privada = await (await navegador.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const codigoPrivada = await pagina.evaluate(async () => (await import('./datos.js')).codificar({ v: 1, para: 'Ana', de: 'Abakinesis', d: 30, x: 1, c: 'a', e: [{ i: 'puente', s: 1, r: 1, t: [1, 0, 1] }] }));
  await privada.goto(`${base}/index.html?calidad=baja#r=${codigoPrivada}`);
  await privada.waitForSelector('.rutina-intro');
  comprobar(!(await privada.locator('.invitacion-pro').count()), 'una rutina para una persona invita a los profesionales');
  await privada.close();

  const sub = () => pagina.textContent('.j-sub');
  const serie = async () => {
    // The countdown paints itself again every second: the click goes from the page, not through a stable element.
    await pagina.waitForSelector('[data-r="ya"]');
    await pagina.evaluate(() => document.querySelector('[data-r="ya"]').click());
    await pagina.waitForSelector('.j-rep');
  };
  const valorar = async () => {
    await pagina.click('[data-r="todas"]');
    await pagina.click('[data-r="molestia"][data-v="2"]');
    comprobar(!(await pagina.locator('.valorar-extra').count()), 'publicada: pregunta «¿Algo más para…?», que no va a nadie');
    await pagina.click('[data-r="continuar"]');
  };

  // Round 1: each exercise waits for the person the first time.
  await pagina.click('[data-r="empezar"]');
  comprobar((await sub()).includes('Vuelta 1 de 2'), `la primera preparación no dice la vuelta (${await sub()})`);
  await pagina.click('[data-r="en-posicion"]');
  await serie();
  await pagina.waitForSelector('[data-r="en-posicion"]');
  comprobar((await pagina.textContent('.j-nombre')) === 'Plancha lateral', 'tras el puente, en la vuelta 1, no pasa a la plancha lateral');
  await pagina.click('[data-r="en-posicion"]');
  await serie();
  await pagina.waitForSelector('.anillo');
  comprobar((await pagina.textContent('.j-mando')).includes('lado izquierdo'), 'no pasa al otro lado de la plancha');
  await serie();
  // Between rounds, the longer rest, with the first exercise of the next one already in place.
  await pagina.waitForSelector('.anillo');
  const entre = await pagina.textContent('.j-mando');
  comprobar(entre.includes('Ahora, la vuelta 2 de 2, empezando por puente de glúteo') && entre.includes('60'), `el descanso entre vueltas no es el esperado (${entre.trim().slice(0, 120)})`);
  comprobar((await sub()).includes('Vuelta 2 de 2'), 'el descanso entre vueltas no dice la vuelta 2');
  await serie();
  // Last round: each exercise is rated after its last set.
  await pagina.waitForSelector('[data-r="todas"]');
  comprobar((await pagina.textContent('.valorar-cabeza')).includes('2 vueltas'), 'la valoración no habla de vueltas');
  await valorar();
  await pagina.waitForSelector('.anillo');
  const corto = await pagina.textContent('.j-mando');
  comprobar(corto.includes('Siguiente: plancha lateral') && corto.includes('15'), `el descanso entre ejercicios no es el esperado (${corto.trim().slice(0, 120)})`);
  await serie();
  await pagina.waitForSelector('.anillo');
  await serie();
  await pagina.waitForSelector('[data-r="todas"]');
  await valorar();

  // The end of a published routine: nothing to send, the way back to its page.
  await pagina.waitForSelector('.rutina .pie');
  const fin = await pagina.textContent('.rutina');
  comprobar(fin.includes('Rutina de hoy, completa'), 'no termina con la rutina completa');
  comprobar(!(await pagina.locator('[data-r="mandar"]').count()) && !fin.includes('Mándale'), 'publicada: ofrece mandar el resumen');
  const vuelta = pagina.locator('a.boton', { hasText: 'Volver a abakinesis.com' });
  comprobar((await vuelta.count()) === 1 && (await vuelta.getAttribute('href')) === 'https://abakinesis.com/articulos/fuerza/', 'no hay enlace para volver al artículo');
  const dia = await pagina.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.startsWith('hist:'));
    return JSON.parse(localStorage.getItem(k)).at(-1);
  });
  comprobar((await pagina.locator('.invitacion-fin').count()) === 1, 'publicada: al terminar no invita a los profesionales');
  comprobar(dia.e.length === 3 && dia.e.every((x) => x.s === 2 && x.p.join() === '1,1'), `el día apuntado no lleva las dos vueltas de cada ejercicio (${JSON.stringify(dia.e)})`);

  // The builder: a circuit drops the sets of each card, and publishing drops the person's name.
  await pagina.evaluate(() => {
    localStorage.removeItem('borrador');
    localStorage.setItem('estrenada', 'true');
  });
  await pagina.goto(`${base}/index.html?calidad=baja`);
  await pagina.waitForSelector('.armar');
  await pagina.click('[data-accion="destino"][data-valor="publicar"]');
  comprobar(!(await pagina.locator('#para').count()) && (await pagina.locator('#volver').count()) === 1, 'para publicar, el paso 1 no cambia');
  await pagina.fill('#volver', 'http://x.com');
  comprobar((await pagina.textContent('.aviso-volver')).includes('https://'), 'una página sin https no avisa');
  await pagina.fill('#volver', 'https://abakinesis.com/');
  await pagina.click('[data-accion="forma"][data-valor="circuito"]');
  comprobar((await pagina.locator('[data-accion="entreVueltas"]').count()) === 4, 'en circuito no salen los descansos entre vueltas');
  comprobar(!(await pagina.locator('[data-accion="descanso"]').count()), 'en circuito sigue el descanso entre series');
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`circuito, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('circuito: las vueltas, los descansos, la valoración en la última vuelta y la rutina publicada, bien');
