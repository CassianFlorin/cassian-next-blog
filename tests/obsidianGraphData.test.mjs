import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildObsidianGraph } from '../lib/obsidianGraph.mjs';

const vaultRoot = mkdtempSync(join(tmpdir(), 'obsidian-graph-'));

mkdirSync(join(vaultRoot, 'Public'), { recursive: true });
mkdirSync(join(vaultRoot, 'Private'), { recursive: true });

writeFileSync(
  join(vaultRoot, 'Public', 'Index.md'),
  `---
title: Knowledge Index
publish: true
tags:
  - Graph
---

# Knowledge Index

This links to [[Second Note|a friend]] and [[Missing Note]].

#inline-tag
`,
);

writeFileSync(
  join(vaultRoot, 'Public', 'Second Note.md'),
  `---
graph: true
aliases:
  - Friend Note
tags: [Second]
---

Back to [[Index]] and embedded ![[Diagram]].
`,
);

writeFileSync(
  join(vaultRoot, 'Private', 'Hidden.md'),
  `---
publish: false
tags: [Secret]
---

[[Index]]
`,
);

const graph = buildObsidianGraph({ vaultRoot });
const nodeIds = graph.nodes.map((node) => node.id).sort();
const edgeIds = graph.links
  .map((link) => `${link.source}->${link.target}:${link.type}`)
  .sort();

assert.deepEqual(nodeIds, [
  'obsidian:public/index',
  'obsidian:public/second-note',
  'tag:graph',
  'tag:inline-tag',
  'tag:second',
]);

assert.deepEqual(edgeIds, [
  'obsidian:public/index->obsidian:public/second-note:wikilink',
  'obsidian:public/index->tag:graph:has-tag',
  'obsidian:public/index->tag:inline-tag:has-tag',
  'obsidian:public/second-note->obsidian:public/index:wikilink',
  'obsidian:public/second-note->tag:second:has-tag',
]);

const indexNode = graph.nodes.find(
  (node) => node.id === 'obsidian:public/index',
);
assert.equal(indexNode?.label, 'Knowledge Index');
assert.equal(indexNode?.href, '#obsidian-public-index');

assert.equal(
  graph.nodes.some((node) => node.id.includes('hidden')),
  false,
  'notes without publish:true or graph:true should stay private',
);

assert.equal(
  graph.nodes.some((node) => node.label === 'Missing Note'),
  false,
  'unpublished missing wikilink targets should not create public nodes',
);

console.log('obsidianGraphData tests passed');
