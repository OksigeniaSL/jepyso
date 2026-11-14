// The page's own content policy must allow its import map: the hash in the <meta> is the one of the map's text.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
const mapa = html.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1];
const politica = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
if (!mapa || !politica) throw new Error('index.html: falta el import map o la política de contenido');
const huella = `'sha256-${createHash('sha256').update(mapa).digest('base64')}'`;
if (!politica.includes(huella)) throw new Error(`index.html: la política no lleva la huella del import map (${huella})`);
if (/unsafe-inline|unsafe-eval/.test(politica)) throw new Error('index.html: la política no debe llevar unsafe-inline ni unsafe-eval');
// The accessibility panel's style hashes: the test server's strict policy (servir.py --csp) must allow the same styles
// as the page, or the walk on the strict copy would see the panel refused.
const estilos = (texto) => texto.match(/style-src ([^;"]+)/)?.[1].trim().split(/\s+/).sort().join(' ');
const servir = readFileSync(new URL('./servir.py', import.meta.url), 'utf8').match(/CSP = \(([\s\S]*?)\)\n/)?.[1];
const politicaServir = servir && [...servir.matchAll(/"([^"]*)"/g)].map((m) => m[1]).join('');
if (!politicaServir || estilos(politicaServir) !== estilos(politica)) {
  throw new Error(`servir.py: su style-src no es el de index.html\n  index.html: ${estilos(politica)}\n  servir.py:  ${politicaServir && estilos(politicaServir)}`);
}
console.log('política de contenido: bien');
