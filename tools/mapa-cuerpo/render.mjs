// Opens render.html in a headless Chromium and saves what it draws: <view>-silueta.png, <view>-m0..m19.png and info.json.
// Usage: node render.mjs <base url of the repo> <output folder>   (CHROMIUM_BIN may point at a Chromium binary)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { chromium } = createRequire(join(raiz, 'tests/package.json'))('playwright-core');
const [base, salida] = process.argv.slice(2);
if (!base || !salida) {
  console.error('Usage: node render.mjs <base url> <output folder>');
  process.exit(2);
}
const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const pagina = await navegador.newPage();
  pagina.on('pageerror', (e) => console.error('render.html:', e.message));
  await pagina.goto(`${base}/tools/mapa-cuerpo/render.html`);
  await pagina.waitForFunction('window.LISTO === true', null, { timeout: 300000 });
  mkdirSync(salida, { recursive: true });
  for (const [nombre, url] of Object.entries(await pagina.evaluate('window.IMAGENES'))) {
    writeFileSync(join(salida, `${nombre}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  writeFileSync(join(salida, 'info.json'), JSON.stringify(await pagina.evaluate('window.INFO')));
} finally {
  await navegador.close();
}
