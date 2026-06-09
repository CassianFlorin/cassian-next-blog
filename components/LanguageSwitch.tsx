'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales } from '@/lib/i18nRouting';

const navLanguageLabels = {
  zh: '🇨🇳 中文',
  en: '🇺🇸 EN',
} as const;

export default function LanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    const localePrefix = `/${locale}`;
    const pathWithoutLocale =
      pathname === localePrefix
        ? '/'
        : pathname.startsWith(`${localePrefix}/`)
          ? pathname.slice(localePrefix.length)
          : pathname;
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; samesite=lax`;
    router.push(newPath);
  };

  return (
    <div className="relative inline-flex items-center text-left">
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="border-primary-900/10 focus:ring-primary-500 h-9 min-w-[5.9rem] rounded-full border bg-transparent py-1.5 pr-2 pl-3 text-sm font-medium text-gray-700 transition-colors hover:bg-white/50 focus:ring-2 focus:outline-none dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {navLanguageLabels[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
