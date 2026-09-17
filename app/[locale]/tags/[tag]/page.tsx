import { slug } from 'github-slugger';
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import { notFound } from 'next/navigation';
import siteMetadata from '@/data/siteMetadata';
import { allBlogs } from 'contentlayer/generated';
import tagData from 'app/tag-data.json';
import { genPageMetadata } from 'app/seo';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import JsonLd from '@/components/JsonLd';
import Link from '@/components/Link';
import TraceList from '@/components/writing/TraceList';
import WritingPageHeader from '@/components/writing/WritingPageHeader';
import { classifyKnowledgeNode } from '@/lib/knowledgeGraphMapModel';
import { GENERIC_TAGS, knowledgeNodeHref } from '@/lib/knowledgeNodes';
import { buildCollectionPageJsonLd } from '@/lib/structuredData';
import { buildAlternates, resolveLocale } from '@/lib/seo';

/**
 * A tag's display name: its translation when one exists, otherwise the
 * spelling authors used in frontmatter (URLs only carry the lowercase slug).
 */
async function tagDisplayName(tagSlug: string, locale: string) {
  const tt = await getTranslations({ locale, namespace: 'tags' });
  if (tt.has(tagSlug)) return tt(tagSlug);
  return (
    allBlogs
      .flatMap((post) => post.tags || [])
      .find((postTag) => slug(postTag) === tagSlug) || tagSlug
  );
}

export async function generateMetadata(props: {
  params: Promise<{ tag: string; locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const tag = decodeURI(params.tag);
  const locale = resolveLocale(params.locale);
  const t = await getTranslations({ locale, namespace: 'seo' });
  const count = (tagData as Record<string, number>)[slug(tag)] ?? 0;
  const path = `/tags/${encodeURI(tag)}`;
  const label = await tagDisplayName(slug(tag), locale);

  return genPageMetadata({
    title: t('tagTitle', { tag: label }),
    description: t('tagDescription', { tag: label, count }),
    locale,
    path,
    alternates: {
      ...buildAlternates(locale, path),
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${slug(tag)}/feed.xml`,
      },
    },
  });
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>;
  return Object.keys(tagCounts).map((tag) => ({
    tag: encodeURI(tag),
  }));
};

/** One topic: every article carrying the tag, and the territory it opens. */
export default async function TagPage(props: {
  params: Promise<{ tag: string; locale: string }>;
}) {
  const params = await props.params;
  const tag = decodeURI(params.tag);
  const tagSlug = slug(tag);
  const locale = resolveLocale(params.locale);
  const seo = await getTranslations({ locale, namespace: 'seo' });
  const t = await getTranslations('blog');
  const tk = await getTranslations('knowledge');

  const posts = allCoreContent(
    sortPosts(
      allBlogs.filter((post) =>
        post.tags?.some((postTag) => slug(postTag) === tagSlug),
      ),
    ),
  );
  if (!posts.length) notFound();

  const rawLabel =
    posts
      .flatMap((post) => post.tags || [])
      .find((postTag) => slug(postTag) === tagSlug) || tag;
  const label = await tagDisplayName(tagSlug, locale);
  const territory = GENERIC_TAGS.has(tagSlug)
    ? null
    : classifyKnowledgeNode({ type: 'tag', label: rawLabel });

  return (
    <div className="bleed">
      <JsonLd
        data={buildCollectionPageJsonLd(locale, {
          name: seo('tagTitle', { tag: label }),
          description: seo('tagDescription', {
            tag: label,
            count: posts.length,
          }),
          path: `/tags/${encodeURI(tag)}`,
          items: posts.map((post) => ({
            title: post.title,
            path: `/${post.path}`,
          })),
        })}
      />
      <div className="container-atelier pb-8">
        <WritingPageHeader
          crumbs={[
            { label: `CF / 03 · ${t('article.writing')}`, href: '/blog' },
            { label: t('topics.title'), href: '/tags' },
            { label },
          ]}
          title={label}
          meta={
            <dl className="grid grid-cols-2 border-y border-gray-900/15 dark:border-white/15">
              <div className="space-y-1 py-4">
                <dt className="type-meta text-gray-500 dark:text-gray-400">
                  {t('topics.title')}
                </dt>
                <dd className="text-gray-950 dark:text-gray-50">
                  {t('topics.articles', { count: posts.length })}
                </dd>
              </div>
              <div className="space-y-1 border-l border-gray-900/15 py-4 pl-5 dark:border-white/15">
                <dt className="type-meta text-gray-500 dark:text-gray-400">
                  {t('topics.territory')}
                </dt>
                <dd>
                  {territory ? (
                    <Link
                      href={knowledgeNodeHref(territory)}
                      className="text-gray-950 underline-offset-4 hover:underline dark:text-gray-50"
                    >
                      {tk(`nodes.${territory}.label`)} →
                    </Link>
                  ) : (
                    <span className="text-gray-950 dark:text-gray-50">
                      {t('topics.general')}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          }
        />

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
