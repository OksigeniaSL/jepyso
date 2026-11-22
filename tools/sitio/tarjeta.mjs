// Draws the share card of jepyso.com (Open Graph and X), 1200×630, one per language: the plaster studio with
// the bridge, the wordmark and the headline of the home. The cards are committed next to this file and hacer.py
// copies them; run this again only if the headline, the photo or the fonts change.
// Usage: node tools/sitio/tarjeta.mjs      (CHROMIUM_BIN as in tests/correr.sh)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
// playwright-core lives with the tests (tests/node_modules).
const { chromium } = createRequire(join(aqui, '..', '..', 'tests', 'package.json'))('playwright-core');
const app = join(aqui, '..', '..', 'app');
const b64 = (f) => readFileSync(f).toString('base64');
const foto = b64(join(app, 'imagenes', 'yeso-puente.webp'));
const display = b64(join(app, 'fuentes', 'red-hat-display.woff2'));
const texto = b64(join(app, 'fuentes', 'red-hat-text.woff2'));

const TITULARES = {
  es: { h: 'La rutina que mandas, al ritmo que mandas', p: 'Por un enlace, con una figura en 3D,<br>sin instalar nada' },
  en: { h: 'The routine you set, at the pace you set', p: 'As a link, with a 3D figure,<br>nothing to install' },
};

// As on the home: the words on the left, on the paper of the site; the studio with the figure on the right.
const pagina = ({ h, p }) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: D; src: url(data:font/woff2;base64,${display}) format('woff2'); font-weight: 300 900; }
@font-face { font-family: T; src: url(data:font/woff2;base64,${texto}) format('woff2'); font-weight: 300 700; }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
body { display: grid; grid-template-columns: 480px 720px; background: #e4e6e3; color: #1d2225; }
.texto { padding: 56px 40px 48px 56px; display: flex; flex-direction: column; }
.marca { font-family: D; font-size: 64px; font-weight: 500; letter-spacing: -0.035em; line-height: 1; margin: 0 0 auto; color: #1d2225; }
.marca span { font-weight: 300; }
h1 { font-family: D; font-size: 44px; font-weight: 500; letter-spacing: -0.015em; line-height: 1.08; margin: 0 0 18px; }
p { font-family: T; font-size: 22px; line-height: 1.35; margin: 0; color: #596165; }
.web { margin-top: 40px; font-weight: 600; letter-spacing: 0.03em; color: #1d2225; }
.foto { background: url(data:image/webp;base64,${foto}) no-repeat; background-size: 945px 630px; background-position: -60px 0; }
</style></head><body>
<div class="texto"><p class="marca">jepyso<span>°</span></p><h1>${h}</h1><p>${p}</p><p class="web">jepyso.com</p></div>
<div class="foto"></div>
</body></html>`;

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined });
try {
  const hoja = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [lengua, t] of Object.entries(TITULARES)) {
    await hoja.setContent(pagina(t), { waitUntil: 'load' });
    await hoja.evaluate(() => document.fonts.ready);
    await hoja.screenshot({ path: join(aqui, `tarjeta-${lengua}.jpg`), type: 'jpeg', quality: 86 });
    console.log(join(aqui, `tarjeta-${lengua}.jpg`));
  }
} finally {
  await navegador.close();
}
