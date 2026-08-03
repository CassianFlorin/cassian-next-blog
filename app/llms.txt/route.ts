import { allBlogs } from 'contentlayer/generated';
import siteMetadata from '@/data/siteMetadata';
import { defaultLocale, locales } from '@/lib/i18nRouting';
import { SITE_URL, localeUrl } from '@/lib/seo';

/**
 * https://llmstxt.org — a curated map of the site for language models, so one
 * fetch gives them the structure and the gist of every post instead of a crawl.
 *
 * Framing is English (matching `siteMetadata.description`) while titles and
 * summaries stay in the language they were written in; the `tldr` frontmatter
 * doubles as each entry's description, which is exactly what it is for.
 *
 * Middleware skips paths containing a dot, so this is reachable at the root
 * without a locale prefix. `force-static` bakes it at build time.
 */
export const dynamic = 'force-static';

/**
 * Collapse onto the single line the link-list format expects, and escape square
 * brackets so a snippet like `[model_providers.xxx]` in a tldr is not read as a
 * markdown link reference.
 */
function oneLine(text?: string) {
  return (
    text
      ?.replace(/\s+/g, ' ')
      .trim()
      .replace(/([[\]])/g, '\\$1') ?? ''
  );
}

export function GET() {
  const posts = allBlogs
    .filter((post) => !post.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const pages: [string, string][] = [
    ['/blog', 'All posts, newest first.'],
    ['/knowledge', 'Knowledge graph view of how the posts connect.'],
    ['/projects', 'Projects and tools I have built.'],
    ['/about', 'Who I am and what I work on.'],
    ['/tags', 'Every tag used across the blog.'],
  ];

  const lines = [
    `# ${siteMetadata.author}`,
    '',
    `> ${siteMetadata.description}`,
    '',
    'Posts are mostly written in Chinese, with a smaller set of English',
    'translations. Every page exists under both a `/zh/` and an `/en/` prefix;',
    `the canonical default is \`/${defaultLocale}/\`. Available locales: ${locales.join(', ')}.`,
    '',
    'Recurring subjects: AI agents and agent tooling, developer workflow and',
    'environment setup, personal knowledge management with Obsidian, backend',
    'engineering in Java, and self-hosted infrastructure.',
    '',
    '## Posts',
    '',
    ...posts.map((post) => {
      const url = localeUrl(defaultLocale, `/${post.path}`);
      const description = oneLine(post.tldr) || oneLine(post.summary);
      return `- [${oneLine(post.title)}](${url})${description ? `: ${description}` : ''}`;
    }),
    '',
    '## Pages',
    '',
    ...pages.map(
      ([path, description]) =>
        `- [${path}](${localeUrl(defaultLocale, path)}): ${description}`,
    ),
    '',
    '## Optional',
    '',
    `- [RSS feed](${SITE_URL}/feed.xml): Full post list as RSS.`,
    `- [Sitemap](${SITE_URL}/sitemap.xml): Every URL in both locales.`,
    `- [Source repository](${siteMetadata.siteRepo}): The site itself is open source.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
