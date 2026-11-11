// The professional's people: each one's file, the routines sent to them and the follow-up from the summaries they send
// back. Kept in this browser (localStorage «personas»), with a copy in a file to take them to another device; the paid
// version keeps the same records in the professional's own Drive.
//
// A person: { id, nombre, notas, creada, m (their acceptable discomfort), rutinas: [{ f, codigo, e: [exercise ids] }],
// dias: [sessions as the summary brings them: { f, h, e: [...], a }] }.
import { almacen, TOPE_MOLESTIA, pasaDelTope, diaLocal } from './datos.js';

const CLAVE = 'personas';

export const leerPersonas = () => almacen.leer(CLAVE, []);
export const guardarPersonas = (lista) => almacen.guardar(CLAVE, lista);

export function nuevoId() {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return [...b].map((x) => (x % 36).toString(36)).join('');
}

const normal = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

// Same name, ignoring case, accents and spaces at the ends. Only an exact match: two «María» stay two people.
export const buscarPorNombre = (lista, nombre) => lista.filter((p) => normal(p.nombre) === normal(nombre));

export function crearPersona(lista, nombre, id = nuevoId()) {
  const p = { id, nombre: String(nombre).trim(), notas: '', creada: diaLocal(), rutinas: [], dias: [] };
  lista.push(p);
  return p;
}

// A routine sent: to the person chosen in the builder, or to the one with that exact name, or to a new file.
export function apuntarRutina(lista, { id, nombre }, rutina, codigo) {
  let p = (id && lista.find((x) => x.id === id)) || null;
  if (!p) {
    const iguales = buscarPorNombre(lista, nombre);
    p = iguales.length === 1 ? iguales[0] : crearPersona(lista, nombre);
  }
  if (!p.rutinas.some((r) => r.codigo === codigo)) p.rutinas.push({ f: rutina.f, codigo, e: rutina.e.map((x) => x.i) });
  if (Number.isInteger(rutina.m)) p.m = rutina.m;
  return p;
}

const claveDia = (d) => `${d.f} ${d.h || ''} ${d.e.map((x) => `${x.i}${x.l || ''}`).join(',')}`;

// The sessions of a summary join the file: each one once, even when the same summary is opened twice or a later one
// repeats the last fourteen. A later summary can bring the morning-after answer of a session already kept.
export function apuntarResumen(p, resumen, recibido = true) {
  const porClave = new Map(p.dias.map((d) => [claveDia(d), d]));
  let nuevos = 0;
  for (const d of resumen.dias || []) {
    const ya = porClave.get(claveDia(d));
    if (!ya) {
      p.dias.push(d);
      porClave.set(claveDia(d), d);
      nuevos++;
    } else if (ya.a === undefined && typeof d.a === 'number') ya.a = d.a;
  }
  p.dias.sort((x, y) => (x.f + (x.h || '')).localeCompare(y.f + (y.h || '')));
  if (Number.isInteger(resumen.m)) p.m = resumen.m;
  if (recibido) p.ultimoResumen = diaLocal();
  return nuevos;
}

// Monday of the week of a day, as YYYY-MM-DD in local time.
function lunes(f) {
  const d = new Date(f + 'T12:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The third rule of the pain-monitoring model, made visible: week by week, the highest discomfort during the exercises
// and on getting up the next morning, oldest week first. «sube» marks a week where either went up from the week before.
export function semanas(dias, tope = TOPE_MOLESTIA) {
  const grupos = new Map();
  for (const d of dias) {
    const k = lunes(d.f);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(d);
  }
  const lista = [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([desde, ds]) => {
    const durante = ds.flatMap((d) => d.e.map((x) => x.m)).filter((v) => typeof v === 'number');
    const manana = ds.map((d) => d.a).filter((v) => typeof v === 'number');
    return {
      desde,
      sesiones: ds.length,
      durante: durante.length ? Math.max(...durante) : null,
      manana: manana.length ? Math.max(...manana) : null,
      marcados: ds.filter((d) => pasaDelTope(d.a, tope) || d.e.some((x) => pasaDelTope(x.m, tope))).length,
    };
  });
  // Each measure against itself: the discomfort during the exercises, and the one on getting up.
  const subio = (ahora, antes) => typeof ahora === 'number' && typeof antes === 'number' && ahora > antes;
  lista.forEach((s, i) => {
    const antes = lista[i - 1];
    s.sube = !!antes && (subio(s.durante, antes.durante) || subio(s.manana, antes.manana));
  });
  return lista;
}

// The copy in a file: everything, readable, to keep or to load on another device.
export const copia = (lista) => ({ app: 'jepyso', tipo: 'personas', v: 1, fecha: new Date().toISOString(), personas: lista });

// Loading a copy adds what is not here: new people, and for those already here (same id) their routines and sessions.
// Nothing here is deleted. Returns how many people came and how many were new.
export function cargarCopia(lista, datos) {
  if (datos?.app !== 'jepyso' || datos?.tipo !== 'personas' || !Array.isArray(datos.personas)) throw new Error('No es una copia de Jepyso');
  let nuevas = 0;
  for (const q of datos.personas) {
    if (!q?.id || !q?.nombre) continue;
    let p = lista.find((x) => x.id === q.id);
    if (!p) {
      p = { ...q, rutinas: [], dias: [] };
      lista.push(p);
      nuevas++;
    }
    for (const r of q.rutinas || []) if (!p.rutinas.some((x) => x.codigo === r.codigo)) p.rutinas.push(r);
    apuntarResumen(p, { dias: q.dias || [], m: q.m }, false);
    if (!p.notas && q.notas) p.notas = q.notas;
    p.ultimoResumen = [p.ultimoResumen, q.ultimoResumen].filter(Boolean).sort().at(-1);
  }
  return { total: datos.personas.length, nuevas };
}
