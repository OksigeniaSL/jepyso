// Exercise catalogue, the routine link format and the local store.
// Texts are written for any Spanish speaker (tú, no regional words), from open home-exercise guides (AAOS, NHS).

// Every exercise: the starting position, the steps, where it is felt (only when an open guide says so), the most
// common mistake, an easier way when the guide gives one, and the open guides it comes from (docs/guias-tanda-1.md
// in the agent's notes has each one with its page).
export const EJERCICIOS = {
  puente: {
    nombre: 'Puente de glúteo',
    otrosNombres: ['puente de cadera', 'elevación de pelvis'],
    posicion: 'Boca arriba',
    material: 'Esterilla',
    unLado: false,
    zonas: ['cadera', 'lumbar', 'rodilla'],
    musculos: { principales: ['gluteo_mayor'], secundarios: ['isquiotibiales', 'erectores'] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 2, 2] },
    partida: 'Boca arriba, con los brazos a los lados, las rodillas dobladas y los pies apoyados, separados a la anchura de la cadera.',
    pasos: [
      'Aprieta el abdomen y los glúteos.',
      'Sube la cadera hasta que hombros, cadera y rodillas queden en línea, con el peso sobre los omóplatos.',
      'Mantén arriba sin arquear la zona lumbar.',
      'Baja despacio hasta apoyar la cadera.',
    ],
    notar: 'En los glúteos y en la parte de atrás de los muslos. También trabaja la musculatura de la zona lumbar.',
    error: 'Hacer fuerza con el cuello. El peso va sobre los omóplatos, y el cuello, suelto.',
    fuentes: ['AAOS, programa de columna (ejercicio 9)', 'King’s College Hospital (NHS), prótesis de cadera'],
  },
  silla: {
    nombre: 'Levantarse de la silla',
    otrosNombres: ['sit to stand', 'sentarse y levantarse'],
    posicion: 'Sentado',
    material: 'Silla firme',
    unLado: false,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['cuadriceps', 'gluteo_mayor'], secundarios: ['isquiotibiales', 'gemelos', 'erectores'] },
    porDefecto: { series: 3, reps: 8, tempo: [2, 1, 3] },
    partida: 'Sentado en la parte delantera de una silla firme, sin ruedas y apoyada en la pared, con los pies apoyados a la anchura de los hombros y los brazos cruzados sobre el pecho.',
    pasos: [
      'Inclina el tronco hacia delante.',
      'Ponte de pie sin ayudarte de las manos, con la espalda recta y la cabeza alta.',
      'Siéntate despacio, llevando la cadera hacia atrás.',
    ],
    error: 'Dejarte caer en la silla. La bajada, despacio, también es parte del ejercicio.',
    ayuda: 'Si te cuesta levantarte, empuja con una mano en el asiento.',
    fuentes: ['King’s College Hospital (NHS), prótesis de cadera y dolor lumbar', 'Wrightington, Wigan and Leigh (NHS), dolor lumbar'],
  },
  hombro: {
    nombre: 'Rotación externa con banda',
    posicion: 'De pie',
    material: 'Banda elástica',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['manguito_posterior'], secundarios: ['deltoides_posterior'] },
    porDefecto: { series: 3, reps: 12, tempo: [2, 1, 2] },
    partida: 'De pie y de lado a una puerta, con la banda atada al pomo a la altura de la cintura y el brazo que no trabaja junto a la puerta. El codo del otro brazo, doblado en ángulo recto y pegado al costado.',
    pasos: [
      'Sujeta la banda con el antebrazo delante del abdomen. Una toalla pequeña entre el codo y el costado ayuda a no separarlo.',
      'Gira el brazo hacia fuera estirando la banda, sin separar el codo.',
      'Vuelve despacio.',
    ],
    notar: 'En la parte de atrás del hombro.',
    error: 'Separar el codo del costado para llegar más lejos.',
    fuentes: ['AAOS, programa de hombro y manguito rotador (ejercicio 9)'],
  },
  // ---- First batch (docs/04-biblioteca.md in the agent's notes). Written from the open guides; each one enters the
  // library (ORDEN) when its clips exist for both bodies.
  talon: {
    nombre: 'Deslizamiento de talón',
    otrosNombres: ['heel slide'],
    posicion: 'Boca arriba',
    material: 'Cama o esterilla',
    unLado: true,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['isquiotibiales'], secundarios: [] },
    porDefecto: { series: 2, reps: 10, tempo: [3, 2, 3] },
    partida: 'Boca arriba en la cama o en el suelo, con las dos piernas estiradas.',
    pasos: [
      'Dobla la rodilla deslizando el talón hacia el glúteo, sin despegarlo.',
      'Llega hasta donde puedas y mantén un momento.',
      'Vuelve despacio a estirar la pierna.',
    ],
    error: 'Levantar el talón. Tiene que ir deslizando por la superficie todo el rato.',
    fuentes: ['Sandwell and West Birmingham (NHS), prótesis de cadera', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  pierna_recta: {
    nombre: 'Elevación de pierna recta',
    otrosNombres: ['SLR'],
    posicion: 'Boca arriba',
    material: 'Esterilla',
    unLado: true,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['cuadriceps'], secundarios: [] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 5, 2] },
    partida: 'Boca arriba, apoyado sobre los antebrazos con los codos bajo los hombros. La pierna que trabaja, estirada; la otra, doblada y con el pie apoyado.',
    pasos: [
      'Aprieta el muslo de la pierna estirada.',
      'Súbela recta hasta que el talón quede a un palmo del suelo.',
      'Mantén arriba sin doblar la rodilla.',
      'Baja despacio.',
    ],
    notar: 'En la parte delantera del muslo.',
    error: 'Doblar la rodilla al subir. La pierna sube entera, recta, y el cuello y los hombros van sueltos.',
    ayuda: 'Puedes hacerlo con la cabeza y los hombros apoyados en almohadas.',
    fuentes: ['AAOS, programa de rodilla (ejercicio 8)', 'King’s College Hospital (NHS), prótesis de cadera'],
  },
  cuadriceps: {
    nombre: 'Apretar el muslo',
    otrosNombres: ['cuádriceps isométrico', 'isométrico de cuádriceps'],
    posicion: 'Boca arriba',
    material: 'Toalla enrollada',
    unLado: true,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['cuadriceps'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [1, 5, 1] },
    partida: 'Boca arriba, con las piernas estiradas y una toalla enrollada bajo el talón de la pierna que trabaja, de modo que la rodilla quede en el aire.',
    pasos: [
      'Aprieta el muslo y empuja la parte de atrás de la rodilla hacia abajo, hasta estirarla del todo.',
      'Mantén la fuerza.',
      'Relaja.',
    ],
    notar: 'En la parte delantera del muslo.',
    error: 'Mover la pierna. Aquí no se ve movimiento: es apretar el muslo con la rodilla recta.',
    ayuda: 'Sin la toalla, con la pierna apoyada del todo, también vale.',
    fuentes: ['Calderdale and Huddersfield (NHS), prótesis de rodilla', 'Sandwell and West Birmingham (NHS), prótesis de rodilla y de cadera'],
  },
  rodilla_pecho: {
    nombre: 'Rodilla al pecho',
    posicion: 'Boca arriba',
    material: 'Esterilla',
    unLado: true,
    zonas: ['lumbar', 'cadera'],
    musculos: { principales: ['gluteo_mayor'], secundarios: ['gluteo_medio'] },
    porDefecto: { series: 2, reps: 4, tempo: [3, 30, 3] },
    partida: 'Boca arriba, con las piernas estiradas.',
    pasos: [
      'Dobla una rodilla y llévala hacia el pecho, cogiéndola con las manos por la espinilla.',
      'Acércala con suavidad hasta donde llegue, con la zona lumbar pegada al suelo.',
      'Mantén.',
      'Vuelve despacio a estirar la pierna.',
    ],
    notar: 'En los glúteos y en la zona lumbar.',
    error: 'Despegar la zona lumbar del suelo al tirar de la rodilla.',
    fuentes: ['AAOS, programas de cadera (ejercicio 3) y de columna (ejercicio 5)', 'King’s College Hospital (NHS), dolor lumbar'],
  },
  basculacion: {
    nombre: 'Basculación pélvica',
    posicion: 'Boca arriba',
    material: 'Esterilla',
    unLado: false,
    zonas: ['lumbar'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [3, 2, 3] },
    partida: 'Boca arriba, con las rodillas dobladas, los pies apoyados y los brazos a los lados. Bajo la zona lumbar queda un pequeño hueco.',
    pasos: [
      'Bascula la pelvis hacia atrás hasta que la zona lumbar toque el suelo.',
      'Mantén un momento.',
      'Vuelve despacio a la posición de partida.',
    ],
    error: 'Aguantar la respiración o apretar el abdomen. Respira con calma: solo se mueve la pelvis.',
    fuentes: ['King’s College Hospital (NHS), dolor lumbar', 'South Tees (NHS), basculación pélvica'],
  },
  cojin_rodillas: {
    nombre: 'Cojín entre las rodillas',
    otrosNombres: ['aductores isométricos', 'aducción isométrica'],
    posicion: 'Boca arriba',
    material: 'Cojín o toalla grande',
    unLado: false,
    zonas: ['cadera', 'rodilla'],
    musculos: { principales: ['aductores'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [1, 5, 1] },
    partida: 'Boca arriba con la cabeza en una almohada, las rodillas dobladas, los pies apoyados y un cojín o una toalla grande enrollada entre las rodillas.',
    pasos: ['Aprieta las rodillas contra el cojín.', 'Mantén la fuerza.', 'Afloja despacio.'],
    error: 'Apretar tanto que duela. Basta con algo más de la mitad de tu fuerza.',
    fuentes: ['South West London Elective Orthopaedic Centre, prótesis de rodilla', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  tobillos: {
    nombre: 'Bombeo de tobillos',
    posicion: 'Boca arriba',
    material: 'Sin material',
    unLado: false,
    zonas: ['tobillo', 'rodilla', 'cadera'],
    musculos: { principales: ['gemelos', 'tibial_anterior'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [1, 0, 1] },
    partida: 'Tumbado o sentado, con las piernas estiradas.',
    pasos: ['Lleva las puntas de los pies hacia ti todo lo que puedas.', 'Estíralas hacia abajo todo lo que puedas.'],
    para: 'Ayuda a mover la circulación de las piernas.',
    error: 'Moverlos a medias. Los pies van todo lo que dan de sí, arriba y abajo.',
    fuentes: ['Sandwell and West Birmingham (NHS), prótesis de rodilla y de cadera'],
  },
  almeja: {
    nombre: 'Almeja',
    otrosNombres: ['clamshell'],
    posicion: 'De lado',
    material: 'Esterilla',
    unLado: true,
    zonas: ['cadera'],
    musculos: { principales: ['gluteo_medio'], secundarios: ['gluteo_mayor'] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 5, 5] },
    partida: 'Tumbado de lado, con la pierna que trabaja arriba, las caderas algo dobladas y las rodillas en ángulo recto. Pies, rodillas y caderas, uno encima de otro, y la cabeza apoyada en el brazo.',
    pasos: [
      'Con los pies juntos, sube la rodilla de arriba todo lo que puedas sin mover la pelvis.',
      'Mantén arriba.',
      'Baja despacio.',
    ],
    error: 'Echar el cuerpo hacia atrás para subir más la rodilla. Quédate bien de lado.',
    fuentes: ['AAOS, programa de cadera (ejercicio 8)', 'Calderdale and Huddersfield (NHS), prótesis de rodilla', 'King’s College Hospital (NHS), prótesis de cadera'],
  },
  abduccion_lado: {
    nombre: 'Abducción de cadera de lado',
    posicion: 'De lado',
    material: 'Esterilla',
    unLado: true,
    zonas: ['cadera', 'rodilla'],
    musculos: { principales: ['gluteo_medio'], secundarios: [] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 5, 2] },
    partida: 'Tumbado de lado, con la pierna que trabaja arriba y estirada, y la de abajo doblada para estar estable. La cabeza, apoyada en el brazo.',
    pasos: ['Sube despacio la pierna de arriba, estirada, hasta unos 45 grados.', 'Mantén arriba.', 'Baja despacio y descansa un momento.'],
    notar: 'En la cara de fuera del muslo y en el glúteo.',
    error: 'Girar la pierna para subirla más. La cara de fuera del muslo mira al techo todo el rato.',
    fuentes: ['AAOS, programas de rodilla (ejercicio 10) y de cadera (ejercicio 5)'],
  },
  extension_rodilla: {
    nombre: 'Extensión de rodilla sentado',
    posicion: 'Sentado',
    material: 'Silla',
    unLado: true,
    zonas: ['rodilla'],
    musculos: { principales: ['cuadriceps'], secundarios: [] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 5, 2] },
    partida: 'Sentado en una silla con la espalda erguida, el muslo apoyado en el asiento y los pies en el suelo.',
    pasos: [
      'Aprieta el muslo y estira despacio la rodilla, subiendo el pie hasta donde puedas.',
      'Mantén arriba apretando.',
      'Baja despacio hasta apoyar el pie.',
    ],
    notar: 'En la parte delantera del muslo.',
    error: 'Subir la pierna de golpe, con impulso. Sube y baja despacio.',
    fuentes: ['AAOS, programa de rodilla (ejercicio 7)', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  talones: {
    nombre: 'Elevación de talones',
    posicion: 'De pie',
    material: 'Apoyo firme',
    unLado: false,
    zonas: ['tobillo', 'rodilla'],
    musculos: { principales: ['gemelos'], secundarios: [] },
    porDefecto: { series: 2, reps: 10, tempo: [2, 1, 2] },
    partida: 'De pie, de frente a un apoyo firme (una encimera, una mesa pesada o el respaldo de una silla firme contra la pared), con las dos manos en él. Los pies, a la anchura de la cadera.',
    pasos: ['Sube los talones todo lo que puedas, hasta quedarte de puntillas.', 'Mantén arriba un momento.', 'Baja despacio.'],
    notar: 'En la pantorrilla.',
    error: 'Doblar las rodillas para ayudarte. Se quedan estiradas.',
    masDificil: 'Cuando te resulte fácil, hazlo apoyado en una sola pierna.',
    fuentes: ['AAOS, programas de rodilla (ejercicio 6) y de tobillo y pie (ejercicio 5)', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  curl_isquios: {
    nombre: 'Curl de isquios de pie',
    posicion: 'De pie',
    material: 'Apoyo firme',
    unLado: true,
    zonas: ['rodilla'],
    musculos: { principales: ['isquiotibiales'], secundarios: [] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 5, 2] },
    partida: 'De pie y erguido, de frente a un apoyo firme (una encimera, una mesa pesada o el respaldo de una silla firme contra la pared), con las dos manos en él y las rodillas juntas.',
    pasos: ['Dobla la rodilla y sube el talón hacia atrás, hasta donde puedas sin dolor.', 'Mantén arriba, con el muslo vertical.', 'Baja despacio.'],
    notar: 'En la parte de atrás del muslo.',
    error: 'Adelantar la rodilla. El muslo se queda vertical y las rodillas, juntas.',
    fuentes: ['AAOS, programa de rodilla (ejercicio 5)', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  sentadilla: {
    nombre: 'Media sentadilla',
    posicion: 'De pie',
    material: 'Apoyo firme',
    unLado: false,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['cuadriceps', 'gluteo_mayor'], secundarios: ['isquiotibiales'] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 5, 2] },
    partida: 'De pie, de frente a un apoyo firme (una encimera, una mesa pesada o el respaldo de una silla firme contra la pared), con las manos en él, y los pies a la anchura de los hombros.',
    pasos: [
      'Con el pecho alto, baja la cadera un palmo, como si fueras a sentarte.',
      'Mantén abajo, con el peso en los talones.',
      'Sube empujando con los talones.',
    ],
    notar: 'Delante y detrás de los muslos, y en los glúteos.',
    error: 'Doblarte por la cintura. El pecho, alto, y la espalda, recta.',
    fuentes: ['AAOS, programa de rodilla (ejercicio 4)', 'King’s College Hospital (NHS), prótesis de cadera'],
  },
  abduccion_pie: {
    nombre: 'Abducción de cadera de pie',
    posicion: 'De pie',
    material: 'Apoyo firme',
    unLado: true,
    zonas: ['cadera'],
    musculos: { principales: ['gluteo_medio'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 1, 2] },
    partida: 'De pie y de lado a un apoyo firme (una encimera o el respaldo de una silla firme contra la pared), con la mano más cercana en él y la otra en la cadera.',
    pasos: ['Con la pierna estirada, llévala hacia el lado todo lo que puedas.', 'Vuelve despacio.'],
    error: 'Inclinar el tronco hacia el otro lado. El tronco se queda erguido.',
    fuentes: ['Sandwell and West Birmingham (NHS), prótesis de cadera'],
  },
  equilibrio: {
    nombre: 'Equilibrio a una pierna',
    posicion: 'De pie',
    material: 'Apoyo firme',
    unLado: true,
    zonas: ['tobillo', 'rodilla'],
    musculos: { principales: ['gemelos', 'tibial_anterior'], secundarios: [] },
    porDefecto: { series: 1, reps: 3, tempo: [1, 30, 1] },
    partida: 'De pie junto a una encimera o una mesa pesada, con las dos manos apoyadas. Mejor con calzado cómodo.',
    pasos: [
      'Levanta un pie y quédate sobre la otra pierna, con la rodilla estirada.',
      'Suelta las manos del apoyo y vuelve a ponerlas cuando lo necesites.',
      'Baja el pie.',
    ],
    error: 'Alejarte del apoyo. Tenlo siempre al alcance de la mano.',
    masDificil: 'Descalzo cuesta más, y con los ojos cerrados, más aún.',
    fuentes: ['AAOS, programa de tobillo y pie (ejercicio 10)', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  bird_dog: {
    nombre: 'Brazo y pierna contrarios a cuatro patas',
    otrosNombres: ['bird dog', 'perro de muestra'],
    posicion: 'A cuatro patas',
    material: 'Esterilla',
    unLado: true,
    zonas: ['lumbar'],
    musculos: { principales: ['erectores', 'gluteo_mayor'], secundarios: [] },
    porDefecto: { series: 1, reps: 5, tempo: [3, 15, 3] },
    partida: 'A cuatro patas, con las manos bajo los hombros y las rodillas bajo las caderas. La espalda, plana.',
    pasos: [
      'Aprieta el abdomen y sube un brazo estirado hasta la altura del hombro.',
      'Sube y estira la pierna contraria hasta dejarla en línea con el cuerpo.',
      'Mantén, apretando los glúteos.',
      'Vuelve despacio.',
    ],
    notar: 'En la zona lumbar y en los glúteos.',
    error: 'Arquear la espalda al subir la pierna. El abdomen, apretado, y la espalda, plana.',
    fuentes: ['AAOS, programa de columna (ejercicio 6)'],
  },
  gato_camello: {
    nombre: 'Gato-camello',
    otrosNombres: ['cat camel', 'gato y camello'],
    posicion: 'A cuatro patas',
    material: 'Esterilla',
    unLado: false,
    zonas: ['lumbar'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [3, 3, 3] },
    partida: 'A cuatro patas, con las manos bajo los hombros, las rodillas a la anchura de la cadera y la espalda en su postura natural.',
    pasos: [
      'Redondea la espalda hacia el techo todo lo que puedas, llevando la cabeza hacia el pecho.',
      'Mantén un momento.',
      'Baja y arquea la espalda al revés, levantando la cabeza.',
    ],
    error: 'Ir deprisa. Muévete despacio y sin forzar.',
    fuentes: ['Wrightington, Wigan and Leigh (NHS), dolor lumbar', 'King’s College Hospital (NHS), dolor lumbar'],
  },
  pendulo: {
    nombre: 'Péndulo de hombro',
    posicion: 'De pie, inclinado',
    material: 'Mesa o encimera',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['manguito_posterior'], secundarios: ['deltoides_anterior', 'deltoides_medio', 'deltoides_posterior'] },
    porDefecto: { series: 2, reps: 10, tempo: [1, 0, 1] },
    partida: 'De pie, inclinado hacia delante con una mano apoyada en una mesa o una encimera. El otro brazo cuelga suelto.',
    pasos: ['Balancea el brazo suelto adelante y atrás, con suavidad.', 'Después, de lado a lado.', 'Y después, en pequeños círculos.'],
    error: 'Redondear la espalda o bloquear las rodillas.',
    fuentes: ['AAOS, programa de hombro y manguito rotador (ejercicio 1)'],
  },
  cruzado: {
    nombre: 'Estiramiento cruzado de hombro',
    posicion: 'De pie',
    material: 'Sin material',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['deltoides_posterior'], secundarios: [] },
    porDefecto: { series: 1, reps: 4, tempo: [3, 30, 3] },
    partida: 'De pie, con los hombros relajados.',
    pasos: [
      'Lleva un brazo estirado cruzando el pecho.',
      'Sujétalo con la otra mano por encima del codo y acércalo con suavidad hasta donde llegue.',
      'Mantén.',
      'Suelta despacio.',
    ],
    notar: 'En la parte de atrás del hombro.',
    error: 'Tirar del codo. La mano sujeta el brazo por encima de él.',
    fuentes: ['AAOS, programa de hombro y manguito rotador (ejercicio 2)'],
  },
  baston: {
    nombre: 'Rotación externa con bastón',
    posicion: 'De pie',
    material: 'Bastón o palo ligero',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['manguito_posterior'], secundarios: [] },
    porDefecto: { series: 1, reps: 4, tempo: [3, 30, 3] },
    partida: 'De pie, con los codos doblados en ángulo recto y pegados al cuerpo. Coge el bastón con una mano y recoge el otro extremo en la palma de la otra.',
    pasos: [
      'Con el codo del lado que estiras pegado al costado, empuja el bastón con la otra mano para llevar ese brazo hacia fuera.',
      'Para al notar tirantez, sin dolor, y mantén.',
      'Vuelve despacio.',
    ],
    notar: 'En la parte de atrás del hombro.',
    error: 'Girar la cadera o el tronco. Las caderas miran al frente todo el rato.',
    fuentes: ['AAOS, programa de hombro y manguito rotador (ejercicio 4)'],
  },
  rotacion_interna: {
    nombre: 'Rotación interna con banda',
    posicion: 'De pie',
    material: 'Banda elástica',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['pectoral'], secundarios: [] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 1, 2] },
    partida: 'De pie y de lado a una puerta, con la banda atada al pomo a la altura de la cintura y el brazo que trabaja junto a la puerta. El codo, doblado en ángulo recto y pegado al costado.',
    pasos: ['Lleva la mano hacia el abdomen estirando la banda, sin separar el codo del costado.', 'Vuelve despacio.'],
    notar: 'En el pecho y en el hombro.',
    error: 'Separar el codo del costado.',
    fuentes: ['AAOS, programa de hombro y manguito rotador (ejercicio 8)'],
  },
  remo: {
    nombre: 'Remo con banda de pie',
    posicion: 'De pie',
    material: 'Banda elástica',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['trapecio'], secundarios: ['deltoides_posterior'] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 1, 2] },
    partida: 'De pie y de frente a una puerta, con la banda atada al pomo a la altura de la cintura. Sujétala con el codo doblado y junto al costado.',
    pasos: ['Lleva el codo hacia atrás, pegado al cuerpo, juntando los omóplatos.', 'Vuelve despacio.'],
    notar: 'En la parte de atrás del hombro y en la parte alta de la espalda.',
    error: 'Separar el brazo del costado al tirar.',
    fuentes: ['AAOS, programa de hombro y manguito rotador (ejercicio 6)'],
  },
  // ---- Second batch (docs/04-biblioteca.md and docs/guias-tanda-2.md in the agent's notes).
  arco_corto: {
    nombre: 'Cuádriceps en arco corto',
    otrosNombres: ['inner range quads', 'rodillo bajo la rodilla'],
    posicion: 'Boca arriba',
    material: 'Toalla enrollada o cojín firme',
    unLado: true,
    zonas: ['rodilla'],
    musculos: { principales: ['cuadriceps'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 5, 2] },
    partida: 'Boca arriba, con una toalla enrollada o un cojín firme bajo la rodilla que trabaja. La rodilla queda algo doblada y el talón, en el suelo.',
    pasos: [
      'Lleva la punta del pie hacia ti y aprieta el muslo.',
      'Estira la rodilla levantando el talón, sin despegar el muslo del rodillo.',
      'Mantén.',
      'Baja despacio.',
    ],
    notar: 'En el muslo, por delante.',
    error: 'Despegar el muslo del rodillo. Solo se mueve la pierna, de la rodilla para abajo.',
    masDificil: 'Con el muslo apretado, levanta la pierna entera del rodillo.',
    fuentes: ['NHS Lothian y Royal United Hospitals Bath (NHS), lesión de rodilla', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  gluteos: {
    nombre: 'Apretar los glúteos',
    otrosNombres: ['glúteos isométricos', 'isométrico de glúteo'],
    posicion: 'Boca arriba',
    material: 'Sin material',
    unLado: false,
    zonas: ['cadera'],
    musculos: { principales: ['gluteo_mayor'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [1, 5, 1] },
    partida: 'Tumbado boca arriba con las piernas estiradas y los brazos a los lados. También se puede hacer sentado.',
    pasos: ['Aprieta los glúteos con fuerza.', 'Mantén.', 'Afloja.'],
    error: 'Aguantar la respiración. Respira con calma mientras aprietas.',
    fuentes: ['Sandwell and West Birmingham (NHS), prótesis de cadera', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  rodillas_lado: {
    nombre: 'Rodillas a un lado y a otro',
    otrosNombres: ['knee rolls', 'rotación lumbar tumbado'],
    posicion: 'Boca arriba',
    material: 'Esterilla',
    unLado: false,
    zonas: ['lumbar'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [3, 3, 3] },
    partida: 'Boca arriba, con las rodillas juntas y dobladas, los pies apoyados y los brazos a los lados o algo abiertos.',
    pasos: [
      'Deja caer despacio las dos rodillas juntas hacia un lado.',
      'Para un momento.',
      'Llévalas despacio al otro lado y vuelve al centro.',
    ],
    error: 'Despegar los hombros del suelo. La parte de arriba del cuerpo se queda quieta; solo giran la pelvis y las piernas.',
    fuentes: ['King’s College Hospital (NHS), dolor lumbar', 'Wrightington, Wigan and Leigh (NHS), dolor lumbar', 'Addenbrooke’s (NHS), movilidad de la espalda'],
  },
  bicho_muerto: {
    nombre: 'Bicho muerto',
    otrosNombres: ['dead bug'],
    posicion: 'Boca arriba',
    material: 'Esterilla',
    unLado: true,
    zonas: ['lumbar'],
    musculos: { principales: ['recto_abdominal'], secundarios: ['oblicuos'] },
    porDefecto: { series: 3, reps: 10, tempo: [3, 1, 3] },
    partida: 'Boca arriba, con los brazos estirados hacia el techo y las piernas en el aire, con las caderas y las rodillas dobladas en ángulo recto.',
    pasos: [
      'Pega la zona lumbar al suelo y aprieta el abdomen.',
      'Baja a la vez un brazo por encima de la cabeza y la pierna contraria, estirada, hasta casi tocar el suelo.',
      'Vuelve despacio y hazlo con el otro brazo y la otra pierna.',
    ],
    error: 'Arquear la espalda al bajar la pierna. La pelvis se queda quieta y la zona lumbar, pegada al suelo.',
    ayuda: 'Para empezar, toca con una mano la rodilla contraria en lugar de estirar el brazo y la pierna.',
    fuentes: ['Vanderbilt Sports Medicine, fuerza del tronco', 'Oxford Health (NHS), fuerza del tronco'],
  },
  abdominal: {
    nombre: 'Activar el abdomen',
    otrosNombres: ['bracing', 'activación abdominal', 'meter el ombligo'],
    posicion: 'Boca arriba',
    material: 'Esterilla',
    unLado: false,
    zonas: ['lumbar'],
    musculos: { principales: ['recto_abdominal'], secundarios: ['oblicuos'] },
    porDefecto: { series: 1, reps: 5, tempo: [1, 15, 1] },
    partida: 'Boca arriba, con las rodillas dobladas, los pies apoyados y los brazos a los lados.',
    pasos: [
      'Aprieta el abdomen como si quisieras separarlo de la cinturilla del pantalón.',
      'Mantén, respirando con normalidad.',
      'Afloja.',
    ],
    notar: 'En el abdomen.',
    error: 'Arquear la espalda o aguantar la respiración. La zona lumbar, pegada al suelo, y la respiración, normal.',
    fuentes: ['AAOS, programa de columna (ejercicio 10)', 'Addenbrooke’s (NHS), movilidad de la espalda'],
  },
  cuello_giro: {
    nombre: 'Rotación de cuello',
    cuidado: 'Para si te mareas o se te nubla la vista.',
    otrosNombres: ['mirar por encima del hombro', 'rotación cervical'],
    posicion: 'Sentado',
    material: 'Silla',
    unLado: false,
    zonas: ['cuello'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 1, 2] },
    partida: 'Sentado erguido, con las dos manos agarradas al asiento para que los hombros se queden abajo.',
    pasos: [
      'Gira la cabeza para mirar por encima de un hombro, hasta donde estés cómodo.',
      'Mantén un momento.',
      'Gira al otro lado y vuelve al centro.',
    ],
    error: 'Forzar hasta que duela. Un dolor sordo y suave al principio es normal; un dolor fuerte es pasarse.',
    fuentes: ['Servicio de musculoesquelético OCATS (NHS), movilidad del cuello', 'Calderdale and Huddersfield (NHS), movilidad cervical'],
  },
  cuello_lado: {
    nombre: 'Inclinación de cuello',
    cuidado: 'Para si te mareas o se te nubla la vista.',
    otrosNombres: ['oreja al hombro', 'inclinación cervical'],
    posicion: 'Sentado',
    material: 'Silla',
    unLado: false,
    zonas: ['cuello'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 1, 2] },
    partida: 'Sentado erguido, con la cara al frente y las dos manos agarradas al asiento.',
    pasos: [
      'Inclina la cabeza llevando la oreja hacia el hombro, hasta donde estés cómodo.',
      'Mantén un momento.',
      'Inclínala al otro lado y vuelve al centro.',
    ],
    notar: 'En el cuello y el hombro del lado contrario.',
    error: 'Subir el hombro hacia la oreja. Los hombros se quedan abajo y relajados; baja la oreja, no sube el hombro.',
    fuentes: ['Servicio de musculoesquelético OCATS (NHS), movilidad del cuello', 'Calderdale and Huddersfield (NHS), estiramientos'],
  },
  escapulas: {
    nombre: 'Juntar las escápulas',
    otrosNombres: ['retracción escapular', 'scapula setting'],
    posicion: 'Sentado',
    material: 'Silla',
    unLado: false,
    zonas: ['cuello', 'hombro'],
    musculos: { principales: ['trapecio'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 10, 2] },
    partida: 'Sentado erguido, sin apoyar la espalda, con las manos en los muslos.',
    pasos: ['Lleva las escápulas hacia atrás y hacia abajo, juntándolas.', 'Mantén.', 'Suelta despacio.'],
    notar: 'En la parte alta de la espalda, entre las escápulas.',
    error: 'Tensar el cuello o encoger los hombros. El cuello, suelto.',
    fuentes: ['AAOS, programa de hombro y manguito rotador (ejercicio 13)', 'Cambridge University Hospitals (NHS), fuerza del hombro'],
  },
  scaption: {
    nombre: 'Elevación del brazo en diagonal',
    otrosNombres: ['scaption', 'elevación en el plano de la escápula'],
    posicion: 'De pie',
    material: 'Peso pequeño, como una botella de agua',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['deltoides_medio'], secundarios: ['deltoides_anterior', 'manguito_posterior'] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 5, 2] },
    partida: 'De pie y erguido, con los brazos a los lados y un peso pequeño en la mano.',
    pasos: [
      'Sube el brazo estirado por delante y algo hacia fuera, con el pulgar hacia arriba, hasta la altura del hombro.',
      'Mantén.',
      'Bájalo con control.',
    ],
    error: 'Balancear la espalda o encoger el hombro para subir el brazo.',
    masDificil: 'Cuando te resulte fácil, súbelo por encima de la altura del hombro.',
    fuentes: ['NHS Ayrshire & Arran, hombro doloroso y débil'],
  },
  rotacion_lado: {
    nombre: 'Rotación externa tumbado de lado',
    otrosNombres: ['rotación externa con mancuerna', 'side lying external rotation'],
    posicion: 'De lado',
    material: 'Peso pequeño y una toalla',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['manguito_posterior'], secundarios: ['deltoides_posterior'] },
    porDefecto: { series: 2, reps: 10, tempo: [2, 1, 5] },
    partida: 'Tumbado de lado, con el brazo que trabaja arriba, el codo doblado en ángulo recto y pegado al costado, con una toalla entre el codo y el cuerpo. El antebrazo, delante del abdomen y con el peso en la mano.',
    pasos: [
      'Con el codo pegado, gira el brazo para llevar la mano hacia el techo.',
      'Mantén un momento arriba.',
      'Baja despacio, contando hasta cinco.',
    ],
    notar: 'En la parte de atrás del hombro y en la parte alta de la espalda.',
    error: 'Rodar el cuerpo hacia atrás al subir el peso. Quédate bien de lado.',
    ayuda: 'Al principio, sin peso.',
    fuentes: ['AAOS, programa de hombro y manguito rotador (ejercicio 17)', 'Wrightington, Wigan and Leigh (NHS), hombro'],
  },
  muneca: {
    nombre: 'Flexión y extensión de muñeca',
    otrosNombres: ['muñeca arriba y abajo', 'movilidad de muñeca'],
    posicion: 'Sentado a la mesa',
    material: 'Mesa',
    unLado: true,
    zonas: ['mano'],
    musculos: { principales: ['antebrazo'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 1, 2] },
    partida: 'Sentado, con el antebrazo apoyado en la mesa, la palma hacia abajo y la mano por fuera del borde, relajada.',
    pasos: [
      'Sube la mano doblando la muñeca hacia atrás todo lo que puedas.',
      'Bájala doblando la muñeca hacia delante todo lo que puedas.',
      'Vuelve al centro.',
    ],
    error: 'Levantar el antebrazo o el codo de la mesa. Solo se mueve la muñeca, y los dedos van sueltos.',
    ayuda: 'Si está muy rígida, apoya también la mano de lado sobre la mesa y muévela sin levantarla.',
    fuentes: ['Calderdale and Huddersfield (NHS), mano y muñeca', 'Royal Berkshire (NHS), movilidad de la muñeca', 'Royal United Hospitals Bath (NHS), muñeca'],
  },
  prono_supinacion: {
    nombre: 'Girar la palma arriba y abajo',
    otrosNombres: ['pronación y supinación', 'prono-supinación'],
    posicion: 'Sentado a la mesa',
    material: 'Mesa',
    unLado: true,
    zonas: ['mano', 'codo'],
    musculos: { principales: ['antebrazo'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 1, 2] },
    partida: 'Sentado, con el codo doblado en ángulo recto y pegado al costado, y el antebrazo apoyado en la mesa. La mano, abierta y relajada.',
    pasos: [
      'Gira el antebrazo hasta tener la palma hacia abajo.',
      'Gíralo hasta tener la palma hacia arriba.',
      'Vuelve al centro.',
    ],
    error: 'Separar el codo o ayudarte con el hombro. Sujeta el brazo por encima del codo con la otra mano si se te mueve.',
    fuentes: ['Royal United Hospitals Bath (NHS), muñeca', 'Royal Berkshire (NHS), movilidad de la muñeca', 'St George’s (NHS), muñeca'],
  },
  estira_flexores: {
    nombre: 'Estiramiento de la muñeca hacia atrás',
    otrosNombres: ['estiramiento de flexores de muñeca', 'codo de golfista'],
    posicion: 'Sentado',
    material: 'Sin material',
    unLado: true,
    zonas: ['mano', 'codo'],
    musculos: { principales: ['antebrazo'], secundarios: [] },
    porDefecto: { series: 1, reps: 3, tempo: [3, 10, 3] },
    partida: 'Sentado, con el brazo estirado al frente a la altura del hombro y la palma hacia delante, con los dedos hacia arriba.',
    pasos: [
      'Con la otra mano, tira suavemente de los dedos hacia ti.',
      'Mantén el estiramiento.',
      'Suelta despacio.',
    ],
    notar: 'En la cara interna de la muñeca y del antebrazo.',
    error: 'Doblar el codo o tirar hasta que duela. Es una tirantez soportable, no dolor.',
    fuentes: ['Leicestershire Partnership (NHS), codo de golfista', 'NHS Fife, codo de golfista', 'Royal United Hospitals Bath (NHS), muñeca'],
  },
  estira_extensores: {
    nombre: 'Estiramiento de la muñeca hacia delante',
    otrosNombres: ['estiramiento de extensores de muñeca', 'codo de tenista'],
    posicion: 'Sentado',
    material: 'Sin material',
    unLado: true,
    zonas: ['mano', 'codo'],
    musculos: { principales: ['antebrazo'], secundarios: [] },
    porDefecto: { series: 1, reps: 3, tempo: [3, 10, 3] },
    partida: 'Sentado, con el brazo estirado al frente a la altura del hombro, la palma hacia abajo y la muñeca relajada.',
    pasos: [
      'Con la otra mano, empuja suavemente el dorso de la mano para doblar la muñeca hacia ti.',
      'Mantén el estiramiento.',
      'Suelta despacio.',
    ],
    notar: 'En la parte de arriba del antebrazo.',
    error: 'Apretar fuerte. La presión es suave, y la muñeca va relajada.',
    fuentes: ['Leicestershire Partnership (NHS), codo de tenista', 'Royal United Hospitals Bath (NHS), muñeca', 'United Lincolnshire Hospitals (NHS), fractura de muñeca'],
  },
  tendinoso: {
    nombre: 'Deslizamiento de los tendones de los dedos',
    otrosNombres: ['tendon gliding', 'deslizamiento tendinoso', 'cinco posiciones de los dedos'],
    posicion: 'Sentado a la mesa',
    material: 'Mesa',
    unLado: true,
    zonas: ['mano'],
    musculos: { principales: ['antebrazo'], secundarios: [] },
    porDefecto: { series: 1, reps: 5, tempo: [4, 3, 6] },
    partida: 'Sentado, con el codo en la mesa, el antebrazo hacia arriba y la muñeca recta. Los dedos, estirados y juntos.',
    pasos: [
      'Gancho: dobla las dos últimas articulaciones de los dedos, con los nudillos rectos.',
      'Mesa: dobla los dedos solo por los nudillos, con el resto recto.',
      'Puño plano: dobla los dedos hacia la palma con las puntas rectas.',
      'Puño completo: cierra la mano del todo.',
      'Vuelve a estirar los dedos.',
    ],
    error: 'Pasar deprisa de una posición a otra. Quédate un momento en cada una, con la muñeca recta.',
    fuentes: ['St George’s (NHS), deslizamiento de tendones', 'Royal Berkshire (NHS), movilidad de los dedos', 'Calderdale and Huddersfield (NHS), mano y muñeca'],
  },
  abrir_cerrar: {
    nombre: 'Abrir y cerrar la mano',
    otrosNombres: ['puño y mano abierta'],
    posicion: 'Sentado a la mesa',
    material: 'Mesa',
    unLado: true,
    zonas: ['mano'],
    musculos: { principales: ['antebrazo'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 1, 2] },
    partida: 'Sentado, con el codo en la mesa y la mano hacia arriba, con la muñeca recta.',
    pasos: ['Cierra el puño.', 'Abre la mano estirando los dedos y sepáralos todo lo que puedas.'],
    error: 'Doblar la muñeca. Se queda recta mientras se mueven los dedos.',
    fuentes: ['Calderdale and Huddersfield (NHS), mano y muñeca', 'United Lincolnshire Hospitals (NHS), fractura de muñeca'],
  },
  pelota: {
    nombre: 'Apretar una pelota blanda',
    otrosNombres: ['apretar masilla', 'prensión'],
    posicion: 'Sentado a la mesa',
    material: 'Pelota blanda o esponja',
    unLado: true,
    zonas: ['mano'],
    musculos: { principales: ['antebrazo'], secundarios: [] },
    porDefecto: { series: 1, reps: 10, tempo: [1, 3, 1] },
    partida: 'Sentado, con el codo en la mesa y una pelota blanda en la palma. También sirven unos calcetines enrollados o una esponja.',
    pasos: ['Aprieta la pelota con todos los dedos y el pulgar.', 'Mantén.', 'Suelta y estira los dedos.'],
    error: 'Doblar la muñeca al apretar. El antebrazo y la muñeca se quedan rectos.',
    masDificil: 'Aprieta más fuerte a medida que te resulte cómodo, o usa masilla.',
    fuentes: ['United Lincolnshire Hospitals (NHS), fractura de muñeca', 'Calderdale and Huddersfield (NHS), mano y muñeca', 'St George’s (NHS), masilla'],
  },
  deslizar_mesa: {
    nombre: 'Deslizar el brazo por la mesa',
    otrosNombres: ['table slides', 'deslizamiento en la mesa'],
    posicion: 'Sentado a la mesa',
    material: 'Mesa y una toalla',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['deltoides_anterior'], secundarios: [] },
    porDefecto: { series: 3, reps: 10, tempo: [3, 2, 3] },
    partida: 'Sentado erguido junto a una mesa, con la mano sobre una toalla para que resbale y el pulgar hacia arriba.',
    pasos: [
      'Desliza la mano hacia delante por la mesa todo lo que puedas, sin subir el hombro.',
      'Mantén.',
      'Vuelve despacio y con control.',
    ],
    error: 'Subir el hombro hacia la oreja. Deja que el tronco acompañe un poco, pero los hombros, abajo.',
    fuentes: ['Wrightington, Wigan and Leigh (NHS), hombro', 'Servicio OCATS (NHS), movilidad del hombro'],
  },
  sentadilla_pared: {
    nombre: 'Sentadilla en la pared',
    otrosNombres: ['wall squat', 'sentadilla apoyado en la pared'],
    posicion: 'De pie, contra la pared',
    material: 'Pared',
    unLado: false,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['cuadriceps'], secundarios: ['gluteo_mayor'] },
    porDefecto: { series: 1, reps: 10, tempo: [3, 5, 3] },
    partida: 'De pie, con la espalda contra la pared y los pies un paso por delante, separados a la anchura de la cadera.',
    pasos: [
      'Dobla las rodillas y baja deslizando la espalda por la pared, hasta donde estés cómodo.',
      'Mantén.',
      'Empuja con las piernas hasta volver a estar de pie.',
    ],
    error: 'Separar la espalda de la pared o bajar más de lo cómodo.',
    fuentes: ['King’s College Hospital (NHS), prótesis de cadera, ejercicios avanzados'],
  },
  gemelo_pared: {
    nombre: 'Estiramiento de gemelo en la pared',
    otrosNombres: ['heel cord stretch', 'estiramiento de pantorrilla'],
    posicion: 'De pie, frente a la pared',
    material: 'Pared',
    unLado: true,
    zonas: ['tobillo', 'rodilla'],
    musculos: { principales: ['gemelos'], secundarios: [] },
    porDefecto: { series: 2, reps: 4, tempo: [3, 30, 3] },
    partida: 'De cara a la pared, con las manos en ella a la altura del pecho. La pierna que estiras, atrás y recta, con el talón en el suelo; la otra, delante y algo doblada.',
    pasos: [
      'Con los dos talones en el suelo, lleva la cadera hacia la pared.',
      'Mantén el estiramiento.',
      'Vuelve despacio.',
    ],
    notar: 'En la pantorrilla de la pierna de atrás, hasta el talón.',
    error: 'Levantar el talón de atrás o arquear la espalda.',
    ayuda: 'Si no tienes pared a mano, apóyate en una encimera o una mesa pesada.',
    fuentes: ['AAOS, programas de rodilla y de tobillo y pie (ejercicio 1)', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  flexion_pared: {
    nombre: 'Flexión contra la pared',
    otrosNombres: ['wall press up', 'push-up en la pared'],
    posicion: 'De pie, frente a la pared',
    material: 'Pared',
    unLado: false,
    zonas: ['hombro'],
    musculos: { principales: ['pectoral', 'triceps'], secundarios: ['deltoides_anterior'] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 1, 2] },
    partida: 'De pie, de cara a la pared y algo separado de ella, con los brazos estirados y las manos en la pared a la altura de los hombros.',
    pasos: [
      'Dobla los codos y acerca el pecho a la pared, con el cuerpo recto.',
      'Mantén un momento.',
      'Empuja hasta estirar los brazos.',
    ],
    error: 'Doblarte por la cintura. El cuerpo va en línea recta de los talones a la cabeza.',
    masDificil: 'Aleja los pies de la pared; más adelante, hazlo sobre una encimera o una mesa.',
    fuentes: ['NHS Ayrshire & Arran, hombro doloroso y débil'],
  },
  iso_hombro: {
    nombre: 'Isométricos de hombro contra la pared',
    otrosNombres: ['isométricos de hombro', 'empujar la pared'],
    posicion: 'De pie, junto a la pared',
    material: 'Pared',
    unLado: true,
    zonas: ['hombro'],
    musculos: { principales: ['deltoides_medio'], secundarios: [] },
    porDefecto: { series: 1, reps: 5, tempo: [1, 10, 1] },
    partida: 'De pie y de lado a la pared, con el brazo pegado al costado y el codo doblado en ángulo recto.',
    pasos: [
      'Empuja suavemente la pared hacia fuera con el antebrazo, sin que el brazo se mueva.',
      'Mantén la fuerza, que vaya subiendo poco a poco.',
      'Afloja.',
    ],
    notar: 'La tensión en el brazo, que va subiendo poco a poco.',
    error: 'Empujar tan fuerte que duela. Es una fuerza suave y sin movimiento.',
    ayuda: 'Se hace igual en otras direcciones: de cara a la pared empujando con el puño, de espaldas empujando con el codo, o de lado empujando con el dorso de la mano.',
    fuentes: ['NHS Ayrshire & Arran, hombro doloroso y débil', 'Servicio OCATS (NHS), fuerza del hombro', 'Cambridge University Hospitals (NHS), fuerza del hombro'],
  },
  extension_lumbar: {
    nombre: 'Extensión boca abajo con los brazos',
    cuidado: 'Para si el dolor baja hacia la pierna o notas hormigueo.',
    otrosNombres: ['McKenzie', 'press-up', 'cobra suave'],
    posicion: 'Boca abajo',
    material: 'Esterilla',
    unLado: false,
    zonas: ['lumbar'],
    musculos: { principales: ['erectores'], secundarios: [] },
    porDefecto: { series: 1, reps: 5, tempo: [3, 5, 3] },
    partida: 'Boca abajo, con las piernas estiradas y relajadas y las manos en el suelo, bajo los hombros.',
    pasos: [
      'Estira los codos y sube el tronco todo lo que puedas, dejando la pelvis en el suelo.',
      'Mantén, dejando que la pelvis y el abdomen se hundan.',
      'Baja despacio.',
    ],
    error: 'Despegar la pelvis del suelo. Suben el pecho y los hombros; la pelvis y las piernas se quedan abajo.',
    ayuda: 'Para empezar, apóyate en los antebrazos en lugar de estirar los brazos.',
    fuentes: ['Wrightington, Wigan and Leigh (NHS), dolor lumbar', 'Addenbrooke’s (NHS), movilidad de la espalda'],
  },
  plancha: {
    nombre: 'Plancha',
    otrosNombres: ['plank', 'plancha frontal'],
    posicion: 'Boca abajo',
    material: 'Esterilla',
    unLado: false,
    zonas: ['lumbar'],
    musculos: { principales: ['recto_abdominal', 'erectores'], secundarios: ['gluteo_mayor'] },
    porDefecto: { series: 1, reps: 5, tempo: [2, 30, 2] },
    partida: 'Boca abajo, apoyado en los antebrazos, con los codos justo debajo de los hombros.',
    pasos: [
      'Aprieta el abdomen y los glúteos y despega la cadera y las rodillas del suelo.',
      'Mantén el cuerpo recto, de los hombros a los pies.',
      'Baja despacio.',
    ],
    notar: 'En la espalda, en el abdomen y en los glúteos.',
    error: 'Dejar caer la pelvis hacia el suelo. El abdomen, apretado todo el rato.',
    ayuda: 'Si no aguantas, deja las rodillas en el suelo y sube solo la cadera.',
    fuentes: ['AAOS, programa de columna (ejercicio 7)', 'Wrightington, Wigan and Leigh (NHS), dolor lumbar'],
  },
  plancha_lateral: {
    nombre: 'Plancha lateral',
    otrosNombres: ['side plank'],
    posicion: 'De lado',
    material: 'Esterilla',
    unLado: true,
    zonas: ['lumbar'],
    musculos: { principales: ['oblicuos'], secundarios: ['gluteo_medio'] },
    porDefecto: { series: 1, reps: 5, tempo: [2, 15, 2] },
    partida: 'Tumbado de lado, apoyado en el antebrazo, con el codo justo debajo del hombro y las piernas juntas y estiradas.',
    pasos: [
      'Aprieta el abdomen y sube la cadera hasta que el cuerpo quede recto.',
      'Mantén.',
      'Baja despacio y luego hazlo del otro lado.',
    ],
    notar: 'En la cintura, la zona lumbar y el abdomen.',
    error: 'Subir el hombro hacia la oreja o dejar caer la cadera. El cuello, alineado con la espalda.',
    ayuda: 'Más fácil: con la rodilla de abajo doblada y apoyada.',
    fuentes: ['AAOS, programa de columna (ejercicio 8)', 'Vanderbilt Sports Medicine, fuerza del tronco'],
  },
  retraccion: {
    nombre: 'Meter el mentón',
    cuidado: 'Para si te mareas o se te nubla la vista.',
    otrosNombres: ['retracción cervical', 'chin tuck', 'doble papada'],
    posicion: 'Sentado',
    material: 'Silla',
    unLado: false,
    zonas: ['cuello'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 2, reps: 10, tempo: [2, 2, 2] },
    partida: 'Sentado erguido, con los hombros relajados y la mirada al frente.',
    pasos: [
      'Lleva la cabeza hacia atrás metiendo el mentón, como si quisieras hacer papada, sin inclinarla.',
      'Mantén.',
      'Vuelve despacio.',
    ],
    notar: 'Un estiramiento en la parte de atrás del cuello.',
    error: 'Bajar la barbilla hacia el pecho. La cabeza va hacia atrás, recta, con los ojos al frente.',
    fuentes: ['Servicio de musculoesquelético OCATS (NHS), movilidad del cuello', 'Calderdale and Huddersfield (NHS), fuerza del cuello', 'Wrightington, Wigan and Leigh (NHS), cuello'],
  },
  iso_cuello: {
    nombre: 'Isométricos de cuello',
    cuidado: 'Para si te mareas o se te nubla la vista.',
    otrosNombres: ['isométricos cervicales', 'mano contra la cabeza'],
    posicion: 'Sentado',
    material: 'Silla',
    unLado: false,
    zonas: ['cuello'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 1, reps: 5, tempo: [1, 5, 1] },
    partida: 'Sentado en una silla firme, erguido, con los pies apoyados y la mano en la frente.',
    pasos: [
      'Empuja suavemente la frente contra la mano, sin que la cabeza se mueva.',
      'Mantén.',
      'Afloja y vuelve a la posición de partida.',
    ],
    error: 'Mover la cabeza. La mano resiste y la cabeza se queda quieta.',
    ayuda: 'Se hace igual hacia los lados, con la mano por encima de la oreja, y girando, con la mano en el lado de la cabeza.',
    fuentes: ['Calderdale and Huddersfield (NHS), fuerza del cuello', 'Wrightington, Wigan and Leigh (NHS), cuello'],
  },
  trapecio: {
    nombre: 'Estiramiento del trapecio',
    cuidado: 'Para si te mareas o se te nubla la vista.',
    otrosNombres: ['estiramiento de trapecio superior', 'estiramiento del cuello'],
    posicion: 'Sentado',
    material: 'Silla',
    unLado: true,
    zonas: ['cuello'],
    musculos: { principales: ['trapecio'], secundarios: [] },
    porDefecto: { series: 1, reps: 3, tempo: [3, 20, 3] },
    partida: 'Sentado erguido en una silla firme, con los hombros abajo.',
    pasos: [
      'Inclina la oreja hacia un hombro y baja un poco el mentón hacia el pecho.',
      'Con la mano de ese lado por encima de la cabeza, ayuda un poco más, con suavidad.',
      'Mantén el estiramiento y suelta despacio.',
    ],
    notar: 'A lo largo del cuello y el hombro del lado contrario.',
    error: 'Subir el hombro del lado que estiras. Se queda abajo y relajado.',
    fuentes: ['Calderdale and Huddersfield (NHS), estiramientos', 'Wrightington, Wigan and Leigh (NHS), cuello'],
  },
  circulos_tobillo: {
    nombre: 'Círculos de tobillo',
    otrosNombres: ['alfabeto con el pie', 'movilidad de tobillo'],
    posicion: 'Sentado en el suelo',
    material: 'Sin material',
    unLado: true,
    zonas: ['tobillo'],
    musculos: { principales: ['tibial_anterior', 'gemelos'], secundarios: [] },
    porDefecto: { series: 2, reps: 5, tempo: [2, 0, 2] },
    partida: 'Sentado con las piernas estiradas y el talón apoyado, o en una silla con el pie colgando, de modo que el pie se mueva libre.',
    pasos: [
      'Mueve el pie en círculos lentos, guiando con el dedo gordo, cada vez más grandes.',
      'Cambia de sentido.',
      'También puedes escribir en el aire las letras del abecedario con el pie.',
    ],
    notar: 'En el empeine y en todo el tobillo.',
    error: 'Mover la pierna entera. Solo se mueven el pie y el tobillo.',
    fuentes: ['AAOS, programa de tobillo y pie (ejercicio 6)', 'United Lincolnshire Hospitals (NHS), tobillo', 'Leicestershire Partnership (NHS), tobillo'],
  },
  dorsal_banda: {
    nombre: 'Flexión dorsal con banda',
    otrosNombres: ['puntas hacia ti con banda', 'tibial anterior con banda'],
    posicion: 'Sentado en el suelo',
    material: 'Banda elástica',
    unLado: true,
    zonas: ['tobillo'],
    musculos: { principales: ['tibial_anterior'], secundarios: [] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 1, 2] },
    partida: 'Sentado en el suelo con las piernas estiradas, y la banda alrededor del empeine, atada a la pata de una mesa o de un mueble pesado delante de ti.',
    pasos: ['Tira de la punta del pie hacia ti contra la banda.', 'Mantén un momento.', 'Vuelve despacio.'],
    notar: 'En la espinilla y en el empeine.',
    error: 'Levantar el talón o doblar la rodilla. La pierna se queda estirada y el talón, en el suelo.',
    fuentes: ['AAOS, programa de tobillo y pie (ejercicio 9)', 'Servicio OCATS (NHS), tobillo y pie'],
  },
  plantar_banda: {
    nombre: 'Flexión plantar con banda',
    otrosNombres: ['estirar la punta con banda', 'gemelos con banda'],
    posicion: 'Sentado en el suelo',
    material: 'Banda elástica',
    unLado: true,
    zonas: ['tobillo'],
    musculos: { principales: ['gemelos'], secundarios: [] },
    porDefecto: { series: 3, reps: 10, tempo: [2, 1, 2] },
    partida: 'Sentado en el suelo con las piernas estiradas, y la banda alrededor de la planta del pie, con los extremos en las manos.',
    pasos: ['Estira la punta del pie empujando la banda.', 'Mantén un momento.', 'Vuelve despacio.'],
    notar: 'En la pantorrilla.',
    error: 'Doblar la rodilla. Solo se mueve el tobillo.',
    fuentes: ['AAOS, programa de tobillo y pie (ejercicio 9)', 'Servicio OCATS (NHS), tobillo y pie'],
  },
  inversion_banda: {
    nombre: 'Inversión de tobillo con banda',
    otrosNombres: ['pie hacia dentro con banda', 'inversión'],
    posicion: 'Sentado en el suelo',
    material: 'Banda elástica',
    unLado: true,
    zonas: ['tobillo'],
    musculos: { principales: ['tibial_anterior'], secundarios: [] },
    porDefecto: { series: 2, reps: 8, tempo: [2, 2, 2] },
    partida: 'Sentado con la pierna estirada, y la banda alrededor del pie, tirando hacia fuera: sujeta con la mano o atada a algo estable.',
    pasos: [
      'Lleva el pie hacia dentro contra la banda, como si quisieras mirarte la planta.',
      'Mantén un momento.',
      'Vuelve despacio, controlando.',
    ],
    error: 'Girar la pierna entera. Solo se mueve el tobillo.',
    fuentes: ['United Lincolnshire Hospitals (NHS), tobillo', 'Servicio OCATS (NHS), tobillo y pie', 'Leicestershire Partnership (NHS), tobillo'],
  },
  eversion_banda: {
    nombre: 'Eversión de tobillo con banda',
    otrosNombres: ['pie hacia fuera con banda', 'eversión'],
    posicion: 'Sentado en el suelo',
    material: 'Banda elástica',
    unLado: true,
    zonas: ['tobillo'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 2, reps: 8, tempo: [2, 2, 2] },
    partida: 'Sentado con la pierna estirada, y la banda alrededor del pie, tirando hacia dentro: atada a algo estable o rodeando los dos pies.',
    pasos: [
      'Lleva el pie hacia fuera contra la banda, girando los dedos pequeños hacia fuera.',
      'Mantén un momento.',
      'Vuelve despacio, controlando.',
    ],
    error: 'Mover la rodilla. Se queda quieta; solo se mueve el tobillo.',
    fuentes: ['United Lincolnshire Hospitals (NHS), tobillo', 'Servicio OCATS (NHS), tobillo y pie', 'Leicestershire Partnership (NHS), tobillo'],
  },
  toalla_dedos: {
    nombre: 'Arrugar una toalla con los dedos del pie',
    otrosNombres: ['towel curls', 'recoger la toalla con los dedos'],
    posicion: 'Sentado',
    material: 'Toalla pequeña',
    unLado: true,
    zonas: ['tobillo'],
    musculos: { principales: [], secundarios: [] },
    porDefecto: { series: 1, reps: 20, tempo: [1, 2, 1] },
    partida: 'Sentado, con los pies apoyados y una toalla pequeña en el suelo bajo el pie que trabaja.',
    pasos: [
      'Coge la toalla con los dedos del pie y arrástrala hacia ti.',
      'Mantén el agarre un momento.',
      'Suelta y vuelve a estirar los dedos.',
    ],
    notar: 'En el empeine y en los dedos.',
    error: 'Levantar el talón. Se queda en el suelo; solo trabajan los dedos.',
    masDificil: 'Pon un peso pequeño en el borde de la toalla, como una lata.',
    fuentes: ['AAOS, programa de tobillo y pie (ejercicio 8)', 'United Lincolnshire Hospitals (NHS), tobillo', 'Servicio OCATS (NHS), tobillo y pie'],
  },
  escalon: {
    nombre: 'Subir un escalón',
    otrosNombres: ['step up', 'escalón'],
    posicion: 'De pie',
    material: 'Un escalón',
    unLado: true,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['cuadriceps'], secundarios: ['gluteo_mayor'] },
    porDefecto: { series: 1, reps: 10, tempo: [2, 1, 2] },
    partida: 'De pie, de cara a un escalón bajo, cerca de una barandilla o de algo a lo que agarrarte si hace falta.',
    pasos: [
      'Sube al escalón empezando por la pierna que trabaja, despacio.',
      'Ponte recto arriba, con los dos pies en el escalón.',
      'Baja despacio, primero la otra pierna.',
    ],
    error: 'Subir de un impulso. Sube y baja despacio, con el tronco erguido.',
    masDificil: 'Cuando sea fácil, usa un escalón más alto y suelta la barandilla.',
    fuentes: ['King’s College Hospital (NHS), prótesis de cadera y dolor lumbar', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
  cuadriceps_pie: {
    nombre: 'Estiramiento de cuádriceps de pie',
    otrosNombres: ['estiramiento de cuádriceps', 'talón al glúteo'],
    posicion: 'De pie',
    material: 'Apoyo firme',
    unLado: true,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['cuadriceps'], secundarios: [] },
    porDefecto: { series: 1, reps: 3, tempo: [3, 30, 3] },
    partida: 'De pie, con una mano en una encimera, en una mesa pesada o en la pared para mantener el equilibrio.',
    pasos: [
      'Dobla la rodilla y coge el tobillo con la mano del mismo lado.',
      'Acerca el talón al glúteo con suavidad, con las rodillas juntas.',
      'Mantén el estiramiento y suelta despacio.',
    ],
    notar: 'En la parte delantera del muslo.',
    error: 'Arquear o girar la espalda. El tronco, recto.',
    fuentes: ['AAOS, programa de rodilla (ejercicio 2)'],
  },
  isquios_toalla: {
    nombre: 'Estiramiento de isquios tumbado',
    otrosNombres: ['estiramiento de isquiotibiales', 'pierna en alto con toalla'],
    posicion: 'Boca arriba',
    material: 'Toalla',
    unLado: true,
    zonas: ['rodilla', 'cadera'],
    musculos: { principales: ['isquiotibiales'], secundarios: [] },
    porDefecto: { series: 1, reps: 3, tempo: [3, 30, 3] },
    partida: 'Boca arriba, con las dos rodillas dobladas y los pies apoyados. Una toalla alrededor de la planta del pie que estiras, con los extremos en las manos.',
    pasos: [
      'Sube la pierna y estira la rodilla, tirando de la toalla con suavidad hacia la cabeza.',
      'Mantén el estiramiento.',
      'Baja la pierna despacio.',
    ],
    notar: 'En la parte de atrás del muslo y detrás de la rodilla.',
    error: 'Tirar de la rodilla o apoyar las manos en ella. Se tira del pie, con la toalla.',
    fuentes: ['AAOS, programas de rodilla y de cadera', 'Calderdale and Huddersfield (NHS), prótesis de rodilla'],
  },
};

