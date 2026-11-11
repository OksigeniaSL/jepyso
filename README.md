# Oksigenia Jepyso

[![License: GPLv3](https://img.shields.io/badge/license-GPLv3+-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-early-red)

[Leer en español](README.es.md)

**Exercise routines that travel in a link.** A professional (a physiotherapist, a coach, a PE teacher, a care home)
puts together each person's routine and sends it as a link or a QR code. The person opens it on their phone, with
nothing to install and no account, and follows a 3D figure that moves at the pace, on the side and for the sets that
were prescribed. Afterwards they note the reps they really did and the discomfort they felt, and send a summary back
with another link.

*Jepyso* is Guarani for stretching, limbering up.

## How it works

- **No server.** The routine is JSON, compressed with `deflate-raw` and written in base64url inside the URL fragment
  (`#r=…`); the summary comes back the same way (`#s=…`). Browsers never send the fragment to a server, so the routine
  only travels between the two phones. A routine of three exercises is about 220 characters and fits in a QR code.
- **The figure does what was prescribed.** One body (glTF) and a short clip per exercise, played with three.js. Each
  phase of the clip (up, hold, down) is stretched to the seconds the professional set, and the other side is the same
  clip mirrored. The muscles that work light up on the body. The figure can be turned with a finger.
- **The session:** a countdown, the phase in large type with a tone at each phase and a vibration at each rep, rests
  with a ring, the screen kept awake, and at the end of each exercise the reps of each set and the discomfort from 0
  to 10.
- **Discomfort follows the pain-monitoring model** ([Thomeé, 1997](https://pubmed.ncbi.nlm.nih.gov/9413448/);
  [Silbernagel et al., 2007](https://pubmed.ncbi.nlm.nih.gov/17307888/)): the professional sets the acceptable level
  (5 out of 10 unless they change it), the day after a session the person says how it felt on getting up, and the
  summary marks the days that went above the level.
- Light and dark themes, from 360 px wide.

## Run it

Any static server on `app/`:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory app
```

Then open http://127.0.0.1:8000/ to build a routine.

For a host whose content policy allows no inline script, `tools/construir.sh` builds a copy without the import map.

## Tests

```sh
cd tests && npm install && ./correr.sh /tmp/jepyso-screenshots
```

An end-to-end walk in light and dark, wide and on a phone: the builder, the link, the routine, the rating, the
morning-after question and the summary. It fails on a broken check or on any console error. `CHROMIUM_BIN` can point
at a Chromium binary; without it, the one installed by Playwright is used.

## Layout

| Path | What |
|---|---|
| `app/index.html`, `app/estilos.css`, `app/tema.js` | The page, light and dark from the same tokens |
| `app/app.js` | The three views, chosen by the URL fragment: the builder (none), the routine (`#r=`) and the summary (`#s=`) |
| `app/datos.js` | The exercises and their texts, the link format and the local store |
| `app/figura.js` | The 3D figure |
| `app/modelos/` | The figures: the body, and a GLB and a sheet per exercise; `b/` is the second body, with its own clips |
| `figuras/fichas/` | The sheet each movement is built from: the joint angles of each key pose, in degrees, and what rests where |
| `app/vendor/` | three.js 0.170.0 and qrcode-generator 1.4.4, both MIT, served from here (no CDN) |
| `tools/construir.sh` | The copy for strict hosts |
| `tools/mapa-cuerpo/hacer.sh` | Draws the body map of the library (`app/mapa.js`) from the body itself; run it again when the body changes |
| `tests/` | The end-to-end walk |

## Licence

The code is under the GNU GPL v3 or later ([LICENSE](LICENSE)). The figures and exercise sheets in `app/modelos/` and
`figuras/fichas/` are content with their own licence: free to use, unchanged, within Jepyso ([LICENSE-FIGURES.md](LICENSE-FIGURES.md)).
three.js and qrcode-generator are under the MIT licence, with their notices in `app/vendor/`.

© 2026 Oksigenia SL
