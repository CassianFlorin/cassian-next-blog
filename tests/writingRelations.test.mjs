import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tempDir = mkdtempSync(join(tmpdir(), 'writing-relations-'));
const outfile = join(tempDir, 'writingRelations.mjs');

try {
  esbuild.buildSync({
    entryPoints: [join(__dirname, '../lib/writingRelations.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
  });

  const { relatedArticles, relatedProjects } = await import(
    pathToFileURL(outfile).href
  );

  const post = (slug, date, tags) => ({
    slug,
    title: slug,
    path: `blog/${slug}`,
    date,
    tags,
  });
  const current = post('codegraph', '2026-05-26', [
    'AI',
    'Agent',
    'CodeGraph',
    '开发工具',
  ]);
  const posts = [
    current,
    post('agents-a', '2026-05-09', ['AI', 'Agent']), // 2 tags + territory
    post('codex', '2026-07-27', ['AI', 'Codex']), // 1 tag + territory
    post('cursor', '2026-06-01', ['Cursor']), // territory only
    post('docker', '2026-09-16', ['Docker', 'DNS']), // unrelated
    post('tips', '2026-09-17', ['Tips', 'Guide']), // generic only
  ];

  // Closest first; the article itself and unrelated posts never appear.
  assert.deepEqual(
    relatedArticles(current, posts).map((p) => p.slug),
    ['agents-a', 'codex', 'cursor'],
  );
  assert.deepEqual(
    relatedArticles(current, posts, 1).map((p) => p.slug),
    ['agents-a'],
  );
  // Rarity matters: sharing a rare tag beats sharing a common one.
  const archive = [
    post('base', '2026-01-01', ['AI', 'Obsidian']),
    post('common-1', '2026-03-01', ['AI', 'Docker']),
    post('common-2', '2026-03-02', ['AI', 'Linux']),
    post('common-3', '2026-03-03', ['AI', 'Traefik']),
    post('rare', '2026-02-01', ['Obsidian', 'Docker']),
  ];
  assert.equal(relatedArticles(archive[0], archive, 1)[0].slug, 'rare');

  // Generic tags alone do not make two articles related.
  assert.deepEqual(
    relatedArticles(post('x', '2026-01-01', ['Tips']), [posts[5]]).length,
    0,
  );

  const projects = [
    { id: 'litho', knowledgeNodes: ['projects', 'languages'] },
    { id: 'databaseCli', knowledgeNodes: ['ai-agent', 'tools'] },
    { id: 'skillHub', knowledgeNodes: ['ai-agent', 'tools'] },
  ];
  const citations = new Map([['skillHub', ['codegraph']]]);

  // Citing case studies come first, then shared territories.
  assert.deepEqual(
    relatedProjects(current, projects, citations).map((r) => [
      r.project.id,
      r.reason,
    ]),
    [
      ['skillHub', 'explicit'],
      ['databaseCli', 'territory'],
    ],
  );
  assert.equal(
    relatedProjects(posts[4], projects, citations).length,
    0,
    'no shared territory, no project',
  );
  // One shared territory is not enough without a citation.
  assert.deepEqual(
    relatedProjects(
      post('sdkman', '2025-06-19', ['SDKMAN', 'Java']),
      projects,
      citations,
    ).map((r) => r.project.id),
    [],
  );

  console.log('writingRelations tests passed');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
