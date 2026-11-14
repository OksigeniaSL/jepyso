// End-to-end walk through Jepyso: the builder, the link sheet, the person's routine (a short test routine), the
// rating screen, the finish screen, the morning-after question and the summary the professional receives. Runs in
// light and dark, wide and on a phone, saves screenshots and fails on a broken check or a console error.
// Usage: node recorrido.mjs <base url> <screenshot dir>   (CHROMIUM_BIN may point at a Chromium binary)
import { chromium } from 'playwright-core';

const [base, salida] = process.argv.slice(2);
if (!base || !salida) {
  console.error('Usage: node recorrido.mjs <base url> <screenshot dir>');
  process.exit(2);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_BIN || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const errores = [];
const avisos = [];
const fallos = [];
const comprobar = (condicion, que) => {
  if (!condicion) fallos.push(que);
};
const vigilar = (page, nombre) => {
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(`${nombre}: ${m.text()}`);
    if (m.type() === 'warning') avisos.push(`${nombre}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errores.push(`${nombre} pageerror: ${e.message}`));
};
const url = (tema, fragmento = '') => `${base}/index.html?tema=${tema}${fragmento}`;
// The figure renders on the CPU (SwiftShader). On a machine busy with other work a screenshot or a reload can take
// far longer than Playwright's 30 s default, so every step gets more room; a real hang still fails.
// Every screenshot prints the seconds since the start, so a slow run shows where its time went.
const inicio = Date.now();
const abrir = async (opciones) => {
  const page = await browser.newPage(opciones);
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);
  const foto = page.screenshot.bind(page);
  page.screenshot = async (o) => {
    // No page may spill sideways: on a phone that is a horizontal scroll nobody wants.
    const [ancho, ventana] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (ancho > ventana + 1) fallos.push(`${o.path.split('/').pop()}: la página se sale de lado (${ancho} px en ${ventana})`);
    // In CI the software renderer now and then never hands over a frame while a figure is moving (seen twice on
    // 13 November 2026, on different screenshots, both passing on a re-run): one more try, after a breath, before
    // calling it a failure. A page that truly hangs fails the second time too.
    let r;
    try {
      r = await foto({ timeout: 60000, ...o });
    } catch (e) {
      if (e.name !== 'TimeoutError') throw e;
      console.log(`      ${o.path.split('/').pop()}: la captura no salió en 60 s; otra vez`);
      await page.waitForTimeout(2000);
      r = await foto(o);
    }
    console.log(`${String(Math.round((Date.now() - inicio) / 1000)).padStart(5)} s  ${o.path.split('/').pop()}`);
    return r;
  };
  return page;
};

try {
  for (const tema of ['claro', 'oscuro']) {
    // Builder, wide: an empty routine, the library with its filters, the order, a template and the acceptable
    // discomfort lowered from 5 to 4, which travels inside the link.
    const ancho = await abrir({ viewport: { width: 1366, height: 768 } });
    vigilar(ancho, `armar-${tema}`);
    await ancho.goto(url(tema));
    await ancho.waitForTimeout(2500);
    comprobar((await ancho.locator('.rutina-armada .ejercicio').count()) === 0, `${tema}: la rutina nueva no empieza vacía`);
    await ancho.screenshot({ path: `${salida}/armar-1366-vacia-${tema}.png` });
    // Every row carries the still of its exercise, of the body chosen for the routine.
    // The stills load lazily: the first one is brought into view, and a still that never loads fails after 10 s instead
    // of holding the walk.
    const posterCargado = async () => {
      const img = ancho.locator('.biblio-fila .biblio-poster img').first();
      await img.scrollIntoViewIfNeeded();
      return img.evaluate((i) => Promise.race([i.decode().then(() => i.naturalWidth > 0, () => false), new Promise((r) => setTimeout(() => r(false), 10000))]));
    };
    await ancho.locator('.biblio-fila .biblio-poster').first().scrollIntoViewIfNeeded();
    comprobar(await posterCargado(), `${tema}: la primera fila no trae el póster de su ejercicio`);
    await ancho.click('[data-accion="cuerpo"][data-valor="b"]');
    const srcB = await ancho.locator('.biblio-fila .biblio-poster img').first().getAttribute('src');
    comprobar(srcB.startsWith('modelos/b/posters/') && (await posterCargado()), `${tema}: con la Figura 2, la fila no cambia de póster (${srcB})`);
    await ancho.click('[data-accion="cuerpo"][data-valor="a"]');
    for (const id of ['puente', 'silla', 'hombro']) await ancho.click(`.biblio-fila[data-id="${id}"] [data-accion="anadir"]`);
    await ancho.waitForTimeout(1200);
    const orden = () => ancho.$$eval('.rutina-armada .ejercicio', (t) => t.map((x) => x.dataset.id).join(','));
    comprobar((await orden()) === 'puente,silla,hombro', `${tema}: los añadidos no salen en su orden (${await orden()})`);
    comprobar((await ancho.locator('.biblio-dentro').count()) === 3, `${tema}: la biblioteca no marca lo que ya está en la rutina`);
    await ancho.click('.ejercicio[data-id="hombro"] [data-accion="subir"]');
    comprobar((await orden()) === 'puente,hombro,silla', `${tema}: subir no cambia el orden (${await orden()})`);
    // An exercise with a band: the professional picks the colour of the band they gave, and the folded card says it.
    await ancho.click('.ejercicio[data-id="hombro"] [data-accion="banda"][data-valor="roja"]');
    comprobar((await ancho.getAttribute('.ejercicio[data-id="hombro"] [data-accion="banda"][data-valor="roja"]', 'aria-pressed')) === 'true', `${tema}: la banda roja no queda elegida`);
    comprobar((await ancho.locator('.ejercicio[data-id="puente"] [data-accion="banda"]').count()) === 0, `${tema}: un ejercicio sin banda deja elegir su color`);
    await ancho.screenshot({ path: `${salida}/armar-1366-hombro-${tema}.png` });
    // Only the card being looked at is open; the others fold to their dose.
    const abiertas = () => ancho.locator('.ejercicio-ajustes:visible').count();
    comprobar((await abiertas()) === 1, `${tema}: hay ${await abiertas()} tarjetas abiertas a la vez`);
    await ancho.click('.ejercicio[data-id="silla"] .ejercicio-cabeza');
    comprobar((await ancho.locator('.ejercicio[data-id="silla"] .ejercicio-ajustes:visible').count()) === 1, `${tema}: la tarjeta tocada no se abre`);
    comprobar((await abiertas()) === 1, `${tema}: al abrir una tarjeta no se pliega la otra`);
    comprobar((await ancho.textContent('.ejercicio[data-id="hombro"] .dosis')).includes('3 × 12'), `${tema}: la tarjeta plegada no dice sus series y repeticiones`);
    comprobar((await ancho.textContent('.ejercicio[data-id="hombro"] .dosis')).includes('Banda roja'), `${tema}: la tarjeta plegada no dice el color de la banda`);
    await ancho.click('.ejercicio[data-id="silla"] .detalle summary');
    comprobar((await ancho.textContent('.ejercicio[data-id="silla"] .detalle')).includes('Fuente:'), `${tema}: la tarjeta no trae la explicación con su fuente`);
    await ancho.locator('.ejercicio[data-id="silla"] .detalle').scrollIntoViewIfNeeded();
    await ancho.screenshot({ path: `${salida}/armar-1366-explicacion-${tema}.png` });

    // Filters: area, muscle and words; each one narrows the library to what the catalogue says.
    // A long list goes under its starting positions, so the rows are compared as a set, not in catalogue order.
    const filas = () => ancho.$$eval('.biblio-fila', (t) => t.map((x) => x.dataset.id).sort().join(','));
    const esperado = (filtro) => ancho.evaluate(async (f) => (await import('./datos.js')).buscarEjercicios(f).sort().join(','), filtro);
    const total = await ancho.locator('.biblio-fila').count();
    await ancho.click('[data-accion="zona"][data-valor="hombro"]');
    const hombro = await filas();
    comprobar(hombro === (await esperado({ zona: 'hombro' })) && hombro.includes('hombro') && hombro.split(',').length < total, `${tema}: el filtro de hombro da ${hombro}`);
    comprobar((await ancho.locator('.mapa-halo.encendido').count()) === 2, `${tema}: el mapa no enciende los dos hombros`);
    await ancho.screenshot({ path: `${salida}/armar-1366-mapa-${tema}.png` });
    await ancho.click('[data-accion="zona"][data-valor=""]');
    await ancho.selectOption('[data-accion="musculo"]', 'cuadriceps');
    const cuadriceps = await filas();
    comprobar(cuadriceps === (await esperado({ musculo: 'cuadriceps' })) && cuadriceps.includes('silla') && !cuadriceps.includes('hombro'), `${tema}: el filtro de cuádriceps da ${cuadriceps}`);
    await ancho.selectOption('[data-accion="musculo"]', '');
    // A muscle touched on the map filters like the list, lights, and lets go when touched again.
    await ancho.click('.mapa-musculo[data-valor="cuadriceps"]');
    const delMapa = await filas();
    comprobar(delMapa === cuadriceps, `${tema}: el cuádriceps del mapa da ${delMapa} y la lista de músculos ${cuadriceps}`);
    comprobar((await ancho.inputValue('[data-accion="musculo"]')) === 'cuadriceps', `${tema}: la lista de músculos no sigue al mapa`);
    comprobar((await ancho.locator('.mapa-musculo.encendido').count()) >= 1, `${tema}: el músculo elegido no se enciende`);
    await ancho.click('.mapa-musculo[data-valor="cuadriceps"]');
    comprobar((await filas()).split(',').length === total, `${tema}: tocar otra vez el músculo no lo suelta`);
    await ancho.fill('[data-accion="buscar"]', 'gluteo');
    const gluteo = await filas();
    comprobar(gluteo === (await esperado({ texto: 'gluteo' })) && gluteo.split(',').includes('puente') && !gluteo.includes('hombro'), `${tema}: buscar «gluteo» da ${gluteo}`);
    await ancho.fill('[data-accion="buscar"]', 'sit to stand');
    comprobar((await filas()) === 'silla', `${tema}: buscar por otro nombre («sit to stand») da ${await filas()}`);
    await ancho.fill('[data-accion="buscar"]', 'nada parecido');
    comprobar((await ancho.locator('.biblio-vacia').count()) === 1, `${tema}: una búsqueda sin resultados no lo dice`);
    await ancho.fill('[data-accion="buscar"]', '');

    await ancho.click('[data-accion="tope"][data-delta="-1"]');
    comprobar((await ancho.textContent('.general .paso output')) === '4', `${tema}: el tope no baja a 4 en el constructor`);
    await ancho.locator('.general').scrollIntoViewIfNeeded();
    await ancho.screenshot({ path: `${salida}/armar-1366-tope-${tema}.png` });

    // Template: saved, the routine changes, the template brings it back; deleting asks first.
    await ancho.click('[data-accion="nueva-plantilla"]');
    await ancho.fill('[data-accion="nombre-plantilla"]', 'Rodilla y hombro, primera semana');
    await ancho.press('[data-accion="nombre-plantilla"]', 'Enter');
    comprobar((await ancho.locator('.plantilla').count()) === 1, `${tema}: la plantilla no se guarda`);
    await ancho.click('.ejercicio[data-id="silla"] [data-accion="quitar"]');
    await ancho.click('[data-accion="tope"][data-delta="1"]');
    comprobar((await orden()) === 'puente,hombro', `${tema}: quitar no saca el ejercicio (${await orden()})`);
    await ancho.locator('.plantillas').scrollIntoViewIfNeeded();
    await ancho.screenshot({ path: `${salida}/armar-1366-plantilla-${tema}.png` });
    await ancho.click('[data-accion="usar-plantilla"]');
    await ancho.waitForTimeout(800);
    comprobar((await orden()) === 'puente,hombro,silla', `${tema}: la plantilla no trae su rutina (${await orden()})`);
    comprobar((await ancho.textContent('.general .paso output')) === '4', `${tema}: la plantilla no trae su tope`);
    await ancho.click('[data-accion="borrar-plantilla"]');
    comprobar((await ancho.locator('.plantilla').count()) === 1, `${tema}: la plantilla se borra sin preguntar`);
    await ancho.click('[data-accion="borrar-plantilla"]');
    comprobar((await ancho.locator('.plantilla').count()) === 0, `${tema}: la plantilla no se borra al confirmar`);

    // With a name, the routine goes to that person's file.
    await ancho.fill('#para', 'Marta');
    await ancho.click('[data-accion="crear"]');
    await ancho.waitForTimeout(800);
    comprobar((await ancho.textContent('.hoja .en-ficha')).includes('Guardada en la ficha de Marta'), `${tema}: la rutina no dice que va a la ficha de Marta`);
    comprobar((await ancho.locator('.hoja a[href*="t.me/share"]').count()) === 1, `${tema}: el enlace no se puede mandar por Telegram`);
    await ancho.screenshot({ path: `${salida}/enlace-1366-${tema}.png` });
    const enlace = await ancho.textContent('.enlace-texto');
    const rutinaCreada = await ancho.evaluate(async (u) => {
      const { decodificar } = await import('./datos.js');
      return decodificar(u.split('#r=')[1]);
    }, enlace);
    comprobar(rutinaCreada.m === 4, `${tema}: el enlace no lleva el tope 4 (lleva ${rutinaCreada.m})`);
    comprobar(rutinaCreada.e.map((e) => e.i).join(',') === 'puente,hombro,silla', `${tema}: el enlace no lleva el orden elegido`);
    comprobar(rutinaCreada.e.find((e) => e.i === 'hombro')?.b === 'roja' && rutinaCreada.e.find((e) => e.i === 'puente')?.b === undefined, `${tema}: el enlace no lleva el color de la banda`);
    comprobar(/^\d{4}-\d{2}-\d{2}$/.test(rutinaCreada.f), `${tema}: la fecha del enlace no es un día`);
    console.log(`enlace (${tema}): ${enlace.length} caracteres`);

    // The person's file: the routine is there, and a summary the person sends back joins it, week by week.
    const personas = await ancho.evaluate(() => JSON.parse(localStorage.getItem('personas')));
    comprobar(personas?.length === 1 && personas[0].nombre === 'Marta' && personas[0].rutinas.length === 1, `${tema}: no hay ficha de Marta con su rutina`);
    comprobar(rutinaCreada.p === personas?.[0]?.id, `${tema}: el enlace no lleva el id de la ficha`);
    const resumenMarta = await ancho.evaluate(async (p) => {
      const { codificar, diaLocal } = await import('./datos.js');
      // Yesterday, marked, and two calm days in the week before: dates from today, so the walk does not age.
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const lunes = new Date(ayer);
      lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
      const antes = (n) => { const d = new Date(lunes); d.setDate(d.getDate() - n); return diaLocal(d); };
      const dia = (f, h, m, a) => ({ f, h, e: [{ i: 'puente', l: 'der', s: 2, r: 10, p: [10, 9], m }], ...(a === undefined ? {} : { a }) });
      return codificar({ v: 1, p, para: 'Marta', de: 'Daniel', m: 4, dias: [dia(antes(6), '10:00', 3, 2), dia(antes(4), '18:30', 4, 3), dia(diaLocal(ayer), '09:15', 6, 5)] });
    }, personas?.[0]?.id);
    await ancho.goto(url(tema, `#s=${resumenMarta}`));
    await ancho.waitForSelector('.en-ficha a');
    comprobar((await ancho.textContent('.en-ficha')).includes('Guardado en la ficha de Marta'), `${tema}: el resumen no se guarda en la ficha de Marta`);
    await ancho.reload();
    await ancho.waitForSelector('.en-ficha a');
    comprobar((await ancho.textContent('.en-ficha')).includes('Ya estaba en la ficha de Marta'), `${tema}: abrir el mismo resumen dos veces lo repite`);
    await ancho.click('.en-ficha a');
    await ancho.waitForSelector('.persona h1');
    comprobar((await ancho.locator('.semanas tbody tr').count()) === 2, `${tema}: la ficha no trae dos semanas`);
    comprobar((await ancho.locator('.semanas tr.sube').count()) === 1, `${tema}: la semana que sube no sale marcada`);
    comprobar((await ancho.locator('.lo-hecho .dia').count()) === 3 && (await ancho.locator('.lo-hecho .dia.marcado').count()) === 1, `${tema}: la ficha no trae sus tres sesiones con la marcada`);
    await ancho.fill('#notas', 'Rodilla derecha, prótesis en octubre.');
    await ancho.screenshot({ path: `${salida}/ficha-1366-${tema}.png`, fullPage: true });
    await ancho.reload();
    await ancho.waitForSelector('#notas');
    comprobar((await ancho.inputValue('#notas')) === 'Rodilla derecha, prótesis en octubre.', `${tema}: las notas de la ficha no se guardan`);
    await ancho.click('[data-accion="abrir-rutina"]');
    await ancho.waitForSelector('.rutina-armada');
    comprobar((await ancho.inputValue('#para')) === 'Marta' && (await ancho.locator('.recientes [aria-pressed="true"]').count()) === 1, `${tema}: abrir la rutina de la ficha no la trae a Marta`);
    comprobar((await orden()) === 'puente,hombro,silla', `${tema}: la rutina abierta desde la ficha no trae sus ejercicios`);

    // The list of people, and the copy in a file: saved, then loaded again without repeating anything.
    await ancho.goto(url(tema, '#personas'));
    await ancho.waitForSelector('.persona-fila');
    comprobar((await ancho.locator('.persona-fila').count()) === 1 && (await ancho.textContent('.persona-fila')).includes('Pasó de 4'), `${tema}: Mis personas no avisa de que Marta pasó de 4`);
    await ancho.screenshot({ path: `${salida}/personas-1366-${tema}.png` });
    const [descarga] = await Promise.all([ancho.waitForEvent('download'), ancho.click('[data-accion="exportar"]')]);
    const copiaRuta = `${salida}/copia-${tema}.json`;
    await descarga.saveAs(copiaRuta);
    comprobar(descarga.suggestedFilename().startsWith('jepyso-personas-'), `${tema}: la copia no se llama jepyso-personas-…`);
    await ancho.setInputFiles('[data-accion="importar"]', copiaRuta);
    await ancho.waitForFunction(() => document.querySelector('.aviso-copia')?.textContent.startsWith('Copia cargada'));
    comprobar((await ancho.textContent('.aviso-copia')).includes('ninguna nueva') && (await ancho.locator('.persona-fila').count()) === 1, `${tema}: cargar la copia repite personas`);

    // The free version keeps five people with a file: a sixth still gets her routine, without a file.
    await ancho.evaluate(() => {
      const l = JSON.parse(localStorage.getItem('personas'));
      for (let i = l.length; i < 5; i++) l.push({ id: `relleno${i}`, nombre: `Persona ${i}`, notas: '', creada: '2026-11-01', rutinas: [], dias: [] });
      localStorage.setItem('personas', JSON.stringify(l));
    });
    await ancho.goto(url(tema));
    await ancho.waitForSelector('#para');
    await ancho.fill('#para', 'Sexta');
    await ancho.click('[data-accion="crear"]');
    await ancho.waitForSelector('.hoja .enlace-texto');
    comprobar((await ancho.textContent('.hoja')).includes('el máximo de la versión gratis'), `${tema}: con 5 fichas no avisa del máximo de la versión gratis`);
    comprobar((await ancho.evaluate(() => JSON.parse(localStorage.getItem('personas')).length)) === 5, `${tema}: con 5 fichas se crea una sexta`);
    await ancho.close();

    if (tema === 'claro') {
      const muyAncho = await abrir({ viewport: { width: 1800, height: 1000 } });
      vigilar(muyAncho, 'armar-1800');
      await muyAncho.goto(url(tema));
      for (const id of ['puente', 'hombro']) await muyAncho.click(`.biblio-fila[data-id="${id}"] [data-accion="anadir"]`);
      await muyAncho.waitForTimeout(2000);
      await muyAncho.screenshot({ path: `${salida}/armar-1800-claro.png` });
      await muyAncho.close();
    }

    // Builder on a phone: the preview goes inside the row looked at, then inside the card once added.
    const movil = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    vigilar(movil, `movil-${tema}`);
    // The builder on the phone at the app's low quality (no shadows, lower resolution): in CI's software renderer, the
    // big figure of a library row at full quality and double density never handed over a frame for the screenshot.
    // Full quality is still walked on the wide screens and in the person's routine.
    await movil.goto(url(tema, '&calidad=baja'));
    await movil.waitForTimeout(1500);
    await movil.screenshot({ path: `${salida}/armar-movil-${tema}.png` });
    // On a phone the library is not in the page: «Añadir ejercicio» opens it over the whole screen, with the search on top.
    comprobar(!(await movil.locator('.biblioteca').isVisible()), `${tema}: en el móvil, la biblioteca sale en la página antes de pedirla`);
    // With the routine empty, «Añadir ejercicio» is the button of the bar, at the thumb, in the first screen.
    const enBarra = movil.locator('.barra-crear [data-accion="abrir-biblioteca"]');
    comprobar((await enBarra.isVisible()) && !(await movil.locator('[data-accion="crear"]').isVisible()), `${tema}: en el móvil, con la rutina vacía, la barra no ofrece «Añadir ejercicio»`);
    const barraVacia = await movil.evaluate(() => document.querySelector('.barra-crear').getBoundingClientRect().height);
    comprobar(barraVacia < 90, `${tema}: en el móvil, con la rutina vacía, la barra de abajo crece (${Math.round(barraVacia)} px)`);
    await enBarra.click();
    // The sheet slides in: measure once its animation has finished, however busy the machine is.
    const hoja = await movil.evaluate(async () => {
      const el = document.querySelector('.biblioteca');
      await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
      const r = el.getBoundingClientRect();
      const buscar = document.querySelector('.biblioteca .buscar').getBoundingClientRect();
      return { arriba: r.top, alto: r.height, buscar: buscar.top, dialogo: document.querySelector('.biblioteca').getAttribute('role') };
    });
    comprobar(hoja.arriba <= 1 && hoja.alto >= 840 && hoja.buscar < 200 && hoja.dialogo === 'dialog', `${tema}: en el móvil, la biblioteca no se abre a pantalla completa con el buscador arriba (${JSON.stringify(hoja)})`);
    comprobar(!(await movil.locator('.hueco-mapa').isVisible()), `${tema}: en el móvil, el mapa se pone antes que la lista`);
    await movil.screenshot({ path: `${salida}/armar-movil-biblioteca-${tema}.png` });
    // The phone's «back» closes it, and the page is still the builder.
    await movil.goBack();
    await movil.waitForTimeout(300);
    comprobar(!(await movil.locator('.biblioteca').isVisible()) && (await movil.locator('.armar').count()) === 1, `${tema}: en el móvil, «atrás» no cierra la biblioteca`);
    await enBarra.click();
    await movil.click('[data-accion="ver-mapa"]');
    comprobar(await movil.locator('.hueco-mapa').isVisible(), `${tema}: en el móvil, «En la figura» no abre el mapa`);
    await movil.click('[data-accion="ver-mapa"]');
    await movil.click('.biblio-fila[data-id="silla"] .biblio-ver');
    await movil.waitForTimeout(1800);
    comprobar((await movil.locator('.biblio-fila.activo[data-id="silla"] .mini-figura canvas').count()) === 1, `${tema}: en el móvil, la fila mirada no enseña la figura`);
    await movil.locator('.biblio-fila[data-id="silla"]').scrollIntoViewIfNeeded();
    await movil.screenshot({ path: `${salida}/armar-movil-ver-${tema}.png` });
    await movil.click('.biblio-fila[data-id="puente"] [data-accion="anadir"]');
    await movil.waitForTimeout(1800);
    // Choosing one goes back to the routine, with its settings open and in sight.
    comprobar(!(await movil.locator('.biblioteca').isVisible()), `${tema}: en el móvil, añadir no vuelve a la rutina`);
    const tarjeta = await movil.evaluate(() => {
      const t = document.querySelector('.ejercicio[data-id="puente"]');
      const r = t.querySelector('.ejercicio-ajustes').getBoundingClientRect();
      return { abierta: t.classList.contains('activo'), arriba: r.top, abajo: innerHeight };
    });
    comprobar(tarjeta.abierta && tarjeta.arriba > 0 && tarjeta.arriba < tarjeta.abajo * 0.6, `${tema}: en el móvil, el ejercicio añadido no queda abierto a la vista (${JSON.stringify(tarjeta)})`);
    // And it stays there: the «back» that closes the sheet must not bring the page back to where it was.
    await movil.waitForTimeout(1200);
    const sigue = await movil.evaluate(() => document.querySelector('.ejercicio[data-id="puente"] .ejercicio-ajustes').getBoundingClientRect().top);
    comprobar(sigue > 0 && sigue < tarjeta.abajo * 0.6, `${tema}: en el móvil, el ejercicio añadido se va de la vista al cerrar la biblioteca (${Math.round(sigue)})`);
    const barra = await movil.evaluate(() => document.querySelector('.barra-crear').getBoundingClientRect().height);
    comprobar(barra < 90, `${tema}: en el móvil, la barra de abajo crece (${Math.round(barra)} px)`);
    comprobar((await movil.locator('.ejercicio[data-id="puente"] .mini-figura canvas').count()) === 1, `${tema}: en el móvil, la tarjeta añadida no enseña la figura`);
    await movil.screenshot({ path: `${salida}/armar-movil-anadido-${tema}.png` });
    // With something in the routine, the bar offers the link again, and «Añadir ejercicio» is the big button under the list.
    comprobar((await movil.locator('[data-accion="crear"]').isVisible()) && !(await enBarra.isVisible()), `${tema}: en el móvil, con un ejercicio, la barra no vuelve a «Crear enlace»`);
    comprobar(await movil.locator('.anadir-ejercicio').isVisible(), `${tema}: en el móvil, no hay «Añadir ejercicio» bajo la rutina`);
    // A second one, and that one opens in front too.
    await movil.click('.anadir-ejercicio');
    await movil.click('.biblio-fila[data-id="hombro"] [data-accion="anadir"]');
    await movil.waitForTimeout(1200);
    comprobar((await movil.locator('.ejercicio.activo').getAttribute('data-id')) === 'hombro', `${tema}: en el móvil, el segundo añadido no se abre`);
    // The bar at the top covers the strip above it (the address bar of Safari on the iPhone lets the page show there).
    const faldon = await movil.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.barra-app'), '::before');
      return cs.content !== 'none' && parseFloat(cs.height) > 100 && cs.backgroundColor === getComputedStyle(document.querySelector('.barra-app')).backgroundColor;
    });
    comprobar(faldon, `${tema}: la barra de arriba no tapa la franja de encima`);
    await movil.screenshot({ path: `${salida}/armar-movil-entera-${tema}.png`, fullPage: true });

    // A short routine so the walk takes seconds: two sets of two reps, then the shoulder on both sides. Tope 4.
    const codigo = await movil.evaluate(async () => {
      const { codificar } = await import('./datos.js');
      return codificar({
        v: 1, para: 'Marta', de: 'Daniel', d: 5, x: 2, m: 4, f: '2026-11-10',
        e: [
          { i: 'puente', s: 2, r: 2, t: [1, 1, 1], n: 'Sin dolor. Si molesta, sube menos.' },
          { i: 'hombro', s: 1, r: 2, t: [1, 0, 1], l: 'ambos', b: 'roja' },
        ],
      });
    });
    // In the routine of the person, each exercise with its still, of their figure and their side: the left one in mirror.
    const izquierda = await movil.evaluate(async () => (await import('./datos.js')).codificar({
      v: 1, c: 'b', d: 5, x: 1, m: 5, f: '2026-11-10', e: [{ i: 'hombro', s: 1, r: 2, t: [1, 0, 1], l: 'izq' }],
    }));
    await movil.goto(url(tema, `#r=${izquierda}`));
    await movil.waitForSelector('.tarjeta-poster img');
    const espejo = movil.locator('.tarjeta-poster img').first();
    comprobar((await espejo.getAttribute('src')) === 'modelos/b/posters/hombro.webp', `${tema}: la rutina no trae el póster de su figura`);
    comprobar((await espejo.getAttribute('class')) === 'espejo', `${tema}: el lado izquierdo no sale en espejo`);
    await movil.goto(url(tema, `#r=${codigo}`));
    await movil.evaluate(() => localStorage.clear());
    await movil.reload();
    await movil.waitForTimeout(800);
    comprobar((await movil.locator('.manana').count()) === 0, `${tema}: la pregunta de la mañana sale sin sesión del día anterior`);
    const posters = movil.locator('.tarjeta-poster img');
    comprobar((await posters.count()) === 2 && (await posters.first().evaluate((i) => Promise.race([i.decode().then(() => i.naturalWidth > 0, () => false), new Promise((r) => setTimeout(() => r(false), 10000))]))),
      `${tema}: las tarjetas de la rutina no traen su póster`);
    comprobar((await movil.locator('.tarjeta-poster img.espejo').count()) === 0, `${tema}: un ejercicio de los dos lados sale en espejo`);
    comprobar((await movil.locator('.tarjeta .con-banda').count()) === 1 && (await movil.textContent('.tarjeta .con-banda')).includes('Banda roja'), `${tema}: la rutina no dice el color de la banda`);
    comprobar((await posters.nth(1).getAttribute('src')) === 'modelos/posters/hombro-roja.webp' && (await posters.nth(1).evaluate((i) => Promise.race([i.decode().then(() => i.naturalWidth > 0, () => false), new Promise((r) => setTimeout(() => r(false), 10000))]))),
      `${tema}: el póster no enseña la banda del color elegido`);
    await movil.screenshot({ path: `${salida}/rutina-movil-${tema}.png` });
    await movil.click('[data-r="empezar"]');
    // A new exercise waits for «Estoy en posición», with no clock, and the button stays in sight.
    await movil.waitForSelector('[data-r="en-posicion"]', { timeout: 20000 });
    comprobar((await movil.locator('.prepara-partida').count()) === 1, `${tema}: al empezar no dice cómo ponerse`);
    comprobar(await movil.locator('[data-r="en-posicion"]').evaluate((b) => b.getBoundingClientRect().bottom <= innerHeight + 1), `${tema}: «Estoy en posición» se sale de la pantalla`);
    await movil.waitForTimeout(600);
    await movil.screenshot({ path: `${salida}/preparate-movil-${tema}.png` });
    await movil.waitForTimeout(2500);
    comprobar((await movil.locator('[data-r="en-posicion"]').count()) === 1, `${tema}: la preparación arranca sola sin esperar a la persona`);
    await movil.click('[data-r="en-posicion"]');
    await movil.waitForTimeout(1200);
    await movil.screenshot({ path: `${salida}/cuenta-movil-${tema}.png` });
    await movil.waitForTimeout(5900);
    await movil.screenshot({ path: `${salida}/serie-movil-${tema}.png` });
    // The figure is drawn at the shape of its box: the sheet grows from the countdown to the series, and a picture
    // left at the old size would show the body stretched.
    const forma = await movil.evaluate(() => {
      const c = document.querySelector('.escena canvas');
      const r = c.getBoundingClientRect();
      return Math.abs(c.width / c.height - r.width / r.height);
    });
    comprobar(forma < 0.02, `${tema}: en la serie, la figura sale estirada (${forma.toFixed(2)})`);
    await movil.click('[data-r="como"]');
    comprobar((await movil.locator('.hoja .explicacion .partida').count()) === 1, `${tema}: «Cómo se hace» no trae la posición de partida`);
    await movil.waitForTimeout(400); // the sheet fades in for 0.18 s
    await movil.screenshot({ path: `${salida}/como-movil-${tema}.png` });
    await movil.click('.hoja .boton');
    await movil.waitForSelector('.anillo', { timeout: 20000 });
    await movil.screenshot({ path: `${salida}/descanso-movil-${tema}.png` });
    await movil.click('[data-r="ya"]');
    // Rating, one question at a time: the repetitions first, and «Hice menos» alone opens the − and +.
    await movil.waitForSelector('[data-r="todas"]', { timeout: 20000 });
    comprobar((await movil.locator('.jugador.valorando .escena').isVisible()) === false, `${tema}: al valorar sigue la figura en 3D`);
    await movil.screenshot({ path: `${salida}/valorar-reps-movil-${tema}.png` });
    await movil.click('[data-r="menos"]');
    await movil.click('[data-accion="h-0-0"][data-delta="-1"]');
    comprobar((await movil.textContent('.serie-fila output')) === '1' && !(await movil.locator('[data-accion="h-0-0"][data-delta="-1"]').isDisabled()), `${tema}: al bajar una serie, el «−» no sigue vivo`);
    await movil.click('[data-r="reps-listo"]');
    comprobar((await movil.getAttribute('[data-r="continuar"]', 'aria-disabled')) === 'true', `${tema}: se puede seguir sin marcar la molestia`);
    comprobar(await movil.locator('[data-r="continuar"]').evaluate((b) => b.getBoundingClientRect().bottom <= innerHeight + 1), `${tema}: el botón de seguir se sale de la pantalla al valorar`);
    await movil.click('[data-r="molestia"][data-v="3"]');
    comprobar((await movil.textContent('.aviso-molestia')) === '', `${tema}: aviso con una molestia de 3 y tope 4`);
    await movil.screenshot({ path: `${salida}/valorar-movil-${tema}.png` });
    await movil.click('[data-r="continuar"]');
    // Shoulder: getting ready (with the band in its colour), right side, then the left after a rest, then rating above the level.
    await movil.waitForSelector('[data-r="en-posicion"]', { timeout: 30000 });
    comprobar((await movil.textContent('.prepara-material')).includes('banda roja'), `${tema}: la preparación no dice qué banda usar`);
    await movil.click('[data-r="en-posicion"]');
    await movil.waitForSelector('.anillo', { timeout: 30000 });
    await movil.screenshot({ path: `${salida}/cambio-lado-movil-${tema}.png` });
    await movil.click('[data-r="ya"]');
    await movil.waitForTimeout(1500);
    await movil.screenshot({ path: `${salida}/serie-izquierda-movil-${tema}.png` });
    await movil.waitForSelector('[data-r="todas"]', { timeout: 30000 });
    await movil.click('[data-r="todas"]');
    await movil.click('[data-r="molestia"][data-v="6"]');
    comprobar((await movil.textContent('.aviso-molestia')).includes('Es más de 4'), `${tema}: sin aviso con una molestia de 6 y tope 4`);
    await movil.screenshot({ path: `${salida}/valorar-alta-movil-${tema}.png` });
    await movil.click('[data-r="continuar"]');
    await movil.waitForTimeout(500);
    comprobar((await movil.locator('.dia.marcado').count()) === 1, `${tema}: el día con molestia 6 no sale marcado al terminar`);
    comprobar((await movil.locator('[data-r="mandar"][data-canal="wa"]').count()) === 1 && (await movil.locator('[data-r="mandar"][data-canal="tg"]').count()) === 1, `${tema}: al terminar no se puede mandar por WhatsApp y por Telegram`);
    await movil.screenshot({ path: `${salida}/final-movil-${tema}.png` });

    // Next day at ten in the morning: the session moves to yesterday and the routine asks about getting up.
    await movil.clock.setFixedTime(new Date(Date.now() + 86400e3).setHours(10, 0, 0, 0));
    await movil.evaluate(async () => {
      const { diaAnterior } = await import('./datos.js');
      const clave = Object.keys(localStorage).find((k) => k.startsWith('hist:'));
      const hist = JSON.parse(localStorage.getItem(clave));
      hist.at(-1).f = diaAnterior();
      localStorage.setItem(clave, JSON.stringify(hist));
    });
    await movil.reload();
    await movil.waitForTimeout(800);
    comprobar((await movil.locator('.manana').count()) === 1, `${tema}: no sale la pregunta de la mañana`);
    await movil.screenshot({ path: `${salida}/manana-movil-${tema}.png` });
    await movil.click('[data-r="manana"][data-v="5"]');
    const apuntado = await movil.textContent('.manana');
    comprobar(apuntado.includes('Apuntado: 5 de 10') && apuntado.includes('Es más de 4'), `${tema}: la respuesta de la mañana no se apunta bien («${apuntado.trim()}»)`);
    await movil.screenshot({ path: `${salida}/manana-apuntado-movil-${tema}.png` });
    await movil.reload();
    await movil.waitForTimeout(500);
    comprobar((await movil.locator('.manana').count()) === 0, `${tema}: la pregunta de la mañana se repite tras contestarla`);

    // The summary link the person sends back, read by the professional.
    const resumen = await movil.evaluate(async () => {
      const { codificar } = await import('./datos.js');
      const clave = Object.keys(localStorage).find((k) => k.startsWith('hist:'));
      const dias = JSON.parse(localStorage.getItem(clave));
      return codificar({ v: 1, para: 'Marta', de: 'Daniel', m: 4, dias });
    });
    await movil.goto(url(tema, `#s=${resumen}`));
    await movil.waitForTimeout(600);
    const cabecera = await movil.textContent('.saludo');
    comprobar(/La molestia pasó de 4 el \S+ \d+\./.test(cabecera), `${tema}: el resumen no nombra el día que pasó de 4`);
    comprobar((await movil.locator('.dia.marcado').count()) === 1, `${tema}: el resumen no marca el día`);
    comprobar((await movil.locator('.manana-linea').count()) === 1, `${tema}: el resumen no trae la mañana siguiente`);
    await movil.screenshot({ path: `${salida}/resumen-movil-${tema}.png` });

    // A routine link from before the level existed (no m) still opens, with 5.
    const antiguo = await movil.evaluate(async () => {
      const { codificar } = await import('./datos.js');
      return codificar({ v: 1, para: 'Marta', de: 'Daniel', dias: [{ f: '2026-11-09', h: '10:00', e: [{ i: 'puente', l: 'der', s: 1, r: 10, p: [10], m: 5 }] }] });
    });
    // The person's file at phone width, from this phone's own sessions.
    const idFicha = await movil.evaluate(async () => {
      const P = await import('./personas.js');
      const lista = P.leerPersonas();
      const clave = Object.keys(localStorage).find((k) => k.startsWith('hist:'));
      const p = P.crearPersona(lista, 'Marta');
      P.apuntarResumen(p, { m: 4, dias: JSON.parse(localStorage.getItem(clave)) });
      P.guardarPersonas(lista);
      return p.id;
    });
    await movil.goto(url(tema, `#persona=${idFicha}`));
    await movil.waitForSelector('.persona h1');
    await movil.screenshot({ path: `${salida}/ficha-movil-${tema}.png`, fullPage: true });
    await movil.goto(url(tema, '#personas'));
    await movil.waitForSelector('.persona-fila');
    await movil.screenshot({ path: `${salida}/personas-movil-${tema}.png` });

    await movil.goto(url(tema, `#s=${antiguo}`));
    await movil.waitForTimeout(400);
    comprobar((await movil.textContent('.saludo')).includes('no pasó de 5'), `${tema}: un resumen sin tope no usa 5`);
    await movil.close();

    // Without a connection: a new phone opens the routine once, then does it with no signal at all.
    const sinRed = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    vigilar(sinRed, `sin-conexion-${tema}`);
    await sinRed.goto(url(tema, `#r=${codigo}`));
    try {
      await sinRed.waitForFunction(() => document.querySelector('.sin-conexion')?.textContent.length > 0, null, { timeout: 60000 });
    } catch {
      comprobar(false, `${tema}: la rutina no dice que queda guardada para hacerla sin conexión`);
    }
    await sinRed.screenshot({ path: `${salida}/guardada-movil-${tema}.png`, fullPage: true });
    await sinRed.context().setOffline(true);
    await sinRed.reload();
    await sinRed.waitForSelector('[data-r="empezar"]', { timeout: 10000 });
    comprobar(await sinRed.locator('.tarjeta-poster img').first().evaluate((i) => Promise.race([i.decode().then(() => i.naturalWidth > 0, () => false), new Promise((r) => setTimeout(() => r(false), 10000))])),
      `${tema}: sin conexión, la tarjeta no trae su póster`);
    await sinRed.click('[data-r="empezar"]');
    try {
      await sinRed.waitForSelector('[data-r="en-posicion"]', { timeout: 15000 });
      await sinRed.click('[data-r="en-posicion"]');
      await sinRed.waitForSelector('.j-fase', { timeout: 15000 });
      await sinRed.waitForTimeout(1200);
      comprobar((await sinRed.locator('.escena canvas').count()) === 1, `${tema}: sin conexión, la figura no sale`);
    } catch {
      comprobar(false, `${tema}: sin conexión, la serie no empieza`);
    }
    await sinRed.screenshot({ path: `${salida}/sin-conexion-serie-movil-${tema}.png` });
    await sinRed.context().setOffline(false);
    await sinRed.close();

    // The paid version (switched on with ?pago=1 until the licence is settled): Personas offers the Google Drive and the
    // files have no limit. Nothing reaches Google until the professional taps; that is tests/drive.mjs.
    const pago = await abrir({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: tema === 'oscuro' ? 'dark' : 'light' });
    vigilar(pago, `pago-${tema}`);
    await pago.goto(url(tema, '&pago=1#personas'));
    await pago.waitForSelector('.lista-personas');
    comprobar(await pago.locator('.nube [data-accion="drive"]').isVisible(), `${tema}: la versión de pago no ofrece el Drive en Personas`);
    comprobar((await pago.textContent('.aviso-nube')).includes('sin conectar'), `${tema}: el Drive no dice que aún no se ha conectado`);
    await pago.goto(url(tema, '&pago=0#personas'));
    await pago.waitForSelector('.lista-personas');
    comprobar((await pago.locator('.nube').count()) === 0, `${tema}: la versión gratis enseña el Drive`);
    await pago.close();
  }
} finally {
  await browser.close();
}

if (avisos.length) console.log(`avisos de consola (no cuentan como fallo):\n  ${[...new Set(avisos)].join('\n  ')}`);
if (errores.length) fallos.push(...errores.map((e) => `consola: ${e}`));
if (fallos.length) {
  console.error(`FALLOS (${fallos.length}):\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('todo bien: sin fallos ni errores en consola');
