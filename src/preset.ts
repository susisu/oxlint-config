import type { DummyRuleMap } from "oxlint";

import type { PluginName } from "./rule-table.ts";

export type PluginPreset = Readonly<{
  rules?: DummyRuleMap;
  supersedes?: Readonly<Record<string, readonly string[]>>;
}>;

export type Preset = Readonly<Partial<Record<PluginName, PluginPreset>>>;

export const preset: Preset = {
  // TODO
};
