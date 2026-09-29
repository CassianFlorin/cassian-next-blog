import { getLocale, getTranslations } from 'next-intl/server';
import Link from '@/components/Link';
import { localePath, postContentLocale, resolveLocale } from '@/lib/seo';

/**
 * Posts are only written in the default locale, so on any other locale the
 * body below is untranslated. Say so up front and link to the original,
 * instead of letting English chrome frame Chinese prose without comment.
 */
export default async function PostLanguageNotice({ path }: { path: string }) {
  const locale = resolveLocale(await getLocale());
  if (locale === postContentLocale) return null;

  const t = await getTranslations('blog.article');

  return (
    <p className="not-prose type-meta mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-gray-900/15 pt-4 text-gray-600 dark:border-white/15 dark:text-gray-400">
      <span>{t('untranslated')}</span>
      <Link
        href={localePath(postContentLocale, `/${path}`)}
        hrefLang="zh-CN"
        className="text-gray-950 underline underline-offset-4 dark:text-gray-50"
      >
        {t('readOriginal')}
      </Link>
    </p>
  );
}
