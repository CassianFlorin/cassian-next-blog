#!/usr/bin/env node

/**
 * 博客文章正文自动翻译脚本 (DeepL Free API) - AST/语义感知保护版
 *
 * 特性：
 * 1. 严格使用 gray-matter 解析与序列化 Frontmatter，彻底避免 YAML 缩进格式错误。
 * 2. 占位保护代码块、数学公式、行内代码、自定义 JSX 标签（<Callout>, <StepProgress> 等）。
 * 3. 正文合成一篇送出。DeepL 只在同一条 text 内共享上下文，按空行拆开会让指代各自猜测。
 *    无中文段落仍只放占位符，原文不进入请求。单篇超过请求体积时按二级标题再切块。
 * 4. 标题、摘要、tldr 另一次请求，并把中文正文作为 context。context 不计费、不输出。
 * 5. 保护 MDX 中的 HTML 实体（&lt;, &gt;, &#123;, &#125;），防止被解析器误当作 JSX 表达式。
 * 6. 内容 Hash 缓存机制，翻译过的文章下次 0 字符消耗。
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../data/blog');
const I18N_BLOG_DIR = path.join(__dirname, '../data/blog-i18n/en');

const MAX_RETRIES = 3;
// DeepL 文本接口的请求体上限是 128 KiB。留出 JSON 与 context 的空间。
const TEXT_BUDGET_BYTES = 96 * 1024;
const CONTEXT_BUDGET_BYTES = 32 * 1024;

// 参数解析
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

function getArgValue(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

const targetSlug = getArgValue('--slug');
const limitArg = getArgValue('--limit');
const limitCount = limitArg ? parseInt(limitArg, 10) : Infinity;

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
使用方式:
  node scripts/translate-blog.mjs [options]

环境变量:
  DEEPL_AUTH_KEY 或 DEEPL_API_KEY   DeepL API 密钥（以 :fx 结尾为免费版）

选项:
  --dry-run       仅检查并输出待翻译文章与预估字符数，不调用 API
  --slug <slug>   仅翻译指定的一篇文章
  --limit <n>     单次最多翻译 n 篇文章
  --force         强制重新翻译（忽略 Hash 缓存）
  --help, -h      显示此帮助信息
`);
  process.exit(0);
}

const authKey = process.env.DEEPL_AUTH_KEY || process.env.DEEPL_API_KEY;

function requireAuthKey() {
  if (authKey || isDryRun) return;
  console.error(`
❌ 错误: 未找到 DeepL API 密钥。
请通过环境变量提供密钥：
  export DEEPL_AUTH_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
  node scripts/translate-blog.mjs

如果你想仅预览待翻译文章，可以运行：
  node scripts/translate-blog.mjs --dry-run
`);
  process.exit(1);
}

function getDeepLEndpoint(key = '') {
  return key.trim().endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
}

function getUsageEndpoint(key = '') {
  return key.trim().endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/usage'
    : 'https://api.deepl.com/v2/usage';
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function byteLength(text) {
  return Buffer.byteLength(text, 'utf8');
}

/**
 * 占位符按插入顺序编号。还原时从外向内替换，避免外层原文里再出现内层编号。
 */
export function createPlaceholderStore() {
  const placeholders = new Map();
  let counter = 0;

  function store(text) {
    const key = `___KEEP_${counter++}___`;
    placeholders.set(key, text);
    return `<keep id="${key}">${key}</keep>`;
  }

  return { placeholders, store };
}

/**
 * 保护正文中的不可翻译节点（代码块、行内代码、公式、JSX 标签、链接 URL）
 */
