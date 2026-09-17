import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import { allBlogs } from 'contentlayer/generated';
import { genPageMetadata } from 'app/seo';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import Link from '@/components/Link';
import TraceList from '@/components/writing/TraceList';
import WritingPageHeader from '@/components/writing/WritingPageHeader';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { knowledgeNodeHref } from '@/lib/knowledgeNodes';
import { buildCollectionPageJsonLd } from '@/lib/structuredData';
import { resolveLocale } from '@/lib/seo';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return genPageMetadata({
    title: t('blogTitle'),
    description: t('blogDescription'),
    locale,
    path: '/blog',
  });
}

/** CF / 03 · Writing — the whole archive as one timeline. */
export default async function BlogPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations('blog.archive');
  const tk = await getTranslations('knowledge');
  const seo = await getTranslations({ locale, namespace: 'seo' });
  const posts = allCoreContent(sortPosts(allBlogs));
  const firstYear = posts.length
    ? new Date(posts[posts.length - 1].date).getFullYear()
    : new Date().getFullYear();
  const index = getKnowledgeIndex();

  return (
    <div className="bleed">
      <JsonLd
        data={buildCollectionPageJsonLd(resolveLocale(locale), {
          name: seo('blogTitle'),
          description: seo('blogDescription'),
          path: '/blog',
          items: posts.map((post) => ({
            title: post.title,
            path: `/${post.path}`,
          })),
        })}
      />
      <div className="container-atelier pb-8">
        <WritingPageHeader
          crumbs={[{ label: 'CF / 03' }]}
          title={t('title')}
          lede={t('lede')}
          description={t('description')}
          meta={
            <p className="type-meta text-gray-950 dark:text-gray-50">
              {t('count', { count: posts.length, year: firstYear })}
            </p>
          }
        />

        <nav
          aria-label={t('browseTerritories')}
          className="mt-16 border-y border-gray-900/15 py-5 dark:border-white/15"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
            <p className="type-meta text-gray-500 dark:text-gray-400">
              {t('browseTerritories')}
            </p>
            <Link
              href="/tags"
              className="type-meta text-gray-950 underline-offset-4 hover:underline dark:text-gray-50"
            >
              {t('allTopics')} →
            </Link>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {index.nodes.map((node) => (
              <li key={node.key}>
                <Link
                  href={knowledgeNodeHref(node.key)}
                  className="group inline-flex items-baseline gap-2 text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-gray-50"
                >
                  {tk(`nodes.${node.key}.label`)}
                  <span className="font-mono text-xs text-gray-500 tabular-nums">
                    {String(node.articles.length).padStart(2, '0')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-16">
          <TraceList
            traces={posts.map((post) => ({
              key: post.slug,
              href: `/${post.path}`,
              title: post.title,
              date: post.date,
              tags: post.tags || [],
            }))}
          />
        </div>
      </div>
    </div>
  );
}
