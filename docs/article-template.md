# 新文章模板

使用此模板创建 SEO 优化的博客文章。

## Frontmatter 配置

```yaml
---
title: '文章标题 | 主关键词'
date: '2025-01-21 10:00:00'
tags: ['Java', 'Backend', '相关标签']
draft: false
summary: '150-160字符的描述，包含主关键词，清晰说明文章价值，吸引读者点击。'
images: ['/static/images/your-image.jpg'] # 可选，社交分享图片
canonicalUrl: '' # 可选，如果文章首发在其他平台
---
```

## 文章结构模板

````markdown
# 文章标题（H1，与 frontmatter title 一致）

## Why this matters

一句话说明：这个主题为什么值得读者关注

## What you will learn

- 你将学到什么（要点1）
- 适合什么读者（要点2）
- 解决什么问题（要点3）

---

## 核心内容部分（H2）

### 子主题1（H3）

内容...

### 子主题2（H3）

内容...

## 实践示例（H2）

### 示例1（H3）

```java
// 代码示例
public class Example {
    // 实现细节
}
```
````

### 示例2（H3）

内容...

## 最佳实践（H2）

- 实践建议1
- 实践建议2
- 实践建议3

## 常见问题（H2，可选）

### 问题1

解答...

### 问题2

解答...

## 相关资源（H2，可选）

- [相关文章1](/blog/related-article-1)
- [相关文章2](/blog/related-article-2)
- [外部资源](https://example.com)

## 总结（H2）

- 要点回顾1
- 要点回顾2
- 要点回顾3

---

> **提示**: 根据实际情况调整文章结构，保持内容的自然流畅。

````

## SEO 检查清单

创建文章后，请检查：

### 必须项 ✅

- [ ] 标题包含主关键词，长度 50-60 字符
- [ ] Summary 长度 150-160 字符，包含关键词
- [ ] 只有一个 H1 标题
- [ ] H2/H3 层级清晰，包含次关键词
- [ ] 所有图片都有 alt 属性
- [ ] 代码块有语言标识
- [ ] 文件名使用英文和连字符（如：`java-validator-guide.mdx`）

### 推荐项 ⭐

- [ ] 添加 "Why this matters" 和 "What you will learn" 部分
- [ ] 包含实际代码示例
- [ ] 链接到 1-3 篇相关文章
- [ ] 文章末尾有总结部分
- [ ] 使用 Callout 组件突出重要信息

## 关键词使用指南

### 主关键词

- 出现在标题（H1）中
- 出现在 summary 中
- 出现在第一段中
- 自然出现在文中 2-3 次

### 次关键词

- 出现在 H2 标题中
- 出现在正文中
- 不要过度堆砌

### 长尾关键词

- 使用在 H3 标题中
- 用于回答具体问题
- 提高文章的搜索覆盖面

## 图片优化建议

### 图片命名

❌ 不好的命名：
- `image.png`
- `screenshot1.png`
- `pic-001.jpg`

✅ 好的命名：
- `java-validator-flow-diagram.png`
- `spring-boot-architecture.jpg`
- `git-hooks-configuration-example.png`

### Alt 文本

❌ 不好的 alt：
```html
<img src="image.png" alt="图片">
````

✅ 好的 alt：

```html
<img
  src="java-validator-flow.png"
  alt="Java ValidatorUtils validation flow diagram showing the complete validation process"
/>
```

## 内链策略

### 何时添加内链

- 提到相关技术概念时
- 引用之前的文章时
- 推荐相关阅读时

### 内链示例

```markdown
如果你还没有配置 SDKMAN，请参考 [SDKMAN 安装指南](/blog/install-sdkman)。

相关阅读：

- [Git Hooks 最佳实践](/blog/git-hooks-best-practices)
- [Java 开发环境配置](/blog/java-dev-environment)
```

### 内链规则

- 每篇文章 1-3 条内链
- 使用描述性锚文本
- 链接到真正相关的内容
- 不要过度链接

## 常用组件

### Callout（提示框）

```jsx
<Callout emoji="💡">这是一个重要提示，用于突出关键信息。</Callout>
```

### ErrorDisplay（错误展示）

```jsx
<ErrorDisplay
  title="错误标题"
  error="错误信息"
  code="1"
  path="错误路径"
  details={['详细说明1', '详细说明2']}
/>
```

---

**参考**: 完整的 SEO 指南请查看 [SEO-GUIDE.md](./SEO-GUIDE.md)
