#!/usr/bin/env python3
"""Builds jepyso.com, the starting page of Jepyso, into a folder: home, privacy, terms and legal notice, in Spanish
and English, with the app's look (the plaster studio), Oksigenia's signature and the accessibility panel.
Usage: python3 -B tools/sitio/hacer.py [destination]      (default: dist/sitio)
The texts live here; the privacy policy and the terms are the ones published on oksigenia.com (agents/jepyso/docs in
hq). The app is at APP; change it in one place if its address changes."""
import html
import json
import os
import re
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
    'es': {'inicio': '/', 'precios': '/precios/', 'privacidad': '/privacidad/', 'condiciones': '/condiciones/', 'aviso': '/aviso-legal/'},
    'en': {'inicio': '/en/', 'precios': '/en/pricing/', 'privacidad': '/en/privacy/', 'condiciones': '/en/terms/', 'aviso': '/en/legal/'},
}
PIE = {
    'es': {'precios_corto': 'Precios', 'precios': 'Planes y precios', 'privacidad': 'Privacidad', 'condiciones': 'Condiciones de uso', 'aviso': 'Aviso legal', 'acceso': 'Accesibilidad',
           'firma': 'Jepyso · un producto de Oksigenia', 'otra': 'English', 'abrir': 'Abrir la app'},
    'en': {'precios_corto': 'Pricing', 'precios': 'Plans and pricing', 'privacidad': 'Privacy', 'condiciones': 'Terms of use', 'aviso': 'Legal notice', 'acceso': 'Accessibility',
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
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/icono.svg" type="image/svg+xml">
  <link rel="icon" href="/icono-96.png" sizes="96x96" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/fuentes/red-hat-text.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/estilos.css">
  <script type="module" src="/vendor/oksigenia-access-panel/oksigenia-access-panel.js?v={PANEL_V}"></script>
  <script type="module" src="/sitio.js"></script>{PORTADA_HEAD if clave == 'inicio' else ''}
</head>
<body{' class="inicio"' if clave == 'inicio' else ''}>
  <header class="cabecera">
    <a class="marca" href="{r['inicio']}" aria-label="Jepyso">jepyso<span aria-hidden="true">°</span></a>
    <nav class="cabecera-nav">
      <a class="enlace-precios" href="{r['precios']}">{p['precios_corto']}</a>
      <a class="enlace-app" href="{APP}">{p['abrir']}</a>
      <a class="otra-lengua" href="{RUTAS[otra][hermana]}" hreflang="{otra}" lang="{otra}">{p['otra']}</a>
    </nav>
  </header>
  <main id="contenido">
{cuerpo}
  </main>
  <footer class="pie">
    <nav class="pie-enlaces" aria-label="{'Textos legales' if lengua == 'es' else 'Legal'}">
      <a href="{r['precios']}">{p['precios']}</a>
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


# --- Plans and pricing (Enrique, 15-11-2026, docs/decisiones.md of hq). Sold only here, on the web: the app of Google
# Play sells nothing. The payment links are the coordinator's (Stripe); each one asks for the Google account the licence
# goes to.
PAGO = {
    'profesional': 'https://buy.stripe.com/cNieVe4k4c0Q8Xc3gXbAs0q',
    'centro': 'https://buy.stripe.com/8x2dRa6sc5CsddsdVBbAs0r',
    'ampliar': 'https://buy.stripe.com/5kQaEY9Eo4yoehwdVBbAs0s',
}
PRECIOS = {
    'es': ('Planes y precios', 'Gratis hasta 5 personas con ficha. Profesional, hasta 50, por 59 €; Centro, hasta 300, por 149 €. Pago único, de por vida.', f'''    <section class="legal precios">
      <h1>Planes y precios</h1>
      <p class="entradilla">Pago único, de por vida y sin cuotas. Para quien hace la rutina, Jepyso es siempre gratis: no instala nada ni crea ninguna cuenta.</p>
      <div class="tres">
        <div class="tarjeta plan"><h2>Gratis</h2><p class="precio">0 €</p><ul><li>Rutinas por enlace, todas las que quieras</li><li>Fichas y seguimiento de hasta <strong>5 personas</strong></li><li>En tu navegador, con copia en un archivo</li></ul><a class="boton secundario" href="{APP}">Empezar gratis</a></div>
        <div class="tarjeta plan"><h2>Profesional</h2><p class="precio">59 €</p><ul><li>Fichas y seguimiento de hasta <strong>50 personas</strong></li><li>En tu Google Drive, en todos tus aparatos</li><li>Pago único, de por vida</li></ul><a class="boton" href="{PAGO['profesional']}">Comprar Profesional</a></div>
        <div class="tarjeta plan"><h2>Centro</h2><p class="precio">149 €</p><ul><li>Fichas y seguimiento de hasta <strong>300 personas</strong></li><li>En tu Google Drive, en todos tus aparatos</li><li>Pago único, de por vida</li></ul><a class="boton" href="{PAGO['centro']}">Comprar Centro</a></div>
      </div>
      <p>¿Ya tienes Profesional? <a href="{PAGO['ampliar']}">Pasa a Centro pagando la diferencia: 90 €</a>.</p>
      <h2>Antes de pagar</h2>
      <p><strong>Escribe en el pago la cuenta de Google con la que entras en Jepyso.</strong> La licencia va ligada a esa cuenta y a su Google Drive: con otra cuenta no se activa.</p>
      <h2>Después de pagar</h2>
      <p>En unos minutos te llega un correo con el enlace que activa tu licencia y, aparte, la factura. Abre el enlace en el aparato donde usas Jepyso y conecta tu Google Drive con esa misma cuenta. Si lo usas en más aparatos, ábrelo también en cada uno.</p>
      <h2>Condiciones</h2>
      <ul>
        <li>La licencia es de por vida: no caduca ni se renueva.</li>
        <li>Jepyso puede dejar de mantenerse algún día. Su código es libre, así que quien quiera puede seguirlo, y tu licencia sigue funcionando con la última versión publicada.</li>
        <li>Si cambias de cuenta de Google, escríbenos a <a href="mailto:contacto@oksigenia.com">contacto@oksigenia.com</a> y te mandamos la licencia para la cuenta nueva. Las fichas se llevan con el archivo de copia.</li>
        <li>El pago lo procesa Stripe: Oksigenia no ve los datos de tu tarjeta.</li>
        <li>El uso de Jepyso se rige por sus <a href="/condiciones/">condiciones de uso</a>, y los datos, por su <a href="/privacidad/">política de privacidad</a>.</li>
      </ul>
    </section>'''),
    'en': ('Plans and pricing', 'Free for up to 5 people with a file. Professional, up to 50, for €59; Centre, up to 300, for €149. One payment, for life.', f'''    <section class="legal precios">
      <h1>Plans and pricing</h1>
      <p class="entradilla">One payment, for life, no subscription. For the person who does the routine, Jepyso is always free: nothing to install and no account to create.</p>
      <p class="nota-lengua">The app is in Spanish for now; more languages are coming.</p>
      <div class="tres">
        <div class="tarjeta plan"><h2>Free</h2><p class="precio">€0</p><ul><li>Routines as a link, as many as you like</li><li>Files and follow-up of up to <strong>5 people</strong></li><li>In your browser, with a backup file</li></ul><a class="boton secundario" href="{APP}">Start for free</a></div>
        <div class="tarjeta plan"><h2>Professional</h2><p class="precio">€59</p><ul><li>Files and follow-up of up to <strong>50 people</strong></li><li>In your Google Drive, on all your devices</li><li>One payment, for life</li></ul><a class="boton" href="{PAGO['profesional']}">Buy Professional</a></div>
        <div class="tarjeta plan"><h2>Centre</h2><p class="precio">€149</p><ul><li>Files and follow-up of up to <strong>300 people</strong></li><li>In your Google Drive, on all your devices</li><li>One payment, for life</li></ul><a class="boton" href="{PAGO['centro']}">Buy Centre</a></div>
      </div>
      <p>Already on Professional? <a href="{PAGO['ampliar']}">Move to Centre by paying the difference: €90</a>.</p>
      <h2>Before you pay</h2>
      <p><strong>Write in the payment the Google account you sign in to Jepyso with.</strong> The licence is tied to that account and its Google Drive: it does not work with another one.</p>
      <h2>After you pay</h2>
      <p>Within minutes you get an email with the link that activates your licence and, separately, the invoice. Open the link on the device where you use Jepyso and connect your Google Drive with that same account. If you use it on more devices, open it on each one too.</p>
      <h2>Terms</h2>
      <ul>
        <li>The licence is for life: it does not expire and is not renewed.</li>
        <li>Jepyso may stop being maintained one day. Its code is free, so anyone who wants can carry it on, and your licence keeps working with the last published version.</li>
        <li>If you change your Google account, write to us at <a href="mailto:contacto@oksigenia.com">contacto@oksigenia.com</a> and we send you the licence for the new account. Your files go with the backup file.</li>
        <li>Payment is processed by Stripe: Oksigenia never sees your card details.</li>
        <li>The use of Jepyso is governed by its <a href="/en/terms/">terms of use</a>, and data by its <a href="/en/privacy/">privacy policy</a>.</li>
      </ul>
    </section>'''),
}


# --- Home.
# --- The home, «the room» (Jujol, 16-11-2026; Enrique chose it among three paths, agents/arte/docs/decisiones.md in hq):
# the app's own figure stays in its plaster room while the story goes down beside it, and each step changes what it does
# and what lies over it (portada.js). The texts, here; the room's layers are example data (Ana, Carlos).
PORTADA_HEAD = '''
  <script src="/vendor/qrcode/qrcode.js" defer></script>
  <script type="module" src="/portada.js"></script>'''

# The exercises the room plays: the figure, three.js and these clips are copied from app/ (copiar_figura).
FIGURA_EJERCICIOS = ('puente', 'silla', 'hombro')
EJEMPLO = 'https://app.jepyso.com/#r=7Kq2mX'

T = {
    'es': {
        'titulo': 'Jepyso · Rutinas de ejercicio que se mandan por un enlace',
        'desc': 'Arma la rutina de ejercicios de cada persona y mándasela por un enlace. La hace en su teléfono siguiendo a una figura en 3D, a tu ritmo, sin instalar nada.',
        'h1': 'La rutina que mandas, <span>al ritmo que mandas</span>',
        'entradilla': 'Arma la rutina de cada persona y mándasela por un enlace. La hace en su teléfono siguiendo a esta figura, que sube, mantiene y baja al ritmo que pones, del lado que toca y serie tras serie. Sin instalar nada y sin crear cuentas.',
        'empezar': 'Empezar gratis', 'ver_planes': 'Ver los planes',
        'escena': 'La figura de Jepyso haciendo los ejercicios de una rutina de ejemplo',
        'pasos': [
            ('01 · Arma', 'Arma la rutina', 'Para fisioterapia, entrenamiento, Educación Física o un centro de mayores, en cualquier sitio. Elige entre casi cien ejercicios, por zona, por músculo o por nombre, con los programas Otago y Vivifrail dentro. Pon las series, las repeticiones, cuánto sube, cuánto mantiene, cuánto baja, el lado y la molestia que aceptas. La figura te enseña cómo lo hará.'),
            ('02 · Manda', 'Mándala por un enlace', 'Por WhatsApp, por Telegram, por correo o con un código QR en la consulta. La rutina va dentro del enlace: la persona solo tiene que abrirlo. No instala nada, no se crea una cuenta y no paga.'),
            ('03 · Hace', 'La hace con la figura', 'La figura cumple la pauta: la fase en grande, la cuenta atrás, un sonido y una vibración en cada repetición, y una voz que guía, la de Mira o la de Altair, a elegir. Sin conexión, una vez abierta.'),
            ('04 · Vuelve', 'Te devuelve lo que hizo', 'Al acabar apunta lo que hizo y la molestia que notó, y te lo manda en otro enlace. Lo ves en su ficha, día a día y semana a semana. Quien no te ha mandado nada en dos semanas te sale a la vista, con el mensaje listo para escribirle.'),
        ],
        'pauta': {'puente': 'Tu pauta · puente de glúteo · 2 × 10', 'silla': 'Tu pauta · levantarse de la silla · 2 × 8',
                  'hombro': 'Tu pauta · rotación externa con banda · lado derecho'},
        'fase0': 'Sube la cadera', 'sube': 'Sube', 'mantiene': 'Mantiene', 'baja': 'Baja', 'de': 'de', 'girar': 'Gírala con el dedo',
        'rutina': 'Rutina de Ana · 3 días a la semana',
        'filas': [('Levantarse de la silla', '2 × 8 · 2 · 1 · 2 s'), ('Puente de glúteo', '2 × 10 · 2 · 1 · 2 s'), ('Rotación externa con banda', '2 × 12 · lado derecho')],
        'aceptable_txt': 'Molestia aceptable <b>5</b> de 10',
        'mensaje': 'Ana, aquí tienes tu rutina. Ábrela cuando vayas a hacerla:', 'qr': 'O con el QR, en la consulta',
        'serie': 'Rotación externa con banda · lado derecho', 'serie_cifras': '<b>Serie 1</b> de 2 · <b class="serie-cuenta">1</b> de 12',
        'voz0': '«Lleva la mano hacia fuera»',
        'resumen': 'Resumen para Carlos', 'resumen_h': 'Ana ha hecho su rutina 3 veces', 'resumen_baja': 'La molestia bajó de 5 a 2',
        'dias': [('Sábado 14', 2), ('Jueves 12', 4), ('Martes 10', 5)],
        'metodo_e': 'La molestia, con método', 'metodo_h': 'Cada rutina lleva la molestia que aceptas',
        'metodo_p': 'Pones hasta dónde puede llegar, de 0 a 10. Si la persona la pasa, se le dice y el día te sale marcado. A la mañana siguiente se le pregunta cómo estaba la zona al levantarse. Es el modelo de control del dolor, el más citado para dosificar el ejercicio cuando hay molestia.',
        'regla_aria': 'Escala de molestia de 0 a 10, aceptable hasta 5; el martes llegó a 7 y salió marcado',
        'aceptable': 'Aceptable', 'hoy': 'Hoy', 'marcado': 'Martes · marcado',
        'datos_e': 'Tus datos, contigo', 'datos_h': 'Jepyso no tiene servidor de datos',
        'tu_tel': ('Tu teléfono', 'Tus fichas, y con un plan, también en tu Google Drive'),
        'su_tel': ('Su teléfono', 'Lo que apunta se queda ahí hasta que te lo manda'),
        'ida': 'La rutina, dentro del enlace', 'vuelta': 'Lo que hizo, en otro enlace',
        'nada': '<b>Oksigenia no recibe nada de eso.</b> Ni la rutina, ni lo que hace la persona, ni sus molestias. <a href="/privacidad/">Así lo cuenta la política de privacidad.</a>',
        'planes_e': 'Planes', 'planes_h': 'Gratis para empezar. Un solo pago para tu consulta',
        'planes': [('Gratis', '0 €', 5, 'Rutinas por enlace, todas las que quieras, y las fichas de hasta <b>5 personas</b>, en tu teléfono.', 'Empezar gratis', APP, ' secundario'),
                   ('Profesional', '59 €', 50, 'Las fichas de hasta <b>50 personas</b>, en tu Google Drive y en todos tus aparatos.', 'Ver Profesional', '/precios/', ''),
                   ('Centro', '149 €', 300, 'Las fichas de hasta <b>300 personas</b>, en tu Google Drive y en todos tus aparatos.', 'Ver Centro', '/precios/', '')],
        'planes_nota': 'Pago único, de por vida, sin cuotas. Para quien hace la rutina, siempre gratis. <a href="/precios/">Todo sobre los planes</a>',
        'centro': ('En tu centro', 'Dentro de la plataforma del centro', 'Para colegios, universidades y centros de formación: las rutinas, como una actividad más del curso, con su gente y sus grupos.', 'Escríbenos'),
        'cierre': 'Manda la primera rutina hoy', 'abrir': 'Abrir la app',
    },
    'en': {
        'titulo': 'Jepyso · Exercise routines sent as a link',
        'desc': 'Build each person’s exercise routine and send it as a link. They do it on their phone, following a 3D figure at the pace you set, with nothing to install.',
        'h1': 'The routine you set, <span>at the pace you set</span>',
        'entradilla': 'Build each person’s routine and send it as a link. They do it on their phone following this figure, which goes up, holds and comes down at the pace you set, on the right side and set after set. Nothing to install and no accounts.',
        'empezar': 'Start for free', 'ver_planes': 'See the plans',
        'escena': 'Jepyso’s figure doing the exercises of an example routine',
        'pasos': [
            ('01 · Build', 'Build the routine', 'For physiotherapy, training, PE or a care home, anywhere. Choose from nearly a hundred exercises by body area, muscle or name, with the Otago and Vivifrail programmes included. Set the sets, the repetitions, how long it goes up, holds and comes down, the side and the discomfort you accept. The figure shows you how it will be done.'),
            ('02 · Send', 'Send it as a link', 'Over WhatsApp, Telegram, email or with a QR code in your practice. The routine travels inside the link: the person only has to open it. Nothing to install, no account to create and nothing to pay.'),
            ('03 · Do', 'They do it with the figure', 'The figure keeps to your prescription: the phase in large type, the countdown, a sound and a vibration on each repetition, and a voice that guides them. Offline, once opened.'),
            ('04 · Back', 'What they did comes back to you', 'When they finish, they record what they did and the discomfort they felt, and send it back in another link. You see it in their file, day by day and week by week. Anyone who has sent you nothing in two weeks stands out, with the message ready to write to them.'),
        ],
        'pauta': {'puente': 'Your prescription · glute bridge · 2 × 10', 'silla': 'Your prescription · sit to stand · 2 × 8',
                  'hombro': 'Your prescription · external rotation with a band · right side'},
        'fase0': 'Lift your hips', 'sube': 'Up', 'mantiene': 'Hold', 'baja': 'Down', 'de': 'of', 'girar': 'Turn it with your finger',
        'rutina': 'Ana’s routine · 3 days a week',
        'filas': [('Sit to stand', '2 × 8 · 2 · 1 · 2 s'), ('Glute bridge', '2 × 10 · 2 · 1 · 2 s'), ('External rotation with a band', '2 × 12 · right side')],
        'aceptable_txt': 'Acceptable discomfort <b>5</b> out of 10',
        'mensaje': 'Ana, here’s your routine. Open it when you’re ready to do it:', 'qr': 'Or with the QR code, in your practice',
        'serie': 'External rotation with a band · right side', 'serie_cifras': '<b>Set 1</b> of 2 · <b class="serie-cuenta">1</b> of 12',
        'voz0': '“Take your hand out to the side”',
        'resumen': 'Summary for Carlos', 'resumen_h': 'Ana has done her routine 3 times', 'resumen_baja': 'Her discomfort went down from 5 to 2',
        'dias': [('Saturday 14', 2), ('Thursday 12', 4), ('Tuesday 10', 5)],
        'metodo_e': 'Discomfort, with a method', 'metodo_h': 'Each routine carries the discomfort you accept',
        'metodo_p': 'You set how far it may go, from 0 to 10. If the person goes past it, they are told and the day is flagged for you. The next morning they are asked how the area felt when they got up. It is the pain-monitoring model, the most cited for dosing exercise when there is discomfort.',
        'regla_aria': 'Discomfort scale from 0 to 10, acceptable up to 5; on Tuesday it reached 7 and was flagged',
        'aceptable': 'Acceptable', 'hoy': 'Today', 'marcado': 'Tuesday · flagged',
        'datos_e': 'Your data stays with you', 'datos_h': 'Jepyso has no data server',
        'tu_tel': ('Your phone', 'Your files, and with a plan, in your Google Drive too'),
        'su_tel': ('Their phone', 'What they record stays there until they send it to you'),
        'ida': 'The routine, inside the link', 'vuelta': 'What they did, in another link',
        'nada': '<b>Oksigenia receives none of it.</b> Not the routine, not what the person does, not their discomfort. <a href="/en/privacy/">This is how our privacy policy puts it.</a>',
        'planes_e': 'Plans', 'planes_h': 'Free to start. One payment for your practice',
        'planes': [('Free', '€0', 5, 'Routines as links, as many as you like, and the files of up to <b>5 people</b>, on your phone.', 'Start for free', APP, ' secundario'),
                   ('Professional', '€59', 50, 'The files of up to <b>50 people</b>, in your Google Drive and on all your devices.', 'See Professional', '/en/pricing/', ''),
                   ('Centre', '€149', 300, 'The files of up to <b>300 people</b>, in your Google Drive and on all your devices.', 'See Centre', '/en/pricing/', '')],
        'planes_nota': 'One payment, for life, no subscription. For the person doing the routine, always free. <a href="/en/pricing/">Everything about the plans</a>',
        'centro': ('In your organisation', 'Inside your organisation’s platform', 'For schools, universities and training centres: routines as one more activity of the course, with its people and its groups.', 'Write to us'),
        'cierre': 'Send your first routine today', 'abrir': 'Open the app',
    },
}


def inicio(lengua):
    t = T[lengua]
    pasos = ''.join(f'''
      <div class="paso" data-paso="{n}"{' id="como"' if n == 1 else ''}>
        <p class="etiqueta">{e(et)}</p>
        <h2>{e(h)}</h2>
        <p>{e(p)}</p>
      </div>''' for n, (et, h, p) in enumerate(t['pasos'], 1))
    pauta_datos = ' '.join(f'data-{k}="{e(v)}"' for k, v in t['pauta'].items())
    filas = ''.join(f'<li{" class=\"activa\"" if i == 0 else ""}><b>{e(a)}</b><span>{e(b)}</span></li>' for i, (a, b) in enumerate(t['filas']))
    dias = ''.join(f'<li><span>{e(d)}</span><i class="m{m}"></i><b>{m}</b></li>' for d, m in t['dias'])
    marcas = ''.join(f'<li><span>{i}</span></li>' for i in range(11))
    planes = ''.join(f'''
        <div class="plan"><h3>{e(nombre)}</h3><p class="precio">{precio}</p><div class="gente gente-{n}" aria-hidden="true">{'<i></i>' * n}</div>
          <p>{texto}</p><a class="boton{clase}" href="{enlace}">{e(boton)}</a></div>''' for nombre, precio, n, texto, boton, enlace, clase in t['planes'])
    c = t['centro']
    return f'''    <section class="sala">
      <div class="relato">
        <div class="paso paso-portada" data-paso="0">
          <h1>{t['h1']}</h1>
          <p class="entradilla">{e(t['entradilla'])}</p>
          <div class="botones"><a class="boton" href="{APP}">{e(t['empezar'])}</a><a class="boton secundario" href="{RUTAS[lengua]['precios']}">{e(t['ver_planes'])}</a></div>
        </div>{pasos}
      </div>
      <div class="escenario" data-paso="0" role="img" aria-label="{e(t['escena'])}">
        <div class="escenario-figura"></div>
        <div class="registro" aria-hidden="true"><i></i></div>
        <div class="capa pauta" data-en="0" aria-hidden="true">
          <p class="etiqueta pauta-nombre" {pauta_datos}>{e(t['pauta']['puente'])}</p>
          <p class="fase">{e(t['fase0'])}</p>
          <p class="etiqueta cuenta"><b>1</b> {t['de']} 10</p>
          <div class="tempo"><span class="t2"><b>{t['sube']}</b> 2 s</span><span class="t1"><b>{t['mantiene']}</b> 1 s</span><span class="t2"><b>{t['baja']}</b> 2 s</span><span class="t1 reposo"></span><i class="tempo-cursor"></i></div>
          <p class="etiqueta tempo-texto">{t['sube']} 2 s · {t['mantiene'].lower()} 1 s · {t['baja'].lower()} 2 s</p>
        </div>
        <p class="capa girar etiqueta" data-en="0" aria-hidden="true">{e(t['girar'])}</p>
        <div class="capa rutina" data-en="1" aria-hidden="true">
          <p class="etiqueta">{e(t['rutina'])}</p>
          <ol>{filas}</ol>
          <p class="molestia-aceptable">{t['aceptable_txt']}</p>
        </div>
        <div class="capa mensaje" data-en="2" aria-hidden="true">
          <div class="burbuja"><p>{e(t['mensaje'])}</p><span class="burbuja-enlace">{EJEMPLO.replace('https://', '')}</span><small>10:42</small></div>
          <div class="qr"><canvas class="ejemplo-qr" width="132" height="132" data-enlace="{EJEMPLO}"></canvas><p class="etiqueta">{e(t['qr'])}</p></div>
        </div>
        <div class="capa serie" data-en="3" aria-hidden="true"><p class="etiqueta">{e(t['serie'])}</p><p class="serie-cifras">{t['serie_cifras']}</p></div>
        <div class="capa voz" data-en="3" aria-hidden="true">
          <p class="voz-quien"><svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z M15.5 9a4 4 0 0 1 0 6 M18 6.5a7.5 7.5 0 0 1 0 11"/></svg><span class="voz-texto">{e(t['voz0'])}</span></p>
          <p class="voces"><span class="activa">Mira</span><span>Altair</span></p>
        </div>
        <div class="capa resumen" data-en="4" aria-hidden="true">
          <p class="etiqueta">{e(t['resumen'])}</p>
          <h3>{e(t['resumen_h'])}</h3>
          <p class="baja">{e(t['resumen_baja'])}</p>
          <ul>{dias}</ul>
        </div>
      </div>
    </section>
    <section class="bloque-sala metodo">
      <div>
        <p class="etiqueta">{e(t['metodo_e'])}</p>
        <h2>{e(t['metodo_h'])}</h2>
        <p>{e(t['metodo_p'])}</p>
      </div>
      <div class="regla" role="img" aria-label="{e(t['regla_aria'])}">
        <div class="regla-zona"><span class="etiqueta">{e(t['aceptable'])}</span></div>
        <ol class="regla-marcas" aria-hidden="true">{marcas}</ol>
        <div class="regla-dia en3" aria-hidden="true"><b>3</b><span>{e(t['hoy'])}</span></div>
        <div class="regla-dia en7 marcado" aria-hidden="true"><b>7</b><span>{e(t['marcado'])}</span></div>
      </div>
    </section>
    <section class="bloque-sala datos">
      <p class="etiqueta">{e(t['datos_e'])}</p>
      <h2>{e(t['datos_h'])}</h2>
      <div class="viaje">
        <div class="objeto"><b>{e(t['tu_tel'][0])}</b><span>{e(t['tu_tel'][1])}</span></div>
        <div class="flecha"><span class="etiqueta">{e(t['ida'])}</span></div>
        <div class="objeto"><b>{e(t['su_tel'][0])}</b><span>{e(t['su_tel'][1])}</span></div>
        <div class="flecha vuelta"><span class="etiqueta">{e(t['vuelta'])}</span></div>
      </div>
      <p class="nada">{t['nada']}</p>
    </section>
    <section class="bloque-sala planes" id="planes">
      <p class="etiqueta">{e(t['planes_e'])}</p>
      <h2>{e(t['planes_h'])}</h2>
      <div class="planes-tres">{planes}
      </div>
      <p class="planes-nota">{t['planes_nota']}</p>
    </section>
    <section class="bloque-sala donde">
      <div class="tesela"><p class="etiqueta">{e(c[0])}</p><h3>{e(c[1])}</h3><p>{e(c[2])}</p><a class="boton secundario" href="mailto:contacto@oksigenia.com">{e(c[3])}</a></div>
    </section>
    <section class="sala-cierre">
      <h2>{e(t['cierre'])}</h2>
      <a class="boton" href="{APP}">{e(t['abrir'])}</a>
    </section>'''


INICIO = {lengua: {'titulo': T[lengua]['titulo'], 'desc': T[lengua]['desc'], 'cuerpo': inicio(lengua)} for lengua in T}


def copiar_figura(app, dest):
    """The home's figure: the app's own player (figura.js), three.js and the clips of FIGURA_EJERCICIOS, copied from app/
    into figura/. Their bare 'three' imports become relative paths: the site's content policy allows no inline import
    map. The phase words of those clips in English go to textos-en.json."""
    d = os.path.join(dest, 'figura')
    archivos = {
        'figura.js': 'figura.js',
        'modelos/musculos.js': 'modelos/musculos.js',
        'vendor/three/three.module.js': 'three/three.module.js',
        'vendor/three/addons/loaders/GLTFLoader.js': 'three/addons/loaders/GLTFLoader.js',
        'vendor/three/addons/controls/OrbitControls.js': 'three/addons/controls/OrbitControls.js',
        'vendor/three/addons/utils/BufferGeometryUtils.js': 'three/addons/utils/BufferGeometryUtils.js',
        'vendor/three/LICENSE': 'three/LICENSE',
    }
    for origen, destino in archivos.items():
        o, t = os.path.join(app, origen), os.path.join(d, destino)
        os.makedirs(os.path.dirname(t), exist_ok=True)
        if not destino.endswith('.js'):
            shutil.copy(o, t)
            continue
        rel = os.path.relpath(os.path.join(d, 'three'), os.path.dirname(t)).replace(os.sep, '/')
        rel = rel if rel.startswith('.') else './' + rel
        with open(o, encoding='utf-8') as f:
            texto = f.read()
        texto = re.sub(r"""(['"])three\1""", lambda m: f'{m.group(1)}{rel}/three.module.js{m.group(1)}', texto)
        texto = re.sub(r"""(['"])three/addons/""", lambda m: f'{m.group(1)}{rel}/addons/', texto)
        with open(t, 'w', encoding='utf-8') as f:
            f.write(texto)
    with open(os.path.join(app, 'modelos', 'ejercicios.json'), encoding='utf-8') as f:
        m = json.load(f)
    reducido = {k: v for k, v in m.items() if k != 'ejercicios'}
    reducido['ejercicios'] = {k: m['ejercicios'][k] for k in FIGURA_EJERCICIOS}
    rutas = [m['cuerpo']] + [r for k in FIGURA_EJERCICIOS for r in (m['ejercicios'][k].get('glb'), m['ejercicios'][k].get('ficha')) if r]
    for r in rutas:
        os.makedirs(os.path.dirname(os.path.join(d, r)), exist_ok=True)
        shutil.copy(os.path.join(app, r), os.path.join(d, r))
    with open(os.path.join(d, 'modelos', 'ejercicios.json'), 'w', encoding='utf-8') as f:
        json.dump(reducido, f, ensure_ascii=False)
    with open(os.path.join(app, 'idiomas', 'en-ejercicios.js'), encoding='utf-8') as f:
        pares = dict(re.findall(r"^\s*'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)',?\s*$", f.read(), re.M))
    textos = {}
    for k in FIGURA_EJERCICIOS:
        ficha = m['ejercicios'][k].get('ficha')
        with open(os.path.join(app, ficha), encoding='utf-8') as f:
            fases = json.load(f).get('fases', [])
        for p in fases if isinstance(fases, list) else []:
            if p.get('texto') in pares:
                textos[p['texto']] = pares[p['texto']]
    with open(os.path.join(d, 'textos-en.json'), 'w', encoding='utf-8') as f:
        json.dump(textos, f, ensure_ascii=False)


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
        '<p>Jepyso no tiene servidor de datos: todo lo que maneja se queda en tus aparatos o en tu propia nube. Lo único que lleva un servidor de Oksigenia es la cuenta de las fichas gratis de cada profesional, sin saber qué hay en ellas.</p>',
        '<ul>',
        '<li><strong>Las rutinas</strong> viajan dentro del enlace que manda el profesional. Al abrirlo, esa parte del enlace no llega a ningún servidor: la lee el navegador de quien lo abre. Mientras va de un aparato a otro, viaja como cualquier mensaje de la aplicación con la que se manda (WhatsApp, Telegram u otra), con las condiciones de esa aplicación.</li>',
        '<li><strong>Lo que apunta la persona</strong> (repeticiones, molestia y, si quiere, una nota) se guarda en su navegador y, si quiere, se lo manda al profesional por WhatsApp o Telegram, como un enlace más.</li>',
        '<li><strong>Las fichas del profesional</strong> (personas, rutinas, seguimiento y plantillas) se guardan en su navegador. Puede guardar una copia en un archivo cuando quiera.</li>',
        '<li><strong>Las fichas de la versión gratis</strong> van con la cuenta de Google del profesional, hasta cinco por cuenta. Al entrar con Google, el navegador recibe de Google una prueba de qué cuenta es y se la manda al servidor de Jepyso, que la comprueba con Google y apunta solo una huella de la cuenta (un código del que no se puede sacar la dirección de correo) y el código al azar de cada ficha. No guarda el correo, el nombre ni nada de lo que hay dentro de las fichas: los nombres de tus personas, sus rutinas y sus resúmenes se quedan en tu navegador. Al borrar una ficha, su código se borra también del servidor. Con la versión de pago no hace falta.</li>',
        '<li><strong>Con Google Drive</strong> (versión de pago), las fichas se guardan además en una carpeta «Jepyso» del Drive del propio profesional. Jepyso pide a Google un solo permiso, el de los archivos que crea la propia app (<code>https://www.googleapis.com/auth/drive.file</code>): no puede ver ni tocar el resto del Drive. Para comprobar la licencia de la versión de pago, lee la dirección de la cuenta con la que se conecta el Drive, y la compara en el propio navegador con la de la licencia. La conexión se hace desde el navegador, directamente entre tu aparato y Google, y el permiso dura poco y no se guarda. Puedes quitárselo cuando quieras en la configuración de tu cuenta de Google («Seguridad», «Aplicaciones de terceros»); tus archivos siguen siendo tuyos y puedes borrarlos desde tu Drive.</li>',
        '<li><strong>El recordatorio en el calendario</strong> es un archivo que se hace en tu teléfono y abre tu propio calendario; no pasa por ningún servidor.</li>',
        '<li><strong>La voz</strong> que guía la serie son grabaciones que vienen con la app, con voz de mujer o de hombre, a elegir; si una no está a mano, la dice una voz del propio teléfono. Lo que dice no se manda a ninguna parte.</li>',
        '<li><strong>La app de Android</strong> es esta misma web, empaquetada: guarda lo mismo, en el mismo sitio, y no pide permisos del teléfono.</li>',
        '<li><strong>Si compras una licencia</strong>, el pago lo procesa Stripe: Oksigenia no ve los datos de tu tarjeta. Guardamos lo que hace falta para mandarte la licencia y la factura: tu nombre, tu correo y la cuenta de Google de la licencia.</li>',
        '<li><strong>Para borrar lo que guarda el servidor</strong> de la versión gratis (la huella de tu cuenta y el código de cada ficha), borra tus fichas en la app o escríbenos a <a href="mailto:contacto@oksigenia.com">contacto@oksigenia.com</a>.</li>',
        '</ul>',
        '<h2>Uso de los datos de Google</h2>',
        '<p>El uso que hace Jepyso de la información recibida de las API de Google, y su transferencia a cualquier otra aplicación, cumplen la <a href="https://developers.google.com/terms/api-services-user-data-policy">Política de Datos del Usuario de los Servicios de las API de Google</a>, incluidos los requisitos de uso limitado. Jepyso usa esos datos solo para guardar y leer tus fichas en tu Drive, para comprobar tu licencia y para contar las fichas gratis de tu cuenta; no los vende, no los cede, no los usa para publicidad y nadie de Oksigenia los lee.</p>',
        '<h2>Sin rastreo</h2>',
        '<p>Jepyso y esta página no usan cookies de publicidad ni de análisis, ni rastreadores de terceros.</p>',
        f'<h2>Contacto</h2><p>Para cualquier pregunta sobre privacidad, o para ejercer tus derechos: <a href="mailto:{EMPRESA["correo"]}">{EMPRESA["correo"]}</a>.</p>',
    ]),
    'en': ('Jepyso privacy policy', f'Last updated: {ACTUALIZADO["en"]}.', [
        '<p>Jepyso is an app by Oksigenia SL (see the <a href="/en/legal/">legal notice</a>). With it, an exercise professional builds routines and sends them to each person as a link; the person does them on their phone, following a 3D figure.</p>',
        '<h2>Oksigenia does not keep your data</h2>',
        '<p>Jepyso has no data server: everything it handles stays on your devices or in your own cloud. The only thing an Oksigenia server keeps is the count of each professional’s free files, without knowing what is in them.</p>',
        '<ul>',
        '<li><strong>Routines</strong> travel inside the link the professional sends. When it is opened, that part of the link never reaches a server: the browser of whoever opens it reads it. On its way from one device to another, it travels like any message of the app used to send it (WhatsApp, Telegram or another), under that app’s terms.</li>',
        '<li><strong>What the person records</strong> (repetitions, discomfort and, if they like, a note) is kept in their browser and, if they want, sent to the professional over WhatsApp or Telegram, as one more link.</li>',
        '<li><strong>The professional’s files</strong> (people, routines, follow-up and templates) are kept in their browser. They can save a copy to a file at any time.</li>',
        '<li><strong>The free version’s files</strong> go with the professional’s Google account, up to five per account. On signing in with Google, the browser gets from Google a proof of which account it is and sends it to Jepyso’s server, which checks it with Google and records only a fingerprint of the account (a code from which the email address cannot be worked out) and the random code of each file. It does not keep the email, the name or anything inside the files: your people’s names, their routines and their summaries stay in your browser. When a file is deleted, its code is deleted from the server too. The paid version does not need it.</li>',
        '<li><strong>With Google Drive</strong> (paid version), the files are also kept in a «Jepyso» folder in the professional’s own Drive. Jepyso asks Google for a single permission, for the files the app itself creates (<code>https://www.googleapis.com/auth/drive.file</code>): it cannot see or change the rest of the Drive. To check the paid version’s licence, it reads the address of the account the Drive is connected with and compares it, in the browser itself, with the licence’s. The connection goes from the browser, straight between your device and Google; the permission is short-lived and is not stored. You can remove it at any time in your Google account settings («Security», «Third-party apps»); your files stay yours and you can delete them from your Drive.</li>',
        '<li><strong>The calendar reminder</strong> is a file made on your phone that opens your own calendar; it goes through no server.</li>',
        '<li><strong>The voice</strong> that guides a set is recordings that come with the app, a woman’s or a man’s voice, as you choose; if one is not at hand, a voice of the phone itself says it. Nothing it says is sent anywhere.</li>',
        '<li><strong>The Android app</strong> is this same website, packaged: it keeps the same things in the same place and asks for no phone permissions.</li>',
        '<li><strong>If you buy a licence</strong>, payment is processed by Stripe: Oksigenia never sees your card details. We keep what is needed to send you the licence and the invoice: your name, your email and the Google account of the licence.</li>',
        '<li><strong>To delete what the server keeps</strong> for the free version (the fingerprint of your account and the code of each file), delete your files in the app or write to us at <a href="mailto:contacto@oksigenia.com">contacto@oksigenia.com</a>.</li>',
        '</ul>',
        '<h2>Use of Google user data</h2>',
        '<p>Jepyso’s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements. Jepyso uses that data only to save and read your files in your Drive, to check your licence and to count your account’s free files; it does not sell it, share it, use it for advertising, and no one at Oksigenia reads it.</p>',
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
        '<h2>Versión gratuita y versión de pago</h2><p>Mandar rutinas por un enlace es gratis, y la versión gratis guarda las fichas de hasta cinco personas por cuenta de Google. La versión de pago añade, entre otras cosas, las fichas sin límite y guardadas en tu Drive; se activa con una licencia personal, ligada a la cuenta de Google de tu Drive, y su precio y lo que incluye se indican al contratarla.</p>',
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
        '<h2>Free and paid versions</h2><p>Sending routines as a link is free, and the free version keeps the files of up to five people per Google account. The paid version adds, among other things, unlimited files kept in your Drive; it is switched on with a personal licence, tied to the Google account of your Drive, and its price and what it includes are shown when you buy it.</p>',
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
    for f in ('estilos.css', 'sitio.js', 'portada.js', 'robots.txt', 'favicon.ico', 'icono-96.png'):
        shutil.copy(os.path.join(aqui, f), DEST)
    shutil.copytree(os.path.join(app, 'fuentes'), os.path.join(DEST, 'fuentes'))
    os.makedirs(os.path.join(DEST, 'imagenes'))
    shutil.copy(os.path.join(app, 'imagenes', 'yeso-puente.webp'), os.path.join(DEST, 'imagenes'))
    shutil.copy(os.path.join(app, 'iconos', 'icono.svg'), DEST)
    shutil.copy(os.path.join(app, 'iconos', 'apple-touch-icon.png'), DEST)
    shutil.copytree(os.path.join(app, 'vendor', 'oksigenia-access-panel'), os.path.join(DEST, 'vendor', 'oksigenia-access-panel'))
    shutil.copytree(os.path.join(app, 'vendor', 'qrcode'), os.path.join(DEST, 'vendor', 'qrcode'))
    copiar_figura(app, DEST)
    for lengua in ('es', 'en'):
        r = RUTAS[lengua]
        i = INICIO[lengua]
        escribir(r['inicio'], pagina(lengua, 'inicio', i['titulo'], i['desc'], i['cuerpo'], 'inicio'))
        titulo, desc, cuerpo = PRECIOS[lengua]
        escribir(r['precios'], pagina(lengua, 'precios', f'{titulo} · Jepyso', desc, cuerpo, 'precios'))
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
