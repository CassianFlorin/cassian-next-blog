import {
  locales as runtimeLocales,
  defaultLocale as runtimeDefaultLocale,
  localeConfig as runtimeLocaleConfig,
} from './locales.mjs';

export const locales = runtimeLocales as unknown as readonly ['zh', 'en'];
export type Locale = (typeof locales)[number];

export const defaultLocale = runtimeDefaultLocale as Locale;

export const localeConfig = runtimeLocaleConfig as unknown as Record<
  Locale,
  { name: string; flag: string; dir: 'ltr' | 'rtl' }
>;

export function isLocale(locale: unknown): locale is Locale {
  return (
    typeof locale === 'string' &&
    (locales as readonly string[]).includes(locale)
  );
}
