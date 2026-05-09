# 博客排版优化：减少桌面端留白

**日期**: 2026-05-09  
**状态**: 待执行

## 问题

桌面浏览器中博客内容区域偏窄，两侧留白过多。主要原因：

- SectionContainer 最大宽度 768px，大屏上内容占比低
- PostLayout 存在双层 SectionContainer 嵌套，宽度被重复约束
- Header/Footer 垂直间距偏大

## 改动

### 1. SectionContainer 宽度调整

**文件**: `components/SectionContainer.tsx`

```
- mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0
+ mx-auto max-w-4xl px-4 sm:px-6 xl:max-w-6xl xl:px-0
```

max-w-3xl (768px) → max-w-4xl (896px)，桌面端扩宽 17%  
xl:max-w-5xl (1024px) → xl:max-w-6xl (1152px)，大屏扩宽 12%

### 2. PostLayout 去除双层容器

**文件**: `layouts/PostLayout.tsx`

`LocaleLayout` 已包裹 `SectionContainer`，PostLayout 内部不应再包裹一层。将第 68 行的 `<SectionContainer>` 和第 264 行的 `</SectionContainer>` 替换为 `<div>` 和 `</div>`（保留 ScrollTopAndComment 的定位容器）。

### 3. 垂直间距收紧

| 文件                     | 位置             | 修改                       |
| ------------------------ | ---------------- | -------------------------- |
| `components/Header.tsx`  | header 样式      | `py-8` → `py-6`            |
| `components/Footer.tsx`  | footer className | `mt-20` → `mt-12`          |
| `layouts/PostLayout.tsx` | header className | `pt-8` → `pt-6`            |
| `layouts/PostLayout.tsx` | 正文 prose 容器  | `pt-10 pb-8` → `pt-8 pb-6` |

### 不改动

- 首页卡片网格（gap/间距合理）
- prose 排版样式
- 移动端布局
- PostSimple 和 PostBanner 布局

## 影响范围

- 5 个文件
- 仅影响 CSS class，不改逻辑
- 移动端行为不变（px-4/sm:px-6 保留）
