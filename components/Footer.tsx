import { getTranslations } from 'next-intl/server';
import siteMetadata from '@/data/siteMetadata';
import CFMark from './brand/CFMark';
import Link from './Link';

const SIGNATURE = ['Building things.', 'Mapping ideas.', 'Leaving traces.'];

export default async function Footer() {
  const t = await getTranslations('footer');
  const links = [
    { label: t('about'), href: '/about' },
    { label: t('contact'), href: `mailto:${siteMetadata.email}` },
    { label: t('privacy'), href: '/privacy' },
  ];

  return (
    <footer className="bleed mt-24 border-t border-gray-900/15 dark:border-white/15">
      <div className="container-atelier grid gap-10 pt-12 pb-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-5">
          <CFMark className="text-5xl text-gray-950 dark:text-gray-50" />
          <p className="type-meta text-gray-600 dark:text-gray-400">
            {siteMetadata.author}
          </p>
          <p className="type-editorial text-xl leading-snug text-gray-600 italic dark:text-gray-300">
            {SIGNATURE.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
        <div className="space-y-4 sm:text-right">
          <ul className="type-meta flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-gray-600 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-gray-50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="type-meta text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} {siteMetadata.author}
          </p>
        </div>
      </div>
    </footer>
  );
}
