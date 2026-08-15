import os
from art import (DARK, LIGHT, ghost, stacks, motes, spec_card, wordmark,
                 eyebrow, mix, r1, text_width, floor)

OUT = "/home/claude/ksl/assets"
os.makedirs(OUT, exist_ok=True)


def svg(w, h, defs, body, bg=None):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}" role="img" aria-label="Kiro Spec Library">\n'
            f'<defs>{defs}\n</defs>\n' + (bg or "") + body + "\n</svg>\n")


def write(name, content):
    p = os.path.join(OUT, name)
    with open(p, "w") as f:
        f.write(content)
    print(f"{name:34} {len(content)/1024:7.1f} KB")


# ══════════════════════════════════════════════════════════════ ICON ══
def build_icon(pal, name, size=512, bgless=False):
    S = size
    r = S * 0.1875
    cx = S / 2
    gd, gbody = ghost(cx, S * 0.205, S * 0.535, S * 0.555, pal, "I", lobes=3,
                      fade=0.30)

    defs = gd + f"""
  <linearGradient id="iBg" x1="0" y1="0" x2=".4" y2="1">
    <stop offset="0" stop-color="{mix(pal['bg'], pal['violet_deep'], .22)}"/>
    <stop offset=".55" stop-color="{pal['bg']}"/>
    <stop offset="1" stop-color="{pal['bg2']}"/>
  </linearGradient>
  <radialGradient id="iGlow" cx=".5" cy=".46" r=".62">
    <stop offset="0" stop-color="{pal['violet']}" stop-opacity=".40"/>
    <stop offset="1" stop-color="{pal['violet']}" stop-opacity="0"/>
  </radialGradient>"""

    # two chunky shelves of books behind the ghost
    parts = []

    def bay(y_base, x_start, specs):
        x = x_start
        for wf, hf, col in specs:
            bh, bwv = S * hf, S * wf
            parts.append(
                f'<rect x="{r1(x)}" y="{r1(y_base - bh)}" width="{r1(bwv - S*0.009)}" '
                f'height="{r1(bh)}" rx="{r1(S*0.013)}" fill="{col}"/>')
            parts.append(
                f'<rect x="{r1(x)}" y="{r1(y_base - bh)}" width="{r1(bwv - S*0.009)}" '
                f'height="{r1(S*0.020)}" rx="{r1(S*0.010)}" fill="#ffffff" opacity=".22"/>')
            parts.append(
                f'<rect x="{r1(x + S*0.014)}" y="{r1(y_base - bh*0.60)}" '
                f'width="{r1(bwv - S*0.037)}" height="{r1(S*0.014)}" rx="{r1(S*0.006)}" '
                f'fill="#ffffff" opacity=".28"/>')
            x += bwv
        parts.append(
            f'<rect x="{r1(S*0.055)}" y="{r1(y_base)}" width="{r1(S*0.89)}" '
            f'height="{r1(S*0.042)}" rx="{r1(S*0.015)}" '
            f'fill="{mix(pal["border"], pal["text"], .18)}"/>')

    B = [mix(c, pal["text"], .18) for c in pal["books"]]
    A = pal["accent"]
    M = pal["amber"]
    bay(S * 0.505, S * 0.055,
        [(.082, .140, B[4]), (.094, .178, B[6]), (.072, .120, M),
         (.088, .160, B[0]), (.080, .192, B[8]), (.092, .135, B[2]),
         (.076, .172, A), (.090, .150, B[5]), (.084, .182, B[3]),
         (.082, .130, B[9]), (.092, .166, B[1]), (.080, .145, B[7])])
    bay(S * 0.845, S * 0.055,
        [(.090, .175, B[1]), (.072, .215, A), (.096, .150, B[3]),
         (.078, .200, B[5]), (.092, .165, M), (.074, .226, B[0]),
         (.090, .185, B[7]), (.085, .205, B[2]), (.080, .160, B[4]),
         (.092, .196, B[6]), (.086, .172, B[8]), (.078, .142, B[9])])

    defs += (f'\n  <clipPath id="iClip"><rect width="{S}" height="{S}" '
             f'rx="{r1(r)}"/></clipPath>')

    bg = "" if bgless else (
        f'<rect width="{S}" height="{S}" rx="{r1(r)}" fill="url(#iBg)"/>'
        f'<rect width="{S}" height="{S}" rx="{r1(r)}" fill="url(#iGlow)"/>')

    body = (f'<g clip-path="url(#iClip)" opacity=".92">{"".join(parts)}</g>'
            f'{motes(S*0.10, S*0.12, S*0.90, S*0.74, 16, pal, 7, rmax=S*0.007)}'
            f'{gbody}')
    if not bgless:
        body += (f'<rect x=".75" y=".75" width="{S-1.5}" height="{S-1.5}" rx="{r1(r)}" '
                 f'fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="1.5"/>')
    write(name, svg(S, S, defs, body, bg))


