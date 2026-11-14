// Reference programmes: Otago (levels A to D) and Vivifrail (passports A to D), two tested programmes to prevent falls in
// older people, with each level's starting dose (agents/jepyso/docs/otago-vivifrail.md in hq, with the sources). They
// open like a template: the professional changes what is needed before sending. Same shape as a template; app.js
// passes them through limpiarPlantilla like any other.

// One exercise: [id, series, reps, tempo, side, note].
const fila = ([id, series, reps, tempo, lado = null, nota = '']) => [id, { series, reps, tempo, lado, banda: '', nota }];
const programa = (id, nombre, descripcion, { d, w }, filas) => {
  const ejercicios = Object.fromEntries(filas.map(fila));
  return { id, nombre, descripcion, d, x: 1, w, c: 'a', orden: filas.map((f) => f[0]), ejercicios };
};

const LASTRE = 'La tobillera con la que hagas de 8 a 10 repeticiones bien. Súbela cuando hagas 2 series de 10.';
const CAMINAR_OTAGO = 'Los días sin ejercicios: camina hasta 30 minutos, al menos 2 días a la semana. Puedes partirlo en 3 ratos de 10.';
const BOTELLA = 'Con una botella de agua en cada mano, del peso con el que hagas unas 30 repeticiones con esfuerzo.';

// Otago: warm-up, strength with an ankle weight (1×10 in A and B, 2×10 in C and D), balance of the level.
const calentamiento = [
  ['cuello_giro', 1, 5, [2, 1, 2]],
  ['retraccion', 1, 5, [2, 2, 2]],
  ['extension_espalda_pie', 1, 5, [2, 1, 2]],
  ['rotacion_tronco_pie', 1, 5, [2, 1, 2], 'ambos'],
  ['tobillos', 1, 10, [1, 0, 1]],
];
const fuerza = (series) => [
  ['extension_rodilla_lastre', series, 10, [3, 0, 4], 'ambos', LASTRE],
  ['curl_isquios_lastre', series, 10, [3, 0, 4], 'ambos'],
  ['abduccion_pie_lastre', series, 10, [3, 0, 4], 'ambos'],
];
const OTAGO = { d: 90, w: 3 };

