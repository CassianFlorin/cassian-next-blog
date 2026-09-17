import { permanentRedirect } from 'next/navigation';

/**
 * Topic pages list every article on one page. Old paginated URLs
 * (/tags/ai/page/2 …) redirect permanently to the topic page.
 */
export default async function TagPaginationRedirect(props: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag } = await props.params;
  permanentRedirect(`/${locale}/tags/${tag}`);
}
