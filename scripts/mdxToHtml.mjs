/**
 * Render a post's raw MDX body to standalone HTML for the RSS feed.
 *
 * Feed readers get no stylesheet and no React, so the site's JSX components and
 * Tailwind-styled wrappers are worthless there — what matters is the prose,
 * code and links inside them. This pipeline therefore parses the MDX, unwraps
 * presentational JSX down to its content, maps the few components that carry
 * real meaning onto semantic HTML, and absolutises every URL.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

/**
 * JSX tags worth keeping, split by content model. Headings and inline elements
 * cannot hold the paragraphs that a flow container would wrap their children
 * in, so each group is rebuilt as the matching mdast node type instead.
 */
const BLOCK_AS = new Map([
  ['Callout', 'blockquote'],
  ['blockquote', 'blockquote'],
  ['pre', 'pre'],
  ['ul', 'ul'],
  ['ol', 'ol'],
  ['li', 'li'],
  ['table', 'table'],
  ['thead', 'thead'],
  ['tbody', 'tbody'],
  ['tr', 'tr'],
  ['td', 'td'],
  ['th', 'th'],
]);

/** `h1` becomes `h2`: the feed item's own title is the document's h1. */
const HEADING_AS = new Map([
  ['h1', 2],
  ['h2', 2],
  ['h3', 3],
  ['h4', 4],
  ['h5', 5],
  ['h6', 6],
]);

const INLINE_AS = new Map([
  ['strong', 'strong'],
  ['b', 'strong'],
  ['em', 'em'],
  ['i', 'em'],
  ['code', 'code'],
  ['small', 'small'],
]);

const VOID_AS = new Map([
  ['hr', { type: 'thematicBreak' }],
  ['br', { type: 'break' }],
]);

/** Flatten block children into phrasing content for headings and inline tags. */
function toPhrasing(children = []) {
  const out = [];
  for (const child of children) {
    if (
      child.children &&
      !['link', 'strong', 'emphasis'].includes(child.type)
    ) {
      out.push(...toPhrasing(child.children));
    } else {
      out.push(child);
    }
  }
  return out;
}

/** Attributes to carry over; everything else (className, style…) is dropped. */
const KEEP_ATTRS = new Set(['href', 'src', 'alt', 'title']);

function literalAttrs(node) {
  const props = {};
  for (const attr of node.attributes || []) {
    if (attr.type !== 'mdxJsxAttribute') continue;
    if (!KEEP_ATTRS.has(attr.name)) continue;
    // Expression-valued props (`src={foo}`) cannot be resolved statically.
    if (typeof attr.value === 'string') props[attr.name] = attr.value;
  }
  return props;
}

/** Read a literal string prop, used to salvage content from component props. */
function stringProp(node, name) {
  const attr = (node.attributes || []).find(
    (a) => a.type === 'mdxJsxAttribute' && a.name === name,
  );
  return typeof attr?.value === 'string' ? attr.value : undefined;
}

/**
 * Components whose content lives in props rather than children, so unwrapping
 * alone would silently drop it.
 */
function fromProps(node) {
  switch (node.name) {
    case 'CopyableCodeBlock': {
      const code = stringProp(node, 'code');
      return code
        ? [{ type: 'code', lang: stringProp(node, 'language'), value: code }]
        : null;
    }
    case 'ErrorDisplay': {
      const parts = [
        stringProp(node, 'title'),
        stringProp(node, 'error'),
        stringProp(node, 'path'),
      ].filter(Boolean);
      return parts.length > 0
        ? [{ type: 'code', value: parts.join('\n') }]
        : null;
    }
    case 'Image': {
      const src = stringProp(node, 'src');
      return src
        ? [
            {
              type: 'image',
              url: src,
              alt: stringProp(node, 'alt') || '',
            },
          ]
        : null;
    }
    default:
      return null;
  }
}

