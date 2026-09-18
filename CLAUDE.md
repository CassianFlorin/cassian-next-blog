# cassianflorin.com — 开发规范（V2 · Personal Systems / Digital Atelier）

给在这个仓库里干活的 Agent 看。改任何页面、组件或文章之前先读完，
尤其是「正文组件」和「验证清单」两节：V2 重构后最容易漏掉的就是文章正文里的东西。

## 1. 站点定位与设计理念

> A personal system for building things, thinking clearly, and leaving traces.

风格四个词：**Editorial × Technical × Atmospheric × Spatial**。
它是一个人的工作台和档案，不是 SaaS 落地页。判断一个改动对不对，问一句：
「这像杂志内页 + 工程笔记，还是像产品官网？」后者就是错的。

明确禁止（无论谁要求，先指出再做）：

- 渐变、玻璃拟态（glassmorphism）、霓虹/赛博风、粒子、WebGL。
- 第二种强调色。红/绿/黄/蓝语义色也不例外，状态用形状和文字表达。
- 圆角药丸（`rounded-full`）、大圆角卡片、阴影卡片。V2 是直角 + 细线 + 面。
- 弹性/回弹动效（bounce / elastic / spring），以及任何不必要的动画。
- 新的 UI 依赖。现有栈（Tailwind v4、anime.js、react-force-graph）足够。

## 2. 设计令牌（唯一来源：`css/tailwind.css`）

| 类别     | 令牌                                                                           | 说明                                                           |
| -------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------- | ------------------------------------------ |
| 强调色   | `primary-50…950`                                                               | 矿物绿，色相 160，低饱和。**全站唯一强调色**                   |
| 中性色   | `gray-50…950`                                                                  | 暖石灰，色相 85。`gray-500` 是允许用作正文的最浅一档（≥4.5:1） |
| 面       | `night` / `paper` / `paper-dark`                                               | 页面底 / 纸面（`.surface-paper` 自动切明暗）                   |
| 字体     | `font-sans` Geist · `font-serif` Instrument Serif · `font-mono` JetBrains Mono | 衬线只用于 editorial 语气的短句                                |
| 字号工具 | `type-hero` `type-section` `type-editorial` `type-meta`                        | 不要自己拼 `text-5xl font-bold`                                |
| 版式     | `container-atelier` `bleed`                                                    | 全站统一内容宽度；通栏用 `bleed`，不要 `-mx-…`                 |
| 动效     | `--motion-fast/normal/slow/ambient` + `--ease-atelier`                         | 只有 ease-out 一种曲线                                         |
| 揭示     | `data-reveal="rise                                                             | drift                                                          | graph"` | 滚动进入的唯一写法，见 `components/motion` |
| 按钮     | `.btn .btn-primary .btn-ghost`                                                 | 直角，无渐变                                                   |

规则：

- 颜色只写令牌类名（`text-primary-700`、`bg-gray-200/70`），不写十六进制、不写 Tailwind 默认的 `yellow-*` `green-*` `blue-*` `red-*`。
- 暗色用 `dark:` 变体或 `.dark …` 选择器。**布局里 prose 用的是 `dark:prose-invert`，不存在裸的 `prose-invert` 类**，CSS 里覆盖暗色 prose 要写 `.dark .prose`（见 `css/tailwind.css` 中的注释，这是踩过的坑）。
- 文字最浅到 `gray-500`（浅色）/ `gray-400`（暗色，`gray-500` 在 paper-dark 上只有 3.4:1），再浅的只能做装饰线，不能承载信息。
- `prefers-reduced-motion` 必须有降级：CSS 动画走 `@media` 关掉，JS 动画查 `matchMedia`。

## 3. 站点结构与命名

- 品牌：`CASSIAN FLORIN` 与 `CF` 字标；章节编号 `CF / 01`…`CF / 04`（作品 / 知识 / 写作 / 关于）。
- 导航文案叫「写作 / Writing」，URL 仍是 `/blog`，**不要改路由**。所有现有 URL 必须保留，
  改路径只能用 308 重定向（参考 `app/[locale]/blog/page/[page]`）。
- 路由：`app/[locale]/…`；`zh` 是默认语言，`<html lang>` 由 `getLocale()` 决定。
- 文案在 `messages/{zh,en}.json`，两边必须同步；tag 的显示名由 `scripts/update-tags.mjs` 写入 `tags` 命名空间，按 slug 查（`t.has(slug)`）。
- 内容关系模型只有一个：`lib/knowledgeNodes.ts`。文章 tag → 领域（territory），
  项目案例在 `data/caseStudies/*`。`GENERIC_TAGS`（AI、Agent、Tips 之类）不参与相关性计算。