export function protectMarkdown(content) {
  const { placeholders, store } = createPlaceholderStore();

  let protectedText = content;

  // 1. 保护代码块 ```lang ... ```
  protectedText = protectedText.replace(/```[\s\S]*?```/g, (match) =>
    store(match),
  );

  // 2. 保护数学公式 $$ ... $$ 和 $ ... $
  protectedText = protectedText.replace(/\$\$[\s\S]*?\$\$/g, (match) =>
    store(match),
  );
  protectedText = protectedText.replace(/\$[^$\n]+\$/g, (match) =>
    store(match),
  );

  // 3. 保护行内代码 `...`
  protectedText = protectedText.replace(/`[^`\n]+`/g, (match) => store(match));

  // 4. 保护 MDX 中的 {' '} 空格表达式
  protectedText = protectedText.replace(/\{\s*['"]\s*['"]\s*\}/g, (match) =>
    store(match),
  );

  // 5. 保护自定义 JSX 组件标签，如 <Callout ...>, </Callout>, <StepProgress ... />, <Tldr>
  protectedText = protectedText.replace(
    /<\/?([A-Z][a-zA-Z0-9]*)[^>]*>/g,
    (match) => store(match),
  );

  // 6. 保护 HTML 标签与注释
  protectedText = protectedText.replace(/<!--[\s\S]*?-->/g, (match) =>
    store(match),
  );
  protectedText = protectedText.replace(
    /<\/?(div|span|details|summary|table|thead|tbody|tr|th|td|a|p|code|pre|h1|h2|h3|h4|h5|h6)[^>]*>/gi,
    (match) => store(match),
  );

  // 7. 保护 Markdown 链接中的 URL 路径 [text](url) -> 仅翻译 text，保持 url 占位
  protectedText = protectedText.replace(
    /(\[[^\]]+\])\(([^)\s]+)\)/g,
    (match, text, url) => {
      const urlPlaceholder = store(url);
      return `${text}(${urlPlaceholder})`;
    },
  );

  return { protectedText, placeholders, store };
}

const PURE_KEEP = /^<keep id="___KEEP_\d+___">___KEEP_\d+___<\/keep>$/;

export function shouldTranslateParagraph(paragraph) {
  const trimmed = paragraph.trim();
  if (!trimmed || !/[\u4e00-\u9fa5]/.test(trimmed)) return false;
  return !PURE_KEEP.test(trimmed);
}

/**
 * 把不需要翻译的段落收成占位符，其余中文保持原有顺序拼成一篇。
 * DeepL 对数组里的每一条 text 单独翻译，拼成一篇后段与段才共享上下文。
 */
export function assembleDocument(protectedText, store) {
  return protectedText
    .split(/\n\n+/)
    .map((paragraph) => {
      if (!paragraph.trim() || shouldTranslateParagraph(paragraph)) {
        return paragraph;
      }
      return store(paragraph);
    })
    .join('\n\n');
}

/**
 * 超长正文按二级标题切开，切不开再按段落切。拼回后与原文一致。
 */
export function splitDocument(text, maxBytes) {
  if (byteLength(text) <= maxBytes) return [text];

  const sections = text.split(/(?=^## )/m);
  const chunks = [];
  let current = '';

  function flush() {
    if (!current) return;
    chunks.push(current);
    current = '';
  }

  for (const section of sections) {
    if (byteLength(section) > maxBytes) {
      flush();
      chunks.push(...splitOversizedSection(section, maxBytes));
      continue;
    }
    if (current && byteLength(current + section) > maxBytes) flush();
    current += section;
  }
  flush();
  return chunks;
}

function splitOversizedSection(section, maxBytes) {
  const tokens = [];
  const separator = /\n\n+/g;
  let last = 0;
  let match = separator.exec(section);
  while (match) {
    tokens.push(section.slice(last, match.index + match[0].length));
    last = match.index + match[0].length;
    match = separator.exec(section);
  }
  tokens.push(section.slice(last));

  const pieces = [];
  let current = '';
  for (const token of tokens) {
    if (!current || byteLength(current + token) <= maxBytes) {
      current += token;
      continue;
    }
    pieces.push(current);
    current = token;
  }
  if (current) pieces.push(current);
  return pieces;
}

export function fitToBytes(text, maxBytes) {
  if (!text || byteLength(text) <= maxBytes) return text || '';
  let end = text.length;
  while (end > 0 && byteLength(text.slice(0, end)) > maxBytes) {
    end = Math.floor(end * 0.9) || end - 1;
  }
  const sliced = text.slice(0, end);
  const breakAt = sliced.lastIndexOf('\n\n');
  return breakAt > 0 ? sliced.slice(0, breakAt) : sliced;
}

export function keepMarkers(text) {
  return [...text.matchAll(/___KEEP_\d+___/g)].map((match) => match[0]);
}

function keepCounts(markers) {
  const counts = new Map();
  for (const marker of markers) {
    counts.set(marker, (counts.get(marker) || 0) + 1);
  }
  return counts;
}

export function assertKeepsSurvived(source, translated) {
  const before = keepCounts(keepMarkers(source));
  const after = keepCounts(keepMarkers(translated));
  const sameSize = before.size === after.size;
  const sameCounts =
    sameSize &&
    [...before].every(([marker, count]) => after.get(marker) === count);
  if (!sameCounts) {
    throw new Error('DeepL 改动了占位符，已中止这篇文章的写入');
  }
}

function plainContext(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/[<>&]/g, ' ');
}

function canSplitTranslation(text, error) {
  if (text.split(/\n\n+/).length < 2) return false;
  return (
    error.tagHandling === true || /占位符/.test(String(error && error.message))
  );
}

async function translatePreservingKeeps(text, context) {
  try {
    const [translated] = await translateTexts([text], context);
    assertKeepsSurvived(text, translated);
    return translated;
  } catch (error) {
    if (!canSplitTranslation(text, error)) throw error;
    console.warn('  - 整篇没有完整译出，改为按段落重试');
    const pieces = [];
    for (const paragraph of text.split(/\n\n+/)) {
      if (!/[\u4e00-\u9fa5]/.test(paragraph)) {
        pieces.push(paragraph);
        continue;
      }
      const [part] = await translateTexts([paragraph], context);
      assertKeepsSurvived(paragraph, part);
      pieces.push(part);
    }
    return pieces.join('\n\n');
  }
}

/**
 * 将单独成行的 HTML/JSX 标签前后插入空行，使它们在按段落切分时作为独立段落被过滤，绝不送 DeepL
 */
function separateBlockTags(text) {
  return text.replace(
    /^([ \t]*<\/?(?:div|span|details|summary|table|thead|tbody|tr|th|td|pre|code|h[1-6]|[A-Z][a-zA-Z0-9]*)[^>]*>[ \t]*)$/gm,
    '\n\n$1\n\n',
  );
}

/**
 * 还原占位符
 */
function unwrapKeeps(text) {
  let current = text;
  let previous = '';
  while (current !== previous) {
    previous = current;
    current = current.replace(/<keep[^>]*>([\s\S]*?)<\/keep>/gi, '$1');
  }
  return current;
}

export function restoreMarkdown(text, placeholders) {
  let restored = text.replace(/&lt;(\/?keep\b[^&]*?)&gt;/gi, '<$1>');
  const entries = [...placeholders.entries()].reverse();

  // 先剥外壳再替换。外层占位符的原文里还有内层 keep，需要再剥一次。
  for (let guard = 0; guard <= entries.length; guard++) {
    restored = unwrapKeeps(restored);
    let changed = false;
    for (const [key, original] of entries) {
      if (!restored.includes(key)) continue;
      restored = restored.replaceAll(key, original);
      changed = true;
    }
    if (!changed) break;
  }

  return unwrapKeeps(restored);
}

/**
 * DeepL 会把较长的占位符换行，链接的右括号就被拆开。
 * 行内代码后面多出来的空行会把句子和表格拆开，这里并回去。
 * 句号或冒号后若直接接大写，也补回空格。代码块保持原样。
 */
export function repairTranslatedProse(text) {
  const normalized = text.replace(/```">```/g, '```');
  const chunks = normalized.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
  return chunks
    .map((chunk, index) => {
      if (index % 2 === 1) return chunk;
      let prose = chunk;
      const previous = index > 0 ? chunks[index - 1] : '';
      const previousIsInline =
        previous.startsWith('`') && !previous.startsWith('```');
      if (previousIsInline && /^\n\n+/.test(prose)) {
        const rest = prose.replace(/^\n+/, '');
        const startsBlock = /^(?:#{1,6} |```|---|\*\*\*|[*+-] |\d+\. |\|)/.test(
          rest,
        );
        if (rest && !startsBlock) {
          const glue = /^[,.;:)\]}]/.test(rest) ? '' : ' ';
          prose = glue + rest;
        }
      }
      const linksFixed = prose.replace(
        /\[([^\]]*)\]\(\s*([^)\s]+)\s*\)/g,
        (_, label, url) =>
          `[${label.replace(/\s*\n\s*/g, ' ').trim()}](${url})`,
      );
      return linksFixed
        .replace(/([A-Za-z0-9])\.(?=[A-Z])/g, '$1. ')
        .replace(/:(?=[A-Z])/g, ': ');
    })
    .join('');
}

