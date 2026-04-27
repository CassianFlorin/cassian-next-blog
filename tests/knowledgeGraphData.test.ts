import assert from 'node:assert/strict';
import {
  buildKnowledgeGraph,
  buildLocalKnowledgeGraph,
} from '../lib/knowledgeGraph';

const posts = [
  {
    slug: 'java-guide',
    path: 'blog/java-guide',
    title: 'Java Guide',
    summary: 'A Java guide',
    tags: ['Java', 'Guide'],
    draft: false,
  },
  {
    slug: 'git-hooks',
    path: 'blog/git-hooks',
    title: 'Git Hooks',
    summary: 'Git workflow',
    tags: ['Git', 'Java'],
    draft: false,
  },
  {
    slug: 'draft-note',
    path: 'blog/draft-note',
    title: 'Draft Note',
    summary: 'Hidden',
    tags: ['Secret'],
    draft: true,
  },
];

const graph = buildKnowledgeGraph(posts);

assert.deepEqual(graph.nodes.map((node) => node.id).sort(), [
  'post:git-hooks',
  'post:java-guide',
  'tag:git',
  'tag:guide',
  'tag:java',
]);

assert.deepEqual(
  graph.links.map((link) => `${link.source}->${link.target}`).sort(),
  [
    'post:git-hooks->tag:git',
    'post:git-hooks->tag:java',
    'post:java-guide->tag:guide',
    'post:java-guide->tag:java',
  ],
);

const javaNode = graph.nodes.find((node) => node.id === 'tag:java');
assert.equal(javaNode?.href, '/tags/java');
assert.equal(javaNode?.label, 'Java');

const localGraph = buildLocalKnowledgeGraph(posts, 'java-guide');
assert.deepEqual(localGraph.nodes.map((node) => node.id).sort(), [
  'post:git-hooks',
  'post:java-guide',
  'tag:guide',
  'tag:java',
]);

assert.equal(
  localGraph.links.some(
    (link) => link.source === 'post:java-guide' && link.target === 'tag:java',
  ),
  true,
);

console.log('knowledgeGraphData tests passed');
