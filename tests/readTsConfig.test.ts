import { describe, it, expect, afterEach } from "vitest";
import { readTsConfigPaths } from "../src/utils/readTsConfig";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("readTsConfigPaths", () => {
  const tempDir = join(tmpdir(), "import-layers-test-" + Date.now());

  function writeTsConfig(content: object) {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(
      join(tempDir, "tsconfig.json"),
      JSON.stringify(content, null, 2),
    );
  }

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("parses paths into alias map", () => {
    writeTsConfig({
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["src/*"],
        },
      },
    });
    const result = readTsConfigPaths(tempDir);
    expect(result).toEqual({ "@": "src" });
  });

  it("handles multiple aliases", () => {
    writeTsConfig({
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["src/*"],
          "~/*": ["src/*"],
        },
      },
    });
    const result = readTsConfigPaths(tempDir);
    expect(result).toEqual({ "@": "src", "~": "src" });
  });

  it("returns empty object when no tsconfig found", () => {
    const result = readTsConfigPaths("/nonexistent/path");
    expect(result).toEqual({});
  });

  it("returns empty object when no paths defined", () => {
    writeTsConfig({
      compilerOptions: {
        strict: true,
      },
    });
    const result = readTsConfigPaths(tempDir);
    expect(result).toEqual({});
  });

  it("handles paths without wildcard", () => {
    writeTsConfig({
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@config": ["src/config/index"],
        },
      },
    });
    const result = readTsConfigPaths(tempDir);
    expect(result).toEqual({ "@config": "src/config/index" });
  });
});
