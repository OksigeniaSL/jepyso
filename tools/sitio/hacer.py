#!/usr/bin/env python3
"""Builds jepyso.com, the starting page of Jepyso, into a folder: home, privacy, terms and legal notice, in Spanish
and English, with the app's look (the plaster studio), Oksigenia's signature and the accessibility panel.
Usage: python3 -B tools/sitio/hacer.py [destination]      (default: dist/sitio)
The texts live here; the privacy policy and the terms are the ones published on oksigenia.com (agents/jepyso/docs in
hq). The app is at APP; change it in one place if its address changes."""
import html
import os
import shutil
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEST = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'dist', 'sitio')
APP = 'https://app.jepyso.com/'
SITIO = 'https://jepyso.com'
INDEXNOW = 'a82c52154787ee1d911b4ccb67a68f07'
ACTUALIZADO = {'es': '14 de noviembre de 2026', 'en': '14 November 2026'}
PANEL_V = '0.12.0'

# --- The company, as in oksigenia.com's legal notice.
EMPRESA = {
    'nombre': 'Oksigenia SL',
    'cif': 'B24911489',
    'duns': '473104228',
    'direccion': 'c/o Lafuente Asesores – Calle Heraclio Sánchez 17 – 38204 – La Laguna – S/C de Tenerife, España',
    'registro': 'Inscrita en el Registro Mercantil de Santa Cruz de Tenerife, Hoja TF-76081.',
    'registro_en': 'Registered in the Commercial Registry of Santa Cruz de Tenerife, sheet TF-76081.',
    'correo': 'privacidad@jepyso.com',
}

RUTAS = {
    'es': {'inicio': '/', 'privacidad': '/privacidad/', 'condiciones': '/condiciones/', 'aviso': '/aviso-legal/'},
    'en': {'inicio': '/en/', 'privacidad': '/en/privacy/', 'condiciones': '/en/terms/', 'aviso': '/en/legal/'},
}
PIE = {
    'es': {'privacidad': 'Privacidad', 'condiciones': 'Condiciones de uso', 'aviso': 'Aviso legal', 'acceso': 'Accesibilidad',
           'firma': 'Jepyso · un producto de Oksigenia', 'otra': 'English', 'abrir': 'Abrir la app'},
    'en': {'privacidad': 'Privacy', 'condiciones': 'Terms of use', 'aviso': 'Legal notice', 'acceso': 'Accessibility',
           'firma': 'Jepyso · an Oksigenia product', 'otra': 'Español', 'abrir': 'Open the app'},
}

e = html.escape


def pagina(lengua, clave, titulo, descripcion, cuerpo, hermana):
    r = RUTAS[lengua]
    p = PIE[lengua]
    otra = 'en' if lengua == 'es' else 'es'
    return f'''<!doctype html>
<html lang="{lengua}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{e(titulo)}</title>
  <meta name="description" content="{e(descripcion)}">
  <meta name="theme-color" content="#e4e6e3" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#121517" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="{SITIO}{r[clave]}">
  <link rel="alternate" hreflang="{lengua}" href="{SITIO}{r[clave]}">
  <link rel="alternate" hreflang="{otra}" href="{SITIO}{RUTAS[otra][hermana]}">
  <link rel="icon" href="/icono.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/fuentes/red-hat-text.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/estilos.css">
  <script type="module" src="/vendor/oksigenia-access-panel/oksigenia-access-panel.js?v={PANEL_V}"></script>
  <script type="module" src="/sitio.js"></script>
</head>
<body>
  <header class="cabecera">
    <a class="marca" href="{r['inicio']}" aria-label="Jepyso">jepyso<span aria-hidden="true">°</span></a>
    <nav class="cabecera-nav">
      <a class="enlace-app" href="{APP}">{p['abrir']}</a>
      <a class="otra-lengua" href="{RUTAS[otra][hermana]}" hreflang="{otra}" lang="{otra}">{p['otra']}</a>
    </nav>
  </header>
  <main id="contenido">
{cuerpo}
  </main>
  <footer class="pie">
    <nav class="pie-enlaces" aria-label="{'Textos legales' if lengua == 'es' else 'Legal'}">
      <a href="{r['privacidad']}">{p['privacidad']}</a>
      <a href="{r['condiciones']}">{p['condiciones']}</a>
      <a href="{r['aviso']}">{p['aviso']}</a>
      <button type="button" class="enlace-acceso" data-acceso>{p['acceso']}</button>
    </nav>
    <p class="firma"><a href="https://oksigenia.com{'/en' if lengua == 'en' else ''}">{p['firma']}</a></p>
  </footer>
  <oksigenia-access-panel trigger="none" locale="{lengua}" position="bottom-left" storage-key="jepyso-sitio"
    controls="text-size,line-height,letter-spacing,readable-font,dyslexia-font,contrast,highlight-links,colorblind,reading-guide,big-cursor,big-targets,pause-anim,focus"></oksigenia-access-panel>
</body>
</html>
'''


