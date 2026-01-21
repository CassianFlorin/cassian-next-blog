# SEO 优化指南

本文档记录了 Cassian Florin Blog 的 SEO 优化实施情况和最佳实践。

## 📋 已完成的优化项目

### ✅ 一、全站级 SEO

#### 1. 站点基础信息优化

**位置**: `data/siteMetadata.js`

- ✅ **Site Title**: `Cassian Florin · Java Developer & Tech Blog`
- ✅ **Meta Description**: `Cassian Florin's personal tech blog, focusing on Java development, backend engineering, system design, and AI productivity tools.`
- ✅ **Author**: `Cassian Florin`
- ✅ **Keywords**: Java, Backend Development, System Design, Developer Productivity, AI Tools

**配置文件**: `app/layout.tsx`

- ✅ 添加了 `authors` 元数据
- ✅ 添加了 `keywords` 数组
- ✅ 配置了完整的 Open Graph 标签
- ✅ 配置了 Twitter Card

#### 2. Sitemap & Robots

**文件**: `app/sitemap.ts`, `app/robots.ts`

- ✅ 自动生成 `sitemap.xml`
- ✅ 包含所有公开页面（首页、博客、项目、标签、关于）
- ✅ 包含所有已发布的博客文章
- ✅ `robots.txt` 配置正确
- ✅ 允许搜索引擎抓取所有内容

### ✅ 二、文章级 SEO

#### 1. 文章结构要求

每篇文章必须包含以下元素（已在 `contentlayer.config.ts` 中配置）：

- ✅ **唯一 title**: 在 frontmatter 中定义
- ✅ **唯一 meta description**: 通过 `summary` 字段定义
- ✅ **单一 H1**: 文章标题自动生成
- ✅ **清晰的 H2/H3 层级**: 由作者在 MDX 中维护
- ✅ **URL 含关键词**: 通过文件名自动生成

#### 2. 结构化数据（Schema.org）

**位置**: `contentlayer.config.ts`

- ✅ 自动为每篇文章生成 BlogPosting Schema
- ✅ 包含标题、发布日期、修改日期、描述、图片、URL
- ✅ 包含作者信息（Person Schema）
- ✅ 在文章页面中通过 JSON-LD 格式输出

#### 3. 关键词策略

**核心关键词池**:

- Java
- Backend Development
- Java Validation
- System Design
- Developer Productivity
- AI Tools for Developers

**使用规则**:

- 主关键词：出现在标题和 H1 中
- 次关键词：自然分布在 H2 和正文中
- 每篇文章聚焦 1-2 个主关键词

### ✅ 三、内容结构优化

#### 1. About 页面优化

**位置**: `data/authors/default.mdx`

- ✅ 明确的职业定位：Java Backend Developer | Tech Blogger
- ✅ 包含核心关键词：Java, Backend Development, System Design, AI Productivity
- ✅ 清晰的个人介绍结构
- ✅ 技术栈和专业领域说明

#### 2. 图片 SEO

- ✅ 所有图片都有描述性的 `alt` 属性
- ✅ 图片文件名语义化（如 `image.png` → 建议改为更具描述性的名称）

### ✅ 四、技术 SEO

#### 1. Meta 标签配置

**全局配置** (`app/layout.tsx`):

```typescript
{
  title: 'Cassian Florin · Java Developer & Tech Blog',
  description: "Cassian Florin's personal tech blog...",
  authors: [{ name: 'Cassian Florin' }],
  keywords: ['Java', 'Backend Development', ...],
  openGraph: { ... },
  twitter: { ... }
}
```

**文章页配置** (`app/[locale]/blog/[...slug]/page.tsx`):

- ✅ 动态生成每篇文章的 metadata
- ✅ 包含 Open Graph 和 Twitter Card
- ✅ 包含发布时间和修改时间

#### 2. Canonical URL

- ✅ 全局配置了 canonical URL
- ✅ 支持文章级别的 `canonicalUrl` 字段

#### 3. RSS Feed

- ✅ 配置了 RSS feed (`/feed.xml`)
- ✅ 在 `<head>` 中声明了 RSS 链接

## 📝 内容创作 SEO 检查清单

创建新文章时，请确保：

### 必须项 ✅

- [ ] **标题**：包含主关键词，简洁明确（50-60 字符）
- [ ] **Summary**：150-160 字符，包含关键词，吸引点击
- [ ] **Tags**：3-5 个相关标签
- [ ] **H1**：只有一个，与标题一致
- [ ] **H2/H3**：层级清晰，包含次关键词
- [ ] **图片 alt**：所有图片都有描述性 alt 文本
- [ ] **内链**：链接到 1-3 篇相关文章（如适用）

### 推荐项 ⭐

- [ ] **开头结构**：Why this matters / What you will learn
- [ ] **代码示例**：清晰的代码块和注释
- [ ] **总结**：文章末尾的要点回顾
- [ ] **相关资源**：外部链接和参考资料

### Frontmatter 模板

```yaml
---
title: '文章标题（包含主关键词）'
date: '2025-01-21 10:00:00'
tags: ['Java', 'Backend', '其他标签']
draft: false
summary: '150-160字符的描述，包含关键词，吸引读者点击。'
images: ['/static/images/article-cover.jpg'] # 可选
canonicalUrl: 'https://cassianflorin.com/blog/article-slug' # 可选
---
```

## 🔍 SEO 监控和维护

### 定期检查项

1. **Google Search Console**

   - 检查索引状态
   - 监控搜索性能
   - 修复爬取错误

2. **页面性能**

   - Core Web Vitals 指标
   - 图片优化和懒加载
   - 资源压缩

3. **内容更新**
   - 更新过时的文章
   - 添加内链到新文章
   - 修复失效链接

### 工具推荐

- **Google Search Console**: 监控搜索表现
- **Google Analytics**: 分析流量来源
- **Lighthouse**: 性能和 SEO 审计
- **Screaming Frog**: 网站爬取和分析

## 📚 参考资源

### SEO 最佳实践

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)

### Next.js SEO

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Next.js Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)

## 🎯 未来优化方向

### 待实现功能

1. **性能优化**

   - [ ] 图片 WebP 格式转换
   - [ ] 实现图片懒加载
   - [ ] 代码分割优化

2. **内容增强**

   - [ ] 为技术文章添加 FAQ Schema
   - [ ] 添加面包屑导航
   - [ ] 实现相关文章推荐

3. **社交优化**

   - [ ] 优化 Open Graph 图片
   - [ ] 添加社交分享按钮
   - [ ] 实现文章阅读时间显示

4. **国际化**
   - [ ] 支持多语言 SEO
   - [ ] 配置 hreflang 标签

## 📞 联系方式

如有 SEO 相关问题或建议，请通过以下方式联系：

- Email: flowercard591@gmail.com
- GitHub: [@CassianFlorin](https://github.com/CassianFlorin)

---

**最后更新**: 2025-01-21
**维护者**: Cassian Florin
