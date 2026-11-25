import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {
  FINISH_SHADER,
  POINT_FRAGMENT,
  POINT_VERTEX,
  clamp01,
  composerClearColor,
  easeOut,
  readPalette,
  srgbVector,
} from '@/components/three/shared';

/**
 * A case study's SYSTEM chapter as an exploded stack: each layer a floating
 * disc, a spine through their centres, packets travelling along it. The
 * layer list beside it stays the readable source; hovering either side
 * lights the same layer.
 */

export interface StackCallbacks {
  onReady: () => void;
  onActive: (index: number) => void;
}

export interface StackOptions {
  reducedMotion: boolean;
  layers: string[];
  labelLayer: HTMLElement;
}

export interface StackHandle {
  setActive: (index: number) => void;
  dispose: () => void;
}

const DISC_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying float vSide;
void main(){
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  // 1 on the rim, 0 on the faces.
  vSide = 1.0 - abs(normal.y);
  gl_Position = projectionMatrix * mv;
}
`;

const DISC_FRAGMENT = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uRim;
uniform vec3 uInk;
uniform float uDark;
uniform float uActive;
uniform float uFade;
varying vec3 vNormal;
varying vec3 vView;
varying float vSide;
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 L = normalize(vec3(-0.4, 0.9, 0.5));
  float diff = max(dot(N, L), 0.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.0);
  vec3 col = uBase * (0.62 + 0.38 * diff);
  col = mix(col, uInk, vSide * 0.18 * (1.0 - uDark));
  vec3 rim = uRim * (fres * 0.5 + vSide * 0.6) * (0.35 + 0.65 * uActive);
  col = mix(mix(col, uRim, clamp(fres * 0.4 * uActive, 0.0, 1.0)), col + rim, uDark);
  col = mix(col, col + uRim * 0.12, uActive * (1.0 - uDark));
  gl_FragColor = vec4(col, uFade);
}
`;

const GAP = 1.35;
const ENTRY_MS = 1400;