# --- Home.
INICIO = {
    'es': {
        'titulo': 'Jepyso · Rutinas de ejercicio que se mandan por un enlace',
        'desc': 'Arma la rutina de ejercicios de cada persona y mándasela por un enlace. La hace en su teléfono siguiendo a una figura en 3D, a tu ritmo, sin instalar nada.',
        'cuerpo': f'''    <section class="portada">
      <div class="portada-texto">
        <p class="antetitulo">Rutinas de ejercicio por enlace</p>
        <h1>La rutina que mandas, al ritmo que mandas</h1>
        <p class="entradilla">Arma la rutina de ejercicios de cada persona y mándasela por un enlace. La hace en su teléfono siguiendo a una figura en 3D que va a tu ritmo, del lado y con las series que pusiste. Sin instalar nada, sin cuentas y sin pagar.</p>
        <div class="botones"><a class="boton" href="{APP}">Abrir la app</a><a class="boton secundario" href="#como">Cómo funciona</a></div>
      </div>
      <figure class="portada-figura"><img src="/imagenes/yeso-puente.webp" alt="La figura de Jepyso haciendo el puente de glúteo sobre una esterilla" width="960" height="540"></figure>
    </section>
    <section id="como" class="bloque">
      <h2>Cómo funciona</h2>
      <ol class="pasos">
        <li><h3>Arma la rutina</h3><p>Elige entre los ejercicios de la biblioteca, por zona, por músculo o por nombre. Pon las series, las repeticiones, el ritmo de cada una (cuánto sube, cuánto mantiene, cuánto baja), el lado y la molestia que aceptas. La figura te enseña cómo lo hará.</p></li>
        <li><h3>Mándala por un enlace</h3><p>Por WhatsApp, por Telegram o con un código QR en la consulta. La rutina va dentro del enlace: la persona solo tiene que abrirlo.</p></li>
        <li><h3>Sigue cómo le va</h3><p>La persona hace cada ejercicio con la figura, con voz y sin conexión una vez abierta. Apunta lo que hizo, la molestia que notó y, si quiere, una nota. Te lo devuelve en un enlace y lo ves en su ficha, semana a semana.</p></li>
      </ol>
    </section>
    <section class="bloque">
      <h2>Para quién</h2>
      <p>Para cualquier profesional que manda ejercicio a otras personas, en cualquier país: fisioterapeutas, entrenadores, docentes de Educación Física y centros de mayores. Para quien lo hace, Jepyso es siempre gratis: no instala nada ni se crea una cuenta.</p>
    </section>
    <section class="bloque datos">
      <h2>Tus datos y los de tus pacientes</h2>
      <p>Jepyso no tiene servidor de datos. La rutina viaja dentro del enlace, lo que apunta la persona se queda en su teléfono hasta que te lo manda, y tus fichas se guardan en tu navegador o, en la versión para tu consulta, en tu propio Google Drive. Oksigenia no recibe nada de eso. <a href="/privacidad/">Así lo contamos en la política de privacidad.</a></p>
    </section>
    <section class="bloque versiones">
      <h2>Gratis, y para tu consulta</h2>
      <div class="dos">
        <div class="tarjeta"><h3>Gratis</h3><p>Rutinas por enlace, todas las que quieras, y las fichas y el seguimiento de hasta 5 personas en tu navegador, con copia en un archivo.</p></div>
        <div class="tarjeta"><h3>Para tu consulta</h3><p>Fichas sin límite, en tu Google Drive y en todos tus aparatos, con copia. Pago único, sin cuotas. Muy pronto.</p></div>
      </div>
    </section>
    <section class="bloque cierre">
      <a class="boton" href="{APP}">Abrir la app</a>
    </section>''',
    },
    'en': {
        'titulo': 'Jepyso · Exercise routines sent as a link',
        'desc': 'Build each person’s exercise routine and send it as a link. They do it on their phone, following a 3D figure at the pace you set, with nothing to install.',
        'cuerpo': f'''    <section class="portada">
      <div class="portada-texto">
        <p class="antetitulo">Exercise routines sent as a link</p>
        <h1>The routine you set, at the pace you set</h1>
        <p class="entradilla">Build each person’s exercise routine and send it as a link. They do it on their phone, following a 3D figure that moves at your pace, on the side and with the sets you chose. Nothing to install, no accounts and nothing to pay.</p>
        <div class="botones"><a class="boton" href="{APP}">Open the app</a><a class="boton secundario" href="#how">How it works</a></div>
        <p class="nota-lengua">The app is in Spanish for now; more languages are coming.</p>
      </div>
      <figure class="portada-figura"><img src="/imagenes/yeso-puente.webp" alt="Jepyso’s figure doing a glute bridge on a mat" width="960" height="540"></figure>
    </section>
    <section id="how" class="bloque">
      <h2>How it works</h2>
      <ol class="pasos">
        <li><h3>Build the routine</h3><p>Pick exercises from the library by body area, muscle or name. Set the sets, the repetitions, the pace of each one (how long up, hold and down), the side and the discomfort you accept. The figure shows you how it will be done.</p></li>
        <li><h3>Send it as a link</h3><p>Over WhatsApp, Telegram or a QR code in your practice. The routine travels inside the link: the person only has to open it.</p></li>
        <li><h3>Follow how it goes</h3><p>The person does each exercise with the figure, with voice guidance and offline once opened. They record what they did, the discomfort they felt and, if they like, a note. It comes back to you as a link, and you see it in their file, week by week.</p></li>
      </ol>
    </section>
    <section class="bloque">
      <h2>Who it is for</h2>
      <p>For any professional who prescribes exercise, in any country: physiotherapists, trainers, PE teachers and care homes. For the person doing it, Jepyso is always free: nothing to install and no account to create.</p>
    </section>
    <section class="bloque datos">
      <h2>Your data and your patients’</h2>
      <p>Jepyso has no data server. The routine travels inside the link, what the person records stays on their phone until they send it to you, and your files are kept in your browser or, in the version for your practice, in your own Google Drive. Oksigenia receives none of it. <a href="/en/privacy/">This is how our privacy policy puts it.</a></p>
    </section>
    <section class="bloque versiones">
      <h2>Free, and for your practice</h2>
      <div class="dos">
        <div class="tarjeta"><h3>Free</h3><p>Routines as links, as many as you like, and files and follow-up for up to 5 people in your browser, with a copy in a file.</p></div>
        <div class="tarjeta"><h3>For your practice</h3><p>Unlimited files, in your Google Drive and on all your devices, with a backup. One payment, no subscription. Coming very soon.</p></div>
      </div>
    </section>
    <section class="bloque cierre">
      <a class="boton" href="{APP}">Open the app</a>
    </section>''',
    },
}


