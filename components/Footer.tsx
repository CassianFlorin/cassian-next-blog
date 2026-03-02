import Link from './Link';
import siteMetadata from '@/data/siteMetadata';
import SocialIcon from '@/components/social-icons';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="mt-20 border-t border-gray-200/60 dark:border-gray-800/60">
      <div className="flex flex-col items-center py-10">
        <div className="mb-4 flex space-x-5">
          <SocialIcon
            kind="mail"
            href={`mailto:${siteMetadata.email}`}
            size={5}
          />
          <SocialIcon kind="github" href={siteMetadata.github} size={5} />
          <SocialIcon kind="x" href={siteMetadata.x} size={5} />
          <SocialIcon kind="linkedin" href={siteMetadata.linkedin} size={5} />
        </div>
        <div className="text-sm text-gray-400 dark:text-gray-500">
          <span>{`© ${new Date().getFullYear()} `}</span>
          <Link
            href="/"
            className="transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            {siteMetadata.author}
          </Link>
        </div>
      </div>
    </footer>
  );
}
