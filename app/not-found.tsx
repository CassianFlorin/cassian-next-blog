import Link from '@/components/Link';

/**
 * 404. Rendered outside the locale segment's providers for unknown top-level
 * paths, so it avoids translations and keeps the copy bilingual and static.
 */
export default function NotFound() {
  return (
    <div className="bleed">
      <div className="container-atelier grid min-h-[60vh] content-center gap-10 py-16">
        <p className="type-meta text-gray-500 dark:text-gray-400">CF / 404</p>
        <h1 className="type-hero text-gray-950 dark:text-gray-50">
          <span className="block">Not</span>
          <span className="block">found.</span>
        </h1>
        <div className="max-w-xl space-y-3">
          <p className="type-editorial text-2xl text-gray-700 italic sm:text-3xl dark:text-gray-300">
            This trace leads nowhere.
          </p>
          <p lang="zh-CN" className="text-gray-600 dark:text-gray-400">
            这条路径不存在，可能已经移动或被删除。
          </p>
        </div>
        <nav aria-label="Recovery" className="flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">
            Home · 首页
          </Link>
          <Link href="/blog" className="btn btn-ghost">
            Writing · 写作
          </Link>
          <Link href="/knowledge" className="btn btn-ghost">
            Knowledge · 知识
          </Link>
        </nav>
      </div>
    </div>
  );
}
