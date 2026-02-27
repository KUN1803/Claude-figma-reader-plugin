// Extract all CSS-relevant properties from a Figma node and its children
// Usage: node src/index.js eval --file .claude/skills/figma-reader/scripts/extract-css-props.js
// Set NODE_ID before running: node src/index.js eval "globalThis.__targetNodeId = '1:234'"
// Then: node src/index.js eval --file .claude/skills/figma-reader/scripts/extract-css-props.js

(function() {
  const nodeId = globalThis.__targetNodeId;
  if (!nodeId) return JSON.stringify({ error: 'Set globalThis.__targetNodeId first' });

  const node = figma.getNodeById(nodeId);
  if (!node) return JSON.stringify({ error: 'Node not found: ' + nodeId });

  function rgbToHex(r, g, b) {
    const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function extractFill(fills) {
    if (!fills || !Array.isArray(fills) || fills.length === 0) return null;
    const visible = fills.filter(f => f.visible !== false);
    return visible.map(f => {
      if (f.type === 'SOLID') {
        const hex = rgbToHex(f.color.r, f.color.g, f.color.b);
        return { type: 'solid', color: hex, opacity: f.opacity ?? 1 };
      }
      if (f.type === 'GRADIENT_LINEAR' || f.type === 'GRADIENT_RADIAL') {
        return {
          type: f.type.toLowerCase().replace('gradient_', '') + '-gradient',
          stops: f.gradientStops?.map(s => ({
            color: rgbToHex(s.color.r, s.color.g, s.color.b),
            opacity: s.color.a ?? 1,
            position: s.position
          }))
        };
      }
      if (f.type === 'IMAGE') {
        return { type: 'image', scaleMode: f.scaleMode };
      }
      return { type: f.type };
    });
  }

  function extractEffects(effects) {
    if (!effects || effects.length === 0) return null;
    return effects.filter(e => e.visible !== false).map(e => {
      if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
        return {
          type: e.type === 'DROP_SHADOW' ? 'box-shadow' : 'box-shadow-inset',
          x: e.offset?.x ?? 0,
          y: e.offset?.y ?? 0,
          blur: e.radius ?? 0,
          spread: e.spread ?? 0,
          color: rgbToHex(e.color.r, e.color.g, e.color.b),
          opacity: e.color.a ?? 1
        };
      }
      if (e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR') {
        return { type: e.type === 'LAYER_BLUR' ? 'blur' : 'backdrop-blur', radius: e.radius };
      }
      return { type: e.type };
    });
  }

  function extractBoundVars(n) {
    if (!n.boundVariables) return null;
    const bindings = {};
    for (const [prop, binding] of Object.entries(n.boundVariables)) {
      const b = Array.isArray(binding) ? binding[0] : binding;
      if (b && b.id) {
        try {
          const v = figma.variables.getVariableById(b.id);
          if (v) bindings[prop] = v.name;
        } catch(e) {}
      }
    }
    return Object.keys(bindings).length > 0 ? bindings : null;
  }

  function extractNode(n, depth) {
    if (depth > 8) return { id: n.id, name: n.name, type: n.type, truncated: true };

    const result = {
      id: n.id,
      name: n.name,
      type: n.type,
      width: Math.round(n.width),
      height: Math.round(n.height),
      x: Math.round(n.x),
      y: Math.round(n.y)
    };

    // Visibility & opacity
    if (n.visible === false) result.visible = false;
    if (n.opacity !== undefined && n.opacity !== 1) result.opacity = n.opacity;
    if (n.rotation) result.rotation = n.rotation;

    // Fills & strokes
    const fills = extractFill(n.fills);
    if (fills) result.fills = fills;

    if (n.strokes && n.strokes.length > 0) {
      result.strokes = extractFill(n.strokes);
      result.strokeWeight = n.strokeWeight;
      result.strokeAlign = n.strokeAlign;
    }

    // Corner radius
    if (n.cornerRadius !== undefined && n.cornerRadius > 0) {
      result.borderRadius = n.cornerRadius;
    }
    if (n.topLeftRadius || n.topRightRadius || n.bottomLeftRadius || n.bottomRightRadius) {
      result.borderRadii = {
        tl: n.topLeftRadius || 0,
        tr: n.topRightRadius || 0,
        br: n.bottomRightRadius || 0,
        bl: n.bottomLeftRadius || 0
      };
    }

    // Auto-layout (= CSS flexbox)
    if (n.layoutMode && n.layoutMode !== 'NONE') {
      result.layout = {
        direction: n.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
        gap: n.itemSpacing ?? 0,
        padding: {
          top: n.paddingTop ?? 0,
          right: n.paddingRight ?? 0,
          bottom: n.paddingBottom ?? 0,
          left: n.paddingLeft ?? 0
        },
        primaryAlign: n.primaryAxisAlignItems,
        counterAlign: n.counterAxisAlignItems,
        wrap: n.layoutWrap === 'WRAP'
      };
    }

    // Sizing
    if (n.layoutSizingHorizontal) result.sizingH = n.layoutSizingHorizontal;
    if (n.layoutSizingVertical) result.sizingV = n.layoutSizingVertical;

    // Overflow
    if (n.clipsContent) result.overflow = 'hidden';

    // Vector/SVG nodes — flag for SVG export
    if (['VECTOR', 'STAR', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'].includes(n.type)) {
      result.isSvgCandidate = true;
      result.exportHint = 'Use exportSVG to get inline SVG code for this node';
    }

    // Instances & components — track the original
    if (n.type === 'INSTANCE' && n.mainComponent) {
      result.componentName = n.mainComponent.name;
      result.componentId = n.mainComponent.id;
    }

    // Image fills — flag for asset export
    if (n.fills && Array.isArray(n.fills)) {
      const hasImage = n.fills.some(f => f.visible !== false && f.type === 'IMAGE');
      if (hasImage) {
        result.hasImageFill = true;
        result.exportHint = 'Use raw export to get this as PNG/SVG asset';
      }
    }

    // Text properties
    if (n.type === 'TEXT') {
      result.text = {
        content: n.characters,
        fontSize: n.fontSize,
        fontFamily: n.fontName?.family,
        fontWeight: n.fontName?.style,
        lineHeight: n.lineHeight?.value !== undefined ? n.lineHeight : null,
        letterSpacing: n.letterSpacing?.value !== undefined ? n.letterSpacing : null,
        textAlign: n.textAlignHorizontal,
        verticalAlign: n.textAlignVertical,
        textDecoration: n.textDecoration !== 'NONE' ? n.textDecoration : null,
        textCase: n.textCase !== 'ORIGINAL' ? n.textCase : null
      };
    }

    // Effects (shadows, blurs)
    const effects = extractEffects(n.effects);
    if (effects) result.effects = effects;

    // Variable bindings
    const vars = extractBoundVars(n);
    if (vars) result.boundVariables = vars;

    // Children
    if (n.children && n.children.length > 0) {
      result.children = n.children.map(c => extractNode(c, depth + 1));
    }

    return result;
  }

  return JSON.stringify(extractNode(node, 0), null, 2);
})()
