// What a screen reader and weak eyes need (docs/revisiones/2026-11-14 in hq, interfaz.md 15, 16, 17 and 22): every group
// of buttons with its name, the figure named with what it does, the edges of the controls at 3:1 in light and dark, and
// a broken link that says whose it is, the likely cause and what to do.
// Usage: node accesible.mjs <base url>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';

const base = process.argv[2];
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fallos = [];
const comprobar = (bien, que) => bien || fallos.push(que);
// WCAG contrast between an element's border and the background it sits on.
const contrasteBorde = (selector) =>
  pagina.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((x) => x.offsetParent && x.getBoundingClientRect().width);
    if (!el) return 0;
    const rgb = (c) => c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    const lum = (c) => {
      const [r, g, b] = rgb(c).map((v) => {
        const x = v / 255;
        return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    let fondo = el.parentElement;
    while (fondo && /rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(fondo).backgroundColor)) fondo = fondo.parentElement;
    const a = lum(getComputedStyle(el).borderTopColor);
    const b = lum(getComputedStyle(fondo || document.body).backgroundColor);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, selector);
let pagina;
try {
  for (const tema of ['light', 'dark']) {
    pagina = await navegador.newPage({ viewport: { width: 1366, height: 900 }, colorScheme: tema });
    pagina.setDefaultTimeout(30000);
    const errores = [];
    pagina.on('pageerror', (e) => errores.push(e.message));
    await pagina.goto(`${base}/index.html?calidad=baja#plantillas`);
    await pagina.click('[data-accion="programa"][data-id="otago-a"]');
    await pagina.waitForSelector('.segmentos', { state: 'attached' });
    const sinNombre = await pagina.$$eval('[role="group"]', (l) => l.filter((g) => !g.getAttribute('aria-label') && !g.getAttribute('aria-labelledby')).length);
    comprobar(!sinNombre, `${tema}: ${sinNombre} grupos de botones sin nombre`);
    const figura = await pagina.waitForSelector('canvas[role="img"]').then((c) => c.getAttribute('aria-label')).catch(() => '');
    comprobar(/^Figura haciendo .+/.test(figura), `${tema}: la figura no dice lo que hace (${figura})`);
    for (const sel of ['.segmentos', '.paso', '.buscar']) {
      const c = await contrasteBorde(sel);
      comprobar(c >= 3, `${tema}: el borde de ${sel} se queda en ${c.toFixed(2)}:1`);
    }
    comprobar(!errores.length, `${tema}: errores en la página: ${errores.join(' | ')}`);
    await pagina.close();
  }
  pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  await pagina.goto(`${base}/index.html?calidad=baja#r=cortado`);
  const roto = await pagina.textContent('.aviso-roto').catch(() => '');
  comprobar(roto.startsWith('jepyso') && roto.includes('sin copiarlo'), `el enlace roto no dice de quién es ni qué hacer (${roto})`);
  await pagina.goto(`${base}/index.html?calidad=baja#s=cortado`);
  await pagina.waitForFunction(() => document.querySelector('.aviso-roto h1')?.textContent.includes('resumen'));
  const resumen = await pagina.textContent('.aviso-roto');
  comprobar(resumen.includes('Pídele a la persona'), `el resumen roto no dice qué hacer (${resumen})`);
} finally {
  await navegador.close();
}
if (fallos.length) {
  console.error(`accesible, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('accesible: grupos con nombre, la figura dice lo que hace, bordes de los controles a 3:1 y avisos de error que ayudan');
