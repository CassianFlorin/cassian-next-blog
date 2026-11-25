'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from '@/components/Link';
import { defaultLocale, isLocale } from '@/lib/i18nRouting';
import type { KnowledgeNodeKey } from '@/lib/knowledgeNodes';
import type { UniverseData } from '@/lib/knowledgeUniverse';
import type { UniverseHandle } from './universeEngine';

/**
 * The knowledge universe in a page: a full-bleed stage, territory filters,
 * search, and a panel for the territory in focus. The same component serves
 * /knowledge (mode "explore"), each territory page (mode "territory",
 * arriving already focused; other territories link to their own pages) and
 * the article sidebar (mode "article", a small stage circling that article).
 * Without WebGL it renders `fallback`, the 2D graph.
 */

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

const pad = (value: number) => String(value).padStart(2, '0');

export default function KnowledgeUniverse({
  data,
  mode,
  focusKey,
  focusedPost,
  fallback,
}: {
  data: UniverseData;
  mode: 'explore' | 'territory' | 'article';
  focusKey?: KnowledgeNodeKey;
  /** Post slug from `?post=`; the camera arrives at that star. */
  focusedPost?: string;
  fallback: ReactNode;
}) {
  const t = useTranslations('knowledge');
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const localize = useCallback((href: string) => `/${locale}${href}`, [locale]);

  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<UniverseHandle | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState<KnowledgeNodeKey | null>(
    focusKey ?? null,
  );
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const openRef = useRef<(href: string) => void>(() => {});
  openRef.current = (href) => router.push(localize(href));
  const countRef = useRef<(count: number) => string>(() => '');
  countRef.current = (count) => t('articles', { count });

  const initialPost = useMemo(
    () =>
      focusedPost
        ? data.posts.find((post) => post.href.endsWith(`/${focusedPost}`))?.href
        : undefined,
    [data.posts, focusedPost],
  );

  useEffect(() => {
    const host = hostRef.current;
    const labelLayer = labelRef.current;
    if (!host || !labelLayer) return;
    if (!supportsWebGL()) {
      setWebgl(false);
      return;
    }
    let disposed = false;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    void import('./universeEngine').then(({ mountUniverse }) => {
      if (disposed) return;
      handleRef.current = mountUniverse(
        host,
        data,
        {
          onReady: () => setReady(true),
          onFocus: setFocused,
          onHover: () => {},
          onOpen: (href) => openRef.current(href),
        },
        {
          reducedMotion,
          mode,
          initialFocus: focusKey,
          initialPost,
          labelLayer,
          localize,
          countLabel: (count) => countRef.current(count),
        },
      );
    });

    return () => {
      disposed = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [data, mode, focusKey, initialPost, localize]);

  // Search, debounced; the engine lights and frames the matches.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const handle = handleRef.current;
      if (!handle) return;
      const count = handle.search(query);
      setMatchCount(query.trim() ? count : null);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const territory = focused
    ? data.territories.find((item) => item.key === focused)
    : undefined;
  const territoryPosts = territory
    ? data.posts
        .filter((post) => post.territories.includes(territory.key))
        .slice(0, 6)
    : [];

  if (!webgl) return <>{fallback}</>;

  const explore = mode === 'explore';
  const article = mode === 'article';
  const stageSize = explore
    ? 'h-[82svh] min-h-[560px]'
    : article
      ? 'h-[22rem]'
      : 'h-[64svh] min-h-[460px]';

  return (
    <div className={article ? 'relative' : 'bleed relative'}>
      <div
        className={`universe-stage relative overflow-hidden ${stageSize}`}
        data-ready={ready ? 'true' : 'false'}
      >
        <div ref={hostRef} className="absolute inset-0" />
        <div
          ref={labelRef}
          className="pointer-events-none absolute inset-0 overflow-hidden"
        />

        {explore ? (
          <div className="pointer-events-none absolute inset-x-0 top-0">
            <div className="container-atelier flex flex-col gap-4 pt-4 lg:flex-row lg:items-start lg:justify-between">
              <div
                role="toolbar"
                aria-label={t('filterLabel')}
                className="pointer-events-auto -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0"
              >
                <button
                  type="button"
                  onClick={() => handleRef.current?.focus(null)}
                  aria-pressed={focused === null}
                  className="universe-chip shrink-0"
                >
                  {t('filterAll')}
                </button>
                {data.territories.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      handleRef.current?.focus(
                        focused === item.key ? null : item.key,
                      )
                    }
                    aria-pressed={focused === item.key}
                    className="universe-chip shrink-0"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="pointer-events-auto block w-full lg:w-72">
                <span className="sr-only">{t('searchGraph')}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="universe-search w-full"
                />
                {matchCount !== null ? (
                  <span className="type-meta mt-2 block text-gray-600 dark:text-gray-400">
                    {matchCount > 0
                      ? t('matches', { count: matchCount })
                      : t('noMatches')}
                  </span>
                ) : null}
              </label>
            </div>
          </div>
        ) : null}

        {explore && territory ? (
          <aside
            aria-live="polite"
            className="universe-panel pointer-events-auto absolute right-4 bottom-16 w-[min(22rem,calc(100%-2rem))] lg:top-28 lg:right-[max(1.5rem,calc((100vw-80rem)/2))] lg:bottom-auto"
          >
            <p className="type-meta text-primary-700 dark:text-primary-400">
              {t('nodeLabel')} · {pad(territory.articles)}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
              {territory.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
              {territory.description}
            </p>
            <ol className="mt-5 space-y-3 border-t border-gray-900/15 pt-4 dark:border-white/15">
              {territoryPosts.map((post) => (
                <li key={post.href}>
                  <Link
                    href={post.href}
                    className="group block text-sm leading-snug text-gray-800 hover:text-gray-950 dark:text-gray-200 dark:hover:text-gray-50"
                  >
                    <span className="type-meta block text-gray-500 dark:text-gray-400">
                      {post.date.replaceAll('-', '.')}
                    </span>
                    <span className="group-hover:underline">{post.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex items-center justify-between gap-4">
              <Link
                href={territory.href}
                className="type-meta hover:text-primary-700 dark:hover:text-primary-400 text-gray-950 dark:text-gray-50"
              >
                {t('focusNode', { node: territory.label })} →
              </Link>
              <button
                type="button"
                onClick={() => handleRef.current?.focus(null)}
                className="type-meta text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50"
              >
                {t('backToMap')}
              </button>
            </div>
          </aside>
        ) : null}

        {article ? null : (
          <p className="type-meta pointer-events-none absolute inset-x-0 bottom-0">
            <span className="container-atelier block pb-5 text-gray-600 dark:text-gray-400">
              {explore ? t('universeHint') : t('universeTerritoryHint')}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
