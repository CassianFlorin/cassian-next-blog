import { allBlogs } from 'contentlayer/generated';
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import obsidianGraph from '@/generated/obsidian-graph.json';
import projectsData from '@/data/projectsData';
import type { KnowledgeGraphData } from './knowledgeGraph';
import { buildKnowledgeIndex, type NodeEntry } from './knowledgeNodes';

/** Obsidian vault notes (post-type nodes in the generated graph). */
const vaultNotes = (): NodeEntry[] =>
  (obsidianGraph as KnowledgeGraphData).nodes
    .filter((node) => node.type === 'post')
    .map((node) => ({
      slug: node.slug,
      title: node.label,
      href: node.href,
      summary: node.summary,
      tags: node.tags || [],
    }));

/** The site-wide knowledge index, built from published content at render. */
export function getKnowledgeIndex() {
  return buildKnowledgeIndex({
    posts: allCoreContent(sortPosts(allBlogs)),
    notes: vaultNotes(),
    projects: projectsData,
  });
}
