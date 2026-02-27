// Export a Figma node as inline SVG code
// Usage:
//   node src/index.js eval "globalThis.__targetNodeId = '1:234'"
//   node src/index.js eval --file .claude/skills/figma-reader/scripts/extract-svg.js
//
// Returns: { svg: "<svg ...>...</svg>", width, height, name }

(async function() {
  const nodeId = globalThis.__targetNodeId;
  if (!nodeId) return JSON.stringify({ error: 'Set globalThis.__targetNodeId first' });

  const node = figma.getNodeById(nodeId);
  if (!node) return JSON.stringify({ error: 'Node not found: ' + nodeId });

  try {
    const bytes = await node.exportAsync({ format: 'SVG' });
    const svg = String.fromCharCode.apply(null, bytes);

    return JSON.stringify({
      name: node.name,
      id: node.id,
      type: node.type,
      width: Math.round(node.width),
      height: Math.round(node.height),
      svg: svg
    });
  } catch (e) {
    return JSON.stringify({ error: 'SVG export failed: ' + e.message, nodeId: nodeId });
  }
})()
