import { permanentRedirect } from 'next/navigation';

/**
 * The archive is a single timeline now. Old paginated URLs (/blog/page/2 …)
 * stay valid by redirecting permanently to it.
 */
export default async function BlogPaginationRedirect(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  permanentRedirect(`/${locale}/blog`);
}
