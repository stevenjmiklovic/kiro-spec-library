"""Convert AWS Diatype text runs to SVG path data (outlines), so wordmarks
render identically everywhere without needing the font installed."""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

FONTS = {
    "regular": "/mnt/user-data/uploads/kiro-spec-library/ui/src/assets/fonts/aws-diatype-regular.woff2",
    "bold": "/mnt/user-data/uploads/kiro-spec-library/ui/src/assets/fonts/aws-diatype-bold.woff2",
}
_cache = {}


def _font(weight):
    if weight not in _cache:
        _cache[weight] = TTFont(FONTS[weight])
    return _cache[weight]


def text_path(text, size, weight="bold", x=0, y=0, tracking=0.0):
    """Return (path_d, advance_width). y is the BASELINE. tracking in em units."""
    f = _font(weight)
    upm = f["head"].unitsPerEm
    scale = size / upm
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    hmtx = f["hmtx"]
    try:
        kern = f["GPOS"]
    except KeyError:
        kern = None

    pen_out = SVGPathPen(gs)
    cursor = 0.0
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            cursor += upm * 0.35
            continue
        t = Transform(scale, 0, 0, -scale, x + cursor * scale, y)
        tp = TransformPen(pen_out, t)
        gs[gname].draw(tp)
        cursor += hmtx[gname][0] + tracking * upm
    return pen_out.getCommands(), cursor * scale


def text_width(text, size, weight="bold", tracking=0.0):
    f = _font(weight)
    upm = f["head"].unitsPerEm
    cmap = f.getBestCmap()
    hmtx = f["hmtx"]
    w = 0.0
    for ch in text:
        gname = cmap.get(ord(ch))
        w += (hmtx[gname][0] if gname else upm * 0.35) + tracking * upm
    return w * size / upm


if __name__ == "__main__":
    d, adv = text_path("Spec Library", 64, "bold", 0, 0)
    print(len(d), adv)
    d2, adv2 = text_path("KIRO SPEC LIBRARY", 20, "regular", 0, 0, tracking=0.12)
    print(len(d2), adv2)
