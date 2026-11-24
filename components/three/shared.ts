import * as THREE from 'three';

/**
 * Pieces shared by every three.js scene on the site (homepage archive,
 * knowledge universe): the token palette, the living core, star and dust
 * shaders, and the finishing pass. One visual language, one place.
 */

export interface Palette {
  dark: boolean;
  background: THREE.Color;
  ink: THREE.Color;
  accent: THREE.Color;
  coreBase: THREE.Color;
}

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/* ------------------------------------------------------------------------ */
/* Palette, resolved from the design tokens so the scene follows the theme   */
/* ------------------------------------------------------------------------ */

export function readPalette(): Palette {
  const root = document.documentElement;
  const dark = root.classList.contains('dark');
  const css = getComputedStyle(root);
  const token = (name: string, fallback: string) =>
    css.getPropertyValue(name).trim() || fallback;

  // Tokens are oklch; let the browser convert by painting one pixel.
  const probe = document.createElement('canvas').getContext('2d', {
    willReadFrequently: true,
  });
  const toRgb = (value: string): THREE.Color => {
    if (!probe) return new THREE.Color(dark ? 0x1a1a18 : 0xf7f6f2);
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = '#000';
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    return new THREE.Color().setRGB(
      r / 255,
      g / 255,
      b / 255,
      THREE.SRGBColorSpace,
    );
  };

  return {
    dark,
    background: toRgb(getComputedStyle(document.body).backgroundColor),
    ink: toRgb(
      dark
        ? token('--color-gray-200', 'oklch(0.9 0.008 85)')
        : token('--color-gray-800', 'oklch(0.3 0.008 85)'),
    ),
    accent: toRgb(
      dark
        ? token('--color-primary-400', 'oklch(0.71 0.065 160)')
        : token('--color-primary-600', 'oklch(0.52 0.065 160)'),
    ),
    coreBase: toRgb(
      dark
        ? token('--color-gray-900', 'oklch(0.21 0.006 85)')
        : token('--color-gray-100', 'oklch(0.952 0.006 85)'),
    ),
  };
}

/* ------------------------------------------------------------------------ */
/* Shaders                                                                   */
/* ------------------------------------------------------------------------ */

