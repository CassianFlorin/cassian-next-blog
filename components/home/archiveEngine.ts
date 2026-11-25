import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
  CORE_FRAGMENT,
  CORE_VERTEX,
  DUST_FRAGMENT,
  DUST_VERTEX,
  FINISH_SHADER,
  STAR_FRAGMENT,
  STAR_VERTEX,
  clamp01,
  composerClearColor,
  easeOut,
  isTextTarget,
  mulberry32,
  readPalette,
  srgbVector,
} from '@/components/three/shared';
import {
  ARM_ROOT,
  DISK_RADIUS,
  armAngle,
  spiralAngle,
  type ArchiveCard,
  type ArchiveSceneData,
} from '@/lib/archiveScene';

/**
 * The hero's 3D archive: one living core, and around it a galaxy whose arms
 * are the knowledge territories. Every article is a star on its arm. On
 * entry the dust gathers from far away into the galaxy; the cursor parts it.
 *
 * Plain three.js plus its bundled post-processing. Loaded on idle by
 * ArchiveField, so none of it is on the critical path.
 */

export interface ArchiveCallbacks {
  onReady: () => void;
  onHover: (card: ArchiveCard | null) => void;
  onOpen: (card: ArchiveCard) => void;
}

export interface ArchiveOptions {
  reducedMotion: boolean;
  /** Floating title next to the hovered star; positioned every frame. */
  label: HTMLElement | null;
}

const ENTRY_MS = 2200;

/**
 * Camera stations, one per homepage chapter: CF / 00 hero, 01 work,
 * 02 knowledge, 03 writing, 04 about. Scrolling blends between them, so the
 * page reads as one flight through the same world.
 */
interface Station {
  /** Galaxy offset on wide screens (text column is on the left). */
  x: number;
  tilt: number;
  roll: number;
  camY: number;
  camZ: number;
  /** Where the camera aims vertically; below 0 lifts the world up. */
  lookY: number;
  /** 0 = the camera turns to face the offset, 1 = it slides along with it. */
  pan: number;
  /** How present the world is behind this chapter's text, 0..1. */
  presence: number;
  /** Fade the left side for the text column (wide screens). */
  left: number;
}

const STATIONS: Station[] = [
  // 00 hero: the galaxy to the right of the name, cursor parts the dust.
  {
    x: 9,
    tilt: 0.62,
    roll: -0.22,
    camY: 1.5,
    camZ: 30,
    lookY: 0,
    pan: 0,
    presence: 1,
    left: 1,
  },
  // 01 work: up into the empty corner above the project row.
  {
    x: 15,
    tilt: 1.0,
    roll: 0.12,
    camY: 2,
    camZ: 40,
    lookY: -7,
    pan: 0,
    presence: 0.6,
    left: 0,
  },
  // 02 knowledge: the core slides off screen, the arms sweep behind the map.
  {
    x: -30,
    tilt: 1.3,
    roll: 0.05,
    camY: 0,
    camZ: 20,
    lookY: 0,
    pan: 1,
    presence: 0.45,
    left: 0,
  },
  // 03 writing: skim along an arm, stars passing behind the list.
  {
    x: 10,
    tilt: 0.16,
    roll: -0.12,
    camY: 0.6,
    camZ: 17,
    lookY: 0,
    pan: 0,
    presence: 0.55,
    left: 0,
  },
  // 04 about: pull back and see the whole world once more.
  {
    x: -6,
    tilt: 0.78,
    roll: -0.32,
    camY: 2,
    camZ: 56,
    lookY: 0,
    pan: 0,
    presence: 0.8,
    left: 0,
  },
];
const CHAPTER_IDS = ['work', 'knowledge', 'writing', 'about'];

const smooth = (t: number) => t * t * (3 - 2 * t);
const mixNumber = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------------ */
/* Dust: the galaxy itself                                                   */
/* ------------------------------------------------------------------------ */

