import type { OxlintConfig } from "oxlint";

import type { CategoryName, PluginName } from "./rule-table.ts";
import { isCategoryName, isPluginName } from "./rule-table.ts";

export type Severity = "off" | "warn" | "error";

export type Categories = Readonly<Record<CategoryName, Severity>>;

export type PluginOverride = Readonly<{
  files: readonly string[];
  excludeFiles: readonly string[] | undefined;
  plugins: ReadonlySet<PluginName>;
}>;

export type Resolved = Readonly<{
  plugins: ReadonlySet<PluginName>;
  categories: Categories;
  typeAware: boolean;
  pluginOverrides: readonly PluginOverride[];
}>;

export const defaultPlugins: ReadonlySet<PluginName> = new Set(["unicorn", "typescript", "oxc"]);

export const defaultCategories: Categories = {
  correctness: "warn",
  nursery: "off",
  pedantic: "off",
  perf: "off",
  restriction: "off",
  style: "off",
  suspicious: "off",
};

export function parseSeverity(value: unknown): Severity {
  switch (value) {
    case "off":
    case "allow":
    case 0:
      return "off";
    case "warn":
    case 1:
      return "warn";
    case "error":
    case "deny":
    case 2:
      return "error";
    default:
      throw new TypeError(`Invalid severity: ${String(value)}`);
  }
}

const severityRank: Readonly<Record<Severity, number>> = {
  off: 0,
  warn: 1,
  error: 2,
};

export function minSeverity(a: Severity, b: Severity): Severity {
  return severityRank[a] <= severityRank[b] ? a : b;
}

export function resolve(config: OxlintConfig): Resolved {
  const plugins = new Set<PluginName>(["eslint"]);
  const categories: Partial<Record<CategoryName, Severity>> = {};
  let typeAware: boolean | undefined = undefined;
  const pluginOverrides: PluginOverride[] = [];
  const visiting = new Set<OxlintConfig>();

  const visit = (c: OxlintConfig): void => {
    if (visiting.has(c)) {
      throw new Error("`extends` contains a circular reference");
    }
    visiting.add(c);

    for (const plugin of c.plugins ?? defaultPlugins) {
      if (isPluginName(plugin)) {
        plugins.add(plugin);
      }
    }
    if (c.categories !== undefined) {
      for (const [name, value] of Object.entries(c.categories)) {
        if (isCategoryName(name) && value !== undefined) {
          categories[name] ??= parseSeverity(value);
        }
      }
    }
    typeAware ??= c.options?.typeAware;

    for (const extended of (c.extends ?? []).toReversed()) {
      visit(extended);
    }

    visiting.delete(c);
  };
  visit(config);

  const collectOverrides = (c: OxlintConfig): void => {
    for (const extended of c.extends ?? []) {
      collectOverrides(extended);
    }
    for (const override of c.overrides ?? []) {
      if (override.plugins !== undefined) {
        pluginOverrides.push({
          files: override.files,
          excludeFiles: override.excludeFiles,
          plugins: new Set(override.plugins.filter((plugin) => isPluginName(plugin))),
        });
      }
    }
  };
  collectOverrides(config);

  return {
    plugins,
    categories: { ...defaultCategories, ...categories },
    typeAware: typeAware ?? false,
    pluginOverrides,
  };
}
