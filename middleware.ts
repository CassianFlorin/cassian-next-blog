import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';
import slugMap from './app/blog-slug-map.json';

const intlMiddleware = createMiddleware({
  // 支持的语言列表
  locales,
  // 默认语言
  defaultLocale,
  // 本地化检测
  localeDetection: true,
});

// 博文路由取自文件名整体（含 YYYYMMDD- 前缀）。历史内链和外部链接里存在
// /blog/install-sdkman 这种不带日期的写法，会 404。命中映射就 308 过去。
// 映射由 scripts/generate-slug-redirects.mjs 在构建前生成。
const DATELESS_BLOG_PATH = new RegExp(
  `^(/(?:${locales.join('|')}))?/blog/([^/]+?)/?$`,
);

function resolveDatelessSlug(pathname: string): string | null {
  const match = pathname.match(DATELESS_BLOG_PATH);
  if (!match) return null;

  const [, localePrefix = '', rawSlug] = match;
  // 已经带日期前缀的走正常路由，不进映射
  if (/^\d{8}-/.test(rawSlug)) return null;

  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    return null;
  }

  const target = (slugMap as Record<string, string>)[slug];
  return target ? `${localePrefix}/blog/${target}` : null;
}

export default function middleware(request: NextRequest) {
  const target = resolveDatelessSlug(request.nextUrl.pathname);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(request);
}

export const config = {
  // 匹配所有路径，除了api、_next、静态文件等
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
