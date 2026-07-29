import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { genPageMetadata } from 'app/seo';
import ProjectsContent from './ProjectsContent';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return genPageMetadata({
    title: t('projectsTitle'),
    description: t('projectsDescription'),
    locale,
    path: '/projects',
  });
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}
