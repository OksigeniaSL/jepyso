#!/usr/bin/env bash
# Serves app/ on a local port, runs the end-to-end walk (tests/recorrido.mjs) and stops the server.
# Usage: tests/correr.sh [screenshot dir]
#   APP           the folder to serve (default app/; tools/construir.sh makes the strict-host copy)
#   PORT          local port (default 8772)
#   CHROMIUM_BIN  a Chromium binary; without it, the one Playwright installed
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${1:-$(mktemp -d)}
APP=${APP:-$HERE/../app}
PORT=${PORT:-8772}
mkdir -p "$OUT"
node "$HERE/archivos-sw.mjs" "$APP"
node "$HERE/catalogo.mjs" "$APP"
node "$HERE/personas.mjs" "$APP"
node "$HERE/version.mjs" "$APP" $((PORT + 100))
python3 -I -m http.server "$PORT" --bind 127.0.0.1 --directory "$APP" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT
curl -sf -o /dev/null --retry 20 --retry-connrefused --retry-delay 1 "http://127.0.0.1:$PORT/index.html"
node "$HERE/recorrido.mjs" "http://127.0.0.1:$PORT" "$OUT"
echo "capturas: $OUT"
