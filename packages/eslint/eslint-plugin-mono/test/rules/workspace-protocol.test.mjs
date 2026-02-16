import { RuleTester } from 'eslint';

import rule from '../../src/rules/workspace-protocol.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: await import('jsonc-eslint-parser'),
  },
  settings: {
    mono: {
      namespace: '@codygo-ai',
      protocol: 'workspace:^',
    },
  },
});

ruleTester.run('workspace-protocol', rule, {
  valid: [
    {
      filename: 'server/apps/api/package.json',
      code: '{"dependencies": {"@codygo-ai/models": "workspace:^"}}',
      options: [{ namespace: '@codygo-ai', protocol: 'workspace:^' }],
    },
    {
      filename: 'client/libs/ui/package.json',
      code: '{"devDependencies": {"@codygo-ai/tsconfig": "workspace:^"}}',
      options: [{ namespace: '@codygo-ai' }],
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"peerDependencies": {"@codygo-ai/types": "workspace:^"}}',
      options: [{ namespace: '@codygo-ai' }],
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"dependencies": {"react": "^18.2.0"}}',
      options: [{ namespace: '@codygo-ai' }],
    },
  ],

  invalid: [
    {
      filename: 'server/apps/api/package.json',
      code: '{"dependencies": {"@codygo-ai/models": "workspace:*"}}',
      options: [{ namespace: '@codygo-ai', protocol: 'workspace:^' }],
      errors: [{ messageId: 'wrongProtocol' }],
      output: '{"dependencies": {"@codygo-ai/models": "workspace:^"}}',
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"dependencies": {"@codygo-ai/models": "0.0.0"}}',
      options: [{ namespace: '@codygo-ai' }],
      errors: [{ messageId: 'wrongProtocol' }],
      output: '{"dependencies": {"@codygo-ai/models": "workspace:^"}}',
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"devDependencies": {"@codygo-ai/tsconfig": "workspace:~"}}',
      options: [{ namespace: '@codygo-ai' }],
      errors: [{ messageId: 'wrongProtocol' }],
      output: '{"devDependencies": {"@codygo-ai/tsconfig": "workspace:^"}}',
    },
    {
      filename: 'server/apps/api/package.json',
      code: '{"dependencies":{"@codygo-ai/models":"workspace:*","@codygo-ai/types":"0.0.0"}}',
      options: [{ namespace: '@codygo-ai' }],
      errors: [{ messageId: 'wrongProtocol' }, { messageId: 'wrongProtocol' }],
      output: '{"dependencies":{"@codygo-ai/models":"workspace:^","@codygo-ai/types":"workspace:^"}}',
    },
  ],
});
