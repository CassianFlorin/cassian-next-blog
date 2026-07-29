import type { Metadata } from 'next';
import { genPageMetadata } from 'app/seo';
import LithoLanding from './LithoLanding';

const TITLE = 'Litho · 把 linux.do 稳稳印上 iOS';
const DESCRIPTION =
  'Litho 是一个原生 iOS 的 linux.do 第三方客户端，以打穿 Cloudflare 盾、保持登录态、丝滑原生体验为第一目标。';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  return genPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    locale,
    path: '/litho',
  });
}

export default function LithoPage() {
  return <LithoLanding />;
}
