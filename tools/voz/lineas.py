#!/usr/bin/env python3
"""Every sentence the player's voice says (app/voz.js and its callers in app/app.js), as the TSV of the common voice
generator of Oksigenia (hq, agents/arte/kit/voz/voz.py --lines): key, voice, text. For phones without a Spanish voice
of their own (the in-app browser of the Moodle app, Brave): the player plays these takes instead.

The key of each sentence is the start of the SHA-1 of its text, the same name the player looks for (app/voz.js).
Usage: python3 -B tools/voz/lineas.py <voice> > lineas.tsv      (voice: a brand voice of voces.json, e.g. Mira)
"""
import glob
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP = os.path.join(ROOT, 'app')


def clave(texto):
    return hashlib.sha1(texto.encode('utf-8')).hexdigest()[:12]


NUMEROS = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
           'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte']
VEINTI = ['veinte', '', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
          'veintiocho', 'veintinueve']
DECENAS = {3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta'}


def numero(n, masculino=False):
    """The count in words, the same as numero() of app/voz.js."""
    uno = 'uno' if masculino else 'una'
    if n == 1:
        return uno
    if n <= 20:
        return NUMEROS[n]
    if n < 30:
        return 'veinti' + uno if n == 21 else VEINTI[n - 20]
    d, u = divmod(n, 10)
    return DECENAS[d] if u == 0 else f"{DECENAS[d]} y {uno if u == 1 else NUMEROS[u]}"


def frases():
    out = []
    # The count in words up to sixty («una» for repetitions, «uno» for steps and laps).
    out += [numero(n, m) for n in range(0, 61) for m in (False, True)]
    # What the player says by itself.
    out += ['Hecho', 'Descansa', 'Descansa. Ahora, el otro lado', 'Rutina terminada. Buen trabajo.', 'Voz encendida',
            'Ida', 'Mantén', 'Vuelta', 'Respira']
    # The words of each phase, from the sheets of both bodies.
    for f in sorted(glob.glob(os.path.join(APP, 'modelos', '*.json')) + glob.glob(os.path.join(APP, 'modelos', 'b', '*.json'))):
        if os.path.basename(f) == 'ejercicios.json':
            continue
        for fase in json.load(open(f, encoding='utf-8')).get('fases') or []:
            if isinstance(fase, dict) and fase.get('texto'):
                out.append(fase['texto'].strip())
    # The names of the exercises, which the group mode says before each one.
    catalogo = os.path.join(APP, '..', 'tools', 'voz', 'nombres.json')
    if os.path.exists(catalogo):
        out += json.load(open(catalogo, encoding='utf-8'))
    vistos, unicos = set(), []
    for t in out:
        if t and t not in vistos:
            vistos.add(t)
            unicos.append(t)
    return unicos


if __name__ == '__main__':
    voz = sys.argv[1] if len(sys.argv) > 1 else 'Mira'
    for t in frases():
        print(f'{clave(t)}\t{voz}\t{t}')
