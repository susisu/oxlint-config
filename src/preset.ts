import type { DummyRuleMap } from "oxlint";

import type { PluginName } from "./rule-table.ts";

export type PluginPreset = Readonly<{
  rules?: DummyRuleMap;
  supersedes?: Readonly<Record<string, readonly string[]>>;
}>;

export type Preset = Readonly<Partial<Record<PluginName, PluginPreset>>>;

export const preset: Preset = {
  eslint: {
    rules: {
      // correctness
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-caller": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": ["error", "always"],
      "no-const-assign": "error",
      "no-constant-binary-expression": ["error", { checkRelationalComparisons: true }],
      "no-constant-condition": ["error", { checkLoops: "allExceptWhileTrue" }],
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-empty-static-block": "error",
      "no-eval": ["error", { allowIndirect: false }],
      "no-ex-assign": "error",
      "no-extra-boolean-cast": ["error", { enforceForInnerExpressions: true }],
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-import-assign": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-iterator": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": ["error", { allowEscape: true }],
      "no-new-native-nonconstructor": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-obj-calls": "error",
      "no-self-assign": ["error", { props: true }],
      "no-setter-return": "error",
      "no-shadow-restricted-names": ["error", { reportGlobalThis: true }],
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-unassigned-vars": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": ["error", { enforceForOrderingRelations: true }],
      "no-unsafe-optional-chaining": ["error", { disallowArithmeticOperators: true }],
      "no-unused-expressions": [
        "error",
        {
          allowShortCircuit: false,
          allowTaggedTemplates: false,
          allowTernary: false,
          enforceForJSX: true,
          ignoreDirectives: false,
        },
      ],
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": [
        "error",
        {
          args: "after-used",
          caughtErrors: "all",
          vars: "all",
          ignoreClassWithStaticInitBlock: false,
          ignoreRestSiblings: true,
          ignoreUsingDeclarations: true,
          reportUsedIgnorePattern: true,
          reportVarsOnlyUsedAsTypes: true,
        },
      ],
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      "no-useless-rename": "error",
      "no-with": "error",
      "require-yield": "warn",
      "use-isnan": ["error", { enforceForIndexOf: true, enforceForSwitchCase: true }],
      "valid-typeof": ["error", { requireStringLiterals: true }],
    },
  },
};
