import { RuleTester } from 'eslint';

import rule from '../../src/rules/dev-deps-location.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: await import('jsonc-eslint-parser'),
  },
});

ruleTester.run('dev-deps-location', rule, {
  valid: [
    {
      filename: 'package.json',
      code: '{"devDependencies": {"typescript": "^5.0.0"}}',
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"dependencies": {"@codygo-ai/models": "workspace:^"}}',
    },
    {
      filename: 'server/apps/api/package.json',
      code: `{
        "devDependencies": {"special-tool": "^1.0.0"}
        // devDeps-exception: Needs special tool for codegen
      }`,
    },
    {
      filename: 'server/libs/core/logging/package.json',
      code: JSON.stringify({
        peerDependencies: { pino: '^9.0.0' },
        devDependencies: { pino: '^9.0.0' },
      }),
    },
  ],

  invalid: [
    {
      filename: 'server/apps/api/package.json',
      code: '{"devDependencies": {"typescript": "^5.0.0"}}',
      errors: [{ messageId: 'devDepsInPackage' }],
    },
    {
      filename: 'client/libs/ui/package.json',
      code: '{"dependencies": {"@codygo-ai/models": "workspace:^"}, "devDependencies": {"typescript": "^5.0.0"}}',
      errors: [{ messageId: 'devDepsInPackage' }],
    },
    {
      filename: 'server/libs/core/logging/package.json',
      code: JSON.stringify({
        peerDependencies: { pino: '^9.0.0' },
        devDependencies: { pino: '^9.0.0', typescript: '^5.0.0' },
      }),
      errors: [{ messageId: 'devDepsInPackage' }],
    },
  ],
});
