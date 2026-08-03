import fs from 'fs';
import path from 'path';
import { ImageResponse } from 'next/og';
import siteMetadata from '@/data/siteMetadata';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

/**
 * Satori ships no CJK font, and the full Noto Sans SC is ~18 MB. These are
 * weight-pinned subsets built by `scripts/build-og-font.py`; `check-seo` warns
 * when a title uses a character they do not cover.
 */
const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');

let fontCache: { name: string; data: Buffer; weight: 400 | 700 }[] | null =
  null;

function fonts() {
  if (!fontCache) {
    fontCache = ([400, 700] as const).map((weight) => ({
      name: 'Noto Sans SC',
      weight,
      data: fs.readFileSync(
        path.join(FONT_DIR, `NotoSansSC-${weight}.subset.ttf`),
      ),
    }));
  }
  return fontCache.map((font) => ({ ...font, style: 'normal' as const }));
}

/** Long CJK titles need a smaller size to stay inside the card. */
function titleSize(title: string) {
  const width = [...title].reduce(
    (total, char) => total + (/[⺀-￿]/.test(char) ? 2 : 1),
    0,
  );
  if (width > 72) return 46;
  if (width > 48) return 54;
  return 66;
}

export interface OgCardInput {
  title: string;
  tags?: string[];
  date?: string;
  kicker?: string;
}

export function renderOgCard({ title, tags = [], date, kicker }: OgCardInput) {
  const host = siteMetadata.siteUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  return new ImageResponse(
    (
      // Satori supports a flexbox subset only — no grid, and every container
      // with more than one child needs an explicit `display: flex`.
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#0b100f',
          backgroundImage:
            'radial-gradient(900px 500px at 82% -10%, rgba(45,212,168,0.20), transparent 60%), radial-gradient(700px 460px at 8% 108%, rgba(45,212,168,0.10), transparent 62%)',
          fontFamily: '"Noto Sans SC"',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 10,
            backgroundImage: 'linear-gradient(#34d3a4, #17795f)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'linear-gradient(140deg, #34d3a4, #17795f)',
                color: '#05100c',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              C
            </div>
            <div
              style={{
                marginLeft: 16,
                color: '#eef4f1',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {siteMetadata.author}
            </div>
          </div>
          <div style={{ color: '#4bd6ab', fontSize: 20, fontWeight: 700 }}>
            {kicker || 'BLOG'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            color: '#f4f8f6',
            fontSize: titleSize(title),
            fontWeight: 700,
            lineHeight: 1.26,
            maxWidth: 980,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex' }}>
            {tags.slice(0, 3).map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  marginRight: 12,
                  padding: '9px 20px',
                  borderRadius: 999,
                  border: '1px solid rgba(75,214,171,0.34)',
                  backgroundColor: 'rgba(52,211,164,0.09)',
                  color: '#a8e9d3',
                  fontSize: 21,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              color: '#97a5a0',
              fontSize: 21,
            }}
          >
            {date && <div>{date}</div>}
            <div>{host}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts() },
  );
}
