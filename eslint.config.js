import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // React + Hooks
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module"
      }
    },
    plugins: {
      react,
      "react-hooks": reactHooks
    },
    rules: {
      // ✅ Include *all* recommended React rules:
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules, // For React 17+ automatic JSX transform
      // ✅ Include React Hooks rules
      ...reactHooks.configs.recommended.rules,
      // ✅ TypeScript-specific adjustments
      "react/react-in-jsx-scope": "off", // No need for React import in JSX
      "react/prop-types": "off" // Not needed with TypeScript
    },
    settings: {
      react: { version: "detect" }
    }
  }
);
