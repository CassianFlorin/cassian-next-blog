'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

const ORDER = ['system', 'light', 'dark'] as const;
type ThemeChoice = (typeof ORDER)[number];

/**
 * A quiet text toggle that cycles system → light → dark, matching the
 * editorial navigation instead of an icon dropdown.
 */
const ThemeSwitch = ({ className = '' }: { className?: string }) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations('theme');

  useEffect(() => setMounted(true), []);

  const current: ThemeChoice = ORDER.includes(theme as ThemeChoice)
    ? (theme as ThemeChoice)
    : 'system';
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${t('toggle')}: ${mounted ? t(current) : ''}`}
      className={`type-meta inline-flex min-h-9 items-center gap-2 text-gray-500 transition-colors duration-200 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50 ${className}`}
    >
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 rounded-full border border-current [background:linear-gradient(90deg,currentColor_50%,transparent_50%)]"
      />
      <span className="min-w-[3.5rem] text-left">
        {mounted ? t(current) : ' '}
      </span>
    </button>
  );
};

export default ThemeSwitch;
