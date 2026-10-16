import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import test from 'node:test';
import matter from 'gray-matter';
import {
  assembleDocument,
  assertKeepsSurvived,
  fitToBytes,
  protectMarkdown,
  repairTranslatedProse,
  restoreMarkdown,
  splitDocument,
} from './translate-blog.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

test('中文段落合成一篇，代码块不进入请求正文', () => {
  const source = [
    '第一段写的是发件人。',
    '```js\nconst token = 1;\n```',
    '第二段里的对方仍指发件人。',
  ].join('\n\n');

  const { protectedText, placeholders, store } = protectMarkdown(source);
  const document = assembleDocument(protectedText, store);

  assert.match(document, /第一段写的是发件人/);
  assert.match(document, /第二段里的对方仍指发件人/);
  assert.equal(document.includes('const token'), false);
  assert.equal(splitDocument(document, 96 * 1024).length, 1);
  assert.equal(restoreMarkdown(document, placeholders), source);
});

test('链接被换行拆开后能合回原地址', () => {
  const source =
    '看[域名邮箱部署](/blog/20261012-cloud-mail-deployment)的记录。';
  const { protectedText, placeholders } = protectMarkdown(source);
  const translated = protectedText.replace('</keep>)', '</keep>\n)');
  const restored = repairTranslatedProse(
    restoreMarkdown(translated, placeholders),
  );

  assert.equal(
    restored,
    '看[域名邮箱部署](/blog/20261012-cloud-mail-deployment)的记录。',
  );
});

test('句号后粘连的英文只改正文，不改代码块', () => {
  const source = 'image.The script\n\n```\nimage.The\n```\n\n`image.The`';
  assert.equal(
    repairTranslatedProse(source),
    'image. The script\n\n```\nimage.The\n```\n\n`image.The`',
  );
});

test('超长正文按标题切开，拼回后与原文一致', () => {
  const text = [
    '开头。',
    '',
    '## 第一节',
    '',
    '甲。'.repeat(40),
    '',
    '## 第二节',
    '',
    '乙。',
  ].join('\n');
  const chunks = splitDocument(text, 80);
  assert.ok(chunks.length >= 2);
  assert.equal(chunks.join(''), text);
  assert.match(chunks.at(-1), /^## 第二节/);
});

test('语境按段落边界截断', () => {
  const text = `${'甲'.repeat(50)}\n\n${'乙'.repeat(50)}`;
  const fitted = fitToBytes(
    text,
    Buffer.byteLength('甲'.repeat(50), 'utf8') + 8,
  );
  assert.equal(fitted.includes('乙'), false);
  assert.match(fitted, /甲/);
});

test('占位符丢失时中止', () => {
  assert.throws(
    () => assertKeepsSurvived('___KEEP_0___ ___KEEP_1___', '___KEEP_0___'),
    /占位符/,
  );
});

test('已发布的阅读隐私一文可以整篇送出', () => {
  const file = path.join(
    scriptDir,
    '../data/blog/20261016-cloud-mail-reading-privacy.mdx',
  );
  const parsed = matter(fs.readFileSync(file, 'utf8'));
  const { protectedText, store } = protectMarkdown(parsed.content);
  const document = assembleDocument(protectedText, store);
  const chunks = splitDocument(document, 96 * 1024);

  assert.equal(chunks.length, 1);
  assert.match(chunks[0], /访问对方的地址/);
  assert.match(chunks[0], /替对方确认已读/);
  assert.match(chunks[0], /可能通知对方，拿不到邮箱令牌/);
});
