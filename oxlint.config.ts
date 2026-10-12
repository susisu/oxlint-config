import { config } from "./src/index.ts";

export default config({
  options: {
    typeAware: true,
    reportUnusedDisableDirectives: "warn",
  },
  categories: {
    correctness: "error",
  },
  overrides: [
    {
      files: ["scripts/**/*.ts"],
      rules: {
        "no-console": "off",
      },
    },
  ],
});
