import type { OxlintConfig } from "oxlint";

import { createConfig } from "./config.ts";
import { preset } from "./preset.ts";
import { ruleTable } from "./rule-table.generated.ts";

export const config: (userConfig?: OxlintConfig) => OxlintConfig = createConfig(preset, ruleTable);

export default config;
