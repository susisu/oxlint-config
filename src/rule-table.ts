import type { OxlintConfig } from "oxlint";

export type PluginName = NonNullable<OxlintConfig["plugins"]>[number];
export type CategoryName = keyof NonNullable<OxlintConfig["categories"]>;

export type RuleInfo = Readonly<{
  plugin: PluginName;
  category: CategoryName;
  typeAware: boolean;
}>;

export type RuleTable = Readonly<Record<string, RuleInfo>>;

const pluginNameRecord: Readonly<Record<PluginName, true>> = {
  eslint: true,
  react: true,
  unicorn: true,
  typescript: true,
  oxc: true,
  import: true,
  jsdoc: true,
  jest: true,
  vitest: true,
  "jsx-a11y": true,
  nextjs: true,
  "react-perf": true,
  promise: true,
  node: true,
  vue: true,
};

const categoryNameRecord: Readonly<Record<CategoryName, true>> = {
  correctness: true,
  nursery: true,
  pedantic: true,
  perf: true,
  restriction: true,
  style: true,
  suspicious: true,
};

export function isPluginName(value: string): value is PluginName {
  return Object.hasOwn(pluginNameRecord, value);
}

export function isCategoryName(value: string): value is CategoryName {
  return Object.hasOwn(categoryNameRecord, value);
}
