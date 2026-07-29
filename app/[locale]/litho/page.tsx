import type { Metadata } from 'next';
import { genPageMetadata } from 'app/seo';
import LithoLanding from './LithoLanding';

const TITLE = 'Litho · 把 linux.do 稳稳印上 iOS 与 Android';
const DESCRIPTION =
  'Litho 是 linux.do 的原生第三方客户端（iOS / Android），以打穿 Cloudflare 盾、保持登录态、丝滑原生体验为第一目标。iOS 已开启 TestFlight 公测，Android 提供 APK 直装。';

/**
 * The product site at litho.cassianflorin.com is the canonical home for Litho.
 * This page covers the same product, so it points its canonical there instead
 * of competing with it for the same queries.
 */
const PRODUCT_SITE = 'https://litho.cassianflorin.com/';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  return genPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    locale,
    path: '/litho',
    // Overrides the canonical + hreflang block from genPageMetadata. No
    // `languages` here: hreflang requires a self-referencing canonical, and
    // this page defers to another host.
    alternates: { canonical: PRODUCT_SITE },
  });
}

export default function LithoPage() {
  return <LithoLanding />;
}
