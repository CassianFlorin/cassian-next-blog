import Link from 'next/link';
import { slug } from 'github-slugger';
import { useTranslations } from 'next-intl';

interface Props {
  text: string;
}

const Tag = ({ text }: Props) => {
  const t = useTranslations('tags');
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className="hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 inline-flex items-center rounded-full bg-gray-100/80 px-2.5 py-0.5 text-xs font-medium text-gray-600 transition-colors duration-200 dark:bg-gray-800/60 dark:text-gray-400"
    >
      {t(text, { default: text.split(' ').join('-') })}
    </Link>
  );
};

export default Tag;
