import type { OxlintConfig } from "oxlint";
import { describe, expect, it } from "vitest";

import {
  defaultCategories,
  defaultPlugins,
  minSeverity,
  parseSeverity,
  resolve,
} from "./resolve.ts";

describe("parseSeverity", () => {
  it("maps all spellings to three severities", () => {
    expect(parseSeverity("off")).toBe("off");
    expect(parseSeverity("allow")).toBe("off");
    expect(parseSeverity(0)).toBe("off");

    expect(parseSeverity("warn")).toBe("warn");
    expect(parseSeverity(1)).toBe("warn");

    expect(parseSeverity("error")).toBe("error");
    expect(parseSeverity("deny")).toBe("error");
    expect(parseSeverity(2)).toBe("error");
  });

  it("rejects other values", () => {
    expect(() => parseSeverity(3)).toThrow(TypeError);
    expect(() => parseSeverity("severe")).toThrow(TypeError);
    expect(() => parseSeverity(null)).toThrow(TypeError);
    expect(() => parseSeverity({})).toThrow(TypeError);
  });
});

describe("minSeverity", () => {
  it("returns the lower severity", () => {
    // minSeverity(x, x) === x
    expect(minSeverity("error", "error")).toBe("error");

    // minSeverity(x, y) === minSeverity(y, x)
    expect(minSeverity("error", "warn")).toBe("warn");
    expect(minSeverity("warn", "error")).toBe("warn");

    // off <= warn <= error
    expect(minSeverity("off", "warn")).toBe("off");
    expect(minSeverity("off", "error")).toBe("off");
    expect(minSeverity("warn", "error")).toBe("warn");
  });
});

describe("resolve", () => {
  describe("plugins", () => {
    it("uses the default plugins when omitted", () => {
      expect(resolve({}).plugins).toEqual(new Set(["eslint", ...defaultPlugins]));
    });

    it("always includes eslint", () => {
      expect(resolve({ plugins: [] }).plugins).toEqual(new Set(["eslint"]));
    });

    it("takes the union over the extends tree", () => {
      const config: OxlintConfig = {
        extends: [
          { plugins: ["react"], extends: [{ plugins: ["vitest"] }] },
          { plugins: ["jest"] },
        ],
        plugins: ["import"],
      };
      expect(resolve(config).plugins).toEqual(
        new Set(["eslint", "import", "jest", "react", "vitest"]),
      );
    });

    it("counts an extended config without plugins as the default plugins", () => {
      expect(resolve({ extends: [{}], plugins: [] }).plugins).toEqual(
        new Set(["eslint", ...defaultPlugins]),
      );
    });
  });

  describe("categories", () => {
    it("defaults correctness to warn and others to off", () => {
      expect(resolve({}).categories).toEqual(defaultCategories);
    });

    it("normalizes severities", () => {
      const { categories } = resolve({
        categories: { correctness: "deny", perf: 1, style: "allow" },
      });
      expect(categories.correctness).toBe("error");
      expect(categories.perf).toBe("warn");
      expect(categories.style).toBe("off");
    });

    it("prefers the extending config, then later extends entries", () => {
      const config: OxlintConfig = {
        extends: [
          { categories: { correctness: "error", style: "warn", perf: "warn" } },
          { categories: { style: "error" }, extends: [{ categories: { perf: "error" } }] },
        ],
        categories: { correctness: "off" },
      };
      const { categories } = resolve(config);
      expect(categories.correctness).toBe("off");
      expect(categories.perf).toBe("error");
      expect(categories.style).toBe("error");
    });

    it("lets a nested extends override an earlier sibling", () => {
      const config: OxlintConfig = {
        extends: [
          { categories: { style: "warn" } },
          { extends: [{ categories: { style: "error" } }] },
        ],
      };
      expect(resolve(config).categories.style).toBe("error");
    });
  });

  describe("typeAware", () => {
    it("defaults to false", () => {
      expect(resolve({}).typeAware).toBe(false);
    });

    it("is merged like categories", () => {
      expect(
        resolve({
          extends: [{ options: { typeAware: true } }],
        }).typeAware,
      ).toBe(true);
      expect(
        resolve({
          extends: [{ options: { typeAware: true } }],
          options: { typeAware: false },
        }).typeAware,
      ).toBe(false);
    });
  });

  describe("pluginOverrides", () => {
    it("collects overrides with plugins, extended configs first", () => {
      const config: OxlintConfig = {
        extends: [
          { overrides: [{ files: ["a/**"], excludeFiles: ["a/b/**"], plugins: ["react"] }] },
          { overrides: [{ files: ["c/**"], plugins: ["jest"] }] },
          { overrides: [{ files: ["d/**"], rules: {} }] },
        ],
        overrides: [
          { files: ["**/*.test.ts"], plugins: ["vitest"] },
          { files: ["**/*.ts"], rules: {} },
        ],
      };
      expect(resolve(config).pluginOverrides).toEqual([
        { files: ["a/**"], excludeFiles: ["a/b/**"], plugins: new Set(["react"]) },
        { files: ["c/**"], excludeFiles: undefined, plugins: new Set(["jest"]) },
        { files: ["**/*.test.ts"], excludeFiles: undefined, plugins: new Set(["vitest"]) },
      ]);
    });
  });

  it("rejects circular extends", () => {
    const a: { extends: OxlintConfig[] } = { extends: [] };
    const b: OxlintConfig = { extends: [a] };
    a.extends.push(b);
    expect(() => resolve(a)).toThrow("circular");
  });
});
