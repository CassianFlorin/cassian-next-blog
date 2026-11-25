import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {
  CORE_FRAGMENT,
  CORE_VERTEX,
  DUST_FRAGMENT,
  DUST_VERTEX,
  FINISH_SHADER,
  POINT_FRAGMENT,
  POINT_VERTEX,
  clamp01,
  composerClearColor,
  isTextTarget,
  mulberry32,
  readPalette,
  srgbVector,
} from '@/components/three/shared';
import { ringPoint, type AboutSceneData, type Vec3 } from '@/lib/aboutScene';

/**
 * The About observatory. One scene, five viewpoints (stations), each answering
 * one question about the person: what is all this (overview), what do I care
 * about (focus), where do I come from (roots), what have I built (work), how
 * did it accumulate (time). The page's reading position picks the station;
 * the visitor can also pick one or turn the view by hand.
 */

export interface AboutCallbacks {
  onReady: () => void;
  onOpen: (href: string) => void;
}

export interface AboutOptions {
  reducedMotion: boolean;
  labelLayer: HTMLElement;
  localize: (href: string) => string;
  station: number;
}

export interface AboutHandle {
  setStation: (index: number) => void;
  dispose: () => void;
}

interface Station {
  camera: Vec3;
  target: Vec3;
  /** 0 = stars by topic (rings), 1 = stars by time (spiral). */
  lens: number;
  rings: number;
  ringLabels: number;
  roots: number;
  projects: number;
  projectLabels: number;
  years: number;
}

export const ABOUT_STATIONS: Station[] = [
  // Overview: the whole system, nothing labelled but the directions.
  {
    camera: [0, 6, 23],
    target: [0, 0.4, 0],
    lens: 0,
    rings: 1,
    ringLabels: 0.8,
    roots: 0.35,
    projects: 1,
    projectLabels: 0,
    years: 0,
  },
  // Focus: from above, the four rings read as four directions.
  {
    camera: [0, 20, 8],
    target: [0, 0, 0],
    lens: 0,
    rings: 1,
    ringLabels: 1,
    roots: 0.15,
    projects: 0.6,
    projectLabels: 0,
    years: 0,
  },
  // Roots: low, looking at the ring under the core.
  {
    camera: [0, -1.4, 11.5],
    target: [0, -2.4, 0],
    lens: 0,
    rings: 0.35,
    ringLabels: 0,
    roots: 1,
    projects: 0.3,
    projectLabels: 0,
    years: 0,
  },
  // Work: projects lit and named.
  {
    camera: [10, 5, 14],
    target: [0, 0, 0],
    lens: 0,
    rings: 0.7,
    ringLabels: 0,
    roots: 0.2,
    projects: 1,
    projectLabels: 1,
    years: 0,
  },
  // Time: the same stars re-laid as a rising spiral.
  {
    camera: [18, 3, 15],
    target: [0, 0.6, 0],
    lens: 1,
    rings: 0.1,
    ringLabels: 0,
    roots: 0.1,
    projects: 0.25,
    projectLabels: 0,
    years: 1,
  },
];

