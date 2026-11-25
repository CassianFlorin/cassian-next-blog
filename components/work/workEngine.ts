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
  easeOut,
  isTextTarget,
  mulberry32,
  readPalette,
  srgbVector,
} from '@/components/three/shared';
import type { WorkSceneData, Vec3 } from '@/lib/workScene';

/**
 * The work orbit: every project a living core, its tech stack circling it as
 * satellites, threads up to the knowledge territories it belongs to.
 *
 * 'index' shows all projects (/projects); 'detail' shows one project behind
 * a case study's header. Names are HTML labels projected each frame.
 */

export interface WorkCallbacks {
  onReady: () => void;
  onHover: (projectIndex: number) => void;
  /** Navigate; `href` is site-relative or external. */
  onOpen: (href: string) => void;
}

export interface WorkOptions {
  reducedMotion: boolean;
  mode: 'index' | 'detail';
  /** Detail mode: the project in view. */
  projectId?: string;
  labelLayer: HTMLElement;
  localize: (href: string) => string;
}

export interface WorkHandle {
  /** Light a project from outside (list hover); -1 clears. */
  highlight: (projectIndex: number) => void;
  dispose: () => void;
}

const ENTRY_MS = 1800;
const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

export function mountWork(
  host: HTMLElement,
  data: WorkSceneData,
  callbacks: WorkCallbacks,
  options: WorkOptions,
): WorkHandle {
  const motion = !options.reducedMotion;
  const detail = options.mode === 'detail';
  const compact = host.getBoundingClientRect().width < 768;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const pixelRatio = () => Math.min(window.devicePixelRatio, compact ? 1.5 : 2);

  const focusIndex = detail
    ? data.projects.findIndex((p) => p.id === options.projectId)
    : -1;
  const shown = (i: number) => !detail || i === focusIndex;

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);

  let palette = readPalette();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
  const world = new THREE.Group();
  scene.add(world);

  /* Cores: projects and territories -------------------------------------- */
  const coreGeometry = new THREE.IcosahedronGeometry(1, compact ? 20 : 36);
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

  const projectCores = data.projects.map((project, i) => {
    const core = makeCore(project.position, project.size, i * 0.9 + 0.3);
    core.mesh.visible = shown(i);
    return core;
  });
  const territoryCores = data.territories.map((territory, i) => {
    const linked =
      !detail || data.projects[focusIndex]?.territories.includes(territory.key);
    const core = makeCore(territory.position, 0.45, i * 2.3 + 1.1);
    core.mesh.visible = Boolean(linked);
    return core;
  });

  /* Satellites: each project's tech stack, orbiting ---------------------- */
  type Satellite = {
    project: number;
    label: string;
    radius: number;
    tilt: THREE.Quaternion;
    phase: number;
    speed: number;
  };
  const random = mulberry32(4242);
  const satellites: Satellite[] = [];
  data.projects.forEach((project, p) => {
    if (!shown(p)) return;
    const tilt = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        0.35 + random() * 0.5,
        random() * Math.PI,
        (random() - 0.5) * 0.6,
      ),
    );
    project.tech.forEach((label, i) => {
      satellites.push({
        project: p,
        label,
        radius: project.size + 1.3 + (i % 2) * 0.55,
        tilt,
        phase: (i / project.tech.length) * Math.PI * 2,
        speed: 0.16 + random() * 0.06,
      });
    });
  });
  const satellitePositions = new Float32Array(satellites.length * 3);
  const satelliteGeometry = new THREE.BufferGeometry();
  const satelliteAttribute = new THREE.BufferAttribute(satellitePositions, 3);
  satelliteAttribute.setUsage(THREE.DynamicDrawUsage);
  satelliteGeometry.setAttribute('position', satelliteAttribute);
  satelliteGeometry.setAttribute(
    'aSize',
    new THREE.Float32BufferAttribute(
      satellites.map(() => 16),
      1,
    ),
  );
  satelliteGeometry.setAttribute(
    'aSeed',
    new THREE.Float32BufferAttribute(
      satellites.map((_, i) => (i * 0.618) % 1),
      1,
    ),
  );
  const satelliteDim = new Float32Array(satellites.length).fill(0.85);
  const satelliteLit = new Float32Array(satellites.length).fill(0);
  const dimAttribute = new THREE.BufferAttribute(satelliteDim, 1);
  const litAttribute = new THREE.BufferAttribute(satelliteLit, 1);
  dimAttribute.setUsage(THREE.DynamicDrawUsage);
  litAttribute.setUsage(THREE.DynamicDrawUsage);
  satelliteGeometry.setAttribute('aDim', dimAttribute);
  satelliteGeometry.setAttribute('aLit', litAttribute);
  satelliteGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);
  const pointMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: pixelRatio() },
      uTime: { value: 0 },
      uScale: { value: 26 },
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
  world.add(new THREE.Points(satelliteGeometry, pointMaterial));

  /* Orbit rings + territory threads -------------------------------------- */
  const lineMaterial = new THREE.LineBasicMaterial({
    color: palette.ink.clone(),
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const accentLineMaterial = new THREE.LineBasicMaterial({
    color: palette.accent.clone(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const ringGroups = data.projects.map((project, p) => {
    const group = new THREE.Group();
    if (!shown(p)) return group;
    const own = satellites.filter((s) => s.project === p);
    const radii = [...new Set(own.map((s) => s.radius))];
    radii.forEach((radius) => {
      const points = Array.from({ length: 97 }, (_, i) => {
        const a = (i / 96) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      });
      const ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        lineMaterial,
      );
      group.add(ring);
    });
    if (own[0]) group.quaternion.copy(own[0].tilt);
    group.position.copy(v3(project.position));
    world.add(group);
    return group;
  });

  const threadSegments: number[] = [];
  const threadOwner: number[] = [];
  data.projects.forEach((project, p) => {
    if (!shown(p)) return;
    project.territories.forEach((key) => {
      const territory = data.territories.find((t) => t.key === key);
      if (!territory) return;
      const from = v3(project.position);
      const to = v3(territory.position);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      mid.y += 2;
      const samples = new THREE.QuadraticBezierCurve3(from, mid, to).getPoints(
        20,
      );
      for (let i = 0; i < samples.length - 1; i += 1) {
        threadSegments.push(
          ...samples[i].toArray(),
          ...samples[i + 1].toArray(),
        );
        threadOwner.push(p);
      }
    });
  });
  const threadGeometry = new THREE.BufferGeometry();
  threadGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(threadSegments, 3),
  );
  world.add(new THREE.LineSegments(threadGeometry, lineMaterial));
  // A second copy for the lit project, drawn in the accent.
  const litThreadGeometry = new THREE.BufferGeometry();
  world.add(new THREE.LineSegments(litThreadGeometry, accentLineMaterial));
  const lightThreads = (p: number) => {
    const points: number[] = [];
    threadOwner.forEach((owner, segment) => {
      if (owner === p)
        points.push(...threadSegments.slice(segment * 6, segment * 6 + 6));
    });
    litThreadGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3),
    );
    litThreadGeometry.computeBoundingSphere();
  };

  /* Ambient dust ---------------------------------------------------------- */
  const dustCount = compact ? 2000 : 4500;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  const dustSize = new Float32Array(dustCount);
  const dustTone = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i += 1) {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const r = 16 + Math.pow(random(), 0.6) * 40;
    const s = Math.sqrt(1 - u * u);
    dustPositions.set(
      [Math.cos(theta) * s * r, u * r * 0.55, Math.sin(theta) * s * r - 6],
      i * 3,
    );
    dustSeed[i] = random();
    dustSize[i] = 0.5 + Math.pow(random(), 5) * 2.2;
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
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // No bloom on in-page stages: its halo lifts the whole background and the
  // stage shows as a lighter box against the page (see the finish pass).
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH_SHADER);
  finish.uniforms.uEdge.value = 1;
  composer.addPass(finish);

  const allCores = [...projectCores, ...territoryCores];
  const applyPalette = () => {
    renderer.setClearColor(composerClearColor(palette.background), 1);
    allCores.forEach(({ material }) => {
      material.uniforms.uBase.value.copy(palette.coreBase);
      material.uniforms.uRim.value.copy(palette.accent);
      material.uniforms.uInk.value.copy(palette.ink);
      material.uniforms.uDark.value = palette.dark ? 1 : 0;
    });
    const blending = palette.dark
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    [pointMaterial, dustMaterial].forEach((material) => {
      material.uniforms.uInk.value.copy(palette.ink);
      material.uniforms.uAccent.value.copy(palette.accent);
      material.blending = blending;
      material.needsUpdate = true;
    });
    lineMaterial.color.copy(palette.ink);
    accentLineMaterial.color.copy(palette.accent);
    dustUniforms.uOpacity.value = palette.dark ? 0.55 : 0.7;
    dustUniforms.uSizeScale.value = palette.dark ? 1 : 1.3;
    finish.uniforms.uGrain.value = palette.dark ? 0.06 : 0.035;
    srgbVector(palette.background, finish.uniforms.uBg.value as THREE.Vector3);
  };
  applyPalette();

  /* Labels ---------------------------------------------------------------- */
  const layer = options.labelLayer;
  layer.replaceChildren();
  const anchor = (className: string) => {
    const el = document.createElement('a');
    el.className = `work-label pointer-events-auto absolute top-0 left-0 ${className}`;
    el.addEventListener('click', (event) => {
      const href = el.dataset.href;
      if (!href || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (!href.startsWith('/')) return; // external: let the browser go
      event.preventDefault();
      callbacks.onOpen(href);
    });
    layer.appendChild(el);
    return el;
  };
  const setHref = (el: HTMLAnchorElement, href: string) => {
    el.dataset.href = href;
    el.href = href.startsWith('/') ? options.localize(href) : href;
    if (!href.startsWith('/')) {
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    }
  };

  const projectLabels = data.projects.map((project, p) => {
    const el = anchor('work-label--project');
    setHref(el, project.href);
    const title = document.createElement('span');
    title.className =
      'block text-base font-semibold tracking-tight text-gray-950 dark:text-gray-50';
    title.textContent = project.title;
    const meta = document.createElement('span');
    meta.className =
      'work-label-tagline type-meta text-gray-600 dark:text-gray-400';
    meta.textContent = project.status;
    const tagline = document.createElement('span');
    tagline.className =
      'work-label-tagline type-editorial mt-1 max-w-60 text-sm leading-snug text-gray-700 dark:text-gray-300';
    tagline.textContent = project.tagline;
    el.append(title, meta, tagline);
    if (!shown(p) || detail) el.style.display = 'none';
    return el;
  });
  const territoryLabels = data.territories.map((territory, i) => {
    const el = anchor('work-label--territory');
    setHref(el, territory.href);
    el.textContent = `↗ ${territory.label}`;
    el.className += ' type-meta text-gray-600 dark:text-gray-400';
    if (!territoryCores[i].mesh.visible) el.style.display = 'none';
    return el;
  });
  const satelliteLabels = satellites.map((satellite) => {
    const el = document.createElement('span');
    el.className =
      'work-label work-label--tech type-meta pointer-events-none absolute top-0 left-0 text-gray-700 dark:text-gray-300';
    el.textContent = satellite.label;
    layer.appendChild(el);
    return el;
  });

  /* State ----------------------------------------------------------------- */
  let hovered = -1;
  let external = -1;
  const lit = () =>
    hovered >= 0 ? hovered : external >= 0 ? external : focusIndex;
  const energy = new Float32Array(allCores.length);

  const relight = () => {
    const active = lit();
    lightThreads(active);
    projectLabels.forEach((el, p) => {
      el.dataset.state = p === active ? 'lit' : active >= 0 ? 'dim' : 'idle';
    });
    renderer.domElement.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
    requestRender();
  };

  /* Camera + controls ----------------------------------------------------- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.5;
  controls.autoRotate = motion;
  controls.autoRotateSpeed = detail ? 0.6 : 0.25;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.62;
  if (coarse) {
    controls.enabled = false;
    renderer.domElement.style.touchAction = 'pan-y';
  }
  let idleTimer = 0;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
  });
  controls.addEventListener('end', () => {
    window.clearTimeout(idleTimer);
    if (motion) {
      idleTimer = window.setTimeout(() => {
        controls.autoRotate = true;
      }, 5000);
    }
  });
  controls.addEventListener('change', () => requestRender());

  const target = new THREE.Vector3();
  const rest = new THREE.Vector3();
  if (detail && focusIndex >= 0) {
    const project = data.projects[focusIndex];
    // Frame the core and the territories above it together.
    target.copy(v3(project.position));
    target.y += 2.4;
    target.z -= 3;
    rest.copy(target).add(new THREE.Vector3(0, 2.4, compact ? 19 : 17));
  } else {
    target.set(0, 1.2, 4);
    rest.set(0, 7, compact ? 40 : 30);
  }
  const entryFrom = rest.clone().sub(target).multiplyScalar(2.6).add(target);
  controls.target.copy(target);
  camera.position.copy(motion ? entryFrom : rest);
  camera.lookAt(target);

  /* Picking --------------------------------------------------------------- */
  let width = 1;
  let height = 1;
  const projected = new THREE.Vector3();
  const toScreen = (p: THREE.Vector3, out: THREE.Vector3) => {
    out.copy(p);
    world.localToWorld(out);
    out.project(camera);
    out.set(((out.x + 1) / 2) * width, ((1 - out.y) / 2) * height, out.z);
    return out;
  };
  const edge = new THREE.Vector3();
  const screenRadius = (center: THREE.Vector3, size: number) => {
    toScreen(center, projected);
    const cx = projected.x;
    const right = camera.position.clone().sub(center);
    right.crossVectors(new THREE.Vector3(0, 1, 0), right).normalize();
    edge.copy(center).addScaledVector(right, size);
    toScreen(edge, edge);
    toScreen(center, projected);
    return Math.abs(edge.x - cx);
  };

  const pick = (x: number, y: number) => {
    let best = -1;
    let bestDistance = Infinity;
    data.projects.forEach((project, p) => {
      if (!shown(p)) return;
      const center = v3(project.position);
      const r = Math.max(24, screenRadius(center, project.size) * 1.25);
      toScreen(center, projected);
      if (projected.z > 1) return;
      const d = Math.hypot(projected.x - x, projected.y - y);
      if (d < r && d < bestDistance) {
        bestDistance = d;
        best = p;
      }
    });
    return best;
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
    const next = detail ? -1 : pick(x, y);
    if (next !== hovered) {
      hovered = next;
      callbacks.onHover(next);
      relight();
    }
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = down;
    down = null;
    if (!start || detail) return;
    const { x, y } = local(event);
    if (Math.hypot(x - start.x, y - start.y) > 6) return;
    const p = pick(x, y);
    if (p >= 0) {
      const href = data.projects[p].href;
      if (href.startsWith('/')) callbacks.onOpen(href);
      else window.open(href, '_blank', 'noopener');
    }
  };
  const onPointerLeave = () => {
    if (hovered !== -1) {
      hovered = -1;
      callbacks.onHover(-1);
      relight();
    }
  };
  const canvas = renderer.domElement;
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);

  /* Loop ------------------------------------------------------------------ */
  let frame = 0;
  let started = 0;
  let entryStart = 0;
  let entryDone = !motion;
  let readyFired = false;
  let visible = true;
  const scratch = new THREE.Vector3();

  const place = (
    el: HTMLElement,
    p: THREE.Vector3,
    dx: number,
    dy: number,
    opacity: number,
  ) => {
    toScreen(p, projected);
    if (projected.z > 1 || el.style.display === 'none') {
      el.style.visibility = 'hidden';
      return;
    }
    el.style.visibility = 'visible';
    el.style.transform = `translate3d(${Math.round(projected.x + dx)}px, ${Math.round(projected.y + dy)}px, 0)`;
    el.style.opacity = String(opacity);
  };

  const tick = (now: number) => {
    frame = 0;
    if (!started) started = now;
    const time = motion ? (now - started) / 1000 : 0;

    if (!entryDone && !entryStart) {
      const rect = host.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) entryStart = now;
    }
    if (!entryDone) {
      const t = entryStart
        ? easeOut(clamp01((now - entryStart) / ENTRY_MS))
        : 0;
      camera.position.lerpVectors(entryFrom, rest, t);
      if (t >= 1) entryDone = true;
    }
    controls.update();

    const active = lit();
    allCores.forEach(({ mesh, material, seed }, i) => {
      const isProject = i < projectCores.length;
      const goal = isProject
        ? i === active
          ? 1
          : 0
        : active >= 0 &&
            data.projects[active].territories.includes(
              data.territories[i - projectCores.length].key,
            )
          ? 0.6
          : 0;
      energy[i] += (goal - energy[i]) * 0.08;
      material.uniforms.uEnergy.value = energy[i];
      material.uniforms.uTime.value = time + seed * 3;
      if (motion) mesh.rotation.y += 0.002;
    });

    satellites.forEach((satellite, i) => {
      const angle = satellite.phase + time * satellite.speed;
      scratch
        .set(
          Math.cos(angle) * satellite.radius,
          0,
          Math.sin(angle) * satellite.radius,
        )
        .applyQuaternion(satellite.tilt)
        .add(v3(data.projects[satellite.project].position));
      satellitePositions.set([scratch.x, scratch.y, scratch.z], i * 3);
      const mine = satellite.project === active;
      satelliteLit[i] += ((mine ? 1 : 0) - satelliteLit[i]) * 0.12;
      satelliteDim[i] = active >= 0 && !mine ? 0.35 : 0.9;
      // Tech names: always in detail, on the lit project in the index.
      const showLabel = detail || mine;
      place(satelliteLabels[i], scratch, 9, -8, showLabel ? 1 : 0);
    });
    satelliteAttribute.needsUpdate = true;
    dimAttribute.needsUpdate = true;
    litAttribute.needsUpdate = true;
    accentLineMaterial.opacity +=
      ((active >= 0 ? 0.75 : 0) - accentLineMaterial.opacity) * 0.12;

    data.projects.forEach((project, p) => {
      const center = v3(project.position);
      const r = screenRadius(center, project.size);
      const state = projectLabels[p].dataset.state;
      place(projectLabels[p], center, r + 14, -14, state === 'dim' ? 0.5 : 1);
    });
    data.territories.forEach((territory, i) => {
      const linked =
        active >= 0 &&
        data.projects[active].territories.includes(territory.key);
      place(
        territoryLabels[i],
        v3(territory.position),
        16,
        -8,
        detail || linked ? 1 : 0.55,
      );
    });

    pointMaterial.uniforms.uTime.value = time;
    dustUniforms.uTime.value = time;
    finish.uniforms.uTime.value = time;
    ringGroups.forEach((group) => {
      if (motion) group.rotateY(0.0008);
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
    height = Math.max(1, rect.height);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio());
    composer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // Detail headers keep the title on the left of wide screens.
    finish.uniforms.uLeft.value = detail && width >= 1024 ? 1 : 0;
    world.position.x = detail && width >= 1024 ? 7 : 0;
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
  relight();
  requestRender();

  return {
    highlight: (projectIndex) => {
      external = projectIndex;
      relight();
    },
    dispose: () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
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
      allCores.forEach(({ material }) => material.dispose());
      ringGroups.forEach((group) =>
        group.children.forEach((child) =>
          (child as THREE.Line).geometry.dispose(),
        ),
      );
      [
        satelliteGeometry,
        threadGeometry,
        litThreadGeometry,
        dustGeometry,
      ].forEach((geometry) => geometry.dispose());
      [pointMaterial, dustMaterial, lineMaterial, accentLineMaterial].forEach(
        (material) => material.dispose(),
      );
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
