// Lights muscle groups on the exercise mannequin (cuerpo.glb). The body carries five vertex attributes with four soft
// masks each (_MUSCULOS0.._MUSCULOS4, twenty groups, in the order of GRUPOS) and _LADO (1 left, 0 right, soft on the
// midline). Three.js names them _musculos0.._musculos4 and _lado.
//
//   import { prepararMusculos } from './musculos.js';
//   const musculos = prepararMusculos(gltf.scene);              // once, after loading the body
//   musculos.iluminar({ principales: ['gluteo_mayor'], secundarios: ['isquiotibiales'], lado: 'ambos' });
//   musculos.apagar();
//
// `lado` is the body's own side ('derecho', 'izquierdo' or 'ambos'), as the exercise sheet says. When the app mirrors
// the figure to do the other side, the lit muscles go with the arm that works: nothing else to change.
import * as THREE from 'three';

export const GRUPOS = [
  'gluteo_mayor', 'gluteo_medio', 'cuadriceps', 'isquiotibiales',
  'aductores', 'gemelos', 'tibial_anterior', 'recto_abdominal',
  'oblicuos', 'erectores', 'dorsal_ancho', 'trapecio',
  'pectoral', 'deltoides_anterior', 'deltoides_medio', 'deltoides_posterior',
  'manguito_posterior', 'biceps', 'triceps', 'antebrazo',
];

export function prepararMusculos(cuerpo, { color = '#d9573b', secundario = 0.45 } = {}) {
  const uniforms = {
    uPeso: { value: Array.from({ length: 5 }, () => new THREE.Vector4()) },
    uLado: { value: new THREE.Vector2(1, 1) },        // weight of the right side, of the left side
    uColor: { value: new THREE.Color(color) },
    uFuerza: { value: 0 },
  };
  cuerpo.traverse((o) => {
    if (!o.isSkinnedMesh || !o.geometry.attributes._musculos0) return;
    const m = o.material.clone();
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec4 _musculos0; attribute vec4 _musculos1; attribute vec4 _musculos2;
          attribute vec4 _musculos3; attribute vec4 _musculos4; attribute float _lado;
          uniform vec4 uPeso[5]; uniform vec2 uLado; varying float vMusculo;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vMusculo = (dot(_musculos0, uPeso[0]) + dot(_musculos1, uPeso[1]) + dot(_musculos2, uPeso[2])
                    + dot(_musculos3, uPeso[3]) + dot(_musculos4, uPeso[4])) * mix(uLado.x, uLado.y, _lado);`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform vec3 uColor; uniform float uFuerza; varying float vMusculo;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float encendido = clamp(vMusculo, 0.0, 1.0) * uFuerza;
          diffuseColor.rgb = mix(diffuseColor.rgb, uColor, encendido * 0.85);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += uColor * encendido * 0.18;`);
    };
    m.customProgramCacheKey = () => 'musculos';
    o.material = m;
  });

  function iluminar({ principales = [], secundarios = [], lado = 'ambos' } = {}) {
    const peso = new Array(20).fill(0);
    for (const g of secundarios) if (GRUPOS.includes(g)) peso[GRUPOS.indexOf(g)] = secundario;
    for (const g of principales) if (GRUPOS.includes(g)) peso[GRUPOS.indexOf(g)] = 1;
    uniforms.uPeso.value.forEach((v, i) => v.fromArray(peso, i * 4));
    uniforms.uLado.value.set(lado === 'izquierdo' ? 0 : 1, lado === 'derecho' ? 0 : 1);
    uniforms.uFuerza.value = 1;
  }

  return {
    iluminar,
    apagar: () => { uniforms.uFuerza.value = 0; },
    fuerza: (f) => { uniforms.uFuerza.value = f; },      // 0..1, for a gentle pulse while the muscle works
  };
}
