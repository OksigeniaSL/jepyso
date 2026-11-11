// The path of the movement over the builder's figure, for the professional: the joints as graphite points joined by
// hairlines, and the joint that travels most leaving its path of the last two seconds, with its name. Worked out from
// the figure's own skeleton and drawn right after each picture, with the same pose (a frame late, the points would
// trail the body). An SVG over the canvas: its colours are the page's, in light and dark.
import * as THREE from 'three';

const NS = 'http://www.w3.org/2000/svg';
const JUNTAS = ['head', 'neck_01', 'spine_03', 'pelvis', 'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'hand_l',
  'hand_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r'];
const HUESOS = [['head', 'neck_01'], ['neck_01', 'spine_03'], ['spine_03', 'pelvis'], ['spine_03', 'upperarm_l'],
  ['spine_03', 'upperarm_r'], ['upperarm_l', 'lowerarm_l'], ['upperarm_r', 'lowerarm_r'], ['lowerarm_l', 'hand_l'],
  ['lowerarm_r', 'hand_r'], ['pelvis', 'thigh_l'], ['pelvis', 'thigh_r'], ['thigh_l', 'calf_l'], ['thigh_r', 'calf_r'],
  ['calf_l', 'foot_l'], ['calf_r', 'foot_r']];
const NOMBRE = { head: 'Cabeza', neck_01: 'Cuello', spine_03: 'Tórax', pelvis: 'Pelvis', upperarm_l: 'Hombro izq.',
  upperarm_r: 'Hombro der.', lowerarm_l: 'Codo izq.', lowerarm_r: 'Codo der.', hand_l: 'Mano izq.', hand_r: 'Mano der.',
  thigh_l: 'Cadera izq.', thigh_r: 'Cadera der.', calf_l: 'Rodilla izq.', calf_r: 'Rodilla der.', foot_l: 'Tobillo izq.',
  foot_r: 'Tobillo der.' };
// The points around each joint of the sheets: the path shown is that of the one that travels most (the hip when
// getting up from the chair, the ankle when the heel slides), on the side that works.
const CERCA = { cadera: ['pelvis', 'thigh', 'calf'], rodilla: ['thigh', 'calf', 'foot'], tobillo: ['calf', 'foot'],
  hombro: ['upperarm', 'lowerarm', 'hand'], codo: ['lowerarm', 'hand'], muneca: ['hand'], tronco: ['head', 'neck_01', 'pelvis'],
  cuello: ['head', 'neck_01'] };
function candidatas(clave) {
  if (!clave) return JUNTAS.filter((n) => n !== 'spine_03' && n !== 'neck_01');
  const [zona, lado] = clave.split('_');
  const s = lado === 'izquierda' ? ['_l'] : lado === 'derecha' ? ['_r'] : ['_l', '_r'];
  const nombres = (CERCA[zona] || []).flatMap((n) => (JUNTAS.includes(n) ? [n] : s.map((x) => n + x)));
  return nombres.length ? nombres : JUNTAS;
}
// Two seconds at sixty pictures a second, drawn as twelve pieces that fade towards the oldest.
const LARGO = 120;
const TROZOS = 12;

const v = new THREE.Vector3();
const estado = { cuerpo: null, huesos: {}, sitio: '', historia: new Map() };