// The library the professional sees, grouped by position: only exercises whose clips exist for both bodies.
export const ORDEN = [
  // lying on the back
  'talon', 'pierna_recta', 'cuadriceps', 'arco_corto', 'puente', 'gluteos', 'rodilla_pecho', 'basculacion', 'abdominal',
  'rodillas_lado', 'bicho_muerto', 'cojin_rodillas', 'tobillos', 'isquios_toalla',
  // face down, on the side and on all fours
  'extension_lumbar', 'plancha', 'almeja', 'abduccion_lado', 'rotacion_lado', 'plancha_lateral', 'bird_dog', 'gato_camello',
  // sitting on the floor: the ankle
  'circulos_tobillo', 'dorsal_banda', 'plantar_banda', 'inversion_banda', 'eversion_banda',
  // sitting: knee, foot, neck and shoulder blades
  'extension_rodilla', 'silla', 'toalla_dedos', 'retraccion', 'cuello_giro', 'cuello_lado', 'iso_cuello', 'trapecio',
  'escapulas',
  // sitting at a table: wrist and hand (back on 13 November 2026 with Gaudí's modelled hand)
  'muneca', 'prono_supinacion', 'estira_flexores', 'estira_extensores', 'tendinoso', 'abrir_cerrar', 'pelota',
  'deslizar_mesa',
  // standing by a chair, and on a step
  'talones', 'curl_isquios', 'sentadilla', 'abduccion_pie', 'equilibrio', 'cuadriceps_pie', 'escalon',
  // at a wall
  'sentadilla_pared', 'gemelo_pared', 'flexion_pared', 'iso_hombro',
  // shoulder, standing
  'pendulo', 'cruzado', 'baston', 'hombro', 'rotacion_interna', 'remo', 'scaption',
];

