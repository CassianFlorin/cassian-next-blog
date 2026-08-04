# Google AdSense 集成说明

## 概述

本站使用 **自动广告(Auto ads)**：站点侧只负责注入 `adsbygoogle.js` 并让 CSP 放行
Google 的广告域名，具体投放位置、数量、格式全部由 AdSense 后台决定。

页面里**不需要**手写 `<ins class="adsbygoogle">` 广告位，也**不需要**任何广告位
(ad slot) ID。

## 文件结构

```
├── data/adsenseConfig.ts   # 发布商 ID、总开关、环境判断
├── app/layout.tsx          # 输出验证 meta + 注入广告脚本
├── next.config.js          # CSP 放行 Google 广告域名
└── public/ads.txt          # 发布商授权声明
```

## 配置说明

### 发布商 ID

`data/adsenseConfig.ts` 中的 `clientId` 必须与 `public/ads.txt` 里的 pub 号一致：

```typescript
clientId: 'ca-pub-5441938758887409';
```

```
google.com, pub-5441938758887409, DIRECT, f08c47fec0942fa0
```

改 ID 时**两个文件都要改**，否则 AdSense 会报 "ads.txt 文件中缺少卖方信息"
并限制收益。

### 总开关

`adsenseConfig.enabled` 关掉后，验证 meta 和广告脚本都不会输出。

### 环境控制

脚本只在**生产部署**注入，由 `shouldLoadAdsenseScript()` 判断：

| 环境                   | 是否注入 |
| ---------------------- | -------- |
| 本地 `next dev`        | 否       |
| Vercel Preview 部署    | 否       |
| Vercel Production 部署 | 是       |

这不是洁癖。AdSense 会把开发和预览环境产生的展示计为**无效流量**，自己反复刷新
本地页面足以触发风控，严重时账号被限制甚至封禁。预览域名(`*.vercel.app`)也不在
AdSense 的站点列表里，投了也没有收益。

判断依赖 Vercel 自动注入的 `VERCEL_ENV`；若该变量缺失则回退到 `NODE_ENV`。因为
它没有 `NEXT_PUBLIC_` 前缀，只能在 Server Component 里读——`app/layout.tsx` 正是
Server Component。

## CSP

这是最容易踩的坑。`adsbygoogle.js` 只是入口脚本，它会继续从
`googleadservices` / `doubleclick` / `adtrafficquality` 拉取代码，而**广告本身渲染在
`doubleclick.net` 和 `googlesyndication.com` 的 iframe 里**。

因此 `script-src` 和 `frame-src` 必须同时放行(见 `next.config.js` 的
`googleAdsHosts`)。只放行 `pagead2.googlesyndication.com` 的话，脚本能加载、控制台
也可能没有明显报错，但**广告位会一直空白**——iframe 被 CSP 拦掉了。

使用通配子域是必要的：AdSense 的 safeframe 主机名是轮换的
(如 `xxxx.safeframe.googlesyndication.com`)，无法穷举。

## 后台操作

1. **开启自动广告**：AdSense → 广告 → 按网站 → 选择站点 → 编辑 → 打开「自动广告」，
   可在同一界面调整广告density 和是否允许页内嵌入式广告。
2. **站点验证**：`<meta name="google-adsense-account">` 已由 `app/layout.tsx` 输出，
   无需手动贴代码。

## 注意事项

- **审核未通过前不会有任何广告填充**，页面空白是正常的，不代表接入有问题。
- 审核期间保持页面干净：不要放空的占位广告位，也不要出现"请关闭广告拦截器"之类
  的提示文案，这些都会影响审核。
- 自动广告可能造成布局偏移(CLS)。上线后建议用 PageSpeed Insights 复查 Core Web
  Vitals，必要时在后台调低广告密度。

## 排查

线上检查接入是否正常：

```bash
curl -s https://www.cassianflorin.com/ | grep -o 'adsbygoogle.js[^"]*'
curl -sI https://www.cassianflorin.com/ | grep -i content-security-policy
curl -s https://www.cassianflorin.com/ads.txt
```

浏览器控制台若出现 `Refused to frame ...` 或 `Refused to load the script ...`，
说明 CSP 少了域名，补进 `next.config.js` 的 `googleAdsHosts`。

## 如果将来要改用手动广告单元

自动广告之外还想固定某个位置时：在 AdSense 后台创建「展示广告」单元拿到 slot ID，
然后写一个客户端组件，在 `useEffect` 里 `(window.adsbygoogle = window.adsbygoogle || []).push({})`。

两个关键点：

- push 必须在**脚本真正就绪之后**执行。脚本是 `async` 的，挂载时同步读
  `window.adsbygoogle` 大概率还是 `undefined`，需要用轮询或 `script.onload` 兜底，
  否则广告请求永远不会发出。
- 同一个 `<ins>` 只能 push 一次。React StrictMode 下 effect 会跑两次，重复 push 会报
  "All ins elements in the DOM with class=adsbygoogle already have ads in them"，
  需要用 ref 去重。
