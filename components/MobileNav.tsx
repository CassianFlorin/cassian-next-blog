'use client';

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import {
  disableBodyScroll,
  enableBodyScroll,
  clearAllBodyScrollLocks,
} from 'body-scroll-lock';
import { Fragment, useState, useEffect, useRef } from 'react';
import Link from './Link';
import headerNavLinks from '@/data/headerNavLinks';
import { useTranslations } from 'next-intl';
import { animate, stagger, JSAnimation } from 'animejs';
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations/fadeIn';

const MobileNav = () => {
  const [navShow, setNavShow] = useState(false);
  const navRef = useRef(null);
  const navLinksRef = useRef<HTMLElement>(null);
  const t = useTranslations();

  const onToggleNav = () => {
    setNavShow((status) => {
      if (status) {
        enableBodyScroll(navRef.current);
      } else {
        disableBodyScroll(navRef.current);
      }
      return !status;
    });
  };

  useEffect(() => {
    return clearAllBodyScrollLocks;
  }, []);

  useEffect(() => {
    const animationRef = { current: null as JSAnimation | null };
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (!navShow || !navLinksRef.current) return;

    const links = navLinksRef.current.querySelectorAll<HTMLElement>('a');

    if (reducedMotion) {
      links.forEach((link) => {
        link.style.opacity = '1';
        link.style.removeProperty('transform');
      });
      return;
    }

    animationRef.current = animate(links, {
      opacity: [0, 1],
      translateX: [-34, 0],
      easing: ANIMATION_EASING.snappy,
      duration: ANIMATION_DURATION.normal,
      delay: stagger(70, { start: 120 }),
    });

    return () => {
      animationRef.current?.pause();
    };
  }, [navShow]);

  return (
    <>
      <button
        aria-label="Toggle Menu"
        onClick={onToggleNav}
        className="transition-colors duration-200 sm:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-6 w-6 text-gray-600 transition-colors duration-200 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <Transition appear show={navShow} as={Fragment} unmount={false}>
        <Dialog as="div" onClose={onToggleNav} unmount={false}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            unmount={false}
          >
            <div className="fixed inset-0 z-60 bg-black/25" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-x-full opacity-0"
            enterTo="translate-x-0 opacity-95"
            leave="transition ease-in duration-200 transform"
            leaveFrom="translate-x-0 opacity-95"
            leaveTo="translate-x-full opacity-0"
            unmount={false}
          >
            <DialogPanel
              ref={navRef}
              className="fixed top-0 left-0 z-70 h-full w-full bg-[#FAFAF8]/98 duration-300 dark:bg-[#1a1a1a]/98"
            >
              <nav
                ref={navLinksRef}
                className="mt-8 flex h-full basis-0 flex-col items-start overflow-y-auto pt-2 pl-12 text-left"
              >
                {headerNavLinks.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="hover:text-primary-600 dark:hover:text-primary-400 mb-4 py-2 pr-4 text-xl font-medium tracking-wide text-gray-700 outline outline-0 transition-all duration-200 hover:translate-x-1 dark:text-gray-200"
                    onClick={onToggleNav}
                    style={{ opacity: 0 }}
                  >
                    {t(link.title)}
                  </Link>
                ))}
              </nav>

              <button
                className="fixed top-7 right-4 z-80 h-16 w-16 p-4 text-gray-500 transition-all duration-200 hover:rotate-90 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Toggle Menu"
                onClick={onToggleNav}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
};

export default MobileNav;
