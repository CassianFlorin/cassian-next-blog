import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, 'node_modules/.cache');
mkdirSync(cacheDir, { recursive: true });
const tempDir = mkdtempSync(join(cacheDir, 'seo-routing-'));

function bundle(contents, name) {
  const outfile = join(tempDir, `${name}.cjs`);
  esbuild.buildSync({
    stdin: { contents, resolveDir: root, loader: 'ts' },
    outfile,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    alias: { '@': root },
    logLevel: 'error',
  });
  return import(pathToFileURL(outfile).href).then((m) => m.default);
}

try {
  const seo = await bundle("export * from './lib/seo';", 'seo');
  const S = seo.SITE_URL;
  const path = '/blog/20250619-install-sdkman';

  // Untranslated post: only the original is advertised, every locale
  // canonicalises to it.
  assert.deepEqual(seo.postLanguageAlternates(path), {
    'zh-CN': `${S}/zh${path}`,
    'x-default': `${S}/zh${path}`,
  });
  assert.equal(
    seo.buildPostAlternates(path, 'en', []).canonical,
    `${S}/zh${path}`,
  );

  // Translated post: reciprocal pair, each locale canonical to itself.
  assert.deepEqual(seo.postLanguageAlternates(path, ['en']), {
    'zh-CN': `${S}/zh${path}`,
    en: `${S}/en${path}`,
    'x-default': `${S}/zh${path}`,
  });
  assert.equal(
    seo.buildPostAlternates(path, 'en', ['en']).canonical,
    `${S}/en${path}`,
  );
  assert.equal(
    seo.buildPostAlternates(path, 'zh', ['en']).canonical,
    `${S}/zh${path}`,
  );
  // A republished post keeps its external canonical everywhere.
  assert.equal(
    seo.buildPostAlternates(path, 'en', ['en'], 'https://example.com/a')
      .canonical,
    'https://example.com/a',
  );

  assert.equal(seo.isIndexableTag(1), false);
  assert.equal(seo.isIndexableTag(2), true);

  // One bundle, so the request class is the one the middleware expects.
  const { default: middleware, NextRequest } = await bundle(
    "export { default } from './middleware';\nexport { NextRequest } from 'next/server';",
    'middleware',
  );
  const run = (url) => middleware(new NextRequest(new URL(url, S)));
  const expectRedirect = (from, status, to) => {
    const res = run(from);
    assert.equal(res.status, status, from);
    assert.equal(res.headers.get('location'), `${S}${to}`, from);
  };

  // Unprefixed deep paths: one permanent hop to the default locale.
  expectRedirect('/blog', 308, '/zh/blog');
  expectRedirect('/tags/ai?x=1', 308, '/zh/tags/ai?x=1');
  // Dateless legacy slug goes straight to the prefixed, dated URL.
  expectRedirect(
    '/blog/install-sdkman',
    308,
    '/zh/blog/20250619-install-sdkman',
  );
  expectRedirect(
    '/en/blog/install-sdkman',
    308,
    '/en/blog/20250619-install-sdkman',
  );
  // Root keeps next-intl's language detection (temporary).
  assert.equal(run('/').status, 307);
  // Prefixed pages pass through.
  assert.notEqual(run('/zh/blog').status, 308);

  console.log('seoRouting tests passed');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
