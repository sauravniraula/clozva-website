"""Export font-independent logo masters and PNGs with FontTools and ImageMagick."""
from pathlib import Path
from subprocess import run
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1]
font = TTFont(root / 'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2')
glyphs = instantiateVariableFont(font, {'wght': 700}).getGlyphSet()
cmap = font.getBestCmap()
out = root / 'public' / 'brand'
out.mkdir(parents=True, exist_ok=True)
ink, cream, lime = '#171717', '#F4EFE6', '#C6EF53'


def type_paths(text, cx, baseline, size, color, tracking=0):
    scale = size / font['head'].unitsPerEm
    names = [cmap[ord(c)] for c in text]
    advance = sum(glyphs[name].width * scale for name in names) + (len(names) - 1) * tracking
    x = cx - advance / 2
    paths = []
    for name in names:
        pen = SVGPathPen(glyphs, ntos=lambda n: f'{n:.2f}'.rstrip('0').rstrip('.') if n else '0')
        glyphs[name].draw(pen)
        if pen.getCommands():
            paths.append(f'<path transform="translate({x:.3f} {baseline}) scale({scale:.6f} {-scale:.6f})" d="{pen.getCommands()}"/>')
        x += glyphs[name].width * scale + tracking
    return f'<g fill="{color}">{"".join(paths)}</g>'


def star(cx, cy, radius, color):
    return ''.join(f'<path d="M{cx} {cy-radius}v{2*radius}" transform="rotate({a} {cx} {cy})" stroke="{color}" stroke-width="{radius*.24:.2f}"/>' for a in (0, 45, 90, 135))


logos = {
    'wordmark': (800, 288, 'CLOZVA wordmark', type_paths('clozva.', 400, 220, 241, ink, -13)),
    'tagline-lockup': (800, 400, 'CLOZVA — Comfort looks good.', f'<rect width="800" height="400" fill="{ink}"/>' + type_paths('clozva.', 400, 245, 238, cream, -12) + type_paths('COMFORT LOOKS GOOD.', 400, 315, 29, lime, 6)),
    'monogram': (512, 512, 'CLOZVA monogram', f'<rect width="512" height="512" fill="{lime}"/>' + type_paths('c.', 253, 355, 407, ink, -25)),
    'comfort-club': (512, 512, 'CLOZVA Comfort Club badge — USA / DROP 001', f'<circle cx="256" cy="256" r="240" fill="{cream}" stroke="{ink}" stroke-width="5"/><circle cx="256" cy="256" r="220" fill="none" stroke="{ink}" stroke-width="2"/>' + type_paths('COMFORT CLUB', 256, 145, 24, ink, 2.8) + type_paths('clozva.', 256, 287, 124, ink, -5.2) + star(256, 338, 16, ink) + type_paths('USA / DROP 001', 256, 402, 18, ink, 2)),
}

for name, (width, height, title, art) in logos.items():
    source = out / f'{name}.svg'
    source.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img"><title>{title}</title>{art}</svg>\n')
    for size in (256, 512, 1024):
        run(['magick', '-background', 'none', '-density', '192', str(source), '-resize', f'{size}x', '-strip', f'PNG32:{out / f"{name}-{size}.png"}'], check=True)