/**
 * 转义非 keep 标签的 & 和 <，确保送给 DeepL 的是合法的 XML
 */
function escapeXmlForDeepL(text) {
  let s = text.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;');
  s = s.replace(/<(?!keep\b|\/keep>)/gi, '&lt;');
  return s;
}

function unescapeXmlFromDeepL(text) {
  // 只反转义由我们转出的 &amp;，保持 &lt; 和 &gt; 避免被 MDX 误判为 JSX 标签
  return text.replaceAll('&amp;', '&');
}

/**
 * 调用 DeepL API 翻译单批文本
 */
async function translateTexts(texts, context = '') {
  if (texts.length === 0) return [];

  const endpoint = getDeepLEndpoint(authKey);
  const preparedTexts = texts.map((t) => escapeXmlForDeepL(t));
  const payload = {
    text: preparedTexts,
    source_lang: 'ZH',
    target_lang: 'EN-US',
    tag_handling: 'xml',
    ignore_tags: ['keep'],
  };
  if (context) payload.context = context;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${authKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
          `DeepL API responded with ${response.status} ${response.statusText}: ${errorText}`,
        );
        if (response.status === 400 && /Tag handling/.test(errorText)) {
          error.tagHandling = true;
        }
        throw error;
      }

      const data = await response.json();
      if (!data.translations || data.translations.length !== texts.length) {
        throw new Error(
          `DeepL 返回 ${data.translations ? data.translations.length : 0} 条，请求了 ${texts.length} 条`,
        );
      }
      return data.translations.map((item) => unescapeXmlFromDeepL(item.text));
    } catch (err) {
      if (err.tagHandling) throw err;
      console.warn(
        `⚠️  翻译批次失败 (第 ${attempt}/${MAX_RETRIES} 次重试): ${err.message}`,
      );
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }
}

