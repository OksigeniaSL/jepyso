# Oksigenia Jepyso

[![Licencia: GPLv3](https://img.shields.io/badge/licencia-GPLv3+-blue.svg)](LICENSE)
![Estado](https://img.shields.io/badge/estado-en%20pa%C3%B1ales-red)

[Read in English](README.md)

**Rutinas de ejercicio que viajan en un enlace.** El profesional (fisioterapeuta, entrenador, profesor de Educación
Física, centro de mayores) arma la rutina de cada persona y se la manda por un enlace o un código QR. La persona la
abre en el móvil, sin instalar nada ni crear una cuenta, y la hace siguiendo a una figura 3D que va al ritmo, del lado
y con las series que le han mandado. Al terminar apunta las repeticiones que hizo de verdad y la molestia que notó, y
devuelve el resumen con otro enlace.

*Jepyso* es «estirarse, desperezarse» en guaraní.

## Cómo funciona

- **Sin servidor.** La rutina es un JSON comprimido con `deflate-raw` y escrito en base64url dentro del fragmento de
  la dirección (`#r=…`); el resumen vuelve igual (`#s=…`). El navegador nunca manda el fragmento a un servidor, así que
  la rutina solo viaja entre los dos móviles. Una rutina de tres ejercicios ocupa unos 220 caracteres y cabe en un QR.
- **La figura hace lo que se mandó.** Un cuerpo (glTF) y un clip corto por ejercicio, con three.js. Cada fase del
  clip (sube, mantén, baja) se estira hasta los segundos que puso el profesional, y el otro lado es el mismo clip en
  espejo. Los músculos que trabajan se encienden en el cuerpo, y la figura se gira con el dedo.
- **La sesión:** cuenta atrás, la fase en grande con un tono en cada fase y una vibración en cada repetición,
  descansos con anillo, la pantalla siempre encendida y, al acabar cada ejercicio, las repeticiones de cada serie y la
  molestia de 0 a 10.
- **La molestia sigue el modelo de control del dolor** ([Thomeé, 1997](https://pubmed.ncbi.nlm.nih.gov/9413448/);
  [Silbernagel y otros, 2007](https://pubmed.ncbi.nlm.nih.gov/17307888/)). El profesional pone la molestia aceptable
  (5 de 10 si no la cambia); el día después de una sesión, la persona dice qué tal se levantó, y el resumen marca los
  días que pasaron de ese nivel.
- Tema claro y oscuro, desde 360 px de ancho.

## Ponerla en marcha

Cualquier servidor estático sobre `app/`:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory app
```

Y en http://127.0.0.1:8000/ se arma una rutina.

Para un alojamiento que no admite scripts dentro del HTML, `tools/construir.sh` saca una copia sin el import map.

## Pruebas

```sh
cd tests && npm install && ./correr.sh /tmp/jepyso-capturas
```

Un recorrido de punta a punta en claro y en oscuro, en pantalla ancha y en el móvil: armar la rutina, el enlace, la
rutina, la valoración, la pregunta de la mañana siguiente y el resumen. Falla si una comprobación no se cumple o si
sale un error en la consola. `CHROMIUM_BIN` puede apuntar a un Chromium; si no, se usa el que instala Playwright.

## Qué hay en cada sitio

| Ruta | Qué |
|---|---|
| `app/index.html`, `app/estilos.css`, `app/tema.js` | La página, en claro y en oscuro con los mismos colores base |
| `app/app.js` | Las tres vistas, según el fragmento: armar (sin fragmento), la rutina (`#r=`) y el resumen (`#s=`) |
| `app/datos.js` | Los ejercicios y sus textos, el formato del enlace y lo que se guarda en el móvil |
| `app/figura.js` | La figura 3D |
| `app/modelos/` | Las figuras: el cuerpo, y un GLB y una ficha por ejercicio; `b/` es el segundo cuerpo, con sus propios clips |
| `figuras/fichas/` | La ficha de la que sale cada movimiento: los ángulos de cada postura clave, en grados, y dónde se apoya cada parte |
| `app/vendor/` | three.js 0.170.0 y qrcode-generator 1.4.4, los dos MIT, servidos desde aquí (sin CDN) |
| `tools/construir.sh` | La copia para alojamientos estrictos |
| `tools/mapa-cuerpo/hacer.sh` | Dibuja el mapa del cuerpo de la biblioteca (`app/mapa.js`) a partir del propio cuerpo; se vuelve a lanzar si el cuerpo cambia |
| `tests/` | El recorrido de punta a punta |

## Licencia

El código, GNU GPL v3 o posterior ([LICENSE](LICENSE)). Las figuras y las fichas de ejercicio de `app/modelos/` y
`figuras/fichas/` son contenido con su propia licencia: se pueden usar, tal cual, dentro de Jepyso ([LICENSE-FIGURES.md](LICENSE-FIGURES.md)).
three.js y qrcode-generator, licencia MIT, con sus avisos en `app/vendor/`.

© 2026 Oksigenia SL