// Body areas a professional looks for, in the order they are shown.
export const ZONAS = {
  rodilla: 'Rodilla',
  cadera: 'Cadera',
  lumbar: 'Lumbar',
  cuello: 'Cuello',
  hombro: 'Hombro',
  codo: 'Codo',
  tobillo: 'Tobillo y pie',
  mano: 'Mano y muñeca',
};

// The twenty muscle groups painted on Gaudí's bodies (modelos/musculos.js), with the name a professional uses.
export const MUSCULOS = {
  gluteo_mayor: 'Glúteo mayor',
  gluteo_medio: 'Glúteo medio',
  cuadriceps: 'Cuádriceps',
  isquiotibiales: 'Isquiotibiales',
  aductores: 'Aductores',
  gemelos: 'Gemelos',
  tibial_anterior: 'Tibial anterior',
  recto_abdominal: 'Recto abdominal',
  oblicuos: 'Oblicuos',
  erectores: 'Erectores de la columna',
  dorsal_ancho: 'Dorsal ancho',
  trapecio: 'Trapecio',
  pectoral: 'Pectoral',
  deltoides_anterior: 'Deltoides anterior',
  deltoides_medio: 'Deltoides medio',
  deltoides_posterior: 'Deltoides posterior',
  manguito_posterior: 'Manguito rotador',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazo: 'Antebrazo',
};