/**
 * 翻译单篇文章
 */
async function translatePost(file) {
  const filePath = path.join(BLOG_DIR, file);
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(rawContent);
  const slug = file.replace(/\.mdx$/, '');

  console.log(`\n📄 正在处理文章: ${file}`);

  const separatedContent = separateBlockTags(parsed.content);
  const { protectedText, placeholders, store } =
    protectMarkdown(separatedContent);
  const hasTranslatableBody = protectedText
    .split(/\n\n+/)
    .some(shouldTranslateParagraph);
  const document = hasTranslatableBody
    ? assembleDocument(protectedText, store)
    : protectedText;
  const chunks = hasTranslatableBody
    ? splitDocument(document, TEXT_BUDGET_BYTES)
    : [];

  // Frontmatter 待翻译项。短字段单独请求，并用中文正文做 context。
  const metadataTexts = [];
  if (parsed.data.title && /[\u4e00-\u9fa5]/.test(parsed.data.title))
    metadataTexts.push(parsed.data.title);
  if (parsed.data.summary && /[\u4e00-\u9fa5]/.test(parsed.data.summary))
    metadataTexts.push(parsed.data.summary);
  if (parsed.data.tldr && /[\u4e00-\u9fa5]/.test(parsed.data.tldr))
    metadataTexts.push(parsed.data.tldr);

  const charEstimate =
    chunks.reduce((acc, chunk) => acc + chunk.length, 0) +
    metadataTexts.reduce((acc, text) => acc + text.length, 0);

  console.log(
    `  - 正文 ${chunks.length} 块，frontmatter ${metadataTexts.length} 项，约 ${charEstimate} 字符`,
  );

  if (isDryRun) {
    return { slug, charEstimate, skipped: false };
  }

  let translatedProtectedBody = protectedText;
  if (chunks.length > 0) {
    const bodyContext =
      chunks.length === 1
        ? parsed.data.title || ''
        : fitToBytes(
            plainContext(
              [parsed.data.title, parsed.content.trim()]
                .filter(Boolean)
                .join('\n\n'),
            ),
            CONTEXT_BUDGET_BYTES,
          );
    const translatedChunks = [];
    for (const chunk of chunks) {
      translatedChunks.push(await translatePreservingKeeps(chunk, bodyContext));
    }
    translatedProtectedBody = translatedChunks.join('');
  }

  const translatedMeta = metadataTexts.length
    ? await translateTexts(
        metadataTexts,
        fitToBytes(plainContext(parsed.content.trim()), CONTEXT_BUDGET_BYTES),
      )
    : [];

  let metaIdx = 0;
  const enTitle =
    parsed.data.title && /[\u4e00-\u9fa5]/.test(parsed.data.title)
      ? translatedMeta[metaIdx++]
      : parsed.data.title || '';
  const enSummary =
    parsed.data.summary && /[\u4e00-\u9fa5]/.test(parsed.data.summary)
      ? translatedMeta[metaIdx++]
      : parsed.data.summary || '';
  const enTldr =
    parsed.data.tldr && /[\u4e00-\u9fa5]/.test(parsed.data.tldr)
      ? translatedMeta[metaIdx++]
      : parsed.data.tldr || '';

  let restoredBody = repairTranslatedProse(
    restoreMarkdown(translatedProtectedBody, placeholders),
  );

  // MDX 后处理安全清洗：
  // 1. 折叠跨行的行内标签，避免 MDX 误判为未闭合段落
  restoredBody = restoredBody.replace(
    /<(div|p|h[1-6]|span|summary|th|td|strong|em)([^>]*)>\s*\n\s*([^<\n]+?)\s*<\/\1>/g,
    '<$1$2>$3</$1>',
  );
  // 2. 清理 div 内部多余空行，防止打断段落导致未闭合错误
  restoredBody = restoredBody.replace(
    /(<div[^>]*>)([\s\S]*?)(<\/div>)/g,
    (match, open, inner, close) => {
      if (!inner.includes('\n#') && !inner.includes('\n##')) {
        return `${open}${inner.replace(/\n\s*\n+/g, '\n')}${close}`;
      }
      return match;
    },
  );

  // 4. 清理连续闭合标签或开始标签之间的多余空行，防止在 MDX 中打断容器
  restoredBody = restoredBody.replace(
    /(<\/[a-zA-Z0-9]+>)[ \t]*\n\s*\n+([ \t]*<\/[a-zA-Z0-9]+>)/g,
    '$1\n$2',
  );
  restoredBody = restoredBody.replace(
    /(<[a-zA-Z0-9]+[^>]*>)[ \t]*\n\s*\n+([ \t]*<[a-zA-Z0-9]+[^>]*>)/g,
    '$1\n$2',
  );
  // 5. 清理连续 3 个及以上的换行
  restoredBody = restoredBody.replace(/\n{3,}/g, '\n\n');

  // 构造英文 Frontmatter 对象，由 gray-matter 安全序列化，彻底杜绝 YAML 缩进格式错误
  const enData = {
    ...parsed.data,
    title: enTitle,
    summary: enSummary,
    tldr: enTldr,
    sourceHash: sha256(rawContent),
    translatedAt: new Date().toISOString(),
  };

  const outputMdx = matter.stringify(restoredBody.trim() + '\n', enData);
  const targetFile = path.join(I18N_BLOG_DIR, `${slug}.mdx`);

  fs.mkdirSync(I18N_BLOG_DIR, { recursive: true });
  fs.writeFileSync(targetFile, outputMdx, 'utf-8');

  console.log(
    `  ✓ 英文版本已写入: ${path.relative(process.cwd(), targetFile)}`,
  );
  return { slug, charEstimate, skipped: false };
}

