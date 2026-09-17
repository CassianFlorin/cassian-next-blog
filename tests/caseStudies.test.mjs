import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tempDir = mkdtempSync(join(tmpdir(), 'case-studies-'));
const outfile = join(tempDir, 'caseStudies.mjs');

try {
  esbuild.buildSync({
    entryPoints: [join(root, 'data/caseStudies/index.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    alias: { '@': root },
  });

  const { caseStudies, caseStudyProjects, projectSlug, projectHref } =
    await import(pathToFileURL(outfile).href);
  const messages = {
    zh: JSON.parse(readFileSync(join(root, 'messages/zh.json'), 'utf8')),
    en: JSON.parse(readFileSync(join(root, 'messages/en.json'), 'utf8')),
  };

  // Every case study points at a real project, with a unique URL.
  const projects = caseStudyProjects();
  assert.equal(projects.length, caseStudies.length);
  const slugs = projects.map(projectSlug);
  assert.deepEqual(slugs, ['litho', 'skill-hub', 'database-cli']);
  assert.equal(new Set(slugs).size, slugs.length);
  projects.forEach((project) =>
    assert.equal(projectHref(project), `/projects/${projectSlug(project)}`),
  );

  caseStudies.forEach((entry) => {
    const { zh, en } = entry.content;
    const where = entry.projectId;

    // Both locales tell the same story, section for section.
    for (const key of ['why', 'problem', 'implementation', 'decisions']) {
      assert.equal(zh[key].length, en[key].length, `${where}.${key}`);
    }
    assert.equal(
      zh.system.layers.length,
      en.system.layers.length,
      `${where}.system`,
    );
    assert.equal(
      zh.result.facts.length,
      en.result.facts.length,
      `${where}.result`,
    );

    // Unbalanced backticks would leak into the rendered text.
    const strings = JSON.stringify(entry.content).match(/"(?:[^"\\]|\\.)*"/g);
    strings.forEach((value) =>
      assert.equal(
        (value.match(/`/g) || []).length % 2,
        0,
        `${where}: ${value}`,
      ),
    );

    // Explicitly related posts must exist.
    (entry.relatedPostSlugs || []).forEach((slug) =>
      assert.ok(
        existsSync(join(root, 'data/blog', `${slug}.mdx`)),
        `${where}: missing post ${slug}`,
      ),
    );

    // The page reads tagline, why and status from messages in both locales.
    for (const locale of ['zh', 'en']) {
      const item = messages[locale].projects.items[entry.projectId];
      for (const key of ['tagline', 'why', 'status']) {
        assert.ok(item?.[key], `${locale}: projects.items.${where}.${key}`);
      }
    }
  });

  console.log('caseStudies tests passed');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
