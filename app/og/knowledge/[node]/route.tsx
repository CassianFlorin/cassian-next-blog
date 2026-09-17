import { getKnowledgeCategory } from '@/lib/knowledgeGraphMapModel';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { isKnowledgeNodeKey, KNOWLEDGE_NODE_KEYS } from '@/lib/knowledgeNodes';
import { renderOgCard } from '@/lib/ogCard';

/** Share cards for knowledge territories, served at `/og/knowledge/<node>.png`. */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return KNOWLEDGE_NODE_KEYS.map((node) => ({ node: `${node}.png` }));
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ node: string }> },
) {
  const { node } = await props.params;
  const key = node.replace(/\.png$/, '');
  const summary = isKnowledgeNodeKey(key)
    ? getKnowledgeIndex().byKey.get(key)
    : undefined;
  if (!summary) return new Response('Not found', { status: 404 });

  const category = getKnowledgeCategory(summary.key);
  return renderOgCard({
    title: category.label,
    kicker: 'CF / 02 · KNOWLEDGE',
    subtitle: `${category.description}.`,
    meta: [
      `${summary.articles.length} articles`,
      `${summary.topics.length} topics`,
      `${summary.related.length} connections`,
    ],
  });
}
