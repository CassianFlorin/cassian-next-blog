import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
  clamp01,
  easeOut,
  isTextTarget,
  mulberry32,
  readPalette,
  srgbVector,
} from '@/components/three/shared';
import type { KnowledgeNodeKey } from '@/lib/knowledgeNodes';
import type { UniverseData, Vec3 } from '@/lib/knowledgeUniverse';

/**
 * The knowledge universe: territories as small living cores in space, their
 * topics as dust around them, articles as stars. Drag to turn it, pinch (or
 * ctrl + wheel) to zoom, click a territory to fly there.
 *
 * Text never lives in WebGL: names are HTML labels projected every frame, so
 * they stay crisp, selectable and reachable by keyboard.
 */

export type UniverseItem =
  | { kind: 'post'; index: number }
  | { kind: 'topic'; index: number }
  | { kind: 'territory'; index: number };

export interface UniverseCallbacks {
  onReady: () => void;
  onFocus: (key: KnowledgeNodeKey | null) => void;
  onHover: (item: UniverseItem | null) => void;
  /** Navigate; `href` is site-relative, not yet localized. */
  onOpen: (href: string) => void;
}

export interface UniverseOptions {
  reducedMotion: boolean;
  /** 'explore' focuses territories in place; 'territory' navigates. */
  /**
   * 'explore' focuses territories in place; 'territory' arrives focused and
   * navigates elsewhere; 'article' circles one article's star, lit with its
   * topics, inside an article page.
   */
  mode: 'explore' | 'territory' | 'article';
  initialFocus?: KnowledgeNodeKey;
  initialPost?: string;
  labelLayer: HTMLElement;
  localize: (href: string) => string;
  countLabel: (count: number) => string;
}

export interface UniverseHandle {
  focus: (key: KnowledgeNodeKey | null) => void;
  /** Light every article/topic matching the query; returns the match count. */
  search: (query: string) => number;
  dispose: () => void;
}

const POINT_VERTEX = /* glsl */ `
uniform float uPixelRatio;
uniform float uTime;
uniform float uScale;
attribute float aSize;
attribute float aDim;
attribute float aLit;
attribute float aSeed;
varying float vDim;
varying float vLit;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float pulse = 1.0 + 0.06 * sin(uTime * 1.5 + aSeed * 40.0);
  float size = aSize * (1.0 + aLit * 0.45) * pulse * (uScale / -mv.z);
  gl_PointSize = min(size, 56.0) * uPixelRatio;
  vDim = aDim;
  vLit = aLit;
}
`;

