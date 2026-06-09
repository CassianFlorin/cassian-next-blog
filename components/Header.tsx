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
    'flex items-center w-full bg-[#F5F7F0] dark:bg-[#121916] justify-between gap-6 py-3.5';
  if (siteMetadata.stickyNav) {
    headerClass +=
      ' sticky top-0 z-50 backdrop-blur-sm bg-[#F5F7F0]/90 dark:bg-[#121916]/90';
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
        <div ref={logoRef} className="flex items-center justify-between">
          <div className="ring-primary-900/10 mr-3 overflow-hidden rounded-2xl ring-1 dark:ring-white/10">
            <Logo />
          </div>
          {typeof siteMetadata.headerTitle === 'string' ? (
            <div className="hidden h-6 text-xl font-semibold tracking-tight text-gray-800 sm:block dark:text-gray-100">
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
      >
        <div className="no-scrollbar hidden max-w-40 items-center gap-x-5 overflow-x-auto sm:flex md:max-w-72 lg:max-w-96">
          {headerNavLinks
            .filter((link) => link.href !== '/')
            .map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium text-gray-600 transition-colors duration-200 dark:text-gray-300"
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
