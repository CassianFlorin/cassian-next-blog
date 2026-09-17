'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import siteMetadata from '@/data/siteMetadata';
import headerNavLinks from '@/data/headerNavLinks';
import { isNavActive } from '@/lib/navigation';
import CFMark from './brand/CFMark';
import Link from './Link';
import MobileNav from './MobileNav';
import ThemeSwitch from './ThemeSwitch';
import SearchButton from './SearchButton';
import LanguageSwitch from './LanguageSwitch';

const Header = () => {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <header className="bleed">
      <div className="container-atelier flex items-start justify-between gap-6 pt-6 pb-6 md:pt-8 md:pb-10">
        <Link
          href="/"
          aria-label={siteMetadata.headerTitle}
          className="group flex items-center gap-3 text-gray-950 dark:text-gray-50"
        >
          <CFMark className="text-[2rem]" />
          <span className="type-meta hidden text-gray-600 transition-colors duration-200 group-hover:text-gray-950 sm:block dark:text-gray-400 dark:group-hover:text-gray-50">
            {siteMetadata.headerTitle}
          </span>
        </Link>

        <div className="hidden items-start gap-12 md:flex">
          <div className="flex items-center gap-5 pt-0.5">
            <SearchButton />
            <LanguageSwitch />
            <ThemeSwitch />
          </div>

          <nav aria-label={t('common.primaryNav')}>
            <ul className="grid gap-1.5">
              {headerNavLinks.map((link) => {
                const active = isNavActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-baseline justify-end gap-3 text-sm leading-6 transition-colors duration-200 ${
                        active
                          ? 'text-gray-950 dark:text-gray-50'
                          : 'text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`type-meta transition-opacity duration-200 ${
                          active
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                        }`}
                      >
                        {link.index}
                      </span>
                      <span className="min-w-[4.5rem] text-right">
                        {t(link.title)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <MobileNav />
      </div>
    </header>
  );
};

export default Header;
