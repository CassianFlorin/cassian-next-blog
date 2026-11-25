import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tempDir = mkdtempSync(join(tmpdir(), 'article-scene-'));
const outfile = join(tempDir, 'articleScene.mjs');

try {
  esbuild.buildSync({
    entryPoints: [join(root, 'lib/articleScene.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    alias: { '@': root },
  });
  const { buildArticleScene, chaptersFromToc } = await import(
    pathToFileURL(outfile).href
  );

  const h = (depth, value) => ({
    depth,
    value,
    url: `#${value.toLowerCase().replace(/\s+/g, '-')}`,
  });

  // A lone top heading that repeats the title is skipped; the next level
  // with two or more entries becomes the chapters, and deeper headings count
  // towards the chapter above them.
  const chapters = chaptersFromToc([
    h(1, 'Title'),
    h(2, 'Why'),
    h(3, 'Detail one'),
    h(3, 'Detail two'),
    h(2, '🎯 How'),
  ]);
  assert.deepEqual(
    chapters.map((c) => [c.label, c.id, c.weight]),
    [
      ['Why', 'why', 2],
      ['How', '🎯-how', 0],
    ],
  );

  // Percent-encoded ids are decoded to match the rendered heading ids.
  assert.equal(
    chaptersFromToc([
      { depth: 2, value: '你好', url: '#%E4%BD%A0%E5%A5%BD' },
      { depth: 2, value: '世界', url: '#世界' },
    ])[0].id,
    '你好',
  );

  // No level with two headings: no chapters.
  assert.deepEqual(chaptersFromToc([h(2, 'Only')]), []);
  assert.deepEqual(chaptersFromToc([]), []);

  // At most twelve chapters.
  assert.equal(
    chaptersFromToc(Array.from({ length: 20 }, (_, i) => h(2, `S${i}`))).length,
    12,
  );

  const scene = buildArticleScene({
    toc: [h(2, 'A'), h(2, 'B'), h(2, 'C')],
    neighbours: Array.from({ length: 8 }, (_, i) => ({
      title: `Post ${i}`,
      href: `/blog/post-${i}`,
      date: '2025-06-19T00:00:00.000Z',
    })),
    territories: [
      { label: 'One', href: '/knowledge/one' },
      { label: 'Two', href: '/knowledge/two' },
    ],
  });
  assert.equal(scene.chapters.length, 3);
  assert.equal(scene.neighbours.length, 6, 'neighbours are capped at six');
  assert.equal(scene.neighbours[0].date, '2025-06-19');
  assert.ok(scene.orbit > 3 && scene.orbit < 5);
  scene.neighbours.forEach((n) => {
    const reach = Math.hypot(n.position[0], n.position[2]);
    assert.ok(reach > scene.orbit, `${n.title} sits outside the orbit`);
  });
  // Territories sit above the core and to its right, clear of the title.
  scene.territories.forEach((t) => {
    assert.ok(t.position[1] > 4);
    assert.ok(t.position[0] >= 0);
  });

  // Deterministic between builds.
  assert.deepEqual(
    buildArticleScene({
      toc: [h(2, 'A'), h(2, 'B'), h(2, 'C')],
      neighbours: scene.neighbours,
      territories: scene.territories,
    }).neighbours.map((n) => n.position),
    scene.neighbours.map((n) => n.position),
  );

  console.log('articleScene tests passed');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
