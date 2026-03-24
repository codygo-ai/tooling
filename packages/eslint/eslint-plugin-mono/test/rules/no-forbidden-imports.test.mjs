import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

import rule from '../../src/rules/no-forbidden-imports.mjs';
import { EnhancedRuleTester } from '../utils/enhanced-rule-tester.mjs';

const ruleTester = new EnhancedRuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

// ── Fixtures: real directory structures ──────────────────────────────

const testDir = join(process.cwd(), 'test/fixtures/forbidden-imports-test');

function setupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  // Module with sentinel (index.ts)
  mkdirSync(join(testDir, 'src/hooks'), { recursive: true });
  writeFileSync(join(testDir, 'src/hooks/index.ts'), 'export { useClick } from "./useClick";');
  writeFileSync(join(testDir, 'src/hooks/useClick.ts'), 'export function useClick() {}');
  writeFileSync(join(testDir, 'src/hooks/useHover.ts'), 'export function useHover() {}');

  // Module without sentinel (common dir, no index.ts)
  mkdirSync(join(testDir, 'src/common'), { recursive: true });
  writeFileSync(join(testDir, 'src/common/types.ts'), 'export type Foo = string;');
  writeFileSync(join(testDir, 'src/common/utils.ts'), 'export function helper() {}');

  // Nested module with sentinel
  mkdirSync(join(testDir, 'src/Chat'), { recursive: true });
  writeFileSync(join(testDir, 'src/Chat/index.ts'), 'export { Chat } from "./Chat";');
  writeFileSync(join(testDir, 'src/Chat/Chat.tsx'), 'export function Chat() {}');
  writeFileSync(join(testDir, 'src/Chat/useChat.ts'), 'export function useChat() {}');
  writeFileSync(join(testDir, 'src/Chat/reducer.ts'), 'export function reducer() {}');

  // Root sentinel
  writeFileSync(join(testDir, 'src/index.ts'), 'export * from "./Chat";');

  // Consumer file outside modules
  writeFileSync(join(testDir, 'src/app.ts'), '');

  // Deep nested consumer
  mkdirSync(join(testDir, 'src/features/settings'), { recursive: true });
  writeFileSync(join(testDir, 'src/features/settings/page.ts'), '');
}

