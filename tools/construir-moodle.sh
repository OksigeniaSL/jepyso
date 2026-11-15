#!/usr/bin/env bash
# Builds the player of the Moodle activity (mod_oksigeniajepyso, app/moodle.js) into <plugin>/reproductor/: the strict
# copy of tools/construir.sh with what a Moodle plugin needs.
#  - vendor/ becomes libs/: the server configurations Moodle recommends answer 404 to any path with /vendor/.
#  - No worker and no manifest of its own: the plugin serves the app and the course keeps the sessions.
#  - The models of the free sample only (MUESTRA, below), or all of them with --todo; the two lists of clips
#    (modelos/ejercicios.json and modelos/b/ejercicios.json) say just those.
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
rm -f "$W/sw.js" "$W/manifest.json"
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
node --input-type=module - "$W" <<'JS'
import fs from 'node:fs';
const w = process.argv[2];
globalThis.window = {};
const d = await import(`${w}/datos.js`);
const hay = new Set([
  ...Object.keys(JSON.parse(fs.readFileSync(`${w}/modelos/ejercicios.json`, 'utf8')).ejercicios),
].filter((id) => JSON.parse(fs.readFileSync(`${w}/modelos/b/ejercicios.json`, 'utf8')).ejercicios[id]));
const ejercicios = {};
for (const id of d.ORDEN) {
  const e = d.EJERCICIOS[id];
  const u = d.unidad(e);
  ejercicios[id] = {
    nombre: e.nombre, unLado: !!e.unLado, unidad: e.unidad || 'reps', uno: u.uno, varios: u.varios,
    posicion: e.posicion, material: e.material, disponible: hay.has(id),
  };
}
fs.writeFileSync(`${w}/catalogo.json`, `${JSON.stringify({ v: 1, ejercicios }, null, 1)}\n`);
JS
if grep -rIl --include=*.js --include=*.html --include=*.css "vendor/" "$W" | grep -v "/libs/"; then
  echo "paths with vendor/ left" >&2
  exit 1
fi
mkdir -p "$PLUGIN/reproductor"
rsync -a --delete "$W/" "$PLUGIN/reproductor/"
du -sh "$PLUGIN/reproductor" | cut -f1