# ═════════════════════════════════════════════════════════ GHOST MARK ══
def build_mark(pal, name, S=256):
    gd, gbody = ghost(S / 2, S * 0.16, S * 0.62, S * 0.68, pal, "M", lobes=3,
                      glow=False, fade=0.35)
    write(name, svg(S, S, gd, gbody))


# ══════════════════════════════════════════════════════════════ HERO ══
def build_hero(pal, name, W=1200, H=675, dark=True):
    vpx, vpy = 648, 352
    gcx, gtop, gw, gh = 452, 196, 214, 268
    gd, gbody = ghost(gcx, gtop, gw, gh, pal, "H", lobes=4)

    defs = gd + f"""
  <linearGradient id="hBg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{pal['bg2']}"/>
    <stop offset=".55" stop-color="{pal['bg']}"/>
    <stop offset="1" stop-color="{mix(pal['bg'], pal['violet_deep'], .10)}"/>
  </linearGradient>
  <radialGradient id="hVp" cx="{vpx/W:.4f}" cy="{vpy/H:.4f}" r=".46">
    <stop offset="0" stop-color="{'#fff3d0' if dark else '#ffffff'}" stop-opacity="{.85 if dark else .95}"/>
    <stop offset=".22" stop-color="{pal['amber']}" stop-opacity="{.30 if dark else .22}"/>
    <stop offset=".58" stop-color="{pal['violet_deep']}" stop-opacity="{.22 if dark else .14}"/>
    <stop offset="1" stop-color="{pal['violet_deep']}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="hFloor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{pal['violet_deep']}" stop-opacity="{.30 if dark else .16}"/>
    <stop offset="1" stop-color="{pal['bg2']}" stop-opacity="{.0 if dark else .0}"/>
  </linearGradient>
  <radialGradient id="hPool" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="{pal['amber']}" stop-opacity="{.22 if dark else .14}"/>
    <stop offset="1" stop-color="{pal['amber']}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="hVig" cx=".5" cy=".5" r=".78">
    <stop offset=".55" stop-color="{pal['bg2']}" stop-opacity="0"/>
    <stop offset="1" stop-color="{pal['bg2']}" stop-opacity="{.80 if dark else .55}"/>
  </radialGradient>"""

    shelves = stacks(vpx, vpy, pal, seed=11, z_near=395, z_far=2600,
                     boards=(-470, -320, -170, -20, 135, 290, 445),
                     fog_amount=.90 if dark else .80)

    # dashed relationship web + floating spec cards
    cards = (
        spec_card(792, 168, 176, 108, -6, pal, "c1", accent=pal["accent"]) +
        spec_card(908, 330, 156, 96, 5, pal, "c2", accent=pal["violet"]) +
        spec_card(760, 452, 150, 92, -3, pal, "c3", accent=pal["amber"]) +
        spec_card(188, 424, 128, 80, 8, pal, "c4", accent=pal["accent"])
    )
    web = (f'<g stroke="{pal["accent"]}" stroke-opacity=".38" stroke-width="1.6" '
           f'fill="none" stroke-dasharray="5 7" stroke-linecap="round">'
           f'<path d="M578 300 Q700 216 880 222"/>'
           f'<path d="M596 372 Q740 388 986 378"/>'
           f'<path d="M572 420 Q680 486 835 498"/>'
           f'<path d="M880 276 Q900 312 986 330"/>'
           f'<path d="M372 436 Q344 412 318 404"/>'
           f'</g>'
           f'<g fill="{pal["accent"]}" opacity=".7">'
           f'<circle cx="880" cy="276" r="3.4"/><circle cx="986" cy="378" r="3.4"/>'
           f'<circle cx="835" cy="498" r="3.4"/><circle cx="318" cy="404" r="3.4"/>'
           f'</g>')

    body = (
        f'<rect width="{W}" height="{H}" fill="url(#hBg)"/>'
        f'<rect width="{W}" height="{H}" fill="url(#hVp)"/>'
        f'{floor(vpx, vpy, W, H, pal, floor_y=445, z_near=395, z_far=2600, planks=11)}'
        f'<g>{shelves}</g>'
        f'<ellipse cx="{vpx}" cy="{H-40}" rx="440" ry="150" fill="url(#hFloor)"/>'
        f'<ellipse cx="{vpx}" cy="{vpy+66}" rx="230" ry="52" fill="url(#hPool)"/>'
        f'{motes(60, 70, W-60, H-70, 90, pal, 3)}'
        f'{web}{cards}{gbody}'
        f'<rect width="{W}" height="{H}" fill="url(#hVig)"/>')
    write(name, svg(W, H, defs, body))


