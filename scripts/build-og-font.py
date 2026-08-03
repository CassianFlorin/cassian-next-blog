#!/usr/bin/env python3
"""
Regenerate the subsetted fonts used by the OG card renderer.

The OG cards are drawn by Satori (via `next/og`), which ships no CJK font — a
full Noto Sans SC is ~18 MB, far too large to load on every render. This script
pins the variable font to the two weights the card uses and subsets each one to
`assets/fonts/charset.txt`.

The generated .ttf files are committed, so a normal `yarn build` needs neither
Python nor fonttools. Re-run this only when `charset.txt` changes:

    pip3 install 'fonttools[woff]' brotli
    python3 scripts/build-og-font.py path/to/NotoSansSC[wght].ttf

`check-seo` warns when a post title uses a character missing from charset.txt,
which is the signal that charset.txt (and then this script) needs updating.
"""
import os
import subprocess
import sys
import tempfile

WEIGHTS = (400, 700)
OUT_DIR = os.path.join('assets', 'fonts')
CHARSET = os.path.join(OUT_DIR, 'charset.txt')


def main():
    if len(sys.argv) < 2:
        sys.exit('用法: python3 scripts/build-og-font.py <NotoSansSC[wght].ttf>')
    source = sys.argv[1]
    if not os.path.exists(source):
        sys.exit('找不到源字体: %s' % source)
    if not os.path.exists(CHARSET):
        sys.exit('找不到字符集: %s' % CHARSET)

    for weight in WEIGHTS:
        with tempfile.NamedTemporaryFile(suffix='.ttf', delete=False) as tmp:
            instance = tmp.name
        try:
            # Satori renders a variable font at its default instance only, so
            # each weight has to be pinned into its own static font first.
            subprocess.run(
                [sys.executable, '-m', 'fontTools.varLib.instancer',
                 source, 'wght=%d' % weight, '-o', instance],
                check=True, stdout=subprocess.DEVNULL,
            )
            out = os.path.join(OUT_DIR, 'NotoSansSC-%d.subset.ttf' % weight)
            # Default layout features only: keeping every feature costs ~70 KB
            # and the card never needs the exotic ones. Glyph outlines dominate
            # the size either way.
            subprocess.run(
                [sys.executable, '-m', 'fontTools.subset', instance,
                 '--text-file=%s' % CHARSET,
                 '--output-file=%s' % out],
                check=True, stdout=subprocess.DEVNULL,
            )
            print('%s  %.0f KB' % (out, os.path.getsize(out) / 1024))
        finally:
            os.unlink(instance)


main()
