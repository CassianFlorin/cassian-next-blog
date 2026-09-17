import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer';
import { allBlogs } from 'contentlayer/generated';
import { getKnowledgeIndex } from '@/lib/knowledgeData';
import { buildKnowledgeOverview } from '@/lib/knowledgeOverview';
import Main from '../Main';

export default async function Page() {
  const posts = allCoreContent(sortPosts(allBlogs));
  const overview = buildKnowledgeOverview(getKnowledgeIndex());

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
