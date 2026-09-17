import { getTranslations } from 'next-intl/server';
import Link from '@/components/Link';
import SectionHeading from '@/components/brand/SectionHeading';
import TraceList from '@/components/writing/TraceList';
import { knowledgeNodeHref } from '@/lib/knowledgeNodes';

export type WritingPost = {
  slug: string;
  path: string;
  date: string;
  title: string;
  tags: string[];
};

const RECENT_COUNT = 6;

const AREAS = [
  // Each area opens its knowledge territory, so writing and knowledge share
  // one set of relationships.
  { id: 'building', href: knowledgeNodeHref('ai-agent') },
  { id: 'thinking', href: knowledgeNodeHref('engineering') },
  { id: 'remembering', href: knowledgeNodeHref('knowledge-workflow') },
] as const;

const pad = (value: number) => String(value).padStart(2, '0');

export default async function WritingSection({
  posts,
}: {
  posts: WritingPost[];
}) {
  const t = await getTranslations('home.writing');

  return (
    <section
      id="writing"
      aria-labelledby="writing-title"
      className="bleed surface-paper"
    >
      <div className="container-atelier py-24 md:py-36">
        <SectionHeading
          id="writing-title"
          index="03"
          title={t('title')}
          lede={t('lede')}
          description={t('description')}
          aside={
            <Link
              href="/blog"
              className="type-meta group inline-flex items-center gap-2 text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-gray-50"
            >
              {t('archive')}
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          }
        />

        <div className="mt-16 md:mt-20">
          <TraceList
            traces={posts.slice(0, RECENT_COUNT).map((post) => ({
              key: post.slug,
              href: `/${post.path}`,
              title: post.title,
              date: post.date,
              tags: post.tags,
            }))}
          />
        </div>

        <div className="mt-24 border-t border-gray-900/20 pt-10 dark:border-white/20">
          <h3 className="type-meta text-gray-500 dark:text-gray-400">
            {t('areasTitle')}
          </h3>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {AREAS.map((area, index) => (
              <li key={area.id}>
                <Link href={area.href} className="group block space-y-4">
                  <p className="flex items-baseline gap-3">
                    <span className="type-meta text-gray-500 dark:text-gray-400">
                      {pad(index + 1)}
                    </span>
                    <span className="text-2xl font-semibold tracking-tight text-gray-950 uppercase dark:text-gray-50">
                      {t(`areas.${area.id}.label`)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-gray-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    >
                      →
                    </span>
                  </p>
                  <ul className="type-editorial space-y-1 text-xl text-gray-600 transition-colors duration-200 group-hover:text-gray-950 dark:text-gray-400 dark:group-hover:text-gray-100">
                    {(t.raw(`areas.${area.id}.items`) as string[]).map(
                      (item) => (
                        <li key={item}>{item}</li>
                      ),
                    )}
                  </ul>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
