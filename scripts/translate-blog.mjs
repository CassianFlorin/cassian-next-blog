#!/usr/bin/env node

/**
 * 博客文章正文自动翻译脚本 (DeepL Free API) - 纯原生无外部依赖
 *
 * 功能：
 * 1. 扫描 data/blog/*.mdx，对比 data/blog-i18n/en/{slug}.mdx 的内容 Hash。
 * 2. 占位保护代码块、行内代码、数学公式、自定义 JSX 组件（<Callout>, <StepProgress> 等）。
 * 3. 仅将人类可读文本与 Frontmatter (title, summary, tldr) 送给 DeepL API 翻译。
 * 4. 翻译完成后精准还原占位符，写回 data/blog-i18n/en/{slug}.mdx。
 *
 * 使用：
 *   DEEPL_AUTH_KEY="your-key:fx" node scripts/translate-blog.mjs
 *   node scripts/translate-blog.mjs --dry-run
 *   node scripts/translate-blog.mjs --slug 20260729-nextjs-i18n-seo-overhaul
 *   node scripts/translate-blog.mjs --limit 1
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../data/blog');
const I18N_BLOG_DIR = path.join(__dirname, '../data/blog-i18n/en');

const MAX_RETRIES = 3;

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

if (!authKey && !isDryRun) {
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

/**
 * 纯原生解析 MDX 文件 Frontmatter 与 Body
 */
function parseMdx(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content, rawFrontmatter: '' };
  }
  const rawFrontmatter = match[1];
  const body = match[2];

  const extractField = (key) => {
    // 匹配 key: '...' 或 key: "..." 或 key: >-\n  ... 或 key: ...
    const blockRegex = new RegExp(
      `^${key}:\\s*>-\\s*\\n((?:[ \\t]+.*(?:\\r?\\n|$))+)`,
      'm',
    );
    const blockMatch = rawFrontmatter.match(blockRegex);
    if (blockMatch) {
      return blockMatch[1].replace(/^[ \t]+/gm, '').trim();
    }

    const lineRegex = new RegExp(
      `^${key}:\\s*(?:['"]([\\s\\S]*?)['"]|(.*))$`,
      'm',
    );
    const lineMatch = rawFrontmatter.match(lineRegex);
    if (!lineMatch) return '';
    return (lineMatch[1] ?? lineMatch[2] ?? '').trim();
  };

  return {
    data: {
      title: extractField('title'),
      summary: extractField('summary'),
      tldr: extractField('tldr'),
    },
    content: body,
    rawFrontmatter,
  };
}

/**
 * 构造翻译后的 MDX 内容
 */
function buildTranslatedMdx(
  rawFrontmatter,
  restoredBody,
  { title, summary, tldr, sourceHash },
) {
  let newFm = rawFrontmatter;

  if (title) {
    newFm = newFm.replace(/^title:.*$/m, `title: ${JSON.stringify(title)}`);
  }
  if (summary) {
    newFm = newFm.replace(
      /^summary:.*$/m,
      `summary: ${JSON.stringify(summary)}`,
    );
  }
  if (tldr) {
    // 如果原有 tldr 是多行 >-，或者单行，统一替换为合规字符串
    if (/^tldr:\s*>-/m.test(newFm)) {
      newFm = newFm.replace(
        /^tldr:\s*>-\s*\n(?:[ \t]+.*(?:\r?\n|$))+/m,
        `tldr: ${JSON.stringify(tldr)}\n`,
      );
    } else if (/^tldr:.*$/m.test(newFm)) {
      newFm = newFm.replace(/^tldr:.*$/m, `tldr: ${JSON.stringify(tldr)}`);
    } else {
      newFm += `\ntldr: ${JSON.stringify(tldr)}`;
    }
  }

  // 清除现有的 sourceHash 与 translatedAt
  newFm = newFm
    .replace(/^sourceHash:.*$\r?\n?/m, '')
    .replace(/^translatedAt:.*$\r?\n?/m, '');

  newFm =
    newFm.trimEnd() +
    `\nsourceHash: '${sourceHash}'\ntranslatedAt: '${new Date().toISOString()}'\n`;

  return `---\n${newFm}---\n\n${restoredBody.trim()}\n`;
}

/**
 * 从目标文件快速读取已有的 sourceHash
 */
function getSourceHash(targetRaw) {
  const m = targetRaw.match(/^sourceHash:\s*['"]?([^'"\r\n]+)['"]?/m);
  return m ? m[1].trim() : null;
}

/**
 * 保护正文中的不可翻译节点（代码块、行内代码、公式、JSX 标签、链接 URL）
 */
function protectMarkdown(content) {
  const placeholders = new Map();
  let counter = 0;

  function store(text) {
    const key = `___KEEP_${counter++}___`;
    placeholders.set(key, text);
    return `<keep id="${key}">${key}</keep>`;
  }

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

  // 4. 保护自定义 JSX 组件标签，如 <Callout ...>, </Callout>, <StepProgress ... />, <Tldr>
  protectedText = protectedText.replace(
    /<\/?([A-Z][a-zA-Z0-9]*)[^>]*>/g,
    (match) => store(match),
  );

  // 5. 保护 HTML 标签与注释
  protectedText = protectedText.replace(/<!--[\s\S]*?-->/g, (match) =>
    store(match),
  );
  protectedText = protectedText.replace(
    /<\/?(div|span|details|summary|table|thead|tbody|tr|th|td|a|p)[^>]*>/gi,
    (match) => store(match),
  );

  // 6. 保护 Markdown 链接中的 URL 路径 [text](url) -> 仅翻译 text，保持 url 占位
  protectedText = protectedText.replace(
    /(\[[^\]]+\])\(([^)\s]+)\)/g,
    (match, text, url) => {
      const urlPlaceholder = store(url);
      return `${text}(${urlPlaceholder})`;
    },
  );

  return { protectedText, placeholders };
}

