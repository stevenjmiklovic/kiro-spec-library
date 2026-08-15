"""Kiro Spec Library — 'Spectral Librarian' brand art.

Everything is generated as plain SVG (paths + gradients only, no filters) so it
renders identically in GitHub, VS Code webviews, Chromium and cairosvg.
"""
import math
import random

from textpath import text_path, text_width

K = 0.5522847498  # circle/ellipse cubic-bezier constant


# ──────────────────────────────────────────────────────────── palettes ──
DARK = dict(
    bg="#1a1b1e",
    bg2="#101114",
    surface="#25262b",
    border="#373a40",
    text="#f1f3f5",
    muted="#909296",
    accent="#748ffc",
    violet="#a78bfa",
    violet_deep="#6d4fd6",
    amber="#fcc419",
    glow="#4c3a7d",
    fog="#241f3a",
    books=["#5c4a3d", "#7a5c46", "#8d6b4f", "#6b4f3f", "#4e3d33",
           "#8a5a4a", "#9c6b52", "#3f3630", "#7d6a55", "#654a3a"],
    accents=["#748ffc", "#a78bfa", "#fcc419", "#51cf66"],
    ink="#141122",
    is_light=False,
)

LIGHT = dict(
    bg="#ffffff",
    bg2="#eceef4",
    surface="#f8f9fa",
    border="#dee2e6",
    text="#16181c",
    muted="#868e96",
    accent="#4263eb",
    violet="#7c5cfc",
    violet_deep="#5b3fd0",
    amber="#e8a80c",
    glow="#cfc4f5",
    fog="#e4e0f4",
    books=["#c9a889", "#b8916f", "#d6bda1", "#a87e5e", "#e0cbb1",
           "#bf9a78", "#d2b394", "#9d7856", "#e6d6c0", "#c2a583"],
    accents=["#4263eb", "#7c5cfc", "#e8a80c", "#2f9e44"],
    ink="#1b1533",
    is_light=True,
)


def mix(c1, c2, t):
    """Blend two #rrggbb colors."""
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02x%02x%02x" % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def r1(v):
    return round(v, 1)


# ───────────────────────────────────────────────────────── ghost shape ──
def ghost_body(cx, top, w, h, lobes=4):
    """Classic ghost silhouette: elliptical dome, straight flanks, scalloped hem."""
    x0, x1 = cx - w / 2, cx + w / 2
    rx = w / 2
    ry = w * 0.60                 # dome height
    ys = top + ry                 # shoulder line
    yb = top + h                  # hem baseline
    seg = w / lobes
    amp = seg * 0.60

    d = [f"M{r1(x0)} {r1(ys)}"]
    d.append(f"C{r1(x0)} {r1(ys - K * ry)} {r1(cx - K * rx)} {r1(top)} {r1(cx)} {r1(top)}")
    d.append(f"C{r1(cx + K * rx)} {r1(top)} {r1(x1)} {r1(ys - K * ry)} {r1(x1)} {r1(ys)}")
    d.append(f"L{r1(x1)} {r1(yb)}")
    for i in range(lobes):
        xs = x1 - i * seg
        xe = xs - seg
        d.append(f"Q{r1((xs + xe) / 2)} {r1(yb + 2 * amp)} {r1(xe)} {r1(yb)}")
    d.append(f"L{r1(x0)} {r1(ys)}Z")
    return "".join(d)


