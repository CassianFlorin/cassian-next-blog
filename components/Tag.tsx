import Link from 'next/link'
import { slug } from 'github-slugger'
import { useTranslations } from 'next-intl'
interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  const t = useTranslations('tags')
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mr-3 text-sm font-medium uppercase"
    >
      {t(text, { default: text.split(' ').join('-') })}
    </Link>
  )
}

export default Tag
