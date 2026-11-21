#!/usr/bin/env bash
# Serves app/ on a local port, checks that every prop follows its clip (tests/accesorios.mjs), runs the end-to-end walk
# (tests/recorrido.mjs), walks the app in English (tests/idioma.mjs) and stops the server.
# Usage: tests/correr.sh [screenshot dir]
#   APP           the folder to serve (default app/; tools/construir.sh makes the strict-host copy)
#   PORT          local port (default 8772)
#   CHROMIUM_BIN  a Chromium binary; without it, the one Playwright installed
#   CSP           any value: serve with the device bench's content policy (for the strict-host copy)
set -euo pipefail
# The walks check Spanish texts: the browser speaks Spanish unless a test asks for another language (tests/idioma.mjs).
export LANG=es_ES.UTF-8 LANGUAGE=es
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${1:-$(mktemp -d)}
APP=${APP:-$HERE/../app}
PORT=${PORT:-8772}
mkdir -p "$OUT"
node "$HERE/archivos-sw.mjs" "$APP"
# Every text of the screens and of the exercises has its English.
node "$HERE/../tools/idiomas/pantallas.mjs"
node "$HERE/../tools/idiomas/extraer.mjs" --comprobar "$HERE/../app/idiomas/en-ejercicios.js" | tail -1
node "$HERE/csp.mjs"
node "$HERE/entrada.mjs" "$APP"
node "$HERE/inflar.mjs" "$APP"
node "$HERE/pago.mjs" "$APP"
node "$HERE/licencia.mjs" "$APP"
node "$HERE/catalogo.mjs" "$APP"
node "$HERE/personas.mjs" "$APP"
node "$HERE/sincronia.mjs" "$APP"
node "$HERE/drive.mjs" "$APP"
node "$HERE/version.mjs" "$APP" $((PORT + 100))
python3 -I "$HERE/servir.py" "$PORT" "$APP" ${CSP:+--csp} >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT
curl -sf -o /dev/null --retry 20 --retry-connrefused --retry-delay 1 "http://127.0.0.1:$PORT/index.html"
node "$HERE/accesorios.mjs" "http://127.0.0.1:$PORT"
node "$HERE/seguir.mjs" "http://127.0.0.1:$PORT"
node "$HERE/circuito.mjs" "http://127.0.0.1:$PORT"
node "$HERE/rueda.mjs" "http://127.0.0.1:$PORT"
node "$HERE/anulada.mjs" "http://127.0.0.1:$PORT"
node "$HERE/nube.mjs" "http://127.0.0.1:$PORT" "$OUT"
node "$HERE/andar.mjs" "http://127.0.0.1:$PORT"
node "$HERE/programas.mjs" "http://127.0.0.1:$PORT"
node "$HERE/noticias.mjs" "http://127.0.0.1:$PORT"
node "$HERE/accesible.mjs" "http://127.0.0.1:$PORT"
node "$HERE/moodle.mjs" "http://127.0.0.1:$PORT"
node "$HERE/tienda.mjs" "http://127.0.0.1:$PORT"
node "$HERE/apuntar.mjs" "http://127.0.0.1:$PORT"
node "$HERE/vales.mjs" "http://127.0.0.1:$PORT" "$OUT"
node "$HERE/voz.mjs" "http://127.0.0.1:$PORT"
node "$HERE/voz-grabada.mjs" "http://127.0.0.1:$PORT"
node "$HERE/grupo.mjs" "http://127.0.0.1:$PORT"
node "$HERE/primera.mjs" "http://127.0.0.1:$PORT" "$OUT"
node "$HERE/recorrido.mjs" "http://127.0.0.1:$PORT" "$OUT"
# Last: the app in English, with the whole battery in Spanish already through.
node "$HERE/idioma.mjs" "http://127.0.0.1:$PORT" "$OUT"
echo "capturas: $OUT"
