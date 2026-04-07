# eslint-plugin-import-layers

An ESLint plugin that enforces **layer-based import direction** for layered architectures (FSD, custom layer structures, etc.).

**Core value: Just provide a `layers` array and all rules are automatically applied.**

```js
"import-layers/layers": ["error", {
  layers: ["domains", "features", "shared"]
}]
```

## Installation

```bash
npm install --save-dev eslint-plugin-import-layers
```

## Configuration

### ESLint 9+ (Flat Config)

```js
// eslint.config.js
import importLayers from "eslint-plugin-import-layers";

export default [
  {
    plugins: { "import-layers": importLayers },
    rules: {
      "import-layers/layers": [
        "error",
        {
          layers: ["domains", "features", "shared"],
          aliases: { "@": "src" },
        },
      ],
    },
  },
];
```

### ESLint 8 (Legacy Config)

```json
// .eslintrc.json
{
  "plugins": ["import-layers"],
  "rules": {
    "import-layers/layers": [
      "error",
      {
        "layers": ["domains", "features", "shared"],
        "aliases": { "@": "src" }
      }
    ]
  }
}
```

## Rules

The `layers` array treats **earlier items as upper layers and later items as lower layers**.

```js
layers: ["domains", "features", "shared"];
// domains(0) > features(1) > shared(2)
```

### 1. No upper-layer imports

A lower layer cannot import from an upper layer.

```js
// ❌ features(1) importing from domains(0)
import { UserEntity } from "@/domains/user"; // in features/auth/...

// ✅ features(1) importing from shared(2)
import { Button } from "@/shared/ui"; // in features/auth/...
```

### 2. No cross-slice imports within the same layer

Different slices within the same layer cannot import from each other.

```js
// ❌ features/auth importing from features/cart
import { CartItem } from "@/features/cart"; // in features/auth/...

// ✅ Relative imports within the same slice are allowed
import { validate } from "./utils"; // in features/auth/...
```

> **Note:** These rules apply to all import forms — `import`, `export ... from`, dynamic `import()`, and `require()`.

## Options

```ts
interface Options {
  // Layer list. Earlier = upper layer, later = lower layer. (required)
  layers: string[];

  // Path alias mapping.
  // @default {}
  aliases?: Record<string, string>;

  // Automatically read tsconfig.json paths for alias resolution.
  // When true, the aliases option is ignored.
  // @default false
  autoReadTsConfig?: boolean;

  // Import pairs to allow as exceptions to the rules.
  // @default []
  allowedImports?: Array<{ from: string; to: string }>;

  // Layers where cross-slice imports are permitted.
  // @default []
  allowCrossSlice?: string[];
}
```

### Example: Allowing exceptions

```js
"import-layers/layers": [
  "error",
  {
    layers: ["domains", "features", "shared"],
    aliases: { "@": "src" },
    allowedImports: [
      { from: "features/auth", to: "features/user" },
    ],
  },
]
```

### Example: Allowing cross-slice imports for specific layers

```js
"import-layers/layers": [
  "error",
  {
    layers: ["domains", "features", "shared"],
    aliases: { "@": "src" },
    allowCrossSlice: ["features"],
  },
]
```

### Example: Auto-read tsconfig paths

```js
"import-layers/layers": [
  "error",
  {
    layers: ["domains", "features", "shared"],
    autoReadTsConfig: true,
  },
]
```

## Error Messages

Errors include actionable guidance, not just violation notices.

```
'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.
```

```
Within 'features' layer, 'auth' cannot import from 'cart'. If this dependency is unavoidable, add an exception to allowedImports.
```

## License

MIT
