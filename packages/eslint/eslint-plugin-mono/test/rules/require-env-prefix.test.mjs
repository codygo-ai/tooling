import rule from '../../src/rules/require-env-prefix.mjs';
import { EnhancedRuleTester } from '../utils/enhanced-rule-tester.mjs';

const ruleTester = new EnhancedRuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('require-env-prefix', rule, {
  valid: [
    // --- prefixed vars ---
    {
      name: 'allows prefixed vars (default CDG_)',
      code: 'const x = process.env.CDG_STAGE;',
    },
    {
      name: 'allows bracket notation with prefix',
      code: "const x = process.env['CDG_REDIS_URL'];",
    },

    // --- exact whitelisted vars ---
    {
      name: 'allows exact whitelisted vars',
      code: 'const x = process.env.PORT;',
      options: [{ prefix: 'CDG_', allowed: ['PORT'] }],
    },
    {
      name: 'allows bracket notation with whitelisted var',
      code: "const x = process.env['PORT'];",
      options: [{ prefix: 'CDG_', allowed: ['PORT'] }],
    },

    // --- prefix-pattern whitelisted vars ---
    {
      name: 'allows prefix-pattern whitelisted vars',
      code: 'const x = process.env.AWS_REGION;',
      options: [{ prefix: 'CDG_', allowed: ['AWS_*'] }],
    },
    {
      name: 'allows prefix-pattern for any suffix',
      code: 'const x = process.env.AWS_LAMBDA_FUNCTION_NAME;',
      options: [{ prefix: 'CDG_', allowed: ['AWS_*'] }],
    },

    // --- dynamic / non-process.env ---
    {
      name: 'ignores dynamic access',
      code: 'const key = "FOO"; const x = process.env[key];',
    },
    {
      name: 'ignores non-process.env member expressions',
      code: 'const x = config.env.STAGE;',
    },

    // --- custom prefix ---
    {
      name: 'allows custom-prefixed vars',
      code: 'const x = process.env.APP_STAGE;',
      options: [{ prefix: 'APP_' }],
    },

    // --- edge cases ---
    {
      name: 'does not report prefixed var that only matches after stripping prefix',
      code: 'const x = process.env.CDG_CUSTOM;',
      options: [{ prefix: 'CDG_', allowed: ['PORT'] }],
    },
  ],

  invalid: [
    // --- missing prefix ---
    {
      name: 'reports non-prefixed non-whitelisted var',
      code: 'const x = process.env.STAGE;',
      errors: [{ messageId: 'missingPrefix' }],
    },
    {
      name: 'reports bracket notation non-prefixed var',
      code: "const x = process.env['MONGODB_URI'];",
      errors: [{ messageId: 'missingPrefix' }],
    },
    {
      name: 'reports multiple violations',
      code: 'const a = process.env.STAGE; const b = process.env.VERSION;',
      errors: [{ messageId: 'missingPrefix' }, { messageId: 'missingPrefix' }],
    },

    // --- prefix on whitelisted var ---
    {
      name: 'reports prefix on exact-whitelisted var',
      code: 'const x = process.env.CDG_PORT;',
      options: [{ prefix: 'CDG_', allowed: ['PORT'] }],
      errors: [{ messageId: 'forbiddenPrefix' }],
    },
    {
      name: 'reports prefix on prefix-pattern whitelisted var',
      code: 'const x = process.env.CDG_AWS_REGION;',
      options: [{ prefix: 'CDG_', allowed: ['AWS_*'] }],
      errors: [{ messageId: 'forbiddenPrefix' }],
    },
    {
      name: 'reports prefix bracket notation on whitelisted var',
      code: "const x = process.env['CDG_NODE_ENV'];",
      options: [{ prefix: 'CDG_', allowed: ['NODE_ENV'] }],
      errors: [{ messageId: 'forbiddenPrefix' }],
    },

    // --- custom prefix ---
    {
      name: 'rejects vars without custom prefix',
      code: 'const x = process.env.CDG_STAGE;',
      options: [{ prefix: 'APP_' }],
      errors: [{ messageId: 'missingPrefix' }],
    },
    {
      name: 'detects custom prefix on whitelisted var',
      code: 'const x = process.env.APP_PORT;',
      options: [{ prefix: 'APP_', allowed: ['PORT'] }],
      errors: [{ messageId: 'forbiddenPrefix' }],
    },

    // --- edge cases ---
    {
      name: 'handles empty allowed list',
      code: 'const x = process.env.STAGE;',
      options: [{ prefix: 'CDG_', allowed: [] }],
      errors: [{ messageId: 'missingPrefix' }],
    },
    {
      name: 'handles multiple whitelist entries — only non-whitelisted reported',
      code: 'const a = process.env.PORT; const b = process.env.HOST; const c = process.env.STAGE;',
      options: [{ prefix: 'CDG_', allowed: ['PORT', 'HOST'] }],
      errors: [{ messageId: 'missingPrefix' }],
    },
  ],
});
