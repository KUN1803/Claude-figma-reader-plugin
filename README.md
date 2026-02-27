# Figma Reader Plugin

Read, inspect, and analyze Figma designs directly from Claude Code. Extract layers as pixel-perfect CSS/HTML, export SVGs and assets — all without an API key.

**No separate CLI installation needed** — the [figma-ds-cli](https://github.com/silships/figma-cli) is bundled directly in this plugin and set up automatically on first use.

## What It Does

Claude automatically uses this skill when you ask about your Figma file. It can:

- **Read & inspect** canvas, frames, components, variables, typography, colors
- **Recreate layers as CSS** — extract all visual properties and generate production-ready code
- **Export SVGs** — extract vector icons, logos, shapes as inline SVG code
- **Export assets** — save PNGs for image fills, photos, raster graphics
- **Analyze design quality** — lint for accessibility, consistency, hardcoded colors
- **Export as code** — JSX, CSS custom properties, Tailwind config

## Installation

```bash
/install-plugin https://github.com/KUN1803/Claude-figma-reader-plugin
```

Dependencies are installed automatically on first use.

## Prerequisites

- **Figma Desktop** must be running
- **Node.js 18+** installed
- **Connect once** per session — Claude handles this automatically

## Usage

Just ask naturally:

```
"Was ist auf dem Canvas?"
"Analysiere die Farben"
"Baue den Hero-Frame als CSS in mein Projekt ein"
"Exportiere das Icon als SVG"
"Welche Komponenten gibt es?"
"Check accessibility"
"Show me the tree structure of Frame X"
"Recreate this layer as perfect CSS"
```

## Key Workflows

### Read Design
```
"what's on the canvas" → canvas overview with IDs
"inspect Frame X"      → full properties, tree, JSX
"analyze typography"   → all fonts, sizes, weights in use
```

### Layer to CSS
```
"recreate Hero as CSS" → extracts all properties → generates CSS/HTML
```
Handles fills, gradients, strokes, border-radius, flexbox layout, typography, shadows, blur, opacity, variable bindings — the full picture.

### SVG & Asset Export
```
"export the logo as SVG" → inline <svg> code, ready for HTML/JSX
```
Automatically detects vector nodes and image fills during extraction.

## Included Scripts

| Script | Purpose |
|--------|---------|
| `extract-css-props.js` | Extracts ALL visual properties from a Figma node recursively |
| `extract-svg.js` | Exports any node as inline SVG code |

## Bundled CLI

This plugin includes a bundled copy of [figma-ds-cli](https://github.com/silships/figma-cli) (MIT License, by Sil Bormuller). The CLI connects to Figma Desktop directly via Chrome DevTools Protocol — no API key required.

## Author

Kai Nottrodt
