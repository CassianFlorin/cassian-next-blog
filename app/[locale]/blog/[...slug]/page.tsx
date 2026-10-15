import 'css/prism.css';
import 'katex/dist/katex.css';

import { components } from '@/components/MDXComponents';
import { MDXLayoutRenderer } from 'pliny/mdx-components';
import {
  sortPosts,
  coreContent,
  allCoreContent,
} from 'pliny/utils/contentlayer';
import {
  allBlogs,
  allBlogTranslations,
  allAuthors,
} from 'contentlayer/generated';
import type { Authors, Blog } from 'contentlayer/generated';
import { getLocalizedPosts } from '@/lib/postTranslations';
import PostSimple from '@/layouts/PostSimple';
import PostLayout from '@/layouts/PostLayout';
import PostBanner from '@/layouts/PostBanner';
import { Metadata } from 'next';
import siteMetadata from '@/data/siteMetadata';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { buildLocalKnowledgeGraph } from '@/lib/knowledgeGraph';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { getNodesForTags } from '@/lib/knowledgeNodes';
import { relatedArticles, relatedProjects } from '@/lib/writingRelations';
import { caseStudies, getCaseStudy, projectHref } from '@/data/caseStudies';
import projectsData from '@/data/projectsData';
import type { ArticleRelations } from '@/layouts/PostLayout';
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
  buildPostAlternates,
  localeUrl,
  ogLocaleByLocale,
  postContentLocale,
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
  const locale = resolveLocale(params.locale);
  const post = allBlogs.find((p) => p.slug === slug);
  const authorList = post?.authors || ['default'];
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author);
    return coreContent(authorResults as Authors);
  });
  if (!post) {
    return;
  }

  const translation =
    locale !== postContentLocale
      ? allBlogTranslations.find((t) => t.slug === slug && t.locale === locale)
      : null;

  const title = translation?.title || post.title;
  const description = translation?.summary || post.summary;
  const effectiveLocale = translation ? locale : postContentLocale;

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
          alt: title,
        },
      ];

  return {
    title,
    description,
    // Override the sitewide keyword list with this post's own tags.
    keywords: post.tags?.length ? post.tags : undefined,
    authors: authors.map((name) => ({ name })),
    // `canonicalUrl` frontmatter wins when the post was first published
    // elsewhere; otherwise the default-locale URL is canonical for every
    // locale, since the body is only written once.
    alternates: buildPostAlternates(`/${post.path}`, post.canonicalUrl),
    openGraph: {
      title,
      description,
      siteName: siteMetadata.author,
      locale: ogLocaleByLocale[effectiveLocale],
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: localeUrl(effectiveLocale, `/${post.path}`),
      images,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
  const sortedCoreContents = getLocalizedPosts(locale);
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug);
  if (postIndex === -1) {
    return notFound();
  }

  const prev = sortedCoreContents[postIndex + 1];
  const next = sortedCoreContents[postIndex - 1];
  const post = allBlogs.find((p) => p.slug === slug) as Blog;
  const translation =
    locale !== postContentLocale
      ? allBlogTranslations.find((t) => t.slug === slug && t.locale === locale)
      : null;

  const authorList = post?.authors || ['default'];
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author);
    return coreContent(authorResults as Authors);
  });
  const mainContent = coreContent(post);
  const displayContent = translation
    ? {
        ...mainContent,
        title: translation.title,
        summary: translation.summary,
        tldr: translation.tldr || post.tldr,
      }
    : mainContent;

  const displayBody = translation ? translation.body : post.body;
  const displayToc = translation ? translation.toc : post.toc;
  const isTranslated = !!translation;
  const localKnowledgeGraph = buildLocalKnowledgeGraph(
    getLocalizedPosts(locale),
    slug,
  );

  // Article → territories, projects and nearby writing, from the same model
  // as the knowledge map so both sides of every link agree.
  const tProjects = await getTranslations({ locale, namespace: 'projects' });
  const knowledgeIndex = getKnowledgeIndex(locale);
  const citations = new Map(
    caseStudies.map((entry) => [entry.projectId, entry.relatedPostSlugs || []]),
  );
  const relations: ArticleRelations = {
    territories: getNodesForTags(post.tags).map((key) => ({
      key,
      articles: knowledgeIndex.byKey.get(key)?.articles.length ?? 0,
    })),
    projects: relatedProjects(
      { slug, tags: post.tags },
      projectsData.filter((project) => getCaseStudy(project.id)),
      citations,
    ).map(({ project, reason }) => ({
      id: project.id,
      title: project.title,
      href: projectHref(project),
      tagline: tProjects(`items.${project.id}.tagline`),
      reason,
    })),
    articles: relatedArticles(
      {
        slug,
        title: post.title,
        path: post.path,
        date: post.date,
        tags: post.tags,
      },
      sortedCoreContents,
    ).map((article) => ({
      key: article.slug,
      href: `/${article.path}`,
      title: article.title,
      date: article.date,
      tags: article.tags || [],
    })),
  };

  // The article itself only exists in the default locale unless translated;
  // the breadcrumb below is chrome and follows the page locale.
  const articleJsonLd = buildBlogPostingJsonLd(
    isTranslated ? locale : postContentLocale,
    {
      title: displayContent.title,
      summary: displayContent.summary,
      tldr: displayContent.tldr,
      date: post.date,
      lastmod: post.lastmod,
      tags: post.tags,
      images: post.images,
      path: `/${post.path}`,
      canonicalUrl: post.canonicalUrl,
      authors: authorDetails.map((author) => ({ name: author.name })),
      readingTimeWords: (translation || post).readingTime?.words,
    },
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: t('breadcrumbHome'), path: '/' },
    { name: t('breadcrumbBlog'), path: '/blog' },
    { name: displayContent.title },
  ]);

  // Opt-in per post via frontmatter; each builder returns null when absent.
  const faqJsonLd = buildFaqPageJsonLd(
    isTranslated ? locale : postContentLocale,
    {
      path: `/${post.path}`,
      canonicalUrl: post.canonicalUrl,
      faq: translation?.faq || post.faq,
    },
  );
  const howToJsonLd = buildHowToJsonLd(
    isTranslated ? locale : postContentLocale,
    {
      path: `/${post.path}`,
      canonicalUrl: post.canonicalUrl,
      title: displayContent.title,
      summary: displayContent.summary,
      howto: translation?.howto || post.howto,
    },
  );
  const definedTermJsonLd = buildDefinedTermJsonLd(
    isTranslated ? locale : postContentLocale,
    {
      path: `/${post.path}`,
      canonicalUrl: post.canonicalUrl,
      definedTerm: translation?.definedTerm || post.definedTerm,
    },
  );

  const Layout = layouts[post.layout || defaultLayout];

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      {howToJsonLd && <JsonLd data={howToJsonLd} />}
      {definedTermJsonLd && <JsonLd data={definedTermJsonLd} />}
      <Layout
        content={displayContent}
        authorDetails={authorDetails}
        next={next}
        prev={prev}
        knowledgeGraph={localKnowledgeGraph}
        relations={relations}
        isTranslated={isTranslated}
      >
        <MDXLayoutRenderer
          code={displayBody.code}
          components={components}
          toc={displayToc}
        />
      </Layout>
    </>
  );
}
