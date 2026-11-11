// Exercise catalogue, the routine link format and the local store.
// Texts are written for any Spanish speaker (tú, no regional words). Sources: the home exercise programmes of the
// AAOS and the NHS.

export const EJERCICIOS = {
  puente: {
    nombre: 'Puente de glúteo',
    posicion: 'Boca arriba',
    material: 'Esterilla',
    unLado: false,
    musculos: ['Glúteos', 'Isquiotibiales'],
    porDefecto: { series: 3, reps: 10, tempo: [2, 2, 2] },
    pasos: [
      'Acuéstate boca arriba con las rodillas dobladas y los pies apoyados, separados a la anchura de la cadera.',
      'Aprieta los glúteos y sube la cadera hasta que hombros, cadera y rodillas queden en línea.',
      'Mantén arriba sin arquear la zona lumbar.',
      'Baja despacio, vértebra a vértebra, hasta apoyar la cadera.',
    ],
  },
  silla: {
    nombre: 'Levantarse de la silla',
    posicion: 'Sentado',
    material: 'Silla firme',
    unLado: false,
    musculos: ['Cuádriceps', 'Glúteos'],
    porDefecto: { series: 3, reps: 8, tempo: [2, 1, 3] },
    pasos: [
      'Siéntate en la parte delantera de una silla firme, con los pies apoyados un poco por detrás de las rodillas.',
      'Inclina el tronco hacia delante y ponte de pie sin ayudarte de las manos.',
      'Estira del todo las caderas y las rodillas.',
      'Siéntate despacio, controlando la bajada hasta rozar la silla.',
    ],
  },
  hombro: {
    nombre: 'Rotación externa con banda',
    posicion: 'De pie',
    material: 'Banda elástica',
    unLado: true,
    musculos: ['Manguito rotador', 'Deltoides posterior'],
    porDefecto: { series: 3, reps: 12, tempo: [2, 1, 2] },
    pasos: [
      'Ata la banda a un pomo de puerta a la altura del codo y ponte de lado, con la puerta junto al brazo que no trabaja.',
      'Dobla el codo en ángulo recto y pégalo al costado, con una toalla pequeña entre el codo y el cuerpo.',
      'Lleva la mano hacia fuera estirando la banda, sin separar el codo.',
      'Vuelve despacio a la posición de partida.',
    ],
  },
};

export const ORDEN = ['puente', 'silla', 'hombro'];

export const LADOS = { der: 'Lado derecho', izq: 'Lado izquierdo', ambos: 'Los dos lados' };

// Pain-monitoring model (Thomeé, Phys Ther 1997; Silbernagel et al., Am J Sports Med 2007): discomfort during the
// exercise may reach a set level, should be gone by the next morning and should not grow from week to week. The
// professional sets the level for each routine; 5 out of 10 when nothing is said. Values above it get marked.
export const TOPE_MOLESTIA = 5;
export const pasaDelTope = (valor, tope) => typeof valor === 'number' && valor > tope;

// Local calendar day, YYYY-MM-DD. toISOString() gives the UTC day, which is already tomorrow on an evening in the
// Americas and would file a session under the wrong date.
export function diaLocal(fecha = new Date()) {
  const dos = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export function diaAnterior(fecha = new Date()) {
  const d = new Date(fecha);
  d.setDate(d.getDate() - 1);
  return diaLocal(d);
}

// --- Routine link: JSON compressed with deflate-raw and written in base64url, inside the URL fragment.
// The fragment never reaches the server, so the routine travels only between the two phones.

function aBase64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64url(texto) {
  const b = atob(texto.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
  return bytes;
}

export async function codificar(obj) {
  const json = new TextEncoder().encode(JSON.stringify(obj));
  if ('CompressionStream' in window) {
    const flujo = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return 'd.' + aBase64url(new Uint8Array(await new Response(flujo).arrayBuffer()));
  }
  return 'j.' + aBase64url(json);
}

export async function decodificar(codigo) {
  const [tipo, cuerpo] = [codigo.slice(0, 2), codigo.slice(2)];
  const bytes = deBase64url(cuerpo);
  if (tipo === 'd.') {
    const flujo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return JSON.parse(await new Response(flujo).text());
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Seconds one exercise takes: every repetition is up + hold + down + one second at rest.
export function duracionEjercicio(e, descanso) {
  const [s, m, b] = e.tempo;
  const lados = e.lado === 'ambos' ? 2 : 1;
  return lados * (e.series * e.reps * (s + m + b + 1) + (e.series - 1) * descanso);
}

export function minutos(segundos) {
  const m = Math.max(1, Math.round(segundos / 60));
  return m === 1 ? 'un minuto' : `unos ${m} minutos`;
}

// Small persistent store; private windows or blocked storage must not break the app.
export const almacen = {
  leer(clave, porDefecto) {
    try {
      const v = localStorage.getItem(clave);
      return v ? JSON.parse(v) : porDefecto;
    } catch {
      return porDefecto;
    }
  },
  guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // Storage unavailable: the routine still works, only the history is lost.
    }
  },
};