// Ashima simplex noise (MIT), the usual 3D variant.
export const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const CORE_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
varying vec3 vNormal;
varying vec3 vView;
varying float vDisp;
${SIMPLEX}
float disp(vec3 p){
  float slow = snoise(p * 0.75 + vec3(0.0, uTime * 0.12, 0.0));
  float fine = snoise(p * 2.2 - vec3(uTime * 0.09));
  return slow * (0.3 + uEnergy * 0.2) + fine * 0.035;
}
void main(){
  vec3 n = normalize(normal);
  vec3 t = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 b = cross(n, t);
  float e = 0.02;
  vec3 p0 = position + n * disp(position);
  vec3 q1 = position + t * e;
  vec3 q2 = position + b * e;
  q1 += normalize(q1) * disp(q1);
  q2 += normalize(q2) * disp(q2);
  vec3 dn = normalize(cross(q1 - p0, q2 - p0));
  if (dot(dn, n) < 0.0) dn = -dn;
  vNormal = normalize(normalMatrix * dn);
  vDisp = disp(position);
  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const CORE_FRAGMENT = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uRim;
uniform vec3 uInk;
uniform float uDark;
varying vec3 vNormal;
varying vec3 vView;
varying float vDisp;
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  vec3 L = normalize(vec3(-0.5, 0.8, 0.6));
  float diff = max(dot(N, L), 0.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 36.0);
  // Soft, clay-like key light; the rim carries the one accent.
  vec3 col = uBase * (0.55 + 0.45 * diff);
  col = mix(col, uInk, (1.0 - diff) * 0.08 * (1.0 - uDark));
  // Light adds up on the night page; on paper it has to be mixed in, or a
  // white core simply saturates and the accent disappears.
  float band = smoothstep(0.2, 0.42, vDisp);
  vec3 lit = col + uRim * (fres * 1.05 + band * 0.18);
  vec3 inked = mix(col, uRim, clamp(fres * 0.75 + band * 0.12, 0.0, 1.0));
  col = mix(inked, lit, uDark);
  col += vec3(spec) * mix(0.35, 0.25, uDark);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const DUST_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uEntry;
uniform float uPixelRatio;
uniform vec3 uMouse;
uniform float uMouseStrength;
uniform float uSizeScale;
attribute vec3 aStart;
attribute float aSeed;
attribute float aSize;
attribute float aTone;
varying float vTone;
varying float vAlpha;
void main(){
  float delay = aSeed * 0.3;
  float t = clamp((uEntry - delay) / 0.7, 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 3.0);
  vec3 p = mix(aStart, position, t);
  p += vec3(
    sin(uTime * 0.37 + aSeed * 41.0),
    cos(uTime * 0.29 + aSeed * 29.0),
    sin(uTime * 0.23 + aSeed * 17.0)
  ) * 0.07;
  vec3 d = p - uMouse;
  float dist = length(d);
  float push = smoothstep(3.4, 0.0, dist) * uMouseStrength;
  p += normalize(d + vec3(1e-4)) * push * 1.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uSizeScale * uPixelRatio * (34.0 / -mv.z);
  vTone = aTone;
  float twinkle = 0.75 + 0.25 * sin(uTime * 1.4 + aSeed * 63.0);
  vAlpha = t * twinkle;
}
`;

export const DUST_FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uOpacity;
varying float vTone;
varying float vAlpha;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, r), 1.7);
  gl_FragColor = vec4(mix(uInk, uAccent, vTone), a * vAlpha * uOpacity);
}
`;

export const STAR_VERTEX = /* glsl */ `
uniform float uPixelRatio;
uniform float uTime;
attribute float aHover;
attribute float aSeed;
varying float vHover;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float pulse = 1.0 + 0.08 * sin(uTime * 1.6 + aSeed * 40.0);
  gl_PointSize = (30.0 + aHover * 22.0) * pulse * uPixelRatio * (26.0 / -mv.z);
  vHover = aHover;
}
`;

export const STAR_FRAGMENT = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uInk;
uniform float uOpacity;
varying float vHover;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.13, 0.08, r);
  float ring = smoothstep(0.025, 0.0, abs(r - 0.38)) * (0.4 + 0.6 * vHover);
  float halo = pow(smoothstep(0.5, 0.0, r), 3.0) * 0.5;
  float a = max(max(core, ring), halo);
  vec3 col = mix(uAccent, uInk, core * 0.35);
  gl_FragColor = vec4(col, a * uOpacity);
}
`;

export const FINISH_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.05 },
    uBg: { value: new THREE.Vector3() },
    uPresence: { value: 1 },
    uLeft: { value: 0 },
    uEdge: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform vec3 uBg;
    uniform float uPresence;
    uniform float uLeft;
    uniform float uEdge;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // Film grain: the tactile layer the reference sites all share.
      c.rgb += (hash(vUv * 1000.0 + fract(uTime)) - 0.5) * uGrain;
      // Settle the header strip, give the hero text its left side, and step
      // the whole world back behind text-heavy chapters.
      float keep = smoothstep(1.0, 0.9, vUv.y);
      keep *= mix(1.0, smoothstep(0.04, 0.46, vUv.x), uLeft);
      // In-page stages melt into the page on every side.
      float frame = smoothstep(0.0, 0.14, vUv.y) * smoothstep(0.0, 0.05, vUv.x)
        * smoothstep(1.0, 0.95, vUv.x);
      keep *= mix(1.0, frame, uEdge);
      c.rgb = mix(uBg, c.rgb, keep * uPresence);
      gl_FragColor = c;
    }
  `,
};

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Over controls, or over actual glyphs: block boxes like an h1 span the
    whole width, so the element box says nothing about where text is. */
export function isTextTarget(target: EventTarget | null, x: number, y: number) {
  if (!(target instanceof Element)) return false;
  if (target.closest('a, button, input, select, textarea, label')) return true;
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    for (const rect of Array.from(range.getClientRects())) {
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return true;
      }
    }
  }
  return false;
}

/** sRGB triple of a color, for shaders that run after the output pass. */
export function srgbVector(color: THREE.Color, out: THREE.Vector3) {
  const srgb = { r: 0, g: 0, b: 0 };
  color.getRGB(srgb, THREE.SRGBColorSpace);
  return out.set(srgb.r, srgb.g, srgb.b);
}
