import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    ignores: ["**/*.js", "**/*.mjs", "node_modules/**", "main.js"],
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
    },
    rules: {
      // Disable typescript-eslint rules that crash due to version mismatch
      "@typescript-eslint/unbound-method": "off",
    },
  },
]);
