import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import Link from '@/components/Link';
import SectionHeading from '@/components/brand/SectionHeading';
import siteMetadata from '@/data/siteMetadata';

export default async function AboutSection() {
  const t = await getTranslations('home.about');
  const body = t.raw('body') as string[];
  const focus = t.raw('focus') as string[];

  const links = [
    { label: 'GitHub', href: siteMetadata.github },
    { label: 'X', href: siteMetadata.x },
    { label: t('email'), href: `mailto:${siteMetadata.email}` },
  ];

  // Static and calm by design: no scroll motion in this chapter.
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="bleed bg-night relative isolate overflow-hidden text-gray-100"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-25">
        <Image
          src="/static/images/avatar.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[50%_88%]"
        />
        <div className="bg-night/60 absolute inset-0" />
      </div>

      <div className="container-atelier grid gap-16 py-24 md:py-36 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end">
        <SectionHeading
          id="about-title"
          index="04"
          title={t('title')}
          lede={t('lede')}
          tone="inverse"
        />

        <div className="space-y-12">
          <div className="space-y-5 text-xl leading-relaxed text-gray-200 md:text-2xl">
            {body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <ul className="type-meta grid grid-cols-2 gap-y-3 border-t border-white/15 pt-6 text-gray-500">
            {focus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <ul className="flex flex-wrap gap-6">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="type-meta inline-flex items-center gap-1.5 text-gray-200 transition-colors hover:text-white"
                  >
                    {link.label}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/about"
              className="type-meta group inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-white"
            >
              {t('more')}
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
