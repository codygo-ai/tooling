import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

import { RuleTester } from 'eslint';

import rule from '../../src/rules/required-files.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: await import('jsonc-eslint-parser'),
  },
});

// Create test fixtures
const testDir = join(process.cwd(), 'test/fixtures/required-files-test');

function setupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }

  mkdirSync(join(testDir, 'with-files'), { recursive: true });
  writeFileSync(join(testDir, 'with-files/tsup.config.ts'), '');
  writeFileSync(join(testDir, 'with-files/package.json'), '{"name": "@codygo-ai/test"}');

  mkdirSync(join(testDir, 'without-files'), { recursive: true });
  writeFileSync(join(testDir, 'without-files/package.json'), '{"name": "@codygo-ai/test"}');
}

function cleanupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }
}

setupFixtures();

ruleTester.run('required-files', rule, {
  valid: [
    {
      filename: join(testDir, 'with-files/package.json'),
      code: '{"name": "@codygo-ai/test"}',
      options: [{ files: ['tsup.config.ts'] }],
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"name": "@codygo-ai/api"}',
      options: [{ files: [] }],
    },
  ],

  invalid: [
    {
      filename: join(testDir, 'without-files/package.json'),
      code: '{"name": "@codygo-ai/test"}',
      options: [{ files: ['tsup.config.ts'] }],
      errors: [{ messageId: 'missingFile' }],
    },
    {
      filename: join(testDir, 'without-files/package.json'),
      code: '{"name": "@codygo-ai/test"}',
      options: [{ files: ['vite.config.ts', 'index.html'] }],
      errors: [{ messageId: 'missingFile' }, { messageId: 'missingFile' }],
    },
  ],
});

cleanupFixtures();
