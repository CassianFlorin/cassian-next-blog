/**
 * Content SEO linter for data/blog/*.mdx.
 *
 * Runs on every build (as part of `prebuild`) and can be run on demand with
 * `yarn check-seo`. Errors fail the build; warnings only report.
 *
 * Pass `--strict` to also fail on warnings.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'data', 'blog');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CHARSET_FILE = path.join(ROOT, 'assets', 'fonts', 'charset.txt');
const STRICT = process.argv.includes('--strict');

/**
 * Glyphs covered by the subsetted OG-card fonts. Anything outside this set
 * renders as a blank box on the card, which is invisible until someone shares
 * the link — so it is worth catching at build time.
 */
const ogCharset = existsSync(CHARSET_FILE)
  ? new Set(readFileSync(CHARSET_FILE, 'utf-8'))
  : null;

/** Search snippets get truncated past roughly this width. */
const SUMMARY_MIN = 40;
const SUMMARY_MAX = 160;
const TITLE_MAX = 60;
const TAGS_MIN = 2;
const TAGS_MAX = 8;
/**
 * `tldr` has to stand on its own when a generative engine lifts it out of the
 * page, so it needs more substance than a headline but must stay quotable.
 */
const TLDR_MIN = 30;
const TLDR_MAX = 200;

const errors = [];
const warnings = [];

const addError = (file, message) => errors.push({ file, message });
const addWarning = (file, message) => warnings.push({ file, message });

/**
 * CJK characters render about twice as wide as Latin ones, so a Chinese title
 * hits the SERP pixel limit at roughly half the character count.
 */
function displayWidth(text) {
  let width = 0;
  for (const char of text) {
    width += /[⺀-￿]/.test(char) ? 2 : 1;
  }
  return width;
}

/** Strip fenced code blocks so their `#` comments are not read as headings. */
function stripCodeFences(body) {
  return body.replace(/^```[\s\S]*?^```/gm, '');
}