const POINT_FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uOpacity;
uniform float uRing;
varying float vDim;
varying float vLit;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.16, 0.1, r);
  float ring = smoothstep(0.03, 0.0, abs(r - 0.38)) * uRing * (0.35 + 0.65 * vLit);
  float halo = pow(smoothstep(0.5, 0.0, r), 3.0) * 0.45;
  float a = max(max(core, ring), halo);
  vec3 col = mix(uInk, uAccent, max(vLit, uRing * 0.75));
  gl_FragColor = vec4(col, a * vDim * uOpacity);
}
`;

const LINE_VERTEX = /* glsl */ `
attribute float aAlpha;
attribute float aLit;
varying float vAlpha;
varying float vLit;
void main(){
  vAlpha = aAlpha;
  vLit = aLit;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const LINE_FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uAccent;
varying float vAlpha;
varying float vLit;
void main(){
  gl_FragColor = vec4(mix(uInk, uAccent, vLit), vAlpha);
}
`;

const FLY_MS = 1100;
const ENTRY_MS = 1600;
const MAX_POST_LABELS = 12;
const MAX_TOPIC_LABELS = 8;

const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** Animated float buffer: current values ease toward targets every frame. */
class Eased {
  current: Float32Array;
  target: Float32Array;
  constructor(size: number, initial: number) {
    this.current = new Float32Array(size).fill(initial);
    this.target = new Float32Array(size).fill(initial);
  }
  step(rate: number) {
    let moving = false;
    for (let i = 0; i < this.current.length; i += 1) {
      const delta = this.target[i] - this.current[i];
      if (Math.abs(delta) > 0.002) {
        this.current[i] += delta * rate;
        moving = true;
      } else {
        this.current[i] = this.target[i];
      }
    }
    return moving;
  }
}

export function mountUniverse(
  host: HTMLElement,
  data: UniverseData,
  callbacks: UniverseCallbacks,
  options: UniverseOptions,
): UniverseHandle {
  const motion = !options.reducedMotion;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const compact = host.getBoundingClientRect().width < 768;
  const pixelRatio = () => Math.min(window.devicePixelRatio, compact ? 1.5 : 2);

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
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
  const world = new THREE.Group();
  scene.add(world);

  /* Territories: one living core each ----------------------------------- */
  const coreGeometry = new THREE.IcosahedronGeometry(1, compact ? 20 : 32);
  const cores = data.territories.map((territory, i) => {
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
    mesh.position.copy(v3(territory.position));
    mesh.scale.setScalar(territory.size);
    mesh.rotation.set(i * 0.7, i * 1.3, 0);
    world.add(mesh);
    return { mesh, material };
  });
  const energy = new Eased(data.territories.length, 0);
  /** Other territories step back (shrink) while one is in focus. */
  const coreScale = new Eased(data.territories.length, 1);

  /* Points: articles and topics ----------------------------------------- */
  const makePoints = (
    positions: Vec3[],
    sizes: number[],
    ring: number,
    scale: number,
  ) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions.flat(), 3),
    );
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute(
      'aSeed',
      new THREE.Float32BufferAttribute(
        positions.map((_, i) => (i * 0.618) % 1),
        1,
      ),
    );
    const dim = new Eased(positions.length, 0.9);
    const lit = new Eased(positions.length, 0);
    const dimAttribute = new THREE.BufferAttribute(dim.current, 1);
    const litAttribute = new THREE.BufferAttribute(lit.current, 1);
    dimAttribute.setUsage(THREE.DynamicDrawUsage);
    litAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aDim', dimAttribute);
    geometry.setAttribute('aLit', litAttribute);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: pixelRatio() },
        uTime: { value: 0 },
        uScale: { value: scale },
        uInk: { value: palette.ink.clone() },
        uAccent: { value: palette.accent.clone() },
        uOpacity: { value: 1 },
        uRing: { value: ring },
      },
      vertexShader: POINT_VERTEX,
      fragmentShader: POINT_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    world.add(points);
    return { geometry, material, dim, lit, dimAttribute, litAttribute };
  };

  // The article sidebar is close-up and small: quieter points.
  const pointScale = options.mode === 'article' ? 18 : 30;
  const posts = makePoints(
    data.posts.map((p) => p.position),
    data.posts.map(() => 34),
    1,
    pointScale,
  );
  const topics = makePoints(
    data.topics.map((t) => t.position),
    data.topics.map((t) => 12 + Math.min(14, t.count * 3)),
    0,
    pointScale,
  );

  /* Lines: article → topic threads, and territory bridges --------------- */
  const linePositions: number[] = [];
  data.links.forEach(([post, topic]) => {
    linePositions.push(
      ...data.posts[post].position,
      ...data.topics[topic].position,
    );
  });
  const bridgeStart = linePositions.length / 3;
  data.bridges.forEach(([a, b]) => {
    const from = v3(data.territories[a].position);
    const to = v3(data.territories[b].position);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += from.distanceTo(to) * 0.18;
    const samples = new THREE.QuadraticBezierCurve3(from, mid, to).getPoints(
      24,
    );
    for (let i = 0; i < samples.length - 1; i += 1) {
      linePositions.push(...samples[i].toArray(), ...samples[i + 1].toArray());
    }
  });
  const vertexCount = linePositions.length / 3;
  const lineAlpha = new Eased(vertexCount, 0);
  const lineLit = new Eased(vertexCount, 0);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(linePositions, 3),
  );
  const lineAlphaAttribute = new THREE.BufferAttribute(lineAlpha.current, 1);
  const lineLitAttribute = new THREE.BufferAttribute(lineLit.current, 1);
  lineAlphaAttribute.setUsage(THREE.DynamicDrawUsage);
  lineLitAttribute.setUsage(THREE.DynamicDrawUsage);
  lineGeometry.setAttribute('aAlpha', lineAlphaAttribute);
  lineGeometry.setAttribute('aLit', lineLitAttribute);
  const lineMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uInk: { value: palette.ink.clone() },
      uAccent: { value: palette.accent.clone() },
    },
    vertexShader: LINE_VERTEX,
    fragmentShader: LINE_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  world.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  /* Ambient dust: a far shell so the space has depth --------------------- */
  const dustCount = compact ? 2500 : 6000;
  const random = mulberry32(7091);
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  const dustSize = new Float32Array(dustCount);
  const dustTone = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i += 1) {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const r = 18 + Math.pow(random(), 0.6) * 48;
    const s = Math.sqrt(1 - u * u);
    dustPositions.set(
      [Math.cos(theta) * s * r, u * r * 0.6, Math.sin(theta) * s * r],
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

  /* Post-processing ------------------------------------------------------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.2);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH_SHADER);
  finish.uniforms.uEdge.value = 1;
  composer.addPass(finish);

  const pointMaterials = [posts.material, topics.material];
  const applyPalette = () => {
    renderer.setClearColor(palette.background, 1);
    cores.forEach(({ material }) => {
      material.uniforms.uBase.value.copy(palette.coreBase);
      material.uniforms.uRim.value.copy(palette.accent);
      material.uniforms.uInk.value.copy(palette.ink);
      material.uniforms.uDark.value = palette.dark ? 1 : 0;
    });
    const blending = palette.dark
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    [...pointMaterials, dustMaterial, lineMaterial].forEach((material) => {
      material.uniforms.uInk.value.copy(palette.ink);
      material.uniforms.uAccent.value.copy(palette.accent);
      material.blending = blending;
      material.needsUpdate = true;
    });
    dustUniforms.uOpacity.value = palette.dark ? 0.55 : 0.7;
    dustUniforms.uSizeScale.value = palette.dark ? 1 : 1.3;
    bloom.enabled = palette.dark && !compact;
    finish.uniforms.uGrain.value = palette.dark ? 0.06 : 0.035;
    srgbVector(palette.background, finish.uniforms.uBg.value as THREE.Vector3);
  };
  applyPalette();

  /* Labels: HTML projected over the canvas -------------------------------- */
  const layer = options.labelLayer;
  layer.replaceChildren();
  const territoryLabels = data.territories.map((territory, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'universe-label universe-label--territory pointer-events-auto absolute top-0 left-0 text-left';
    const name = document.createElement('span');
    name.className =
      'block text-sm font-semibold tracking-tight text-gray-950 dark:text-gray-50';
    name.textContent = territory.label;
    const meta = document.createElement('span');
    meta.className = 'type-meta block text-gray-600 dark:text-gray-400';
    meta.textContent = options.countLabel(territory.articles);
    button.append(name, meta);
    button.addEventListener('click', () => activateTerritory(i));
    layer.appendChild(button);
    return button;
  });

  const labelSizes = new WeakMap<HTMLElement, { w: number; h: number }>();
  type Floating = { el: HTMLAnchorElement; item: UniverseItem | null };
  const floatingPool: Floating[] = Array.from(
    { length: MAX_POST_LABELS + MAX_TOPIC_LABELS + 1 },
    () => {
      const el = document.createElement('a');
      el.className =
        'universe-label universe-label--item pointer-events-auto absolute top-0 left-0 max-w-56';
      el.style.opacity = '0';
      el.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        const href = el.dataset.href;
        if (href) callbacks.onOpen(href);
      });
      layer.appendChild(el);
      return { el, item: null };
    },
  );

  const itemHref = (item: UniverseItem) =>
    item.kind === 'post'
      ? data.posts[item.index].href
      : item.kind === 'topic'
        ? data.topics[item.index].href
        : data.territories[item.index].href;

  const setFloating = (slot: Floating, item: UniverseItem | null) => {
    if (slot.item?.kind === item?.kind && slot.item?.index === item?.index) {
      return;
    }
    slot.item = item;
    labelSizes.delete(slot.el);
    if (!item || item.kind === 'territory') {
      slot.el.style.opacity = '0';
      slot.el.tabIndex = -1;
      return;
    }
    const href = itemHref(item);
    slot.el.dataset.href = href;
    slot.el.href = options.localize(href);
    slot.el.tabIndex = 0;
    if (item.kind === 'post') {
      const post = data.posts[item.index];
      slot.el.dataset.kind = 'post';
      slot.el.innerHTML = '';
      const date = document.createElement('span');
      date.className = 'type-meta block text-primary-700 dark:text-primary-400';
      date.textContent = post.date.replaceAll('-', '.');
      const title = document.createElement('span');
      title.className =
        'type-editorial block text-base leading-snug text-gray-900 dark:text-gray-100';
      title.textContent = post.title;
      slot.el.append(date, title);
    } else {
      slot.el.dataset.kind = 'topic';
      slot.el.innerHTML = '';
      const name = document.createElement('span');
      name.className = 'type-meta block text-gray-700 dark:text-gray-300';
      name.textContent = `# ${data.topics[item.index].label}`;
      slot.el.append(name);
    }
  };

  /* State: focus, hover, search ------------------------------------------- */
  let focused = options.initialFocus
    ? data.territories.findIndex((t) => t.key === options.initialFocus)
    : -1;
  let hovered: UniverseItem | null = null;
  /** Lit without the pointer: the article a page is about. */
  let pinned: UniverseItem | null = null;
  let query = '';
  let matches = { posts: new Set<number>(), topics: new Set<number>() };

  const postTerritoryIdx = data.posts.map((post) =>
    post.territories
      .map((key) => data.territories.findIndex((t) => t.key === key))
      .filter((i) => i >= 0),
  );
  const topicTerritoryIdx = data.topics.map((topic) =>
    data.territories.findIndex((t) => t.key === topic.territory),
  );
  const postTopics = data.posts.map(() => new Set<number>());
  const topicPosts = data.topics.map(() => new Set<number>());
  data.links.forEach(([p, t]) => {
    postTopics[p].add(t);
    topicPosts[t].add(p);
  });

  const inFocus = (territories: number[]) =>
    focused < 0 || territories.includes(focused);

  /** Recompute every target from focus + hover + search. */
  const retarget = () => {
    const searching = query.length > 0;
    const lit = hovered ?? pinned;
    const hoverPost = lit?.kind === 'post' ? lit.index : -1;
    const hoverTopic = lit?.kind === 'topic' ? lit.index : -1;
    const hoverTerritory = lit?.kind === 'territory' ? lit.index : -1;

    data.posts.forEach((_, i) => {
      const own = inFocus(postTerritoryIdx[i]);
      const hit = searching && matches.posts.has(i);
      const touched =
        i === hoverPost || (hoverTopic >= 0 && topicPosts[hoverTopic].has(i));
      posts.dim.target[i] = searching
        ? hit
          ? 1
          : 0.12
        : touched || own
          ? 1
          : 0.14;
      posts.lit.target[i] = touched || hit ? 1 : 0;
    });
    data.topics.forEach((_, i) => {
      const own = inFocus([topicTerritoryIdx[i]]);
      const hit = searching && matches.topics.has(i);
      const touched =
        i === hoverTopic || (hoverPost >= 0 && postTopics[hoverPost].has(i));
      topics.dim.target[i] = searching
        ? hit
          ? 1
          : 0.1
        : touched
          ? 1
          : own
            ? 0.75
            : 0.12;
      topics.lit.target[i] = touched || hit ? 1 : 0;
    });
    data.links.forEach(([p, t], i) => {
      const touched =
        p === hoverPost ||
        t === hoverTopic ||
        (searching && (matches.posts.has(p) || matches.topics.has(t)));
      const own = focused >= 0 && postTerritoryIdx[p].includes(focused);
      const alpha = touched ? 0.85 : own ? 0.3 : focused >= 0 ? 0.03 : 0.1;
      lineAlpha.target[i * 2] = alpha;
      lineAlpha.target[i * 2 + 1] = alpha;
      lineLit.target[i * 2] = touched ? 1 : 0;
      lineLit.target[i * 2 + 1] = touched ? 1 : 0;
    });
    let vertex = bridgeStart;
    data.bridges.forEach(([a, b]) => {
      const touched =
        hoverTerritory === a ||
        hoverTerritory === b ||
        focused === a ||
        focused === b;
      for (let s = 0; s < 48; s += 1) {
        lineAlpha.target[vertex] = touched ? 0.5 : searching ? 0.04 : 0.16;
        lineLit.target[vertex] = touched ? 1 : 0;
        vertex += 1;
      }
    });
    data.territories.forEach((_, i) => {
      energy.target[i] = i === focused || i === hoverTerritory ? 1 : 0;
      coreScale.target[i] = focused < 0 || i === focused ? 1 : 0.4;
      const articleHome =
        pinned?.kind === 'post' && postTerritoryIdx[pinned.index].includes(i);
      territoryLabels[i].dataset.state =
        options.mode === 'article' && !articleHome && i !== hoverTerritory
          ? 'hidden'
          : i === focused
            ? 'focused'
            : focused >= 0
              ? 'dim'
              : 'idle';
    });

    // Floating labels: hovered item first, then the focused territory's
    // newest articles and biggest topics.
    const wanted: UniverseItem[] = [];
    if (hovered && hovered.kind !== 'territory') wanted.push(hovered);
    if (pinned?.kind === 'post') {
      // The page's own article, then the topics it carries.
      wanted.push(pinned);
      [...postTopics[pinned.index]]
        .slice(0, MAX_TOPIC_LABELS)
        .forEach((index) => wanted.push({ kind: 'topic', index }));
    }
    if (searching) {
      [...matches.posts]
        .slice(0, MAX_POST_LABELS)
        .forEach((index) => wanted.push({ kind: 'post', index }));
      [...matches.topics]
        .slice(0, MAX_TOPIC_LABELS)
        .forEach((index) => wanted.push({ kind: 'topic', index }));
    } else if (focused >= 0) {
      data.posts
        .map((_, index) => index)
        .filter((index) => postTerritoryIdx[index].includes(focused))
        .slice(0, MAX_POST_LABELS)
        .forEach((index) => wanted.push({ kind: 'post', index }));
      data.topics
        .map((topic, index) => ({ topic, index }))
        .filter(({ index }) => topicTerritoryIdx[index] === focused)
        .sort((a, b) => b.topic.count - a.topic.count)
        .slice(0, MAX_TOPIC_LABELS)
        .forEach(({ index }) => wanted.push({ kind: 'topic', index }));
    }
    const unique = wanted.filter(
      (item, i) =>
        wanted.findIndex(
          (other) => other.kind === item.kind && other.index === item.index,
        ) === i,
    );
    floatingPool.forEach((slot, i) => setFloating(slot, unique[i] ?? null));
    requestRender();
  };

  /* Camera, controls, flights --------------------------------------------- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.55;
  const circles = options.mode === 'explore' || options.mode === 'article';
  controls.autoRotate = motion && circles;
  controls.autoRotateSpeed = options.mode === 'article' ? 0.8 : 0.35;
  if (coarse) {
    // One finger should still scroll the page; taps still select.
    controls.enabled = false;
    renderer.domElement.style.touchAction = 'pan-y';
  }

  let idleTimer = 0;
  const onControlStart = () => {
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
  };
  const onControlEnd = () => {
    window.clearTimeout(idleTimer);
    if (motion && circles) {
      idleTimer = window.setTimeout(() => {
        controls.autoRotate = focused < 0;
      }, 6000);
    }
  };
  controls.addEventListener('start', onControlStart);
  controls.addEventListener('end', onControlEnd);
  controls.addEventListener('change', () => requestRender());

  const flight = {
    active: false,
    start: 0,
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    fromCamera: new THREE.Vector3(),
    toCamera: new THREE.Vector3(),
  };

  /** Look at a territory from outside the universe, so others sit behind. */
  const outward = (position: Vec3) => {
    const direction = v3(position);
    if (direction.lengthSq() < 1) return new THREE.Vector3(0, 0.35, 1);
    direction.normalize();
    direction.y = Math.max(direction.y, 0) + 0.35;
    return direction.normalize();
  };

  const flyTo = (
    target: THREE.Vector3,
    span: number,
    shift = 0,
    prefer?: THREE.Vector3,
  ) => {
    const direction = camera.position.clone().sub(controls.target).normalize();
    if (direction.lengthSq() < 0.5) direction.set(0, 0.3, 1).normalize();
    // Lean toward the preferred side without a jarring swing.
    if (prefer) direction.lerp(prefer, 0.7).normalize();
    // Keep a little elevation so the territory is seen against its dust.
    direction.y = Math.max(direction.y, 0.22);
    direction.normalize();
    // Shift sideways (screen right) so a panel can sit beside the subject.
    const right = new THREE.Vector3()
      .crossVectors(new THREE.Vector3(0, 1, 0), direction)
      .normalize();
    flight.fromTarget.copy(controls.target);
    flight.toTarget.copy(target).addScaledVector(right, shift);
    flight.fromCamera.copy(camera.position);
    flight.toCamera.copy(flight.toTarget).addScaledVector(direction, span);
    flight.start = performance.now();
    flight.active = true;
    if (!motion) {
      controls.target.copy(flight.toTarget);
      camera.position.copy(flight.toCamera);
      flight.active = false;
    }
    requestRender();
  };

  const overviewSpan = () => (compact ? 56 : 29);
  const focusSpan = (i: number) =>
    (compact ? 20 : 16) + data.territories[i].size * 3;
  /** Room for the explore panel on the right of wide stages. */
  const panelShift = (i: number) =>
    options.mode === 'explore' && width >= 1024 ? focusSpan(i) * 0.3 : 0;

  const focus = (key: KnowledgeNodeKey | null) => {
    const next = key ? data.territories.findIndex((t) => t.key === key) : -1;
    focused = next;
    pinned = null;
    controls.autoRotate = motion && options.mode === 'explore' && next < 0;
    if (next >= 0) {
      flyTo(
        v3(data.territories[next].position),
        focusSpan(next),
        panelShift(next),
        outward(data.territories[next].position),
      );
    } else {
      flyTo(new THREE.Vector3(), overviewSpan());
    }
    callbacks.onFocus(next >= 0 ? data.territories[next].key : null);
    retarget();
  };

  function activateTerritory(i: number) {
    const key = data.territories[i].key;
    if (options.mode !== 'explore') {
      if (i !== focused) callbacks.onOpen(data.territories[i].href);
      return;
    }
    focus(i === focused ? null : key);
  }

  /* Picking --------------------------------------------------------------- */
  let width = 1;
  let height = 1;
  const projected = new THREE.Vector3();
  const toScreen = (position: Vec3 | THREE.Vector3, out: THREE.Vector3) => {
    if (Array.isArray(position)) out.set(position[0], position[1], position[2]);
    else out.copy(position);
    world.localToWorld(out);
    out.project(camera);
    out.set(((out.x + 1) / 2) * width, ((1 - out.y) / 2) * height, out.z);
    return out;
  };

  const pickAt = (x: number, y: number): UniverseItem | null => {
    const best: { item: UniverseItem | null; score: number } = {
      item: null,
      score: Infinity,
    };
    const consider = (item: UniverseItem, p: Vec3, radius: number) => {
      toScreen(p, projected);
      if (projected.z > 1) return;
      const d = Math.hypot(projected.x - x, projected.y - y);
      if (d < radius && d < best.score) {
        best.score = d;
        best.item = item;
      }
    };
    data.posts.forEach((post, index) => {
      if (posts.dim.current[index] > 0.3)
        consider({ kind: 'post', index }, post.position, 16);
    });
    data.topics.forEach((topic, index) => {
      if (topics.dim.current[index] > 0.3)
        consider({ kind: 'topic', index }, topic.position, 10);
    });
    data.territories.forEach((territory, index) => {
      // Core radius on screen, from its world size at this depth.
      toScreen(territory.position, projected);
      const edge = toScreen(
        [
          territory.position[0] + territory.size,
          territory.position[1],
          territory.position[2],
        ],
        new THREE.Vector3(),
      );
      const r = Math.max(18, Math.abs(edge.x - projected.x) * 1.2);
      consider({ kind: 'territory', index }, territory.position, r);
    });
    return best.item;
  };

  const sameItem = (a: UniverseItem | null, b: UniverseItem | null) =>
    a?.kind === b?.kind && a?.index === b?.index;

  const setHovered = (item: UniverseItem | null) => {
    if (sameItem(item, hovered)) return;
    hovered = item;
    renderer.domElement.style.cursor = item ? 'pointer' : 'grab';
    callbacks.onHover(item);
    retarget();
  };

  const local = (event: PointerEvent | MouseEvent) => {
    const rect = host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  let down: { x: number; y: number } | null = null;
  const onPointerDown = (event: PointerEvent) => {
    down = local(event);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.buttons) return;
    if (isTextTarget(event.target, event.clientX, event.clientY)) {
      setHovered(null);
      return;
    }
    const { x, y } = local(event);
    setHovered(pickAt(x, y));
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = down;
    down = null;
    if (!start) return;
    const { x, y } = local(event);
    if (Math.hypot(x - start.x, y - start.y) > 6) return;
    const item = pickAt(x, y);
    if (!item) {
      if (options.mode === 'explore' && focused >= 0) focus(null);
      return;
    }
    if (item.kind === 'territory') activateTerritory(item.index);
    else callbacks.onOpen(itemHref(item));
  };
  const onPointerLeave = () => setHovered(null);
  const onWheel = (event: WheelEvent) => {
    // Plain wheel scrolls the page; pinch / ctrl + wheel zooms the space.
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const span = camera.position.distanceTo(controls.target);
    const next = THREE.MathUtils.clamp(
      span * Math.exp(event.deltaY * 0.01),
      6,
      80,
    );
    camera.position.sub(controls.target).setLength(next).add(controls.target);
    requestRender();
  };

  const canvas = renderer.domElement;
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  /* Search ---------------------------------------------------------------- */
  const search = (raw: string) => {
    query = raw.trim().toLowerCase();
    if (query) pinned = null;
    matches = { posts: new Set(), topics: new Set() };
    if (query) {
      data.posts.forEach((post, i) => {
        if (post.title.toLowerCase().includes(query)) matches.posts.add(i);
      });
      data.topics.forEach((topic, i) => {
        if (topic.label.toLowerCase().includes(query)) {
          matches.topics.add(i);
          topicPosts[i].forEach((p) => matches.posts.add(p));
        }
      });
      // Fly to the centre of what matched.
      const hits = [
        ...[...matches.posts].map((i) => data.posts[i].position),
        ...[...matches.topics].map((i) => data.topics[i].position),
      ];
      if (hits.length) {
        const centre = hits
          .reduce((sum, p) => sum.add(v3(p)), new THREE.Vector3())
          .divideScalar(hits.length);
        const spread = Math.max(
          ...hits.map((p) => v3(p).distanceTo(centre)),
          2,
        );
        controls.autoRotate = false;
        flyTo(centre, Math.min(overviewSpan(), 8 + spread * 2.4));
      }
    } else if (focused < 0) {
      flyTo(new THREE.Vector3(), overviewSpan());
    } else {
      flyTo(
        v3(data.territories[focused].position),
        focusSpan(focused),
        panelShift(focused),
      );
    }
    retarget();
    return matches.posts.size + matches.topics.size;
  };

  /* Loop ------------------------------------------------------------------ */
  let frame = 0;
  let started = 0;
  /**
   * The entry clock starts when the stage is first on screen, so a stage
   * scrolled into view later (the article sidebar) still gets its arrival.
   */
  let entryStart = 0;
  let entryDone = !motion;
  let readyFired = false;
  let visible = true;
  const entryFrom = new THREE.Vector3(0, 34, 120);
  const entryTo = new THREE.Vector3();

  const edgeProbe = new THREE.Vector3();
  type Box = { x: number; y: number; w: number; h: number };
  /** Label sizes, measured once per content change (not every frame). */
  const measure = (el: HTMLElement) => {
    let size = labelSizes.get(el);
    if (!size) {
      size = { w: el.offsetWidth, h: el.offsetHeight };
      labelSizes.set(el, size);
    }
    return size;
  };
  const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const placeLabels = () => {
    const taken: Box[] = [];
    const place = (
      el: HTMLElement,
      p: Vec3,
      dx: number,
      fade: number,
      avoid = false,
    ) => {
      toScreen(p, projected);
      const behind = projected.z > 1;
      const outside =
        projected.x < -40 ||
        projected.y < -40 ||
        projected.x > width + 40 ||
        projected.y > height + 40;
      if (behind || outside) {
        el.style.visibility = 'hidden';
        return;
      }
      const size = measure(el);
      // Flip to the left of the point when the label would leave the stage.
      const flip = projected.x + dx + size.w > width - 4;
      const box = {
        x: flip ? Math.max(4, projected.x - dx - size.w) : projected.x + dx,
        y: projected.y - 10,
        ...size,
      };
      // First placed wins: the article in view and the hovered item, then
      // territories, then the rest.
      const blocked = avoid && taken.some((other) => overlaps(box, other));
      el.style.visibility = 'visible';
      el.style.transform = `translate3d(${Math.round(box.x)}px, ${Math.round(box.y)}px, 0)`;
      el.style.opacity = blocked ? '0' : String(fade);
      el.style.pointerEvents = blocked ? 'none' : '';
      if (!blocked) taken.push(box);
    };
    const primary = (slot: Floating) =>
      sameItem(slot.item, hovered) || sameItem(slot.item, pinned);
    const placeFloating = (slot: Floating) => {
      if (!slot.item || slot.item.kind === 'territory') return;
      const p =
        slot.item.kind === 'post'
          ? data.posts[slot.item.index].position
          : data.topics[slot.item.index].position;
      place(slot.el, p, 12, 1, true);
    };
    floatingPool.filter(primary).forEach(placeFloating);
    data.territories.forEach((territory, i) => {
      const state = territoryLabels[i].dataset.state;
      if (state === 'hidden') {
        territoryLabels[i].style.visibility = 'hidden';
        return;
      }
      const fade = state === 'dim' ? 0.45 : 1;
      // Clear the core by its radius on screen, which depends on depth.
      toScreen(territory.position, projected);
      const centreX = projected.x;
      const rim = toScreen(
        [
          territory.position[0] + territory.size * 1.35,
          territory.position[1],
          territory.position[2],
        ],
        edgeProbe,
      );
      const radius = Math.abs(rim.x - centreX);
      place(territoryLabels[i], territory.position, radius + 10, fade, true);
    });
    floatingPool.filter((slot) => !primary(slot)).forEach(placeFloating);
  };

  const tick = (now: number) => {
    frame = 0;
    if (!started) started = now;
    // The entry starts the first time the stage is actually on screen, then
    // runs on wall-clock time, whatever the frame rate.
    if (!entryDone && !entryStart) {
      const rect = host.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) entryStart = now;
    }
    const time = motion ? (now - started) / 1000 : 0;

    // Entry: arrive from far out while nothing else moves the camera.
    if (!entryDone && !flight.active) {
      const entry = entryStart
        ? easeOut(clamp01((now - entryStart) / ENTRY_MS))
        : 0;
      camera.position.lerpVectors(entryFrom, entryTo, entry);
      if (entry >= 1) entryDone = true;
    } else if (!entryDone) {
      // A flight took over the camera; the entry has nothing left to do.
      entryDone = true;
    }

    if (flight.active) {
      const t = easeOut(clamp01((now - flight.start) / FLY_MS));
      controls.target.lerpVectors(flight.fromTarget, flight.toTarget, t);
      camera.position.lerpVectors(flight.fromCamera, flight.toCamera, t);
      if (t >= 1) flight.active = false;
    }
    controls.update();

    cores.forEach(({ mesh, material }, i) => {
      material.uniforms.uTime.value = time + i * 3.1;
      material.uniforms.uEnergy.value = energy.current[i];
      mesh.scale.setScalar(data.territories[i].size * coreScale.current[i]);
      mesh.rotation.y += motion ? 0.0015 : 0;
    });
    posts.material.uniforms.uTime.value = time;
    topics.material.uniforms.uTime.value = time;
    dustUniforms.uTime.value = time;
    finish.uniforms.uTime.value = time;

    let moving = energy.step(0.08);
    moving = coreScale.step(0.08) || moving;
    moving = posts.dim.step(0.12) || moving;
    moving = posts.lit.step(0.15) || moving;
    moving = topics.dim.step(0.12) || moving;
    moving = topics.lit.step(0.15) || moving;
    moving = lineAlpha.step(0.12) || moving;
    moving = lineLit.step(0.15) || moving;
    posts.dimAttribute.needsUpdate = true;
    posts.litAttribute.needsUpdate = true;
    topics.dimAttribute.needsUpdate = true;
    topics.litAttribute.needsUpdate = true;
    lineAlphaAttribute.needsUpdate = true;
    lineLitAttribute.needsUpdate = true;

    scene.updateMatrixWorld();
    placeLabels();
    composer.render();

    if (!readyFired) {
      readyFired = true;
      callbacks.onReady();
    }

    if (motion || moving || flight.active) requestRender();
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
    requestRender();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
  });
  intersection.observe(host);
  const onVisibility = () => {
    requestRender();
  };
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

  /* Start ----------------------------------------------------------------- */
  const initialPostIndex = options.initialPost
    ? data.posts.findIndex((post) => post.href === options.initialPost)
    : -1;
  if (initialPostIndex >= 0) {
    // An article's own map, or arriving from one: its star, lit with its
    // threads, seen from outside the universe.
    const position = data.posts[initialPostIndex].position;
    const target = v3(position);
    controls.target.copy(target);
    entryTo
      .copy(outward(position))
      .multiplyScalar(options.mode === 'article' ? 9 : 14)
      .add(target);
    controls.autoRotate = motion && options.mode === 'article';
    pinned = { kind: 'post', index: initialPostIndex };
  } else if (focused >= 0) {
    const target = v3(data.territories[focused].position);
    controls.target.copy(target);
    entryTo
      .copy(outward(data.territories[focused].position))
      .multiplyScalar(focusSpan(focused))
      .add(target);
    controls.autoRotate = false;
  } else {
    controls.target.set(0, 0, 0);
    entryTo.set(0, 0.32, 1).normalize().multiplyScalar(overviewSpan());
  }
  camera.position.copy(motion ? entryFrom : entryTo);
  camera.lookAt(controls.target);
  resize();
  retarget();
  requestRender();

  return {
    focus,
    search,
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
      canvas.removeEventListener('wheel', onWheel);
      controls.dispose();
      layer.replaceChildren();
      coreGeometry.dispose();
      cores.forEach(({ material }) => material.dispose());
      [posts, topics].forEach(({ geometry, material }) => {
        geometry.dispose();
        material.dispose();
      });
      lineGeometry.dispose();
      lineMaterial.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
