'use client';

import { useRef } from 'react';
import siteMetadata from '@/data/siteMetadata';
import headerNavLinks from '@/data/headerNavLinks';
import Logo from '@/data/logo.svg';
import Link from './Link';
import MobileNav from './MobileNav';
import ThemeSwitch from './ThemeSwitch';
import SearchButton from './SearchButton';
import LanguageSwitch from './LanguageSwitch';
import { useTranslations } from 'next-intl';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeIn, fadeInUp } from '@/lib/animations/fadeIn';

const Header = () => {
  const t = useTranslations();
  const logoRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  let headerClass =
    'flex items-center w-full bg-white dark:bg-gray-950 justify-between py-10';
  if (siteMetadata.stickyNav) {
    headerClass += ' sticky top-0 z-50';
  }

  useAnime({
    targets: logoRef,
    ...fadeIn(0),
    translateY: [-12, 0],
  });

  useAnime({
    targets: navRef,
    ...fadeInUp(80, 'light'),
    translateY: [-12, 0],
  });

  return (
    <header className={headerClass}>
      <Link href="/" aria-label={siteMetadata.headerTitle}>
        <div
          ref={logoRef}
          className="flex items-center justify-between"
          style={{ opacity: 0 }}
        >
          <div className="mr-3">
            <Logo />
          </div>
          {typeof siteMetadata.headerTitle === 'string' ? (
            <div className="hidden h-6 text-2xl font-semibold sm:block">
              {siteMetadata.headerTitle}
            </div>
          ) : (
            siteMetadata.headerTitle
          )}
        </div>
      </Link>
      <div
        ref={navRef}
        className="flex items-center space-x-4 leading-5 sm:-mr-6 sm:space-x-6"
        style={{ opacity: 0 }}
      >
        <div className="no-scrollbar hidden max-w-40 items-center gap-x-4 overflow-x-auto sm:flex md:max-w-72 lg:max-w-96">
          {headerNavLinks
            .filter((link) => link.href !== '/')
            .map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="hover:text-primary-500 dark:hover:text-primary-400 m-1 font-medium text-gray-900 transition-all duration-200 hover:scale-105 dark:text-gray-100"
              >
                {t(link.title)}
              </Link>
            ))}
        </div>
        <SearchButton />
        <LanguageSwitch />
        <ThemeSwitch />
        <MobileNav />
      </div>
    </header>
  );
};

export default Header;
