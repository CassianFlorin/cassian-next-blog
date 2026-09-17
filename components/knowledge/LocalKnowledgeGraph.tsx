'use client';

import { useState, type MouseEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Reveal from '@/components/motion/Reveal';
import type { LocalGraph } from '@/lib/knowledgeLocalGraph';
import { knowledgeNodeHref } from '@/lib/knowledgeNodes';

type Active = { kind: 'related' | 'topic'; id: string } | null;

/**
 * Focus-mode graph for one territory. Hovering a related territory lights its
 * bond; hovering a topic lights its spoke. Everything is a real link, so the
 * graph is keyboard reachable and works as navigation, not decoration.
 */
export default function LocalKnowledgeGraph({ graph }: { graph: LocalGraph }) {
  const t = useTranslations('knowledge');
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const [active, setActive] = useState<Active>(null);
  const { center } = graph;
  const label = (key: string) => t(`nodes.${key}.label`);

  const localized = (href: string) =>
    params?.locale ? `/${params.locale}${href}` : href;
  const navigate = (event: MouseEvent, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    router.push(localized(href));
  };
  const lit = (kind: 'related' | 'topic', id: string) =>
    !active || (active.kind === kind && active.id === id);

  return (
    <Reveal variant="graph" className="-mx-2 sm:mx-0">
      <svg
        viewBox={`-60 -30 ${graph.width + 120} ${graph.height + 80}`}
        role="group"
        aria-label={t('localGraphLabel', { node: label(center.key) })}
        className="h-auto w-full overflow-visible"
        onMouseLeave={() => setActive(null)}
      >
        {graph.related.map((node, i) => (
          <line
            key={`edge-${node.key}`}
            className="graph-edge text-gray-950 dark:text-gray-50"
            style={{ ['--reveal-index' as string]: i * 0.5 + 1 }}
            x1={center.x}
            y1={center.y}
            x2={node.x}
            y2={node.y}
            stroke="currentColor"
            strokeWidth={0.75 + (node.weight / graph.maxWeight) * 2}
            strokeOpacity={
              lit('related', node.key) ? (active ? 0.6 : 0.2) : 0.05
            }
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {graph.topics.map((topic, i) => (
          <g
            key={`topic-${topic.slug}`}
            className="graph-node"
            style={{ ['--reveal-index' as string]: i * 0.5 + 2 }}
          >
            <a
              href={localized(`/tags/${topic.slug}`)}
              onClick={(event) => navigate(event, `/tags/${topic.slug}`)}
              onMouseEnter={() => setActive({ kind: 'topic', id: topic.slug })}
              onFocus={() => setActive({ kind: 'topic', id: topic.slug })}
              onBlur={() => setActive(null)}
              className="outline-none"
              style={{
                opacity: lit('topic', topic.slug) ? 1 : 0.25,
                transition: 'opacity 250ms var(--ease-atelier)',
              }}
            >
              <line
                x1={center.x}
                y1={center.y}
                x2={topic.x}
                y2={topic.y}
                stroke="currentColor"
                strokeOpacity={0.22}
                strokeDasharray="2 5"
                vectorEffect="non-scaling-stroke"
                className="text-gray-950 dark:text-gray-50"
              />
              <circle cx={topic.x} cy={topic.y} r={18} fill="transparent" />
              <circle
                cx={topic.x}
                cy={topic.y}
                r={4.5}
                className="fill-gray-500 dark:fill-gray-400"
              />
              <text
                x={topic.labelX}
                y={topic.labelY}
                textAnchor={topic.anchor}
                className="fill-gray-600 font-mono text-[26px] sm:text-[18px] lg:text-[15px] dark:fill-gray-300"
              >
                {topic.label}
              </text>
            </a>
          </g>
        ))}

        {graph.related.map((node, i) => (
          <g
            key={`node-${node.key}`}
            className="graph-node"
            style={{ ['--reveal-index' as string]: i + 1 }}
          >
            <a
              href={localized(knowledgeNodeHref(node.key))}
              aria-label={t('focusNode', { node: label(node.key) })}
              onClick={(event) => navigate(event, knowledgeNodeHref(node.key))}
              onMouseEnter={() => setActive({ kind: 'related', id: node.key })}
              onFocus={() => setActive({ kind: 'related', id: node.key })}
              onBlur={() => setActive(null)}
              className="cursor-pointer outline-none"
              style={{
                opacity: lit('related', node.key) ? 1 : 0.25,
                transition: 'opacity 250ms var(--ease-atelier)',
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 28}
                fill="transparent"
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
                className={
                  active?.kind === 'related' && active.id === node.key
                    ? 'fill-primary-600 stroke-primary-700 dark:fill-primary-400 dark:stroke-primary-300'
                    : 'dark:fill-night fill-gray-50 stroke-gray-950 dark:stroke-gray-50'
                }
                style={{ transition: 'fill 200ms, stroke 200ms' }}
              />
              <text
                x={node.x}
                y={node.y + node.r + 30}
                textAnchor="middle"
                className="fill-gray-950 font-mono text-[28px] tracking-[0.08em] uppercase sm:text-[20px] lg:text-[16px] dark:fill-gray-50"
              >
                {label(node.key)}
              </text>
            </a>
          </g>
        ))}

        <g className="graph-node" style={{ ['--reveal-index' as string]: 0 }}>
          <circle
            cx={center.x}
            cy={center.y}
            r={center.r}
            className="fill-primary-700 dark:fill-primary-300"
          />
          <circle
            cx={center.x}
            cy={center.y}
            r={center.r + 10}
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="stroke-primary-700/40 dark:stroke-primary-300/40"
          />
        </g>
      </svg>
    </Reveal>
  );
}
