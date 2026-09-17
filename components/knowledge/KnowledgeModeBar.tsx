import { getTranslations } from 'next-intl/server';
import Link from '@/components/Link';

/**
 * The two ways into the knowledge map. Explore is the whole graph at
 * /knowledge; Focus is one territory at /knowledge/[node]. From Explore, the
 * Focus tab jumps to the territory index further down the page.
 */
export default async function KnowledgeModeBar({
  mode,
}: {
  mode: 'explore' | 'focus';
}) {
  const t = await getTranslations('knowledge');
  const tabs = [
    { id: 'explore', label: t('modeExplore'), href: '/knowledge' },
    {
      id: 'focus',
      label: t('modeFocus'),
      href: mode === 'explore' ? '#territories' : undefined,
    },
  ] as const;

  return (
    <nav aria-label={t('modeLabel')} className="type-meta flex items-center">
      {tabs.map((tab, index) => {
        const current = tab.id === mode;
        const className = `inline-flex min-h-10 items-center border px-4 transition-colors duration-200 ${
          index > 0 ? '-ml-px' : ''
        } ${
          current
            ? 'border-gray-950 bg-gray-950 text-gray-50 dark:border-gray-50 dark:bg-gray-50 dark:text-gray-950'
            : 'border-gray-900/25 text-gray-600 hover:text-gray-950 dark:border-white/25 dark:text-gray-300 dark:hover:text-gray-50'
        }`;
        if (current || !tab.href) {
          return (
            <span
              key={tab.id}
              aria-current={current ? 'page' : undefined}
              className={className}
            >
              {tab.label}
            </span>
          );
        }
        return (
          <Link key={tab.id} href={tab.href} className={className}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
