#!/usr/bin/env node

/**
 * 自动同步与翻译 UI 词条 (messages/zh.json -> messages/en.json)
 *
 * 功能：
 * 1. 递归比对 zh.json 与 en.json，找出英文版中缺失或为空的词条。
 * 2. 保护 ICU 变量（如 {count}），防止被翻译或破坏。
 * 3. 调用 DeepL API（自动适配 Free Key :fx 与 Pro Key）进行批量翻译。
 * 4. 将新翻译无缝合并回 en.json，保持原有键顺序与结构不变。
 *
 * 使用：
 *   DEEPL_AUTH_KEY="your-key:fx" node scripts/translate-messages.mjs
 *   node scripts/translate-messages.mjs --dry-run
 *   node scripts/translate-messages.mjs --force
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZH_FILE = path.join(__dirname, '../messages/zh.json');
const EN_FILE = path.join(__dirname, '../messages/en.json');

const BATCH_SIZE = 30; // 每次请求最多翻译 30 条文本
const MAX_RETRIES = 3;

// 命令行参数解析
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
使用方式:
  node scripts/translate-messages.mjs [options]

环境变量:
  DEEPL_AUTH_KEY 或 DEEPL_API_KEY   DeepL API 密钥（以 :fx 结尾为免费版）

选项:
  --dry-run   仅检查并输出缺失的词条与预估字符数，不调用 DeepL API
  --force     强制翻译所有词条（即使 en.json 中已有值）
  --help, -h  显示此帮助信息
`);
  process.exit(0);
}

const authKey = process.env.DEEPL_AUTH_KEY || process.env.DEEPL_API_KEY;

if (!authKey && !isDryRun) {
  console.error(`
❌ 错误: 未找到 DeepL API 密钥。
请通过环境变量提供密钥：
  export DEEPL_AUTH_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
  node scripts/translate-messages.mjs

如果你想仅预览缺失项，可以运行：
  node scripts/translate-messages.mjs --dry-run
`);
  process.exit(1);
}

// 根据 Key 后缀判断 endpoint
function getDeepLEndpoint(key = '') {
  return key.trim().endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
}

/**
 * 保护变量（如 {count}、{count, plural, ...}），避免被 DeepL 翻译或破坏
 */
function protectVariables(text) {
  return text.replace(/\{[^{}]+\}/g, (match) => `<keep>${match}</keep>`);
}

/**
 * 还原被保护的变量
 */
function unprotectVariables(text) {
  return text.replace(/<keep>([\s\S]*?)<\/keep>/g, '$1');
}

/**
 * 递归收集待翻译项
 */
function collectMissingEntries(zhObj, enObj, prefix = []) {
  const missing = [];

  for (const [key, zhVal] of Object.entries(zhObj)) {
    const currentPath = [...prefix, key];
    const enVal = enObj ? enObj[key] : undefined;

    if (typeof zhVal === 'string') {
      const isMissing =
        isForce ||
        enVal === undefined ||
        enVal === null ||
        (typeof enVal === 'string' && enVal.trim() === '');
      if (isMissing) {
        missing.push({ path: currentPath, text: zhVal, type: 'string' });
      }
    } else if (Array.isArray(zhVal)) {
      if (isForce || !Array.isArray(enVal) || enVal.length !== zhVal.length) {
        zhVal.forEach((item, index) => {
          if (typeof item === 'string') {
            const currentItemEn = Array.isArray(enVal)
              ? enVal[index]
              : undefined;
            if (isForce || !currentItemEn || currentItemEn.trim() === '') {
              missing.push({
                path: [...currentPath, index],
                text: item,
                type: 'array-item',
              });
            }
          }
        });
      }
    } else if (typeof zhVal === 'object' && zhVal !== null) {
      const nestedEn =
        typeof enVal === 'object' && enVal !== null && !Array.isArray(enVal)
          ? enVal
          : {};
      missing.push(...collectMissingEntries(zhVal, nestedEn, currentPath));
    }
  }

  return missing;
}

/**
 * 按路径设置对象值
 */
function setPathValue(obj, pathArr, value) {
  let curr = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    const key = pathArr[i];
    const nextKey = pathArr[i + 1];
    if (typeof nextKey === 'number') {
      if (!Array.isArray(curr[key])) {
        curr[key] = [];
      }
    } else {
      if (!curr[key] || typeof curr[key] !== 'object') {
        curr[key] = {};
      }
    }
    curr = curr[key];
  }
  curr[pathArr[pathArr.length - 1]] = value;
}

