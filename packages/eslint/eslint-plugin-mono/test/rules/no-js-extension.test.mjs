import { RuleTester } from 'eslint';

import rule from '../../src/rules/no-js-extension.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
});

ruleTester.run('no-js-extension', rule, {
  valid: [
    {
      code: "import { util } from './util';",
    },
    {
      code: "import { helper } from '../helper';",
    },
    {
      code: "import { User } from '@codygo-ai/models';",
    },
    {
      code: "import { config } from './config.json';",
    },
  ],

  invalid: [
    {
      code: "import { util } from './util.js';",
      errors: [{ messageId: 'noJsExtension' }],
      output: "import { util } from './util';",
    },
    {
      code: "import { helper } from '../helper.js';",
      errors: [{ messageId: 'noJsExtension' }],
      output: "import { helper } from '../helper';",
    },
    {
      code: "import { config } from './config.js';",
      errors: [{ messageId: 'noJsExtension' }],
      output: "import { config } from './config';",
    },
  ],
});
