import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tempDir = mkdtempSync(join(tmpdir(), 'about-scene-'));
const outfile = join(tempDir, 'aboutScene.mjs');

try {
  esbuild.buildSync({
    entryPoints: [join(root, 'lib/aboutScene.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    alias: { '@': root },
  });
  const { buildAboutScene } = await import(pathToFileURL(outfile).href);

  const post = (slug, date, territories) => ({
    title: slug,
    href: `/blog/${slug}`,
    date,
    territories,
  });
  const scene = buildAboutScene({
    focus: [
      { label: 'AI', territories: ['ai-agent'] },
      { label: 'Tools', territories: ['tools'] },
      { label: 'Other', territories: ['projects'] },
    ],
    posts: [
      post('b', '2026-02-01', ['tools']),
      post('a', '2025-05-01', ['ai-agent']),
      post('c', '2026-08-01', ['devops']),
    ],
    projects: [{ title: 'P', href: '/projects/p', territories: ['tools'] }],
    roots: ['Java', 'Spring Boot'],
  });

  // Rings keep their order and count what landed on them; an article whose
  // territory no direction claims falls on the last ring.
  assert.deepEqual(
    scene.rings.map((r) => [r.label, r.count]),
    [
      ['AI', 1],
      ['Tools', 1],
      ['Other', 1],
    ],
  );
  const ringOf = (slug) =>
    scene.posts.find((p) => p.href === `/blog/${slug}`).ring;
  assert.equal(ringOf('a'), 0);
  assert.equal(ringOf('b'), 1);
  assert.equal(ringOf('c'), 2);

  // Time home: older articles sit lower on the spiral.
  const y = (slug) =>
    scene.posts.find((p) => p.href === `/blog/${slug}`).timePosition[1];
  assert.ok(y('a') < y('b') && y('b') < y('c'));

  // One year marker per year, in order.
  assert.deepEqual(
    scene.years.map((year) => year.label),
    ['2025', '2026'],
  );

  // Projects land on their direction's ring; roots sit under the core.
  assert.equal(scene.projects[0].ring, 1);
  scene.roots.forEach((r) => assert.ok(r.position[1] < -3));

  // Every coordinate is finite.
  const all = [
    ...scene.posts.flatMap((p) => [p.topicPosition, p.timePosition]),
    ...scene.projects.map((p) => p.position),
    ...scene.roots.map((r) => r.position),
    ...scene.years.map((r) => r.position),
  ];
  all.forEach((v) => assert.ok(v.every(Number.isFinite), JSON.stringify(v)));

  console.log('aboutScene: ok');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
