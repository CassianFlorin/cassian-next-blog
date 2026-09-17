import type { ReactNode } from 'react';
import { slug as slugify } from 'github-slugger';
import { CoreContent } from 'pliny/utils/contentlayer';
import type { Blog, Authors } from 'contentlayer/generated';
import { getTranslations } from 'next-intl/server';
import ArticleKnowledgeGraph from '@/components/ArticleKnowledgeGraph';
import Comments from '@/components/Comments';
import Image from '@/components/Image';
import Link from '@/components/Link';
import ScrollTopAndComment from '@/components/ScrollTopAndComment';
import Tldr from '@/components/Tldr';
import TraceList, { type Trace } from '@/components/writing/TraceList';
import siteMetadata from '@/data/siteMetadata';
import type { KnowledgeGraphData } from '@/lib/knowledgeGraph';
import { knowledgeNodeHref, type KnowledgeNodeKey } from '@/lib/knowledgeNodes';

const editUrl = (path: string) =>
  `${siteMetadata.siteRepo}/blob/main/data/${path}`;
const discussUrl = (path: string) =>
  `https://mobile.twitter.com/search?q=${encodeURIComponent(`${siteMetadata.siteUrl}/${path}`)}`;

const pad = (value: number) => String(value).padStart(2, '0');

/** Everything an article connects to, computed by the page. */
export interface ArticleRelations {
  territories: { key: KnowledgeNodeKey; articles: number }[];
  projects: {
    id: string;
    title: string;
    href: string;
    tagline: string;
    reason: 'explicit' | 'territory';
  }[];
  articles: Trace[];
}

interface LayoutProps {
  content: CoreContent<Blog>;
  authorDetails: CoreContent<Authors>[];
  next?: { path: string; title: string };
  prev?: { path: string; title: string };
  knowledgeGraph?: KnowledgeGraphData;
  relations?: ArticleRelations;
  children: ReactNode;
}

/**
 * Article page, V2: the date is the anchor, the title carries the weight, and
 * the article sits inside its relationships — the territories it is filed
 * under, the projects it touches, and the writing closest to it.
 */
