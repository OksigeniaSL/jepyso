// The 3D figure: one body, one clip per exercise, played at the tempo the professional set.
// The clip covers one repetition (rest, up, hold, down, rest) and comes with a sheet that says when each phase
// starts and ends inside the clip; the player stretches or shrinks each phase to the prescribed seconds.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { prepararMusculos } from './modelos/musculos.js';

const FASES = ['subir', 'mantener', 'bajar', 'reposo'];
const REPOSO_S = 1;

// Accepts the phase sheet either as {subir:[a,b], ...} or as a list of {fase|nombre, inicio, fin}.
function normalizarFases(ficha, duracionClip) {
  const f = ficha?.fases;
  const salida = {};
  if (Array.isArray(f)) {
    for (const p of f) salida[p.fase || p.nombre] = [p.inicio, p.fin];
  } else if (f) {
    Object.assign(salida, f);
  }
  if (!salida.subir) {
    // No sheet: split the clip in four equal parts so the player still works.
    const q = duracionClip / 4;
    FASES.forEach((n, i) => (salida[n] = [q * i, q * (i + 1)]));
  }
  for (const n of FASES) if (!salida[n]) salida[n] = [salida.bajar?.[1] ?? duracionClip, duracionClip];
  return salida;
}

export class Figura {
  constructor(contenedor, manifiesto, { calidad = 'alta' } = {}) {
    this.contenedor = contenedor;
    this.manifiesto = manifiesto;
    this.base = manifiesto._base || '';
    this.cargador = new GLTFLoader();
    this.cache = new Map();
    this.nodosAccesorios = new Map();
    this.intensidad = 0.7;
    this.oyentes = {};
    this.tempo = [2, 1, 2];
    this.reps = 0;
    this.repActual = 0;
    this.modo = 'demo';
    this.enMarcha = false;
    this.t = 0;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, calidad === 'baja' ? 1 : 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.shadowMap.enabled = calidad !== 'baja';
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    contenedor.appendChild(r.domElement);

    this.escena = new THREE.Scene();
    this.camara = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
    this.camara.position.set(2.2, 1.4, 3.2);

    const cielo = new THREE.HemisphereLight(0xffffff, 0xd9cfbf, 1.6);
    this.escena.add(cielo);
    const sol = new THREE.DirectionalLight(0xffffff, 2.2);
    sol.position.set(2.5, 5, 3);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    sol.shadow.camera.left = -2.5;
    sol.shadow.camera.right = 2.5;
    sol.shadow.camera.top = 2.5;
    sol.shadow.camera.bottom = -2.5;
    sol.shadow.radius = 6;
    sol.shadow.bias = -0.0005;
    this.escena.add(sol);
    const relleno = new THREE.DirectionalLight(0xffffff, 0.6);
    relleno.position.set(-3, 2, -2);
    this.escena.add(relleno);

    const suelo = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.ShadowMaterial({ opacity: 0.16 }));
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    this.escena.add(suelo);

    // Body and props live in one group: one mixer moves both, and the mirror is a negative X scale on it.
    this.grupo = new THREE.Group();
    this.escena.add(this.grupo);
    this.mixer = new THREE.AnimationMixer(this.grupo);

    this.controles = new OrbitControls(this.camara, r.domElement);
    this.controles.enableDamping = true;
    this.controles.enablePan = false;
    this.controles.minDistance = 1.2;
    this.controles.maxDistance = 7;
    this.controles.maxPolarAngle = Math.PI * 0.49;
    this.controles.addEventListener('start', () => {
      this.girado = true;
      this.emitir('girado');
    });
    this.cajas = new Map();

