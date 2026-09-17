import { getTranslations } from 'next-intl/server';
import Link from '@/components/Link';
import SectionHeading from '@/components/brand/SectionHeading';
import type { KnowledgeOverview } from '@/lib/knowledgeOverview';
import KnowledgePreview from './KnowledgePreview';

export default async function KnowledgeSection({
  overview,
}: {
  overview: KnowledgeOverview;
}) {
  const t = await getTranslations('home.knowledge');

  return (
    <section
      id="knowledge"
      aria-labelledby="knowledge-title"
      className="bleed surface-grid border-y border-gray-900/10 dark:border-white/10"
    >
      <div className="container-atelier py-24 md:py-36">
        <SectionHeading
          id="knowledge-title"
          index="02"
          title={t('title')}
          lede={t('lede')}
          description={t('description')}
          aside={
            <Link href="/knowledge" className="btn btn-primary">
              {t('explore')}
              <span aria-hidden="true">→</span>
            </Link>
          }
        />
        <KnowledgePreview overview={overview} />
      </div>
    </section>
  );
}
