import Link from './Link';
import siteMetadata from '@/data/siteMetadata';
import headerNavLinks from '@/data/headerNavLinks';
import SocialIcon from '@/components/social-icons';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="mt-20 border-t border-gray-900/10 dark:border-white/10">
      <div className="grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <p className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {siteMetadata.author}
          </p>
          <p className="max-w-md text-sm leading-6 text-gray-600 dark:text-gray-400">
            {t('home.description')}
          </p>
          <div className="flex gap-4 pt-1">
            <SocialIcon
              kind="mail"
              href={`mailto:${siteMetadata.email}`}
              size={5}
            />
            <SocialIcon kind="github" href={siteMetadata.github} size={5} />
            <SocialIcon kind="x" href={siteMetadata.x} size={5} />
          </div>
        </div>

        <nav className="flex flex-col gap-2.5 md:items-end">
          {headerNavLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="hover:text-primary-800 dark:hover:text-primary-300 w-fit text-sm font-medium text-gray-600 transition-colors duration-200 dark:text-gray-300"
            >
              {t(link.title)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-900/10 py-6 text-sm text-gray-500 dark:border-white/10 dark:text-gray-500">
        <span>{`© ${new Date().getFullYear()} ${siteMetadata.author}`}</span>
        <span>{t('footer.copyright')}</span>
      </div>
    </footer>
  );
}
