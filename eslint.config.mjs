import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Native flat config from eslint-config-next (Next 16). The old FlatCompat
// wrapper crashed with a circular-structure error, and `next lint` no longer exists.
const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not part of the app:
    "archive/**",
    "frappe-integration/**",
    "public/**",
  ]),
]);

export default eslintConfig;
