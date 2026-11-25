import { getTranslations } from 'next-intl/server';
import HeroMotion from '@/components/motion/HeroMotion';

/**
 * CF / 00. Rendered on the server, choreographed on the client by HeroMotion
 * through the `data-hero` marks (name, lines, meta, areas, summary, cue).
 */
export default async function HeroSection() {
  const t = await getTranslations('home.hero');
  const lines = t.raw('lines') as string[];
  const areas = t.raw('areas') as string[];

  return (
    <section
      aria-labelledby="hero-title"
      className="bleed relative isolate overflow-hidden"
    >
      <HeroMotion className="container-atelier flex min-h-svh flex-col justify-between gap-10 pt-24 pb-8 md:pt-48 md:pb-10">
        <p
          data-hero="meta"
          className="type-meta text-gray-600 dark:text-gray-400"
        >
          CF / 00
        </p>

        <div className="max-w-4xl">
          <h1
            id="hero-title"
            data-hero="name"
            className="type-hero text-gray-950 dark:text-gray-50"
          >
            <span className="block">Cassian</span>
            <span className="block">Florin</span>
          </h1>

          <p className="type-editorial mt-7 text-[2rem] leading-[1.08] text-gray-800 sm:text-5xl md:mt-8 dark:text-gray-200">
            {lines.map((line) => (
              <span key={line} data-hero="line" className="block">
                {line}
              </span>
            ))}
          </p>

          <ul
            data-hero="areas"
            className="type-meta mt-8 flex flex-wrap gap-x-6 gap-y-2 text-gray-600 dark:text-gray-300"
          >
            {areas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
          <p
            data-hero="summary"
            className="mt-5 max-w-sm text-sm leading-6 text-gray-600 dark:text-gray-400"
          >
            {t('summary')}
          </p>
        </div>

        <a
          href="#work"
          data-hero="cue"
          className="type-meta group inline-flex items-center gap-3 self-start text-gray-800 dark:text-gray-200"
        >
          {t('explore')}
          <span
            aria-hidden="true"
            className="ease-atelier transition-transform duration-200 group-hover:translate-y-1"
          >
            ↓
          </span>
        </a>
      </HeroMotion>
    </section>
  );
}