export function mountSystemStack(
  host: HTMLElement,
  callbacks: StackCallbacks,
  options: StackOptions,
): StackHandle {
  const motion = !options.reducedMotion;
  const count = options.layers.length;
  const compact = host.getBoundingClientRect().width < 640;
  const pixelRatio = () => Math.min(window.devicePixelRatio, compact ? 1.5 : 2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);

  let palette = readPalette();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const stack = new THREE.Group();
  scene.add(stack);

  const height = (count - 1) * GAP;
  const layerY = (i: number) => height / 2 - i * GAP;
  const radiusOf = (i: number) => 2.7 + Math.sin(i * 1.3) * 0.25 - i * 0.05;

  /* Discs ----------------------------------------------------------------- */
  const discs = options.layers.map((_, i) => {
    const radius = radiusOf(i);
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.14, 128, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uBase: { value: palette.coreBase.clone() },
        uRim: { value: palette.accent.clone() },
        uInk: { value: palette.ink.clone() },
        uDark: { value: palette.dark ? 1 : 0 },
        uActive: { value: 0 },
        uFade: { value: 1 },
      },
      vertexShader: DISC_VERTEX,
      fragmentShader: DISC_FRAGMENT,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = layerY(i);
    stack.add(mesh);

    // A hairline orbit just outside each disc.
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 129 }, (__, k) => {
          const a = (k / 128) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(a) * (radius + 0.35),
            0,
            Math.sin(a) * (radius + 0.35),
          );
        }),
      ),
      new THREE.LineBasicMaterial({
        color: palette.ink.clone(),
        transparent: true,
        opacity: 0.18,
      }),
    );
    ring.position.y = layerY(i);
    stack.add(ring);
    return { mesh, material, ring, radius, active: 0 };
  });

  /* Spine and packets ------------------------------------------------------- */
  const spineMaterial = new THREE.LineDashedMaterial({
    color: palette.ink.clone(),
    transparent: true,
    opacity: 0.4,
    dashSize: 0.12,
    gapSize: 0.1,
  });
  const spine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, height / 2 + 1.2, 0),
      new THREE.Vector3(0, -height / 2 - 1.2, 0),
    ]),
    spineMaterial,
  );
  spine.computeLineDistances();
  stack.add(spine);

  const packetCount = 7;
  const packetPositions = new Float32Array(packetCount * 3);
  const packetGeometry = new THREE.BufferGeometry();
  const packetAttribute = new THREE.BufferAttribute(packetPositions, 3);
  packetAttribute.setUsage(THREE.DynamicDrawUsage);
  packetGeometry.setAttribute('position', packetAttribute);
  packetGeometry.setAttribute(
    'aSize',
    new THREE.Float32BufferAttribute(new Array(packetCount).fill(18), 1),
  );
  packetGeometry.setAttribute(
    'aSeed',
    new THREE.Float32BufferAttribute(
      Array.from({ length: packetCount }, (_, i) => i / packetCount),
      1,
    ),
  );
  packetGeometry.setAttribute(
    'aDim',
    new THREE.Float32BufferAttribute(new Array(packetCount).fill(1), 1),
  );
  packetGeometry.setAttribute(
    'aLit',
    new THREE.Float32BufferAttribute(new Array(packetCount).fill(1), 1),
  );
  packetGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
  const packetMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: pixelRatio() },
      uTime: { value: 0 },
      uScale: { value: 14 },
      uInk: { value: palette.ink.clone() },
      uAccent: { value: palette.accent.clone() },
      uOpacity: { value: 1 },
      uRing: { value: 0 },
    },
    vertexShader: POINT_VERTEX,
    fragmentShader: POINT_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  stack.add(new THREE.Points(packetGeometry, packetMaterial));

  /* Post ------------------------------------------------------------------ */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // No bloom on in-page stages: its halo lifts the whole background and the
  // stage shows as a lighter box against the page (see the finish pass).
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH_SHADER);
  finish.uniforms.uEdge.value = 1;
  composer.addPass(finish);

  const applyPalette = () => {
    renderer.setClearColor(composerClearColor(palette.background), 1);
    discs.forEach(({ material, ring }) => {
      material.uniforms.uBase.value.copy(palette.coreBase);
      material.uniforms.uRim.value.copy(palette.accent);
      material.uniforms.uInk.value.copy(palette.ink);
      material.uniforms.uDark.value = palette.dark ? 1 : 0;
      (ring.material as THREE.LineBasicMaterial).color.copy(palette.ink);
    });
    spineMaterial.color.copy(palette.ink);
    packetMaterial.uniforms.uInk.value.copy(palette.ink);
    packetMaterial.uniforms.uAccent.value.copy(palette.accent);
    packetMaterial.blending = palette.dark
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    packetMaterial.needsUpdate = true;
    finish.uniforms.uGrain.value = palette.dark ? 0.05 : 0.03;
    srgbVector(palette.background, finish.uniforms.uBg.value as THREE.Vector3);
  };
  applyPalette();

  /* Labels ---------------------------------------------------------------- */
  const layer = options.labelLayer;
  layer.replaceChildren();
  const labels = options.layers.map((title, i) => {
    const el = document.createElement('span');
    el.className =
      'stack-label pointer-events-none absolute top-0 left-0 whitespace-nowrap';
    const index = document.createElement('span');
    index.className = 'type-meta mr-2 text-gray-500 dark:text-gray-400';
    index.textContent = `L${i + 1}`;
    const name = document.createElement('span');
    name.className =
      'text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100';
    name.textContent = title;
    el.append(index, name);
    layer.appendChild(el);
    return el;
  });

  /* State ----------------------------------------------------------------- */
  let active = -1;
  const setActive = (index: number) => {
    if (index === active) return;
    active = index;
    labels.forEach((el, i) => {
      el.dataset.state = i === active ? 'lit' : active >= 0 ? 'dim' : 'idle';
    });
    requestRender();
  };

  /* Layout + picking ------------------------------------------------------ */
  let width = 1;
  let viewHeight = 1;
  const projected = new THREE.Vector3();
  const toScreen = (p: THREE.Vector3, out: THREE.Vector3) => {
    out.copy(p);
    stack.localToWorld(out);
    out.project(camera);
    out.set(((out.x + 1) / 2) * width, ((1 - out.y) / 2) * viewHeight, out.z);
    return out;
  };

  const pick = (x: number, y: number) => {
    let best = -1;
    let bestDistance = Infinity;
    discs.forEach((disc, i) => {
      toScreen(new THREE.Vector3(0, layerY(i), 0), projected);
      const cx = projected.x;
      const cy = projected.y;
      toScreen(new THREE.Vector3(disc.radius, layerY(i), 0), projected);
      const rx = Math.abs(projected.x - cx) + 30;
      const ry = (GAP / 2) * (viewHeight / (height + 4));
      const dx = (x - cx) / rx;
      const dy = (y - cy) / Math.max(ry, 14);
      const d = dx * dx + dy * dy;
      if (d < 1 && d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    return best;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const rect = host.getBoundingClientRect();
    const next = pick(event.clientX - rect.left, event.clientY - rect.top);
    if (next !== active) {
      setActive(next);
      callbacks.onActive(next);
    }
  };
  const onPointerLeave = () => {
    setActive(-1);
    callbacks.onActive(-1);
  };
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);

  /* Loop ------------------------------------------------------------------ */
  let frame = 0;
  let started = 0;
  let entryStart = 0;
  let entryDone = !motion;
  let readyFired = false;
  let visible = true;
  const cameraTarget = new THREE.Vector3(0, 0, 0);
  const rightProbe = new THREE.Vector3();

  const tick = (now: number) => {
    frame = 0;
    if (!started) started = now;
    const time = motion ? (now - started) / 1000 : 0;

    if (!entryDone && !entryStart) {
      const rect = host.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) entryStart = now;
    }
    // Entry: the layers drift apart from a closed stack.
    const entry = entryDone
      ? 1
      : entryStart
        ? easeOut(clamp01((now - entryStart) / ENTRY_MS))
        : 0;
    if (entry >= 1) entryDone = true;

    const span = height + 6;
    camera.position.set(0, span * 0.42, span * 1.35);
    camera.lookAt(cameraTarget);
    stack.rotation.y = motion ? time * 0.12 : 0.4;

    discs.forEach((disc, i) => {
      const goal = i === active ? 1 : 0;
      disc.active += (goal - disc.active) * 0.12;
      disc.material.uniforms.uActive.value = disc.active;
      disc.material.uniforms.uFade.value =
        active >= 0 && i !== active ? 0.55 : 1;
      const y = layerY(i) * entry + (i === active ? 0.18 * disc.active : 0);
      disc.mesh.position.y = y;
      disc.ring.position.y = y;
      const ringMaterial = disc.ring.material as THREE.LineBasicMaterial;
      ringMaterial.color.copy(i === active ? palette.accent : palette.ink);
      ringMaterial.opacity = i === active ? 0.8 : 0.18;
    });

    // Packets ride the spine downward, layer to layer.
    for (let k = 0; k < packetCount; k += 1) {
      const t = (time * 0.18 + k / packetCount) % 1;
      const y = height / 2 + 1 - t * (height + 2);
      packetPositions.set([0, y * entry, 0], k * 3);
    }
    packetAttribute.needsUpdate = true;
    packetMaterial.uniforms.uTime.value = time;
    finish.uniforms.uTime.value = time;

    // Labels sit at each disc's screen-right edge.
    scene.updateMatrixWorld();
    rightProbe.set(1, 0, 0).applyQuaternion(camera.quaternion);
    const inverse = stack.quaternion.clone().invert();
    const localRight = rightProbe.clone().applyQuaternion(inverse);
    discs.forEach((disc, i) => {
      const p = new THREE.Vector3(0, disc.mesh.position.y, 0).addScaledVector(
        localRight,
        disc.radius + 0.5,
      );
      toScreen(p, projected);
      const el = labels[i];
      // Keep the name inside the stage; narrow columns pull it inward.
      const x = Math.min(projected.x + 6, width - el.offsetWidth - 4);
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(projected.y - 10)}px, 0)`;
      el.style.opacity = String(
        entry * (el.dataset.state === 'dim' ? 0.45 : 1),
      );
    });

    composer.render();
    if (!readyFired) {
      readyFired = true;
      callbacks.onReady();
    }
    if (motion || !entryDone) requestRender();
  };

  function requestRender() {
    if (frame || !visible || document.hidden) return;
    frame = requestAnimationFrame(tick);
  }

  const resize = () => {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    viewHeight = Math.max(1, rect.height);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, viewHeight, false);
    composer.setPixelRatio(pixelRatio());
    composer.setSize(width, viewHeight);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = width / viewHeight;
    // Leave room on the right for the layer names.
    camera.setViewOffset(width, viewHeight, width * 0.16, 0, width, viewHeight);
    camera.updateProjectionMatrix();
    requestRender();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
  });
  intersection.observe(host);
  const onVisibility = () => requestRender();
  document.addEventListener('visibilitychange', onVisibility);
  const themeObserver = new MutationObserver(() => {
    palette = readPalette();
    applyPalette();
    requestRender();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  resize();
  setActive(-1);
  requestRender();

  return {
    setActive,
    dispose: () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      layer.replaceChildren();
      discs.forEach(({ mesh, material, ring }) => {
        mesh.geometry.dispose();
        material.dispose();
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
      spine.geometry.dispose();
      spineMaterial.dispose();
      packetGeometry.dispose();
      packetMaterial.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
