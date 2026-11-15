// The app of Google Play (app/tienda.js): opened as the store's app (?app=android, as android/ starts it), nothing
// leads to the purchase, only «Amplía tu plan en nuestra web.», with no link; and the professional's help opens with
// where to write. Google Play's rules on payments; Enrique, 15-11-2026.
// Usage: node tienda.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
const COMPRA = /compra|comprar|precio|planes|stripe|checkout|buy\.|pago\.|\/pay/i;
try {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  pagina.setDefaultTimeout(30000);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  // Five people with a file: the free version is full.
  await pagina.addInitScript(() => {
    if (sessionStorage.getItem('sembrado')) return;
    sessionStorage.setItem('sembrado', '1');
    const ficha = (id) => ({ id, nombre: `Persona ${id}`, notas: '', creada: '2026-11-10', rutinas: [], dias: [] });
    localStorage.setItem('personas', JSON.stringify(['a1', 'b2', 'c3', 'd4', 'e5'].map(ficha)));
  });
  await pagina.goto(`${base}/index.html?calidad=baja&app=android#personas`);
  await pagina.waitForSelector('.capacidad');
  const capacidad = await pagina.textContent('.capacidad');
  comprobar(capacidad.includes('Amplía tu plan en nuestra web.'), `la ficha llena no dice cómo ampliar (${capacidad})`);
  comprobar(!(await pagina.$('.capacidad a')), 'en la app de la tienda, la capacidad enlaza a la compra');
  // Moving inside the app keeps it the store's app (the address loses ?app=android on the way).
  await pagina.evaluate(() => { location.hash = '#'; });
  await pagina.waitForSelector('[data-ayuda]');
  await pagina.click('[data-ayuda]');
  await pagina.waitForSelector('dialog.hoja-ayuda[open]');
  const ayuda = await pagina.$eval('dialog.hoja-ayuda', (d) => ({ texto: d.textContent, enlaces: [...d.querySelectorAll('a')].map((a) => a.getAttribute('href')) }));
  comprobar(ayuda.enlaces.includes('mailto:contacto@oksigenia.com'), `la ayuda no dice dónde escribir (${ayuda.enlaces})`);
  comprobar(ayuda.texto.includes('Amplía tu plan en nuestra web.'), 'la ayuda no dice cómo ampliar el plan');
  const aCompra = await pagina.$$eval('a[href]', (l) => l.map((a) => a.getAttribute('href')));
  comprobar(!aCompra.some((h) => COMPRA.test(h)), `la app de la tienda lleva a la compra (${aCompra.filter((h) => COMPRA.test(h))})`);
  await pagina.click('dialog.hoja-ayuda .hoja-como-pie .boton');
  await pagina.waitForSelector('dialog.hoja-ayuda', { state: 'detached', timeout: 5000 }).catch(() => fallos.push('la ayuda no se cierra con «Entendido»'));
  comprobar(!errores.length, `errores en la página: ${errores.join(' | ')}`);
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`tienda, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('tienda: en la app de Google Play nada lleva a la compra, solo «Amplía tu plan en nuestra web», y la ayuda dice dónde escribir');
