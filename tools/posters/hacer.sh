#!/usr/bin/env bash
# Makes the still of every exercise that the library shows in its rows (app/modelos/posters/ and
# app/modelos/b/posters/), with the app's own figure. Run it again when a clip, a body or the figure changes, and then
# raise FIJOS in app/sw.js: phones keep the stills under the same name, like the clips.
# Usage: tools/posters/hacer.sh     PORT (default 8774), CHROMIUM_BIN as in tests/correr.sh
set -euo pipefail
AQUI=$(cd "$(dirname "$0")" && pwd)
RAIZ=$(cd "$AQUI/../.." && pwd)
PORT=${PORT:-8774}
python3 -I -m http.server "$PORT" --bind 127.0.0.1 --directory "$RAIZ" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT
curl -sf -o /dev/null --retry 20 --retry-connrefused --retry-delay 1 "http://127.0.0.1:$PORT/tools/posters/render.html"
node "$AQUI/render.mjs" "http://127.0.0.1:$PORT"