/**
 * 还原占位符
 */
function restoreMarkdown(text, placeholders) {
  let restored = text;

  // 先把 <keep id="___KEEP_x___">___KEEP_x___</keep> 剥去 keep 外壳
  restored = restored.replace(/<keep[^>]*>([\s\S]*?)<\/keep>/gi, '$1');

  // 将所有占位符换回原内容
  for (const [key, original] of placeholders.entries()) {
    restored = restored.replaceAll(key, original);
  }

  return restored;
}

/**
 * 对待发送给 DeepL 的文本进行 XML 合规化转义
 * 避免文本中的孤立 & 或 < 破坏 DeepL 的 tag_handling: xml 解析器
 */
function escapeXmlForDeepL(text) {
  let s = text.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;');
  s = s.replace(/<(?!keep\b|\/keep>)/gi, '&lt;');
  return s;
}

function unescapeXmlFromDeepL(text) {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

/**
 * 调用 DeepL API 翻译单批文本
 */
async function translateTexts(texts) {
  if (texts.length === 0) return [];

  const endpoint = getDeepLEndpoint(authKey);
  const preparedTexts = texts.map((t) => escapeXmlForDeepL(t));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${authKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: preparedTexts,
          source_lang: 'ZH',
          target_lang: 'EN-US',
          tag_handling: 'xml',
          ignore_tags: ['keep'],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DeepL API responded with ${response.status} ${response.statusText}: ${errorText}`,
        );
      }

      const data = await response.json();
      return data.translations.map((item) => unescapeXmlFromDeepL(item.text));
    } catch (err) {
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
  const parsed = parseMdx(rawContent);
  const slug = file.replace(/\.mdx$/, '');

  console.log(`\n📄 正在处理文章: ${file}`);

  const { protectedText, placeholders } = protectMarkdown(parsed.content);

  // 准备需要翻译的段落
  const paragraphs = protectedText.split(/\n\n+/);
  const toTranslateTexts = [];
  const paraIndices = [];

  paragraphs.forEach((p, index) => {
    const trimmed = p.trim();
    if (
      trimmed &&
      !/^<keep id="___KEEP_\d+___">___KEEP_\d+___<\/keep>$/.test(trimmed)
    ) {
      toTranslateTexts.push(p);
      paraIndices.push(index);
    }
  });

  // Frontmatter 待翻译项
  const metadataTexts = [];
  if (parsed.data.title) metadataTexts.push(parsed.data.title);
  if (parsed.data.summary) metadataTexts.push(parsed.data.summary);
  if (parsed.data.tldr) metadataTexts.push(parsed.data.tldr);

  const allTexts = [...metadataTexts, ...toTranslateTexts];
  const charEstimate = allTexts.reduce((acc, t) => acc + t.length, 0);

  console.log(
    `  - 需翻译段落数: ${toTranslateTexts.length}，需翻译字符数约: ${charEstimate}`,
  );

  if (isDryRun) {
    return { slug, charEstimate, skipped: false };
  }

  // 分批发送给 DeepL（每次最多 25 个段落）
  const translatedAll = [];
  const BATCH_SIZE = 25;

  for (let i = 0; i < allTexts.length; i += BATCH_SIZE) {
    const batch = allTexts.slice(i, i + BATCH_SIZE);
    const translatedBatch = await translateTexts(batch);
    translatedAll.push(...translatedBatch);
  }

  // 拆回 metadata
  let metaIdx = 0;
  const enTitle = parsed.data.title ? translatedAll[metaIdx++] : '';
  const enSummary = parsed.data.summary ? translatedAll[metaIdx++] : '';
  const enTldr = parsed.data.tldr ? translatedAll[metaIdx++] : '';

  // 拆回正文段落
  let paraIdx = 0;
  const translatedParagraphs = [...paragraphs];
  paraIndices.forEach((index) => {
    translatedParagraphs[index] =
      translatedAll[metadataTexts.length + paraIdx++];
  });

  // 拼回正文并还原占位符
  const translatedProtectedBody = translatedParagraphs.join('\n\n');
  const restoredBody = restoreMarkdown(translatedProtectedBody, placeholders);

  // 构造并保存目标 MDX
  const outputMdx = buildTranslatedMdx(parsed.rawFrontmatter, restoredBody, {
    title: enTitle,
    summary: enSummary,
    tldr: enTldr,
    sourceHash: sha256(rawContent),
  });

  const targetFile = path.join(I18N_BLOG_DIR, `${slug}.mdx`);

  fs.mkdirSync(I18N_BLOG_DIR, { recursive: true });
  fs.writeFileSync(targetFile, outputMdx, 'utf-8');

  console.log(
    `  ✓ 英文版本已写入: ${path.relative(process.cwd(), targetFile)}`,
  );
  return { slug, charEstimate, skipped: false };
}

async function main() {
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
        const existingHash = getSourceHash(targetRaw);
        if (existingHash !== currentHash) {
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
}

main().catch((err) => {
  console.error('\n❌ 翻译过程出现错误:', err);
  process.exit(1);
});
