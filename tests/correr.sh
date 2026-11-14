#!/usr/bin/env bash
# Serves app/ on a local port, checks that every prop follows its clip (tests/accesorios.mjs), runs the end-to-end walk
# (tests/recorrido.mjs) and stops the server.
# Usage: tests/correr.sh [screenshot dir]
#   APP           the folder to serve (default app/; tools/construir.sh makes the strict-host copy)
#   PORT          local port (default 8772)
#   CHROMIUM_BIN  a Chromium binary; without it, the one Playwright installed
#   CSP           any value: serve with the device bench's content policy (for the strict-host copy)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${1:-$(mktemp -d)}
APP=${APP:-$HERE/../app}
PORT=${PORT:-8772}
mkdir -p "$OUT"
node "$HERE/archivos-sw.mjs" "$APP"
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
node "$HERE/apuntar.mjs" "http://127.0.0.1:$PORT"
node "$HERE/voz.mjs" "http://127.0.0.1:$PORT"
node "$HERE/grupo.mjs" "http://127.0.0.1:$PORT"
node "$HERE/recorrido.mjs" "http://127.0.0.1:$PORT" "$OUT"
echo "capturas: $OUT"
