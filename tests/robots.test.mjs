import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = mkdtempSync(join(tmpdir(), 'robots-'));
const outfile = join(tempDir, 'robots.mjs');

try {
  esbuild.buildSync({
    entryPoints: [join(root, 'app/robots.ts')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    alias: { '@': root },
  });
  const { default: robots, dynamic } = await import(
    pathToFileURL(outfile).href
  );
  const config = robots();
  assert.equal(dynamic, 'force-static');
  assert.deepEqual(config, {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*?page=', '/*?post='],
      },
    ],
    sitemap: 'https://www.cassianflorin.com/sitemap.xml',
    host: 'https://www.cassianflorin.com',
  });

  // These rules use prefix matching and * wildcards; ? is a literal query marker.
  const blocked = config.rules[0].disallow.map(
    (rule) =>
      new RegExp(
        '^' +
          rule
            .split('*')
            .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('.*'),
      ),
  );
  for (const path of [
    '/zh/blog/example',
    '/en/blog/example',
    '/_next/static/chunks/app.js',
    '/_next/static/css/app.css',
    '/_next/static/media/font.woff2',
    '/_next/image?url=%2Fstatic%2Fimages%2Favatar.png&w=640&q=75',
    '/favicon.ico',
    '/static/favicons/favicon.ico',
  ]) {
    assert.ok(!blocked.some((rule) => rule.test(path)), `Allowed: ${path}`);
  }
  for (const path of [
    '/api/newsletter',
    '/zh/blog?page=2',
    '/en/blog?post=example',
  ]) {
    assert.ok(
      blocked.some((rule) => rule.test(path)),
      `Blocked: ${path}`,
    );
  }

  // Opt in after a production build to check Next.js's actual serialized output.
  if (process.argv.includes('--generated')) {
    assert.equal(
      readFileSync(join(root, '.next/server/app/robots.txt.body'), 'utf8'),
      'User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /*?page=\nDisallow: /*?post=\n\nHost: https://www.cassianflorin.com\nSitemap: https://www.cassianflorin.com/sitemap.xml\n',
    );
  }
  console.log('robots tests passed');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
