// Lights muscle groups on the exercise mannequin (cuerpo.glb).
//
// Two ways, the same twenty groups (GRUPOS) and the same calls:
//  - with `texturas` (since 20 November 2026, the clothed bodies of ropa.py): five RGBA masks, four groups each
//    (musculos-0.png .. musculos-4.png, 512 px) and fibras.png (1024 px: fibres, belly and ink), on the body's UV map.
//    A working muscle is drawn as in an anatomy plate, over the clothes and never mixed into them (a soft terracotta
//    blot on graphite read as a stain: «el tarro de tomate»);
//  - without them, the old soft masks on the vertices (_MUSCULOS0.._MUSCULOS4).
// Left and right: with textures, from the rest position (sharp on the midline); without them, from the vertex
// attribute _LADO (1 left, 0 right, soft on the midline).
//
//   import { prepararMusculos } from './musculos.js';
//   const musculos = prepararMusculos(gltf.scene, { texturas: 'modelos/musculos/' });   // once, after loading the body
//   musculos.iluminar({ principales: ['gluteo_mayor'], secundarios: ['isquiotibiales'], lado: 'ambos' });
//   musculos.fuerza(0.3);     // 0..1: how hard it works now (the player breathes it: low at rest, full when holding)
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

// The texture files of a body, next to its cuerpo.glb (the app keeps them for offline use with the body).
export const TEXTURAS = ['musculos-0.png', 'musculos-1.png', 'musculos-2.png', 'musculos-3.png', 'musculos-4.png', 'fibras.png'];
export const carpetaTexturas = (cuerpo) => cuerpo.replace(/cuerpo\.glb$/, 'musculos/');

// Data textures: no colour space, glTF UVs (flipY false), linear with mipmaps, so the fibres fade into an even tint
// when the figure is small instead of shimmering.
function cargar(url) {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.NoColorSpace;
  t.flipY = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  return t;
}

export function prepararMusculos(cuerpo, {
  color = '#d9573b', velo = '#f6ebe4', secundario = 0.45, texturas = null,
} = {}) {
  const uniforms = {
    uPeso: { value: Array.from({ length: 5 }, () => new THREE.Vector4()) },
    uLado: { value: new THREE.Vector2(1, 1) },        // weight of the right side, of the left side
    uColor: { value: new THREE.Color(color) },
    uVelo: { value: new THREE.Color(velo) },
    uFuerza: { value: 0 },
  };
  if (texturas) {
    const base = texturas.endsWith('/') ? texturas : texturas + '/';
    uniforms.uMasc = { value: TEXTURAS.slice(0, 5).map((f) => cargar(base + f)) };
    uniforms.uFibras = { value: cargar(base + TEXTURAS[5]) };
  }
  cuerpo.traverse((o) => {
    if (!o.isSkinnedMesh || !o.geometry.attributes._lado) return;
    const m = o.material.clone();
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      if (texturas) {
        // The side comes from the rest position (x > 0 is the body's left), sharp on the midline: _LADO is soft
        // there over a whole triangle and let the outline of the unlit side show as a red line down the spine.
        // With both sides lit (the abdomen, the chest) it is 1 everywhere, so nothing is cut.
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>
            varying float vX; varying vec2 vUvMus;`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            vX = position.x; vUvMus = uv;`);
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>
            uniform sampler2D uMasc[5]; uniform sampler2D uFibras; uniform vec4 uPeso[5];
            uniform vec3 uColor; uniform vec3 uVelo; uniform float uFuerza; uniform vec2 uLado;
            varying float vX; varying vec2 vUvMus;
            float musculo() {
              // Only the masks with a lit group are read (most exercises light one or two of the five): the
              // branches depend on uniforms alone, so every pixel takes the same way and the mipmaps stay right.
              float s = 0.0;
              if (dot(uPeso[0], vec4(1.0)) > 0.0) s += dot(texture2D(uMasc[0], vUvMus), uPeso[0]);
              if (dot(uPeso[1], vec4(1.0)) > 0.0) s += dot(texture2D(uMasc[1], vUvMus), uPeso[1]);
              if (dot(uPeso[2], vec4(1.0)) > 0.0) s += dot(texture2D(uMasc[2], vUvMus), uPeso[2]);
              if (dot(uPeso[3], vec4(1.0)) > 0.0) s += dot(texture2D(uMasc[3], vUvMus), uPeso[3]);
              if (dot(uPeso[4], vec4(1.0)) > 0.0) s += dot(texture2D(uMasc[4], vUvMus), uPeso[4]);
              return clamp(s, 0.0, 1.0) * mix(uLado.x, uLado.y, smoothstep(-0.0015, 0.0015, vX));
            }`)
          // The muscle is drawn over the cloth or the skin as in an anatomy plate, never mixed into its colour (on
          // graphite, terracotta mixed in turned a muddy brown): terracotta in the belly, pale at the rim and over
          // the tendons, light striations along the fibres and an ink line round it and between its heads.
          // It breathes with the effort: at the player's resting level (about 0.45) only the outline, in
          // terracotta; as the effort grows the drawing fills in, and holding (1) shows it whole with a dark ink.
          // apagar() (0) turns it off. A thin fill is never used: that is what read as a stain.
          .replace('#include <color_fragment>', `#include <color_fragment>
            float mus = uFuerza > 0.0 ? musculo() : 0.0;
            float relleno = smoothstep(0.5, 1.0, uFuerza);
            float trazo = clamp(uFuerza * 1.8, 0.0, 1.0);
            vec3 fv = texture2D(uFibras, vUvMus).rgb;      // r: fibres; g: belly; b: ink
            vec3 m = mix(uVelo, uColor, smoothstep(0.0, 0.6, fv.g));
            m = mix(m, mix(uColor, uVelo, 0.55), fv.r * 0.5);
            diffuseColor.rgb = mix(diffuseColor.rgb, m, mus * relleno * 0.95);
            diffuseColor.rgb = mix(diffuseColor.rgb, mix(uColor, uColor * 0.45, relleno), mus * fv.b * trazo);`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
            totalEmissiveRadiance += uColor * mus * (0.08 * fv.g * relleno + 0.12 * fv.b * trazo * (1.0 - relleno));`);
      } else {
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
      }
    };
    m.customProgramCacheKey = () => (texturas ? 'musculos-textura' : 'musculos');
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
