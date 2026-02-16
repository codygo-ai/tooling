import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

import { RuleTester } from 'eslint';

import rule from '../../src/rules/no-forbidden-imports.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

// Create test fixtures for index.ts enforcement
const testDir = join(process.cwd(), 'test/fixtures/index-ts-test');

function setupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }

  // Create structure with index.ts
  mkdirSync(join(testDir, 'with-index/components'), { recursive: true });
  writeFileSync(
    join(testDir, 'with-index/components/index.ts'),
    'export { Button } from "./Button";'
  );
  writeFileSync(
    join(testDir, 'with-index/components/Button.tsx'),
    'export const Button = () => null;'
  );
  writeFileSync(
    join(testDir, 'with-index/components/Input.tsx'),
    'export const Input = () => null;'
  );
  writeFileSync(join(testDir, 'with-index/app.tsx'), '');

  // Create structure without index.ts
  mkdirSync(join(testDir, 'without-index/utils'), { recursive: true });
  writeFileSync(
    join(testDir, 'without-index/utils/helper.ts'),
    'export const helper = () => null;'
  );
  writeFileSync(join(testDir, 'without-index/app.tsx'), '');

  // Create workspace package structure
  mkdirSync(join(testDir, 'workspace/common/libs/models/src/user'), { recursive: true });
  writeFileSync(
    join(testDir, 'workspace/common/libs/models/src/index.ts'),
    'export { User } from "./user";'
  );
  writeFileSync(
    join(testDir, 'workspace/common/libs/models/src/user/index.ts'),
    'export class User {}'
  );
  writeFileSync(
    join(testDir, 'workspace/common/libs/models/src/user/User.ts'),
    'export class User {}'
  );
  writeFileSync(
    join(testDir, 'workspace/common/libs/models/package.json'),
    '{"name": "@codygo-ai/models"}'
  );
  writeFileSync(join(testDir, 'workspace/package.json'), '{"name": "@codygo-ai/mono"}');
  writeFileSync(join(testDir, 'workspace/app.tsx'), '');
}

function cleanupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }
}

setupFixtures();

ruleTester.run('no-forbidden-imports', rule, {
  valid: [
    {
      code: "import { User } from '@codygo-ai/models';",
    },
    {
      code: "import { shared } from '../shared/utils';",
    },
    {
      code: "import { capitalize } from '@codygo-ai/utils/string';",
    },
    // Valid: Import from directory when index.ts exists
    {
      code: "import { Button } from './components';",
      filename: join(testDir, 'with-index/app.tsx'),
    },
    // Valid: Import from file when index.ts does NOT exist
    {
      code: "import { helper } from './utils/helper';",
      filename: join(testDir, 'without-index/app.tsx'),
    },
  ],

  invalid: [
    {
      code: "import { User } from '@codygo-ai/models/index';",
      errors: [{ messageId: 'noIndexImport' }],
      output: "import { User } from '@codygo-ai/models';",
    },
    {
      code: "import { helper } from './utils/index';",
      errors: [{ messageId: 'noIndexImport' }],
      output: "import { helper } from './utils';",
    },
    {
      code: "import something from '.';",
      errors: [{ messageId: 'noDotImport' }],
    },
    {
      code: "import something from './';",
      errors: [{ messageId: 'noDotSlashImport' }],
    },
    {
      code: "import { User } from '@codygo-ai/models/src/user';",
      errors: [{ messageId: 'noSrcImport' }],
    },
    // Invalid: Import from file when index.ts exists
    {
      code: "import { Button } from './components/Button';",
      filename: join(testDir, 'with-index/app.tsx'),
      errors: [{ messageId: 'useIndexFile' }],
      output: "import { Button } from './components';",
    },
    {
      code: "import { Input } from './components/Input';",
      filename: join(testDir, 'with-index/app.tsx'),
      errors: [{ messageId: 'useIndexFile' }],
      output: "import { Input } from './components';",
    },
  ],
});

cleanupFixtures();
