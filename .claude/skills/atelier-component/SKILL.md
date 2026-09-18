---
name: atelier-component
description: 为博客文章按需设计一个贴合站点 V2 主题（Personal Systems / Digital Atelier）的新 MDX 正文组件。当写作或修改文章时发现现有组件（Callout / StepProgress / EnvironmentComparison / ErrorDisplay）表达不了内容，需要新的视觉形式时使用；也用于把旧组件改到 V2 风格。
---

# Atelier Component — 为文章按需设计正文组件

站点不预制组件库。每篇文章需要什么视觉形式，就在写文章的时候设计一个，
设计要像是这个站点原本就有的。本 skill 是从「要不要做」到「登记、验证、写文档」的完整流程。

先读根目录 `CLAUDE.md` 第 1、2、4 节，那是硬约束；这里只讲怎么做。

## 1. 先判断要不要新组件

按顺序问：

1. **Markdown 本身能不能表达？** 标题、列表、表格、代码块、引用已经是 V2 样式（`.prose` 规则在 `css/tailwind.css`）。能用就不做组件。
2. **现有组件能不能覆盖？** 看 `components/MDXComponents.tsx` 登记的列表。语义相近就复用，哪怕 emoji 或文案要换。
3. **这个形式会不会第二次用到？** 只为一篇文章的一次性排版做组件不值；但「决策记录」「前后对比」「时间线」这类会反复出现的形式值得做。
4. 三条都过，才新建。新建时给它一个**内容语义**的名字（`DecisionRecord`、`Timeline`、`SpecSheet`），不要视觉名字（`GreenBox`、`Card2`）。

## 2. 这个站点的组件长什么样（设计 DNA）

所有正文组件共享同一套骨架，认出来的方式是这几点：

- **一条线，一个面。** 左侧 2px 强调色竖线（`border-l-2 border-primary-600 dark:border-primary-400`）
  或顶部 2px 线，压在 `surface-paper` 面上。不要四边框 + 圆角 + 阴影的「卡片」。
- **小标签用 `type-meta`。** 组件的名称、字段名、状态词都是等宽小号大写/字距拉开的 meta 文字，
  颜色 `text-gray-500 dark:text-gray-500`，强调时 `text-primary-700 dark:text-primary-300`。
- **数字、编号、路径用等宽。** `font-mono tabular-nums`，编号补零（`01`、`02`）。
- **状态靠形状，不靠颜色。** 实心 / 描边 / 空心，✓ / ✕，编号 / 图标。红绿黄蓝一律不用。
  「错误」「警告」「推荐」这些语义用文字标签说出来。
- **直角。** 任何 `rounded-*` 都不要，包括 `rounded-full`。
- **留白按 4 的倍数。** 组件外边距 `my-6`，内边距 `px-4 py-3 sm:px-5 sm:py-4`。
- **动效为零。** 正文组件不做进入动画，不做 hover 位移。最多颜色 `transition-colors`。
- **`not-prose` 包住。** 否则 typography 插件会给内部的 p / ul / code 套上文章排版。
  代码用 `<code>` 时显式给色：`text-gray-800 dark:text-gray-200 bg-gray-200/70 dark:bg-gray-950/70`。

参照物：`components/Tldr.tsx`（最小骨架）、`components/Callout.tsx`（旁注）、
`components/StepProgress.tsx`（列表 + 状态）、`components/EnvironmentComparison.tsx`（网格对比）、
`components/ErrorDisplay.tsx`（多字段记录）。新组件应该和它们摆在一起看不出是后加的。

## 3. 可选的形式（挑一个最贴内容的，不要混）

