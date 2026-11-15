# Jepyso para Android

La app de Android de Jepyso es la misma web, empaquetada: abre `https://app.jepyso.com` a pantalla completa en el
navegador del teléfono (Chrome u otro que lo admita), sin barra de direcciones. Es una *Trusted Web Activity* (TWA),
la forma que tiene Google de publicar una web instalable en Google Play. Se publica a nombre de Oksigenia SL.

- **Paquete:** `com.oksigenia.jepyso`. **Nombre:** Jepyso. **Versión:** 1.0.0 (código 1).
- **Android:** desde el 7.0 (API 24); compilada y orientada a la API 36.
- **Lo mismo que la web:** las rutinas, las fichas, el modo sin conexión y el trabajador son los de la web. La app no
  guarda nada aparte: los datos son los del navegador del teléfono para `app.jepyso.com`.
- **Los enlaces de rutina** (`https://app.jepyso.com/#r=…`) que llegan por WhatsApp o Telegram se abren dentro de la
  app si está instalada (App Links verificados, más abajo). Si no lo está, se abren en el navegador, como siempre.
- **Sin navegador compatible**, la web se abre en una pestaña del navegador (*Custom Tab*).
- **Sin avisos y sin permisos** para el usuario: ni ubicación, ni notificaciones, ni nada más.
- **La pantalla de arranque:** el icono sobre el fondo de la web, claro u oscuro según el teléfono. Las barras de
  estado y de navegación, también en claro (`#E4E6E3`) u oscuro (`#121517`).

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `twa-manifest.json` | La descripción de la app: paquete, colores, iconos, versión. De aquí sale todo el proyecto |
| `generar.js` | Rehace el proyecto desde `twa-manifest.json` con el generador de Bubblewrap y le aplica los ajustes propios |
| `construir.sh` | Construye el AAB firmado para Google Play y el APK universal firmado para probar en un teléfono |
| `app/`, `build.gradle`, `settings.gradle`, `gradle*` | El proyecto de Android que sale de `generar.js` |
| `icono.svg` | El icono en vectores, con sus marcas de esquina: de él salen el icono de la app y la pantalla de arranque |
| `store_icon.png` | El icono de 512 px para la ficha de Google Play: el cuadrado entero, porque Google Play le pone sus propias esquinas |

El proyecto sale del generador de **Bubblewrap 1.27.0** (la herramienta de Google para las TWA), con la biblioteca
`androidbrowserhelper` 2.7.4. Se compila con Gradle directamente, no con `bubblewrap build`, porque Bubblewrap solo
compila con el JDK 17 y en el portátil están el 21 y el 8. Los ajustes que añade `generar.js` sobre lo que genera
Bubblewrap están explicados al principio del propio archivo.

## Construir el AAB y el APK

Hace falta el SDK de Android (plataforma 36 y build-tools 35) y un JDK 17 o posterior. En el portátil:

```bash
cd android
JEPYSO_KEYSTORE=/home/eraorahan/Downloads/jepyso-local/android/jepyso-upload.jks \
JEPYSO_KEYSTORE_PASS_FILE=/home/eraorahan/Downloads/jepyso-local/android/jepyso-upload.pass \
JEPYSO_SALIDA=/home/eraorahan/Downloads/jepyso-local/android/salida \
ANDROID_HOME=/home/eraorahan/Android/Sdk \
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
systemd-run --user --scope -q -p MemoryMax=6G -p MemorySwapMax=1G -p RuntimeMaxSec=3600 -p CPUQuota=800% -- \
  ./construir.sh
```

Deja en la carpeta de salida:

- `jepyso-<versión>-<código>.aab`, el que se sube a Google Play;
- `jepyso-<versión>-<código>-universal.apk`, para instalarlo a mano en un teléfono (`adb install -r …`).

Los dos van firmados con la clave de subida, y el script lo comprueba al final. Gradle trabaja sin demonio, así que no
queda nada vivo al acabar.

**Una versión nueva** cambia `versionCode` (uno más que la anterior) y `versionName` en `app/build.gradle`, y lo mismo
en `twa-manifest.json` (`appVersionCode` y `appVersion`), para que no se pierda si se regenera el proyecto.