## 4. 文章与正文组件（最容易漏的地方）

文章页外壳（`layouts/PostLayout.tsx`）已经是 V2，但正文里的东西由 MDX 组件渲染，
**它们不会自动继承外壳的风格**。规则：

- 可用组件见 `components/MDXComponents.tsx`：`Callout` `StepProgress` `EnvironmentComparison` `ErrorDisplay` `Image` `TableWrapper`。
  `Tldr` 由布局渲染，不在正文里手写。
- **写新正文组件或改现有的，以 `components/Tldr.tsx` 和 `components/Callout.tsx` 为样板**：
  `not-prose` + 左侧 2px 强调色竖线 / 顶部细线 + `surface-paper` 面 + 直角；
  状态区分靠形状（实心 / 描边 / 编号 / ✓ ✕ 图标），不靠红绿。
- 组件内的 `<code>` 要显式给颜色（`text-gray-800 dark:text-gray-200`），因为 `.prose` 对行内代码有自己的着色规则会盖过继承。
- 每个组件都要在明暗两套下看过。本地切换：给 `<html>` 加/去 `dark` 类即可。
- 新文章按 `docs/article-template.md`；frontmatter 必填 `title` `date` `tags` `summary` `tldr`；
  `tags` 优先复用已有的（`app/tag-data.json`），新 tag 要能归到某个领域，否则它在知识图谱里是孤点。
- 文章里不要内嵌样式、不要 `<div style>`、不要自定义颜色。
- **内容需要现有组件表达不了的形式时，就为它设计一个新组件**，而不是退回到原生 HTML 或硬凑表格。
  流程、设计 DNA、可选形式、起步模板都在 skill `atelier-component`（`.claude/skills/atelier-component/`），
  从判断要不要做，到登记、验证、写文档，按它走完。站点不预制组件库，组件是随文章长出来的。

## 5. 首页与各章节的语法

- 01 Hero：先名字，再三行 「Building things. / Mapping ideas. / Leaving traces.」，再 Explore ↓；肖像是氛围，不是视觉中心（`hero-mask` 渐隐）。头部叠在 Hero 上（`components/Header.tsx` 的 `overlay`）。
- 02 Work → `/projects`，案例页顺序固定：WHY → PROBLEM → SYSTEM → IMPLEMENTATION → DECISIONS → RESULT → RELATED。
- 03 Knowledge：图谱是核心交互，Explore / Focus 两种模式；布局算法在 `lib/knowledgeOverview.ts` 与 `lib/knowledgeLocalGraph.ts`，改之前先跑对应测试。
- 04 Writing：归档时间线，按年分组，日期在左。
- 移动端：`CF … MENU` 全屏覆盖层；图谱容器必须 `overflow-hidden min-w-0`，否则 canvas 会把页面撑出横向滚动。

## 6. 验证清单（改完必须跑，报告里写明结果）

```bash
yarn tsc --noEmit -p .
yarn eslint app components lib layouts
yarn prettier --check <改过的文件>
for t in tests/*.mjs; do node "$t"; done
```

- 样式或组件改动：用浏览器截图明暗两套，移动端用设备模拟（375 宽）。
- 改了内容关系 / 图谱：跑 `tests/knowledge*.test.mjs` 和 `tests/writingRelations.test.mjs`。
- 改了路由、SEO、OG：`npx next build` 必须通过，再 `curl -sI` 核对状态码和 `<html lang>`。
- 性能目标 LCP < 2.5s、CLS < 0.1、INP < 200ms，用 pagespeed.web.dev 测线上。
- 提交信息用中文、Conventional Commits 前缀（`feat(scope):` `fix(scope):`）。

## 7. 已知的坑

- 根域到 www 的跳转在 Vercel 平台配置里，仓库里改不了。
- `/` 不做预渲染（root layout 用了 `getLocale()`），这是有意的。
- 浏览器面板隐藏时不合成帧，`ResizeObserver`、IntersectionObserver 看起来「不触发」，不是 bug。
- 刚 `navigate` 后的第一张截图常常是空白，等 2 秒再截一次。
- 面板隐藏时截图直接超时；此时用 headless Chrome 出整页图再裁切，命令在 skill `atelier-component` 第 6 节。
  注意 `--blink-settings=preferredColorScheme=1` 是浅色、`=0` 是暗色。
- Google PageSpeed API 有配额，跑不了就用网页版。
