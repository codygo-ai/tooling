import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { RuleTester } from 'eslint';

import packageNamingRule from '../../src/rules/package-naming.mjs';

const __dirname = import.meta.dirname;

// Create a temporary test directory
const TEST_DIR = join(__dirname, '../../.test-tmp');
const TEST_FILE = join(TEST_DIR, 'test-file.js');

function setupTestDir() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }
  mkdirSync(TEST_DIR, { recursive: true });
}

function cleanupTestDir() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore errors when cleaning up test directory
  }
}

function createPackageJson(name, dir = TEST_DIR) {
  const packageJsonPath = join(dir, 'package.json');
  writeFileSync(packageJsonPath, JSON.stringify({ name }, undefined, 2));
  return packageJsonPath;
}

test('package-naming: valid @codygo namespace', async () => {
  setupTestDir();
  try {
    createPackageJson('@codygo-ai/test-package');
    writeFileSync(TEST_FILE, 'const x = 1;');

    const ruleTester = new RuleTester({
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
    });

    // Mock the context to use our test file
    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      await ruleTester.run('package-naming', packageNamingRule, {
        valid: [
          {
            code: 'const x = 1;',
            filename: TEST_FILE,
          },
        ],
        invalid: [],
      });
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    cleanupTestDir();
  }
});

test('package-naming: valid @bizsist namespace', async () => {
  setupTestDir();
  try {
    createPackageJson('@bizsist/test-package');
    writeFileSync(TEST_FILE, 'const x = 1;');

    const ruleTester = new RuleTester({
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
    });

    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      await ruleTester.run('package-naming', packageNamingRule, {
        valid: [
          {
            code: 'const x = 1;',
            filename: TEST_FILE,
          },
        ],
        invalid: [],
      });
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    cleanupTestDir();
  }
});

test('package-naming: invalid namespace - missing valid prefix', async () => {
  setupTestDir();
  try {
    createPackageJson('invalid-package');
    writeFileSync(TEST_FILE, 'const x = 1;');

    const ruleTester = new RuleTester({
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
    });

    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      await ruleTester.run('package-naming', packageNamingRule, {
        valid: [],
        invalid: [
          {
            code: 'const x = 1;',
            filename: TEST_FILE,
            errors: [
              {
                messageId: 'invalidNamespace',
                data: { name: 'invalid-package' },
              },
            ],
          },
        ],
      });
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    cleanupTestDir();
  }
});

test('package-naming: invalid namespace - wrong namespace', async () => {
  setupTestDir();
  try {
    createPackageJson('@other/test-package');
    writeFileSync(TEST_FILE, 'const x = 1;');

    const ruleTester = new RuleTester({
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
    });

    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      await ruleTester.run('package-naming', packageNamingRule, {
        valid: [],
        invalid: [
          {
            code: 'const x = 1;',
            filename: TEST_FILE,
            errors: [
              {
                messageId: 'invalidNamespace',
                data: { name: '@other/test-package' },
              },
            ],
          },
        ],
      });
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    cleanupTestDir();
  }
});

test('package-naming: no package.json - should not error', async () => {
  setupTestDir();
  try {
    // Don't create package.json
    writeFileSync(TEST_FILE, 'const x = 1;');

    const ruleTester = new RuleTester({
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
    });

    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      await ruleTester.run('package-naming', packageNamingRule, {
        valid: [
          {
            code: 'const x = 1;',
            filename: TEST_FILE,
          },
        ],
        invalid: [],
      });
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    cleanupTestDir();
  }
});

test('package-naming: package.json without name - should not error', async () => {
  setupTestDir();
  try {
    writeFileSync(
      join(TEST_DIR, 'package.json'),
      JSON.stringify({ version: '1.0.0' }, undefined, 2)
    );
    writeFileSync(TEST_FILE, 'const x = 1;');

    const ruleTester = new RuleTester({
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
    });

    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      await ruleTester.run('package-naming', packageNamingRule, {
        valid: [
          {
            code: 'const x = 1;',
            filename: TEST_FILE,
          },
        ],
        invalid: [],
      });
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    cleanupTestDir();
  }
});

test('package-naming: finds package.json in parent directory', async () => {
  setupTestDir();
  try {
    const subDir = join(TEST_DIR, 'sub', 'dir');
    mkdirSync(subDir, { recursive: true });
    createPackageJson('@codygo-ai/test-package', TEST_DIR);
    const testFile = join(subDir, 'test-file.js');
    writeFileSync(testFile, 'const x = 1;');

    const ruleTester = new RuleTester({
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
    });

    const originalCwd = process.cwd();
    process.chdir(TEST_DIR);

    try {
      await ruleTester.run('package-naming', packageNamingRule, {
        valid: [
          {
            code: 'const x = 1;',
            filename: testFile,
          },
        ],
        invalid: [],
      });
    } finally {
      process.chdir(originalCwd);
    }
  } finally {
    cleanupTestDir();
  }
});
