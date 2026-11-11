# Turns the renders of render.mjs into app/mapa.js: the outline of the body from the front and from the back, the muscle
# regions on the view where each one shows, and the point of every area a professional looks for.
# Usage: python3 -I trazar.py <renders folder> <app/mapa.js>   (needs Pillow and potrace)
import json
import os
import re
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter

ORIGEN, DESTINO = sys.argv[1], sys.argv[2]
# The order of the masks in the body (modelos/musculos.js, GRUPOS).
GRUPOS = ['gluteo_mayor', 'gluteo_medio', 'cuadriceps', 'isquiotibiales', 'aductores', 'gemelos', 'tibial_anterior',
          'recto_abdominal', 'oblicuos', 'erectores', 'dorsal_ancho', 'trapecio', 'pectoral', 'deltoides_anterior',
          'deltoides_medio', 'deltoides_posterior', 'manguito_posterior', 'biceps', 'triceps', 'antebrazo']
VISTAS = ['delante', 'detras']
ALTO = 480
info = json.load(open(os.path.join(ORIGEN, 'info.json')))
K = ALTO / info['H']
ANCHO = round(info['W'] * K)


def imagen(nombre):
    return Image.open(os.path.join(ORIGEN, f'{nombre}.png')).convert('L')


def absoluto(d, escala):
    """potrace writes relative commands in a flipped, scaled space: back to absolute map units, one decimal."""
    toks = re.findall(r'[MmLlCcZz]|-?\d+(?:\.\d+)?', d)
    res, i, cmd = [], 0, None
    x = y = x0 = y0 = 0.0
    num = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')
    punto = lambda px, py: f'{num(px * escala)} {num(ALTO - py * escala)}'
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            i += 1
            if cmd in 'Zz':
                res.append('Z')
                x, y = x0, y0
            continue
        n = lambda k: float(toks[i + k])
        if cmd in 'Mm':
            x, y = (n(0), n(1)) if cmd == 'M' else (x + n(0), y + n(1))
            x0, y0 = x, y
            res.append('M' + punto(x, y))
            cmd = 'L' if cmd == 'M' else 'l'
            i += 2
        elif cmd in 'Ll':
            x, y = (n(0), n(1)) if cmd == 'L' else (x + n(0), y + n(1))
            res.append('L' + punto(x, y))
            i += 2
        elif cmd in 'Cc':
            pts = [(n(0), n(1)), (n(2), n(3)), (n(4), n(5))]
            if cmd == 'c':
                pts = [(x + a, y + b) for a, b in pts]
            res.append('C' + ' '.join(punto(a, b) for a, b in pts))
            x, y = pts[2]
            i += 6
    return ''.join(res)


def trazar(gris, umbral=127, motas=15):
    """The shape above the grey threshold, as SVG path data; one string per separate piece."""
    pbm = os.path.join(ORIGEN, '_trazo.pbm')
    gris.point(lambda p: 0 if p > umbral else 255).convert('1').save(pbm)
    svg = subprocess.run(['potrace', pbm, '-s', '-t', str(motas), '-a', '1.2', '-O', '0.8', '-u', '10', '-o', '-'],
                         capture_output=True, text=True, check=True).stdout
    escala = float(re.search(r'scale\(([\d.]+),', svg).group(1))
    datos = absoluto(' '.join(re.findall(r'<path d="([^"]+)"', svg, re.S)).replace('\n', ' '), escala)
    return ['M' + p for p in datos.split('M') if p]


def area(vista, i):
    silueta = imagen(f'{vista}-silueta')
    mascara = Image.composite(imagen(f'{vista}-m{i}'), Image.new('L', silueta.size, 0), silueta)
    return sum(1 for p in mascara.getdata() if p > 118)


