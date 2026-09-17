import { locales } from './i18nRouting';

const localePattern = new RegExp(`^/(?:${locales.join('|')})(?=/|$)`);

/** `/zh/blog/foo` → `/blog/foo`, `/en` → `/`. */
export const stripLocale = (pathname: string) =>
  pathname.replace(localePattern, '') || '/';

/**
 * Whether a primary nav destination owns the current page. Tags are part of
 * Writing, and Litho is a project page.
 */
export function isNavActive(pathname: string, href: string) {
  const path = stripLocale(pathname);
  if (href === '/blog') {
    return path.startsWith('/blog') || path.startsWith('/tags');
  }
  if (href === '/projects') {
    return path.startsWith('/projects') || path.startsWith('/litho');
  }
  return path === href || path.startsWith(`${href}/`);
}
