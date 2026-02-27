---
name: figma-reader
description: Use this skill whenever the user wants to read, inspect, analyze, or understand what's in their Figma file, OR wants to recreate a Figma layer/frame as CSS/HTML in their project, OR wants to extract SVGs/icons/assets from Figma. Triggers for requests like "was ist auf dem canvas", "zeig mir das Design", "analysiere die Farben/Typografie/Abstände", "welche Nodes gibt es", "lese den Frame", "what's on the canvas", "analyze the design", "inspect this component", "show me the variables", "what fonts are used", "read the figma file", "show tree structure", "find element named X", "what does node X look like", "export as JSX", "check design quality", "lint the design", "baue den Layer als CSS ein", "recreate this layer in CSS", "convert frame to HTML/CSS", "übernimm das Design in mein Projekt", "mach daraus CSS", "layer zu code", "design to code", "exportiere das SVG", "extract the icon", "hole die Grafik als SVG", "get the SVG code", "export icon as SVG", "save as SVG". Always use this skill before creating or modifying anything so you understand the current state first.
version: 1.2.0
---

# Figma Reader Skill

This skill provides a systematic approach for reading, inspecting, and analyzing Figma designs using the figma-ds-cli. All commands run via `node src/index.js` from the figma-ds-cli project directory.

## Prerequisites

- figma-ds-cli must be installed (`npm install` in the figma-ds-cli directory)
- The CLI must be connected to Figma Desktop. If commands fail, run `node src/index.js connect` first.
- Locate the figma-ds-cli directory by searching for its `src/index.js` or `package.json` with `"name": "figma-ds-cli"`. All commands below assume you `cd` into that directory or use its full path.

---

## Reading Workflow

### 1. Canvas Overview — "What's on the canvas?"

Always start here to get orientation:

```bash
node src/index.js canvas info
```

Returns all top-level frames, their IDs, positions, and sizes. Use this to get node IDs for deeper inspection.

### 2. Find Elements by Name

```bash
node src/index.js find "Button"          # Find by name (partial match)
node src/index.js find "Card" -t FRAME   # Filter by type: FRAME, COMPONENT, TEXT, etc.
```

Returns matching nodes with their IDs. Use returned IDs with `get`, `node tree`, or `export-jsx`.

### 3. Get Node Properties

```bash
node src/index.js get              # Get currently selected node
node src/index.js get "1:234"      # Get specific node by ID
```

Returns fills, strokes, dimensions, layout properties, fonts, and bound variables.

### 4. Inspect Tree Structure

```bash
node src/index.js node tree                  # Tree of current selection
node src/index.js node tree "1:234"          # Tree of specific node
node src/index.js node tree "1:234" -d 5     # Deeper depth (default: 3)
node src/index.js node bindings              # Show which nodes have variable bindings
```

Use to understand the layer hierarchy and composition of complex frames.

### 5. Analyze Design Quality

```bash
node src/index.js analyze colors       # Color usage — hardcoded vs. variable-bound
node src/index.js analyze typography   # Font families, sizes, weights in use
node src/index.js analyze spacing      # Padding/gap values in use
node src/index.js analyze clusters     # Find repeated patterns / components
```

Run these to get a holistic picture of design consistency.

### 6. List Design Variables

```bash
node src/index.js var list             # All variables across all collections
node src/index.js var list -t COLOR    # Filter: COLOR, FLOAT, STRING, BOOLEAN
```

Shows variable names, collection, type, and values. Essential before binding variables.

### 7. XPath Queries — Precise Node Targeting

```bash
node src/index.js raw query "//FRAME"
node src/index.js raw query "//COMPONENT"
node src/index.js raw query "//FRAME[@name='Card']"
node src/index.js raw query "//*[contains(@name, 'Button')]"
node src/index.js raw query "//*[@name^='session-']"    # name starts with
```

Returns matching nodes with IDs. Best for bulk inspection across the whole document.

### 8. Export & Read Design as Code

```bash
node src/index.js export css              # Variables as CSS custom properties
node src/index.js export tailwind         # Variables as Tailwind config
node src/index.js export-jsx "1:234"      # Export node as React JSX
node src/index.js export-jsx "1:234" --pretty    # Formatted JSX
```

Use `export-jsx` to understand how a frame is structured in code terms — very useful for recreating designs.

### 9. Lint & Design Audit

```bash
node src/index.js lint                          # Check all rules
node src/index.js lint --rule color-contrast    # Check specific rule
node src/index.js lint --preset accessibility   # Run accessibility preset
```

Available rules: `no-default-names`, `no-deeply-nested`, `no-empty-frames`, `prefer-auto-layout`, `no-hardcoded-colors`, `color-contrast`, `touch-target-size`, `min-text-size`

Available presets: `recommended`, `strict`, `accessibility`, `design-system`

### 10. Screenshot

```bash
node src/index.js export screenshot -o /tmp/figma-view.png
```

Captures the current canvas view as PNG.

---

## Layer zu CSS — "Baue diesen Layer 1:1 in mein Projekt ein"

This is the most powerful workflow: extract a Figma layer with all visual properties and generate pixel-perfect CSS/HTML.

