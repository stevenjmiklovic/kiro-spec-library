# Spec Library — Kiro app-icon ghost

The character here is the ghost from the **Kiro app icon**: solid white body,
black eyes, no outline — with librarian spectacles added.

This is the third of three sets in `assets/`. See the comparison at the bottom.

## Measured from the shipped icon

Everything was taken off `Kiro.app/Contents/Resources/Kiro.icns`, alpha-cropped
to its 426×426 content box:

| | |
| --- | --- |
| Background | vertical gradient `#8b47fa` → `#743bd0` |
| Corner radius | 21.8% of the icon |
| Ghost | white, height 64.3% of the icon, centred at (0.500, 0.487) |
| Eyes | near-black, from the mark's own path |

The silhouette is the `welcomeDialog/kiro.svg` path with a **0.969 horizontal
squeeze** — the icon's ghost is slightly narrower than the SVG mark's. Squeezed,
it matches the icon's own artwork at **IoU 0.966**; the residual is antialiasing
on the edge. `_source/kiroflat.py` carries those constants.

## The spectacles

Tall oval lenses, tangent rather than overlapping — the mark's eyes are only
2.15 units apart on a 12.4-wide head, so circular lenses would collide.

Both temple arms are drawn, the far one longer than the near one. Strict
three-quarter perspective would hide the far arm behind the face, but this head
has no nose or cheek to occlude it — hiding it just reads as a missing arm.
Running it long, back toward the far contour, keeps the perspective and still
reads as a pair of glasses. (To go back to one arm, drop the second `<path>` in
`spectacles()` in `_source/kiroflat.py`.)

Amber `#fcc419` is the default: it ties this set to the other two, and it keeps
the Spec Library icon distinguishable from Kiro's own icon in a dock or app
grid. `icon-ink.svg` / `mark-ink.svg` use near-black instead, which reads as
more native to the mark's flat style — both are here, pick either.

## Palette

This set follows **Kiro's own art** rather than the app's Mantine tokens. The
stage colours are the ones Kiro uses in its first-party Crew hero art
(`KiroCrew.app/…/app-assets/*/hero-dark.svg`).

| Role | Dark | Light |
| --- | --- | --- |
| Stage | `#171225` / `#0d0917` | `#ffffff` / `#e9e1fb` |
| Surface | `#241a3a` | `#faf8ff` |
| Accent | `#8b5cf6` | `#7c3aed` |
| Violet | `#a78bfa` → `#6d28d9` | `#8b5cf6` → `#5b21b6` |
| Spectacles | `#fcc419` | `#d99a06` |

## Files

| File | Use |
| --- | --- |
| `icon.svg`, `icon-{512,256,128,64,32,16}.png`, `favicon.ico` | app icon, tone-on-tone stacks behind the ghost |
| `icon-plain.svg` / `-256.png` / `-512.png` | the shipped icon plus spectacles, nothing else |
| `icon-ink.svg` / `-256.png` | ink spectacles instead of amber |
| `hero-{light,dark}.svg` / `.png` / `@2x.png` | 1200×675 — `heroImage` / `heroImageDark` |
| `hero-detail-{light,dark}.svg` / `.png` / `@2x.png` | 1200×288 — `heroImageDetail` / `heroImageDetailDark` |
| `banner.svg` / `.png` / `@2x.png` | 1280×320 repo banner |
| `mark.svg`, `mark-256.png` | white ghost, transparent — for dark or coloured backgrounds |
| `mark-ink.svg`, `mark-ink-256.png` | same with ink spectacles |
| `mark-tile.svg`, `mark-tile-256.png` | ghost on the purple squircle — the safe way to place it on light backgrounds |
| `wordmark-{horizontal,stacked}[-light].svg` / `.png` | lockups |

**A white mark needs a dark or coloured ground.** On light backgrounds use
`mark-tile`, or the `-light` lockups, which carry a hairline violet contour.

## Choosing between the three sets

| | Character | Best at |
| --- | --- | --- |
| `assets/` | original symmetric ghost, luminous violet | small icon sizes; no trademark question |
| `assets/kiro-ghost/` | the outlined `kiro.svg` mark, luminous violet | matching Kiro's outlined mark |
| `assets/kiro-icon/` **(this one)** | the app-icon ghost, solid white | highest contrast; reads cleanly all the way down to 32px |

This set holds up smallest of the three — solid white on saturated purple is
the strongest contrast pair available, so the ghost survives where the other
two soften.

The trademark caveat from `kiro-ghost/README.md` applies here too, more so:
this borrows the icon's colours and layout as well as the mark, so a public
release is worth checking against Kiro's brand guidelines first.

## Regenerating

```
cd _source && python3 build_flat.py && python3 export_flat.py
```
