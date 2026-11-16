// A licence Oksigenia cancelled (app/licencia.js, comprobarVigencia): on Personas the files stay open to read, with no
// tickets of the free version, the Drive does not offer to sync, the page says why and offers to paste the new licence;
// and no new file fits once there are five. In English too.
// Usage: node anulada.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
// The Profesional test licence (the coordinator's test order «prueba-plan»), already seen on its Drive.
const LICENCIA = 'eyJwIjoiamVweXNvIiwicyI6ImNvbnN1bHRhIiwiYyI6InBydWViYS5qZXB5c29AZXhhbXBsZS5jb20iLCJmIjoiMjAyNi0xMS0xNSIsIm4iOiJwcnVlYmEtcGxhbiIsIm0iOjUwfQ.PhdPmE7hHGeHEnnz0hXRAu4wWXYWKMUJg4-Pst0NN70cW41E-8nhPS-6s07PMnWHxAT7Fe2EHwNqrxDCmvZ-AQ';
const persona = (id, nombre) => ({ id, nombre, notas: '', creada: '2026-11-01', rutinas: [], dias: [] });
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
try {
  for (const locale of ['es-ES', 'en-GB']) {
    const pagina = await (await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale })).newPage();
    pagina.setDefaultTimeout(30000);
    const errores = [];
    pagina.on('pageerror', (e) => errores.push(e.message));
    // With the tickets of the free version switched on (?vales=1), as on a public address.
    await pagina.goto(`${base}/index.html?vales=1`);
    await pagina.evaluate(({ licencia, lista }) => {
      localStorage.setItem('licencia', JSON.stringify(licencia));
      localStorage.setItem('licencia-cuenta', JSON.stringify('prueba.jepyso@example.com'));
      localStorage.setItem('licencia-anulada', JSON.stringify('prueba-plan'));
      localStorage.setItem('personas', JSON.stringify(lista));
    }, { licencia: LICENCIA, lista: ['Ana', 'Luis', 'Marta', 'Pedro', 'Rosa', 'Toni', 'Carmen'].map((n, i) => persona(`ffff${i}0`, n)) });
    // A new page load (a change of the fragment alone would not start the app again), as when opening it.
    await pagina.goto(`${base}/index.html?vales=1&calidad=baja#personas`);
    await pagina.waitForSelector('.lista-personas .persona-fila');
    const aviso = pagina.locator('.licencia-anulada');
    comprobar((await aviso.count()) === 1, `${locale}: Personas no dice que la licencia está anulada`);
    comprobar((await pagina.locator('[data-accion="drive"]').count()) === 0, `${locale}: con la licencia anulada sigue ofreciendo sincronizar`);
    comprobar((await pagina.locator('.licencia-pegar').count()) === 1, `${locale}: con la licencia anulada no ofrece pegar la nueva`);
    comprobar((await pagina.locator('.persona-fila.cerrada').count()) === 0, `${locale}: con la licencia anulada, sus fichas salen cerradas`);
    comprobar((await pagina.locator('.persona-fila').count()) === 7, `${locale}: no salen las siete fichas`);
    if (locale === 'en-GB') comprobar((await aviso.innerText()).includes('no longer valid'), 'en inglés, el aviso no está en inglés');
    comprobar(!errores.length, `${locale}: errores en la página: ${errores.join(' | ')}`);
    await pagina.context().close();
  }
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.log(`anulada, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('anulada: las fichas se leen, sin sincronizar ni vales, con el aviso y el sitio para la licencia nueva, también en inglés');