const FLY_MS = 1500;
const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function mountAbout(
  host: HTMLElement,
  data: AboutSceneData,
  callbacks: AboutCallbacks,
  options: AboutOptions,
): AboutHandle {
  const motion = !options.reducedMotion;
  const compact = host.getBoundingClientRect().width < 640;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
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
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  const world = new THREE.Group();
  scene.add(world);

  /* Cores: me, and the projects ------------------------------------------- */
  const coreGeometry = new THREE.IcosahedronGeometry(1, compact ? 24 : 40);
  const makeCore = (position: Vec3, size: number, seed: number) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uBase: { value: palette.coreBase.clone() },
        uRim: { value: palette.accent.clone() },
        uInk: { value: palette.ink.clone() },
        uDark: { value: palette.dark ? 1 : 0 },
      },
      vertexShader: CORE_VERTEX,
      fragmentShader: CORE_FRAGMENT,
    });
    const mesh = new THREE.Mesh(coreGeometry, material);
    mesh.position.copy(v3(position));
    mesh.scale.setScalar(size);
    mesh.rotation.set(seed, seed * 1.7, 0);
    world.add(mesh);
    return { mesh, material, seed, size };
  };
  const self = makeCore([0, 0, 0], 1.55, 0.2);
  const projectCores = data.projects.map((project, i) =>
    makeCore(project.position, 0.42, i * 1.3 + 0.7),
  );
  const cores = [self, ...projectCores];

  /* Lines: direction rings, roots ring, root stem, time spiral ----------- */
  const lineMaterial = (opacity: number) =>
    new THREE.LineBasicMaterial({
      color: palette.ink.clone(),
      transparent: true,
      opacity,
      depthWrite: false,
    });
  const circle = (radius: number, tilt: [number, number], y = 0) =>
    Array.from({ length: 161 }, (_, k) => {
      const p = ringPoint(radius, (k / 160) * Math.PI * 2, tilt);
      return new THREE.Vector3(p[0], p[1] + y, p[2]);
    });

  const ringMaterial = lineMaterial(0.28);
  const ringLines = data.rings.map((ring) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(circle(ring.radius, ring.tilt)),
      ringMaterial,
    );
    world.add(line);
    return line;
  });

  const rootMaterial = lineMaterial(0.4);
  const rootRing = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(circle(3, [0, 0], -3.6)),
    rootMaterial,
  );
  const rootStem = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.6, 0),
      new THREE.Vector3(0, -3.6, 0),
      ...data.roots.flatMap((root) => [
        new THREE.Vector3(0, -3.6, 0),
        v3(root.position),
      ]),
    ]),
    rootMaterial,
  );
  world.add(rootRing, rootStem);

  const spiralMaterial = lineMaterial(0);
  const spiralPoints = Array.from({ length: 241 }, (_, k) => {
    const t = k / 240;
    const angle = t * Math.PI * 2 * 2.2;
    return new THREE.Vector3(
      Math.cos(angle) * 8.6,
      -3.4 + t * 8,
      Math.sin(angle) * 8.6,
    );
  });
  const spiral = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(spiralPoints),
    spiralMaterial,
  );
  world.add(spiral);

  /* Stars: the writing, morphing between topic and time ------------------- */
  const starPositions = new Float32Array(data.posts.length * 3);
  const starGeometry = new THREE.BufferGeometry();
  const starAttribute = new THREE.BufferAttribute(starPositions, 3);
  starAttribute.setUsage(THREE.DynamicDrawUsage);
  starGeometry.setAttribute('position', starAttribute);
  starGeometry.setAttribute(
    'aSize',
    new THREE.Float32BufferAttribute(
      data.posts.map(() => 24),
      1,
    ),
  );
  starGeometry.setAttribute(
    'aSeed',
    new THREE.Float32BufferAttribute(
      data.posts.map((_, i) => (i * 0.618) % 1),
      1,
    ),
  );
  const starDim = new Float32Array(data.posts.length).fill(0.9);
  const starLit = new Float32Array(data.posts.length).fill(0);
  const dimAttribute = new THREE.BufferAttribute(starDim, 1);
  const litAttribute = new THREE.BufferAttribute(starLit, 1);
  dimAttribute.setUsage(THREE.DynamicDrawUsage);
  litAttribute.setUsage(THREE.DynamicDrawUsage);
  starGeometry.setAttribute('aDim', dimAttribute);
  starGeometry.setAttribute('aLit', litAttribute);
  starGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: pixelRatio() },
      uTime: { value: 0 },
      uScale: { value: 22 },
      uInk: { value: palette.ink.clone() },
      uAccent: { value: palette.accent.clone() },
      uOpacity: { value: 1 },
      uRing: { value: 1 },
    },
    vertexShader: POINT_VERTEX,
    fragmentShader: POINT_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  world.add(new THREE.Points(starGeometry, starMaterial));

  /* Ambient dust ---------------------------------------------------------- */
  const random = mulberry32(1188);
  const dustCount = compact ? 1600 : 3200;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  const dustSize = new Float32Array(dustCount);
  const dustTone = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i += 1) {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const r = 14 + Math.pow(random(), 0.6) * 34;
    const s = Math.sqrt(1 - u * u);
    dustPositions.set(
      [Math.cos(theta) * s * r, u * r * 0.6, Math.sin(theta) * s * r],
      i * 3,
    );
    dustSeed[i] = random();
    dustSize[i] = 0.5 + Math.pow(random(), 5) * 2;
    dustTone[i] = random() < 0.1 ? 1 : 0;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(dustPositions, 3),
  );
  dustGeometry.setAttribute(
    'aStart',
    new THREE.BufferAttribute(dustPositions, 3),
  );
  dustGeometry.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
  dustGeometry.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
  dustGeometry.setAttribute('aTone', new THREE.BufferAttribute(dustTone, 1));
  const dustUniforms = {
    uTime: { value: 0 },
    uEntry: { value: 1 },
    uPixelRatio: { value: pixelRatio() },
    uMouse: { value: new THREE.Vector3(999, 999, 999) },
    uMouseStrength: { value: 0 },
    uSizeScale: { value: 1 },
    uInk: { value: palette.ink.clone() },
    uAccent: { value: palette.accent.clone() },
    uOpacity: { value: 0.6 },
  };
  const dustMaterial = new THREE.ShaderMaterial({
    uniforms: dustUniforms,
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  world.add(new THREE.Points(dustGeometry, dustMaterial));

  /* Post ------------------------------------------------------------------ */
  // No bloom: this is an in-page stage (see components/three/shared.ts).
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH_SHADER);
  finish.uniforms.uEdge.value = 1;
  composer.addPass(finish);

  const lineMaterials = [ringMaterial, rootMaterial, spiralMaterial];
  const applyPalette = () => {
    renderer.setClearColor(composerClearColor(palette.background), 1);
    cores.forEach(({ material }) => {
      material.uniforms.uBase.value.copy(palette.coreBase);
      material.uniforms.uRim.value.copy(palette.accent);
      material.uniforms.uInk.value.copy(palette.ink);
      material.uniforms.uDark.value = palette.dark ? 1 : 0;
    });
    const blending = palette.dark
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    [starMaterial, dustMaterial].forEach((material) => {
      material.uniforms.uInk.value.copy(palette.ink);
      material.uniforms.uAccent.value.copy(palette.accent);
      material.blending = blending;
      material.needsUpdate = true;
    });
    lineMaterials.forEach((material) => material.color.copy(palette.ink));
    dustUniforms.uOpacity.value = palette.dark ? 0.55 : 0.7;
    dustUniforms.uSizeScale.value = palette.dark ? 1 : 1.3;
    finish.uniforms.uGrain.value = palette.dark ? 0.05 : 0.03;
    srgbVector(palette.background, finish.uniforms.uBg.value as THREE.Vector3);
  };
  applyPalette();

  /* Labels ---------------------------------------------------------------- */
  const layer = options.labelLayer;
  layer.replaceChildren();
  const span = (className: string, text: string) => {
    const el = document.createElement('span');
    el.className = `about-label pointer-events-none absolute top-0 left-0 whitespace-nowrap ${className}`;
    el.textContent = text;
    layer.appendChild(el);
    return el;
  };
  const link = (className: string) => {
    const el = document.createElement('a');
    el.className = `about-label pointer-events-auto absolute top-0 left-0 ${className}`;
    el.addEventListener('click', (event) => {
      const href = el.dataset.href;
      if (!href || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      callbacks.onOpen(href);
    });
    layer.appendChild(el);
    return el;
  };

  const ringLabels = data.rings.map((ring) =>
    span(
      'type-meta text-gray-700 dark:text-gray-300',
      `${ring.label} · ${String(ring.count).padStart(2, '0')}`,
    ),
  );
  const rootLabels = data.roots.map((root) =>
    span('type-meta text-gray-800 dark:text-gray-200', root.label),
  );
  const yearLabels = data.years.map((year) =>
    span('type-meta text-primary-700 dark:text-primary-400', year.label),
  );
  const projectLabels = data.projects.map((project) => {
    const el = link(
      'whitespace-nowrap text-sm font-semibold tracking-tight text-gray-950 dark:text-gray-50',
    );
    el.dataset.href = project.href;
    el.href = options.localize(project.href);
    el.textContent = project.title;
    return el;
  });
  const hoverLabel = link('about-label--post max-w-56');
  hoverLabel.style.opacity = '0';

  /* Stations + camera ----------------------------------------------------- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.5;
  controls.autoRotate = motion;
  controls.autoRotateSpeed = 0.3;
  if (coarse) {
    controls.enabled = false;
    renderer.domElement.style.touchAction = 'pan-y';
  }
  controls.addEventListener('change', () => requestRender());

  const current = { ...ABOUT_STATIONS[0] };
  let station = Math.max(
    0,
    Math.min(ABOUT_STATIONS.length - 1, options.station),
  );
  const flight = {
    start: 0,
    active: false,
    fromCamera: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    from: { ...ABOUT_STATIONS[0] },
  };
  /** Narrow, tall stages see less sideways: back off to keep rings whole. */
  let fit = 1;
  const stationCamera = (s: Station) =>
    v3(s.camera).sub(v3(s.target)).multiplyScalar(fit).add(v3(s.target));

  const setStation = (index: number) => {
    const next = Math.max(0, Math.min(ABOUT_STATIONS.length - 1, index));
    if (next === station && flight.active) return;
    station = next;
    flight.fromCamera.copy(camera.position);
    flight.fromTarget.copy(controls.target);
    flight.from = { ...current };
    flight.start = performance.now();
    flight.active = true;
    if (!motion) {
      Object.assign(current, ABOUT_STATIONS[station]);
      camera.position.copy(stationCamera(current));
      controls.target.copy(v3(current.target));
      flight.active = false;
    }
    requestRender();
  };

  // Arrive from further out along the first station's line of sight.
  Object.assign(current, ABOUT_STATIONS[station]);
  controls.target.copy(v3(current.target));
  camera.position
    .copy(stationCamera(current))
    .sub(controls.target)
    .multiplyScalar(motion ? 2.2 : 1)
    .add(controls.target);
  let entryPending = motion;

  /* Picking --------------------------------------------------------------- */
  let width = 1;
  let height = 1;
  const projected = new THREE.Vector3();
  const toScreen = (p: THREE.Vector3 | Vec3, out: THREE.Vector3) => {
    if (Array.isArray(p)) out.set(p[0], p[1], p[2]);
    else out.copy(p);
    world.localToWorld(out);
    out.project(camera);
    out.set(((out.x + 1) / 2) * width, ((1 - out.y) / 2) * height, out.z);
    return out;
  };
  const starAt = (i: number, out: THREE.Vector3) =>
    out.fromArray(starPositions, i * 3);

  type Hit = { kind: 'post' | 'project'; index: number } | null;
  let hovered: Hit = null;
  const scratch = new THREE.Vector3();
  const pick = (x: number, y: number): Hit => {
    const found: { hit: Hit; distance: number } = { hit: null, distance: 18 };
    data.posts.forEach((_, i) => {
      toScreen(starAt(i, scratch), projected);
      if (projected.z > 1) return;
      const d = Math.hypot(projected.x - x, projected.y - y);
      if (d < found.distance) {
        found.distance = d;
        found.hit = { kind: 'post', index: i };
      }
    });
    data.projects.forEach((project, i) => {
      toScreen(project.position, projected);
      if (projected.z > 1) return;
      const d = Math.hypot(projected.x - x, projected.y - y);
      if (d < Math.max(found.distance, 22)) {
        found.distance = d;
        found.hit = { kind: 'project', index: i };
      }
    });
    return found.hit;
  };
  const hrefOf = (hit: NonNullable<Hit>) =>
    hit.kind === 'post'
      ? data.posts[hit.index].href
      : data.projects[hit.index].href;

  const setHovered = (hit: Hit) => {
    const same = hit?.kind === hovered?.kind && hit?.index === hovered?.index;
    if (same) return;
    hovered = hit;
    renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    if (hit?.kind === 'post') {
      const post = data.posts[hit.index];
      hoverLabel.replaceChildren();
      const date = document.createElement('span');
      date.className = 'type-meta block text-primary-700 dark:text-primary-400';
      date.textContent = post.date.replaceAll('-', '.');
      const title = document.createElement('span');
      title.className =
        'type-editorial block text-base leading-snug text-gray-900 dark:text-gray-100';
      title.textContent = post.title;
      hoverLabel.append(date, title);
      hoverLabel.dataset.href = post.href;
      hoverLabel.href = options.localize(post.href);
    }
    requestRender();
  };

  const local = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  let down: { x: number; y: number } | null = null;
  const onPointerDown = (event: PointerEvent) => {
    down = local(event);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.buttons) return;
    if (isTextTarget(event.target, event.clientX, event.clientY)) return;
    const { x, y } = local(event);
    setHovered(pick(x, y));
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = down;
    down = null;
    if (!start) return;
    const { x, y } = local(event);
    if (Math.hypot(x - start.x, y - start.y) > 6) return;
    const hit = pick(x, y);
    if (hit) callbacks.onOpen(hrefOf(hit));
  };
  const onPointerLeave = () => setHovered(null);
  const canvas = renderer.domElement;
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);

  /* Loop ------------------------------------------------------------------ */
  let frame = 0;
  let started = 0;
  let readyFired = false;
  let visible = true;
  const topic = new THREE.Vector3();
  const time = new THREE.Vector3();

  type Box = { x: number; y: number; w: number; h: number };
  let taken: Box[] = [];
  const place = (
    el: HTMLElement,
    p: THREE.Vector3 | Vec3,
    dx: number,
    dy: number,
    opacity: number,
  ) => {
    toScreen(p, projected);
    if (projected.z > 1 || opacity < 0.02) {
      el.style.visibility = 'hidden';
      return;
    }
    el.style.visibility = 'visible';
    // Keep names inside the stage, and step down past names already placed.
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const x = Math.max(4, Math.min(projected.x + dx, width - w - 4));
    let y = projected.y + dy;
    for (let tries = 0; tries < 4; tries += 1) {
      const clash = taken.find(
        (b) => x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y,
      );
      if (!clash) break;
      y = clash.y + clash.h + 2;
    }
    if (opacity > 0.3) taken.push({ x, y, w, h });
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    el.style.opacity = String(opacity);
  };

  const tick = (now: number) => {
    frame = 0;
    if (!started) started = now;
    const seconds = motion ? (now - started) / 1000 : 0;

    if (entryPending) {
      const rect = host.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        entryPending = false;
        setStation(station);
      }
    }

    // Fly between stations; values blend with the same easing as the camera.
    if (flight.active) {
      const t = easeInOut(clamp01((now - flight.start) / FLY_MS));
      const goal = ABOUT_STATIONS[station];
      (Object.keys(current) as Array<keyof Station>).forEach((key) => {
        const a = flight.from[key];
        const b = goal[key];
        if (Array.isArray(a) && Array.isArray(b)) return;
        (current[key] as number) =
          (a as number) + ((b as number) - (a as number)) * t;
      });
      camera.position.lerpVectors(flight.fromCamera, stationCamera(goal), t);
      controls.target.lerpVectors(flight.fromTarget, v3(goal.target), t);
      if (t >= 1) flight.active = false;
    }
    controls.update();

    // Stars: topic ⇄ time.
    data.posts.forEach((post, i) => {
      topic.set(...post.topicPosition);
      time.set(...post.timePosition);
      // Stagger the morph a little by date so the spiral visibly winds up.
      const stagger = clamp01(
        current.lens * 1.4 - (i / data.posts.length) * 0.4,
      );
      scratch.lerpVectors(topic, time, stagger);
      starPositions.set([scratch.x, scratch.y, scratch.z], i * 3);
      const lit = hovered?.kind === 'post' && hovered.index === i;
      starLit[i] += ((lit ? 1 : 0) - starLit[i]) * 0.15;
      starDim[i] = 0.9;
    });
    starAttribute.needsUpdate = true;
    litAttribute.needsUpdate = true;
    dimAttribute.needsUpdate = true;

    ringMaterial.opacity = 0.28 * current.rings;
    rootMaterial.opacity = 0.45 * current.roots;
    spiralMaterial.opacity = 0.3 * current.lens;

    cores.forEach(({ mesh, material, seed }, i) => {
      const isProject = i > 0;
      const projectHovered =
        isProject && hovered?.kind === 'project' && hovered.index === i - 1;
      const goal = isProject
        ? projectHovered
          ? 1
          : current.projectLabels * 0.5
        : 0.25;
      const energy = material.uniforms.uEnergy;
      energy.value += (goal - energy.value) * 0.08;
      material.uniforms.uTime.value = seconds + seed * 3;
      if (isProject)
        mesh.scale.setScalar(0.42 * (0.4 + 0.6 * current.projects));
      if (motion) mesh.rotation.y += 0.002;
    });

    // Labels, by station.
    taken = [];
    data.rings.forEach((ring, i) => {
      // The ring's point nearest the camera, so the name sits in front.
      let best = 0;
      let bestZ = -Infinity;
      for (let k = 0; k < 24; k += 1) {
        const p = ringPoint(ring.radius, (k / 24) * Math.PI * 2, ring.tilt);
        scratch.set(...p);
        world.localToWorld(scratch);
        const z = scratch.dot(camera.position.clone().normalize());
        if (z > bestZ) {
          bestZ = z;
          best = k;
        }
      }
      // Fan the names out along their rings so they never stack.
      const fan = ((best + i * 2.2) / 24) * Math.PI * 2;
      const p = ringPoint(ring.radius, fan, ring.tilt);
      place(ringLabels[i], p, 10, -8, current.ringLabels * (1 - current.lens));
    });
    data.roots.forEach((root, i) =>
      place(rootLabels[i], root.position, 10, -8, current.roots >= 0.9 ? 1 : 0),
    );
    data.years.forEach((year, i) =>
      place(yearLabels[i], year.position, 6, -8, current.years),
    );
    data.projects.forEach((project, i) => {
      const lit = hovered?.kind === 'project' && hovered.index === i ? 1 : 0;
      place(
        projectLabels[i],
        project.position,
        14,
        -10,
        Math.max(current.projectLabels, lit),
      );
    });
    if (hovered?.kind === 'post') {
      place(hoverLabel, starAt(hovered.index, scratch), 12, -12, 1);
    } else {
      hoverLabel.style.opacity = '0';
    }

    starMaterial.uniforms.uTime.value = seconds;
    dustUniforms.uTime.value = seconds;
    finish.uniforms.uTime.value = seconds;

    composer.render();
    if (!readyFired) {
      readyFired = true;
      callbacks.onReady();
    }
    if (motion || flight.active || entryPending) requestRender();
  };

  function requestRender() {
    if (frame || !visible || document.hidden) return;
    frame = requestAnimationFrame(tick);
  }

  const resize = () => {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio());
    composer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const nextFit = THREE.MathUtils.clamp(1.25 / camera.aspect, 1, 1.9);
    if (Math.abs(nextFit - fit) > 0.01) {
      fit = nextFit;
      if (!flight.active && !entryPending) setStation(station);
    }
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
  requestRender();

  return {
    setStation,
    dispose: () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();
      layer.replaceChildren();
      coreGeometry.dispose();
      cores.forEach(({ material }) => material.dispose());
      ringLines.forEach((line) => line.geometry.dispose());
      rootRing.geometry.dispose();
      rootStem.geometry.dispose();
      spiral.geometry.dispose();
      [starGeometry, dustGeometry].forEach((g) => g.dispose());
      [starMaterial, dustMaterial, ...lineMaterials].forEach((m) =>
        m.dispose(),
      );
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
