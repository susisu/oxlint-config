import { config } from "./src/index.ts";

export default config({
  options: {
    typeAware: true,
  },
  plugins: ["oxc", "unicorn", "typescript"],
  categories: {
    correctness: "error",
    suspicious: "error",
  },
});