/** Rewrite JSX into plain mdast before it reaches remark-rehype, which drops it. */
function remarkFlattenMdx() {
  return (tree) => {
    // Bottom-up so replacing a parent cannot strand already-visited children.
    const jsxNodes = [];
    visit(tree, (node, index, parent) => {
      if (
        parent &&
        (node.type === 'mdxJsxFlowElement' ||
          node.type === 'mdxJsxTextElement' ||
          node.type === 'mdxjsEsm' ||
          node.type === 'mdxFlowExpression' ||
          node.type === 'mdxTextExpression')
      ) {
        jsxNodes.push([node, index, parent]);
      }
    });

    for (const [node, , parent] of jsxNodes.reverse()) {
      const index = parent.children.indexOf(node);
      if (index === -1) continue;

      // Imports/exports and `{expressions}` have no feed-readable content.
      if (
        node.type !== 'mdxJsxFlowElement' &&
        node.type !== 'mdxJsxTextElement'
      ) {
        parent.children.splice(index, 1);
        continue;
      }

      const salvaged = fromProps(node);
      if (salvaged) {
        parent.children.splice(index, 1, ...salvaged);
        continue;
      }

      const name = node.name;

      if (name && VOID_AS.has(name)) {
        parent.children.splice(index, 1, { ...VOID_AS.get(name) });
        continue;
      }

      if (name && HEADING_AS.has(name)) {
        parent.children.splice(index, 1, {
          type: 'heading',
          depth: HEADING_AS.get(name),
          children: toPhrasing(node.children),
        });
        continue;
      }

      if (name && INLINE_AS.has(name)) {
        parent.children.splice(index, 1, {
          // `emphasis` is a phrasing node the tree already knows how to walk;
          // `hName` swaps in the tag we actually want.
          type: 'emphasis',
          data: { hName: INLINE_AS.get(name) },
          children: toPhrasing(node.children),
        });
        continue;
      }

      if (name && BLOCK_AS.has(name)) {
        parent.children.splice(index, 1, {
          type: 'blockquote',
          data: { hName: BLOCK_AS.get(name) },
          children: node.children || [],
        });
        continue;
      }

      if (node.name === 'a' || node.name === 'img') {
        const props = literalAttrs(node);
        parent.children.splice(
          index,
          1,
          node.name === 'a'
            ? { type: 'link', url: props.href || '#', children: node.children }
            : { type: 'image', url: props.src || '', alt: props.alt || '' },
        );
        continue;
      }

      // Everything else — layout divs, spans, decorative components — is
      // replaced by its own children.
      parent.children.splice(index, 1, ...(node.children || []));
    }
  };
}

const BLOCK_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'div',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'table',
  'hr',
]);

/**
 * A heading written inline in the source (`<div><h1 …>` with no blank line)
 * parses as phrasing content, which would leave a block element inside a `<p>`.
 * Splice those paragraphs open so the output stays valid HTML.
 */
function rehypeUnwrapBlocksInParagraphs() {
  const walk = (node) => {
    if (!node.children) return;
    node.children.forEach(walk);
    const next = [];
    let changed = false;
    for (const child of node.children) {
      const hasBlock =
        child.type === 'element' &&
        child.tagName === 'p' &&
        child.children.some(
          (g) => g.type === 'element' && BLOCK_TAGS.has(g.tagName),
        );
      if (hasBlock) {
        next.push(...child.children);
        changed = true;
      } else {
        next.push(child);
      }
    }
    if (changed) node.children = next;
  };
  return (tree) => walk(tree);
}

/** Feed readers resolve relative URLs unpredictably, so make them absolute. */
function rehypeAbsoluteUrls(siteUrl, locale) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      for (const [tag, prop] of [
        ['a', 'href'],
        ['img', 'src'],
      ]) {
        if (node.tagName !== tag) continue;
        const value = node.properties?.[prop];
        if (typeof value !== 'string' || !value.startsWith('/')) continue;
        node.properties[prop] = value.startsWith('/blog/')
          ? `${siteUrl}/${locale}${value}`
          : `${siteUrl}${value}`;
      }
    });
  };
}

const processor = (siteUrl, locale) =>
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .use(remarkFlattenMdx)
    .use(remarkRehype)
    .use(rehypeUnwrapBlocksInParagraphs)
    .use(() => rehypeAbsoluteUrls(siteUrl, locale))
    .use(rehypeStringify);

/**
 * Returns HTML, or an empty string if the body cannot be parsed — a feed item
 * that falls back to its summary beats failing the whole build.
 */
export function mdxToHtml(raw, { siteUrl, locale }) {
  try {
    return String(processor(siteUrl, locale).processSync(raw));
  } catch (error) {
    console.warn(`  ⚠  RSS 全文渲染失败，回退到摘要：${error.message}`);
    return '';
  }
}
