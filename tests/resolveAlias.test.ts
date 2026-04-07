import { describe, it, expect } from "vitest";
import { resolveAlias } from "../src/utils/resolveAlias";

describe("resolveAlias", () => {
  it("replaces alias prefix with real path", () => {
    const result = resolveAlias("@/features/auth", { "@": "src" });
    expect(result).toBe("src/features/auth");
  });

  it("replaces tilde alias", () => {
    const result = resolveAlias("~/shared/ui", { "~": "src" });
    expect(result).toBe("src/shared/ui");
  });

  it("returns path unchanged when no alias matches", () => {
    const result = resolveAlias("features/auth", { "@": "src" });
    expect(result).toBe("features/auth");
  });

  it("returns path unchanged when aliases is empty", () => {
    const result = resolveAlias("@/features/auth", {});
    expect(result).toBe("@/features/auth");
  });

  it("matches longest alias prefix first", () => {
    const result = resolveAlias("@app/features/auth", {
      "@": "src",
      "@app": "src/app",
    });
    expect(result).toBe("src/app/features/auth");
  });

  it("handles alias without slash separator", () => {
    const result = resolveAlias("@components/Button", {
      "@components": "src/shared/ui",
    });
    expect(result).toBe("src/shared/ui/Button");
  });
});
