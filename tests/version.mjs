// A new version reaches an open app: a copy of the app is served, opened, changed on the «server», and the page must
// offer «Actualizar», which brings the new version. sw.js compares each file it refreshes.
// Usage: node version.mjs <app folder> <port>      (CHROMIUM_BIN as in correr.sh)
import { chromium } from 'playwright-core';
import { cpSync, mkdtempSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const [app, puerto] = process.argv.slice(2);
const copia = mkdtempSync(join(tmpdir(), 'jepyso-version-'));
cpSync(app, copia, { recursive: true });
const servidor = spawn('python3', ['-I', '-m', 'http.server', puerto, '--bind', '127.0.0.1', '--directory', copia], { stdio: 'ignore' });
const base = `http://127.0.0.1:${puerto}/index.html`;
const fallos = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(60000);
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(base);
  await page.waitForFunction(() => navigator.serviceWorker?.controller);
  await page.reload();
  await page.waitForTimeout(3000);
  if (await page.locator('.nueva-version').count()) fallos.push('sin cambios, ofrece una versión nueva');
  appendFileSync(join(copia, 'app.js'), '\n// una versión nueva\n');
  await page.reload();
  try {
    await page.waitForSelector('.nueva-version', { timeout: 20000 });
  } catch {
    fallos.push('con app.js cambiado, no ofrece actualizar');
  }
  if (await page.locator('.nueva-version button').count()) {
    await Promise.all([page.waitForEvent('load'), page.click('.nueva-version button')]);
    await page.waitForTimeout(3000);
    const nueva = await page.evaluate(async () => (await (await fetch('app.js')).text()).includes('una versión nueva'));
    if (!nueva) fallos.push('tras «Actualizar», sigue la versión de antes');
    if (await page.locator('.nueva-version').count()) fallos.push('tras actualizar, vuelve a ofrecerlo');
  }
  if (errores.length) fallos.push(...errores.map((e) => `error: ${e}`));
} finally {
  await browser.close();
  servidor.kill();
  rmSync(copia, { recursive: true, force: true });
}
if (fallos.length) {
  console.error(`versión nueva, ${fallos.length} fallos:\n  ${fallos.join('\n  ')}`);
  process.exit(1);
}
console.log('versión nueva: se ofrece al cambiar la app y «Actualizar» la trae');
