import type { OxlintConfig } from "oxlint";
import { defineConfig } from "oxlint";

import { js as jsRules, ts as tsRules } from "./rules.ts";

export type ConfigOptions = Readonly<
  Partial<{
    /** Enable type-aware linting. (default: true) */
    typeAware: boolean | undefined;
  }>
>;

const preset: OxlintConfig = defineConfig({
  plugins: ["typescript"],
  overrides: [
    {
      files: ["**/*.{js,cjs,mjs,jsx}"],
      rules: jsRules,
    },
    {
      files: ["**/*.{ts,tsx,cts,mts}"],
      rules: tsRules,
    },
  ],
});

export function config(options?: ConfigOptions, userConfig?: OxlintConfig): OxlintConfig {
  const typeAware = options?.typeAware ?? true;

  return defineConfig({
    ...userConfig,
    extends: [preset, ...(userConfig?.extends ?? [])],
    categories: {
      correctness: "off",
      ...userConfig?.categories,
    },
    options: {
      typeAware,
      reportUnusedDisableDirectives: "warn",
      ...userConfig?.options,
    },
  });
}
