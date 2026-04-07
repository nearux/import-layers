export interface LayerInfo {
  layer: string;
  slice: string | null;
}

export function extractLayerInfo(
  filePath: string,
  layers: string[],
): LayerInfo | null {
  // Normalize Windows backslashes to forward slashes
  const segments = filePath.replace(/\\/g, "/").split("/");

  // Find the first segment that matches a layer name
  const layerIndex = segments.findIndex((seg) => layers.includes(seg));
  if (layerIndex === -1) {
    return null;
  }

  const layer = segments[layerIndex];
  const slice = segments[layerIndex + 1] ?? null;

  // If the slice looks like a file (has extension), treat as no slice
  if (slice !== null && slice.includes(".")) {
    return { layer, slice: null };
  }

  return { layer, slice };
}
