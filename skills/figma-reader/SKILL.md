---
name: figma-reader
description: Use this skill whenever the user wants to read, inspect, analyze, or understand what's in their Figma file, OR wants to recreate a Figma layer/frame as CSS/HTML in their project, OR wants to extract SVGs/icons/assets from Figma. Triggers for requests like "was ist auf dem canvas", "zeig mir das Design", "analysiere die Farben/Typografie/Abstände", "welche Nodes gibt es", "lese den Frame", "what's on the canvas", "analyze the design", "inspect this component", "show me the variables", "what fonts are used", "read the figma file", "show tree structure", "find element named X", "what does node X look like", "export as JSX", "check design quality", "lint the design", "baue den Layer als CSS ein", "recreate this layer in CSS", "convert frame to HTML/CSS", "übernimm das Design in mein Projekt", "mach daraus CSS", "layer zu code", "design to code", "exportiere das SVG", "extract the icon", "hole die Grafik als SVG", "get the SVG code", "export icon as SVG", "save as SVG". Always use this skill before creating or modifying anything so you understand the current state first.
version: 2.0.0
---

# Figma Reader Skill

This skill reads, inspects, and analyzes Figma designs using a **bundled figma-ds-cli** — no separate installation needed.

## Setup (automatic, first use only)

The CLI is bundled at `<plugin-dir>/cli/`. Before running any command, ensure dependencies are installed:

```bash
# Locate this plugin's directory (find the plugin.json)
PLUGIN_DIR="$(dirname "$(find ~/.claude/plugins -path '*/figma-reader/.claude-plugin/plugin.json' -o -path '*/figma-reader-plugin/.claude-plugin/plugin.json' 2>/dev/null | head -1)" 2>/dev/null)"

# If not found via plugins cache, check if running from the repo directly
if [ -z "$PLUGIN_DIR" ]; then
  PLUGIN_DIR="$(find ~ -maxdepth 4 -name 'plugin.json' -path '*/figma-reader*/.claude-plugin/*' 2>/dev/null | head -1 | xargs dirname | xargs dirname)"
fi

# Install deps if needed (silent, only runs once)
if [ ! -d "$PLUGIN_DIR/cli/node_modules" ]; then
  cd "$PLUGIN_DIR/cli" && npm install --production --silent
fi
```

After setup, define the CLI shorthand used in all commands below:

```bash
FIGMA_CLI="node $PLUGIN_DIR/cli/src/index.js"
SCRIPTS_DIR="$PLUGIN_DIR/skills/figma-reader/scripts"
```

## Prerequisites

- **Figma Desktop** must be running
- **Connect once**: `$FIGMA_CLI connect` (Yolo mode, patches Figma once) or `$FIGMA_CLI connect --safe` (Safe mode, no patching)
- **Node.js 18+** must be installed

---

## Reading Workflow

### 1. Canvas Overview — "What's on the canvas?"

Always start here to get orientation:

```bash
$FIGMA_CLI canvas info
```

Returns all top-level frames, their IDs, positions, and sizes.

### 2. Find Elements by Name

```bash
$FIGMA_CLI find "Button"          # Find by name (partial match)
$FIGMA_CLI find "Card" -t FRAME   # Filter by type: FRAME, COMPONENT, TEXT, etc.
```

### 3. Get Node Properties

```bash
$FIGMA_CLI get              # Get currently selected node
$FIGMA_CLI get "1:234"      # Get specific node by ID
```

### 4. Inspect Tree Structure

```bash
$FIGMA_CLI node tree                  # Tree of current selection
$FIGMA_CLI node tree "1:234"          # Tree of specific node
$FIGMA_CLI node tree "1:234" -d 5     # Deeper depth (default: 3)
$FIGMA_CLI node bindings              # Show which nodes have variable bindings
```

### 5. Analyze Design Quality

```bash
$FIGMA_CLI analyze colors       # Color usage — hardcoded vs. variable-bound
$FIGMA_CLI analyze typography   # Font families, sizes, weights in use
$FIGMA_CLI analyze spacing      # Padding/gap values in use
$FIGMA_CLI analyze clusters     # Find repeated patterns / components
```

### 6. List Design Variables

```bash
$FIGMA_CLI var list             # All variables across all collections
$FIGMA_CLI var list -t COLOR    # Filter: COLOR, FLOAT, STRING, BOOLEAN
```

### 7. XPath Queries — Precise Node Targeting

```bash
$FIGMA_CLI raw query "//FRAME"
$FIGMA_CLI raw query "//COMPONENT"
$FIGMA_CLI raw query "//FRAME[@name='Card']"
$FIGMA_CLI raw query "//*[contains(@name, 'Button')]"
```

### 8. Export & Read Design as Code

```bash
$FIGMA_CLI export css              # Variables as CSS custom properties
$FIGMA_CLI export tailwind         # Variables as Tailwind config
$FIGMA_CLI export-jsx "1:234"      # Export node as React JSX
$FIGMA_CLI export-jsx "1:234" --pretty
```

### 9. Lint & Design Audit

```bash
$FIGMA_CLI lint                          # Check all rules
$FIGMA_CLI lint --rule color-contrast    # Check specific rule
$FIGMA_CLI lint --preset accessibility   # Run accessibility preset
```

Rules: `no-default-names`, `no-deeply-nested`, `no-empty-frames`, `prefer-auto-layout`, `no-hardcoded-colors`, `color-contrast`, `touch-target-size`, `min-text-size`

Presets: `recommended`, `strict`, `accessibility`, `design-system`

### 10. Screenshot