AREAS = {g: {v: area(v, i) for v in VISTAS} for i, g in enumerate(GRUPOS)}
mapa = {'ancho': ANCHO, 'alto': ALTO, 'vistas': {}}
juntas = {}
for v in VISTAS:
    silueta = imagen(f'{v}-silueta')
    j = info[f'juntas-{v}']
    juntas[v] = {n: (p[0] * K, p[1] * K) for n, p in j.items()}
    # Mitten hands, as on a body chart: the hands are blurred much more than the rest of the outline.
    zona = Image.new('L', silueta.size, 0)
    dibujo = ImageDraw.Draw(zona)
    for lado in 'lr':
        cx = (j[f'hand_{lado}'][0] + j[f'middle_01_{lado}'][0]) / 2
        cy = (j[f'hand_{lado}'][1] + j[f'middle_01_{lado}'][1]) / 2 + 20
        dibujo.ellipse([cx - 70, cy - 90, cx + 70, cy + 110], fill=255)
    zona = zona.filter(ImageFilter.GaussianBlur(20))
    suave = Image.composite(silueta.filter(ImageFilter.GaussianBlur(14)), silueta.filter(ImageFilter.GaussianBlur(3)), zona)
    vista = {'silueta': ''.join(trazar(suave.resize((ANCHO, ALTO), Image.LANCZOS))), 'musculos': []}
    # A muscle goes on the view where most of it shows; a sliver seen from the side is left out. Bigger regions
    # first, so the small ones (the rotator cuff over the trapezius) stay on top.
    for i in sorted(range(len(GRUPOS)), key=lambda i: -AREAS[GRUPOS[i]][v]):
        g = GRUPOS[i]
        if AREAS[g][v] < 1000 or AREAS[g][v] < 0.5 * max(AREAS[g].values()):
            continue
        mascara = Image.composite(imagen(f'{v}-m{i}'), Image.new('L', silueta.size, 0), silueta)
        mascara = mascara.filter(ImageFilter.GaussianBlur(4)).resize((ANCHO, ALTO), Image.LANCZOS)
        for pieza in trazar(mascara, umbral=118, motas=8):
            vista['musculos'].append([g, pieza])
    mapa['vistas'][v] = vista


def entre(a, b=None, t=0.5):
    b = b or a
    return [round(a[0] + (b[0] - a[0]) * t, 1), round(a[1] + (b[1] - a[1]) * t, 1)]


def pareja(n, otro=None):
    # The body's right first: on the front view it is the one on the viewer's left.
    j = juntas['delante']
    return [['delante', *entre(j[f'{n}_{l}'], j[f'{otro}_{l}'] if otro else None)] for l in 'rl']


FRENTE = imagen('delante-silueta')
J = info['juntas-delante']
dentro = lambda x, y: FRENTE.getpixel((int(round(x)), int(round(y)))) > 127


def cadera(lado):
    """The side of the hip, over the greater trochanter: a little below the hip joint, on the edge of the outline. In
    the groin, where the joint really is, the point reads as «groin»."""
    x, y = J[f'thigh_{lado}']
    y += 25
    paso = -1 if lado == 'r' else 1  # the body's right is on the viewer's left
    while dentro(x + paso, y):
        x += paso
    return ['delante', round((x - paso * 6) * K, 1), round(y * K, 1)]


def tobillo(lado):
    """The ankle at the malleoli: just under the narrowest row of the leg above the foot. The ankle bone of the rig
    sits almost in the foot."""
    (xc, yc), (xf, yf) = J[f'calf_{lado}'], J[f'foot_{lado}']
    filas = []
    for y in range(int(yc + (yf - yc) * 0.6), int(yf) + 1):
        x = xc + (xf - xc) * (y - yc) / (yf - yc)
        if not dentro(x, y):
            continue
        a = b = x
        while dentro(a - 1, y):
            a -= 1
        while dentro(b + 1, y):
            b += 1
        filas.append((b - a, y, (a + b) / 2))
    _, y, x = min(filas)
    return ['delante', round(x * K, 1), round((y + 12) * K, 1)]


PUNTOS = {
    'cuello': [['detras', *entre(juntas['detras']['neck_01'], juntas['detras']['head'], 0.3)]],
    'hombro': pareja('upperarm'),
    'codo': pareja('lowerarm'),
    'mano': pareja('hand', 'middle_01'),
    'lumbar': [['detras', *entre(juntas['detras']['spine_01'])]],
    'cadera': [cadera('r'), cadera('l')],
    'rodilla': pareja('calf'),
    'tobillo': [tobillo('r'), tobillo('l')],
}
# The body is symmetric: both ankles at the same height, whatever a pixel more on one side says.
_y = round(sum(p[2] for p in PUNTOS['tobillo']) / 2, 1)
PUNTOS['tobillo'] = [[v, x, _y] for v, x, _ in PUNTOS['tobillo']]
compacto = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
open(DESTINO, 'w').write(f"""// The body map of the library: Gaudí's body (modelos/cuerpo.glb) from the front and from the back, with the muscle
// groups the figure lights and a point on every area a professional looks for. Made by tools/mapa-cuerpo/ from the body
// itself; to change it, change the body or the tool and run it again, not this file.
// Muscles: [group, path] in drawing order; a group seen on both sides has one path per side.
export const MAPA = {compacto(mapa)};

// Where the point of each area goes, as [view, x, y] in the map's own units. Areas on both sides have two points.
export const PUNTOS = {compacto(PUNTOS)};
""")
print(f'{DESTINO}: {os.path.getsize(DESTINO)} bytes; '
      + '; '.join(f"{v}: {len(set(g for g, _ in mapa['vistas'][v]['musculos']))} músculos" for v in VISTAS))