### Step 1: Identify the target layer

Find the layer by name or ask the user for the node ID:

```bash
node src/index.js find "Hero Section"         # Search by name
node src/index.js canvas info                  # Or list all top-level frames
```

### Step 2: Extract full CSS properties

The `get` command only returns basic info. For full CSS extraction, use the bundled script that reads ALL visual properties (fills, strokes, effects, typography, layout, variable bindings).

First, locate the `extract-css-props.js` script bundled with this skill (in the `scripts/` directory of this plugin). Then run:

```bash
node src/index.js eval "globalThis.__targetNodeId = '1:234'"
node src/index.js eval --file <path-to-plugin>/skills/figma-reader/scripts/extract-css-props.js
```

This returns a complete JSON with:
- **fills** — solid colors (hex), gradients (stops + positions), images
- **strokes** — color, weight, alignment
- **borderRadius** — uniform or per-corner (tl, tr, br, bl)
- **layout** — flexbox direction, gap, padding, alignment, wrap
- **sizingH/sizingV** — FIXED, FILL, or HUG (maps to CSS width/flex)
- **text** — fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textAlign, content
- **effects** — box-shadow (x, y, blur, spread, color), blur, backdrop-blur
- **opacity, rotation, overflow**
- **boundVariables** — which properties use design tokens (use as CSS custom properties)
- **isSvgCandidate** — true for VECTOR, STAR, POLYGON, LINE, BOOLEAN_OPERATION nodes
- **hasImageFill** — true for nodes with image fills (need asset export)
- **componentName/componentId** — for instances, tracks the source component
- **children** — full recursive tree up to 8 levels deep

### Step 3: Get the structural view (optional, for complex layouts)

```bash
node src/index.js export-jsx "1:234" --pretty
```

Shows the frame as React JSX — helps understand the component hierarchy.

### Step 4: Get CSS variables (if design tokens are set up)

```bash
node src/index.js export css
```

Returns all Figma variables as CSS custom properties. Use these in your generated CSS instead of hardcoded values.

### Step 5: Generate CSS

Map the extracted properties to CSS:

| Figma Property | CSS Property |
|---------------|-------------|
| `fills[0].color` | `background-color` (or `background` for gradients) |
| `strokes[0].color` + `strokeWeight` | `border: {weight}px solid {color}` |
| `borderRadius` | `border-radius` |
| `layout.direction: row` | `display: flex; flex-direction: row` |
| `layout.direction: column` | `display: flex; flex-direction: column` |
| `layout.gap` | `gap` |
| `layout.padding` | `padding` |
| `layout.primaryAlign: CENTER` | `justify-content: center` |
| `layout.counterAlign: CENTER` | `align-items: center` |
| `sizingH: FILL` | `width: 100%` or `flex: 1` |
| `sizingH: HUG` | `width: fit-content` |
| `sizingH: FIXED` | `width: {value}px` |
| `text.fontSize` | `font-size` |
| `text.fontFamily` | `font-family` |
| `text.fontWeight` | `font-weight` (map style names: "Bold"=700, "Medium"=500, etc.) |
| `text.lineHeight` | `line-height` |
| `text.letterSpacing` | `letter-spacing` |
| `text.textAlign: LEFT/CENTER/RIGHT` | `text-align` |
| `effects[].type: box-shadow` | `box-shadow: {x}px {y}px {blur}px {spread}px {color}` |
| `effects[].type: box-shadow-inset` | `box-shadow: inset ...` |
| `effects[].type: blur` | `filter: blur({radius}px)` |
| `effects[].type: backdrop-blur` | `backdrop-filter: blur({radius}px)` |
| `opacity` | `opacity` |
| `overflow: hidden` | `overflow: hidden` |
| `rotation` | `transform: rotate({deg}deg)` |
| `boundVariables.fills` → `"primary/500"` | Use `var(--primary-500)` instead of hex |

### Step 6: Write to the user's project

- Read the user's existing CSS/component files to match their conventions (BEM, Tailwind, CSS Modules, styled-components, etc.)
- Use CSS custom properties from `export css` when a Figma variable is bound
- Generate semantic class names based on the Figma layer names
- Include all nested children as nested selectors or sub-components

### Alignment Mapping Reference

| Figma `primaryAxisAlignItems` | CSS `justify-content` |
|---|----|
| `MIN` | `flex-start` |
| `CENTER` | `center` |
| `MAX` | `flex-end` |
| `SPACE_BETWEEN` | `space-between` |

| Figma `counterAxisAlignItems` | CSS `align-items` |
|---|----|
| `MIN` | `flex-start` |
| `CENTER` | `center` |
| `MAX` | `flex-end` |
| `BASELINE` | `baseline` |

### Font Weight Mapping

| Figma Style | CSS `font-weight` |
|---|---|
| Thin | 100 |
| ExtraLight / UltraLight | 200 |
| Light | 300 |
| Regular / Normal | 400 |
| Medium | 500 |
| SemiBold / DemiBold | 600 |
| Bold | 700 |
| ExtraBold / UltraBold | 800 |
| Black / Heavy | 900 |

---

## SVG & Asset Extraction — "Icons und Grafiken als Code einbauen"