const sinTildes = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// The library filtered by area, muscle (main or secondary) and words of the name, keeping the catalogue order.
export function buscarEjercicios({ zona = '', musculo = '', texto = '' } = {}) {
  const palabras = sinTildes(texto).split(/\s+/).filter(Boolean);
  return ORDEN.filter((id) => {
    const e = EJERCICIOS[id];
    if (zona && !e.zonas.includes(zona)) return false;
    if (musculo && ![...e.musculos.principales, ...e.musculos.secundarios].includes(musculo)) return false;
    const nombre = sinTildes(`${e.nombre} ${(e.otrosNombres || []).join(' ')} ${e.posicion} ${e.material}`);
    return palabras.every((p) => nombre.includes(p));
  });
}

export const LADOS = { der: 'Lado derecho', izq: 'Lado izquierdo', ambos: 'Los dos lados' };

// Elastic bands come in colours, one per resistance, but every brand has its own scale. The professional says the colour
// of the band they gave the person, and the app never promises a resistance (Enrique, 13 November 2026). «color» paints
// the swatch and the figure's band.
export const BANDAS = {
  amarilla: { nombre: 'Banda amarilla', color: '#e2b93b' },
  roja: { nombre: 'Banda roja', color: '#c4433b' },
  verde: { nombre: 'Banda verde', color: '#3f8a55' },
  azul: { nombre: 'Banda azul', color: '#3e6fb3' },
  negra: { nombre: 'Banda negra', color: '#2b2b2e' },
};
export const conBanda = (def) => def?.material === 'Banda elástica';
// The band chosen for an exercise, or null: only for exercises with a band, and only a colour the app knows.
export const bandaDe = (def, clave) => (conBanda(def) && Object.hasOwn(BANDAS, clave || '') ? { clave, ...BANDAS[clave] } : null);

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

