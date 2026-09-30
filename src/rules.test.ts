import type { DummyRuleMap } from "oxlint";
import { describe, expect, it } from "vitest";

import type { Preset } from "./preset.ts";
import type { RuleTable } from "./rule-table.ts";
import type { PresetRulesParams } from "./rules.ts";
import { presetRules } from "./rules.ts";

const table: RuleTable = {
  "no-debugger": { plugin: "eslint", category: "correctness", typeAware: false },
  eqeqeq: { plugin: "eslint", category: "pedantic", typeAware: false },
  "no-implied-eval": { plugin: "eslint", category: "suspicious", typeAware: false },
  "typescript/no-implied-eval": { plugin: "typescript", category: "correctness", typeAware: true },
  "typescript/no-explicit-any": { plugin: "typescript", category: "restriction", typeAware: false },
  "react/jsx-key": { plugin: "react", category: "correctness", typeAware: false },
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
      "typescript/no-explicit-any": "warn",
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

const baseParams: PresetRulesParams = {
  plugins: new Set(["eslint", "typescript"]),
  categories: { correctness: "error" },
  typeAware: true,
};

function run(params: Partial<PresetRulesParams>, p: Preset = preset): DummyRuleMap {
  return presetRules(p, { ...baseParams, ...params }, table);
}

describe("presetRules", () => {
  describe("severity", () => {
    describe("of a rule whose category is set explicitly", () => {
      it("is the lower of the category severity and the entry severity", () => {
        expect(
          run({
            plugins: eslint,
            categories: { correctness: "warn", pedantic: "error", suspicious: "error" },
          }),
        ).toEqual({
          "no-debugger": "warn",
          eqeqeq: ["error", "smart"],
          "no-implied-eval": "warn",
        });
      });

      it("is off when the category is off, and the entry is skipped", () => {
        expect(
          run({ plugins: eslint, categories: { correctness: "error", pedantic: "off" } }),
        ).not.toHaveProperty("eqeqeq");
      });
    });

    describe("of a rule whose category is not set explicitly", () => {
      it("is the lower of the highest category severity and the entry severity", () => {
        expect(run({ plugins: eslint, categories: { perf: "error" } })).toEqual({
          "no-debugger": "error",
          eqeqeq: ["error", "smart"],
          "no-implied-eval": "warn",
        });
        expect(run({ plugins: eslint, categories: { perf: "warn" } })).toEqual({
          "no-debugger": "warn",
          eqeqeq: ["warn", "smart"],
          "no-implied-eval": "warn",
        });
      });

      it("counts correctness as warn unless it is set explicitly", () => {
        expect(run({ plugins: eslint, categories: {} })).toEqual({
          "no-debugger": "warn",
          eqeqeq: ["warn", "smart"],
          "no-implied-eval": "warn",
        });
      });

      it("is off when every category is off, and the entry is skipped", () => {
        expect(run({ plugins: eslint, categories: { correctness: "off" } })).toEqual({});
      });
    });
  });

  it("skips rules of plugins that are not enabled", () => {
    const rules = run({ plugins: eslint });
    expect(rules).not.toHaveProperty("typescript/no-implied-eval");
    expect(rules).not.toHaveProperty("react/jsx-key");
  });

  it("skips type-aware rules when type-aware linting is off", () => {
    expect(run({ typeAware: false })).not.toHaveProperty("typescript/no-implied-eval");
  });

  describe("supersedes", () => {
    it("turns off superseded rules when the superseding rule is active", () => {
      const rules = run({});
      expect(rules["typescript/no-implied-eval"]).toBe("error");
      expect(rules["no-implied-eval"]).toBe("off");
    });

    it("leaves superseded rules alone when the superseding rule is skipped", () => {
      expect(run({ plugins: eslint })["no-implied-eval"]).toBe("warn");
      expect(run({ typeAware: false })["no-implied-eval"]).toBe("warn");
      expect(
        run({ categories: { correctness: "off", suspicious: "error" } })["no-implied-eval"],
      ).toBe("warn");
    });

    it("treats a superseding rule without an entry as active when its category is enabled", () => {
      const noEntry: Preset = {
        typescript: {
          supersedes: { "typescript/no-implied-eval": ["no-implied-eval"] },
        },
      };
      expect(run({ categories: { suspicious: "error" } }, noEntry)).toEqual({
        "no-implied-eval": "off",
      });
      expect(run({ categories: { correctness: "off", suspicious: "error" } }, noEntry)).toEqual({});
    });
  });

  describe("emitFor", () => {
    it("emits entries only for the given plugins", () => {
      expect(run({ emitFor: new Set(["typescript"]) })).toEqual({
        "typescript/no-implied-eval": "error",
        "typescript/no-explicit-any": "warn",
        "no-implied-eval": "off", // superseded
      });
    });

    it("turns off a superseded rule of an emitted plugin", () => {
      const rules = run({ emitFor: new Set(["eslint"]) });
      expect(rules["no-implied-eval"]).toBe("off");
      expect(rules).not.toHaveProperty("typescript/no-implied-eval");
    });

    it("does not repeat a superseded rule when neither plugin is emitted", () => {
      expect(run({ emitFor: new Set(["react"]) })).toEqual({});
    });
  });

  describe("validation", () => {
    it("rejects unknown rule names", () => {
      expect(() => run({}, { eslint: { rules: { "no-such-rule": "error" } } })).toThrow(
        "Unknown rule in preset: no-such-rule",
      );
      expect(() =>
        run({}, { eslint: { supersedes: { "no-debugger": ["no-such-rule"] } } }),
      ).toThrow("Unknown rule in preset: no-such-rule");
    });

    it("rejects rules that belong to another plugin", () => {
      expect(() => run({}, { eslint: { rules: { "react/jsx-key": "error" } } })).toThrow(
        "Rule react/jsx-key does not belong to plugin eslint",
      );
      expect(() =>
        run({}, { eslint: { supersedes: { "react/jsx-key": ["no-debugger"] } } }),
      ).toThrow("Rule react/jsx-key does not belong to plugin eslint");
    });
  });
});
