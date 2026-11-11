#!/usr/bin/env bash
# Makes app/mapa.js, the body map of the library, from Gaudí's body (app/modelos/cuerpo.glb). Run it again when the
# body changes. Needs node with the test dependencies (tests/), Pillow and potrace.
# Usage: tools/mapa-cuerpo/hacer.sh     PORT (default 8773), CHROMIUM_BIN as in tests/correr.sh
set -euo pipefail
AQUI=$(cd "$(dirname "$0")" && pwd)
RAIZ=$(cd "$AQUI/../.." && pwd)
PORT=${PORT:-8773}
TMP=$(mktemp -d)
python3 -I -m http.server "$PORT" --bind 127.0.0.1 --directory "$RAIZ" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true; rm -rf "$TMP"' EXIT
curl -sf -o /dev/null --retry 20 --retry-connrefused --retry-delay 1 "http://127.0.0.1:$PORT/tools/mapa-cuerpo/render.html"
node "$AQUI/render.mjs" "http://127.0.0.1:$PORT" "$TMP"
python3 -I "$AQUI/trazar.py" "$TMP" "$RAIZ/app/mapa.js"
