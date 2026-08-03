import 'css/prism.css';
import 'katex/dist/katex.css';

import PageTitle from '@/components/PageTitle';
import { components } from '@/components/MDXComponents';
import { MDXLayoutRenderer } from 'pliny/mdx-components';
import {
  sortPosts,
  coreContent,
  allCoreContent,
} from 'pliny/utils/contentlayer';
import { allBlogs, allAuthors } from 'contentlayer/generated';
import type { Authors, Blog } from 'contentlayer/generated';
import PostSimple from '@/layouts/PostSimple';
import PostLayout from '@/layouts/PostLayout';
import PostBanner from '@/layouts/PostBanner';
import { Metadata } from 'next';
import siteMetadata from '@/data/siteMetadata';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { buildLocalKnowledgeGraph } from '@/lib/knowledgeGraph';
import JsonLd from '@/components/JsonLd';
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  buildDefinedTermJsonLd,
  buildFaqPageJsonLd,
  buildHowToJsonLd,
} from '@/lib/structuredData';
import {
  absoluteImageList,
  buildAlternates,
  localeUrl,
  ogLocaleByLocale,
  resolveLocale,
  SITE_URL,
} from '@/lib/seo';

const defaultLayout = 'PostLayout';
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
};

export async function generateMetadata(props: {
  params: Promise<{ slug: string[]; locale: string }>;
}): Promise<Metadata | undefined> {
  const params = await props.params;
  const slug = decodeURI(params.slug.join('/'));
  const post = allBlogs.find((p) => p.slug === slug);
  const authorList = post?.authors || ['default'];
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author);
    return coreContent(authorResults as Authors);
  });
  if (!post) {
    return;
  }

  const locale = resolveLocale(params.locale);
  const publishedAt = new Date(post.date).toISOString();
  const modifiedAt = new Date(post.lastmod || post.date).toISOString();
  const authors = authorDetails.map((author) => author.name);
  // A post that declares its own `images` wins; everything else falls back to
  // the card generated at /og/<slug>.png.
  const hasOwnImages =
    typeof post.images === 'string' ||
    (Array.isArray(post.images) && post.images.length > 0);
  const images = hasOwnImages
    ? absoluteImageList(post.images)
    : [
        {
          url: `${SITE_URL}/og/${encodeURI(post.slug)}.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ];

  return {
    title: post.title,
    description: post.summary,
    // Override the sitewide keyword list with this post's own tags.
    keywords: post.tags?.length ? post.tags : undefined,
    authors: authors.map((name) => ({ name })),
    // `canonicalUrl` frontmatter wins when the post was first published
    // elsewhere; otherwise the locale-prefixed URL is canonical.
    alternates: buildAlternates(locale, `/${post.path}`, post.canonicalUrl),
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: ogLocaleByLocale[locale],
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: localeUrl(locale, `/${post.path}`),
      images,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images,
    },
  };
}

export const generateStaticParams = async () => {
  return allBlogs.map((p) => ({
    slug: p.slug.split('/').map((name) => decodeURI(name)),
  }));
};

export default async function Page(props: {
  params: Promise<{ slug: string[]; locale: string }>;
}) {
  const params = await props.params;
  const slug = decodeURI(params.slug.join('/'));
  const locale = resolveLocale(params.locale);
  const t = await getTranslations({ locale, namespace: 'seo' });
  // Filter out drafts in production
  const sortedCoreContents = allCoreContent(sortPosts(allBlogs));
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug);
  if (postIndex === -1) {
    return notFound();
  }

  const prev = sortedCoreContents[postIndex + 1];
  const next = sortedCoreContents[postIndex - 1];
  const post = allBlogs.find((p) => p.slug === slug) as Blog;
  const authorList = post?.authors || ['default'];
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author);
    return coreContent(authorResults as Authors);
  });
  const mainContent = coreContent(post);
  const localKnowledgeGraph = buildLocalKnowledgeGraph(allBlogs, slug);

  const articleJsonLd = buildBlogPostingJsonLd(locale, {
    title: post.title,
    summary: post.summary,
    tldr: post.tldr,
    date: post.date,
    lastmod: post.lastmod,
    tags: post.tags,
    images: post.images,
    path: `/${post.path}`,
    canonicalUrl: post.canonicalUrl,
    authors: authorDetails.map((author) => ({ name: author.name })),
    readingTimeWords: post.readingTime?.words,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: t('breadcrumbHome'), path: '/' },
    { name: t('breadcrumbBlog'), path: '/blog' },
    { name: post.title },
  ]);

  // Opt-in per post via frontmatter; each builder returns null when absent.
  const faqJsonLd = buildFaqPageJsonLd(locale, {
    path: `/${post.path}`,
    canonicalUrl: post.canonicalUrl,
    faq: post.faq,
  });
  const howToJsonLd = buildHowToJsonLd(locale, {
    path: `/${post.path}`,
    canonicalUrl: post.canonicalUrl,
    title: post.title,
    summary: post.summary,
    howto: post.howto,
  });
  const definedTermJsonLd = buildDefinedTermJsonLd(locale, {
    path: `/${post.path}`,
    canonicalUrl: post.canonicalUrl,
    definedTerm: post.definedTerm,
  });

  const Layout = layouts[post.layout || defaultLayout];

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      {howToJsonLd && <JsonLd data={howToJsonLd} />}
      {definedTermJsonLd && <JsonLd data={definedTermJsonLd} />}
      <Layout
        content={mainContent}
        authorDetails={authorDetails}
        next={next}
        prev={prev}
        knowledgeGraph={localKnowledgeGraph}
      >
        <MDXLayoutRenderer
          code={post.body.code}
          components={components}
          toc={post.toc}
        />
      </Layout>
    </>
  );
}
