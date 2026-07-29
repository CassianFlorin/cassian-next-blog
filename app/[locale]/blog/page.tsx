import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer';
import { allBlogs } from 'contentlayer/generated';
import { genPageMetadata } from 'app/seo';
import ListLayout from '@/layouts/ListLayoutWithTags';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { buildCollectionPageJsonLd } from '@/lib/structuredData';
import { resolveLocale } from '@/lib/seo';

const POSTS_PER_PAGE = 5;

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

export default async function BlogPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations('blog');
  const seo = await getTranslations({ locale, namespace: 'seo' });
  const posts = allCoreContent(sortPosts(allBlogs));
  const pageNumber = 1;
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE * pageNumber);
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  };

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd(resolveLocale(locale), {
          name: seo('blogTitle'),
          description: seo('blogDescription'),
          path: '/blog',
          items: initialDisplayPosts.map((post) => ({
            title: post.title,
            path: `/${post.path}`,
          })),
        })}
      />
      <ListLayout
        posts={posts}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title={t('allPosts')}
      />
    </>
  );
}
