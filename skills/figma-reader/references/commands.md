# Figma Reader — Full Command Reference

All commands: `node src/index.js <command>` from `/Users/kai.nottrodt/Downloads/figma-cli-main`

## Canvas & Selection

| Command | What it returns |
|---------|----------------|
| `canvas info` | All top-level frames: ID, name, x, y, width, height |
| `canvas next` | Next free position for placing a new frame |
| `get` | Properties of currently selected node |
| `get "1:234"` | Properties of node by ID |
| `select "1:234"` | Select a node (makes it active in Figma) |

## Find

| Command | What it returns |
|---------|----------------|
| `find "Name"` | Nodes whose name contains "Name" |
| `find "Name" -t FRAME` | Filter by type |
| `find "Name" -t COMPONENT` | Only components |
| `find "Name" -t TEXT` | Only text nodes |

Node types: `FRAME`, `COMPONENT`, `COMPONENT_SET`, `INSTANCE`, `TEXT`, `RECTANGLE`, `ELLIPSE`, `GROUP`, `VECTOR`, `LINE`

## Tree & Bindings

| Command | What it returns |
|---------|----------------|
| `node tree` | Layer tree of current selection (depth 3) |
| `node tree "1:234"` | Layer tree of node |
| `node tree "1:234" -d 8` | Deeper tree (up to 8 levels) |
| `node bindings` | Which nodes have variable bindings |

## Variables

| Command | What it returns |
|---------|----------------|
| `var list` | All variables (name, collection, type, value) |
| `var list -t COLOR` | Only color variables |
| `var list -t FLOAT` | Only number variables (spacing, radius) |
| `var list -t STRING` | Only string variables |

## Analyze

| Command | What it returns |
|---------|----------------|
| `analyze colors` | All colors in use, hardcoded vs. variable-bound |
| `analyze typography` | Font families, sizes, weights |
| `analyze spacing` | Padding and gap values in use |
| `analyze clusters` | Repeated patterns that could be components |

## XPath Queries

```bash
node src/index.js raw query "//FRAME"
node src/index.js raw query "//COMPONENT"
node src/index.js raw query "//TEXT"
node src/index.js raw query "//FRAME[@name='Card']"           # Exact name match
node src/index.js raw query "//*[contains(@name, 'Button')]"  # Name contains
node src/index.js raw query "//*[@name^='session-']"          # Name starts with
node src/index.js raw query "//FRAME//TEXT"                   # Text inside frames
```

## Export / Read as Code

| Command | What it returns |
|---------|----------------|
| `export css` | Design variables as CSS custom properties |
| `export tailwind` | Design variables as Tailwind config JS |
| `export-jsx "1:234"` | Node as React JSX (compact) |
| `export-jsx "1:234" --pretty` | Node as React JSX (formatted) |
| `export-jsx "1:234" -o Card.jsx` | Save JSX to file |
| `export screenshot -o out.png` | Screenshot of current view |

## Lint

| Command | What it checks |
|---------|---------------|
| `lint` | All rules |
| `lint --rule no-default-names` | Nodes still named "Frame 1", "Rectangle", etc. |
| `lint --rule no-deeply-nested` | Excessive nesting |
| `lint --rule no-empty-frames` | Empty frames |
| `lint --rule prefer-auto-layout` | Groups that could be auto-layout |
| `lint --rule no-hardcoded-colors` | Colors not using variables |
| `lint --rule color-contrast` | Accessibility: contrast ratio |
| `lint --rule touch-target-size` | Accessibility: tap target too small |
| `lint --rule min-text-size` | Accessibility: text too small |
| `lint --preset recommended` | Recommended rule set |
| `lint --preset strict` | All rules |
| `lint --preset accessibility` | Accessibility-focused rules |
| `lint --preset design-system` | Design system consistency rules |

## Eval (raw JavaScript)

For reading data not covered by dedicated commands:

```bash
node src/index.js eval "figma.currentPage.name"
node src/index.js eval "figma.currentPage.children.length"
node src/index.js eval "figma.getNodeById('1:234').name"
node src/index.js eval "figma.variables.getLocalVariableCollections().map(c => c.name)"
```
