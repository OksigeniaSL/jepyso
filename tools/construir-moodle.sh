#!/usr/bin/env bash
# Builds the player of the Moodle activity (mod_oksigeniajepyso, app/moodle.js) into <plugin>/reproductor/: the strict
# copy of tools/construir.sh with what a Moodle plugin needs.
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
rm -f "$W/sw.js" "$W/manifest.json"
# Nor the file that vouches for the Android app, which is app.jepyso.com's.
rm -f "$W/.well-known/assetlinks.json" && rmdir "$W/.well-known"
# The content of the package (the sample, the headers, the icon, the body map) under CC BY-SA 4.0, which the Moodle
# Marketplace accepts as GPL-compatible (coordinator, 15-11-2026, shared/licencias.md), with the sheets the twelve
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
// The recorded voice (voz/): the count and the player's own sentences, and the phases and names of the exercises this
// copy brings. The rest of the library's sentences stay out.
const root = process.argv[3];
for (const quien of fs.existsSync(`${w}/voz`) ? fs.readdirSync(`${w}/voz`) : []) {
  const carpeta = `${w}/voz/${quien}`;
  if (!fs.existsSync(`${carpeta}/indice.json`)) continue;
  const indice = JSON.parse(fs.readFileSync(`${carpeta}/indice.json`, 'utf8'));
  const fasesDe = (carpeta) => fs.readdirSync(carpeta).filter((f) => f.endsWith('.json') && f !== 'ejercicios.json')
    .flatMap((f) => (JSON.parse(fs.readFileSync(`${carpeta}/${f}`, 'utf8')).fases || []).map((x) => x.texto).filter(Boolean));
  const propias = new Set([...fasesDe(`${root}/app/modelos`), ...fasesDe(`${root}/app/modelos/b`), ...d.ORDEN.map((id) => d.EJERCICIOS[id].nombre)]);
  const deEsta = new Set([...fasesDe(`${w}/modelos`), ...fasesDe(`${w}/modelos/b`), ...[...hay].map((id) => d.EJERCICIOS[id].nombre)]);
  const generales = new Set(['Hecho', 'Descansa', 'Descansa. Ahora, el otro lado', 'Rutina terminada. Buen trabajo.', 'Voz encendida', 'Ida', 'Mantén', 'Vuelta', 'Respira']);
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
mkdir -p "$PLUGIN/reproductor"
rsync -a --delete "$W/" "$PLUGIN/reproductor/"
du -sh "$PLUGIN/reproductor" | cut -f1