function isMainModule() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === __filename;
}

async function main() {
  requireAuthKey();
  console.log('📚 检查博客文章翻译状态...');

  // 检查 API 配额
  if (!isDryRun && authKey) {
    try {
      const usageRes = await fetch(getUsageEndpoint(authKey), {
        headers: { Authorization: `DeepL-Auth-Key ${authKey.trim()}` },
      });
      if (usageRes.ok) {
        const usage = await usageRes.json();
        const remaining = usage.character_limit - usage.character_count;
        console.log(
          `💳 DeepL 额度状态: 已用 ${usage.character_count.toLocaleString()} / 上限 ${usage.character_limit.toLocaleString()} 字符 (剩余 ${remaining.toLocaleString()})`,
        );
        if (remaining < 5000) {
          console.warn('⚠️  剩余配额不足 5,000 字符，可能无法完成长文翻译！');
        }
      }
    } catch (e) {
      console.warn('⚠️  查询 DeepL 配额失败，将继续执行:', e.message);
    }
  }

  const allFiles = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .sort();

  const candidateFiles = targetSlug
    ? allFiles.filter(
        (f) =>
          f === `${targetSlug}.mdx` || f.replace(/\.mdx$/, '') === targetSlug,
      )
    : allFiles;

  if (candidateFiles.length === 0) {
    console.log(`❌ 未找到匹配的文章: ${targetSlug || 'all'}`);
    return;
  }

  const tasks = [];

  for (const file of candidateFiles) {
    const rawContent = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const currentHash = sha256(rawContent);
    const targetFile = path.join(I18N_BLOG_DIR, file);

    let needsTranslation = isForce || !fs.existsSync(targetFile);

    if (!needsTranslation && fs.existsSync(targetFile)) {
      try {
        const targetRaw = fs.readFileSync(targetFile, 'utf-8');
        const targetParsed = matter(targetRaw);
        if (targetParsed.data.sourceHash !== currentHash) {
          needsTranslation = true;
        }
      } catch {
        needsTranslation = true;
      }
    }

    if (needsTranslation) {
      tasks.push(file);
    }
  }

  if (tasks.length === 0) {
    console.log('✅ 所有文章英文版已是最新，无需翻译。');
    return;
  }

  const toExecute = tasks.slice(0, limitCount);
  console.log(
    `📋 发现 ${tasks.length} 篇待翻译文章，本次计划翻译 ${toExecute.length} 篇：`,
  );
  toExecute.forEach((t) => console.log(`  - ${t}`));

  let totalChars = 0;
  let successCount = 0;

  for (const file of toExecute) {
    try {
      const res = await translatePost(file);
      totalChars += res.charEstimate || 0;
      successCount++;
    } catch (err) {
      console.error(
        `❌ 翻译文章 ${file} 失败，跳过该篇继续处理后续:`,
        err.message,
      );
    }
  }

  console.log(
    `\n🎉 翻译流程结束！共成功处理 ${successCount}/${toExecute.length} 篇文章 (约 ${totalChars.toLocaleString()} 字符)`,
  );
  if (successCount !== toExecute.length) {
    throw new Error(`${toExecute.length - successCount} 篇文章没有写成英文`);
  }
}

if (isMainModule()) {
  main().catch((err) => {
    console.error('\n❌ 翻译过程出现错误:', err);
    process.exit(1);
  });
}
