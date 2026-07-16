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
import { fadeIn } from '@/lib/animations/fadeIn';

const Header = () => {
  const t = useTranslations();
  const shellRef = useRef<HTMLDivElement>(null);

  useAnime({
    targets: shellRef,
    ...fadeIn(0),
    translateY: [-16, 0],
  });

  return (
    <header className="pt-3 pb-4">
      <div
        ref={shellRef}
        className="flex items-center justify-between gap-3 rounded-full border border-gray-900/10 bg-white/70 py-2 pr-2.5 pl-3 shadow-[0_12px_40px_rgba(10,18,15,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/55 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
      >
        <Link
          href="/"
          aria-label={siteMetadata.headerTitle}
          className="flex shrink-0 items-center gap-2.5"
        >
          <div className="ring-primary-900/10 overflow-hidden rounded-full ring-1 dark:ring-white/15">
            <Logo />
          </div>
          <span className="hidden text-base font-semibold tracking-tight text-gray-900 sm:block dark:text-gray-50">
            {siteMetadata.headerTitle}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {headerNavLinks
            .filter((link) => link.href !== '/')
            .map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="hover:text-primary-800 dark:hover:text-primary-300 rounded-full px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-900/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.06]"
              >
                {t(link.title)}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <SearchButton />
          <LanguageSwitch />
          <ThemeSwitch />
          <MobileNav />
        </div>
      </div>
    </header>
  );
};

export default Header;
