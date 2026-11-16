#!/usr/bin/env python3
"""Every sentence the player's voice says (app/voz.js and its callers in app/app.js), as the TSV of the common voice
generator of Oksigenia (hq, agents/arte/kit/voz/voz.py --lines): key, voice, text. For phones without a Spanish voice
of their own (the in-app browser of the Moodle app, Brave): the player plays these takes instead.

The key of each sentence is the start of the SHA-1 of its text, the same name the player looks for (app/voz.js).
Usage: python3 -B tools/voz/lineas.py <voice> > lineas.tsv      (voice: a brand voice of voces.json, e.g. Mira)
       python3 -B tools/voz/lineas.py --en "Mira EN" > lineas-en.tsv   (the same sentences in English, from the
       dictionaries of app/idiomas/; a sentence without its English is left out and named on stderr)
"""
import glob
import hashlib
import json
import os
import subprocess
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


EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
      'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
EN_DECENAS = {2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty'}


def numero_en(n):
    """The count in English words, the same as numeroEn() of app/voz.js."""
    if n < 20:
        return EN[n]
    d, u = divmod(n, 10)
    return EN_DECENAS[d] if u == 0 else f"{EN_DECENAS[d]}-{EN[u]}"


def diccionario_en():
    """The English of app/idiomas/ (screens and exercises), read by node, as the app reads it."""
    codigo = ("const a=(await import('./app/idiomas/en-ejercicios.js')).default;"
              "const b=(await import('./app/idiomas/en.js')).default;"
              "console.log(JSON.stringify({...a,...b}))")
    salida = subprocess.run(['node', '--input-type=module', '-e', codigo], cwd=ROOT, capture_output=True, text=True,
                            check=True, timeout=60).stdout
    return json.loads(salida)


def frases_en():
    dic = diccionario_en()
    numeros = {numero(n, m) for n in range(0, 61) for m in (False, True)}
    out = [numero_en(n) for n in range(0, 61)]
    for es in frases():
        if es in numeros:
            continue
        # A sentence said in parts («Descansa. Ahora, el otro lado»): each part, as the player splits it.
        partes = [es] if es in dic else [p.strip() for p in es.split('. ') if p.strip()]
        for p in partes:
            if dic.get(p):
                out.append(dic[p].strip())
            else:
                print(f'sin inglés: {p}', file=sys.stderr)
    vistos, unicos = set(), []
    for t in out:
        if t and t not in vistos:
            vistos.add(t)
            unicos.append(t)
    return unicos


if __name__ == '__main__':
    ingles = '--en' in sys.argv
    args = [a for a in sys.argv[1:] if a != '--en']
    voz = args[0] if args else ('Mira EN' if ingles else 'Mira')
    for t in (frases_en() if ingles else frases()):
        print(f'{clave(t)}\t{voz}\t{t}')
