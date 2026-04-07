// src/index.ts
import { layersRule } from "./rules/layers";

const plugin = {
  meta: {
    name: "eslint-plugin-import-layers",
    version: "0.0.1",
  },
  rules: {
    layers: layersRule,
  },
};

// ESM
export default plugin;
// CJS compat — named exports so require() gets rules at top level
export const meta = plugin.meta;
export const rules = plugin.rules;
