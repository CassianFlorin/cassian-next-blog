import TextReveal from '@/components/motion/TextReveal';
import type { ReactNode } from 'react';
import type { Authors } from 'contentlayer/generated';
import { getLocale, getTranslations } from 'next-intl/server';
import AboutObservatory, {
  type ObservatoryStation,
} from '@/components/about/AboutObservatory';
import { getAboutScene } from '@/lib/aboutSceneData';
import Image from '@/components/Image';
import Link from '@/components/Link';
import siteMetadata from '@/data/siteMetadata';

interface Props {
  children: ReactNode;
  content: Omit<Authors, '_id' | '_raw' | 'body'>;
}

/**
 * CF / 04 · About. The editorial intro, then the profile read beside the
 * observatory: a 3D view of the whole site gathered around one person, which
 * turns to a new viewpoint for each section of the profile.
 */
export default async function AuthorLayout({ children, content }: Props) {
  const t = await getTranslations('home.about');
  const { name, avatar, occupation, email, twitter, github } = content;
  const body = t.raw('body') as string[];
  const focus = t.raw('focus') as string[];
  const locale = await getLocale();
  const stations = t.raw('observatory.stations') as ObservatoryStation[];
  const scene = getAboutScene(
    locale,
    focus,
    t.raw('observatory.roots') as string[],
  );

  const links = [
    github && { label: 'GitHub', href: github },
    twitter && { label: 'X', href: twitter },
    email && { label: t('email'), href: `mailto:${email}` },
  ].filter((link): link is { label: string; href: string } => Boolean(link));

  return (
    <div className="bleed">
      <div className="container-atelier pb-8">
        <header className="grid gap-10 pt-6 md:pt-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="space-y-6">
            <p className="type-meta text-gray-500 dark:text-gray-400">
              CF / 04
            </p>
            <TextReveal
              as="h1"
              on="mount"
              className="type-section text-gray-950 dark:text-gray-50"
            >
              {t('title')}
            </TextReveal>
            <p className="type-editorial text-2xl text-gray-600 italic sm:text-3xl dark:text-gray-300">
              {name || siteMetadata.author}
            </p>
          </div>
          <div className="space-y-4 text-lg leading-8 text-gray-700 lg:pb-2 dark:text-gray-300">
            {body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </header>

        <div className="mt-16 grid gap-14 md:mt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 xl:gap-20">
          <aside className="lg:sticky lg:top-8 lg:order-last lg:self-start">
            <AboutObservatory
              data={scene}
              stations={stations}
              label={t('observatory.label')}
              hint={t('observatory.hint')}
              hintTouch={t('observatory.hintTouch')}
              profileId="about-profile"
            />
          </aside>

          <div className="min-w-0 space-y-12">
            <div className="grid gap-6 border-y border-gray-900/15 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center dark:border-white/15">
              {avatar && (
                <div className="relative size-20 overflow-hidden">
                  <Image
                    src={avatar}
                    alt={`${name}, portrait over misty mountains`}
                    fill
                    sizes="5rem"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="space-y-3">
                <p className="space-x-3">
                  <span className="text-xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                    {name}
                  </span>
                  {occupation && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {occupation}
                    </span>
                  )}
                </p>
                <ul className="type-meta flex flex-wrap gap-x-5 gap-y-1 text-gray-600 dark:text-gray-300">
                  {focus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <ul className="flex flex-wrap gap-6">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="type-meta inline-flex items-center gap-1.5 text-gray-950 underline-offset-4 hover:underline dark:text-gray-50"
                      >
                        {link.label}
                        <span aria-hidden="true" className="text-gray-500">
                          ↗
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              id="about-profile"
              className="prose prose-gray dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-lg prose-h2:scroll-mt-8 max-w-3xl min-w-0"
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
