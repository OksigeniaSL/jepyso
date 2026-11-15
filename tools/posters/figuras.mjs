// Opens figuras.html in a headless Chromium and writes the still of each body for the builder's «Figura» choice:
// app/imagenes/figura-a.webp and app/imagenes/figura-b.webp.
// Usage: node figuras.mjs <base url of the repo>   (CHROMIUM_BIN may point at a Chromium binary)
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { chromium } = createRequire(join(raiz, 'tests/package.json'))('playwright-core');
const [base] = process.argv.slice(2);
if (!base) {
  console.error('Usage: node figuras.mjs <base url>');
  process.exit(2);
}
const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const pagina = await navegador.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 4 });
  pagina.on('pageerror', (e) => console.error('figuras.html:', e.message));
  await pagina.goto(`${base}/tools/posters/figuras.html`);
  await pagina.waitForFunction('window.LISTO === true', null, { timeout: 120000 });
  const figuras = await pagina.evaluate('window.FIGURAS');
  for (const [cuerpo, url] of Object.entries(figuras)) {
    const destino = join(raiz, `app/imagenes/figura-${cuerpo}.webp`);
    writeFileSync(destino, Buffer.from(url.split(',')[1], 'base64'));
    console.log(destino);
  }
} finally {
  await navegador.close();
}
