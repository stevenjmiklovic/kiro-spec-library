import os
import cairosvg
from PIL import Image

A = "/home/claude/ksl/assets"


def png(src, out, w=None, h=None, scale=None):
    kw = {}
    if scale:
        kw["scale"] = scale
    if w:
        kw["output_width"] = w
    if h:
        kw["output_height"] = h
    cairosvg.svg2png(url=os.path.join(A, src), write_to=os.path.join(A, out), **kw)


# app icon — app.json's iconPath is assets/icon-256.png
for s in (512, 256, 128, 64, 32, 16):
    png("icon.svg", f"icon-{s}.png", w=s, h=s)

# favicon bundle
ims = [Image.open(f"{A}/icon-{s}.png").convert("RGBA") for s in (16, 32, 64, 128, 256)]
ims[0].save(f"{A}/favicon.ico", format="ICO",
            sizes=[(16, 16), (32, 32), (64, 64), (128, 128), (256, 256)])

# hero art — manifest heroImage / heroImageDark (1200x675) at 1x and 2x
for n in ("hero-light", "hero-dark"):
    png(f"{n}.svg", f"{n}.png", w=1200, h=675)
    png(f"{n}.svg", f"{n}@2x.png", w=2400, h=1350)

# detail banners — heroImageDetail / heroImageDetailDark (1200x288)
for n in ("hero-detail-light", "hero-detail-dark"):
    png(f"{n}.svg", f"{n}.png", w=1200, h=288)
    png(f"{n}.svg", f"{n}@2x.png", w=2400, h=576)

# repo / social banner
png("banner.svg", "banner.png", w=1280, h=320)
png("banner.svg", "banner@2x.png", w=2560, h=640)

# marks + lockups
png("mark.svg", "mark-256.png", w=256, h=256)
png("mark-light.svg", "mark-light-256.png", w=256, h=256)
for n in ("wordmark-horizontal", "wordmark-horizontal-light",
          "wordmark-stacked", "wordmark-stacked-light"):
    png(f"{n}.svg", f"{n}.png", scale=2)

for f in sorted(os.listdir(A)):
    print(f"  {f:34} {os.path.getsize(os.path.join(A, f))/1024:8.1f} KB")
