import { slug } from 'github-slugger';
import { permanentRedirect } from 'next/navigation';

/**
 * Topic pages list every article on one page. Old paginated URLs
 * (/tags/ai/page/2 …) redirect permanently to the topic page.
 */
export default async function TagPaginationRedirect(props: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag } = await props.params;
  // Slug the tag here too, so /tags/AI/page/2 lands in one hop.
  permanentRedirect(`/${locale}/tags/${encodeURI(slug(decodeURI(tag)))}`);
}
