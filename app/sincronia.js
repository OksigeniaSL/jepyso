// Joining the data of two devices through the professional's own cloud (the paid version, docs in the agent's notes):
// the people with their routines and sessions, and the templates. Pure functions; reading and writing the cloud lives
// apart, so any connector (Google Drive first) uses the same rules.
//
// What travels: { app: 'jepyso', tipo: 'datos', v: 1, fecha, personas, plantillas, borradas }. «borradas» keeps what was
// deleted, so a device that still has it does not bring it back: { personas: { id: date }, plantillas: { name: date } }.
// People and templates carry «cambiada», the moment their own fields last changed.
import { apuntarResumen } from './personas.js';

export const DATOS = { app: 'jepyso', tipo: 'datos', v: 1 };

export const empaquetar = ({ personas = [], plantillas = [], borradas = {} }) => ({
  ...DATOS, fecha: new Date().toISOString(), personas, plantillas, borradas: limpiarBorradas(borradas),
});

export const esDatos = (d) => d?.app === DATOS.app && d?.tipo === DATOS.tipo && Array.isArray(d.personas);

const copiar = (x) => JSON.parse(JSON.stringify(x));
const limpiarBorradas = (b) => ({ personas: { ...(b?.personas || {}) }, plantillas: { ...(b?.plantillas || {}) } });
const masTarde = (a, b) => [a, b].filter(Boolean).sort().at(-1);

// Two lists of deletions become one: each id or name once, with its latest date.
function juntarBorradas(a, b) {
  const r = limpiarBorradas(a);
  for (const tipo of ['personas', 'plantillas']) {
    for (const [k, f] of Object.entries(b?.[tipo] || {})) r[tipo][k] = masTarde(r[tipo][k], f);
  }
  return r;
}

// One person seen on two devices: routines and sessions add up; name, notes and acceptable discomfort come from the
// copy changed later (the local one when it is a tie).
function juntarPersona(local, remota) {
  const nueva = (remota.cambiada || '') > (local.cambiada || '');
  const base = copiar(nueva ? remota : local);
  const otra = nueva ? local : remota;
  base.rutinas ||= [];
  base.dias ||= [];
  for (const r of otra.rutinas || []) if (!base.rutinas.some((x) => x.codigo === r.codigo)) base.rutinas.push(copiar(r));
  apuntarResumen(base, { dias: copiar(otra.dias || []) }, false);
  base.ultimoResumen = masTarde(local.ultimoResumen, remota.ultimoResumen);
  if (!base.notas && otra.notas) base.notas = otra.notas;
  return base;
}

// Joins what the cloud has (remoto) with what this device has (local); returns what both should keep.
export function fusionar(local, remoto) {
  const borradas = juntarBorradas(local.borradas, remoto.borradas);

  const personas = [];
  const vistas = new Map();
  for (const p of [...(local.personas || []), ...(remoto.personas || [])]) {
    if (!p?.id || borradas.personas[p.id]) continue;
    const ya = vistas.get(p.id);
    if (ya === undefined) {
      vistas.set(p.id, personas.length);
      personas.push(copiar(p));
    } else {
      personas[ya] = juntarPersona(personas[ya], p);
    }
  }

  // Templates go by name: the one saved later wins. A template deleted and saved again later comes back.
  const porNombre = new Map();
  for (const t of [...(local.plantillas || []), ...(remoto.plantillas || [])]) {
    if (!t?.nombre) continue;
    const borrada = borradas.plantillas[t.nombre];
    if (borrada && (t.cambiada || '') <= borrada) continue;
    const ya = porNombre.get(t.nombre);
    if (!ya || (t.cambiada || '') > (ya.cambiada || '')) porNombre.set(t.nombre, copiar(t));
  }
  const plantillas = [...porNombre.values()].sort((a, b) => (b.cambiada || '').localeCompare(a.cambiada || ''));

  return { personas, plantillas, borradas };
}