def texto_legal(titulo, actualizado, bloques):
    partes = [f'    <article class="legal">\n      <h1>{e(titulo)}</h1>\n      <p class="fecha">{e(actualizado)}</p>']
    for b in bloques:
        partes.append('      ' + b)
    partes.append('    </article>')
    return '\n'.join(partes)


PRIVACIDAD = {
    'es': ('Política de privacidad de Jepyso', f'Última actualización: {ACTUALIZADO["es"]}.', [
        '<p>Jepyso es una aplicación de Oksigenia SL (ver el <a href="/aviso-legal/">aviso legal</a>). Con ella, un profesional del ejercicio arma rutinas y se las manda a cada persona por un enlace; la persona las hace en su móvil siguiendo a una figura en 3D.</p>',
        '<h2>Oksigenia no guarda tus datos</h2>',
        '<p>Jepyso no tiene servidor de datos: todo lo que maneja se queda en tus aparatos o en tu propia nube.</p>',
        '<ul>',
        '<li><strong>Las rutinas</strong> viajan dentro del enlace que manda el profesional. Al abrirlo, esa parte del enlace no llega a ningún servidor: la lee el navegador de quien lo abre. Mientras va de un aparato a otro, viaja como cualquier mensaje de la aplicación con la que se manda (WhatsApp, Telegram u otra), con las condiciones de esa aplicación.</li>',
        '<li><strong>Lo que apunta la persona</strong> (repeticiones, molestia y, si quiere, una nota) se guarda en su navegador y, si quiere, se lo manda al profesional por WhatsApp o Telegram, como un enlace más.</li>',
        '<li><strong>Las fichas del profesional</strong> (personas, rutinas, seguimiento y plantillas) se guardan en su navegador. Puede guardar una copia en un archivo cuando quiera.</li>',
        '<li><strong>Con Google Drive</strong> (versión de pago), las fichas se guardan además en una carpeta «Jepyso» del Drive del propio profesional. Jepyso pide a Google un solo permiso, el de los archivos que crea la propia app (<code>https://www.googleapis.com/auth/drive.file</code>): no puede ver ni tocar el resto del Drive. Para comprobar la licencia de la versión de pago, lee la dirección de la cuenta con la que se conecta el Drive, y la compara en el propio navegador con la de la licencia. La conexión se hace desde el navegador, directamente entre tu aparato y Google, y el permiso dura poco y no se guarda. Puedes quitárselo cuando quieras en la configuración de tu cuenta de Google («Seguridad», «Aplicaciones de terceros»); tus archivos siguen siendo tuyos y puedes borrarlos desde tu Drive.</li>',
        '<li><strong>El recordatorio en el calendario</strong> es un archivo que se hace en tu teléfono y abre tu propio calendario; no pasa por ningún servidor.</li>',
        '<li><strong>La voz</strong> que guía la serie usa solo las voces del propio teléfono: lo que dice no se manda a ninguna parte.</li>',
        '</ul>',
        '<h2>Uso de los datos de Google</h2>',
        '<p>El uso que hace Jepyso de la información recibida de las API de Google, y su transferencia a cualquier otra aplicación, cumplen la <a href="https://developers.google.com/terms/api-services-user-data-policy">Política de Datos del Usuario de los Servicios de las API de Google</a>, incluidos los requisitos de uso limitado. Jepyso usa esos datos solo para guardar y leer tus fichas en tu Drive y para comprobar tu licencia; no los vende, no los cede, no los usa para publicidad y nadie de Oksigenia los lee.</p>',
        '<h2>Sin rastreo</h2>',
        '<p>Jepyso y esta página no usan cookies de publicidad ni de análisis, ni rastreadores de terceros.</p>',
        f'<h2>Contacto</h2><p>Para cualquier pregunta sobre privacidad, o para ejercer tus derechos: <a href="mailto:{EMPRESA["correo"]}">{EMPRESA["correo"]}</a>.</p>',
    ]),
    'en': ('Jepyso privacy policy', f'Last updated: {ACTUALIZADO["en"]}.', [
        '<p>Jepyso is an app by Oksigenia SL (see the <a href="/en/legal/">legal notice</a>). With it, an exercise professional builds routines and sends them to each person as a link; the person does them on their phone, following a 3D figure.</p>',
        '<h2>Oksigenia does not keep your data</h2>',
        '<p>Jepyso has no data server: everything it handles stays on your devices or in your own cloud.</p>',
        '<ul>',
        '<li><strong>Routines</strong> travel inside the link the professional sends. When it is opened, that part of the link never reaches a server: the browser of whoever opens it reads it. On its way from one device to another, it travels like any message of the app used to send it (WhatsApp, Telegram or another), under that app’s terms.</li>',
        '<li><strong>What the person records</strong> (repetitions, discomfort and, if they like, a note) is kept in their browser and, if they want, sent to the professional over WhatsApp or Telegram, as one more link.</li>',
        '<li><strong>The professional’s files</strong> (people, routines, follow-up and templates) are kept in their browser. They can save a copy to a file at any time.</li>',
        '<li><strong>With Google Drive</strong> (paid version), the files are also kept in a «Jepyso» folder in the professional’s own Drive. Jepyso asks Google for a single permission, for the files the app itself creates (<code>https://www.googleapis.com/auth/drive.file</code>): it cannot see or change the rest of the Drive. To check the paid version’s licence, it reads the address of the account the Drive is connected with and compares it, in the browser itself, with the licence’s. The connection goes from the browser, straight between your device and Google; the permission is short-lived and is not stored. You can remove it at any time in your Google account settings («Security», «Third-party apps»); your files stay yours and you can delete them from your Drive.</li>',
        '<li><strong>The calendar reminder</strong> is a file made on your phone that opens your own calendar; it goes through no server.</li>',
        '<li><strong>The voice</strong> that guides a set only uses the phone’s own voices: nothing it says is sent anywhere.</li>',
        '</ul>',
        '<h2>Use of Google user data</h2>',
        '<p>Jepyso’s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements. Jepyso uses that data only to save and read your files in your Drive and to check your licence; it does not sell it, share it, use it for advertising, and no one at Oksigenia reads it.</p>',
        '<h2>No tracking</h2>',
        '<p>Jepyso and this site use no advertising or analytics cookies and no third-party trackers.</p>',
        f'<h2>Contact</h2><p>For any privacy question, or to exercise your rights: <a href="mailto:{EMPRESA["correo"]}">{EMPRESA["correo"]}</a>.</p>',
    ]),
}

