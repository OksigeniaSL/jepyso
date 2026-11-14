// What comes from outside this page is cleaned here before anything uses it: a routine or a summary from a link, a copy
// file, the professional's cloud and even this browser's own storage. Only the known fields pass, with their type and
// range, so a forged link can neither paint markup nor leave a file that no longer opens.
import { EJERCICIOS, BANDAS, TOPE_MOLESTIA, diaLocal } from './datos.js';

// Limits that stop absurd input, far above anything typed in the app: they must never cut what a professional wrote.
const NOMBRE = 200;
const NOTA = 4000;
const NOTAS_FICHA = 200000;

const entero = (v, min, max, porDefecto) => (Number.isInteger(v) ? Math.min(max, Math.max(min, v)) : porDefecto);
const texto = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const lista = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const objeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export const esFecha = (f) => typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f) && !Number.isNaN(Date.parse(`${f}T12:00:00`));
const esHora = (h) => typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
const esMomento = (m) => typeof m === 'string' && m.length <= 40 && !Number.isNaN(Date.parse(m));
// A key that is not one of the names every object already has («constructor», «__proto__»…).
const clavePropia = (k) => typeof k === 'string' && !(k in Object.prototype);
export const esId = (id) => clavePropia(id) && /^[A-Za-z0-9_-]{1,40}$/.test(id);
// An exercise of the library. Stored records may keep one that left it; links only bring ones that are here.
const esEjercicio = (i) => clavePropia(i) && Object.hasOwn(EJERCICIOS, i);
const idGuardado = (i) => clavePropia(i) && /^[a-z0-9_]{1,40}$/.test(i);
const esCodigo = (c) => typeof c === 'string' && /^[A-Za-z0-9._-]{1,20000}$/.test(c);

export const DESCANSOS = [30, 45, 60, 90];
const tope = (m) => entero(m, 0, 9, undefined);
const lado = (l, i) => (l === 'der' || l === 'izq' || l === 'ambos' ? l : EJERCICIOS[i]?.unLado ? 'der' : null);
const banda = (b) => (clavePropia(b) && Object.hasOwn(BANDAS, b) ? b : undefined);
const ritmo = (t, d = [2, 1, 2]) => {
  const x = Array.isArray(t) ? t : [];
  return [entero(x[0], 1, 6, d[0]), entero(x[1], 0, 30, d[1]), entero(x[2], 1, 6, d[2])];
};

// A routine as the link carries it: { v, para, de, d, x, m, c, f, p, e: [{ i, s, r, t, l, b, n }] }.
export function limpiarRutina(r) {
  if (!objeto(r) || !Array.isArray(r.e)) return null;
  const e = lista(r.e, 40).flatMap((x) => {
    if (!objeto(x) || !esEjercicio(x.i)) return [];
    const d = EJERCICIOS[x.i].porDefecto;
    const nota = texto(x.n, NOTA);
    return [{ i: x.i, s: entero(x.s, 1, 6, d.series), r: entero(x.r, 1, 30, d.reps), t: ritmo(x.t, d.tempo), l: lado(x.l, x.i), b: banda(x.b), n: nota || undefined }];
  });
  return {
    v: 1, para: texto(r.para, NOMBRE), de: texto(r.de, NOMBRE), d: DESCANSOS.includes(r.d) ? r.d : 45, x: entero(r.x, 1, 3, 1),
    m: tope(r.m), c: r.c === 'b' ? 'b' : 'a', f: esFecha(r.f) ? r.f : undefined, p: esId(r.p) ? r.p : undefined, e,
  };
}

// One session: { f, h, e: [{ i, l, s, r, p: [reps of each set], m }], a (discomfort the next morning) }.
export function limpiarDia(d, guardado = false) {
  if (!objeto(d) || !esFecha(d.f) || !Array.isArray(d.e)) return null;
  const e = lista(d.e, 40).flatMap((x) => {
    if (!objeto(x) || !(guardado ? idGuardado(x.i) : esEjercicio(x.i))) return [];
    const p = lista(x.p, 6).map((v) => entero(v, 0, 50, 0));
    return [{ i: x.i, l: lado(x.l, x.i), s: entero(x.s, 1, 6, p.length || 1), r: entero(x.r, 1, 30, 1), p, m: entero(x.m, 0, 10, undefined) }];
  });
  return { f: d.f, h: esHora(d.h) ? d.h : undefined, e, a: entero(d.a, 0, 10, undefined) };
}

