import { allBlogs } from 'contentlayer/generated';
import { renderOgCard } from '@/lib/ogCard';

/**
 * Social share cards, one per post, served at `/og/<slug>.png`.
 *
 * This is a route handler rather than the `opengraph-image` file convention
 * because the blog route is a catch-all (`[...slug]`) and Next refuses to put
 * a metadata image segment after one. It also deliberately sits outside
 * `/api/`, which `robots.ts` disallows — social crawlers have to be able to
 * fetch these.
 *
 * `force-static` plus `generateStaticParams` prerenders every card at build
 * time, so the subsetted fonts are never needed at runtime.
 */
export const dynamic = 'force-static';

export function generateStaticParams() {
  return allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({ slug: `${post.slug}.png` }));
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;
  const post = allBlogs.find(
    (item) => item.slug === decodeURI(slug).replace(/\.png$/, ''),
  );

  if (!post) {
    return new Response('Not found', { status: 404 });
  }

  return renderOgCard({
    title: post.title,
    tags: post.tags,
    date: new Date(post.date).toISOString().split('T')[0],
  });
}
