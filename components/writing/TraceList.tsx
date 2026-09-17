import Link from '@/components/Link';
import Reveal from '@/components/motion/Reveal';

export interface Trace {
  key: string;
  href: string;
  title: string;
  date?: string;
  tags: string[];
}

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Writing as an archive timeline: grouped by year, the date is the anchor and
 * the title carries the weight. Shared by the homepage and knowledge focus
 * pages so every list of writing reads the same way.
 */
export default function TraceList({
  traces,
  size = 'large',
}: {
  traces: Trace[];
  size?: 'large' | 'compact';
}) {
  const large = size === 'large';
  const groups = new Map<string, Array<Trace & { day?: string }>>();

  traces.forEach((trace) => {
    const date = trace.date ? new Date(trace.date) : undefined;
    const year = date ? String(date.getFullYear()) : '—';
    const day = date
      ? `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
      : undefined;
    groups.set(year, [...(groups.get(year) || []), { ...trace, day }]);
  });

  return (
    <div className={large ? 'space-y-14' : 'space-y-10'}>
      {[...groups.entries()].map(([year, entries]) => (
        <div key={year}>
          <div className="flex items-center gap-6">
            <span className="type-meta text-gray-950 dark:text-gray-50">
              {year}
            </span>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-gray-900/20 dark:bg-white/20"
            />
          </div>
          <ol className="divide-y divide-gray-900/10 dark:divide-white/10">
            {entries.map((trace) => {
              const linkable = trace.href.startsWith('/');
              return (
                <Reveal
                  as="li"
                  variant="rise"
                  key={trace.key}
                  className={
                    large
                      ? 'grid gap-2 py-7 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-10 md:py-9'
                      : 'grid gap-1.5 py-5 md:grid-cols-[6rem_minmax(0,1fr)] md:gap-8 md:py-6'
                  }
                >
                  {trace.day ? (
                    <time
                      dateTime={trace.date}
                      className={`font-mono text-gray-500 tabular-nums dark:text-gray-400 ${
                        large
                          ? 'text-base md:pt-1.5 md:text-2xl'
                          : 'text-sm md:pt-1 md:text-base'
                      }`}
                    >
                      {trace.day}
                    </time>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <div className={large ? 'space-y-3' : 'space-y-2'}>
                    <h3
                      className={`font-semibold tracking-tight ${
                        large
                          ? 'text-[1.5rem] leading-snug md:text-[2.125rem] md:leading-tight'
                          : 'text-xl leading-snug md:text-2xl'
                      }`}
                    >
                      {linkable ? (
                        <Link
                          href={trace.href}
                          className="decoration-primary-600 dark:decoration-primary-400 text-gray-950 decoration-1 underline-offset-[6px] transition-colors hover:underline dark:text-gray-50"
                        >
                          {trace.title}
                        </Link>
                      ) : (
                        <span className="text-gray-950 dark:text-gray-50">
                          {trace.title}
                        </span>
                      )}
                    </h3>
                    {trace.tags.length > 0 && (
                      <p className="type-meta text-gray-500 dark:text-gray-400">
                        {trace.tags.slice(0, 3).join(' · ')}
                      </p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
