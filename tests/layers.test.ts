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
              "'features'에서 상위 레이어 'domains'를 import할 수 없습니다. 불가피한 의존이라면 allowedImports에 예외를 추가하세요.",
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
              "'features' 레이어 내에서 'auth'가 'cart'를 import할 수 없습니다. 불가피한 의존이라면 allowedImports에 예외를 추가하세요.",
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
              "'features'에서 상위 레이어 'domains'를 import할 수 없습니다. 불가피한 의존이라면 allowedImports에 예외를 추가하세요.",
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
              "'features'에서 상위 레이어 'domains'를 import할 수 없습니다. 불가피한 의존이라면 allowedImports에 예외를 추가하세요.",
          },
        ],
      },
    ],
  });
});
