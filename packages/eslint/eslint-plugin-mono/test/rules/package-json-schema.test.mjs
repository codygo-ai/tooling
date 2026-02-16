import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

import { RuleTester } from 'eslint';

import rule from '../../src/rules/package-json-schema.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: await import('jsonc-eslint-parser'),
  },
});

// Create test fixtures for TypeScript/JavaScript detection
const testDir = join(process.cwd(), 'test/fixtures/typescript-detection-test');

function setupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }

  // TypeScript project with tsconfig.json
  mkdirSync(join(testDir, 'ts-with-tsconfig', 'src'), { recursive: true });
  writeFileSync(join(testDir, 'ts-with-tsconfig', 'tsconfig.json'), '{}');
  writeFileSync(join(testDir, 'ts-with-tsconfig', 'src', 'index.ts'), '');

  // TypeScript project with .ts files (no tsconfig.json) - has index.ts
  mkdirSync(join(testDir, 'ts-with-files', 'src'), { recursive: true });
  writeFileSync(join(testDir, 'ts-with-files', 'src', 'index.ts'), '');

  // TypeScript project without index.ts (for testing missing file error)
  mkdirSync(join(testDir, 'ts-without-index', 'src'), { recursive: true });
  writeFileSync(join(testDir, 'ts-without-index', 'tsconfig.json'), '{}');

  // JavaScript project (only .mjs files)
  mkdirSync(join(testDir, 'js-project', 'src'), { recursive: true });
  writeFileSync(join(testDir, 'js-project', 'src', 'index.mjs'), '');

  // JavaScript project with exports and types field
  mkdirSync(join(testDir, 'js-with-types-field', 'src'), { recursive: true });
  writeFileSync(join(testDir, 'js-with-types-field', 'src', 'index.mjs'), '');
}

function cleanupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }
}

setupFixtures();

ruleTester.run('package-json-schema', rule, {
  valid: [
    {
      filename: 'server/libs/models/package.json',
      code: '{"name": "@codygo-ai/models", "version": "0.0.0", "private": true, "type": "module"}',
      options: [
        {
          requiredFields: ['name', 'version', 'private', 'type'],
          fieldValues: { type: 'module', private: true },
        },
      ],
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"scripts": {"build": "tsup", "dev": "tsx", "start": "node", "lint": "eslint", "check-typing": "tsc"}}',
      options: [{ requiredScripts: ['build', 'dev', 'start', 'lint', 'check-typing'] }],
    },
    // TypeScript project with check-typing script
    {
      filename: join(testDir, 'ts-with-tsconfig', 'package.json'),
      code: '{"scripts": {"lint": "eslint", "check-typing": "tsc"}}',
      options: [{ requiredScripts: ['lint', 'check-typing'] }],
    },
    // JavaScript project without check-typing script (should be valid)
    {
      filename: join(testDir, 'js-project', 'package.json'),
      code: '{"scripts": {"lint": "eslint"}}',
      options: [{ requiredScripts: ['lint', 'check-typing'] }],
    },
    // JavaScript project with types field in package.json (should be allowed)
    {
      filename: join(testDir, 'js-with-types-field', 'package.json'),
      code: '{"types": "./src/index.d.ts", "exports": {".": "./src/index.mjs"}}',
      options: [{ forbiddenFields: ['types'] }],
    },
    // TypeScript project with types in exports
    {
      filename: join(testDir, 'ts-with-tsconfig', 'package.json'),
      code: '{"exports": {".": {"types": "./src/index.ts", "default": "./src/index.ts"}}}',
      options: [
        {
          exports: {
            required: true,
            requireTypesAndDefault: true,
            mainRequiresIndexFile: true,
          },
        },
      ],
    },
    // JavaScript project without types in exports (should be valid)
    {
      filename: join(testDir, 'js-project', 'package.json'),
      code: '{"exports": {".": "./src/index.mjs"}}',
      options: [
        {
          exports: {
            required: true,
            requireTypesAndDefault: true,
            mainRequiresIndexFile: true,
          },
        },
      ],
    },
  ],

  invalid: [
    {
      filename: 'server/libs/models/package.json',
      code: '{}',
      options: [{ requiredFields: ['name', 'exports'] }],
      errors: [{ messageId: 'missingField' }, { messageId: 'missingField' }],
    },
    {
      filename: 'server/libs/models/package.json',
      code: '{"type": "commonjs"}',
      options: [{ fieldValues: { type: 'module' } }],
      errors: [{ messageId: 'wrongValue' }],
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"scripts": {}}',
      options: [{ requiredScripts: ['build'] }],
      errors: [{ messageId: 'missingScript' }],
    },
    // TypeScript project missing check-typing script
    {
      filename: join(testDir, 'ts-with-tsconfig', 'package.json'),
      code: '{"scripts": {"lint": "eslint"}}',
      options: [{ requiredScripts: ['lint', 'check-typing'] }],
      errors: [{ messageId: 'missingScript', data: { script: 'check-typing' } }],
    },
    // TypeScript project missing types in exports
    {
      filename: join(testDir, 'ts-with-tsconfig', 'package.json'),
      code: '{"exports": {".": {"default": "./src/index.ts"}}}',
      options: [
        {
          exports: {
            required: true,
            requireTypesAndDefault: true,
            mainRequiresIndexFile: false, // Disable index file check for this test
          },
        },
      ],
      errors: [{ messageId: 'exportsMissingTypes', data: { key: '.' } }],
    },
    // TypeScript project with types field (should be forbidden)
    {
      filename: join(testDir, 'ts-with-tsconfig', 'package.json'),
      code: '{"types": "./src/index.d.ts"}',
      output: '{}',
      options: [{ forbiddenFields: ['types'] }],
      errors: [{ messageId: 'forbiddenField', data: { field: 'types' } }],
    },
  ],
});

cleanupFixtures();
