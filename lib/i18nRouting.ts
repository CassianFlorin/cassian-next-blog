export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export const localeConfig = {
  zh: {
    name: '中文',
    flag: '🇨🇳',
    dir: 'ltr' as const,
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr' as const,
  },
};

export function isLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && locales.includes(locale as Locale);
}
