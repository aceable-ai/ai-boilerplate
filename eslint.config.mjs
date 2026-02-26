// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// For Next.js compatibility
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.config.{js,ts,mjs}',
      '.*.js',
      'next-env.d.ts',
      'playwright-report/**',
      '.claude/**',
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // Next.js specific rules (using compat for now)
  ...compat.extends("next/core-web-vitals"),

  // TypeScript strict rules with type checking
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // TypeScript files with typed linting
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Allow certain patterns
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      
      // Relax overly strict stylistic rules for React/Next.js
      '@typescript-eslint/restrict-template-expressions': 'off', // Allow any type in template literals
      '@typescript-eslint/no-confusing-void-expression': 'off', // Common in React event handlers
      '@typescript-eslint/no-deprecated': 'warn', // Warn instead of error for deprecated APIs
      '@typescript-eslint/unbound-method': 'off', // Often false positives with React

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // Warn instead of error - sometimes deps are intentionally omitted

      // General best practices
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',

      // Disable some stylistic rules that might be too strict
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    },
  },

  // JavaScript files - no type checking
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Test files - relax some rules
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },
);