def ghost(cx, top, w, h, pal, uid, lobes=4, spectacles=True, glow=True,
          eye_color=None, rim=True, fade=1.0):
    """Full luminous ghost librarian group (defs + body).

    `fade` scales how much the body dissolves toward the hem: 1.0 = airy and
    spectral (hero art), ~0.35 = solid enough to read as an app icon.
    """
    x0, x1 = cx - w / 2, cx + w / 2
    ry = w * 0.58
    eye_y = top + ry * 0.98
    eye_dx = w * 0.185
    eye_rx = w * 0.062
    eye_ry = w * 0.086
    lens_r = w * 0.148
    ec = eye_color or pal["ink"]

    o3 = round(1.00 - 0.26 * fade, 2)
    o4 = round(1.00 - 0.70 * fade, 2)
    defs = f"""
  <linearGradient id="gBody{uid}" x1="0" y1="0" x2="0.25" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".97"/>
    <stop offset=".34" stop-color="{pal['violet']}" stop-opacity=".94"/>
    <stop offset=".74" stop-color="{pal['violet_deep']}" stop-opacity="{o3}"/>
    <stop offset="1" stop-color="{pal['accent']}" stop-opacity="{o4}"/>
  </linearGradient>
  <linearGradient id="gRim{uid}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{'#ffffff' if not pal['is_light'] else pal['violet_deep']}" stop-opacity="{'.85' if not pal['is_light'] else '.55'}"/>
    <stop offset="1" stop-color="{pal['accent']}" stop-opacity=".12"/>
  </linearGradient>
  <radialGradient id="gHalo{uid}" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="{pal['violet']}" stop-opacity=".55"/>
    <stop offset=".45" stop-color="{pal['violet_deep']}" stop-opacity=".22"/>
    <stop offset="1" stop-color="{pal['violet_deep']}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="gSheen{uid}" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>
    <stop offset=".6" stop-color="#ffffff" stop-opacity=".18"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>"""

    body = ghost_body(cx, top, w, h, lobes)
    out = []
    if glow:
        gr = w * 1.35
        out.append(f'<ellipse cx="{r1(cx)}" cy="{r1(top + h * 0.48)}" '
                   f'rx="{r1(gr)}" ry="{r1(gr * 0.95)}" fill="url(#gHalo{uid})"/>')
    out.append(f'<path d="{body}" fill="url(#gBody{uid})"/>')
    if rim:
        out.append(f'<path d="{body}" fill="none" stroke="url(#gRim{uid})" '
                   f'stroke-width="{r1(max(1.0, w * 0.016))}" stroke-linejoin="round"/>')

    # inner sheen on the dome (soft, gradient-based — no hard edge)
    out.append(
        f'<ellipse cx="{r1(cx - w * 0.19)}" cy="{r1(top + ry * 0.50)}" '
        f'rx="{r1(w * 0.16)}" ry="{r1(w * 0.24)}" fill="url(#gSheen{uid})" '
        f'transform="rotate(-18 {r1(cx - w * 0.19)} {r1(top + ry * 0.50)})"/>')

    # eyes
    for s in (-1, 1):
        out.append(f'<ellipse cx="{r1(cx + s * eye_dx)}" cy="{r1(eye_y)}" '
                   f'rx="{r1(eye_rx)}" ry="{r1(eye_ry)}" fill="{ec}" opacity=".88"/>')
        out.append(f'<ellipse cx="{r1(cx + s * eye_dx - eye_rx * 0.32)}" '
                   f'cy="{r1(eye_y - eye_ry * 0.34)}" rx="{r1(eye_rx * 0.30)}" '
                   f'ry="{r1(eye_ry * 0.26)}" fill="#ffffff" opacity=".75"/>')

    if spectacles:
        sw = max(1.1, w * 0.028)
        lx = cx - eye_dx
        rxp = cx + eye_dx
        out.append(
            f'<g fill="none" stroke="{pal["amber"]}" stroke-width="{r1(sw)}" '
            f'stroke-linecap="round" opacity=".95">'
            f'<circle cx="{r1(lx)}" cy="{r1(eye_y)}" r="{r1(lens_r)}"/>'
            f'<circle cx="{r1(rxp)}" cy="{r1(eye_y)}" r="{r1(lens_r)}"/>'
            f'<path d="M{r1(lx + lens_r)} {r1(eye_y - lens_r * 0.14)}'
            f'Q{r1(cx)} {r1(eye_y - lens_r * 0.62)} {r1(rxp - lens_r)} {r1(eye_y - lens_r * 0.14)}"/>'
            f'<path d="M{r1(lx - lens_r)} {r1(eye_y - lens_r * 0.12)}L{r1(x0 + w * 0.012)} {r1(eye_y - lens_r * 0.44)}"/>'
            f'<path d="M{r1(rxp + lens_r)} {r1(eye_y - lens_r * 0.12)}L{r1(x1 - w * 0.012)} {r1(eye_y - lens_r * 0.44)}"/>'
            f'</g>')
        for s in (-1, 1):
            out.append(f'<circle cx="{r1(cx + s * eye_dx)}" cy="{r1(eye_y)}" '
                       f'r="{r1(lens_r - sw / 2)}" fill="{pal["amber"]}" opacity=".10"/>')
        # lens glint
        out.append(
            f'<path d="M{r1(lx - lens_r * 0.55)} {r1(eye_y + lens_r * 0.35)}'
            f'L{r1(lx + lens_r * 0.15)} {r1(eye_y - lens_r * 0.55)}" stroke="#ffffff" '
            f'stroke-width="{r1(sw * 0.9)}" stroke-linecap="round" opacity=".45" fill="none"/>')

    return defs, "".join(out)


