import { RuleTester } from 'eslint';

import rule from '../../src/rules/package-structure.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: await import('jsonc-eslint-parser'),
  },
  settings: {
    mono: {
      namespace: '@codygo-ai',
      scopes: ['common', 'client', 'server', 'devops'],
      types: ['apps', 'libs'],
    },
  },
});

ruleTester.run('package-structure', rule, {
  valid: [
    {
      filename: 'server/apps/api/package.json',
      code: '{"name": "@codygo-ai/api"}',
    },
    {
      filename: 'client/libs/ui-components/package.json',
      code: '{"name": "@codygo-ai/ui-components"}',
    },
    {
      filename: 'common/apps/shared/package.json',
      code: '{"name": "@codygo-ai/shared"}',
    },
    {
      filename: 'devops/libs/aws-utils/package.json',
      code: '{"name": "@codygo-ai/aws-utils"}',
    },
    {
      filename: 'server/libs/aws/s3/package.json',
      code: '{"name": "@codygo-ai/s3"}',
      options: [{ namespace: '@codygo-ai' }],
    },
  ],

  invalid: [
    {
      filename: 'invalid/apps/api/package.json',
      code: '{"name": "@codygo-ai/api"}',
      errors: [{ messageId: 'invalidScope' }],
    },
    {
      filename: 'server/invalid/api/package.json',
      code: '{"name": "@codygo-ai/api"}',
      errors: [{ messageId: 'invalidType' }],
    },
    {
      filename: 'server/apps/MyApi/package.json',
      code: '{"name": "@codygo-ai/MyApi"}',
      errors: [{ messageId: 'notKebabCase' }],
    },
    {
      filename: 'server/apps/my_api/package.json',
      code: '{"name": "@codygo-ai/my_api"}',
      errors: [{ messageId: 'notKebabCase' }],
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"name": "@codygo-ai/wrong-name"}',
      errors: [{ messageId: 'nameMismatch' }],
      output: '{"name": "@codygo-ai/api"}',
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"name": "@other/api"}',
      errors: [{ messageId: 'nameMismatch' }],
      output: '{"name": "@codygo-ai/api"}',
    },
  ],
});
