// The first two weeks (personas.js, sinNoticias): someone sent a routine four days ago with nothing back shows in the
// tab of Personas, in the list and at the top of the file, with a message ready to send that carries the routine again.
// Usage: node noticias.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
try {
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  pagina.setDefaultTimeout(30000);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  // Three files: Ana, routine four days ago and nothing back; Luis, the same with a summary received; Eva, yesterday.
  // The phone's share sheet, stubbed: headless Chromium has none.
  await pagina.addInitScript(() => {
    navigator.share = async (d) => {
      window.compartido = d;
    };
    if (sessionStorage.getItem('sembrado')) return;
    sessionStorage.setItem('sembrado', '1');
    const dia = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const ficha = (id, nombre, f, mas = {}) => ({ id, nombre, notas: '', creada: f, rutinas: [{ f, codigo: `cod${id}`, e: ['puente'] }], dias: [], ...mas });
    localStorage.setItem('personas', JSON.stringify([
      ficha('ana', 'Ana', dia(4)),
      ficha('luis', 'Luis', dia(4), { ultimoResumen: dia(1) }),
      ficha('eva', 'Eva', dia(1)),
    ]));
  });
  await pagina.goto(`${base}/index.html?calidad=baja#personas`);
  await pagina.waitForSelector('.persona-fila');
  const cuenta = await pagina.textContent('[data-pestana="#personas"] .pestana-cuenta').catch(() => '');
  comprobar(cuenta === '1', `la pestaña de Personas no marca 1 sin noticias (${cuenta})`);
  const nombre = await pagina.getAttribute('[data-pestana="#personas"]', 'aria-label');
  comprobar(/1 sin noticias/.test(nombre || ''), `la pestaña no lo dice al lector de pantalla (${nombre})`);
  const marcas = await pagina.$$eval('.persona-fila', (l) => l.map((a) => `${a.querySelector('.nombre').textContent}:${a.querySelector('.marcas')?.textContent || ''}`));
  comprobar(marcas.includes('Ana:4 días sin noticias'), `Ana no sale con sus 4 días sin noticias (${marcas})`);
  comprobar(marcas.includes('Luis:') && marcas.includes('Eva:'), `Luis o Eva salen marcados (${marcas})`);

  await pagina.click('.persona-fila[href="#persona=ana"]');
  await pagina.waitForSelector('.sin-noticias');
  const titulo = await pagina.textContent('.sin-noticias h2');
  comprobar(titulo.includes('4 días sin noticias'), `la ficha de Ana no lo dice arriba (${titulo})`);
  const wa = await pagina.getAttribute('.sin-noticias a[href*="wa.me"]', 'href');
  comprobar(decodeURIComponent(wa).includes('#r=codana') && decodeURIComponent(wa).includes('Hola, Ana'), `el mensaje de WhatsApp no lleva su saludo y su rutina (${wa})`);
  await pagina.click('.sin-noticias [data-accion="compartir"]');
  const compartido = await pagina.evaluate(() => window.compartido);
  comprobar(compartido?.url?.endsWith('#r=codana') && compartido?.text?.startsWith('Hola, Ana'), `«Mandar con otra app» no pasa el mensaje y la rutina (${JSON.stringify(compartido)})`);

  await pagina.goto(`${base}/index.html?calidad=baja#persona=eva`);
  await pagina.waitForSelector('.persona-ficha');
  comprobar(!(await pagina.$('.sin-noticias')), 'Eva, con la rutina de ayer, ya sale sin noticias');
  comprobar(!errores.length, `errores en la página: ${errores.join(' | ')}`);
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`noticias, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('noticias: quien no ha mandado nada desde su rutina sale en la pestaña, en la lista y en su ficha, con el mensaje listo');
