import { RuleTester } from 'eslint';

import rule from '../../src/rules/peer-deps-pattern.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: await import('jsonc-eslint-parser'),
  },
});

ruleTester.run('peer-deps-pattern', rule, {
  valid: [
    {
      filename: 'client/libs/ui/package.json',
      code: JSON.stringify({
        peerDependencies: { react: '^18.2.0' },
        devDependencies: { react: '^18.2.0' },
        dependencies: { '@codygo-ai/models': 'workspace:^' },
      }),
    },
    {
      filename: 'client/libs/ui/package.json',
      code: `{
        "dependencies": {
          "@codygo-ai/models": "workspace:^",
          "pdfkit": "^0.13.0"
        }
      }
      // dependency-bundled: pdfkit - Abstracts PDF generation`,
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"dependencies": {"react": "^18.2.0"}}',
    },
  ],

  invalid: [
    {
      filename: 'client/libs/ui/package.json',
      code: JSON.stringify({
        dependencies: { react: '^18.2.0', '@codygo-ai/models': 'workspace:^' },
      }),
      errors: [{ messageId: 'externalShouldBePeer' }],
    },
    {
      filename: 'client/libs/ui/package.json',
      code: JSON.stringify({
        peerDependencies: { react: '^18.2.0' },
      }),
      errors: [{ messageId: 'missingDevDep' }],
    },
    {
      filename: 'client/libs/ui/package.json',
      code: JSON.stringify({
        peerDependencies: { react: '^18.2.0' },
        devDependencies: { react: '^18.3.0' },
      }),
      errors: [{ messageId: 'versionMismatch' }],
    },
  ],
});
