import { slug } from 'github-slugger';
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import siteMetadata from '@/data/siteMetadata';
import ListLayout from '@/layouts/ListLayoutWithTags';
import { allBlogs } from 'contentlayer/generated';
import tagData from 'app/tag-data.json';
import { genPageMetadata } from 'app/seo';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import JsonLd from '@/components/JsonLd';
import { buildCollectionPageJsonLd } from '@/lib/structuredData';
import { buildAlternates, resolveLocale } from '@/lib/seo';

const POSTS_PER_PAGE = 5;

export async function generateMetadata(props: {
  params: Promise<{ tag: string; locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const tag = decodeURI(params.tag);
  const locale = resolveLocale(params.locale);
  const t = await getTranslations({ locale, namespace: 'seo' });
  const count = (tagData as Record<string, number>)[slug(tag)] ?? 0;
  const path = `/tags/${encodeURI(tag)}`;

  return genPageMetadata({
    title: t('tagTitle', { tag }),
    description: t('tagDescription', { tag, count }),
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
  const tagKeys = Object.keys(tagCounts);
  return tagKeys.map((tag) => ({
    tag: encodeURI(tag),
  }));
};

export default async function TagPage(props: {
  params: Promise<{ tag: string; locale: string }>;
}) {
  const params = await props.params;
  const tag = decodeURI(params.tag);
  const locale = resolveLocale(params.locale);
  const t = await getTranslations({ locale, namespace: 'seo' });
  const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1);
  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs.filter(
        (post) =>
          post.tags && post.tags.map((t) => slug(t)).includes(slug(tag)),
      ),
    ),
  );
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE);
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
  };

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd(locale, {
          name: t('tagTitle', { tag }),
          description: t('tagDescription', {
            tag,
            count: filteredPosts.length,
          }),
          path: `/tags/${encodeURI(tag)}`,
          items: initialDisplayPosts.map((post) => ({
            title: post.title,
            path: `/${post.path}`,
          })),
        })}
      />
      <ListLayout
        posts={filteredPosts}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title={title}
      />
    </>
  );
}
