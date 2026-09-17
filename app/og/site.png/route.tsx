import { renderSiteCard } from '@/lib/ogCard';

/**
 * The site's default share card, served at `/og/site.png` and used by every
 * page without a more specific one. Prerendered at build time for the same
 * font-bundling reasons described in `app/og/[slug]/route.tsx`.
 */
export const dynamic = 'force-static';

export function GET() {
  return renderSiteCard();
}
