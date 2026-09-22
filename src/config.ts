import type { OxlintConfig, OxlintOverride } from "oxlint";
import { defineConfig } from "oxlint";

import type { Preset } from "./preset.ts";
import type { PluginOverride, Resolved } from "./resolve.ts";
import { resolve } from "./resolve.ts";
import type { PluginName, RuleTable } from "./rule-table.ts";
import { presetRules } from "./rules.ts";

export function createConfig(
  preset: Preset,
  table: RuleTable,
): (userConfig?: OxlintConfig) => OxlintConfig {
  return (userConfig = {}) => {
    const resolved = resolve(userConfig);
    return defineConfig({
      ...userConfig,
      extends: [buildPreset(preset, table, resolved), ...(userConfig.extends ?? [])],
    });
  };
}

function buildPreset(preset: Preset, table: RuleTable, resolved: Resolved): OxlintConfig {
  const overrides = resolved.pluginOverrides.flatMap((override) =>
    buildOverride(preset, table, override, resolved),
  );
  return {
    plugins: [],
    rules: presetRules(
      preset,
      {
        plugins: resolved.plugins,
        categories: resolved.categories,
        typeAware: resolved.typeAware,
      },
      table,
    ),
    ...(overrides.length > 0 ? { overrides } : {}),
  };
}

function buildOverride(
  preset: Preset,
  table: RuleTable,
  override: PluginOverride,
  resolved: Resolved,
): OxlintOverride[] {
  const added = new Set<PluginName>(
    [...override.plugins].filter((plugin) => !resolved.plugins.has(plugin)),
  );
  if (added.size === 0) {
    return [];
  }
  const plugins = new Set<PluginName>([...resolved.plugins, ...added]);
  return [
    {
      files: [...override.files],
      ...(override.excludeFiles === undefined ? {} : { excludeFiles: [...override.excludeFiles] }),
      plugins: [...added],
      rules: presetRules(
        preset,
        {
          plugins,
          categories: resolved.categories,
          typeAware: resolved.typeAware,
          emitFor: added,
        },
        table,
      ),
    },
  ];
}
