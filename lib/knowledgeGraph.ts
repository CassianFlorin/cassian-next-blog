import { slug as slugify } from 'github-slugger';

export type KnowledgeNodeType = 'post' | 'tag';

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  href: string;
  slug: string;
  tags?: string[];
  summary?: string;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  type: 'has-tag' | 'wikilink';
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

export interface KnowledgePost {
  slug: string;
  path?: string;
  title: string;
  summary?: string;
  tags?: string[];
  draft?: boolean;
}

const postNodeId = (postSlug: string) => `post:${postSlug}`;
const tagNodeId = (tag: string) => `tag:${slugify(tag)}`;

const isVisiblePost = (post: KnowledgePost) => post.draft !== true;

export function buildKnowledgeGraph(
  posts: KnowledgePost[],
): KnowledgeGraphData {
  const nodes = new Map<string, KnowledgeNode>();
  const links: KnowledgeLink[] = [];

  posts.filter(isVisiblePost).forEach((post) => {
    const postId = postNodeId(post.slug);
    const tags = post.tags || [];

    nodes.set(postId, {
      id: postId,
      type: 'post',
      label: post.title,
      href: `/${post.path || `blog/${post.slug}`}`,
      slug: post.slug,
      summary: post.summary,
      tags,
    });

    tags.forEach((tag) => {
      const tagId = tagNodeId(tag);
      if (!nodes.has(tagId)) {
        nodes.set(tagId, {
          id: tagId,
          type: 'tag',
          label: tag,
          href: `/tags/${slugify(tag)}`,
          slug: slugify(tag),
        });
      }

      links.push({
        source: postId,
        target: tagId,
        type: 'has-tag',
      });
    });
  });

  return {
    nodes: [...nodes.values()],
    links,
  };
}

export function buildLocalKnowledgeGraph(
  posts: KnowledgePost[],
  currentSlug: string,
): KnowledgeGraphData {
  const visiblePosts = posts.filter(isVisiblePost);
  const currentPost = visiblePosts.find((post) => post.slug === currentSlug);

  if (!currentPost) {
    return { nodes: [], links: [] };
  }

  const currentTagSlugs = new Set(
    (currentPost.tags || []).map((tag) => slugify(tag)),
  );
  const localPosts = visiblePosts.filter((post) => {
    if (post.slug === currentSlug) return true;
    return (post.tags || []).some((tag) => currentTagSlugs.has(slugify(tag)));
  });

  const allGraph = buildKnowledgeGraph(localPosts);
  const allowedTagIds = new Set(
    (currentPost.tags || []).map((tag) => tagNodeId(tag)),
  );
  const allowedPostIds = new Set(
    localPosts.map((post) => postNodeId(post.slug)),
  );

  return {
    nodes: allGraph.nodes.filter((node) =>
      node.type === 'post'
        ? allowedPostIds.has(node.id)
        : allowedTagIds.has(node.id),
    ),
    links: allGraph.links.filter(
      (link) =>
        allowedPostIds.has(link.source) && allowedTagIds.has(link.target),
    ),
  };
}

export function mergeKnowledgeGraphs(
  ...graphs: KnowledgeGraphData[]
): KnowledgeGraphData {
  const nodes = new Map<string, KnowledgeNode>();
  const links = new Map<string, KnowledgeLink>();

  graphs.forEach((graph) => {
    graph.nodes.forEach((node) => {
      if (!nodes.has(node.id)) {
        nodes.set(node.id, { ...node });
      }
    });

    graph.links.forEach((link) => {
      const source = resolveLinkId(link.source);
      const target = resolveLinkId(link.target);
      const key = `${source}->${target}:${link.type}`;
      if (!links.has(key)) {
        links.set(key, { ...link, source, target });
      }
    });
  });

  return {
    nodes: [...nodes.values()],
    links: [...links.values()],
  };
}

const resolveLinkId = (node: string | { id?: string }) =>
  typeof node === 'string' ? node : node.id || '';
