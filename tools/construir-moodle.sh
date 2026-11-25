#!/usr/bin/env bash
# Builds the player of the Moodle activity (mod_oksigeniajepyso) into <plugin>/reproductor/, and its page into
# <plugin>/templates/player.mustache: the strict copy of tools/construir.sh with what a Moodle plugin needs.
#  - tools/moodle/entorno.js in the place of app/entorno.js: the course instead of the professional's people. With it
#    go the modules only that one uses (people, cloud, licence, free files…), their texts and their styles: nothing in
#    the copy sells anything, calls anyone outside the site or leads there. The script checks it before it ends.
#  - No page of its own: player.php and builder.php of the plugin, from tools/moodle/player.mustache.
#  - Every import carries the version of the copy, so a browser never mixes the modules of two versions.
#  - vendor/ becomes libs/: the server configurations Moodle recommends answer 404 to any path with /vendor/.
#  - No worker and no manifest of its own: the plugin serves the app and the course keeps the sessions.
#  - The models of the free sample only (MUESTRA, below), or all of them with --todo; the two lists of clips
#    (modelos/ejercicios.json and modelos/b/ejercicios.json) say just those.
#  - modelos/LICENSE.md: the content of the package (sample, headers, icon, body map) under CC BY-SA 4.0, with the
#    sheets of the twelve movements in modelos/fichas/.
#  - voz/: the recorded voice, with only the sentences of the exercises this copy brings.
#  - catalogo.json: every exercise of the library with its name and its unit, and whether this copy brings it. The
#    plugin's PHP reads it to describe the routine and to warn about exercises the site does not have.
# Usage: tools/construir-moodle.sh <plugin folder> [--todo]
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
PLUGIN=${1:?plugin folder}
[ -f "$PLUGIN/version.php" ] && grep -q "mod_oksigeniajepyso" "$PLUGIN/version.php" || { echo "$PLUGIN is not mod_oksigeniajepyso" >&2; exit 1; }
TODO=${2:-}
# The free sample: twelve everyday exercises for the whole body, with no material but a chair, a mat or a firm support.
MUESTRA="silla puente hombro sentadilla talones equilibrio plancha_rodillas bird_dog gato_camello almeja extension_rodilla rodilla_pecho"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
"$ROOT/tools/construir.sh" "$TMP/web" >/dev/null
W=$TMP/web
mv "$W/vendor" "$W/libs"
rm -f "$W/sw.js" "$W/manifest.json" "$W/index.html"
# The course in the place of the professional's side, and what only that side uses.
cp "$ROOT/tools/moodle/entorno.js" "$W/entorno.js"
for f in personas nube drive dropbox onedrive oauth sincronia licencia vales tienda conectar; do rm "$W/$f.js"; done
rm -r "$W/conectar.html" "$W/libs/qrcode"
# Nor the file that vouches for the Android app, which is app.jepyso.com's.
rm -f "$W/.well-known/assetlinks.json" && rmdir "$W/.well-known"
# The content of the package (the sample, the headers, the icon, the body map) under CC BY-SA 4.0, which the Moodle
# Marketplace accepts as GPL-compatible (Oksigenia, 15-11-2026), with the sheets the twelve
# movements are built from.
cp "$ROOT/tools/moodle/LICENSE.md" "$ROOT/tools/moodle/CC-BY-SA-4.0.txt" "$W/modelos/"
mkdir -p "$W/modelos/fichas"
for id in $MUESTRA; do cp "$ROOT/figuras/fichas/$id.json" "$W/modelos/fichas/"; done
python3 -I - "$W" "$TODO" $MUESTRA <<'PY'
import json, os, re, sys
w, todo, muestra = sys.argv[1], sys.argv[2] == '--todo', set(sys.argv[3:])
# Paths with vendor/ in the code and the page, now libs/.
for raiz, _, ficheros in os.walk(w):
    for f in ficheros:
        if f.endswith(('.js', '.html', '.css')) and '/libs/' not in raiz + '/':
            p = os.path.join(raiz, f)
            s = open(p, encoding='utf-8').read()
            n = re.sub(r"(?<![A-Za-z0-9_-])vendor/", 'libs/', s)
            if n != s:
                open(p, 'w', encoding='utf-8').write(n)
# The styles of what is not here.
p = os.path.join(w, 'estilos.css')
s = open(p, encoding='utf-8').read()
n, k = re.subn(r'/\* \[app\.jepyso\.com\][^\n]*\n.*?/\* \[/app\.jepyso\.com\] \*/\n', '', s, flags=re.S)
if not k:
    sys.exit('estilos.css: the marks of [app.jepyso.com] are missing')
