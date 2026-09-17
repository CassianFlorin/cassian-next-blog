'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales } from '@/lib/i18nRouting';

const languageLabels = {
  zh: '中文',
  en: 'EN',
} as const;

export default function LanguageSwitch({
  className = '',
}: {
  className?: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return;
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
    <div
      role="group"
      aria-label="Language"
      className={`type-meta inline-flex min-h-9 items-center gap-1 ${className}`}
    >
      {locales.map((loc, index) => (
        <span key={loc} className="inline-flex items-center gap-1">
          {index > 0 && (
            <span aria-hidden="true" className="text-gray-400">
              /
            </span>
          )}
          <button
            type="button"
            lang={loc === 'zh' ? 'zh-CN' : 'en'}
            aria-pressed={loc === locale}
            onClick={() => handleLanguageChange(loc)}
            className={`px-0.5 transition-colors duration-200 ${
              loc === locale
                ? 'text-gray-950 dark:text-gray-50'
                : 'text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-50'
            }`}
          >
            {languageLabels[loc]}
          </button>
        </span>
      ))}
    </div>
  );
}
