// The page the Dropbox and Microsoft windows come back to (oauth.js): it hands their answer (code and state, or error)
// to the app that opened the window and closes. Only to this same origin: postMessage aimed at it, and a
// BroadcastChannel, which still reaches the app if a service's pages cut the window's link to its opener on the way.
// Opened any other way, it says in plain words what it is for and how to go back to the app. Nothing is imported
// before the answer is on its way, so the window closes at once.

// The same name as MENSAJE in oauth.js.
const MENSAJE = 'jepyso-conectar';

const consulta = new URLSearchParams(location.search);
const fragmento = new URLSearchParams(location.hash.slice(1));
const dato = (k) => consulta.get(k) ?? fragmento.get(k) ?? '';
const respuesta = { tipo: MENSAJE, state: dato('state'), code: dato('code'), error: dato('error') };
// The code is used once and does not stay in the address bar or in the history.
history.replaceState(null, '', location.pathname);

let entregada = false;
if (respuesta.state) {
  try {
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(respuesta, location.origin);
      entregada = true;
    }
  } catch {
    // An opener that cannot be reached: the channel below.
  }
  try {
    const canal = new BroadcastChannel(MENSAJE);
    canal.postMessage(respuesta);
    canal.close();
  } catch {
    // A browser without BroadcastChannel.
  }
  // A window the app opened closes, with or without its opener; one opened by hand stays, and says why below.
  window.close();
}

// In the language of the screens, loaded only here: the usual way through needs none.
async function explicar() {
  const { cargarIdioma, t } = await import('./idioma.js');
  await cargarIdioma();
  document.querySelector('.conectar-aviso').textContent = t('Esta ventana solo sirve para conectar tu nube con Jepyso. Ciérrala y vuelve a la app.');
  const volver = document.querySelector('.conectar a');
  volver.textContent = t('Abrir Jepyso');
  volver.hidden = false;
}
if (!entregada) explicar();