# ─────────────────────────────────────────────────── perspective stacks ──
def stacks(vpx, vpy, pal, seed, focal=620.0, wall=430.0,
           z_near=430.0, z_far=2900.0, boards=(-330, -175, -20, 135, 290),
           fog_amount=0.92):
    """Two converging walls of bookshelves receding to a vanishing point."""
    rnd = random.Random(seed)
    fog = pal["fog"]

    def P(wx, wy, z):
        return (vpx + wx * focal / z, vpy + wy * focal / z)

    def depth(z):
        t = (math.log(z) - math.log(z_near)) / (math.log(z_far) - math.log(z_near))
        return max(0.0, min(1.0, t)) * fog_amount

    quads = []  # (z_mid, svg)
    for side in (-1, 1):
        wx = side * wall
        # shelf boards
        for by in boards:
            z = z_near
            pts_t, pts_b = [], []
            while z <= z_far:
                pts_t.append(P(wx, by - 9, z))
                pts_b.append(P(wx, by + 9, z))
                z *= 1.16
            pts_t.append(P(wx, by - 9, z_far))
            pts_b.append(P(wx, by + 9, z_far))
            poly = " ".join(f"{r1(x)},{r1(y)}" for x, y in pts_t + pts_b[::-1])
            quads.append((z_far * 1.2,
                          f'<polygon points="{poly}" fill="{mix(pal["border"], fog, 0.45)}" opacity=".9"/>'))

        # books, bay by bay
        for bi in range(len(boards) - 1):
            top_y, bot_y = boards[bi] + 9, boards[bi + 1] - 9
            bay = bot_y - top_y
            z = z_near
            while z < z_far:
                thick = rnd.uniform(20, 46)
                z2 = z + thick
                if z2 > z_far:
                    break
                lean = rnd.random() < 0.06
                hgt = bay * rnd.uniform(0.70, 0.97)
                ty = bot_y - hgt
                x_a, y_a = P(wx, ty, z)
                x_b, y_b = P(wx, ty, z2)
                x_c, y_c = P(wx, bot_y, z2)
                x_d, y_d = P(wx, bot_y, z)
                if abs(x_b - x_a) < 0.55:
                    z = z2
                    continue
                sw_px = abs(x_b - x_a)
                is_acc = rnd.random() < 0.055 and sw_px < 34
                base = rnd.choice(pal["accents"] if is_acc else pal["books"])
                t = depth((z + z2) / 2)
                col = mix(base, fog, t)
                # extreme near field falls out of the light
                nz = (z + z2) / 2
                if nz < z_near * 1.7:
                    col = mix(col, pal["bg2"], 0.62 * (1 - (nz / (z_near * 1.7)) ** 2))
                pts = f"{r1(x_a)},{r1(y_a)} {r1(x_b)},{r1(y_b)} {r1(x_c)},{r1(y_c)} {r1(x_d)},{r1(y_d)}"
                extra = ""
                if lean:
                    extra = f' transform="rotate({rnd.uniform(-4, 4):.1f} {r1(x_d)} {r1(y_d)})"'
                svg = f'<polygon points="{pts}" fill="{col}"{extra}/>'
                if is_acc and t < 0.55:
                    svg += (f'<polygon points="{pts}" fill="{base}" opacity="{r1(0.34 * (1 - t))}"'
                            f'{extra}/>')
                quads.append(((z + z2) / 2, svg))
                z = z2

    quads.sort(key=lambda q: -q[0])   # far first
    return "".join(s for _, s in quads)


def floor(vpx, vpy, W, H, pal, focal=620.0, wall=430.0, floor_y=300.0,
          z_near=430.0, z_far=2900.0, planks=13):
    """Receding floorboards between the two shelf walls."""
    def P(wx, wy, z):
        return (vpx + wx * focal / z, vpy + wy * focal / z)

    out = []
    # base plane
    xl0, y0 = P(-wall, floor_y, z_near)
    xr0, _ = P(wall, floor_y, z_near)
    xlf, yf = P(-wall, floor_y, z_far)
    xrf, _ = P(wall, floor_y, z_far)
    out.append(f'<polygon points="{r1(xl0)},{r1(y0)} {r1(xr0)},{r1(y0)} '
               f'{r1(xrf)},{r1(yf)} {r1(xlf)},{r1(yf)}" fill="{mix(pal["bg2"], pal["fog"], .35)}"/>')
    # plank seams, only in the near field — they dissolve well before the
    # vanishing point so the floor reads as boards, not as a grid
    z_stop = z_near * 2.6
    for i in range(1, planks):
        wx = -wall + 2 * wall * i / planks
        xa, ya = P(wx, floor_y, z_near)
        xb, yb = P(wx, floor_y, z_stop)
        op = 0.20 * (1 - abs(i / planks - 0.5) * 0.8)
        out.append(f'<line x1="{r1(xa)}" y1="{r1(ya)}" x2="{r1(xb)}" y2="{r1(yb)}" '
                   f'stroke="{pal["border"]}" stroke-opacity="{r1(op)}" stroke-width="1.2"/>')
    return "".join(out)