# ═══════════════════════════════════════════════════════ HERO DETAIL ══
def build_detail(pal, name, W=1200, H=288, dark=True):
    vpx, vpy = 742, 150
    gcx, gtop, gw, gh = 236, 62, 122, 152
    gd, gbody = ghost(gcx, gtop, gw, gh, pal, "D", lobes=4)

    defs = gd + f"""
  <linearGradient id="dBg" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="{pal['bg2']}"/>
    <stop offset=".6" stop-color="{pal['bg']}"/>
    <stop offset="1" stop-color="{mix(pal['bg'], pal['violet_deep'], .12)}"/>
  </linearGradient>
  <radialGradient id="dVp" cx="{vpx/W:.4f}" cy="{vpy/H:.4f}" r=".55">
    <stop offset="0" stop-color="{'#fff3d0' if dark else '#ffffff'}" stop-opacity="{.80 if dark else .92}"/>
    <stop offset=".2" stop-color="{pal['amber']}" stop-opacity="{.26 if dark else .18}"/>
    <stop offset=".62" stop-color="{pal['violet_deep']}" stop-opacity="{.20 if dark else .12}"/>
    <stop offset="1" stop-color="{pal['violet_deep']}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="dFadeL" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{pal['bg2']}" stop-opacity="{.95 if dark else .85}"/>
    <stop offset="1" stop-color="{pal['bg2']}" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="dVig" cx=".5" cy=".5" r=".8">
    <stop offset=".5" stop-color="{pal['bg2']}" stop-opacity="0"/>
    <stop offset="1" stop-color="{pal['bg2']}" stop-opacity="{.72 if dark else .48}"/>
  </radialGradient>"""

    shelves = stacks(vpx, vpy, pal, seed=23, focal=430, wall=330,
                     z_near=180, z_far=1900, boards=(-392, -260, -128, 4, 136, 268, 400),
                     fog_amount=.90 if dark else .80)

    cards = (spec_card(560, 62, 132, 80, -5, pal, "d1", accent=pal["accent"]) +
             spec_card(508, 178, 116, 70, 4, pal, "d2", accent=pal["violet"]) +
             spec_card(940, 176, 124, 76, -4, pal, "d3", accent=pal["amber"]))
    web = (f'<g stroke="{pal["accent"]}" stroke-opacity=".35" stroke-width="1.5" fill="none" '
           f'stroke-dasharray="5 7" stroke-linecap="round">'
           f'<path d="M312 128 Q440 84 552 102"/>'
           f'<path d="M306 186 Q420 226 500 212"/>'
           f'<path d="M700 118 Q840 130 936 196"/></g>')

    body = (f'<rect width="{W}" height="{H}" fill="url(#dBg)"/>'
            f'<rect width="{W}" height="{H}" fill="url(#dVp)"/>'
            f'{floor(vpx, vpy, W, H, pal, focal=430, wall=330, floor_y=400, z_near=180, z_far=1900, planks=9)}'
            f'<g>{shelves}</g>'
            f'{motes(40, 24, W-40, H-24, 55, pal, 5, rmax=2.2)}'
            f'<rect width="520" height="{H}" fill="url(#dFadeL)"/>'
            f'{web}{cards}{gbody}'
            f'<rect width="{W}" height="{H}" fill="url(#dVig)"/>')
    write(name, svg(W, H, defs, body))


