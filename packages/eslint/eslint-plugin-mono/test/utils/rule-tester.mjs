import { join } from 'node:path';

import { RuleTester } from '@typescript-eslint/rule-tester';

const __dirname = import.meta.dirname;

// Configure RuleTester for ESM
export function createRuleTester() {
  return new RuleTester({
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  });
}

// Helper to create a temporary package.json for testing
export function createTestPackageJson(name, dir) {
  return {
    path: join(dir, 'package.json'),
    content: JSON.stringify({ name }, undefined, 2),
  };
}
