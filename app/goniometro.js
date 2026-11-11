// The goniometer of the builder, for the professional: the joint that moves most in the exercise (from its sheet, the
// angles at the start and at the top), its angle in degrees while the figure plays, on a protractor with the range it
// sweeps. Jepyso's exercises are written in degrees; this shows them.
const NS = 'http://www.w3.org/2000/svg';
const ZONAS = { cadera: 'Cadera', rodilla: 'Rodilla', hombro: 'Hombro', codo: 'Codo', tobillo: 'Tobillo', tronco: 'Tronco',
  cuello: 'Cuello', muneca: 'Muñeca' };
const PALABRAS = { flexion: 'flexión', extension: 'extensión', rotacion: 'rotación', abduccion: 'abducción', aduccion: 'aducción',
  inclinacion: 'inclinación' };
const REPOSO_S = 1;
const R = 64;

// «rodilla_derecha_flexion» → «Rodilla · flexión».
function articulacion(clave) {
  const p = clave.split('_');
  const conLado = p[1] === 'izquierda' || p[1] === 'derecha';
  const mov = p.slice(conLado ? 2 : 1).map((x) => PALABRAS[x] || x).join(' ');
  return `${ZONAS[p[0]] || p[0]} · ${mov}`;
}

const medidas = new Map();
// What the goniometer reads for the exercise on the figure: null when nothing turns more than three degrees.
export function medida(figura) {
  const clave = `${figura.manifiesto.cuerpo}:${figura.id}`;
  if (!medidas.has(clave)) {
    medidas.set(clave, (async () => {
      const def = figura.manifiesto.ejercicios[figura.id];
      const a = def && (await figura.ficha(def.ficha))?.angulos;
      if (!a?.partida || !a?.llegada) return null;
      let mejor = null;
      for (const [k, v0] of Object.entries(a.partida)) {
        const v1 = a.llegada[k] ?? v0;
        if (!mejor || Math.abs(v1 - v0) > mejor.d) mejor = { k, d: Math.abs(v1 - v0), a0: v0, a1: v1 };
      }
      if (!mejor || mejor.d < 3) return null;
      const lo = Math.floor((Math.min(mejor.a0, mejor.a1) - 10) / 10) * 10;
      const hi = Math.ceil((Math.max(mejor.a0, mejor.a1) + 10) / 10) * 10;
      return { ...mejor, id: figura.id, lo, hi, que: articulacion(mejor.k) };
    })());
  }
  return medidas.get(clave);
}

const phi = (m, v) => Math.PI * (1 - (v - m.lo) / (m.hi - m.lo));
const pt = (a, r) => [r * Math.cos(a), -r * Math.sin(a)];
const linea = (x1, y1, x2, y2, clase = '') => `<line${clase ? ` class="${clase}"` : ''} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;

export function dibujar(cont, m) {
  const paso = m.hi - m.lo > 120 ? 10 : 5;
  const largo = m.hi - m.lo > 120 ? 30 : 10;
  let escala = '';
  for (let v = m.lo; v <= m.hi + 0.01; v += paso) {
    const a = phi(m, v);
    const l = v % largo === 0;
    escala += linea(...pt(a, R), ...pt(a, R - (l ? 9 : 5)), l ? 'larga' : '');
    if (l) {
      const [x, y] = pt(a, R + 10);
      escala += `<text x="${x}" y="${y + 3}" text-anchor="middle">${v}°</text>`;
    }
  }
  const menor = Math.round(Math.min(m.a0, m.a1));
  const mayor = Math.round(Math.max(m.a0, m.a1));
  cont.innerHTML = `<svg viewBox="-80 -80 160 94" aria-hidden="true"><g class="gonio-escala">${escala}</g>
      <path class="gonio-arco" d="M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0"/><path class="gonio-barrido"/>
      <line class="gonio-fijo"/><line class="gonio-brazo"/><circle class="gonio-eje" r="4.5"/></svg>
    <div class="gonio-lectura"><span class="gonio-que">${m.que}</span><span class="gonio-grados num">${Math.round(m.a0)}°</span>
      <span class="gonio-rango num">de ${menor}° a ${mayor}°</span></div>`;
  cont.dataset.id = m.id;
  cont.hidden = false;
}

// The angle now: from the start to the top while it goes up, held, and back while it comes down, eased as the clip.
function angulo(figura, m, fase, restante) {
  const [s, mm, b] = figura.tempo;
  const dur = { subir: s, mantener: mm, bajar: b, reposo: REPOSO_S }[fase] || 1;
  const p = Math.min(1, Math.max(0, 1 - restante / dur));
  const f = { subir: p, mantener: 1, bajar: 1 - p, reposo: 0 }[fase] ?? 0;
  return m.a0 + (m.a1 - m.a0) * f * f * (3 - 2 * f);
}

export function actualizar(cont, figura, m, fase, restante) {
  const svg = cont?.querySelector('svg');
  if (!svg || cont.dataset.id !== m.id) return;
  const v = angulo(figura, m, fase, restante);
  const a = phi(m, v);
  const a0 = phi(m, m.a0);
  const [x, y] = pt(a, R - 2);
  const [x0, y0] = pt(a0, R - 2);
  const brazo = svg.querySelector('.gonio-brazo');
  brazo.setAttribute('x2', x); brazo.setAttribute('y2', y);
  const fijo = svg.querySelector('.gonio-fijo');
  fijo.setAttribute('x2', x0); fijo.setAttribute('y2', y0);
  svg.querySelector('.gonio-barrido').setAttribute('d', `M 0 0 L ${x0} ${y0} A ${R - 2} ${R - 2} 0 0 ${a < a0 ? 1 : 0} ${x} ${y} Z`);
  cont.querySelector('.gonio-grados').textContent = `${Math.round(v)}°`;
}
