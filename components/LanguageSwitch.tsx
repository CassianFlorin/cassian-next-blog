'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeConfig } from '@/lib/i18nRouting';

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
    <div className="relative inline-block text-left">
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeConfig[loc].flag} {localeConfig[loc].name}
          </option>
        ))}
      </select>
    </div>
  );
}
