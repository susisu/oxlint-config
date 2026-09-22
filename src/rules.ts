import type { DummyRule, DummyRuleMap } from "oxlint";

import type { Preset } from "./preset.ts";
import type { Categories, Severity } from "./resolve.ts";
import { minSeverity, parseSeverity } from "./resolve.ts";
import type { PluginName, RuleInfo, RuleTable } from "./rule-table.ts";

export type PresetRulesParams = Readonly<{
  plugins: ReadonlySet<PluginName>;
  categories: Categories;
  typeAware: boolean;
  emitFor?: ReadonlySet<PluginName> | undefined;
}>;

export function presetRules(
  preset: Preset,
  params: PresetRulesParams,
  table: RuleTable,
): DummyRuleMap {
  const emitFor = params.emitFor ?? params.plugins;
  const rules: Record<string, DummyRule> = {};

  const lookup = (name: string): RuleInfo => {
    const info = table[name];
    if (info === undefined) {
      throw new Error(`Unknown rule in preset: ${name}`);
    }
    return info;
  };

  const activeSeverity = (info: RuleInfo): Severity => {
    if (!params.plugins.has(info.plugin) || (info.typeAware && !params.typeAware)) {
      return "off";
    }
    return params.categories[info.category];
  };

  for (const plugin of emitFor) {
    for (const [name, entry] of Object.entries(preset[plugin]?.rules ?? {})) {
      if (entry === undefined) {
        continue;
      }
      const info = lookup(name);
      if (info.plugin !== plugin) {
        throw new Error(`Rule ${name} does not belong to plugin ${plugin}`);
      }
      const severity = activeSeverity(info);
      if (severity === "off") {
        continue;
      }
      rules[name] = withSeverity(entry, minSeverity(severity, severityOf(entry)));
    }
  }

  for (const plugin of params.plugins) {
    for (const [name, superseded] of Object.entries(preset[plugin]?.supersedes ?? {})) {
      const info = lookup(name);
      if (info.plugin !== plugin) {
        throw new Error(`Rule ${name} does not belong to plugin ${plugin}`);
      }
      const entry = preset[plugin]?.rules?.[name];
      const severity = minSeverity(
        activeSeverity(info),
        entry === undefined ? "error" : severityOf(entry),
      );
      if (severity === "off") {
        continue;
      }
      for (const supersededName of superseded) {
        const supersededInfo = lookup(supersededName);
        if (emitFor.has(plugin) || emitFor.has(supersededInfo.plugin)) {
          rules[supersededName] = "off";
        }
      }
    }
  }

  return rules;
}

function severityOf(rule: DummyRule): Severity {
  return parseSeverity(Array.isArray(rule) ? rule[0] : rule);
}

function withSeverity(rule: DummyRule, severity: Severity): DummyRule {
  return Array.isArray(rule) ? [severity, ...rule.slice(1)] : severity;
}