function capa(contenedor) {
  let s = contenedor.querySelector(':scope > svg.recorrido');
  if (s) return s;
  s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'recorrido');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<g class="recorrido-huesos">${HUESOS.map(() => '<line/>').join('')}</g>
    <g class="recorrido-estela">${Array.from({ length: TROZOS }, () => '<polyline/>').join('')}</g>
    <g class="recorrido-puntos">${JUNTAS.map(() => '<circle r="2.6"/>').join('')}</g>
    <circle class="recorrido-vivo" r="5"/><text class="recorrido-nombre"></text>`;
  contenedor.append(s);
  return s;
}

// `clave`: the joint of the sheet that changes most (the goniometer's, «rodilla_derecha_flexion»), or none.
export function pintarRecorrido(figura, clave = null) {
  const lienzo = figura.renderer.domElement;
  const contenedor = lienzo.parentElement;
  if (!figura.cuerpo || !figura.id || !contenedor) return;
  if (estado.cuerpo !== figura.cuerpo) {
    estado.huesos = {};
    figura.cuerpo.traverse((o) => { if (o.isBone && JUNTAS.includes(o.name)) estado.huesos[o.name] = o; });
    estado.cuerpo = figura.cuerpo;
  }
  const w = lienzo.clientWidth;
  const h = lienzo.clientHeight;
  if (!w || !h) return;
  // A new exercise, a turned figure or another box: the old path means nothing there.
  const sitio = `${figura.id}|${figura.grupo.scale.x}|${contenedor.className}|${w}x${h}`;
  if (estado.sitio !== sitio) { estado.historia.clear(); estado.sitio = sitio; }
  const s = capa(contenedor);
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  figura.cuerpo.updateMatrixWorld(true);
  const p = {};
  for (const n of JUNTAS) {
    const b = estado.huesos[n];
    if (!b) continue;
    b.getWorldPosition(v).project(figura.camara);
    p[n] = [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
    const hist = estado.historia.get(n) || [];
    hist.push(p[n]);
    if (hist.length > LARGO) hist.shift();
    estado.historia.set(n, hist);
  }
  // Of the points around the joint that works, the one that travels most in the last two seconds.
  const posibles = candidatas(clave);
  let mejor = null;
  let recorrido = 0;
  for (const [n, hist] of estado.historia) {
    if (!posibles.includes(n)) continue;
    let d = 0;
    for (let i = 1; i < hist.length; i++) d += Math.hypot(hist[i][0] - hist[i - 1][0], hist[i][1] - hist[i - 1][1]);
    if (d > recorrido) { recorrido = d; mejor = n; }
  }
  const vivo = recorrido > 12 ? mejor : null;
  s.querySelectorAll('.recorrido-huesos line').forEach((l, i) => {
    const [a, b] = HUESOS[i];
    if (!p[a] || !p[b]) return;
    l.setAttribute('x1', p[a][0]); l.setAttribute('y1', p[a][1]); l.setAttribute('x2', p[b][0]); l.setAttribute('y2', p[b][1]);
  });
  s.querySelectorAll('.recorrido-puntos circle').forEach((c, i) => {
    const q = p[JUNTAS[i]];
    if (q) { c.setAttribute('cx', q[0]); c.setAttribute('cy', q[1]); }
  });
  const trozos = s.querySelectorAll('.recorrido-estela polyline');
  const hist = vivo ? estado.historia.get(vivo) : [];
  const paso = Math.max(1, Math.ceil(hist.length / TROZOS));
  trozos.forEach((t, i) => {
    const tramo = hist.slice(i * paso, (i + 1) * paso + 1);
    t.setAttribute('points', tramo.length > 1 ? tramo.map((q) => q.join(',')).join(' ') : '');
    t.style.opacity = String(((i + 1) / TROZOS) * 0.9);
  });
  const anillo = s.querySelector('.recorrido-vivo');
  const nombre = s.querySelector('.recorrido-nombre');
  anillo.style.display = nombre.style.display = vivo ? '' : 'none';
  if (vivo) {
    anillo.setAttribute('cx', p[vivo][0]); anillo.setAttribute('cy', p[vivo][1]);
    // The name on the side with room, never out of the box.
    const derecha = p[vivo][0] < w - 110;
    nombre.setAttribute('x', p[vivo][0] + (derecha ? 10 : -10));
    nombre.setAttribute('y', p[vivo][1] - 9);
    nombre.setAttribute('text-anchor', derecha ? 'start' : 'end');
    nombre.textContent = NOMBRE[vivo] || vivo;
  }
}
