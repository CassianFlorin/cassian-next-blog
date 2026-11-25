import * as THREE from 'three';
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
import type { ArticleSceneData, Vec3 } from '@/lib/articleScene';

/**
 * An article's header scene. The article is the core; its sections circle it
 * on one tilted orbit in reading order, and the part already read is traced
 * in the accent; the writing closest to it hangs further out, threaded to
 * the core; its territories sit above.
 *
 * It lives behind the header text, so pointer input is read at the window
 * (skipping real glyphs and controls), not from the canvas. Scrolling the
 * header away flies the camera into the core while the stage fades, so the
 * body below always starts on a clean page.
 */

export interface ArticleCallbacks {
  onReady: () => void;
  /** Navigate to a site-relative href. */
  onOpen: (href: string) => void;
}

export interface ArticleOptions {
  reducedMotion: boolean;
  labelLayer: HTMLElement;
  localize: (href: string) => string;
}

export interface ArticleHandle {
  dispose: () => void;
}

const ENTRY_MS = 1600;
const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);
const pad = (value: number) => String(value).padStart(2, '0');

type Pick = { kind: 'chapter' | 'neighbour'; index: number } | null;

export function mountArticle(
  host: HTMLElement,
  data: ArticleSceneData,
  callbacks: ArticleCallbacks,
  options: ArticleOptions,
): ArticleHandle {
  const motion = !options.reducedMotion;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const pixelRatio = () => Math.min(window.devicePixelRatio, 2);

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
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  const world = new THREE.Group();
  scene.add(world);
  const random = mulberry32(7310);

  /* Cores: the article, and its territories ------------------------------ */
  const coreGeometry = new THREE.IcosahedronGeometry(1, 36);
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
    return { mesh, material, seed };
  };
  const core = makeCore([0, 0, 0], 1.05, 0.4);
  const territoryCores = data.territories.map((territory, i) =>
    makeCore(territory.position, 0.34, i * 2.1 + 1.3),
  );
  const cores = [core, ...territoryCores];

  /* Points: chapters on the orbit, neighbours further out ---------------- */
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

  const makePoints = (positions: Float32Array, sizes: number[]) => {
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(positions, 3);
    const dim = new THREE.BufferAttribute(
      new Float32Array(sizes.length).fill(0.9),
      1,
    );
    const lit = new THREE.BufferAttribute(new Float32Array(sizes.length), 1);
    dim.setUsage(THREE.DynamicDrawUsage);
    lit.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', position);
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute(
      'aSeed',
      new THREE.Float32BufferAttribute(
        sizes.map((_, i) => (i * 0.618) % 1),
        1,
      ),
    );
    geometry.setAttribute('aDim', dim);
    geometry.setAttribute('aLit', lit);
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    return { geometry, dim, lit };
  };

  // The orbit: tilted towards the viewer, spinning slowly inside the tilt.
  const orbit = new THREE.Group();
  orbit.quaternion.setFromEuler(new THREE.Euler(0.38, 0, -0.16));
  const spin = new THREE.Group();
  orbit.add(spin);
  world.add(orbit);

  const chapterCount = data.chapters.length;
  // Chapter 01 starts at the front-left and reading runs anticlockwise
  // (towards the viewer, then right) as seen from above.
  const chapterAngle = (i: number) =>
    Math.PI * 0.62 - (i / Math.max(chapterCount, 1)) * Math.PI * 2;
  const ringPoint = (angle: number, radius = data.orbit) =>
    new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

  const chapterPositions = new Float32Array(chapterCount * 3);
  data.chapters.forEach((_, i) => {
    chapterPositions.set(ringPoint(chapterAngle(i)).toArray(), i * 3);
  });
  const chapters = makePoints(
    chapterPositions,
    data.chapters.map((c) => 13 + Math.min(c.weight, 6) * 1.6),
  );
  spin.add(new THREE.Points(chapters.geometry, pointMaterial));

  const neighbourPositions = new Float32Array(data.neighbours.length * 3);
  data.neighbours.forEach((n, i) => {
    neighbourPositions.set(n.position, i * 3);
  });
  const neighbours = makePoints(
    neighbourPositions,
    data.neighbours.map(() => 17),
  );
  world.add(new THREE.Points(neighbours.geometry, pointMaterial));

  /* Lines: the orbit, the read arc, threads ------------------------------- */
  const lineMaterial = new THREE.LineBasicMaterial({
    color: palette.ink.clone(),
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const faintLineMaterial = new THREE.LineBasicMaterial({
    color: palette.ink.clone(),
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  const accentLineMaterial = new THREE.LineBasicMaterial({
    color: palette.accent.clone(),
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const litThreadMaterial = new THREE.LineBasicMaterial({
    color: palette.accent.clone(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const ringGeometry = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 129 }, (_, i) => ringPoint((i / 128) * Math.PI * 2)),
  );
  spin.add(new THREE.Line(ringGeometry, lineMaterial));

  // Read arc: from chapter 01 to the furthest chapter reached this visit.
  const arcGeometry = new THREE.BufferGeometry();
  spin.add(new THREE.Line(arcGeometry, accentLineMaterial));
  let readUpTo = -1;
  const setArc = (upTo: number) => {
    if (upTo < 0 || chapterCount === 0) {
      arcGeometry.setFromPoints([]);
      return;
    }
    const from = chapterAngle(0);
    const to = chapterAngle(upTo);
    const steps = Math.max(2, Math.ceil(Math.abs(to - from) / 0.05));
    arcGeometry.setFromPoints(
      Array.from({ length: steps + 1 }, (_, i) =>
        ringPoint(from + ((to - from) * i) / steps, data.orbit + 0.02),
      ),
    );
    arcGeometry.computeBoundingSphere();
  };

  const curve = (from: THREE.Vector3, to: THREE.Vector3, lift: number) => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += lift;
    return new THREE.QuadraticBezierCurve3(from, mid, to).getPoints(24);
  };
  const segments = (points: THREE.Vector3[]) => {
    const out: number[] = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      out.push(...points[i].toArray(), ...points[i + 1].toArray());
    }
    return out;
  };

  const neighbourThreads = data.neighbours.map((n) =>
    segments(curve(new THREE.Vector3(), v3(n.position), 1.4)),
  );
  const threadGeometry = new THREE.BufferGeometry();
  threadGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(neighbourThreads.flat(), 3),
  );
  world.add(new THREE.LineSegments(threadGeometry, faintLineMaterial));

  const territoryThreadGeometry = new THREE.BufferGeometry();
  territoryThreadGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      data.territories.flatMap((t) =>
        segments(curve(new THREE.Vector3(), v3(t.position), 0.8)),
      ),
      3,
    ),
  );
  world.add(new THREE.LineSegments(territoryThreadGeometry, lineMaterial));

  const litThreadGeometry = new THREE.BufferGeometry();
  world.add(new THREE.LineSegments(litThreadGeometry, litThreadMaterial));
  const lightThread = (index: number) => {
    litThreadGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(neighbourThreads[index] ?? [], 3),
    );
    litThreadGeometry.computeBoundingSphere();
  };

  /* Dust ------------------------------------------------------------------ */
  const dustCount = 3600;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  const dustSize = new Float32Array(dustCount);
  const dustTone = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i += 1) {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const r = 5 + Math.pow(random(), 0.7) * 34;
    const s = Math.sqrt(1 - u * u);
    dustPositions.set(
      [Math.cos(theta) * s * r, u * r * 0.5, Math.sin(theta) * s * r - 4],
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
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FINISH_SHADER);
  finish.uniforms.uEdge.value = 1;
  composer.addPass(finish);

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
    [pointMaterial, dustMaterial].forEach((material) => {
      material.uniforms.uInk.value.copy(palette.ink);
      material.uniforms.uAccent.value.copy(palette.accent);
      material.blending = blending;
      material.needsUpdate = true;
    });
    lineMaterial.color.copy(palette.ink);
    faintLineMaterial.color.copy(palette.ink);
    accentLineMaterial.color.copy(palette.accent);
    litThreadMaterial.color.copy(palette.accent);
    dustUniforms.uOpacity.value = palette.dark ? 0.55 : 0.7;
    dustUniforms.uSizeScale.value = palette.dark ? 1 : 1.3;
    finish.uniforms.uGrain.value = palette.dark ? 0.06 : 0.035;
    srgbVector(palette.background, finish.uniforms.uBg.value as THREE.Vector3);
  };
  applyPalette();

  /* Labels (decorative: the page carries the same links in text) --------- */
  const layer = options.labelLayer;
  layer.replaceChildren();
  const label = (className: string) => {
    const el = document.createElement('span');
    el.className = `article-label pointer-events-none absolute top-0 left-0 ${className}`;
    layer.appendChild(el);
    return el;
  };
  const chapterLabels = data.chapters.map((chapter, i) => {
    const el = label('article-label--chapter');
    const number = document.createElement('span');
    number.className = 'type-meta text-gray-600 dark:text-gray-400';
    number.textContent = pad(i + 1);
    const title = document.createElement('span');
    title.className =
      'article-label-title text-sm font-medium text-gray-950 dark:text-gray-50';
    title.textContent = chapter.label;
    el.append(number, title);
    return el;
  });
  const neighbourLabels = data.neighbours.map((neighbour) => {
    const el = label('article-label--neighbour');
    const date = document.createElement('span');
    date.className = 'type-meta block text-gray-500 dark:text-gray-400';
    date.textContent = neighbour.date.replaceAll('-', '.');
    const title = document.createElement('span');
    title.className =
      'article-label-title text-sm leading-snug text-gray-800 dark:text-gray-200';
    title.textContent = neighbour.title;
    el.append(date, title);
    return el;
  });
  const territoryLabels = data.territories.map((territory) => {
    const el = label('type-meta text-gray-600 dark:text-gray-400');
    el.textContent = `↗ ${territory.label}`;
    return el;
  });

  /* Camera ---------------------------------------------------------------- */
  const target = new THREE.Vector3(0, 1.1, 0);
  const rest = new THREE.Vector3(0, 4.8, 19.5);
  const entryFrom = rest.clone().sub(target).multiplyScalar(2.4).add(target);
  const inside = new THREE.Vector3(0, 1.6, 6.5);
  camera.position.copy(motion ? entryFrom : rest);
  camera.lookAt(target);

  /* Picking --------------------------------------------------------------- */
  let width = 1;
  let height = 1;
  let wide = false;
  const projected = new THREE.Vector3();
  const toScreen = (p: THREE.Vector3, out: THREE.Vector3) => {
    out.copy(p).project(camera);
    out.set(((out.x + 1) / 2) * width, ((1 - out.y) / 2) * height, out.z);
    return out;
  };
  const chapterWorld = data.chapters.map(() => new THREE.Vector3());
  const neighbourWorld = data.neighbours.map(() => new THREE.Vector3());
  const territoryWorld = data.territories.map(() => new THREE.Vector3());

  // Wide screens keep the title on the left: anything projected there is
  // dimmed with the finish pass or sits under the text, so its labels fade
  // and it is not offered for picking. The header marks its text column with
  // `data-scene-clear`; the limit is its right edge, measured on resize.
  let clearRight = 0;
  const leftLimit = () => (wide ? Math.max(width * 0.46, clearRight) : 0);

  const pointer = { x: -1, y: -1, nx: 0, ny: 0 };
  let hovered: Pick = null;
  let scrollFade = 1;
  const same = (a: Pick, b: Pick) =>
    a === b || (!!a && !!b && a.kind === b.kind && a.index === b.index);

  const setHovered = (next: Pick) => {
    if (same(next, hovered)) return;
    hovered = next;
    lightThread(hovered?.kind === 'neighbour' ? hovered.index : -1);
    document.documentElement.style.cursor = hovered ? 'pointer' : '';
    chapterLabels.forEach((el, i) => {
      el.dataset.state =
        hovered?.kind === 'chapter' && hovered.index === i ? 'lit' : 'idle';
    });
    neighbourLabels.forEach((el, i) => {
      el.dataset.state =
        hovered?.kind === 'neighbour' && hovered.index === i ? 'lit' : 'idle';
    });
    requestRender();
  };

  const pick = (event: PointerEvent): Pick => {
    const rect = host.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.nx = (pointer.x / rect.width) * 2 - 1;
    pointer.ny = (pointer.y / rect.height) * 2 - 1;
    const within =
      pointer.x >= 0 &&
      pointer.y >= 0 &&
      pointer.x <= rect.width &&
      pointer.y <= rect.height;
    if (
      !within ||
      scrollFade < 0.5 ||
      pointer.x < leftLimit() ||
      isTextTarget(event.target, event.clientX, event.clientY)
    ) {
      return null;
    }
    let best: Pick = null;
    let bestDistance = 24;
    const consider = (list: THREE.Vector3[], kind: 'chapter' | 'neighbour') => {
      list.forEach((p, index) => {
        toScreen(p, projected);
        if (projected.z > 1) return;
        const d = Math.hypot(projected.x - pointer.x, projected.y - pointer.y);
        if (d < bestDistance) {
          bestDistance = d;
          best = { kind, index };
        }
      });
    };
    consider(chapterWorld, 'chapter');
    consider(neighbourWorld, 'neighbour');
    return best;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    setHovered(pick(event));
    requestRender();
  };
  const onPointerLeave = () => setHovered(null);
  const onClick = (event: MouseEvent) => {
    if (!hovered) return;
    if (isTextTarget(event.target, event.clientX, event.clientY)) return;
    if (window.getSelection()?.toString()) return;
    if (hovered.kind === 'chapter') {
      const heading = document.getElementById(data.chapters[hovered.index].id);
      if (heading) {
        // Land the heading a little below the top edge, not flush against it.
        window.scrollTo({
          top: heading.getBoundingClientRect().top + window.scrollY - 88,
          behavior: motion ? 'smooth' : 'auto',
        });
      }
    } else {
      callbacks.onOpen(data.neighbours[hovered.index].href);
    }
  };
  if (finePointer) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('click', onClick);
  }

  /* Reading: how far into the article this visit has gone ---------------- */
  const headings: Array<HTMLElement | null> = data.chapters.map(() => null);
  const measureReading = () => {
    let reached = -1;
    for (let i = 0; i < chapterCount; i += 1) {
      headings[i] ??= document.getElementById(data.chapters[i].id);
      const top = headings[i]?.getBoundingClientRect().top;
      if (top !== undefined && top < window.innerHeight * 0.35) reached = i;
    }
    if (reached > readUpTo) {
      readUpTo = reached;
      setArc(readUpTo);
    }
  };
  let scrollQueued = false;
  const onScroll = () => {
    if (hovered && scrollFade < 0.5) setHovered(null);
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        measureReading();
      });
    }
    requestRender();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Loop ------------------------------------------------------------------ */
  let frame = 0;
  let started = 0;
  let entryStart = 0;
  let entryDone = !motion;
  let readyFired = false;
  let visible = true;
  const base = new THREE.Vector3();
  const parallax = new THREE.Vector2();
  const chapterLit = new Float32Array(chapterCount);
  const neighbourLit = new Float32Array(data.neighbours.length);

  const place = (
    el: HTMLElement,
    p: THREE.Vector3,
    dx: number,
    dy: number,
    opacity: number,
  ) => {
    toScreen(p, projected);
    const limit = leftLimit();
    // Fade labels out as they approach the title's side of the stage.
    const side = limit
      ? clamp01((projected.x - limit) / Math.max(width * 0.08, 1))
      : 1;
    const shown = opacity * side * scrollFade;
    if (projected.z > 1 || shown < 0.02) {
      el.style.visibility = 'hidden';
      return;
    }
    // Near the right edge, labels hang to the left of their point.
    const flip = projected.x > width - 240;
    el.dataset.flip = flip ? 'true' : 'false';
    el.style.visibility = 'visible';
    el.style.transform = `translate3d(${Math.round(projected.x + (flip ? -dx : dx))}px, ${Math.round(projected.y + dy)}px, 0)${flip ? ' translateX(-100%)' : ''}`;
    el.style.opacity = String(shown);
  };

  const tick = (now: number) => {
    frame = 0;
    if (!started) started = now;
    const time = motion ? (now - started) / 1000 : 0;
    const rect = host.getBoundingClientRect();

    if (!entryDone && !entryStart) {
      if (rect.bottom > 0 && rect.top < window.innerHeight) entryStart = now;
    }
    const entry = entryDone
      ? 1
      : entryStart
        ? easeOut(clamp01((now - entryStart) / ENTRY_MS))
        : 0;
    if (entry >= 1) entryDone = true;

    // Scrolling the header away flies into the core and fades the stage.
    const scrolled = clamp01(-rect.top / Math.max(rect.height, 1));
    const dive = motion ? easeOut(scrolled) : 0;
    scrollFade = 1 - clamp01(scrolled * 1.25);
    finish.uniforms.uPresence.value = scrollFade;

    base.lerpVectors(entryFrom, rest, entry).lerp(inside, dive * 0.5);
    if (motion) {
      parallax.x += (pointer.nx * 0.9 - parallax.x) * 0.04;
      parallax.y += (pointer.ny * 0.5 - parallax.y) * 0.04;
    }
    camera.position.set(base.x + parallax.x, base.y - parallax.y, base.z);
    camera.lookAt(target);

    if (motion) spin.rotation.y = time * 0.045;
    spin.updateMatrixWorld();
    world.updateMatrixWorld();

    const active = hovered;
    core.material.uniforms.uEnergy.value +=
      ((active ? 0.35 : 0.2) - core.material.uniforms.uEnergy.value) * 0.06;
    cores.forEach(({ mesh, material, seed }) => {
      material.uniforms.uTime.value = time + seed * 3;
      if (motion) mesh.rotation.y += 0.002;
    });
    territoryCores.forEach(({ material }) => {
      material.uniforms.uEnergy.value = 0.25;
    });

    data.chapters.forEach((_, i) => {
      chapterWorld[i]
        .fromArray(chapterPositions, i * 3)
        .applyMatrix4(spin.matrixWorld);
      const lit = active?.kind === 'chapter' && active.index === i;
      chapterLit[i] +=
        ((lit ? 1 : i <= readUpTo ? 0.55 : 0) - chapterLit[i]) * 0.14;
      chapters.lit.setX(i, chapterLit[i]);
      chapters.dim.setX(i, active && !lit ? 0.5 : 0.95);
      place(chapterLabels[i], chapterWorld[i], 12, -9, lit ? 1 : 0.85);
    });
    chapters.lit.needsUpdate = true;
    chapters.dim.needsUpdate = true;

    data.neighbours.forEach((n, i) => {
      neighbourWorld[i].copy(v3(n.position)).applyMatrix4(world.matrixWorld);
      const lit = active?.kind === 'neighbour' && active.index === i;
      neighbourLit[i] += ((lit ? 1 : 0) - neighbourLit[i]) * 0.14;
      neighbours.lit.setX(i, neighbourLit[i]);
      neighbours.dim.setX(i, active && !lit ? 0.45 : 0.85);
      place(neighbourLabels[i], neighbourWorld[i], 14, -10, lit ? 1 : 0.7);
    });
    neighbours.lit.needsUpdate = true;
    neighbours.dim.needsUpdate = true;

    data.territories.forEach((t, i) => {
      territoryWorld[i].copy(v3(t.position)).applyMatrix4(world.matrixWorld);
      place(territoryLabels[i], territoryWorld[i], 12, -8, 0.9);
    });

    litThreadMaterial.opacity +=
      ((active?.kind === 'neighbour' ? 0.8 : 0) - litThreadMaterial.opacity) *
      0.12;

    pointMaterial.uniforms.uTime.value = time;
    dustUniforms.uTime.value = time;
    finish.uniforms.uTime.value = time;

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
    wide = width >= 1024;
    const clear = host.parentElement
      ?.closest('header')
      ?.querySelector('[data-scene-clear]');
    clearRight = clear
      ? clear.getBoundingClientRect().right - rect.left + 16
      : 0;
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio());
    composer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    pointMaterial.uniforms.uPixelRatio.value = pixelRatio();
    dustUniforms.uPixelRatio.value = pixelRatio();
    // The title keeps the left; the scene sits to the right of centre.
    finish.uniforms.uLeft.value = wide ? 1 : 0;
    const halfWidth =
      rest.distanceTo(target) *
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
      camera.aspect;
    world.position.x = wide ? halfWidth * 0.55 : 0;
    target.x = 0;
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
  measureReading();
  requestRender();

  return {
    dispose: () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave,
      );
      document.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.style.cursor = '';
      layer.replaceChildren();
      coreGeometry.dispose();
      cores.forEach(({ material }) => material.dispose());
      [
        chapters.geometry,
        neighbours.geometry,
        ringGeometry,
        arcGeometry,
        threadGeometry,
        territoryThreadGeometry,
        litThreadGeometry,
        dustGeometry,
      ].forEach((geometry) => geometry.dispose());
      [
        pointMaterial,
        dustMaterial,
        lineMaterial,
        faintLineMaterial,
        accentLineMaterial,
        litThreadMaterial,
      ].forEach((material) => material.dispose());
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
