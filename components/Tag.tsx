import { slug } from 'github-slugger';
import { useTranslations } from 'next-intl';
import Link from './Link';

interface Props {
  text: string;
}

const Tag = ({ text }: Props) => {
  const t = useTranslations('tags');
  // Always look up by slug: next-intl treats "." as a key separator, so a raw
  // tag like "Next.js" would resolve to tags -> Next -> js and throw
  // MISSING_MESSAGE. update-tags.mjs writes a slug key for every tag, and slugs
  // never contain dots.
  const tagSlug = slug(text);
  return (
    <Link
      href={`/tags/${tagSlug}`}
      className="hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 inline-flex items-center rounded-full bg-gray-100/80 px-2.5 py-0.5 text-xs font-medium text-gray-600 transition-colors duration-200 dark:bg-gray-800/60 dark:text-gray-400"
    >
      {t.has(tagSlug) ? t(tagSlug) : text}
    </Link>
  );
};

export default Tag;
