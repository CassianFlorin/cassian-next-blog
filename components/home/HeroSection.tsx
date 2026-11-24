import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

const stage = (delay: number) =>
  ({ ['--stage-delay' as string]: `${delay}ms` }) as CSSProperties;

export default async function HeroSection() {
  const t = await getTranslations('home.hero');
  const lines = t.raw('lines') as string[];
  const areas = t.raw('areas') as string[];

  return (
    <section
      aria-labelledby="hero-title"
      className="bleed relative isolate overflow-hidden"
    >
      <div className="container-atelier flex min-h-svh flex-col justify-between gap-10 pt-24 pb-8 md:pt-48 md:pb-10">
        <p
          className="type-meta hero-stage text-gray-600 dark:text-gray-400"
          style={stage(0)}
        >
          CF / 00
        </p>

        <div className="max-w-4xl">
          <h1
            id="hero-title"
            className="type-hero hero-stage text-gray-950 dark:text-gray-50"
            style={stage(120)}
          >
            <span className="block">Cassian</span>
            <span className="block">Florin</span>
          </h1>

          <p className="type-editorial mt-7 text-[2rem] leading-[1.08] text-gray-800 sm:text-5xl md:mt-8 dark:text-gray-200">
            {lines.map((line, index) => (
              <span
                key={line}
                className="hero-stage block"
                style={stage(720 + index * 110)}
              >
                {line}
              </span>
            ))}
          </p>

          <ul
            className="type-meta hero-stage mt-8 flex flex-wrap gap-x-6 gap-y-2 text-gray-600 dark:text-gray-300"
            style={stage(1120)}
          >
            {areas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
          <p
            className="hero-stage mt-5 max-w-sm text-sm leading-6 text-gray-600 dark:text-gray-400"
            style={stage(1180)}
          >
            {t('summary')}
          </p>
        </div>

        <a
          href="#work"
          className="type-meta hero-stage group inline-flex items-center gap-3 self-start text-gray-800 dark:text-gray-200"
          style={stage(1400)}
        >
          {t('explore')}
          <span
            aria-hidden="true"
            className="ease-atelier transition-transform duration-200 group-hover:translate-y-1"
          >
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
