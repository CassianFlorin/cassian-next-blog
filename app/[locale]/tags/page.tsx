import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { genPageMetadata } from 'app/seo';
import TagsContent from './TagsContent';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return genPageMetadata({
    title: t('tagsTitle'),
    description: t('tagsDescription'),
    locale,
    path: '/tags',
  });
}

export default function TagsPage() {
  return <TagsContent />;
}
