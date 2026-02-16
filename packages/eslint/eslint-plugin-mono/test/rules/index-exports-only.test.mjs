import rule from '../../src/rules/index-exports-only.mjs';
import { EnhancedRuleTester } from '../utils/enhanced-rule-tester.mjs';

const ruleTester = new EnhancedRuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('index-exports-only', rule, {
  valid: [
    {
      name: 'index.ts with only exports - should pass',
      filename: 'src/components/index.ts',
      code: `
        export { default as Button } from './Button';
        export { default as Input } from './Input';
      `,
    },
    {
      name: 'index.ts with only named exports - should pass',
      filename: 'src/utils/index.ts',
      code: `
        export { formatDate } from './formatDate';
        export { parseDate } from './parseDate';
      `,
    },
    {
      name: 'index.ts with imports and exports - should pass',
      filename: 'src/api/index.ts',
      code: `
        import { client } from './client';
        export { client };
        export { fetchUser } from './endpoints';
      `,
    },
    {
      name: 'Non-index.ts file - should not be checked',
      filename: 'src/other.ts',
      code: `
        function helper() {
          return 'test';
        }
        export { helper };
      `,
    },
  ],

  invalid: [
    {
      name: 'index.ts with function declaration - should report nonExportStatement',
      filename: 'src/components/index.ts',
      code: `
        export { default as Button } from './Button';
        
        function processEvent(event) {
          return event.type;
        }
        
        export { processEvent };
      `,
      errors: [
        {
          messageId: 'nonExportStatement',
        },
      ],
    },
    {
      name: 'index.ts with variable declaration - should report nonExportStatement',
      filename: 'src/utils/index.ts',
      code: `
        const helper = 'test';
        export { helper };
      `,
      errors: [
        {
          messageId: 'nonExportStatement',
        },
      ],
    },
    {
      name: 'index.ts with class declaration - should report nonExportStatement',
      filename: 'src/api/index.ts',
      code: `
        class ApiClient {
          constructor() {}
        }
        export { ApiClient };
      `,
      errors: [
        {
          messageId: 'nonExportStatement',
        },
      ],
    },
  ],
});
