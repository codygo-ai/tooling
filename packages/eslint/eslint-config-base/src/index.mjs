import monoPlugin from '@codygo-ai/eslint-plugin-mono';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

// Shared parser options (without project setting)
const baseParserOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
};

/**
 * Create config block with project setting.
 *
 * @param {string[]} files - File patterns
 * @param {boolean} project - Whether to enable type-checking
 * @param {Record<string, unknown>} additionalRules - Additional rules to merge
 * @returns {import('eslint').Linter.Config} Config block
 */
function createConfig(files, project, additionalRules = {}) {
  // Only try types for TypeScript files, not JavaScript
  const isTypeScript = files.some((pattern) => pattern.includes('{ts,tsx}'));
  const alwaysTryTypes = isTypeScript;

  return {
    files,
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ...baseParserOptions,
        ...(project ? { project } : {}),
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      '@codygo-ai/mono': monoPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use string unions or as const instead of enums',
        },
        {
          selector: 'ImportNamespaceSpecifier',
          message: 'Use selective imports, not wildcard imports',
        },
        {
          selector: 'Literal[value=null]',
          message: "Usage of 'null' is not allowed. Use 'undefined' instead.",
        },
        {
          selector: 'ExportNamedDeclaration[source=null] > ExportSpecifier',
          message: 'Use inline export declarations instead of separate export statements',
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-unreachable': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'eslint-comments/no-unlimited-disable': 'error',
      'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: false }],
      '@codygo-ai/mono/package-naming': 'error',
      '@codygo-ai/mono/package-hierarchy': 'error',
      '@codygo-ai/mono/no-js-extension': 'error',
      '@codygo-ai/mono/prefer-function-declaration': 'error',
      '@codygo-ai/mono/prefer-minimal-checks': 'error',
      '@codygo-ai/mono/prefer-optional-chaining': 'error',
      ...additionalRules,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes,
        },
      },
    },
  };
}

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  js.configs.recommended,
  // Config files - without type-checking (often not in tsconfig) - must come before other TS patterns
  // This needs to be a separate config object to avoid type-checking issues
  {
    files: ['**/*.config.{ts,js,mjs}', '**/vite.config.{ts,js}', '**/tsup.config.{ts,js}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ...baseParserOptions,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      prettier: prettierPlugin,
      'eslint-comments': eslintCommentsPlugin,
      '@codygo-ai/mono': monoPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use string unions or as const instead of enums',
        },
        {
          selector: 'ImportNamespaceSpecifier',
          message: 'Use selective imports, not wildcard imports',
        },
        {
          selector: 'Literal[value=null]',
          message: "Usage of 'null' is not allowed. Use 'undefined' instead.",
        },
        {
          selector: 'ExportNamedDeclaration[source=null] > ExportSpecifier',
          message: 'Use inline export declarations instead of separate export statements',
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-unreachable': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'eslint-comments/no-unlimited-disable': 'error',
      'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: false }],
      '@codygo-ai/mono/package-naming': 'error',
      '@codygo-ai/mono/package-hierarchy': 'error',
      '@codygo-ai/mono/no-js-extension': 'error',
      '@codygo-ai/mono/prefer-function-declaration': 'error',
      '@codygo-ai/mono/prefer-minimal-checks': 'error',
      'import/no-default-export': 'off',
      // Disable rules that require type information
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: false,
        },
      },
    },
  },
  // TypeScript files - with type-checked rules (excludes config files)
  {
    ...createConfig(['**/*.{ts,tsx}'], true, {
      ...tseslint.configs['recommended-type-checked'].rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        { allowArgumentsExplicitlyTypedAsAny: false },
      ],
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-deprecated': 'error',
    }),
    ignores: ['**/*.config.{ts,js,mjs}', '**/vite.config.{ts,js}', '**/tsup.config.{ts,js}'],
  },
  // JavaScript files - without type-checked rules
  createConfig(['**/*.{js,jsx,mjs,cjs}'], false, {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  }),
];
