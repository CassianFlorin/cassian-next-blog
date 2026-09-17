import type { Metadata } from 'next';
import { slug } from 'github-slugger';
import { getTranslations } from 'next-intl/server';
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import { allBlogs } from 'contentlayer/generated';
import { genPageMetadata } from 'app/seo';
import Link from '@/components/Link';
import WritingPageHeader from '@/components/writing/WritingPageHeader';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { GENERIC_TAGS, knowledgeNodeHref } from '@/lib/knowledgeNodes';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return genPageMetadata({
    title: t('tagsTitle'),
    description: t('tagsDescription'),
    locale,
    path: '/tags',
  });
}

type TopicLink = { label: string; slug: string; count: number };

/** Every tag, grouped by the knowledge territory it files articles under. */
export default async function TagsPage() {
  const t = await getTranslations('blog');
  const tk = await getTranslations('knowledge');
  const tt = await getTranslations('tags');
  const label = (topic: TopicLink) =>
    tt.has(topic.slug) ? tt(topic.slug) : topic.label;

  const index = getKnowledgeIndex();
  const generic = new Map<string, TopicLink>();
  allCoreContent(sortPosts(allBlogs)).forEach((post) =>
    (post.tags || []).forEach((tag) => {
      const tagSlug = slug(tag);
      if (!GENERIC_TAGS.has(tagSlug)) return;
      const topic = generic.get(tagSlug) || {
        label: tag,
        slug: tagSlug,
        count: 0,
      };
      topic.count += 1;
      generic.set(tagSlug, topic);
    }),
  );

  const groups = [
    ...index.nodes
      .filter((node) => node.topics.length > 0)
      .map((node) => ({
        key: node.key,
        title: tk(`nodes.${node.key}.label`),
        href: knowledgeNodeHref(node.key),
        topics: node.topics,
      })),
    ...(generic.size
      ? [
          {
            key: 'general',
            title: t('topics.general'),
            href: undefined,
            topics: [...generic.values()].sort((a, b) => b.count - a.count),
          },
        ]
      : []),
  ];

  return (
    <div className="bleed">
      <div className="container-atelier pb-8">
        <WritingPageHeader
          crumbs={[
            { label: `CF / 03 · ${t('article.writing')}`, href: '/blog' },
            { label: t('topics.title') },
          ]}
          title={t('topics.title')}
          lede={t('topics.lede')}
          description={t('topics.description')}
        />

        <div className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`topics-${group.key}`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-gray-900/20 pb-3 dark:border-white/20">
                <h2
                  id={`topics-${group.key}`}
                  className="type-meta text-gray-950 dark:text-gray-50"
                >
                  {group.title}
                </h2>
                {group.href && (
                  <Link
                    href={group.href}
                    aria-label={`${t('topics.openTerritory')}: ${group.title}`}
                    className="type-meta text-gray-400 transition-colors hover:text-gray-950 dark:hover:text-gray-50"
                  >
                    →
                  </Link>
                )}
              </div>
              <ul className="mt-2">
                {group.topics.map((topic) => (
                  <li key={topic.slug}>
                    <Link
                      href={`/tags/${topic.slug}`}
                      className="flex items-baseline justify-between gap-4 py-2 text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-gray-50"
                    >
                      <span>{label(topic)}</span>
                      <span className="font-mono text-xs text-gray-400 tabular-nums">
                        {String(topic.count).padStart(2, '0')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