CONDICIONES = {
    'es': ('Condiciones de uso de Jepyso', f'Última actualización: {ACTUALIZADO["es"]}.', [
        '<p>Jepyso es una aplicación de Oksigenia SL (ver el <a href="/aviso-legal/">aviso legal</a>). Con ella, un profesional del ejercicio arma rutinas y se las manda a cada persona por un enlace; la persona las hace en su móvil siguiendo a una figura en 3D. Al usar Jepyso aceptas estas condiciones.</p>',
        '<h2>Quién decide la rutina</h2><p>La rutina de cada persona la decide su profesional: los ejercicios, el ritmo, las series y la molestia que se acepta. Jepyso es la herramienta con la que la manda y la sigue; no diagnostica, no receta y no sustituye al profesional.</p>',
        '<h2>Si haces una rutina</h2><p>Hazla como te la mandó tu profesional. Si notas una molestia mayor de la acordada, para y cuéntaselo. Para y avisa a quien te dio la rutina si notas un dolor fuerte o distinto del de siempre, mareo, dolor en el pecho, falta de aire, u hormigueo o dolor que baja por un brazo o una pierna. No hace falta cuenta ni instalar nada, y la rutina no cuesta nada a quien la hace.</p>',
        '<h2>Si mandas rutinas</h2><p>Las rutinas que mandas y lo que apuntas de cada persona son tuyos, y eres tú quien responde de ellos ante tus pacientes o clientes. Jepyso los guarda en tu navegador y, en la versión de pago, en tu propio Google Drive; Oksigenia no los recibe (ver la <a href="/privacidad/">política de privacidad</a>). Haz copia de vez en cuando: si borras los datos del navegador y no tienes copia ni Drive conectado, se pierden.</p>',
        '<h2>Versión gratuita y versión de pago</h2><p>Mandar rutinas por un enlace es gratis. La versión de pago añade, entre otras cosas, las fichas sin límite y guardadas en tu Drive; se activa con una licencia personal, ligada a la cuenta de Google de tu Drive, y su precio y lo que incluye se indican al contratarla.</p>',
        '<h2>Los ejercicios y las figuras</h2><p>Las figuras en 3D, sus movimientos y los textos de los ejercicios son de Oksigenia SL: puedes usarlos dentro de Jepyso, pero no copiarlos para otros fines. El código de la aplicación es software libre (GNU GPL v3 o posterior) y está publicado en <a href="https://github.com/OksigeniaSL/jepyso">github.com/OksigeniaSL/jepyso</a>.</p>',
        '<h2>Cambios y disponibilidad</h2><p>Jepyso se mejora a menudo: pueden cambiar sus pantallas, sus ejercicios y estas condiciones. Si cambian estas condiciones, se actualiza la fecha de arriba. Se ofrece tal como está, y Oksigenia pone el cuidado razonable en que funcione bien.</p>',
        '<h2>Ley</h2><p>Estas condiciones se rigen por la ley española.</p>',
        f'<h2>Contacto</h2><p>Para cualquier pregunta: <a href="mailto:{EMPRESA["correo"]}">{EMPRESA["correo"]}</a>.</p>',
    ]),
    'en': ('Jepyso terms of use', f'Last updated: {ACTUALIZADO["en"]}.', [
        '<p>Jepyso is an app by Oksigenia SL (see the <a href="/en/legal/">legal notice</a>). With it, an exercise professional builds routines and sends them to each person as a link; the person does them on their phone, following a 3D figure. By using Jepyso you accept these terms.</p>',
        '<h2>Who decides the routine</h2><p>Each person’s routine is decided by their professional: the exercises, the pace, the sets and the discomfort that is acceptable. Jepyso is the tool they use to send it and follow it up; it does not diagnose, does not prescribe and does not replace the professional.</p>',
        '<h2>If you do a routine</h2><p>Do it as your professional set it. If you feel more discomfort than agreed, stop and tell them. Stop and tell whoever gave you the routine if you feel a strong or unusual pain, dizziness, chest pain, shortness of breath, or tingling or pain running down an arm or a leg. You need no account and nothing to install, and the routine costs nothing to the person who does it.</p>',
        '<h2>If you send routines</h2><p>The routines you send and what you record about each person are yours, and you answer for them to your patients or clients. Jepyso keeps them in your browser and, in the paid version, in your own Google Drive; Oksigenia does not receive them (see the <a href="/en/privacy/">privacy policy</a>). Keep a copy now and then: if you clear your browser’s data and have no copy and no Drive connected, they are lost.</p>',
        '<h2>Free and paid versions</h2><p>Sending routines as a link is free. The paid version adds, among other things, unlimited files kept in your Drive; it is switched on with a personal licence, tied to the Google account of your Drive, and its price and what it includes are shown when you buy it.</p>',
        '<h2>Exercises and figures</h2><p>The 3D figures, their movements and the exercise texts belong to Oksigenia SL: you can use them within Jepyso, but not copy them for other purposes. The app’s code is free software (GNU GPL v3 or later) and is published at <a href="https://github.com/OksigeniaSL/jepyso">github.com/OksigeniaSL/jepyso</a>.</p>',
        '<h2>Changes and availability</h2><p>Jepyso is improved often: its screens, its exercises and these terms may change. If these terms change, the date above is updated. It is provided as it is, and Oksigenia takes reasonable care that it works well.</p>',
        '<h2>Law</h2><p>These terms are governed by Spanish law.</p>',
        f'<h2>Contact</h2><p>For any question: <a href="mailto:{EMPRESA["correo"]}">{EMPRESA["correo"]}</a>.</p>',
    ]),
}

