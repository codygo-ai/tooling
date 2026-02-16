import rule from '../../src/rules/no-dotenv.mjs';
import { EnhancedRuleTester } from '../utils/enhanced-rule-tester.mjs';

const ruleTester = new EnhancedRuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-dotenv', rule, {
  valid: [
    {
      name: 'process.env usage (not dotenv) - should pass',
      code: `
        const API_URL = process.env.API_URL ?? 'API_URL_missing';
      `,
    },
    {
      name: 'Other package import - should pass',
      code: `
        import { something } from 'other-package';
      `,
    },
    {
      name: 'Other package require - should pass',
      code: `
        require('other-package');
      `,
    },
  ],

  invalid: [
    {
      name: 'dotenv import - should report noDotenvImport',
      code: `
        import dotenv from 'dotenv';
      `,
      errors: [
        {
          messageId: 'noDotenvImport',
        },
      ],
    },
    {
      name: 'dotenv require - should report noDotenvImport',
      code: `
        const dotenv = require('dotenv');
      `,
      errors: [
        {
          messageId: 'noDotenvImport',
        },
      ],
    },
    {
      name: 'dotenv import and config - should report both errors',
      code: `
        import dotenv from 'dotenv';
        dotenv.config();
      `,
      errors: [
        {
          messageId: 'noDotenvImport',
        },
        {
          messageId: 'noDotenvConfig',
        },
      ],
    },
    {
      name: 'require dotenv config - should report noDotenvConfig',
      code: `
        require('dotenv').config();
      `,
      errors: [
        {
          messageId: 'noDotenvConfig',
        },
      ],
    },
  ],
});
