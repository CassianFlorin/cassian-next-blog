/**
 * Runtime locale values, shared by the app (via `lib/i18nRouting.ts`, which
 * adds the types) and by plain-node build scripts such as `scripts/rss.mjs`.
 *
 * Kept in its own `.mjs` file rather than next to the types so bundler module
 * resolution never has to choose between a `.ts` and a `.mjs` of the same name.
 */
export const locales = ['zh', 'en'];

export const defaultLocale = 'zh';

export const localeConfig = {
  zh: {
    name: '中文',
    flag: '🇨🇳',
    dir: 'ltr',
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
  },
};
