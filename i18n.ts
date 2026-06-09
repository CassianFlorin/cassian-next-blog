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

export default getRequestConfig(async ({ locale }) => {
  // 验证语言是否支持，如果不支持则使用默认语言
  const validLocale = isLocale(locale) ? locale : defaultLocale;

  return {
    locale: validLocale as string,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
