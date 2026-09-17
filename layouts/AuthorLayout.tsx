import type { ReactNode } from 'react';
import type { Authors } from 'contentlayer/generated';
import { getTranslations } from 'next-intl/server';
import Image from '@/components/Image';
import Link from '@/components/Link';
import siteMetadata from '@/data/siteMetadata';

interface Props {
  children: ReactNode;
  content: Omit<Authors, '_id' | '_raw' | 'body'>;
}

/**
 * CF / 04 · About. Short on purpose: the editorial intro from the homepage,
 * the portrait as atmosphere, then the long-form profile from the author MDX.
 */
export default async function AuthorLayout({ children, content }: Props) {
  const t = await getTranslations('home.about');
  const { name, avatar, occupation, email, twitter, github } = content;
  const body = t.raw('body') as string[];
  const focus = t.raw('focus') as string[];

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
            <h1 className="type-section text-gray-950 dark:text-gray-50">
              {t('title')}
            </h1>
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

        <div className="mt-16 grid gap-14 md:mt-24 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-20">
          <aside className="space-y-10 lg:sticky lg:top-8 lg:self-start">
            {avatar && (
              <div className="relative aspect-square w-full max-w-72 overflow-hidden">
                <Image
                  src={avatar}
                  alt={`${name}, portrait over misty mountains`}
                  fill
                  sizes="(min-width: 1024px) 18rem, 18rem"
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
                {name}
              </p>
              {occupation && (
                <p className="leading-7 text-gray-600 dark:text-gray-400">
                  {occupation}
                </p>
              )}
            </div>
            <ul className="type-meta grid grid-cols-2 gap-y-2 border-t border-gray-900/15 pt-5 text-gray-600 dark:border-white/15 dark:text-gray-300">
              {focus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-6 border-t border-gray-900/15 pt-5 dark:border-white/15">
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
          </aside>

          <div className="prose prose-gray dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-lg max-w-3xl min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
