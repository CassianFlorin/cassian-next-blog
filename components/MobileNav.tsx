'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import siteMetadata from '@/data/siteMetadata';
import headerNavLinks from '@/data/headerNavLinks';
import { isNavActive } from '@/lib/navigation';
import CFMark from './brand/CFMark';
import Link from './Link';
import ThemeSwitch from './ThemeSwitch';
import LanguageSwitch from './LanguageSwitch';
import SearchButton from './SearchButton';

/**
 * Mobile navigation: `CF ··· MENU` in the header, opening a full-screen
 * overlay. Headless UI's Dialog handles focus trapping, Escape and scroll
 * locking; the staggered entrance is plain CSS so reduced motion is honoured.
 */
const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();

  // Close after navigation completes rather than on click, so the overlay
  // never flashes the old page underneath.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="type-meta min-h-11 text-gray-800 md:hidden dark:text-gray-200"
      >
        {t('common.menu')}
      </button>

      <Dialog open={open} onClose={setOpen} className="relative z-70 md:hidden">
        <DialogPanel
          transition
          className="dark:bg-night fixed inset-0 flex flex-col bg-gray-50 px-4 pt-6 pb-8 transition duration-300 ease-out data-closed:opacity-0 sm:px-6"
        >
          <div className="flex items-start justify-between">
            <Link
              href="/"
              aria-label={siteMetadata.headerTitle}
              className="text-gray-950 dark:text-gray-50"
            >
              <CFMark className="text-[2rem]" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="type-meta min-h-11 text-gray-800 dark:text-gray-200"
            >
              {t('common.close')}
            </button>
          </div>

          <nav aria-label={t('common.primaryNav')} className="mt-16 flex-1">
            <ul className="divide-y divide-gray-900/10 border-y border-gray-900/10 dark:divide-white/10 dark:border-white/10">
              {headerNavLinks.map((link, index) => {
                const active = isNavActive(pathname, link.href);
                return (
                  <li
                    key={link.href}
                    className="mobile-nav-item"
                    style={{ transitionDelay: `${80 + index * 70}ms` }}
                  >
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className="flex items-baseline justify-between py-5"
                    >
                      <span
                        className={`text-4xl font-semibold tracking-tight uppercase ${
                          active
                            ? 'text-gray-950 dark:text-gray-50'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {t(link.title)}
                      </span>
                      <span className="type-meta text-gray-500 dark:text-gray-400">
                        CF / {link.index}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-between gap-4 border-t border-gray-900/10 pt-5 dark:border-white/10">
            <div className="flex items-center gap-5">
              <SearchButton />
              <LanguageSwitch />
            </div>
            <ThemeSwitch />
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
};

export default MobileNav;
