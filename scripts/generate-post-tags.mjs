#!/usr/bin/env node

/**
 * 自动为博客文章生成/补全 tags
 * - 扫描标题与正文的关键词
 * - 根据映射字典补充标签，不重复已有标签
 * - 可通过 --file 指定单个文件；默认处理 data/blog 目录全部 .mdx
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'data', 'blog');

// 关键词 → 标签 映射（大小写不敏感，支持正则）
// 尽量选择较为明确的特征词，避免误命中
const KEYWORD_RULES = [
  // 通用
  { tag: 'Open Source', tests: [/开源/i, /open\s*source/i, /\boss\b/i] },
  { tag: 'GitHub', tests: [/github/i] },
  { tag: 'Tools', tests: [/工具/i, /\btools?\b/i] },
  { tag: 'Guide', tests: [/指南/i, /guide/i] },
  { tag: 'Tips', tests: [/技巧|提示|tip(s)?/i] },

  // 语言/技术
  { tag: 'Java', tests: [/\bjava\b(?!\s*script)/i] },
  { tag: 'JavaScript', tests: [/javascript|\bjs\b/i] },
  { tag: 'MDX', tests: [/\bmdx\b/i] },

  // 项目/产品
  { tag: 'MooTool', tests: [/mootool/i] },

  // 主题词
  { tag: 'Contributors', tests: [/贡献者|贡献|contributor/i] },
  { tag: 'Diff', tests: [/text\s*diff/i, /\bdiff\b/i, /差异|对比/i] },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { file: null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--file' && i + 1 < args.length) {
      out.file = args[++i];
    } else if (a === '--dry-run') {
      out.dryRun = true;
    }
  }
  return out;
}

function collectCandidateTags(text) {
  const res = new Set();
  if (!text) return res;
  for (const rule of KEYWORD_RULES) {
    const matched = rule.tests.some((t) => t.test(text));
    if (matched) res.add(rule.tag);
  }
  return res;
}

function normalizeTags(arr) {
  // 去重并保持顺序：已有标签优先，新增标签按映射顺序追加
  const seen = new Set();
  const out = [];
  for (const t of arr) {
    if (!t || typeof t !== 'string') continue;
    const key = t.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function updateFile(filePath, { dryRun }) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const { data, content } = parsed;

  const title = String(data.title || '');
  const scanText = `${title}\n${content}`;
  const candidates = collectCandidateTags(scanText);

  const existing = Array.isArray(data.tags) ? data.tags.slice() : [];
  const existingSet = new Set(existing);

  const toAppend = [];
  for (const tag of candidates) {
    if (!existingSet.has(tag)) toAppend.push(tag);
  }

  if (toAppend.length === 0) {
    return { updated: false, added: [] };
  }

  const nextTags = normalizeTags([...existing, ...toAppend]);

  if (dryRun) {
    return { updated: false, added: toAppend, nextTags };
  }

  const nextRaw = matter.stringify(content, { ...data, tags: nextTags });
  fs.writeFileSync(filePath, nextRaw);
  return { updated: true, added: toAppend, nextTags };
}

function resolveFiles(target) {
  if (target) {
    const p = path.isAbsolute(target) ? target : path.join(ROOT, target);
    if (!fs.existsSync(p)) {
      console.error(`File not found: ${p}`);
      process.exit(1);
    }
    return [p];
  }
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => path.join(BLOG_DIR, f));
}

function main() {
  const args = parseArgs();
  const files = resolveFiles(args.file);

  let changed = 0;
  for (const file of files) {
    const { updated, added, nextTags } = updateFile(file, args);
    if (added && added.length > 0) {
      console.log(`+ ${path.relative(ROOT, file)} -> add: ${added.join(', ')}`);
    }
    if (updated) {
      console.log(`✓ updated tags: [${nextTags.join(', ')}]`);
      changed++;
    }
  }

  if (changed === 0) {
    console.log('No files updated.');
  } else {
    console.log(`Done. ${changed} file(s) updated.`);
  }
}

main();

