/**
 * Fill each post's `lastmod` frontmatter from its git history.
 *
 * `lastmod` drives `dateModified` in the article JSON-LD and `lastModified` in
 * the sitemap — the signals that tell search and generative engines whether a
 * page is still current. Maintaining it by hand means forgetting it, so it is
 * derived from the last commit that actually changed the file.
 *
 * Two details make that safe to run on every build:
 *
 *   - Commits whose only change to a post is the `lastmod:` line are skipped.
 *     Without that the script feeds on its own output: writing the field makes
 *     a new commit, which becomes the newest change, which rewrites the field.
 *   - A shallow clone (Vercel's default checkout) cannot answer the question,
 *     so the script no-ops there and leaves the committed values alone.
 */
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'data', 'blog');

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

const dayOf = (value) => new Date(value).toISOString().slice(0, 10);

/** True when the commit's diff for this file touches more than `lastmod:`. */
function isContentChange(sha, file) {
  const diff = git(['show', '--format=', '--unified=0', sha, '--', file]);
  return diff
    .split('\n')
    .filter(
      (line) =>
        /^[+-]/.test(line) &&
        !/^(\+\+\+|---)/.test(line) &&
        line.slice(1).trim(),
    )
    .some((line) => !/^[+-]\s*lastmod:/.test(line));
}

/** Date of the newest commit that changed something other than `lastmod`. */
function lastContentChange(file) {
  const log = git(['log', '--format=%H %cI', '--', file]);
  if (!log) return null;
  for (const line of log.split('\n')) {
    const [sha, iso] = line.split(' ');
    if (isContentChange(sha, file)) return dayOf(iso);
  }
  return null;
}

/** Replace or insert the `lastmod:` line, keeping it next to `date:`. */
function withLastmod(raw, value) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const [block, body] = [match[1], raw.slice(match[0].length)];

  const lines = block.split('\n');
  const existing = lines.findIndex((line) => line.startsWith('lastmod:'));
  if (existing !== -1) {
    lines[existing] = `lastmod: '${value}'`;
  } else {
    const anchor = lines.findIndex((line) => line.startsWith('date:'));
    lines.splice(
      anchor === -1 ? lines.length : anchor + 1,
      0,
      `lastmod: '${value}'`,
    );
  }
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

function main() {
  if (!existsSync(BLOG_DIR)) return;

  try {
    if (git(['rev-parse', '--is-shallow-repository']) === 'true') {
      console.log('update-lastmod: 浅克隆，跳过（沿用已提交的 lastmod）');
      return;
    }
  } catch {
    console.log('update-lastmod: 不在 git 仓库中，跳过');
    return;
  }

  // Uncommitted edits have no commit date yet; treat them as changed today so a
  // local preview shows the right value before the change is committed.
  const dirty = new Set(
    git(['status', '--porcelain', '--', 'data/blog'])
      .split('\n')
      .map((line) => line.slice(3).trim())
      .filter(Boolean),
  );
  const today = dayOf(new Date());

  let updated = 0;
  for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))) {
    const relative = path.posix.join('data/blog', file);
    const full = path.join(BLOG_DIR, file);
    const raw = readFileSync(full, 'utf-8');
    const { data } = matter(raw);

    const modified = dirty.has(relative)
      ? today
      : lastContentChange(relative) || (data.date && dayOf(data.date));
    if (!modified) continue;

    // A post never touched since publication needs no `lastmod`; `dateModified`
    // already falls back to `date`.
    const published = data.date ? dayOf(data.date) : null;
    const current = data.lastmod ? dayOf(data.lastmod) : null;
    const target = modified === published ? null : modified;

    if (current === target) continue;
    if (target === null) continue;

    const next = withLastmod(raw, target);
    if (!next) continue;
    writeFileSync(full, next);
    updated += 1;
  }

  console.log(
    updated > 0
      ? `update-lastmod: 更新 ${updated} 篇文章的 lastmod`
      : 'update-lastmod: 所有 lastmod 均为最新',
  );
}

main();