function cleanupFixtures() {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

setupFixtures();

// ── Pattern-based tests (no filesystem needed) ──────────────────────

ruleTester.run('no-forbidden-imports', rule, {
  valid: [
    // Direct file imports
    { code: "import { User } from '@codygo-ai/models';" },
    { code: "import { helper } from './utils/helper';" },
    { code: "import { helper } from '../common/helper';" },
    { code: "import { X } from '../events';" },
    { code: "import { X } from '../../common/types';" },
    { code: "import { capitalize } from '@codygo-ai/utils/string';" },
    // Re-exports from local files
    { code: "export * from './socketIOTransport';" },
    { code: "export { Foo } from './types';" },
    // Directory import through sentinel — correct external usage
    { code: "import { Button } from './components';" },
    { code: "import { useChat } from '../Chat';" },

    // ── Fixture-based: correct patterns ──

    // Sibling file inside same dir (no sentinel involved)
    {
      name: 'sibling import inside Chat/ — direct file, no sentinel',
      code: "import { reducer } from './reducer';",
      filename: join(testDir, 'src/Chat/Chat.tsx'),
    },
    // Import from common/ (no sentinel) — direct file
    {
      name: 'import from common/ (no index.ts) — direct file',
      code: "import { helper } from '../common/utils';",
      filename: join(testDir, 'src/Chat/Chat.tsx'),
    },
    // External consumer imports through sentinel directory
    {
      name: 'app imports through Chat/ sentinel',
      code: "import { Chat } from './Chat';",
      filename: join(testDir, 'src/app.ts'),
    },
    // External consumer imports through hooks/ sentinel
    {
      name: 'app imports through hooks/ sentinel',
      code: "import { useClick } from './hooks';",
      filename: join(testDir, 'src/app.ts'),
    },
    // Deep consumer imports common/ directly (no sentinel)
    {
      name: 'deep consumer imports common/ file directly',
      code: "import { helper } from '../../common/utils';",
      filename: join(testDir, 'src/features/settings/page.ts'),
    },
  ],

  invalid: [
    // ── Pattern-based: bare dot/dotdot ──
    { name: '.', code: "import X from '.';", errors: [{ messageId: 'noIndexResolving' }] },
    { name: './', code: "import X from './';", errors: [{ messageId: 'noIndexResolving' }] },
    { name: '..', code: "import { X } from '..';", errors: [{ messageId: 'noIndexResolving' }] },
    { name: '../', code: "import { X } from '../';", errors: [{ messageId: 'noIndexResolving' }] },
    {
      name: '../..',
      code: "import { X } from '../..';",
      errors: [{ messageId: 'noIndexResolving' }],
    },
    {
      name: '../../..',
      code: "import { X } from '../../..';",
      errors: [{ messageId: 'noIndexResolving' }],
    },

    // ── Pattern-based: explicit /index ──
    {
      name: './index',
      code: "import { X } from './index';",
      errors: [{ messageId: 'noIndexResolving' }],
    },
    {
      name: '../index',
      code: "import { X } from '../index';",
      errors: [{ messageId: 'noIndexResolving' }],
    },
    {
      name: '../../index',
      code: "import { X } from '../../index';",
      errors: [{ messageId: 'noIndexResolving' }],
    },
    {
      name: './foo/index',
      code: "import { X } from './foo/index';",
      errors: [{ messageId: 'noIndexResolving' }],
    },
    {
      name: '@scope/pkg/index',
      code: "import { X } from '@codygo-ai/models/index';",
      errors: [{ messageId: 'noIndexResolving' }],
    },

    // ── Pattern-based: trailing slash ──
    {
      name: './foo/',
      code: "import { X } from './foo/';",
      errors: [{ messageId: 'noIndexResolving' }],
    },
    {
      name: '../foo/',
      code: "import { X } from '../foo/';",
      errors: [{ messageId: 'noIndexResolving' }],
    },

    // ── Pattern-based: bare index ──
    {
      name: 'index',
      code: "import { X } from 'index';",
      errors: [{ messageId: 'noIndexResolving' }],
    },

    // ── Pattern-based: export statements ──
    {
      name: 'export from ..',
      code: "export { Foo } from '..';",
      errors: [{ messageId: 'noIndexResolving' }],
    },
    {
      name: 'export * from ../index',
      code: "export * from '../index';",
      errors: [{ messageId: 'noIndexResolving' }],
    },

    // ── Pattern-based: /src in package paths ──
    {
      name: '@scope/pkg/src/user',
      code: "import { User } from '@codygo-ai/models/src/user';",
      errors: [{ messageId: 'noSrcImport' }],
    },

    // ── Fixture-based: sentinel violations ──

    // Importing through .. from inside Chat/ (resolves to src/index.ts sentinel)
    {
      name: 'Chat/Chat.tsx imports from ".." — resolves through src/index.ts sentinel',
      code: "import { something } from '..';",
      filename: join(testDir, 'src/Chat/Chat.tsx'),
      errors: [{ messageId: 'noIndexResolving' }],
    },
    // Importing ../index explicitly from inside a module
    {
      name: 'Chat/Chat.tsx imports from "../index" — explicit sentinel import',
      code: "import { something } from '../index';",
      filename: join(testDir, 'src/Chat/Chat.tsx'),
      errors: [{ messageId: 'noIndexResolving' }],
    },
    // Importing ./hooks/index explicitly
    {
      name: 'app.ts imports from "./hooks/index" — explicit index',
      code: "import { useClick } from './hooks/index';",
      filename: join(testDir, 'src/app.ts'),
      errors: [{ messageId: 'noIndexResolving' }],
    },
    // Deep consumer using .. chain to reach root sentinel
    {
      name: 'deep consumer imports "../.." — resolves through sentinel',
      code: "import { Chat } from '../..';",
      filename: join(testDir, 'src/features/settings/page.ts'),
      errors: [{ messageId: 'noIndexResolving' }],
    },
  ],
});

cleanupFixtures();
