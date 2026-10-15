import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { buildKnowledgeOverview } from '@/lib/knowledgeOverview';
import { getLocalizedPosts } from '@/lib/postTranslations';
import Main from '../Main';

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const posts = getLocalizedPosts(locale);
  const overview = buildKnowledgeOverview(getKnowledgeIndex(locale));

  return (
    <Main
      posts={posts.map(({ slug, path, date, title, tags }) => ({
        slug,
        path,
        date,
        title,
        tags: tags || [],
      }))}
      overview={overview}
    />
  );
}
