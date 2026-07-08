import type { Metadata } from 'next';
import LithoLanding from './LithoLanding';

export const metadata: Metadata = {
  title: 'Litho · 把 linux.do 稳稳印上 iOS',
  description:
    'Litho 是一个原生 iOS 的 linux.do 第三方客户端，以打穿 Cloudflare 盾、保持登录态、丝滑原生体验为第一目标。',
  openGraph: {
    title: 'Litho · 把 linux.do 稳稳印上 iOS',
    description:
      'Litho 是一个原生 iOS 的 linux.do 第三方客户端，以打穿 Cloudflare 盾、保持登录态、丝滑原生体验为第一目标。',
    type: 'website',
  },
};

export default function LithoPage() {
  return <LithoLanding />;
}