export const PROGRAMAS = [
  programa('otago-a', 'Otago, nivel A', 'Calentamiento, fuerza con tobillera y equilibrio agarrado', OTAGO, [
    ...calentamiento, ...fuerza(1),
    ['sentadilla', 1, 10, [2, 0, 2]],
    ['tandem_quieto', 1, 1, [1, 10, 1], 'ambos'],
    ['silla_dos_manos', 1, 5, [2, 1, 3]],
    ['escalon', 1, 10, [2, 1, 2], 'ambos'],
    ['caminar', 1, 30, [1, 0, 1], null, CAMINAR_OTAGO],
  ]),
  programa('otago-b', 'Otago, nivel B', 'Calentamiento, fuerza con tobillera y equilibrio, ya sin agarrarse en algunos', OTAGO, [
    ...calentamiento, ...fuerza(1),
    ['sentadilla_sin_apoyo', 1, 10, [2, 0, 2]],
    ['andar_atras', 4, 10, [1, 0, 1]],
    ['andar_lado', 4, 10, [1, 0, 1], 'ambos'],
    ['andar_ocho', 1, 2, [9, 0, 9]],
    ['tandem_quieto_sin_apoyo', 1, 1, [1, 10, 1], 'ambos'],
    ['equilibrio', 1, 1, [1, 10, 1], 'ambos'],
    ['silla_una_mano', 1, 5, [2, 1, 3]],
    ['escalon', 1, 10, [2, 1, 2], 'ambos'],
    ['caminar', 1, 30, [1, 0, 1], null, CAMINAR_OTAGO],
  ]),
  programa('otago-c', 'Otago, nivel C', 'Calentamiento, dos series de fuerza y equilibrio andando', OTAGO, [
    ...calentamiento, ...fuerza(2),
    ['talones', 2, 10, [3, 0, 4]],
    ['puntas', 2, 10, [3, 0, 4]],
    ['sentadilla_sin_apoyo', 2, 10, [2, 0, 2]],
    ['andar_ocho', 1, 2, [9, 0, 9]],
    ['andar_lado', 4, 10, [1, 0, 1], 'ambos'],
    ['andar_tandem', 2, 10, [2, 0, 2]],
    ['andar_talones', 4, 10, [1, 0, 1]],
    ['andar_puntillas', 4, 10, [1, 0, 1]],
    ['equilibrio_sin_apoyo', 1, 1, [1, 10, 1], 'ambos'],
    ['silla', 2, 10, [2, 1, 3]],
    ['escalon', 1, 10, [2, 1, 2], 'ambos'],
    ['caminar', 1, 30, [1, 0, 1], null, CAMINAR_OTAGO],
  ]),
  programa('otago-d', 'Otago, nivel D', 'Calentamiento, fuerza y el equilibrio más exigente, sin agarrarse', OTAGO, [
    ...calentamiento, ...fuerza(2),
    ['talones_sin_apoyo', 2, 10, [3, 0, 4]],
    ['puntas_sin_apoyo', 2, 10, [3, 0, 4]],
    ['sentadilla_sin_apoyo', 3, 10, [2, 0, 2]],
    ['andar_atras', 4, 10, [1, 0, 1]],
    ['andar_tandem', 2, 10, [2, 0, 2]],
    ['andar_talones', 4, 10, [1, 0, 1]],
    ['andar_puntillas', 4, 10, [1, 0, 1]],
    ['andar_tandem_atras', 2, 10, [2, 0, 2]],
    ['equilibrio_sin_apoyo', 1, 1, [1, 30, 1], 'ambos'],
    ['silla', 2, 10, [2, 1, 3]],
    ['escalon', 2, 10, [2, 1, 2], 'ambos'],
    ['caminar', 1, 30, [1, 0, 1], null, CAMINAR_OTAGO],
  ]),
  programa('vivifrail-a', 'Vivifrail A', 'Para quien se levanta con mucha ayuda (SPPB de 0 a 3). Cinco días a la semana', { d: 60, w: 5 }, [
    ['pelota', 3, 12, [2, 2, 1], 'ambos'],
    ['curl_sentado', 3, 12, [2, 1, 2], null, BOTELLA],
    ['extension_rodilla_lastre', 3, 12, [2, 1, 2], 'ambos', 'Con una tobillera de medio kilo.'],
    ['silla_dos_manos', 3, 12, [2, 1, 3]],
    ['andar_tandem', 3, 15, [2, 0, 2], null, 'Junto a una mesa, agarrado si hace falta.'],
    ['brazos_arriba', 3, 3, [2, 10, 2]],
    ['caminar', 5, 1, [1, 0, 1], null, 'Con andador o con alguien al lado. Empieza por unos segundos y sube hasta 1 o 2 minutos seguidos.'],
  ]),
  programa('vivifrail-b', 'Vivifrail B y B+', 'Fragilidad (SPPB de 4 a 6). B, los ejercicios 3 días y caminar 2; B+, los ejercicios 4 días y caminar 1', { d: 60, w: 3 }, [
    ['caminar', 5, 3, [1, 0, 1], null, 'De 2 a 5 minutos cada vez. Desde la semana 7, 3 veces de 8 minutos.'],
    ['pelota', 3, 12, [2, 2, 1], 'ambos'],
    ['sentadilla', 3, 12, [2, 0, 2], null, 'Como si fueras a sentarte, con una silla detrás.'],
    ['curl_sentado', 3, 12, [2, 1, 2], null, BOTELLA],
    ['andar_puntillas', 3, 7, [1, 0, 1]],
    ['andar_talones', 3, 7, [1, 0, 1]],
    ['brazos_silla', 3, 3, [2, 10, 2]],
    ['brazos_arriba', 3, 3, [2, 10, 2]],
  ]),
  programa('vivifrail-c', 'Vivifrail C y C+', 'Prefragilidad (SPPB de 7 a 9). C, los ejercicios 3 días y caminar 2; C+, los ejercicios 4 días y caminar 1', { d: 60, w: 3 }, [
    ['caminar', 3, 10, [1, 0, 1], null, 'Desde la semana 7, 3 veces de 15 minutos.'],
    ['estrujar_toalla', 3, 12, [1, 1, 2]],
    ['curl_sentado', 3, 12, [2, 1, 2], null, BOTELLA],
    ['silla', 3, 12, [2, 1, 3]],
    ['andar_ocho', 3, 2, [9, 0, 9]],
    ['andar_obstaculos', 6, 5, [2, 0, 2]],
    ['isquios_sentado', 3, 3, [2, 10, 2], 'ambos'],
    ['brazos_arriba', 3, 3, [2, 10, 2]],
  ]),
  programa('vivifrail-d', 'Vivifrail D', 'Para quien está en buena forma (SPPB de 10 a 12). Los ejercicios 3 días y caminar 2', { d: 60, w: 3 }, [
    ['caminar', 2, 20, [1, 0, 1], null, 'Desde la semana 7, de 30 a 45 minutos seguidos.'],
    ['estrujar_toalla', 3, 12, [1, 1, 2]],
    ['curl_sentado', 3, 12, [2, 1, 2], null, BOTELLA],
    ['silla', 3, 12, [2, 1, 3]],
    ['escalon', 3, 10, [2, 1, 2], 'ambos'],
    ['andar_globo', 2, 10, [1, 0, 1]],
    ['andar_ocho', 3, 2, [9, 0, 9]],
    ['isquios_sentado', 3, 3, [2, 10, 2], 'ambos'],
    ['brazos_arriba', 3, 3, [2, 10, 2]],
  ]),
];