| 内容是什么                 | 形式        | 骨架                                                        |
| -------------------------- | ----------- | ----------------------------------------------------------- |
| 一段需要抽出来的话         | 旁注 Aside  | 左竖线 + 面（Callout）                                      |
| 一组带顺序/状态的步骤      | 步骤列表    | 编号方块 + 标题 + 说明（StepProgress）                      |
| 两到三个东西并排比         | 对比网格    | `gap-px` 网格，每格顶线区分（EnvironmentComparison）        |
| 一条错误 / 日志 / 命令输出 | 记录 Record | meta 标签 + 等宽正文 + 键值行（ErrorDisplay）               |
| 按时间发生的事             | 时间线      | 左侧日期等宽、右侧事件，年份作分组标题（参考 `/blog` 归档） |
| 一次决策                   | 决策记录    | 背景 / 选项 / 选择 / 代价 四段，段名用 meta                 |
| 参数、配置、规格           | 规格表      | `<dl>` 键值，键 meta、值等宽，行间 1px 分隔                 |
| 改前改后                   | 前后对比    | 两列，左列 `text-gray-500`、右列正常，顶线区分              |
| 检查清单                   | 清单        | 方形勾选框（描边/实心），不是圆的                           |
| 一张图 + 说明              | 图注 Figure | `<figure>` + `<figcaption class="type-meta">`               |

## 4. 写组件

从 `template.tsx`（本目录）复制起步，按下面改：

- 文件放 `components/<Name>.tsx`，与现有组件同级。
- **Props 只描述内容，不描述样式。** 不接受 `color`、`variant`、`className` 之类；
  要变化就用语义字段（`status: 'done' | 'current' | 'pending'`）。
- 纯展示、无交互的组件不要加 `'use client'`。
- 文案硬编码中文可以接受（文章本身是中文），但如果组件出现在 EN 文章里会显示的标签，
  用 `useTranslations('blog')` 并在 `messages/zh.json` + `messages/en.json` 同时加键。
- 语义标签：`<aside>` `<ol>` `<dl>` `<figure>` `<section aria-label>`，装饰性图标加 `aria-hidden`。
- 图标只用 2 px 描边的极简线条（✓ ✕ → 之类），`strokeLinecap="square"`，不用实心彩色 emoji 图标。

## 5. 登记与文档（缺一不可）

1. `components/MDXComponents.tsx`：import 并加进 `components` 对象。
2. `docs/article-template.md` 的「常用组件」：加一段用法示例，写清楚每个 prop 是什么内容。
3. 如果组件会反复用，在 `CLAUDE.md` 第 4 节的可用组件列表里补上名字。

## 6. 验证

```bash
yarn tsc --noEmit -p .
yarn eslint components/<Name>.tsx
yarn prettier --write components/<Name>.tsx
```

然后起 dev（`.claude/launch.json` 里的 `dev`），打开使用它的文章：

- 浅色一张、暗色一张（给 `<html>` 加 / 去 `dark` 类），两张都放进报告。
- 375 宽的设备模拟看一遍，不能出现横向滚动。
- 用 JS 读一下组件里最浅那档文字的 `getComputedStyle().color`，确认没被 `.prose` 规则盖成别的颜色。
- 刚导航完的第一张截图常是空白，等 2 秒再截。
- 浏览器面板被隐藏时截图会超时，改用 headless Chrome 出整页长图再用 `sips` 裁切：

  ```bash
  CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  # preferredColorScheme=1 出浅色，=0 出暗色（和直觉相反，已实测）
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=900,11000 \
    --virtual-time-budget=15000 --blink-settings=preferredColorScheme=1 \
    --user-data-dir=/tmp/chrome-light --screenshot=light.png "http://localhost:3000/zh/blog/<slug>" &
  # 等文件出现后 kill 掉进程；然后 sips -c <高> 900 --cropOffset <y> 0 light.png --out crop.png
  ```

## 7. 一个完整例子：`ErrorDisplay` 从旧样式改到 V2

- 旧：红边红底圆角卡片 + 红色圆形 ✕ 图标 + 红字。
- 判断：内容是「一条错误记录」，形式选「记录 Record」。
- 改法：`surface-paper` 面 + 左竖线；顶部一行 `type-meta` 写 `ERROR` 和错误码；
  错误原文用等宽 `<pre>`；`PATH`、详情用 `<dl>` 键值行；去掉图标；红色全部换成
  强调色（标签）和暖灰（正文）。语义「这是错误」由 `ERROR` 标签和 `role="note"` + `aria-label` 承担。
- 登记不变，文档示例更新，明暗两套截图，提交。
