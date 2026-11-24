import { getTranslations } from 'next-intl/server';
import ArchiveField from '@/components/home/ArchiveField';
import HeroSection from '@/components/home/HeroSection';
import WorkSection from '@/components/home/WorkSection';
import KnowledgeSection from '@/components/home/KnowledgeSection';
import WritingSection, {
  type WritingPost,
} from '@/components/home/WritingSection';
import AboutSection from '@/components/home/AboutSection';
import type { KnowledgeOverview } from '@/lib/knowledgeOverview';
import type { ArchiveSceneData } from '@/lib/archiveScene';

/**
 * Homepage, V2: five chapters of one personal system.
 * CF / 00 Hero → 01 Work → 02 Knowledge → 03 Writing → 04 About,
 * all set inside one 3D archive that the camera travels through.
 */
export default async function Home({
  posts,
  overview,
  archive,
}: {
  posts: WritingPost[];
  overview: KnowledgeOverview;
  archive: ArchiveSceneData;
}) {
  const t = await getTranslations('home.hero.archive');

  return (
    <>
      {/* The world behind the whole homepage; each chapter is a camera
          station in it (see components/home/archiveEngine.ts). */}
      <ArchiveField
        scene={archive}
        labels={{
          archive: t('label'),
          entries: t('entries'),
          territories: t('territories'),
          hint: t('hint'),
        }}
      />
      <HeroSection />
      <WorkSection />
      <KnowledgeSection overview={overview} />
      <WritingSection posts={posts} />
      <AboutSection />
    </>
  );
}
