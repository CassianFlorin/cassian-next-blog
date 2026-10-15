import {
  allBlogs,
  allBlogTranslations,
  type Blog,
} from 'contentlayer/generated';
import {
  allCoreContent,
  sortPosts,
  type CoreContent,
} from 'pliny/utils/contentlayer';
import { postContentLocale } from '@/lib/seo';

export type LocalizedPost = CoreContent<Blog>;

/**
 * Returns all sorted blog posts, localized for the requested locale.
 * If locale is 'en' (or anything other than the default postContentLocale 'zh'),
 * and a translation exists in allBlogTranslations, its title, summary, and tldr
 * will be used in place of the Chinese original.
 */
export function getLocalizedPosts(locale?: string): LocalizedPost[] {
  const sorted = allCoreContent(sortPosts(allBlogs));
  if (!locale || locale === postContentLocale) {
    return sorted;
  }

  const translationMap = new Map<
    string,
    (typeof allBlogTranslations)[number]
  >();
  for (const trans of allBlogTranslations) {
    if (trans.locale === locale) {
      translationMap.set(trans.slug, trans);
    }
  }

  return sorted.map((post) => {
    const translation = translationMap.get(post.slug);
    if (!translation) {
      return post;
    }
    return {
      ...post,
      title: translation.title || post.title,
      summary: translation.summary || post.summary,
      tldr: translation.tldr || post.tldr,
    };
  });
}