// Compressed when the browser can (d.), so the link and its QR stay short; plain JSON (j.) otherwise. Phones that
// cannot decompress (iOS before 16.4) read d. links with inflar.js.
export async function codificar(obj) {
  const json = new TextEncoder().encode(JSON.stringify(obj));
  if ('CompressionStream' in window) {
    try {
      const flujo = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return 'd.' + aBase64url(new Uint8Array(await new Response(flujo).arrayBuffer()));
    } catch {
      // A browser with CompressionStream but without deflate-raw (Chrome 80 to 102): plain JSON below.
    }
  }
  return 'j.' + aBase64url(json);
}

async function descomprimir(bytes) {
  if ('DecompressionStream' in window) {
    try {
      const flujo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(flujo).text();
    } catch {
      // Without deflate-raw: the decoder of our own below.
    }
  }
  const { inflar } = await import('./inflar.js');
  return new TextDecoder().decode(inflar(bytes));
}

export async function decodificar(codigo) {
  const [tipo, cuerpo] = [codigo.slice(0, 2), codigo.slice(2)];
  const bytes = deBase64url(cuerpo);
  if (tipo === 'd.') return JSON.parse(await descomprimir(bytes));
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

// Small persistent store; private windows or blocked storage must not break the app. Saving returns whether it
// worked: a full storage throws, and whoever said «Guardado» has to say otherwise.
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
      return true;
    } catch (err) {
      // Storage unavailable or full: the routine still works; the caller tells what was not kept, and a full one is
      // announced once for the whole page (app.js), whatever was being saved.
      if (err?.name === 'QuotaExceededError' || err?.code === 22) globalThis.dispatchEvent?.(new Event('jepyso-lleno'));
      return false;
    }
  },
};

export const SIN_SITIO = 'No se ha podido guardar: este aparato no tiene más sitio para Jepyso. Guarda una copia en un archivo (en Personas) y borra lo que ya no uses.';
