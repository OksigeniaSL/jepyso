// The professional's own cloud (the paid version): Google Drive, Dropbox or OneDrive, as they choose, remembered on
// each device. Each connector only connects, says the account's e-mail, and reads and writes one file, «jepyso.json»,
// in the one folder the app can see; joining it with what this device has is the same for all of them (sincronia.js).
// The licence counts against the connected account's e-mail whichever the service (app.js, licencia.js): one licence,
// one account, so connecting another service gives no more files.
import * as google from './drive.js';
import * as dropbox from './dropbox.js';
import * as onedrive from './onedrive.js';
import { fusionar, empaquetar, esDatos } from './sincronia.js';
import { almacen } from './datos.js';
import { t } from './idioma.js';

// nombre: the service, as on its buttons; corto: as the sentences say it («tu Drive»); empresa: whose window opens.
export const NUBES = {
  google: {
    nombre: 'Google Drive', corto: 'Drive', empresa: 'Google',
    conectar: google.conectar, cuenta: google.cuentaDrive, leer: google.leer, escribir: google.escribir, olvidar: google.olvidar,
  },
  dropbox: {
    nombre: 'Dropbox', corto: 'Dropbox', empresa: 'Dropbox',
    conectar: dropbox.conectar, cuenta: dropbox.cuenta, leer: dropbox.leer, escribir: dropbox.escribir, olvidar: dropbox.olvidar,
  },
  onedrive: {
    nombre: 'OneDrive', corto: 'OneDrive', empresa: 'Microsoft',
    conectar: onedrive.conectar, cuenta: onedrive.cuenta, leer: onedrive.leer, escribir: onedrive.escribir, olvidar: onedrive.olvidar,
  },
};

// The one chosen on this device; Google Drive until another is chosen (the first paid version had only that one).
export const nubeElegida = () => {
  const id = almacen.leer('nube', '');
  return Object.hasOwn(NUBES, id) ? id : 'google';
};
export const elegirNube = (id) => Object.hasOwn(NUBES, id) && almacen.guardar('nube', id);

// When this device last synced with each one. Google's keeps the key it had before there were more.
const claveUltima = (id) => (id === 'google' ? 'drive-ultima' : `nube-ultima-${id}`);
export const ultimaVez = (id) => almacen.leer(claveUltima(id), '');
export const apuntarVez = (id) => almacen.guardar(claveUltima(id), new Date().toISOString());
// Another service this device has synced with before (the one most recently), when the chosen one has never been:
// moving to a new service joins this device's data into it, and what the old one has stays there.
export function nubeAnterior(id) {
  if (ultimaVez(id)) return '';
  return Object.keys(NUBES).filter((k) => k !== id && ultimaVez(k)).sort((a, b) => ultimaVez(b).localeCompare(ultimaVez(a)))[0] || '';
}

// Brings the cloud and this device together: reads what the cloud has, joins it with what is here (sincronia.js) and
// keeps the result in both places. What is here and how to keep it come from the app, so this file knows nothing of
// where things live. A device that writes in between loses nothing: its own copy joins again at its next sync. A
// jepyso.json that is not Jepyso's is left as it is; an empty one is taken as no file yet.
export async function sincronizar(id, local, guardarLocal) {
  const nube = NUBES[id];
  const texto = await nube.leer();
  let remoto = {};
  if (texto !== null && texto.trim()) {
    let d = null;
    try {
      d = JSON.parse(texto);
    } catch {
      d = null;
    }
    if (!esDatos(d)) throw new Error(t('El archivo jepyso.json de tu {nube} no es de Jepyso: no se ha tocado nada.', { nube: nube.corto }));
    remoto = d;
  }
  const junto = fusionar(local, remoto);
  guardarLocal(junto);
  // Without indentation: with a year of follow-up it was two and a half times bigger to send and to read.
  await nube.escribir(JSON.stringify(empaquetar(junto)));
  return { personas: junto.personas.length, plantillas: junto.plantillas.length };
}