```bash
$FIGMA_CLI export screenshot -o /tmp/figma-view.png
```

---

## Layer zu CSS — "Baue diesen Layer 1:1 in mein Projekt ein"

Extract a Figma layer with all visual properties and generate pixel-perfect CSS/HTML.

### Step 1: Identify the target layer

```bash
$FIGMA_CLI find "Hero Section"
$FIGMA_CLI canvas info
```

### Step 2: Extract full CSS properties

```bash
$FIGMA_CLI eval "globalThis.__targetNodeId = '1:234'"
$FIGMA_CLI eval --file "$SCRIPTS_DIR/extract-css-props.js"
```

Returns complete JSON with:
- **fills** — solid colors (hex), gradients, images
- **strokes** — color, weight, alignment
- **borderRadius** — uniform or per-corner
- **layout** — flexbox direction, gap, padding, alignment, wrap
- **sizingH/sizingV** — FIXED, FILL, HUG
- **text** — fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textAlign, content
- **effects** — box-shadow, blur, backdrop-blur
- **opacity, rotation, overflow**
- **boundVariables** — design tokens (use as CSS custom properties)
- **isSvgCandidate** — true for VECTOR, STAR, POLYGON, LINE nodes
- **hasImageFill** — true for nodes with image fills
- **componentName/componentId** — for instances
- **children** — recursive tree up to 8 levels deep

### Step 3: Structural view (optional)

```bash
$FIGMA_CLI export-jsx "1:234" --pretty
```

### Step 4: CSS variables

```bash
$FIGMA_CLI export css
```

### Step 5: Generate CSS

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
| `text.fontWeight` | `font-weight` (Bold=700, Medium=500, etc.) |
| `text.lineHeight` | `line-height` |
| `text.letterSpacing` | `letter-spacing` |
| `effects[].type: box-shadow` | `box-shadow: {x}px {y}px {blur}px {spread}px {color}` |
| `effects[].type: blur` | `filter: blur({radius}px)` |
| `effects[].type: backdrop-blur` | `backdrop-filter: blur({radius}px)` |
| `opacity` | `opacity` |
| `overflow: hidden` | `overflow: hidden` |
| `rotation` | `transform: rotate({deg}deg)` |
| `boundVariables.fills` → `"primary/500"` | Use `var(--primary-500)` instead of hex |

### Step 6: Write to user's project

- Read existing CSS/component files to match conventions (BEM, Tailwind, CSS Modules, etc.)
- Use CSS custom properties from `export css` when Figma variable is bound
- Generate semantic class names based on Figma layer names

### Alignment Mapping

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
| ExtraLight | 200 |
| Light | 300 |
| Regular | 400 |
| Medium | 500 |
| SemiBold | 600 |
| Bold | 700 |
| ExtraBold | 800 |
| Black | 900 |

---

## SVG & Asset Extraction — "Icons und Grafiken als Code einbauen"

When `extract-css-props.js` flags `isSvgCandidate: true` or `hasImageFill: true`, export as assets.

### Extract SVG

```bash
$FIGMA_CLI eval "globalThis.__targetNodeId = '1:234'"
$FIGMA_CLI eval --file "$SCRIPTS_DIR/extract-svg.js"
```

Returns `{ svg: "<svg ...>...</svg>", name, width, height }`.

### Export PNG

```bash
$FIGMA_CLI raw export "1:234" --scale 2
```

### Layer-to-Code Decision Tree

```
Node type?
├── FRAME / RECTANGLE / ELLIPSE  → Generate CSS
├── TEXT                         → CSS + HTML text content
├── VECTOR / STAR / POLYGON / LINE (isSvgCandidate) → Extract SVG
├── INSTANCE                     → Reuse component if exists
├── hasImageFill: true           → Export PNG → <img> or background-image
└── GROUP                        → Wrapper <div> → recurse children
```

---

## Common Read Workflows

### "Was ist auf dem Canvas?"
```bash
$FIGMA_CLI canvas info
```

### "Inspiziere Frame X"
```bash
$FIGMA_CLI find "X"
$FIGMA_CLI node tree "<ID>" -d 5
$FIGMA_CLI get "<ID>"
$FIGMA_CLI export-jsx "<ID>" --pretty
```

### "Analysiere die Farben"
```bash
$FIGMA_CLI analyze colors
$FIGMA_CLI var list -t COLOR
```

### "Zeig mir alle Komponenten"
```bash
$FIGMA_CLI raw query "//COMPONENT"
```

### "Baue Layer X als CSS ein"
```bash
$FIGMA_CLI find "Layer Name"
$FIGMA_CLI eval "globalThis.__targetNodeId = '<ID>'"
$FIGMA_CLI eval --file "$SCRIPTS_DIR/extract-css-props.js"
$FIGMA_CLI export css
```
Then generate CSS from the JSON. For `isSvgCandidate`/`hasImageFill` nodes, also run SVG/asset extraction.

### "Exportiere das Icon als SVG"
```bash
$FIGMA_CLI eval "globalThis.__targetNodeId = '<ID>'"
$FIGMA_CLI eval --file "$SCRIPTS_DIR/extract-svg.js"
```

---

## Interpreting Results

- **Node IDs** (e.g., `1:234`) — target specific nodes in follow-up commands
- **`boundVariables`** — shows which properties use design tokens
- **`analyze colors`** — flags hardcoded hex values
- **`lint`** — design rule violations with severity

## Tip: Read Before You Write

1. `canvas info` → what exists
2. `node tree "<ID>"` → structure of relevant frame
3. `var list` → available variables for binding

See `references/commands.md` for the complete command reference.
