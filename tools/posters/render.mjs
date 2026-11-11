// Opens render.html for each body in a headless Chromium and writes the stills: app/modelos/posters/<id>.webp for
// Figure 1 and app/modelos/b/posters/<id>.webp for Figure 2. Stills of exercises the body no longer has are removed.
// Usage: node render.mjs <base url of the repo>   (CHROMIUM_BIN may point at a Chromium binary)
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { chromium } = createRequire(join(raiz, 'tests/package.json'))('playwright-core');
const [base] = process.argv.slice(2);
if (!base) {
  console.error('Usage: node render.mjs <base url>');
  process.exit(2);
}
const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  for (const [cuerpo, carpeta] of [['a', 'app/modelos/posters'], ['b', 'app/modelos/b/posters']]) {
    const pagina = await navegador.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 2 });
    pagina.on('pageerror', (e) => console.error(`render.html (${cuerpo}):`, e.message));
    await pagina.goto(`${base}/tools/posters/render.html?cuerpo=${cuerpo}`);
    await pagina.waitForFunction('window.LISTO === true', null, { timeout: 600000 });
    const posters = await pagina.evaluate('window.POSTERS');
    const destino = join(raiz, carpeta);
    mkdirSync(destino, { recursive: true });
    for (const f of readdirSync(destino)) if (f.endsWith('.webp') && !posters[f.slice(0, -5)]) rmSync(join(destino, f));
    for (const [id, url] of Object.entries(posters)) writeFileSync(join(destino, `${id}.webp`), Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${carpeta}: ${Object.keys(posters).length} pósters`);
    await pagina.close();
  }
} finally {
  await navegador.close();
}
