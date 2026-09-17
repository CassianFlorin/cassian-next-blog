import type { CaseStudyEntry } from './types';

const litho: CaseStudyEntry = {
  projectId: 'litho',
  links: [
    {
      kind: 'site',
      href: 'https://litho.cassianflorin.com/',
      label: { zh: '产品主页', en: 'Product site' },
    },
    {
      kind: 'download',
      href: 'https://testflight.apple.com/join/PZc9vmmZ',
      label: { zh: 'iOS TestFlight 公测', en: 'iOS TestFlight beta' },
    },
    {
      kind: 'download',
      href: 'https://litho.cassianflorin.com/litho.apk',
      label: { zh: 'Android APK', en: 'Android APK' },
    },
  ],
  content: {
    en: {
      summary:
        'A native linux.do client for iOS and Android that gets past Cloudflare by letting a browser make every request.',
      why: [
        'linux.do is a community I read every day, and it deserved a native, logged-in experience on the phone.',
        'Discourse already has a solid API. The obstacle was never the data — it was getting a request through at all.',
      ],
      problem: [
        'linux.do sits behind Cloudflare. A plain URLSession or curl request gets a 403 challenge page.',
        'Third-party tools and even simple scripts keep hitting challenges and losing their session.',
        'Wrapping the site in a web view passes the challenge, but gives up native reading, interaction and notifications.',
      ],
      system: {
        intro:
          "Litho doesn't send requests itself. Every call goes through one off-screen browser gateway.",
        layers: [
          {
            title: 'Native app',
            body: 'SwiftUI on iOS, Kotlin + Compose on Android: topic feeds, reading, reactions, chat, private messages and notifications.',
          },
          {
            title: 'Single entry point',
            body: 'TopicList, Reply, Reaction and every other feature call one gateway API instead of the network.',
          },
          {
            title: 'WebView gateway',
            body: "An off-screen WKWebView runs each request through the page's own `fetch()`, carrying the real browser's UA, cookies and TLS fingerprint.",
          },
          {
            title: 'Discourse',
            body: 'The REST API returns real JSON; MessageBus long polling carries real-time updates.',
          },
        ],
      },
      implementation: [
        {
          title: 'Images through the gateway',
          body: 'Avatars, post images and badges are fetched as binary inside the page, handed back as base64 and cached by a native loader.',
        },
        {
          title: 'Self-healing challenges',
          body: 'When a challenge does appear, the gateway reloads the page to complete it and resumes the request, with a status banner instead of an app restart.',
        },
        {
          title: 'Real-time channel',
          body: 'MessageBus subscriptions run through the gateway and drive chat, new replies and notifications.',
        },
        {
          title: 'Rendering and storage',
          body: 'Posts render as a single WKWebView document; GRDB keeps the local cache; UserNotifications and background refresh deliver notifications.',
        },
        {
          title: 'Android port',
          body: 'Kotlin + Compose, ported one-to-one from the iOS architecture.',
        },
      ],
      decisions: [
        {
          title: 'Borrow the browser instead of fighting it',
          body: 'Rather than imitating fingerprints or solving challenges, requests are handed to a real browser context. To Cloudflare, it simply is a browser.',
        },
        {
          title: 'One gateway for all networking',
          body: 'Features never talk to the network directly, so challenges, images and real-time updates are solved once, in one place.',
        },
        {
          title: 'Do three things well',
          body: 'Get through Cloudflare, feel native, and match the web interactions — not an all-purpose forum client.',
        },
      ],
      result: {
        facts: [
          { label: 'Status', value: 'Daily driver' },
          { label: 'iOS', value: 'TestFlight beta · iOS 17+' },
          { label: 'Android', value: 'APK released' },
        ],
        notes: [
          'It grew from an MVP into the client I use every day: reading, reactions, chat, private messages and real-time notifications.',
        ],
      },
    },
    zh: {
      summary:
        'linux.do 的原生 iOS / Android 客户端，让浏览器替它发出每一个请求，从而穿过 Cloudflare。',
      why: [
        'linux.do 是我每天都在看的社区，它值得在手机上拥有原生、保持登录的体验。',
        'Discourse 本身有完善的 API。难点从来不是数据，而是请求根本发不出去。',
      ],
      problem: [
        'linux.do 部署在 Cloudflare 之后，普通的 URLSession 或 curl 请求会直接吃 403 人机验证页。',
        '第三方工具甚至简单脚本都会反复撞盾、丢失会话。',
        '用 WebView 套壳能过验证，却放弃了原生的阅读、互动和通知。',
      ],
      system: {
        intro: 'Litho 不自己发请求。所有调用都经过一个离屏的浏览器网关。',
        layers: [
          {
            title: '原生 App',
            body: 'iOS 用 SwiftUI，Android 用 Kotlin + Compose：话题流、阅读、表情回应、聊天、私信与通知。',
          },
          {
            title: '统一入口',
            body: 'TopicList、Reply、Reaction 等所有业务只调用一个网关 API，不直接碰网络。',
          },
          {
            title: 'WebView 网关',
            body: '离屏 WKWebView 用页面自身的 `fetch()` 发出请求，带着真实浏览器的 UA、Cookie 和 TLS 指纹。',
          },
          {
            title: 'Discourse',
            body: 'REST API 返回真实 JSON，MessageBus 长轮询承载实时更新。',
          },
        ],
      },
      implementation: [
        {
          title: '图片也过盾',
          body: '头像、帖内图、徽章图在页面里以二进制 fetch，base64 回传给原生，再交给带缓存的加载器。',
        },
        {
          title: '挑战自愈',
          body: '偶发撞盾时，网关自动重载页面完成挑战并恢复请求，顶部状态横幅提示，无需重启 App。',
        },
        {
          title: '实时通道',
          body: '通过网关订阅 Discourse MessageBus，驱动聊天、新回复与通知的实时推送。',
        },
        {
          title: '渲染与存储',
          body: '帖子用单个 WKWebView 文档渲染；GRDB 负责本地缓存；UserNotifications 加后台刷新负责通知。',
        },
        {
          title: 'Android 端',
          body: 'Kotlin + Compose，按 iOS 架构 1:1 移植。',
        },
      ],
      decisions: [
        {
          title: '借用浏览器，而不是对抗它',
          body: '不去模仿指纹、不去破解挑战，而是把请求交还给真实的浏览器上下文。对 Cloudflare 来说，这就是一个浏览器。',
        },
        {
          title: '一层网关承载所有网络',
          body: '业务从不直接访问网络，过盾、图片和实时更新都只需要在一个地方解决一次。',
        },
        {
          title: '只把三件事做到位',
          body: '打穿 Cloudflare、原生体验、对齐网页端交互。不做全能论坛客户端。',
        },
      ],
      result: {
        facts: [
          { label: '状态', value: '日常主力' },
          { label: 'iOS', value: 'TestFlight 公测 · iOS 17+' },
          { label: 'Android', value: 'APK 已发布' },
        ],
        notes: [
          '它已经从 MVP 长成我每天在用的客户端：阅读、表情回应、聊天、私信和实时通知。',
        ],
      },
    },
  },
};

export default litho;
