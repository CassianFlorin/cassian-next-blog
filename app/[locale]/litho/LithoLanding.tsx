'use client';

import { useEffect, useRef } from 'react';
import './litho.css';

const APK_URL = 'https://litho.cassianflorin.com/litho.apk';

type IconName =
  | 'arrow-right'
  | 'shield-check'
  | 'apple'
  | 'android'
  | 'lock'
  | 'image'
  | 'refresh'
  | 'broadcast'
  | 'book'
  | 'heart'
  | 'user'
  | 'appstore';

// Inline SVGs (no external icon CDN). Stroke icons use currentColor.
function Icon({ name }: { name: IconName }) {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const common = {
    width: '1em',
    height: '1em',
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  switch (name) {
    case 'arrow-right':
      return (
        <svg {...common} {...stroke}>
          <line x1="4" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'shield-check':
      return (
        <svg {...common} {...stroke}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common} {...stroke}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common} {...stroke}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common} {...stroke}>
          <path d="M21 4v6h-6" />
          <path d="M3 20v-6h6" />
          <path d="M19 9a8 8 0 0 0-13.5-3L3 8" />
          <path d="M5 15a8 8 0 0 0 13.5 3L21 16" />
        </svg>
      );
    case 'broadcast':
      return (
        <svg {...common} {...stroke}>
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          <path d="M7.8 7.8a6 6 0 0 0 0 8.4" />
          <path d="M16.2 16.2a6 6 0 0 0 0-8.4" />
          <path d="M4.9 4.9a10 10 0 0 0 0 14.2" />
          <path d="M19.1 19.1a10 10 0 0 0 0-14.2" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common} {...stroke}>
          <path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z" />
          <path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common} {...stroke}>
          <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common} {...stroke}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="10" r="3" />
          <path d="M6.5 18.5a6 6 0 0 1 11 0" />
        </svg>
      );
    case 'android':
      return (
        <svg
          {...common}
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M6 18a1 1 0 0 0 1 1h1v3.5a1.5 1.5 0 0 0 3 0V19h2v3.5a1.5 1.5 0 0 0 3 0V19h1a1 1 0 0 0 1-1V8H6zM3.5 8A1.5 1.5 0 0 0 2 9.5v7a1.5 1.5 0 0 0 3 0v-7A1.5 1.5 0 0 0 3.5 8m17 0a1.5 1.5 0 0 0-1.5 1.5v7a1.5 1.5 0 0 0 3 0v-7A1.5 1.5 0 0 0 20.5 8m-4.97-5.84 1.3-1.3a.5.5 0 0 0-.7-.7l-1.48 1.47A6.9 6.9 0 0 0 12 1c-.96 0-1.86.23-2.65.63L7.87.15a.5.5 0 1 0-.7.7l1.3 1.31A6.97 6.97 0 0 0 6 7h12a6.97 6.97 0 0 0-2.47-4.84M9.5 5A.5.5 0 1 1 10 4.5.5.5 0 0 1 9.5 5m5 0a.5.5 0 1 1 .5-.5.5.5 0 0 1-.5.5"
          />
        </svg>
      );
    case 'apple':
      return (
        <svg
          {...common}
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"
          />
        </svg>
      );
    case 'appstore':
      return (
        <svg
          {...common}
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function LithoLanding() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="litho-landing" ref={rootRef} id="top">
      {/* ===================== HERO ===================== */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="reveal">
            <span className="eyebrow">原生 iOS · linux.do 第三方客户端</span>
            <h1>
              把 linux.do
              <br />
              稳稳<span className="ink">印</span>上 iOS。
            </h1>
            <p className="lede">
              以打穿 Cloudflare
              盾、保持登录态、丝滑原生体验为第一目标而生。一整份帖子流，一次成版。
            </p>
            <div className="hero-cta">
              <a href={APK_URL} className="btn btn-primary">
                <Icon name="android" /> 下载 Android 版 (APK)
              </a>
              <a href="#arch" className="btn btn-ghost">
                它怎么打穿盾 <Icon name="arrow-right" />
              </a>
              <a href="#features" className="btn btn-ghost">
                功能全览
              </a>
            </div>
            <div className="hero-meta">
              <span>
                <Icon name="android" /> Android 抢先体验
              </span>
              <span>
                <Icon name="apple" /> iOS 即将上架
              </span>
              <span>
                <Icon name="shield-check" /> 网关过盾 · 免挑战页
              </span>
              <span>
                <Icon name="lock" /> 数据只留本机
              </span>
            </div>
          </div>
          <div className="hero-art reveal d1">
            <span className="greek-ghost">λίθος</span>
            <div className="seal-stone">
              <span className="glyph">石</span>
            </div>
            <span className="seal-cap">lithos · 以石为版</span>
          </div>
        </div>
      </section>

      {/* ===================== PILLARS ===================== */}
      <section className="band">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">三条硬性优先级</span>
            <h2>不做全能，只把三件事做到位。</h2>
            <p className="lede">
              linux.do 社区用户最大的痛点，是第三方工具频繁撞上 Cloudflare
              的挑战页与惩罚。Litho 围绕这一点重排了优先级。
            </p>
          </div>
          <div className="pillars reveal d1">
            <div className="pillar lead">
              <div>
                <span className="big-i">
                  <Icon name="shield-check" />
                </span>
                <div className="idx">01 · 地基</div>
                <h3>打穿 Cloudflare</h3>
                <p>
                  所有网络请求都走「WebView 网关」，继承浏览器的 UA、Cookie 与
                  TLS 指纹，从根子上绕开挑战页。这是整个项目的地基。
                </p>
              </div>
              <a
                href="#arch"
                className="btn btn-ghost"
                style={{ alignSelf: 'flex-start', marginTop: 26 }}
              >
                看它怎么做到 <Icon name="arrow-right" />
              </a>
            </div>
            <div className="pillar-cols">
              <div className="pillar">
                <div className="idx">02 · 体感</div>
                <h3>原生 iOS 体验</h3>
                <p>
                  SwiftUI 外壳，帖子流用一整份 WebView
                  文档渲染，滚动交给系统，做到丝滑。
                </p>
              </div>
              <div className="pillar">
                <div className="idx">03 · 顺手</div>
                <h3>对齐网页端的交互</h3>
                <p>
                  点赞、收藏、举报、回复、表情回应、聊天、私信、实时通知，网页能做的，这里也顺手。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== ARCHITECTURE ===================== */}
      <section className="band" id="arch">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">核心架构 · Anti-CF 地基</span>
            <h2>不自己发请求，让浏览器替你发。</h2>
            <p className="lede">
              普通的 URLSession 或 curl 请求 linux.do 会直接吃 403。Litho
              的解法是把请求交回给页面自身的 fetch()。
            </p>
          </div>

          <div className="flow reveal d1">
            <div className="node">
              <span className="k">Swift 业务层</span>
              <span className="t">发起请求</span>
              <span className="d">
                TopicList / Reply / Reaction 等业务只调用一个入口。
              </span>
            </div>
            <div className="arrow">
              <Icon name="arrow-right" />
            </div>
            <div className="node gw">
              <span className="k">WebView 网关</span>
              <span className="t">离屏 1×1 WKWebView</span>
              <span className="d">在页面上下文里调用页面自己的 fetch()。</span>
            </div>
            <div className="arrow">
              <Icon name="arrow-right" />
            </div>
            <div className="node">
              <span className="k">继承浏览器身份</span>
              <span className="t">UA · Cookie · TLS 指纹</span>
              <span className="d">
                对 Cloudflare 而言，这就是一个真实浏览器。
              </span>
            </div>
          </div>

          <div className="verdicts reveal d1">
            <div className="verdict pass">
              <div className="code mono">通过网关 · fetch()</div>
              <div className="status mono">200 OK</div>
              <small>同一时刻，网关稳定拿到真实 Discourse JSON。</small>
            </div>
            <div className="verdict fail">
              <div className="code mono">裸 curl / URLSession</div>
              <div className="status mono">403</div>
              <small>cf-mitigated: challenge。同一网络下直接被拦。</small>
            </div>
          </div>

          <div className="arch-notes reveal d2">
            <div className="arch-note">
              <Icon name="image" />
              <h4>图片也过盾</h4>
              <p>
                头像、帖内图、徽章图在页面里 fetch 二进制、base64
                回传给原生，再交给带缓存的 AvatarLoader。
              </p>
            </div>
            <div className="arch-note">
              <Icon name="refresh" />
              <h4>挑战自愈</h4>
              <p>
                偶发撞盾时网关自动重载页面完成挑战并恢复请求，顶部状态横幅提示，无需重启
                App。
              </p>
            </div>
            <div className="arch-note">
              <Icon name="broadcast" />
              <h4>实时通道</h4>
              <p>
                通过网关订阅 Discourse MessageBus
                长轮询，驱动聊天、新回复与通知的实时推送。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== ETYMOLOGY ===================== */}
      <section className="band" id="origin">
        <div className="wrap origin-grid">
          <div className="origin-mark reveal">
            <div className="stack">
              <div className="cn">石</div>
              <div className="gk">λίθος</div>
              <div className="rom">lithos · lithography</div>
            </div>
          </div>
          <div className="reveal d1">
            <span className="eyebrow">名字的由来</span>
            <h2 style={{ margin: '14px 0 28px' }}>
              取自「石」，也取自「印」。
            </h2>
            <div className="origin-list">
              <div className="origin-item">
                <h3>印刷，是把文字发布出去</h3>
                <p>
                  linux.do 是一个以文字为核心的社区。整份帖子流被渲染成
                  <b>一整份文档</b>
                  、一次成版，正如平版印刷一次印出一整张版面，而不是一个字一个字地拼。
                </p>
              </div>
              <div className="origin-item">
                <h3>石，是地基与坚固</h3>
                <p>
                  整个 App 立在一块地基上：<b>WebView 网关</b>
                  。它像石版一样承载所有请求，原生、稳定，不被 Cloudflare
                  轻易撼动。
                </p>
              </div>
              <div className="origin-item">
                <h3>短而利落</h3>
                <p>
                  两个音节、一个干净的古典词根，好记、好读，也好做成
                  <b>一枚印章</b>。商店里它叫「Litho
                  拓本」，拓本正是从碑石拓下的墨本：白字，黑地。
                </p>
              </div>
            </div>
            <p className="origin-quote">
              以「石版」为底，把社区的文字<span className="ink">稳稳印</span>
              到原生 iOS 上。
            </p>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="band" id="features">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">功能一览</span>
            <h2>已经从 MVP 长成日常主力。</h2>
            <p className="lede">
              五个
              Tab：话题、类别、聊天、标签、我的。以下每一项都跑在真实账号上。
            </p>
          </div>

          <div className="bento reveal d1">
            <div className="cell c-read">
              <div className="head">
                <Icon name="book" />
                <h3>阅读体验</h3>
              </div>
              <ul>
                <li>最新 / 热门 / 未读</li>
                <li>分类 · 标签</li>
                <li>整份帖子流一份文档渲染</li>
                <li>图 · 头像 · 徽章过盾加载</li>
                <li>代码块一键复制</li>
                <li>spoiler 模糊显隐</li>
                <li>全屏图片查看</li>
                <li>双向分页 · 续读位置</li>
              </ul>
            </div>
            <div className="cell c-react">
              <div className="head">
                <Icon name="heart" />
                <h3>互动</h3>
              </div>
              <ul>
                <li>点赞</li>
                <li>表情回应</li>
                <li>Boost 打标签留言</li>
                <li>收藏 · 举报</li>
                <li>回复 · 引用</li>
                <li>投票</li>
                <li>编辑 / 删除自己的帖</li>
              </ul>
            </div>
            <div className="cell c-live">
              <div className="head">
                <Icon name="broadcast" />
                <h3>实时</h3>
              </div>
              <ul>
                <li>MessageBus 聊天</li>
                <li>新回复即时追加</li>
                <li>前台通知横幅</li>
                <li>后台系统通知直达楼层</li>
              </ul>
            </div>
            <div className="cell c-me">
              <div className="head">
                <Icon name="user" />
                <h3>个人中心</h3>
              </div>
              <ul>
                <li>统计卡片</li>
                <li>我的帖子</li>
                <li>浏览历史</li>
                <li>收藏</li>
                <li>私信收发</li>
                <li>草稿箱</li>
                <li>徽章</li>
                <li>积分排行榜</li>
                <li>信任等级</li>
                <li>关注 / 粉丝</li>
                <li>偏好 · 匿名</li>
                <li>空间管理</li>
              </ul>
            </div>
            <div className="cell c-privacy">
              <div style={{ minWidth: 220, flex: 1 }}>
                <div className="head">
                  <Icon name="lock" />
                  <h3>隐私与本地</h3>
                </div>
                <p
                  style={{
                    color: 'var(--paper-dim)',
                    fontSize: 15,
                    maxWidth: '52ch',
                  }}
                >
                  随附 App 级隐私清单，数据只留在本机。GRDB
                  缓存断网回退，头像加磁盘缓存层。
                </p>
              </div>
              <ul style={{ maxWidth: 360 }}>
                <li>PrivacyInfo.xcprivacy</li>
                <li>GRDB 本地缓存</li>
                <li>头像磁盘缓存</li>
                <li>浏览历史仅存本机</li>
              </ul>
            </div>
          </div>

          <p className="principle reveal d2">
            <b>一个约定：</b>互动图标一律用矢量图标（SF Symbols / 内联
            SVG，currentColor 驱动状态），从不在代码里写死 emoji 字符或表情包
            PNG。选中态只是一次 CSS class 切换，不重渲染 DOM。
          </p>
        </div>
      </section>

      {/* ===================== STACK ===================== */}
      <section className="band" id="stack">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">底层</span>
            <h2>一层网关，撑起所有网络。</h2>
          </div>
          <div className="stack-strip reveal d1">
            <span className="chip">
              <b>SwiftUI</b> 外壳
            </span>
            <span className="chip">
              <b>WKWebView</b> 单文档渲染
            </span>
            <span className="chip">
              <b>WebView 网关</b> 统一网络层
            </span>
            <span className="chip">
              <b>Discourse</b> REST API
            </span>
            <span className="chip">
              <b>MessageBus</b> 实时长轮询
            </span>
            <span className="chip">
              <b>GRDB</b> 本地缓存
            </span>
            <span className="chip">
              <b>UserNotifications</b> + BGAppRefresh
            </span>
            <span className="chip">
              <b>XcodeGen</b> 工程管理
            </span>
            <span className="chip">
              最低 <b>iOS 17</b>
            </span>
          </div>
        </div>
      </section>

      {/* ===================== CLOSING ===================== */}
      <section className="band" id="closing">
        <div className="wrap">
          <div className="reveal">
            <div className="closing-status">
              <Icon name="appstore" /> <b>Litho 拓本</b> · 即将上架 App Store
            </div>
            <p className="big">
              把社区的文字，<span className="ink">稳稳印</span>到你手上的屏幕。
            </p>
            <p className="note">
              iOS 17+ · 手机主屏显示「Litho」，商店名为「Litho 拓本」。
            </p>
          </div>
        </div>
      </section>

      {/* ===================== DISCLAIMER ===================== */}
      <footer className="litho-foot">
        <div className="wrap foot-grid">
          <div>
            <div className="foot-brand">
              <span className="seal-mini">石</span> Litho
            </div>
            <p className="disclaimer">
              Litho 是非官方第三方客户端，与 linux.do
              官方无从属关系，仅供个人学习与使用，请遵守社区规则。所有点赞、收藏、举报、回复等写操作，均由用户自行触发提交。
            </p>
          </div>
          <div className="foot-meta">
            <div>
              <span className="lbl">平台</span>
              {'　'}iOS 17+ · SwiftUI
            </div>
            <div>
              <span className="lbl">社区</span>
              {'　'}linux.do（Discourse）
            </div>
            <div>
              <span className="lbl">词根</span>
              {'　'}λίθος · lithos · 石
            </div>
            <div>
              <span className="lbl">状态</span>
              {'　'}日常主力使用中
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
