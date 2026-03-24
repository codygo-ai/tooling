import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

import rule from '../../src/rules/require-env-example.mjs';
import { EnhancedRuleTester } from '../utils/enhanced-rule-tester.mjs';

const ruleTester = new EnhancedRuleTester({
  languageOptions: {
    parser: await import('jsonc-eslint-parser'),
  },
});

const testDir = join(process.cwd(), 'test/fixtures/env-example-test');

function setupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }

  // App with .env.sample (default filename)
  mkdirSync(join(testDir, 'client/apps/with-env-sample'), { recursive: true });
  writeFileSync(join(testDir, 'client/apps/with-env-sample/.env.sample'), 'API_URL=\n');
  writeFileSync(
    join(testDir, 'client/apps/with-env-sample/package.json'),
    '{"name": "@codygo-ai/test"}'
  );

  // App without .env.sample
  mkdirSync(join(testDir, 'client/apps/without-env-sample'), { recursive: true });
  writeFileSync(
    join(testDir, 'client/apps/without-env-sample/package.json'),
    '{"name": "@codygo-ai/test"}'
  );

  // Lib without .env.sample (should pass — appsOnly default is true)
  mkdirSync(join(testDir, 'client/libs/some-lib'), { recursive: true });
  writeFileSync(
    join(testDir, 'client/libs/some-lib/package.json'),
    '{"name": "@codygo-ai/test-lib"}'
  );

  // App with custom filename
  mkdirSync(join(testDir, 'server/apps/custom-name'), { recursive: true });
  writeFileSync(join(testDir, 'server/apps/custom-name/.env.example'), 'PORT=8080\n');
  writeFileSync(
    join(testDir, 'server/apps/custom-name/package.json'),
    '{"name": "@codygo-ai/test"}'
  );
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
      name: 'App with .env.sample - should pass',
      filename: join(testDir, 'client/apps/with-env-sample/package.json'),
      code: '{"name": "@codygo-ai/test"}',
    },
    {
      name: 'Lib without .env.sample - should pass (appsOnly)',
      filename: join(testDir, 'client/libs/some-lib/package.json'),
      code: '{"name": "@codygo-ai/test-lib"}',
    },
    {
      name: 'App with custom filename .env.example - should pass',
      options: [{ filename: '.env.example' }],
      filename: join(testDir, 'server/apps/custom-name/package.json'),
      code: '{"name": "@codygo-ai/test"}',
    },
  ],

  invalid: [
    {
      name: 'App without .env.sample - should report missingEnvFile',
      filename: join(testDir, 'client/apps/without-env-sample/package.json'),
      code: '{"name": "@codygo-ai/test"}',
      errors: [
        {
          messageId: 'missingEnvFile',
          data: { filename: '.env.sample' },
        },
      ],
    },
    {
      name: 'App with wrong filename when custom is required',
      options: [{ filename: '.env.local' }],
      filename: join(testDir, 'server/apps/custom-name/package.json'),
      code: '{"name": "@codygo-ai/test"}',
      errors: [
        {
          messageId: 'missingEnvFile',
          data: { filename: '.env.local' },
        },
      ],
    },
  ],
});

cleanupFixtures();
