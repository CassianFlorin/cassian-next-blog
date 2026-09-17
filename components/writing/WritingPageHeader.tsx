import type { ReactNode } from 'react';
import Link from '@/components/Link';

/**
 * Header shared by the writing archive, topic index and single-topic pages:
 * a CF / 03 breadcrumb, a display title, an editorial lede and a description.
 */
export default function WritingPageHeader({
  crumbs,
  title,
  lede,
  description,
  meta,
}: {
  crumbs: { label: string; href?: string }[];
  title: string;
  lede?: string;
  description?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="pt-6 md:pt-10">
      <nav aria-label="Breadcrumb" className="type-meta">
        <ol className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-400">
          {crumbs.map((crumb, i) => (
            <li key={crumb.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-gray-950 dark:hover:text-gray-50"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className="text-gray-950 dark:text-gray-50"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
        <div className="min-w-0 space-y-6">
          <h1 className="type-section break-words text-gray-950 dark:text-gray-50">
            {title}
          </h1>
          {lede && (
            <p className="type-editorial text-2xl text-gray-600 italic sm:text-3xl dark:text-gray-300">
              {lede}
            </p>
          )}
        </div>
        {(description || meta) && (
          <div className="space-y-4 lg:pb-2">
            {description && (
              <p className="text-base leading-7 text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
            {meta}
          </div>
        )}
      </div>
    </header>
  );
}
