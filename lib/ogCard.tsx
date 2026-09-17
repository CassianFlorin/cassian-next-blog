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

/**
 * V2 card palette: warm ink on near-black, one mineral-green accent. Matches
 * the site's dark mode so a shared link looks like the page it opens.
 */
const INK = '#f0eee9';
const MUTED = '#9d998f';
const FAINT = 'rgba(240, 238, 233, 0.16)';
const ACCENT = '#8fbfa6';
const NIGHT = '#141312';

const host = () =>
  siteMetadata.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** Top bar shared by every card: the CF mark, the name, and a chapter kicker. */
function Masthead({ kicker }: { kicker: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 28,
        borderBottom: `1px solid ${FAINT}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            color: INK,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          CF
        </div>
        <div
          style={{
            marginLeft: 22,
            color: MUTED,
            fontSize: 19,
            letterSpacing: 5,
          }}
        >
          CASSIAN FLORIN
        </div>
      </div>
      <div style={{ color: ACCENT, fontSize: 19, letterSpacing: 4 }}>
        {kicker}
      </div>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    // Satori supports a flexbox subset only — no grid, and every container
    // with more than one child needs an explicit `display: flex`.
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 80px 60px',
        backgroundColor: NIGHT,
        fontFamily: '"Noto Sans SC"',
      }}
    >
      {children}
    </div>
  );
}

export interface OgCardInput {
  title: string;
  /** Chapter marker, e.g. `CF / 03 · WRITING`. */
  kicker: string;
  /** One editorial line under the title. */
  subtitle?: string;
  /** Bottom-left metadata, joined with middots (tags, tech stack, counts). */
  meta?: string[];
  /** Bottom-right line above the host, e.g. a date. */
  aside?: string;
}

export function renderOgCard({
  title,
  kicker,
  subtitle,
  meta = [],
  aside,
}: OgCardInput) {
  return new ImageResponse(
    (
      <Frame>
        <Masthead kicker={kicker} />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              color: INK,
              fontSize: titleSize(title),
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: -1,
              maxWidth: 1020,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                display: 'flex',
                marginTop: 22,
                color: MUTED,
                fontSize: 28,
                lineHeight: 1.4,
                maxWidth: 960,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingTop: 26,
            borderTop: `1px solid ${FAINT}`,
            fontSize: 20,
            letterSpacing: 2,
          }}
        >
          <div style={{ display: 'flex', color: MUTED, maxWidth: 720 }}>
            {meta.slice(0, 4).join('  ·  ')}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              color: MUTED,
            }}
          >
            {aside && <div style={{ color: INK }}>{aside}</div>}
            <div>{host()}</div>
          </div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: fonts() },
  );
}

/** The site's own card: the name, the three signature lines, CF / year. */
export function renderSiteCard() {
  const lines = ['Building things.', 'Mapping ideas.', 'Leaving traces.'];

  return new ImageResponse(
    (
      <Frame>
        <Masthead kicker={`CF / ${new Date().getFullYear()}`} />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              color: INK,
              fontSize: 112,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -5,
            }}
          >
            CASSIAN FLORIN
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 34,
              color: MUTED,
              fontSize: 38,
              lineHeight: 1.3,
            }}
          >
            {lines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 26,
            borderTop: `1px solid ${FAINT}`,
            color: MUTED,
            fontSize: 19,
            letterSpacing: 2,
          }}
        >
          <div style={{ display: 'flex', color: ACCENT, marginRight: 40 }}>
            AI ENGINEERING · DEVELOPER TOOLS · KNOWLEDGE SYSTEMS
          </div>
          <div>{host()}</div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: fonts() },
  );
}
