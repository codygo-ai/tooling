import rule from '../../src/rules/env-vars-at-top.mjs';
import { EnhancedRuleTester } from '../utils/enhanced-rule-tester.mjs';

const ruleTester = new EnhancedRuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('env-vars-at-top', rule, {
  valid: [
    {
      name: 'process.env at top with meaningful defaults',
      code: `
        const API_URL = process.env.API_URL ?? 'https://api.example.com';
        const PORT = process.env.PORT ?? '3000';
        
        function fetchData() {
          return fetch(API_URL);
        }
      `,
    },
    {
      name: 'process.env at top with _missing defaults',
      code: `
        const API_URL = process.env.API_URL ?? 'API_URL_missing';
        const PORT = process.env.PORT ?? 'PORT_missing';
      `,
    },
    {
      name: 'process.env in comparison (===) - should not require default',
      code: `
        const DEBUG = process.env.DEBUG === 'true';
      `,
    },
    {
      name: 'No process.env usage - should pass',
      code: `
        // No process.env usage
        function test() {}
      `,
    },
  ],

  invalid: [
    {
      name: 'process.env used inside function - should report notAtTop',
      code: `
        function fetchData() {
          return fetch(process.env.API_URL ?? 'https://api.example.com');
        }
      `,
      errors: [
        {
          messageId: 'notAtTop',
          data: { varName: 'API_URL' },
        },
      ],
    },
    {
      name: 'process.env at top without default - should report missingDefault',
      code: `
        const API_URL = process.env.API_URL;
        function test() {}
      `,
      errors: [
        {
          messageId: 'missingDefault',
          data: { varName: 'API_URL' },
        },
      ],
      output: `
        const API_URL = process.env.API_URL ?? 'API_URL_missing';
        function test() {}
      `,
    },
    {
      name: 'process.env with undefined default - should report invalidDefault',
      code: `
        const PORT = process.env.PORT ?? undefined;
      `,
      errors: [
        {
          messageId: 'invalidDefault',
          data: { varName: 'PORT' },
        },
      ],
      output: `
        const PORT = process.env.PORT ?? 'PORT_missing';
      `,
    },
    {
      name: 'process.env in local function variable - should report notAtTop',
      code: `
        function test() {
          const local = process.env.LOCAL_VAR ?? 'default';
        }
      `,
      errors: [
        {
          messageId: 'notAtTop',
          data: { varName: 'LOCAL_VAR' },
        },
      ],
    },
  ],
});
