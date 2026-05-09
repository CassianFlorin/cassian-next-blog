# 博客排版优化——减少桌面端留白 执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 收紧博客桌面端排版，减少内容区两侧及垂直方向留白

**Architecture:** 纯 CSS class 调整，不改逻辑。涉及的 5 个文件均为现有组件，仅修改 Tailwind class 字符串。

**Tech Stack:** Next.js, Tailwind CSS v4, React/TypeScript

---

### Task 1: 加宽 SectionContainer 内容最大宽度

**Files:**

- Modify: `components/SectionContainer.tsx:9`

- [ ] **Step 1: 修改 SectionContainer 宽度 class**

将第 9 行：

```tsx
    <section className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
```

改为：

```tsx
    <section className="mx-auto max-w-4xl px-4 sm:px-6 xl:max-w-6xl xl:px-0">
```

- [ ] **Step 2: 验证** — 确认文件语法无误

Run: `npx tsc --noEmit --pretty components/SectionContainer.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/SectionContainer.tsx
git commit -m "style: 加宽 SectionContainer 最大宽度，减少桌面端两侧留白"
```

---

### Task 2: PostLayout 去除双层 SectionContainer

**Files:**

- Modify: `layouts/PostLayout.tsx:68,264`

- [ ] **Step 1: 将外层 SectionContainer 替换为 div**

将第 68 行：

```tsx
    <SectionContainer>
```

改为：

```tsx
    <div>
```

将第 264 行：

```tsx
    </SectionContainer>
```

改为：

```tsx
    </div>
```

- [ ] **Step 2: 验证** — 确认文件语法无误

Run: `npx tsc --noEmit --pretty layouts/PostLayout.tsx`

- [ ] **Step 3: Commit**

```bash
git add layouts/PostLayout.tsx
git commit -m "fix: 去除 PostLayout 双层 SectionContainer 嵌套"
```

---

### Task 3: 收紧 Header 和 Footer 垂直间距

**Files:**

- Modify: `components/Header.tsx:22`
- Modify: `components/Footer.tsx:10`

- [ ] **Step 1: 收紧 Header padding**

将 Header.tsx 第 22 行的 class 中 `py-8` 改为 `py-6`：

```tsx
'flex items-center w-full bg-[#FAFAF8] dark:bg-[#1a1a1a] justify-between gap-6 py-6';
```

注意：第 25 行 `sticky` 变体中的 `py-8` 不需要改（它是拼接的字符串，继承自 headerClass）。

- [ ] **Step 2: 收紧 Footer margin**

将 Footer.tsx 第 10 行 `mt-20` 改为 `mt-12`：

```tsx
    <footer className="mt-12 border-t border-gray-200/60 dark:border-gray-800/60">
```

- [ ] **Step 3: 验证** — 确认文件语法无误

Run: `npx tsc --noEmit --pretty components/Header.tsx components/Footer.tsx`

- [ ] **Step 4: Commit**

```bash
git add components/Header.tsx components/Footer.tsx
git commit -m "style: 收紧 Header 和 Footer 垂直间距"
```

---

### Task 4: 收紧 PostLayout 内部间距

**Files:**

- Modify: `layouts/PostLayout.tsx:72,147`

- [ ] **Step 1: 收紧 header 顶部间距**

将第 72 行 `pt-8` 改为 `pt-6`：

```tsx
          <header className="pt-6 xl:pb-8">
```

- [ ] **Step 2: 收紧正文区域间距**

将第 147 行 `pt-10 pb-8` 改为 `pt-8 pb-6`：

```tsx
className =
  'prose prose-gray dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-p:leading-relaxed max-w-none pt-8 pb-6';
```

- [ ] **Step 3: 验证** — 确认文件语法无误

Run: `npx tsc --noEmit --pretty layouts/PostLayout.tsx`

- [ ] **Step 4: Commit**

```bash
git add layouts/PostLayout.tsx
git commit -m "style: 收紧 PostLayout 内部垂直间距"
```

---

### Task 5: 最终验证

- [ ] **Step 1: 全量类型检查**

Run: `npx tsc --noEmit --pretty`
Expected: No errors.

- [ ] **Step 2: 启动 dev server 目视检查**

Run: `yarn dev`
在浏览器中打开首页和任意文章页，确认桌面端内容区宽度增加、垂直间距收紧、无布局错位。

---

## 改动汇总

| Task | 文件                              | 改动                                           |
| ---- | --------------------------------- | ---------------------------------------------- |
| 1    | `components/SectionContainer.tsx` | max-w-3xl→max-w-4xl, xl:max-w-5xl→xl:max-w-6xl |
| 2    | `layouts/PostLayout.tsx`          | SectionContainer→div                           |
| 3    | `components/Header.tsx`           | py-8→py-6                                      |
| 3    | `components/Footer.tsx`           | mt-20→mt-12                                    |
| 4    | `layouts/PostLayout.tsx`          | pt-8→pt-6, pt-10 pb-8→pt-8 pb-6                |
