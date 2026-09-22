import type { OxlintConfig } from "oxlint";
import { describe, expect, it } from "vitest";

import { createConfig } from "./config.ts";
import type { Preset } from "./preset.ts";
import type { RuleTable } from "./rule-table.ts";

const table: RuleTable = {
  "no-debugger": { plugin: "eslint", category: "correctness", typeAware: false },
  eqeqeq: { plugin: "eslint", category: "pedantic", typeAware: false },
  "no-implied-eval": { plugin: "eslint", category: "suspicious", typeAware: false },
  "typescript/no-implied-eval": { plugin: "typescript", category: "correctness", typeAware: true },
  "unicorn/no-null": { plugin: "unicorn", category: "style", typeAware: false },
  "react/jsx-key": { plugin: "react", category: "correctness", typeAware: false },
  "vitest/no-focused-tests": { plugin: "vitest", category: "correctness", typeAware: false },
};

const preset: Preset = {
  eslint: {
    rules: {
      "no-debugger": "warn",
      eqeqeq: ["error", "smart"],
      "no-implied-eval": "error",
    },
  },
  typescript: {
    rules: { "typescript/no-implied-eval": "error" },
    supersedes: { "typescript/no-implied-eval": ["no-implied-eval"] },
  },
  unicorn: {
    rules: { "unicorn/no-null": "off" },
  },
  react: {
    rules: { "react/jsx-key": "error" },
  },
  vitest: {
    rules: { "vitest/no-focused-tests": "warn" },
  },
};

const config = createConfig(preset, table);

describe("createConfig", () => {
  it("returns the user config with the preset prepended to extends", () => {
    const shared: OxlintConfig = { rules: { "no-debugger": "off" } };
    const userConfig: OxlintConfig = {
      extends: [shared],
      plugins: ["react"],
      categories: { correctness: "error" },
      env: { browser: true },
      rules: { eqeqeq: "off" },
    };
    const result = config(userConfig);
    expect(result).toEqual({
      ...userConfig,
      extends: [
        {
          plugins: [],
          rules: { "no-debugger": "warn", "react/jsx-key": "error" },
        },
        shared,
      ],
    });
    expect(result.extends?.[1]).toBe(shared);
  });

  it("uses oxlint's defaults when called without a config", () => {
    expect(config()).toEqual({
      extends: [
        {
          plugins: [],
          rules: { "no-debugger": "warn" },
        },
      ],
    });
  });

  it("emits preset rules for the plugins and categories resolved from the extends tree", () => {
    const result = config({
      extends: [{ categories: { correctness: "off", style: "warn" } }],
      plugins: ["react"],
      categories: { correctness: "error" },
    });
    expect(result.extends?.[0]?.rules).toEqual({
      "no-debugger": "warn",
      "react/jsx-key": "error",
      "unicorn/no-null": "off",
    });
  });

  it("turns off superseded rules when type-aware linting is on", () => {
    const user: OxlintConfig = {
      plugins: ["typescript"],
      categories: { correctness: "error", suspicious: "error" },
    };
    expect(config(user).extends?.[0]?.rules).toEqual({
      "no-debugger": "warn",
      "no-implied-eval": "error",
    });
    expect(config({ ...user, options: { typeAware: true } }).extends?.[0]?.rules).toEqual({
      "no-debugger": "warn",
      "no-implied-eval": "off",
      "typescript/no-implied-eval": "error",
    });
  });

  describe("overrides", () => {
    it("adds a matching override for plugins enabled only in an override", () => {
      const result = config({
        plugins: [],
        categories: { correctness: "error" },
        overrides: [
          { files: ["**/*.test.ts"], excludeFiles: ["fixtures/**"], plugins: ["vitest"] },
        ],
      });
      expect(result.extends?.[0]?.overrides).toEqual([
        {
          files: ["**/*.test.ts"],
          excludeFiles: ["fixtures/**"],
          plugins: ["vitest"],
          rules: { "vitest/no-focused-tests": "warn" },
        },
      ]);
    });

    it("emits only the plugins not enabled at the root", () => {
      const result = config({
        plugins: ["react"],
        categories: { correctness: "error" },
        overrides: [{ files: ["**/*.test.tsx"], plugins: ["react", "vitest"] }],
      });
      expect(result.extends?.[0]?.overrides).toEqual([
        {
          files: ["**/*.test.tsx"],
          plugins: ["vitest"],
          rules: { "vitest/no-focused-tests": "warn" },
        },
      ]);
    });

    it("adds no override when every plugin is already enabled at the root", () => {
      const result = config({
        plugins: ["vitest"],
        overrides: [{ files: ["**/*.test.ts"], plugins: ["vitest"] }],
      });
      expect(result.extends?.[0]).not.toHaveProperty("overrides");
    });

    it("adds no override when the user config has none with plugins", () => {
      const result = config({
        plugins: [],
        overrides: [{ files: ["**/*.test.ts"], rules: { "no-debugger": "off" } }],
      });
      expect(result.extends?.[0]).not.toHaveProperty("overrides");
    });

    it("handles overrides of extended configs", () => {
      const result = config({
        extends: [{ overrides: [{ files: ["**/*.test.ts"], plugins: ["vitest"] }] }],
        plugins: [],
        categories: { correctness: "error" },
        overrides: [{ files: ["**/*.tsx"], plugins: ["react"] }],
      });
      expect(result.extends?.[0]?.overrides).toEqual([
        {
          files: ["**/*.test.ts"],
          plugins: ["vitest"],
          rules: { "vitest/no-focused-tests": "warn" },
        },
        {
          files: ["**/*.tsx"],
          plugins: ["react"],
          rules: { "react/jsx-key": "error" },
        },
      ]);
    });

    it("turns off a root rule superseded by a rule of an added plugin", () => {
      const result = config({
        plugins: [],
        categories: { correctness: "error", suspicious: "error" },
        options: { typeAware: true },
        overrides: [{ files: ["**/*.ts"], plugins: ["typescript"] }],
      });
      expect(result.extends?.[0]?.rules).toEqual({
        "no-debugger": "warn",
        "no-implied-eval": "error",
      });
      expect(result.extends?.[0]?.overrides).toEqual([
        {
          files: ["**/*.ts"],
          plugins: ["typescript"],
          rules: {
            "no-implied-eval": "off",
            "typescript/no-implied-eval": "error",
          },
        },
      ]);
    });
  });
});