    this.reloj = new THREE.Clock();
    this.observador = new ResizeObserver(() => this.ajustar());
    this.observador.observe(contenedor);
    this.ajustar();
    r.setAnimationLoop(() => this.cuadro());
  }

  on(evento, fn) {
    (this.oyentes[evento] ||= []).push(fn);
    return this;
  }

  emitir(evento, ...args) {
    for (const fn of this.oyentes[evento] || []) fn(...args);
  }

  // The figure moves between boxes (the preview, a card, the player): the one it is in now is the one watched, so a
  // change of its size (the sheet of the player growing from the countdown to the series) redraws it at its shape
  // instead of stretching the last picture.
  mover(contenedor) {
    if (this.renderer.domElement.parentElement !== contenedor) contenedor.appendChild(this.renderer.domElement);
    this.contenedor = contenedor;
    this.observador.disconnect();
    this.observador.observe(contenedor);
    this.ajustar();
  }

  ajustar() {
    const { clientWidth: w, clientHeight: h } = this.contenedor;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
    if (this.accion && !this.girado) this.encuadrar(this.camaraFicha);
  }

  async gltf(ruta) {
    // A load that failed (no connection) is not kept: «Probar otra vez» must really try again.
    if (!this.cache.has(ruta)) {
      this.cache.set(ruta, this.cargador.loadAsync(this.base + ruta).catch((err) => {
        this.cache.delete(ruta);
        throw err;
      }));
    }
    return this.cache.get(ruta);
  }

  async ficha(ruta) {
    if (!ruta) return null;
    const clave = 'ficha:' + ruta;
    if (!this.cache.has(clave)) {
      this.cache.set(clave, fetch(this.base + ruta).then((r) => (r.ok ? r.json() : null)).catch(() => {
        this.cache.delete(clave);
        return null;
      }));
    }
    return this.cache.get(clave);
  }

  async cargarCuerpo() {
    if (this.cuerpo) return;
    const g = await this.gltf(this.manifiesto.cuerpo);
    this.cuerpo = g.scene;
    this.animacionesCuerpo = g.animations;
    this.cuerpo.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
    this.grupo.add(this.cuerpo);
    this.musculos = prepararMusculos(this.cuerpo);
  }

  // Switch to another body (each body has its own clips, measured on it).
  async cambiarCuerpo(manifiesto) {
    if (manifiesto === this.manifiesto) return;
    this.mixer.stopAllAction();
    if (this.cuerpo) this.grupo.remove(this.cuerpo);
    if (this.accesorios) this.grupo.remove(this.accesorios);
    this.cuerpo = this.accesorios = this.accion = null;
    this.manifiesto = manifiesto;
    this.mixer = new THREE.AnimationMixer(this.grupo);
  }

  // The band of the exercise in the colour the professional chose; without one, the colour of the clip. The props of a
  // clip are kept between exercises, so the colour is set every time.
  colorBanda(color) {
    this.accesorios?.traverse((o) => {
      if (!o.isMesh || o.material?.name !== 'prop_band') return;
      o.material.userData.original ??= o.material.color.clone();
      if (color) o.material.color.set(color);
      else o.material.color.copy(o.material.userData.original);
    });
  }

  // Shows one exercise. `opciones`: tempo [up, hold, down] in seconds, lado 'der' | 'izq'.
  // Returns false when a later call overtook this one (two exercises tapped in a row): what has to come from the network
  // comes first, and the scene changes in one go only for the latest call, so the clip and the props always match.
  async poner(id, { tempo, lado = 'der', banda = null } = {}) {
    const llamada = (this.llamada = (this.llamada || 0) + 1);
    await this.cargarCuerpo();
    const def = this.manifiesto.ejercicios[id];
    if (!def) throw new Error('Ejercicio sin modelo: ' + id);
    const g = def.glb ? await this.gltf(def.glb) : null;
    const ficha = (await this.ficha(def.ficha)) || def;
    if (llamada !== this.llamada) return false;
    this.id = id;

    if (this.accesorios) this.grupo.remove(this.accesorios);
    this.accesorios = null;
    this.mixer.stopAllAction();
    // The mixer keeps each track bound to the node it found by name the first time. Props of different exercises
    // share names (every band has «banda_mano», every hand weight «mancuerna_hueso»), so without this the new clip
    // would go on moving the props of the previous exercise, no longer in the scene, and leave its own still.
    this.mixer.uncacheRoot(this.grupo);

    let clip;
    if (g) {
      // Only the props node goes into the scene; the file's copy of the skeleton is there just for the tracks.
      if (!this.nodosAccesorios.has(def.glb)) this.nodosAccesorios.set(def.glb, g.scene.getObjectByName('accesorios') || g.scene);
      this.accesorios = this.nodosAccesorios.get(def.glb);
      this.accesorios.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      this.grupo.add(this.accesorios);
      this.colorBanda(banda);
      clip = g.animations[0];
    } else {
      clip = this.animacionesCuerpo.find((a) => a.name === def.clip) || this.animacionesCuerpo[0];
    }
    this.fases = normalizarFases(ficha, clip.duration);
    // Walking (Gaudí's «andar»): one clip is «pasos» steps on a running floor, with no rest between one and the next.
    this.pasos = Number.isInteger(ficha?.pasos) && ficha.pasos > 0 ? ficha.pasos : 0;
    this.reposo = this.pasos ? 0 : REPOSO_S;
    // The words of each phase as the exercise sheet writes them («Dobla las rodillas», «Sube despacio»): the player shows
    // these, so a squat never reads «Sube» while the figure goes down.
    this.textos = Object.fromEntries((Array.isArray(ficha?.fases) ? ficha.fases : []).filter((p) => p.texto).map((p) => [p.fase || p.nombre, p.texto]));
    this.accion = this.mixer.clipAction(clip);
    this.accion.play();
    this.accion.paused = true;
    if (tempo) this.tempo = tempo;
    this.camaraFicha = ficha.camara || def.camara;
    this.musculos?.iluminar({ ...(ficha.musculos || def.musculos || {}), lado: ficha.lado || def.lado || 'ambos' });
    this.grupo.scale.x = lado === 'izq' ? -1 : 1;
    this.girado = false;
    this.encuadrar(this.camaraFicha);
    this.t = 0;
    this.repActual = 0;
    this.posar(0);
  }

  // The other side is the mirror image; the camera follows so the view is the same.
  lado(l) {
    const espejo = l === 'izq' ? -1 : 1;
    const cambia = this.grupo.scale.x !== espejo;
    this.grupo.scale.x = espejo;
    if (cambia || !this.encuadrado) this.encuadrar(this.camaraFicha, espejo);
  }

  // Box of the body over its range of motion (start pose and top pose), measured on the posed mesh.
  cajaMovimiento() {
    const clave = `${this.manifiesto.cuerpo}:${this.id}:${this.grupo.scale.x}`;
    if (this.cajas.has(clave)) return this.cajas.get(clave);
    const caja = new THREE.Box3();
    const antes = this.accion.time;
    for (const t of [this.fases.subir[0], this.fases.mantener[0]]) {
      this.posar(t);
      this.grupo.updateMatrixWorld(true);
      caja.union(new THREE.Box3().setFromObject(this.cuerpo, true));
    }
    this.posar(antes);
    this.cajas.set(clave, caja);
    return caja;
  }

  // Keeps the sheet's viewing direction and moves the camera so the body fills the frame at any aspect ratio.
  encuadrar(cam, espejo = this.grupo.scale.x) {
    this.encuadrado = true;
    const pos = new THREE.Vector3(...(cam?.pos || [0.75, 0.35, 1]));
    const mira = new THREE.Vector3(...(cam?.mira || [0, 0, 0]));
    pos.x *= espejo;
    mira.x *= espejo;
    const dir = pos.clone().sub(mira).normalize();
    if (!this.accion || !this.cuerpo) {
      this.camara.position.copy(pos);
      this.controles.target.copy(mira);
      this.controles.update();
      return;
    }
    const caja = this.cajaMovimiento();
    const centro = caja.getCenter(new THREE.Vector3());
    const delante = dir.clone().negate();
    const derecha = new THREE.Vector3().crossVectors(delante, new THREE.Vector3(0, 1, 0)).normalize();
    const arriba = new THREE.Vector3().crossVectors(derecha, delante).normalize();
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2));
    const tanH = tanV * this.camara.aspect;
    let distancia = 0;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? caja.max.x : caja.min.x, i & 2 ? caja.max.y : caja.min.y, i & 4 ? caja.max.z : caja.min.z).sub(centro);
      const z = p.dot(delante);
      distancia = Math.max(distancia, Math.abs(p.dot(derecha)) / tanH - z, Math.abs(p.dot(arriba)) / tanV - z);
    }
    distancia *= 1.12;
    this.controles.target.copy(centro);
    this.camara.position.copy(centro).addScaledVector(dir, distancia);
    this.controles.maxDistance = distancia * 2.5;
    this.controles.minDistance = distancia * 0.4;
    this.controles.update();
  }

  // Seconds of one full repetition at the current tempo.
  ciclo() {
    const [s, m, b] = this.tempo;
    return s + m + b + (this.reposo ?? REPOSO_S);
  }

  // Real time inside one repetition -> phase name, seconds left in it and clip time.
  mapear(tc) {
    const dur = [...this.tempo, this.reposo ?? REPOSO_S];
    let acumulado = 0;
    for (let i = 0; i < 4; i++) {
      const d = dur[i];
      if (tc < acumulado + d || i === 3) {
        const nombre = FASES[i];
        const [a, b] = this.fases[nombre];
        const p = d > 0 ? Math.min(1, (tc - acumulado) / d) : 1;
        // The working muscles glow harder on the way up and while holding.
        const intensidad = { subir: 0.45 + 0.55 * p, mantener: 1, bajar: 1 - 0.5 * p, reposo: 0.5 - 0.05 * p }[nombre];
        return { fase: nombre, restante: Math.max(0, acumulado + d - tc), tiempoClip: a + (b - a) * p, intensidad };
      }
      acumulado += d;
    }
    return null;
  }

  posar(tiempoClip) {
    if (!this.accion) return;
    this.accion.time = tiempoClip;
    this.mixer.update(0);
  }

  // 'demo' loops forever (preview); 'serie' plays `reps` repetitions and stops. With porPasos, `reps` are steps of a
  // walking clip: it plays the cycles they need and counts each step (a set can end halfway through a cycle).
  // With porMinutos, `reps` are minutes: the clip loops and each minute counts as one.
  empezar({ modo = 'demo', reps = 0, porPasos = false, porMinutos = false } = {}) {
    this.modo = modo;
    this.reps = reps;
    this.porPasos = porPasos && this.pasos > 0;
    this.porMinutos = porMinutos;
    this.repActual = 0;
    this.t = 0;
    this.faseAnterior = null;
    this.enMarcha = true;
    this.reloj.getDelta();
  }

  pausar() {
    this.enMarcha = false;
  }

  seguir() {
    this.reloj.getDelta();
    this.enMarcha = true;
  }

  parar() {
    this.enMarcha = false;
    this.t = 0;
    this.posar(0);
    this.musculos?.fuerza(0.7);
  }

  cuadro() {
    // The figure keeps the professional's pace on a slow phone too (down to 4 frames a second); only a longer gap, such
    // as the page coming back from the background, is cut so it does not jump.
    const dt = Math.min(this.reloj.getDelta(), 0.25);
    if (this.enMarcha && this.accion) {
      this.t += dt;
      const c = this.ciclo();
      const rep = Math.floor(this.t / c);
      const hechas = this.porMinutos ? Math.floor(this.t / 60) : this.porPasos ? Math.floor((this.t / c) * this.pasos) : rep;
      if (this.modo === 'serie' && hechas >= this.reps) {
        this.enMarcha = false;
        this.posar(this.fases.reposo[1]);
        this.emitir('fase', null);
        this.emitir('fin');
      } else {
        if (hechas !== this.repActual) {
          this.repActual = hechas;
          this.emitir('repeticion', hechas);
        }
        const tc = this.t - rep * c;
        const m = this.mapear(tc);
        this.posar(m.tiempoClip);
        this.musculos?.fuerza(m.intensidad);
        if (m.fase !== this.faseAnterior) {
          this.faseAnterior = m.fase;
          this.emitir('cambio', m.fase);
        }
        this.emitir('fase', m.fase, m.restante, tc / c);
      }
    }
    this.controles.update();
    this.renderer.render(this.escena, this.camara);
    // Right after the picture, with the same pose: what is drawn over the figure (the builder's path) never trails it.
    this.emitir('dibujado');
  }

  destruir() {
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