/**
 * 按 zh 结构重新排序 en 对象，保留未在 zh 出现的特殊 key 在末尾
 */
function sortLikeZh(zhObj, enObj) {
  if (typeof zhObj !== 'object' || zhObj === null || Array.isArray(zhObj)) {
    return enObj !== undefined ? enObj : zhObj;
  }
  const result = {};
  const zhKeys = Object.keys(zhObj);
  const enKeys = Object.keys(enObj || {});

  // 先按 zh 顺序排
  for (const k of zhKeys) {
    if (enObj && k in enObj) {
      if (
        typeof zhObj[k] === 'object' &&
        zhObj[k] !== null &&
        !Array.isArray(zhObj[k])
      ) {
        result[k] = sortLikeZh(zhObj[k], enObj[k]);
      } else {
        result[k] = enObj[k];
      }
    }
  }

  // 再把 en 特有的 key 补在后面
  for (const k of enKeys) {
    if (!(k in result)) {
      result[k] = enObj[k];
    }
  }

  return result;
}

/**
 * 调用 DeepL 批量翻译
 */
async function translateBatch(texts) {
  const endpoint = getDeepLEndpoint(authKey);
  const preparedTexts = texts.map((t) => protectVariables(t));

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
      if (!data.translations || data.translations.length !== texts.length) {
        throw new Error('Unexpected translation response structure from DeepL');
      }

      return data.translations.map((item) => unprotectVariables(item.text));
    } catch (err) {
      console.warn(
        `⚠️  翻译批次失败 (第 ${attempt}/${MAX_RETRIES} 次重试): ${err.message}`,
      );
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((res) => setTimeout(res, 1500 * attempt));
    }
  }
}

async function main() {
  console.log('🌐 开始检查 UI 词条翻译状态...');

  const zhRaw = fs.readFileSync(ZH_FILE, 'utf-8');
  const enRaw = fs.existsSync(EN_FILE)
    ? fs.readFileSync(EN_FILE, 'utf-8')
    : '{}';

  const zhData = JSON.parse(zhRaw);
  const enData = JSON.parse(enRaw);

  const missing = collectMissingEntries(zhData, enData);

  if (missing.length === 0) {
    console.log('✅ 所有 UI 词条均已有英文翻译，无需同步。');
    return;
  }

  const totalChars = missing.reduce((acc, cur) => acc + cur.text.length, 0);
  console.log(
    `📋 发现 ${missing.length} 条待翻译词条 (共约 ${totalChars} 字符)${isForce ? ' [全量强制模式]' : ''}：`,
  );

  for (const item of missing.slice(0, 10)) {
    console.log(`  - [${item.path.join('.')}] "${item.text}"`);
  }
  if (missing.length > 10) {
    console.log(`  ... 以及另外 ${missing.length - 10} 条`);
  }

  if (isDryRun) {
    console.log('\n🔍 [Dry Run] 仅检查模式完成，未修改任何文件。');
    return;
  }

  console.log(
    `\n🚀 开始调用 DeepL 进行翻译 (Endpoint: ${getDeepLEndpoint(authKey)})...`,
  );

  // 分批翻译
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    const textsToTranslate = batch.map((b) => b.text);
    console.log(
      `  ⏳ 正在翻译第 ${i + 1} ~ ${Math.min(i + BATCH_SIZE, missing.length)} / ${missing.length} 条...`,
    );

    const translatedTexts = await translateBatch(textsToTranslate);

    for (let j = 0; j < batch.length; j++) {
      const entry = batch[j];
      const translated = translatedTexts[j];
      setPathValue(enData, entry.path, translated);
    }
  }

  // 格式化排序并写回
  const sortedEn = sortLikeZh(zhData, enData);
  fs.writeFileSync(EN_FILE, JSON.stringify(sortedEn, null, 2) + '\n', 'utf-8');

  console.log(
    `\n🎉 翻译完成并已写入: ${path.relative(process.cwd(), EN_FILE)}`,
  );
}

main().catch((err) => {
  console.error('\n❌ 翻译过程出现严重错误:', err);
  process.exit(1);
});
