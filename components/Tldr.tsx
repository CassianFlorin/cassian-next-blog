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
      className="not-prose border-primary-600 dark:border-primary-400 mb-10 border-l-2 py-1 pl-5"
    >
      <p className="type-meta text-primary-700 dark:text-primary-300 mb-2">
        {t('tldrLabel')}
      </p>
      <p className="type-editorial text-xl leading-snug text-gray-900 md:text-2xl dark:text-gray-100">
        {children}
      </p>
    </section>
  );
}