function checkPost(file, raw) {
  const { data: fm, content } = matter(raw);
  const body = stripCodeFences(content);

  if (fm.draft === true) return;

  // --- title ---------------------------------------------------------------
  if (!fm.title || !String(fm.title).trim()) {
    addError(file, 'frontmatter 缺少 title');
  } else if (displayWidth(String(fm.title)) > TITLE_MAX) {
    addWarning(
      file,
      `title 显示宽度 ${displayWidth(String(fm.title))} 超过 ${TITLE_MAX}，搜索结果可能被截断`,
    );
  }

  // --- summary (becomes <meta name="description">) -------------------------
  const summary = fm.summary
    ? String(fm.summary).replace(/\s+/g, ' ').trim()
    : '';
  if (!summary) {
    addError(file, 'frontmatter 缺少 summary（用作 meta description）');
  } else {
    const width = displayWidth(summary);
    if (width < SUMMARY_MIN) {
      addWarning(
        file,
        `summary 显示宽度 ${width} 偏短（建议 ≥ ${SUMMARY_MIN}）`,
      );
    } else if (width > SUMMARY_MAX) {
      addWarning(
        file,
        `summary 显示宽度 ${width} 超过 ${SUMMARY_MAX}，摘要会被截断`,
      );
    }
  }

  // --- tldr (rendered above the body, emitted as schema.org `abstract`) -----
  const tldr = fm.tldr ? String(fm.tldr).replace(/\s+/g, ' ').trim() : '';
  if (!tldr) {
    addWarning(
      file,
      'frontmatter 缺少 tldr（一句话结论，生成式引擎最常摘录的就是这一段）',
    );
  } else {
    const width = displayWidth(tldr);
    if (width < TLDR_MIN) {
      addWarning(file, `tldr 显示宽度 ${width} 偏短（建议 ≥ ${TLDR_MIN}）`);
    } else if (width > TLDR_MAX) {
      addWarning(
        file,
        `tldr 显示宽度 ${width} 超过 ${TLDR_MAX}，摘录时会被截断（建议压成一句话）`,
      );
    }
    if (tldr === summary) {
      addWarning(file, 'tldr 与 summary 完全相同，两者应各自承担不同信息');
    }
  }

  // --- structured-data frontmatter shape -----------------------------------
  if (fm.faq !== undefined) {
    if (!Array.isArray(fm.faq) || fm.faq.length === 0) {
      addError(file, 'faq 必须是非空数组');
    } else {
      fm.faq.forEach((entry, i) => {
        if (!entry?.q || !entry?.a) {
          addError(file, `faq[${i}] 缺少 q 或 a`);
        }
      });
    }
  }

  if (fm.howto !== undefined) {
    const steps = fm.howto?.steps;
    if (!Array.isArray(steps) || steps.length === 0) {
      addError(file, 'howto.steps 必须是非空数组');
    } else {
      steps.forEach((step, i) => {
        if (!step?.name || !step?.text) {
          addError(file, `howto.steps[${i}] 缺少 name 或 text`);
        }
      });
    }
    // schema.org expects an ISO 8601 duration, e.g. PT30M.
    if (fm.howto?.totalTime && !/^P(T.*)?[\dA-Z]/.test(fm.howto.totalTime)) {
      addError(
        file,
        `howto.totalTime 必须是 ISO 8601 时长（如 PT30M）：${fm.howto.totalTime}`,
      );
    }
  }

  if (fm.definedTerm !== undefined) {
    if (!fm.definedTerm?.name || !fm.definedTerm?.description) {
      addError(file, 'definedTerm 需要同时有 name 和 description');
    }
  }

  // --- OG card glyph coverage ----------------------------------------------
  if (ogCharset) {
    const onCard = [String(fm.title || ''), ...(fm.tags || []).slice(0, 3)]
      .join('')
      .replace(/\s/g, '');
    const missing = [...new Set(onCard)].filter((ch) => !ogCharset.has(ch));
    if (missing.length > 0) {
      addWarning(
        file,
        `OG 卡片字体缺字：${missing.join('')}（把这些字加进 assets/fonts/charset.txt 后重跑 scripts/build-og-font.py）`,
      );
    }
  }

  // --- date / lastmod ------------------------------------------------------
  if (!fm.date) {
    addError(file, 'frontmatter 缺少 date');
  } else if (Number.isNaN(new Date(fm.date).getTime())) {
    addError(file, `date 无法解析：${fm.date}`);
  }

  // `lastmod` feeds `dateModified` and the sitemap; a value older than the
  // publication date would tell engines the page went backwards in time.
  if (fm.lastmod) {
    const modified = new Date(fm.lastmod);
    if (Number.isNaN(modified.getTime())) {
      addError(file, `lastmod 无法解析：${fm.lastmod}`);
    } else if (
      fm.date &&
      modified < new Date(new Date(fm.date).toDateString())
    ) {
      addError(file, `lastmod（${fm.lastmod}）早于 date（${fm.date}）`);
    } else if (modified.getTime() > Date.now() + 86400000) {
      addWarning(file, `lastmod（${fm.lastmod}）在未来`);
    }
  }

  // --- tags ----------------------------------------------------------------
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  if (tags.length < TAGS_MIN) {
    addWarning(
      file,
      `tags 只有 ${tags.length} 个（建议 ${TAGS_MIN}-${TAGS_MAX} 个）`,
    );
  } else if (tags.length > TAGS_MAX) {
    addWarning(
      file,
      `tags 有 ${tags.length} 个（建议 ≤ ${TAGS_MAX}，过多标签会稀释主题相关性）`,
    );
  }

  // --- images --------------------------------------------------------------
  const images = typeof fm.images === 'string' ? [fm.images] : fm.images || [];
  for (const image of images) {
    if (typeof image !== 'string' || /^https?:\/\//.test(image)) continue;
    if (!existsSync(path.join(PUBLIC_DIR, image.replace(/^\//, '')))) {
      addError(file, `images 指向的文件不存在：${image}`);
    }
  }

  // --- headings ------------------------------------------------------------
  if (!/^##\s+/m.test(body) && !/^#\s+/m.test(body)) {
    addWarning(file, '正文没有任何小标题，长文建议用 ## 分节');
  }

  // --- images in body need alt text ----------------------------------------
  const markdownImages = [...body.matchAll(/!\[(.*?)\]\((.*?)\)/g)];
  for (const [, alt, src] of markdownImages) {
    if (!alt.trim()) {
      addError(file, `图片缺少 alt 文本：${src}`);
    }
  }

  // --- internal links should not be locale-hardcoded -----------------------
  const internalLinks = [...body.matchAll(/\]\((\/[^)\s]*)\)/g)];
  for (const [, href] of internalLinks) {
    if (/^\/(zh|en)\//.test(href)) {
      addWarning(
        file,
        `内链写死了语言前缀：${href}（写成 /blog/... 即可，组件会自动补当前语言）`,
      );
    }
  }

  // --- canonicalUrl sanity -------------------------------------------------
  if (fm.canonicalUrl && !/^https?:\/\//.test(String(fm.canonicalUrl))) {
    addError(file, `canonicalUrl 必须是绝对 URL：${fm.canonicalUrl}`);
  }
}

function main() {
  if (!existsSync(BLOG_DIR)) {
    console.log('check-seo: 没有找到 data/blog，跳过');
    return;
  }

  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));
  const slugs = new Map();

  for (const file of files) {
    const raw = readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    checkPost(file, raw);

    // Slug collisions would make two posts fight over one URL.
    const slug = file.replace(/\.mdx$/, '');
    if (slugs.has(slug.toLowerCase())) {
      addError(
        file,
        `slug 与 ${slugs.get(slug.toLowerCase())} 冲突（忽略大小写）`,
      );
    }
    slugs.set(slug.toLowerCase(), file);
  }

  for (const { file, message } of warnings) {
    console.log(`  ⚠  ${file}: ${message}`);
  }
  for (const { file, message } of errors) {
    console.log(`  ✖  ${file}: ${message}`);
  }

  const summary = `check-seo: 检查 ${files.length} 篇文章，${errors.length} 个错误，${warnings.length} 个警告`;

  if (errors.length > 0 || (STRICT && warnings.length > 0)) {
    console.error(`\n${summary}`);
    process.exit(1);
  }
  console.log(summary);
}

main();