function buildDust(count: number, arms: number) {
  const random = mulberry32(20261124);
  const gauss = () => {
    const u = Math.max(random(), 1e-6);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * random());
  };

  const target = new Float32Array(count * 3);
  const start = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  const tone = new Float32Array(count);
  const dir = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    if (kind < 0.7) {
      // Arms: logarithmic spirals, scatter widening with radius.
      const arm = Math.floor(random() * Math.max(arms, 1));
      const r =
        ARM_ROOT * 0.8 +
        Math.pow(random(), 1.35) * (DISK_RADIUS - ARM_ROOT * 0.8);
      const angle =
        spiralAngle(armAngle(arm, arms), r) + gauss() * (0.05 + r * 0.008);
      const spread = gauss() * 0.22;
      x = Math.cos(angle) * (r + spread);
      z = Math.sin(angle) * (r + spread);
      y = gauss() * 0.22 * (1.2 - r / DISK_RADIUS);
    } else if (kind < 0.86) {
      // Bulge: a dense, slightly flattened cloud around the core.
      const r = 2.4 + Math.pow(random(), 2.2) * 3.2;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      x = Math.sin(phi) * Math.cos(theta) * r;
      y = Math.cos(phi) * r * 0.45;
      z = Math.sin(phi) * Math.sin(theta) * r;
    } else if (kind < 0.94) {
      // Diffuse disk between the arms.
      const r = Math.sqrt(random()) * DISK_RADIUS * 1.15;
      const angle = random() * Math.PI * 2;
      x = Math.cos(angle) * r;
      z = Math.sin(angle) * r;
      y = gauss() * 0.3;
    } else {
      // Two thin outer orbits, slightly off-plane.
      const outer = random() < 0.5;
      const r = (outer ? 17.5 : 15.2) + gauss() * 0.06;
      const angle = random() * Math.PI * 2;
      const tilt = outer ? 0.08 : -0.05;
      x = Math.cos(angle) * r;
      z = Math.sin(angle) * r;
      y = Math.sin(angle) * r * tilt;
    }

    target[i * 3] = x;
    target[i * 3 + 1] = y;
    target[i * 3 + 2] = z;

    dir.set(gauss(), gauss(), gauss()).normalize();
    const far = 30 + random() * 45;
    start[i * 3] = dir.x * far;
    start[i * 3 + 1] = dir.y * far;
    start[i * 3 + 2] = dir.z * far;

    seed[i] = random();
    size[i] = 0.6 + Math.pow(random(), 4) * 2.6;
    tone[i] = random() < 0.16 ? 1 : 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(target, 3));
  geometry.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('aTone', new THREE.BufferAttribute(tone, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);
  return geometry;
}

/* ------------------------------------------------------------------------ */
/* Mount                                                                     */
/* ------------------------------------------------------------------------ */

