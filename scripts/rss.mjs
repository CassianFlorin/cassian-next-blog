import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { slug } from 'github-slugger';
import { escape } from 'pliny/utils/htmlEscaper.js';
import siteMetadata from '../data/siteMetadata.js';
import tagData from '../app/tag-data.json' with { type: 'json' };
import { allBlogs } from '../.contentlayer/generated/index.mjs';
import { sortPosts } from 'pliny/utils/contentlayer.js';
import { defaultLocale } from '../lib/locales.mjs';
import { mdxToHtml } from './mdxToHtml.mjs';

const outputFolder = process.env.EXPORT ? 'out' : 'public';

/**
 * Full post bodies go in `content:encoded`, so a reader can show the whole
 * article without a round trip. `description` stays the summary — that split is
 * what the two elements are for.
 *
 * Only the main feed carries full text: the 51 tag feeds are subsets of the
 * same posts, and duplicating every body across them multiplies the output for
 * no benefit.
 */
const contentCache = new Map();

function fullContent(config, post) {
  if (!contentCache.has(post.slug)) {
    contentCache.set(
      post.slug,
      mdxToHtml(post.body?.raw ?? '', {
        siteUrl: config.siteUrl,
        locale: defaultLocale,
      }),
    );
  }
  return contentCache.get(post.slug);
}

/**
 * Characters XML 1.0 forbids outright — C0 controls, the U+FFFE/U+FFFF
 * non-characters, and lone surrogates. CDATA does not exempt them and neither
 * do numeric references, so they have to go.
 *
 * They show up here because posts quote source code: the SEO post includes the
 * CJK-width regex `/[⺀-￿]/`, whose upper bound is U+FFFF. Rewriting such a
 * character as its `\uXXXX` escape keeps the code sample both valid XML and
 * valid JavaScript, which plain deletion would not.
 */
const XML_ILLEGAL =
  // eslint-disable-next-line no-control-regex -- matching them is the point
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

const sanitizeXml = (html) =>
  html.replace(
    XML_ILLEGAL,
    (ch) =>
      `\\u${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
  );

/** A literal `]]>` would terminate the CDATA section early. */
const cdata = (html) =>
  `<![CDATA[${sanitizeXml(html).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

// Routes are locale-prefixed; unprefixed URLs only redirect, so feed links and
// GUIDs point straight at the canonical locale.
const postUrl = (config, post) =>
  `${config.siteUrl}/${defaultLocale}/blog/${post.slug}`;

const generateRssItem = (config, post, { withContent }) => {
  const content = withContent ? fullContent(config, post) : '';
  return `
  <item>
    <guid>${postUrl(config, post)}</guid>
    <title>${escape(post.title)}</title>
    <link>${postUrl(config, post)}</link>
    ${post.summary && `<description>${escape(post.summary)}</description>`}
    ${content && `<content:encoded>${cdata(content)}</content:encoded>`}
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <author>${config.email} (${config.author})</author>
    ${post.tags && post.tags.map((t) => `<category>${t}</category>`).join('')}
  </item>
`;
};

const generateRss = (config, posts, page = 'feed.xml') => `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
      <title>${escape(config.title)}</title>
      <link>${config.siteUrl}/${defaultLocale}/blog</link>
      <description>${escape(config.description)}</description>
      <language>${config.language}</language>
      <managingEditor>${config.email} (${config.author})</managingEditor>
      <webMaster>${config.email} (${config.author})</webMaster>
      <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
      <atom:link href="${config.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
      <follow_challenge>
        <feedId>158720387189413888</feedId>
        <userId>71735074870774784</userId>
      </follow_challenge>
      ${posts.map((post) => generateRssItem(config, post, { withContent: page === 'feed.xml' })).join('')}
    </channel>
  </rss>
`;

async function generateRSS(config, allBlogs, page = 'feed.xml') {
  const publishPosts = allBlogs.filter((post) => post.draft !== true);
  // RSS for blog post
  if (publishPosts.length > 0) {
    const rss = generateRss(config, sortPosts(publishPosts));
    writeFileSync(`./${outputFolder}/${page}`, rss);
  }

  if (publishPosts.length > 0) {
    for (const tag of Object.keys(tagData)) {
      const filteredPosts = allBlogs.filter((post) =>
        post.tags.map((t) => slug(t)).includes(tag),
      );
      const rss = generateRss(config, filteredPosts, `tags/${tag}/${page}`);
      const rssPath = path.join(outputFolder, 'tags', tag);
      mkdirSync(rssPath, { recursive: true });
      writeFileSync(path.join(rssPath, page), rss);
    }
  }
}

const rss = () => {
  generateRSS(siteMetadata, allBlogs);
  console.log('RSS feed generated...');
};
export default rss;