def motes(x0, y0, x1, y1, n, pal, seed, rmax=2.6):
    rnd = random.Random(seed)
    out = []
    for _ in range(n):
        x = rnd.uniform(x0, x1)
        y = rnd.uniform(y0, y1)
        r = rnd.uniform(0.7, rmax)
        o = rnd.uniform(0.12, 0.68)
        c = rnd.choice(["#ffffff", pal["violet"], pal["amber"], pal["accent"]])
        if rnd.random() < 0.28:
            out.append(f'<circle cx="{r1(x)}" cy="{r1(y)}" r="{r1(r * 3.2)}" '
                       f'fill="{c}" opacity="{r1(o * 0.14)}"/>')
        out.append(f'<circle cx="{r1(x)}" cy="{r1(y)}" r="{r1(r)}" fill="{c}" '
                   f'opacity="{r1(o)}"/>')
    return "".join(out)


def spec_card(x, y, w, h, rot, pal, uid, rows=3, accent=None):
    """A floating spec card — nod to the relationship-graph nodes."""
    a = accent or pal["accent"]
    lines = []
    for i in range(rows):
        ly = y + h * 0.42 + i * (h * 0.17)
        lw = w * (0.72 - i * 0.16)
        lines.append(f'<rect x="{r1(x + w * 0.12)}" y="{r1(ly)}" width="{r1(lw)}" '
                     f'height="{r1(max(1.5, h * 0.055))}" rx="{r1(h * 0.028)}" '
                     f'fill="{pal["muted"]}" opacity=".55"/>')
    face = mix(pal["surface"], pal["text"], 0.16)
    return (
        f'<g transform="rotate({rot} {r1(x + w / 2)} {r1(y + h / 2)})" opacity=".97">'
        f'<rect x="{r1(x - 5)}" y="{r1(y - 3)}" width="{r1(w + 10)}" height="{r1(h + 12)}" '
        f'rx="{r1(h * 0.2)}" fill="{pal["bg2"]}" opacity=".45"/>'
        f'<rect x="{r1(x)}" y="{r1(y)}" width="{r1(w)}" height="{r1(h)}" rx="{r1(h * 0.13)}" '
        f'fill="{face}" fill-opacity=".94" stroke="{mix(pal["border"], pal["text"], .25)}" '
        f'stroke-width="1.4"/>'
        f'<rect x="{r1(x)}" y="{r1(y)}" width="{r1(w * 0.055)}" height="{r1(h)}" '
        f'rx="{r1(h * 0.13)}" fill="{a}" opacity=".85"/>'
        f'<rect x="{r1(x + w * 0.12)}" y="{r1(y + h * 0.17)}" width="{r1(w * 0.52)}" '
        f'height="{r1(max(2.0, h * 0.085))}" rx="{r1(h * 0.042)}" fill="{a}" opacity=".9"/>'
        + "".join(lines) + "</g>")


# ───────────────────────────────────────────────────────────── wordmark ──
def wordmark(x, baseline, size, pal, two_tone=True, tracking=-0.012):
    """'Spec Library' set in AWS Diatype Bold, converted to outlines."""
    if not two_tone:
        d, adv = text_path("Spec Library", size, "bold", x, baseline, tracking)
        return f'<path d="{d}" fill="{pal["text"]}"/>', adv
    w1 = text_width("Spec ", size, "bold", tracking)
    d1, _ = text_path("Spec ", size, "bold", x, baseline, tracking)
    d2, _ = text_path("Library", size, "bold", x + w1, baseline, tracking)
    total = w1 + text_width("Library", size, "bold", tracking)
    return (f'<path d="{d1}" fill="{pal["violet"]}"/>'
            f'<path d="{d2}" fill="{pal["text"]}"/>'), total


def eyebrow(x, baseline, size, pal, text="KIRO SPEC LIBRARY", tr=0.16, color=None):
    d, adv = text_path(text, size, "regular", x, baseline, tr)
    return f'<path d="{d}" fill="{color or pal["muted"]}"/>', adv