AVISO = {
    'es': ('Aviso legal', f'Última actualización: {ACTUALIZADO["es"]}.', [
        '<p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), estos son los datos de quien está detrás de jepyso.com y de la aplicación Jepyso.</p>',
        '<h2>Datos identificativos</h2>',
        f'<dl class="datos-empresa"><dt>Denominación social</dt><dd>{EMPRESA["nombre"]}</dd><dt>CIF</dt><dd>{EMPRESA["cif"]}</dd><dt>D-U-N-S®</dt><dd>{EMPRESA["duns"]}</dd><dt>Dirección de contacto</dt><dd>{e(EMPRESA["direccion"])}</dd><dt>Datos registrales</dt><dd>{EMPRESA["registro"]}</dd><dt>Correo</dt><dd><a href="mailto:{EMPRESA["correo"]}">{EMPRESA["correo"]}</a></dd><dt>Dominios</dt><dd>jepyso.com y app.jepyso.com</dd></dl>',
        '<p>La dirección postal corresponde a Lafuente Asesores, asesoría externa con sede en La Laguna (Tenerife) autorizada por Oksigenia SL para recibir comunicaciones y notificaciones. Lafuente Asesores no forma parte de Oksigenia SL; actúa solo como destinatario de correspondencia administrativa.</p>',
        '<h2>Propiedad intelectual e industrial</h2><p>El diseño de esta web y de la aplicación, sus textos, las figuras en 3D y sus movimientos pertenecen a Oksigenia SL. El código de la aplicación es software libre (GNU GPL v3 o posterior). OKSIGENIA® es una marca registrada.</p>',
        '<h2>Contenidos</h2><p>Oksigenia SL no responde de la legalidad de otros sitios web a los que se pueda llegar desde esta web. Puede cambiar esta web y la aplicación sin previo aviso para mantenerlas al día.</p>',
        '<h2>Uso</h2><p>Quien usa esta web y la aplicación se compromete a hacerlo de forma adecuada, sin actividades ilícitas ni contrarias a la buena fe. El uso de la aplicación se rige además por sus <a href="/condiciones/">condiciones de uso</a>, y los datos, por su <a href="/privacidad/">política de privacidad</a>.</p>',
        '<h2>Ley aplicable y jurisdicción</h2><p>La ley aplicable es la española. Para resolver cualquier conflicto, Oksigenia SL y el usuario se someten a los juzgados y tribunales del domicilio del usuario cuando tenga la condición de consumidor y, si no, a los de Santa Cruz de Tenerife.</p>',
    ]),
    'en': ('Legal notice', f'Last updated: {ACTUALIZADO["en"]}.', [
        '<p>Under article 10 of the Spanish Law 34/2002 on Information Society Services and Electronic Commerce (LSSI-CE), these are the details of who is behind jepyso.com and the Jepyso app.</p>',
        '<h2>Company details</h2>',
        f'<dl class="datos-empresa"><dt>Company name</dt><dd>{EMPRESA["nombre"]}</dd><dt>Tax ID (CIF)</dt><dd>{EMPRESA["cif"]}</dd><dt>D-U-N-S®</dt><dd>{EMPRESA["duns"]}</dd><dt>Contact address</dt><dd>{e(EMPRESA["direccion"])}</dd><dt>Registration</dt><dd>{EMPRESA["registro_en"]}</dd><dt>Email</dt><dd><a href="mailto:{EMPRESA["correo"]}">{EMPRESA["correo"]}</a></dd><dt>Domains</dt><dd>jepyso.com and app.jepyso.com</dd></dl>',
        '<p>The postal address is that of Lafuente Asesores, an external advisory firm in La Laguna (Tenerife) authorised by Oksigenia SL to receive communications and notifications. Lafuente Asesores is not part of Oksigenia SL; it only receives administrative mail.</p>',
        '<h2>Intellectual and industrial property</h2><p>The design of this site and of the app, their texts, the 3D figures and their movements belong to Oksigenia SL. The app’s code is free software (GNU GPL v3 or later). OKSIGENIA® is a registered trademark.</p>',
        '<h2>Content</h2><p>Oksigenia SL is not responsible for the lawfulness of other websites reachable from this one. It may change this site and the app without notice to keep them up to date.</p>',
        '<h2>Use</h2><p>Whoever uses this site and the app agrees to do so properly, with no unlawful activity or activity contrary to good faith. The use of the app is also governed by its <a href="/en/terms/">terms of use</a>, and data by its <a href="/en/privacy/">privacy policy</a>.</p>',
        '<h2>Applicable law and jurisdiction</h2><p>Spanish law applies. To settle any dispute, Oksigenia SL and the user submit to the courts of the user’s place of residence when they are a consumer and, otherwise, to those of Santa Cruz de Tenerife.</p>',
    ]),
}


