import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["dist/**", "src/pages/BlogStyleDashboard_Old.jsx", "src/pages/BlogStyleDashboard_Backup.jsx", "functions/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  pluginJs.configs.recommended,
  pluginReactConfig,
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": ["warn", { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }],
      "react/no-unescaped-entities": "off",
      "no-import-assign": "warn"
    },
  },
  {
    files: ["*.js", "*.cjs", "*.config.js", "scripts/**/*.js"],
    languageOptions: {
      globals: globals.node,
    }
  }
];
