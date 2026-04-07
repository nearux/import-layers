import { describe, it, expect } from "vitest";
import { extractLayerInfo } from "../src/utils/extractLayerInfo";

const layers = ["domains", "features", "shared"];

describe("extractLayerInfo", () => {
  it("extracts layer and slice from path", () => {
    const result = extractLayerInfo("src/features/auth/index.ts", layers);
    expect(result).toEqual({ layer: "features", slice: "auth" });
  });

  it("extracts from path starting with layer name", () => {
    const result = extractLayerInfo("features/auth/utils.ts", layers);
    expect(result).toEqual({ layer: "features", slice: "auth" });
  });

  it("returns null for paths not matching any layer", () => {
    const result = extractLayerInfo("lib/helpers/index.ts", layers);
    expect(result).toBeNull();
  });

  it("returns null for relative paths", () => {
    const result = extractLayerInfo("./utils", layers);
    expect(result).toBeNull();
  });

  it("returns null for bare module specifiers", () => {
    const result = extractLayerInfo("lodash", layers);
    expect(result).toBeNull();
  });

  it("handles deeply nested paths", () => {
    const result = extractLayerInfo(
      "src/domains/user/entities/User.ts",
      layers,
    );
    expect(result).toEqual({ layer: "domains", slice: "user" });
  });

  it("returns layer with null slice when no slice segment exists", () => {
    const result = extractLayerInfo("shared/index.ts", layers);
    expect(result).toEqual({ layer: "shared", slice: null });
  });

  it("returns layer with null slice for bare layer path", () => {
    const result = extractLayerInfo("src/shared", layers);
    expect(result).toEqual({ layer: "shared", slice: null });
  });
});