def escribir(ruta, contenido):
    destino = os.path.join(DEST, ruta.strip('/'), 'index.html') if ruta != '/' else os.path.join(DEST, 'index.html')
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, 'w', encoding='utf-8') as f:
        f.write(contenido)


def main():
    if os.path.isdir(DEST):
        shutil.rmtree(DEST)
    os.makedirs(DEST)
    aqui = os.path.dirname(os.path.abspath(__file__))
    app = os.path.join(RAIZ, 'app')
    for f in ('estilos.css', 'sitio.js', 'robots.txt'):
        shutil.copy(os.path.join(aqui, f), DEST)
    shutil.copytree(os.path.join(app, 'fuentes'), os.path.join(DEST, 'fuentes'))
    os.makedirs(os.path.join(DEST, 'imagenes'))
    shutil.copy(os.path.join(app, 'imagenes', 'yeso-puente.webp'), os.path.join(DEST, 'imagenes'))
    shutil.copy(os.path.join(app, 'iconos', 'icono.svg'), DEST)
    shutil.copy(os.path.join(app, 'iconos', 'apple-touch-icon.png'), DEST)
    shutil.copytree(os.path.join(app, 'vendor', 'oksigenia-access-panel'), os.path.join(DEST, 'vendor', 'oksigenia-access-panel'))
    for lengua in ('es', 'en'):
        r = RUTAS[lengua]
        i = INICIO[lengua]
        escribir(r['inicio'], pagina(lengua, 'inicio', i['titulo'], i['desc'], i['cuerpo'], 'inicio'))
        for clave, textos in (('privacidad', PRIVACIDAD), ('condiciones', CONDICIONES), ('aviso', AVISO)):
            titulo, fecha, bloques = textos[lengua]
            escribir(r[clave], pagina(lengua, clave, f'{titulo} · Jepyso', titulo, texto_legal(titulo, fecha, bloques), clave))
    # The sitemap, for the search engines.
    urls = [f'{SITIO}{r[k]}' for r in RUTAS.values() for k in r]
    with open(os.path.join(DEST, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        f.writelines(f'  <url><loc>{u}</loc></url>\n' for u in urls)
        f.write('</urlset>\n')
    # The IndexNow key (public by design): with it, the upload tells Bing and the others what changed.
    with open(os.path.join(DEST, f'{INDEXNOW}.txt'), 'w', encoding='utf-8') as f:
        f.write(INDEXNOW)
    print(DEST)


if __name__ == '__main__':
    main()