export function mountArchive(
  host: HTMLElement,
  data: ArchiveSceneData,
  callbacks: ArchiveCallbacks,
  options: ArchiveOptions,
): () => void {
  const motion = !options.reducedMotion;
  const compact = host.getBoundingClientRect().width < 768;

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
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

  // rig: layout offset + pointer parallax; galaxy: tilt; spin: rotation.
  const rig = new THREE.Group();
  const galaxy = new THREE.Group();
  const spin = new THREE.Group();
  galaxy.rotation.set(STATIONS[0].tilt, 0, STATIONS[0].roll);
  galaxy.add(spin);
  rig.add(galaxy);
  scene.add(rig);

  const pixelRatio = () => Math.min(window.devicePixelRatio, compact ? 1.5 : 2);

  /* Core */
  const coreUniforms = {
    uTime: { value: 0 },
    uEnergy: { value: 0 },
    uBase: { value: palette.coreBase.clone() },
    uRim: { value: palette.accent.clone() },
    uInk: { value: palette.ink.clone() },
    uDark: { value: palette.dark ? 1 : 0 },
  };
  const coreGeometry = new THREE.IcosahedronGeometry(2.1, compact ? 28 : 48);
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    vertexShader: CORE_VERTEX,
    fragmentShader: CORE_FRAGMENT,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  galaxy.add(core);

  /* Dust */
  const dustUniforms = {
    uTime: { value: 0 },
    uEntry: { value: motion ? 0 : 1 },
    uPixelRatio: { value: pixelRatio() },
    uMouse: { value: new THREE.Vector3(999, 999, 999) },
    uMouseStrength: { value: 0 },
    uSizeScale: { value: 1 },
    uInk: { value: palette.ink.clone() },
    uAccent: { value: palette.accent.clone() },
    uOpacity: { value: 1 },
  };
  const dustGeometry = buildDust(
    compact ? 7000 : 16000,
    data.territories.length,
  );
  const dustMaterial = new THREE.ShaderMaterial({
    uniforms: dustUniforms,
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  spin.add(new THREE.Points(dustGeometry, dustMaterial));

  /* Stars: one per article */
  const starPositions = new Float32Array(data.cards.length * 3);
  const starHover = new Float32Array(data.cards.length);
  const starSeed = new Float32Array(data.cards.length);
  data.cards.forEach((card, i) => {
    starPositions.set(card.position, i * 3);
    starSeed[i] = (i * 0.618) % 1;
  });
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(starPositions, 3),
  );
  const hoverAttribute = new THREE.BufferAttribute(starHover, 1);
  hoverAttribute.setUsage(THREE.DynamicDrawUsage);
  starGeometry.setAttribute('aHover', hoverAttribute);
  starGeometry.setAttribute('aSeed', new THREE.BufferAttribute(starSeed, 1));
  const starUniforms = {
    uPixelRatio: { value: pixelRatio() },
    uTime: { value: 0 },
    uAccent: { value: palette.accent.clone() },
    uInk: { value: palette.ink.clone() },
    uOpacity: { value: motion ? 0 : 1 },
  };
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  spin.add(new THREE.Points(starGeometry, starMaterial));

  /* Constellation: on hover, curves to the other stars of the territory. */
  const threadMaterial = new THREE.LineBasicMaterial({
    color: palette.accent.clone(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const threadGeometry = new THREE.BufferGeometry();
  spin.add(new THREE.LineSegments(threadGeometry, threadMaterial));

  const buildThreads = (card: ArchiveCard | null) => {
    const points: number[] = [];
    if (card) {
      const from = new THREE.Vector3(...card.position);
      data.cards.forEach((other) => {
        if (other === card || other.territory !== card.territory) return;
        const to = new THREE.Vector3(...other.position);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.multiplyScalar(0.72).setY(mid.y + 1.2);
        const samples = new THREE.QuadraticBezierCurve3(
          from,
          mid,
          to,
        ).getPoints(28);
        for (let i = 0; i < samples.length - 1; i += 1) {
          points.push(...samples[i].toArray(), ...samples[i + 1].toArray());
        }
      });
    }
    threadGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3),
    );
    threadGeometry.computeBoundingSphere();
  };

  /* Post-processing */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.5, 0.2);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH_SHADER);
  composer.addPass(finish);

  const applyPalette = () => {
    renderer.setClearColor(composerClearColor(palette.background), 1);
    coreUniforms.uBase.value.copy(palette.coreBase);
    coreUniforms.uRim.value.copy(palette.accent);
    coreUniforms.uInk.value.copy(palette.ink);
    coreUniforms.uDark.value = palette.dark ? 1 : 0;
    dustUniforms.uInk.value.copy(palette.ink);
    dustUniforms.uAccent.value.copy(palette.accent);
    starUniforms.uAccent.value.copy(palette.accent);
    starUniforms.uInk.value.copy(palette.ink);
    threadMaterial.color.copy(palette.accent);
    // Light glows on the night page; on paper it reads as graphite dust.
    const blending = palette.dark
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    dustMaterial.blending = blending;
    starMaterial.blending = blending;
    dustMaterial.needsUpdate = true;
    starMaterial.needsUpdate = true;
    dustUniforms.uOpacity.value = palette.dark ? 0.85 : 1;
    dustUniforms.uSizeScale.value = palette.dark ? 1 : 1.35;
    bloom.enabled = palette.dark && !compact;
    finish.uniforms.uGrain.value = palette.dark ? 0.06 : 0.035;
    srgbVector(palette.background, finish.uniforms.uBg.value as THREE.Vector3);
  };
  applyPalette();

  /* ---------------------------------------------------------------------- */
  /* Layout, input, motion                                                  */
  /* ---------------------------------------------------------------------- */

  let width = 1;
  let height = 1;
  let wide = true;
  let chapters: HTMLElement[] = [];
  const collectChapters = () => {
    chapters = CHAPTER_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
  };
  collectChapters();

  /** Continuous chapter index: 0 at the hero, 4 inside About. */
  const stationValue = () => {
    let value = 0;
    for (const chapter of chapters) {
      const top = chapter.getBoundingClientRect().top;
      value += clamp01((height * 0.92 - top) / (height * 0.75));
    }
    return value;
  };
  const station = { ...STATIONS[0] };
  const blendStations = (value: number) => {
    const index = Math.min(STATIONS.length - 2, Math.floor(value));
    const t = smooth(clamp01(value - index));
    const a = STATIONS[index];
    const b = STATIONS[index + 1];
    (Object.keys(station) as Array<keyof Station>).forEach((key) => {
      station[key] = mixNumber(a[key], b[key], t);
    });
    if (!wide) {
      // One column: the world sits right under the text, so past the hero
      // it steps back further.
      station.x = 0;
      station.left = 0;
      station.camZ += 8;
      station.presence *= 1 - 0.5 * clamp01(value);
    }
    return station;
  };
  let chapterValue = 0;

  const pointer = { nx: 0, ny: 0, x: 0, y: 0, active: false };
  let hovered = -1;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const projected = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const diskPlane = new THREE.Plane();
  const planeHit = new THREE.Vector3();
  const diskNormal = new THREE.Vector3();
  const spinQuaternion = new THREE.Quaternion();
  const coreWorld = new THREE.Vector3();

  const starScreen = (index: number, out: THREE.Vector3) => {
    out.fromArray(starPositions, index * 3);
    spin.localToWorld(out);
    out.project(camera);
    out.set(((out.x + 1) / 2) * width, ((1 - out.y) / 2) * height, out.z);
    return out;
  };

  const setHovered = (index: number) => {
    if (index === hovered) return;
    hovered = index;
    const card = index >= 0 ? data.cards[index] : null;
    buildThreads(card);
    document.body.style.cursor = card ? 'pointer' : '';
    callbacks.onHover(card);
    requestRender();
  };

  const pick = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    const inside =
      pointer.x >= 0 &&
      pointer.y >= 0 &&
      pointer.x <= rect.width &&
      pointer.y <= rect.height;
    pointer.nx = (pointer.x / rect.width) * 2 - 1;
    pointer.ny = (pointer.y / rect.height) * 2 - 1;
    pointer.active = inside;
    if (
      !inside ||
      chapterValue > 0.25 ||
      starUniforms.uOpacity.value < 0.5 ||
      isTextTarget(event.target, event.clientX, event.clientY)
    ) {
      setHovered(-1);
      return;
    }
    let best = -1;
    let bestDistance = 26;
    for (let i = 0; i < data.cards.length; i += 1) {
      starScreen(i, projected);
      if (projected.z > 1) continue;
      const d = Math.hypot(projected.x - pointer.x, projected.y - pointer.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    setHovered(best);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    pick(event);
    requestRender();
  };
  const onPointerLeave = () => {
    pointer.active = false;
    setHovered(-1);
  };
  const onClick = (event: MouseEvent) => {
    if (hovered < 0) return;
    if (isTextTarget(event.target, event.clientX, event.clientY)) return;
    if (window.getSelection()?.toString()) return;
    callbacks.onOpen(data.cards[hovered]);
  };

  if (finePointer) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('click', onClick);
  }
  const onScroll = () => {
    if (chapterValue > 0.25) setHovered(-1);
    requestRender();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const themeObserver = new MutationObserver(() => {
    palette = readPalette();
    applyPalette();
    requestRender();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  /* Loop: runs while the tab is visible. Under reduced motion it renders on
     demand (scroll, resize, theme) and nothing moves by itself. */
  let frame = 0;
  let started = 0;
  let readyFired = false;
  const parallax = { x: 0, y: 0 };
  const cameraStart = new THREE.Vector3(-3, 16, 70);
  const cameraRest = new THREE.Vector3();
  const lookAt = new THREE.Vector3();

  const tick = (now: number) => {
    frame = 0;
    if (!started) started = now;
    const elapsed = now - started;
    const time = motion ? elapsed / 1000 : 0;

    const entryRaw = motion ? clamp01(elapsed / ENTRY_MS) : 1;
    const entry = easeOut(entryRaw);
    chapterValue = stationValue();
    const at = blendStations(chapterValue);

    // Pointer parallax on the rig, eased.
    const live = motion && finePointer && pointer.active;
    const px = live ? pointer.nx : 0;
    const py = live ? pointer.ny : 0;
    parallax.x += (px - parallax.x) * 0.04;
    parallax.y += (py - parallax.y) * 0.04;
    rig.position.x = at.x;
    rig.rotation.y = parallax.x * 0.14;
    rig.rotation.x = parallax.y * 0.06;

    spin.rotation.y = time * 0.03 + (1 - entry) * -1.4;
    galaxy.rotation.x = at.tilt;
    galaxy.rotation.z = at.roll;
    // The core stands upright even though the disk is tilted.
    core.rotation.set(-galaxy.rotation.x, time * 0.05, 0.22);
    core.scale.setScalar(0.25 + 0.75 * entry);

    cameraRest.set(0, at.camY, at.camZ);
    camera.position.lerpVectors(cameraStart, cameraRest, entry);
    camera.position.x += at.x * 0.55 * at.pan;
    lookAt.set(at.x * 0.55, at.lookY, 0);
    camera.lookAt(lookAt);
    scene.updateMatrixWorld();

    // Cursor in the disk's local frame, for the dust to part around.
    if (live) {
      ndc.set(pointer.nx, -pointer.ny);
      raycaster.setFromCamera(ndc, camera);
      spin.getWorldPosition(coreWorld);
      spin.getWorldQuaternion(spinQuaternion);
      diskNormal.set(0, 1, 0).applyQuaternion(spinQuaternion);
      diskPlane.setFromNormalAndCoplanarPoint(diskNormal, coreWorld);
      if (raycaster.ray.intersectPlane(diskPlane, planeHit)) {
        dustUniforms.uMouse.value.copy(spin.worldToLocal(planeHit));
      }
    }
    const strength = dustUniforms.uMouseStrength;
    strength.value += ((live ? 1 : 0) - strength.value) * 0.06;

    // The core breathes harder when the cursor is near it.
    core.getWorldPosition(coreWorld);
    projected.copy(coreWorld).project(camera);
    const coreX = ((projected.x + 1) / 2) * width;
    const coreY = ((1 - projected.y) / 2) * height;
    const near = live
      ? clamp01(1 - Math.hypot(pointer.x - coreX, pointer.y - coreY) / 320)
      : 0;
    coreUniforms.uEnergy.value += (near - coreUniforms.uEnergy.value) * 0.05;

    coreUniforms.uTime.value = time;
    dustUniforms.uTime.value = time;
    starUniforms.uTime.value = time;
    dustUniforms.uEntry.value = entryRaw;
    starUniforms.uOpacity.value = motion
      ? clamp01((entryRaw - 0.25) / 0.35)
      : 1;
    finish.uniforms.uTime.value = time;
    finish.uniforms.uPresence.value = at.presence;
    finish.uniforms.uLeft.value = at.left;
    // The hero-only readout fades with the first station.
    host.parentElement?.style.setProperty(
      '--hero-presence',
      String(clamp01(1 - chapterValue * 2.5)),
    );

    let settling = false;
    for (let i = 0; i < starHover.length; i += 1) {
      const goal = i === hovered ? 1 : 0;
      starHover[i] += (goal - starHover[i]) * 0.15;
      if (Math.abs(goal - starHover[i]) > 0.002) settling = true;
    }
    hoverAttribute.needsUpdate = true;
    const threadGoal = hovered >= 0 ? 0.55 : 0;
    threadMaterial.opacity += (threadGoal - threadMaterial.opacity) * 0.12;

    // Float the HTML title beside the hovered star.
    const label = options.label;
    if (label) {
      if (hovered >= 0) {
        starScreen(hovered, projected);
        // Flip to the star's left when the title would run off the page.
        const room = label.offsetWidth + 40;
        const x =
          projected.x + room > width
            ? projected.x - room + 18
            : projected.x + 22;
        label.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(projected.y - 14)}px, 0)`;
        label.style.opacity = '1';
      } else {
        label.style.opacity = '0';
      }
    }

    composer.render();
    if (!readyFired) {
      readyFired = true;
      callbacks.onReady();
    }

    settling =
      settling ||
      Math.abs(px - parallax.x) > 0.001 ||
      Math.abs(threadGoal - threadMaterial.opacity) > 0.005;
    if (motion || settling) requestRender();
  };

  function requestRender() {
    if (frame || document.hidden) return;
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
    wide = width >= 1024;
    collectChapters();
    requestRender();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const onVisibility = () => requestRender();
  document.addEventListener('visibilitychange', onVisibility);

  resize();
  requestRender();

  return () => {
    if (frame) cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    themeObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener(
      'pointerleave',
      onPointerLeave,
    );
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('click', onClick);
    document.body.style.cursor = '';
    [coreGeometry, dustGeometry, starGeometry, threadGeometry].forEach(
      (geometry) => geometry.dispose(),
    );
    [coreMaterial, dustMaterial, starMaterial, threadMaterial].forEach(
      (material) => material.dispose(),
    );
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
