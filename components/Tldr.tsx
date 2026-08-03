import { useTranslations } from 'next-intl';

/**
 * The post's one-sentence conclusion, rendered above the body.
 *
 * Generative engines quote whichever passage answers the question on its own,
 * so this block is deliberately plain: a labelled `<section>` wrapping a single
 * `<p>`, with no markup between the label and the sentence. The same text goes
 * into the article's schema.org `abstract`.
 */
export default function Tldr({ children }: { children?: string }) {
  const t = useTranslations('blog');

  if (!children?.trim()) return null;

  return (
    <section
      data-tldr
      aria-label={t('tldrLabel')}
      className="not-prose border-primary-500 dark:bg-primary-900/10 mb-8 rounded-r border-l-4 bg-gray-50 p-4 sm:p-5 dark:bg-gray-800/40"
    >
      <p className="text-primary-700 dark:text-primary-300 mb-1.5 text-xs font-semibold tracking-wide uppercase">
        {t('tldrLabel')}
      </p>
      <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">
        {children}
      </p>
    </section>
  );
}
