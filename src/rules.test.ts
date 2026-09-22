import { describe, expect, it } from "vitest";

import type { Preset } from "./preset.ts";
import type { Categories } from "./resolve.ts";
import type { RuleTable } from "./rule-table.ts";
import { presetRules } from "./rules.ts";

const table: RuleTable = {
  "no-debugger": { plugin: "eslint", category: "correctness", typeAware: false },
  eqeqeq: { plugin: "eslint", category: "pedantic", typeAware: false },
  "no-implied-eval": { plugin: "eslint", category: "suspicious", typeAware: false },
  "typescript/no-implied-eval": { plugin: "typescript", category: "correctness", typeAware: true },
  "typescript/no-explicit-any": { plugin: "typescript", category: "restriction", typeAware: false },
  "react/jsx-key": { plugin: "react", category: "correctness", typeAware: false },
};

const allOff: Categories = {
  correctness: "off",
  nursery: "off",
  pedantic: "off",
  perf: "off",
  restriction: "off",
  style: "off",
  suspicious: "off",
};

const allOn: Categories = {
  correctness: "error",
  nursery: "error",
  pedantic: "error",
  perf: "error",
  restriction: "error",
  style: "error",
  suspicious: "error",
};

const preset: Preset = {
  eslint: {
    rules: {
      "no-debugger": "error",
      eqeqeq: ["error", "smart"],
      "no-implied-eval": "warn",
    },
  },
  typescript: {
    rules: {
      "typescript/no-implied-eval": "error",
      "typescript/no-explicit-any": "off",
    },
    supersedes: {
      "typescript/no-implied-eval": ["no-implied-eval"],
    },
  },
  react: {
    rules: { "react/jsx-key": "warn" },
  },
};

const eslint = new Set(["eslint"] as const);
const eslintTs = new Set(["eslint", "typescript"] as const);

describe("presetRules", () => {
  it("emits nothing when every category is off", () => {
    expect(
      presetRules(preset, { plugins: eslintTs, categories: allOff, typeAware: true }, table),
    ).toEqual({});
  });

  it("emits entries of enabled plugins and categories, capped by the entry severity", () => {
    const categories: Categories = { ...allOff, correctness: "error", pedantic: "warn" };
    const rules = presetRules(preset, { plugins: eslintTs, categories, typeAware: false }, table);
    expect(rules).toEqual({
      "no-debugger": "error",
      eqeqeq: ["warn", "smart"],
    });
  });

  it("never raises the severity above the category", () => {
    const categories: Categories = { ...allOff, correctness: "warn" };
    const rules = presetRules(preset, { plugins: eslint, categories, typeAware: false }, table);
    expect(rules).toEqual({ "no-debugger": "warn" });
  });

  it("emits off entries while the category is on", () => {
    const categories: Categories = { ...allOff, restriction: "error" };
    const rules = presetRules(preset, { plugins: eslintTs, categories, typeAware: false }, table);
    expect(rules).toEqual({ "typescript/no-explicit-any": "off" });
  });

  it("skips plugins that are not enabled", () => {
    const rules = presetRules(
      preset,
      { plugins: eslint, categories: allOn, typeAware: true },
      table,
    );
    expect(rules).not.toHaveProperty("typescript/no-implied-eval");
    expect(rules).not.toHaveProperty("react/jsx-key");
  });

  it("skips type-aware rules when type-aware linting is off", () => {
    const rules = presetRules(
      preset,
      { plugins: eslintTs, categories: allOn, typeAware: false },
      table,
    );
    expect(rules).not.toHaveProperty("typescript/no-implied-eval");
  });

  describe("supersedes", () => {
    it("turns off superseded rules when the superseding rule is active", () => {
      const rules = presetRules(
        preset,
        { plugins: eslintTs, categories: allOn, typeAware: true },
        table,
      );
      expect(rules["typescript/no-implied-eval"]).toBe("error");
      expect(rules["no-implied-eval"]).toBe("off");
    });

    it("leaves superseded rules alone when the superseding rule is not active", () => {
      expect(
        presetRules(preset, { plugins: eslintTs, categories: allOn, typeAware: false }, table)[
          "no-implied-eval"
        ],
      ).toBe("warn");
      expect(
        presetRules(preset, { plugins: eslint, categories: allOn, typeAware: true }, table)[
          "no-implied-eval"
        ],
      ).toBe("warn");
      expect(
        presetRules(
          preset,
          { plugins: eslintTs, categories: { ...allOn, correctness: "off" }, typeAware: true },
          table,
        )["no-implied-eval"],
      ).toBe("warn");
    });

    it("does not turn off when the superseding rule is set off in the preset", () => {
      const off: Preset = {
        typescript: {
          rules: { "typescript/no-implied-eval": "off" },
          supersedes: { "typescript/no-implied-eval": ["no-implied-eval"] },
        },
      };
      const rules = presetRules(
        off,
        { plugins: eslintTs, categories: allOn, typeAware: true },
        table,
      );
      expect(rules).toEqual({ "typescript/no-implied-eval": "off" });
    });
  });

  describe("emitFor", () => {
    it("emits entries only for the given plugins", () => {
      const rules = presetRules(
        preset,
        { plugins: eslintTs, categories: allOn, typeAware: true, emitFor: new Set(["typescript"]) },
        table,
      );
      expect(rules).toEqual({
        "typescript/no-implied-eval": "error",
        "typescript/no-explicit-any": "off",
        "no-implied-eval": "off", // superseded
      });
    });

    it("turns off a superseded rule of an emitted plugin", () => {
      const rules = presetRules(
        preset,
        { plugins: eslintTs, categories: allOn, typeAware: true, emitFor: new Set(["eslint"]) },
        table,
      );
      expect(rules["no-implied-eval"]).toBe("off");
      expect(rules).not.toHaveProperty("typescript/no-implied-eval");
    });

    it("does not repeat a superseded rule when neither plugin is emitted", () => {
      const rules = presetRules(
        preset,
        { plugins: eslintTs, categories: allOn, typeAware: true, emitFor: new Set(["react"]) },
        table,
      );
      expect(rules).toEqual({});
    });
  });

  describe("validation", () => {
    it("rejects unknown rule names", () => {
      expect(() =>
        presetRules(
          { eslint: { rules: { "no-such-rule": "error" } } },
          { plugins: eslint, categories: allOn, typeAware: false },
          table,
        ),
      ).toThrow("Unknown rule in preset: no-such-rule");
      expect(() =>
        presetRules(
          { eslint: { supersedes: { "no-debugger": ["no-such-rule"] } } },
          { plugins: eslint, categories: allOn, typeAware: false },
          table,
        ),
      ).toThrow("Unknown rule in preset: no-such-rule");
    });

    it("rejects rules that belong to another plugin", () => {
      expect(() =>
        presetRules(
          { eslint: { rules: { "react/jsx-key": "error" } } },
          { plugins: eslint, categories: allOn, typeAware: false },
          table,
        ),
      ).toThrow("Rule react/jsx-key does not belong to plugin eslint");
      expect(() =>
        presetRules(
          { eslint: { supersedes: { "react/jsx-key": ["no-debugger"] } } },
          { plugins: eslint, categories: allOn, typeAware: false },
          table,
        ),
      ).toThrow("Rule react/jsx-key does not belong to plugin eslint");
    });
  });
});
