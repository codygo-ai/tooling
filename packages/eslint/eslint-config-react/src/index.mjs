import preactConfig from '@codygo-ai/eslint-config-preact';
import reactPlugin from 'eslint-plugin-react';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

export default [
  ...preactConfig,
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: {
      // Add react-refresh plugin on top of existing plugins from Preact
      'react-refresh': reactRefreshPlugin,
    },
    settings: {
      react: {
        // Override: Remove Preact pragma settings (React uses JSX runtime)
        version: 'detect',
      },
    },
    rules: {
      // Add React-specific JSX runtime rules
      ...reactPlugin.configs['jsx-runtime'].rules,
      // Add react-refresh rules
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Override: Remove Preact's class attribute exception (React uses className)
      'react/no-unknown-property': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['default'],
              message: 'Use selective imports: import { useState } from "react"',
            },
          ],
        },
      ],
      'react/prefer-stateless-function': 'error',
      'react/jsx-pascal-case': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/forbid-dom-props': [
        'warn',
        { forbid: [{ propName: 'style', message: 'Use CSS classes instead of inline styles' }] },
      ],
    },
  },
];
