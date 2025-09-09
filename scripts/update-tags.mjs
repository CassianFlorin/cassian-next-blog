#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const BLOG_DIR = path.join(__dirname, '../data/blog');
const ZH_TRANSLATION_FILE = path.join(__dirname, '../messages/zh.json');
const EN_TRANSLATION_FILE = path.join(__dirname, '../messages/en.json');

// 默认翻译映射（用于自动生成翻译）
const DEFAULT_TRANSLATIONS = {
  // 中文标签的英文翻译
  开发习惯: 'Development Habits',
  随笔: 'Essay',
  开端: 'Start',
  Git: 'Git',
  git: 'Git',
  GitHub: 'GitHub',
  'Next.js': 'Next.js',
  Tailwind: 'Tailwind',
  Markdown: 'Markdown',
  代码: 'Code',
  功能: 'Features',
  特性: 'Feature',
  指南: 'Guide',
  书籍: 'Book',
  反思: 'Reflection',
  假期: 'Holiday',
  加拿大: 'Canada',
  图片: 'Images',
  数学: 'Math',
  最小二乘法: 'OLS',
  多作者: 'Multi-author',
  你好: 'Hello',
  writings: 'Writings',
  book: 'Book',
  reflection: 'Reflection',
  github: 'GitHub',
  guide: 'Guide',
  'next-js': 'Next.js',
  tailwind: 'Tailwind',
  feature: 'Feature',
  holiday: 'Holiday',
  canada: 'Canada',
  images: 'Images',
  markdown: 'Markdown',
  code: 'Code',
  features: 'Features',
  'multi-author': 'Multi-author',
  math: 'Math',
  ols: 'OLS',
  hello: 'Hello',
};

// 英文标签的中文翻译
const EN_TO_ZH_TRANSLATIONS = {
  'Development Habits': '开发习惯',
  Essay: '随笔',
  Start: '开端',
  Git: 'Git',
  git: 'Git',
  GitHub: 'GitHub',
  'Next.js': 'Next.js',
  Tailwind: 'Tailwind',
  Markdown: 'Markdown',
  Code: '代码',
  Features: '功能',
  Feature: '特性',
  Guide: '指南',
  Book: '书籍',
  Reflection: '反思',
  Holiday: '假期',
  Canada: '加拿大',
  Images: '图片',
  Math: '数学',
  OLS: '最小二乘法',
  'Multi-author': '多作者',
  Hello: '你好',
  Writings: '随笔',
};

/**
 * 从 MDX 文件中提取标签
 */
function extractTagsFromMDX(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      return [];
    }

    const frontmatter = frontmatterMatch[1];
    const tagsMatch = frontmatter.match(/^tags:\s*\[(.*?)\]/m);

    if (!tagsMatch) {
      return [];
    }

    // 解析标签数组
    const tagsString = tagsMatch[1];
    const tags = tagsString
      .split(',')
      .map((tag) => tag.trim().replace(/['"]/g, ''))
      .filter((tag) => tag.length > 0);

    return tags;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * 扫描所有 MDX 文件并收集标签
 */
function scanAllTags() {
  const allTags = new Set();

  try {
    const files = fs.readdirSync(BLOG_DIR);

    for (const file of files) {
      if (file.endsWith('.mdx')) {
        const filePath = path.join(BLOG_DIR, file);
        const tags = extractTagsFromMDX(filePath);
        tags.forEach((tag) => allTags.add(tag));
      }
    }
  } catch (error) {
    console.error('Error scanning blog directory:', error.message);
  }

  return Array.from(allTags);
}

/**
 * 读取翻译文件
 */
function readTranslationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // 确保 tags 对象存在
    if (!data.tags) {
      data.tags = {};
    }

    return data;
  } catch (error) {
    console.error(`Error reading translation file ${filePath}:`, error.message);
    // 如果文件不存在或格式错误，返回默认结构
    return { tags: {} };
  }
}

/**
 * 更新翻译文件
 */
function updateTranslationFile(filePath, translations, newTags) {
  const data = readTranslationFile(filePath);

  let addedCount = 0;

  for (const tag of newTags) {
    if (!data.tags[tag]) {
      const translation = translations[tag];
      if (translation) {
        data.tags[tag] = translation;
        addedCount++;
        console.log(`  + Added: "${tag}" -> "${translation}"`);
      } else {
        // 如果没有预设翻译，使用标签本身作为翻译
        data.tags[tag] = tag;
        addedCount++;
        console.log(`  + Added: "${tag}" -> "${tag}" (no translation found)`);
      }
    }
  }

  if (addedCount > 0) {
    try {
      // 保持现有的文件结构，只更新 tags 部分
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      console.log(`  ✓ Updated ${filePath} with ${addedCount} new tags`);
    } catch (error) {
      console.error(`Error writing to ${filePath}:`, error.message);
    }
  } else {
    console.log(`  ✓ No new tags to add to ${filePath}`);
  }

  return addedCount;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 Scanning MDX files for tags...');

  // 扫描所有标签
  const allTags = scanAllTags();
  console.log(`Found ${allTags.length} unique tags:`, allTags);

  if (allTags.length === 0) {
    console.log('No tags found in MDX files.');
    return;
  }

  console.log('\n📝 Updating translation files...');

  // 更新中文翻译文件
  console.log('\nUpdating Chinese translations:');
  const zhAdded = updateTranslationFile(
    ZH_TRANSLATION_FILE,
    EN_TO_ZH_TRANSLATIONS,
    allTags,
  );

  // 更新英文翻译文件
  console.log('\nUpdating English translations:');
  const enAdded = updateTranslationFile(
    EN_TRANSLATION_FILE,
    DEFAULT_TRANSLATIONS,
    allTags,
  );

  console.log('\n✅ Summary:');
  console.log(`  - Chinese translations: ${zhAdded} tags added`);
  console.log(`  - English translations: ${enAdded} tags added`);
  console.log(`  - Total unique tags: ${allTags.length}`);

  if (zhAdded > 0 || enAdded > 0) {
    console.log(
      '\n💡 Tip: You may want to review and improve the auto-generated translations.',
    );
  }
}

// 运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
