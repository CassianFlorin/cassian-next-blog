import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tempDir = mkdtempSync(join(tmpdir(), 'knowledge-universe-'));
const outfile = join(tempDir, 'knowledgeUniverse.mjs');

try {
  esbuild.buildSync({
    entryPoints: [join(root, 'lib/knowledgeUniverse.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    alias: { '@': root },
  });
  const { buildKnowledgeUniverse } = await import(pathToFileURL(outfile).href);

  const entry = (slug, tags, date) => ({
    slug,
    title: slug,
    href: `/blog/${slug}`,
    date,
    tags,
  });
  const shared = entry('bridge', ['Agent', 'Docker'], '2026-03-01');
  const nodes = [
    {
      key: 'ai-agent',
      articles: [entry('a1', ['Agent'], '2026-01-01'), shared],
      notes: [],
      topics: [
        { label: 'Agent', slug: 'agent', count: 2 },
        { label: 'Codex', slug: 'codex', count: 1 },
      ],
      projects: [],
      related: [{ key: 'devops', weight: 2 }],
    },
    {
      key: 'devops',
      articles: [shared],
      notes: [],
      topics: [{ label: 'Docker', slug: 'docker', count: 1 }],
      projects: [],
      related: [{ key: 'ai-agent', weight: 2 }],
    },
    {
      key: 'data-integration',
      articles: [],
      notes: [],
      topics: [],
      projects: [],
      related: [],
    },
  ];
  const index = {
    nodes,
    byKey: new Map(nodes.map((node) => [node.key, node])),
    totals: { articles: 2, notes: 0, topics: 3 },
  };

  const universe = buildKnowledgeUniverse(
    index,
    (key) => `label:${key}`,
    (key) => `desc:${key}`,
  );

  // Empty territories are left out; the biggest sits at the centre.
  assert.deepEqual(
    universe.territories.map((t) => t.key),
    ['ai-agent', 'devops'],
  );
  assert.deepEqual(universe.territories[0].position, [0, 0, 0]);
  assert.equal(universe.territories[0].label, 'label:ai-agent');

  // An article in two territories appears once and knows both.
  assert.equal(universe.posts.length, 2);
  const bridge = universe.posts.find((p) => p.href === '/blog/bridge');
  assert.deepEqual(bridge.territories.sort(), ['ai-agent', 'devops']);

  // Every coordinate is finite; every link points at a real post and topic.
  const finite = (v) => v.every((n) => Number.isFinite(n));
  [...universe.territories, ...universe.topics, ...universe.posts].forEach(
    (item) => assert.ok(finite(item.position), JSON.stringify(item)),
  );
  universe.links.forEach(([p, t]) => {
    assert.ok(universe.posts[p], `post ${p}`);
    assert.ok(universe.topics[t], `topic ${t}`);
  });
  // The bridging article carries both of its topics.
  const bridgeIndex = universe.posts.indexOf(bridge);
  const bridgeTopics = universe.links
    .filter(([p]) => p === bridgeIndex)
    .map(([, t]) => universe.topics[t].label)
    .sort();
  assert.deepEqual(bridgeTopics, ['Agent', 'Docker']);

  // A bridge sits between its territories, closer than either is to the other.
  const [a, b] = universe.territories.map((t) => t.position);
  const distance = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  assert.ok(distance(bridge.position, a) < distance(a, b));
  assert.ok(distance(bridge.position, b) < distance(a, b));

  // Shared writing between territories becomes one bridge, listed once.
  assert.deepEqual(universe.bridges, [[0, 1, 2]]);

  console.log('knowledgeUniverse: ok');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
