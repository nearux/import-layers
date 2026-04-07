// tests/layers.test.ts
import { RuleTester } from "eslint";
import { describe } from "vitest";
import { layersRule } from "../src/rules/layers";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const defaultOptions = [
  {
    layers: ["domains", "features", "shared"],
    aliases: { "@": "src" },
  },
];

describe("layers rule", () => {
  ruleTester.run("layers", layersRule, {
    valid: [
      // Upper layer importing from lower layer
      {
        code: 'import { Button } from "@/shared/ui";',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
      },
      // Same slice relative import
      {
        code: 'import { validate } from "./utils";',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
      },
      // External package
      {
        code: 'import React from "react";',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
      },
      // File not in any layer
      {
        code: 'import { config } from "@/features/auth";',
        filename: "src/app/main.ts",
        options: defaultOptions,
      },
      // Import target not in any layer
      {
        code: 'import { helper } from "@/lib/utils";',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
      },
    ],
    invalid: [
      // Lower layer importing upper layer
      {
        code: 'import { UserEntity } from "@/domains/user";',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
      // Cross-slice import within same layer
      {
        code: 'import { CartItem } from "@/features/cart";',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "Within 'features' layer, 'auth' cannot import from 'cart'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
      // Re-export violation
      {
        code: 'export { UserEntity } from "@/domains/user";',
        filename: "src/features/auth/index.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
      // export * re-export violation
      {
        code: 'export * from "@/domains/user";',
        filename: "src/features/auth/index.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
    ],
  });
});

describe("layers rule — allowedImports", () => {
  ruleTester.run("layers-allowed", layersRule, {
    valid: [
      // Cross-slice allowed by exception
      {
        code: 'import { User } from "@/features/user";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "@": "src" },
            allowedImports: [
              { from: "features/auth", to: "features/user" },
            ],
          },
        ],
      },
      // Upper layer allowed by exception
      {
        code: 'import { UserEntity } from "@/domains/user";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "@": "src" },
            allowedImports: [
              { from: "features/auth", to: "domains/user" },
            ],
          },
        ],
      },
    ],
    invalid: [
      // Exception does not match — still a violation
      {
        code: 'import { CartItem } from "@/features/cart";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "@": "src" },
            allowedImports: [
              { from: "features/auth", to: "features/user" },
            ],
          },
        ],
        errors: [
          {
            message:
              "Within 'features' layer, 'auth' cannot import from 'cart'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
    ],
  });
});

describe("layers rule — alias variants", () => {
  ruleTester.run("layers-alias", layersRule, {
    valid: [
      // Tilde alias
      {
        code: 'import { Button } from "~/shared/ui";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "~": "src" },
          },
        ],
      },
    ],
    invalid: [
      // Tilde alias — violation detected through alias resolution
      {
        code: 'import { UserEntity } from "~/domains/user";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "~": "src" },
          },
        ],
        errors: [
          {
            message:
              "'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
    ],
  });
});

describe("layers rule — dynamic import & require", () => {
  ruleTester.run("layers-dynamic", layersRule, {
    valid: [
      // Dynamic import to lower layer — allowed
      {
        code: 'async function load() { const mod = await import("@/shared/ui"); }',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
      },
      // Require to lower layer — allowed
      {
        code: 'const mod = require("@/shared/ui");',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
      },
    ],
    invalid: [
      // Dynamic import to upper layer — violation
      {
        code: 'async function load() { const mod = await import("@/domains/user"); }',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
      // Require to upper layer — violation
      {
        code: 'const mod = require("@/domains/user");',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
      // Dynamic import cross-slice — violation
      {
        code: 'async function load() { const mod = await import("@/features/cart"); }',
        filename: "src/features/auth/Login.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "Within 'features' layer, 'auth' cannot import from 'cart'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
    ],
  });
});

describe("layers rule — relative path imports", () => {
  ruleTester.run("layers-relative", layersRule, {
    valid: [
      // Relative import within same slice — allowed
      {
        code: 'import { validate } from "./utils";',
        filename: "/project/src/features/auth/Login.ts",
        options: defaultOptions,
      },
      // Relative import to lower layer — allowed
      {
        code: 'import { Button } from "../../shared/ui";',
        filename: "/project/src/features/auth/Login.ts",
        options: defaultOptions,
      },
    ],
    invalid: [
      // Relative cross-slice import within same layer
      {
        code: 'import { CartItem } from "../cart";',
        filename: "/project/src/features/auth/Login.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "Within 'features' layer, 'auth' cannot import from 'cart'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
      // Relative import to upper layer
      {
        code: 'import { UserEntity } from "../../domains/user";',
        filename: "/project/src/shared/ui/Button.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "'shared' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
    ],
  });
});

describe("layers rule — Windows paths", () => {
  ruleTester.run("layers-windows", layersRule, {
    valid: [
      // Windows-style filename should still detect layer correctly
      {
        code: 'import { Button } from "@/shared/ui";',
        filename: "C:\\Users\\dev\\project\\src\\features\\auth\\Login.ts",
        options: defaultOptions,
      },
    ],
    invalid: [
      // Windows path — upper layer violation detected
      {
        code: 'import { UserEntity } from "@/domains/user";',
        filename: "C:\\Users\\dev\\project\\src\\features\\auth\\Login.ts",
        options: defaultOptions,
        errors: [
          {
            message:
              "'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
    ],
  });
});

describe("layers rule — allowCrossSlice", () => {
  ruleTester.run("layers-cross-slice", layersRule, {
    valid: [
      // Cross-slice allowed for features layer
      {
        code: 'import { CartItem } from "@/features/cart";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "@": "src" },
            allowCrossSlice: ["features"],
          },
        ],
      },
      // Cross-slice allowed for multiple layers
      {
        code: 'import { UserEntity } from "@/domains/order";',
        filename: "src/domains/user/index.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "@": "src" },
            allowCrossSlice: ["domains", "features"],
          },
        ],
      },
    ],
    invalid: [
      // Cross-slice NOT allowed for unlisted layer
      {
        code: 'import { CartItem } from "@/features/cart";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "@": "src" },
            allowCrossSlice: ["shared"],
          },
        ],
        errors: [
          {
            message:
              "Within 'features' layer, 'auth' cannot import from 'cart'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
      // Upper layer violation still enforced even with allowCrossSlice
      {
        code: 'import { UserEntity } from "@/domains/user";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            aliases: { "@": "src" },
            allowCrossSlice: ["features"],
          },
        ],
        errors: [
          {
            message:
              "'features' cannot import from upper layer 'domains'. If this dependency is unavoidable, add an exception to allowedImports.",
          },
        ],
      },
    ],
  });
});

describe("layers rule — autoReadTsConfig", () => {
  // RuleTester doesn't support setting cwd directly, so we verify
  // the option is accepted without error. The readTsConfigPaths function
  // is already unit-tested in readTsConfig.test.ts.
  ruleTester.run("layers-autoread", layersRule, {
    valid: [
      {
        code: 'import { Button } from "./ui";',
        filename: "src/features/auth/Login.ts",
        options: [
          {
            layers: ["domains", "features", "shared"],
            autoReadTsConfig: true,
          },
        ],
      },
    ],
    invalid: [],
  });
});