# ════════════════════════════════════════════════════════════ BANNER ══
def build_banner(pal, name, W=1280, H=320, dark=True):
    vpx, vpy = 1000, 160
    gcx, gtop, gw, gh = 168, 74, 116, 146
    gd, gbody = ghost(gcx, gtop, gw, gh, pal, "B", lobes=4)

    defs = gd + f"""
  <linearGradient id="bBg" x1="0" y1="0" x2=".35" y2="1">
    <stop offset="0" stop-color="{pal['bg2']}"/>
    <stop offset=".55" stop-color="{pal['bg']}"/>
    <stop offset="1" stop-color="{mix(pal['bg'], pal['violet_deep'], .14)}"/>
  </linearGradient>
  <radialGradient id="bVp" cx="{vpx/W:.4f}" cy="{vpy/H:.4f}" r=".5">
    <stop offset="0" stop-color="{'#fff3d0' if dark else '#ffffff'}" stop-opacity="{.72 if dark else .9}"/>
    <stop offset=".22" stop-color="{pal['amber']}" stop-opacity="{.24 if dark else .16}"/>
    <stop offset=".65" stop-color="{pal['violet_deep']}" stop-opacity="{.18 if dark else .10}"/>
    <stop offset="1" stop-color="{pal['violet_deep']}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="bScrim" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{pal['bg2']}" stop-opacity="{.97 if dark else .93}"/>
    <stop offset=".62" stop-color="{pal['bg2']}" stop-opacity="{.86 if dark else .78}"/>
    <stop offset="1" stop-color="{pal['bg2']}" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="bVig" cx=".5" cy=".5" r=".8">
    <stop offset=".5" stop-color="{pal['bg2']}" stop-opacity="0"/>
    <stop offset="1" stop-color="{pal['bg2']}" stop-opacity="{.7 if dark else .45}"/>
  </radialGradient>"""

    shelves = stacks(vpx, vpy, pal, seed=41, focal=460, wall=340,
                     z_near=170, z_far=1900, boards=(-406, -270, -134, 2, 138, 274, 410),
                     fog_amount=.90 if dark else .80)

    wm, wm_w = wordmark(276, 176, 62, pal)
    eb, _ = eyebrow(278, 208, 15, pal, "SPECTRAL LIBRARIAN FOR YOUR KIRO SPECS", 0.15,
                    color=pal["muted"])
    rule = (f'<rect x="278" y="196" width="{r1(wm_w-4)}" height="1.4" '
            f'fill="{pal["accent"]}" opacity=".35"/>')

    body = (f'<rect width="{W}" height="{H}" fill="url(#bBg)"/>'
            f'<rect width="{W}" height="{H}" fill="url(#bVp)"/>'
            f'{floor(vpx, vpy, W, H, pal, focal=460, wall=340, floor_y=410, z_near=170, z_far=1900, planks=9)}'
            f'<g>{shelves}</g>'
            f'{motes(30, 20, W-30, H-20, 55, pal, 9, rmax=2.2)}'
            f'<rect width="1000" height="{H}" fill="url(#bScrim)"/>'
            f'{gbody}{wm}{rule}{eb}'
            f'<rect width="{W}" height="{H}" fill="url(#bVig)"/>')
    write(name, svg(W, H, defs, body))


# ══════════════════════════════════════════════════════════ WORDMARKS ══
def build_wordmark_h(pal, name, dark=True):
    S = 96
    pad = 8
    gd, gbody = ghost(pad + S / 2, pad + S * 0.13, S * 0.60, S * 0.66, pal, "W", lobes=3,
                      glow=False, fade=0.35)
    tx = pad + S + 22
    wm, wm_w = wordmark(tx, pad + S * 0.60, 46, pal)
    eb, eb_w = eyebrow(tx + 1.5, pad + S * 0.86, 12.5, pal, "SPECTRAL LIBRARIAN", 0.185)
    W = int(tx + max(wm_w, eb_w) + 16)
    H = S + pad * 2
    bgr = (f'<rect width="{W}" height="{H}" fill="{pal["bg"]}"/>' if not dark else "")
    write(name, svg(W, H, gd, bgr + gbody + wm + eb))


def build_wordmark_v(pal, name, dark=True):
    W, H = 420, 300
    gd, gbody = ghost(W / 2, 24, 118, 140, pal, "V", lobes=3, glow=False, fade=0.35)
    size = 52
    ww = text_width("Spec Library", size, "bold", -0.012)
    wm, _ = wordmark((W - ww) / 2, 238, size, pal)
    ebt = "SPECTRAL LIBRARIAN"
    ebw = text_width(ebt, 13, "regular", 0.2)
    eb, _ = eyebrow((W - ebw) / 2, 270, 13, pal, ebt, 0.2)
    bgr = (f'<rect width="{W}" height="{H}" fill="{pal["bg"]}"/>' if not dark else "")
    write(name, svg(W, H, gd, bgr + gbody + wm + eb))


if __name__ == "__main__":
    build_icon(DARK, "icon.svg")
    build_mark(DARK, "mark.svg")
    build_mark(LIGHT, "mark-light.svg")
    build_hero(DARK, "hero-dark.svg", dark=True)
    build_hero(LIGHT, "hero-light.svg", dark=False)
    build_detail(DARK, "hero-detail-dark.svg", dark=True)
    build_detail(LIGHT, "hero-detail-light.svg", dark=False)
    build_banner(DARK, "banner.svg", dark=True)
    build_wordmark_h(DARK, "wordmark-horizontal.svg", dark=True)
    build_wordmark_h(LIGHT, "wordmark-horizontal-light.svg", dark=False)
    build_wordmark_v(DARK, "wordmark-stacked.svg", dark=True)
    build_wordmark_v(LIGHT, "wordmark-stacked-light.svg", dark=False)
