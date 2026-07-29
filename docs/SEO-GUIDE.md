# SEO 指南

本站的 SEO **绝大部分是自动的**：写好 frontmatter，构建时自动产出 canonical、hreflang、Open Graph、结构化数据和 sitemap。

本文档说明两件事：

1. [发新文章时你需要做什么](#一发新文章时你需要做什么)（只有 frontmatter 一件事）
2. [自动化机制在哪里实现](#二自动化机制)（改站点结构时需要知道）

---

## 一、发新文章时你需要做什么

在 `data/blog/` 下新建 `.mdx` 文件，写好 frontmatter，**其余全自动**。

### Frontmatter 模板

```yaml
---
title: '文章标题（含主关键词，中文建议 ≤ 30 字）'
date: '2026-07-29 10:00:00'
tags: ['AI', 'Agent', 'Obsidian'] # 2-8 个
draft: false
summary: '150 字符以内的摘要，会直接作为 meta description 和搜索结果里的描述文本。'
images: ['/static/images/xxx/cover.png'] # 可选，建议 1200x630
canonicalUrl: 'https://原始发布地址' # 可选，仅当文章首发在别处时填
---
```

### 各字段的 SEO 作用

| 字段           | 输出到哪里                                                                        |
| -------------- | --------------------------------------------------------------------------------- |
| `title`        | `<title>`、`og:title`、`twitter:title`、JSON-LD `headline`、面包屑最后一级        |
| `summary`      | `<meta name="description">`、`og:description`、JSON-LD `description`、RSS         |
| `date`         | `article:published_time`、JSON-LD `datePublished`、sitemap `lastmod`              |
| `lastmod`      | `article:modified_time`、JSON-LD `dateModified`、sitemap `lastmod`（优先于 date） |
| `tags`         | `article:tag`、`<meta name="keywords">`、JSON-LD `keywords`、标签页与 RSS 分类    |
| `images`       | `og:image`、`twitter:image`、JSON-LD `image`（自动补成绝对 URL）                  |
| `canonicalUrl` | 覆盖 `<link rel="canonical">`，用于转载/首发在别处的文章                          |
| `draft: true`  | 排除出 sitemap、RSS 和标签统计                                                    |

### 写作要点

- **标题只写一次**：正文可以照常写 `# 一级标题`，构建时会自动整体降一级（`#`→`##`、`##`→`###`），保证页面只有布局渲染的那一个 `<h1>`。
- **图片必须有 alt**：`![描述](/static/images/xxx.png)`，空 alt 会让构建失败。
- **内链不要写语言前缀**：写 `/blog/xxx` 即可，`components/Link.tsx` 会自动补当前语言。写成 `/zh/blog/xxx` 会被 `check-seo` 警告。

### 自检

```bash
yarn check-seo
```

`yarn build` 的第一步就是它（Yarn 3 不会自动执行 `prebuild`，所以直接串在 `build` 里）。**错误会中断构建**，警告只提示：

| 级别    | 检查项                                                                                                     |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| ✖ 错误 | 缺 title / summary / date、date 无法解析、图片缺 alt、封面文件不存在、canonicalUrl 不是绝对 URL、slug 冲突 |
| ⚠ 警告 | 标题过长、摘要过短或过长、标签数量不在 2-8、正文没有小标题、内链写死语言前缀、没配封面图                   |

想让警告也阻断构建：`node scripts/check-seo.mjs --strict`。

---

## 二、自动化机制

### 核心模块

| 文件                    | 职责                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `lib/seo.ts`            | URL 规范化、语言前缀、canonical + hreflang 组装、图片绝对化 |
| `lib/structuredData.ts` | 所有 schema.org JSON-LD 的构造                              |
| `lib/locales.mjs`       | 语言列表的唯一来源（app 与构建脚本共用）                    |
| `app/seo.tsx`           | `genPageMetadata()`，普通页面的 metadata 生成器             |
| `components/JsonLd.tsx` | JSON-LD 渲染组件                                            |
| `scripts/check-seo.mjs` | 内容 SEO 检查（`build` 脚本第一步执行）                     |

### 多语言（关键）

站点路由是 `/{locale}/...`，`middleware.ts` 会把不带语言前缀的 URL 重定向。因此**所有对外 URL 都必须带语言前缀**，否则每次抓取都多一跳重定向。

统一由 `lib/seo.ts` 处理：

- `<link rel="canonical">` → 当前语言的绝对 URL（`canonicalUrl` frontmatter 可覆盖）
- `<link rel="alternate" hreflang>` → `zh-CN` / `en` / `x-default`（`x-default` 指向默认语言 `zh`）
- `og:locale` → `zh_CN` / `en_US`，`og:locale:alternate` 为另一种语言
- `<html lang>` → `zh-CN` / `en`

> 目前文章正文只有中文，`/en/blog/xxx` 与 `/zh/blog/xxx` 正文相同、仅界面翻译。用 hreflang 互相声明 + 各自 self-canonical 是这种情况的标准处理方式，搜索引擎会自行选择展示哪个版本。

### Sitemap

`app/sitemap.ts` 自动包含（每条都是「每种语言 × 带 hreflang 注解」）：

- 首页、`/blog`、`/projects`、`/knowledge`、`/about`、`/tags`
- 全部非草稿文章
- 博客分页（从第 2 页开始，第 1 页与 `/blog` 重复所以跳过）
- 全部标签页

新增文章 / 标签会自动进入，无需手动维护。

### 结构化数据

| Schema           | 位置                    | 说明                                                 |
| ---------------- | ----------------------- | ---------------------------------------------------- |
| `Person`         | 每个页面（locale 布局） | 站点作者，作为所有内容的 publisher                   |
| `WebSite`        | 每个页面（locale 布局） | 站点本身                                             |
| `BlogPosting`    | 文章页                  | 含 wordCount、keywords、inLanguage、mainEntityOfPage |
| `BreadcrumbList` | 文章页                  | 首页 → 博客 → 当前文章                               |
| `CollectionPage` | `/blog`、标签页         | 含 ItemList 列出当前页文章                           |

节点之间用 `@id` 互相引用（`#person` / `#website`），形成一张完整的图。

### 页面 metadata

每个页面的标题和描述来自 `messages/{zh,en}.json` 的 `seo` 命名空间。**新增页面时**：

1. 在两个 `messages/*.json` 的 `seo` 下加标题/描述键
2. 页面导出 `generateMetadata`，调用 `genPageMetadata({ title, description, locale, path })`

`path` 必须是不带语言前缀的路径（如 `/projects`），canonical 和 hreflang 由它推导。

> ⚠️ 客户端组件（`'use client'`）不能导出 metadata。参考 `app/[locale]/projects/` 和 `app/[locale]/tags/` 的做法：`page.tsx` 作为服务端组件导出 metadata，正文拆到 `XxxContent.tsx`。

> ⚠️ 不要在 layout 里用 `genPageMetadata` 导出裸字符串 `title`——它会清掉父级的 title 模板，导致子页面标题丢失站点名后缀。

### robots.txt

`app/robots.ts` 允许全站抓取，屏蔽 `/api/`、`/_next/` 和 `?page=` / `?post=` 查询变体（避免重复内容）。

### RSS

`scripts/rss.mjs` 在 `postbuild` 生成 `/feed.xml` 和每个标签的 feed，链接均带默认语言前缀。

---

## 三、上线后需要人工做的事

代码层面已经完成，以下需要在外部平台操作：

- [ ] **Google Search Console** 验证站点所有权，提交 `https://cassianflorin.com/sitemap.xml`
- [ ] **Bing Webmaster Tools** 同上
- [ ] 验证方式若用 meta 标签，加到 `app/layout.tsx` 的 `metadata.verification`
- [ ] 用 [Rich Results Test](https://search.google.com/test/rich-results) 抽查文章页结构化数据
- [ ] 定期看 Search Console 的「网页索引编制」报告，确认没有大量「已抓取但未编入索引」

### 可选优化

- 给文章配 1200x630 封面图（目前全部回退到站点默认卡片）
- `middleware.ts` 的 `localeDetection: true` 会按浏览器语言重定向 `/`；如果希望搜索引擎稳定落到中文版，可以考虑关掉它

---

**最后更新**: 2026-07-29
