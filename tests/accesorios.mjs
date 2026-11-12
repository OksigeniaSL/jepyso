// Every exercise in a row, as a routine plays them: each prop track of a clip must move its own prop. Props of
// different exercises share node names (every band has «banda_mano», every hand weight «mancuerna_hueso»), and an
// animation mixer that keeps old bindings moves the props of the previous exercise instead, leaving the new ones
// still. Fails listing the tracks whose prop does not follow its clip.
// Usage: node accesorios.mjs <base url>   (CHROMIUM_BIN may point at a Chromium binary)
import { chromium } from 'playwright-core';

const [base] = process.argv.slice(2);
if (!base) {
  console.error('Usage: node accesorios.mjs <base url>');
  process.exit(2);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.setDefaultTimeout(300000);
const errores = [];
page.on('pageerror', (e) => errores.push(e.message));
await page.goto(`${base}/index.html`);

const { fallos, revisadas } = await page.evaluate(async () => {
  const { Figura } = await import('./figura.js');
  const fallos = [];
  let revisadas = 0;
  for (const ruta of ['modelos/ejercicios.json', 'modelos/b/ejercicios.json']) {
    const manifiesto = await (await fetch(ruta)).json();
    const caja = document.createElement('div');
    caja.style.cssText = 'position:fixed;left:-400px;top:0;width:192px;height:144px';
    document.body.append(caja);
    const figura = new Figura(caja, manifiesto, { calidad: 'baja' });
    figura.renderer.setAnimationLoop(null);
    for (const id of Object.keys(manifiesto.ejercicios)) {
      await figura.poner(id);
      const clip = figura.accion.getClip();
      // Only real props: a clip without them hands over its whole scene, the file's copy of the skeleton included,
      // which the body's own bones animate in its place.
      const nodos = new Map();
      if (figura.accesorios?.name === 'accesorios') figura.accesorios.traverse((o) => nodos.set(o.name, o));
      // Halfway through «up»: where a prop that moves is away from where it starts.
      const t = (figura.fases.subir[0] + figura.fases.subir[1]) / 2;
      figura.posar(t);
      for (const pista of clip.tracks) {
        const punto = pista.name.lastIndexOf('.');
        const nodo = nodos.get(pista.name.slice(0, punto));
        const prop = pista.name.slice(punto + 1);
        if (!nodo || !['position', 'quaternion', 'scale'].includes(prop)) continue;
        revisadas++;
        const esperado = pista.createInterpolant().evaluate(t);
        const real = nodo[prop].toArray();
        // A quaternion and its negative are the same turn.
        const dif = (signo) => Math.max(...real.map((x, i) => Math.abs(x - signo * esperado[i])));
        const d = prop === 'quaternion' ? Math.min(dif(1), dif(-1)) : dif(1);
        if (d > 1e-3) fallos.push(`${ruta} ${id}: ${pista.name} no sigue su clip (${d.toFixed(3)})`);
      }
    }
    figura.renderer.dispose();
    caja.remove();
  }
  return { fallos, revisadas };
});
await browser.close();

if (errores.length) console.error(errores.join('\n'));
if (fallos.length) console.error(fallos.join('\n'));
if (errores.length || fallos.length || !revisadas) process.exit(1);
console.log(`accesorios: ${revisadas} pistas, cada una mueve su accesorio`);
