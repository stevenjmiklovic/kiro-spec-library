# Source

These four files regenerate every SVG in `assets/`.

    pip install fonttools brotli cairosvg
    python3 build.py     # writes the SVGs
    python3 export.py    # rasterizes the PNG/ICO set

`textpath.py` reads `ui/src/assets/fonts/aws-diatype-*.woff2` and converts the
wordmark text to outlines. `art.py` holds the palettes, the ghost geometry and
the perspective-stacks generator; `build.py` composes each asset.
