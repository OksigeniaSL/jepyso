#!/usr/bin/env bash
# Builds a copy of app/ for hosts whose content policy allows no inline script: without the import map, so the bare
# 'three' imports are rewritten here to relative paths.
# Usage: tools/construir.sh [destination]   (default: dist/web)
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
DEST=${1:-$ROOT/dist/web}
mkdir -p "$DEST"
rsync -a --delete --exclude '*.md' "$ROOT/app/" "$DEST/"
python3 -I - "$DEST" <<'PY'
import os, re, sys
dest = sys.argv[1]
three = os.path.join(dest, 'vendor/three/three.module.js')
addons = os.path.join(dest, 'vendor/three/addons')
for raiz, _, ficheros in os.walk(dest):
    for f in ficheros:
        p = os.path.join(raiz, f)
        if f.endswith('.js') and p != three:
            s = open(p, encoding='utf-8').read()
            rel = lambda t: ('./' if not os.path.relpath(t, raiz).startswith('.') else '') + os.path.relpath(t, raiz)
            n = re.sub(r"""from (['"])three\1""", lambda m: f"from '{rel(three)}'", s)
            n = re.sub(r"""(['"])three/addons/([^'"]+)\1""", lambda m: f"'{rel(os.path.join(addons, m.group(2)))}'", n)
            if n != s:
                open(p, 'w', encoding='utf-8').write(n)
        if f == 'index.html':
            s = open(p, encoding='utf-8').read()
            s = re.sub(r'\s*<script type="importmap">.*?</script>', '', s, flags=re.S)
            open(p, 'w', encoding='utf-8').write(s)
PY
if grep -rl "from 'three'" "$DEST" --include=*.js; then
  echo "bare 'three' imports left" >&2
  exit 1
fi
echo "$DEST"
