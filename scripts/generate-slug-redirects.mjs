#!/usr/bin/env node
/**
 * 生成「不带日期的旧式 slug -> 真实 slug」映射，供 middleware 做 308 重定向。
 *
 * 博文路由取自文件名整体（含 YYYYMMDD- 前缀），历史上有些内链写成
 * /blog/install-sdkman 这种不带日期的形式，会 404。这里把可以唯一还原的
 * 裸 slug 收进映射，middleware 命中后重定向到真实地址。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '../data/blog');
const OUT_FILE = path.join(__dirname, '../app/blog-slug-map.json');

const DATED = /^(\d{8})-(.+)$/;

const slugs = fs
  .readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''));

const map = {};
const collisions = new Map();

for (const slug of slugs) {
  const m = slug.match(DATED);
  if (!m) continue;
  const bare = m[2];
  if (slugs.includes(bare)) continue; // 裸名本身就是一篇文章，不能抢
  collisions.set(bare, [...(collisions.get(bare) ?? []), slug]);
}

for (const [bare, targets] of collisions) {
  if (targets.length > 1) {
    console.warn(
      `  ⚠ 裸 slug "${bare}" 对应 ${targets.length} 篇文章，跳过：${targets.join(', ')}`,
    );
    continue;
  }
  map[bare] = targets[0];
}

const sorted = Object.fromEntries(
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)),
);
const json = JSON.stringify(sorted, null, 2) + '\n';

const prev = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
if (prev === json) {
  console.log(
    `✓ blog-slug-map.json 无变化（${Object.keys(sorted).length} 条）`,
  );
} else {
  fs.writeFileSync(OUT_FILE, json);
  console.log(
    `✓ 已写入 app/blog-slug-map.json（${Object.keys(sorted).length} 条）`,
  );
}