open(p, 'w', encoding='utf-8').write(n)
# The accessibility panel signs with a link to Oksigenia's website; here, with its name.
p = os.path.join(w, 'libs/oksigenia-access-panel/oksigenia-access-panel.js')
s = open(p, encoding='utf-8').read()
n, k = re.subn(r'<a href="https://oksigenia\.com"[^>]*>Oksigenia</a>', 'Oksigenia', s)
if k != 1:
    sys.exit('the signature of the accessibility panel has changed')
open(p, 'w', encoding='utf-8').write(n)
# The English of the screens: only the texts some module of the copy still says.
codigo = ''
for f in sorted(os.listdir(w)):
    if f.endswith('.js'):
        codigo += open(os.path.join(w, f), encoding='utf-8').read()
p = os.path.join(w, 'idiomas/en.js')
lineas = open(p, encoding='utf-8').read().split('\n')
fuera, n, saltar = 0, [], False
for i, l in enumerate(lineas):
    m = re.match(r"  '((?:[^'\\]|\\.)*)':", l)
    if m:
        saltar = f"'{m.group(1)}'" not in codigo
        fuera += saltar
    elif not l.startswith('    '):
        saltar = False
    if not saltar:
        n.append(l)
# A heading with nothing left under it goes too.
n = [l for i, l in enumerate(n) if not (l.startswith('  //') and (i + 1 == len(n) or n[i + 1].startswith('  //') or n[i + 1] == '};'))]
n = ['// The English of the screens of the course, looked up by their Spanish wording (idioma.js). British English.'] + n[next(i for i, l in enumerate(n) if l.startswith('export')):]
open(p, 'w', encoding='utf-8').write('\n'.join(n))
# The models: each body's list of clips keeps the sample (or all), and the files of the rest go.
for sub in ('', 'b'):
    carpeta = os.path.join(w, 'modelos', sub)
    lista = json.load(open(os.path.join(carpeta, 'ejercicios.json'), encoding='utf-8'))
    quedan = {k: v for k, v in lista['ejercicios'].items() if todo or k in muestra}
    faltan = muestra - set(lista['ejercicios'])
    if faltan and not todo:
        sys.exit(f'the sample names exercises without a clip in modelos/{sub}: {sorted(faltan)}')
    lista['ejercicios'] = quedan
    json.dump(lista, open(os.path.join(carpeta, 'ejercicios.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for f in os.listdir(carpeta):
        m = re.match(r'^([a-z0-9_]+)\.(glb|json)$', f)
        if m and m.group(1) not in ('cuerpo', 'ejercicios') and m.group(1) not in quedan:
            os.remove(os.path.join(carpeta, f))
    posters = os.path.join(carpeta, 'posters')
    for f in os.listdir(posters):
        # <id>.webp, or <id>-<band colour>.webp
        if re.sub(r'(-[a-z]+)?\.webp$', '', f) not in quedan:
            os.remove(os.path.join(posters, f))
PY
# The catalogue, from the app's own data.
node --input-type=module - "$W" "$ROOT" <<'JS'
import fs from 'node:fs';
const w = process.argv[2];
globalThis.window = {};
const d = await import(`${w}/datos.js`);
const hay = new Set([
  ...Object.keys(JSON.parse(fs.readFileSync(`${w}/modelos/ejercicios.json`, 'utf8')).ejercicios),
].filter((id) => JSON.parse(fs.readFileSync(`${w}/modelos/b/ejercicios.json`, 'utf8')).ejercicios[id]));
// The plugin's pages show the name, position and material in the user's language: the English ones come from the app's
// dictionary (idiomas/en-ejercicios.js) under «en».
const enEj = fs.existsSync(`${w}/idiomas/en-ejercicios.js`) ? (await import(`${w}/idiomas/en-ejercicios.js`)).default : {};
const ejercicios = {};
for (const id of d.ORDEN) {
  const e = d.EJERCICIOS[id];
  const u = d.unidad(e);
  ejercicios[id] = {
    nombre: e.nombre, unLado: !!e.unLado, unidad: e.unidad || 'reps', uno: u.uno, varios: u.varios,
    posicion: e.posicion, material: e.material, disponible: hay.has(id),
    en: { nombre: enEj[e.nombre] || e.nombre, posicion: enEj[e.posicion] || e.posicion, material: enEj[e.material] || e.material },
  };
}
fs.writeFileSync(`${w}/catalogo.json`, `${JSON.stringify({ v: 1, ejercicios }, null, 1)}\n`);
// The recorded voice (voz/): the count and the player's own sentences, and the phases and names of the exercises this
// copy brings. The rest of the library's sentences stay out.
const root = process.argv[3];
// The English voices (voz/*-en) are indexed by the English sentence: the same filter, through the app's dictionaries.
const en = fs.existsSync(`${w}/idiomas/en.js`)
  ? { ...(await import(`${w}/idiomas/en-ejercicios.js`)).default, ...(await import(`${w}/idiomas/en.js`)).default }
  : {};
for (const quien of fs.existsSync(`${w}/voz`) ? fs.readdirSync(`${w}/voz`) : []) {
  const tr = quien.endsWith('-en') ? (s) => [en[s] || s, ...s.split('. ').map((p) => en[p] || p)] : (s) => [s];
  const carpeta = `${w}/voz/${quien}`;
  if (!fs.existsSync(`${carpeta}/indice.json`)) continue;
  const indice = JSON.parse(fs.readFileSync(`${carpeta}/indice.json`, 'utf8'));
  const fasesDe = (carpeta) => fs.readdirSync(carpeta).filter((f) => f.endsWith('.json') && f !== 'ejercicios.json')
    .flatMap((f) => (JSON.parse(fs.readFileSync(`${carpeta}/${f}`, 'utf8')).fases || []).map((x) => x.texto).filter(Boolean));
  const propias = new Set([...fasesDe(`${root}/app/modelos`), ...fasesDe(`${root}/app/modelos/b`), ...d.ORDEN.map((id) => d.EJERCICIOS[id].nombre)].flatMap(tr));
  const deEsta = new Set([...fasesDe(`${w}/modelos`), ...fasesDe(`${w}/modelos/b`), ...[...hay].map((id) => d.EJERCICIOS[id].nombre)].flatMap(tr));
  const generales = new Set(['Hecho', 'Descansa', 'Descansa. Ahora, el otro lado', 'Rutina terminada. Buen trabajo.', 'Voz encendida', 'Ida', 'Mantén', 'Vuelta', 'Respira'].flatMap(tr));
  for (const [texto, clave] of Object.entries(indice)) {
    if (propias.has(texto) && !deEsta.has(texto) && !generales.has(texto)) {
      delete indice[texto];
      fs.rmSync(`${carpeta}/${clave}.mp3`, { force: true });
    }
  }
  fs.writeFileSync(`${carpeta}/indice.json`, `${JSON.stringify(indice, null, 0)}\n`);
}
JS
if grep -rIl --include=*.js --include=*.html --include=*.css "vendor/" "$W" | grep -v "/libs/"; then
  echo "paths with vendor/ left" >&2
  exit 1
fi
# Nothing here sells, promotes or leads out of the site: no plan, licence, price or cloud, and no address of anyone
# else's but the names of the SVG and XML standards.
if grep -rInE --include=*.js --include=*.css --include=*.json "licen[cs][ei]|precio|pricing|upgrade your plan|de pago|dropbox|onedrive|googleapis|accounts\.google|play\.google|wa\.me|t\.me/|whatsapp:|(jepyso|oksigenia)\.com/|href=\"https?:" "$W" | grep -vE "^$W/(libs/three|modelos/)|SPDX-License|MIT licen|[Ll]icensed under|@license"; then
  echo "the copy for Moodle still has something of app.jepyso.com" >&2
  exit 1
fi
# Every import with the version of the copy, a hash of its code.
python3 -I - "$W" <<'PY'
import hashlib, os, re, sys
w = sys.argv[1]
todos = sorted(os.path.join(r, f) for r, _, fs in os.walk(w) for f in fs if f.endswith('.js'))
h = hashlib.sha256(b''.join(open(p, 'rb').read() for p in todos)).hexdigest()[:10]
for p in todos:
    s = open(p, encoding='utf-8').read()
    n = re.sub(r'''((?:\bfrom|\bimport\(|\bimport)\s*)(['"])(\.{1,2}/[^'"?]+\.js)\2''', lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}?v={h}{m.group(2)}', s)
    if n != s:
        open(p, 'w', encoding='utf-8').write(n)
PY
mkdir -p "$PLUGIN/reproductor" "$PLUGIN/templates"
cp "$ROOT/tools/moodle/player.mustache" "$PLUGIN/templates/player.mustache"
rsync -a --delete "$W/" "$PLUGIN/reproductor/"
du -sh "$PLUGIN/reproductor" | cut -f1
