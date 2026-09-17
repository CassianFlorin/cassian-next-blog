'use client';

import { useMemo, useState, type MouseEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from '@/components/Link';
import Reveal from '@/components/motion/Reveal';
import type { KnowledgeCategoryKey } from '@/lib/knowledgeGraphMapModel';
import { knowledgeNodeHref } from '@/lib/knowledgeNodes';
import type { KnowledgeOverview } from '@/lib/knowledgeOverview';

interface Props {
  overview: KnowledgeOverview;
}

/**
 * Homepage knowledge map: territories, their strongest topics, and where
 * writing crosses between them. Hovering or focusing a territory keeps its
 * neighbourhood lit and quiets everything else; the focus panel reports
 * what that territory holds.
 */
export default function KnowledgePreview({ overview }: Props) {
  const t = useTranslations('home.knowledge');
  const tk = useTranslations('knowledge');
  const label = (key: KnowledgeCategoryKey) => tk(`nodes.${key}.label`);
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const [active, setActive] = useState<KnowledgeCategoryKey | null>(null);

  const neighbours = useMemo(() => {
    const map = new Map<KnowledgeCategoryKey, Set<KnowledgeCategoryKey>>();
    overview.edges.forEach(({ source, target }) => {
      map.set(source, (map.get(source) || new Set()).add(target));
      map.set(target, (map.get(target) || new Set()).add(source));
    });
    return map;
  }, [overview.edges]);

  const byKey = useMemo(
    () => new Map(overview.nodes.map((node) => [node.key, node])),
    [overview.nodes],
  );
  const maxWeight = Math.max(1, ...overview.edges.map((edge) => edge.weight));
  const activeNode = active ? byKey.get(active) : undefined;

  const isLit = (key: KnowledgeCategoryKey) =>
    !active || key === active || Boolean(neighbours.get(active)?.has(key));

  const localized = (href: string) =>
    params?.locale ? `/${params.locale}${href}` : href;

  const navigate = (event: MouseEvent, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    router.push(localized(href));
  };

  return (
    <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
      <Reveal variant="graph" className="relative -mx-2 sm:mx-0">
        <svg
          // Padded so edge labels stay inside the drawing.
          viewBox={`-90 -30 ${overview.width + 180} ${overview.height + 80}`}
          role="group"
          aria-label={t('graphLabel')}
          className="h-auto w-full overflow-visible"
          onMouseLeave={() => setActive(null)}
        >
          <g>
            {overview.edges.map((edge, index) => {
              const a = byKey.get(edge.source);
              const b = byKey.get(edge.target);
              if (!a || !b) return null;
              const lit =
                !active || edge.source === active || edge.target === active;
              return (
                <line
                  key={`${edge.source}-${edge.target}`}
                  className="graph-edge text-gray-950 dark:text-gray-50"
                  style={{ ['--reveal-index' as string]: index * 0.4 + 2 }}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="currentColor"
                  strokeWidth={0.75 + (edge.weight / maxWeight) * 1.75}
                  strokeOpacity={lit ? (active ? 0.55 : 0.18) : 0.04}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          {overview.nodes.map((node, index) => {
            const lit = isLit(node.key);
            const current = node.key === active;
            const showSatellites = !active || current;
            return (
              <g
                key={node.key}
                className="graph-node"
                style={{ ['--reveal-index' as string]: index }}
              >
                <g
                  style={{
                    opacity: lit ? 1 : 0.18,
                    transition: 'opacity 250ms var(--ease-atelier)',
                  }}
                >
                  {node.tags.map((tag) => (
                    <a
                      key={tag.href}
                      href={localized(tag.href)}
                      onClick={(event) => navigate(event, tag.href)}
                      onFocus={() => setActive(node.key)}
                      className="hidden sm:inline"
                      style={{
                        opacity: showSatellites ? 1 : 0,
                        transition: 'opacity 250ms var(--ease-atelier)',
                      }}
                    >
                      <line
                        x1={node.x}
                        y1={node.y}
                        x2={tag.x}
                        y2={tag.y}
                        stroke="currentColor"
                        strokeOpacity={0.2}
                        strokeDasharray="2 4"
                        vectorEffect="non-scaling-stroke"
                        className="text-gray-950 dark:text-gray-50"
                      />
                      <circle
                        cx={tag.x}
                        cy={tag.y}
                        r={3.5}
                        className="fill-gray-400 dark:fill-gray-500"
                      />
                      <text
                        x={tag.labelX}
                        y={tag.labelY}
                        textAnchor={tag.anchor}
                        className="fill-gray-500 font-mono text-[17px] lg:text-[15px] dark:fill-gray-400"
                      >
                        {tag.label}
                      </text>
                    </a>
                  ))}

                  <a
                    href={localized(knowledgeNodeHref(node.key))}
                    aria-label={`${label(node.key)}: ${t('notes', { count: node.notes })}`}
                    onClick={(event) =>
                      navigate(event, knowledgeNodeHref(node.key))
                    }
                    onMouseEnter={() => setActive(node.key)}
                    onFocus={() => setActive(node.key)}
                    onBlur={() => setActive(null)}
                    className="cursor-pointer outline-none"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 26}
                      fill="transparent"
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r}
                      className={
                        current
                          ? 'fill-primary-600 stroke-primary-700 dark:fill-primary-400 dark:stroke-primary-300'
                          : 'dark:fill-night fill-gray-50 stroke-gray-950 dark:stroke-gray-50'
                      }
                      strokeWidth={1.25}
                      vectorEffect="non-scaling-stroke"
                      style={{ transition: 'fill 200ms, stroke 200ms' }}
                    />
                    <text
                      x={node.x}
                      y={node.y + node.r + 26}
                      textAnchor="middle"
                      className="hidden fill-gray-950 font-mono text-[20px] tracking-[0.12em] uppercase sm:inline lg:text-[17px] dark:fill-gray-50"
                    >
                      {label(node.key)}
                    </text>
                  </a>
                </g>
              </g>
            );
          })}
        </svg>
      </Reveal>

      <aside
        aria-live="polite"
        className="flex flex-col justify-between gap-8 border-t border-gray-900/15 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 dark:border-white/15"
      >
        <div className="space-y-4">
          <p className="type-meta text-gray-500 dark:text-gray-400">
            {activeNode ? 'Focus' : t('overview')}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
            {activeNode ? label(activeNode.key) : 'Knowledge'}
          </p>
          <dl className="type-meta grid gap-2 text-gray-600 dark:text-gray-300">
            {activeNode ? (
              <>
                <dd>{t('notes', { count: activeNode.notes })}</dd>
                <dd>{t('tags', { count: activeNode.tagCount })}</dd>
                <dd>
                  {t('connections', {
                    count: neighbours.get(activeNode.key)?.size || 0,
                  })}
                </dd>
              </>
            ) : (
              <>
                <dd>{t('notes', { count: overview.totals.notes })}</dd>
                <dd>{t('tags', { count: overview.totals.tags })}</dd>
                <dd>{t('connections', { count: overview.edges.length })}</dd>
              </>
            )}
          </dl>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            {activeNode ? tk(`nodes.${activeNode.key}.description`) : t('hint')}
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
          {overview.nodes.map((node) => (
            <li key={node.key}>
              <Link
                href={knowledgeNodeHref(node.key)}
                onMouseEnter={() => setActive(node.key)}
                onMouseLeave={() => setActive(null)}
                className={`flex items-baseline justify-between gap-3 text-sm transition-colors duration-200 ${
                  node.key === active
                    ? 'text-gray-950 dark:text-gray-50'
                    : 'text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50'
                }`}
              >
                <span>{label(node.key)}</span>
                <span className="font-mono text-xs tabular-nums">
                  {String(node.notes).padStart(2, '0')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