// A summary as the link brings it back: { v, p, para, de, m, dias }.
export function limpiarResumen(s) {
  if (!objeto(s) || !Array.isArray(s.dias)) return null;
  return {
    v: 1, p: esId(s.p) ? s.p : undefined, para: texto(s.para, NOMBRE), de: texto(s.de, NOMBRE), m: tope(s.m),
    dias: s.dias.slice(-60).map((d) => limpiarDia(d)).filter(Boolean),
  };
}

// A person's file, as kept here, in a copy or in the cloud.
export function limpiarPersona(p) {
  if (!objeto(p) || !esId(p.id)) return null;
  const creada = esFecha(p.creada) ? p.creada : diaLocal();
  return {
    id: p.id,
    nombre: texto(p.nombre, NOMBRE).trim() || 'Sin nombre',
    notas: texto(p.notas, NOTAS_FICHA),
    creada,
    m: tope(p.m),
    rutinas: lista(p.rutinas, 500).flatMap((r) =>
      objeto(r) && esCodigo(r.codigo) ? [{ f: esFecha(r.f) ? r.f : creada, codigo: r.codigo, e: lista(r.e, 40).filter(idGuardado) }] : [],
    ),
    dias: lista(p.dias, 5000).map((d) => limpiarDia(d, true)).filter(Boolean),
    ultimoResumen: esFecha(p.ultimoResumen) ? p.ultimoResumen : undefined,
    cambiada: esMomento(p.cambiada) ? p.cambiada : undefined,
  };
}

export const limpiarPersonas = (v) => lista(v, 5000).map(limpiarPersona).filter(Boolean);

// A template: the routine settings and the exercises with theirs, under a name.
export function limpiarPlantilla(t) {
  if (!objeto(t) || !clavePropia(t.nombre)) return null;
  const nombre = texto(t.nombre, NOMBRE).trim();
  if (!nombre) return null;
  const orden = [...new Set(lista(t.orden, 40).filter(esEjercicio))];
  const ejercicios = {};
  for (const i of orden) {
    const x = objeto(t.ejercicios) && Object.hasOwn(t.ejercicios, i) && objeto(t.ejercicios[i]) ? t.ejercicios[i] : {};
    const d = EJERCICIOS[i].porDefecto;
    ejercicios[i] = {
      series: entero(x.series, 1, 6, d.series), reps: entero(x.reps, 1, 30, d.reps), tempo: ritmo(x.tempo, d.tempo),
      lado: lado(x.lado, i), banda: banda(x.banda) || '', nota: texto(x.nota, NOTA),
    };
  }
  return {
    nombre, cambiada: esMomento(t.cambiada) ? t.cambiada : undefined, d: DESCANSOS.includes(t.d) ? t.d : 45,
    x: entero(t.x, 1, 3, 1), m: tope(t.m) ?? TOPE_MOLESTIA, c: t.c === 'b' ? 'b' : 'a', orden, ejercicios,
  };
}

export const limpiarPlantillas = (v) => lista(v, 200).map(limpiarPlantilla).filter(Boolean);

// What was deleted, with its date: { personas: { id: moment }, plantillas: { name: moment } }. Objects without a
// prototype, so a name like «constructor» is just a name.
export function limpiarBorradas(b) {
  const r = { personas: Object.create(null), plantillas: Object.create(null) };
  for (const tipo of ['personas', 'plantillas']) {
    const de = objeto(b) && objeto(b[tipo]) ? b[tipo] : {};
    for (const [k, f] of Object.entries(de).slice(0, 50000)) {
      if ((tipo === 'personas' ? esId(k) : clavePropia(k) && k.length <= NOMBRE) && esMomento(f)) r[tipo][k] = f;
    }
  }
  return r;
}
