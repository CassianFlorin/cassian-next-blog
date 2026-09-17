import HeroSection from '@/components/home/HeroSection';
import WorkSection from '@/components/home/WorkSection';
import KnowledgeSection from '@/components/home/KnowledgeSection';
import WritingSection, {
  type WritingPost,
} from '@/components/home/WritingSection';
import AboutSection from '@/components/home/AboutSection';
import type { KnowledgeOverview } from '@/lib/knowledgeOverview';

/**
 * Homepage, V2: five chapters of one personal system.
 * CF / 00 Hero → 01 Work → 02 Knowledge → 03 Writing → 04 About.
 */
export default function Home({
  posts,
  overview,
}: {
  posts: WritingPost[];
  overview: KnowledgeOverview;
}) {
  return (
    <>
      <HeroSection />
      <WorkSection />
      <KnowledgeSection overview={overview} />
      <WritingSection posts={posts} />
      <AboutSection />
    </>
  );
}
