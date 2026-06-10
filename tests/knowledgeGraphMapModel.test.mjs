import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tempDir = mkdtempSync(join(tmpdir(), 'knowledge-map-model-'));
const outfile = join(tempDir, 'knowledgeGraphMapModel.mjs');

try {
  esbuild.buildSync({
    entryPoints: [join(__dirname, '../lib/knowledgeGraphMapModel.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
  });

  const {
    buildKnowledgeMapModel,
    classifyKnowledgeNode,
    KNOWLEDGE_CATEGORIES,
  } = await import(pathToFileURL(outfile).href);

  const graphData = {
    nodes: [
      {
        id: 'post:java-roadmap',
        type: 'post',
        label: 'Java Roadmap',
        href: '/blog/java-roadmap',
        slug: 'java-roadmap',
        tags: ['Java', 'Guide', 'Agent'],
      },
      {
        id: 'post:mootool-notes',
        type: 'post',
        label: 'MooTool Contributors',
        href: '/blog/mootool-notes',
        slug: 'mootool-notes',
        tags: ['MooTool', 'Open Source'],
      },
      {
        id: 'tag:java',
        type: 'tag',
        label: 'Java',
        href: '/tags/java',
        slug: 'java',
      },
      {
        id: 'tag:agent',
        type: 'tag',
        label: 'Agent',
        href: '/tags/agent',
        slug: 'agent',
      },
      {
        id: 'tag:mootool',
        type: 'tag',
        label: 'MooTool',
        href: '/tags/mootool',
        slug: 'mootool',
      },
    ],
    links: [
      { source: 'post:java-roadmap', target: 'tag:java', type: 'has-tag' },
      { source: 'post:java-roadmap', target: 'tag:agent', type: 'has-tag' },
      { source: 'post:mootool-notes', target: 'tag:mootool', type: 'has-tag' },
    ],
  };

  assert.equal(classifyKnowledgeNode(graphData.nodes[2]), 'languages');
  assert.equal(classifyKnowledgeNode(graphData.nodes[3]), 'ai-agent');
  assert.equal(classifyKnowledgeNode(graphData.nodes[4]), 'projects');

  const model = buildKnowledgeMapModel(graphData, {
    width: 900,
    height: 620,
    compact: false,
  });

  const categoryKeys = model.nodes
    .filter((node) => node.visualType === 'category')
    .map((node) => node.categoryKey)
    .sort();
  assert.deepEqual(categoryKeys, ['ai-agent', 'languages', 'projects']);

  const categoryLabels = new Set(
    KNOWLEDGE_CATEGORIES.map((item) => item.label),
  );
  assert.equal(categoryLabels.has('Languages'), true);
  assert.equal(categoryLabels.has('AI / Agent'), true);
  assert.equal(categoryLabels.has('Projects'), true);

  const languages = model.nodes.find(
    (node) => node.id === 'category:languages',
  );
  const java = model.nodes.find((node) => node.id === 'tag:java');
  const javaPost = model.nodes.find((node) => node.id === 'post:java-roadmap');

  assert.equal(languages?.visualType, 'category');
  assert.equal(languages?.fx, languages?.x);
  assert.equal(languages?.fy, languages?.y);
  assert.equal(java?.categoryKey, 'languages');
  assert.equal(java?.visualType, 'tag');
  assert.equal(javaPost?.visualType, 'post');
  assert.equal(javaPost?.categoryKey, 'languages');
  assert.ok((languages?.weight || 0) > (java?.weight || 0));

  assert.equal(
    model.links.some(
      (link) =>
        link.type === 'category-tag' &&
        link.source === 'category:languages' &&
        link.target === 'tag:java',
    ),
    true,
  );
  assert.equal(
    model.links.some(
      (link) =>
        link.type === 'has-tag' &&
        link.source === 'post:java-roadmap' &&
        link.target === 'tag:java',
    ),
    true,
  );

  console.log('knowledgeGraphMapModel tests passed');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