When `extract-css-props.js` flags a node with `isSvgCandidate: true` or `hasImageFill: true`, those elements can't be replicated purely with CSS — they need to be exported as assets.

### Extracting SVG (Vectors, Icons, Logos, Shapes)

Export any node as inline SVG code using the bundled `extract-svg.js` script:

```bash
node src/index.js eval "globalThis.__targetNodeId = '1:234'"
node src/index.js eval --file <path-to-plugin>/skills/figma-reader/scripts/extract-svg.js
```

Returns JSON with `{ svg: "<svg ...>...</svg>", name, width, height }`. The SVG string can be:
- **Inlined directly** in HTML/JSX as `<svg>` element
- **Saved as `.svg` file** in the user's assets directory
- **Used as CSS** via `background-image: url("data:image/svg+xml,...")` or `mask-image`
- **Converted to React component** — wrap in a functional component

### Exporting PNG/Images (for image fills, photos, raster graphics)

```bash
node src/index.js raw export "1:234" --scale 2           # Export at 2x as PNG
node src/index.js raw export "1:234" --scale 2 --suffix "_dark"  # With suffix
```

Save the exported file to the user's project assets directory.

### Full Layer-to-Code Decision Tree

When processing the JSON from `extract-css-props.js`, handle each node type:

```
Node type?
├── FRAME / RECTANGLE / ELLIPSE (no image fill)
│   └── Generate CSS (background, border, border-radius, flexbox, etc.)
│
├── TEXT
│   └── Generate CSS (font-family, font-size, color, etc.) + HTML text content
│
├── VECTOR / STAR / POLYGON / LINE / BOOLEAN_OPERATION  (isSvgCandidate: true)
│   └── Extract SVG via extract-svg.js → inline <svg> or save as .svg asset
│
├── INSTANCE
│   └── Check componentName → reuse existing component if already created
│
├── Node with hasImageFill: true
│   └── Export as PNG via raw export → save to assets → use as <img> or background-image
│
└── GROUP
    └── Generate wrapper <div> → recurse into children
```

### Integrating Assets into the Project

1. **Identify the asset directory** — Read the project structure to find where assets live (e.g., `public/`, `src/assets/`, `static/`)
2. **Save SVGs** — Write inline SVG files or create React SVG components
3. **Save PNGs** — Export at 2x scale, save to assets directory
4. **Reference in CSS/HTML** — Use relative paths matching the project's convention
5. **Optimize SVGs** — Remove unnecessary attributes (Figma exports are verbose); strip `xmlns` if inlining in HTML5

---

## Common Read Workflows

### "Was ist gerade auf dem Canvas?" / "What's on the canvas?"
```bash
node src/index.js canvas info
```

### "Wie sieht der Frame X aus?" / "Inspect a frame"
```bash
node src/index.js find "X"                         # Get ID
node src/index.js node tree "<ID>" -d 5            # Full layer tree
node src/index.js get "<ID>"                       # Properties
node src/index.js export-jsx "<ID>" --pretty       # As JSX
```

### "Welche Farben werden verwendet?" / "Analyze colors"
```bash
node src/index.js analyze colors
node src/index.js var list -t COLOR
```

### "Welche Variablen gibt es?" / "Show variables"
```bash
node src/index.js var list
```

### "Gibt es Accessibility-Probleme?" / "Check accessibility"
```bash
node src/index.js lint --preset accessibility
```

### "Zeig mir alle Komponenten" / "List all components"
```bash
node src/index.js raw query "//COMPONENT"
```

### "Baue Layer X als CSS in mein Projekt ein" / "Recreate layer as CSS"
```bash
node src/index.js find "Layer Name"                                          # 1. Get node ID
node src/index.js eval "globalThis.__targetNodeId = '<ID>'"                  # 2. Set target
node src/index.js eval --file <path-to-plugin>/skills/figma-reader/scripts/extract-css-props.js  # 3. Extract all props
node src/index.js export css                                                 # 4. Get CSS variables
```
Then: Generate CSS from the extracted JSON, matching the user's project conventions. Read existing CSS files first to match the style. For nodes with `isSvgCandidate` or `hasImageFill`, also run the SVG/asset extraction.

### "Exportiere das Icon als SVG" / "Get SVG code for this element"
```bash
node src/index.js eval "globalThis.__targetNodeId = '<ID>'"
node src/index.js eval --file <path-to-plugin>/skills/figma-reader/scripts/extract-svg.js
```
Returns inline SVG code. Save to project assets or inline in HTML/JSX.

---

## Interpreting Results

- **Node IDs** (e.g., `1:234`) — Use to target specific nodes in follow-up commands
- **`boundVariables`** in `get` output — Shows which properties use design tokens
- **`analyze colors`** output — Flags hardcoded hex values (should become variables)
- **`lint` output** — Design rule violations with severity levels

## Tip: Read Before You Write

Before modifying or creating elements, always read the current state first:
1. `canvas info` → understand what exists
2. `node tree "<ID>"` → understand structure of relevant frame
3. `var list` → know which variables are available for binding

See `references/commands.md` for the complete command reference with all flags.
