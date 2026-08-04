// Google AdSense 配置
//
// 当前策略：自动广告(Auto ads)。
// 投放位置和数量由 Google 在后台决定，站点侧只需要注入 adsbygoogle.js，
// 不需要在页面里手写 <ins> 广告位，也不需要任何广告位 ID。
//
// 后台开关：AdSense → 广告 → 按网站 → cassianflorin.com → 编辑 → 打开「自动广告」。
// 站点验证：<meta name="google-adsense-account"> 由 app/layout.tsx 输出。
export const adsenseConfig = {
  // AdSense 发布商 ID，需与 public/ads.txt 中的 pub 号一致
  clientId: 'ca-pub-5441938758887409',

  // 总开关。关掉后脚本和验证 meta 都不会输出
  enabled: true,
};

/**
 * 是否真正向浏览器注入 AdSense 脚本。
 *
 * 只在生产部署里注入，原因是 AdSense 会把开发/预览环境的展示计入无效流量，
 * 严重时会导致账号被限制或封禁：
 *   - 本地 next dev            → 不注入
 *   - Vercel Preview 部署       → 不注入(域名也不在 AdSense 站点列表里)
 *   - Vercel Production 部署    → 注入
 *
 * 只在服务端调用(app/layout.tsx 是 Server Component)。VERCEL_ENV 没有
 * NEXT_PUBLIC_ 前缀，不会被打进客户端 bundle。
 */
export function shouldLoadAdsenseScript(): boolean {
  if (!adsenseConfig.enabled) return false;

  // Vercel 会自动注入 VERCEL_ENV；若该变量缺失则回退到 NODE_ENV 判断
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === 'production';
  }

  return process.env.NODE_ENV === 'production';
}

export default adsenseConfig;