export default async function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  knowledgeGraph,
  relations,
  children,
}: LayoutProps) {
  const { filePath, path, slug, date, lastmod, title, summary, tags, tldr } =
    content;
  const t = await getTranslations('blog');
  const tk = await getTranslations('knowledge');
  const tt = await getTranslations('tags');

  const published = new Date(date);
  const updated = lastmod ? new Date(lastmod) : undefined;
  const dayOf = (d: Date) => `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  const showUpdated =
    updated && updated.toDateString() !== published.toDateString();
  const minutes = Math.max(
    1,
    Math.round(
      (content as { readingTime?: { minutes?: number } }).readingTime
        ?.minutes ?? 0,
    ),
  );
  const tagLabel = (tag: string) =>
    tt.has(slugify(tag)) ? tt(slugify(tag)) : tag;

  const territories = relations?.territories ?? [];
  const projects = relations?.projects ?? [];
  const related = relations?.articles ?? [];

  const asideTitle =
    'type-meta border-b border-gray-900/20 pb-3 text-gray-500 dark:border-white/20 dark:text-gray-400';

  return (
    <div className="bleed">
      <ScrollTopAndComment />
      <article className="container-atelier pb-8">
        <header className="pt-6 md:pt-10">
          <nav aria-label="Breadcrumb" className="type-meta">
            <ol className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-400">
              <li>
                <Link
                  href="/blog"
                  className="transition-colors hover:text-gray-950 dark:hover:text-gray-50"
                >
                  CF / 03 · {t('article.writing')}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-950 dark:text-gray-50">
                {published.getFullYear()}
              </li>
            </ol>
          </nav>

          <div className="mt-12 grid gap-4 md:mt-16 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <time
              dateTime={date}
              className="font-mono text-xl text-gray-500 tabular-nums lg:pt-2 lg:text-3xl dark:text-gray-400"
            >
              {dayOf(published)}
            </time>
            <div className="max-w-4xl">
              <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl lg:leading-[1.08] dark:text-gray-50">
                {title}
              </h1>
              {summary && (
                <p className="type-editorial mt-6 text-xl leading-snug text-gray-600 md:text-2xl dark:text-gray-300">
                  {summary}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-12 grid border-y border-gray-900/15 sm:grid-cols-2 lg:grid-cols-4 dark:border-white/15">
            <div className="space-y-2 border-b border-gray-900/10 py-5 sm:pr-6 lg:border-r lg:border-b-0 dark:border-white/10">
              <dt className="type-meta text-gray-500 dark:text-gray-400">
                {t('article.filedUnder')}
              </dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1">
                {territories.map((territory) => (
                  <Link
                    key={territory.key}
                    href={knowledgeNodeHref(territory.key)}
                    className="text-gray-950 underline-offset-4 hover:underline dark:text-gray-50"
                  >
                    {tk(`nodes.${territory.key}.label`)}
                  </Link>
                ))}
              </dd>
            </div>
            <div className="space-y-2 border-b border-gray-900/10 py-5 sm:pl-6 lg:border-r lg:border-b-0 lg:pr-6 dark:border-white/10">
              <dt className="type-meta text-gray-500 dark:text-gray-400">
                {t('article.topics')}
              </dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1">
                {(tags || []).map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${slugify(tag)}`}
                    className="text-gray-700 underline-offset-4 hover:text-gray-950 hover:underline dark:text-gray-300 dark:hover:text-gray-50"
                  >
                    {tagLabel(tag)}
                  </Link>
                ))}
              </dd>
            </div>
            <div className="space-y-2 border-b border-gray-900/10 py-5 sm:border-b-0 sm:pr-6 lg:border-r lg:pl-6 dark:border-white/10">
              <dt className="type-meta text-gray-500 dark:text-gray-400">
                {t('readingTime')}
              </dt>
              <dd className="text-gray-950 dark:text-gray-50">
                {t('article.readingTime', { minutes })}
              </dd>
            </div>
            <div className="space-y-2 py-5 sm:pl-6">
              <dt className="type-meta text-gray-500 dark:text-gray-400">
                {showUpdated ? t('article.updated') : t('publishedOn')}
              </dt>
              <dd className="font-mono text-gray-950 tabular-nums dark:text-gray-50">
                {(showUpdated && updated ? updated : published)
                  .toISOString()
                  .slice(0, 10)
                  .replace(/-/g, '.')}
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-14 grid gap-16 md:mt-20 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-24">
          <div className="min-w-0">
            <div className="prose prose-gray dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-lg max-w-3xl">
              <Tldr>{tldr}</Tldr>
              {children}
            </div>

            <div className="type-meta mt-14 flex max-w-3xl flex-wrap items-center justify-between gap-4 border-t border-gray-900/15 pt-6 text-gray-500 dark:border-white/15 dark:text-gray-400">
              <span className="flex items-center gap-3">
                {authorDetails.map((author) => (
                  <span key={author.name} className="flex items-center gap-3">
                    {author.avatar && (
                      <Image
                        src={author.avatar}
                        width={28}
                        height={28}
                        alt=""
                        className="h-7 w-7 rounded-full"
                      />
                    )}
                    <span className="text-gray-950 dark:text-gray-50">
                      {author.name}
                    </span>
                  </span>
                ))}
              </span>
              <span className="flex gap-5">
                <Link
                  href={discussUrl(path)}
                  rel="nofollow"
                  className="transition-colors hover:text-gray-950 dark:hover:text-gray-50"
                >
                  {t('discussOnTwitter')} ↗
                </Link>
                <Link
                  href={editUrl(filePath)}
                  className="transition-colors hover:text-gray-950 dark:hover:text-gray-50"
                >
                  {t('viewOnGitHub')} ↗
                </Link>
              </span>
            </div>

            {siteMetadata.comments && (
              <div className="mt-12 max-w-3xl" id="comment">
                <Comments slug={slug} />
              </div>
            )}
          </div>

          <aside className="min-w-0 space-y-14 lg:sticky lg:top-8 lg:self-start">
            {territories.length > 0 && (
              <section aria-labelledby="article-territories">
                <h2 id="article-territories" className={asideTitle}>
                  {t('article.filedUnder')}
                </h2>
                <ul className="mt-1">
                  {territories.map((territory) => (
                    <li key={territory.key}>
                      <Link
                        href={knowledgeNodeHref(territory.key)}
                        className="group flex items-baseline justify-between gap-4 py-2.5"
                      >
                        <span className="group-hover:text-primary-700 dark:group-hover:text-primary-300 text-gray-950 transition-colors dark:text-gray-50">
                          {tk(`nodes.${territory.key}.label`)}
                        </span>
                        <span className="font-mono text-xs text-gray-500 tabular-nums">
                          {pad(territory.articles)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {projects.length > 0 && (
              <section aria-labelledby="article-projects">
                <h2 id="article-projects" className={asideTitle}>
                  {t('article.relatedProjects')}
                </h2>
                <ul className="divide-y divide-gray-900/10 dark:divide-white/10">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <Link href={project.href} className="group block py-4">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="text-lg font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                            {project.title}
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-gray-500 transition-transform duration-200 group-hover:translate-x-0.5"
                          >
                            →
                          </span>
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-gray-600 dark:text-gray-400">
                          {project.tagline}
                        </span>
                        <span className="type-meta mt-2 block text-gray-500 dark:text-gray-400">
                          {project.reason === 'explicit'
                            ? t('article.citedBy')
                            : t('article.sameTerritory')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {knowledgeGraph && knowledgeGraph.nodes.length > 0 && (
              <section aria-labelledby="article-map">
                <h2 id="article-map" className={`${asideTitle} mb-4`}>
                  {t('article.inTheMap')}
                </h2>
                <ArticleKnowledgeGraph
                  graphData={knowledgeGraph}
                  currentSlug={slug}
                />
              </section>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section
            aria-labelledby="keep-reading"
            className="mt-24 border-t border-gray-900/20 pt-8 dark:border-white/20"
          >
            <h2
              id="keep-reading"
              className="type-meta mb-4 text-gray-950 dark:text-gray-50"
            >
              {t('article.keepReading')}
            </h2>
            <TraceList traces={related} size="compact" />
          </section>
        )}

        {(prev || next) && (
          <nav
            aria-label={t('article.writing')}
            className="mt-20 grid border-t border-gray-900/20 sm:grid-cols-2 dark:border-white/20"
          >
            {[prev, next].map((item, i) =>
              item?.path ? (
                <Link
                  key={item.path}
                  href={`/${item.path}`}
                  className={`group block space-y-3 py-8 ${
                    i === 1
                      ? 'border-t border-gray-900/10 sm:border-t-0 sm:border-l sm:pl-8 sm:text-right dark:border-white/10'
                      : 'sm:pr-8'
                  }`}
                >
                  <span className="type-meta block text-gray-500 dark:text-gray-400">
                    {i === 0 ? `← ${t('previous')}` : `${t('next')} →`}
                  </span>
                  <span className="block text-xl leading-snug font-semibold tracking-tight text-gray-950 transition-colors group-hover:text-gray-600 md:text-2xl dark:text-gray-50 dark:group-hover:text-gray-300">
                    {item.title}
                  </span>
                </Link>
              ) : (
                <span key={i} aria-hidden="true" />
              ),
            )}
          </nav>
        )}
      </article>
    </div>
  );
}
