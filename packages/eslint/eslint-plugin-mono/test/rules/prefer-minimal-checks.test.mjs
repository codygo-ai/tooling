import { RuleTester } from 'eslint';

import rule from '../../src/rules/prefer-minimal-checks.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-minimal-checks', rule, {
  valid: [
    {
      code: 'if (!value) { doSomething(); }',
    },
    {
      code: 'if (!!value) { doSomething(); }',
    },
    {
      code: 'if (Boolean(value)) { doSomething(); }',
    },
    {
      code: 'if (value === "active") { doSomething(); }',
    },
    {
      code: 'if (value !== 0) { doSomething(); }',
    },
  ],

  invalid: [
    {
      code: 'if (value === undefined || value === null) { doSomething(); }',
      errors: [{ messageId: 'preferMinimalCheck' }],
      output: 'if (!value) { doSomething(); }',
    },
    {
      code: 'if (value === null || value === undefined) { doSomething(); }',
      errors: [{ messageId: 'preferMinimalCheck' }],
      output: 'if (!value) { doSomething(); }',
    },
    {
      code: 'if (value !== undefined && value !== null) { doSomething(); }',
      errors: [{ messageId: 'preferMinimalCheck' }],
      output: 'if (!!value) { doSomething(); }',
    },
    {
      code: 'if (value !== null && value !== undefined) { doSomething(); }',
      errors: [{ messageId: 'preferMinimalCheck' }],
      output: 'if (!!value) { doSomething(); }',
    },
  ],
});
