# Spec Library — brand assets

Theme: **the Spectral Librarian** — the Kiro ghost adrift in luminous library
stacks, with spec cards floating on a dashed relationship web.

Every asset is hand-authored SVG using only paths and gradients (no `filter`
elements), so it renders identically in GitHub, VS Code webviews, Chromium and
server-side rasterizers. Wordmarks are AWS Diatype converted to outlines, so
they need no font to be installed.

## Palette

Pulled from `ui/src/styles/global.css` so the art and the app agree.

| Role | Dark | Light |
| --- | --- | --- |
| Canvas | `#1a1b1e` | `#ffffff` |
| Surface | `#25262b` | `#f8f9fa` |
| Border | `#373a40` | `#dee2e6` |
| Accent (periwinkle) | `#748ffc` | `#4263eb` |
| Ghost violet | `#a78bfa` → `#6d4fd6` | `#7c5cfc` → `#5b3fd0` |
| Spectacles (amber) | `#fcc419` | `#e8a80c` |

## Files

### App icon — `app.json` `iconPath`

| File | Use |
| --- | --- |
| `icon.svg` | 512 master, rounded-square, full bleed |
| `icon-256.png` | **wired to `app.json` `iconPath`** (manifest requires PNG, square, min 256×256) |
| `icon-512/128/64/32/16.png` | retina, list, tray, favicon sizes |
| `favicon.ico` | 16/32/64/128/256 bundle |

### Hero art — `app.json` `heroImage` / `heroImageDark` (1200×675, 16:9)

| File | Use |
| --- | --- |
| `hero-light.svg` / `.png` / `@2x.png` | light-theme card + detail art |
| `hero-dark.svg` / `.png` / `@2x.png` | dark-theme art |

### Detail banner — `heroImageDetail` / `heroImageDetailDark` (1200×288, 25:6)

| File | Use |
| --- | --- |
| `hero-detail-light.svg` / `.png` / `@2x.png` | detail-page banner, light |
| `hero-detail-dark.svg` / `.png` / `@2x.png` | detail-page banner, dark |

Text-free by design — the detail page renders the app name over/next to it.

### Repo banner (1280×320)

`banner.svg` / `banner.png` / `banner@2x.png` — carries the wordmark and the
line *Spectral librarian for your Kiro specs*. For a README header or a GitHub
social preview.

### Marks and lockups

| File | Use |
| --- | --- |
| `mark.svg`, `mark-256.png` | ghost only, transparent, no glow — avatars, favicons, inline glyphs |
| `mark-light.svg`, `mark-light-256.png` | same, tuned for light backgrounds |
| `wordmark-horizontal[-light].svg` / `.png` | ghost + *Spec Library* + eyebrow — headers, docs |
| `wordmark-stacked[-light].svg` / `.png` | centered lockup — splash, about, square placements |

## Wiring into `app.json`

`iconPath` already points at `assets/icon-256.png`. To pick up the rest:

```jsonc
{
  "iconPath": "assets/icon-256.png",
  "heroImage": "assets/hero-light.svg",
  "heroImageDark": "assets/hero-dark.svg",
  "heroImageDetail": "assets/hero-detail-light.svg",
  "heroImageDetailDark": "assets/hero-detail-dark.svg"
}
```

Federated/registry apps use repo-relative paths (as above); builtin apps use
absolute URLs under `/apps/kiro-spec-library/ui/`.

## Usage notes

- The ghost mark needs clear space of about half its width on every side.
- Don't recolor the spectacles — amber against violet is the one high-contrast
  pair that survives down to 16px.
- `mark*.svg` ship without the halo glow so they sit cleanly on any background.
  The hero/banner ghosts keep the halo; don't lift those for logo use.
- Prefer the SVGs wherever the surface accepts them; the PNGs exist for the
  manifest's `iconPath` and for surfaces that reject vectors.
