import { RuleTester } from 'eslint';

import rule from '../../src/rules/prefer-function-declaration.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('prefer-function-declaration', rule, {
  valid: [
    {
      code: 'function processData(data) { return data; }',
    },
    {
      code: 'export function build() { return {}; }',
    },
    {
      code: 'const items = [1, 2, 3].map((item) => item * 2);',
    },
    {
      code: 'const filtered = array.filter((x) => x > 0);',
    },
    {
      code: `
        function Component() {
          const handler = () => { doSomething(); };
          return handler();
        }
      `,
    },
    {
      code: `
        function Component() {
          const items = data.map((item) => item.value);
          return items;
        }
      `,
    },
  ],

  invalid: [
    {
      code: 'const onClick = () => { handleClick(); };',
      errors: [{ messageId: 'preferFunctionDeclaration' }],
    },
    {
      code: 'const processData = (data) => { return data; };',
      errors: [{ messageId: 'preferFunctionDeclaration' }],
    },
    {
      code: 'const build = () => { return {}; };',
      errors: [{ messageId: 'preferFunctionDeclaration' }],
    },
    {
      code: 'const getUser = function(id) { return users[id]; };',
      errors: [{ messageId: 'preferFunctionDeclaration' }],
    },
    {
      code: 'export const build = () => { return {}; };',
      errors: [{ messageId: 'preferFunctionDeclaration' }],
    },
  ],
});
