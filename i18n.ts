import { getRequestConfig } from 'next-intl/server';
import {
  defaultLocale,
  isLocale,
  locales,
  type Locale,
} from './lib/i18nRouting';

export {
  defaultLocale,
  localeConfig,
  locales,
  type Locale,
} from './lib/i18nRouting';

export default getRequestConfig(async ({ locale, requestLocale }) => {
  // `locale` is only set when a caller passes one explicitly (e.g.
  // generateMetadata). Everything else — getTranslations() in server
  // components — must read the locale segment of the current request,
  // otherwise /en pages silently render the default language.
  const requested = locale ?? (await requestLocale);
  // 验证语言是否支持，如果不支持则使用默认语言
  const validLocale = isLocale(requested) ? requested : defaultLocale;

  return {
    locale: validLocale as string,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
