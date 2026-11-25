import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tempDir = mkdtempSync(join(tmpdir(), 'work-scene-'));
const outfile = join(tempDir, 'workScene.mjs');

try {
  esbuild.buildSync({
    entryPoints: [join(root, 'lib/workScene.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    alias: { '@': root },
  });
  const { buildWorkScene } = await import(pathToFileURL(outfile).href);

  const project = (id, caseStudy, territories) => ({
    id,
    title: id,
    href: `/projects/${id}`,
    tagline: `${id} tagline`,
    status: 'active',
    tech: ['Swift', 'Rust'],
    territories,
    caseStudy,
  });
  const scene = buildWorkScene(
    [
      project('tool', false, ['tools']),
      project('alpha', true, ['ai-agent', 'tools']),
      project('beta', true, ['languages']),
    ],
    (key) => `label:${key}`,
  );

  // Case studies come first and are larger than other work.
  assert.deepEqual(
    scene.projects.map((p) => p.id),
    ['alpha', 'beta', 'tool'],
  );
  assert.ok(scene.projects[0].size > scene.projects[2].size);

  // Every referenced territory appears once, labelled and linked.
  assert.deepEqual(scene.territories.map((t) => t.key).sort(), [
    'ai-agent',
    'languages',
    'tools',
  ]);
  scene.territories.forEach((t) => {
    assert.equal(t.label, `label:${t.key}`);
    assert.equal(t.href, `/knowledge/${t.key}`);
  });

  // Territory names never stack: their x positions are distinct and spaced.
  const xs = scene.territories.map((t) => t.position[0]).sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i += 1) {
    assert.ok(xs[i] - xs[i - 1] >= 3, `territory gap ${xs[i - 1]} → ${xs[i]}`);
  }

  // Every coordinate is finite.
  [...scene.projects, ...scene.territories].forEach((item) =>
    assert.ok(item.position.every(Number.isFinite), JSON.stringify(item)),
  );

  console.log('workScene: ok');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
