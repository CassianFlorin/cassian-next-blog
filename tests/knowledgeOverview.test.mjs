import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tempDir = mkdtempSync(join(tmpdir(), 'knowledge-overview-'));
const outfile = join(tempDir, 'knowledge.mjs');

try {
  const lib = join(__dirname, '../lib');
  esbuild.buildSync({
    stdin: {
      contents: `export * from '${lib}/knowledgeNodes.ts';\nexport * from '${lib}/knowledgeOverview.ts';`,
      resolveDir: lib,
      loader: 'ts',
    },
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
  });

  const {
    buildKnowledgeIndex,
    buildKnowledgeOverview,
    getNodesForTags,
    isKnowledgeNodeKey,
  } = await import(pathToFileURL(outfile).href);

  const posts = [
    {
      slug: 'a',
      title: 'Agents',
      date: '2026-05-15',
      tags: ['AI', 'Agent', 'Obsidian'],
    },
    {
      slug: 'b',
      title: 'Obsidian',
      date: '2026-05-23',
      tags: ['Obsidian', '个人知识管理', 'Guide'],
    },
    { slug: 'c', title: 'Codex', date: '2026-07-27', tags: ['AI', 'Codex'] },
    { slug: 'd', title: 'Draft', tags: ['Docker'], draft: true },
    { slug: 'e', title: 'Only generic', date: '2025-01-01', tags: ['Tips'] },
  ];
  const projects = [
    { id: 'skillHub', knowledgeNodes: ['ai-agent', 'tools'] },
    { id: 'plain' },
  ];
  const notes = [
    {
      slug: 'vault/agent-note',
      title: 'Agent note',
      href: '/knowledge#obsidian-vault-agent-note',
      tags: ['Agent'],
    },
  ];

  // --- membership -------------------------------------------------------
  // Generic tags never pull an item into a territory...
  assert.deepEqual(getNodesForTags(['Obsidian', 'Guide']), [
    'knowledge-workflow',
  ]);
  // ...unless they are all it has.
  assert.equal(getNodesForTags(['Tips']).length, 1);
  assert.ok(isKnowledgeNodeKey('ai-agent'));
  assert.ok(!isKnowledgeNodeKey('ai'));

  const index = buildKnowledgeIndex({ posts, notes, projects });

  // Drafts are excluded everywhere.
  assert.equal(index.totals.articles, 4);
  assert.ok(!index.byKey.has('devops'));

  const ai = index.byKey.get('ai-agent');
  // Articles are newest first; notes are kept separately.
  assert.deepEqual(
    ai.articles.map((item) => item.slug),
    ['c', 'a'],
  );
  assert.equal(ai.notes.length, 1);
  assert.deepEqual(ai.projects, ['skillHub']);
  assert.equal(ai.articles[0].href, '/blog/c');

  // Relationships are symmetric and weighted by shared items.
  const toKnowledge = ai.related.find((r) => r.key === 'knowledge-workflow');
  assert.equal(toKnowledge?.weight, 1);
  assert.equal(
    index.byKey
      .get('knowledge-workflow')
      .related.find((r) => r.key === 'ai-agent')?.weight,
    1,
  );

  // Topics skip generic tags and are ranked by use (notes count too), with
  // ties broken by slug.
  assert.deepEqual(
    ai.topics.map((t) => [t.slug, t.count]),
    [
      ['agent', 2],
      ['ai', 2],
      ['codex', 1],
    ],
  );
  assert.ok(
    !index.nodes.some((node) => node.topics.some((t) => t.slug === 'guide')),
  );

  // --- homepage overview --------------------------------------------------
  const overview = buildKnowledgeOverview(index);
  assert.equal(overview.totals.notes, 5);
  // The largest territory takes the centre slot.
  assert.equal(overview.nodes[0].key, 'ai-agent');
  assert.deepEqual([overview.nodes[0].x, overview.nodes[0].y], [500, 316]);
  // A single shared item is not enough for an edge.
  assert.equal(overview.edges.length, 0);
  // Satellites link to tag pages.
  assert.ok(
    overview.nodes.flatMap((n) => n.tags).some((t) => t.href === '/tags/ai'),
  );

  console.log('knowledgeOverview tests passed');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
