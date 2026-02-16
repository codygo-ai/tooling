import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

import rule from '../../src/rules/require-env-example.mjs';
import { EnhancedRuleTester } from '../utils/enhanced-rule-tester.mjs';

const ruleTester = new EnhancedRuleTester({
  languageOptions: {
    parser: await import('jsonc-eslint-parser'),
  },
});

// Create test fixtures
const testDir = join(process.cwd(), 'test/fixtures/env-example-test');

function setupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }

  mkdirSync(join(testDir, 'with-env-example'), { recursive: true });
  writeFileSync(
    join(testDir, 'with-env-example/.env.example'),
    'API_URL=https://api.example.com\n'
  );
  writeFileSync(join(testDir, 'with-env-example/package.json'), '{"name": "@codygo-ai/test"}');

  mkdirSync(join(testDir, 'without-env-example'), { recursive: true });
  writeFileSync(join(testDir, 'without-env-example/package.json'), '{"name": "@codygo-ai/test"}');
}

function cleanupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }
}

setupFixtures();

ruleTester.run('require-env-example', rule, {
  valid: [
    {
      name: 'Package with .env.example - should pass',
      filename: join(testDir, 'with-env-example/package.json'),
      code: '{"name": "@codygo-ai/test"}',
    },
  ],

  invalid: [
    {
      name: 'Package without .env.example - should report missingEnvExample',
      filename: join(testDir, 'without-env-example/package.json'),
      code: '{"name": "@codygo-ai/test"}',
      errors: [
        {
          messageId: 'missingEnvExample',
        },
      ],
    },
  ],
});

cleanupFixtures();
