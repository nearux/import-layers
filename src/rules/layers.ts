// src/rules/layers.ts
import path from "node:path";
import type { Rule } from "eslint";
import { resolveAlias } from "../utils/resolveAlias";
import { extractLayerInfo } from "../utils/extractLayerInfo";
import { readTsConfigPaths } from "../utils/readTsConfig";

interface Options {
  layers: string[];
  autoReadTsConfig?: boolean;
  aliases?: Record<string, string>;
  allowedImports?: Array<{ from: string; to: string }>;
}

export const layersRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce layer-based import direction",
    },
    schema: [
      {
        type: "object",
        properties: {
          layers: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
          autoReadTsConfig: { type: "boolean" },
          aliases: {
            type: "object",
            additionalProperties: { type: "string" },
          },
          allowedImports: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
              },
              required: ["from", "to"],
              additionalProperties: false,
            },
          },
        },
        required: ["layers"],
        additionalProperties: false,
      },
    ],
    messages: {
      upperLayer:
        "'{{fromLayer}}' cannot import from upper layer '{{toLayer}}'. If this dependency is unavoidable, add an exception to allowedImports.",
      crossSlice:
        "Within '{{layer}}' layer, '{{fromSlice}}' cannot import from '{{toSlice}}'. If this dependency is unavoidable, add an exception to allowedImports.",
    },
  },
  create(context) {
    const options: Options = context.options[0] || { layers: [] };
    const { layers, allowedImports = [] } = options;

    let aliases: Record<string, string> = options.aliases ?? {};
    if (options.autoReadTsConfig) {
      aliases = readTsConfigPaths(context.cwd ?? process.cwd());
    }

    function check(node: any) {
      const source = node.source;
      if (!source || typeof source.value !== "string") return;

      const importPath = source.value;
      const currentFilePath = context.filename ?? context.getFilename();

      let resolvedImport: string;
      if (importPath.startsWith(".")) {
        // Resolve relative path against current file's directory
        resolvedImport = path.resolve(path.dirname(currentFilePath), importPath);
      } else {
        // Resolve alias for import target
        resolvedImport = resolveAlias(importPath, aliases);
      }

      // Extract layer info for both current file and import target
      const fromInfo = extractLayerInfo(currentFilePath, layers);
      const toInfo = extractLayerInfo(resolvedImport, layers);

      // Skip if either side is not in a layer
      if (!fromInfo || !toInfo) return;

      const fromIndex = layers.indexOf(fromInfo.layer);
      const toIndex = layers.indexOf(toInfo.layer);

      const fromPath = fromInfo.slice
        ? `${fromInfo.layer}/${fromInfo.slice}`
        : fromInfo.layer;
      const toPath = toInfo.slice
        ? `${toInfo.layer}/${toInfo.slice}`
        : toInfo.layer;

      // Check allowedImports exception
      const isAllowed = allowedImports.some(
        (allowed) => allowed.from === fromPath && allowed.to === toPath,
      );
      if (isAllowed) return;

      // Rule 1: No importing upper layers (lower index = higher layer)
      if (fromIndex > toIndex) {
        context.report({
          node,
          messageId: "upperLayer",
          data: {
            fromLayer: fromInfo.layer,
            toLayer: toInfo.layer,
          },
        });
        return;
      }

      // Rule 2: No cross-slice imports within same layer
      if (
        fromInfo.layer === toInfo.layer &&
        fromInfo.slice !== null &&
        toInfo.slice !== null &&
        fromInfo.slice !== toInfo.slice
      ) {
        context.report({
          node,
          messageId: "crossSlice",
          data: {
            layer: fromInfo.layer,
            fromSlice: fromInfo.slice,
            toSlice: toInfo.slice,
          },
        });
      }
    }

    function checkCallExpression(node: any) {
      // Handle require("...") and import("...")
      const { callee, arguments: args } = node;
      if (!args || args.length === 0) return;

      const isRequire =
        callee.type === "Identifier" && callee.name === "require";
      const isImport = callee.type === "Import" || node.type === "ImportExpression";

      if (!isRequire && !isImport) return;

      const arg = args?.[0] ?? node.source;
      if (!arg || arg.type !== "Literal" || typeof arg.value !== "string") return;

      // Reuse check logic by creating a fake node with source
      check({ ...node, source: arg });
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      CallExpression: checkCallExpression,
      ImportExpression(node: any) {
        const source = node.source;
        if (!source || source.type !== "Literal" || typeof source.value !== "string") return;
        check({ ...node, source });
      },
    };
  },
};
