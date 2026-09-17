import type { ReactNode } from 'react';

interface Props {
  /** Chapter number, rendered as `CF / 01`. */
  index: string;
  title: string;
  /** Editorial one-liner under the title, e.g. "Things I build." */
  lede: string;
  id?: string;
  description?: ReactNode;
  aside?: ReactNode;
  tone?: 'default' | 'inverse';
}

export default function SectionHeading({
  index,
  title,
  lede,
  id,
  description,
  aside,
  tone = 'default',
}: Props) {
  const inverse = tone === 'inverse';

  return (
    <header className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="space-y-6">
        <p
          className={`type-meta ${inverse ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          CF / {index}
        </p>
        <h2
          id={id}
          className={`type-section ${inverse ? 'text-gray-50' : 'text-gray-950 dark:text-gray-50'}`}
        >
          {title}
        </h2>
        <p
          className={`type-editorial text-2xl italic sm:text-3xl ${inverse ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}
        >
          {lede}
        </p>
        {description && (
          <p
            className={`max-w-xl text-base leading-7 ${inverse ? 'text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {description}
          </p>
        )}
      </div>
      {aside && <div className="md:pb-2">{aside}</div>}
    </header>
  );
}
