import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tailwindcss from 'eslint-plugin-tailwindcss';

export default [
  js.configs.recommended,
  // Config for JavaScript files (no TypeScript parsing here)
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        React: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        localStorage: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      tailwindcss,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/prop-types': 'off',
    },
  },
  // Config for TypeScript files (use the TS parser and plugin)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        React: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        localStorage: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
      tailwindcss,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/prop-types': 'off',
    },
  },
];
