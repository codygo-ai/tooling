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
      name: 'index.ts with local re-exports',
      filename: 'src/components/index.ts',
      code: `
        export { default as Button } from './Button';
        export { default as Input } from './Input';
      `,
    },
    {
      name: 'index.ts with export * from local',
      filename: 'src/utils/index.ts',
      code: `
        export * from './formatDate';
        export * from './parseDate';
      `,
    },
    {
      name: 'index.ts with named re-exports from local',
      filename: 'src/api/index.ts',
      code: `
        export { Config } from './config';
        export * from './endpoints';
      `,
    },
    {
      name: 'non-index file is not checked',
      filename: 'src/other.ts',
      code: `
        function helper() { return 'test'; }
        export { helper };
      `,
    },
  ],

  invalid: [
    {
      name: 'index.ts with variable declaration',
      filename: 'src/utils/index.ts',
      code: `
        const helper = 'test';
        export { helper };
      `,
      errors: [{ messageId: 'nonExportStatement' }],
    },
    {
      name: 'index.ts with function declaration',
      filename: 'src/components/index.ts',
      code: `
        export { default as Button } from './Button';
        function processEvent(event) { return event.type; }
        export { processEvent };
      `,
      errors: [{ messageId: 'nonExportStatement' }],
    },
    {
      name: 'index.ts with class declaration',
      filename: 'src/api/index.ts',
      code: `
        class ApiClient { constructor() {} }
        export { ApiClient };
      `,
      errors: [{ messageId: 'nonExportStatement' }],
    },
    {
      name: 'index.ts re-exporting from external npm package',
      filename: 'src/hooks/index.ts',
      code: `
        export { useDomRef } from '@worknet/preact-utils';
        export { useClickOutside } from './useClickOutside';
      `,
      errors: [{ messageId: 'externalReExport' }],
    },
    {
      name: 'index.ts re-exporting from workspace package',
      filename: 'src/index.ts',
      code: `
        export * from '@worknet/some-lib';
        export * from './local';
      `,
      errors: [{ messageId: 'externalReExport' }],
    },
    {
      name: 'index.ts named export from external',
      filename: 'src/index.ts',
      code: `
        export { SomeType } from 'external-lib';
        export * from './local';
      `,
      errors: [{ messageId: 'externalReExport' }],
    },
  ],
});
