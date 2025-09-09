import { genPageMetadata } from 'app/seo';

export const metadata = genPageMetadata({
  title: 'Tags',
  description: 'Things I blog about',
});

export default function TagsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