**Regenerar el proyecto** solo hace falta si cambian los colores, los iconos o la versión de Bubblewrap. Bubblewrap
descarga los iconos de la web publicada (`iconos/icono-512.png` y `iconos/maskable-512.png`), y `generar.js` vuelve a
dibujar desde los vectores el icono de la app y la pantalla de arranque, que sacada del PNG de 512 px saldría borrosa.
Lo hace como el icono de la web: con las marcas de esquina desde 96 px (`icono.svg`) y sin ellas por debajo
(`app/iconos/icono.svg`).

```bash
npm install --prefix /home/eraorahan/Downloads/jepyso-local/android/tooling --save-exact @bubblewrap/cli@1.27.0
BUBBLEWRAP_TOOLING=/home/eraorahan/Downloads/jepyso-local/android/tooling node android/generar.js
git diff android/
```

## La clave de subida

- En `/home/eraorahan/Downloads/jepyso-local/android/jepyso-upload.jks`, fuera de git, con permisos 600.
- Alias `oksigenia-jepyso`, RSA de 2048 bits, 10 000 días.
- La contraseña, la misma para el almacén y la clave, en
  `/home/eraorahan/Downloads/jepyso-local/android/jepyso-upload.pass` (permisos 600).
- Huella SHA-256:
  `31:ED:AC:B0:6F:52:A8:51:A4:12:0C:C6:AF:FE:18:49:C8:8F:25:51:B8:CD:DC:A0:2A:05:48:8B:D0:CC:33:E6`.

Es la clave de **subida**. Con la firma de apps de Google Play, Google guarda la clave con la que se firma la app que
llega a los teléfonos; si la de subida se pierde, se pide otra desde Play Console. Las dos cosas, el `.jks` y la
contraseña, van también al gestor de contraseñas.

## App Links: `assetlinks.json`

Para que Android abra los enlaces de `app.jepyso.com` en la app, y para que la web salga sin barra de direcciones, la
web tiene que decir qué app es suya. Lo dice en `https://app.jepyso.com/.well-known/assetlinks.json`, servido tal cual
(tipo `application/json`, sin redirecciones):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.oksigenia.jepyso",
      "sha256_cert_fingerprints": [
        "31:ED:AC:B0:6F:52:A8:51:A4:12:0C:C6:AF:FE:18:49:C8:8F:25:51:B8:CD:DC:A0:2A:05:48:8B:D0:CC:33:E6",
        "<la huella SHA-256 de la clave de firma de Google Play>"
      ]
    }
  }
]
```

- **La primera huella** es la de la clave de subida: vale para el APK que se instala a mano.
- **La segunda** es la de la clave con la que Google Play firma la app que descargan los usuarios. Aparece en Play
  Console cuando se crea la app y se sube el primer AAB («Integridad de la app», «Firma de apps»). Hasta que esté en la
  lista, la app que llega desde Google Play abre la web con barra de direcciones, y los enlaces de rutina se abren en el
  navegador.
- La app ya lleva su parte: en el manifiesto, el filtro de `https://app.jepyso.com` (todas las rutas) con
  `android:autoVerify="true"`, y en `asset_statements`, la referencia a la web.

Para comprobarlo, cuando el archivo esté publicado:

- desde el ordenador, la API de Google:
  `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://app.jepyso.com&relation=delegate_permission/common.handle_all_urls`;
- en un teléfono con la app instalada, `adb shell pm verify-app-links --re-verify com.oksigenia.jepyso` y después
  `adb shell pm get-app-links com.oksigenia.jepyso`, que debe decir `app.jepyso.com: verified`.

Para probar el APK en un teléfono antes de publicar el archivo, Chrome puede saltarse la comprobación para esta web:
con el teléfono en modo de depuración,
`adb shell "echo '_ --disable-digital-asset-link-verification-for-url=\"https://app.jepyso.com\"' > /data/local/tmp/chrome-command-line"`
y, en `chrome://flags`, «Enable command line on non-rooted devices». Solo sirve para la barra de direcciones; los
enlaces desde WhatsApp necesitan el archivo publicado.
