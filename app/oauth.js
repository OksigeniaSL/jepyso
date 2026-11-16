// The permission window of the connectors that have no script of their own in the page (Dropbox, OneDrive): OAuth 2's
// authorisation code with PKCE (S256), from the browser, with no server and no secret. The window opens inside the
// professional's tap, goes to the service and comes back to conectar.html, which hands the answer back here. The code
// is exchanged for a token at the service's token address, also from the browser; the token lives only in memory.
import { t } from './idioma.js';

// The window and the channel conectar.js answers through (both, in case the service's pages cut the link to the
// window that opened it on the way).
export const MENSAJE = 'jepyso-conectar';
const VENTANA = 'jepyso-conectar';

const base64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const azar = (n) => base64url(crypto.getRandomValues(new Uint8Array(n)));

// Where the service sends the answer: conectar.html beside the app. Registered with each service for app.jepyso.com
// and for http://localhost:8772 (the tests).
export const direccionDeVuelta = () => new URL('conectar.html', location.href).href;

// A window in the middle of the screen, or a tab on a phone.
function abrir() {
  const ancho = 520;
  const alto = 700;
  const x = Math.max(0, Math.round((window.screenX || 0) + ((window.outerWidth || ancho) - ancho) / 2));
  const y = Math.max(0, Math.round((window.screenY || 0) + ((window.outerHeight || alto) - alto) / 2));
  return window.open('', VENTANA, `popup,width=${ancho},height=${alto},left=${x},top=${y}`);
}

// Waits for conectar.html's answer to this request (its state): through postMessage from the window, of this same
// origin, or through the channel. A window closed with no answer was closed by hand; the short grace lets an answer
// sent just before closing arrive first.
function esperar(ventana, estado, empresa, nube) {
  return new Promise((ok, mal) => {
    let canal = null;
    let cerrada = 0;
    let vigia = null;
    const acabar = (fn, valor) => {
      clearInterval(vigia);
      window.removeEventListener('message', alMensaje);
      canal?.close();
      fn(valor);
    };
    const recibir = (d) => {
      // Another window's answer, or one from an earlier try: not this one.
      if (!d || d.tipo !== MENSAJE || d.state !== estado) return;
      try {
        ventana.close();
      } catch {
        // Already closed.
      }
      if (d.error === 'access_denied') return acabar(mal, new Error(t('Sin tu permiso, Jepyso no puede guardar en tu {nube}.', { nube })));
      if (d.error || !d.code) return acabar(mal, new Error(t('{empresa} no ha dejado conectar. Vuelve a probar en un rato.', { empresa })));
      acabar(ok, d.code);
    };
    const alMensaje = (ev) => {
      if (ev.origin === location.origin) recibir(ev.data);
    };
    window.addEventListener('message', alMensaje);
    try {
      canal = new BroadcastChannel(MENSAJE);
      canal.onmessage = (ev) => recibir(ev.data);
    } catch {
      // A browser without BroadcastChannel: the window's message is enough.
    }
    vigia = setInterval(() => {
      if (ventana.closed && ++cerrada >= 3) acabar(mal, new Error(t('Se ha cerrado la ventana de {empresa}.', { empresa })));
    }, 400);
  });
}

// Asks the service for permission and gives back what the token exchange needs: { code, verificador, redireccion }.
// autorizar(reto, estado, redireccion) builds the service's address. Call it from a tap and before any await: the
// window opens at once (browsers only allow it inside the gesture), and the address follows once the PKCE hash is made.
export async function pedirPermiso({ autorizar, empresa, nube }) {
  const ventana = abrir();
  if (!ventana) throw new Error(t('No se ha podido abrir la ventana de {empresa}. Mira si el navegador bloquea las ventanas emergentes.', { empresa }));
  try {
    const verificador = azar(32);
    const reto = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador))));
    const estado = azar(16);
    const redireccion = direccionDeVuelta();
    ventana.location.href = autorizar({ reto, estado, redireccion });
    ventana.focus?.();
    return { code: await esperar(ventana, estado, empresa, nube), verificador, redireccion };
  } catch (err) {
    try {
      ventana.close();
    } catch {
      // Already closed.
    }
    throw err;
  }
}

// Exchanges the code for a token at the service's token address: { valor, caduca }.
export async function canjear(direccion, campos, empresa) {
  let r;
  try {
    r = await fetch(direccion, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(campos).toString(),
      cache: 'no-store',
    });
  } catch {
    throw new Error(t('No se ha podido hablar con {empresa}. Mira si hay red.', { empresa }));
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error(t('{empresa} no ha dejado conectar. Vuelve a probar en un rato.', { empresa }));
  return { valor: d.access_token, caduca: Date.now() + (Number(d.expires_in) || 3600) * 1000 };
}
