#!/usr/bin/env python3
"""Puts the recorded takes of the player's voice into app/voz/<voice>/: the clips the voice generator made (voz.py
--lines) and voz/<voice>/indice.json, the file of each sentence. The player plays them, in the voice each person
chooses (app/voz.js: «mujer» is mira, «hombre» is altair).
Usage: python3 -B tools/voz/instalar.py <lineas.tsv> mira=<takes folder> altair=<takes folder>
"""
import json
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
lineas = sys.argv[1]
textos = [l.rstrip('\n').split('\t') for l in open(lineas, encoding='utf-8') if l.strip()]
base = os.path.join(ROOT, 'app', 'voz')
if os.path.isdir(base):
    shutil.rmtree(base)
for par in sys.argv[2:]:
    nombre, tomas = par.split('=', 1)
    dest = os.path.join(base, nombre)
    os.makedirs(dest)
    indice = {}
    for clave, _voz, texto in (t[:3] for t in textos):
        mp3 = os.path.join(tomas, clave + '.mp3')
        if os.path.exists(mp3):
            shutil.copy2(mp3, dest)
            indice[texto] = clave
    json.dump(dict(sorted(indice.items())), open(os.path.join(dest, 'indice.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    peso = sum(os.path.getsize(os.path.join(dest, f)) for f in os.listdir(dest))
    print(f'{nombre}: {len(indice)} de {len(textos)} frases ({peso // 1024} KB)')
